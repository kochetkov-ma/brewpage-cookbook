---
id: T-CONTENT-RAG-REVIEW
title: RAG Guide -- post-review all text (facts/links/SEO), EN then RU, apply fixes
status: closed
priority: P1
owner: cookbook-author
created: 2026-06-15
updated: 2026-06-15
tags: [content, rag, review, facts, links, seo, en, ru, fixes]
links:
  - EPIC-RAG-REVIEW-DEPLOY.md
  - ../specs/T-CONTENT-RAG-AUTHORING.md
---

## Context
Pre-live-deploy editorial + technical review of ALL RAG Guide text on the staged `v0.1.0` site.
Review and fix: factual accuracy (every technical claim cites a primary source), all links (internal
nav + mandatory ecosystem cross-links to https://brewpage.app + https://github.com/kochetkov-ma/brewpage-openapi
+ external citations resolve), and SEO copy (titles/descriptions/og/twitter/JSON-LD read well and are
accurate). EN is the primary served locale -- review EN first, then RU. Apply fixes in place.

Part of `EPIC-RAG-REVIEW-DEPLOY`. Owners: cookbook-author (editorial/fact/citation) + site-builder
(HTML/SEO head + link wiring fixes), supported by a review Workflow.

## Acceptance
- [x] EN pass: facts verified + cited, all links resolve, SEO copy accurate -- fixes applied.
- [x] RU pass: facts/links/SEO parity with EN -- fixes applied.
- [x] Both ecosystem cross-links present + correct on every page + README.
- [x] No broken internal nav / dead anchors; external citations resolve.
- [x] ASCII-only punctuation preserved across all edits.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-15: Minted + CLAIMED (R1) under `progress/`, owner cookbook-author (+ site-builder for
  HTML/SEO/link fixes; a review Workflow assists). Child of `EPIC-RAG-REVIEW-DEPLOY`.
- 2026-06-15: Sequence -- EN review first (primary served locale), then RU. Fixes land before the
  `v0.1.1` live-publish patch release.
- 2026-06-15: CLOSED (R2) -- DONE. EN-then-RU facts/links/SEO post-review complete; fixes applied in
  place. Content review fixes committed at SHA `d99fbab`; shipped live under milestone tag `v0.1.1`
  (commit `317a685`). Live: https://brewpage.app/public/FsOfbLP4df -- both ecosystem cross-links
  present on every page + README, ASCII-only preserved, no dead nav/anchors, SEO meta accurate live.
