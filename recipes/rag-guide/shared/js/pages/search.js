/**
 * search.js -- page glue for the "Как работает поиск по документам" section
 * (the 2D vector-space map). Mirrors landing.js: sets .has-js, finds the
 * documented hosts by data-component / data-slot, inits the lib modules the
 * section needs (a11y announcer, i18n store, plate handle, drilldown-zoom
 * camera, vector-map), collects the instances and calls destroy() on pagehide.
 *
 * Behaviour lives in the lib modules; this file only wires hosts + supplies the
 * RU-first drill-card renderer (renderPanel) over the section data contract
 * (shared/data/search-vectors.js). (recipe-site-architect owns wiring;
 * interactive-engineer owns lib internals -- but this section page is built by
 * interactive-engineer end-to-end on the shared lib.)
 *
 * Hosts wired:
 *   [data-component="compass"]        -> static SVG (inert; no JS needed)
 *   [data-component="plate"]          -> plate.js (growToFit on drill)
 *   [data-component="drilldown-host"] -> drilldown-zoom.js (camera + crumbs + zoomout + panel)
 *   [data-component="vector-map"]     -> vector-map.js (plot + points + settle)
 *   [data-component="a11y-live"]      -> a11y.js announcer (created if absent)
 *
 * Selection on zoom-out: drilldown-zoom keeps focus on the marker we came FROM
 * and fires onSelect on every open. We mirror that selection onto the themed
 * (sepia/rust, NEVER blue) SVG ring via vmap.setSelected and DO NOT clear it on
 * zoom-out -- so the drilled point stays selected at the map level (AtlasMD 3.13 / do-not #9).
 */

import { qs, qsa, listeners } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initI18n } from "../lib/i18n.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initDrill } from "../lib/drilldown-zoom.js";
import { init as initVectorMap } from "../lib/vector-map.js";
import { init as initProgress } from "../lib/progress.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import * as chapterState from "../lib/chapter-state.js";
import SEARCH from "../../data/search-vectors.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

document.documentElement.classList.add("has-js");

// This section's chapter slug (matches nav.json + the map flag id).
const CHAPTER_SLUG = "search";
// MAIN PATH = the query point + the top-k NEAR points (the kNN backbone), in
// rank order. The 3 FAR points + every level-2 "почему косинус низкий" deep are
// SIDE: exploring them is optional and never gates completion.
const MAIN_PATH = ["pt-q", "n1", "n2", "n3"];

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

// Resolve a localized { ru, en } field by the active locale; pass-through for
// lang-neutral plain strings (vector readouts, shared count, dim, metric).
function loc(field) {
  if (field && typeof field === "object" && ("ru" in field || "en" in field)) {
    const l = i18n.getLocale();
    return field[l] != null ? field[l] : field.en != null ? field.en : field.ru;
  }
  return field;
}

// Fixed UI strings the card/deep renderers emit (not in the data contract).
const UI = {
  inTopk: { ru: "вошёл в top-k", en: "in top-k" },
  notInTopk: { ru: "НЕ вошёл в top-k", en: "NOT in top-k" },
  dimLbl: { ru: "размерность", en: "dimensions" },
  metricLbl: { ru: "метрика", en: "metric" },
  cosLbl: { ru: "косинус", en: "cosine" },
  rankLbl: { ru: "ранг", en: "rank" },
  sharedLbl: { ru: "общих слов с запросом", en: "shared words with query" },
  queryVec: { ru: "поисковый вектор (dim ", en: "search vector (dim " },
  fragVec: { ru: "вектор фрагмента:", en: "fragment vector:" },
  whyOut: { ru: "Почему не вошёл", en: "Why it did not make it" },
  threshold: { ru: " &lt; порог top-k (k=", en: " &lt; top-k threshold (k=" },
  boundary: { ru: "граница top-k (k=", en: "top-k boundary (k=" },
  lastInTopk: { ru: "последний в top-k", en: "last in top-k" },
  queryDeepNote: {
    ru: "Модель видит только <b>top-k</b> по смыслу; остальное отсечено границей.",
    en: "The model sees only the <b>top-k</b> by meaning; the rest is cut by the boundary.",
  },
  belowNoteA: { ru: "Косинус <b>", en: "Cosine <b>" },
  belowNoteB: {
    ru: "</b> ниже границы (#",
    en: "</b> is below the boundary (#",
  },
  belowNoteC: {
    ru: "), поэтому фрагмент <b>не попал в top-k</b> и модель его не видит.",
    en: "), so the fragment <b>did not make the top-k</b> and the model does not see it.",
  },
  meaningNoteA: {
    ru: "Совпадение по смыслу, не по словам: <b>общих слов с запросом - ",
    en: "Match by meaning, not by words: <b>shared words with query - ",
  },
  ariaPeek: { ru: "Заглянуть внутрь: ", en: "Look inside: " },
};

function ui(key) {
  const l = i18n.getLocale();
  const e = UI[key];
  return e ? (e[l] != null ? e[l] : e.en) : "";
}

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "search" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // i18n store (restores persisted locale; default RU from <html lang>)
  track(initI18n(document.documentElement, {}));

  // lang-toggle wiring FIRST so the toggle is operable + chrome translated even
  // if there is no drill host to enhance (early return below). The vector-map
  // interactive consumes a RU-only data contract (shared/data/search-vectors.js,
  // owned by interactive-engineer), so toggling swaps the page chrome; the map
  // copy stays RU until that data carries { ru, en }.
  wireLangToggle();

  // a11y live-region announcer (scoped)
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // annotated code block (the retrieve() listing) -- highlight + hover/focus
  // popover layer + no-JS ol. Wired BEFORE the drill-host early return so the
  // code block is always upgraded even on a page with no map to enhance. This
  // does NOT touch the client-side site search wiring above.
  track(initCodeBlocks(document, { announce }));

  // plate handle (grow-to-fit on drill so the panel never scroll-jails)
  const plateHost = qs('[data-component="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // drilldown camera host -- owns crumbs, zoom-out, panel, selection-on-zoom-out
  const drillHost = qs('[data-component="drilldown-host"]');
  if (!drillHost) return; // nothing to enhance

  // by-id lookup for the data contract (points + query)
  const byId = new Map();
  if (SEARCH.query) byId.set(SEARCH.query.id, SEARCH.query);
  (SEARCH.points || []).forEach((p) => byId.set(p.id, p));

  let vmap = null; // forward ref so renderPanel + onSelect can reach the map

  // earned-progress + main-path completion (query + top-k near points) --------
  const progressHost = qs('[data-component="progress"]');
  let progress = null;
  if (progressHost) {
    progress = track(
      initProgress(progressHost, {
        mainPath: MAIN_PATH,
        total: MAIN_PATH.length,
        // persist REAL chapter completion + the progress FRACTION so the map
        // paints 3 states AND a per-chapter percent on return.
        onChange: (state) => {
          chapterState.setProgress(CHAPTER_SLUG, state.done.size, MAIN_PATH.length);
          if (state.complete) chapterState.markDone(CHAPTER_SLUG);
          refreshNextStep();
        },
      })
    );
    progress.markCurrent();
    refreshNextStep();
  }

  // NEXT-STEP highlight: glow the point that opens the next uncompleted main-path
  // step (themed, NEVER blue). Gone when the main path is complete (finalized).
  function refreshNextStep() {
    if (!vmap || !progress || typeof vmap.setNextStep !== "function") return;
    const next = progress.isComplete() ? null : progress.nextStep();
    vmap.setNextStep(next);
  }

  const drill = track(
    initDrill(drillHost, {
      plate,
      announce,
      labels: {
        topCrumb: "Карта пространства",
        level1: "Фрагмент",
        zoomOut: "Отдалить на уровень выше",
      },
      onSelect: (id, depth) => {
        // mirror the camera selection onto the themed SVG ring at every open;
        // depth 1 = node id is a point id (deep entries reuse the same selection)
        if (vmap && byId.has(id)) vmap.setSelected(id);
      },
      renderPanel: (entry, api) => renderPanel(entry, api),
    })
  );

  // the vector-space map -- every point (near + far + query) drillable
  const mapHost = qs('[data-component="vector-map"]');
  const railHost = qs('[data-slot="rail"]');
  if (mapHost) {
    vmap = track(
      initVectorMap(mapHost, {
        data: SEARCH,
        rail: railHost,
        lang: i18n.getLocale(), // first paint matches the active locale
        onActivate: (point, markerEl) => {
          // open the camera at level 1 on this point; the camera keeps focus +
          // selection on this marker through any zoom-out (do-not #9)
          drill.openNode({
            id: point.id,
            crumb: loc(point.crumb) || loc(point.title) || "",
            fromEl: markerEl,
            data: point,
          });
          // record main-path / side completion (opening counts). FAR points are
          // not on MAIN_PATH so they become "explored" only -- they never gate.
          if (progress) {
            progress.markOpened(point.id);
            progress.markCurrent();
            refreshNextStep();
          }
        },
      })
    );
    // vmap now exists -> paint the initial next-step highlight
    refreshNextStep();
  }

  // Localize the interactive on language change: re-render the map + rail in the
  // new locale (lib owns plot/rail) and announce the switch. The open drill CARD
  // is re-rendered by drilldown-zoom's own lang:change -> update() handler, which
  // re-runs renderPanel() above; cardHtml/deepHtml now read by active locale.
  const offLang = i18n.subscribe((locName) => {
    if (vmap && typeof vmap.setLang === "function") vmap.setLang(locName);
    announce(locName === "en" ? "Language: English" : "Язык: русский");
  });
  track({ destroy: offLang });

  // ---- panel renderer (level 1 chunk / why-not / query card; level 2 deep) ----
  function renderPanel(entry) {
    // deep entries carry id "<id>-deep" (never in byId); resolve via entry.data.
    const d = byId.get(entry.id) || entry.data;
    if (!d) return null;
    const deep = entry.kind === "deep";
    const wrap = document.createElement("div");
    wrap.className = "detail-panel vmap-card";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", loc(d.head) || loc(d.title) || "");
    wrap.innerHTML = deep ? deepHtml(d) : cardHtml(d);

    // wire the inline lens-plus deeper target (level-1 only)
    const deeper = wrap.querySelector('[data-deeper]');
    if (deeper) {
      const L = listeners();
      const openDeep = () => {
        drill.openDeep({
          id: d.id + "-deep",
          crumb: loc(d.deep && d.deep.label) || "",
          data: d,
        });
      };
      L.on(deeper, "click", openDeep);
      L.on(deeper, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          openDeep();
        }
      });
      // teardown when this panel node leaves the DOM is handled by drilldown clear;
      // the listeners() handle is GC'd with the node (no document-level binds).
    }
    return wrap;
  }

  function escAttr(s) {
    return String(s);
  }

  function cardHtml(d) {
    const isQuery = d.id === (SEARCH.query && SEARCH.query.id);
    let h = "";
    h += '<div class="vmap-card__head">';
    h += '<p class="vmap-card__kicker">' + escAttr(loc(d.head)) + "</p>";
    h += '<h3 class="vmap-card__title" tabindex="-1">' + escAttr(loc(d.title)) + "</h3>";
    h += '<p class="vmap-card__src">' + escAttr(loc(d.src)) + "</p>";
    h += "</div>";

    if (isQuery) {
      h += '<p class="vread"><span class="vlbl">' + ui("queryVec") + escAttr(d.dim) + '):</span><br>' + escAttr(d.vector) + "</p>";
      h += factsHtml([
        [ui("dimLbl"), d.dim, ""],
        ["k", String(SEARCH.k), "g"],
        [ui("metricLbl"), d.metric, ""],
      ]);
      h += '<p class="vmap-card__note">' + escAttr(loc(d.body)) + "</p>";
    } else {
      const inTopk = d.topk !== false;
      h += '<p class="topk-flag ' + (inTopk ? "in" : "out") + '">' +
        (inTopk ? ui("inTopk") : ui("notInTopk")) + "</p>";
      h += '<div class="chunk-text">' + loc(d.text) + "</div>";
      h += factsHtml([
        [ui("cosLbl"), d.cos, inTopk ? "g" : "r"],
        [ui("rankLbl"), "#" + d.rank, ""],
        [ui("sharedLbl"), d.shared, "r"],
      ]);
      if (!inTopk && d.reason) {
        h += '<p class="whyout"><span class="wlbl">' + ui("whyOut") + "</span>" + escAttr(loc(d.reason)) +
          ' <b>cos ' + escAttr(d.cos) + ui("threshold") + SEARCH.k + ", #" + SEARCH.k + " = " + escAttr(SEARCH.cutCos) + ")</b>.</p>";
      }
    }

    // inline lens-plus deeper target (one level deeper)
    h += '<div class="deeper" data-deeper tabindex="0" role="button" aria-label="' + ui("ariaPeek") + escAttr(loc(d.deep.label)) + '">';
    h += '<span class="dlbl">' + LENS_PLUS + " " + escAttr(loc(d.deep.label)) + "</span>";
    h += '<span class="dprev">' + escAttr(d.deep.preview) + "</span>";
    h += "</div>";
    return h;
  }

  function deepHtml(d) {
    const isQuery = d.id === (SEARCH.query && SEARCH.query.id);
    let h = "";
    h += '<div class="vmap-card__head">';
    h += '<p class="vmap-card__kicker">' + escAttr(loc(d.deep.label)) + "</p>";
    h += '<h3 class="vmap-card__title" tabindex="-1">' + escAttr(loc(d.title)) + "</h3>";
    h += "</div>";

    if (isQuery) {
      h += rankBlock();
      h += '<p class="vmap-card__note">' + ui("queryDeepNote") + "</p>";
    } else if (d.topk === false) {
      h += '<p class="vread"><span class="vlbl">' + ui("fragVec") + "</span><br>" + escAttr(d.vector) + "</p>";
      h += '<ol class="ranklist">';
      h += '<li class="near"><span class="rk">#' + SEARCH.k + '</span><span class="rtxt">' + ui("lastInTopk") + '</span><span class="rcos">' + escAttr(SEARCH.cutCos) + "</span></li>";
      h += "</ol><div class=\"cut\">" + ui("boundary") + SEARCH.k + ")</div>";
      h += '<ol class="ranklist"><li class="far"><span class="rk">#' + d.rank + '</span><span class="rtxt">' + escAttr(loc(d.title)) + '</span><span class="rcos">' + escAttr(d.cos) + "</span></li></ol>";
      h += '<p class="vmap-card__note">' + ui("belowNoteA") + escAttr(d.cos) + ui("belowNoteB") + SEARCH.k + " = " + escAttr(SEARCH.cutCos) + ui("belowNoteC") + "</p>";
    } else {
      h += '<p class="vread"><span class="vlbl">' + ui("fragVec") + "</span><br>" + escAttr(d.vector) + "</p>";
      if (Array.isArray(d.lines)) {
        h += '<ol class="lines">';
        d.lines.forEach((l) => {
          h += "<li" + (l.hit ? ' class="hit"' : "") + ">" + escAttr(loc(l.text)) + "</li>";
        });
        h += "</ol>";
      }
      h += '<p class="vmap-card__note">' + ui("meaningNoteA") + escAttr(d.shared) + "</b>.</p>";
    }
    return h;
  }

  function rankBlock() {
    let h = '<ol class="ranklist">';
    (SEARCH.points || [])
      .filter((p) => p.topk !== false)
      .forEach((p) => {
        h += '<li class="near"><span class="rk">#' + p.rank + '</span><span class="rtxt">' + escAttr(loc(p.title)) + '</span><span class="rcos">' + p.cos + "</span></li>";
      });
    h += "</ol><div class=\"cut\">" + ui("boundary") + SEARCH.k + ")</div>";
    h += '<ol class="ranklist">';
    (SEARCH.points || [])
      .filter((p) => p.topk === false)
      .sort((a, b) => a.rank - b.rank)
      .forEach((p) => {
        h += '<li class="far"><span class="rk">#' + p.rank + '</span><span class="rtxt">' + escAttr(loc(p.title)) + '</span><span class="rcos">' + p.cos + "</span></li>";
      });
    h += "</ol>";
    return h;
  }

  function factsHtml(facts) {
    let s = '<div class="factrow">';
    facts.forEach((f) => {
      s += '<div class="fact"><span class="fl">' + f[0] + '</span><span class="fv' + (f[2] ? " " + f[2] : "") + '">' + f[1] + "</span></div>";
    });
    return s + "</div>";
  }
}

/** Wire the RU/EN lang-toggle onto the i18n store + rewrite static chrome. */
function wireLangToggle() {
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
    });
  }
  rewriteStaticText(i18n.getLocale());
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
