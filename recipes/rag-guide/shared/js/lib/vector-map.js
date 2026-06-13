/**
 * vector-map.js -- the 2D vector-space projection (AtlasMD 3.8).
 *
 * RESPONSIBILITY: render the search section's 2D map into an inline <svg> host
 * and run the didactic, one-shot teaching animation:
 *   1. query text -> tokens -> search vector (the embed readout fills)
 *   2. each document point emerges FROM the query origin and settles at its
 *      cosine-determined distance (near settles first): position = vector
 *      proximity, "близость по смыслу = близость векторов"
 *   3. top-k links draw, the near points light EARNED green, the kNN list rows
 *      reveal by score
 *
 * EVERY point (query, near, far) is drillable. This module does NOT own the
 * drill camera -- it CONSUMES drilldown-zoom.js indirectly: the page glue passes
 * onActivate(point, markerEl) and this module wires click / Enter / Space on
 * every point group (including the far ones) to call it. The glue then calls
 * drill.openNode(...) so the camera keeps selection on zoom-out (focus returns
 * to the marker we came from). This module exposes setSelected(id) so the glue
 * can mirror the camera selection onto the themed (sepia/rust, NEVER blue) SVG
 * ring -- AtlasMD 3.13.
 *
 * Motion is transform/opacity + gated stroke-dashoffset link draws only, gated
 * on IntersectionObserver + prefers-reduced-motion. Under reduce (or JS-off /
 * no IO) it SNAPS to the settled end state: points placed, near green, links
 * shown, embed readout full, kNN rows shown -- over the SAME DOM.
 *
 * Host: [data-component="vector-map"] (the <svg> plot). The rail readout host
 * is optional and addressed via config.rail (a sibling element).
 *
 * Config: {
 *   data: SearchVectors,                 // shared/data/search-vectors.js default export
 *   rail?: HTMLElement,                  // side-rail root (embed readout + kNN list)
 *   onActivate?: (point, markerEl) => void,  // called on every point activate
 *   reduce?: boolean,                    // force reduced-motion (default: query the OS)
 * }
 *
 * export function init(rootEl, config) -> {
 *   markerEl(id), setSelected(id), points(), snap(), play(), destroy()
 * }
 */

import { svg, el, clear, listeners } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || {};
  const L = listeners();
  const reduce =
    typeof cfg.reduce === "boolean" ? cfg.reduce : prefersReducedMotion();

  const QC = (data.plot && { x: data.plot.cx, y: data.plot.cy }) || { x: 240, y: 210 };
  const points = Array.isArray(data.points) ? data.points : [];
  const query = data.query || null;

  // marker id -> SVG group element (query + every doc point)
  const markers = new Map();
  // collect the doc point groups for the settle pass
  const docGroups = [];
  // top-k link <path>s in rank order (near points only)
  const linkPaths = [];

  const timers = [];
  const setT = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  // ---------- build the SVG plot ----------
  if (rootEl) buildPlot();

  function buildPlot() {
    clear(rootEl);

    // graticule (faint grid)
    const grat = svg("g", { class: "graticule", "aria-hidden": "true" });
    [60, 140, 220, 300, 380, 460].forEach((x) =>
      grat.appendChild(svg("line", { x1: x, y1: 40, x2: x, y2: 380 }))
    );
    [60, 130, 200, 270, 340].forEach((y) =>
      grat.appendChild(svg("line", { x1: 60, y1: y, x2: 460, y2: y }))
    );
    rootEl.appendChild(grat);

    // concentric cosine rings (decoration) + labels
    const rings = svg("g", { class: "rings", "aria-hidden": "true" });
    (data.rings || []).forEach((r) => {
      rings.appendChild(svg("circle", { class: "ring", cx: QC.x, cy: QC.y, r: r.r }));
      if (r.label != null) {
        rings.appendChild(
          svg("text", { class: "ring-label", x: QC.x + 4, y: r.ly }, [String(r.label)])
        );
      }
    });
    rootEl.appendChild(rings);

    // projection axis caption
    const axis = svg("g", { class: "axis", "aria-hidden": "true" });
    axis.appendChild(svg("line", { class: "axis-line", x1: 40, y1: QC.y, x2: 56, y2: QC.y }));
    axis.appendChild(svg("line", { class: "axis-line", x1: QC.x, y1: 384, x2: QC.x, y2: 400 }));
    axis.appendChild(
      svg("text", { class: "axis-cap", x: 34, y: 396, "text-anchor": "start" }, [
        "проекция 2D от 1536 измерений (UMAP)",
      ])
    );
    rootEl.appendChild(axis);

    // query -> top-k links (drawn on highlight)
    const linksG = svg("g", { class: "links", "aria-hidden": "true" });
    points
      .filter((p) => p.kind === "near")
      .forEach((p) => {
        const path = svg("path", {
          class: "vlink",
          d: `M${QC.x},${QC.y} L${p.cx},${p.cy}`,
          "data-to": p.id,
        });
        linksG.appendChild(path);
        linkPaths.push(path);
      });
    rootEl.appendChild(linksG);

    // query point (never moves; fades in)
    if (query) {
      const qg = buildPoint(
        {
          id: query.id,
          kind: "query",
          cx: query.cx,
          cy: query.cy,
          label: query.label,
          cosLabel: null,
          ariaLabel:
            query.ariaLabel ||
            "Точка запроса. Откройте, чтобы увидеть вектор и ранжирование kNN",
        },
        true
      );
      rootEl.appendChild(qg);
    }

    // document points (near + far) -- pre-placed AT the query origin, settle out
    points.forEach((p) => {
      const g = buildPoint(p, false);
      docGroups.push(g);
      // delta = origin - finalPos, so the point starts at the query centre
      g.style.setProperty("--dx", QC.x - p.cx + "px");
      g.style.setProperty("--dy", QC.y - p.cy + "px");
      rootEl.appendChild(g);
    });
  }

  function buildPoint(p, isQuery) {
    const kindCls = isQuery ? "query" : p.kind === "near" ? "near" : "far";
    const cls = "pt " + kindCls + (isQuery ? "" : " doc");
    const r = isQuery ? 9 : p.kind === "near" ? p.rank === 1 ? 7.5 : p.rank === 2 ? 7 : 6.5 : 5.5;
    const hitR = isQuery ? 26 : p.kind === "near" ? 24 : 22; // >=44px tap target
    const focusR = isQuery ? 17 : p.kind === "near" ? 14 : 12;

    const g = svg("g", {
      class: cls,
      id: p.id,
      tabindex: "0",
      role: "button",
      "aria-label": p.ariaLabel || p.label || p.id,
    });
    // invisible >=44px hit circle (incl. far points)
    g.appendChild(svg("circle", { class: "pt-hit", cx: p.cx, cy: p.cy, r: hitR }));
    // themed focus / selection ring (sepia-rust, NEVER blue)
    g.appendChild(svg("circle", { class: "pt-focus", cx: p.cx, cy: p.cy, r: focusR }));
    // visible dot
    g.appendChild(svg("circle", { class: "dot", cx: p.cx, cy: p.cy, r }));
    // label (above for near/query top, etalon spacing)
    const lblY = isQuery ? p.cy + 22 : p.cy - 16;
    g.appendChild(
      svg("text", { class: "pt-lbl", x: p.cx, y: lblY, "text-anchor": "middle" }, [
        String(p.label || ""),
      ])
    );
    // cosine caption under the dot (doc points only)
    if (p.cosLabel != null) {
      g.appendChild(
        svg("text", { class: "pt-cos", x: p.cx, y: p.cy + 18, "text-anchor": "middle" }, [
          String(p.cosLabel),
        ])
      );
    }

    markers.set(p.id, g);

    // wire activation: click + Enter + Space (EVERY point, incl. far)
    const activate = () => {
      if (typeof cfg.onActivate === "function") {
        const pdata = isQuery ? query : p;
        cfg.onActivate(pdata, g);
      }
    };
    L.on(g, "click", activate);
    L.on(g, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        activate();
      }
    });

    return g;
  }

  // ---------- side-rail readout refs (optional) ----------
  const rail = cfg.rail || null;
  const railEmbedStep = rail ? rail.querySelector('[data-slot="embed-step"]') : null;
  const railToks = rail
    ? Array.from(rail.querySelectorAll('[data-slot="tokrow"] .tok'))
    : [];
  const railQvec = rail ? rail.querySelector('[data-slot="qvec"]') : null;
  const railRankItems = rail
    ? Array.from(rail.querySelectorAll('[data-slot="ranklist"] li'))
    : [];
  const qFull = railQvec ? railQvec.textContent : "";

  // ---------- selection (themed, never blue) ----------
  function setSelected(id) {
    markers.forEach((g) => g.classList.remove("selected"));
    if (id && markers.has(id)) markers.get(id).classList.add("selected");
  }

  // ---------- next-step highlight (the point that opens the next main-path
  // step). Themed glow on the point group (NEVER blue); null clears it. ------
  function setNextStep(id) {
    markers.forEach((g) => g.classList.remove("next-step"));
    if (id && markers.has(id)) markers.get(id).classList.add("next-step");
  }

  // ---------- end state ----------
  function liteNear() {
    points
      .filter((p) => p.kind === "near")
      .forEach((p) => {
        const g = markers.get(p.id);
        if (g) g.classList.add("lit");
      });
  }

  function snap() {
    // place every doc point + light near + draw links + fill readouts
    if (railEmbedStep) railEmbedStep.textContent = "сравнение по косинусу";
    const qg = markers.get(query && query.id);
    if (qg) qg.classList.add("settled");
    railToks.forEach((t) => t.classList.add("on"));
    docGroups.forEach((g) => g.classList.add("settled"));
    liteNear();
    linkPaths.forEach((l) => l.classList.add("on"));
    railRankItems.forEach((li) => li.classList.add("shown"));
    if (railQvec) {
      railQvec.classList.remove("computing");
      railQvec.textContent = qFull;
    }
  }

  // ---------- one-shot didactic play ----------
  function play() {
    if (reduce) {
      snap();
      return;
    }
    const qg = markers.get(query && query.id);
    let t = 0;

    // step 0: query origin appears
    setT(() => {
      if (qg) qg.classList.add("settled");
    }, 0);

    // step 1: tokenise
    if (railEmbedStep) railEmbedStep.textContent = "1. текст -> токены";
    railToks.forEach((tok, i) => setT(() => tok.classList.add("on"), 120 + i * 80));
    t = 120 + railToks.length * 80 + 120;

    // step 2: compute vector (typewriter reveal)
    setT(() => {
      if (railEmbedStep) railEmbedStep.textContent = "2. токены -> вектор (dim 1536)";
      if (railQvec) {
        railQvec.classList.add("computing");
        let n = 0;
        const iv = setInterval(() => {
          n += 4;
          railQvec.textContent = qFull.slice(0, n);
          if (n >= qFull.length) {
            clearInterval(iv);
            railQvec.textContent = qFull;
            railQvec.classList.remove("computing");
          }
        }, 24);
        timers.push({ clear: () => clearInterval(iv) });
      }
    }, t);
    t += 450;

    // step 3: points settle by cosine proximity (nearest first)
    setT(() => {
      if (railEmbedStep) railEmbedStep.textContent = "3. позиция = близость векторов";
    }, t);
    const order = orderByCosine();
    order.forEach((id, i) => {
      const g = markers.get(id);
      setT(() => g && g.classList.add("settled"), t + i * 120);
    });
    t += order.length * 120 + 120;

    // step 4: highlight top-k (links draw, near light green, list fills by score)
    setT(() => {
      if (railEmbedStep) railEmbedStep.textContent = "ближайшие top-k - по смыслу";
    }, t);
    points
      .filter((p) => p.kind === "near")
      .forEach((p, i) => {
        const g = markers.get(p.id);
        const link = linkPaths[i];
        setT(() => {
          if (g) g.classList.add("lit");
          if (link) link.classList.add("on");
        }, t + i * 150);
      });
    railRankItems.forEach((li, i) => setT(() => li.classList.add("shown"), t + i * 110));
  }

  // nearest (highest cosine) settles first; far after near
  function orderByCosine() {
    return points
      .slice()
      .sort((a, b) => parseFloat(b.cos || 0) - parseFloat(a.cos || 0))
      .map((p) => p.id);
  }

  // ---------- gate: on-screen + reduced-motion ----------
  let io = null;
  if (reduce) {
    snap();
  } else if (typeof IntersectionObserver === "function" && rootEl) {
    let fired = false;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !fired) {
            fired = true;
            play();
            if (io) io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(rootEl);
  } else {
    play();
  }

  void SVG_NS;
  void el;

  return {
    markerEl: (id) => markers.get(id) || null,
    setSelected,
    setNextStep,
    points: () => points.slice(),
    snap,
    play,
    destroy() {
      L.off();
      if (io) io.disconnect();
      timers.forEach((id) => {
        if (id && typeof id === "object" && typeof id.clear === "function") id.clear();
        else clearTimeout(id);
      });
      timers.length = 0;
    },
  };
}
