/**
 * grounded-answer.js -- claim <-> chunk grounding link reveal (generation).
 *
 * RESPONSIBILITY: render the "Генерация" drill content as level-1 panel content:
 * the model answer built FROM the cited context chunks. Each answer claim reveals
 * (opacity/transform) only AFTER its source chunk has highlighted and the link
 * between them is drawn; the green "grounded" accent lights only when a claim's
 * citation is matched to a real chunk. A hallucinated citation (source not in
 * the context) reveals with a reject badge and NO green. A toggle shows the
 * no-context case where the honest fallback "Этого нет в документах" is the
 * correct answer (no green). Built from shared/data/generation.js (locale-resolved).
 *
 * This module does NOT own the camera/breadcrumb/zoom-out -- it is mounted BY
 * drilldown-zoom.js as level-1 panel content (page glue renderPanel calls
 * grounded-answer.init(panelHost, config), returns the host, destroy()s the
 * previous instance). It drives its own reveal on the shipped timeline.js rAF
 * clock. No global state.
 *
 * MOTION RULE: transform + opacity only; the claim<->chunk link is a one-shot
 * gated stroke-dashoffset on an inline-SVG overlay line. IO-gated + reduced-motion
 * via timeline.js (reduced => stepper, snap to end over the SAME DOM: links drawn,
 * claims shown). Green = matched-citation accent only. No mascot/traveling dot.
 *
 * Host: this module BUILDS its own structure into rootEl (an empty mount el):
 *   .ga-root
 *     h3.ga-title
 *     .ga-toggle [data-slot="toggle"]      -- cited-answer / no-context switch
 *     .ga-stage
 *       .ga-chunks [data-slot="chunks"]    -- context source chunks (.ga-chunk)
 *       svg.ga-links [data-slot="links"]   -- overlay link lines (stroke-dashoffset)
 *       .ga-answer [data-slot="answer"]    -- answer claims (.ga-claim)
 *     .ga-nocontext [data-slot="nocontext"]-- the fallback case (hidden by default)
 *     .timeline [data-slot="timeline"]
 *
 * Config: {
 *   data:     GenerationModel,  // REQUIRED (locale-resolved generation.js)
 *   announce: (msg) => void     // optional a11y live announcer
 * }
 *
 * export function init(rootEl, config) -> { destroy() }
 */

import { qs, el, svg, clear, listeners } from "./dom.js";
import { init as initTimeline } from "./timeline.js";

const LINK_LEN = 320; // stroke-dasharray length for each link line (px budget)

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || {};
  const ui = data.ui || {};
  const L = listeners();
  const announce = typeof cfg.announce === "function" ? cfg.announce : () => {};

  const chunks = Array.isArray(data.contextChunks) ? data.contextChunks : [];
  const claims = Array.isArray(data.claims) ? data.claims : [];
  const noCtx = data.noContext || {};

  const chunkById = new Map(chunks.map((c) => [c.id, c]));
  const chunkEls = new Map(); // chunk id -> row el
  const claimEls = new Map(); // claim id -> { row, line }
  let timeline = null;
  let mode = "cited"; // "cited" | "nocontext"

  // ---- skeleton ----------------------------------------------------------
  function build() {
    clear(rootEl);
    rootEl.classList.add("ga-root");

    rootEl.appendChild(el("h3", { class: "ga-title", text: ui.answerTitle || "Ответ модели" }));

    const readout = el("p", { class: "ga-model mono", text: (ui.modelLabel || "модель") + ": " + (data.model || "") });
    rootEl.appendChild(readout);

    const toggle = el("div", { class: "ga-toggle", attrs: { "data-slot": "toggle", role: "group", "aria-label": ui.noContextLabel || "режим" } });
    const tCited = el("button", { class: "ga-toggle-btn", attrs: { type: "button", "data-mode": "cited", "aria-pressed": "true" }, text: ui.toggleAnswer || "Ответ с цитатами" });
    const tNo = el("button", { class: "ga-toggle-btn", attrs: { type: "button", "data-mode": "nocontext", "aria-pressed": "false" }, text: ui.toggleNoContext || "Случай без контекста" });
    L.on(tCited, "click", () => setMode("cited"));
    L.on(tNo, "click", () => setMode("nocontext"));
    toggle.append(tCited, tNo);
    rootEl.appendChild(toggle);

    rootEl.appendChild(el("p", { class: "ga-hint", text: ui.hoverHint || "" }));

    const stage = el("div", { class: "ga-stage", attrs: { "data-slot": "stage" } });
    const chunksCol = el("div", { class: "ga-chunks", attrs: { "data-slot": "chunks", role: "list", "aria-label": ui.contextTitle || "источники" } });
    const linksSvg = svg("svg", { class: "ga-links", attrs: { "data-slot": "links", "aria-hidden": "true", preserveAspectRatio: "none", viewBox: "0 0 100 100" } });
    const answerCol = el("div", { class: "ga-answer", attrs: { "data-slot": "answer", "aria-label": ui.answerTitle || "ответ" } });
    stage.append(chunksCol, linksSvg, answerCol);
    rootEl.appendChild(stage);

    const nocontext = el("div", { class: "ga-nocontext", attrs: { "data-slot": "nocontext", hidden: true } });
    rootEl.appendChild(nocontext);

    const tlHost = el("div", { class: "timeline", attrs: { "data-slot": "timeline" } });
    rootEl.appendChild(tlHost);

    return { toggle: { tCited, tNo }, chunksCol, linksSvg, answerCol, nocontext, tlHost };
  }
  const dom = build();

  // ---- context chunks (sources) ------------------------------------------
  function buildChunks() {
    clear(dom.chunksCol);
    chunkEls.clear();
    dom.chunksCol.appendChild(el("p", { class: "ga-col-title", text: ui.contextTitle || "Контекст: источники" }));
    chunks.forEach((c) => {
      const head = el("span", { class: "ga-chunk-src mono", text: "[" + c.source + "]" });
      const body = el("p", { class: "ga-chunk-text", text: c.text });
      const row = el("div", { class: "ga-chunk", attrs: { role: "listitem", "data-chunk": c.id } }, [head, body]);
      row.style.transition = "opacity var(--dur-1, 200ms) var(--ease-1, ease), transform var(--dur-1, 200ms) var(--ease-1, ease)";
      dom.chunksCol.appendChild(row);
      chunkEls.set(c.id, row);
    });
  }

  // ---- answer claims ------------------------------------------------------
  function buildClaims() {
    clear(dom.answerCol);
    claimEls.clear();
    clear(dom.linksSvg);
    dom.answerCol.appendChild(el("p", { class: "ga-col-title", text: ui.answerTitle || "Ответ модели" }));
    claims.forEach((cl) => {
      const grounded = !cl.hallucinated && cl.chunkId && chunkById.has(cl.chunkId);
      const text = el("span", { class: "ga-claim-text", text: cl.text + " " });
      const cite = el("span", { class: "ga-cite mono", attrs: { "data-chunk": cl.chunkId || "" }, text: cl.cite || "" });
      const badge = el("span", {
        class: "ga-badge",
        attrs: { "data-kind": grounded ? "grounded" : "rejected", hidden: true },
        text: grounded ? ui.groundedBadge || "заземлено" : ui.hallucinatedBadge || "отклонить",
      });
      const row = el(
        "p",
        {
          class: "ga-claim",
          attrs: {
            "data-claim": cl.id,
            "data-grounded": String(!!grounded),
            tabindex: "0",
            role: "button",
            "aria-label": cl.text,
          },
        },
        [text, cite, badge]
      );
      row.style.transition = "opacity var(--dur-1, 200ms) var(--ease-1, ease), transform var(--dur-1, 200ms) var(--ease-1, ease)";

      // overlay link line (gated stroke-dashoffset; drawn when grounded reveals)
      const line = svg("line", {
        class: "ga-link",
        attrs: {
          "data-claim": cl.id,
          x1: "0", y1: "0", x2: "0", y2: "0",
          "stroke-dasharray": String(LINK_LEN),
          "stroke-dashoffset": String(LINK_LEN),
        },
      });
      line.style.transition = "stroke-dashoffset var(--dur-2, 380ms) var(--ease-1, ease), opacity var(--dur-1, 200ms) var(--ease-1, ease)";
      line.style.opacity = "0";
      dom.linksSvg.appendChild(line);

      // hover/focus highlights the source chunk (claim<->chunk affordance)
      const hi = () => highlightSource(cl, true);
      const lo = () => highlightSource(cl, false);
      L.on(row, "mouseenter", hi);
      L.on(row, "mouseleave", lo);
      L.on(row, "focus", hi);
      L.on(row, "blur", lo);

      dom.answerCol.appendChild(row);
      claimEls.set(cl.id, { row, line, grounded, claim: cl });
    });
  }

  function highlightSource(cl, on) {
    if (cl.chunkId && chunkById.has(cl.chunkId)) {
      const src = chunkEls.get(cl.chunkId);
      if (src) src.setAttribute("data-active", on ? "true" : "false");
    }
    const ref = claimEls.get(cl.id);
    if (ref) ref.row.setAttribute("data-hover", on ? "true" : "false");
  }

  // ---- no-context fallback -----------------------------------------------
  function buildNoContext() {
    clear(dom.nocontext);
    dom.nocontext.appendChild(el("p", { class: "ga-col-title", text: ui.noContextLabel || "Случай: ответа в контексте нет" }));
    dom.nocontext.appendChild(el("p", { class: "ga-nc-q", text: noCtx.question || "" }));
    const fb = el("p", { class: "ga-nc-fallback", text: noCtx.fallback || "Этого нет в документах." });
    dom.nocontext.appendChild(fb);
    dom.nocontext.appendChild(el("p", { class: "ga-nc-note", text: noCtx.note || "" }));
  }

  // ---- reveal sequencing (timeline renderer) -----------------------------
  // steps: per claim, "ground-<id>" reveals chunk highlight + link + claim.
  function buildSteps() {
    return claims.map((cl, i) => ({
      id: "ground-" + cl.id,
      claimId: cl.id,
      caption:
        cl.hallucinated
          ? ui.captionHallucination || "Цитата не из контекста."
          : i === 0
          ? ui.captionGround || "Утверждение строится из куска."
          : ui.captionReveal || "Утверждение проявляется после сопоставления.",
      duration: 1100,
    }));
  }

  function positionLink(claimId) {
    // compute endpoints in the svg's 0..100 viewBox space from layout boxes.
    const ref = claimEls.get(claimId);
    if (!ref) return;
    const cl = ref.claim;
    if (!cl.chunkId || !chunkById.has(cl.chunkId)) return;
    const srcEl = chunkEls.get(cl.chunkId);
    if (!srcEl) return;
    const stage = dom.linksSvg.parentNode;
    if (!stage) return;
    const sb = stage.getBoundingClientRect();
    if (!sb.width || !sb.height) return;
    const a = srcEl.getBoundingClientRect();
    const b = ref.row.getBoundingClientRect();
    const x1 = ((a.right - sb.left) / sb.width) * 100;
    const y1 = ((a.top + a.height / 2 - sb.top) / sb.height) * 100;
    const x2 = ((b.left - sb.left) / sb.width) * 100;
    const y2 = ((b.top + b.height / 2 - sb.top) / sb.height) * 100;
    ref.line.setAttribute("x1", String(x1));
    ref.line.setAttribute("y1", String(y1));
    ref.line.setAttribute("x2", String(x2));
    ref.line.setAttribute("y2", String(y2));
  }

  function resetReveal() {
    chunkEls.forEach((row) => row.setAttribute("data-revealed", "false"));
    claimEls.forEach((ref) => {
      ref.row.style.opacity = "0";
      ref.row.setAttribute("data-revealed", "false");
      ref.line.style.opacity = "0";
      ref.line.setAttribute("stroke-dashoffset", String(LINK_LEN));
      const badge = qs(".ga-badge", ref.row);
      if (badge) badge.hidden = true;
    });
  }

  function revealClaim(claimId, drawLink) {
    const ref = claimEls.get(claimId);
    if (!ref) return;
    const cl = ref.claim;
    // 1) source chunk lights
    if (cl.chunkId && chunkEls.has(cl.chunkId)) {
      chunkEls.get(cl.chunkId).setAttribute("data-revealed", "true");
    }
    // 2) link draws (gated stroke-dashoffset) -- only when grounded
    if (ref.grounded) {
      positionLink(claimId);
      ref.line.style.opacity = "1";
      ref.line.setAttribute("stroke-dashoffset", drawLink ? "0" : String(LINK_LEN));
    }
    // 3) claim reveals
    ref.row.style.opacity = "1";
    ref.row.setAttribute("data-revealed", "true");
    // 4) badge: green grounded only when matched; reject for hallucination
    const badge = qs(".ga-badge", ref.row);
    if (badge) badge.hidden = false;
  }

  function render(step, progress, atEnd) {
    if (mode === "nocontext") return; // no-context view is static
    const idx = claims.findIndex((c) => "ground-" + c.id === step.id);
    resetReveal();
    // all prior claims fully revealed; current draws its link per progress.
    for (let i = 0; i < idx; i += 1) revealClaim(claims[i].id, true);
    if (idx >= 0) revealClaim(claims[idx].id, atEnd || progress >= 0.5);
    if (atEnd) claims.forEach((c) => revealClaim(c.id, true));
  }

  // ---- mode toggle --------------------------------------------------------
  function setMode(next) {
    if (next === mode) return;
    mode = next;
    dom.toggle.tCited.setAttribute("aria-pressed", String(mode === "cited"));
    dom.toggle.tNo.setAttribute("aria-pressed", String(mode === "nocontext"));
    const showCited = mode === "cited";
    const stage = dom.chunksCol.parentNode;
    if (stage) stage.hidden = !showCited;
    dom.nocontext.hidden = showCited;
    if (dom.tlHost) dom.tlHost.hidden = !showCited;
    if (showCited && timeline && typeof timeline.seek === "function") {
      timeline.seek(claims.length); // snap revealed state
    }
    announce(showCited ? ui.answerTitle || "Ответ" : ui.noContextLabel || "Без контекста");
  }

  // ---- wire up ------------------------------------------------------------
  buildChunks();
  buildClaims();
  buildNoContext();

  // reposition links on resize (layout-dependent endpoints).
  const onResize = () => {
    if (mode !== "cited") return;
    claimEls.forEach((ref) => {
      if (ref.grounded && ref.row.getAttribute("data-revealed") === "true") positionLink(ref.claim.id);
    });
  };
  L.on(window, "resize", onResize);

  timeline = initTimeline(dom.tlHost, {
    steps: buildSteps(),
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
