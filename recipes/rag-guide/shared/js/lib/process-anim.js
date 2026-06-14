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
    // so its width snaps to the END px instead of computing auto.
    if (atEnd) {
      snapVisibleProgress();
    }
  }

  // Reduced-motion / end-state snap. The materialize width must land on a
  // DETERMINISTIC end px, not the interpolated `auto` it would read when the
  // user seeks straight to a later step (the --p the CSS width keyed off was
  // never advanced for the skipped phase). We advance --p to its end value AND,
  // crucially, pin the END width explicitly inline on each materialized card so
  // the computed width is a real px regardless of which phases actually ran.
  // Same DOM, no alternate markup -- we only set an inline width on the cards
  // already present and visible.
  function snapCardWidth(card) {
    card.style.setProperty("--p", "1");
    // Measure the laid-out end width and pin it inline so the snapped state is
    // a concrete px (not "auto") even when the --p-driven transition was skipped.
    const w = card.getBoundingClientRect().width;
    if (w > 0) card.style.width = w + "px";
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
