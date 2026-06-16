---
id: T-CONTENT-RAG-BILINGUAL-FLIP
title: RAG Guide -- EN-primary bilingual flip (static EN HTML default + RU JS toggle)
status: closed
priority: P1
owner: cookbook-author
created: 2026-06-14
updated: 2026-06-14
tags: [content, rag, i18n, bilingual, en-primary]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-RECIPE-RAG-SITE.md
  - ../specs/T-CONTENT-RAG-AUTHORING.md
---

## Context
The staged RAG Guide site is RU-default with EN wired via the i18n lang store. Flip the served default
to EN-primary: the static, in-HTML prose that ships in each page is the ENGLISH copy (so the
no-JS / first-paint / crawler-visible content is English), and RU becomes the JS toggle alternate.
This is the cross-recipe editorial half (cookbook-author lead); the lang-store / toggle mechanics +
shareable URL are tracked by `T-INTERACTIVE-RAG-LANG-URL` (interactive-engineer). CA describes/owns the
copy; IE owns the toggle internals -- do not blur the boundary.

## Acceptance
- [x] Each page ships EN as the static, in-document default prose (no-JS readers + crawlers see English).
- [x] RU prose remains available via the lang toggle with structural parity (same sections, code blocks, citations preserved).
- [x] `data` / `nav` / glossary `{ ru, en }` payloads consistent with the EN-default served order.
- [x] ASCII punctuation only; both ecosystem cross-links (https://brewpage.app + https://github.com/kochetkov-ma/brewpage-openapi) present per page in both locales.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. Editorial flip half; pairs with
  `T-INTERACTIVE-RAG-LANG-URL` for the toggle + `?lang=ru` URL mechanics.
- 2026-06-14 (R2 close): CLOSED. EN is now the static, crawler-visible, no-JS default prose on all 12
  pages; RU served via the JS toggle. Shipped under milestone tag **`v0.1.0`** (unprefixed), commit SHA
  **`68ddcab`**, pushed to origin. Accepted-minors deferred to `M-INTERACTIVE-RAG-NOJS-EN-POLISH`:
  chunking data-driven cat-table + interactive-host no-JS DATA fallbacks still render RU on 6 pages
  (not blockers; harness 706 PASS / 6 accepted-minor FAIL). Live publish stays user-gated.
