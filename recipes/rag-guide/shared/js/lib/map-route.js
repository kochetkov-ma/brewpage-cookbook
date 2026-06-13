/**
 * map-route.js -- landing expedition map (AtlasMD 3.12 + 3.3b + 3.11).
 *
 * RESPONSIBILITY: the landing-page map behaviour. Owns:
 *   - route draw-in (one-shot stroke-dashoffset, gated by reduced-motion) [3.12]
 *   - flag pins sampled ON the route + the desktop legend index + the mobile
 *     vertical route (the primary mobile nav) [3.3b / 3.12]
 *   - the field-note open/close/toggle (single-open) in place [3.11]
 *   - flag -> section navigation (a "go to chapter" link inside the note for
 *     stops that map to a built section page) [interaction model]
 *   - mobile horizontal scroller centring + one-time pan-hint dismissal
 *   - i18n: rebuilds all rendered text on lang:change and re-opens the active
 *     note; selection is preserved across a lang switch
 *
 * THREE-STATE chapters (persisted, requirement 3): each flag/legend/mobile row
 * shows ONE of three states driven by REAL section completion read from
 * localStorage via cfg.getChapterState(slug):
 *   - (null)      -> NOT STARTED, neutral (default look)
 *   - "started"   -> a distinct gold "in-progress" treatment
 *   - "done"      -> earned green (check)
 * CLICKING A FLAG ONLY OPENS THE FIELD NOTE -- it never marks a chapter
 * started/done. Only real section progress (persisted by the section pages)
 * does. Re-clicking the active stop closes it (single-open toggle). The map
 * re-reads chapter state on demand via repaintChapters() (the page glue calls
 * it on focus / visibilitychange so returning from a section reflects new
 * state). Chapters without a built section page (no href) can never complete.
 *
 * Host: [data-component="trail"] (the .atlas / plate section).
 *   slots / hooks inside the host (built or located):
 *     svg[data-slot="svg"] with #route/#routeShadow/#routeDraw + g#pins
 *     [data-slot="legend"]  (desktop <ul>)        -- optional
 *     [data-slot="mobile"]  (mobile <ol>)         -- optional
 *     [data-slot="panel"]   (field-note mount)    -- required for detail
 *     [data-slot="hint"]    (legend hint text)    -- optional
 *     [data-slot="maphint"] (mobile pan hint)     -- optional
 *
 * Config: {
 *   routeD: string,                // SVG path d for the route
 *   stops: Array<{ label, blurb, pts[], ex?, href? }>,  // active-lang copy
 *   getStops?: () => stops,        // re-read copy on lang change (overrides stops)
 *   strings?: { close, exampleLabel, goLabel, hint },   // active-lang UI words
 *   getStrings?: () => strings,
 *   getChapterState?: (slug) => "started"|"done"|null,  // persisted chapter state
 *   getChapterProgress?: (slug) => { done, total, pct, state }, // per-chapter fraction
 *   getLocale?: () => "ru"|"en",   // active lang for the status labels
 *   onChaptersPaint?: (counts) => void,  // fired after repaint; counts={done,total}
 *   announce?: (msg) => void,      // a11y live-region announcer
 *   onLangChange?: boolean         // default true: re-render on document lang:change
 * }
 *
 * export function init(rootEl, config) -> {
 *   open(i), close(), rebuild(), repaintChapters(), destroy()
 * }
 */

import { qs, svg as svgEl, clear, listeners, fetchJson } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

const SVGNS = "http://www.w3.org/2000/svg";

// glanceable completion status copy per chapter state (RU default + EN)
const STATUS_LABELS = {
  ru: { none: "Не начато", started: "В процессе", done: "Завершено" },
  en: { none: "Not started", started: "In progress", done: "Completed" },
};
// small inline-SVG tick for the "done" state (currentColor; ASCII only)
const CHECK_SVG =
  '<svg class="cs-check" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"' +
  ' focusable="false"><path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function init(rootEl, config) {
  const cfg = config || {};
  const L = listeners();

  // ---- host references (guarded; never throw on a missing slot) ----
  const svg = qs('[data-slot="svg"]', rootEl) || qs("svg.trail-svg", rootEl);
  const pinsG = svg ? svg.querySelector("#pins") : null;
  const routeEl = svg ? svg.querySelector("#route") : null;
  const routeShadow = svg ? svg.querySelector("#routeShadow") : null;
  const routeDraw = svg ? svg.querySelector("#routeDraw") : null;
  const legendUl = qs('[data-slot="legend"]', rootEl);
  const mobileOl = qs('[data-slot="mobile"]', rootEl);
  const panel = qs('[data-slot="panel"]', rootEl);
  const hintEl = qs('[data-slot="hint"]', rootEl);
  const mapHint = qs('[data-slot="maphint"]', rootEl);
  const shell = qs(".trail-shell.desktop-trail", rootEl);

  let stops = readStops();
  let strings = readStrings();
  let activeStop = -1;
  let pinPoints = [];

  function readStops() {
    if (typeof cfg.getStops === "function") return cfg.getStops() || [];
    return Array.isArray(cfg.stops) ? cfg.stops : [];
  }
  function readStrings() {
    const base = { close: "Закрыть", exampleLabel: "Пример", goLabel: "Открыть главу", hint: "" };
    const s = typeof cfg.getStrings === "function" ? cfg.getStrings() : cfg.strings;
    return Object.assign(base, s || {});
  }

  const count = () => stops.length;
  function pct(i) {
    const n = count();
    return i === 0 ? "0%" : i === n - 1 ? "100%" : i * Math.round(100 / (n - 1)) + "%";
  }
  function kind(i) {
    const n = count();
    return i === 0 ? "start" : i === n - 1 ? "terminal" : "";
  }
  function numLabel(i) {
    const n = count();
    return i === n - 1 ? "100" : i === 0 ? "0" : String(i);
  }
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---- sample STOP_COUNT points evenly along the actual route path ----
  function samplePoints() {
    if (!routeEl || !cfg.routeD) {
      pinPoints = [];
      return 0;
    }
    routeEl.setAttribute("d", cfg.routeD);
    if (routeShadow) routeShadow.setAttribute("d", cfg.routeD);
    if (routeDraw) routeDraw.setAttribute("d", cfg.routeD);
    const total = routeEl.getTotalLength();
    const n = count();
    pinPoints = [];
    for (let i = 0; i < n; i++) {
      const denom = n > 1 ? n - 1 : 1;
      const p = routeEl.getPointAtLength((total * i) / denom);
      pinPoints.push({ x: p.x, y: p.y });
    }
    return total;
  }

  // ---- collision-aware label placement -----------------------------------
  // Each pin label sits above OR below its pin. The default side comes from the
  // pin's vertical position (low pin -> label above, high pin -> label below so
  // a label never runs off the top/bottom edge). When two neighbouring pins are
  // close horizontally their default-side labels would land in the same band and
  // read as one ambiguous / cramped block; we FLIP the later pin's label to the
  // opposite side. This is a general rule over the whole route (not a per-index
  // hack): walk the pins left-to-right and, whenever a pin sits within MIN_DX of
  // a horizontally-overlapping neighbour AND landed on the same side as it, push
  // it to the other side. The label stays attached close to its own pin (same x,
  // small dy). EVERY label then renders at exactly its side's FIXED offset from
  // its own pin -- "above" labels all share one gap, "below" labels all share
  // one gap -- so the distances are uniform and the map reads tidy.
  const MIN_DX = 150; // viewBox units; labels are text-anchor:middle ~<=150 wide
  // vertical offsets from the pin center for each side (label line + pct line).
  // These are the SOLE source of vertical distance; no per-label push exists.
  const ABOVE = { labelDy: -34, pctDy: -46 };
  const BELOW = { labelDy: 30, pctDy: 43 };
  // explicit per-pin side PREFERENCE (editorial choice, by stop index). A
  // preferred pin is PINNED to its side: it is forced there AFTER the normal
  // neighbour-chain layout (so it never ripples its own side onto other pins),
  // and the de-cramp pass treats it as IMMOVABLE -- a same-side clash flips the
  // OTHER (non-preferred) pin instead. Only the uniform ABOVE/BELOW offsets are
  // ever used; no variable distance. Pin 5 ("Эмбеддинги: текст в векторы") reads
  // better just BELOW its dot; this pushes its sole cramped neighbour (pin 4,
  // "Разбиваем текст на чанки") ABOVE and leaves every other pin's side as-is.
  const SIDE_PREF = { 5: "below" };
  function preferredSide(i) {
    return Object.prototype.hasOwnProperty.call(SIDE_PREF, i) ? SIDE_PREF[i] : null;
  }

  function defaultSide(c) {
    return c.y > 235 ? "above" : "below";
  }

  // returns one entry per pin: { side, labelDy, pctDy }. Side is chosen so that
  // a pin crowded (within MIN_DX in x) with EITHER neighbour that already landed
  // / will land on the pin's default side is flipped to the opposite side. This
  // gives an alternating above/below rhythm in dense stretches. Because every
  // label now sits at a FIXED side offset (no variable push), side selection is
  // the ONLY collision lever, so a final rule resolves the one residual clash a
  // steep climb produces (see the high-pin rule below).
  function computeLabelLayout() {
    const out = [];
    for (let i = 0; i < pinPoints.length; i++) {
      const c = pinPoints[i];
      let side = defaultSide(c);
      const prev = i > 0 ? pinPoints[i - 1] : null;
      const next = i < pinPoints.length - 1 ? pinPoints[i + 1] : null;
      const prevSide = i > 0 ? out[i - 1].side : null;
      const prevCrowd = prev && Math.abs(c.x - prev.x) < MIN_DX;
      const nextCrowd = next && Math.abs(c.x - next.x) < MIN_DX;
      // crowded with the previous pin AND about to land on its side -> flip
      if (prevCrowd && side === prevSide) {
        side = side === "above" ? "below" : "above";
      } else if (nextCrowd && !prevCrowd && side === defaultSide(next)) {
        // no constraint from the left, but the next pin (close in x) shares this
        // side by default -> flip now so the pair splits above/below cleanly.
        // This is what drops "Зачем он нужен" (pin 2) BELOW its dot, away from
        // the "Как работает поиск..." label (pin 3) and into the open lower band.
        side = side === "above" ? "below" : "above";
      }
      // HIGH-PIN rule: a high pin (default "below") that landed "below" while its
      // crowded previous neighbour sits "above" puts its short "below" label band
      // right under that neighbour's WIDE "above" label -- the only residual clash
      // once distances are uniform (e.g. the steep climbs at pins 4 / 8 / 10).
      // Flip it "above" so its label rises toward its own high pin and clears the
      // preceding label; the offset stays the fixed ABOVE gap (no extra distance).
      if (side === "below" && defaultSide(c) === "below" && prevCrowd && prevSide === "above") {
        side = "above";
      }
      const off = side === "above" ? ABOVE : BELOW;
      out.push({ side, labelDy: off.labelDy, pctDy: off.pctDy });
    }
    // editorial side PREFERENCE applied LAST -- after the neighbour chain above
    // has computed EVERY pin from the unperturbed defaults -- so a preference
    // never ripples through the MIN_DX / high-pin chain into another pin's side.
    // The preferred pin is forced to its side at the same uniform offset; the
    // de-cramp pass then resolves the lone same-side clash by moving the OTHER
    // (non-preferred) pin, leaving all other sides exactly as computed.
    for (let i = 0; i < out.length; i++) {
      const pref = preferredSide(i);
      if (!pref || out[i].side === pref) continue;
      const offP = pref === "above" ? ABOVE : BELOW;
      out[i] = { side: pref, labelDy: offP.labelDy, pctDy: offP.pctDy };
    }
    return out;
  }

  // ---- flag pins (AtlasMD 3.3b) ----
  function buildPins() {
    if (!pinsG) return;
    clear(pinsG);
    const layout = computeLabelLayout();
    pinPoints.forEach((c, i) => {
      const grp = document.createElementNS(SVGNS, "g");
      grp.setAttribute("class", "pin " + kind(i));
      grp.setAttribute("tabindex", "0");
      grp.setAttribute("role", "button");
      grp.setAttribute("aria-expanded", "false");
      grp.setAttribute("aria-label", pct(i) + " - " + (stops[i] ? stops[i].label : ""));
      grp.dataset.idx = String(i);

      const hit = svgEl("circle", { class: "pin-hit", cx: c.x, cy: c.y, r: 26 });
      grp.appendChild(hit);

      const pole = svgEl("line", { class: "flag-pole", x1: c.x, y1: c.y, x2: c.x, y2: c.y - 28 });
      grp.appendChild(pole);

      const fx = c.x;
      const fy = c.y - 28;
      const flag = svgEl("path", {
        class: "flag",
        d: "M" + fx + "," + fy + " L" + (fx + 20) + "," + (fy + 4) + " L" + fx + "," + (fy + 9) + " Z",
      });
      grp.appendChild(flag);

      const dot = svgEl("circle", { class: "dot", cx: c.x, cy: c.y, r: 8 });
      grp.appendChild(dot);

      const num = svgEl("text", { class: "num", x: c.x, y: c.y + 0.5 });
      num.textContent = numLabel(i);
      grp.appendChild(num);

      // label + percent: side (above/below) chosen by computeLabelLayout so
      // neighbouring labels never overlap; pin 7's label lands below its pin.
      const place = layout[i] || { side: "below", labelDy: 30, pctDy: 43 };
      grp.setAttribute("data-label-side", place.side);
      const lbl = svgEl("text", {
        class: "pin-label",
        x: c.x,
        y: c.y + place.labelDy,
        "text-anchor": "middle",
      });
      lbl.textContent = stops[i] ? stops[i].label : "";
      grp.appendChild(lbl);

      const pctT = svgEl("text", {
        class: "pin-pct",
        x: c.x,
        y: c.y + place.pctDy,
        "text-anchor": "middle",
      });
      pctT.textContent = pct(i);
      grp.appendChild(pctT);

      L.on(grp, "click", () => toggle(i));
      L.on(grp, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle(i);
        }
      });
      pinsG.appendChild(grp);
    });
    // Every label now sits at exactly its side's fixed offset (ABOVE/BELOW) from
    // its own pin -- uniform vertical distances, no variable per-label push.
    // REAL-GEOMETRY de-cramp: resolve any same-side x-extent overlap by FLIPPING
    // sides (still only two uniform offsets), then the x-only edge clamp last.
    decrampLabelSides();
    clampLabelsToViewBox();
  }

  // ---- post-render de-cramp: enforce the X-OVERLAP invariant ----------------
  // INVARIANT (the real rule): any two labels whose X-EXTENTS overlap must be on
  // OPPOSITE sides. With the uniform ABOVE/BELOW offsets, opposite sides give a
  // large, consistent vertical gap; a same-side x-overlap is the cramped look.
  // computeLabelLayout's initial sides use a pin-distance proxy (MIN_DX) that
  // MISSES wide labels whose text extents overlap while pin centers sit farther
  // apart (e.g. pins 4 + 5). This pass works on REAL measured geometry: the union
  // bbox of each pin's .pin-label + .pin-pct. Walk pins left-to-right by x extent
  // (earlier = higher priority); whenever a pin's x-extent overlaps an earlier
  // pin already on the SAME side, FLIP this pin to the opposite side and re-place
  // its label + pct at that side's UNIFORM offset, then re-measure so later pins
  // account for the flip. Resolves every overlap by SIDE only -- still exactly two
  // uniform offsets, zero variable distance. For this route it fully resolves
  // (max two wide labels overlap at once) into a clean alternating rhythm.
  //
  // GAP EXCEPTION (cramps): a SAME-SIDE x-overlap is only a CLASH when the two
  // label bands are vertically close (< COMFY). Two same-side pins on very
  // different route heights can x-overlap yet read cleanly with a big vertical
  // gap, so they are NOT flipped. This keeps a forced editorial side (pin 5
  // BELOW) from rippling onto pins it already clears vertically (pin 6 sits far
  // below pin 5, so they coexist same-side below without a cascade).
  function pinUnionBox(grp) {
    const lbl = grp.querySelector(".pin-label");
    const pctT = grp.querySelector(".pin-pct");
    let box = null;
    [lbl, pctT].forEach((t) => {
      if (!t) return;
      let b;
      try {
        b = t.getBBox();
      } catch (e) {
        return;
      }
      if (!b || (b.width === 0 && b.x === 0)) return;
      if (!box) {
        box = { x1: b.x, x2: b.x + b.width, y1: b.y, y2: b.y + b.height };
      } else {
        box.x1 = Math.min(box.x1, b.x);
        box.x2 = Math.max(box.x2, b.x + b.width);
        box.y1 = Math.min(box.y1, b.y);
        box.y2 = Math.max(box.y2, b.y + b.height);
      }
    });
    return box;
  }
  function xOverlap(a, b) {
    return a && b && a.x1 < b.x2 && b.x1 < a.x2;
  }
  // vertical gap between two boxes (0 when their y-extents already overlap)
  function yGap(a, b) {
    if (a.y1 >= b.y2) return a.y1 - b.y2;
    if (b.y1 >= a.y2) return b.y1 - a.y2;
    return 0;
  }
  // COMFY: a SAME-SIDE x-overlapping pair is CRAMPED only when its vertical gap
  // is below this. Pins on very different route heights can share a side and
  // x-overlap yet still read cleanly. Kept just above the ~12px readability
  // target so a forced side does not flip pins it already clears vertically.
  const COMFY = 14; // viewBox units
  function cramps(a, b) {
    return xOverlap(a, b) && yGap(a, b) < COMFY;
  }
  function placeLabelAtSide(grp, c, side) {
    const off = side === "above" ? ABOVE : BELOW;
    grp.setAttribute("data-label-side", side);
    const lbl = grp.querySelector(".pin-label");
    const pctT = grp.querySelector(".pin-pct");
    if (lbl) lbl.setAttribute("y", String(c.y + off.labelDy));
    if (pctT) pctT.setAttribute("y", String(c.y + off.pctDy));
  }
  function decrampLabelSides() {
    if (!pinsG) return;
    const grps = Array.prototype.slice.call(pinsG.querySelectorAll("g.pin"));
    if (!grps.length) return;
    // current measured state per pin (index-aligned with pinPoints)
    const items = grps.map((grp, i) => ({
      grp,
      c: pinPoints[i] || { x: 0, y: 0 },
      side: grp.getAttribute("data-label-side") || "below",
      box: pinUnionBox(grp),
      pref: preferredSide(i),
    }));
    // sort by x to walk left-to-right; original index = priority (earlier wins)
    const order = items
      .map((it, idx) => ({ it, idx }))
      .sort((a, b) => (a.it.box && b.it.box ? a.it.box.x1 - b.it.box.x1 : a.idx - b.idx));
    // Whether two same-side pins clash. The ORIGINAL strict rule (any x-overlap
    // is a clash) governs every ORDINARY pair, so the 9 non-preferred pins keep
    // their proven alternating layout untouched. The GAP-aware exception
    // (cramps: x-overlap only counts when the bands are vertically close)
    // applies ONLY to a pair that involves a PREFERRED pin -- so a forced
    // editorial side can coexist same-side with a pin that already clears it
    // vertically (pin 5 below + pin 6 below, gap ~68) instead of forcing a
    // needless cascade, while never relaxing any ordinary pair.
    function pairClash(a, b) {
      if (a.side !== b.side || !a.box || !b.box) return false;
      return a.pref || b.pref ? cramps(a.box, b.box) : xOverlap(a.box, b.box);
    }
    function clashesEarlier(cur, oi) {
      for (let oj = 0; oj < oi; oj++) {
        if (pairClash(cur, order[oj].it)) return true;
      }
      return false;
    }
    // re-place a pin at its opposite side (uniform offset) + re-measure
    function flipItem(it) {
      const flipped = it.side === "above" ? "below" : "above";
      placeLabelAtSide(it.grp, it.c, flipped);
      it.side = flipped;
      it.box = pinUnionBox(it.grp);
    }
    for (let oi = 0; oi < order.length; oi++) {
      const cur = order[oi].it;
      if (!cur.box) continue;
      if (!clashesEarlier(cur, oi)) continue;
      // A PREFERRED (immovable) pin must not move: instead flip the EARLIER
      // same-side non-preferred pin(s) it actually CRAMPS to the opposite side.
      // This is how pin 5 (below, preferred) pushes pin 4 (no preference) UP to
      // above -- and only pin 4, since the cramps() gap test spares pin 6, which
      // sits far below pin 5 on the route. Flips stay uniform-offset only.
      if (cur.pref) {
        for (let oj = 0; oj < oi; oj++) {
          const earlier = order[oj].it;
          if (earlier.pref) continue; // never move another preferred pin
          if (pairClash(cur, earlier)) flipItem(earlier);
        }
        continue;
      }
      // violates the invariant on its current side -> flip to the opposite side
      // and re-place at that side's UNIFORM offset, then re-measure.
      flipItem(cur);
      // step 3: if the NEW side also clashes with an earlier same-side pin (3+
      // mutually-overlapping wide labels), the lower-priority pin cannot satisfy
      // both -- keep the side with the LARGER min vertical gap to the clashing
      // earlier labels (prefer the bigger gap). For this route the first flip is
      // always clean, so this branch is a safety net, not normally hit.
      if (clashesEarlier(cur, oi)) {
        const gapAt = (side) => {
          placeLabelAtSide(cur.grp, cur.c, side);
          const box = pinUnionBox(cur.grp);
          let minGap = Infinity;
          for (let oj = 0; oj < oi; oj++) {
            const e = order[oj].it;
            if (!e.box || e.side !== side || !xOverlap(box, e.box)) continue;
            const g = box.y1 >= e.box.y2 ? box.y1 - e.box.y2
              : e.box.y1 >= box.y2 ? e.box.y1 - box.y2 : 0;
            if (g < minGap) minGap = g;
          }
          return { box, minGap };
        };
        const a = gapAt("above");
        const b = gapAt("below");
        const best = a.minGap >= b.minGap ? "above" : "below";
        placeLabelAtSide(cur.grp, cur.c, best);
        cur.side = best;
        cur.box = pinUnionBox(cur.grp);
      }
    }
  }

  // ---- post-layout clamp: keep every label fully inside the viewBox --------
  // The pins/route are fixed and labels are text-anchor:middle, so a long label
  // on the FIRST/LAST stop can extend past the SVG left (x=0) or right (x=1200)
  // edge and clip. After all labels are appended (so getBBox is meaningful) we
  // measure each .pin-label + its .pin-pct and nudge the pair's x inward by the
  // exact overflow, keeping text-anchor:middle. The percent moves by the same dx
  // so the pair stays aligned. Only edge labels overflow, so the small inward
  // nudge cannot reintroduce neighbour overlaps (de-collision still holds).
  const VB_MARGIN = 6; // keep within [VB_MARGIN, 1200 - VB_MARGIN]
  function clampLabelsToViewBox() {
    if (!pinsG) return;
    const lo = VB_MARGIN;
    const hi = 1200 - VB_MARGIN;
    pinsG.querySelectorAll("g.pin").forEach((grp) => {
      const lbl = grp.querySelector(".pin-label");
      const pctT = grp.querySelector(".pin-pct");
      if (!lbl) return;
      let bbox;
      try {
        bbox = lbl.getBBox();
      } catch (e) {
        return; // not rendered / measurable yet
      }
      if (!bbox || (bbox.width === 0 && bbox.x === 0)) return; // guard 0-box
      let dx = 0;
      if (bbox.x < lo) {
        dx = lo - bbox.x; // overflow left -> nudge right
      } else if (bbox.x + bbox.width > hi) {
        dx = hi - (bbox.x + bbox.width); // overflow right -> nudge left
      }
      if (dx === 0) return;
      const lx = parseFloat(lbl.getAttribute("x")) || 0;
      lbl.setAttribute("x", String(lx + dx));
      if (pctT) {
        const px = parseFloat(pctT.getAttribute("x")) || 0;
        pctT.setAttribute("x", String(px + dx));
      }
    });
  }

  // ---- desktop legend index ----
  function buildLegend() {
    if (!legendUl) return;
    clear(legendUl);
    stops.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = kind(i) ? "is-" + kind(i) : "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-expanded", "false");
      btn.dataset.idx = String(i);
      // ordinal/percent medallion (identity) + label + glanceable status pill.
      // The status pill text/check is (re)painted by repaintChapters().
      btn.innerHTML =
        '<span class="lnum">' + pct(i) + "</span>" +
        '<span class="cs-name">' + esc(s.label) + "</span>" +
        '<span class="cs-status" data-status></span>';
      L.on(btn, "click", () => toggle(i));
      li.appendChild(btn);
      legendUl.appendChild(li);
    });
  }

  // ---- mobile vertical route (primary mobile nav) ----
  function buildMobile() {
    if (!mobileOl) return;
    clear(mobileOl);
    stops.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = kind(i) ? "is-" + kind(i) : "";
      const btn = document.createElement("button");
      btn.className = "mpin";
      btn.type = "button";
      btn.setAttribute("aria-expanded", "false");
      btn.dataset.idx = String(i);
      btn.innerHTML =
        '<span class="mnum">' + pct(i) + "</span>" +
        '<span class="cs-name">' + esc(s.label) + "</span>" +
        '<span class="cs-status" data-status></span>';
      L.on(btn, "click", () => toggle(i));
      li.appendChild(btn);
      mobileOl.appendChild(li);
    });
  }

  // ---- field note (AtlasMD 3.11) ----
  function toggle(i) {
    if (activeStop === i) close();
    else open(i);
  }

  function open(i) {
    if (!panel || !stops[i]) return;
    activeStop = i;
    const s = stops[i];
    if (hintEl) hintEl.style.display = "none";

    const cls = kind(i) === "start" ? " is-start" : kind(i) === "terminal" ? " is-terminal" : "";
    const lis = (s.pts || []).map((p) => "<li>" + esc(p) + "</li>").join("");
    // REQ-2: per-chapter completion line in the opened field note
    const progHtml = chapterProgressHtml(i);
    const ex = s.ex ? '<p class="fn-example"><b>' + esc(strings.exampleLabel) + ":</b> " + esc(s.ex) + "</p>" : "";
    const go = s.href
      ? '<a class="fn-go" href="' + esc(s.href) + '">' + esc(strings.goLabel) + ' <span class="arr" aria-hidden="true">-&gt;</span></a>'
      : "";

    panel.innerHTML =
      '<div class="field-note' + cls + '" role="dialog" aria-modal="false" aria-label="' + esc(s.label) + '">' +
      '<div class="fn-head">' +
      '<span class="badge">' + pct(i) + "</span>" +
      '<h4 tabindex="-1">' + esc(s.label) + "</h4>" +
      '<button class="fn-close" type="button">' + esc(strings.close) + "</button>" +
      "</div>" +
      '<div class="fn-body">' +
      progHtml +
      '<p class="blurb">' + esc(s.blurb) + "</p>" +
      "<ul>" + lis + "</ul>" +
      ex +
      go +
      "</div>" +
      "</div>";

    const closeBtn = panel.querySelector(".fn-close");
    if (closeBtn) L.on(closeBtn, "click", () => close());
    const heading = panel.querySelector("h4");
    if (heading) heading.focus();

    // NOTE: opening a flag NEVER changes its chapter state (requirement 3).
    // The 3 chapter states come ONLY from persisted section progress, painted
    // by repaintChapters(). Opening a flag just reveals the field note.
    if (typeof cfg.announce === "function") cfg.announce(pct(i) + " - " + s.label);

    syncActive(i);
    scrollPinIntoView(i);
  }

  function close() {
    activeStop = -1;
    if (panel) panel.innerHTML = "";
    if (hintEl) hintEl.style.display = "";
    syncActive(-1);
  }

  function syncActive(i) {
    rootEl.querySelectorAll(".pin").forEach((p) => {
      const on = parseInt(p.dataset.idx, 10) === i;
      p.classList.toggle("active", on);
      p.setAttribute("aria-expanded", on ? "true" : "false");
    });
    rootEl
      .querySelectorAll('[data-slot="legend"] button, [data-slot="mobile"] .mpin')
      .forEach((b) => {
        const on = parseInt(b.dataset.idx, 10) === i;
        b.setAttribute("aria-expanded", on ? "true" : "false");
      });
  }

  // ---- THREE-STATE chapter paint (persisted section completion) ----------
  // Reads cfg.getChapterState(slug) for each stop and paints started/done on
  // the pin + legend + mobile rows. Reports { done, total } so the map progress
  // strip can count COMPLETED chapters only. NEVER mutates storage.
  function slugFor(i) {
    const s = stops[i];
    if (!s) return null;
    return s.slug != null ? s.slug : s.id;
  }
  function chapterStateFor(i) {
    if (typeof cfg.getChapterState !== "function") return null;
    const slug = slugFor(i);
    if (slug == null) return null;
    return cfg.getChapterState(slug);
  }
  // per-chapter progress fraction { done, total, pct, state } (REQ-1/REQ-2)
  function chapterProgressFor(i) {
    if (typeof cfg.getChapterProgress !== "function") return null;
    const slug = slugFor(i);
    if (slug == null) return null;
    return cfg.getChapterProgress(slug);
  }
  function activeLocale() {
    let loc = typeof cfg.getLocale === "function" ? cfg.getLocale() : null;
    if (!loc && typeof document !== "undefined" && document.documentElement) {
      loc = document.documentElement.getAttribute("lang");
    }
    return loc === "en" ? "en" : "ru";
  }
  function statusText(state) {
    const set = STATUS_LABELS[activeLocale()] || STATUS_LABELS.ru;
    return state === "done" ? set.done : state === "started" ? set.started : set.none;
  }
  // REQ-2: per-chapter completion line for the opened field note. Gold (in
  // progress) / green (done) accent via the cs-status classes; not-started or a
  // chapter with no section yet reads "Не начато" / 0%.
  function chapterProgressHtml(i) {
    const prog = chapterProgressFor(i);
    const state = chapterStateFor(i);
    const ru = activeLocale() === "ru";
    const doneWord = ru ? "Пройдено" : "Completed";
    let cls = "cs-status";
    let inner;
    if (state === "done") {
      const total = prog && prog.total > 0 ? prog.total : prog && prog.done ? prog.done : 1;
      cls += " done";
      inner = CHECK_SVG + "<span>" + esc(doneWord + " " + total + " / " + total + " (100%)") + "</span>";
    } else if (state === "started" && prog && prog.total > 0) {
      cls += " started";
      inner =
        "<span>" +
        esc(doneWord + " " + prog.done + " / " + prog.total + " (" + prog.pct + "%)") +
        "</span>";
    } else if (state === "started") {
      cls += " started";
      inner = "<span>" + esc(statusText("started") + " (0%)") + "</span>";
    } else {
      inner = "<span>" + esc(statusText(null) + " (0%)") + "</span>";
    }
    return '<p class="fn-progress"><span class="' + cls + '">' + inner + "</span></p>";
  }

  // (re)paint the status pill (text + check on done) into a [data-status] span
  function paintStatus(spanEl, state) {
    if (!spanEl) return;
    spanEl.classList.toggle("done", state === "done");
    spanEl.classList.toggle("started", state === "started");
    const check = state === "done" ? CHECK_SVG : "";
    spanEl.innerHTML = check + "<span>" + esc(statusText(state)) + "</span>";
  }
  function applyTriState(elem, state) {
    if (!elem) return;
    elem.classList.toggle("started", state === "started");
    elem.classList.toggle("done", state === "done");
    // legacy "visited" kept off: green is now driven by "done" only.
    elem.classList.remove("visited");
  }
  function repaintChapters() {
    let done = 0;
    const total = count();
    rootEl.querySelectorAll(".pin").forEach((p) => {
      const idx = parseInt(p.dataset.idx, 10);
      applyTriState(p, chapterStateFor(idx));
    });
    rootEl.querySelectorAll('[data-slot="legend"] li, [data-slot="mobile"] li').forEach((li) => {
      const btn = li.querySelector("button");
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx, 10);
      const st = chapterStateFor(idx);
      applyTriState(li, st);
      // REQ-1: glanceable status label + check on the small card
      paintStatus(btn.querySelector("[data-status]"), st);
    });
    for (let i = 0; i < total; i++) {
      if (chapterStateFor(i) === "done") done++;
    }
    if (typeof cfg.onChaptersPaint === "function") cfg.onChaptersPaint({ done, total });
  }

  // ---- mobile scroller helpers ----
  function mapScrollable() {
    return shell && shell.scrollWidth - shell.clientWidth > 4;
  }
  function scrollPinIntoView(i) {
    if (!mapScrollable() || !pinPoints[i] || !svg) return;
    const renderedW = svg.getBoundingClientRect().width || shell.scrollWidth;
    const scaleX = renderedW / 1200;
    const pinX = pinPoints[i].x * scaleX;
    let target = pinX - shell.clientWidth / 2;
    const max = shell.scrollWidth - shell.clientWidth;
    target = Math.max(0, Math.min(target, max));
    if (shell.scrollTo) {
      shell.scrollTo({ left: target, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    } else {
      shell.scrollLeft = target;
    }
  }
  function setupMapScroll() {
    if (!shell) return;
    shell.scrollLeft = 0;
    let dismissed = false;
    const onScroll = () => {
      if (dismissed) return;
      if (shell.scrollLeft > 6) {
        dismissed = true;
        if (mapHint) mapHint.classList.add("is-gone");
      }
    };
    L.on(shell, "scroll", onScroll, { passive: true });
  }

  // ---- route draw-in (one-shot, reduced-motion gated) ----
  function setupRouteAnim() {
    if (!routeEl || !svg) return;
    if (prefersReducedMotion()) return;
    const len = routeEl.getTotalLength();
    svg.style.setProperty("--route-len", String(len));
    svg.classList.add("has-anim");
    const finish = () => {
      svg.classList.add("anim-done");
      svg.classList.remove("has-anim");
    };
    if (routeDraw) L.on(routeDraw, "animationend", finish);
    setTimeout(finish, 2200); // safety if animationend never fires
  }

  // ---- full (re)build ----
  function rebuild() {
    stops = readStops();
    strings = readStrings();
    samplePoints();
    buildPins();
    buildLegend();
    buildMobile();
    if (hintEl && strings.hint) hintEl.textContent = strings.hint;
    repaintChapters();
    if (activeStop >= 0) open(activeStop);
    else syncActive(-1);
  }

  // ---- lang change: re-render copy, keep selection ----
  if (cfg.onLangChange !== false) {
    L.on(document, "lang:change", () => rebuild());
  }

  // initial mount
  rebuild();
  setupRouteAnim();
  setupMapScroll();

  return {
    open,
    close,
    rebuild,
    repaintChapters,
    destroy() {
      L.off();
      close();
    },
  };
}

/** Convenience: load a route+stops dataset (nav.json style) over fetch. */
export async function loadTrailData(src) {
  return fetchJson(src);
}
