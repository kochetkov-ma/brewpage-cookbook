/**
 * eval-calculator.js -- precision@k / recall@k calculator over a golden set.
 *
 * RESPONSIBILITY: a pure didactic calculator for the evaluation chapter. A k
 * slider (1..max) recomputes precision@k and recall@k averaged over a small
 * golden set; a before/after toggle swaps which retriever run is scored on the
 * SAME fixed golden set. Each metric is drawn as a horizontal bar whose WIDTH
 * encodes the value (0..100%). Width is the ONLY animated property (the allowed
 * progress/bar exception); everything else is transform/opacity. The per-
 * question hit/miss strip shows which of the top-k ids landed in relevant_ids.
 *
 * No global state. IO-gated reveal; reduced-motion snaps the bars to their end
 * width over the SAME DOM (handled by base.css disabling the width transition
 * under the reduce media query). The slider is a native range input (keyboard
 * arrows recompute for free) PLUS explicit -/+ step buttons (44px tap targets).
 *
 * Host: [data-component="metric-eval-calculator"].
 * Optional sub-slots (created if absent):
 *   [data-slot="controls"]  k slider + before/after toggle
 *   [data-slot="bars"]      the two metric bars (precision / recall)
 *   [data-slot="detail"]    per-question top-k hit/miss strip
 *
 * Config: {
 *   data:   evaluationData,      // default export of shared/data/evaluation.js
 *   lang?:  "ru" | "en",         // active language (default "ru")
 *   onChange?: (state) => void,  // fired after any recompute
 * }
 *
 * export function init(rootEl, config) -> { recompute(), setK(k), setRun(id),
 *   setLang(lang), destroy() }
 */

import { qs, el, clear, listeners } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || {};
  let lang = cfg.lang === "en" ? "en" : "ru";
  const onChange = typeof cfg.onChange === "function" ? cfg.onChange : null;
  const offs = listeners();

  const kRange = data.kRange || { min: 1, max: 10, default: 5 };
  const runs = Array.isArray(data.runs) && data.runs.length ? data.runs : ["before"];
  const runLabels = data.runLabels || {};
  const golden = Array.isArray(data.golden) ? data.golden : [];
  const ui = (data.ui && data.ui[lang]) || {};

  let k = clampK(kRange.default != null ? kRange.default : kRange.min);
  let run = runs[0];
  let revealed = false;

  function t(key) {
    const pack = (data.ui && data.ui[lang]) || ui || {};
    return pack[key] != null ? pack[key] : key;
  }
  function clampK(v) {
    const n = Math.round(Number(v) || kRange.min);
    return Math.max(kRange.min, Math.min(kRange.max, n));
  }

  // --- pure metric math -----------------------------------------------------
  function scoreItem(item, kVal) {
    const relevant = new Set(item.relevant_ids || []);
    const retrieved = (item.retrieved && item.retrieved[run]) || [];
    const topk = retrieved.slice(0, kVal);
    const marks = topk.map((id) => ({ id, hit: relevant.has(id) }));
    const hits = marks.reduce((acc, m) => acc + (m.hit ? 1 : 0), 0);
    const precision = kVal > 0 ? hits / kVal : 0;
    const recall = relevant.size > 0 ? hits / relevant.size : 0;
    return { topk, marks, hits, precision, recall, relevantSize: relevant.size };
  }
  function aggregate(kVal) {
    if (!golden.length) return { precision: 0, recall: 0, n: 0, items: [] };
    let p = 0;
    let r = 0;
    const items = golden.map((item) => {
      const s = scoreItem(item, kVal);
      p += s.precision;
      r += s.recall;
      return { item, score: s };
    });
    const n = golden.length;
    return { precision: p / n, recall: r / n, n, items };
  }

  // --- DOM scaffold ---------------------------------------------------------
  let controlsHost = qs('[data-slot="controls"]', rootEl);
  let barsHost = qs('[data-slot="bars"]', rootEl);
  let detailHost = qs('[data-slot="detail"]', rootEl);
  if (!controlsHost || !barsHost || !detailHost) {
    clear(rootEl);
    controlsHost = el("div", { class: "evalc-controls", attrs: { "data-slot": "controls" } });
    barsHost = el("div", { class: "evalc-bars", attrs: { "data-slot": "bars" } });
    detailHost = el("div", { class: "evalc-detail", attrs: { "data-slot": "detail" } });
    rootEl.appendChild(controlsHost);
    rootEl.appendChild(barsHost);
    rootEl.appendChild(detailHost);
  }
  rootEl.classList.add("evalc");

  // controls: run toggle + k slider with -/+ buttons
  let slider, kReadout, runButtons = {};
  function buildControls() {
    clear(controlsHost);

    if (runs.length > 1) {
      const group = el("div", {
        class: "evalc-runtoggle",
        attrs: { role: "group", "aria-label": "before/after" },
      });
      runs.forEach((id) => {
        const lbl = (runLabels[id] && runLabels[id][lang]) || id;
        const btn = el("button", {
          class: "evalc-runbtn",
          attrs: { type: "button", "aria-pressed": String(id === run) },
          text: lbl,
          on: { click: () => setRun(id) },
        });
        runButtons[id] = btn;
        group.appendChild(btn);
      });
      controlsHost.appendChild(group);
    }

    const sliderId = uid("evalc-k");
    const wrap = el("div", { class: "evalc-slider" });
    const label = el("label", { class: "evalc-klabel", attrs: { for: sliderId }, text: t("kLabel") });
    const dec = el("button", {
      class: "evalc-step",
      attrs: { type: "button", "aria-label": t("decK") },
      text: "-",
      on: { click: () => setK(k - 1) },
    });
    slider = el("input", {
      class: "evalc-range",
      attrs: {
        type: "range",
        id: sliderId,
        min: String(kRange.min),
        max: String(kRange.max),
        step: "1",
        value: String(k),
        "aria-valuetext": "k = " + k,
      },
    });
    offs.on(slider, "input", () => setK(slider.value));
    const inc = el("button", {
      class: "evalc-step",
      attrs: { type: "button", "aria-label": t("incK") },
      text: "+",
      on: { click: () => setK(k + 1) },
    });
    kReadout = el("output", { class: "evalc-kval", attrs: { for: sliderId }, text: "k = " + k });

    wrap.appendChild(dec);
    wrap.appendChild(slider);
    wrap.appendChild(inc);
    wrap.appendChild(kReadout);
    controlsHost.appendChild(label);
    controlsHost.appendChild(wrap);
  }

  // bars
  let pFill, rFill, pVal, rVal;
  function buildBars() {
    clear(barsHost);
    const mk = (key, labelText) => {
      const row = el("div", { class: "evalc-bar", attrs: { "data-metric": key } });
      const name = el("span", { class: "evalc-bar-name", text: labelText });
      const fill = el("span", { class: "evalc-bar-fill" });
      const track = el("div", {
        class: "evalc-bar-track",
        attrs: { role: "img", "aria-hidden": "true" },
      }, [fill]);
      const val = el("output", { class: "evalc-bar-val", text: "0%" });
      row.appendChild(name);
      row.appendChild(track);
      row.appendChild(val);
      barsHost.appendChild(row);
      return { fill, val };
    };
    const p = mk("precision", t("precision"));
    const r = mk("recall", t("recall"));
    pFill = p.fill; pVal = p.val;
    rFill = r.fill; rVal = r.val;
  }

  function buildDetail(agg) {
    clear(detailHost);
    const head = el("p", { class: "evalc-detail-head", text: t("averaged") });
    detailHost.appendChild(head);
    agg.items.forEach(({ item, score }) => {
      const block = el("div", { class: "evalc-q" });
      const q = el("p", { class: "evalc-q-text" }, [
        el("span", { class: "evalc-q-tag", text: t("questionLabel") + ": " }),
        document.createTextNode((item.q && item.q[lang]) || item.id),
      ]);
      const strip = el("ul", {
        class: "evalc-q-strip",
        attrs: { "aria-label": t("topkLabel") },
      });
      score.marks.forEach((m) => {
        strip.appendChild(
          el("li", {
            class: "evalc-chip " + (m.hit ? "is-hit" : "is-miss"),
            attrs: { title: m.hit ? t("hit") : t("miss") },
            text: m.id,
          })
        );
      });
      const meta = el("p", { class: "evalc-q-meta" });
      meta.appendChild(
        document.createTextNode(
          score.hits + " " + t("hitsSummary") + " / " + score.relevantSize + " " + t("relevantLabel")
        )
      );
      block.appendChild(q);
      block.appendChild(strip);
      block.appendChild(meta);
      detailHost.appendChild(block);
    });
  }

  // --- render ---------------------------------------------------------------
  function render() {
    const agg = aggregate(k);
    const pPct = Math.round(agg.precision * 100);
    const rPct = Math.round(agg.recall * 100);

    if (slider && slider.value !== String(k)) slider.value = String(k);
    if (slider) slider.setAttribute("aria-valuetext", "k = " + k);
    if (kReadout) kReadout.textContent = "k = " + k;

    Object.keys(runButtons).forEach((id) => {
      runButtons[id].setAttribute("aria-pressed", String(id === run));
      runButtons[id].classList.toggle("is-active", id === run);
    });

    // width is the ONLY animated property on bars (allowed exception).
    const snap = prefersReducedMotion();
    const setFill = (fill, pct) => {
      if (!fill) return;
      if (snap) {
        const prev = fill.style.transition;
        fill.style.transition = "none";
        fill.style.width = pct + "%";
        // restore on next frame so future live changes can transition
        requestAnimationFrame(() => {
          fill.style.transition = prev;
        });
      } else {
        fill.style.width = revealed ? pct + "%" : "0%";
      }
    };
    setFill(pFill, pPct);
    setFill(rFill, rPct);
    if (pVal) pVal.textContent = pPct + "%";
    if (rVal) rVal.textContent = rPct + "%";

    buildDetail(agg);

    if (onChange) {
      onChange({ k, run, precision: agg.precision, recall: agg.recall, n: agg.n });
    }
  }

  // --- public mutators ------------------------------------------------------
  function setK(v) {
    const next = clampK(v);
    if (next === k) {
      render();
      return;
    }
    k = next;
    render();
  }
  function setRun(id) {
    if (!runs.includes(id) || id === run) return;
    run = id;
    render();
  }
  function setLang(next) {
    lang = next === "en" ? "en" : "ru";
    buildControls();
    buildBars();
    render();
  }
  function recompute() {
    render();
  }

  // --- IO-gated reveal ------------------------------------------------------
  let io = null;
  function reveal() {
    if (revealed) return;
    revealed = true;
    render();
  }
  if (typeof IntersectionObserver === "function" && !prefersReducedMotion()) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal();
            if (io) io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(rootEl);
  } else {
    revealed = true;
  }

  // build + first paint
  buildControls();
  buildBars();
  render();

  return {
    recompute,
    setK,
    setRun,
    setLang,
    destroy() {
      offs.off();
      if (io) io.disconnect();
      io = null;
    },
  };
}

let _uid = 0;
function uid(prefix) {
  _uid += 1;
  return prefix + "-" + _uid;
}
