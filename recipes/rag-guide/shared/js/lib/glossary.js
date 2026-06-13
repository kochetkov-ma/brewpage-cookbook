/**
 * glossary.js -- inline term popovers from glossary.json.
 *
 * RESPONSIBILITY: bind .term / [data-term] triggers in prose, look the key up
 * in glossary.json ({ "<key>": { ru, en } }), and show a .popover with the
 * locale-resolved definition (via i18n.js) on hover / focus / tap. Keyboard
 * dismissable (Esc), positioned within the host, announced. Content-decoupled:
 * the dictionary is the only source of copy; re-renders on `lang:change`.
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.dataSrc  path to glossary.json (default ../../data/glossary.json relative wiring by page)
 *   config.data     preloaded dict (skips fetch)
 *   config.locale   force locale (default i18n active locale)
 */

import { qsa, el, listeners, fetchJson, stripMeta } from "./dom.js";
import { t, getLocale, subscribe } from "./i18n.js";
import { onEscape } from "./a11y.js";

export function init(rootEl, config) {
  const cfg = config || {};
  const events = listeners();
  let dict = cfg.data ? stripMeta(cfg.data) : null;
  let destroyed = false;
  let popover = null;
  let currentTrigger = null;
  let offEsc = null;

  if (!dict && cfg.dataSrc) {
    fetchJson(cfg.dataSrc)
      .then((json) => {
        if (!destroyed) {
          dict = stripMeta(json);
          bind();
        }
      })
      .catch((err) => console.error("[glossary]", err));
  } else if (dict) {
    bind();
  }

  const offLang = subscribe(() => {
    // re-render the open popover in the new locale
    if (currentTrigger) show(currentTrigger);
  });

  function termKey(node) {
    return node.dataset.term || node.getAttribute("data-term");
  }

  function bind() {
    const triggers = qsa(".term[data-term], [data-term]", rootEl);
    triggers.forEach((node) => {
      // make keyboard reachable + describable
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.setAttribute("aria-haspopup", "true");
      node.setAttribute("aria-expanded", "false");

      events.on(node, "mouseenter", () => show(node));
      events.on(node, "mouseleave", () => scheduleHide(node));
      events.on(node, "focus", () => show(node));
      events.on(node, "blur", () => hide());
      events.on(node, "click", (e) => {
        e.preventDefault();
        if (currentTrigger === node && popover) hide();
        else show(node);
      });
      events.on(node, "keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          show(node);
        }
      });
    });
  }

  let hideTimer = null;
  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 120);
  }

  function show(node) {
    if (!dict) return;
    const key = termKey(node);
    const text = t(key, dict, cfg.locale || getLocale());
    if (!text) return;
    if (hideTimer) clearTimeout(hideTimer);

    if (!popover) {
      popover = el("div", {
        class: "popover",
        attrs: { role: "tooltip", id: "glossary-popover" },
      });
      events.on(popover, "mouseenter", () => {
        if (hideTimer) clearTimeout(hideTimer);
      });
      events.on(popover, "mouseleave", scheduleHide);
      document.body.appendChild(popover);
    }
    popover.innerHTML = "";
    popover.appendChild(el("p", { class: "popover__title", text: key }));
    popover.appendChild(el("p", { text }));
    popover.hidden = false;

    position(node, popover);

    if (currentTrigger && currentTrigger !== node) currentTrigger.setAttribute("aria-expanded", "false");
    currentTrigger = node;
    node.setAttribute("aria-expanded", "true");
    node.setAttribute("aria-describedby", "glossary-popover");

    if (offEsc) offEsc();
    offEsc = onEscape(document, () => hide());
  }

  function position(node, pop) {
    const rect = node.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    // place below the term; flip above if it would overflow the viewport.
    pop.style.position = "absolute";
    pop.style.visibility = "hidden";
    pop.style.insetInlineStart = "0";
    pop.style.insetBlockStart = "0";
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let left = scrollX + rect.left;
    if (left + pw > scrollX + window.innerWidth - 8) {
      left = scrollX + window.innerWidth - pw - 8;
    }
    let top = scrollY + rect.bottom + 6;
    if (rect.bottom + ph + 12 > window.innerHeight) {
      top = scrollY + rect.top - ph - 6;
    }
    pop.style.left = Math.max(8, left) + "px";
    pop.style.top = Math.max(8, top) + "px";
    pop.style.visibility = "visible";
  }

  function hide() {
    if (hideTimer) clearTimeout(hideTimer);
    if (popover) popover.hidden = true;
    if (currentTrigger) {
      currentTrigger.setAttribute("aria-expanded", "false");
      currentTrigger.removeAttribute("aria-describedby");
    }
    currentTrigger = null;
    if (offEsc) {
      offEsc();
      offEsc = null;
    }
  }

  return {
    destroy() {
      destroyed = true;
      events.off();
      offLang();
      if (offEsc) offEsc();
      if (hideTimer) clearTimeout(hideTimer);
      if (popover && popover.parentNode) popover.parentNode.removeChild(popover);
      popover = null;
    },
  };
}
