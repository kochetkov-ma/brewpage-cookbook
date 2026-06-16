---
id: EPIC-RAG-REVIEW-DEPLOY
title: RAG Guide -- content/SEO/fact/link post-review + first live deploy via brewpage-action
status: closed
priority: P1
owner: manager
created: 2026-06-15
updated: 2026-06-15
tags: [epic, rag, review, deploy, publish, ci, seo, content, live]
links:
  - T-CONTENT-RAG-REVIEW.md
  - T-CI-RAG-PUBLISH-WORKFLOW.md
  - T-RECIPE-RAG-LIVE-PUBLISH.md
  - T-RECIPE-RAG-LIVE-VERIFY.md
  - T-RECIPE-RAG-SITE.md
  - EPIC-COOKBOOK-V1.md
---

## Context
Umbrella for the RAG Guide post-review + FIRST LIVE DEPLOY round. The site is `v0.1.0`-tagged
(commit SHA `68ddcab`), EN-primary bilingual, SEO-complete, version-stamped, and publish-scope
filtered -- STAGED but NOT live. This round (a) post-reviews all guide text for facts/links/SEO
(EN then RU) and applies fixes, (b) authors the recipe-publish GitHub Actions workflow, (c)
performs the first live publish to brewpage.app (REST bootstrap CREATE + secret + site-id record,
then a patch-release `v0.1.1` UPDATE via the action's PUT for a stable link), and (d) verifies the
result on GitHub + on the live site.

The user opened the publish gate for this round. Closes when a reader can open the RAG Guide as a
working interactive artifact on the live brewpage.app site, verified, at `v0.1.1`.

## Acceptance
- [x] `T-CONTENT-RAG-REVIEW` -- post-review all RAG Guide text (facts/links/SEO), EN then RU, fixes applied.
- [x] `T-CI-RAG-PUBLISH-WORKFLOW` -- `.github/workflows/publish-recipe.yml` authored (tag `v*.*.*` trigger,
      `brewpage-action@v1.1.1` PUT update, GitHub Release with live link).
- [x] `T-RECIPE-RAG-LIVE-PUBLISH` -- first live publish: REST bootstrap CREATE + repo secret +
      `.brewpage-site.json` recorded, then `v0.1.1` patch release publishing the UPDATE via PUT (stable link).
- [x] `T-RECIPE-RAG-LIVE-VERIFY` -- verified on GitHub (run green, Release `v0.1.1` with brewpage link)
      AND on brewpage.app (renders EN/RU, footer `v0.1.1`, SEO meta live).
- [x] At round end, close `T-RECIPE-RAG-SITE` as LIVE (record live URL + `v0.1.1` + commit SHA).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-15: Minted + CLAIMED (R1) -- created under `progress/`, owner manager. Four child tasks
  minted + claimed in the same change (`T-CONTENT-RAG-REVIEW`, `T-CI-RAG-PUBLISH-WORKFLOW`,
  `T-RECIPE-RAG-LIVE-PUBLISH`, `T-RECIPE-RAG-LIVE-VERIFY`), all under this epic.
- 2026-06-15: NOTE -- the existing `T-RECIPE-RAG-SITE` task (P1, in progress, STAGED + `v0.1.0`-tagged)
  will be CLOSED as LIVE at the END of this round: record the live brewpage.app URL + the `v0.1.1`
  tag + the publishing commit SHA in its `## Notes` at close. It is intentionally NOT closed in this
  claim change -- the live publish + verify must land first.
- 2026-06-15: Ownership map for this round --
  - content review + fixes: cookbook-author + site-builder (+ a review Workflow)
  - workflow authoring: github-actions-engineer
  - stamp-url script + REST bootstrap + tag/release + runbook: release-engineer
  - re-verify harness: interactive-engineer
  - live-site check: general-purpose + Playwright
  - board: task-tracker
- 2026-06-15: Publish design for the round -- bootstrap CREATE via direct REST (action/CLI consumer
  path lands via the workflow), record the returned site id in `.brewpage-site.json` + the owner token
  in repo secret `BREWPAGE_OWNER_TOKEN_RAG` (masked, never committed), then cut `v0.1.1` so the
  workflow runs the `brewpage-action@v1.1.1` PUT update for a stable live link. Feeds `EPIC-COOKBOOK-V1`.
- 2026-06-15: CLOSED (R2) -- DONE + VERIFIED LIVE. All four children + the staged `T-RECIPE-RAG-SITE`
  closed in the same change. RAG Guide is LIVE (first publish).
  - **Live URL:** https://brewpage.app/public/FsOfbLP4df (stable id, PUT-updated; ttl 30, expires 2026-07-15).
  - **Milestone tag:** `v0.1.1` (unprefixed, annotated) -> workflow-fix commit `317a685`.
  - Key SHAs: review content fixes `d99fbab`; publish infra `64173b5`; site descriptor `82b9586`;
    stamp `e4bb5d7`; workflow zip-fix `317a685`.
  - Verified: publish run `27544416117` GREEN; GitHub Release `v0.1.1` created with the live link +
    recipes manifest + both ecosystem cross-links; PUT kept the SAME id (update, not create); owner
    token stored only in repo secret `BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (never leaked); harness 712/0;
    live site renders EN-default + RU toggle, footer v0.1.1, SEO meta with real id, og:image 200,
    zero recipe-origin external requests.
  - **Link permanence (renew-on-release):** BrewPage caps ttl at 30 days and auto-deletes at expiry;
    each release sets ttl=30, so a release at least every 30 days keeps the link alive. NO cron
    renewal this round.
