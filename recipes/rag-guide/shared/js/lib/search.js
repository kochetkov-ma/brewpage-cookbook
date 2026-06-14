/**
 * search.js -- client-side full-text site search over the 12-chapter corpus.
 *
 * RESPONSIBILITY: mount on [data-component="search-box"], load the compact
 * bilingual static index (shared/data/search-index.json), score the query with
 * field weighting (chapter title > section heading > body), and render ranked
 * results into [data-slot="results"] as an accessible combobox/listbox. Each
 * result links to <page>.html#<anchor> with a query-highlighted snippet.
 *
 * Bilingual: the index carries { docs: { ru:[...], en:[...] } }; the active
 * language comes from i18n.getLocale() and we re-query on i18n lang:change so
 * results follow the chrome language. Zero external requests -- the index is a
 * same-origin static JSON loaded once and scored fully in memory.
 *
 * Accessibility: input is role=combobox (aria-expanded / aria-controls /
 * aria-activedescendant); results is role=listbox of role=option; a polite live
 * region announces the result count. Keyboard: Down/Up move the active option,
 * Enter follows it, Esc closes, Tab leaves. Touch targets >=44px (CSS).
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.indexSrc  path to search-index.json (else host data-index-src)
 *   config.limit     max results (default 8)
 *
 * Index shape (see shared/data/search-index.json _schema):
 *   { pages:[{id,href,t:{ru,en}}], docs:{ ru:[{p,a,h,b}], en:[{p,a,h,b}] } }
 * Legacy/fallback: a bare array or { items:[{title,href,section,body}] } is
 * also accepted so the box degrades rather than breaks.
 */

import { qs, el, clear, listeners, fetchJson } from "./dom.js";
import * as i18n from "./i18n.js";

// Field weights: a hit in a chapter title outranks a section heading, which
// outranks a body hit. Phrase (full-query substring) and prefix bonuses sharpen
// ranking without a search library.
const W_TITLE = 12;
const W_HEADING = 6;
const W_BODY = 1;
const W_PHRASE = 8; // full query appears as a substring in heading/body
const W_PREFIX = 2; // a token matches at a word boundary (start of a word)

const SNIPPET_LEN = 140;

export function init(rootEl, config) {
  const cfg = config || {};
  const indexSrc = cfg.indexSrc || rootEl.dataset.indexSrc;
  const limit = cfg.limit || 8;

  const input = qs('input[type="search"], .search-box__input', rootEl);
  const results = qs('[data-slot="results"]', rootEl) || qs(".search-box__results", rootEl);
  if (!input || !results) return { destroy() {} };

  const events = listeners();
  let destroyed = false;
  let active = -1; // index of the keyboard-active option (-1 = none)
  let current = []; // current rendered matches

  // bilingual model: pages[] + per-lang doc arrays. Normalized below.
  let model = { pages: [], docs: { ru: [], en: [] }, legacy: null };

  // live region for result-count announcements (created once, scoped to box).
  let live = qs('[data-slot="search-live"]', rootEl);
  if (!live) {
    live = el("span", {
      class: "visually-hidden",
      attrs: { "data-slot": "search-live", "aria-live": "polite", role: "status" },
    });
    rootEl.appendChild(live);
  }

  // ---- index load (same-origin static JSON; no external request) ----------
  if (indexSrc) {
    fetchJson(indexSrc)
      .then((json) => {
        if (destroyed) return;
        model = normalize(json);
      })
      .catch(() => {
        if (destroyed) return;
        model = { pages: [], docs: { ru: [], en: [] }, legacy: deriveFallbackIndex() };
      });
  } else {
    model = { pages: [], docs: { ru: [], en: [] }, legacy: deriveFallbackIndex() };
  }

  function normalize(json) {
    if (Array.isArray(json)) return { pages: [], docs: { ru: [], en: [] }, legacy: json };
    if (Array.isArray(json.items)) return { pages: [], docs: { ru: [], en: [] }, legacy: json.items };
    const pages = Array.isArray(json.pages) ? json.pages : [];
    const docs = json.docs && typeof json.docs === "object" ? json.docs : { ru: [], en: [] };
    return { pages, docs: { ru: docs.ru || [], en: docs.en || [] }, legacy: null };
  }

  // Fallback when the index file is unavailable: derive from on-page headings.
  function deriveFallbackIndex() {
    return Array.from(document.querySelectorAll("section[id] h2, section[id] h1")).map((h) => {
      const section = h.closest("section[id]");
      return {
        title: h.textContent.trim(),
        href: "#" + (section ? section.id : ""),
        section: section ? section.id : "",
        body: (section ? section.textContent : h.textContent).trim().slice(0, 200),
      };
    });
  }

  // ---- scoring ------------------------------------------------------------
  function tokenize(q) {
    return q.toLowerCase().split(/[\s.,;:!?()"'\/\[\]]+/).filter((t) => t.length > 0);
  }

  function fieldScore(text, tokens, weight, phrase) {
    if (!text) return 0;
    const hay = text.toLowerCase();
    let s = 0;
    for (const tok of tokens) {
      const at = hay.indexOf(tok);
      if (at === -1) continue;
      s += weight;
      // word-boundary (prefix) bonus
      if (at === 0 || /[\s.,;:!?()"'\/\[\]-]/.test(hay[at - 1])) s += W_PREFIX;
    }
    if (phrase && tokens.length > 1 && hay.indexOf(phrase) !== -1) s += W_PHRASE;
    return s;
  }

  // Score one structured doc, pulling its chapter title from pages[doc.p].
  function scoreDoc(doc, tokens, phrase, loc) {
    const page = model.pages[doc.p];
    const title = page && page.t ? (page.t[loc] != null ? page.t[loc] : page.t.en) : "";
    let s = 0;
    s += fieldScore(title, tokens, W_TITLE, phrase);
    s += fieldScore(doc.h, tokens, W_HEADING, phrase);
    s += fieldScore(doc.b, tokens, W_BODY, phrase);
    return s;
  }

  function scoreLegacy(item, tokens, phrase) {
    let s = 0;
    s += fieldScore(item.title, tokens, W_HEADING, phrase);
    s += fieldScore(item.body, tokens, W_BODY, phrase);
    return s;
  }

  function search(query) {
    const loc = i18n.getLocale();
    const phrase = query.trim().toLowerCase();
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    // legacy/fallback path
    if (model.legacy) {
      return model.legacy
        .map((item) => ({
          s: scoreLegacy(item, tokens, phrase),
          title: item.title,
          page: item.title,
          heading: item.section || "",
          href: item.href,
          snippet: snippet(item.body || "", tokens),
        }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit);
    }

    const docs = model.docs[loc] && model.docs[loc].length ? model.docs[loc] : model.docs.ru;
    const out = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const s = scoreDoc(doc, tokens, phrase, loc);
      if (s <= 0) continue;
      const page = model.pages[doc.p] || {};
      const title = page.t ? (page.t[loc] != null ? page.t[loc] : page.t.en) : "";
      out.push({
        s,
        title,
        page: title,
        heading: doc.h,
        href: (page.href || "") + "#" + doc.a,
        snippet: snippet(doc.b || "", tokens),
      });
    }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, limit);
  }

  // Build a short snippet around the first matched token; mark hits with <mark>.
  function snippet(body, tokens) {
    if (!body) return "";
    const low = body.toLowerCase();
    let at = -1;
    for (const tok of tokens) {
      const i = low.indexOf(tok);
      if (i !== -1 && (at === -1 || i < at)) at = i;
    }
    let start = at > 40 ? at - 40 : 0;
    let text = body.slice(start, start + SNIPPET_LEN);
    if (start > 0) text = "..." + text;
    if (start + SNIPPET_LEN < body.length) text = text + "...";
    return text;
  }

  // ---- open/close ---------------------------------------------------------
  function open() {
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function close() {
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }

  function announce(msg) {
    live.textContent = msg;
  }

  // <mark> the matched tokens inside a text node safely (no innerHTML of body).
  function markInto(parent, text, tokens) {
    if (!text) return;
    const low = text.toLowerCase();
    let i = 0;
    while (i < text.length) {
      let hitAt = -1;
      let hitLen = 0;
      for (const tok of tokens) {
        const at = low.indexOf(tok, i);
        if (at !== -1 && (hitAt === -1 || at < hitAt)) {
          hitAt = at;
          hitLen = tok.length;
        }
      }
      if (hitAt === -1) {
        parent.appendChild(document.createTextNode(text.slice(i)));
        break;
      }
      if (hitAt > i) parent.appendChild(document.createTextNode(text.slice(i, hitAt)));
      const m = el("mark", { class: "search-box__hit", text: text.slice(hitAt, hitAt + hitLen) });
      parent.appendChild(m);
      i = hitAt + hitLen;
    }
  }

  function renderResults(matches, tokens) {
    clear(results);
    current = matches;
    active = -1;
    input.removeAttribute("aria-activedescendant");

    if (matches.length === 0) {
      const en = i18n.getLocale() === "en";
      const li = el("li", {
        class: "search-box__result search-box__result--empty",
        attrs: { role: "option", "aria-disabled": "true" },
        text: en ? "No matches" : "Ничего не найдено",
      });
      results.appendChild(li);
      announce(en ? "No matches" : "Ничего не найдено");
      open();
      return;
    }

    matches.forEach((m, idx) => {
      const li = el("li", {
        class: "search-box__result",
        attrs: { role: "option", id: "search-opt-" + idx, "aria-selected": "false" },
      });
      const a = el("a", { class: "search-box__link", attrs: { href: m.href, tabindex: "-1" } });
      const head = el("span", { class: "search-box__r-head" });
      markInto(head, m.heading || m.title, tokens);
      a.appendChild(head);
      const meta = el("span", { class: "search-box__r-meta", text: m.page });
      a.appendChild(meta);
      if (m.snippet) {
        const sn = el("span", { class: "search-box__r-snip" });
        markInto(sn, m.snippet, tokens);
        a.appendChild(sn);
      }
      li.appendChild(a);
      results.appendChild(li);
    });

    const en = i18n.getLocale() === "en";
    announce(
      en
        ? matches.length + (matches.length === 1 ? " result" : " results")
        : matches.length + " " + plurRu(matches.length)
    );
    open();
  }

  function plurRu(n) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "результат";
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "результата";
    return "результатов";
  }

  // ---- keyboard navigation over the listbox -------------------------------
  function setActive(next) {
    const opts = Array.from(results.querySelectorAll('[role="option"]:not([aria-disabled])'));
    if (opts.length === 0) return;
    if (active >= 0 && opts[active]) {
      opts[active].classList.remove("is-active");
      opts[active].setAttribute("aria-selected", "false");
    }
    active = ((next % opts.length) + opts.length) % opts.length;
    const node = opts[active];
    node.classList.add("is-active");
    node.setAttribute("aria-selected", "true");
    input.setAttribute("aria-activedescendant", node.id);
    node.scrollIntoView({ block: "nearest" });
  }

  function followActive() {
    const opts = Array.from(results.querySelectorAll('[role="option"]:not([aria-disabled])'));
    if (active >= 0 && opts[active]) {
      const link = opts[active].querySelector("a.search-box__link");
      if (link) {
        window.location.href = link.getAttribute("href");
        return true;
      }
    }
    return false;
  }

  let debounce = null;
  function runQuery() {
    const q = input.value.trim();
    if (!q) {
      close();
      clear(results);
      return;
    }
    const tokens = tokenize(q);
    renderResults(search(q), tokens);
  }

  events.on(input, "input", () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(runQuery, 110);
  });

  events.on(input, "keydown", (e) => {
    switch (e.key) {
      case "ArrowDown":
        if (results.hidden) {
          if (input.value.trim()) runQuery();
        } else {
          setActive(active + 1);
        }
        e.preventDefault();
        break;
      case "ArrowUp":
        if (!results.hidden) {
          setActive(active - 1);
          e.preventDefault();
        }
        break;
      case "Enter":
        if (!results.hidden && active >= 0) {
          if (followActive()) e.preventDefault();
        }
        break;
      case "Escape":
        if (!results.hidden) {
          close();
          e.preventDefault();
        }
        break;
      default:
        break;
    }
  });

  // pointer: clicking an option follows its link (the <a> does it natively);
  // hover/focus moves the active descendant for parity with keyboard.
  events.on(results, "mousemove", (e) => {
    const li = e.target.closest('[role="option"]:not([aria-disabled])');
    if (!li) return;
    const opts = Array.from(results.querySelectorAll('[role="option"]:not([aria-disabled])'));
    const idx = opts.indexOf(li);
    if (idx !== -1 && idx !== active) setActive(idx);
  });

  events.on(document, "click", (e) => {
    if (!rootEl.contains(e.target)) close();
  });

  // re-run on language switch so results follow the active chrome language.
  const unsub = i18n.subscribe(() => {
    if (!results.hidden && input.value.trim()) runQuery();
  });

  return {
    destroy() {
      destroyed = true;
      if (debounce) clearTimeout(debounce);
      events.off();
      if (typeof unsub === "function") unsub();
    },
  };
}
