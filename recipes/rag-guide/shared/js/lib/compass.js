/**
 * compass.js -- compass rose handle (AtlasMD 3.1).
 *
 * RESPONSIBILITY: the compass is an INERT decorative SVG that lives in a page
 * TITLE header (never over a control/toolbar row). The SVG markup ships static
 * in the header partial; this module is a thin handle that enforces the inert
 * contract (aria-hidden, pointer-events:none, never focusable) and disables any
 * optional rose-spin under reduced motion. No state, no behaviour.
 *
 * Host: [data-component="compass"] (or a .compass svg inside a header slot).
 * Config: none.
 *
 * export function init(rootEl, config) -> { destroy() }
 */

import { qs } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

export function init(rootEl, config) {
  const svg =
    rootEl && rootEl.matches && rootEl.matches("svg.compass")
      ? rootEl
      : qs("svg.compass", rootEl) || qs(".compass", rootEl);

  if (svg) {
    // Enforce the inert contract regardless of authored markup.
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.pointerEvents = "none";
    // The canonical compass is STATIC; never spin under reduced motion.
    if (prefersReducedMotion()) svg.classList.add("no-spin");
  }

  return {
    destroy() {
      /* nothing to tear down: inert decoration */
    },
  };
}
