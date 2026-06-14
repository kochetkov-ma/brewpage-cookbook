/**
 * chunking.js -- page glue for the "Чанкинг" (chunking) section (AtlasMD).
 *
 * Mirrors pages/what-rag.js: sets .has-js (flips .js-only / .no-js-only), finds
 * the documented hosts by data-component / data-slot, inits the lib modules this
 * page needs (a11y announcer, i18n store, compass, plate, progress, the
 * drilldown-zoom camera), builds the level-0 ratings TABLE as the drill stage,
 * supplies renderPanel(entry) for the level-1 strategy panel, collects instances
 * and calls destroy() on pagehide. All behaviour lives in lib modules; this file
 * only wires hosts + supplies UI strings + the catalog data.
 *
 * Catalog drill (AtlasMD 3.6 + IE contract):
 *   - Level-0 STAGE = a 9-row ratings/complexity table built here into
 *     [data-slot="stage"]. Each row is a drill trigger (role=button) -> camera.openNode.
 *   - drilldown-zoom.js owns the camera (crumbs / zoomout / panel grow-to-fit /
 *     Escape / selection on zoom-out). It collapses the stage via .zoomed and
 *     renders the panel via renderPanel(entry) supplied here.
 *   - renderPanel builds the level-1 strategy panel: how/when prose, algorithm
 *     steps, runnable Python (if any), then EITHER a chunk-anim mount
 *     [data-slot="anim"] (the 5 animated strategies: strategy.anim != null) wired
 *     via chunk-anim.init(mount, { anim, lang }), OR strategy.schematic as static
 *     prose (the 4 schematic strategies: strategy.anim == null).
 *   - The active chunk-anim instance is tracked and destroy()ed on the next open
 *     / zoom-out / panel teardown so no timeline keeps running off-screen.
 *
 * Hosts wired:
 *   [data-component="plate drilldown-host"] -> plate.js + drilldown-zoom.js
 *   [data-component="progress"]             -> progress.js
 *   [data-component="compass"]              -> compass.js
 *   [data-component="lang-toggle"]          -> i18n.setLocale on click
 *   [data-component="a11y-live"]            -> a11y.js announcer (created if absent)
 *   [data-slot="stage"]                     -> the 9-row catalog table (built here)
 */

import { qs, qsa, el, clear } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initProgress } from "../lib/progress.js";
import { init as initCamera } from "../lib/drilldown-zoom.js";
import { init as initAnim } from "../lib/chunk-anim.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import { highlightInto } from "../lib/code-highlight.js";
import * as chapterState from "../lib/chapter-state.js";
import CHUNKING from "../../data/chunking.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

// This section's chapter slug (matches nav.json + the map flag id).
const CHAPTER_SLUG = "chunking";

document.documentElement.classList.add("has-js");

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

// active chunk-anim instance (one panel open at a time -> one anim at a time).
let activeAnim = null;
function teardownAnim() {
  if (activeAnim && typeof activeAnim.destroy === "function") {
    try {
      activeAnim.destroy();
    } catch (_) {
      /* ignore teardown errors */
    }
  }
  activeAnim = null;
}

function loc() {
  return i18n.getLocale();
}
function pick(pair) {
  if (!pair) return "";
  const l = loc();
  return pair[l] != null ? pair[l] : pair.ru != null ? pair.ru : pair.en || "";
}

const ui = CHUNKING.ui || {};
const strategies = Array.isArray(CHUNKING.strategies) ? CHUNKING.strategies : [];
const strategyById = new Map(strategies.map((s) => [s.id, s]));
// MAIN PATH = the 9 strategies in catalog order; opening a row earns progress.
const order = strategies.map((s) => s.id);

let stageHost = null;
const rowEls = new Map();

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "chunking" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // annotated code blocks for the 4 static prose figures (the 4 chunking keys).
  // code-blocks subscribes to i18n internally and re-renders on lang:change.
  // NOTE: the strategy DRILL panel below renders its OWN python from
  // CHUNKING.strategies[].python and is highlighted via highlightInto() -- it is
  // NOT a [data-component="code-block"] figure, so code-blocks never touches it.
  track(initCodeBlocks(document, { announce }));

  // i18n store handle ------------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) --------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // plate (stage shell handle, grow-to-fit) -------------------------------
  const plateHost = qs('[data-component~="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // earned-progress strip (neutral on load) -------------------------------
  const progressHost = qs('[data-component="progress"]');
  let progress = null;
  if (progressHost) {
    progress = track(
      initProgress(progressHost, {
        mainPath: order,
        total: order.length,
        labels: {
          count: (n, t) =>
            loc() === "en" ? `Opened ${n} / ${t}` : `Раскрыто ${n} / ${t}`,
          done: loc() === "en" ? "Catalog explored" : "Каталог пройден",
        },
        onChange: (state) => {
          chapterState.setProgress(CHAPTER_SLUG, state.done.size, order.length);
          if (state.complete) chapterState.markDone(CHAPTER_SLUG);
        },
      })
    );
    if (progress && typeof progress.markCurrent === "function") progress.markCurrent();
  }

  // the drill/zoom camera --------------------------------------------------
  const cameraHost = qs('[data-component~="drilldown-host"]');
  let camera = null;
  if (cameraHost) {
    camera = track(
      initCamera(cameraHost, {
        plate,
        progress,
        announce,
        labels: {
          topCrumb: loc() === "en" ? "Catalog" : "Каталог",
          level1: loc() === "en" ? "Strategy" : "Стратегия",
          zoomOut: loc() === "en" ? "Zoom out one level" : "Выйти на уровень выше",
        },
        renderPanel: (entry) => renderPanel(entry),
        onSelect: () => refreshRowStates(progress),
      })
    );
  }

  // build the level-0 catalog table into the stage slot -------------------
  stageHost = cameraHost ? qs('[data-slot="stage"]', cameraHost) : null;
  if (stageHost && camera) {
    buildTable(camera, announce);
    refreshRowStates(progress);
  }

  // lang-toggle: drive the i18n store; static [data-i18n] re-rendered here --
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
    buttons.forEach((b) => {
      b.addEventListener("click", () => i18n.setLocale(b.dataset.lang));
    });
    applyToggleState(loc());
    i18n.subscribe((l) => {
      applyToggleState(l);
      rewriteStaticText(l);
      // rebuild the table headings/cells + collapse any open panel to level 0
      if (camera && typeof camera.close === "function") camera.close();
      teardownAnim();
      if (stageHost && camera) {
        buildTable(camera, announce);
        refreshRowStates(progress);
      }
      announce(l === "en" ? "Language: English" : "Язык: русский");
    });
  }

  rewriteStaticText(loc());
}

/** Build the 9-row ratings/complexity catalog table (level-0 drill stage). */
function buildTable(camera, announce) {
  clear(stageHost);
  rowEls.clear();

  const cap = el("p", {
    class: "cat-hint",
    attrs: { "aria-hidden": "true" },
    text: pick(ui.drillHint),
  });

  const table = el("table", {
    class: "cat-table",
    attrs: { "aria-label": loc() === "en" ? "Chunking strategy catalog" : "Каталог стратегий чанкинга" },
  });

  const heads = [ui.colStrategy, ui.colComplexity, ui.colTokenCost, ui.colTimeCost, ui.colComputeCost, ui.colWhen];
  const thead = el("thead");
  const hrow = el("tr");
  heads.forEach((h) => hrow.appendChild(el("th", { attrs: { scope: "col" }, text: pick(h) })));
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = el("tbody");
  strategies.forEach((s, i) => {
    const cells = [
      el("td", { class: "cat-name" }, [
        el("span", { class: "cat-name__idx", attrs: { "aria-hidden": "true" }, text: pad2(i + 1) }),
        el("span", { class: "cat-name__txt", text: pick(s.name) }),
      ]),
      ratingCell(s.complexity),
      ratingCell(s.tokenCost),
      ratingCell(s.timeCost),
      ratingCell(s.computeCost),
      el("td", { class: "cat-when", text: pick(s.when) }),
    ];
    const row = el("tr", {
      class: "cat-row",
      attrs: {
        role: "button",
        tabindex: "0",
        "data-strategy": s.id,
        "aria-label": pick(s.name) + ", " + pick(s.when),
      },
    }, cells);

    const open = () => {
      teardownAnim();
      camera.openNode({ id: s.id, crumb: pick(s.name), fromEl: row });
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        open();
      }
    });
    rowEls.set(s.id, row);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // wrap in .cat-stage-inner so the camera's .stage.zoomed rule collapses the
  // whole level-0 table out of flow while a strategy panel is open.
  const inner = el("div", { class: "cat-stage-inner" }, [
    cap,
    el("div", { class: "cat-scroll" }, [table]),
  ]);
  stageHost.appendChild(inner);
}

function ratingCell(rating) {
  const r = String(rating || "");
  return el("td", { class: "cat-rate" }, [
    el("span", {
      class: "rating rating--" + r.replace(/[^a-z-]/g, ""),
      attrs: { "data-rating": r },
      text: r,
    }),
  ]);
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

/** Re-light visited rows + "вы здесь"/next-step from the progress instance. */
function refreshRowStates(progress) {
  if (!progress) return;
  const allDone = typeof progress.isComplete === "function" && progress.isComplete();
  const current = typeof progress.getCurrent === "function" ? progress.getCurrent() : null;
  const next = !allDone && typeof progress.nextStep === "function" ? progress.nextStep() : null;
  rowEls.forEach((row, id) => {
    const visited = typeof progress.isVisited === "function" && progress.isVisited(id);
    row.classList.toggle("visited", !!visited);
    row.classList.toggle("current", !visited && id === current);
    row.classList.toggle("next-step", !visited && id === next);
  });
}

/**
 * Panel factory the camera calls on every open. entry: { id, crumb, ... }.
 * Builds the level-1 strategy panel; mounts chunk-anim for the 5 animated
 * strategies or renders strategy.schematic for the 4 schematic ones.
 */
function renderPanel(entry) {
  // any previously-open panel is being torn down -> stop its animation.
  teardownAnim();
  if (!entry) return null;
  const s = strategyById.get(entry.id);
  if (!s) return null;

  const panel = el("div", {
    class: "strat-panel",
    // inline (non-modal) strategy panel: a labelled region, NOT a dialog -- no
    // focus trap, the page behind stays interactive.
    attrs: { role: "group", "aria-label": pick(s.name) },
  });

  panel.appendChild(el("h2", { text: pick(s.name) }));

  // ratings recap (mono chips) so the panel restates the cost trade-off.
  const recap = el("div", { class: "strat-recap" }, [
    recapChip(ui.colComplexity, s.complexity),
    recapChip(ui.colTokenCost, s.tokenCost),
    recapChip(ui.colTimeCost, s.timeCost),
    recapChip(ui.colComputeCost, s.computeCost),
  ]);
  panel.appendChild(recap);

  // how it works
  panel.appendChild(el("h3", { text: pick(ui.howHead) }));
  panel.appendChild(el("p", { text: pick(s.how) }));

  // when to use
  panel.appendChild(el("h3", { text: pick(ui.whenHead) }));
  panel.appendChild(el("p", { text: pick(s.when) }));

  // algorithm (ordered steps)
  const steps = s.algorithm ? s.algorithm[loc()] || s.algorithm.ru || [] : [];
  if (steps.length) {
    panel.appendChild(el("h3", { text: pick(ui.algoHead) }));
    const ol = el("ol", { class: "strat-algo" });
    steps.forEach((st) => ol.appendChild(el("li", { text: st })));
    panel.appendChild(ol);
  }

  // runnable Python (ASCII). s.python is now { ru, en }; pick the active-locale
  // source, set it as raw textContent, then colorize via the shared highlighter
  // ONLY (highlightInto reads textContent -> escaped tok spans). This panel keeps
  // its own drill interaction; it is NOT wrapped as a code-block figure and gets
  // no hover-annotation layer.
  const py = pick(s.python);
  if (py) {
    panel.appendChild(el("h3", { text: pick(ui.pythonHead) }));
    const codeEl = el("code", { text: py });
    const preEl = el("pre", { class: "strat-py" }, [codeEl]);
    panel.appendChild(preEl);
    highlightInto(codeEl, "python");
  }

  // didactic visual: anim mount (5 core) OR static schematic (4 schematic)
  if (s.anim) {
    panel.appendChild(el("h3", { text: pick(ui.animHead) }));
    const mount = el("div", { class: "strat-anim", attrs: { "data-slot": "anim" } });
    panel.appendChild(mount);
    // mount after the panel is in the DOM so chunk-anim can measure char geometry.
    requestAnimationFrame(() => {
      if (!mount.isConnected) return;
      activeAnim = initAnim(mount, { anim: s.anim, lang: loc() });
    });
  } else if (s.schematic) {
    panel.appendChild(el("h3", { text: pick(ui.schematicHead) }));
    panel.appendChild(el("p", { class: "strat-schematic", text: pick(s.schematic) }));
  }

  return panel;
}

function recapChip(labelPair, rating) {
  const r = String(rating || "");
  return el("span", { class: "strat-recap__chip" }, [
    el("span", { class: "strat-recap__lbl", text: pick(labelPair) }),
    el("span", {
      class: "rating rating--" + r.replace(/[^a-z-]/g, ""),
      attrs: { "data-rating": r },
      text: r,
    }),
  ]);
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
  teardownAnim();
  while (instances.length) {
    const inst = instances.pop();
    try {
      inst.destroy();
    } catch (_) {
      /* ignore teardown errors */
    }
  }
});
