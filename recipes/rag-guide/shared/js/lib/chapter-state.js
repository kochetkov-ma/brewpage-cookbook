/**
 * chapter-state.js -- persisted per-chapter completion state (the unified
 * progress/navigation refinement, requirement 3).
 *
 * RESPONSIBILITY: a tiny, dependency-free, GUARDED localStorage wrapper that
 * records the REAL completion state of each built section so the Atlas MAP
 * (index.html) can paint three flag states on return:
 *   - (absent)    -> NOT STARTED (neutral, the default look)
 *   - "started"   -> at least one main-path step done, but not the full path
 *   - "done"      -> the full main path was completed
 *
 * Keys (backward compatible):
 *   `ragguide:chapter:<slug>`       = "started" | "done"   (the 3-state FLAG)
 *   `ragguide:chapter:<slug>:frac`  = "<done>/<total>"     (the PROGRESS fraction)
 * A section calls markStarted(slug) on its first main-path step and
 * markDone(slug) on full completion; it ALSO calls setProgress(slug, done,
 * total) as the main path advances so the map can show a per-chapter percent.
 * The map reads getState(slug) + getProgress(slug) on load and on
 * focus/visibilitychange.
 *
 * setProgress is the unified writer: it persists the fraction AND keeps the
 * legacy flag in sync (done>=1 -> at least "started"; done>=total -> "done").
 * The standalone flag setters (markStarted/markDone) remain for callers that
 * only know the flag, and never regress an existing fraction.
 *
 * HARD rules:
 *   - Opening a chapter flag must NOT write here (the map never calls a setter).
 *   - "done" is terminal: markStarted never downgrades a "done" chapter; a
 *     stored fraction never shrinks back below a previously recorded one.
 *   - ALL storage access is wrapped in try/catch; if storage is unavailable
 *     (private mode, disabled, quota) every call degrades to a no-op / null and
 *     the site still works (the map just shows neutral flags).
 *
 * No init() factory -- this is a stateless helper module (named exports only).
 * (It is not a mountable lib component, so it does not follow the init contract.)
 */

const PREFIX = "ragguide:chapter:";
const FRAC_SUFFIX = ":frac";
const STARTED = "started";
const DONE = "done";

// Probe storage ONCE, guarded. null when unavailable -> all ops degrade.
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

function keyFor(slug) {
  return PREFIX + String(slug);
}
function fracKeyFor(slug) {
  return PREFIX + String(slug) + FRAC_SUFFIX;
}

// Parse a "<done>/<total>" string into { done, total } (or null). Guarded so a
// corrupt / legacy value never throws.
function parseFrac(raw) {
  if (typeof raw !== "string") return null;
  const m = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const done = parseInt(m[1], 10);
  const total = parseInt(m[2], 10);
  if (!isFinite(done) || !isFinite(total) || total <= 0) return null;
  return { done: Math.max(0, Math.min(done, total)), total };
}

function pctOf(done, total) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Read a chapter's persisted state: "started" | "done" | null. */
export function getState(slug) {
  if (!store || slug == null) return null;
  try {
    const v = store.getItem(keyFor(slug));
    return v === STARTED || v === DONE ? v : null;
  } catch (_) {
    return null;
  }
}

/** Mark a chapter started (>=1 main-path step done). Never downgrades "done". */
export function markStarted(slug) {
  if (!store || slug == null) return;
  try {
    if (store.getItem(keyFor(slug)) === DONE) return; // terminal
    store.setItem(keyFor(slug), STARTED);
  } catch (_) {
    /* degrade gracefully */
  }
}

/** Mark a chapter done (full main path complete). Terminal. */
export function markDone(slug) {
  if (!store || slug == null) return;
  try {
    store.setItem(keyFor(slug), DONE);
    // keep the fraction consistent with "done" if a total is already known
    const existing = parseFrac(store.getItem(fracKeyFor(slug)));
    if (existing && existing.total > 0) {
      store.setItem(fracKeyFor(slug), existing.total + "/" + existing.total);
    }
  } catch (_) {
    /* degrade gracefully */
  }
}

/**
 * Persist a chapter's progress fraction (done-steps / total-steps) AND keep the
 * legacy flag key in sync. The unified writer the section pages call as the
 * main path advances. Never regresses a stored fraction (terminal "done" stays
 * done): a smaller `done` than already persisted is ignored.
 */
export function setProgress(slug, done, total) {
  if (!store || slug == null) return;
  const t = Number(total);
  let d = Number(done);
  if (!isFinite(t) || t <= 0) return;
  if (!isFinite(d) || d < 0) d = 0;
  if (d > t) d = t;
  try {
    const existing = parseFrac(store.getItem(fracKeyFor(slug)));
    // never shrink below a previously recorded fraction (terminal-ish)
    if (existing && existing.total === t && existing.done > d) {
      d = existing.done;
    }
    // do not downgrade a flag that already reached "done"
    const wasDone = store.getItem(keyFor(slug)) === DONE;
    store.setItem(fracKeyFor(slug), d + "/" + t);
    if (d >= t || wasDone) {
      store.setItem(keyFor(slug), DONE);
    } else if (d >= 1) {
      store.setItem(keyFor(slug), STARTED);
    }
  } catch (_) {
    /* degrade gracefully */
  }
}

/**
 * Read a chapter's progress as { done, total, pct, state }. state is the same
 * 3-state value getState returns ("started"|"done"|null). When no fraction was
 * ever persisted, falls back to the flag: "done" -> {1,1,100}, "started" ->
 * {0,0,0,state:"started"}, none -> {0,0,0,state:null}.
 */
export function getProgress(slug) {
  const state = getState(slug);
  if (store && slug != null) {
    try {
      const frac = parseFrac(store.getItem(fracKeyFor(slug)));
      if (frac) {
        // a persisted "done" flag wins even if the fraction lags
        const done = state === DONE ? frac.total : frac.done;
        return { done, total: frac.total, pct: pctOf(done, frac.total), state };
      }
    } catch (_) {
      /* fall through to flag-only */
    }
  }
  if (state === DONE) return { done: 1, total: 1, pct: 100, state };
  return { done: 0, total: 0, pct: 0, state };
}

/** Read every known chapter state as a plain object { slug: state }. */
export function readAll(slugs) {
  const out = {};
  if (!Array.isArray(slugs)) return out;
  slugs.forEach((slug) => {
    const v = getState(slug);
    if (v) out[slug] = v;
  });
  return out;
}

/** true when persistence is actually available (for diagnostics). */
export function isAvailable() {
  return !!store;
}

export const STATES = { STARTED, DONE };
