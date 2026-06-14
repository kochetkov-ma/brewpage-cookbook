/**
 * production.js -- page glue for the "Продакшен-запуск" chapter (AtlasMD).
 *
 * Mirrors pages/why-rag.js: sets .has-js (flips .js-only / .no-js-only), inits
 * the a11y announcer + i18n store + compass, then wires TWO mounts of the
 * combined rollout affordance:
 *   (a) an EARNED-progress rollout checklist via progress.js -- mainPath =
 *       production.checklist[].id; checking an item calls progress.markOpened(id)
 *       (progress.js owns the ONLY width tween + the earned-green fill).
 *   (b) the cost/latency calculator via cost-calculator.js.
 *
 * All behaviour lives in the lib modules; this file only wires hosts + renders
 * the checklist boxes (a thin list of native checkboxes the user really ticks --
 * green is earned by real interaction, never pre-lit). site-builder owns wiring;
 * interactive-engineer owns the lib + data.
 *
 * Hosts wired:
 *   [data-component="compass"]          -> compass.js (inert decoration)
 *   [data-component="progress"]         -> progress.js (earned rollout strip)
 *   [data-component="cost-calculator"]  -> cost-calculator.js
 *   [data-component="lang-toggle"]      -> i18n.setLocale on click
 *   [data-component="a11y-live"]        -> a11y.js announcer (created if absent)
 *
 * Checklist host markup (in production.html, inside .js-only):
 *   <ul class="rollout-list" data-component="rollout-checklist"></ul>
 *   -- boxes are built here from productionData.checklist (id + ru/en label).
 */

import { qs, qsa, el } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initProgress } from "../lib/progress.js";
import { init as initCostCalculator } from "../lib/cost-calculator.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import * as chapterState from "../lib/chapter-state.js";
import productionData from "../../data/production.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

document.documentElement.classList.add("has-js");

// This section's chapter slug (matches nav.json + the map flag id).
const CHAPTER_SLUG = "production";

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "production" }));
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));

  // annotated code blocks: highlight + hover/focus region popovers + caption +
  // no-JS list. code-blocks.js finds every [data-component="code-block"] and
  // re-renders itself on i18n lang:change (it subscribes internally).
  track(initCodeBlocks(document, {}));

  const checklist = Array.isArray(productionData.checklist)
    ? productionData.checklist
    : [];
  const mainPath = checklist.map((it) => it.id);

  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle -----------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) -------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // earned-progress rollout strip (neutral on load) -----------------------
  const progressHost = qs('[data-component="progress"]');
  let progress = null;
  if (progressHost) {
    progress = track(
      initProgress(progressHost, {
        // MAIN PATH = the rollout checklist items in route order.
        mainPath,
        total: mainPath.length,
        labels: {
          count: (n, t) =>
            i18n.getLocale() === "en" ? `Checked ${n} / ${t}` : `Отмечено ${n} / ${t}`,
          done: i18n.getLocale() === "en" ? "Ready for production" : "Готово к проду",
        },
        // persist REAL chapter completion + the progress FRACTION so the map
        // paints 3 states AND a per-chapter percent on return.
        onChange: (state) => {
          chapterState.setProgress(CHAPTER_SLUG, state.done.size, mainPath.length);
          if (state.complete) chapterState.markDone(CHAPTER_SLUG);
        },
      })
    );
    if (progress && typeof progress.markCurrent === "function") progress.markCurrent();
  }

  // the rollout checklist: native checkboxes the user really ticks ---------
  // (green is earned ONLY here, by a real check -> progress.markOpened(id)).
  const listHost = qs('[data-component="rollout-checklist"]');
  if (listHost) buildChecklist(listHost, checklist, progress, announce);

  // the per-request cost + latency calculator -----------------------------
  const costHost = qs('[data-component="cost-calculator"]');
  let cost = null;
  if (costHost) {
    cost = track(
      initCostCalculator(costHost, {
        data: productionData,
        lang: i18n.getLocale(),
      })
    );
  }

  // lang-toggle: drive the i18n store; calc + checklist + static text update
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
      relabelChecklist(listHost, checklist, loc);
      if (cost && typeof cost.setLang === "function") cost.setLang(loc);
      announce(loc === "en" ? "Language: English" : "Язык: русский");
    });
  }

  // static [data-i18n] text (header brand, section titles) ----------------
  rewriteStaticText(i18n.getLocale());
}

/** Build the rollout checklist: one native checkbox per item, label by lang. */
function buildChecklist(host, items, progress, announce) {
  const loc = i18n.getLocale();
  host.innerHTML = "";
  items.forEach((item) => {
    const inputId = "rollout-" + item.id;
    const input = el("input", {
      class: "rollout-box",
      attrs: { type: "checkbox", id: inputId, "data-id": item.id },
    });
    const labelText = el("span", {
      class: "rollout-text",
      attrs: { "data-id": item.id },
      text: (loc === "en" ? item.en : item.ru) || item.ru,
    });
    const label = el("label", { class: "rollout-label", attrs: { for: inputId } }, [
      input,
      labelText,
    ]);
    const li = el("li", { class: "rollout-item" }, [label]);
    input.addEventListener("change", () => {
      li.classList.toggle("is-checked", input.checked);
      // earn green ONLY on a real check (markOpened is idempotent for done).
      if (input.checked && progress && typeof progress.markOpened === "function") {
        progress.markOpened(item.id);
        announce((loc === "en" ? "Checked: " : "Отмечено: ") + labelText.textContent);
      }
    });
    host.appendChild(li);
  });
}

/** Re-label existing checklist items on a language switch (no state change). */
function relabelChecklist(host, items, loc) {
  if (!host) return;
  items.forEach((item) => {
    const node = qs('.rollout-text[data-id="' + item.id + '"]', host);
    if (node) node.textContent = (loc === "en" ? item.en : item.ru) || item.ru;
  });
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
