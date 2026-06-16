/**
 * a11y.js -- shared accessibility helpers for the RAG Guide interactive lib.
 *
 * RESPONSIBILITY: focus trap/restore, ESC handling, a prefers-reduced-motion
 * query helper, and a live-region announcer. Keyboard parity for every
 * pointer interaction is built on these.
 *
 * Exposes named helpers AND the standard init() shape. init(rootEl, config)
 * returns an instance whose .announce()/.destroy() drive a scoped aria-live
 * region; the named helpers (focusTrap, onEscape, prefersReducedMotion,
 * focusable) are used directly by other modules.
 */

import { el, on } from "./dom.js";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** True if the user asked for reduced motion. */
export function prefersReducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Subscribe to reduced-motion changes; returns an unsubscribe fn. */
export function onReducedMotionChange(handler) {
  if (typeof matchMedia !== "function") return () => {};
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const fn = () => handler(mq.matches);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

/** All visible focusable descendants of a container, in DOM order. */
export function focusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (node) => node.offsetParent !== null || node === document.activeElement
  );
}

/**
 * Trap Tab focus inside a container. Restores focus to the previously active
 * element on release.
 * @returns {{ release(): void }}
 */
export function focusTrap(container) {
  const previouslyFocused = document.activeElement;
  const offTab = on(container, "keydown", (e) => {
    if (e.key !== "Tab") return;
    const items = focusable(container);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
  return {
    release() {
      offTab();
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    },
  };
}

/** Run handler on Escape within target; returns an unbind fn. */
export function onEscape(target, handler) {
  return on(target, "keydown", (e) => {
    if (e.key === "Escape") handler(e);
  });
}

/**
 * Live-region announcer scoped to rootEl.
 * @param {Element} rootEl
 * @param {{ announce?: boolean, politeness?: 'polite'|'assertive' }} [config]
 */
export function init(rootEl, config) {
  const cfg = config || {};
  const enabled = cfg.announce !== false;
  let region = null;

  if (enabled) {
    region = el("div", {
      class: "visually-hidden",
      attrs: {
        "aria-live": cfg.politeness || "polite",
        "aria-atomic": "true",
        role: "status",
      },
    });
    rootEl.appendChild(region);
  }

  let clearTimer = null;
  let rafId = null;

  return {
    /** Announce a message via the live region. */
    announce(message) {
      if (!region) return;
      region.textContent = "";
      // Re-set on the next frame so repeated identical messages still fire.
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (region) region.textContent = message;
      });
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        if (region) region.textContent = "";
      }, 4000);
    },
    destroy() {
      if (clearTimer) clearTimeout(clearTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (region && region.parentNode) region.parentNode.removeChild(region);
      region = null;
    },
  };
}
