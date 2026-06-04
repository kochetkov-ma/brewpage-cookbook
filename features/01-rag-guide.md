# Plan: RAG Guide (first recipe)

| Field | Value |
|---|---|
| Created | 2026-05-21 |
| Owner | cookbook maintainer (M. Kochetkov) |
| Status | PLAN |
| Recipe slug | `rag-guide` |
| Draft | `recipes/rag-guide.md` |

## Goal

Ship a long-form interactive walkthrough of retrieval-augmented generation as the first **BrewPage Cookbook** recipe. Use it as the production dogfood for `brewpage-action` (multi-file site publish).

## Why this first

- RAG is the highest-intent AI artifact topic developers actively search for.
- It is broad enough to exercise the whole interactivity toolkit (diagrams, mini-games, sandboxes, client-side search).
- It maps directly to the BrewPage growth angle ("host AI artifacts") documented in `brewpage-openapi/.claude/features/deep-research-report.md`.

## Audience

Developers and AI engineers who have shipped at least one LLM feature and want a hands-on, opinionated tour of RAG architecture, trade-offs and practical patterns. Not for absolute beginners; not for researchers.

## Scope (~15 pages)

1. What RAG actually is, and what it is not.
2. Anatomy of a retrieval pipeline (ingest, chunk, embed, store, retrieve, rerank, generate).
3. Choosing a vector store -- trade-offs, when not to use one.
4. Chunking strategies and how to evaluate them.
5. Embeddings 101: model selection, dimensionality, drift.
6. Retrieval at query time: top-K, reranking, hybrid search.
7. Prompt assembly and context window management.
8. Evaluation: golden sets, retrieval metrics, end-to-end scoring.
9. Failure modes and their fingerprints (hallucination, context stuffing, retrieval misses).
10. Caching and cost control.
11. Multi-tenant RAG and privacy.
12. Streaming and UX patterns.
13. Tooling landscape (a curated map, not a buyer's guide).
14. Production rollout checklist.
15. Where RAG is going next.

## Interactivity targets

- **C4 drill-down diagram** of a reference RAG architecture (system -> container -> component), as inline SVG driven by vanilla JS.
- **Mini-game**: "spot the retrieval bug" -- short snippets, choose what's wrong (vanilla JS).
- **Mini-game**: "tune the chunker" -- live chunking slider with quality score (vanilla JS).
- **Embedding visualiser**: 2D projection of a small corpus, hover to read documents (inline SVG + vanilla JS).
- **Client-side full-text search** across the whole guide (vanilla JS, no external indexer).

## Stack (for this recipe)

Plain static HTML + minimal vanilla JavaScript (ES modules) + one small hand-written CSS file. No framework, no bundler, no build step. C4 diagram and the embedding visualiser are inline SVG; search and mini-games are hand-written vanilla JS. Any third-party JS/CSS comes from a CDN pinned to an exact `X.Y.Z` version.

The recipe is a static folder published directly to BrewPage as a multi-file site, with no build output directory.

## Output

One live URL on `brewpage.app`. Subdomain strategy decision **before publish** (see open questions). Default to a namespace under `brewpage.app` first; lift to subdomain once the cookbook brand needs it.

## Milestones (rough)

| # | Milestone | Target |
|---|---|---|
| 1 | Outline locked, sources gathered, voice sample approved | Week 1 |
| 2 | Static scaffold + first 3 pages of static content | Week 2 |
| 3 | Reference architecture C4 + one mini-game working | Week 3 |
| 4 | All 15 pages drafted (rough) | Week 4 |
| 5 | All interactivity wired; client-side search live | Week 5 |
| 6 | Editorial pass + accessibility pass + cross-links + publish | Week 6 |

## Out of scope (first recipe)

- Fine-tuning -- mention only in comparison.
- Agentic patterns / tool use -- belongs in a separate future recipe.
- Provider-specific deep dives -- stay vendor-neutral.
- Self-hosted vs. managed embedding services tier-by-tier comparison -- separate recipe.

## Open questions

1. **Subdomain strategy**: `rag.brewpage.app` vs. `brewpage.app/cookbook/rag` vs. namespace `cookbook` on the default `brewpage.app`. Decide before publish; resolves the canonical URL.
2. **Citation format**: footnotes vs. inline hyperlinks vs. a dedicated `Sources` panel per page.
3. **Downloadable formats**: ship PDF/EPUB alongside the live URL? Defer to v2 if cost is non-trivial.
4. **Code execution sandboxes**: client-side only (StackBlitz / WebContainers) vs. server round-trip. Client-only preferred for cost and privacy.

## Definition of done

- All 15 chapters complete and editorially passed.
- Every interactive element works without console errors in latest Chrome, Firefox, Safari.
- Lighthouse: performance >= 90, accessibility >= 95.
- Client-side search returns hits in < 100ms on a 15-page corpus.
- Recipe published, URL pinned in `README.md` and the `recipes/` table.
- Cross-links to `brewpage.app` and `brewpage-openapi` present on every page.
- Recipe added to the `public` BrewPage namespace listing (or, if subdomain is chosen, to the homepage gallery via cookbook landing page).
