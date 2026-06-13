/**
 * drilldown.js -- data-driven 3-level C4 drill-down over an inline-SVG host.
 *
 * RESPONSIBILITY: mount on a [data-component="drilldown-host"]. Load the stage
 * tree from diagram-data.js (default export keyed by stage id; flat node map
 * per stage, see its schema). Render the current node's children as SVG node
 * boxes into [data-slot="svg"], let the user drill into a child's children,
 * walk back via a breadcrumb / Back button, keyboard-navigate (arrows / Enter /
 * Escape), and announce changes. Replaces the static no-JS fallback by toggling
 * .js-only / .no-js-only (page glue adds .has-js; this module fills the slots).
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.dataSrc  path to diagram-data.js (host data-diagram-src)
 *   config.stage    stage id to mount (host data-stage)
 *   config.onSelect optional (node) => void
 */

import { qs, svg, el, clear, listeners } from "./dom.js";
import { init as initAnnouncer, onEscape, focusable } from "./a11y.js";

const VIEW_W = 480;
const NODE_H = 56;
const NODE_GAP = 16;
const PAD_X = 16;
const PAD_Y = 16;
const ACCENTS = 4;

export function init(rootEl, config) {
  const cfg = config || {};
  const dataSrc = cfg.dataSrc || rootEl.dataset.diagramSrc;
  const stageId = cfg.stage || rootEl.dataset.stage;

  const svgSlot = qs('[data-slot="svg"]', rootEl);
  const toolbar = qs('[data-slot="toolbar"]', rootEl);
  if (!svgSlot || !toolbar) {
    // Missing CSS/HTML hook -- leave the static fallback in place.
    return { destroy() {} };
  }

  const events = listeners();
  const announcer = initAnnouncer(rootEl, { politeness: "polite" });

  let nodeMap = null;
  let rootId = null;
  /** path of node ids from root to the currently-shown parent (inclusive). */
  let trail = [];
  let destroyed = false;
  let svgEl = null;

  // ---- toolbar shell ----
  const backBtn = el("button", {
    class: "btn diagram-host__back",
    type: "button",
    text: "Back",
    attrs: { "aria-label": "Go up one level" },
  });
  const crumbNav = el("nav", { class: "diagram-host__crumbs", attrs: { "aria-label": "Diagram breadcrumb" } });
  const crumbList = el("ol", { class: "breadcrumb__list" });
  crumbNav.appendChild(crumbList);
  toolbar.appendChild(backBtn);
  toolbar.appendChild(crumbNav);

  events.on(backBtn, "click", () => goUp());

  load();

  async function load() {
    try {
      // dataSrc is authored relative to the PAGE (data-diagram-src), but a bare
      // dynamic import() resolves relative to THIS module. Resolve against the
      // document base first so both agree.
      const resolved = new URL(dataSrc, document.baseURI).href;
      const mod = await import(/* @vite-ignore */ resolved);
      const all = mod.default || mod;
      nodeMap = all[stageId];
      if (!nodeMap) throw new Error(`drilldown: stage "${stageId}" not in diagram data`);
      rootId = findRoot(nodeMap);
      if (!rootId) throw new Error("drilldown: no system root (parent null) in stage");
      trail = [rootId];
      render();
    } catch (err) {
      // Keep the static fallback meaningful; surface for debugging.
      console.error("[drilldown]", err);
    }
  }

  function findRoot(map) {
    for (const id of Object.keys(map)) {
      const n = map[id];
      if (n && n.level === "system" && n.parent == null) return id;
    }
    return null;
  }

  function currentParent() {
    return nodeMap[trail[trail.length - 1]];
  }

  function childrenOf(node) {
    return (node.children || []).map((id) => nodeMap[id]).filter(Boolean);
  }

  function render() {
    if (destroyed) return;
    const parent = currentParent();
    const kids = childrenOf(parent);

    // breadcrumb
    clear(crumbList);
    trail.forEach((id, i) => {
      const node = nodeMap[id];
      const isLast = i === trail.length - 1;
      const li = el("li");
      if (isLast) {
        li.appendChild(el("span", { text: node.label, attrs: { "aria-current": "step" } }));
      } else {
        const link = el("button", {
          class: "diagram-host__crumb",
          type: "button",
          text: node.label,
          on: { click: () => jumpTo(i) },
        });
        li.appendChild(link);
        crumbList.appendChild(li);
        crumbList.appendChild(el("li", { class: "breadcrumb__sep", text: "/", attrs: { "aria-hidden": "true" } }));
        return;
      }
      crumbList.appendChild(li);
    });

    backBtn.disabled = trail.length <= 1;

    // svg
    const rows = kids.length || 1;
    const height = PAD_Y * 2 + rows * NODE_H + (rows - 1) * NODE_GAP;
    const fresh = svg("svg", {
      class: "diagram-host__svg",
      viewBox: `0 0 ${VIEW_W} ${height}`,
      role: "tree",
      "aria-label": `${parent.label}: ${kids.length} item${kids.length === 1 ? "" : "s"}`,
    });

    if (kids.length === 0) {
      // Leaf parent: show its own summary, nothing to drill into.
      fresh.appendChild(
        svg("text", {
          class: "node__label",
          x: VIEW_W / 2,
          y: height / 2,
          "text-anchor": "middle",
          text: parent.summary || parent.label,
        })
      );
    }

    kids.forEach((node, i) => {
      const y = PAD_Y + i * (NODE_H + NODE_GAP);
      const drillable = (node.children || []).length > 0;
      const accent = ((i % ACCENTS) + 1);
      const group = svg("g", {
        class: "node-group",
        role: "treeitem",
        tabindex: i === 0 ? "0" : "-1",
        "aria-label": node.label + (node.summary ? ". " + node.summary : ""),
        "aria-expanded": drillable ? "false" : null,
        dataset: { nodeId: node.id, index: String(i) },
      });
      const rect = svg("rect", {
        class: `node node--accent-${accent}`,
        x: PAD_X,
        y,
        width: VIEW_W - PAD_X * 2,
        height: NODE_H,
        rx: 4,
      });
      const label = svg("text", {
        class: "node__label",
        x: VIEW_W / 2,
        y: y + NODE_H / 2 + 5,
        "text-anchor": "middle",
        text: node.label + (drillable ? "  >" : ""),
      });
      group.appendChild(rect);
      group.appendChild(label);
      fresh.appendChild(group);

      events.on(group, "click", () => activate(node));
      events.on(group, "keydown", (e) => onNodeKey(e, node, i, kids.length));
    });

    if (svgEl) svgEl.remove();
    svgEl = fresh;
    svgSlot.appendChild(svgEl);

    announcer.announce(`Level: ${parent.label}. ${kids.length} item${kids.length === 1 ? "" : "s"}.`);
    if (typeof cfg.onSelect === "function") cfg.onSelect(parent);
  }

  function onNodeKey(e, node, index, total) {
    const groups = Array.from(svgEl.querySelectorAll(".node-group"));
    let next = -1;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        activate(node);
        return;
      case "ArrowDown":
      case "ArrowRight":
        next = (index + 1) % total;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = (index - 1 + total) % total;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = total - 1;
        break;
      case "Escape":
        e.preventDefault();
        goUp();
        return;
      default:
        return;
    }
    e.preventDefault();
    groups.forEach((g) => g.setAttribute("tabindex", "-1"));
    const target = groups[next];
    if (target) {
      target.setAttribute("tabindex", "0");
      target.focus();
    }
  }

  function activate(node) {
    if ((node.children || []).length > 0) {
      trail.push(node.id);
      render();
      focusFirstNode();
    } else {
      // Leaf: announce its summary (no further drill).
      announcer.announce(`${node.label}. ${node.summary || ""}`);
    }
  }

  function goUp() {
    if (trail.length <= 1) return;
    trail.pop();
    render();
    focusFirstNode();
  }

  function jumpTo(index) {
    if (index < 0 || index >= trail.length - 1) return;
    trail = trail.slice(0, index + 1);
    render();
    focusFirstNode();
  }

  function focusFirstNode() {
    requestAnimationFrame(() => {
      if (destroyed || !svgEl) return;
      const first = svgEl.querySelector('.node-group[tabindex="0"]');
      if (first) first.focus();
    });
  }

  // ESC anywhere in the host goes up a level.
  events.on(rootEl, "keydown", (e) => {
    if (e.key === "Escape" && document.activeElement && rootEl.contains(document.activeElement)) {
      // node-level handler already covers focused nodes; this covers toolbar focus.
      if (!document.activeElement.classList.contains("node-group")) {
        e.preventDefault();
        goUp();
      }
    }
  });
  void onEscape; // available helper, node handler covers the common path
  void focusable;

  return {
    destroy() {
      destroyed = true;
      events.off();
      announcer.destroy();
      if (svgEl) svgEl.remove();
      clear(toolbar);
    },
  };
}
