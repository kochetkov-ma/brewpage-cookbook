---
id: T-INTERACTIVE-RAG-LANG-URL
title: RAG Guide -- shareable ?lang=ru locale URL + EN-default JS toggle wiring
status: closed
priority: P1
owner: interactive-engineer
created: 2026-06-14
updated: 2026-06-14
tags: [interactive, rag, i18n, lang-url, toggle]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-CONTENT-RAG-BILINGUAL-FLIP.md
  - T-RECIPE-RAG-SITE.md
---

## Context
With EN as the static default (`T-CONTENT-RAG-BILINGUAL-FLIP`), the i18n lang store + toggle must make
RU reachable via a shareable, deep-linkable `?lang=ru` URL: visiting `?lang=ru` renders RU on first
interaction, the toggle updates the URL query, and the choice persists. EN is the default with no query
(or `?lang=en`). This is the mechanics half (interactive-engineer); the copy is owned by
`T-CONTENT-RAG-BILINGUAL-FLIP` (cookbook-author). Vanilla JS ES module on the existing `i18n.js`
lang store; full no-JS degradation (EN static prose stands alone).

## Acceptance
- [x] `?lang=ru` deep-links to the RU locale on load; `?lang=en` / no query = EN default.
- [x] The lang toggle updates the URL query (shareable) and persists the choice across pages.
- [x] No-JS readers still get the EN static prose; JS only enhances the toggle.
- [x] Wired through the shared `i18n.js` lang store; no per-page forks.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. Pairs with
  `T-CONTENT-RAG-BILINGUAL-FLIP` (editorial copy) -- this card owns the toggle + URL mechanics only.
- 2026-06-14 (R2 close): CLOSED. `?lang=ru` is a shareable, deep-linkable RU URL with toggle writeback
  to the URL query; EN is the default (no query / `?lang=en`); choice persists across pages on the
  shared `i18n.js` store. Harness i18n-URL **66/66 PASS**. Shipped under milestone tag **`v0.1.0`**
  (unprefixed), commit SHA **`68ddcab`**, pushed to origin. Accepted-minor `aria-label="Language /
  Russian"` bilingualisation on the toggle deferred to `M-INTERACTIVE-RAG-NOJS-EN-POLISH`. Live
  publish stays user-gated.
