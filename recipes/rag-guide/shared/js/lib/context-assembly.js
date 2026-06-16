/**
 * context-assembly.js -- template fill + token-budget visual (assemble-context).
 *
 * RESPONSIBILITY: render the "Сборка контекста" drill content as level-1 panel
 * content: the retrieved top-k chunks packed into a prompt template under a
 * token budget, in four didactic steps (dedup -> order -> budget -> fill), with
 * a budget slider and an order toggle. Built from the section data contract
 * (shared/data/assemble-context.js, resolved by active locale).
 *
 * This module does NOT own the camera, breadcrumb, or zoom-out -- it is mounted
 * BY drilldown-zoom.js as the level-1 panel content (the page glue's renderPanel
 * calls context-assembly.init(panelHost, config) and returns the host, then
 * destroy()s the previous instance). It drives its own step sequencing on the
 * shipped timeline.js rAF clock; no global state.
 *
 * MOTION RULE (do-not #5, hard): animate transform + opacity ONLY. Over-budget
 * chunks are trimmed via OPACITY (opacity -> 0). Any height change SNAPS -- this
 * module NEVER sets a height/max-height transition and never tweens layout box.
 * Trimmed rows get [data-trimmed="true"] (SB styles the snap collapse with NO
 * height transition); the only inline transition this module sets is on opacity
 * and transform. IO-gated + reduced-motion via timeline.js (reduced => stepper,
 * snap to end over the SAME DOM). No mascot/traveling dot.
 *
 * Host: this module BUILDS its own structure into rootEl. It expects an empty
 * mount element (the camera's panel slot child). Built skeleton:
 *   .ca-root
 *     h3.ca-title
 *     .ca-controls  ( [data-slot="budget"] slider + [data-slot="order"] toggle )
 *     .ca-stage
 *       .ca-pool   [data-slot="pool"]    -- ranked source chunk rows (.ca-chunk)
 *       .ca-prompt [data-slot="prompt"]  -- the prompt template being filled
 *     .ca-counter [data-slot="counter"]  -- live token readout (mono text)
 *     .timeline  [data-slot="timeline"]  -- timeline.js controls + caption
 *
 * Config: {
 *   data:     AssembleModel,   // REQUIRED (locale-resolved assemble-context.js)
 *   announce: (msg) => void    // optional a11y live announcer
 * }
 *
 * export function init(rootEl, config) -> { destroy() }
 */

import { el, clear, listeners } from "./dom.js";
import { init as initTimeline } from "./timeline.js";

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || {};
  const tpl = data.template || {};
  const ui = data.ui || {};
  const L = listeners();
  const announce = typeof cfg.announce === "function" ? cfg.announce : () => {};

  const allChunks = Array.isArray(data.chunks) ? data.chunks.slice() : [];
  const budgetCfg = data.maxContextTokens || { min: 500, max: 4000, step: 100, default: 1600 };
  let currentOrder = data.defaultOrder || "by-score";
  let maxTokens = budgetCfg.default != null ? budgetCfg.default : 1600;

  let timeline = null;
  const chunkEls = new Map(); // chunk id -> { row, ctxLine }

  // ---- pure model: dedup -> order -> budget pick --------------------------
  function deduped() {
    // drop near-duplicates flagged via dupOf (keep the higher-score original).
    return allChunks.filter((c) => !c.dupOf);
  }

  function ordered(list) {
    // input is score-desc already.
    if (currentOrder === "by-edges") {
      // strongest at the edges, weakest in the middle (lost-in-the-middle).
      const head = [];
      const tail = [];
      list.forEach((c, i) => (i % 2 === 0 ? head : tail).push(c));
      return head.concat(tail.reverse());
    }
    return list.slice(); // by-score
  }

  function picked(list) {
    // take chunks while fixed + accumulated cost fits maxTokens.
    const ids = new Set();
    let used = tpl.fixedTokens || 0;
    for (const c of list) {
      const cost = (c.tokens || 0) + 8; // +separator/source tag
      if (used + cost > maxTokens) break;
      used += cost;
      ids.add(c.id);
    }
    return { ids, used };
  }

  // ---- build skeleton -----------------------------------------------------
  function build() {
    clear(rootEl);
    rootEl.classList.add("ca-root");

    rootEl.appendChild(el("h3", { class: "ca-title", text: ui.title || "Assemble context" }));

    // controls
    const controls = el("div", { class: "ca-controls" });

    const budgetWrap = el("label", { class: "ca-budget", attrs: { "data-slot": "budget" } });
    budgetWrap.appendChild(el("span", { class: "ca-ctl-label", text: ui.budgetSliderLabel || "max_context_tokens" }));
    const slider = el("input", {
      class: "ca-slider",
      type: "range",
      attrs: {
        min: String(budgetCfg.min),
        max: String(budgetCfg.max),
        step: String(budgetCfg.step || 100),
        value: String(maxTokens),
        "aria-label": ui.budgetSliderLabel || "max_context_tokens",
      },
    });
    const sliderVal = el("output", { class: "ca-slider-val mono", text: String(maxTokens) });
    budgetWrap.append(slider, sliderVal);

    const orderWrap = el("div", { class: "ca-order", attrs: { role: "group", "aria-label": ui.orderToggleLabel || "order" } });
    orderWrap.appendChild(el("span", { class: "ca-ctl-label", text: ui.orderToggleLabel || "Порядок кусков" }));
    const orderBtns = new Map();
    (data.order || ["by-score", "by-edges"]).forEach((key) => {
      const label = key === "by-edges" ? ui.orderByEdges || "по краям" : ui.orderByScore || "по score";
      const btn = el("button", {
        class: "ca-order-btn",
        attrs: {
          type: "button",
          "data-order": key,
          "aria-pressed": String(key === currentOrder),
        },
        text: label,
      });
      L.on(btn, "click", () => setOrder(key));
      orderBtns.set(key, btn);
      orderWrap.appendChild(btn);
    });

    controls.append(budgetWrap, orderWrap);
    rootEl.appendChild(controls);

    // stage: pool of ranked chunks + the prompt template
    const stage = el("div", { class: "ca-stage" });

    const pool = el("div", { class: "ca-pool", attrs: { "data-slot": "pool", role: "list", "aria-label": ui.poolLabel || "retrieved chunks" } });
    const prompt = el("div", { class: "ca-prompt", attrs: { "data-slot": "prompt" } });

    stage.append(pool, prompt);
    rootEl.appendChild(stage);

    const counter = el("div", { class: "ca-counter mono", attrs: { "data-slot": "counter", role: "status", "aria-live": "polite" } });
    rootEl.appendChild(counter);

    const tlHost = el("div", { class: "timeline", attrs: { "data-slot": "timeline" } });
    rootEl.appendChild(tlHost);

    return { slider, sliderVal, orderBtns, pool, prompt, counter, tlHost };
  }

  const dom = build();

  // ---- pool rows (every chunk has a row; states drive opacity, never height tween)
  function buildPool() {
    clear(dom.pool);
    chunkEls.clear();
    allChunks.forEach((c) => {
      const head = el("div", { class: "ca-chunk-head" }, [
        el("span", { class: "ca-chunk-src mono", text: "[" + c.source + "]" }),
        el("span", { class: "ca-chunk-score mono", text: "cos " + (c.score != null ? c.score.toFixed(2) : "") }),
        el("span", { class: "ca-chunk-tok mono", text: (c.tokens || 0) + " tok" }),
      ]);
      const body = el("p", { class: "ca-chunk-text", text: c.text });
      const dupBadge = el("span", { class: "ca-dup-badge", text: ui.dupBadge || "дубль" });
      const row = el(
        "div",
        {
          class: "ca-chunk",
          attrs: { role: "listitem", "data-chunk": c.id, "data-dup": c.dupOf ? "true" : "false" },
        },
        c.dupOf ? [head, body, dupBadge] : [head, body]
      );
      // ONLY transform/opacity transitions ever set inline (NEVER height).
      row.style.transition = "opacity var(--dur-1, 200ms) var(--ease-1, ease), transform var(--dur-1, 200ms) var(--ease-1, ease)";
      dom.pool.appendChild(row);
      chunkEls.set(c.id, { row });
    });
  }

  // ---- prompt template lines ---------------------------------------------
  let promptCtxLines = new Map(); // chunk id -> ctx line element
  function buildPrompt() {
    clear(dom.prompt);
    promptCtxLines = new Map();
    dom.prompt.appendChild(el("p", { class: "ca-line ca-line--sys", text: tpl.instruction || "" }));
    dom.prompt.appendChild(el("p", { class: "ca-line ca-line--ctx-label", text: tpl.contextLabel || "Контекст:" }));
    const ctxWrap = el("div", { class: "ca-ctx-lines", attrs: { "data-slot": "ctx" } });
    dom.prompt.appendChild(ctxWrap);
    // one ctx slot per non-dup chunk in current order; filled during step 4.
    ordered(deduped()).forEach((c, i) => {
      const line = el("p", {
        class: "ca-line ca-line--ctx",
        attrs: { "data-chunk": c.id },
        text: "[" + (i + 1) + "] " + c.source + ": " + c.text,
      });
      line.style.transition = "opacity var(--dur-1, 200ms) var(--ease-1, ease), transform var(--dur-1, 200ms) var(--ease-1, ease)";
      ctxWrap.appendChild(line);
      promptCtxLines.set(c.id, line);
    });
    dom.prompt.appendChild(
      el("p", { class: "ca-line ca-line--q", text: (tpl.questionLabel || "Вопрос:") + " " + (tpl.question || "") })
    );
    dom.prompt.appendChild(el("p", { class: "ca-line ca-line--a", text: tpl.answerLabel || "Ответ:" }));
    const trimmed = el("p", { class: "ca-trimmed", attrs: { "data-slot": "trimmed", hidden: true } });
    trimmed.textContent = "... " + (ui.trimmedNote || "остальное обрезано по бюджету");
    dom.prompt.appendChild(trimmed);
    return trimmed;
  }
  let trimmedNoteEl = buildPrompt();

  // ---- render a phase (timeline step renderer) ---------------------------
  // step ids: "dedup", "order", "budget", "fill". progress 0..1, atEnd bool.
  function setRowState(id, state) {
    const ref = chunkEls.get(id);
    if (!ref) return;
    ref.row.setAttribute("data-state", state);
  }

  function resetVisual() {
    chunkEls.forEach((ref) => {
      ref.row.removeAttribute("data-state");
      ref.row.removeAttribute("data-trimmed");
      ref.row.style.opacity = "";
      ref.row.style.transform = "";
    });
    promptCtxLines.forEach((line) => {
      line.setAttribute("data-filled", "false");
      line.style.opacity = "0";
    });
    if (trimmedNoteEl) trimmedNoteEl.hidden = true;
  }

  function applyDedup() {
    allChunks.forEach((c) => {
      if (c.dupOf) {
        // trim duplicate via OPACITY; height SNAPS (data-trimmed, no height tween).
        const ref = chunkEls.get(c.id);
        if (ref) {
          ref.row.style.opacity = "0";
          ref.row.setAttribute("data-trimmed", "true");
        }
      }
    });
  }

  function applyOrder() {
    // reorder the pool rows to reflect currentOrder over the deduped set.
    const seq = ordered(deduped());
    seq.forEach((c) => {
      const ref = chunkEls.get(c.id);
      if (ref) dom.pool.appendChild(ref.row); // reflow order; flex order also fine
    });
    // keep duplicates at the end, trimmed.
    allChunks.filter((c) => c.dupOf).forEach((c) => {
      const ref = chunkEls.get(c.id);
      if (ref) dom.pool.appendChild(ref.row);
    });
  }

  function applyBudget() {
    const seq = ordered(deduped());
    const sel = picked(seq);
    let anyTrim = false;
    seq.forEach((c) => {
      const inBudget = sel.ids.has(c.id);
      setRowState(c.id, inBudget ? "kept" : "over");
      const ref = chunkEls.get(c.id);
      if (ref) {
        ref.row.style.opacity = inBudget ? "1" : "0"; // over-budget trimmed via opacity
        if (!inBudget) {
          ref.row.setAttribute("data-trimmed", "true"); // height SNAPS, no tween
          anyTrim = true;
        } else {
          ref.row.removeAttribute("data-trimmed");
        }
      }
    });
    if (trimmedNoteEl) trimmedNoteEl.hidden = !anyTrim;
    return sel;
  }

  function applyFill(progress0to1, atEnd) {
    const seq = ordered(deduped());
    const sel = picked(seq);
    const keptInOrder = seq.filter((c) => sel.ids.has(c.id));
    const reveal = atEnd ? keptInOrder.length : Math.round(progress0to1 * keptInOrder.length);
    keptInOrder.forEach((c, i) => {
      const line = promptCtxLines.get(c.id);
      if (!line) return;
      const show = i < reveal || atEnd;
      line.setAttribute("data-filled", show ? "true" : "false");
      line.style.opacity = show ? "1" : "0";
    });
    // non-kept ctx lines stay hidden (their chunk did not make budget).
    seq.filter((c) => !sel.ids.has(c.id)).forEach((c) => {
      const line = promptCtxLines.get(c.id);
      if (line) line.style.opacity = "0";
    });
    return sel;
  }

  function updateCounter(used) {
    dom.counter.textContent =
      (ui.counterLabel || "бюджет токенов") +
      ": " +
      used +
      " / " +
      maxTokens +
      " " +
      (ui.tokensUnit || "токенов");
  }

  const steps = [
    { id: "dedup", caption: ui.captionDedup || "Убираем дубли.", duration: 1100 },
    { id: "order", caption: ui.captionOrder || "Раскладываем порядок.", duration: 1100 },
    { id: "budget", caption: ui.captionBudget || "Считаем токены.", duration: 1200 },
    { id: "fill", caption: ui.captionFill || "Заполняем шаблон.", duration: 1600 },
  ];

  function render(step, progress, atEnd) {
    // cumulative: each step assumes prior steps applied (timeline replays from 0
    // on play; on scrub we re-apply prior phases idempotently).
    const idx = steps.findIndex((s) => s.id === step.id);

    // phases up to the current one are fully applied; current is progressive.
    resetVisual();
    if (idx >= 0) applyDedup();
    if (idx >= 1) applyOrder();
    let sel = null;
    if (idx >= 2) sel = applyBudget();
    if (idx >= 3) sel = applyFill(progress, atEnd);

    // if budget step is current, reveal kept/over progressively-ish (snap kept on)
    if (step.id === "budget") sel = applyBudget();
    if (step.id === "fill" && !sel) sel = applyFill(progress, atEnd);

    const used = sel ? sel.used : (tpl.fixedTokens || 0);
    updateCounter(used);
  }

  // ---- controls behaviour -------------------------------------------------
  function refresh() {
    // re-run the full pipeline to its end state for the current controls.
    if (timeline && typeof timeline.seek === "function") {
      timeline.seek(steps.length); // snap to final state
    }
  }

  function setOrder(key) {
    if (key === currentOrder) return;
    currentOrder = key;
    dom.orderBtns.forEach((btn, k) => btn.setAttribute("aria-pressed", String(k === key)));
    trimmedNoteEl = buildPrompt(); // ctx slots depend on order
    refresh();
    announce((ui.orderToggleLabel || "Порядок") + ": " + (key === "by-edges" ? ui.orderByEdges : ui.orderByScore));
  }

  function onSlider() {
    maxTokens = parseInt(dom.slider.value, 10) || maxTokens;
    dom.sliderVal.textContent = String(maxTokens);
    refresh();
  }
  L.on(dom.slider, "input", onSlider);

  // ---- wire up ------------------------------------------------------------
  buildPool();
  timeline = initTimeline(dom.tlHost, {
    steps,
    render,
    autoplay: true,
  });

  return {
    destroy() {
      if (timeline && typeof timeline.destroy === "function") timeline.destroy();
      timeline = null;
      L.off();
    },
  };
}
