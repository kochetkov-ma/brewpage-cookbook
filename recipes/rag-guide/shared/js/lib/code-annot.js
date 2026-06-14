/**
 * code-annot.js -- hover/focus popover annotation layer over line-range regions
 * of a highlighted code block (Atlas dark-code-plate).
 *
 * RESPONSIBILITY: given a <code> whose source lines have each been wrapped in a
 * line element (see LINE-HOOK CONTRACT below) and a regions[] array, wrap each
 * region's inclusive line range in a focusable `.ca-region` element and, on
 * hover/focus, show a non-modal `.ca-popover` carrying the region label +
 * explanation. Click/Enter/Space PINS one popover at a time; Esc closes + returns
 * focus. Zero external requests, no framework, no global state.
 *
 * LINE-HOOK CONTRACT (shared with code-blocks.js; the harness asserts these)
 * -------------------------------------------------------------------------
 *   - The consumer (code-blocks.js) splits the highlighter output into one line
 *     element PER SOURCE LINE:
 *         <span class="cl" data-line="N">...highlighted tokens...</span>
 *     where N is 1-based and lines are emitted in source order, newline-joined
 *     ("\n" text nodes BETWEEN the .cl spans, never inside them). Token spans
 *     from code-highlight.js (`.tok.tok-*`) live INSIDE each `.cl`.
 *   - code-annot wraps the inclusive range [start..end] of `.cl` rows for a
 *     region in a single grouping element:
 *         <span class="ca-region" data-region="<id>" role="button" tabindex="0"
 *               aria-expanded="false" aria-controls="<popoverId>"
 *               aria-label="<region.label[locale]>">  ...the .cl rows...  </span>
 *     Wrapping only moves existing `.cl` nodes (and the "\n" between them) inside
 *     the `.ca-region`; it never rewrites token HTML, so the highlighter output
 *     is preserved byte-for-byte.
 *   - Popovers are appended to a single `.ca-layer` host inside rootEl and
 *     referenced by aria-controls; one pinned popover at a time.
 *
 * init(rootEl, config) -> { destroy() }
 *   rootEl  -- the block container (the <figure> or its <pre>); regions are
 *              wrapped within it and popovers mounted to a layer inside it.
 *   config:
 *     regions  : Array<{ id, lines:[start,end], label:{ru,en}|string,
 *                        explain:{ru,en}|string }>   (1-based inclusive, sorted,
 *                non-overlapping; out-of-range/overlapping entries are skipped)
 *     locale   : "ru" | "en"            -- active locale for label/explain
 *     lineSelector : optional CSS for the line elements (default ".cl")
 *     lineHost : optional element to query lines within (default rootEl)
 *     announce : optional (msg) => void -- a11y live announcer
 *
 * Reduced-motion-safe: the popover has NO show/hide transition; an explicit
 * prefersReducedMotion guard is kept anyway. CSS owns the focus ring (--c-focus).
 * No-JS path is the static <ol class="code-annot-list no-js-only">; this dynamic
 * layer is the .js-only path (class toggles owned by code-blocks.js / CSS).
 */

import { el, qsa, clear, listeners } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

let popoverSeq = 0;

/** Pick a localized field that may be a {ru,en} object or a bare string. */
function pick(field, locale) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field[locale] != null ? field[locale] : field.ru != null ? field.ru : field.en || "";
}

/**
 * Validate + normalize regions against the available line count. Drops entries
 * that are out of range, mis-shaped, or overlap an already-accepted region.
 * Returns accepted regions sorted by start line.
 */
function normalizeRegions(regions, lineCount) {
  const out = [];
  const list = Array.isArray(regions) ? regions.slice() : [];
  list.sort((a, b) => lineStart(a) - lineStart(b));
  let lastEnd = 0;
  for (const r of list) {
    if (!r || !Array.isArray(r.lines) || r.lines.length < 2) continue;
    const start = r.lines[0];
    const end = r.lines[1];
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    if (start < 1 || end < start || end > lineCount) continue;
    if (start <= lastEnd) continue; // overlaps a prior region -> skip
    out.push(r);
    lastEnd = end;
  }
  return out;
}

function lineStart(r) {
  return r && Array.isArray(r.lines) ? r.lines[0] : 0;
}

export function init(rootEl, config) {
  const cfg = config || {};
  const host = rootEl;
  const lineHost = cfg.lineHost || host;
  const lineSelector = cfg.lineSelector || ".cl";
  let locale = cfg.locale || "ru";
  const announce = typeof cfg.announce === "function" ? cfg.announce : null;
  // The popover has no show/hide transition in CSS; this explicit guard keeps a
  // hard no-motion contract even if a future style adds one. Read once.
  const reducedMotion = prefersReducedMotion();

  const L = listeners();

  // Index the per-line nodes by their 1-based data-line.
  const lineNodes = qsa(lineSelector, lineHost);
  const lineByNum = new Map();
  lineNodes.forEach((node) => {
    const n = parseInt(node.getAttribute("data-line"), 10);
    if (Number.isInteger(n)) lineByNum.set(n, node);
  });

  const regions = normalizeRegions(cfg.regions, lineNodes.length);

  // Popover layer: one host inside rootEl holding every region's popover.
  const layer = el("div", {
    class: reducedMotion ? "ca-layer ca-layer--reduced" : "ca-layer",
    attrs: { "aria-hidden": "false" },
  });
  host.appendChild(layer);

  // Per-region runtime records: { region, wrapper, popover }.
  const records = [];
  let pinned = null; // the currently pinned record (only one at a time)
  let previewing = null; // record shown by hover/focus but not pinned

  buildRegions();

  // Reposition / close the open popover on scroll + resize. Scroll is passive
  // (we never preventDefault) and rAF-throttled so a fast scroll runs the
  // reposition-or-close work at most once per frame. capture:true keeps catching
  // scrolls on ancestor scroll containers, not just the window.
  let viewportRaf = 0;
  function onScroll() {
    if (viewportRaf) return;
    viewportRaf = requestAnimationFrame(() => {
      viewportRaf = 0;
      onViewportChange();
    });
  }
  L.on(window, "scroll", onScroll, { passive: true, capture: true });
  L.on(window, "resize", onViewportChange);

  function buildRegions() {
    for (const region of regions) {
      const [start, end] = region.lines;
      const first = lineByNum.get(start);
      if (!first) continue;

      const wrapper = el("span", {
        class: "ca-region",
        dataset: { region: region.id },
        attrs: {
          role: "button",
          tabindex: "0",
          "aria-expanded": "false",
          "aria-label": pick(region.label, locale),
        },
      });

      // Move the inclusive run of line nodes (and the "\n" text nodes between
      // them) into the wrapper, preserving the highlighter output exactly.
      const parent = first.parentNode;
      parent.insertBefore(wrapper, first);
      let cursor = first;
      const lastNode = lineByNum.get(end) || first;
      while (cursor) {
        const next = cursor.nextSibling;
        wrapper.appendChild(cursor);
        if (cursor === lastNode) break;
        cursor = next;
      }

      const popover = buildPopover(region);
      const popId = popover.id;
      wrapper.setAttribute("aria-controls", popId);
      layer.appendChild(popover);

      const rec = { region, wrapper, popover };
      records.push(rec);
      wireRegion(rec);
    }
  }

  function buildPopover(region) {
    popoverSeq += 1;
    const id = "ca-pop-" + popoverSeq;
    const pop = el("div", {
      id,
      class: "ca-popover",
      attrs: { role: "group", "aria-label": pick(region.label, locale), hidden: true },
    });
    const title = el("p", { class: "ca-popover__label", text: pick(region.label, locale) });
    const body = el("p", { class: "ca-popover__explain", text: pick(region.explain, locale) });
    pop.appendChild(title);
    pop.appendChild(body);
    // NB: the popover itself is never focusable (no tabindex, role="group"), so a
    // keydown listener here could never fire -- the LIVE Esc-close+focus-restore
    // path is the region-level handler in wireRegion (Vcb5). No dead handler here.
    // The .ca-region keeps role="button" (it IS the activatable control; on a
    // multi-line band it wraps several .cl rows but is still one button target).
    return pop;
  }

  function wireRegion(rec) {
    const { wrapper } = rec;
    // hover / focus => preview (non-pinned show)
    L.on(wrapper, "mouseenter", () => preview(rec));
    L.on(wrapper, "mouseleave", () => unpreview(rec));
    L.on(wrapper, "focus", () => preview(rec));
    L.on(wrapper, "blur", () => unpreview(rec));
    // click / Enter / Space => pin (stays open)
    L.on(wrapper, "click", () => toggle(rec));
    L.on(wrapper, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle(rec);
      }
    });
    // Esc on the region closes its own popover (a11y.onEscape -> handler).
    L.on(wrapper, "keydown", (e) => {
      if (e.key === "Escape" && (pinned === rec || previewing === rec)) close(rec, true);
    });
  }

  function preview(rec) {
    if (pinned) return; // a pinned popover takes precedence over hover preview
    if (previewing && previewing !== rec) hide(previewing);
    previewing = rec;
    show(rec);
  }

  function unpreview(rec) {
    if (pinned === rec) return; // keep pinned open
    if (previewing === rec) {
      hide(rec);
      previewing = null;
    }
  }

  function toggle(rec) {
    if (pinned === rec) {
      close(rec, true);
      return;
    }
    if (pinned && pinned !== rec) close(pinned, false);
    if (previewing && previewing !== rec) {
      hide(previewing);
      previewing = null;
    }
    pinned = rec;
    show(rec);
    if (announce) announce(pick(rec.region.label, locale));
  }

  function close(rec, returnFocus) {
    if (!rec) return;
    if (pinned === rec) pinned = null;
    if (previewing === rec) previewing = null;
    hide(rec);
    if (returnFocus && typeof rec.wrapper.focus === "function") rec.wrapper.focus();
  }

  // aria-expanded tracks POPOVER VISIBILITY (preview OR pinned), not just pin, so
  // a screen reader's expanded state matches the visible popover in every case.
  function show(rec) {
    rec.popover.hidden = false;
    rec.wrapper.setAttribute("aria-expanded", "true");
    position(rec);
  }

  function hide(rec) {
    rec.popover.hidden = true;
    rec.wrapper.setAttribute("aria-expanded", "false");
  }

  /**
   * Position the popover below the region by default, flipping above if it would
   * overflow the viewport bottom. Coordinates are page-relative (layer is the
   * positioning context; we use absolute offsets from the host).
   */
  function position(rec) {
    const pop = rec.popover;
    const wrapRect = rec.wrapper.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();

    // measure popover (it is visible but we read its natural size)
    const popW = pop.offsetWidth;
    const popH = pop.offsetHeight;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;

    // vertical: below by default, flip above on overflow
    const below = wrapRect.bottom + popH <= vh || wrapRect.top - popH < 0;
    let top = below ? wrapRect.bottom - hostRect.top : wrapRect.top - hostRect.top - popH;

    // horizontal: align to region left, clamp into viewport
    let left = wrapRect.left - hostRect.left;
    const absLeft = wrapRect.left;
    if (absLeft + popW > vw) {
      left -= absLeft + popW - vw + 8;
    }
    if (left < 0) left = 0;

    pop.style.top = Math.round(top) + "px";
    pop.style.left = Math.round(left) + "px";
    pop.classList.toggle("ca-popover--above", !below);
  }

  function onViewportChange() {
    // Reposition the open popover; if its region scrolled fully out of view, close.
    const open = pinned || previewing;
    if (!open) return;
    const r = open.wrapper.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.bottom < 0 || r.top > vh) {
      close(open, false);
    } else {
      position(open);
    }
  }

  /** Re-render popover label/explain text for a new locale (no rewrap). */
  function setLocale(nextLocale) {
    locale = nextLocale || locale;
    for (const rec of records) {
      const label = pick(rec.region.label, locale);
      const explain = pick(rec.region.explain, locale);
      rec.wrapper.setAttribute("aria-label", label);
      rec.popover.setAttribute("aria-label", label);
      const lbl = rec.popover.querySelector(".ca-popover__label");
      const exp = rec.popover.querySelector(".ca-popover__explain");
      if (lbl) lbl.textContent = label;
      if (exp) exp.textContent = explain;
    }
  }

  return {
    setLocale,
    /** Test/debug hook: how many regions actually mounted. */
    regionCount() {
      return records.length;
    },
    destroy() {
      L.off();
      if (viewportRaf) {
        cancelAnimationFrame(viewportRaf);
        viewportRaf = 0;
      }
      // unwrap: move each region's children back out, then drop the wrapper
      for (const rec of records) {
        const wrap = rec.wrapper;
        const parent = wrap.parentNode;
        if (parent) {
          while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
          parent.removeChild(wrap);
        }
      }
      records.length = 0;
      pinned = null;
      previewing = null;
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      clear(layer);
    },
  };
}
