/**
 * prose-i18n.js -- localised chapter prose for the RAG Guide (EN-primary).
 *
 * RESPONSIBILITY: swap the translatable PROSE LEAVES of one chapter article
 * between the static EN text (authored directly into the HTML) and the RU
 * strings supplied by a separate data module (shared/data/prose-ru.js, built by
 * another task). The static HTML is the EN source of truth; this module only
 * overlays RU on top of it and restores EN when the locale goes back. It owns
 * NO copy -- EN comes from the DOM, RU comes from the injected data module.
 *
 * Subscribes to the i18n store the same way every other lib does
 * (i18n.subscribe + a `lang:change` reaction) and exposes the standard
 * init(rootEl, config) => { destroy() } shape.
 *
 * ---------------------------------------------------------------------------
 * CONFIG SHAPE (so V3-DATA + page-glue know exactly how to call this)
 * ---------------------------------------------------------------------------
 *   init(rootEl, config) -> { refresh(loc), destroy() }
 *
 *   config = {
 *     // REQUIRED. The imported prose-ru.js object, OR a getter returning it.
 *     // Shape (per the data contract):
 *     //   {
 *     //     [pageSlug]: {
 *     //       [pk]: { t: "..." } | { html: "<em>...</em>" },  // RU per data-pk
 *     //       __title?:       "...",   // RU <title>
 *     //       __description?: "...",   // RU <meta name="description">
 *     //       __ogTitle?:     "...",   // RU <meta property="og:title">
 *     //       __ogDesc?:      "...",   // RU <meta property="og:description">
 *     //     },
 *     //     _schema: { ... }   // _-prefixed metadata; SKIPPED by consumers
 *     //   }
 *     // A {t} entry is applied via .textContent; a {html} entry via .innerHTML
 *     // (trusted, authored ASCII-safe inline tags only -- never user input).
 *     ruData: Object | (slug) => (pageEntry | fullObject),
 *
 *     // OPTIONAL. Page slug to look up in ruData. Defaults to the article's
 *     // own data-prose attribute, so page-glue can usually omit this.
 *     slug: string,
 *
 *     // OPTIONAL. Initial locale; defaults to i18n.getLocale().
 *     locale: string,
 *   }
 *
 * `ruData` may be:
 *   - the whole prose-ru.js object (keyed by page slug) -- looked up by slug;
 *   - a getter fn -- called as ruData(slug); may return the page entry directly
 *     OR the whole object (then indexed by slug). Both are handled.
 *
 * ---------------------------------------------------------------------------
 * ISOLATION INVARIANT (CRITICAL -- asserted, do not weaken)
 * ---------------------------------------------------------------------------
 * This module selects ONLY `[data-pk]` leaves inside the chapter article
 * (`article.querySelectorAll('[data-pk]')`) and mutates ONLY their text/inline
 * HTML. It NEVER:
 *   - touches code-block <figure> hosts ([data-component="code-block"]),
 *   - touches drilldown / pipeline / process-anim / vector-map / any other
 *     interactive mount host,
 *   - performs any wholesale `article.innerHTML` swap.
 * Those interactive hosts carry NO `data-pk` attribute and live in disjoint
 * subtrees from the prose leaves, so a `[data-pk]` query can never select one
 * and the per-pk writes can never reach a mounted instance's DOM. Therefore
 * code-block / annotation / drilldown instances mounted by other libs survive a
 * locale flip untouched -- no remount, no detach. (See node --check note + the
 * static argument in the task return.)
 *
 * Constraints: vanilla ES module, no framework, no external requests, no eval,
 * ASCII only. {html} is trusted (authored inline tags), still applied ONLY to
 * entries explicitly marked {html}.
 */

import * as i18n from "./i18n.js";

const RU = "ru";

/** Resolve the active locale (i18n is the source of truth; ru fallback). */
function activeLocale(fallback) {
  if (typeof i18n.getLocale === "function") return i18n.getLocale();
  return fallback || RU;
}

/**
 * Resolve the RU page entry from the config's ruData (object or getter) for a
 * slug. Returns the per-pk map object for this page, or null when absent.
 * Tolerates a getter that returns either the page entry or the full object.
 */
function resolvePageEntry(ruData, slug) {
  if (ruData == null) return null;
  let source = ruData;
  if (typeof ruData === "function") {
    source = ruData(slug);
    if (source == null) return null;
    // A getter may hand back the page entry directly. Heuristic: if it has the
    // slug as a key, treat it as the full object; otherwise it IS the entry.
    if (Object.prototype.hasOwnProperty.call(source, slug)) {
      return source[slug] || null;
    }
    return source;
  }
  return source[slug] || null;
}

/** Meta tags we mirror between EN (static) and RU (data), keyed by RU field. */
const META = [
  { key: "__title", kind: "title" },
  { key: "__description", kind: "meta", selector: 'meta[name="description"]' },
  { key: "__ogTitle", kind: "meta", selector: 'meta[property="og:title"]' },
  { key: "__ogDesc", kind: "meta", selector: 'meta[property="og:description"]' },
];

export function init(rootEl, config) {
  const cfg = config || {};
  const root = rootEl || document;

  // 1) Find the one chapter article + its slug.
  const article = root.matches && root.matches("article[data-prose]")
    ? root
    : root.querySelector("article[data-prose]");
  if (!article) {
    // Nothing to localise on this page -> inert handle (still standard shape).
    return { refresh() {}, destroy() {} };
  }
  const slug = cfg.slug || article.getAttribute("data-prose") || "";

  // 2) Capture the STATIC EN content of every [data-pk] leaf. This captured EN
  //    is the ONLY restore source; it is never reconstructed.
  //    enMap: pk -> { html, text } captured verbatim from the authored DOM.
  const enMap = new Map();
  // leaves: pk -> element (the live node we mutate).
  const leaves = new Map();
  const nodes = article.querySelectorAll("[data-pk]");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const pk = node.getAttribute("data-pk");
    if (!pk || enMap.has(pk)) continue; // first wins; stable keys are unique
    enMap.set(pk, { html: node.innerHTML, text: node.textContent });
    leaves.set(pk, node);
  }

  // 3) Capture the static EN meta (guarded -- tags may be absent).
  //    enMeta: key -> string (current EN value), only for tags present.
  const enMeta = new Map();
  for (const m of META) {
    if (m.kind === "title") {
      enMeta.set(m.key, document.title);
    } else {
      const tag = document.querySelector(m.selector);
      if (tag) enMeta.set(m.key, tag.getAttribute("content") || "");
    }
  }

  /** Apply a single RU entry ({t} | {html}) to its leaf. */
  function applyEntry(node, entry) {
    if (!node || !entry) return;
    if (typeof entry.html === "string") {
      node.innerHTML = entry.html; // trusted authored inline tags only
    } else if (typeof entry.t === "string") {
      node.textContent = entry.t;
    }
    // Any other shape: leave the captured EN in place (graceful).
  }

  /** Restore captured EN for a single leaf. */
  function restoreLeaf(pk, node) {
    const cap = enMap.get(pk);
    if (cap) node.innerHTML = cap.html;
  }

  /** Write RU or restore EN meta for the active locale. Fully guarded. */
  function applyMeta(pageEntry, toRu) {
    for (const m of META) {
      if (m.kind === "title") {
        if (toRu) {
          const v = pageEntry && pageEntry[m.key];
          if (typeof v === "string") document.title = v;
        } else if (enMeta.has(m.key)) {
          document.title = enMeta.get(m.key);
        }
        continue;
      }
      const tag = document.querySelector(m.selector);
      if (!tag) continue; // tag absent -> skip (guarded)
      if (toRu) {
        const v = pageEntry && pageEntry[m.key];
        if (typeof v === "string") tag.setAttribute("content", v);
      } else if (enMeta.has(m.key)) {
        tag.setAttribute("content", enMeta.get(m.key));
      }
    }
  }

  /** Apply a locale across every captured leaf + meta + the article[lang]. */
  function apply(loc) {
    const toRu = loc === RU;
    const pageEntry = toRu ? resolvePageEntry(cfg.ruData, slug) : null;

    for (const [pk, node] of leaves) {
      if (toRu) {
        const entry = pageEntry && Object.prototype.hasOwnProperty.call(pageEntry, pk)
          ? pageEntry[pk]
          : null;
        if (entry) applyEntry(node, entry);
        else restoreLeaf(pk, node); // no RU for this pk -> keep EN (graceful)
      } else {
        restoreLeaf(pk, node);
      }
    }

    applyMeta(pageEntry, toRu);
    article.setAttribute("lang", toRu ? RU : "en");
  }

  // 4) Initial paint for the current locale, then react to lang:change.
  let locale = cfg.locale || activeLocale("en");
  apply(locale);

  function refresh(nextLocale) {
    locale = nextLocale || locale;
    apply(locale);
  }

  const unsub = i18n.subscribe((loc) => refresh(loc));

  return {
    refresh,
    /** Test/debug: number of captured [data-pk] leaves. */
    leafCount() {
      return leaves.size;
    },
    destroy() {
      if (typeof unsub === "function") unsub();
      enMap.clear();
      leaves.clear();
      enMeta.clear();
    },
  };
}
