/**
 * chunk-anim.js -- didactic cut-mechanism animations for the chunking catalog.
 *
 * RESPONSIBILITY: ONE data-driven module that visualises HOW a chunking
 * strategy decides WHERE to cut. Five modes behind a single `mode` switch:
 *   fixed     -- cuts fall at equal intervals (scaleY cut lines), can split a word
 *   sliding   -- a window slides by step=size-overlap (translateX), overlap repeats
 *   recursive -- descent down a separator hierarchy (paragraph -> sentence -> word)
 *   structure -- cuts land only on structure boundaries, never mid-sentence
 *   semantic  -- cut where neighbour-sentence similarity drops below a threshold
 *
 * It REUSES timeline.js as the single requestAnimationFrame clock + the
 * IntersectionObserver autoplay gate + the prefers-reduced-motion stepper. The
 * scene renderer is pure: timeline.js calls render(step, progress, atEnd) and
 * this module mutates transform / opacity ONLY (AtlasMD: compositor-safe motion,
 * no loop, no iteration-count>1, no mascot/traveling-dot). Reduced motion =>
 * timeline drives progress=1/atEnd=true so every step snaps to its END state over
 * the SAME DOM (no alternate static markup path).
 *
 * CONTRACT (site-architecture.md sec 4): export function init(rootEl, config)
 *   -> { destroy() }.
 *   config.anim   { mode, params, caption? }  (a Strategy.anim from data/chunking.js)
 *   config.lang   "ru" | "en"  active language for the caption (default "ru")
 *   config.autoplay  forwarded to timeline.js (default true; ignored if reduced)
 *   config.speed     forwarded to timeline.js (default 1)
 *
 * Host: a [data-slot="anim"] element inside a level-1 strategy panel (the panel
 * is built by pages/chunking.js). This module clears the host and builds its own
 * scene + timeline controls into it. No global state; one instance per host.
 *
 * No-JS / no-data: the host is empty; the panel ships the algorithm steps + prose
 * as the meaningful static fallback. JS only ENHANCES.
 */

import { el, clear } from "./dom.js";
import { init as initTimeline } from "./timeline.js";

const STEP_MS = 900;

/** Resolve a value that may be a { ru, en } pair against the active locale. */
function loc(v, lang) {
  if (v && typeof v === "object" && !Array.isArray(v) && ("ru" in v || "en" in v)) {
    return v[lang] != null ? v[lang] : v.ru != null ? v.ru : v.en != null ? v.en : v;
  }
  return v;
}

/**
 * Resolve every per-language param entry to the active locale. Known keys
 * (text, size, overlap, boundaries, forbidden, sentences) may be { ru, en };
 * unknown keys (separators, sims, threshold) are language-neutral and pass
 * through unchanged.
 */
function resolveParams(params, lang) {
  const out = {};
  Object.keys(params).forEach((k) => {
    out[k] = loc(params[k], lang);
  });
  return out;
}

export function init(rootEl, config) {
  const cfg = config || {};
  const anim = cfg.anim || {};
  const mode = anim.mode || "fixed";
  const lang = cfg.lang === "en" ? "en" : "ru";
  // Resolve per-language params to the active locale. Each value may be a flat
  // (lang-neutral) primitive/array OR a { ru, en } pair (text, size, overlap,
  // boundaries, forbidden, sentences are stored per language so RU renders
  // Cyrillic and EN renders English). Cut positions are then computed at runtime
  // from the resolved active-lang string, so boundary/cut indices land correctly
  // for whichever script is on screen. Falls back ru -> en so a half-translated
  // field never renders as "[object Object]".
  const params = resolveParams(anim.params || {}, lang);
  const caption = anim.caption ? anim.caption[lang] || anim.caption.ru || "" : "";

  let timeline = null;
  let scene = null;

  const builders = {
    fixed: buildFixed,
    sliding: buildSliding,
    recursive: buildRecursive,
    structure: buildStructure,
    semantic: buildSemantic,
  };
  const build = builders[mode] || buildFixed;

  if (rootEl) {
    clear(rootEl);
    rootEl.setAttribute("data-chunk-anim", mode);
    scene = build(rootEl, params, caption);

    // timeline.js mounts its controls onto the .timeline shell + drives the clock.
    const tlShell = el("div", { class: "timeline chunk-anim__timeline" });
    rootEl.appendChild(tlShell);
    timeline = initTimeline(tlShell, {
      steps: scene.steps,
      autoplay: cfg.autoplay,
      speed: cfg.speed,
      render: (step, progress, atEnd) => scene.render(step, progress, atEnd),
    });
  }

  return {
    destroy() {
      if (timeline) timeline.destroy();
      if (scene && typeof scene.destroy === "function") scene.destroy();
      if (rootEl) clear(rootEl);
    },
  };
}

// ---------------------------------------------------------------------------
// shared scene scaffolding
// ---------------------------------------------------------------------------

/** Caption strip + a stage host; returns { wrap, stage }. */
function sceneShell(rootEl, caption, extraClass) {
  const wrap = el("div", { class: "chunk-anim" + (extraClass ? " " + extraClass : "") });
  if (caption) {
    wrap.appendChild(el("p", { class: "chunk-anim__caption", attrs: { "aria-hidden": "true" }, text: caption }));
  }
  const stage = el("div", { class: "chunk-anim__stage" });
  wrap.appendChild(stage);
  rootEl.appendChild(wrap);
  return { wrap, stage };
}

/** clamp progress to [0,1], honouring atEnd. */
function clamp01(progress, atEnd) {
  if (atEnd) return 1;
  return Math.max(0, Math.min(1, progress));
}

// ---------------------------------------------------------------------------
// mode: fixed -- cuts at 0, size, 2*size, ... drawn one per step via scaleY.
// ---------------------------------------------------------------------------

function buildFixed(rootEl, params, caption) {
  const text = String(params.text || "");
  const size = Math.max(1, params.size || 60);
  const { stage } = sceneShell(rootEl, caption, "chunk-anim--fixed");

  // build per-char spans so cut lines sit on exact char boundaries.
  const line = el("div", { class: "chunk-anim__line", attrs: { role: "img", "aria-label": "fixed-size cut demo" } });
  const charEls = buildChars(line, text);
  stage.appendChild(line);

  // cut positions: every `size` chars (skip 0, skip past end).
  const cuts = [];
  for (let i = size; i < text.length; i += size) cuts.push(i);

  const cutEls = cuts.map((idx) => mountCut(line, charEls, idx));

  const steps = cuts.map((idx, i) => ({
    id: "cut-" + i,
    caption: "Рез на позиции " + idx,
    duration: STEP_MS,
  }));
  if (steps.length === 0) steps.push({ id: "none", caption: "Один чанк", duration: STEP_MS });

  function render(step, progress, atEnd) {
    const p = clamp01(progress, atEnd);
    const active = parseInt((step.id.split("-")[1] || "-1"), 10);
    cutEls.forEach((c, i) => {
      const drawn = i < active || (i === active && p >= 1) ? 1 : i === active ? p : 0;
      c.style.transform = "scaleY(" + drawn + ")";
      c.style.opacity = drawn > 0 ? "1" : "0";
    });
    // highlight the chunk that just closed.
    highlightSegments(charEls, [0].concat(cuts), text.length, active, p);
  }

  return { steps, render, destroy() {} };
}

// ---------------------------------------------------------------------------
// mode: sliding -- a translucent window translateX-slides by step=size-overlap.
// ---------------------------------------------------------------------------

function buildSliding(rootEl, params, caption) {
  const text = String(params.text || "");
  const size = Math.max(1, params.size || 50);
  const overlap = Math.max(0, Math.min(size - 1, params.overlap || 0));
  const step = size - overlap;
  const { stage } = sceneShell(rootEl, caption, "chunk-anim--sliding");

  const line = el("div", { class: "chunk-anim__line", attrs: { role: "img", "aria-label": "sliding-window cut demo" } });
  const charEls = buildChars(line, text);
  stage.appendChild(line);

  // window starts: 0, step, 2*step, ... while start < len.
  const starts = [];
  for (let i = 0; i < text.length; i += step) starts.push(i);

  // a single translucent window overlay + an overlap overlay.
  const win = el("span", { class: "chunk-anim__window", attrs: { "aria-hidden": "true" } });
  const ov = el("span", { class: "chunk-anim__overlap", attrs: { "aria-hidden": "true" } });
  line.appendChild(win);
  line.appendChild(ov);

  const steps = starts.map((s, i) => ({
    id: "win-" + i,
    caption: "Окно [" + s + ", " + Math.min(s + size, text.length) + ")",
    duration: STEP_MS,
  }));

  function geom(start) {
    const from = charEls[start];
    const endIdx = Math.min(start + size, text.length) - 1;
    const to = charEls[Math.max(start, endIdx)];
    if (!from || !to) return null;
    const left = from.offsetLeft;
    const right = to.offsetLeft + to.offsetWidth;
    return { left, width: Math.max(0, right - left) };
  }

  function render(step, progress, atEnd) {
    const p = clamp01(progress, atEnd);
    const i = parseInt((step.id.split("-")[1] || "0"), 10);
    const prev = starts[Math.max(0, i - 1)];
    const cur = starts[i];
    const gPrev = geom(prev);
    const gCur = geom(cur);
    if (!gCur) return;
    const lerp = (a, b) => a + (b - a) * p;
    const left = gPrev && i > 0 ? lerp(gPrev.left, gCur.left) : gCur.left;
    const width = gPrev && i > 0 ? lerp(gPrev.width, gCur.width) : gCur.width;
    win.style.transform = "translateX(" + left + "px)";
    win.style.width = width + "px";
    win.style.opacity = "1";
    // overlap zone = [cur, prev+size) -- the tail repeated from the previous window.
    if (i > 0 && overlap > 0 && p >= 1) {
      const ovFrom = charEls[cur];
      const ovToIdx = Math.min(prev + size, text.length) - 1;
      const ovTo = charEls[Math.max(cur, ovToIdx)];
      if (ovFrom && ovTo) {
        const oLeft = ovFrom.offsetLeft;
        const oRight = ovTo.offsetLeft + ovTo.offsetWidth;
        ov.style.transform = "translateX(" + oLeft + "px)";
        ov.style.width = Math.max(0, oRight - oLeft) + "px";
        ov.style.opacity = "1";
      }
    } else {
      ov.style.opacity = "0";
    }
  }

  return { steps, render, destroy() {} };
}

// ---------------------------------------------------------------------------
// mode: recursive -- descent down a separator hierarchy. Each step reveals the
// cuts at the next separator level for the pieces that still exceed `size`.
// ---------------------------------------------------------------------------

function buildRecursive(rootEl, params, caption) {
  const text = String(params.text || "");
  const separators = Array.isArray(params.separators) ? params.separators : ["\n\n", "\n", " ", ""];
  const size = Math.max(1, params.size || 70);
  const { stage } = sceneShell(rootEl, caption, "chunk-anim--recursive");

  const line = el("div", { class: "chunk-anim__line chunk-anim__line--wrap", attrs: { role: "img", "aria-label": "recursive descent cut demo" } });
  const charEls = buildChars(line, text, true);
  stage.appendChild(line);

  // Compute the cut indices revealed at each separator level. A level's cuts are
  // the separator positions inside the pieces that are still longer than `size`.
  const levels = computeRecursiveLevels(text, separators, size);
  const cutEls = []; // [{ idx, level, node }]
  levels.forEach((lvl, level) => {
    lvl.forEach((idx) => {
      cutEls.push({ idx, level, node: mountCut(line, charEls, idx, "lvl-" + level) });
    });
  });

  const steps = levels.map((lvl, i) => ({
    id: "lvl-" + i,
    caption: "Уровень " + i + ": рез по " + describeSep(separators[i]),
    duration: STEP_MS,
  })).filter((_, i) => levels[i].length > 0);
  if (steps.length === 0) steps.push({ id: "lvl-0", caption: "Один чанк", duration: STEP_MS });

  function render(step, progress, atEnd) {
    const p = clamp01(progress, atEnd);
    const active = parseInt((step.id.split("-")[1] || "0"), 10);
    cutEls.forEach((c) => {
      let v;
      if (c.level < active) v = 1;
      else if (c.level === active) v = p;
      else v = 0;
      c.node.style.transform = "scaleY(" + v + ")";
      c.node.style.opacity = v > 0 ? "1" : "0";
    });
  }

  return { steps, render, destroy() {} };
}

/** Per-level separator cut positions for the recursive-descent visual. */
function computeRecursiveLevels(text, separators, size) {
  const levels = [];
  // pieces still in play: [{from, to}] absolute char ranges.
  let pieces = [{ from: 0, to: text.length }];
  for (let s = 0; s < separators.length; s++) {
    const sep = separators[s];
    const cutsThisLevel = [];
    const nextPieces = [];
    pieces.forEach((piece) => {
      if (piece.to - piece.from <= size) {
        return; // already small enough; no further cuts
      }
      const slice = text.slice(piece.from, piece.to);
      const sub = splitWithIndices(slice, sep, piece.from);
      // record boundary cut positions (between sub-pieces)
      for (let k = 1; k < sub.length; k++) cutsThisLevel.push(sub[k].from);
      sub.forEach((sp) => nextPieces.push(sp));
    });
    levels.push(dedupeSorted(cutsThisLevel));
    pieces = nextPieces.length ? nextPieces : pieces;
    if (sep === "") break;
  }
  return levels;
}

function splitWithIndices(slice, sep, base) {
  if (sep === "") {
    const out = [];
    for (let i = 0; i < slice.length; i++) out.push({ from: base + i, to: base + i + 1 });
    return out;
  }
  const out = [];
  let cursor = 0;
  let idx;
  while ((idx = slice.indexOf(sep, cursor)) !== -1) {
    out.push({ from: base + cursor, to: base + idx + sep.length });
    cursor = idx + sep.length;
  }
  out.push({ from: base + cursor, to: base + slice.length });
  return out;
}

function dedupeSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function describeSep(sep) {
  if (sep === "\n\n") return "абзацам";
  if (sep === "\n") return "строкам";
  if (sep === " ") return "словам";
  if (sep === "") return "символам";
  return JSON.stringify(sep);
}

// ---------------------------------------------------------------------------
// mode: structure -- cuts land only on `boundaries`; `forbidden` mid-sentence
// positions are briefly opacity-flagged then skipped.
// ---------------------------------------------------------------------------

function buildStructure(rootEl, params, caption) {
  const text = String(params.text || "");
  const boundaries = (Array.isArray(params.boundaries) ? params.boundaries : []).filter((i) => i > 0 && i < text.length);
  const forbidden = (Array.isArray(params.forbidden) ? params.forbidden : []).filter((i) => i > 0 && i < text.length);
  const { stage } = sceneShell(rootEl, caption, "chunk-anim--structure");

  const line = el("div", { class: "chunk-anim__line chunk-anim__line--wrap", attrs: { role: "img", "aria-label": "structure-aware cut demo" } });
  const charEls = buildChars(line, text, true);
  stage.appendChild(line);

  const okEls = boundaries.map((idx) => mountCut(line, charEls, idx, "ok"));
  const badEls = forbidden.map((idx) => mountCut(line, charEls, idx, "bad"));

  // Steps interleave: for each forbidden, a "skip" beat; each boundary a "cut" beat.
  // Keep it simple and didactic: one step per boundary, forbidden flagged alongside.
  const steps = boundaries.map((idx, i) => ({
    id: "b-" + i,
    caption: "Рез на границе предложения (" + idx + ")",
    duration: STEP_MS,
  }));
  if (steps.length === 0) steps.push({ id: "b-0", caption: "Нет границ", duration: STEP_MS });

  function render(step, progress, atEnd) {
    const p = clamp01(progress, atEnd);
    const active = parseInt((step.id.split("-")[1] || "0"), 10);
    okEls.forEach((c, i) => {
      const v = i < active ? 1 : i === active ? p : 0;
      c.style.transform = "scaleY(" + v + ")";
      c.style.opacity = v > 0 ? "1" : "0";
    });
    // forbidden positions flash on the active step then dim (never drawn full).
    badEls.forEach((c) => {
      const flash = active >= 0 ? 0.45 * (atEnd ? 0 : 1) : 0;
      c.style.transform = "scaleY(0.5)";
      c.style.opacity = String(atEnd ? 0.18 : flash);
    });
  }

  return { steps, render, destroy() {} };
}

// ---------------------------------------------------------------------------
// mode: semantic -- similarity bars between neighbour sentences grow (scaleY);
// where a bar is below threshold a cut appears on the next beat.
// ---------------------------------------------------------------------------

function buildSemantic(rootEl, params, caption) {
  const sentences = Array.isArray(params.sentences) ? params.sentences : [];
  const sims = Array.isArray(params.sims) ? params.sims : [];
  const threshold = typeof params.threshold === "number" ? params.threshold : 0.5;
  const { stage } = sceneShell(rootEl, caption, "chunk-anim--semantic");

  const list = el("div", { class: "chunk-anim__sents", attrs: { role: "img", "aria-label": "semantic-shift cut demo" } });
  const rowEls = [];
  const barEls = [];
  const cutEls = [];
  sentences.forEach((s, i) => {
    const row = el("div", { class: "chunk-anim__sent" }, [
      el("span", { class: "chunk-anim__sent-idx", text: String(i + 1) }),
      el("span", { class: "chunk-anim__sent-text", text: s }),
    ]);
    list.appendChild(row);
    rowEls.push(row);
    if (i < sentences.length - 1) {
      const below = sims[i] != null && sims[i] < threshold;
      const bar = el("i", { class: "chunk-anim__bar" + (below ? " is-low" : "") });
      const gap = el("div", { class: "chunk-anim__gap" + (below ? " chunk-anim__gap--cut" : "") }, [
        el("span", { class: "chunk-anim__bar-wrap", attrs: { "aria-hidden": "true" } }, [bar]),
        el("span", { class: "chunk-anim__sim", text: sims[i] != null ? "cos " + sims[i].toFixed(2) : "" }),
      ]);
      list.appendChild(gap);
      barEls.push({ node: bar, val: sims[i] != null ? sims[i] : 0, below });
      cutEls.push({ node: gap, below });
    }
  });
  stage.appendChild(list);

  // two-phase: phase A grows all similarity bars; phase B reveals cuts where below threshold.
  const steps = [
    { id: "sim", caption: "Считаем близость соседних предложений", duration: STEP_MS },
    { id: "cut", caption: "Рез там, где близость падает ниже порога", duration: STEP_MS },
  ];

  function render(step, progress, atEnd) {
    const p = clamp01(progress, atEnd);
    if (step.id === "sim") {
      barEls.forEach((b) => {
        b.node.style.transform = "scaleY(" + (p * b.val) + ")";
        b.node.style.opacity = "1";
      });
      cutEls.forEach((c) => {
        c.node.classList.remove("is-cut");
      });
    } else if (step.id === "cut") {
      barEls.forEach((b) => {
        b.node.style.transform = "scaleY(" + b.val + ")";
      });
      cutEls.forEach((c) => {
        if (c.below) c.node.classList.toggle("is-cut", p >= 0.5 || atEnd);
      });
    }
  }

  return { steps, render, destroy() {} };
}

// ---------------------------------------------------------------------------
// low-level char/cut helpers
// ---------------------------------------------------------------------------

/** Render text as per-char spans inside `parent`; return the span array. */
function buildChars(parent, text, wrap) {
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n") {
      parent.appendChild(el("br"));
      // keep an index placeholder so cut indices stay aligned with char positions.
      const ph = el("span", { class: "chunk-anim__char chunk-anim__char--nl" });
      chars.push(ph);
      parent.appendChild(ph);
      continue;
    }
    const span = el("span", {
      class: "chunk-anim__char" + (ch === " " ? " chunk-anim__char--sp" : ""),
      text: ch === " " ? " " : ch,
    });
    chars.push(span);
    parent.appendChild(span);
  }
  if (wrap) parent.classList.add("chunk-anim__line--wrap");
  return chars;
}

/** Mount a vertical cut line just before char index `idx` (transform-origin top). */
function mountCut(parent, charEls, idx, variant) {
  const target = charEls[idx];
  const cut = el("span", {
    class: "chunk-anim__cut" + (variant ? " chunk-anim__cut--" + variant : ""),
    attrs: { "aria-hidden": "true" },
  });
  cut.style.transform = "scaleY(0)";
  cut.style.opacity = "0";
  if (target && target.parentNode) {
    target.parentNode.insertBefore(cut, target);
  } else {
    parent.appendChild(cut);
  }
  return cut;
}

/** Toggle a .is-active highlight on the chunk segment that just closed. */
function highlightSegments(charEls, cutStarts, len, active, p) {
  if (active < 0) return;
  // chunk just closed = the segment ending at cut index `cutStarts[active+1]`.
  const segStart = cutStarts[active] || 0;
  const segEnd = active + 1 < cutStarts.length ? cutStarts[active + 1] : len;
  for (let i = 0; i < charEls.length; i++) {
    const inSeg = i >= segStart && i < segEnd;
    if (inSeg) charEls[i].style.opacity = String(0.5 + 0.5 * p);
  }
}
