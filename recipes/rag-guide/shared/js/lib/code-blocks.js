/**
 * code-blocks.js -- shared finder/upgrader for annotated code blocks. One import
 * line per page wires every block on the page to the highlighter
 * (code-highlight.js) + the annotation popover layer (code-annot.js).
 *
 * RESPONSIBILITY: find every [data-component="code-block"] under rootEl, look its
 * annotation data up in the merged map (shared/data/code-annot.js, keyed by block
 * key), set the active-locale code as
 * the <code> textContent, highlight it, split the highlighted output into per-line
 * `.cl` rows (the LINE-HOOK CONTRACT consumed by code-annot.js), mount code-annot
 * with the block's regions, and render the <figcaption> + the no-JS <ol> from the
 * same data so server markup and JS stay in agreement. Re-renders every block on
 * i18n `lang:change`. Zero external requests, no framework, no global state.
 *
 * Markup contract (produced by the page-rollout tasks):
 *   <figure class="code-block" data-component="code-block"
 *           data-lang="python" data-annot="<key>">
 *     <figcaption class="code-block__cap" data-i18n data-ru="..." data-en="...">...</figcaption>
 *     <pre><code>...default-locale (ru) code, raw...</code></pre>
 *     <ol class="code-annot-list no-js-only">...static ru region notes...</ol>
 *   </figure>
 *
 * LINE-HOOK CONTRACT (asserted by the harness; mirrored in code-annot.js)
 * ----------------------------------------------------------------------
 *   The highlighter emits ONE escaped HTML string whose text content equals the
 *   source verbatim (newlines preserved as plain text). splitLines() turns that
 *   into:
 *       <span class="cl" data-line="1">...tokens...</span>\n
 *       <span class="cl" data-line="2">...tokens...</span>\n
 *       ...
 *   where data-line is 1-based, rows are emitted in source order, and a single
 *   "\n" text node sits BETWEEN rows (never inside a .cl). A token span that
 *   crosses a newline (e.g. a Python triple-quoted string) is closed at the line
 *   break and re-opened with the same classes on the next .cl row, so the visual
 *   token HTML is preserved and never set from raw text. code-annot.js then wraps
 *   the inclusive [start..end] range of .cl rows for each region in a .ca-region.
 *
 * init(rootEl, config) -> { refresh(lang), destroy() }
 *   rootEl  -- scope to search for [data-component="code-block"].
 *   config:
 *     dataMap   : optional pre-loaded block map (key -> block data) to look blocks
 *                 up in; defaults to the bundled shared/data/code-annot.js map.
 *                 If a block key is missing from the map, that block fails soft
 *                 (logged, raw <code> left intact).
 *     announce  : optional (msg) => void a11y live announcer (passed to code-annot)
 *     locale    : optional initial locale; defaults to i18n.getLocale().
 */

import { qs, qsa, el, clear, listeners } from "./dom.js";
import * as i18n from "./i18n.js";
import { highlight } from "./code-highlight.js";
import { init as initAnnot } from "./code-annot.js";
import CODE_ANNOT_MAP from "../../data/code-annot.js";

/** Active locale helper (ru default). */
function activeLocale(fallback) {
  if (typeof i18n.getLocale === "function") return i18n.getLocale();
  return fallback || "ru";
}

function pick(field, locale) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field[locale] != null ? field[locale] : field.ru != null ? field.ru : field.en || "";
}

/**
 * Split a highlighter HTML string (escaped, text == source verbatim) into one
 * `.cl` row per source line. Token spans that cross a newline are closed and
 * re-opened with identical attributes on the next row, so no token HTML is ever
 * dropped and nothing is built from raw text. Returns an array of HTML strings,
 * one per source line (the inner HTML of each .cl row).
 *
 * Parser: a tiny tag-aware scanner. We only ever see two tag shapes from the
 * highlighter -- `<span class="...">` and `</span>` -- plus escaped text. We walk
 * char by char, tracking the open-span stack; a "\n" in text content flushes the
 * current row (closing every open span) and starts a new one (re-opening them).
 */
function splitLines(html) {
  const rows = [];
  const openStack = []; // array of opening-tag strings currently open
  let current = "";
  let i = 0;
  const n = html.length;

  function flushRow() {
    // close any spans still open on this row
    let line = current;
    for (let k = 0; k < openStack.length; k++) line += "</span>";
    rows.push(line);
    // start the next row re-opening the same spans
    current = "";
    for (let k = 0; k < openStack.length; k++) current += openStack[k];
  }

  while (i < n) {
    const ch = html[i];
    if (ch === "<") {
      const close = html.indexOf(">", i);
      if (close === -1) {
        // Malformed/unterminated "<" (cannot happen with escaped highlighter
        // output, but guard so i always advances -- a bare "<" would otherwise
        // leave the index parked here and spin forever). Treat the remainder as
        // trailing text and stop.
        current += html.slice(i);
        break;
      }
      const tag = html.slice(i, close + 1);
      if (tag.charAt(1) === "/") {
        if (openStack.length) openStack.pop();
      } else {
        openStack.push(tag);
      }
      current += tag;
      i = close + 1;
      continue;
    }
    if (ch === "\n") {
      flushRow();
      i += 1;
      continue;
    }
    // accumulate a run of plain (already-escaped) text up to the next < or \n
    let j = i;
    while (j < n && html[j] !== "<" && html[j] !== "\n") j++;
    current += html.slice(i, j);
    i = j;
  }
  // final row (no trailing newline)
  let line = current;
  for (let k = 0; k < openStack.length; k++) line += "</span>";
  rows.push(line);
  return rows;
}

/**
 * Render highlighted source into a <code> as per-line `.cl` rows. Only the
 * highlighter's escaped output is used for innerHTML; raw code is never injected.
 */
function renderCode(codeEl, source, lang) {
  const html = highlight(source, lang);
  const lines = splitLines(html);
  clear(codeEl);
  lines.forEach((inner, idx) => {
    const row = el("span", { class: "cl", dataset: { line: String(idx + 1) } });
    row.innerHTML = inner; // inner is highlighter-escaped HTML, never raw code
    codeEl.appendChild(row);
    if (idx < lines.length - 1) codeEl.appendChild(document.createTextNode("\n"));
  });
}

/** Render the no-JS <ol class="code-annot-list"> from regions for the locale. */
function renderList(ol, regions, locale) {
  clear(ol);
  (regions || []).forEach((r) => {
    const li = el("li", { class: "code-annot-list__item" });
    li.appendChild(el("span", { class: "code-annot-list__label", text: pick(r.label, locale) }));
    li.appendChild(el("span", { class: "code-annot-list__explain", text: " -- " + pick(r.explain, locale) }));
    ol.appendChild(li);
  });
}

export function init(rootEl, config) {
  const cfg = config || {};
  const root = rootEl || document;
  const dataMap = cfg.dataMap || CODE_ANNOT_MAP;
  const announce = typeof cfg.announce === "function" ? cfg.announce : null;
  let locale = cfg.locale || activeLocale("ru");

  const L = listeners();

  // One record per figure: { figure, codeEl, capEl, olEl, data, annot }.
  const blocks = [];

  const figures = qsa('[data-component="code-block"]', root);

  // Build every block synchronously from the bundled merged map (one static
  // import; no fetch, no per-block dynamic import). `ready` resolves immediately
  // so callers that await it keep working.
  figures.forEach((figure) => buildBlock(figure));
  const ready = Promise.resolve();

  function buildBlock(figure) {
    const key = figure.getAttribute("data-annot");
    const lang = figure.getAttribute("data-lang") || "plaintext";
    const codeEl = qs("pre > code", figure) || qs("code", figure);
    if (!key || !codeEl) return null;

    // Look the block up in the merged map. Missing key -> fail soft: log and
    // leave the raw <code> as authored (no highlight, no popover), as before.
    const data = dataMap && dataMap[key];
    if (!data) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[code-blocks] no annotation data for key:", key);
      }
      return null;
    }

    const capEl = qs(".code-block__cap", figure);
    const olEl = qs(".code-annot-list", figure);
    const blockLang = data.lang || lang;

    const rec = { figure, codeEl, capEl, olEl, data, lang: blockLang, annot: null };
    blocks.push(rec);
    renderBlock(rec, locale);
    return rec;
  }

  function renderBlock(rec, loc) {
    const data = rec.data;
    const source = pick(data.code, loc);

    // 1) code: highlight + split into .cl rows
    renderCode(rec.codeEl, source, rec.lang);

    // 2) caption
    if (rec.capEl) rec.capEl.textContent = pick(data.caption, loc);

    // 3) no-JS list (kept in sync; CSS hides it when .has-js)
    if (rec.olEl) renderList(rec.olEl, data.regions, loc);

    // 4) mount the popover annotation layer over the .cl rows
    if (rec.annot) {
      try {
        rec.annot.destroy();
      } catch (_) {
        /* ignore */
      }
      rec.annot = null;
    }
    rec.annot = initAnnot(rec.figure, {
      regions: data.regions || [],
      locale: loc,
      lineSelector: ".cl",
      lineHost: rec.codeEl,
      announce,
    });
  }

  /** Re-render every block for a new locale (code, caption, list, popovers). */
  function refresh(nextLocale) {
    locale = nextLocale || locale;
    for (const rec of blocks) renderBlock(rec, locale);
  }

  // Re-render on i18n lang:change (subscribe via the store).
  const unsub = i18n.subscribe((loc) => refresh(loc));

  return {
    /** Resolves once every block's data has loaded + mounted (test/await hook). */
    ready,
    refresh,
    /** Test/debug: number of mounted figures. */
    blockCount() {
      return blocks.length;
    },
    destroy() {
      L.off();
      if (typeof unsub === "function") unsub();
      for (const rec of blocks) {
        if (rec.annot) {
          try {
            rec.annot.destroy();
          } catch (_) {
            /* ignore */
          }
        }
      }
      blocks.length = 0;
    },
  };
}
