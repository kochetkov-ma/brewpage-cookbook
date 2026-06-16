---
id: EPIC-RAG-SEO-VERSIONING
title: RAG Guide -- SEO + no-build versioning + EN-primary bilingual flip
status: closed
priority: P1
owner: (manager)
created: 2026-06-14
updated: 2026-06-14
tags: [epic, rag, seo, versioning, i18n, bilingual, publish-scope]
links:
  - T-CONTENT-RAG-BILINGUAL-FLIP.md
  - T-INTERACTIVE-RAG-LANG-URL.md
  - T-PLATFORM-RAG-VERSIONING.md
  - T-SEO-RAG-FULL.md
  - T-CI-RAG-PUBLISH-SCOPE.md
  - T-RECIPE-RAG-V010-TAG.md
  - T-RECIPE-RAG-SITE.md
  - EPIC-COOKBOOK-V1.md
---

## Context
Umbrella for the next RAG Guide hardening pass before the first curated milestone: flip the site to
EN-primary bilingual, make the RU locale shareable via a `?lang=ru` URL, add no-build site versioning,
land full per-page SEO, add a deterministic publish-scope filter, and cut the `v0.1.0` milestone tag.
The full RAG Guide site is already BUILT + VERIFIED + REVIEWED + STAGED (`T-RECIPE-RAG-SITE`,
in progress); this epic readies it for discoverability + a tagged milestone. Publish to brewpage.app
stays GATED this round -- the `v0.1.0` tag marks the milestone, no outward publish in scope here.

This epic RESOLVES backlog item `T-CI-PUBLISH-SCOPE-FILTER` (the publish-scope filter / `.brewpageignore`
work) by folding it into child task `T-CI-RAG-PUBLISH-SCOPE`. It RELATES to `T-RECIPE-RAG-SITE`
(the staged site this hardens) and to `EPIC-COOKBOOK-V1` (the V1-live umbrella it feeds).

## Acceptance
- [x] `T-CONTENT-RAG-BILINGUAL-FLIP` closed -- EN-primary: static EN HTML is the served default, RU via JS toggle.
- [x] `T-INTERACTIVE-RAG-LANG-URL` closed -- `?lang=ru` is a shareable, deep-linkable locale URL.
- [x] `T-PLATFORM-RAG-VERSIONING` closed -- no-build versioning (`version.json` + footer stamp + stamp script).
- [x] `T-SEO-RAG-FULL` closed -- full per-page SEO (meta/canonical/hreflang/og/twitter/JSON-LD/robots/favicon/theme-color/og-image).
- [x] `T-CI-RAG-PUBLISH-SCOPE` closed -- deterministic publish-scope filter (`.brewpageignore`) that fits BrewPage limits; resolves `T-CI-PUBLISH-SCOPE-FILTER`.
- [x] `T-RECIPE-RAG-V010-TAG` closed -- `v0.1.0` milestone tag cut (publish to brewpage.app stays user-gated this round).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Minted + claimed (R1). Created with 6 child tasks, all moved to `progress/`. Owners
  spread across cookbook-author / interactive-engineer / recipe-site-architect / site-builder /
  release-engineer per child fit. Resolves backlog `T-CI-PUBLISH-SCOPE-FILTER` (folded into
  `T-CI-RAG-PUBLISH-SCOPE`, backlog file removed). Relates to `T-RECIPE-RAG-SITE` + `EPIC-COOKBOOK-V1`.
- Scope boundary: this epic does NOT perform the outward publish to brewpage.app -- the `v0.1.0` tag
  is the milestone marker; live publish stays pending user authorization (tracked on `T-RECIPE-RAG-SITE`).

Child tasks:
- `T-CONTENT-RAG-BILINGUAL-FLIP` (P1, progress, cookbook-author) -- EN-primary bilingual flip.
- `T-INTERACTIVE-RAG-LANG-URL` (P1, progress, interactive-engineer) -- `?lang=ru` shareable lang URL.
- `T-PLATFORM-RAG-VERSIONING` (P1, progress, recipe-site-architect) -- no-build site versioning.
- `T-SEO-RAG-FULL` (P1, progress, site-builder) -- full per-page SEO.
- `T-CI-RAG-PUBLISH-SCOPE` (P1, progress, release-engineer) -- publish-scope filter; resolves `T-CI-PUBLISH-SCOPE-FILTER`.
- `T-RECIPE-RAG-V010-TAG` (P1, progress, release-engineer) -- `v0.1.0` tag milestone (publish gated).

- 2026-06-14 (V7-BOARD / R2 reconcile + close): CLOSED. Milestone SHIPPED + TAGGED. Release tag
  **`v0.1.0`** (unprefixed) on `main`, commit SHA **`68ddcab`** (stamp commit; the EN-primary rollout +
  fixes are in the ancestry: baseline `1dffb8b`, shared-layer `85d8a9e`, HTML rollout `08a4b67`,
  fixes `bc1552e`, stamp `68ddcab`). Pushed to origin. All 6 child tasks closed in the same change.
- Delivered: EN-primary bilingual flip (static EN HTML default + RU via JS `?lang=ru` toggle with URL
  writeback); no-build site versioning (`version.json` + footer slot + `stamp-version.mjs`, all stamped
  to `v0.1.0`); full per-page SEO on all 12 pages (title/desc/canonical-param-less/hreflang trio/og/
  twitter/JSON-LD/robots/theme-color/favicon/og-image); publish-scope filter (`.brewpageignore`,
  published set 84 files / 1.69 MB); local og-image + favicon set + `sitemap.xml`.
- Verification: harness PASS 706 / FAIL 6 -- all 6 are accepted-minor RU no-JS interactive-host data
  fallbacks (chunking cat-table + Group-C drilldown-host fallbacks); 0 blocker / 0 major. Code-block
  system 190/190, SEO 168/168, i18n-URL 66/66, version-footer 36/36, bundle 2/2.
- Scope boundary held: the outward publish to brewpage.app stays USER-GATED -- nothing published this
  round. `v0.1.0` is the milestone marker only; live publish remains tracked on `T-RECIPE-RAG-SITE`.
- Accepted-minors (deferred to a future polish task, NOT blockers): (1) interactive-host no-JS DATA
  fallbacks render RU on 6 pages; (2) chunking data-driven cat-table RU; (3) bilingual
  `aria-label="Language / Russian"` on the lang toggle; (4) `.brewpageignore` does not self-exclude
  (published count 84-85, still under the 100-file cap). Filed to backlog as
  `M-INTERACTIVE-RAG-NOJS-EN-POLISH`.
- Process incident (learning): during the review phase an agent ran `git checkout HEAD -- <pages>` and
  destroyed the uncommitted EN-primary HTML rollout; it was fully recovered by re-running the rollout
  and committing (now protected in git). Lesson: commit work-in-progress before any destructive-capable
  operation.
