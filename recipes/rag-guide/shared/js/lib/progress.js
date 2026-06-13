/**
 * progress.js -- earned-progress strip with a MAIN-PATH completion model
 * (AtlasMD 3.7 + the unified progress/navigation refinement).
 *
 * RESPONSIBILITY: the brass-plate cartouche that conveys EARNED route progress.
 * NEUTRAL on load (0 / mainPathLen, fill width 0). A step counts as DONE only
 * when it is OPENED *and* it belongs to the section's ordered MAIN PATH (the
 * linear teaching backbone). Opening a step that is NOT on the main path is
 * tracked as "explored" (a SIDE path) but does NOT increment the counter and
 * does NOT gate completion. Idempotent + session-only for the strip itself
 * (chapter status persistence is a separate concern -- chapter-state.js).
 *
 * isComplete() is true ONLY when every main-path step is done. nextStep()
 * returns the next uncompleted main-path id so callers can highlight the
 * affordance that opens it (guiding the user start-to-end). The current/next
 * marker is still tracked so callers can paint a faint rust "вы здесь" (NOT
 * green -- AtlasMD principle 7). Under reduced motion the fill width snaps
 * (handled in base.css via the reduce media query disabling transitions).
 *
 * Host: [data-component="progress"].
 * Config: {
 *   mainPath: string[],   // REQUIRED ordered backbone; counter = mainPath.length
 *   order?:    string[],   // legacy alias: if mainPath absent, used as the path
 *   total?:    number,     // override the denominator (defaults to mainPath.length)
 *   labels?:  { count(n,total), done },
 *   onChange?: (state) => void,  // fired after any progress mutation; state =
 *                                // { done:Set, explored:Set, complete:bool, nextStep }
 * }
 *
 * Renders into (creates if absent):
 *   .pcount (counter), .ptrack > .pfill (fill), .pdone (complete msg)
 *
 * export function init(rootEl, config) -> {
 *   markOpened(id),        // open a step (main -> done; side -> explored)
 *   markVisited(id),       // alias of markOpened (back-compat with callers)
 *   markCurrent(id?),      // set the current/"вы здесь" marker (default nextStep)
 *   renderProgress(),
 *   doneCount(), visitedCount(),   // both = number of DONE main-path steps
 *   isVisited(id),         // true when id is a DONE main-path step
 *   isExplored(id),        // true when a SIDE step has been opened
 *   isComplete(),          // all main-path steps done
 *   nextStep(),            // next uncompleted main-path id (null when complete)
 *   nextUnvisited(),       // alias of nextStep
 *   getCurrent(),
 *   reset(), destroy()
 * }
 */

import { qs, el, clear } from "./dom.js";

export function init(rootEl, config) {
  const cfg = config || {};
  // mainPath is the ordered backbone; fall back to legacy `order`.
  const mainPath = Array.isArray(cfg.mainPath)
    ? cfg.mainPath.slice()
    : Array.isArray(cfg.order)
    ? cfg.order.slice()
    : [];
  const mainSet = new Set(mainPath);
  const total = typeof cfg.total === "number" ? cfg.total : mainPath.length;
  const labels = cfg.labels || {};
  const onChange = typeof cfg.onChange === "function" ? cfg.onChange : null;
  const countLabel =
    typeof labels.count === "function"
      ? labels.count
      : (n, t) => `Пройдено ${n} / ${t}`;
  const doneLabel = labels.done || "Маршрут пройден";

  const done = new Set(); // main-path steps the user has opened
  const explored = new Set(); // side steps the user has opened (not counted)
  let current = null;

  // Locate or build the strip parts so the partial can ship just the host.
  let pcount = rootEl ? qs(".pcount", rootEl) : null;
  let ptrack = rootEl ? qs(".ptrack", rootEl) : null;
  let pfill = rootEl ? qs(".pfill", rootEl) : null;
  let pdone = rootEl ? qs(".pdone", rootEl) : null;

  if (rootEl && (!pcount || !ptrack || !pfill || !pdone)) {
    clear(rootEl);
    pcount = el("span", { class: "pcount" });
    pfill = el("span", { class: "pfill" });
    ptrack = el("div", { class: "ptrack", attrs: { "aria-hidden": "true" } }, [pfill]);
    pdone = el("span", { class: "pdone", text: doneLabel });
    rootEl.appendChild(pcount);
    rootEl.appendChild(ptrack);
    rootEl.appendChild(pdone);
  }

  function renderProgress() {
    if (!rootEl) return;
    const n = done.size;
    const frac = total > 0 ? n / total : 0;
    if (pcount) {
      pcount.innerHTML = "";
      // "Пройдено N / M" + a glanceable percent suffix "(P%)". The percent
      // reflects THIS context's own N/M (section = main-path steps; the landing
      // counts chapters via its own renderer, not this module).
      const pctNum = Math.round(frac * 100);
      pcount.appendChild(document.createTextNode(countLabel(n, total) + " (" + pctNum + "%)"));
    }
    if (pfill) pfill.style.width = Math.round(frac * 100) + "%";
    rootEl.classList.toggle("in-progress", n > 0 && n < total);
    rootEl.classList.toggle("complete", total > 0 && n >= total);
  }

  function fireChange() {
    if (!onChange) return;
    onChange({
      done: new Set(done),
      explored: new Set(explored),
      complete: isComplete(),
      nextStep: nextStep(),
    });
  }

  // Open a step. Main-path steps increment the counter; side steps are tracked
  // as "explored" only. Returns true on a NEW main-path completion.
  function markOpened(id) {
    if (id == null) {
      renderProgress();
      return false;
    }
    if (mainSet.has(id)) {
      if (done.has(id)) {
        renderProgress();
        return false;
      }
      done.add(id);
      renderProgress();
      fireChange();
      return true;
    }
    // side path: record but never count toward completion
    if (!explored.has(id)) {
      explored.add(id);
      fireChange();
    }
    renderProgress();
    return false;
  }

  // next uncompleted main-path id (null when the path is complete)
  function nextStep() {
    for (const id of mainPath) {
      if (!done.has(id)) return id;
    }
    return null;
  }

  function markCurrent(id) {
    current = id != null ? id : nextStep();
    return current;
  }

  function isComplete() {
    return total > 0 && done.size >= total;
  }

  function reset() {
    done.clear();
    explored.clear();
    current = null;
    renderProgress();
    fireChange();
  }

  renderProgress();

  return {
    markOpened,
    markVisited: markOpened, // back-compat alias (callers still call markVisited)
    markCurrent,
    renderProgress,
    nextStep,
    nextUnvisited: nextStep, // back-compat alias
    doneCount: () => done.size,
    visitedCount: () => done.size,
    isVisited: (id) => done.has(id),
    isExplored: (id) => explored.has(id),
    getCurrent: () => current,
    isComplete,
    mainPath: () => mainPath.slice(),
    reset,
    destroy() {
      /* session-only strip state; nothing persistent to clean up here */
    },
  };
}
