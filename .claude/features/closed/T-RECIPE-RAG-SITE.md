---
id: T-RECIPE-RAG-SITE
title: RAG Guide -- build the real full site (all chapters, specced animations, EN + search, publish)
status: closed
priority: P1
owner: site-builder
created: 2026-06-13
updated: 2026-06-15
tags: [recipe, rag, site, build-out, interactive, publish, i18n]
links:
  - ../specs/T-RECIPE-RAG-GUIDE.md
  - ../specs/T-CONTENT-RAG-AUTHORING.md
  - EPIC-COOKBOOK-V1.md
  - EPIC-RAG-REVIEW-DEPLOY.md
---

## Context
Supersedes `T-RECIPE-RAG-PROMOTE` (split into the content task `T-CONTENT-RAG-AUTHORING` + this site
task). This is the build pass: turn the authored content + specs into the REAL, full RAG Guide site
on the locked Atlas shared lib. Supersedes the 3-section draft (`T-RECIPE-RAG-DRAFT`, closed).

**UNBLOCKED (2026-06-13):** dependency `T-CONTENT-RAG-AUTHORING` is CLOSED -- the real MD content
(11 RU manuscripts + payload-anatomy under `content/ru/`), the interactive/animation specs, and the
16 IE handoff briefs (`specs/T-CONTENT-RAG-AUTHORING.md`) all landed. This task is now READY to pick up.

GOAL: Build the REAL, full RAG Guide site on the locked Atlas shared lib (`base.css` + atlas theme +
components + lib init modules + page glue) from the authored content.

## Acceptance
- [x] Port all authored MD chapters into static HTML on the shared lib -- ALL planned chapters, not
      just the 3 draft sections.
- [x] Implement every specced interactive/animated element from the content briefs (IE): annotated
      JSON payload viewer, chunking-strategy comparison interactive, progressive-disclosure schemes,
      didactic algorithm animations (quicksort-style). Vanilla JS ES modules + inline SVG;
      transform/opacity only; IntersectionObserver + prefers-reduced-motion gating; full no-JS
      fallback; mobile 390/320px mandatory.
- [x] Client-side search over a small JSON index, working.
- [x] EN bilingual build-out (i18n) present -- wire the i18n lang store; EN content itself is
      tracked by `T-CONTENT-RAG-EN` (translation of the 12 RU chapters, done in this phase).
- [x] Carry over persisted per-chapter completion + back-to-map / next-step nav.
- [x] Mandatory cross-links on every page + README: https://brewpage.app +
      https://github.com/kochetkov-ma/brewpage-openapi.
- [x] Published to brewpage.app (release-engineer; direct REST bootstrap then `brewpage-action@v1.1.1`
      PUT via workflow; owner token via repo secret, masked; fits limits). LIVE at
      https://brewpage.app/public/FsOfbLP4df.
- [x] Released as a curated milestone -- unprefixed `v0.1.1` tag (commit `317a685`), first live publish.
- [x] All specced animations browser-verified: 0 console errors, mobile OK, reduced-motion OK.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-13: Created by splitting `T-RECIPE-RAG-PROMOTE` into two tasks. This is task 2 of 2: build
  the real full site from the authored content. SUPERSEDES T-RECIPE-RAG-PROMOTE. Blocked-by
  `T-CONTENT-RAG-AUTHORING`. Feeds EPIC-COOKBOOK-V1.
- 2026-06-13: UNBLOCKED -- `T-CONTENT-RAG-AUTHORING` closed (content + specs + IE briefs delivered).
  Dependency satisfied; this card is now ready/queued to pick up.
- Owners across build: site-builder + interactive-engineer + release-engineer (+ cookbook-author for
  content fixes).
- 2026-06-13: EN content is tracked by `T-CONTENT-RAG-EN` -- translate the 12 native-Cyrillic
  `content/ru/*.md` chapters to `content/en/*.md` during this site-build phase. This task only wires
  the i18n lang store to consume that EN locale.
- 2026-06-14: CLAIMED (R1) -- moved todo -> progress, owner site-builder (Manager-orchestrated
  multi-agent build). Scope of this build pass: turn the 4-page DRAFT into the real complete bilingual
  browser-verified site -- 8 net-new section pages + re-port 3 thin pages + net-new lib modules + EN
  translation + client-side search + full per-animation Playwright verification + 6-agent adversarial
  review + stage-for-publish.
- 2026-06-14: Site BUILT+VERIFIED+REVIEWED(0 blocker/0 major)+STAGED 2026-06-14. Bilingual RU/EN,
  12 pages on the shared lib + atlas theme, fits BrewPage limits (84 files / 1.25 MB / 129 KB largest).
  Per-animation Playwright verified V1-V11 across 12 pages; 6-agent adversarial review fix-looped to
  0 blocker / 0 major. EN locale delivered (closing T-CONTENT-RAG-EN, ships with this milestone).
  Publish + vX.Y.Z tag pending user authorization. Runbook:
  .claude/reports/20260614-120000_rag-site-verify/PUBLISH-RUNBOOK.md.
- 2026-06-14 (V7-BOARD): hardening pass `EPIC-RAG-SEO-VERSIONING` CLOSED on top of this staged site and
  the first curated milestone was TAGGED **`v0.1.0`** (unprefixed) at commit SHA **`68ddcab`**, pushed
  to origin. The site is now EN-primary bilingual (static EN default + RU `?lang=ru` toggle), fully
  SEO'd on all 12 pages, no-build version-stamped, and publish-scope filtered (`.brewpageignore`,
  84 files / 1.69 MB). Harness PASS 706 / FAIL 6 (accepted-minor RU no-JS interactive-host data
  fallbacks; 0 blocker / 0 major). This card STAYS IN PROGRESS: the two remaining acceptance items --
  the outward direct-REST **publish to brewpage.app** + owner-token provisioning, and shipping as the
  live curated milestone -- remain **PENDING USER AUTH**. `v0.1.0` is the milestone tag marker only;
  nothing is published live yet. Next step is the gated live publish when the user opens that gate.
- 2026-06-15: Publish GATE OPENED. The first live deploy round is now tracked by the new umbrella
  `EPIC-RAG-REVIEW-DEPLOY` (post-review + first live deploy via brewpage-action; 4 children claimed).
  This card STAYS IN PROGRESS and will be CLOSED as LIVE at the END of that round -- at close record
  the live brewpage.app URL + the `v0.1.1` tag + the publishing commit SHA in this `## Notes`.
- 2026-06-15: CLOSED (R2) -- DONE / LIVE. The RAG Guide is published live (first publish) under
  `EPIC-RAG-REVIEW-DEPLOY`.
  - **Live URL:** https://brewpage.app/public/FsOfbLP4df (stable id, PUT-updated; ttl 30, expires
    2026-07-15).
  - **Milestone tag:** `v0.1.1` (unprefixed, annotated) -> publishing commit `317a685`. Content SHA
    `e4bb5d7` (stamp). Other SHAs: review fixes `d99fbab`, publish infra `64173b5`, site descriptor
    `82b9586`.
  - Verified: publish run `27544416117` GREEN; GitHub Release `v0.1.1` with the live link; PUT kept
    the SAME id (update, not create); owner token only in repo secret `BREWPAGE_OWNER_TOKEN_RAG_GUIDE`
    (never leaked); harness 712/0; live renders EN-default + RU toggle, footer v0.1.1, SEO meta with
    real id, og:image 200, zero recipe-origin external requests.
  - **Link permanence (renew-on-release):** each release sets ttl=30 (BrewPage caps + auto-deletes at
    expiry); release at least every 30 days to keep the link alive. NO cron renewal this round.
