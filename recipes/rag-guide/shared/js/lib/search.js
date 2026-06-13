/**
 * search.js -- STUB client-side search over a small static JSON index.
 *
 * RESPONSIBILITY (stub level): mount on [data-component="search-box"], fetch a
 * static index from data-index-src (array of { title, href, section, body }),
 * substring/token-score the query, and render matches into [data-slot="results"]
 * with combobox a11y (aria-expanded, listbox/options). Zero dependencies, no
 * search library. Minimal working behaviour is sufficient for the prototype.
 *
 * Resilience: if the index file is missing (it is not committed yet), the box
 * falls back to a tiny index derived from on-page section headings so search
 * still returns something. Reported to site-builder as a missing data fixture.
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.indexSrc  path to search-index.json (host data-index-src)
 *   config.limit     max results (default 8)
 */

import { qs, el, clear, listeners, fetchJson } from "./dom.js";

export function init(rootEl, config) {
  const cfg = config || {};
  const indexSrc = cfg.indexSrc || rootEl.dataset.indexSrc;
  const limit = cfg.limit || 8;

  const input = qs('input[type="search"], .search-box__input', rootEl);
  const results = qs('[data-slot="results"]', rootEl) || qs(".search-box__results", rootEl);
  if (!input || !results) return { destroy() {} };

  const events = listeners();
  let index = [];
  let destroyed = false;

  if (indexSrc) {
    fetchJson(indexSrc)
      .then((json) => {
        if (destroyed) return;
        index = Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : [];
      })
      .catch(() => {
        // missing index fixture -- derive a minimal one from the page.
        index = deriveFallbackIndex();
      });
  } else {
    index = deriveFallbackIndex();
  }

  function deriveFallbackIndex() {
    return Array.from(document.querySelectorAll("section[id] h1, section[id] h2")).map((h) => {
      const section = h.closest("section[id]");
      return {
        title: h.textContent.trim(),
        href: "#" + (section ? section.id : ""),
        section: section ? section.id : "",
        body: (section ? section.textContent : h.textContent).trim().slice(0, 200),
      };
    });
  }

  function score(item, tokens) {
    const hay = `${item.title} ${item.section} ${item.body || ""}`.toLowerCase();
    let s = 0;
    for (const tok of tokens) {
      if (!tok) continue;
      if (item.title.toLowerCase().includes(tok)) s += 3;
      if (hay.includes(tok)) s += 1;
    }
    return s;
  }

  function search(query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return index
      .map((item) => ({ item, s: score(item, tokens) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((r) => r.item);
  }

  function open() {
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function close() {
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function renderResults(matches) {
    clear(results);
    if (matches.length === 0) {
      const li = el("li", { class: "search-box__result", attrs: { role: "option", "aria-disabled": "true" }, text: "No matches" });
      results.appendChild(li);
      open();
      return;
    }
    matches.forEach((m, i) => {
      const li = el("li", { class: "search-box__result", attrs: { role: "option", id: `search-opt-${i}` } });
      li.appendChild(el("a", { class: "search-box__link", href: m.href, text: m.title }));
      if (m.section) li.appendChild(el("span", { class: "card__meta", text: " - " + m.section }));
      results.appendChild(li);
    });
    open();
  }

  let debounce = null;
  events.on(input, "input", () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.trim();
      if (!q) {
        close();
        return;
      }
      renderResults(search(q));
    }, 120);
  });
  events.on(input, "keydown", (e) => {
    if (e.key === "Escape") close();
  });
  events.on(document, "click", (e) => {
    if (!rootEl.contains(e.target)) close();
  });

  return {
    destroy() {
      destroyed = true;
      if (debounce) clearTimeout(debounce);
      events.off();
    },
  };
}
