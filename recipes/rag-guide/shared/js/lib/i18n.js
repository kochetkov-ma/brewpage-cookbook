/**
 * i18n.js -- active-language store + localised lookup for the RAG Guide.
 *
 * RESPONSIBILITY: hold the active locale (restored from localStorage if a prior
 * choice exists, else read from <html lang>; default RU),
 * resolve a localised string by key from a flat {ru,en} dictionary (e.g.
 * glossary.json), expose subscribe(), and fire a `lang:change` event on the
 * document when the locale changes. Prototype ships RU-first but stays
 * data-driven (no hard-coded copy here).
 *
 * Exports a SINGLETON store (one active lang per page) plus the standard
 * init() shape. t(key, dict) resolves against a provided dictionary; the
 * store only owns the locale, not the content.
 */

const SUPPORTED = ["ru", "en"];
const DEFAULT_LOCALE = "ru";
const STORAGE_KEY = "ragguide:lang";

function readHtmlLang() {
  const raw = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  const base = raw.split("-")[0];
  return SUPPORTED.includes(base) ? base : DEFAULT_LOCALE;
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
    return SUPPORTED.includes(v) ? v : null;
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
// Restore a persisted choice across pages/reloads; fall back to <html lang>.
let active = readStored() || readHtmlLang();
// Reflect the restored locale onto the document so CSS/[lang] + a11y match it
// before any subscriber wires up (no notification: nothing is subscribed yet).
if (typeof document !== "undefined" && document.documentElement) {
  document.documentElement.setAttribute("lang", active);
}

/** Current active locale ('ru' | 'en'). */
export function getLocale() {
  return active;
}

/** Set the active locale; notifies subscribers and fires `lang:change`. */
export function setLocale(locale) {
  const next = SUPPORTED.includes(locale) ? locale : DEFAULT_LOCALE;
  if (next === active) return active;
  active = next;
  document.documentElement.setAttribute("lang", active);
  writeStored(active);
  for (const fn of subscribers) {
    try {
      fn(active);
    } catch (_) {
      /* a subscriber error must not break the others */
    }
  }
  document.dispatchEvent(new CustomEvent("lang:change", { detail: { locale: active } }));
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

/** Standard module shape; reads <html lang> (or a forced locale) on mount. */
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
