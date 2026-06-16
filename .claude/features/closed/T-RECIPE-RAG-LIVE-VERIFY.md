---
id: T-RECIPE-RAG-LIVE-VERIFY
title: RAG Guide -- verify first live deploy (GitHub run/Release green + brewpage.app renders EN/RU, footer v0.1.1, SEO live)
status: closed
priority: P1
owner: interactive-engineer
created: 2026-06-15
updated: 2026-06-15
tags: [recipe, rag, verify, live, playwright, github, release, seo]
links:
  - EPIC-RAG-REVIEW-DEPLOY.md
  - T-RECIPE-RAG-LIVE-PUBLISH.md
---

## Context
Verify the first live deploy on both surfaces:
- GitHub: the publish workflow run is GREEN; a GitHub Release `v0.1.1` exists with the live
  brewpage.app link.
- brewpage.app: the site renders both EN and RU, the footer shows `v0.1.1`, and the per-page SEO
  meta is live (title/desc/canonical/hreflang/og/twitter/JSON-LD).

Builds the re-verify harness (interactive-engineer) and runs the live-site check (general-purpose +
Playwright against the live URL). Part of `EPIC-RAG-REVIEW-DEPLOY`.

## Acceptance
- [x] GitHub publish workflow run is green.
- [x] GitHub Release `v0.1.1` exists and links the live brewpage.app URL.
- [x] Live site renders EN and RU (`?lang=ru` toggle works).
- [x] Footer shows `v0.1.1` on the live site.
- [x] SEO meta present + correct on the live pages.
- [x] Verification artifacts (run output + screenshots) saved under `.claude/reports/<ts>_rag-live-verify/`.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-15: Minted + CLAIMED (R1) under `progress/`, owner interactive-engineer (re-verify harness)
  + general-purpose with Playwright (live-site check). Child of `EPIC-RAG-REVIEW-DEPLOY`. Runs after
  `T-RECIPE-RAG-LIVE-PUBLISH` lands the `v0.1.1` live deploy.
- 2026-06-15: CLOSED (R2) -- DONE + VERIFIED on both surfaces.
  - GitHub: publish run `27544416117` GREEN; Release `v0.1.1` created with the live link + recipes
    manifest + both ecosystem cross-links. Tag `v0.1.1` -> commit `317a685`.
  - brewpage.app (https://brewpage.app/public/FsOfbLP4df): renders EN-default + RU `?lang=ru` toggle,
    footer `v0.1.1`, SEO meta with the real id, og:image 200, zero recipe-origin external requests.
    PUT kept the SAME id (update, not create). Harness 712/0.
