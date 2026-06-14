/**
 * what-rag.js -- page glue for the "Что такое RAG" pipeline section (AtlasMD).
 *
 * Mirrors pages/landing.js: sets .has-js (flips .js-only / .no-js-only), finds
 * the documented hosts by data-component / data-slot, inits the lib modules this
 * page needs (a11y announcer, i18n store, compass, plate, progress, the
 * drilldown-zoom camera, pipeline), wires them together, collects instances and
 * calls destroy() on pagehide. All behaviour lives in the lib modules; this file
 * only wires hosts + supplies UI strings + the section data.
 *
 * Wiring contract (how pipeline.js consumes the camera + progress):
 *   progress = progress.js on [data-component="progress"]
 *   camera   = drilldown-zoom.js on [data-component="drilldown-host"], given
 *              { progress, plate, renderPanel, onSelect }. On openNode the camera
 *              marks the node visited via `progress`, grows the plate to fit, and
 *              renders the panel via pipeline.renderPanel(entry, cameraApi).
 *   pipeline = pipeline.js on [data-component="pipeline"], given { data, camera,
 *              progress, announce }. It builds the node-cards + spine, wires node
 *              clicks -> camera.openNode, lens-plus -> camera.openDeep, and on the
 *              camera's onSelect callback re-lights the rect node-cards green +
 *              advances "вы здесь" + grows the green progress spine.
 *
 * Hosts wired:
 *   [data-component="compass"]       -> compass.js
 *   [data-component="plate"]         -> plate.js
 *   [data-component="progress"]      -> progress.js
 *   [data-component="drilldown-host"]-> drilldown-zoom.js
 *   [data-component="pipeline"]      -> pipeline.js
 *   [data-component="lang-toggle"]   -> i18n.setLocale on click
 *   [data-component="a11y-live"]     -> a11y.js announcer (created if absent)
 */

import { qs, qsa } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initProgress } from "../lib/progress.js";
import { init as initCamera } from "../lib/drilldown-zoom.js";
import { init as initPipeline } from "../lib/pipeline.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import * as chapterState from "../lib/chapter-state.js";
import PIPELINE_DATA from "../../data/what-rag.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

// This section's chapter slug (matches nav.json + the map flag id).
const CHAPTER_SLUG = "what-rag";

document.documentElement.classList.add("has-js");

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "what-rag" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));

  // annotated code blocks: highlight + hover/focus region popovers + caption +
  // no-JS list. code-blocks.js finds every [data-component="code-block"] and
  // re-renders itself on i18n lang:change (it subscribes internally).
  track(initCodeBlocks(document, {}));

  const order = Array.isArray(PIPELINE_DATA.order) ? PIPELINE_DATA.order : [];

  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle ------------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) --------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // plate (stage shell handle, grow-to-fit) -------------------------------
  // [data-component~="..."] = whitespace-word match, so one <section> can host
  // both "plate" and "drilldown-host" on a single data-component token list.
  const plateHost = qs('[data-component~="plate"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // earned-progress strip (neutral on load) -------------------------------
  const progressHost = qs('[data-component="progress"]');
  let progress = null;
  if (progressHost) {
    progress = track(
      initProgress(progressHost, {
        // MAIN PATH = the 7 pipeline stages in order (the linear backbone).
        // The level-2 deep panels are SIDE paths and do NOT count or gate.
        mainPath: order,
        total: order.length,
        labels: {
          count: (n, t) =>
            i18n.getLocale() === "en" ? `Visited ${n} / ${t}` : `Пройдено ${n} / ${t}`,
          done: i18n.getLocale() === "en" ? "Route complete" : "Маршрут пройден",
        },
        // persist REAL chapter completion + the progress FRACTION so the map
        // paints 3 states AND a per-chapter percent on return.
        onChange: (state) => {
          chapterState.setProgress(CHAPTER_SLUG, state.done.size, order.length);
          if (state.complete) chapterState.markDone(CHAPTER_SLUG);
        },
      })
    );
    if (progress && typeof progress.markCurrent === "function") progress.markCurrent();
  }

  // the pipeline renderer is created after the camera (it needs the camera),
  // but the camera needs the pipeline's renderPanel -- bridge via a late ref.
  let pipeline = null;

  // localized breadcrumb / zoom-out chrome for the drill camera ------------
  const cameraLabels = {
    ru: { topCrumb: "Пайплайн", level1: "Узел", zoomOut: "Выйти на уровень выше" },
    en: { topCrumb: "Pipeline", level1: "Node", zoomOut: "Zoom out one level" },
  };
  const labelsFor = (l) => cameraLabels[l] || cameraLabels.ru;

  // the drill/zoom camera --------------------------------------------------
  const cameraHost = qs('[data-component~="drilldown-host"]');
  let camera = null;
  if (cameraHost) {
    camera = track(
      initCamera(cameraHost, {
        plate,
        progress,
        announce,
        labels: labelsFor(i18n.getLocale()),
        renderPanel: (entry, api) => (pipeline ? pipeline.renderPanel(entry, api) : null),
        onSelect: () => {
          if (pipeline) pipeline.refreshNodeStates();
        },
      })
    );
  }

  // the pipeline-flow + per-node drill content -----------------------------
  const pipelineHost = qs('[data-component="pipeline"]');
  if (pipelineHost && camera) {
    pipeline = track(
      initPipeline(pipelineHost, {
        data: PIPELINE_DATA,
        camera,
        progress,
        announce,
      })
    );
  }

  // lang-toggle: drive the i18n store; static [data-i18n] re-rendered here --
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
      // re-localize the breadcrumb / zoom-out chrome on the drill camera so the
      // crumb stack switches language too (not just the page-load language).
      if (camera && typeof camera.setLabels === "function") {
        camera.setLabels(labelsFor(loc));
      }
      // re-localize the pipeline node-cards + the currently open drill panel.
      if (pipeline && typeof pipeline.setLang === "function") {
        pipeline.setLang(loc);
      }
      announce(loc === "en" ? "Language: English" : "Язык: русский");
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
