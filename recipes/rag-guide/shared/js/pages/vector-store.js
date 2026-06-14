/**
 * vector-store.js -- page glue for the "Векторное хранилище" section
 * (element=ann-topk-drill: a small ANN index map + top-k drill). Mirrors
 * pages/search.js: sets .has-js, finds the documented hosts by data-component /
 * data-slot, inits the lib modules this section needs (a11y announcer, i18n
 * store, plate handle, drilldown-zoom camera, vector-map), collects instances
 * and calls destroy() on pagehide.
 *
 * REUSE (per IE contract): this section reuses shared/js/lib/vector-map.js
 * unchanged -- it already renders query + points by cx/cy, draws query->top-k
 * links, settles points by cosine, makes EVERY point drillable and shows cosine
 * rings. There is NO index-map.js. The data contract is shared/data/vector-
 * store.js (default export), passed as config.data to vector-map.init.
 *
 * Behaviour lives in the lib modules; this file only wires hosts + supplies the
 * RU-first drill-card renderer (renderPanel) over the data contract. Drilling a
 * neighbour shows its cosine + metadata; far points open a why-not-top-k card.
 * (recipe-site-architect owns wiring; interactive-engineer owns lib internals.)
 *
 * Hosts wired:
 *   [data-component="drilldown-host"] -> drilldown-zoom.js (camera + crumbs + zoomout + panel)
 *   [data-component="plate"]          -> plate.js (growToFit on drill)
 *   [data-component="vector-map"]     -> vector-map.js (index plot + points + settle)
 *   [data-component="a11y-live"]      -> a11y.js announcer (created if absent)
 *
 * Selection on zoom-out: drilldown-zoom keeps focus on the marker we came FROM
 * and fires onSelect on every open. We mirror that selection onto the themed
 * (sepia/rust, NEVER blue) SVG ring via vmap.setSelected and DO NOT clear it on
 * zoom-out, so the drilled point stays selected at the map level.
 */

import { qs, qsa, listeners } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initI18n } from "../lib/i18n.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initDrill } from "../lib/drilldown-zoom.js";
import { init as initVectorMap } from "../lib/vector-map.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import STORE from "../../data/vector-store.js";

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

// Resolve a localized { ru, en } field by the active locale; pass-through for
// lang-neutral plain strings (metadata, vector readouts, dim, metric).
function loc(field) {
  if (field && typeof field === "object" && ("ru" in field || "en" in field)) {
    const l = i18n.getLocale();
    return field[l] != null ? field[l] : field.en != null ? field.en : field.ru;
  }
  return field;
}

// Fixed UI strings the card/deep renderers emit (not in the data contract).
// Resolved by active locale via ui(key).
const UI = {
  inTopk: { ru: "вошёл в top-k", en: "in top-k" },
  notInTopk: { ru: "НЕ вошёл в top-k", en: "NOT in top-k" },
  dimLbl: { ru: "размерность", en: "dimensions" },
  metricLbl: { ru: "метрика", en: "metric" },
  cosLbl: { ru: "косинус", en: "cosine" },
  rankLbl: { ru: "ранг", en: "rank" },
  queryVec: { ru: "вектор запроса (dim ", en: "query vector (dim " },
  neighbourVec: { ru: "вектор соседа:", en: "neighbour vector:" },
  whyOut: { ru: "Почему не вошёл", en: "Why it did not make it" },
  boundary: { ru: "граница top-k (k=", en: "top-k boundary (k=" },
  lastInTopk: { ru: "последний в top-k", en: "last in top-k" },
  belowNoteA: { ru: "Косинус <b>", en: "Cosine <b>" },
  belowNoteB: {
    ru: "</b> ниже границы (#",
    en: "</b> is below the boundary (#",
  },
  belowNoteC: {
    ru: "), поэтому сосед <b>не попал в top-k</b>.",
    en: "), so the neighbour <b>did not make the top-k</b>.",
  },
  queryDeepNote: {
    ru: "База возвращает только <b>top-k</b> ближайших по косинусу; остальное отсечено границей (ANN ищет их без перебора всего архива).",
    en: "The store returns only the <b>top-k</b> nearest by cosine; the rest is cut by the boundary (ANN finds them without scanning the whole archive).",
  },
  metaDeepNote: {
    ru: "Рядом с вектором база хранит его <b>метаданные</b> (source / section / date / access). Фильтр по метаданным сужает поиск до нужного подмножества <b>до</b> поиска ближайших.",
    en: "Next to the vector the store keeps its <b>metadata</b> (source / section / date / access). A metadata filter narrows the search to the right subset <b>before</b> the nearest-neighbour search.",
  },
  lessThan: { ru: " &lt; граница top-k (k=", en: " &lt; top-k boundary (k=" },
  ariaPeek: { ru: "Заглянуть внутрь: ", en: "Look inside: " },
};

function ui(key) {
  const l = i18n.getLocale();
  const e = UI[key];
  return e ? (e[l] != null ? e[l] : e.en) : "";
}

function boot() {
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // i18n store (restores persisted locale; default RU from <html lang>)
  track(initI18n(document.documentElement, {}));

  // lang-toggle wiring FIRST so the toggle is operable + chrome translated even
  // if there is no drill host to enhance (early return below). The vector-map
  // interactive consumes a RU-only data contract (shared/data/vector-store.js,
  // owned by interactive-engineer), so toggling swaps the page chrome; the map
  // copy stays RU until that data carries { ru, en }.
  wireLangToggle();

  // a11y live-region announcer (scoped)
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // annotated code block (the upsert + query listing) -- highlight + hover/focus
  // popover layer + no-JS ol. Wired BEFORE the drill-host early return so it is
  // always upgraded even on a page with no map to enhance.
  track(initCodeBlocks(document, { announce }));

  // plate handle (grow-to-fit on drill so the panel never scroll-jails)
  const plateHost = qs('[data-component="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // drilldown camera host -- owns crumbs, zoom-out, panel, selection-on-zoom-out
  const drillHost = qs('[data-component="drilldown-host"]');
  if (!drillHost) return; // nothing to enhance

  // by-id lookup for the data contract (points + query)
  const byId = new Map();
  if (STORE.query) byId.set(STORE.query.id, STORE.query);
  (STORE.points || []).forEach((p) => byId.set(p.id, p));

  let vmap = null; // forward ref so renderPanel + onSelect can reach the map

  const drill = track(
    initDrill(drillHost, {
      plate,
      announce,
      labels: {
        topCrumb: "Индекс векторов",
        level1: "Сосед",
        zoomOut: "Отдалить на уровень выше",
      },
      onSelect: (id) => {
        if (vmap && byId.has(id)) vmap.setSelected(id);
      },
      renderPanel: (entry, api) => renderPanel(entry, api),
    })
  );

  // the small ANN index map -- every point (near + far + query) drillable
  const mapHost = qs('[data-component="vector-map"]');
  const railHost = qs('[data-slot="rail"]');
  if (mapHost) {
    vmap = track(
      initVectorMap(mapHost, {
        data: STORE,
        rail: railHost,
        lang: i18n.getLocale(), // first paint matches the active locale
        onActivate: (point, markerEl) => {
          // open the camera at level 1 on this point; the camera keeps focus +
          // selection on this marker through any zoom-out
          drill.openNode({
            id: point.id,
            crumb: loc(point.crumb) || loc(point.title) || "",
            fromEl: markerEl,
            data: point,
          });
        },
      })
    );
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

  // ---- panel renderer (level 1 neighbour / why-not / query card; level 2 deep) ----
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
    const deeper = wrap.querySelector("[data-deeper]");
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
    }
    return wrap;
  }

  function metaHtml(m) {
    if (!m) return "";
    let s = '<dl class="metarow">';
    [
      ["source", m.source],
      ["section", m.section],
      ["date", m.date],
      ["access", m.access],
    ].forEach((kv) => {
      if (kv[1] == null) return;
      s +=
        '<div class="metacell"><dt>' +
        esc(kv[0]) +
        "</dt><dd>" +
        esc(kv[1]) +
        "</dd></div>";
    });
    return s + "</dl>";
  }

  function cardHtml(d) {
    const isQuery = d.id === (STORE.query && STORE.query.id);
    let h = "";
    h += '<div class="vmap-card__head">';
    h += '<p class="vmap-card__kicker">' + esc(loc(d.head)) + "</p>";
    h += '<h3 class="vmap-card__title" tabindex="-1">' + esc(loc(d.title)) + "</h3>";
    if (d.src) h += '<p class="vmap-card__src">' + esc(loc(d.src)) + "</p>";
    h += "</div>";

    if (isQuery) {
      h +=
        '<p class="vread"><span class="vlbl">' +
        ui("queryVec") +
        esc(d.dim) +
        '):</span><br>' +
        esc(d.vector) +
        "</p>";
      h += factsHtml([
        [ui("dimLbl"), d.dim, ""],
        ["k", String(STORE.k), "g"],
        [ui("metricLbl"), d.metric, ""],
      ]);
      h += '<p class="vmap-card__note">' + esc(loc(d.body)) + "</p>";
    } else {
      const inTopk = d.topk === true;
      h +=
        '<p class="topk-flag ' +
        (inTopk ? "in" : "out") +
        '">' +
        (inTopk ? ui("inTopk") : ui("notInTopk")) +
        "</p>";
      // text is TRUSTED static copy (may carry inline <mark>)
      h += '<div class="chunk-text">' + loc(d.text) + "</div>";
      h += metaHtml(d.metadata);
      h += factsHtml([
        [ui("cosLbl"), d.cos, inTopk ? "g" : "r"],
        [ui("rankLbl"), "#" + d.rank, ""],
      ]);
      h +=
        '<p class="vread"><span class="vlbl">' +
        ui("neighbourVec") +
        "</span><br>" +
        esc(d.vector) +
        "</p>";
      if (!inTopk && d.reason) {
        h +=
          '<p class="whyout"><span class="wlbl">' +
          ui("whyOut") +
          "</span>" +
          esc(loc(d.reason)) +
          " <b>cos " +
          esc(d.cos) +
          ui("lessThan") +
          STORE.k +
          ", #" +
          STORE.k +
          " = " +
          esc(STORE.cutCos) +
          ")</b>.</p>";
      }
    }

    // inline lens-plus deeper target (one level deeper)
    h +=
      '<div class="deeper" data-deeper tabindex="0" role="button" aria-label="' +
      ui("ariaPeek") +
      esc(loc(d.deep.label)) +
      '">';
    h += '<span class="dlbl">' + LENS_PLUS + " " + esc(loc(d.deep.label)) + "</span>";
    h += '<span class="dprev">' + esc(d.deep.preview) + "</span>";
    h += "</div>";
    return h;
  }

  function deepHtml(d) {
    const isQuery = d.id === (STORE.query && STORE.query.id);
    let h = "";
    h += '<div class="vmap-card__head">';
    h += '<p class="vmap-card__kicker">' + esc(loc(d.deep.label)) + "</p>";
    h += '<h3 class="vmap-card__title" tabindex="-1">' + esc(loc(d.title)) + "</h3>";
    h += "</div>";

    if (isQuery) {
      h += rankBlock();
      h += '<p class="vmap-card__note">' + ui("queryDeepNote") + "</p>";
    } else if (d.topk !== true) {
      h +=
        '<ol class="ranklist"><li class="near shown"><span class="rk">#' +
        STORE.k +
        '</span><span class="rtxt">' +
        ui("lastInTopk") +
        '</span><span class="rcos">' +
        esc(STORE.cutCos) +
        "</span></li></ol>";
      h += '<div class="cut">' + ui("boundary") + STORE.k + ")</div>";
      h +=
        '<ol class="ranklist"><li class="far shown"><span class="rk">#' +
        esc(d.rank) +
        '</span><span class="rtxt">' +
        esc(loc(d.title)) +
        '</span><span class="rcos">' +
        esc(d.cos) +
        "</span></li></ol>";
      h +=
        '<p class="vmap-card__note">' +
        ui("belowNoteA") +
        esc(d.cos) +
        ui("belowNoteB") +
        STORE.k +
        " = " +
        esc(STORE.cutCos) +
        ui("belowNoteC") +
        "</p>";
    } else {
      h += metaHtml(d.metadata);
      h +=
        '<p class="vread"><span class="vlbl">' +
        ui("neighbourVec") +
        "</span><br>" +
        esc(d.vector) +
        "</p>";
      h += '<p class="vmap-card__note">' + ui("metaDeepNote") + "</p>";
    }
    return h;
  }

  function rankBlock() {
    let h = '<ol class="ranklist">';
    (STORE.points || [])
      .filter((p) => p.topk === true)
      .sort((a, b) => a.rank - b.rank)
      .forEach((p) => {
        h +=
          '<li class="near shown"><span class="rk">#' +
          p.rank +
          '</span><span class="rtxt">' +
          esc(loc(p.title)) +
          '</span><span class="rcos">' +
          esc(p.cos) +
          "</span></li>";
      });
    h += "</ol>";
    h += '<div class="cut">' + ui("boundary") + STORE.k + ")</div>";
    h += '<ol class="ranklist">';
    (STORE.points || [])
      .filter((p) => p.topk !== true)
      .sort((a, b) => a.rank - b.rank)
      .forEach((p) => {
        h +=
          '<li class="far shown"><span class="rk">#' +
          p.rank +
          '</span><span class="rtxt">' +
          esc(loc(p.title)) +
          '</span><span class="rcos">' +
          esc(p.cos) +
          "</span></li>";
      });
    h += "</ol>";
    return h;
  }

  function factsHtml(facts) {
    let s = '<div class="factrow">';
    facts.forEach((f) => {
      s +=
        '<div class="fact"><span class="fl">' +
        f[0] +
        '</span><span class="fv' +
        (f[2] ? " " + f[2] : "") +
        '">' +
        f[1] +
        "</span></div>";
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
