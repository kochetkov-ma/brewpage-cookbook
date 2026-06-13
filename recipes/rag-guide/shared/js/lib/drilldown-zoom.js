/**
 * drilldown-zoom.js -- semantic zoom camera (AtlasMD 3.6 / 3.4 / 3.5 / 3.11).
 *
 * RESPONSIBILITY: the drill/zoom camera shared by the section pages
 * (what-rag inline-grow, search inline-grow, why-rag modal). Owns:
 *   - the zstack state machine: openNode (level 1) -> openDeep (level 2),
 *     zoomOut / Escape (pop one), zoomToLevel(depth) (collapse to a depth) [3.6]
 *   - the breadcrumb render: ancestor crumbs jump to their level; current crumb
 *     is inert [3.4]
 *   - the lens zoom-out button enable/disable + Escape handling [3.5]
 *   - selection kept on zoom-out (focus returns to the marker you came from) [3.6/9]
 *   - max 2 levels; the panel grows the frame to fit (no scroll-jail) [3.6/do-not 8]
 *   - reduced-motion: camera scale/translate + panel transitions disabled,
 *     panes appear/disappear instantly over the SAME DOM [3.6 / 1.5]
 *
 * NOTE: this is the camera PRIMITIVE. Per-page renderers (pipeline/vector-map/
 * comparison) supply renderPanel(entry) which returns the panel DOM for a node;
 * those page renderers + their data wiring land in the SECTIONS phase. The
 * landing uses map-route.js (single-open field note), not this camera.
 *
 * Host: [data-component="drilldown-host"] with slots:
 *   [data-slot="stage"]   -- the diagram (collapses/scales on zoom)
 *   [data-slot="crumbs"]  -- breadcrumb nav mount
 *   [data-slot="zoomout"] -- the lens-minus button (or built if absent)
 *   [data-slot="panel"]   -- the detail panel mount (inline-grow)
 *
 * Config: {
 *   renderPanel: (entry, api) => HTMLElement,   // REQUIRED for any open
 *   labels?: { topCrumb, level1, zoomOut },
 *   plate?: plateInstance,        // from plate.js (growToFit on open)
 *   progress?: progressInstance,  // markVisited on openNode
 *   announce?: (msg) => void,
 *   onSelect?: (id, depth) => void
 * }
 *
 * export function init(rootEl, config) -> {
 *   openNode({id,crumb,anchor,data}), openDeep({id,crumb,data}),
 *   zoomOut(), zoomToLevel(depth), close(), currentDepth(), destroy()
 * }
 */

import { qs, el, clear, listeners } from "./dom.js";
import { prefersReducedMotion, onEscape } from "./a11y.js";

const LENS_MINUS =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
  '<line x1="15.2" y1="15.2" x2="21" y2="21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  '<line x1="7" y1="10.5" x2="14" y2="10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
  "</svg>";

export function init(rootEl, config) {
  const cfg = config || {};
  const L = listeners();
  const labels = Object.assign(
    { topCrumb: "Обзор", level1: "Узел", zoomOut: "Выйти на уровень выше" },
    cfg.labels || {}
  );

  const stage = qs('[data-slot="stage"]', rootEl);
  const crumbs = qs('[data-slot="crumbs"]', rootEl);
  const panelSlot = qs('[data-slot="panel"]', rootEl);
  let zoomoutBtn = qs('[data-slot="zoomout"]', rootEl);

  if (!zoomoutBtn && rootEl) {
    // build the lens-minus zoom-out if the partial did not ship one
    const host = qs('[data-slot="toolbar"]', rootEl) || rootEl;
    zoomoutBtn = el("button", {
      class: "zoomout",
      attrs: { type: "button", "aria-label": labels.zoomOut, "data-slot": "zoomout", disabled: true },
      html: LENS_MINUS,
    });
    host.appendChild(zoomoutBtn);
  }

  // zstack: array of { kind:'node'|'deep', id, crumb, anchor, fromEl }
  const zstack = [];
  let lastMarkerEl = null; // the marker we came from (selection on zoom-out)

  function currentDepth() {
    return zstack.length;
  }

  function renderCrumb() {
    if (!crumbs) return;
    clear(crumbs);
    // top (overview) crumb is an ancestor link to depth 0
    const trail = [{ label: labels.topCrumb, depth: 0 }].concat(
      zstack.map((s, i) => ({ label: s.crumb || labels.level1, depth: i + 1 }))
    );
    trail.forEach((c, i) => {
      if (i > 0) crumbs.appendChild(el("span", { class: "sep", attrs: { "aria-hidden": "true" }, text: ">" }));
      if (i === trail.length - 1) {
        crumbs.appendChild(el("span", { class: "crumb-current", attrs: { "aria-current": "step" }, text: c.label }));
      } else {
        const btn = el("button", {
          class: "crumb-link",
          attrs: { type: "button", "data-depth": String(c.depth), "aria-label": c.label },
          text: c.label,
        });
        L.on(btn, "click", () => zoomToLevel(c.depth));
        crumbs.appendChild(btn);
      }
    });
  }

  function applyCamera() {
    // zoom-out enable/disable is not stage-specific: must run in the modal
    // (stage-less) variant too, so toggle it BEFORE the stage guard.
    if (zoomoutBtn) zoomoutBtn.disabled = zstack.length === 0;
    // only the diagram-stage transform is guarded by stage presence.
    if (!stage) return;
    const zoomed = zstack.length > 0;
    stage.classList.toggle("zoomed", zoomed);
  }

  function renderPanel() {
    if (!panelSlot) return;
    clear(panelSlot);
    if (zstack.length === 0) {
      if (cfg.plate && typeof cfg.plate.reset === "function") cfg.plate.reset();
      return;
    }
    const entry = zstack[zstack.length - 1];
    if (typeof cfg.renderPanel !== "function") return;
    const node = cfg.renderPanel(entry, publicApi);
    if (node) {
      panelSlot.appendChild(node);
      const heading = node.querySelector("h2, h3, h4, [data-panel-heading]");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
      // grow the plate to fit the panel (no scroll-jail)
      if (cfg.plate && typeof cfg.plate.growToFit === "function") {
        cfg.plate.growToFit(node.getBoundingClientRect().height + 24);
      }
    }
    if (typeof cfg.onSelect === "function") cfg.onSelect(entry.id, zstack.length);
    if (typeof cfg.announce === "function" && entry.crumb) cfg.announce(entry.crumb);
  }

  function update() {
    applyCamera();
    renderCrumb();
    renderPanel();
  }

  function openNode(opts) {
    const o = opts || {};
    zstack.length = 0; // single-open at level 1: replace any open node
    zstack.push({ kind: "node", id: o.id, crumb: o.crumb, anchor: o.anchor, data: o.data });
    if (o.fromEl) lastMarkerEl = o.fromEl;
    if (cfg.progress && typeof cfg.progress.markVisited === "function") cfg.progress.markVisited(o.id);
    update();
  }

  function openDeep(opts) {
    const o = opts || {};
    if (zstack.length === 0) return; // must have a node first
    if (zstack.length >= 2) zstack.length = 1; // max 2 levels
    zstack.push({ kind: "deep", id: o.id, crumb: o.crumb, data: o.data });
    update();
  }

  function zoomOut() {
    if (zstack.length === 0) return;
    zstack.pop();
    update();
    // keep selection: focus returns to the marker we came from
    if (zstack.length === 0 && lastMarkerEl && typeof lastMarkerEl.focus === "function") {
      lastMarkerEl.focus();
    }
  }

  function zoomToLevel(depth) {
    if (depth < 0) depth = 0;
    if (depth >= zstack.length) return;
    zstack.length = depth;
    update();
    if (zstack.length === 0 && lastMarkerEl && typeof lastMarkerEl.focus === "function") {
      lastMarkerEl.focus();
    }
  }

  function close() {
    zstack.length = 0;
    update();
  }

  if (zoomoutBtn) L.on(zoomoutBtn, "click", () => zoomOut());
  L.on(document, "lang:change", () => update());
  const offEsc = onEscape(rootEl || document, () => zoomOut());

  // reduced-motion: base.css disables stage/panel transitions; nothing extra here.
  void prefersReducedMotion;

  const publicApi = {
    openNode,
    openDeep,
    zoomOut,
    zoomToLevel,
    close,
    currentDepth,
    destroy() {
      L.off();
      offEsc();
      close();
    },
  };
  return publicApi;
}
