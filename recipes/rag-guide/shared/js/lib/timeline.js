/**
 * timeline.js -- generic step-sequenced animation driver.
 *
 * RESPONSIBILITY: play / pause / step / scrub over an ordered step list, on a
 * SINGLE requestAnimationFrame clock. Gates autoplay on IntersectionObserver +
 * prefers-reduced-motion. Reduced motion => no clock: each step snaps to its
 * end state and the user advances manually (identical DOM, controls become a
 * stepper). Updates .timeline__progress (inline-size %), .timeline__caption,
 * and marks the active .timeline__step. Hands each step to a renderer
 * (process-anim.js) via config.render(step, progress, atEnd).
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.steps    ordered step array (each { id, caption, duration, ... }).
 *   config.render   (step, progress0to1, atEnd) => void  visual renderer.
 *   config.autoplay start when scrolled into view (default true; ignored if reduced).
 *   config.speed    playback multiplier (default 1).
 *   config.onStep   optional (index, step) => void.
 */

import { qs, el, listeners } from "./dom.js";
import { prefersReducedMotion, onReducedMotionChange } from "./a11y.js";

export function init(rootEl, config) {
  const cfg = config || {};
  const steps = Array.isArray(cfg.steps) ? cfg.steps : [];
  const render = typeof cfg.render === "function" ? cfg.render : () => {};
  const speed = cfg.speed && cfg.speed > 0 ? cfg.speed : 1;

  const events = listeners();
  let reduced = prefersReducedMotion();
  let destroyed = false;

  // ---- controls shell ----
  let controls = qs(".timeline__controls", rootEl);
  if (!controls) {
    controls = el("div", { class: "timeline__controls" });
    rootEl.appendChild(controls);
  }
  const playBtn = el("button", { class: "btn", type: "button", text: "Play", attrs: { "aria-pressed": "false" } });
  const prevBtn = el("button", { class: "btn", type: "button", text: "Prev", attrs: { "aria-label": "Previous step" } });
  const nextBtn = el("button", { class: "btn", type: "button", text: "Next", attrs: { "aria-label": "Next step" } });

  const track = el("input", {
    class: "timeline__scrub",
    type: "range",
    attrs: {
      min: "0",
      max: String(Math.max(0, steps.length)),
      step: "0.001",
      value: "0",
      "aria-label": "Scrub worked-example progress",
    },
  });
  const trackWrap = el("div", { class: "timeline__track" });
  const progress = qs(".timeline__progress", rootEl) || el("span", { class: "timeline__progress" });
  if (!progress.parentNode) trackWrap.appendChild(progress);

  controls.append(prevBtn, playBtn, nextBtn, track, trackWrap);

  let caption = qs(".timeline__caption", rootEl);
  if (!caption) {
    caption = el("p", { class: "timeline__caption", attrs: { role: "status", "aria-live": "polite" } });
    rootEl.appendChild(caption);
  }

  const stepEls = Array.from(rootEl.querySelectorAll(".timeline__step"));

  // ---- clock state ----
  // position is a float in [0, steps.length]; integer part = completed steps,
  // fractional part = progress through the current step.
  let position = 0;
  let playing = false;
  let rafId = null;
  let lastTs = 0;
  let visible = false;

  function totalDuration(i) {
    const d = steps[i] && steps[i].duration ? steps[i].duration : 800;
    return d / speed;
  }

  function applyAt(pos) {
    position = Math.max(0, Math.min(steps.length, pos));
    const idx = Math.min(steps.length - 1, Math.floor(position));
    const frac = position - Math.floor(position);

    // progress bar across the whole sequence
    const pct = steps.length ? (position / steps.length) * 100 : 0;
    progress.style.inlineSize = pct + "%";
    if (document.activeElement !== track) track.value = String(position);

    if (steps.length === 0) return;

    const step = steps[idx];
    // when fully at the end, hold the last step's end state
    const stepProgress = position >= steps.length ? 1 : frac === 0 ? (position === 0 ? 0 : 1) : frac;
    const stepAtEnd = reduced || stepProgress >= 1 || position >= steps.length;

    caption.textContent = step.caption || "";
    stepEls.forEach((sEl) => {
      sEl.setAttribute("data-active", sEl.dataset.stepId === step.id ? "true" : "false");
    });
    render(step, reduced ? 1 : stepProgress, stepAtEnd);
    if (typeof cfg.onStep === "function") cfg.onStep(idx, step);
  }

  function tick(ts) {
    if (!playing || destroyed) return;
    if (!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;

    const idx = Math.min(steps.length - 1, Math.floor(position));
    const dur = totalDuration(idx);
    const advance = dur > 0 ? dt / dur : 1;
    let next = position + advance;
    if (next >= steps.length) {
      next = steps.length;
      applyAt(next);
      pause();
      return;
    }
    applyAt(next);
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (reduced || steps.length === 0) return;
    if (position >= steps.length) position = 0; // replay from start
    playing = true;
    lastTs = 0;
    playBtn.textContent = "Pause";
    playBtn.setAttribute("aria-pressed", "true");
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    playBtn.textContent = "Play";
    playBtn.setAttribute("aria-pressed", "false");
  }

  function toggle() {
    if (playing) pause();
    else play();
  }

  /** Jump to the END of step index (snap). Used by stepper + reduced motion. */
  function snapToStep(index) {
    pause();
    const clamped = Math.max(0, Math.min(steps.length, index + 1));
    applyAt(clamped);
  }

  function stepNext() {
    const idx = Math.floor(position - 1e-6);
    snapToStep(Math.max(idx, Math.floor(position)));
  }

  function stepPrev() {
    // go to the end of the previous step
    const cur = Math.ceil(position - 1e-6);
    snapToStep(cur - 2);
  }

  // ---- wiring ----
  events.on(playBtn, "click", toggle);
  events.on(nextBtn, "click", () => {
    const idx = Math.floor(position + 1e-6);
    snapToStep(idx);
  });
  events.on(prevBtn, "click", () => {
    const idx = Math.ceil(position - 1e-6);
    snapToStep(idx - 2);
  });
  events.on(track, "input", () => {
    pause();
    applyAt(parseFloat(track.value));
  });

  // reduced-motion: neutralise the play button (it is a no-op) WITHOUT removing
  // it from layout. `hidden` collapses the box and changes page geometry vs the
  // no-preference path; instead disable it + aria-hide it so its box stays put.
  // This keeps the reduced-motion end-state DOM/geometry identical to the
  // completed-animation end state.
  function applyReducedUi() {
    if (reduced) {
      playBtn.disabled = true;
      playBtn.setAttribute("aria-hidden", "true");
      playBtn.setAttribute("tabindex", "-1");
    } else {
      playBtn.disabled = false;
      playBtn.removeAttribute("aria-hidden");
      playBtn.removeAttribute("tabindex");
    }
  }
  const offRm = onReducedMotionChange((isReduced) => {
    reduced = isReduced;
    applyReducedUi();
    if (reduced) {
      pause();
      // Snap to the END (same rest state the animation reaches), not position 0.
      applyAt(steps.length);
    } else {
      applyAt(position);
    }
  });

  // ---- visibility gating ----
  let io = null;
  if (typeof IntersectionObserver === "function") {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (visible && cfg.autoplay !== false && !reduced && position === 0) {
            play();
          } else if (!visible) {
            pause();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(rootEl);
  } else {
    visible = true;
    if (cfg.autoplay !== false && !reduced) play();
  }

  applyReducedUi();
  // Reduced motion presents the FINAL state immediately (no clock, no motion):
  // snap to the end so progress rests at 100% and every step is in its end
  // state -- geometrically identical to the completed-animation end state.
  applyAt(reduced ? steps.length : 0);

  return {
    play,
    pause,
    stepNext,
    stepPrev,
    seek: applyAt,
    destroy() {
      destroyed = true;
      pause();
      if (io) io.disconnect();
      offRm();
      events.off();
    },
  };
}
