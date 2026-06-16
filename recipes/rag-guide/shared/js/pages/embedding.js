/**
 * embedding.js -- page glue for the "Эмбеддинг" section
 * (element=embedding-materialize). Mirrors pages/search.js: sets
 * .has-js (flips .js-only / .no-js-only), finds the documented hosts by
 * data-component / data-slot, inits the lib modules this section needs (a11y
 * announcer, i18n store, plate handle, drilldown-zoom camera, process-anim),
 * collects instances and calls destroy() on pagehide.
 *
 * REUSE (per IE contract): the centerpiece is shared/js/lib/process-anim.js,
 * which renders doc -> chunks -> vectors and sequences the split | embed | store
 * steps on its OWN timeline.js clock. It is mounted on the [data-slot="anim"]
 * region inside [data-component="embedding-materialize"], handed the data
 * contract shared/data/embedding.js (default export) as config.data -- NOT
 * fetched via data-*-src. The embed step is the didactic centerpiece: each chunk
 * card materializes into a fixed-length vector card (dim 1536) -- the
 * representation changes, the text does not.
 *
 * The whole scene wraps in [data-component="drilldown-host"] (slots stage /
 * crumbs / zoomout / panel) so the Embedding node supports a semantic zoom into
 * a "what does embed do" card (renderPanel below). The static Embedding node in
 * [data-slot="stage"] opens the camera; zoom-out returns focus to it.
 *
 * Hosts wired:
 *   [data-component="embedding-materialize"] / [data-slot="anim"] -> process-anim.js
 *   [data-component="drilldown-host"]                             -> drilldown-zoom.js
 *   [data-component="plate"]                                      -> plate.js
 *   [data-component="a11y-live"]                                  -> a11y.js announcer (created if absent)
 */

import { qs, qsa, listeners } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initI18n } from "../lib/i18n.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initDrill } from "../lib/drilldown-zoom.js";
import { init as initProcessAnim } from "../lib/process-anim.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import EMBEDDING from "../../data/embedding.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

document.documentElement.classList.add("has-js");

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

const LENS_PLUS =
  '<svg class="lens-plus" viewBox="0 0 24 24" width="18" height="18" fill="none"' +
  ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.2" y1="15.2" x2="21" y2="21"/>' +
  '<line x1="7" y1="10.5" x2="14" y2="10.5"/><line x1="10.5" y1="7" x2="10.5" y2="14"/></svg>';

function esc(s) {
  return String(s == null ? "" : s);
}

// active-lang resolver for { ru, en } copy fields (RU default).
function lang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}
function L10n(v) {
  if (v && typeof v === "object" && ("ru" in v || "en" in v)) {
    return v[lang()] != null ? v[lang()] : v.ru;
  }
  return v;
}
const B = (ru, en) => ({ ru, en });

// Bilingual UI copy for the drill card / crumbs / labels. Previously these were
// hardcoded RU literals, so the open card stayed Russian on the EN toggle even
// though drilldown-zoom.js re-runs renderPanel() on lang:change. English sourced
// from content/en/embedding.md. ASCII only in en:, Cyrillic only in ru:.
const T = {
  topCrumb: B("Эмбеддинг", "Embedding"),
  level1: B("Шаг embed", "embed step"),
  zoomOut: B("Отдалить на уровень выше", "Zoom out one level"),
  cardAria: B("Шаг embed: фрагмент в вектор", "embed step: fragment to vector"),
  deepCrumb: B("1:1 chunk -> вектор", "1:1 chunk -> vector"),
  deeperAria: B(
    "Заглянуть внутрь: связь chunk -> вектор",
    "Look inside: chunk -> vector mapping"
  ),
  kicker: B("Шаг embed", "embed step"),
  cardTitle: B(
    "Фрагмент -&gt; вектор (dim 1536)",
    "Fragment -&gt; vector (dim 1536)"
  ),
  cardNote: B(
    "Каждый фрагмент один раз превращается в вектор фиксированной длины <b>dim = 1536</b> (модель <code>text-embedding-3-small</code>). Меняется <b>представление</b> (текст -&gt; числа), а не сам текст. Близость векторов отражает близость смысла.",
    "Each fragment is turned once into a fixed-length vector of <b>dim = 1536</b> (model <code>text-embedding-3-small</code>). The <b>representation</b> changes (text -&gt; numbers), not the text itself. Vector closeness reflects closeness of meaning."
  ),
  deeperLabel: B("Связь chunk -&gt; вектор", "chunk -&gt; vector mapping"),
  deeperPrev: B(
    "v1 -&gt; c1, v2 -&gt; c2, v3 -&gt; c3 -- строго один-к-одному",
    "v1 -&gt; c1, v2 -&gt; c2, v3 -&gt; c3 -- strictly one-to-one"
  ),
  deepKicker: B("Связь chunk -&gt; вектор", "chunk -&gt; vector mapping"),
  deepTitle: B(
    "Один фрагмент -- ровно один вектор",
    "One fragment -- exactly one vector"
  ),
  deepNote: B(
    "Отображение строго <b>один-к-одному</b>: у каждого вектора есть поле <code>chunkId</code>, которое указывает на его фрагмент. Смешивать векторы разных моделей нельзя -- они живут в разных пространствах.",
    "The mapping is strictly <b>one-to-one</b>: every vector has a <code>chunkId</code> field pointing to its fragment. You cannot mix vectors from different models -- they live in different spaces."
  ),
};
// resolve a T entry to the active locale.
function t(key) {
  return L10n(T[key]);
}

// Resolve every { ru, en } copy field in the embedding data contract to the
// active language so process-anim.js (which renders flat strings) consumes it
// unchanged. vectors carry no copy fields; steps.caption + doc.text/title +
// chunks.text do. fromChar/toChar index doc.text (ASCII-Latin, shared verbatim
// across langs here, so offsets still tile after flattening).
function flattenEmbedding() {
  return {
    doc: {
      id: EMBEDDING.doc.id,
      title: L10n(EMBEDDING.doc.title),
      text: L10n(EMBEDDING.doc.text),
    },
    chunks: (EMBEDDING.chunks || []).map((c) => ({
      id: c.id,
      fromChar: c.fromChar,
      toChar: c.toChar,
      text: L10n(c.text),
    })),
    vectors: EMBEDDING.vectors || [],
    steps: (EMBEDDING.steps || []).map((s) => ({
      id: s.id,
      kind: s.kind,
      caption: L10n(s.caption),
      targets: s.targets,
      duration: s.duration,
    })),
  };
}

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "embedding" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // i18n store (RU default from <html lang>)
  track(initI18n(document.documentElement, {}));

  // annotated code blocks (highlight + hover/focus popover layer + no-JS ol).
  // code-blocks subscribes to i18n internally and re-renders on lang:change.
  track(initCodeBlocks(document, {}));

  // a11y live-region announcer (scoped)
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // plate handle (grow-to-fit on drill so the panel never scroll-jails)
  const plateHost = qs('[data-component="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // ---- centerpiece: process-anim on the anim slot (its own timeline) --------
  // process-anim.js consumes FLAT strings (doc.text.slice, c.text rendered
  // directly), the worked-example.json shape -- but the embedding.js data
  // contract carries { ru, en } copy fields. Resolve to the active lang here
  // (SB owns wiring) before handing it to the lib, so the renderer stays
  // contract-clean. Re-flatten on lang:change.
  const animScope = qs('[data-component="embedding-materialize"]');
  const animHost = animScope ? qs('[data-slot="anim"]', animScope) : null;
  if (animHost) {
    let animInst = track(
      initProcessAnim(animHost, { data: flattenEmbedding(), autoplay: true })
    );
    const onLangChange = () => {
      if (animInst && typeof animInst.destroy === "function") animInst.destroy();
      const i = instances.indexOf(animInst);
      if (i >= 0) instances.splice(i, 1);
      animInst = track(
        initProcessAnim(animHost, { data: flattenEmbedding(), autoplay: true })
      );
    };
    document.addEventListener("lang:change", onLangChange);
    // ensure the document-level listener is torn down with the other instances.
    track({ destroy: () => document.removeEventListener("lang:change", onLangChange) });
  }

  // ---- semantic zoom into the Embedding node ---------------------------------
  let drill = null;
  const drillHost = qs('[data-component="drilldown-host"]');
  if (drillHost) {
    drill = track(
      initDrill(drillHost, {
        plate,
        announce,
        labels: {
          topCrumb: t("topCrumb"),
          level1: t("level1"),
          zoomOut: t("zoomOut"),
        },
        renderPanel: (entry, api) => renderPanel(entry, api),
      })
    );

    // bind the static Embedding node in the stage to open the camera
    const stage = qs('[data-slot="stage"]', drillHost);
    const node = stage ? qs("[data-embed-node]", stage) : null;
    if (node) {
      const Lst = listeners();
      const open = () => {
        drill.openNode({
          id: "embed",
          crumb: t("level1"),
          fromEl: node,
          data: { id: "embed" },
        });
      };
      Lst.on(node, "click", open);
      Lst.on(node, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          open();
        }
      });
    }
  }

  // ---- lang-toggle: drive the i18n store; static [data-i18n] re-rendered here.
  // The process-anim centerpiece already re-flattens on the document's
  // lang:change event (above), so toggling swaps BOTH chrome and interactive.
  const langGroup = qs('[data-component="lang-toggle"]');
  if (langGroup) {
    const buttons = qsa("button[data-lang]", langGroup);
    const applyToggleState = (loc) => {
      buttons.forEach((b) => {
        const on = b.dataset.lang === loc;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
    buttons.forEach((b) => {
      b.addEventListener("click", () => i18n.setLocale(b.dataset.lang));
    });
    applyToggleState(i18n.getLocale());
    i18n.subscribe((loc) => {
      applyToggleState(loc);
      rewriteStaticText(loc);
      // Re-localize the open drill card (incl. the deepest body) + crumb chrome.
      // setLabels() re-localizes topCrumb/level1/zoomOut and re-renders in place,
      // which re-runs renderPanel() so cardHtml/deepHtml read the active locale.
      if (drill && typeof drill.setLabels === "function") {
        drill.setLabels({
          topCrumb: t("topCrumb"),
          level1: t("level1"),
          zoomOut: t("zoomOut"),
        });
      }
      announce(loc === "en" ? "Language: English" : "Язык: русский");
    });
  }
  rewriteStaticText(i18n.getLocale());

  // ---- drill-card renderer (the embed step explained, dim 1536, 1:1) --------
  function renderPanel(entry) {
    const deep = entry.kind === "deep";
    const wrap = document.createElement("div");
    wrap.className = "detail-panel embed-card";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", t("cardAria"));
    wrap.innerHTML = deep ? deepHtml() : cardHtml();

    const deeper = wrap.querySelector("[data-deeper]");
    if (deeper && drill) {
      const Lst = listeners();
      const openDeep = () =>
        drill.openDeep({ id: "embed-deep", crumb: t("deepCrumb") });
      Lst.on(deeper, "click", openDeep);
      Lst.on(deeper, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          openDeep();
        }
      });
    }
    return wrap;
  }

  function rowsHtml() {
    let s = '<div class="embed-rows">';
    (EMBEDDING.chunks || []).forEach((c) => {
      const v = (EMBEDDING.vectors || []).find((x) => x.chunkId === c.id);
      if (!v) return;
      const vals = (v.values || []).map((n) => n.toFixed(3)).join(", ");
      s += '<div class="embed-row">';
      s += '<span class="er-chunk">' + esc(c.id) + ': ' + esc(L10n(c.text)) + "</span>";
      s += '<span class="er-arrow" aria-hidden="true">-&gt;</span>';
      s +=
        '<span class="er-vec"><b>' +
        esc(v.id) +
        "</b> (dim " +
        esc(v.dim) +
        ") [" +
        esc(vals) +
        ", ...]</span>";
      s += "</div>";
    });
    return s + "</div>";
  }

  function cardHtml() {
    let h = "";
    h += '<div class="embed-card__head">';
    h += '<p class="embed-card__kicker">' + esc(t("kicker")) + "</p>";
    h +=
      '<h3 class="embed-card__title" tabindex="-1">' + t("cardTitle") + "</h3>";
    h += "</div>";
    h += '<p class="embed-card__note">' + t("cardNote") + "</p>";
    h += rowsHtml();
    h +=
      '<div class="deeper" data-deeper tabindex="0" role="button" aria-label="' +
      esc(t("deeperAria")) +
      '">';
    h += '<span class="dlbl">' + LENS_PLUS + " " + t("deeperLabel") + "</span>";
    h += '<span class="dprev">' + t("deeperPrev") + "</span>";
    h += "</div>";
    return h;
  }

  function deepHtml() {
    let h = "";
    h += '<div class="embed-card__head">';
    h += '<p class="embed-card__kicker">' + t("deepKicker") + "</p>";
    h +=
      '<h3 class="embed-card__title" tabindex="-1">' + esc(t("deepTitle")) + "</h3>";
    h += "</div>";
    h += '<p class="embed-card__note">' + t("deepNote") + "</p>";
    h += rowsHtml();
    return h;
  }
}

/** Rewrite page-level static [data-i18n] strings (data-ru / data-en). */
function rewriteStaticText(loc) {
  qsa("[data-i18n]").forEach((node) => {
    const val = node.getAttribute("data-" + loc);
    if (val != null) node.textContent = val;
  });
  // aria-label localization: [data-i18n-aria] carries data-aria-ru / data-aria-en.
  qsa("[data-i18n-aria]").forEach((node) => {
    const val = node.getAttribute("data-aria-" + loc);
    if (val != null) node.setAttribute("aria-label", val);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

window.addEventListener("pagehide", () => {
  while (instances.length) {
    const inst = instances.pop();
    try {
      inst.destroy();
    } catch (_) {
      /* ignore teardown errors */
    }
  }
});
