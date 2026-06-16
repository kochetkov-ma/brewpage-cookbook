---
id: T-CONTENT-RAG-AUTHORING
title: RAG Guide -- content + interactive/animation design spec (IE handoff briefs)
status: spec
owner: cookbook-author
created: 2026-06-13
updated: 2026-06-13
spec-consolidated: 2026-06-13
tags: [spec, rag, content, interactive, animation, handoff]
links:
  - ../todo/T-CONTENT-RAG-AUTHORING.md
  - ./T-RECIPE-RAG-GUIDE.md
---

> STUB. Scaffolded by task-tracker; CA fills the editorial + design content. Holds the per-element
> interactive/animation specs and the IE handoff briefs for `T-RECIPE-RAG-SITE`. Honor AtlasMD,
> `.claude/rules/site-architecture.md`, `.claude/rules/privacy.md`, and concept-design preferences.

## As-built status

site BUILT + per-animation VERIFIED + 6-agent REVIEWED (0 blocker / 0 major) + STAGED 2026-06-14. Publish-set
(recipes/rag-guide minus content/, mokups/, .claude/, *.md, *.py): 84 files / 1,311,874 bytes (1.251 MB) /
largest shared/data/search-index.json 132,286 bytes (129.2 KB) -- under BrewPage limits (100 files / 20 MB /
5 MB per file). Publish to brewpage.app + unprefixed vX.Y.Z tag are PENDING USER AUTHORIZATION (publishing is
public and consumes a non-recoverable owner token). Runbook:
`.claude/reports/20260614-120000_rag-site-verify/PUBLISH-RUNBOOK.md`. Board close (tag + SHA) is owned by
task-tracker, not this spec.

## Scope

Editorial manuscript for the RAG Guide: **11 canonical chapters** (the locked stops in `recipes/rag-guide/shared/data/nav.json`, in route order) + **1 non-route showcase** (`payload-anatomy.md`). RU only now (EN deferred, i18n-ready: prose ports to static HTML carrying `data-ru`/`data-en` hooks per AtlasMD section 1.10; the manuscript single-source is `content/ru/*.md`, strategy A in `.claude/rules/site-architecture.md` section 6).

**Locked canonical set (do NOT add pins):**

`start, what-rag, why-rag, search, chunking, embedding, vector-store, assemble-context, generation, evaluation, production`

The old 15-topic scope folds into these 11 as `<h2>` sub-sections; mapping table is in `.claude/features/specs/T-RECIPE-RAG-GUIDE.md`.

### Hard constraints (apply to every chapter)

- **Real IT abstractions, no metaphor frames** (concept-design memory + AtlasMD 1.2): nodes are "Embedding zaprosa", "Indeks", "Top-k", never "the embedding outpost". The atlas VISUAL skin stays; semantics are honest RAG engineering (dim 1536, cosine 0..1, kNN/ANN, top-k, real chunk text, real prompt template, token budget, citations, grounding, hallucination).
- **Drill = semantic zoom** (the favourite interaction): every interactive element drills via the C4-style camera zoom INTO the scene (`drilldown-zoom.js`), not modals-as-default. Query path always drawn explicitly. No mascot/traveling dot anywhere (animation directive 2026-06-13).
- **Didactic animation only**: motion teaches a mechanism (text -> tokens -> vector materializes; points settle by cosine; spine draws once). transform/opacity only (+ gated one-shot stroke-dashoffset / width); reduced-motion snaps to end over the same DOM; IO-gated. Green is EARNED progress / static near-top-k accent only.
- **Cite every technical claim inline** to a PRIMARY source (paper / RFC / vendor doc). Per-chapter `## Sources` block. ASCII punctuation only, even inside Russian.
- **Privacy** (`.claude/rules/privacy.md`): never disclose BrewPage abuse-defence / content-analysis internals at any level. RAG content here is generic and vendor-neutral; no platform internals.
- **No-JS degradation**: each chapter's interactive host ships a meaningful static schematic + full prose in `.no-js-only`; JS only enhances.

### Standard chapter sign-off block (every chapter ends with these four, in order)

Every `content/ru/<slug>.md` chapter closes with the same four blocks (FULL CYRILLIC headings; EN deferred). The sign-off headings are the literal Cyrillic strings below -- earlier ASCII-transliterated forms (`## Sources / ## Poprobujte sami / ## Dal'she / ## About this recipe`) are SUPERSEDED:

1. `## Источники` (Sources) -- the chapter's primary references as inline-linkable list (papers, RFCs, vendor docs). Every inline citation in the body also appears here. Stable links (arXiv abstract / DOI / versioned vendor doc).
2. `## Попробуйте сами` (Try it yourself) -- 2-3 concrete actions on THIS chapter's interactive element (e.g. drill to a specific node, run the animation step, compare two strategies), each tying back to a named data field or node.
3. `## Что дальше` (Next steps) -- one-line forward pointer to the next route chapter (and, where useful, the showcase). Follows the `nav.json` route order.
4. `## Об этом рецепте` (About this recipe) -- the mandatory cross-link footer. MUST carry BOTH:
   - `https://brewpage.app`
   - `https://github.com/kochetkov-ma/brewpage-openapi`
   A chapter missing either link is NOT done (AtlasMD do-not #16; `.claude/rules/content.md`).

## Chapter manuscript map

Per chapter: canonical slug + file path, `<h2>` list (folding the 15-topic items), 1-line intent, the >=1 named didactic interactive element, primary sources, owning authoring task. Reusable existing prose noted where present. All 11 carry the standard 4-block sign-off above.

> Existing reusable prose to ALIGN (rename done by the authoring tasks, NOT here): `content/ru/00-landing.md` -> **start**; `content/ru/01-chunking.md` -> **chunking**; `content/ru/02-embedding.md` -> **embedding**. Plan only; do not rename files in this task.

### 1. start -- `content/ru/start.md`

- **Owning task:** CT-CH-INTRO
- **Reuses:** `content/ru/00-landing.md` (problem-first opener + 4-step pipeline map + sources already drafted)
- **Intent:** The trailhead. State the concrete problem (LLM + your docs -> confident hallucination) and lay the whole RAG route out as plain steps; no prior knowledge needed.
- **h2s:** `Problema, s kotoroj vy prishli`; `Chto vy poluchite v konce puti`; `Kak chitat' etu kartu` (route 0% -> 100%, every stop opens on its own); `Marshrut: 11 ostanovok` (the route as the ordered chapter list).
- **Interactive (>=1):** the **Atlas MAP landing** itself (`map-route.js`): rust route + sampled flag pins + single-open field note + earned map progress strip. Reader picks a stop to open its field note in place. (This IS the landing page; chapter prose ports into the field-note blurbs/pts already seeded in `nav.json`.)
- **Primary sources:** Lewis et al., 2020, Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (arxiv.org/abs/2005.11401).

### 2. what-rag -- `content/ru/what-rag.html` (page) / manuscript `content/ru/what-rag.md`

- **Owning task:** CT-CH-INTRO
- **Intent:** Define RAG honestly (Retrieval-Augmented Generation = retrieve, augment, generate) and what it is NOT (not fine-tuning, not memory); give the runnable mental model of the 4+ stage pipeline.
- **h2s:** `Chto takoe RAG` (the three words); `Chego RAG ne delaet` (not is-not: not retraining, not a bigger context window alone); `Anatomiya konvejera` (the named stages overview -> the route chapters); `Retrieval -> Augmented -> Generation na primere`.
- **Folds:** 15-topic #1 (what is/is not) + #2 overview (anatomy of the pipeline).
- **Interactive (>=1):** **pipeline-flow zoom** (`pipeline.js` + `drilldown-zoom.js`): left-to-right 7 stage node-cards, one-time spine draw-in, each node drills (semantic zoom) into a stage panel; earned progress over the main path `order`. (As-built `what-rag.html`.)
- **Primary sources:** Lewis et al., 2020 (arxiv.org/abs/2005.11401); for "not fine-tuning" contrast cite the RAG paper's framing + a vendor RAG-vs-finetune doc (name: OpenAI / cloud vendor RAG guide, vendor-neutral).

### 3. why-rag -- `content/ru/why-rag.html` (page) / manuscript `content/ru/why-rag.md`

- **Owning task:** CT-CH-INTRO
- **Intent:** Why you need RAG: a plain model does not know your data and goes stale; RAG injects fresh, private, citable sources at answer time, cheaper than retraining.
- **h2s:** `Pochemu obychnaya model ne spravlyaetsya` (training cutoff, no private data); `Svezhie i privatnye dannye bez pereobucheniya`; `Men'she vydumannyh faktov: grounding + citaty`; `Stoimost': RAG protiv doobucheniya`.
- **Folds:** part of #2 (the value case) + grounding/hallucination motivation (links forward to generation).
- **Interactive (>=1):** **two-track request trace bez/s RAG** (`comparison.js`): Track A (bez RAG -> stale/hallucinated answer) vs Track B (s RAG -> retrieval populates the context box BEFORE the grounded green answer); main path = Track B; some nodes drill into the modal camera. The grounded answer is never painted before retrieval completes.
- **Primary sources:** Lewis et al., 2020 (arxiv.org/abs/2005.11401); Liu et al., 2023, Lost in the Middle (arxiv.org/abs/2307.03172) for the context-use motivation; training-cutoff/hallucination claim -> a primary model-card / vendor doc (named, vendor-neutral).

### 4. chunking -- `content/ru/chunking.md`

- **Owning task:** CT-CHUNKING-CATALOG
- **Reuses:** `content/ru/01-chunking.md` (problem, Splitter/Overlap/Metadata anatomy, strategies, worked-example link, sources -- substantially drafted)
- **Intent:** Cut big documents into retrieval-size chunks; the question is WHERE to cut and HOW big -- a measured trade-off, not a constant.
- **h2s:** `Problema` (cannot feed the whole doc; lost-in-the-middle); `Iz chego sostoit chunking` (Splitter / Overlap / Metadata; token-vs-character sizing); `Strategii reza` (the 9-strategy catalog -- original 5 fixed-size/sliding/recursive/structure/semantic + markdown-header/parent-document/late-chunking/contextual-retrieval -- with complexity + cost ratings; fills the "Chunking-strategies catalog" section below); `Razmer i overlap: kompromiss`; `Svyaz' s zhivym primerom`. Intro copy frames the catalog as didactic animations for the CORE algorithms (not "for each" strategy).
- **Folds:** 15-topic #4 (chunking strategies + evaluation).
- **Interactive (>=1):** **chunking-strategy drill-down** (semantic zoom into Splitter -> per-strategy component nodes, each with summary + complexity/cost rating; core strategies carry a cut animation, newer ones a static schematic). Reader compares strategies by drilling. (Companion: the WorkedExample timeline showing doc -> chunks on real text.)
- **Primary sources:** Liu et al., 2023, Lost in the Middle (arxiv.org/abs/2307.03172); LangChain RecursiveCharacterTextSplitter (python.langchain.com/docs/how_to/recursive_text_splitter/); Pinecone chunking strategies (pinecone.io/learn/chunking-strategies/).

### 5. embedding -- `content/ru/embedding.md`

- **Owning task:** CT-CH-RETRIEVAL
- **Reuses:** `content/ru/02-embedding.md` (problem, what-a-vector, cosine = meaning, worked-example link, sources -- substantially drafted)
- **Intent:** Turn each chunk into a fixed-length numeric vector whose proximity encodes meaning; choosing the embedding model drives search quality.
- **h2s:** `Problema` (keyword match fails; need search by meaning); `Chto takoe vektor zdes'` (fixed-length `dim`, e.g. 1536); `Pochemu blizost' vektorov = blizost' smysla` (cosine similarity); `Vybor modeli, razmernost', drift`; `Svyaz' s zhivym primerom` (chunk -> vector one-to-one).
- **Folds:** 15-topic #5 (embeddings 101: model selection, dimensionality, drift).
- **Interactive (>=1):** **embedding-materialize animation** (didactic, on drill-into the Embedding node): source text -> splits into tokens -> the vector numbers settle in (dim 1536). transform/opacity only; reduced-motion snaps to end. (Per concept-design 2026-06-13: this exact mechanism is a named favourite.)
- **Primary sources:** OpenAI Embeddings guide -- text-embedding-3-small, dim 1536, cosine (platform.openai.com/docs/guides/embeddings); Reimers & Gurevych, 2019, Sentence-BERT (arxiv.org/abs/1908.10084).

> **Embedding coverage (as expanded in `content/ru/embedding.md`).** Beyond the four h2s above, embedding.md now also teaches, each cited inline to a primary source:
> - **L2 normalization** -- normalizing vectors to unit length so cosine similarity == dot product (the two ranking-identical after normalization); why most embedding APIs return normalized vectors.
> - **Distance metrics** -- dot product vs Euclidean (L2) distance vs cosine, and when each is the right index metric (cosine/dot for normalized embeddings, L2 for raw).
> - **Hybrid sparse + dense / BM25** -- combining lexical sparse retrieval (BM25) with dense embeddings; cite Robertson & Zaragoza, 2009, The Probabilistic Relevance Framework: BM25 and Beyond (DOI 10.1561/1500000019). (Cross-links to search hybrid-search.)
> - **Matryoshka / dimension truncation** -- training that lets you truncate the embedding to fewer dimensions with graceful quality loss, trading recall for storage/speed; cite Kusupati et al., 2022, Matryoshka Representation Learning (arXiv:2205.13147).
> - **Asymmetric query/doc embeddings** -- separate query vs passage encodings / prefixes (the E5 family); cite Wang et al., 2022, Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5, arXiv:2212.03533).
> - **Multilingual embeddings** -- one shared space across languages so a query in one language retrieves chunks in another; cite Reimers & Gurevych, 2020, Making Monolingual Sentence Embeddings Multilingual using Knowledge Distillation (arXiv:2004.09813).
> - **Quantization pointer** -- a forward pointer that vector storage can quantize embeddings (e.g. scalar/binary) to cut footprint; the depth lives in vector-store (storage), this is the pointer only.
>
> New glossary terms introduced here: `l2-normalization`, `dot-product`, `euclidean-distance`, `bm25`, `hybrid-retrieval`, `matryoshka`, `asymmetric-embedding`, `multilingual-embedding`, `quantization` (see Glossary section).

### 6. vector-store -- `content/ru/vector-store.md`

- **Owning task:** CT-CH-RETRIEVAL
- **Intent:** Store vectors in a specialised index and find the nearest-in-meaning fast; ANN over the whole archive, with metadata filters. When NOT to use one.
- **h2s:** `Zachem otdel'naya baza` (store + nearest-neighbour search); `Priblizhennyj poisk blizhajshih sosedej (ANN)` (HNSW); `Top-k i metadata-fil'try`; `Masshtab: milliony chunkov bez perebora`; `Kogda vektornaya baza ne nuzhna` (small corpus / exact match -- the "when not to" sub-section).
- **Folds:** 15-topic #3 (choosing a vector store, when not to) + part of #6 (top-K, filters).
- **Interactive (>=1):** **ANN/top-k drill** -- reuse the semantic-zoom drill over a small index schematic (query vector -> nearest neighbours -> top-k); query path drawn explicitly. (Static no-JS: labelled kNN list.)
- **Primary sources:** Malkov & Yashunin, 2016, Efficient and robust ANN search using HNSW graphs (arxiv.org/abs/1603.09320); a primary vector-DB vendor doc for metadata filtering (named, vendor-neutral, e.g. Pinecone/pgvector docs).

### 7. search -- `content/ru/search.html` (page) / manuscript `content/ru/search.md`

- **Owning task:** CT-CH-RETRIEVAL
- **Intent:** Query-time retrieval: turn the user query into a vector, find the nearest chunks by meaning (not exact words), return top-k; reranking + hybrid as refinements.
- **h2s:** `Poisk po smyslu, ne po slovam` (the keyword-miss case); `Zapros -> vektor zaprosa`; `Top-k blizhajshih po cosine`; `Reranking i gibridnyj poisk` (folds #6 rerank/hybrid); `Chto vidit model'` (only the top-k pieces).
- **Folds:** 15-topic #6 (retrieval at query time: top-K, reranking, hybrid).
- **Interactive (>=1):** **2D vector-space map** (`vector-map.js`): query point + chunk points settle BY cosine proximity, cosine rings, kNN top-k links drawn explicitly; EVERY point drillable (far points open a "why not top-k" panel); keyword-miss callout. (As-built `search.html`; the points-settle-by-cosine animation is the didactic motion.)
- **Primary sources:** OpenAI Embeddings guide -- cosine (platform.openai.com/docs/guides/embeddings); Malkov & Yashunin, 2016 (arxiv.org/abs/1603.09320); for reranking name a primary cross-encoder source (Reimers & Gurevych, 2019, arxiv.org/abs/1908.10084, cross-encoder framing) and/or a primary reranker model card.

### 8. assemble-context -- `content/ru/assemble-context.md`

- **Owning task:** CT-CH-GENOPS
- **Intent:** Pack the retrieved pieces into one prompt; how you assemble context (template, budget, order, dedup) shapes the answer.
- **h2s:** `Shablon prompta` (instruction + question + found pieces); `Skol'ko konteksta vlezaet` (token budget / model length limit); `Poryadok i prioritet kuskov` (most important first -- lost-in-the-middle mitigation); `Chistim dubli i obrezaem lishnee`.
- **Folds:** 15-topic #7 (prompt assembly + context-window management) + part of #9 (context stuffing / overflow).
- **Interactive (>=1):** **context-assembly drill / token-budget readout** -- semantic zoom into the assemble node showing the prompt template filling with ranked chunks against a token budget; over-budget pieces visibly trimmed. (Static no-JS: the finished prompt block with labelled parts.)
- **Primary sources:** Liu et al., 2023, Lost in the Middle (arxiv.org/abs/2307.03172) for order/priority; Lewis et al., 2020 (arxiv.org/abs/2005.11401) for the augment step; a primary model-doc for the context-length limit (named, vendor-neutral).

### 9. generation -- `content/ru/generation.md`

- **Owning task:** CT-CH-GENOPS
- **Intent:** The model reads the assembled context and writes a grounded answer; steer it with instructions (answer only from context, cite sources, admit when data is missing).
- **h2s:** `Instrukcii: otvechaj tol'ko po kontekstu`; `Citirovanie istochnikov v otvete`; `Bor'ba s vydumkami (grounding/hallucination)` (folds #9 hallucination); `Ton, format i streaming` (folds #12 streaming + UX patterns).
- **Folds:** 15-topic #9 (hallucination) + #12 (streaming / UX).
- **Interactive (>=1):** **grounded-answer reveal** -- didactic: the answer is built FROM the cited context pieces (each answer claim links back to its chunk); the grounded green answer appears only as grounding completes, never pre-painted. No-context case shows the honest "etogo net v dokumentah" fallback.
- **Primary sources:** Lewis et al., 2020 (arxiv.org/abs/2005.11401) for grounding; a primary source on hallucination/grounding (named survey or model card, vendor-neutral); a primary streaming API doc for the streaming/UX sub-section (named, vendor-neutral).

### 10. evaluation -- `content/ru/evaluation.md`

- **Owning task:** CT-CH-GENOPS
- **Intent:** Measure retrieval and answer quality systematically; without measurement you cannot tell if a change helped.
- **h2s:** `Tochnost' poiska` (did the needed chunks come back -- recall/precision@k); `Kachestvo otveta` (correct, complete, on point); `Zolotoj nabor voprosov` (golden set, before/after runs); `Obratnaya svyaz' -> metriki`; `Tipichnye otkazy i ih sledy` (retrieval misses, context overflow -- folds #9 fingerprints).
- **Folds:** 15-topic #8 (evaluation: golden sets, retrieval metrics, e2e) + part of #9 (failure fingerprints).
- **Interactive (>=1):** **eval drill / metric calculator** -- a small calculator over a golden-set sample: plug top-k and see recall/precision@k change; before/after comparison on the same question set. (Static no-JS: a worked golden-set table.)
- **Primary sources:** primary IR-metrics source for precision/recall@k (named standard / textbook reference -- e.g. Manning et al., Introduction to Information Retrieval, nlp.stanford.edu/IR-book/); a primary RAG-eval paper or framework doc (named, e.g. RAGAS paper / arXiv).

### 11. production -- `content/ru/production.md`

- **Owning task:** CT-CH-GENOPS
- **Intent:** The summit. Wire all links into a working service for real users and keep it healthy: latency, cost, monitoring, security/access, refresh, steady improvement.
- **h2s:** `Skorost' i stoimost' zaprosa` (folds #10 caching + cost control); `Monitoring i obnovlenie dannyh`; `Bezopasnost' i dostup` (folds #11 multi-tenant RAG + privacy -- generic, no platform internals); `Checklist vyvoda v prod` (folds #14 rollout checklist); `Kuda dvizhetsya RAG` (folds #15 -- doubles as the Next steps pointer).
- **Folds:** 15-topic #10 (caching/cost) + #11 (multi-tenant/privacy) + #14 (rollout checklist) + #15 (where RAG is going).
- **Interactive (>=1):** **production checklist / cost-latency calculator** -- an interactive rollout checklist (earned-progress styled) and/or a per-request cost+latency calculator the reader plugs their own numbers into. (Static no-JS: the full checklist as a prose list.)
- **Primary sources:** primary vendor docs for cost/latency model + caching (named, vendor-neutral); for multi-tenant/privacy cite a primary vector-DB access-control doc (named) -- NEVER any BrewPage platform internals.

### 12. payload-anatomy (showcase, NOT a route pin) -- `content/ru/payload-anatomy.md`

- **Owning task:** CT-JSON-PAYLOAD
- **Intent:** A standalone annotated-JSON showcase: one real RAG request/response payload (chunk + vector + metadata + retrieval result + assembled prompt), every field annotated, so the reader sees the data flowing end-to-end. Reinforces all chapters with one concrete artifact.
- **h2s:** `Odin payload skvoz' ves' konvejer`; `Chunk + metadata` (fromChar/toChar, source, section, date); `Vektor` (dim, values stub vs real); `Retrieval-rezul'tat` (top-k, cosine, rank); `Sobrannyj prompt`.
- **Interactive (>=1):** **annotated-payload drill** -- the JSON payload with hover/drill annotations on each field group (semantic zoom into a field cluster reveals what it does + which chapter it belongs to). Fills the "Annotated JSON payload showcases" section below.
- **Primary sources:** OpenAI Embeddings guide for the vector shape (platform.openai.com/docs/guides/embeddings); Lewis et al., 2020 (arxiv.org/abs/2005.11401) for the retrieve+augment payload framing.

## Annotated JSON payload showcases

Source chapter: `content/ru/payload-anatomy.md` (#12, non-route showcase). One real RAG exchange in **Anthropic Messages API** shape, 4 turns: (1) request = question + `search_docs` tool description; (2) response = `thinking` + `tool_use` (`stop_reason: tool_use`); (3) request with `tool_result` carrying retrieved chunks; (4) final grounded `text` answer (`stop_reason: end_turn`). The chapter's block map is a greppable table -- every functional block annotated twice: technical Function + RAG domain role, each row carrying a chapter back-link. 17 rows:

| Block | Field(s) | Function | RAG domain role |
|-------|----------|----------|-----------------|
| model | `model` | Which model to call | Generator choice (Generation); drives length limit + cost |
| budget | `max_tokens` | Answer length ceiling | Cost/latency control of Generation |
| thinking-config | `thinking.type`, `thinking.budget_tokens` | Enable extended reasoning + its budget | Reasoning budget for retrieve/generation |
| system | `system` | System instruction | Grounding: answer-only-from-context + cite source (generation.md) |
| tools | `tools[].name`, `description`, `input_schema` | Declare available tools | Retrieve step declared as a callable function (Lewis et al., 2020) |
| tool-choice | `tool_choice.type` | Allow/force tool call | Control whether retrieve runs |
| messages-user | `messages[].role=user`, `content` | User turn | Question = pipeline input |
| messages-assistant | `messages[].role=assistant`, `content[]` | Model turn in history | Saved reasoning + search request for dialog continuation |
| response-id | `id`, `type`, `role`, `model` | Response message id/type | Turn binding; request tracing |
| thinking-block | `content[].type=thinking`, `thinking`, `signature` | Visible model reasoning | Retrieve-stage plan, not final answer |
| tool-use | `content[].type=tool_use`, `id`, `name`, `input` | Model asks to call a tool | Retrieve call: query + top_k go to search (search.md) |
| tool-result | `tool_result.tool_use_id`, `content[]` | Return tool result into dialog | Augmented: retrieved top-k chunks injected into context (assemble-context.md) |
| chunk-meta | `source`, `section`, `date` | Chunk metadata | Provenance: set at chunking (chunking.md) |
| retrieval-score | `cosine`, `rank` | Proximity score + top-k position | Retrieve quality: cosine 0..1, ranking (search.md) |
| text-answer | `content[].type=text`, `text` | Final answer text | Generation: grounded answer with source link |
| stop-reason | `stop_reason`, `stop_sequence` | Why the model stopped | Control signal: `tool_use` -> run search; `end_turn` -> done |
| usage | `usage.input_tokens`, `usage.output_tokens` | Per-turn token spend | Cost/budget signal: rising input_tokens = bloated context (assemble-context.md) |

**Reveal interaction** (`payload-anatomy-drill`): the rendered payload is a map, not a picture. Zoom 0 = whole 4-turn exchange; every functional block highlights on hover. Click/Enter on a block = semantic zoom into it (zoom 1): block fills the scene, an annotation card unfolds with two rows (technical Function + RAG role) plus the owning-chapter link (e.g. `tool_use` -> search.md, `usage` -> assemble-context.md). Exactly two zoom levels (whole payload -> one block). Esc / back returns the camera. No-JS: the annotated table above + the labelled JSON -- reader loses nothing. The `usage.input_tokens` growth (412 -> 638) is the worked cost-of-context signal cross-linked to assemble-context.md.

## Chunking-strategies catalog (complexity + cost ratings)

Source chapter: `content/ru/chunking.md` (#4). Cost split over three independent axes (they grow unevenly): **Token cost** (extra tokens generated -- overlap duplicates text; semantic may call embedding/LLM per boundary candidate), **Time cost** (per-doc cut latency -- pure string-split is instant; model calls add network), **Compute cost** (CPU for parsing vs GPU/API model calls). Ratings are relative (low/medium/high), not absolute numbers -- they order strategies against each other, not a benchmark.

**Token-vs-character distinction (applies to every size/overlap number below):** chunk "size" can be measured in CHARACTERS (cheap, instant, what naive string-splitters use) or in TOKENS (what the embedding + generation models actually count, and what the token budget in assemble-context is denominated in). The two diverge -- a token is ~4 chars of English, fewer for Cyrillic/code -- so a character-sized chunk can silently overrun a token budget. Catalog numbers state characters unless marked tokens; the chapter calls out that production sizing should be token-based (cross-link: assemble-context token-budget). This adds the `token-based-chunking` glossary term.

The catalog was expanded beyond the original 5. The original 5 are retained verbatim; 4 newer strategies are appended (Markdown/document-structure-aware header split, parent-document / hierarchical small-to-big, late chunking, contextual retrieval / metadata enrichment).

| Strategy | Complexity | Token cost | Time cost | Compute cost | When to use |
|----------|------------|------------|-----------|--------------|-------------|
| fixed-size | low | low | low | low | Fast prototype, homogeneous text with no clear structure; need predictable chunk size. |
| sliding-window (overlap) | low | medium | low | low | Facts often land on boundaries; must guarantee boundary meaning is not lost. |
| recursive (separator hierarchy) | medium | low | low | low | Universal default for prose: cut by paragraphs/sentences but hard-hold the size limit. |
| sentence / structure-aware | medium | low | medium | low-medium | Reliable structure exists (Markdown headings, code AST, sentence boundaries) to preserve. |
| semantic / LLM-based | high | high | high | high | Boundary quality is critical and justifies the cost; cut on meaning shifts, not characters. |
| Markdown / document-structure-aware (split on headers) | medium | low | low-medium | low | Source is Markdown / structured docs with a header hierarchy; split on `#`/`##` so each chunk is a self-contained section and the heading path becomes metadata. |
| parent-document / hierarchical (small-to-big) | high | medium | medium | low-medium | Want precise small-chunk retrieval but full-section context at generation: embed small child chunks, return their larger parent document/section on a hit. Two-tier index. |
| late chunking | high | low | medium | medium-high (one long-context embed pass) | Cross-chunk context (pronouns, references) must survive: embed the whole document with a long-context model FIRST, then pool token embeddings into chunks -- each chunk vector carries document-wide context. (arXiv:2409.04701) |
| contextual retrieval / metadata enrichment | high | high (per-chunk LLM call) | high | high | Chunks lose meaning out of context; prepend an LLM-generated situating blurb (and/or structured metadata) to each chunk before embedding to cut retrieval failures. (Anthropic Contextual Retrieval) |

**Per-strategy depth (algorithm steps + animation):**

| Strategy | Step-by-step algorithm | Runnable Python | Didactic animation brief |
|----------|------------------------|-----------------|--------------------------|
| fixed-size | yes (6 steps) | yes (`fixed_size_chunks`) | `FixedSizeCutAnim` |
| sliding-window | yes (6 steps) | yes (`sliding_window_chunks`) | `SlidingWindowAnim` |
| recursive | yes (6 steps) | yes (`recursive_chunks`) | `RecursiveDescentAnim` |
| structure-aware | yes (6 steps) | no (wraps a parser library; only the wrapper shown) | `StructureAwareAnim` |
| semantic | yes (6 steps) | no (depends on embedding/LLM calls) | `SemanticShiftAnim` |
| markdown-header-split | yes (steps) | yes (header-path splitter wrapper) | reuses `StructureAwareAnim` (header boundaries) -- no NEW anim brief |
| parent-document-retrieval | yes (steps) | no (two-tier index wiring; prose + diagram) | static small-to-big schematic -- no NEW anim brief |
| late-chunking | yes (steps) | no (depends on long-context embed pass) | static "embed-whole-then-pool" schematic -- no NEW anim brief |
| contextual-retrieval | yes (steps) | no (per-chunk LLM enrichment call) | static "blurb prepended before embed" schematic -- no NEW anim brief |

The original 5 strategies have step-by-step algorithms + an animation; 3 (fixed-size, sliding-window, recursive) ship runnable Python. The 4 newer strategies are taught as prose + algorithm steps (+ Python where it is a thin wrapper) and REUSE the existing static schematics / `StructureAwareAnim`; they add NO new animation briefs, so the IE animation count is unchanged. The catalog is a 2-level semantic-zoom drill (`ChunkingStrategyCatalog`): level 0 = the ratings overview table (now 9 rows); level 1 = one strategy panel (how-it-works + when-to-use + algorithm + Python where present + that strategy's animation/schematic). No deeper zoom.

## Interactive schemes -- progressive disclosure

Per chapter: the progressive-disclosure / semantic-zoom scheme (<=2 levels) from its IE brief.

| Chapter | Element | Level 0 (overview) | Level 1 (drill, semantic zoom) | No-JS fallback |
|---------|---------|--------------------|--------------------------------|----------------|
| start | map-route | Route SVG with 11 stop pins + earned progress strip; single-open field note | Open one stop's field note in place (blurb + pts + ex from nav.json) | Stop list + per-stop prose |
| what-rag | pipeline-flow | L-to-R 7 stage node-cards, one-time spine draw | Camera zoom into a stage node -> its composition + owning chapter | Static inline-SVG stage chain + full prose |
| why-rag | comparison | Two tracks A (no RAG) / B (with RAG); main path = Track B | Camera zoom into a node (e.g. context-box) -> which chunks, what order | Both tracks as static inline-SVG + text |
| chunking | ChunkingStrategyCatalog | Ratings overview table (9 strategies: original 5 + markdown-header / parent-document / late-chunking / contextual-retrieval) | Zoom into one strategy panel: algorithm + Python + that strategy's cut animation or static schematic | Full readable table |
| embedding | embedding-materialize | Embedding node on the pipeline | Zoom into Embedding node -> text->tokens->vector materialize animation | Static chunk->vector one-to-one note |
| vector-store | ann-topk-drill | Small index schematic (~8-10 vector nodes + query node), explicit query path to top-k | Zoom into a chosen neighbour node -> its cosine + metadata | Labelled kNN list |
| search | vector-space-map | 2D vector space: query + ~10 chunk points settle by cosine, cosine rings, top-k edges | Zoom into a point; far points open a "why not top-k" panel; keyword-miss callout | Static 2D scheme + text |
| assemble-context | context-assembly-drill | assemble node + prompt template | Zoom into assemble node -> template fills with ranked chunks vs token budget, over-budget trimmed | Finished prompt block with labelled parts |
| generation | grounded-answer-reveal | Answer + source chunks | Zoom into one claim<->chunk link; green grounding accent lights only when citation matched | Answer with `[source]` markers + chunk list + fallback block |
| evaluation | metric-at-k-eval-calculator | precision@k / recall@k bars; before/after tracks; k slider | Zoom into one golden question -> which top-k hit relevant | Worked golden-set table |
| production | rollout-checklist-cost-calculator | Earned-progress rollout checklist + cost/latency calculator | Zoom into one checklist item | Full checklist prose + worked single-request cost example |
| payload-anatomy | payload-anatomy-drill | Whole 4-turn payload, blocks highlight on hover | Zoom into one block -> annotation card (Function + RAG role + chapter link) | Annotated block table + labelled JSON |

## Didactic algorithm animations

One row per animation brief. All: transform/opacity only (+ gated one-shot stroke-dashoffset / width where noted), IO-gated, reduced-motion snaps to end over the same DOM, mobile 390/320 reflow, NO mascot/traveling dot, query/cut path drawn explicitly. Green = earned progress / static top-k accent only.

| Element | Source chapter | Mechanism taught | Motion |
|---------|----------------|------------------|--------|
| map-route | start | The whole RAG route as ordered stops; opening a stop = earned step | Pins fade/translate in along routeD; progress strip grows by width on open; reduced-motion snaps |
| pipeline-flow | what-rag | RAG is an ordered pipeline; each stage drillable | Spine drawn once via gated stroke-dashoffset; nodes fade/translate in; drill = camera transform-scale into node |
| comparison | why-rag | Grounding depends on retrieval: context filled BEFORE the grounded answer | Track B: chunks slide into context-box (translate/opacity) in order, then answer fades in strictly after; Track A answers with no retrieve step; never paints green answer before context full |
| FixedSizeCutAnim | chunking | Fixed-size cuts fall at equal intervals regardless of word boundaries | Vertical cut lines appear in turn via scaleY 0->1 at equal intervals; each chunk highlighted by opacity; a cut visibly falls mid-word |
| SlidingWindowAnim | chunking | Overlap: fixed window slides by step=size-overlap, neighbours overlap | Translucent window slides along the line via translateX by step; overlap zone with neighbour highlighted by opacity to show repeated tail |
| RecursiveDescentAnim | chunking | Recursive descent down the separator hierarchy (paragraph -> sentence -> word) | Level 0 cuts on `\n\n` via scaleY; oversize pieces highlighted by opacity then get next-separator cuts on the next step -- visual tree descent |
| StructureAwareAnim | chunking | Cuts land only on sentence/heading boundaries, never inside | Cuts appear via scaleY strictly at sentence ends/after heading; forbidden in-sentence positions briefly opacity-flagged and skipped |
| SemanticShiftAnim | chunking | Boundary placed where adjacent sentences diverge in meaning (cosine drops), not at equal intervals | Similarity bars between neighbours grow via scaleY; where a bar is below threshold a cut appears next step via scaleY -- cuts land on meaning shifts |
| embedding-materialize | embedding | chunk -> vector: text splits into tokens, then vector numbers (dim 1536) settle in -- representation changes, not the text | text -> tokens -> vector settles; transform/opacity only, gated one-shot; query/chunk path explicit |
| ann-topk-drill | vector-store | From query vector to top-k nearest neighbours in a small index | Edges from query to top-k drawn once via gated stroke-dashoffset; nearest nodes highlighted; explicit query path |
| vector-space-map | search | Semantic search as geometry: points settle by cosine, top-k linked explicitly | Points settle to place by cosine (transform/opacity), then top-k edges drawn once (gated stroke-dashoffset), cosine rings fade in |
| context-assembly-drill | assemble-context | top-k chunks packed into the prompt template under a token budget, edge-ordered, over-budget trimmed | Template fills with ranked chunks in turn; token counter rises to limit; over-budget pieces visibly trimmed (opacity to 0 + collapse height) |
| grounded-answer-reveal | generation | Each answer claim is built FROM and grounded on a specific chunk; answer appears only as grounding completes | Each claim appears after its source chunk highlights (link line via gated stroke-dashoffset); green grounding accent lights only when citation matched; no-context case shows fallback without green |
| metric-at-k-eval-calculator | evaluation | How precision@k / recall@k move as k changes; honest before/after on a fixed set | k slider recomputes precision@k / recall@k bars (width/transform tween); top-k hits highlighted green as earned; before/after = two side-by-side tracks |
| rollout-checklist-cost-calculator | production | (1) earned-progress rollout checklist; (2) per-request cost+latency on the reader's own numbers | Checking an item lights a green earned segment of a progress strip (width tween); changing numbers recomputes cost/latency figures (opacity/transform tween on update) |
| payload-anatomy-drill | payload-anatomy | Each functional block of a real RAG payload: technical function + RAG domain role | Reveal transform/opacity only; <=2 zoom levels (whole payload -> one block detail) |

## IE handoff briefs

Master handoff list for the site task (`T-RECIPE-RAG-SITE`) / CT-IE-FEASIBILITY. Every `<!-- IE-BRIEF: ... -->` collected verbatim, tagged with its source chapter. 16 briefs across 12 chapters (chunking carries 6: catalog + 5 per-strategy anims). **All 6 chunking IE-BRIEFs are RETAINED unchanged** -- the 4 newer catalog strategies (markdown-header, parent-document, late-chunking, contextual-retrieval) reuse existing static schematics / `StructureAwareAnim` and add NO new brief, so the count stays 16.

> **Wording fix (animation scope, applied to the chunking intro).** The chunking-chapter intro and the catalog drill copy no longer say the animation runs "for each" strategy / overpromise an animation per strategy. Corrected wording: the catalog ships **didactic animations for the core chunking algorithms** (the 5 original strategies have a `chunk-anim.js` mode each; the 4 newer strategies are taught as algorithm + static schematic). This matches the actual IE deliverable (one `chunk-anim.js` with a `mode` switch; structure+semantic are defer-candidates) and avoids implying an animation exists for strategies that ship only prose/schematic.

### start.md
`IE-BRIEF: element=map-route | purpose=Pokazat' ves' marshrut RAG kak uporyadochennyj spisok ostanovok i dat' chitatelyu otkryt' lyubuyu glavu na meste; field note kazhdoj ostanovki = trailhead etoj glavy | inputs=shared/data/nav.json (routeD, stops[] s ru.{label,blurb,pts,ex}, ui.ru); aktivnyj yazyk iz i18n.js (RU default); single-open state (otkryta odna zametka) | host=[data-component="trail"] s data-slot="svg" (route SVG) + data-slot="note" (field note) + data-slot="progress" (zarabotannaya polosa); nav.json fetchitsya v page glue (stripMeta), NE cherez data-*-src | recipe-path=shared/js/lib/map-route.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/landing.js; SVG pins sampled on routeD via getPointAtLength (no drift) | animation=flazhki proyavlyayutsya po ocheredi vdol' routeD (opacity/translate), polosa progressa rastet po width pri otkrytii ostanovki; IO-gated, prefers-reduced-motion snaps to konechnoe sostoyanie nad tem zhe DOM; mobile 390/320 - karta scrollitsya po gorizontali, zametka pod nej; NO mascot/traveling dot`

### what-rag.md
`IE-BRIEF: element=pipeline-flow | purpose=Pokazat' RAG kak uporyadochennyj konvejer stadij i dat' chitatelyu drill (semantic zoom) vnutr' lyuboj stadii, chtoby uvidet' ee sostav i ee glavu | inputs=shared/data/what-rag.js (default-export { order:string[], nodes:{[id]:{idx,anchor,label,hint,crumb,panel,deep?}} }, importitsya v page glue, NE cherez data-*-src); mainPath = order; aktivnyj yazyk iz i18n.js (RU) | host=[data-component="pipeline"] s data-slot="flow" (3 stacked paths edge-base/edge-draw/edge-prog) + data-slot="nodes" (ryad node-card stadij), vnutri drill-camera stage [data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/pipeline.js + drilldown-zoom.js + progress.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/what-rag.js; inline SVG node/edge hooks .node/.edge | animation=spine (put' mezhdu uzlami) risuetsya odin raz cherez gated stroke-dashoffset; uzly proyavlyayutsya po ocheredi (opacity/translate); drill = transform-scale kamery v uzel, ne modal po umolchaniyu; IO-gated, prefers-reduced-motion snaps to konechnoe sostoyanie nad tem zhe DOM; mobile 390/320 - uzly perehodyat v vertikalnyj stack; NO mascot/traveling dot`

### why-rag.md
`IE-BRIEF: element=comparison | purpose=Nayadno protivopostavit' put bez RAG (stale/hallucinated) i s RAG (retrieval zapolnyaet kontekst PERED zazemlennym otvetom), chtoby pokazat, chto grounding zavisit ot retrieval | inputs=shared/data/why-rag.js (default-export { question:{ru,en}, note, tracks:[A,B], takeaways:[], drill:{<key>:detail} }, importitsya v page glue, NE worked-example.json); dve dorozhki A/B s fiksirovannym voprosom; aktivnyj yazyk iz i18n.js (RU) | host=[data-component="comparison"] s data-slot="tracks" (dve .track sekcii .cmp-node; context-uzel = .cmp-node--grounding) + data-slot="takeaways" + data-slot="drill-layer" (modal kamera) | recipe-path=shared/js/lib/comparison.js (sobstvennaya modal kamera vnutri modulya) (init(rootEl, config) => {destroy()}); page glue shared/js/pages/why-rag.js; mainPath = Track B ["B-q","B-embed","B-index","B-context","B-out"]; inline SVG .node/.edge | animation=Track B: chunki v'ezzhayut v .cmp-node--grounding kontekst (translate/opacity) po ocheredi, zatem answer-block proyavlyaetsya (opacity) - strogo POSLE zapolneniya konteksta, nikogda do; Track A srazu daet otvet bez retrieval-shaga; drill = transform-scale kamery v uzel; IO-gated, prefers-reduced-motion snaps to konechnoe sostoyanie nad tem zhe DOM (kontekst uzhe polon, otvet uzhe viden); mobile 390/320 - dorozhki v vertikalnyj stack; NO mascot/traveling dot`

### chunking.md
`IE-BRIEF: element=ChunkingStrategyCatalog | purpose=Pokazat' ves' katalog strategij reza kak sravnimuyu tablicu rejtingov i dat' drill v lyubuyu strategiyu do ee algoritma | inputs=NET-NEW default-export shared/data/chunking.js { strategies:[{ id, ru:{name,how,when}, en, complexity, tokenCost, timeCost, computeCost, algorithm:[steps], python?, anim:{element,params} }] } (catalog rows iz etoj tablicy); po odnomu drill-target na strategiyu | host=[data-component="drilldown-host"] s data-slot="stage" (5-row ratings table kak drillable rows/nodes) + data-slot="crumbs" + data-slot="zoomout" + data-slot="panel" | recipe-path=shared/js/lib/drilldown-zoom.js (shipped semantic-zoom kamera, level0 table -> level1 strategy panel cherez renderPanel); page glue NET-NEW pages/chunking.js postavlyaet catalog data + per-strategy panel DOM | animation=na drill: vybrannaya strochka/uzel strategii rastyagivaetsya v panel' cherez scale+translate (transform) i fade sosednih (opacity); IO-gated; reduced-motion: panel' srazu v konechnom sostoyanii bez perehoda; mobile 390/320: tablica skrolitsya gorizontal'no, panel' na ves' ekran; NO mascot dot`

`IE-BRIEF: element=FixedSizeCutAnim | purpose=Pokazat' mehanizm reza fixed-size: rezy padayut cherez ravnye intervaly nezavisimo ot granic slov | inputs=stroka primera doc; size=60 (kak v Python vyshe); pozicii rezov = 0,60,120,...; iz strategy.anim.params v data/chunking.js | host=[data-slot="anim"] vnutri level-1 panel'i strategii fixed-size | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=fixed (odin modul' na vse 5 anim, reuses timeline.js kak rAF chasy; NE process-anim.js) | animation=na ekrane stroka teksta monospace; vertikal'nye linii-rezy poyavlyayutsya po ocheredi cherez scaleY 0->1 (transform) na ravnyh intervalah, kazhdyj chunk podsvechivaetsya opacity; vidno, chto rez mozhet past' poseredine slova; IO-gated; reduced-motion: vse rezy srazu narisovany v konechnom sostoyanii; mobile 390/320: tekst perenositsya, rezy markiruyutsya na kazhdoj stroke; NO mascot dot`

`IE-BRIEF: element=SlidingWindowAnim | purpose=Pokazat' mehanizm perekrytiya: okno fiksirovannoj shiriny edet po tekstu so shagom step=size-overlap, sosednie okna nakladyvayutsya | inputs=stroka primera doc; size=50; overlap=15; step=35; iz strategy.anim.params v data/chunking.js | host=[data-slot="anim"] vnutri level-1 panel'i strategii sliding-window | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=sliding (reuses timeline.js; NE process-anim.js) | animation=poluprozrachnyj pryamougolnik-okno sdvigaetsya vdol' stroki cherez translateX (transform) na step za shag; zona perekrytiya s sosednim oknom podsvechivaetsya opacity, chtoby bylo vidno, chto hvost povtoryaetsya; IO-gated; reduced-motion: vse okna pokazany odnovremenno stopkoj s vidimym perekrytiem v konechnom sostoyanii; mobile 390/320: tekst perenositsya, okno markiruetsya skobkoj; NO mascot dot`

`IE-BRIEF: element=RecursiveDescentAnim | purpose=Pokazat' rekursivnyj spusk po ierarhii separatorov: snachala rez po abzacam, te kuski, chto ne vlezli, rezhutsya po predlozheniyam, potom po slovam - drevovidnyj spusk | inputs=stroka doc s \n\n i predlozheniyami; separators=["\n\n","\n"," ",""]; size=70; iz strategy.anim.params v data/chunking.js | host=[data-slot="anim"] vnutri level-1 panel'i strategii recursive | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=recursive (reuses timeline.js; NE process-anim.js) | animation=tekst pokazan blokom; uroven' 0 - rezy po \n\n poyavlyayutsya cherez scaleY (transform); kuski, prevysivshie size, podsvechivayutsya opacity i na sleduyushchem shage v nih poyavlyayutsya rezy sleduyushchego separatora (spusk na uroven' nizhe) - vizual'no kak descent po derevu; IO-gated; reduced-motion: srazu pokazany vse finalnye granicy s pometkoj urovnya separatora; mobile 390/320: blok suzhaetsya, urovni separatorov markiruyutsya cvetom border po theme accent; NO mascot dot`

`IE-BRIEF: element=StructureAwareAnim | purpose=Pokazat', chto rezy lozhatsya tol'ko na granicy predlozhenij/zagolovkov, nikogda ne vnutri; sravnit' s fixed-size, gde rez mozhet past' v seredine frazy | inputs=korotkij tekst s 3-4 predlozheniyami i odnim zagolovkom; granicy = pozicii koncov predlozhenij i zagolovka; iz strategy.anim.params v data/chunking.js | host=[data-slot="anim"] vnutri level-1 panel'i strategii structure-aware | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=structure (reuses timeline.js; NE process-anim.js; defer-candidate) | animation=tekst s vydelennymi predlozheniyami; rezy poyavlyayutsya cherez scaleY (transform) strogo na koncah predlozhenij/posle zagolovka; "zapreshchennye" pozicii vnutri predlozheniya kratko podsvechivayutsya opacity i propuskayutsya; IO-gated; reduced-motion: vse strukturnye granicy srazu narisovany; mobile 390/320: predlozheniya perenosyatsya, granicy markiruyutsya na koncah; NO mascot dot`

`IE-BRIEF: element=SemanticShiftAnim | purpose=Pokazat', chto granica stavitsya tam, gde sosednie predlozheniya rezko rashodyatsya po smyslu (padaet cosine), a ne na ravnyh intervalah | inputs=4-5 predlozhenij; ryad cosine-shozhesti mezhdu sosedyami (stub znacheniya); porog; iz strategy.anim.params v data/chunking.js | host=[data-slot="anim"] vnutri level-1 panel'i strategii semantic | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=semantic (reuses timeline.js; NE process-anim.js; defer-candidate) | animation=ryad predlozhenij; mezhdu sosedyami stolbiki shozhesti rastut cherez scaleY (transform); tam, gde stolbik nizhe poroga, na sleduyushchem shage poyavlyaetsya rez cherez scaleY; vidno, chto rezy lozhatsya na smyslovye sdvigi, a ne ravnomerno; IO-gated; reduced-motion: stolbiki i rezy srazu v konechnom sostoyanii; mobile 390/320: stolbiki i predlozheniya v stolbik; NO mascot dot`

### embedding.md
`IE-BRIEF: element=embedding-materialize | purpose=pokazat' mehanizm chunk -> vektor: ishodnyj tekst razbivaetsya na tokeny, zatem chisla vektora (dim 1536) "materializuyutsya" / osedayut na meste, demonstriruya chto menyaetsya predstavlenie a ne tekst | inputs=odin chunk-text iz worked-example.json (chunk c1) + ego vektor-stub v1 (dim 1536, values - zaglushka) | host=data-component="embedding-materialize" data-slot="anim" data-src="../shared/data/worked-example.json" | recipe-path=shared/js/lib/process-anim.js (renderer odnogo embed-shaga v [data-slot=anim]); drill cherez drilldown-zoom.js v node Embedding | animation=text -> tokens -> vektor osedaet; transform/opacity only, gated one-shot; IO-gated + prefers-reduced-motion snaps to end state nad tem zhe DOM; mobile 390/320 stack vertikal'no; NO mascot dot; query/chunk path narisovan yavno`

### vector-store.md
`IE-BRIEF: element=ann-topk-drill | purpose=pokazat' kak iz vektora zaprosa nahodyatsya top-k blizhajshih sosedej v nebol'shom indekse: query path narisovan yavno ot uzla-zaprosa k vybrannym sosedyam, drill (semantic zoom) v vybrannyj uzel pokazyvaet ego metadata + cosine | inputs=NET-NEW default-export shared/data/vector-store.js (po obrazcu search-vectors.js: { query, k, plot, rings?, points:[{id,kind,cx,cy,cos,rank,topk?,metadata,deep}] }, ~8-10 uzlov + 1 query + top_k=3; layout stubs); importitsya v page glue | host=[data-component="drilldown-host"] s data-slot="stage" (index SVG) + data-slot="crumbs" + data-slot="zoomout" + data-slot="panel" | recipe-path=shared/js/lib/drilldown-zoom.js (shipped semantic-zoom kamera) + reuse vector-map.js point+link mashinerii (ili tonkij NET-NEW index-map.js) | animation=rebra ot zaprosa k top-k risuyutsya odin raz (gated stroke-dashoffset), blizhajshie uzly podsvechivayutsya; transform/opacity only; IO-gated + prefers-reduced-motion snaps to end; mobile 390/320 perekomponovka uzlov; NO mascot dot; query path vsegda narisovan`

### search.md
`IE-BRIEF: element=vector-space-map | purpose=pokazat' poisk po smyslu kak geometriyu: tochka-zapros i tochki-chunki osedayut po cosine-blizosti, top-k svyazany yavnymi rebrami; kazhdaya tochka drillable - dalekie tochki otkryvayut panel "pochemu ne v top-k", est' keyword-miss callout | inputs=shared/data/search-vectors.js (default-export { query, k, plot, rings, points:[Point] }, importitsya v page glue, NE worked-example.json): query point + ~10 chunk points, top_k (po umolchaniyu 3), cosine rings | host=[data-component="vector-map"] s data-slot="stage" (plot SVG) + rail data-slot="rail"/"qvec"/"ranklist" | recipe-path=shared/js/lib/vector-map.js (raskladka 2D + cosine rings + kNN links) + drilldown-zoom.js (semantic zoom v tochku); page glue shared/js/pages/search.js; mainPath=["pt-q","n1","n2","n3"] | animation=tochki osedayut na svoi mesta po cosine (transform/opacity only), zatem rebra top-k risuyutsya odin raz (gated stroke-dashoffset), cosine rings proyavlyayutsya; IO-gated + prefers-reduced-motion snaps to end state; mobile 390/320 szhatie scene; NO mascot dot; query path (zapros -> top-k) vsegda narisovan yavno`

### assemble-context.md
`IE-BRIEF: element=context-assembly-drill | purpose=pokazat' kak top-k chunki upakovyvayutsya v shablon prompta pod token budget, s poryadkom po krayam i obrezkoj lishnego | inputs=NET-NEW default-export shared/data/assemble-context.js { template, chunks:[{id,text,score,source,tokens}], maxContextTokens:{min:500,max:4000,default}, order:["by-score"|"by-edges"] } | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); context-assembly-drill montiruetsya kak level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped kamera) + NET-NEW shared/js/lib/context-assembly.js, drivable timeline.js shagovo (dedup -> order -> budget -> fill) | animation=semantic zoom v assemble-uzel; shablon prompta zapolnyaetsya rankovannymi chunkami po ocheredi (translate/opacity), schetchik tokenov rastet (mono text update), kuski za byudzhetom obrezayutsya cherez opacity-to-0 (DVIZHENIE - opacity; vysota snapaetsya, NE tween height/max-height per do-not #5); transform/opacity only, IO-gated, reduced-motion srazu pokazyvaet final'nyj prompt; mobile 390/320 stack vertikal'no; NO mascot dot`

### generation.md
`IE-BRIEF: element=grounded-answer-reveal | purpose=pokazat' chto kazhdoe utverzhdenie otveta postroeno IZ konkretnogo chunka i zazemleno na nem; otvet poyavlyaetsya tol'ko po mere zaversheniya zazemleniya, ne pre-painted | inputs=NET-NEW default-export shared/data/generation.js { contextChunks:[{id,source,text}], answer:"...[source:c1]...", claims:[{text,chunkId}], noContext:bool } | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); grounded-answer-reveal montiruetsya kak level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped kamera, zoom v svyaz' utverzhdenie<->chunk) + NET-NEW shared/js/lib/grounded-answer.js na timeline.js | animation=kazhdoe utverzhdenie otveta proyavlyaetsya posle togo kak ego chunk-istochnik podsvetilsya (linija svyazi risuetsya gated stroke-dashoffset); zelenyj akcent zazemleniya zagoraetsya tol'ko kogda citata sopostavlena; no-context keis pokazyvaet fallback "Etogo net v dokumentah" bez zelenogo; transform/opacity only, IO-gated, reduced-motion srazu pokazyvaet final s narisovannymi svyazyami; mobile 390/320 otvet i chunki stack; NO mascot dot`

### evaluation.md
`IE-BRIEF: element=metric-at-k-eval-calculator | purpose=dat' chitatelyu pochuvstvovat' kak precision@k i recall@k menyayutsya pri izmenenii k na realnom zolotom sample, i sravnit' before/after | inputs=NET-NEW default-export shared/data/evaluation.js { golden:[{q, relevant_ids[], retrieved_ids[]}] (3-5 voprosov, retrieved_ids per run), kRange:{min:1,max:10,default}, runs:["before","after"] }; slider k; tumbler before/after | host=[data-component="metric-eval-calculator"]; optional drill cherez [data-component="drilldown-host"] | recipe-path=NET-NEW shared/js/lib/eval-calculator.js (init(rootEl,{data})=>{destroy()}; chistyj precision@k/recall@k + bar render) + drilldown-zoom.js dlya zooma v odin vopros | animation=pri dvizhenii slidera k stolbcy precision@k i recall@k pereschityvayutsya (width/transform tween); popadaniya v top-k podsvechivayutsya zelenym akcentom kak earned; before/after - dve dorozhki ryadom; transform/opacity i gated width only, IO-gated, reduced-motion srazu pokazyvaet itogovye stolbcy; mobile 390/320 dorozhki stack; NO mascot dot`

### production.md
`IE-BRIEF: element=rollout-checklist-cost-calculator | purpose=dat' chitatelyu (1) interaktivnyj rollout-checklist s earned-progress i (2) kalkulyator stoimosti i latency na ego sobstvennyh chislah | inputs=NET-NEW default-export shared/data/production.js { checklist:[{id, ru, en, done:false}], calc:{tokensIn, tokensOut, priceInPerM, priceOutPerM, qps, cacheHitRate} } | host=[data-component="rollout-cost-calculator"]; optional drill cherez [data-component="drilldown-host"] | recipe-path=checklist earned-progress = REUSE shared/js/lib/progress.js (NE timeline.js/process-anim.js); cost/latency = NET-NEW shared/js/lib/cost-calculator.js (cost=tok_in*price_in+tok_out*price_out + mesyachnaya ocenka); drilldown-zoom.js dlya zooma v punkt | animation=otmetka punkta checklista zazhigaet zelenyj earned-segment progress-strip (width tween); pri izmenenii chisel cifry stoimosti/latency pereschityvayutsya (opacity/transform tween na obnovlenii); transform/opacity i gated width only, IO-gated, reduced-motion srazu pokazyvaet itog; mobile 390/320 checklist i kalkulyator stack; NO mascot dot`

### payload-anatomy.md
`IE-BRIEF: element=payload-anatomy-drill | purpose=Dat' chitatelyu navesti/raskryt' lyuboj funkcional'nyj blok otrisovannogo RAG payload i srazu uvidet' ego tehnicheskuyu funkciyu + domennuyu rol' v konvejere RAG, so ssylkoj na glavu-vladel'ca | inputs=razmechennyj request/response JSON (4 hoda: request, tool_use response, tool_result request, final text response) + block map (17 strok tablicy Block|Field(s)|Function|RAG domain role; kazhdaya stroka neset block-id, polya dlya podsvetki i chapter-link); NET-NEW default-export data/payload-anatomy.js { turns[], blocks[{id,fields,function{ru,en},ragRole{ru,en},chapter,highlight[]}] } | host=[data-component="payload-anatomy-drill"] (drill cherez built drill-host slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/drilldown-zoom.js (shipped semantic-zoom kamera, init(rootEl, config)=>{destroy()}); page glue shared/js/pages/payload-anatomy.js postavlyaet renderPanel; payload renderitsya kak annotirovannyj HTML <pre>/<code> s per-block hooks, ne SVG | animation=reveal: transform/opacity only; IO-gated; reduced-motion snaps to end over the same DOM; <=2 zoom levels (whole payload -> one block detail); mobile 390/320; NO mascot/traveling dot`

## Cross-references

Cross-chapter link graph harvested from the manuscripts. Route order: start -> what-rag -> why-rag -> chunking -> embedding -> vector-store -> search -> assemble-context -> generation -> evaluation -> production; payload-anatomy is the non-route hub.

**Route spine (every `## Что дальше` -> next stop):** start -> what-rag -> why-rag -> chunking -> embedding -> vector-store -> search -> assemble-context -> generation -> evaluation -> production -> (back to start / payload-anatomy).

**Retrieval cluster (cosine / vectors / ANN cross-cite each other):**
- embedding <-> search: same cosine metric; search reuses the embedding model (query and chunks must share one model/space).
- embedding -> vector-store: vectors flow into the index (`store` step).
- vector-store <-> search: ANN/HNSW + top-k + metadata filters; search depends on the index built in vector-store.
- chunking -> embedding -> vector-store -> search: the one-to-one chunk->vector->index->top-k chain on the same `worked-example.json` (c1..c3 / v1..v3).
- chunking (semantic strategy) -> embedding: semantic-chunking reuses cosine "meaning proximity" introduced in embedding.

**payload-anatomy as the hub (generation + assemble-context point INTO it; it points back to all stages):**
- generation -> payload-anatomy: how `system` / `content` / `stop_reason` yield the grounded answer.
- assemble-context -> payload-anatomy: how `usage` + `tool_result` show the context budget.
- payload-anatomy -> search (tool_use query/top_k, cosine/rank), chunking (chunk source/section/date), assemble-context (usage growth 412->638), generation (text answer / system grounding).

**lost-in-the-middle thread (Liu et al., 2023 cited across):** chunking (size/overlap tradeoff) -> search (top-k order matters) -> assemble-context (edge-ordering mitigation) -> evaluation (failure: needed chunk ignored mid-window).

**grounding/hallucination thread:** why-rag (motivation: fewer made-up facts) -> generation (instruction + citations + fallback; Ji et al., 2023) -> evaluation (faithfulness metric; RAGAS).

**production folds + back-references:** production folds caching/cost, monitoring/refresh, multi-tenant access (privacy: user-facing only, no platform internals), rollout checklist, where-RAG-is-going. Back-refs: assemble-context (token budget), vector-store (ANN latency + metadata access filter), generation (streaming, fallback), evaluation (golden set fed by prod feedback), chunking (metadata for access).

**Cross-link footer (mandatory on every chapter):** all 12 chapters carry the `## Об этом рецепте` block with both `https://brewpage.app` and `https://github.com/kochetkov-ma/brewpage-openapi`.

## Glossary (term -> ru/en)

CONTENT for the site task to wire into `shared/data/glossary.json` later (do NOT edit glossary.json here). Key RAG terms introduced across chapters, with first-introduced-in chapter. `term-key` is the stable slug for `[data-term]` / `.term` hooks.

| term-key | ru | en | first-introduced-in |
|----------|----|----|---------------------|
| rag | RAG (retrieval-augmented generation) | Retrieval-Augmented Generation | start |
| retrieval | retrieval (poisk i izvlechenie) | retrieval | start / what-rag |
| augmentation | augmentation (podmeshivanie najdennogo) | augmentation | what-rag |
| generation | generaciya | generation | what-rag |
| grounding | zazemlenie | grounding | start / why-rag |
| hallucination | galyucinaciya (uverennaya vydumka) | hallucination | what-rag / generation |
| fine-tuning | doobuchenie (fine-tuning) | fine-tuning | what-rag |
| context-window | kontekstnoe okno | context window | what-rag / assemble-context |
| training-cutoff | data otsechki obucheniya | training cutoff | why-rag |
| chunk | chunk (fragment retrieval-razmera) | chunk | start / chunking |
| chunking | chunking (narezka na chunki) | chunking | chunking |
| splitter | splitter (reshaet gde rezat') | splitter | chunking |
| overlap | overlap (perekrytie chunkov) | overlap | chunking |
| metadata | metadata chunka (source/section/date) | metadata | chunking / vector-store |
| fixed-size-chunking | fixed-size narezka | fixed-size chunking | chunking |
| sliding-window | sliding-window (okno s perekrytiem) | sliding window | chunking |
| recursive-chunking | recursive narezka po separatoram | recursive chunking | chunking |
| structure-aware-chunking | structure-aware narezka po granicam | structure-aware chunking | chunking |
| semantic-chunking | semantic / LLM-based narezka | semantic chunking | chunking |
| markdown-header-split | narezka po Markdown-zagolovkam (split on headers) | Markdown header split | chunking |
| parent-document-retrieval | parent-document / ierarhicheskij (small-to-big) | parent-document retrieval | chunking |
| late-chunking | late chunking (embed vsego doc, potom pooling) | late chunking | chunking |
| contextual-retrieval | contextual retrieval (situating-blurb pered embed) | contextual retrieval | chunking |
| token-based-chunking | razmer v tokenah, ne simvolah | token-based chunking | chunking / assemble-context |
| embedding | embedding (vektornoe predstavlenie) | embedding | embedding |
| vector | vektor (spisok chisel dliny dim) | vector | embedding |
| dimensionality | razmernost' (dim, naprimer 1536) | dimensionality (dim) | embedding |
| cosine-similarity | kosinusnaya blizost' | cosine similarity | embedding |
| embedding-drift | drift modeli embeddingov | embedding model drift | embedding |
| l2-normalization | L2-normalizaciya (cosine == dot) | L2 normalization | embedding |
| dot-product | skalyarnoe proizvedenie (dot product) | dot product | embedding |
| euclidean-distance | evklidovo rasstoyanie (L2) | Euclidean (L2) distance | embedding |
| bm25 | BM25 (sparse lexical retrieval) | BM25 | embedding / search |
| hybrid-retrieval | gibridnyj poisk (sparse + dense) | hybrid retrieval | embedding / search |
| matryoshka | Matryoshka / usechenie razmernosti | Matryoshka / dimension truncation | embedding |
| asymmetric-embedding | asimmetrichnye query/doc embeddingi (E5) | asymmetric query/doc embeddings | embedding |
| multilingual-embedding | mnogoyazychnye embeddingi (obshchee prostranstvo) | multilingual embeddings | embedding |
| quantization | kvantizaciya vektorov (scalar/binary) | quantization | embedding / vector-store |
| vector-store | vektornaya baza (vector store) | vector store | start / vector-store |
| knn | tochnyj poisk blizhajshih (kNN) | k-nearest neighbours (kNN) | vector-store |
| ann | priblizhennyj poisk blizhajshih (ANN) | approximate nearest neighbour (ANN) | vector-store |
| hnsw | HNSW (mnogosloinyj graf) | HNSW | start / vector-store |
| metadata-filter | metadata-fil'tr | metadata filter | vector-store |
| top-k | top-k blizhajshih chunkov | top-k | vector-store / search |
| semantic-search | poisk po smyslu | semantic search | search |
| query-vector | vektor zaprosa | query vector | search |
| reranking | reranking (cross-encoder pereotsenka) | reranking | search |
| hybrid-search | gibridnyj poisk | hybrid search | search |
| bi-encoder | bi-encoder | bi-encoder | search |
| cross-encoder | cross-encoder | cross-encoder | search |
| keyword-miss | promah poiska po klyuchevym slovam | keyword miss | search |
| prompt-template | shablon prompta | prompt template | assemble-context |
| token | token (edinica tokenizera) | token | assemble-context |
| token-budget | token budget (byudzhet tokenov) | token budget | assemble-context |
| lost-in-the-middle | "lost in the middle" | lost in the middle | chunking / assemble-context |
| dedup | dedup (chistka dublej) | dedup | assemble-context |
| citation | citata / ssylka na istochnik | citation | generation |
| fallback | fallback "etogo net v dokumentah" | fallback | generation |
| streaming | streaming (potokovyj vyvod) | streaming | generation |
| golden-set | zolotoj nabor voprosov | golden set | chunking / evaluation |
| precision-at-k | precision@k | precision@k | evaluation |
| recall-at-k | recall@k | recall@k | evaluation |
| faithfulness | faithfulness (zazemlennost' otveta) | faithfulness | evaluation |
| answer-relevance | answer relevance | answer relevance | evaluation |
| context-precision | context relevance/precision | context precision | evaluation |
| ragas | RAGAS (eval-framework) | RAGAS | evaluation |
| cache | kesh otvetov/embeddingov | cache | production |
| ttl | TTL kesha | TTL | production |
| latency | latency (zaderzhka zaprosa) | latency | production |
| qps | QPS (zaprosov v sekundu) | QPS | production |
| multi-tenant | mnogopol'zovatel'skij dostup (tenant/ACL) | multi-tenant access | production |
| graph-rag | graf-RAG | graph RAG | production |
| payload | payload (telo zaprosa/otveta) | payload | payload-anatomy |
| tool-use | tool_use (vyzov instrumenta) | tool use | payload-anatomy |
| tool-result | tool_result (vozvrat instrumenta) | tool result | payload-anatomy |
| stop-reason | stop_reason (signal ostanovki) | stop reason | payload-anatomy |
| usage-tokens | usage (input/output tokens) | token usage | payload-anatomy |

## IE feasibility review (advisory)

Author: interactive-engineer | date: 2026-06-13 | task: CT-IE-FEASIBILITY (advisory; no site code written here).

Scope of this review: each of the 16 IE briefs assessed against the build contract -- vanilla ES module exporting `init(rootEl, config) => { destroy() }`; inline SVG only; transform/opacity (+ gated one-shot stroke-dashoffset / width) only; one rAF clock; `<=2` zoom levels; IO-gated AND `prefers-reduced-motion` honored (reduced = manual stepper / snap-to-end over the SAME DOM); mobile 390+320; full no-JS fallback; NO mascot/traveling dot.

### As-built reality the briefs must reconcile with (AtlasMD section 5.x drift note)

The 4 built pages (`index.html`, `what-rag.html`, `why-rag.html`, `search.html`) do NOT use the generic scaffold contracts the briefs lean on. Concretely:

- **`diagram-data.js` + `data-*-src` + generic `drilldown.js` are UNUSED by the built site.** Built pages ship per-page DATA as default-export modules `data/what-rag.js`, `why-rag.js`, `search-vectors.js` (imported in page glue, NOT fetched via `data-*-src`). The pipeline drill is `pipeline.js` + `drilldown-zoom.js`, not `drilldown.js`.
- **`process-anim.js` + `timeline.js` + `worked-example.json` exist but are SCAFFOLD LEFTOVERS** -- present, contract-documented, but not wired into any built page. They are reusable as-is for the new animation briefs, but they were built for the 3-step split/embed/store worked example only (`kind: split|embed|store`). Any brief that needs a different per-step mechanism (cut lines, sliding window, recursive descent, similarity bars, token-budget fill) needs a NEW renderer module; it can REUSE `timeline.js` as the rAF clock but cannot reuse `process-anim.js`'s scene builder.
- **`drilldown-zoom.js` is the real, shipped camera** (`init(host,{ renderPanel(entry,api), labels?, plate?, progress?, announce?, onSelect? })`), supporting BOTH inline-grow and modal strategies, max 2 levels, selection-on-zoom-out, breadcrumb, lens controls, Escape. This is the correct reuse target for every "semantic zoom / drill" brief -- NOT `drilldown.js`.

Net: where a brief says `recipe-path=shared/js/lib/drilldown.js`, read it as `drilldown-zoom.js` (the built camera). Where a brief points `host` at `data-*-src` + `diagram-data.js`, the implementer instead supplies data via a default-export `data/*.js` import in page glue (the as-built pattern). These are notation mismatches against the scaffold-era contract, not blockers -- flagged per brief below.

### Per-brief verdicts

**1. map-route (start) -- BUILDABLE (already built).**
- Host: `[data-component="trail"]` / `[data-slot="svg"|"note"|"progress"]` (AtlasMD 3.12, 5.1). Brief's `data-component="map-route"` is a notation slip; built host token is `trail`. Use the built selector.
- Owning module: `map-route.js` (REUSE, shipped). Page glue: `pages/landing.js`.
- Data: `shared/data/nav.json` -- `{ routeD, stopCount, stops:[{id,slug,href?,ru:{label,blurb,pts[],ex},en}], ui:{ru,en} }` (AtlasMD 7). Already feeds it. CONTENT-only: CA fills blurb/pts/ex VALUES; no shape change.
- Invariants: clean (pins sampled on routeD via getPointAtLength = no drift; width-only progress; reduced-motion snaps; mobile horizontal scroller). No mascot.

**2. pipeline-flow (what-rag) -- BUILDABLE (already built).**
- Host: `[data-component="pipeline"]` with `[data-slot="flow"|"nodes"]`, inside the `drilldown-host` plate camera. Brief's `data-component="drilldown-host" data-stage="pipeline" data-diagram-src=...` is scaffold-era; built page uses `pipeline.js` over imported `data/what-rag.js`, NOT `diagram-data.js`/`data-*-src`.
- Owning module: `pipeline.js` + `drilldown-zoom.js` + `progress.js` (REUSE). Page glue: `pages/what-rag.js`. (Brief says `pages/stage.js` -- that is the unused scaffold glue; the built glue is `what-rag.js`.)
- Data: `data/what-rag.js` default export `{ order:string[], nodes:{[id]:{idx,anchor,label,hint,crumb,panel,deep?}} }` (AtlasMD 7); `mainPath = order`. CONTENT-only fills.
- Invariants: clean (spine = gated one-shot stroke-dashoffset; nodes opacity/translate; drill = camera transform-scale; IO+reduce gated; mobile 2-col reflow). No mascot.

**3. comparison (why-rag) -- BUILDABLE (already built).**
- Host: `[data-component="comparison"]` with `[data-slot="tracks"|"takeaways"|"drill-layer"]` (AtlasMD 3.10). Brief's `data-slot="track-a"/"track-b"/"context-box"/"answer"` are conceptual sub-regions; built markup is `.track` / `.cmp-node` (context node = `.cmp-node--grounding`). Map brief slots onto built class hooks; no new slots needed.
- Owning module: `comparison.js` (REUSE; shipped name, planned `reveal.js`) + its own modal camera. Page glue: `pages/why-rag.js`.
- Data: `data/why-rag.js` `{ question, note, tracks:[A,B], takeaways, drill:{<key>:detail} }` (AtlasMD 7). Brief points at `worked-example.json` -- WRONG source; the built comparison reads `why-rag.js`. Use the built contract. CA fills `{ru,en}` VALUES.
- Invariants: clean (Track B fills context BEFORE answer; never pre-paints green; reduced-motion = context full + answer visible end-state; tracks stack on mobile). No mascot.

**4. ChunkingStrategyCatalog (chunking) -- BUILDABLE (net-new wiring on a reused camera).**
- Host: `[data-component="drilldown-host"]` with `[data-slot="stage"|"crumbs"|"zoomout"|"panel"]` (the built drill-host slot set, AtlasMD 3.6 -- NOT the brief's lone `data-slot="svg"`). Level-0 stage = the 5-row ratings table rendered as drillable rows/nodes; level-1 = one strategy panel via `renderPanel`.
- Owning module: `drilldown-zoom.js` (REUSE the camera; the brief's `drilldown.js` is the wrong/unused module). Per-page `renderPanel` glue is NET-NEW (a `pages/chunking.js` or equivalent), supplying the catalog data + the per-strategy panel DOM (which embeds the matching anim host).
- Data: NET-NEW default-export `data/chunking.js` (follow the `what-rag.js`/`why-rag.js` pattern): `{ strategies:[{ id, ru:{name,how,when}, en:{...}, complexity, tokenCost, timeCost, computeCost, algorithm:[steps], python?, anim:{ element, params } }] }`. Feeds the catalog table + each strategy panel. Define this shape now; CA fills VALUES from the "Chunking-strategies catalog" table above.
- Invariants: clean (exactly 2 levels: table -> one panel; drill = scale+translate; reduce = panel in end-state; mobile table scrolls horizontally, panel full-screen). No mascot.

**5-9. FixedSizeCutAnim / SlidingWindowAnim / RecursiveDescentAnim / StructureAwareAnim / SemanticShiftAnim (chunking) -- NEEDS-REDUCTION (net-new renderer; 5 distinct mechanisms is the scope risk).**
- All 5 brief `recipe-path=shared/js/lib/process-anim.js`. **This is infeasible as written:** the shipped `process-anim.js` builds ONLY the doc/chunks/vectors 3-column scene for `kind: split|embed|store`. It cannot render cut-lines, a sliding window, a separator-descent tree, structure boundaries, or similarity bars. Each of these is a different scene.
- **Scope cut (the reduction):** do NOT extend `process-anim.js` and do NOT ship 5 bespoke modules. Ship ONE net-new module `shared/js/lib/chunk-anim.js` (`init(rootEl, config) => { destroy() }`) that REUSES `timeline.js` as the rAF clock (same pattern `process-anim.js` uses) and takes `config.mode` in `{fixed|sliding|recursive|structure|semantic}` + `config.params` + `config.text`. One module, five render branches over a shared monospace-text-line substrate. This collapses 5 modules to 1 and 5 bespoke scenes to one parameterized scene. If even that is too much for the milestone: ship `fixed`, `sliding`, `recursive` first (the 3 that also ship runnable Python and are pure string-split, low risk) and defer `structure` + `semantic` (which depend on parser/embedding stubs and are the most fragile) to a follow-up -- the catalog panel degrades to algorithm-steps + Python prose for the deferred two.
- Host: `[data-slot="anim"]` inside the level-1 strategy panel from brief 4 (each strategy panel owns one anim host). Matches built `data-slot="anim"` convention.
- Data: each strategy's `anim:{ element, params }` block in the NET-NEW `data/chunking.js` (brief 4). Params per brief: fixed `{size:60}`; sliding `{size:50,overlap:15,step:35}`; recursive `{separators:["\n\n","\n"," ",""],size:70}`; structure `{boundaries:[...]}`; semantic `{sentences:[...],cos:[...],threshold}`. Text = a short stub string in the same data file.
- Invariants per brief: all transform-only (scaleY cut lines, translateX window) + opacity; IO+reduce gated (reduce = all cuts/windows drawn in end-state); mobile text wraps, cuts marked per line. No mascot. **Flag:** scaleY on a 1px cut line is transform-safe (compositor) -- OK. No stroke-dashoffset claimed here, good.

**10. embedding-materialize (embedding) -- BUILDABLE (reuse process-anim, scoped to one step).**
- Host: `[data-component="embedding-materialize"]` `[data-slot="anim"]`, drill-into via `drilldown-zoom.js` from the Embedding node. Brief's `data-src="../shared/data/worked-example.json"` is OK (this is exactly the scene `process-anim.js` + `worked-example.json` were built for).
- Owning module: `process-anim.js` (REUSE -- this is the one anim brief that maps cleanly onto the shipped renderer's `embed` step) + `timeline.js` clock + `drilldown-zoom.js` for the drill. No new module.
- Data: `worked-example.json` chunk `c1` + vector `v1` (dim 1536, stub values) -- exact existing contract (AtlasMD 7). REUSE.
- Invariants: clean (text -> tokens -> vector settle is transform/opacity + gated one-shot; IO+reduce snap; mobile vertical stack; explicit chunk path). No mascot. This is a named favourite (concept-design 2026-06-13) and is the lowest-risk anim.

**11. ann-topk-drill (vector-store) -- BUILDABLE (reuse camera; net-new small index scene).**
- Host: `[data-component="drilldown-host"]` with the built drill slots (`stage/crumbs/zoomout/panel`). Brief's lone `data-slot="svg"` + `data-src=worked-example.json` is scaffold-era notation.
- Owning module: `drilldown-zoom.js` (REUSE camera) for the per-node drill; the ~8-10-node index SVG + query-edge draw is NET-NEW glue. Closest existing analogue is `vector-map.js` (2D point layout + kNN link draw + gated stroke-dashoffset edges). RECOMMENDATION: generalize / reuse `vector-map.js`'s point+link machinery rather than writing a second 2D scene -- vector-store's "small index schematic + explicit query path to top-k" is a near-subset of `search`'s vector-space map. If reuse is clean, this is BUILDABLE with zero net-new module; if `vector-map.js` is too search-specific, a thin NET-NEW `index-map.js` shares its layout helpers.
- Data: NET-NEW default-export `data/vector-store.js` shaped like `search-vectors.js` (`{ query, k, plot, rings?, points:[{id,kind,cx,cy,cos,rank,topk?,metadata,deep}] }`) -- ~8-10 nodes + 1 query + top_k=3. Layout stubs, not real embeddings. Define now; CA/IE fill.
- Invariants: clean (edges = gated one-shot stroke-dashoffset; transform/opacity; IO+reduce snap; explicit query path always drawn; mobile node re-layout). No mascot.

**12. vector-space-map (search) -- BUILDABLE (already built).**
- Host: `[data-component="vector-map"]` `[data-slot="stage"]` + rail `[data-slot="rail"|"qvec"|"ranklist"]` (AtlasMD 3.8). Brief's `data-component="drilldown-host" data-slot="svg" data-src=worked-example.json` is scaffold-era; built host is `vector-map` over imported `search-vectors.js`.
- Owning module: `vector-map.js` (REUSE, shipped) + `drilldown-zoom.js` per-point. Page glue: `pages/search.js`. `mainPath=["pt-q","n1","n2","n3"]`.
- Data: `data/search-vectors.js` default export `{ query, k, plot, rings, points:[Point] }` (AtlasMD 7) -- NOT `worked-example.json`. Use the built contract. CA fills point text/deep VALUES.
- Invariants: clean (points settle by cosine via transform/opacity; top-k edges = gated one-shot stroke-dashoffset; cosine rings fade; every point drillable incl. far "why not top-k"; explicit query path; mobile scene compress). No mascot.

**13. context-assembly-drill (assemble-context) -- BUILDABLE (reuse camera + timeline; net-new fill renderer).**
- Host: `[data-component="context-assembly-drill"]`. For consistency with the built camera, prefer mounting INSIDE a `[data-component="drilldown-host"]` and using the brief's name as the level-1 panel content host, OR keep it standalone with its own `[data-slot="anim"]`. Recommend the drill-host route so the "semantic zoom into assemble node" is the shipped camera, not a bespoke zoom.
- Owning module: `drilldown-zoom.js` (REUSE) for the zoom; the template-fill + token-counter + over-budget-trim animation is NET-NEW `shared/js/lib/context-assembly.js` driven by `timeline.js` (steps: dedup -> order -> budget -> fill). Brief says "render shablona cherez timeline.js shagovo" -- correct; that is the reuse target.
- Data: NET-NEW `data/assemble-context.js` `{ template, chunks:[{id,text,score,source,tokens}], maxContextTokens:{min:500,max:4000,default}, order:["by-score"|"by-edges"] }`. The slider + order toggle are config-driven. Could reuse `worked-example.json` chunks for the chunk bodies but the token/score/budget fields are net-new, so a dedicated file is cleaner. Define now.
- Invariants: clean (template fills in turn = translate/opacity; token counter = mono text update; over-budget = opacity-to-0 + collapse height; collapse-height is a layout property -- **flag:** prefer animating `transform: scaleY` or `max-height` toggled instantly under reduce; do NOT tween `height`/`max-height` as the motion -- use opacity for the motion and snap the height. IO+reduce gated, reduce shows final prompt; mobile vertical stack). No mascot.

**14. grounded-answer-reveal (generation) -- BUILDABLE (reuse camera + timeline; net-new claim<->chunk renderer).**
- Host: `[data-component="grounded-answer-reveal"]`. Same recommendation as 13: zoom via `drilldown-zoom.js` into a claim<->chunk link; build the stepped reveal as NET-NEW `shared/js/lib/grounded-answer.js` on `timeline.js`.
- Owning module: `drilldown-zoom.js` (REUSE zoom) + `timeline.js` (REUSE clock) + NET-NEW renderer.
- Data: NET-NEW `data/generation.js` `{ contextChunks:[{id,source,text}], answer:"...[source:c1]...", claims:[{text, chunkId}], noContext:bool }`. The `[source]` markers in answer text map claims to chunks. Define now.
- Invariants: clean (each claim appears AFTER its source chunk highlights; link line = gated one-shot stroke-dashoffset; green grounding accent only on citation match -- earned/semantic green, allowed; no-context fallback shows no green; reduce = final with links drawn; mobile stack). No mascot. **Flag (good):** answer never pre-painted before grounding -- matches do-not #1 (no pre-light green).

**15. metric-at-k-eval-calculator (evaluation) -- BUILDABLE (net-new calculator module).**
- Host: `[data-component="metric-eval-calculator"]`. Optional drill into one golden question via `drilldown-zoom.js`.
- Owning module: NET-NEW `shared/js/lib/eval-calculator.js` (`init(rootEl,{ data }) => { destroy() }`): pure precision@k / recall@k compute over the golden sample + bar render. `drilldown-zoom.js` REUSE for the per-question drill (brief says so -- correct).
- Data: NET-NEW `data/evaluation.js` `{ golden:[{ q, relevant_ids:[], retrieved_ids:[] }], kRange:{min:1,max:10,default}, runs:["before","after"] }` (3-5 questions inlined). `retrieved_ids` per run for before/after. Define now.
- Invariants: clean (k slider recomputes bars via width/transform tween -- width is the allowed gated extra for progress-style fills; **flag:** bar width tween is the documented `width` exception, acceptable; keep it gated + snap under reduce). Top-k hits = earned green. Before/after = two side-by-side tracks. Mobile tracks stack. No mascot.

**16. rollout-checklist-cost-calculator (production) -- BUILDABLE (reuse progress + net-new calculator).**
- Host: `[data-component="rollout-cost-calculator"]`.
- Owning module: TWO concerns. (a) Checklist earned-progress = REUSE `progress.js` (the built earned-main-path strip + width fill) -- do NOT use `timeline.js`/`process-anim.js` for the strip as the brief loosely suggests; `progress.js` is the purpose-built earned-progress module (AtlasMD 3.7). (b) Cost/latency math + readout = NET-NEW `shared/js/lib/cost-calculator.js` (pure `cost = tok_in*price_in + tok_out*price_out`, monthly estimate). `drilldown-zoom.js` REUSE for per-item zoom.
- Data: NET-NEW `data/production.js` `{ checklist:[{ id, ru, en, done:false }], calc:{ tokensIn, tokensOut, priceInPerM, priceOutPerM, qps, cacheHitRate } }` (defaults). Define now.
- Invariants: clean (check lights green earned segment via width tween = the allowed gated extra; figures recompute via opacity/transform on update; IO+reduce snap; mobile stack). No mascot. **Flag (good):** checklist progress is EARNED by checking items -- matches do-not #1/#17.

### Invariant-violation scan (all 16)

No brief proposes a mascot or traveling dot (every brief explicitly states `NO mascot dot`). No brief proposes >2 zoom levels (catalog, payload-anatomy, and all drills are explicitly `<=2`). All briefs state IO-gating + reduced-motion snap-to-end over the same DOM. All chapters declare a no-JS fallback (cross-checked against the "Interactive schemes" table -- every row has a fallback column). Two notation/contract mismatches recur and are NOT invariant violations but MUST be corrected at implementation time: (a) `drilldown.js` should read `drilldown-zoom.js`; (b) `data-*-src` + `diagram-data.js` / `worked-example.json` should read the as-built default-export `data/*.js` per-page contracts. One motion caution: briefs 13's "collapse height" must NOT tween `height`/`max-height` as the motion (use opacity for motion, snap height) to stay within the transform/opacity (+ gated width) rule (do-not #5).

### Bonus showcase brief (payload-anatomy, #12 in the manuscript -- present as a 16th... actually 16 briefs counted; this is the 16th)

Note: the brief list header says "16 briefs across 12 chapters (chunking carries 6)". Counting: map-route, pipeline-flow, comparison, ChunkingStrategyCatalog + 5 chunk anims (6), embedding-materialize, ann-topk-drill, vector-space-map, context-assembly-drill, grounded-answer-reveal, metric-eval-calculator, rollout-cost-calculator, payload-anatomy-drill = 16. Covered above except payload-anatomy-drill:

**payload-anatomy-drill (payload-anatomy) -- BUILDABLE (reuse camera; net-new HTML/SVG payload scene).**
- Host: `[data-component="payload-anatomy-drill"]`. Brief `recipe-path=drilldown.js` -> read `drilldown-zoom.js`.
- Owning module: `drilldown-zoom.js` (REUSE camera, exactly 2 levels: whole 4-turn payload -> one block). The rendered payload map (17 highlightable blocks over a 4-turn JSON) is NET-NEW glue `pages/payload-anatomy.js` supplying `renderPanel` (the Function + RAG-role + chapter-link card per block). The payload itself is rendered HTML (annotated `<pre>`/`<code>` with per-block hooks), not SVG -- acceptable: the camera is DOM-agnostic (inline-grow strategy), inline SVG is required for DIAGRAMS, not for a code-block map. No diagram lib needed.
- Data: NET-NEW `data/payload-anatomy.js` `{ turns:[...4 JSON turns...], blocks:[{ id, fields:[], function:{ru,en}, ragRole:{ru,en}, chapter:href, highlight:[selectors] }] }` -- the 17-row block map above IS the source. Define now; CA fills the table VALUES.
- Invariants: clean (reveal transform/opacity only; IO+reduce snap; `<=2` levels; mobile reflow; no-JS = annotated table + labelled JSON). No mascot.

### Summary table

| Brief | Verdict | Owning module (reuse \| new) | Data source |
|-------|---------|------------------------------|-------------|
| map-route | BUILDABLE (built) | `map-route.js` (reuse) | `nav.json` (existing) |
| pipeline-flow | BUILDABLE (built) | `pipeline.js`+`drilldown-zoom.js`+`progress.js` (reuse) | `data/what-rag.js` (existing) |
| comparison | BUILDABLE (built) | `comparison.js` (reuse) | `data/why-rag.js` (existing; NOT worked-example.json) |
| ChunkingStrategyCatalog | BUILDABLE | `drilldown-zoom.js` (reuse) + page glue (new) | `data/chunking.js` (NEW) |
| FixedSizeCutAnim | NEEDS-REDUCTION | `chunk-anim.js` mode=fixed (NEW; reuse `timeline.js`) | `data/chunking.js` strategy.anim (NEW) |
| SlidingWindowAnim | NEEDS-REDUCTION | `chunk-anim.js` mode=sliding (NEW) | `data/chunking.js` (NEW) |
| RecursiveDescentAnim | NEEDS-REDUCTION | `chunk-anim.js` mode=recursive (NEW) | `data/chunking.js` (NEW) |
| StructureAwareAnim | NEEDS-REDUCTION (defer-candidate) | `chunk-anim.js` mode=structure (NEW) | `data/chunking.js` (NEW) |
| SemanticShiftAnim | NEEDS-REDUCTION (defer-candidate) | `chunk-anim.js` mode=semantic (NEW) | `data/chunking.js` (NEW) |
| embedding-materialize | BUILDABLE | `process-anim.js`+`timeline.js`+`drilldown-zoom.js` (reuse) | `worked-example.json` c1/v1 (existing) |
| ann-topk-drill | BUILDABLE | `drilldown-zoom.js` (reuse) + `vector-map.js` layout (reuse, or thin `index-map.js` new) | `data/vector-store.js` (NEW) |
| vector-space-map | BUILDABLE (built) | `vector-map.js`+`drilldown-zoom.js` (reuse) | `data/search-vectors.js` (existing; NOT worked-example.json) |
| context-assembly-drill | BUILDABLE | `drilldown-zoom.js`+`timeline.js` (reuse) + `context-assembly.js` (NEW) | `data/assemble-context.js` (NEW) |
| grounded-answer-reveal | BUILDABLE | `drilldown-zoom.js`+`timeline.js` (reuse) + `grounded-answer.js` (NEW) | `data/generation.js` (NEW) |
| metric-at-k-eval-calculator | BUILDABLE | `eval-calculator.js` (NEW) + `drilldown-zoom.js` (reuse) | `data/evaluation.js` (NEW) |
| rollout-checklist-cost-calculator | BUILDABLE | `progress.js` (reuse) + `cost-calculator.js` (NEW) + `drilldown-zoom.js` (reuse) | `data/production.js` (NEW) |
| payload-anatomy-drill | BUILDABLE | `drilldown-zoom.js` (reuse) + page glue (new) | `data/payload-anatomy.js` (NEW) |

### Verdict counts

- BUILDABLE: 11 (5 already shipped: map-route, pipeline-flow, comparison, vector-space-map, embedding-materialize-via-existing-renderer; 6 new-wiring-on-reused-modules: ChunkingStrategyCatalog, ann-topk-drill, context-assembly-drill, grounded-answer-reveal, metric-at-k-eval-calculator, rollout-checklist-cost-calculator, payload-anatomy-drill).
- NEEDS-REDUCTION: 5 (the 5 chunk anims -- collapse to ONE `chunk-anim.js` with a `mode` switch; defer structure+semantic if the milestone is tight).
- INFEASIBLE: 0.

(Note: the BUILDABLE bullet over-lists by one in its parenthetical -- authoritative count is 11 BUILDABLE / 5 NEEDS-REDUCTION / 0 INFEASIBLE = 16 total, per the summary table.)

### Net-new modules + data the site task must budget for

- New lib modules: `chunk-anim.js` (covers 5 chunk anims), `context-assembly.js`, `grounded-answer.js`, `eval-calculator.js`, `cost-calculator.js`; optional `index-map.js` (only if `vector-map.js` won't generalize). = 5-6 net-new modules.
- New data files (default-export `data/*.js`, NOT JSON, to match the as-built pattern): `chunking.js`, `vector-store.js`, `assemble-context.js`, `generation.js`, `evaluation.js`, `production.js`, `payload-anatomy.js`. = 7 net-new data files. Each must carry an in-file `_schema`/shape header per `.claude/rules/site-architecture.md` section 7.
- Reused as-is: `drilldown-zoom.js`, `timeline.js`, `process-anim.js`, `progress.js`, `vector-map.js`, `map-route.js`, `pipeline.js`, `comparison.js`, `a11y.js`, `i18n.js`, `dom.js`, `plate.js`, `chapter-state.js`; existing data `nav.json`, `what-rag.js`, `why-rag.js`, `search-vectors.js`, `worked-example.json`.
- The scaffold `drilldown.js` (generic C4) stays UNUSED by these briefs; no brief should target it (use `drilldown-zoom.js`).
