---
id: T-CONTENT-RAG-AUTHORING
title: RAG Guide -- author real chapter content (MD source) + interactive/animation specs
status: closed
priority: P1
owner: cookbook-author
created: 2026-06-13
updated: 2026-06-13
tags: [recipe, rag, content, editorial, specs, interactive]
links:
  - ../specs/T-RECIPE-RAG-GUIDE.md
  - ../specs/T-CONTENT-RAG-AUTHORING.md
  - EPIC-COOKBOOK-V1.md
---

## Context
Supersedes `T-RECIPE-RAG-PROMOTE` (split into this content task + the site task `T-RECIPE-RAG-SITE`).
This is the content + editorial-design pass that PRECEDES the site build: it produces MD manuscripts
plus interactive/animation SPECS and IE handoff briefs ONLY -- no implementation.

GOAL: Author the REAL editorial content for the RAG Guide as md-as-source files (strategy A) under
`recipes/rag-guide/content/ru/` (RU first, i18n-ready; EN deferred), covering all planned chapters,
AND spec every interactive/animated element the content needs. CA describes interactivity + writes
briefs; IE implements later in `T-RECIPE-RAG-SITE` -- do NOT blur the boundary.

Honor the locked AtlasMD design system (`recipes/rag-guide/AtlasMD.md`), `.claude/rules/site-architecture.md`
(md-as-source, data contracts), `.claude/rules/privacy.md` (no platform abuse-defence internals), and
the concept-design preferences (real IT abstractions, no workshop metaphors, no decorative/mascot dot).

Editorial plan (source of truth): `../specs/T-RECIPE-RAG-GUIDE.md`. Interactive/animation specs + IE
handoff briefs: `../specs/T-CONTENT-RAG-AUTHORING.md` (this task scaffolds it; CA fills it later).

## Acceptance
- [x] Per-chapter MD manuscript for the full guide (all planned chapters/stops) under `content/ru/`,
      each meeting recipe DoD: problem-first; real working runnable code (no unlabelled pseudocode);
      >=1 interactive element; every technical claim cited to a primary source; "try it yourself" /
      next-steps close; ASCII punctuation only.
- [x] Annotated JSON payload showcases: real request/response examples rendered cleanly --
      syntax-highlighted JSON with FUNCTIONAL BLOCKS and DOMAIN annotations (what each block/field is
      responsible for). Illustrative genre: an LLM API call with its many fields (messages,
      reasoning/thinking blocks, tool calls, etc.) -- annotate what each field does. Spec the reveal
      interaction (hover/expand a block -> what it means).
- [x] Chunking-strategies catalog WITH RATINGS: enumerate ALL chunking approaches, each rated on
      COMPLEXITY and COST (compute/token/time), honest tradeoffs + when-to-use. Include LLM-based /
      semantic chunking (conceptually simple since the model does the work, but high token+time cost)
      and algorithmic chunking (fixed-size, sliding-window, recursive, sentence/structure-based) --
      for the algorithmic ones DESCRIBE THE ALGORITHM (steps).
- [x] Interactive schemes with PROGRESSIVE DISCLOSURE of complexity (drill/expand step by step), and
      DIDACTIC algorithm animations that explain the MECHANISM (canonical: quicksort animated showing
      how it traverses/partitions the array; same didactic treatment for chunking algos, kNN/ANN
      search, embedding). Animation TEACHES the mechanism (no decorative/mascot moving dot),
      transform/opacity only, reduced-motion snaps to end state, restrained/adult, mobile mandatory
      (390 + 320px).
- [x] For each interactive/animated element, an IE HANDOFF BRIEF: host selector + data shape + exactly
      what the animation must show + reduced-motion end-state + mobile behavior. Captured in
      `../specs/T-CONTENT-RAG-AUTHORING.md`.
- [x] All specs consistent with AtlasMD + `.claude/rules/site-architecture.md` + privacy rule +
      concept-design preferences. NO implementation in this task.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-13: CLAIMED (R1 bookend) -- moved todo -> progress, owner `cookbook-author`. Content + spec authoring underway.
- 2026-06-13: CLOSED (R2 bookend). Delivered: 11 canonical-slug RU manuscripts + payload-anatomy under
  `recipes/rag-guide/content/ru/` (start, what-rag, why-rag, search, chunking, embedding, vector-store,
  assemble-context, generation, evaluation, production, payload-anatomy; old numbered files 00/01/02
  renamed/deleted); `specs/T-CONTENT-RAG-AUTHORING.md` fully filled (Scope, chapter manuscript map,
  annotated JSON payload showcases, chunking catalog with complexity+cost, interactive schemes, didactic
  algorithm animations, 16 IE handoff briefs, cross-references, 68-term glossary, IE feasibility review:
  11 buildable / 5 needs-reduction / 0 infeasible); `specs/T-RECIPE-RAG-GUIDE.md` Scope reconciled
  15 -> 11 chapters. Verified: 0 non-ASCII, both ecosystem cross-links in every chapter, no stale model
  ids, no shared/data edits (deferred to T-RECIPE-RAG-SITE).
- No release tag (content-only milestone, nothing published to brewpage.app; md+specs only). Site wiring
  + publish deferred to `T-RECIPE-RAG-SITE`.
- 2026-06-13: Created by splitting `T-RECIPE-RAG-PROMOTE` into two tasks. This is task 1 of 2:
  author real content (MD) + interactive/animation specs. Site build is `T-RECIPE-RAG-SITE`
  (task 2), which is blocked-by this task. SUPERSEDES T-RECIPE-RAG-PROMOTE. Feeds EPIC-COOKBOOK-V1.
- Reopened 2026-06-13: convert all 12 manuscripts from latin-transliteration to natural native Cyrillic Russian (user requirement: normal language, matches nav.json which ships Cyrillic) + run completeness validation pass (chunking complexity coverage, embedding algorithms, accessibility). EN translation deferred to a separate task at site-build phase.
- 2026-06-13: RECLOSED (R2 bookend) after the Cyrillic rework + completeness validation pass. Delivered:
  - All 12 manuscripts converted from latin-transliteration to natural native Cyrillic Russian (verified: 0 residual translit in prose, 0 non-ASCII punctuation).
  - Sign-off headings standardized to full Cyrillic across all 12: `## Источники` / `## Попробуйте сами` / `## Что дальше` / `## Об этом рецепте`.
  - Completeness expansions: chunking catalog grew 5 -> 9 strategies (added token-vs-char note, markdown-header, parent-document/hierarchical, late chunking arXiv:2409.04701, contextual retrieval) + structure-aware code; embedding gained normalization, distance metrics, hybrid sparse+dense/BM25, Matryoshka, asymmetric query/doc, multilingual, quantization.
  - vector-store H1 fixed to Cyrillic; payload-anatomy table header Cyrillic; spec `T-CONTENT-RAG-AUTHORING.md` updated (sign-off block, catalog 9 rows, embedding-coverage note, +15 glossary terms).
  - 4 independent audits passed (chunking, embedding, language/accessibility, DoD); both ecosystem cross-links present in every chapter; model id `claude-sonnet-4-5` consistent.
  - EN translation tracked separately as `T-CONTENT-RAG-EN` (deferred to site phase).
  - No release tag (content-only; nothing published). EN deferred to `T-CONTENT-RAG-EN`.
