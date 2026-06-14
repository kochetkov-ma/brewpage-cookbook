/**
 * payload-anatomy.js -- page glue for the "Анатомия payload" showcase chapter.
 *
 * Mirrors what-rag.js / search.js: sets .has-js (flips .js-only/.no-js-only),
 * finds the documented hosts by data-component/data-slot, inits the lib modules
 * this page needs (a11y announcer, i18n store, plate handle, the drilldown-zoom
 * camera), wires them together, collects instances and calls destroy() on
 * pagehide. All behaviour lives in the lib modules; this file only wires hosts,
 * RENDERS the annotated payload <pre>/<code> with per-block hook spans, and
 * supplies renderPanel (the annotation card).
 *
 * Drill contract (from the data file header + IE integration brief):
 *   - The 4 turns render as annotated <pre>/<code>; each highlightable region is
 *     a <span data-block="<id>" role="button" tabindex="0" aria-label=...>.
 *     Every data-block MUST equal a PAYLOAD.blocks[].id (the 17 ids in `order`).
 *   - A block id MAY appear on more than one span across turns; all spans that
 *     share a data-block open the SAME card.
 *   - camera = drilldown-zoom.js on [data-component="drilldown-host"], given
 *     { plate, announce, renderPanel, onSelect }. On a span click/Enter/Space we
 *     call camera.openNode({ id, crumb, data, fromEl: span }). openNode ONLY --
 *     this showcase is exactly 2 levels (zoom 0 whole payload -> zoom 1 block).
 *   - renderPanel(entry) => buildCard(PAYLOAD.blocks[entry.id]): Function row +
 *     Role-in-RAG row + the owning-chapter link when chapter != null.
 *
 * Hosts wired:
 *   [data-component="plate"]          -> plate.js (growToFit on drill)
 *   [data-component="drilldown-host"] -> drilldown-zoom.js (camera + crumbs + zoomout + panel)
 *   [data-slot="stage"]               -> annotated <pre> payload (built here)
 *   [data-component="lang-toggle"]    -> i18n.setLocale on click
 *   [data-component="a11y-live"]      -> a11y.js announcer (created if absent)
 */

import { qs, qsa, listeners } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initCamera } from "../lib/drilldown-zoom.js";
import { highlight } from "../lib/code-highlight.js";
import PAYLOAD from "../../data/payload-anatomy.js";

document.documentElement.classList.add("has-js");

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

const L = listeners();

/** Active locale helper (ru default). */
function loc() {
  return typeof i18n.getLocale === "function" ? i18n.getLocale() : "ru";
}

/** Minimal HTML escaper for text nodes / attributes. */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Syntax-highlight one JSON line into escaped token-span HTML. The payloads are
 * pretty-printed (one field per line; strings never span newlines), so per-line
 * highlighting is faithful -- the highlighter's output text == the line verbatim.
 * Used for the VISIBLE line content only; data-block / aria-label stay esc()'d.
 * This adds coloring UNDER the .pl-hook drill layer without touching the hooks.
 */
function hl(line) {
  return highlight(line, "json");
}

/**
 * Render one turn's JSON string into the stage, wrapping every field path that
 * a block declares into a focusable hook span.
 *
 * Approach: build the <pre> text, then wrap regions by matching the literal
 * JSON KEY token (e.g. `"model"`, `"max_tokens"`) plus its value run on the
 * SAME line. We map each line that contains a block's primary key to that block
 * id. This keeps the JSON byte-for-byte (ASCII, valid) and only ADDS spans.
 *
 * The mapping from a JSON line to a block id is driven by KEY_TO_BLOCK below:
 * the first matching key on a line (outside string values) wins. Spans are only
 * created for turns listed in block.turns, so a block highlights on the turns
 * the data says it appears on.
 */

// JSON top-level/nested key token -> block id. A key may map to a block only on
// the turns where that block's `turns[]` includes the current turn number; the
// wrap step double-checks against blocks[id].turns so we never emit a span on a
// turn the data did not anchor.
const KEY_TO_BLOCK = {
  '"model"': "model",
  '"max_tokens"': "budget",
  '"thinking"': "thinking-config", // turn-1 config object; thinking BLOCK keyed below
  '"system"': "system",
  '"tools"': "tools",
  '"tool_choice"': "tool-choice",
  '"tool_use_id"': "tool-result",
  '"stop_reason"': "stop-reason",
  '"stop_sequence"': "stop-reason",
  '"usage"': "usage",
  '"id"': "response-id",
  '"signature"': "thinking-block",
  '"cosine"': "retrieval-score",
  '"rank"': "retrieval-score",
  '"source"': "chunk-meta",
  '"section"': "chunk-meta",
  '"date"': "chunk-meta",
};

/**
 * Wrap a single rendered JSON line in a hook span if it carries a block key.
 * Returns the line HTML (escaped, possibly wrapped). `seen` tracks block ids
 * already given a span on THIS turn so a repeated key (e.g. tools input_schema
 * "type") does not double-wrap.
 */
function wrapLine(rawLine, turnN, seen) {
  const trimmed = rawLine.trimStart();

  // value-context blocks that live INSIDE a string (tool_result chunk text):
  // detect by content marker rather than a JSON key.
  let blockId = null;

  // 1) content-block discriminators carried as "type": "<kind>"
  const typeMatch = trimmed.match(/^"type":\s*"([a-z_]+)"/);
  if (typeMatch) {
    const kind = typeMatch[1];
    if (kind === "thinking") blockId = "thinking-block";
    else if (kind === "tool_use") blockId = "tool-use";
    else if (kind === "tool_result") blockId = "tool-result";
    else if (kind === "text") blockId = "text-answer";
  }

  // 2) role discriminators inside messages[]
  if (!blockId) {
    const roleMatch = trimmed.match(/^"role":\s*"(user|assistant)"/);
    if (roleMatch) {
      blockId = roleMatch[1] === "user" ? "messages-user" : "messages-assistant";
    }
  }

  // 3) chunk metadata + score live inside the tool_result text strings. Each
  // chunk line carries BOTH families (source/section/date AND cosine/rank) on a
  // single line, so one line cannot host two non-overlapping spans. The two
  // chunk lines are anchored to DIFFERENT blocks so both ids get a focusable
  // span: chunk #1 -> chunk-meta, chunk #2 -> retrieval-score. `seen` already
  // dedups, so the first chunk line takes chunk-meta and the next takes
  // retrieval-score (both blocks reachable, both cards open from chunk text).
  if (!blockId && /\| source=/.test(rawLine)) {
    blockId = seen.has("chunk-meta") ? "retrieval-score" : "chunk-meta";
  }

  // 4) plain key tokens (model/max_tokens/system/tools/...)
  if (!blockId) {
    for (const key in KEY_TO_BLOCK) {
      if (trimmed.indexOf(key) === 0) {
        blockId = KEY_TO_BLOCK[key];
        break;
      }
    }
  }

  // Visible line content is syntax-highlighted JSON (hl); the .pl-hook wrapper +
  // its data-block / aria-label are unchanged, so the drill's click-to-card layer
  // keeps working over the highlighted spans.
  if (!blockId) return hl(rawLine);

  const block = PAYLOAD.blocks[blockId];
  // only wrap when the data anchors this block to this turn, and not twice/turn
  if (!block || !Array.isArray(block.turns) || block.turns.indexOf(turnN) === -1) {
    return hl(rawLine);
  }
  if (seen.has(blockId)) return hl(rawLine);
  seen.add(blockId);

  const lang = loc();
  const aria = (block.aria && block.aria[lang]) || (block.aria && block.aria.ru) || blockId;
  return (
    '<span class="pl-hook" data-block="' +
    esc(blockId) +
    '" role="button" tabindex="0" aria-label="' +
    esc(aria) +
    '">' +
    hl(rawLine) +
    "</span>"
  );
}

/** Build the annotated <pre> for one turn. */
function renderTurn(turn) {
  const fig = document.createElement("figure");
  fig.className = "pl-turn";

  const cap = document.createElement("figcaption");
  cap.className = "pl-turn__cap";
  const tag = document.createElement("span");
  tag.className = "pl-turn__dir pl-turn__dir--" + turn.dir;
  tag.textContent = turn.dir === "request" ? ">>" : "<<";
  cap.appendChild(tag);
  const ttl = document.createElement("span");
  ttl.className = "pl-turn__title";
  ttl.setAttribute("data-i18n", "");
  ttl.setAttribute("data-ru", turn.title.ru);
  ttl.setAttribute("data-en", turn.title.en);
  ttl.textContent = turn.title[loc()] || turn.title.ru;
  cap.appendChild(ttl);
  fig.appendChild(cap);

  const pre = document.createElement("pre");
  pre.className = "pl-code";
  const code = document.createElement("code");
  const seen = new Set();
  const html = String(turn.json)
    .split("\n")
    .map((line) => wrapLine(line, turn.n, seen))
    .join("\n");
  code.innerHTML = html;
  pre.appendChild(code);
  fig.appendChild(pre);
  return fig;
}

/** Build the level-1 annotation card for a block (Function + Role in RAG + chapter). */
function buildCard(block) {
  if (!block) return null;
  const lang = loc();
  const wrap = document.createElement("div");
  wrap.className = "detail-panel pl-card";
  // inline (non-modal) annotation card: a labelled region, NOT a dialog -- there
  // is no focus trap and the page stays interactive behind it.
  wrap.setAttribute("role", "group");
  const crumb = (block.crumb && block.crumb[lang]) || (block.crumb && block.crumb.ru) || block.id;
  wrap.setAttribute("aria-label", crumb);

  const labels = lang === "en"
    ? { fn: "Function", role: "Role in RAG", chap: "Owning chapter", fields: "Fields" }
    : { fn: "Function", role: "Role in RAG", chap: "Глава-владелец", fields: "Поля" };

  let h = "";
  h += '<div class="pl-card__head">';
  h += '<p class="pl-card__kicker">' + esc(crumb) + "</p>";
  if (Array.isArray(block.fields) && block.fields.length) {
    h += '<p class="pl-card__fields"><span class="pl-card__flbl">' + esc(labels.fields) + ":</span> ";
    h += block.fields.map((f) => '<code>' + esc(f) + "</code>").join(" ");
    h += "</p>";
  }
  // a focusable heading so drilldown-zoom can move SR focus into the card
  h += '<h3 class="pl-card__title" tabindex="-1" data-panel-heading>' + esc(crumb) + "</h3>";
  h += "</div>";

  const fn = (block.function && block.function[lang]) || (block.function && block.function.ru) || "";
  const role = (block.ragRole && block.ragRole[lang]) || (block.ragRole && block.ragRole.ru) || "";
  h += '<p class="pl-card__row"><span class="pl-card__lbl">' + esc(labels.fn) + "</span>" + esc(fn) + "</p>";
  h += '<p class="pl-card__row pl-card__row--role"><span class="pl-card__lbl">' + esc(labels.role) + "</span>" + esc(role) + "</p>";

  if (block.chapter && block.chapter.href) {
    const clabel = (block.chapter.label && block.chapter.label[lang]) ||
      (block.chapter.label && block.chapter.label.ru) || block.chapter.href;
    h += '<p class="pl-card__chap"><span class="pl-card__lbl">' + esc(labels.chap) + "</span>";
    h += '<a href="' + esc(block.chapter.href) + '">' + esc(clabel) + "</a></p>";
  }
  wrap.innerHTML = h;
  return wrap;
}

function boot() {
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // i18n store (RU default from <html lang>)
  track(i18n.init(document.documentElement, {}));

  // a11y live-region announcer (scoped)
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // plate handle (grow-to-fit on drill so the card never scroll-jails)
  const plateHost = qs('[data-component="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // drill camera host -- owns crumbs, zoom-out, panel, selection-on-zoom-out
  const drillHost = qs('[data-component~="drilldown-host"]');
  if (!drillHost) return; // nothing to enhance; no-js fallback already in DOM

  const camera = track(
    initCamera(drillHost, {
      plate,
      announce,
      labels: {
        topCrumb: loc() === "en" ? "Whole payload" : "Весь payload",
        level1: loc() === "en" ? "Block" : "Блок",
        zoomOut: loc() === "en" ? "Zoom out one level" : "Выйти на уровень выше",
      },
      renderPanel: (entry) => buildCard(PAYLOAD.blocks[entry.id]),
      onSelect: (id) => {
        // mark the active hook span so the selection is visible at zoom-0 return
        qsa(".pl-hook.selected", drillHost).forEach((s) => s.classList.remove("selected"));
        qsa('.pl-hook[data-block="' + cssEsc(id) + '"]', drillHost).forEach((s) =>
          s.classList.add("selected")
        );
      },
    })
  );

  // build the annotated payload into the stage's camera wrapper (the wrapper is
  // what collapses/scales on zoom; .stage.zoomed .pl-camera owns the transform)
  const stage = qs('[data-slot="stage"]', drillHost);
  const cameraWrap = stage ? (qs(".pl-camera", stage) || stage) : null;
  if (cameraWrap) {
    (PAYLOAD.turns || []).forEach((turn) => cameraWrap.appendChild(renderTurn(turn)));
  }

  // open a block on click / Enter / Space (delegated over the stage)
  function openFromSpan(span) {
    const id = span.getAttribute("data-block");
    const block = PAYLOAD.blocks[id];
    if (!block) return;
    camera.openNode({
      id,
      crumb: (block.crumb && block.crumb[loc()]) || (block.crumb && block.crumb.ru) || id,
      data: block,
      fromEl: span,
    });
  }
  if (stage) {
    L.on(stage, "click", (e) => {
      const span = e.target.closest ? e.target.closest(".pl-hook") : null;
      if (span) openFromSpan(span);
    });
    L.on(stage, "keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      const span = e.target.closest ? e.target.closest(".pl-hook") : null;
      if (span) {
        e.preventDefault();
        openFromSpan(span);
      }
    });
  }

  // lang-toggle: drive the i18n store; static [data-i18n] re-rendered here
  const langGroup = qs('[data-component="lang-toggle"]');
  if (langGroup) {
    const buttons = qsa("button[data-lang]", langGroup);
    const applyToggleState = (l) => {
      buttons.forEach((b) => {
        const on = b.dataset.lang === l;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
    buttons.forEach((b) => L.on(b, "click", () => i18n.setLocale(b.dataset.lang)));
    applyToggleState(loc());
    i18n.subscribe((l) => {
      applyToggleState(l);
      rewriteStaticText(l);
      relocalizeHooks(l, drillHost);
      announce(l === "en" ? "Language: English" : "Язык: русский");
    });
  }

  rewriteStaticText(loc());
}

/**
 * Re-localize the drill hook aria-labels for a new locale. The .pl-hook spans
 * render their aria-label once at boot; on lang:change the localized region name
 * must follow the active locale so a screen reader announces the right name. We
 * only touch aria-label (visible JSON + data-block + the click-to-card drill are
 * untouched, so the drill keeps working and the JSON highlight stays). The opened
 * card reads loc() fresh via buildCard, so it is unaffected.
 */
function relocalizeHooks(lang, drillHost) {
  const scope = drillHost || document;
  qsa(".pl-hook", scope).forEach((span) => {
    const id = span.getAttribute("data-block");
    const block = PAYLOAD.blocks[id];
    if (!block) return;
    const aria = (block.aria && block.aria[lang]) || (block.aria && block.aria.ru) || id;
    span.setAttribute("aria-label", aria);
  });
}

/** CSS attribute-value escaper for the data-block selector. */
function cssEsc(s) {
  return String(s).replace(/["\\\]]/g, "\\$&");
}

/** Rewrite page-level static [data-i18n] strings (data-ru / data-en). */
function rewriteStaticText(l) {
  qsa("[data-i18n]").forEach((node) => {
    const val = node.getAttribute("data-" + l);
    if (val != null) node.textContent = val;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("pagehide", () => {
  try {
    L.off();
  } catch (_) {
    /* ignore */
  }
  while (instances.length) {
    const inst = instances.pop();
    try {
      inst.destroy();
    } catch (_) {
      /* ignore teardown errors */
    }
  }
});
