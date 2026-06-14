/**
 * pipeline.js -- left-to-right pipeline-flow + per-node drill content (AtlasMD 3.9).
 *
 * RESPONSIBILITY: render the seven-stage RAG pipeline (Запрос -> Эмбеддинг ->
 * Векторный индекс -> Топ-k -> Сборка контекста -> LLM -> Ответ) as rect
 * node-cards over a quiet one-time spine draw-in, and build the per-node detail
 * panel (level 1) + optional deep panel (level 2) on demand, including the
 * didactic per-node mechanism animations (text->tokens->vector; cosine bars +
 * top-k; chunks drop into the prompt + budget meter). Each block is built from
 * the section data contract (shared/data/what-rag.js).
 *
 * This module does NOT own the camera, breadcrumb, zoom-out, or earned-progress
 * state -- it CONSUMES:
 *   - drilldown-zoom.js : the semantic-zoom camera (zstack, breadcrumb, lens-minus,
 *     Escape, selection kept on zoom-out, panel grow-to-fit). pipeline.js builds
 *     the camera here and hands it `renderPanel(entry)`; node clicks call
 *     camera.openNode(...), inline lens-plus buttons call camera.openDeep(...).
 *   - progress.js : the earned-green strip. Passed THROUGH to the camera as
 *     config.progress so the camera marks a node visited on every openNode; this
 *     module additionally lights the rect node-card green + flips "вы здесь" via
 *     the progress instance (markVisited / markCurrent / isVisited / isComplete).
 *
 * No global state. transform/opacity-only motion; one-shot, IO + reduced-motion
 * gated; reduced-motion snaps to the end state over the SAME DOM.
 *
 * Host: [data-component="pipeline"] containing
 *   [data-slot="flow"]   -- the spine SVG (.edge-base + .edge-draw + .edge-prog)
 *   [data-slot="nodes"]  -- the .nodes-grid mount (node-cards built here)
 * The pipeline host sits inside the drilldown stage:
 *   [data-component="drilldown-host"] > [data-slot="stage"] wraps the pipeline.
 *
 * Config: {
 *   data:     PipelineData,            // REQUIRED (shared/data/what-rag.js shape)
 *   camera:   drilldownInstance,       // REQUIRED (init'd by the page glue)
 *   progress: progressInstance,        // optional earned-green strip
 *   announce: (msg) => void            // optional a11y live announcer
 * }
 *
 * export function init(rootEl, config) -> {
 *   renderPanel(entry), markNode(id), refreshNodeStates(), destroy()
 * }
 */

import { qs, el, svg, clear, listeners } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";
import { getLocale } from "./i18n.js";

const SPINE_LEN = 680; // matches stroke-dasharray on the spine paths in markup

// Resolve a value that may be a { ru, en } pair OR a plain lang-neutral string
// (code-ish html, vec numbers, file paths) against the given locale. Falls back
// ru -> en -> "" so a half-translated field never renders [object Object].
function loc(v, lang) {
  if (v && typeof v === "object" && !Array.isArray(v) && ("ru" in v || "en" in v)) {
    return v[lang] != null ? v[lang] : v.ru != null ? v.ru : v.en != null ? v.en : "";
  }
  return v != null ? v : "";
}

const LENS_PLUS =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
  '<line x1="14.8" y1="14.8" x2="21" y2="21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  "</svg>";

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || { order: [], nodes: {} };
  const order = Array.isArray(data.order) ? data.order : [];
  const nodes = data.nodes || {};
  const camera = cfg.camera || null;
  const progress = cfg.progress || null;
  const L = listeners();
  const reduced = prefersReducedMotion();

  // Active locale: explicit config.lang wins, else the i18n store. setLang()
  // updates it and re-labels the node-cards (page glue calls it on lang:change).
  let lang = cfg.lang || getLocale();
  const tr = (v) => loc(v, lang);

  // "you are here" + lens-plus fallback labels, localised.
  const HERE_LABEL = { ru: "вы здесь", en: "you are here" };
  const MORE_LABEL = { ru: "подробнее", en: "more" };

  const nodesHost = rootEl ? qs('[data-slot="nodes"]', rootEl) : null;
  const flowHost = rootEl ? qs('[data-slot="flow"]', rootEl) : null;

  // node-card element registry (id -> .node element) for state updates.
  const nodeEls = new Map();
  let teachTimers = [];

  // ---- build the rect node-cards into the grid ---------------------------
  function buildNodes() {
    if (!nodesHost) return;
    clear(nodesHost);
    nodesHost.setAttribute("role", "list");
    order.forEach((id) => {
      const n = nodes[id];
      if (!n) return;
      const nameTxt = tr(n.label) || id;
      const hintTxt = tr(n.hint);
      const here = el("span", { class: "here", text: tr(HERE_LABEL) });
      const idx = el("span", { class: "idx", text: n.idx || "" });
      const name = el("span", { class: "name", text: nameTxt });
      const hint = el("span", { class: "hint", text: hintTxt });
      const card = el(
        "div",
        {
          class: "node",
          attrs: {
            role: "button",
            tabindex: "0",
            "data-node": id,
            "data-anchor": String(n.anchor != null ? n.anchor : 0),
            "aria-label": nameTxt + (hintTxt ? ", " + hintTxt : ""),
          },
        },
        [here, idx, name, hint]
      );
      const open = () => {
        if (!camera) return;
        camera.openNode({ id, crumb: tr(n.crumb) || tr(n.label) || id, anchor: n.anchor, fromEl: card });
      };
      L.on(card, "click", open);
      L.on(card, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          open();
        }
      });
      nodeEls.set(id, card);
      nodesHost.appendChild(card);
    });
  }

  // ---- earned-green node-card states (driven by progress instance) -------
  function refreshNodeStates() {
    const allDone = progress && typeof progress.isComplete === "function" && progress.isComplete();
    if (nodesHost) nodesHost.classList.toggle("done", !!allDone);
    const current = progress && typeof progress.getCurrent === "function" ? progress.getCurrent() : null;
    // NEXT-STEP highlight: the node-card that opens the next uncompleted
    // main-path step. The node-card IS the affordance that opens that step,
    // so we glow it (themed, NEVER blue -- AtlasMD 3.13). No highlight once
    // the whole main path is done (finalized).
    const next =
      !allDone && progress && typeof progress.nextStep === "function"
        ? progress.nextStep()
        : null;
    nodeEls.forEach((card, id) => {
      const visited = progress && typeof progress.isVisited === "function" && progress.isVisited(id);
      card.classList.toggle("visited", !!visited);
      card.classList.toggle("current", !visited && id === current);
      card.classList.toggle("next-step", !visited && id === next);
    });
  }

  // mark a node visited (earned green) + advance "вы здесь"; idempotent.
  function markNode(id) {
    if (progress) {
      if (typeof progress.markVisited === "function") progress.markVisited(id);
      if (typeof progress.markCurrent === "function") progress.markCurrent();
    }
    refreshNodeStates();
  }

  // ===== block renderers (data -> DOM) ====================================
  function elReadout(b) {
    const lbl = el("span", { class: "lbl", text: tr(b.label) });
    const body = el("span", { html: tr(b.html) || "" });
    return el("div", { class: "readout" }, [lbl, body]);
  }

  function elEmbed(b) {
    const wrap = el("div", { class: "embed-anim", attrs: { "aria-hidden": "true" } });
    const stages = (b.stages || []).map((s) => tr(s));
    wrap.appendChild(el("p", { class: "embed-stage", text: stages[0] || "" }));
    wrap.appendChild(el("div", { class: "embed-text", text: tr(b.text) || "" }));
    wrap.appendChild(el("p", { class: "embed-stage", text: stages[1] || "" }));
    const toks = el("div", { class: "embed-tokens" });
    (b.tokens || []).forEach((t) => toks.appendChild(el("span", { class: "tok", text: tr(t) })));
    wrap.appendChild(toks);
    wrap.appendChild(el("p", { class: "embed-stage", text: stages[2] || "" }));
    const vec = el("div", { class: "embed-vec" });
    vec.appendChild(el("span", { class: "vlbl", text: tr(b.vlbl) }));
    (b.vec || []).forEach((v) => vec.appendChild(el("span", { class: "vnum", text: v })));
    if (b.ellip) vec.appendChild(el("span", { class: "vellip", text: b.ellip }));
    wrap.appendChild(vec);
    return wrap;
  }

  function elRank(b) {
    const ul = el("ul", { class: "ranklist", attrs: { "data-topk": String(b.topk || 0) } });
    (b.items || []).forEach((it) => {
      const chunk = el("span", { class: "chunk", text: it.chunk || "" });
      const barfill = el("i", { class: "barfill" });
      const barwrap = el("span", { class: "barwrap", attrs: { "aria-hidden": "true" } }, [barfill]);
      const cos = el("span", { class: "cos", text: it.cos || "" });
      const li = el("li", { attrs: { "data-w": String(it.w != null ? it.w : 0) } }, [chunk, barwrap, cos]);
      ul.appendChild(li);
    });
    return ul;
  }

  function elCards(b) {
    const wrap = el("div", { class: "cards" });
    (b.items || []).forEach((it) => {
      const src = el("div", { class: "src", text: tr(it.src) });
      const txt = el("div", { class: "txt", text: tr(it.txt) });
      wrap.appendChild(el("div", { class: "ccard" }, [src, txt]));
    });
    return wrap;
  }

  function elAssemble(b) {
    const wrap = el("div", { class: "assemble" });
    const prompt = el("div", { class: "prompt" });
    (b.lines || []).forEach((ln) => {
      prompt.appendChild(el("span", { class: (ln.cls || "") + " ctx-line", text: tr(ln.text) }));
    });
    wrap.appendChild(prompt);
    if (b.budget) {
      const meterFill = el("i", { attrs: { "data-w": String(b.budget.w != null ? b.budget.w : 0) } });
      const meter = el("span", { class: "meter", attrs: { "aria-hidden": "true" } }, [meterFill]);
      const amount = el("b", { text: b.budget.b || "" });
      const budgetLbl = tr(b.budgetLabel) || (lang === "en" ? "token budget" : "бюджет токенов");
      const budget = el("div", { class: "budget" }, [
        budgetLbl + " ",
        meter,
        amount,
        " " + tr(b.budgetUnit),
      ]);
      wrap.appendChild(budget);
    }
    return wrap;
  }

  function elAnswer(b) {
    return el("div", { class: "answer", html: tr(b.html) || "" });
  }

  function renderBlocks(parent, blocks) {
    (blocks || []).forEach((b) => {
      switch (b.kind) {
        case "tag":
          parent.appendChild(el("p", { class: "tag", text: tr(b.text) }));
          break;
        case "p":
          parent.appendChild(el("p", { text: tr(b.text) }));
          break;
        case "note":
          parent.appendChild(el("p", { class: "note", text: tr(b.text) }));
          break;
        case "rm":
          parent.appendChild(el("div", { class: "rm-only", text: tr(b.text) }));
          break;
        case "readout":
          parent.appendChild(elReadout(b));
          break;
        case "embed":
          parent.appendChild(elEmbed(b));
          break;
        case "rank":
          parent.appendChild(elRank(b));
          break;
        case "cards":
          parent.appendChild(elCards(b));
          break;
        case "assemble":
          parent.appendChild(elAssemble(b));
          break;
        case "answer":
          parent.appendChild(elAnswer(b));
          break;
        default:
          break;
      }
    });
  }

  // ===== the panel factory the camera calls on every open ================
  // entry: { kind:'node'|'deep', id, crumb, anchor, data? }
  function renderPanel(entry, api) {
    if (!entry) return null;
    if (entry.kind === "node") {
      const n = nodes[entry.id];
      if (!n) return null;
      const nLabel = tr(n.label) || entry.id;
      const panel = el("div", {
        class: "detail show",
        attrs: { role: "group", "aria-label": nLabel },
      });
      panel.appendChild(el("h2", { text: (n.idx ? n.idx + " - " : "") + nLabel }));
      const spec = n.panel || {};
      if (spec.tag) panel.appendChild(el("p", { class: "tag", text: tr(spec.tag) }));
      renderBlocks(panel, spec.blocks);
      // inline lens-plus drill to level 2 (if this node has deep content)
      if (n.deep && api && typeof api.openDeep === "function") {
        const deepTag = tr(n.deep.tag) || tr(n.deep.label) || "";
        const deepCrumb = tr(n.deep.crumb) || tr(MORE_LABEL);
        const openLabel = lang === "en" ? "Open: " : "Открыть: ";
        const btn = el("button", {
          class: "drill",
          attrs: { type: "button", "aria-label": openLabel + deepTag },
          html: LENS_PLUS,
        });
        btn.appendChild(document.createTextNode(" " + (tr(n.deep.drillLabel) || deepCrumb)));
        L.on(btn, "click", (e) => {
          e.preventDefault();
          api.openDeep({ id: entry.id + ".deep", crumb: deepCrumb, data: { parent: entry.id } });
        });
        panel.appendChild(btn);
      }
      // play the per-node didactic mechanism after the pane is in the DOM
      schedulePlay(entry.id, panel);
      return panel;
    }
    if (entry.kind === "deep") {
      const parentId = entry.data && entry.data.parent;
      const n = parentId ? nodes[parentId] : null;
      const deep = n && n.deep;
      if (!deep) return null;
      const deepLabel = tr(deep.label) || entry.crumb || "";
      const panel = el("div", {
        class: "detail show",
        attrs: { role: "group", "aria-label": deepLabel },
      });
      panel.appendChild(el("h2", { text: deepLabel }));
      if (deep.tag) panel.appendChild(el("p", { class: "tag", text: tr(deep.tag) }));
      renderBlocks(panel, deep.blocks);
      return panel;
    }
    return null;
  }

  // ===== didactic per-node animations (transform/opacity only) ===========
  function clearTeachTimers() {
    teachTimers.forEach((t) => clearTimeout(t));
    teachTimers = [];
  }
  function after(ms, fn) {
    if (reduced) {
      fn();
      return;
    }
    teachTimers.push(setTimeout(fn, ms));
  }

  function schedulePlay(nodeId, panel) {
    clearTeachTimers();
    // run after the panel is laid out so transitions play from the start state
    requestAnimationFrame(() => {
      if (nodeId === "n1") playEmbedding(panel);
      else if (nodeId === "n2") playRank(panel);
      else if (nodeId === "n4") playAssemble(panel);
    });
  }

  function playEmbedding(panel) {
    const ea = qs(".embed-anim", panel);
    if (!ea) return;
    void ea.offsetWidth;
    after(60, () => ea.classList.add("run"));
    const nums = ea.querySelectorAll(".vnum");
    nums.forEach((n, i) => after(1250 + i * 150, () => n.classList.add("in")));
    const ell = ea.querySelector(".vellip");
    if (ell) after(1250 + nums.length * 150, () => ell.classList.add("in"));
  }

  function playRank(panel) {
    const rl = qs(".ranklist", panel);
    if (!rl) return;
    const topk = parseInt(rl.getAttribute("data-topk"), 10) || 3;
    const lis = rl.querySelectorAll("li");
    void rl.offsetWidth;
    after(60, () => rl.classList.add("run"));
    lis.forEach((li, i) => {
      const w = li.getAttribute("data-w") || "0";
      const bf = li.querySelector(".barfill");
      after(260 + i * 180, () => {
        if (bf) bf.style.width = w + "%";
      });
      if (i < topk) after(260 + i * 180 + 760, () => li.classList.add("topk"));
    });
  }

  function playAssemble(panel) {
    const as = qs(".assemble", panel);
    if (!as) return;
    void as.offsetWidth;
    after(60, () => as.classList.add("run"));
    const lines = as.querySelectorAll(".prompt .ctx-line");
    lines.forEach((ln, i) => {
      ln.style.transitionDelay = i * 130 + "ms";
    });
    const meter = as.querySelector(".budget .meter i");
    if (meter) {
      const w = meter.getAttribute("data-w") || "0";
      after(700, () => {
        meter.style.width = w + "%";
      });
    }
  }

  // ===== level-0 spine: one-time quiet draw-in (flow direction only) ======
  // Lights NO node. Nodes stay neutral until the user drills them.
  let edgeDraw = flowHost ? qs(".edge-draw", flowHost) : null;
  let io = null;

  function setStaticSpine() {
    if (edgeDraw) edgeDraw.setAttribute("stroke-dashoffset", "0");
  }
  function startSpine() {
    if (edgeDraw) {
      void edgeDraw.getBoundingClientRect();
      edgeDraw.classList.add("drawn");
    }
  }

  // proportional green progress spine mirrors the earned fraction.
  let edgeProg = flowHost ? qs(".edge-prog", flowHost) : null;
  function refreshSpineProgress() {
    if (!edgeProg || !progress || typeof progress.visitedCount !== "function") return;
    const total = order.length || 1;
    const frac = progress.visitedCount() / total;
    edgeProg.setAttribute("stroke-dashoffset", String(SPINE_LEN * (1 - frac)));
  }

  // ===== wire it up =======================================================
  buildNodes();
  refreshNodeStates();
  refreshSpineProgress();

  // keep node-card states + green spine in sync after the camera opens a node.
  // The camera marks the node visited via the progress instance on openNode;
  // the page glue calls this back through the camera's onSelect hook so the
  // rect node-card greens, "вы здесь" advances, and the green spine grows.
  function refreshAll() {
    if (progress && typeof progress.markCurrent === "function") progress.markCurrent();
    refreshNodeStates();
    refreshSpineProgress();
  }

  if (reduced) {
    setStaticSpine();
  } else if (typeof IntersectionObserver === "function" && rootEl) {
    let started = false;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            startSpine();
            if (io) io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(rootEl);
  } else {
    startSpine();
  }

  // ----- locale switch (page glue calls on lang:change) -------------------
  // Re-labels every node-card in the active language and re-applies earned
  // states. The OPEN drill panel is owned by the camera; because renderPanel()
  // reads the live `lang` closure, we update `lang` FIRST and then ask the
  // camera to re-render the open entry (camera.refresh()) so the open card +
  // its breadcrumb re-localize without relying on lang:change ordering. The
  // camera's own lang:change listener may also fire; re-render is idempotent.
  function setLang(next) {
    const n = next === "en" || next === "ru" ? next : lang;
    if (n === lang) return lang;
    lang = n;
    clearTeachTimers();
    buildNodes();
    refreshNodeStates();
    if (camera && typeof camera.refresh === "function") camera.refresh();
    return lang;
  }

  return {
    renderPanel,
    markNode,
    refreshNodeStates: refreshAll,
    setLang,
    getLang: () => lang,
    destroy() {
      clearTeachTimers();
      if (io) io.disconnect();
      L.off();
    },
  };
}
