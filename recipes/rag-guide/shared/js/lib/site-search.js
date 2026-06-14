/**
 * site-search.js -- one-call wiring for the header full-text search affordance.
 *
 * RESPONSIBILITY: find the [data-component="search-box"] host (if present on the
 * page), init the search lib on it, and keep the localized PLACEHOLDER in sync
 * with the active language (the input placeholder cannot use the textContent
 * [data-i18n] path, so it carries data-ph-ru / data-ph-en and we apply it here).
 * The label + everything else already flows through the page's [data-i18n] pass.
 *
 * Single responsibility, standard shape: every page-glue calls
 *   track(initSiteSearch(document, {}))
 * once; returns { destroy() } which tears down the search instance + the lang
 * subscription. No-op (safe) when the page has no search host.
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 */

import { qs, qsa } from "./dom.js";
import * as i18n from "./i18n.js";
import { init as initSearch } from "./search.js";

export function init(rootEl, config) {
  const root = rootEl || document;
  const host = qs('[data-component="search-box"]', root);
  if (!host) return { destroy() {} };

  const search = initSearch(host, config || {});

  function applyPlaceholders(loc) {
    qsa("[data-i18n-ph]", root).forEach((node) => {
      const val = node.getAttribute("data-ph-" + loc);
      if (val != null) node.setAttribute("placeholder", val);
    });
  }
  applyPlaceholders(i18n.getLocale());
  const unsub = i18n.subscribe(applyPlaceholders);

  return {
    destroy() {
      if (search && typeof search.destroy === "function") search.destroy();
      if (typeof unsub === "function") unsub();
    },
  };
}
