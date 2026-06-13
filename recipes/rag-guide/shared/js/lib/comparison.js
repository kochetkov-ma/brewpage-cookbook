/**
 * comparison.js -- two-track comparison + progressive reveal + modal drill camera
 * for the "Зачем он нужен" section (AtlasMD 3.10).
 *
 * RESPONSIBILITY: render the Без-RAG / С-RAG tracks from data, run the one-time
 * stepped reveal (so the grounded green answer is NEVER painted complete before
 * retrieval lands), and open drillable nodes into a centered MODAL drill camera
 * (AtlasMD 3.6 strategy 2). The drill state machine -- zstack, breadcrumb,
 * lens-minus zoom-out, openNode/openDeep/zoomToLevel, selection-on-zoom-out --
 * is NOT reimplemented here: it is CONSUMED from drilldown-zoom.js. This module
 * owns only the modal shell around that camera (show/scale-in, focus trap,
 * backdrop + Escape close, background neutralise) and supplies renderPanel().
 *
 * No global state. ES module. transform/opacity-only motion, IO + reduced-motion
 * gated; with JS off OR reduce the tracks render at their static end-state.
 *
 * Host: [data-component="comparison"] containing:
 *   [data-slot="tracks"]      -- mount for the two .track flows
 *   [data-slot="takeaways"]   -- mount for the "why B is better" grid
 *   [data-component="drilldown-host"] (the .drill-layer modal) with slots:
 *     [data-slot="crumbs"]    -- breadcrumb mount (consumed by drilldown-zoom)
 *     [data-slot="zoomout"]   -- lens-minus button (consumed by drilldown-zoom)
 *     [data-slot="panel"]     -- drill-card body mount (consumed by drilldown-zoom)
 *   [data-slot="drill-stage"] -- the scale-in card wrapper inside .drill-layer
 *
 * Config: {
 *   data: <why-rag data>,          // REQUIRED (default export of data/why-rag.js)
 *   getLocale: () => 'ru'|'en',    // active-language accessor (i18n.getLocale)
 *   announce?: (msg) => void,      // a11y live-region announcer
 * }
 *
 * export function init(rootEl, config) -> { destroy() }
 */

import { qs, el, svg, clear, listeners, append } from "./dom.js";
import { prefersReducedMotion, focusTrap } from "./a11y.js";
import { init as initCamera } from "./drilldown-zoom.js";

const LENS_PLUS =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
  '<line x1="15.2" y1="15.2" x2="21" y2="21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<line x1="7" y1="10.5" x2="14" y2="10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<line x1="10.5" y1="7" x2="10.5" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  "</svg>";

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data;
  const L = listeners();
  const progress = cfg.progress || null;
  // MAIN PATH = the с-RAG (Track B) node ids in order; opening each marks it
  // done. Track A nodes + level-2 deeps are SIDE (never gate completion).
  const mainPath = Array.isArray(cfg.mainPath) ? cfg.mainPath : [];
  const mainSet = new Set(mainPath);
  const loc = () => (typeof cfg.getLocale === "function" ? cfg.getLocale() : "ru");
  const tr = (entry) => {
    if (entry == null) return "";
    const v = entry[loc()];
    return v != null ? v : entry.en != null ? entry.en : "";
  };
  const announce = typeof cfg.announce === "function" ? cfg.announce : () => {};

  if (!rootEl || !data) return { destroy() {} };

  const tracksHost = qs('[data-slot="tracks"]', rootEl);
  const takeawaysHost = qs('[data-slot="takeaways"]', rootEl);
  const drillHost = qs('[data-component="drilldown-host"]', rootEl);
  const layer = qs('[data-slot="drill-layer"]', rootEl) || drillHost;
  const drillStage = qs('[data-slot="drill-stage"]', rootEl);

  // ---- per-node element index, so reveal + relabel can find them ----------
  const nodeEls = []; // { node, elem }

  // ===== build the two tracks =============================================
  function buildNode(node, trackId) {
    const drillable = !!node.drill;
    const onMain = mainSet.has(node.id);
    // interactive if it drills OR sits on the main path (so the user can click
    // through the с-RAG backbone start-to-end and earn completion).
    const interactive = drillable || onMain;
    const tag = interactive ? "button" : "div";
    const attrs = { "data-node": node.id };
    if (interactive) {
      attrs.type = "button";
      if (drillable) attrs["data-drill"] = node.drill;
      const verb = drillable
        ? loc() === "en" ? "open detail" : "подробнее"
        : loc() === "en" ? "step" : "шаг тракта";
      attrs["aria-label"] = tr(node.t) + " - " + verb;
    }
    const classes = ["node", "cmp-node"];
    if (node.kind) classes.push("cmp-node--" + node.kind);

    const card = el(tag, { class: classes.join(" "), attrs });
    append(card, [
      el("span", { class: "cmp-node__k", text: tr(node.k) }),
      el("span", { class: "cmp-node__t", text: tr(node.t) }),
      el("span", { class: "cmp-node__d", html: tr(node.d) }),
    ]);
    if (node.freeze) {
      card.appendChild(el("span", { class: "freezetag", text: tr(node.freeze) }));
    }
    if (node.flag) {
      card.appendChild(
        el("span", { class: "cmp-flag" + (node.flagGood ? " good" : ""), text: tr(node.flag) })
      );
    }
    if (drillable) {
      const hint = el("span", { class: "drillhint", html: LENS_PLUS });
      hint.appendChild(
        el("span", { text: loc() === "en" ? "look inside" : "что внутри" })
      );
      card.appendChild(hint);
    }
    return card;
  }

  function connector(trackId) {
    const wrap = el("div", { class: "conn", attrs: { "aria-hidden": "true" } });
    const stroke = trackId === "A" ? "var(--c-accent-2)" : "var(--c-accent-1)";
    const line = svg("svg", { width: "10", height: "20", attrs: { focusable: "false" } }, [
      svg("line", {
        class: "dash",
        x1: "5", y1: "0", x2: "5", y2: "20",
        stroke: stroke, "stroke-width": "1.4", "stroke-dasharray": "3 4",
      }),
    ]);
    wrap.appendChild(line);
    return wrap;
  }

  function buildTrack(track) {
    const sec = el("section", {
      class: "track track--" + track.id,
      attrs: { "aria-label": tr(track.tag) },
    });
    sec.appendChild(el("span", { class: "track__tag", text: tr(track.tag) }));
    sec.appendChild(el("p", { class: "track__sub", text: tr(track.sub) }));
    const flow = el("div", { class: "flow", dataset: { track: track.id } });
    track.nodes.forEach((node, i) => {
      if (i > 0) flow.appendChild(connector(track.id));
      const elem = buildNode(node, track.id);
      flow.appendChild(elem);
      nodeEls.push({ node, elem, trackId: track.id });
    });
    sec.appendChild(flow);
    return sec;
  }

  function renderTracks() {
    if (!tracksHost) return;
    clear(tracksHost);
    nodeEls.length = 0;
    data.tracks.forEach((t) => tracksHost.appendChild(buildTrack(t)));
    // wire interactive nodes: drillable -> modal drill; ALL main-path opens
    // (drillable or not) mark the step done + advance the highlight.
    nodeEls.forEach(({ node, elem }) => {
      const onMain = mainSet.has(node.id);
      if (!node.drill && !onMain) return;
      L.on(elem, "click", () => {
        if (node.drill) openDrill(node.drill, elem);
        if (onMain && progress) {
          progress.markOpened(node.id);
          progress.markCurrent();
          refreshStepStates();
        }
      });
    });
    refreshStepStates();
  }

  // earned-visited + next-step highlight on the main-path (с-RAG) nodes.
  function refreshStepStates() {
    if (!progress) return;
    const allDone = typeof progress.isComplete === "function" && progress.isComplete();
    const next = !allDone && typeof progress.nextStep === "function" ? progress.nextStep() : null;
    nodeEls.forEach(({ node, elem }) => {
      if (!mainSet.has(node.id)) return;
      const visited = typeof progress.isVisited === "function" && progress.isVisited(node.id);
      elem.classList.toggle("visited", !!visited);
      elem.classList.toggle("next-step", !visited && node.id === next);
    });
  }

  function renderTakeaways() {
    if (!takeawaysHost) return;
    clear(takeawaysHost);
    const grid = el("div", { class: "tk-grid" });
    data.takeaways.forEach((tk, i) => {
      const row = el("div", { class: "tk" });
      row.appendChild(el("span", { class: "tk__mk", attrs: { "aria-hidden": "true" }, text: String(i + 1) }));
      row.appendChild(el("span", { class: "tk__body", html: tr(tk) }));
      grid.appendChild(row);
    });
    takeawaysHost.appendChild(grid);
  }

  // ===== progressive reveal (one-time, transform/opacity only) =============
  // Hide the flows immediately so the grounded green answer is never painted
  // complete on load. With JS off .reveal is never set => static end-state.
  if (tracksHost) tracksHost.classList.add("reveal");

  function flowSequence(flow) {
    return Array.prototype.filter.call(flow.children, (c) =>
      c.classList.contains("cmp-node") || c.classList.contains("conn")
    );
  }

  let revealed = false;
  function runReveal() {
    if (revealed) return;
    revealed = true;
    const flows = Array.from(tracksHost.querySelectorAll(".flow"));
    if (prefersReducedMotion()) {
      flows.forEach((flow) =>
        flowSequence(flow).forEach((c) => c.classList.add("shown"))
      );
      tracksHost.querySelectorAll(".freezetag").forEach((f) => f.classList.add("shown"));
      const g = tracksHost.querySelector(".cmp-node--grounding");
      if (g) g.classList.add("land");
      return;
    }
    const step = 200;
    flows.forEach((flow) => {
      flowSequence(flow).forEach((c, i) => {
        const t = setTimeout(() => {
          c.classList.add("shown");
          if (c.querySelector && c.querySelector(".freezetag")) {
            const f = c.querySelector(".freezetag");
            if (f) f.classList.add("shown");
          }
          if (c.classList.contains("cmp-node--grounding")) c.classList.add("land");
        }, 160 + i * step);
        timers.push(t);
      });
    });
  }

  const timers = [];
  let io = null;
  function armReveal() {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !revealed) {
            runReveal();
            if (io) io.disconnect();
          }
        });
      }, { threshold: 0.25 });
      io.observe(rootEl);
    } else {
      runReveal();
    }
  }

  // ===== modal drill camera (CONSUMES drilldown-zoom.js) ===================
  // drilldown-zoom owns the zstack/breadcrumb/zoomout/openNode/openDeep/
  // zoomToLevel state machine; we mount it on the drill-host inside the modal,
  // supply renderPanel(), and wrap it with the modal shell (show + focus trap).
  let camera = null;
  let trap = null;
  let originEl = null;
  let modalOpen = false;

  function renderPanel(entry) {
    // entry: { kind:'node'|'deep', id, crumb, data:{detail} }
    const detail = entry && entry.data;
    if (!detail) return null;
    const card = el("div", { class: "drill-detail" });
    card.appendChild(
      el("h3", { class: "drill-detail__h", attrs: { tabindex: "-1" }, text: tr(detail.title) })
    );
    card.appendChild(el("p", { class: "drill-detail__lead", text: tr(detail.lead) }));
    const bodyWrap = el("div", {});
    bodyWrap.innerHTML = tr(detail.bodyHtml);
    card.appendChild(bodyWrap);
    // a lens-plus drill-in to level 2 (only on the level-1 node)
    if (entry.kind === "node" && detail.deepKey && detail.deep && detail.deep[detail.deepKey]) {
      const btn = el("button", {
        class: "deeper",
        attrs: { type: "button", "aria-label": tr(detail.deepLabel) },
        html: LENS_PLUS,
      });
      btn.appendChild(el("span", { text: tr(detail.deepLabel) }));
      L.on(btn, "click", () => {
        const deep = detail.deep[detail.deepKey];
        camera.openDeep({ id: detail.deepKey, crumb: tr(deep.crumb), data: deep });
      });
      card.appendChild(btn);
    }
    return card;
  }

  function ensureCamera() {
    if (camera || !drillHost) return camera;
    camera = initCamera(drillHost, {
      renderPanel,
      labels: {
        topCrumb: loc() === "en" ? "Comparison" : "Сравнение",
        zoomOut: loc() === "en" ? "Step out one level" : "Выйти на уровень выше",
      },
      announce,
      // when the camera empties its stack (zoom-out past level 1), close the modal
      onSelect: () => {},
    });
    return camera;
  }

  function showModal() {
    if (!layer) return;
    modalOpen = true;
    document.body.classList.add("drilling");
    layer.classList.add("open");
    if (drillStage) {
      const paint = () => drillStage.classList.add("in");
      if (prefersReducedMotion()) paint();
      else requestAnimationFrame(paint);
    }
    if (layer && typeof focusTrap === "function") trap = focusTrap(layer);
    if (!escBound) {
      document.addEventListener("keydown", onKey);
      escBound = true;
    }
  }

  function hideModal() {
    if (!modalOpen) return;
    modalOpen = false;
    if (drillStage) drillStage.classList.remove("in");
    const finish = () => {
      if (layer) layer.classList.remove("open");
      document.body.classList.remove("drilling");
      if (originEl && typeof originEl.focus === "function") originEl.focus();
    };
    if (prefersReducedMotion()) finish();
    else setTimeout(finish, 360);
    if (trap) { trap.release(); trap = null; }
    if (escBound) {
      document.removeEventListener("keydown", onKey);
      escBound = false;
    }
  }

  let escBound = false;
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeAll();
    }
  }

  function openDrill(key, fromEl) {
    const detail = data.drill[key];
    if (!detail) return;
    originEl = fromEl || document.activeElement;
    ensureCamera();
    if (!camera) return;
    showModal();
    camera.openNode({ id: key, crumb: tr(detail.crumb), data: detail, fromEl: originEl });
    // breadcrumb root (depth 0) collapses the camera; we also close the modal then
  }

  function closeAll() {
    if (camera) camera.close();
    hideModal();
  }

  // backdrop click closes (only when the click lands on the layer itself)
  if (layer) {
    L.on(layer, "click", (e) => {
      if (e.target === layer) closeAll();
    });
  }

  // The camera's zoom-out at level 0 leaves an empty panel; intercept the
  // top breadcrumb / final zoom-out via the camera depth: poll on its events.
  // drilldown-zoom calls renderPanel on every update; when the stack is empty
  // it clears the panel. We detect that by wrapping the zoomout: simplest is
  // to listen for the camera reaching depth 0 through its own zoomout button.
  // The camera's lens-minus button lives in the modal; when it pops to 0 the
  // panel is empty, so close the modal too.
  if (drillHost) {
    const zout = qs('[data-slot="zoomout"]', drillHost);
    if (zout) {
      L.on(zout, "click", () => {
        // The camera's own zoomout handler pops the stack on the same click;
        // listener order means ours may run first, so check depth next frame.
        requestAnimationFrame(() => {
          if (camera && camera.currentDepth() === 0) hideModal();
        });
      });
    }
    // breadcrumb root link (data-depth="0") also collapses to comparison
    L.on(drillHost, "click", (e) => {
      const link = e.target.closest && e.target.closest('.crumb-link[data-depth="0"]');
      if (link) {
        // let the camera collapse first, then close the modal
        requestAnimationFrame(() => {
          if (camera && camera.currentDepth() === 0) hideModal();
        });
      }
    });
  }

  // ===== relabel on locale change =========================================
  function relabel() {
    renderTracks();
    renderTakeaways();
    // re-run reveal end-state immediately if it had already run
    if (revealed) {
      revealed = false;
      runReveal();
    }
  }
  L.on(document, "lang:change", relabel);

  // ===== boot =============================================================
  renderTracks();
  renderTakeaways();
  armReveal();

  return {
    destroy() {
      timers.forEach((t) => clearTimeout(t));
      timers.length = 0;
      if (io) { io.disconnect(); io = null; }
      if (escBound) { document.removeEventListener("keydown", onKey); escBound = false; }
      if (trap) { trap.release(); trap = null; }
      if (camera) { camera.destroy(); camera = null; }
      document.body.classList.remove("drilling");
      L.off();
    },
  };
}
