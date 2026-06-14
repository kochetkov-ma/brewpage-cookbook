/**
 * evaluation.js -- page glue for the "Оценка" chapter (AtlasMD).
 *
 * Mirrors pages/why-rag.js: sets .has-js (flips .js-only / .no-js-only), inits
 * the a11y announcer + i18n store + compass, then wires the precision@k /
 * recall@k metric calculator onto its documented host. All behaviour lives in
 * the lib modules; this file only wires hosts + supplies the active language.
 * (site-builder owns wiring; interactive-engineer owns the lib + data.)
 *
 * Hosts wired:
 *   [data-component="compass"]                  -> compass.js (inert decoration)
 *   [data-component="metric-eval-calculator"]   -> eval-calculator.js
 *   [data-component="lang-toggle"]              -> i18n.setLocale on click
 *   [data-component="a11y-live"]                -> a11y.js announcer (created if absent)
 */

import { qs, qsa } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initEvalCalculator } from "../lib/eval-calculator.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import evaluationData from "../../data/evaluation.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

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
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "evaluation" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle -----------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) -------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // annotated code blocks (highlight + hover/focus popover layer + no-JS ol).
  // code-blocks subscribes to i18n internally and re-renders on lang:change.
  track(initCodeBlocks(document, { announce }));

  // the precision@k / recall@k calculator over the golden set --------------
  const calcHost = qs('[data-component="metric-eval-calculator"]');
  let calc = null;
  if (calcHost) {
    calc = track(
      initEvalCalculator(calcHost, {
        data: evaluationData,
        lang: i18n.getLocale(),
        onChange: (state) => {
          // announce a glanceable summary of the current k / run scores.
          const pPct = Math.round(state.precision * 100);
          const rPct = Math.round(state.recall * 100);
          announce(
            "k = " + state.k + ": precision@k " + pPct + "%, recall@k " + rPct + "%"
          );
        },
      })
    );
  }

  // lang-toggle: drive the i18n store; calc + static text re-render on change
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
      if (calc && typeof calc.setLang === "function") calc.setLang(loc);
      announce(loc === "en" ? "Language: English" : "Язык: русский");
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
