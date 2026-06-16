/**
 * process-anim.js -- the worked-example centerpiece, built ON TOP of timeline.js.
 *
 * RESPONSIBILITY: render the document -> chunks -> embeddings worked example
 * from worked-example.json (doc / chunks / vectors / steps schema), and let
 * timeline.js sequence it. Renders the PDF-of-text splitting into chunks, each
 * chunk embedding into a vector, then vectors being stored. Animate
 * transform/opacity ONLY; reduced motion snaps to the end state (identical DOM).
 *
 * Two entry points, both standard init() shape:
 *   - init(rootEl, config) with config.data => builds the scene, mounts its own
 *     timeline.js, returns { destroy }. This is what page glue uses.
 *   - if config.data is absent it will fetch config.dataSrc.
 *
 * The renderer is pure: timeline.js calls render(step, progress, atEnd); this
 * module only mutates transform/opacity + a couple of state classes.
 */

import { qs, el, clear, stripMeta, fetchJson } from "./dom.js";
import { init as initTimeline } from "./timeline.js";

export function init(rootEl, config) {
  const cfg = config || {};
  let scene = null;
  let timeline = null;
  let destroyed = false;

  // Build now if data is inlined, else fetch.
  if (cfg.data) {
    build(cfg.data);
  } else if (cfg.dataSrc) {
    fetchJson(cfg.dataSrc)
      .then((json) => {
        if (!destroyed) build(stripMeta(json));
      })
      .catch((err) => console.error("[process-anim]", err));
  }

  function build(data) {
    scene = buildScene(rootEl, data);
    const stage = rootEl.querySelector(".timeline") || rootEl;
    timeline = initTimeline(stage, {
      steps: data.steps || [],
      autoplay: cfg.autoplay,
      speed: cfg.speed,
      render: (step, progress, atEnd) => scene.render(step, progress, atEnd),
    });
  }

  return {
    /** Direct renderer access (when an external timeline drives this scene). */
    render(step, progress, atEnd) {
      if (scene) scene.render(step, progress, atEnd);
    },
    destroy() {
      destroyed = true;
      if (timeline) timeline.destroy();
      if (scene) scene.destroy();
    },
  };
}

/**
 * Build the doc/chunks/vectors DOM into rootEl and return a render() driver.
 * Adds the controls host (.timeline) so init(rootEl) can mount a timeline on it.
 */
function buildScene(rootEl, data) {
  const doc = data.doc || { text: "", title: "" };
  const chunks = data.chunks || [];
  const vectors = data.vectors || [];

  const wrap = el("div", { class: "process-anim", dataset: { phase: "idle" } });

  // ---- document column ----
  const docCol = el("div", { class: "process-anim__doc" });
  docCol.appendChild(el("p", { class: "process-anim__doc-title card__meta", text: doc.title || "Document" }));

  // Render doc.text as per-chunk spans so split highlighting is precise.
  const docBody = el("div", { class: "process-anim__doc-body" });
  const chunkSpans = {};
  let cursor = 0;
  chunks.forEach((c) => {
    const from = typeof c.fromChar === "number" ? c.fromChar : cursor;
    const to = typeof c.toChar === "number" ? c.toChar : from + (c.text || "").length;
    if (from > cursor) {
      docBody.appendChild(document.createTextNode(doc.text.slice(cursor, from)));
    }
    const span = el("span", {
      class: "process-anim__doc-chunk",
      text: c.text || doc.text.slice(from, to),
      dataset: { chunkId: c.id },
    });
    chunkSpans[c.id] = span;
    docBody.appendChild(span);
    cursor = to;
  });
  if (cursor < (doc.text || "").length) {
    docBody.appendChild(document.createTextNode(doc.text.slice(cursor)));
  }
  docCol.appendChild(docBody);

  // ---- chunks column ----
  const chunkCol = el("div", { class: "process-anim__chunks" });
  const chunkCards = {};
  chunks.forEach((c, i) => {
    const card = el("div", {
      class: `process-anim__chunk accent-${(i % 4) + 1}`,
      dataset: { chunkId: c.id, state: "pending" },
    });
    card.appendChild(el("span", { class: "process-anim__chunk-id card__meta", text: c.id }));
    card.appendChild(el("span", { class: "process-anim__chunk-text", text: c.text || "" }));
    chunkCards[c.id] = card;
    chunkCol.appendChild(card);
  });

  // ---- vectors column ----
  const vecCol = el("div", { class: "process-anim__vectors" });
  const vecCards = {};
  vectors.forEach((v, i) => {
    const card = el("div", {
      class: `process-anim__vector accent-${(i % 4) + 1}`,
      dataset: { vectorId: v.id, chunkId: v.chunkId, state: "pending" },
    });
    const vals = (v.values || []).map((n) => n.toFixed(3)).join(", ");
    card.appendChild(el("span", { class: "process-anim__vector-id card__meta", text: `${v.id} (dim ${v.dim || "?"})` }));
    card.appendChild(el("span", { class: "process-anim__vector-values", text: `[${vals}${v.values && v.values.length ? ", ..." : ""}]` }));
    vecCards[v.id] = card;
    vecCol.appendChild(card);
  });

  const stage = el("div", { class: "process-anim__stage" }, [docCol, chunkCol, vecCol]);

  // controls host for timeline.js (.timeline shell + caption already styled in base.css)
  const tl = el("div", { class: "timeline process-anim__timeline" });
  const progressTrack = el("span", { class: "timeline__progress" });
  void progressTrack; // timeline.js creates its own track wrapper; keep DOM minimal

  wrap.append(stage, tl);
  clear(rootEl);
  rootEl.appendChild(wrap);

  const vectorByChunk = {};
  vectors.forEach((v) => {
    vectorByChunk[v.chunkId] = v.id;
  });

  function setState(map, ids, state) {
    (ids || []).forEach((id) => {
      const node = map[id];
      if (node) node.dataset.state = state;
    });
  }

  // progress drives opacity/transform via CSS data-state + inline custom prop.
  function render(step, progress, atEnd) {
    const p = atEnd ? 1 : Math.max(0, Math.min(1, progress));
    wrap.dataset.phase = step.kind;

    if (step.kind === "split") {
      // active chunks emerge from the doc
      (step.targets || []).forEach((id) => {
        if (chunkSpans[id]) chunkSpans[id].dataset.state = atEnd ? "done" : "active";
        const card = chunkCards[id];
        if (card) {
          card.dataset.state = atEnd ? "done" : "active";
          card.style.setProperty("--p", String(p));
        }
      });
    } else if (step.kind === "embed") {
      (step.targets || []).forEach((id) => {
        const card = chunkCards[id];
        if (card) card.dataset.state = "done";
        const vId = vectorByChunk[id];
        const vCard = vId && vecCards[vId];
        if (vCard) {
          vCard.dataset.state = atEnd ? "done" : "active";
          vCard.style.setProperty("--p", String(p));
        }
      });
    } else if (step.kind === "store") {
      (step.targets || []).forEach((id) => {
        const vCard = vecCards[id];
        if (vCard) {
          vCard.dataset.state = atEnd ? "stored" : "active";
          vCard.style.setProperty("--p", String(p));
        }
      });
    }

    // Reduced-motion / end-state snap: when a step lands at its end, any card
    // whose materialize belongs to an EARLIER phase may never have had --p
    // advanced (the embed branch never ran if the user seeked straight to store
    // under reduced motion). Drive every already-visible card's --p to the end
    // value so both the animated and the reduced-motion paths rest at --p: 1.
    //
    // Under reduced motion timeline.js calls applyAt(steps.length) ONCE, so only
    // the last step ("store") branch runs and the split/embed branches never set
    // the doc-chunk SPANS or chunk CARDS to "done" -- the source-text highlights
    // would stay "pending". Drive the FULL terminal state across every chunk and
    // vector so the reduced-motion end state matches the animated end state. The
    // load-bearing line is the doc-chunk SPANS -> "done" (the chunk CARDS are
    // already forced visible by CSS under reduced motion, but the spans are not).
    if (atEnd) {
      chunks.forEach((c) => {
        if (chunkSpans[c.id]) chunkSpans[c.id].dataset.state = "done";
        if (chunkCards[c.id]) chunkCards[c.id].dataset.state = "done";
      });
      vectors.forEach((v) => {
        if (vecCards[v.id]) vecCards[v.id].dataset.state = "stored";
      });
      snapVisibleProgress();
    }
  }

  // Reduced-motion / end-state snap. The end state is fully described by the
  // resting data-state classes (which the CSS keys opacity/transform off) plus
  // --p: 1. Width is NEVER driven here: per the transform/opacity-only motion
  // policy the card width flows naturally from the grid/flex layout, identical
  // in both paths. We must NOT measure-and-pin an inline px width: that captured
  // a transition-in-flight value under one path (or `auto`/0 under another) and
  // is exactly what made the reduced-motion end state diverge from the animated
  // end state (335.1px vs 328.4px; auto vs 48.45px). Setting --p to its end
  // value is the only snap needed -- same DOM, same classes, same geometry.
  function snapCardWidth(card) {
    card.style.setProperty("--p", "1");
  }
  function snapVisibleProgress() {
    Object.values(chunkCards).forEach((card) => {
      const st = card.dataset.state;
      if (st === "active" || st === "done") snapCardWidth(card);
    });
    Object.values(vecCards).forEach((card) => {
      const st = card.dataset.state;
      if (st === "active" || st === "done" || st === "stored") snapCardWidth(card);
    });
  }

  return {
    render,
    destroy() {
      clear(rootEl);
    },
  };
}
