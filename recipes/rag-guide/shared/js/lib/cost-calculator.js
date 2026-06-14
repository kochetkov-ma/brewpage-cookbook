/**
 * cost-calculator.js -- per-request cost + latency calculator (production).
 *
 * RESPONSIBILITY: a pure didactic calculator for the production chapter. The
 * reader plugs in their own tokens_in / tokens_out / vendor tariff / QPS /
 * cache-hit rate; the module recomputes the cost of one request, a monthly
 * estimate (scaled by QPS and the cache-hit rate), and the request latency
 * split (index search vs generation). No global state.
 *
 * MOTION: number readouts update with an opacity/transform pulse only -- NO
 * width/height/margin tween here. (The companion earned-progress rollout
 * checklist is driven by shared/js/lib/progress.js, which owns the only width
 * tween; this module renders NO bar.) Reduced motion skips the pulse (snap).
 * Native number inputs (keyboard operable) + explicit -/+ steppers (44px).
 *
 * Host: [data-component="cost-calculator"].
 * Optional sub-slots (created if absent):
 *   [data-slot="inputs"]    the editable fields
 *   [data-slot="readout"]   cost-per-request / monthly / latency figures
 *
 * Config: {
 *   data:   productionData,      // default export of shared/data/production.js
 *   lang?:  "ru" | "en",         // active language (default "ru")
 *   onChange?: (state) => void,  // fired after any recompute
 * }
 *
 * export function init(rootEl, config) -> { recompute(), setField(name,value),
 *   setLang(lang), getState(), destroy() }
 */

import { qs, el, clear, listeners } from "./dom.js";
import { prefersReducedMotion } from "./a11y.js";

const FIELDS = [
  { name: "tokensIn", step: 50, min: 0 },
  { name: "tokensOut", step: 20, min: 0 },
  { name: "priceInPerM", step: 0.5, min: 0 },
  { name: "priceOutPerM", step: 0.5, min: 0 },
  { name: "qps", step: 1, min: 0 },
  { name: "cacheHitRate", step: 5, min: 0, max: 100, pct: true }, // edited in %
];

export function init(rootEl, config) {
  const cfg = config || {};
  const data = cfg.data || {};
  let lang = cfg.lang === "en" ? "en" : "ru";
  const onChange = typeof cfg.onChange === "function" ? cfg.onChange : null;
  const offs = listeners();

  const defaults = data.calc || {};
  // working state (cacheHitRate held as a 0..1 fraction internally)
  const state = {
    tokensIn: num(defaults.tokensIn, 1240),
    tokensOut: num(defaults.tokensOut, 320),
    priceInPerM: num(defaults.priceInPerM, 3),
    priceOutPerM: num(defaults.priceOutPerM, 15),
    qps: num(defaults.qps, 2),
    cacheHitRate: clamp01(num(defaults.cacheHitRate, 0.3)),
    latencyIndexMs: num(defaults.latencyIndexMs, 25),
    latencyGenMs: num(defaults.latencyGenMs, 1400),
  };

  function t(key) {
    const pack = (data.ui && data.ui[lang]) || {};
    return pack[key] != null ? pack[key] : key;
  }

  // --- pure math ------------------------------------------------------------
  function costPerRequest() {
    return (
      (state.tokensIn / 1e6) * state.priceInPerM +
      (state.tokensOut / 1e6) * state.priceOutPerM
    );
  }
  function monthlyCost() {
    const reqPerMonth = state.qps * 60 * 60 * 24 * 30;
    const billable = reqPerMonth * (1 - state.cacheHitRate);
    return costPerRequest() * billable;
  }
  function monthlyNoCache() {
    const reqPerMonth = state.qps * 60 * 60 * 24 * 30;
    return costPerRequest() * reqPerMonth;
  }
  function latencyMs() {
    return state.latencyIndexMs + state.latencyGenMs;
  }

  // --- DOM scaffold ---------------------------------------------------------
  let inputsHost = qs('[data-slot="inputs"]', rootEl);
  let readoutHost = qs('[data-slot="readout"]', rootEl);
  if (!inputsHost || !readoutHost) {
    clear(rootEl);
    inputsHost = el("div", { class: "costc-inputs", attrs: { "data-slot": "inputs" } });
    readoutHost = el("div", { class: "costc-readout", attrs: { "data-slot": "readout" } });
    rootEl.appendChild(inputsHost);
    rootEl.appendChild(readoutHost);
  }
  rootEl.classList.add("costc");

  const inputEls = {};
  function buildInputs() {
    clear(inputsHost);
    FIELDS.forEach((f) => {
      const id = uid("costc-" + f.name);
      const row = el("div", { class: "costc-field" });
      const label = el("label", { class: "costc-label", attrs: { for: id }, text: t(f.name) });
      const dec = el("button", {
        class: "costc-step",
        attrs: { type: "button", "aria-label": t("dec") + " " + t(f.name) },
        text: "-",
        on: { click: () => bump(f, -1) },
      });
      const input = el("input", {
        class: "costc-input",
        attrs: {
          type: "number",
          id,
          min: String(f.min != null ? f.min : 0),
          step: String(f.step),
          inputmode: "decimal",
          value: String(toEdit(f)),
        },
      });
      if (f.max != null) input.setAttribute("max", String(f.max));
      offs.on(input, "input", () => setEdit(f, input.value));
      const inc = el("button", {
        class: "costc-step",
        attrs: { type: "button", "aria-label": t("inc") + " " + t(f.name) },
        text: "+",
        on: { click: () => bump(f, 1) },
      });
      inputEls[f.name] = input;
      row.appendChild(label);
      row.appendChild(dec);
      row.appendChild(input);
      row.appendChild(inc);
      inputsHost.appendChild(row);
    });
  }

  // editable representation: cacheHitRate shown as a percent
  function toEdit(f) {
    return f.pct ? Math.round(state[f.name] * 100) : state[f.name];
  }
  function setEdit(f, raw) {
    let v = Number(raw);
    if (!isFinite(v)) v = 0;
    if (f.pct) {
      v = Math.max(0, Math.min(100, v));
      state[f.name] = v / 100;
    } else {
      if (f.min != null) v = Math.max(f.min, v);
      if (f.max != null) v = Math.min(f.max, v);
      state[f.name] = v;
    }
    render();
  }
  function bump(f, dir) {
    const cur = toEdit(f);
    setEdit(f, cur + dir * f.step);
    if (inputEls[f.name]) inputEls[f.name].value = String(toEdit(f));
  }

  // --- readout --------------------------------------------------------------
  let reqOut, monthOut, monthFullOut, savingOut, latOut, latIdxOut, latGenOut;
  function buildReadout() {
    clear(readoutHost);
    const mkFigure = (labelKey, cls) => {
      const fig = el("div", { class: "costc-figure" });
      const lbl = el("span", { class: "costc-figure-label", text: t(labelKey) });
      const val = el("output", { class: "costc-figure-val " + (cls || "") });
      fig.appendChild(lbl);
      fig.appendChild(val);
      readoutHost.appendChild(fig);
      return val;
    };
    reqOut = mkFigure("perRequest", "is-primary");
    monthOut = mkFigure("perMonth", "is-primary");
    const lat = el("div", { class: "costc-figure" });
    const latLbl = el("span", { class: "costc-figure-label", text: t("latency") });
    latOut = el("output", { class: "costc-figure-val" });
    lat.appendChild(latLbl);
    lat.appendChild(latOut);
    readoutHost.appendChild(lat);

    const split = el("p", { class: "costc-latsplit" });
    latIdxOut = el("span", { class: "costc-lat-idx" });
    latGenOut = el("span", { class: "costc-lat-gen" });
    split.appendChild(latIdxOut);
    split.appendChild(document.createTextNode(" + "));
    split.appendChild(latGenOut);
    readoutHost.appendChild(split);

    savingOut = mkFigure("cachedSaving", "is-saving");
  }

  function pulse(node) {
    if (!node) return;
    if (prefersReducedMotion()) return; // snap: no transform/opacity pulse
    node.classList.remove("costc-pulse");
    // force reflow so the animation restarts
    void node.offsetWidth;
    node.classList.add("costc-pulse");
  }

  function render() {
    const cpr = costPerRequest();
    const mc = monthlyCost();
    const mfull = monthlyNoCache();
    const saving = mfull - mc;
    const lat = latencyMs();

    if (reqOut) { reqOut.textContent = fmtUSD(cpr, 6); pulse(reqOut); }
    if (monthOut) { monthOut.textContent = fmtUSD(mc, 2) + " / " + monthLabel(); pulse(monthOut); }
    if (latOut) { latOut.textContent = Math.round(lat) + " ms"; pulse(latOut); }
    if (latIdxOut) latIdxOut.textContent = t("latencyIndex") + " " + Math.round(state.latencyIndexMs) + " ms";
    if (latGenOut) latGenOut.textContent = t("latencyGen") + " " + Math.round(state.latencyGenMs) + " ms";
    if (savingOut) { savingOut.textContent = fmtUSD(saving, 2) + " / " + monthLabel(); pulse(savingOut); }

    if (onChange) {
      onChange({
        costPerRequest: cpr,
        monthlyCost: mc,
        monthlyNoCache: mfull,
        saving,
        latencyMs: lat,
        state: { ...state },
      });
    }
  }

  function monthLabel() {
    return lang === "en" ? "mo" : "мес";
  }

  // --- public mutators ------------------------------------------------------
  function setField(name, value) {
    const f = FIELDS.find((x) => x.name === name);
    if (f) {
      setEdit(f, value);
      if (inputEls[name]) inputEls[name].value = String(toEdit(f));
      return;
    }
    if (name in state) {
      state[name] = num(value, state[name]);
      render();
    }
  }
  function setLang(next) {
    lang = next === "en" ? "en" : "ru";
    buildInputs();
    buildReadout();
    render();
  }
  function getState() {
    return { ...state };
  }
  function recompute() {
    render();
  }

  buildInputs();
  buildReadout();
  render();

  return {
    recompute,
    setField,
    setLang,
    getState,
    destroy() {
      offs.off();
    },
  };
}

// --- helpers ----------------------------------------------------------------
function num(v, fallback) {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function fmtUSD(v, maxFrac) {
  if (!isFinite(v)) v = 0;
  // ASCII-only formatting; small per-request costs need more fraction digits.
  const digits = v !== 0 && Math.abs(v) < 0.01 ? maxFrac : Math.min(maxFrac, 4);
  let s = v.toFixed(digits);
  // trim trailing zeros but keep at least 2 fraction digits for readability
  if (s.indexOf(".") !== -1) {
    s = s.replace(/(\.\d{2}\d*?)0+$/, "$1").replace(/\.$/, "");
  }
  return "$" + s;
}

let _uid = 0;
function uid(prefix) {
  _uid += 1;
  return prefix + "-" + _uid;
}
