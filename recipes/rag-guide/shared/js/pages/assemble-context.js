/**
 * assemble-context.js -- page glue for the "Сборка контекста" section (AtlasMD).
 *
 * Mirrors pages/what-rag.js: sets .has-js (flips .js-only / .no-js-only), inits
 * the a11y announcer + i18n store + compass, wires the drilldown-zoom camera onto
 * [data-component="drilldown-host"], and mounts context-assembly.js as the
 * level-1 PANEL CONTENT. This file only wires hosts + resolves the locale data;
 * all behaviour lives in the lib modules (SB owns wiring; IE owns lib internals).
 *
 * Integration contract (from IE):
 *   - context-assembly mounts as level-1 panel content via drilldown-zoom.js.
 *   - On openNode the camera calls renderPanel(entry) -> we init the module into
 *     a fresh mount el, return it (camera appends it into [data-slot="panel"]),
 *     and destroy() the PREVIOUS module instance.
 *   - context-assembly.init(mountEl, { data: <stripMeta then model[lang]>, announce }).
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
import { init as initAssembly } from "../lib/context-assembly.js";
import { init as initCodeBlocks } from "../lib/code-blocks.js";
import ASSEMBLE_DATA from "../../data/assemble-context.js";
import { init as initSiteVersion } from "../lib/site-version.js";
import { init as initProseI18n } from "../lib/prose-i18n.js";
import PROSE_RU from "../../data/prose-ru.js";

document.documentElement.classList.add("has-js");

// the single drill node id for this section's level-0 stage.
const NODE_ID = "assemble";

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

/** Resolve the section data for the active locale (strip _-meta, pick lang). */
function resolveData() {
  const clean = stripMeta(ASSEMBLE_DATA);
  const loc = i18n.getLocale();
  return clean[loc] || clean.ru || clean.en;
}

function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  // RU prose overlay on the chapter article [data-pk] leaves (EN static = source)
  track(initProseI18n(document, { ruData: PROSE_RU, slug: "assemble-context" }));
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
  // active module instance kept here so renderPanel can destroy() the previous
  // one before mounting the next (single-open at level 1).
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
          topCrumb: i18n.getLocale() === "en" ? "Assemble" : "Сборка",
          level1: i18n.getLocale() === "en" ? "Inside" : "Внутри",
          zoomOut: "Выйти на уровень выше",
        },
        renderPanel: () => {
          // single-open at level 1: drop the prior module before mounting anew.
          destroyActiveModule();
          const mount = el("div", { class: "ca-mount" });
          activeModule = initAssembly(mount, { data: resolveData(), announce });
          return mount;
        },
      })
    );

    // the level-0 stage node opens the drill; zoom-out tears the module down.
    const node = qs('[data-node="' + NODE_ID + '"]', cameraHost);
    if (node) {
      node.addEventListener("click", () => {
        camera.openNode({ id: NODE_ID, crumb: node.getAttribute("data-crumb") || "Сборка", fromEl: node });
      });
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          camera.openNode({ id: NODE_ID, crumb: node.getAttribute("data-crumb") || "Сборка", fromEl: node });
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
      // if the drill is open, re-render the panel in the new locale.
      if (camera && typeof camera.currentDepth === "function" && camera.currentDepth() > 0) {
        const fromEl = cameraHost ? qs('[data-node="' + NODE_ID + '"]', cameraHost) : null;
        camera.openNode({ id: NODE_ID, crumb: loc === "en" ? "Assemble" : "Сборка", fromEl });
      }
      announce(loc === "en" ? "Language: English" : "Язык: русский");
    });
  }

  // tear the module down on full close (zoom-out / Escape -> depth 0).
  if (cameraHost) {
    cameraHost.addEventListener("click", () => {
      if (camera && typeof camera.currentDepth === "function" && camera.currentDepth() === 0) {
        destroyActiveModule();
      }
    });
  }

  // keep teardown of the module in the page instance list too.
  instances.push({ destroy: destroyActiveModule });

  rewriteStaticText(i18n.getLocale());
}

/** Rewrite page-level static [data-i18n] strings; values live as data-ru/data-en. */
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
