/**
 * landing.js -- page glue for the RAG Guide Atlas MAP landing (AtlasMD).
 *
 * Sets .has-js (flips .js-only / .no-js-only), finds the documented hosts by
 * data-component / data-slot, fetches the trail data (nav.json), inits the lib
 * modules the map needs (a11y announcer, i18n store, compass, plate, progress,
 * map-route), collects the instances and calls destroy() on pagehide. All
 * behaviour lives in the lib modules; this file only wires hosts + supplies the
 * active-language copy + UI strings. (recipe-site-architect owns wiring;
 * interactive-engineer owns lib internals.)
 *
 * Hosts wired:
 *   [data-component="compass"]    -> compass.js
 *   [data-component="plate"]      -> plate.js
 *   [data-component="progress"]   -> progress.js
 *   [data-component="trail"]      -> map-route.js (route + flags + field note)
 *   [data-component="lang-toggle"]-> i18n.setLocale on click
 *   [data-component="a11y-live"]  -> a11y.js announcer (created if absent)
 */

import { qs, qsa, fetchJson, stripMeta } from "../lib/dom.js";
import * as a11y from "../lib/a11y.js";
import * as i18n from "../lib/i18n.js";
import { init as initCompass } from "../lib/compass.js";
import { init as initPlate } from "../lib/plate.js";
import { init as initMapRoute } from "../lib/map-route.js";
import * as chapterState from "../lib/chapter-state.js";
import { init as initSiteVersion } from "../lib/site-version.js";

document.documentElement.classList.add("has-js");

const DATA_SRC = "shared/data/nav.json";

const instances = [];
function track(inst) {
  if (inst && typeof inst.destroy === "function") instances.push(inst);
  return inst;
}

async function boot() {
  // footer version stamp (progressive enhancement; no-op if slot absent)
  track(initSiteVersion(document, {}));
  let data;
  try {
    data = stripMeta(await fetchJson(DATA_SRC));
  } catch (err) {
    // No-JS-grade fallback already in the page; just stop enhancing.
    return;
  }
  const stops = Array.isArray(data.stops) ? data.stops : [];
  const ui = data.ui || {};

  // active-language helpers (RU default, from <html lang>) ----------------
  const langStops = () =>
    stops.map((s) => {
      const loc = i18n.getLocale();
      const copy = s[loc] || s.en || {};
      return {
        id: s.id,
        slug: s.slug,
        href: s.href,
        label: copy.label,
        blurb: copy.blurb,
        pts: copy.pts || [],
        ex: copy.ex,
      };
    });
  const langStrings = () => ui[i18n.getLocale()] || ui.en || {};

  // a11y live-region announcer (scoped) -----------------------------------
  const liveHost = qs('[data-component="a11y-live"]') || document.body;
  const announcer = track(a11y.init(liveHost, { politeness: "polite" }));
  const announce = (msg) => announcer.announce(msg);

  // i18n store handle ------------------------------------------------------
  track(i18n.init(document.documentElement, {}));

  // compass (inert) --------------------------------------------------------
  const compassHost = qs('[data-component="compass"]');
  if (compassHost) track(initCompass(compassHost, {}));

  // plate (stage shell handle) --------------------------------------------
  const plateHost = qs('[data-component="plate"]') || qs('[data-component="trail"]');
  const plate = plateHost ? track(initPlate(plateHost, {})) : null;

  // map progress strip -- counts COMPLETED chapters only (real, persisted) ---
  // Driven by the map-route repaint counts, NOT by opening flags. Neutral on
  // load; greens only as sections are actually completed (state from storage).
  const progressHost = qs('[data-component="progress"]');
  const paintStrip = (counts) => {
    if (!progressHost) return;
    const n = counts.done;
    const t = counts.total || stops.length;
    const frac = t > 0 ? n / t : 0;
    const pcount = qs(".pcount", progressHost);
    const pfill = qs(".pfill", progressHost);
    if (pcount) {
      const pctNum = Math.round(frac * 100);
      pcount.textContent =
        (i18n.getLocale() === "en" ? `Visited ${n} / ${t}` : `Пройдено ${n} / ${t}`) +
        ` (${pctNum}%)`;
    }
    if (pfill) pfill.style.width = Math.round(frac * 100) + "%";
    progressHost.classList.toggle("in-progress", n > 0 && n < t);
    progressHost.classList.toggle("complete", t > 0 && n >= t);
    const pdone = qs(".pdone", progressHost);
    if (pdone) pdone.textContent = i18n.getLocale() === "en" ? "Route complete" : "Маршрут пройден";
  };

  // the expedition map -----------------------------------------------------
  const trailHost = qs('[data-component="trail"]');
  let trail = null;
  if (trailHost) {
    trail = track(
      initMapRoute(trailHost, {
        routeD: data.routeD,
        getStops: langStops,
        getStrings: langStrings,
        // 3-state chapter flags come from persisted section progress; opening a
        // flag never changes state (the map only READS storage here).
        getChapterState: (slug) => chapterState.getState(slug),
        // per-chapter progress fraction { done, total, pct, state } for the
        // status label (REQ-1) + the opened field-note percent (REQ-2)
        getChapterProgress: (slug) => chapterState.getProgress(slug),
        getLocale: () => i18n.getLocale(),
        onChaptersPaint: paintStrip,
        announce,
      })
    );
  }

  // re-read persisted chapter state when returning to the tab / map, so a
  // section just completed in this (or another) tab reflects on the flags.
  const repaint = () => {
    if (trail && typeof trail.repaintChapters === "function") trail.repaintChapters();
  };
  window.addEventListener("focus", repaint);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) repaint();
  });

  // lang-toggle: drive the i18n store; data-i18n text is rewritten here,
  // map + progress re-render via the lang:change event subscribers ---------
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
      announce(loc === "en" ? "Language: English" : "Язык: русский");
    });
  }

  // static [data-i18n] text (header brand, hero, titles) -------------------
  rewriteStaticText(i18n.getLocale());
}

/**
 * Rewrite the page-level static [data-i18n] strings (header/hero/titles).
 * Values live on the element as data-ru / data-en so the page is meaningful
 * with JS off (server-rendered RU text), and switch in place when JS runs.
 */
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
