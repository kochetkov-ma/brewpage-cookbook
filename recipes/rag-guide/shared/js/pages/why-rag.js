/**
 * why-rag.js -- page glue for the "Зачем он нужен" comparison section (AtlasMD).
 *
 * Mirrors landing.js: sets .has-js (flips .js-only / .no-js-only), inits the
 * a11y announcer + i18n store + compass, wires the comparison element onto its
 * documented host, collects instances and calls destroy() on pagehide. All
 * behaviour lives in the lib modules; this file only wires hosts + the active
 * language. (recipe-site-architect owns wiring; interactive-engineer owns lib.)
 *
 * Hosts wired:
 *   [data-component="compass"]    -> compass.js (inert decoration)
 *   [data-component="comparison"] -> comparison.js (tracks + reveal + modal drill)
 *   [data-component="lang-toggle"]-> i18n.setLocale on click
 *   [data-component="a11y-live"]  -> a11y.js announcer (created if absent)
 */

import { qs, qsa } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initComparison } from "../lib/comparison.js";
import { init as initProgress } from "../lib/progress.js";
import * as chapterState from "../lib/chapter-state.js";
import whyRagData from "../../data/why-rag.js";

document.documentElement.classList.add("has-js");

// This section's chapter slug (matches nav.json + the map flag id).
const CHAPTER_SLUG = "why-rag";
// MAIN PATH = the с-RAG (Track B) sequence: Запрос -> Эмбеддинг -> Векторный
// индекс -> Сборка контекста -> Ответ. The без-RAG (Track A) nodes + all
// level-2 modal deeps are SIDE: optional, never gate completion.
const MAIN_PATH = ["B-q", "B-embed", "B-index", "B-context", "B-out"];

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

function boot() {
  // a11y live-region announcer (scoped) ----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle -----------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) -------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // earned-progress + main-path completion (the с-RAG track backbone) -------
  const progressHost = qs('[data-component="progress"]');
  let progress = null;
  if (progressHost) {
    progress = track(
      initProgress(progressHost, {
        mainPath: MAIN_PATH,
        total: MAIN_PATH.length,
        labels: {
          count: (n, t) =>
            i18n.getLocale() === "en" ? `Visited ${n} / ${t}` : `Пройдено ${n} / ${t}`,
          done: i18n.getLocale() === "en" ? "Track complete" : "Тракт пройден",
        },
        // persist REAL chapter completion + the progress FRACTION so the map
        // paints 3 states AND a per-chapter percent on return.
        onChange: (state) => {
          chapterState.setProgress(CHAPTER_SLUG, state.done.size, MAIN_PATH.length);
          if (state.complete) chapterState.markDone(CHAPTER_SLUG);
        },
      })
    );
    progress.markCurrent();
  }

  // the two-track comparison + modal drill --------------------------------
  const cmpHost = qs('[data-component="comparison"]');
  if (cmpHost) {
    track(
      initComparison(cmpHost, {
        data: whyRagData,
        getLocale: i18n.getLocale,
        announce,
        progress,
        mainPath: MAIN_PATH,
      })
    );
  }

  // lang-toggle: drive the i18n store; comparison re-renders via lang:change
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

  // static [data-i18n] text (header brand, section titles) ----------------
  rewriteStaticText(i18n.getLocale());
}

/** Rewrite page-level static [data-i18n] strings; values live as data-ru/data-en. */
function rewriteStaticText(loc) {
  qsa("[data-i18n]").forEach((node) => {
    const val = node.getAttribute("data-" + loc);
    if (val != null) node.textContent = val;
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
