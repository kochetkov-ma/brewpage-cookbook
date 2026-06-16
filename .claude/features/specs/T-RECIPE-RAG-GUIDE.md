<!-- Per-task content plan. Ongoing content edits owned by the cookbook-author agent. -->
# Plan: RAG Guide (first recipe)

| Field | Value |
|---|---|
| Created | 2026-05-21 |
| Owner | cookbook maintainer (M. Kochetkov) |
| Status | PLAN |
| Recipe slug | `rag-guide` |
| Draft | `recipes/rag-guide.md` |
| Task | T-RECIPE-RAG-GUIDE |

## Goal

Ship a long-form interactive walkthrough of retrieval-augmented generation as the first **BrewPage Cookbook** recipe. Use it as the production dogfood for `brewpage-action` (multi-file site publish).

## Why this first

- RAG is the highest-intent AI artifact topic developers actively search for.
- It is broad enough to exercise the whole interactivity toolkit (diagrams, mini-games, sandboxes, client-side search).
- It maps directly to the BrewPage growth angle ("host AI artifacts") documented in `brewpage-openapi/.claude/features/deep-research-report.md`.

## Audience

Developers and AI engineers who have shipped at least one LLM feature and want a hands-on, opinionated tour of RAG architecture, trade-offs and practical patterns. Not for absolute beginners; not for researchers.

## Scope (11 canonical chapters)

**Canonical chapter set = the 11 locked stops in `recipes/rag-guide/shared/data/nav.json`** (the landing-map route order, 0% .. 100%):

`start, what-rag, why-rag, search, chunking, embedding, vector-store, assemble-context, generation, evaluation, production`

`nav.json` is the source of truth; add NO new pins. The older 15-topic list below folds INTO these 11 as sub-sections (`<h2>`s inside a chapter). The detailed per-chapter manuscript map (h2 lists, intent, interactive element, sources, owning task) lives in `.claude/features/specs/T-CONTENT-RAG-AUTHORING.md`.

### 15-topic -> 11-chapter fold map

| Old topic (15-list) | Folds into canonical chapter |
|---|---|
| 1. What RAG is / is not | **what-rag** |
| 2. Anatomy of a retrieval pipeline | split across the route: overview in **what-rag**; the named stages are the chapters chunking / embedding / vector-store / search / assemble-context / generation |
| 3. Choosing a vector store; when not to | **vector-store** (sub-section) |
| 4. Chunking strategies + evaluation | **chunking** (the strategies catalog) |
| 5. Embeddings 101 (model, dim, drift) | **embedding** |
| 6. Retrieval at query time (top-K, rerank, hybrid) | **search** + **vector-store** (kNN/ANN, top-k, filters) |
| 7. Prompt assembly + context window mgmt | **assemble-context** |
| 8. Evaluation (golden sets, metrics, e2e) | **evaluation** |
| 9. Failure modes (hallucination, stuffing, misses) | split: grounding/hallucination -> **generation**; retrieval misses / context overflow -> **evaluation** + **assemble-context** |
| 10. Caching and cost control | **production** (cost/latency sub-section) |
| 11. Multi-tenant RAG + privacy | **production** (security/access sub-section) |
| 12. Streaming and UX patterns | **generation** (output/UX sub-section) |
| 13. Tooling landscape (curated map) | folded as inline named-tool references across chapters (no standalone chapter) |
| 14. Production rollout checklist | **production** |
| 15. Where RAG is going next | **production** (Next steps sign-off) |

Plus one non-route showcase asset, **payload-anatomy** (annotated JSON payload), authored alongside the chapters but NOT a map pin.

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
| 4 | All 11 chapters drafted (rough) | Week 4 |
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

- All 11 chapters complete and editorially passed.
- Every interactive element works without console errors in latest Chrome, Firefox, Safari.
- Lighthouse: performance >= 90, accessibility >= 95.
- Client-side search returns hits in < 100ms on the 11-chapter corpus.
- Recipe published, URL pinned in `README.md` and the `recipes/` table.
- Cross-links to `brewpage.app` and `brewpage-openapi` present on every page.
- Recipe added to the `public` BrewPage namespace listing (or, if subdomain is chosen, to the homepage gallery via cookbook landing page).
