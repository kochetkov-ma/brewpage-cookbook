/**
 * generation.js -- page glue for the "Генерация" section (AtlasMD).
 *
 * Mirrors pages/what-rag.js: sets .has-js (flips .js-only / .no-js-only), inits
 * the a11y announcer + i18n store + compass, wires the drilldown-zoom camera onto
 * [data-component="drilldown-host"], and mounts grounded-answer.js as the level-1
 * PANEL CONTENT. This file only wires hosts + resolves the locale data; all
 * behaviour lives in the lib modules (SB owns wiring; IE owns lib internals).
 *
 * Integration contract (from IE):
 *   - grounded-answer mounts as level-1 panel content via drilldown-zoom.js.
 *   - On openNode the camera calls renderPanel(entry) -> we init the module into
 *     a fresh mount el, return it (camera appends it into [data-slot="panel"]),
 *     and destroy() the PREVIOUS module instance.
 *   - grounded-answer.init(mountEl, { data: <stripMeta then model[lang]>, announce }).
 *
 * Hosts wired:
 *   [data-component="compass"]        -> compass.js (inert decoration)
 *   [data-component="drilldown-host"] -> drilldown-zoom.js (camera)
 *   [data-component="lang-toggle"]    -> i18n.setLocale on click
 *   [data-component="a11y-live"]      -> a11y.js announcer (created if absent)
 */

import { qs, qsa, el, stripMeta } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initSiteSearch } from "../lib/site-search.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initCamera } from "../lib/drilldown-zoom.js";
import { init as initGrounded } from "../lib/grounded-answer.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import GENERATION_DATA from "../../data/generation.js";

document.documentElement.classList.add("has-js");

// the single drill node id for this section's level-0 stage.
const NODE_ID = "generate";

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

/** Resolve the section data for the active locale (strip _-meta, pick lang). */
function resolveData() {
  const clean = stripMeta(GENERATION_DATA);
  const loc = i18n.getLocale();
  return clean[loc] || clean.ru || clean.en;
}

function boot() {
  // header full-text site search (client-side, zero external requests) --------
  track(initSiteSearch(document, {}));
  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle ------------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) --------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // annotated code blocks (highlight + hover/focus popover layer + no-JS ol).
  // code-blocks subscribes to i18n internally and re-renders on lang:change.
  track(initCodeBlocks(document, { announce }));

  // the drill/zoom camera; the module is mounted as level-1 panel content ---
  let activeModule = null;
  function destroyActiveModule() {
    if (activeModule && typeof activeModule.destroy === "function") {
      try {
        activeModule.destroy();
      } catch (_) {
        /* ignore teardown errors */
      }
    }
    activeModule = null;
  }

  const cameraHost = qs('[data-component~="drilldown-host"]');
  let camera = null;
  if (cameraHost) {
    camera = track(
      initCamera(cameraHost, {
        announce,
        labels: {
          topCrumb: i18n.getLocale() === "en" ? "Generation" : "Генерация",
          level1: i18n.getLocale() === "en" ? "Inside" : "Внутри",
          zoomOut: "Выйти на уровень выше",
        },
        renderPanel: () => {
          destroyActiveModule();
          const mount = el("div", { class: "ga-mount" });
          activeModule = initGrounded(mount, { data: resolveData(), announce });
          return mount;
        },
      })
    );

    const node = qs('[data-node="' + NODE_ID + '"]', cameraHost);
    if (node) {
      node.addEventListener("click", () => {
        camera.openNode({ id: NODE_ID, crumb: node.getAttribute("data-crumb") || "Генерация", fromEl: node });
      });
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          camera.openNode({ id: NODE_ID, crumb: node.getAttribute("data-crumb") || "Генерация", fromEl: node });
        }
      });
    }
  }

  // lang-toggle: drive the i18n store; rebuild the open module on lang change
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
      if (camera && typeof camera.currentDepth === "function" && camera.currentDepth() > 0) {
        const fromEl = cameraHost ? qs('[data-node="' + NODE_ID + '"]', cameraHost) : null;
        camera.openNode({ id: NODE_ID, crumb: loc === "en" ? "Generation" : "Генерация", fromEl });
      }
      announce(loc === "en" ? "Language: English" : "Язык: русский");
    });
  }

  if (cameraHost) {
    cameraHost.addEventListener("click", () => {
      if (camera && typeof camera.currentDepth === "function" && camera.currentDepth() === 0) {
        destroyActiveModule();
      }
    });
  }

  instances.push({ destroy: destroyActiveModule });

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
