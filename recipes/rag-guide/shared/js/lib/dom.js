/**
 * dom.js -- shared DOM/SVG helpers for the RAG Guide interactive lib.
 *
 * RESPONSIBILITY: small, dependency-free DOM/SVG utilities every other lib
 * module builds on -- element/SVG creation, event bind/unbind, query helpers,
 * and a fetch-json helper for the data/* contracts. No global state.
 *
 * Exposes named helpers AND the standard init() shape so pages can wire it
 * uniformly. init() returns a no-op handle (this module is a pure toolbox).
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** Query one element within a scope (default document). */
export function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

/** Query all elements within a scope, as a real Array. */
export function qsa(selector, scope) {
  return Array.from((scope || document).querySelectorAll(selector));
}

/**
 * Create an HTML element.
 * @param {string} tag
 * @param {Object} [props]  { class|className, text, html, attrs:{}, dataset:{}, on:{} } + plain props.
 * @param {Array<Node|string>} [children]
 */
export function el(tag, props, children) {
  return build(document.createElement(tag), props, children);
}

/** Create an SVG element in the SVG namespace. */
export function svg(tag, props, children) {
  return build(document.createElementNS(SVG_NS, tag), props, children, true);
}

function build(node, props, children, isSvg) {
  if (props) {
    for (const key of Object.keys(props)) {
      const val = props[key];
      if (val == null) continue;
      if (key === "class" || key === "className") {
        node.setAttribute("class", val);
      } else if (key === "text") {
        node.textContent = val;
      } else if (key === "html") {
        node.innerHTML = val;
      } else if (key === "attrs") {
        for (const a of Object.keys(val)) setAttr(node, a, val[a]);
      } else if (key === "dataset") {
        for (const d of Object.keys(val)) node.dataset[d] = val[d];
      } else if (key === "on") {
        for (const ev of Object.keys(val)) node.addEventListener(ev, val[ev]);
      } else if (isSvg) {
        setAttr(node, key, val);
      } else {
        node[key] = val;
      }
    }
  }
  if (children != null) append(node, children);
  return node;
}

function setAttr(node, name, value) {
  if (value === false || value == null) node.removeAttribute(name);
  else if (value === true) node.setAttribute(name, "");
  else node.setAttribute(name, String(value));
}

/** Append one child or an array of children (strings become text nodes). */
export function append(parent, child) {
  if (Array.isArray(child)) {
    for (const c of child) append(parent, c);
  } else if (child != null) {
    parent.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return parent;
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/**
 * Bind an event and return an unbind function (cleanup-friendly).
 * @returns {() => void}
 */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** Collect unbind functions; off() runs and clears them all. */
export function listeners() {
  const offs = [];
  return {
    on(target, type, handler, options) {
      offs.push(on(target, type, handler, options));
      return this;
    },
    off() {
      while (offs.length) offs.pop()();
    },
  };
}

/** Fetch + parse JSON with a clear error on failure. */
export async function fetchJson(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`fetchJson ${url}: HTTP ${res.status}`);
  return res.json();
}

/** Drop underscore-prefixed metadata keys (the data contracts' _schema etc.). */
export function stripMeta(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (!k.startsWith("_")) out[k] = obj[k];
  }
  return out;
}

export function init() {
  // Pure toolbox: no instance state.
  return { destroy() {} };
}
