/**
 * i18n.js -- active-language store + localised lookup for the RAG Guide.
 *
 * RESPONSIBILITY: hold the active locale, resolve a localised string by key
 * from a flat {ru,en} dictionary (e.g. glossary.json), expose subscribe(),
 * and fire a `lang:change` event on the document when the locale changes.
 *
 * LOCALE MODEL: EN is primary + canonical (indexed). RU is delivered
 * client-side via a shareable `?lang=ru` query param. Init precedence,
 * highest first:
 *   1. URL `?lang` (only if a supported locale) -- and it is persisted so the
 *      shared link's language sticks across navigation.
 *   2. localStorage("ragguide:lang")
 *   3. <html lang> attribute
 *   4. "en" (DEFAULT_LOCALE)
 * setLocale() writes the URL back via history.replaceState: `ru` adds/overwrites
 * `?lang=ru`; `en` STRIPS the param (param-less EN URL is canonical). All other
 * query params and the hash are preserved. Guarded for the Node harness (no
 * window/history/location) -- never throws.
 *
 * Exports a SINGLETON store (one active lang per page) plus the standard
 * init() shape. t(key, dict) resolves against a provided dictionary; the
 * store only owns the locale, not the content.
 */

const SUPPORTED = ["ru", "en"];
const DEFAULT_LOCALE = "en";
const STORAGE_KEY = "ragguide:lang";
const URL_PARAM = "lang";

/** True only for a value that is one of the supported locales. */
function isSupported(loc) {
  return SUPPORTED.includes(loc);
}

function readHtmlLang() {
  if (typeof document === "undefined" || !document.documentElement) return null;
  const raw = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  const base = raw.split("-")[0];
  return isSupported(base) ? base : null;
}

/**
 * Read the `?lang` query param, normalised, only if it names a supported
 * locale. Guarded for environments without window/location (Node harness).
 * @returns {string|null}
 */
function readUrlLang() {
  try {
    if (typeof window === "undefined" || !window.location) return null;
    const params = new URLSearchParams(window.location.search || "");
    const raw = (params.get(URL_PARAM) || "").toLowerCase().split("-")[0];
    return isSupported(raw) ? raw : null;
  } catch (_) {
    return null;
  }
}

/**
 * Reflect the active locale onto the URL via history.replaceState, preserving
 * all OTHER query params and the hash. `en` (default) strips the param so the
 * canonical EN URL is param-less; `ru` adds/overwrites it. Fully guarded for
 * the Node harness -- never throws.
 */
function writeUrlLang(locale) {
  try {
    if (typeof window === "undefined" || !window.history || !window.location) return;
    if (typeof window.history.replaceState !== "function") return;
    const loc = window.location;
    const params = new URLSearchParams(loc.search || "");
    if (locale === DEFAULT_LOCALE) {
      params.delete(URL_PARAM);
    } else {
      params.set(URL_PARAM, locale);
    }
    const qs = params.toString();
    const next = loc.pathname + (qs ? "?" + qs : "") + (loc.hash || "");
    window.history.replaceState(window.history.state, "", next);
  } catch (_) {
    /* degrade gracefully -- locale store still works without URL sync */
  }
}

// Guarded localStorage probe (mirrors chapter-state.js): null when unavailable
// -> persistence degrades to a no-op and the page still works.
function safeStorage() {
  try {
    const s = window.localStorage;
    const probe = "ragguide:__probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch (_) {
    return null;
  }
}
const store = safeStorage();

/** Read a previously persisted locale, or null. Guarded. */
function readStored() {
  if (!store) return null;
  try {
    const v = store.getItem(STORAGE_KEY);
    return isSupported(v) ? v : null;
  } catch (_) {
    return null;
  }
}

/** Persist the active locale. Guarded; never throws. */
function writeStored(locale) {
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, locale);
  } catch (_) {
    /* degrade gracefully (private mode / quota) */
  }
}

const subscribers = new Set();

// Init precedence (highest first): URL ?lang > localStorage > <html lang> > "en".
// An explicit supported ?lang MUST win over stale localStorage.
const urlLang = readUrlLang();
let active = urlLang || readStored() || readHtmlLang() || DEFAULT_LOCALE;

// A supported ?lang is the shareable source of truth: persist it so the shared
// link's language sticks across in-site navigation (where the param may drop).
if (urlLang) writeStored(urlLang);

// Reflect the resolved locale onto the document so CSS/[lang] + a11y match it
// before any subscriber wires up (no notification: nothing is subscribed yet).
if (typeof document !== "undefined" && document.documentElement) {
  document.documentElement.setAttribute("lang", active);
}

/** Current active locale ('en' | 'ru'). */
export function getLocale() {
  return active;
}

/**
 * Set the active locale; persists it, syncs the URL (?lang=ru, or strips the
 * param for the canonical EN URL), notifies subscribers and fires `lang:change`.
 */
export function setLocale(locale) {
  const next = isSupported(locale) ? locale : DEFAULT_LOCALE;
  if (next === active) {
    // Still keep storage + URL in sync even when the value is unchanged, so a
    // page that loaded EN by default ends up with a clean param-less URL.
    writeStored(next);
    writeUrlLang(next);
    return active;
  }
  active = next;
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", active);
  }
  writeStored(active);
  writeUrlLang(active);
  for (const fn of subscribers) {
    try {
      fn(active);
    } catch (_) {
      /* a subscriber error must not break the others */
    }
  }
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    document.dispatchEvent(new CustomEvent("lang:change", { detail: { locale: active } }));
  }
  return active;
}

/** Subscribe to locale changes; returns an unsubscribe fn. */
export function subscribe(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

/**
 * Resolve a localised string.
 * @param {string} key   Dictionary key.
 * @param {Object<string,{ru:string,en:string}>} dict  Flat {ru,en} dictionary.
 * @param {string} [locale]  Override the active locale.
 * @returns {string|undefined}
 */
export function t(key, dict, locale) {
  if (!dict) return undefined;
  const entry = dict[key];
  if (!entry) return undefined;
  const loc = locale || active;
  return entry[loc] != null ? entry[loc] : entry.en;
}

/**
 * Standard module shape. The active locale is already resolved at import time
 * (URL ?lang > localStorage > <html lang> > "en"); a forced cfg.locale overrides
 * it on mount.
 */
export function init(rootEl, config) {
  const cfg = config || {};
  if (cfg.locale) setLocale(cfg.locale);
  return {
    getLocale,
    setLocale,
    subscribe,
    t,
    destroy() {},
  };
}
