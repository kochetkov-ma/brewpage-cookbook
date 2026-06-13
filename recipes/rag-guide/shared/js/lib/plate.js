/**
 * plate.js -- framed antique-plate stage handle (AtlasMD 3.2).
 *
 * RESPONSIBILITY: the plate is a structural shell (frame, corner ticks,
 * vignette) authored in markup + base.css. This module is a thin handle that
 * exposes the stage region a drill camera scales/translates and reports the
 * authored aria-labelledby target. No literal styling here; structure lives in
 * base.css (.plate / .atlas). One responsibility: hand back stage refs + a
 * grow-to-fit helper so a detail panel can set the frame min-height (no
 * scroll-jail -- AtlasMD 3.6 / do-not #8).
 *
 * Host: [data-component="plate"] (the framed <section>).
 * Slot: [data-slot="stage"] (optional zoom stage inside the plate).
 * Config: none.
 *
 * export function init(rootEl, config) -> { stageEl, growToFit(px), reset(), destroy() }
 */

import { qs } from "./dom.js";

export function init(rootEl, config) {
  const stageEl = qs('[data-slot="stage"]', rootEl) || null;

  return {
    /** The zoom stage region inside the plate (may be null on a plain plate). */
    stageEl,

    /** Grow the plate to a content height so a drill panel never clips. */
    growToFit(px) {
      if (rootEl && typeof px === "number" && px > 0) {
        rootEl.style.minHeight = px + "px";
      }
    },

    /** Release any grow-to-fit min-height. */
    reset() {
      if (rootEl) rootEl.style.minHeight = "";
    },

    destroy() {
      this.reset();
    },
  };
}
