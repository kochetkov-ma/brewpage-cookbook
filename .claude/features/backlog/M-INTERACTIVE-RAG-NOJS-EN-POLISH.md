---
id: M-INTERACTIVE-RAG-NOJS-EN-POLISH
title: RAG Guide -- EN-primary polish for no-JS interactive-host fallbacks + cat-table + lang aria-label + .brewpageignore self-exclude
status: backlog
priority: P3
owner:
created: 2026-06-14
updated: 2026-06-14
tags: [rag-guide, interactive, i18n, en-primary, no-js, a11y, accepted-minor]
links: []
---

## Context
Accepted-minor cleanups carried over from the `EPIC-RAG-SEO-VERSIONING` close (v0.1.0, commit
`68ddcab`). None blocked the milestone (harness 706 PASS / 6 accepted-minor FAIL, 0 blocker / 0 major),
but they leave the EN-primary flip slightly incomplete on the no-JS path. Bundle them into one polish
pass so the next milestone is fully EN-primary even with JS off.

## Acceptance
- [ ] Interactive-host no-JS DATA fallbacks render EN (not RU) -- 6 pages currently fall back to RU
      (chunking cat-table + Group-C drilldown-host data fallbacks).
- [ ] Chunking data-driven category table serves EN in the no-JS / static path.
- [ ] Lang toggle carries a bilingual `aria-label` (e.g. "Language / Russian") rather than RU-only / EN-only.
- [ ] `.brewpageignore` self-excludes (currently does not; published count 84-85, still under the
      100-file cap -- cosmetic, no limit risk).

## Notes
Filed from the `EPIC-RAG-SEO-VERSIONING` / V7-BOARD close (2026-06-14, v0.1.0 @ `68ddcab`). Source
notes live in that epic's `## Notes`. On close, record the release tag `vX.Y.Z` (unprefixed) + commit
SHA here. Owner suggestion: interactive-engineer (with site-builder for the cat-table + release-engineer
for the `.brewpageignore` tweak).
