---
id: T-CONTENT-RAG-EN
title: RAG Guide -- English translation of 12 chapters (i18n)
status: closed
priority: P2
owner: cookbook-author
created: 2026-06-13
updated: 2026-06-14
tags: [content, rag, i18n, translation, en, deferred]
links:
  - ../specs/T-CONTENT-RAG-AUTHORING.md
  - ../progress/T-RECIPE-RAG-SITE.md
---

## Context
User decision: keep the RAG Guide manuscripts in native Cyrillic Russian now; translate to
English when the site is built (i18n-ready). This is the deferred, committed follow-up that
delivers the EN locale.

Scope: translate the 12 native-Cyrillic chapters under `content/ru/*.md` to `content/en/*.md`.
Preserve code blocks, citations, IE handoff briefs, and cross-links verbatim; keep ASCII
punctuation throughout.

Sequencing:
- Depends on `T-CONTENT-RAG-AUTHORING` -- the RU manuscripts must be done (native Cyrillic +
  completeness pass) before translating.
- Pairs with `T-RECIPE-RAG-SITE` -- the site build wires the i18n lang store so the EN locale is
  consumable. Do this during the site-build phase.

## Acceptance
- [x] 12 EN chapters delivered under `content/en/*.md`.
- [x] Structural parity with the RU originals (same chapter set + section order + heading shape).
- [x] Code blocks, citations, and IE handoff briefs preserved (not paraphrased away).
- [x] ASCII punctuation only -- no smart quotes, em-dash, or unicode.
- [x] Mandatory cross-links present on each: https://brewpage.app +
      https://github.com/kochetkov-ma/brewpage-openapi.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-13: Created. EN translation deferred from `T-CONTENT-RAG-AUTHORING` (which keeps RU
  native Cyrillic) to the site-build phase per user decision (i18n-ready now, full EN later).
  Depends-on `T-CONTENT-RAG-AUTHORING`; pairs-with `T-RECIPE-RAG-SITE` (wires i18n lang store).
- 2026-06-14: CLOSED. English delivered as part of the RAG Guide site build -- 12 `content/en/*.md`
  chapters translated, `data`/`nav` {ru,en} wired, i18n live on all 12 pages, bilingual RU/EN
  verified in-browser. Ships WITH the RAG Guide site milestone -- NO separate release tag (the
  unprefixed `vX.Y.Z` milestone tag belongs to `T-RECIPE-RAG-SITE`, pending user authorization).
  Closed as part of the site-build phase; site publish + tag tracked on `T-RECIPE-RAG-SITE`.
