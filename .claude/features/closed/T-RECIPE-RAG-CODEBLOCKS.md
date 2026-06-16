---
id: T-RECIPE-RAG-CODEBLOCKS
title: Unified code-block system for the RAG Guide (syntax highlight + bilingual hover annotations)
status: closed
priority: P1
owner: interactive-engineer
created: 2026-06-14
updated: 2026-06-14
tags: [rag-guide, interactive, code, i18n, syntax-highlight]
links:
  - specs/T-CONTENT-RAG-AUTHORING.md
  - recipes/rag-guide/AtlasMD.md
---

## Context

The RAG Guide site (`recipes/rag-guide/`, tracked by `T-RECIPE-RAG-SITE`) ships ~29 code blocks across its
11 code-bearing pages, today as plain unstyled/preformatted text. This task adds a unified, hand-rolled
(ZERO-dependency) vanilla code-block system across the whole guide:

1. A hand-written vanilla **syntax highlighter** for `python`, `json`, `sql`, `bash`, `plaintext`, rendered
   in the Atlas dark-plate style (no third-party highlighter, no CDN dependency -- keeps the no-build,
   no-floating-version discipline).
2. A **hover/focus bilingual annotation popover layer** over line-range regions of a code block, so a reader
   can inspect what a span of lines does in either RU or EN.
3. A bilingual `{ru, en}` **line-aligned code model** so code comments + annotation copy + (where needed)
   the code variant itself switch with the active i18n language.

Rolled across all ~29 code blocks on the 11 code pages. The `payload-anatomy` page is special-cased: it gets
the **highlighter ONLY** and keeps its existing click-card drill-down interaction (the annotation popover
layer is NOT added there). This is a multi-agent collaborative build orchestrated by the Manager;
`interactive-engineer` is the lead build owner. Release stays **user-gated** -- no tag, no publish this task.

## Scope

In scope:
- Hand-rolled vanilla syntax highlighter (`python`/`json`/`sql`/`bash`/`plaintext`) in Atlas dark-plate style.
- Hover/focus bilingual annotation popover layer over line-range regions.
- Bilingual `{ru, en}` line-aligned code model (comments, annotation copy, line-aligned code variants).
- Roll-out across all ~29 code blocks on the 11 code pages.
- `payload-anatomy`: highlighter ONLY (retains its existing click-card drill).
- A small verification harness + config (Vcb extension) for the new code-block behaviour.

Out of scope:
- Any outward publish to brewpage.app (user-gated, belongs to `T-RECIPE-RAG-SITE`).
- Any `vX.Y.Z` milestone tag (user-gated).
- Recipe editorial-content rewrites beyond the line-aligned code variants + region annotation copy that
   `cookbook-author` delivers as a structured-text handoff.

## File-ownership map (verbatim -- parallel agents MUST NOT collide)

Paths under `recipes/rag-guide/shared/` unless noted. Owner -> work-package id.

| File(s) | Owner | Work package |
|---------|-------|--------------|
| `lib/code-highlight.js` | interactive-engineer | W1-HL |
| `lib/code-annot.js`, `lib/code-blocks.js` | interactive-engineer | W1-ANNOT |
| `css/themes/atlas.css`, `css/base.css` (code tokens + classes ONLY) | recipe-site-architect | W1-CSS |
| `content/en/*.md` + `content/ru/*.md` code comments; bilingual line-aligned code variants + region copy delivered as structured-text handoff | cookbook-author | W1-COPY-A/B/C (by page group) |
| `data/code-annot/*.js` + `{ru,en}` upgrade of `python` fields in existing `data/*.js` | interactive-engineer | W2-DATA |
| Group A pages what-rag / why-rag / production (`.html` + `sections/*.css` + `pages/*.js`) | site-builder | W3-A |
| Group B pages chunking / embedding / assemble-context | site-builder | W3-B |
| Group C pages search / vector-store / evaluation / generation / payload-anatomy (highlighter-only) | site-builder | W3-C |
| `harness.js` + `config.js` (Vcb extension) | interactive-engineer | W4-HARNESS |
| `.claude/features/**` board | task-tracker | (board only) |

Collision rule: a file appears under exactly ONE owner above. `css/base.css` and `css/themes/atlas.css` are
touched ONLY for code tokens + classes, ONLY by `recipe-site-architect` (W1-CSS) -- no other agent edits them
in this task. The page-group split (A/B/C) keeps `site-builder` page edits non-overlapping. `task-tracker`
writes ONLY inside `.claude/features/**`.

## Goal summary (verbatim)

Add a hand-rolled (zero-dependency) vanilla syntax highlighter (python/json/sql/bash/plaintext) in the Atlas
dark-plate style, a hover/focus bilingual annotation popover layer over line-range regions, and a bilingual
`{ru,en}` line-aligned code model, rolled across all ~29 code blocks on the 11 code pages, with payload-anatomy
getting the highlighter only (keeps its existing click-card drill). Release stays user-gated -- no tag, no publish.

## Acceptance

- [x] W1-HL: `lib/code-highlight.js` -- vanilla zero-dependency highlighter for python/json/sql/bash/plaintext, Atlas dark-plate style, `init(rootEl, config) => { destroy() }` contract.
- [x] W1-ANNOT: `lib/code-annot.js` + `lib/code-blocks.js` -- hover/focus bilingual annotation popover over line-range regions; orchestration module composing highlight + annotation.
- [x] W1-CSS: code tokens + classes added to `css/base.css` (structure/classes) + `css/themes/atlas.css` (token VALUES) ONLY; base.css holds no literal colors.
- [x] W1-COPY-A/B/C: bilingual `{ru,en}` line-aligned code variants + region annotation copy + code comments delivered as structured-text handoff, by page group.
- [x] W2-DATA: `data/code-annot/*.js` authored + `{ru,en}` upgrade of `python` fields in existing `data/*.js`.
- [x] W3-A/B/C: all ~29 code blocks across the 11 code pages wired to the new system; payload-anatomy gets highlighter only and keeps its click-card drill.
- [x] W4-HARNESS: `harness.js` + `config.js` extended (Vcb) to verify the new code-block behaviour.
- [x] Bilingual RU/EN verified; no-JS degradation + reduced-motion respected; fits BrewPage limits.
- [x] Release stays user-gated: NO tag, NO publish from this task.

## Notes

2026-06-14 -- W0-CLAIM: task minted + created directly in `progress/` (actively worked), `owner: interactive-engineer`
(lead build owner; multi-agent collaboration: recipe-site-architect, cookbook-author, site-builder, interactive-engineer;
board by task-tracker). Scope + verbatim file-ownership map recorded above so parallel agents never collide on a file.
Board updated in the same change (Progress row added; todo/progress/closed counts fixed; current focus repointed).
Release deliberately user-gated -- no `vX.Y.Z` tag, no publish.

2026-06-14 -- W7-BOARD / R2 CLOSE: task BUILT + VERIFIED + REVIEWED, fully green. Moved `progress/ -> closed/`,
`status: closed`, `updated: 2026-06-14`. Board reconciled (Progress->Closed row; counts progress 2->1, closed 10->11)
and `STATUS.md` code-block section updated to DONE/verified.

Outcome: hand-rolled ZERO-dependency vanilla syntax highlighter (python/json/sql/bash/plaintext) + bilingual
hover/focus annotation layer over line-range regions + bilingual `{ru,en}` line-aligned code model, rolled across
all code pages of the RAG Guide. `payload-anatomy` got highlighter-ONLY under its existing click-card drill (no
annotation popover added there, as specced).

Verification: harness code-block system 190/190 PASS (Vcb1-9 + Pcb1-4). 6-agent adversarial review + fix loop
closed 2 blockers (token-color class collision on what-rag/search; 100-file publish cap) + 2 majors (focus-ring
contrast 2.89 -> 6.47:1; section-CSS plate-token override) + 9 minors. Data files consolidated 16 -> 1 (folder now
89 publishable files). Zero external requests; WCAG AA token contrast on the plate; no-JS + reduced-motion
fallbacks; both ecosystem cross-links per page.

Release: NO tag / NO commit recorded -- release is user-gated; no `vX.Y.Z` tag and no publish were created by this
task. (Tag + SHA intentionally absent.)

Two out-of-scope findings surfaced during verification were filed as backlog follow-ups:
`BUG-INTERACTIVE-PROCESS-ANIM-REDUCED-MOTION` (pre-existing embedding process-anim V3 reduced-motion width bug)
and `T-CI-PUBLISH-SCOPE-FILTER` (publish-scope exclusion of dev-only files; blocks future live publish).
