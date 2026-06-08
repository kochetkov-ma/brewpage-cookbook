# RAG Guide

> First recipe of the **BrewPage Cookbook**. Status: DRAFT. Started 2026-05-21.
> Plan: [`.claude/features/specs/T-RECIPE-RAG-GUIDE.md`](../.claude/features/specs/T-RECIPE-RAG-GUIDE.md).

## TL;DR

Retrieval-augmented generation gives a language model access to information it was not trained on. Done well, it removes the staleness problem and grounds answers in the corpus you actually trust. Done poorly, it adds latency, cost and a new class of subtle bugs.

This guide is an opinionated, hands-on walkthrough. Each chapter is short, each diagram is drillable, and every code sample runs. You will leave with a working mental model of a production RAG pipeline and a checklist you can apply to your own.

## Chapters

| # | Title | Status |
|---|---|---|
| 1 | What RAG actually is | TODO |
| 2 | Anatomy of a retrieval pipeline | TODO |
| 3 | Choosing a vector store | TODO |
| 4 | Chunking strategies | TODO |
| 5 | Embeddings 101 | TODO |
| 6 | Retrieval at query time | TODO |
| 7 | Prompt assembly | TODO |
| 8 | Evaluation | TODO |
| 9 | Failure modes | TODO |
| 10 | Caching and cost | TODO |
| 11 | Multi-tenant and privacy | TODO |
| 12 | Streaming and UX | TODO |
| 13 | Tooling landscape | TODO |
| 14 | Production rollout checklist | TODO |
| 15 | Where RAG is going next | TODO |

---

## Chapter 1 -- What RAG actually is

> Draft skeleton. Lead with the problem (a model's frozen knowledge), introduce the retrieval shortcut, define RAG narrowly, then say what it is not.

A language model's knowledge has a hard edge -- whatever was in its training corpus, frozen at the cut-off date. RAG is the simplest known way to push that edge outward without retraining: fetch relevant text at query time and stuff it into the prompt.

That is the whole idea. Everything else is plumbing: how you fetch, what counts as relevant, how much you can afford to stuff, and what breaks when you stuff the wrong thing.

What RAG is **not**:

- Not fine-tuning. Fine-tuning changes the model's weights. RAG changes the prompt.
- Not a memory system. There is no persistent state in the model -- every query rebuilds the context from scratch.
- Not a search engine wrapper. A search engine returns links for humans; RAG returns text for a model.

---

## Chapter 2 -- Anatomy of a retrieval pipeline

> Draft skeleton. Walk the seven-stage pipeline once, end to end, with a single concrete example. Then drill into each stage in later chapters.

Every production RAG system, no matter how exotic, has seven stages:

1. **Ingest** -- pull source documents from wherever they live (files, APIs, databases, crawls).
2. **Chunk** -- split documents into retrieval-sized pieces. The wrong chunk size silently destroys quality.
3. **Embed** -- convert each chunk into a vector with an embedding model.
4. **Store** -- write the vectors (and the chunk text, and metadata) into a vector store.
5. **Retrieve** -- at query time, embed the query and pull the top-K nearest chunks.
6. **Rerank** -- optionally re-score the top-K with a heavier model, drop the worst.
7. **Generate** -- assemble the prompt, send to the model, return the answer.

The first four happen offline (or at ingest time). The last three happen on every query. Most cost lives in steps 3-4 (offline) and 7 (online). Most quality wins live in steps 2 and 6.

---

## Chapter 3 -- Choosing a vector store

> Draft skeleton. Trade-offs: managed vs. self-hosted, hybrid search, filtering, ANN algorithm choice, scale ceiling. End with a decision tree.

---

## Chapter 4 -- Chunking strategies

> Draft skeleton. Fixed-size, recursive, semantic, structural (markdown headings, code AST). How to evaluate -- proxies and ground truth. Pitfalls: cross-chunk references, hidden context.

> **Interactive target**: live chunking sandbox -- slider for size + overlap, side-by-side preview, quality score.

---

## Chapter 5 -- Embeddings 101

> Draft skeleton. Model selection, dimensionality, vector arithmetic intuition, drift between model versions, cost and rate-limit accounting.

> **Interactive target**: 2D embedding visualiser of a small corpus.

---

## Chapter 6 -- Retrieval at query time

> Draft skeleton. Top-K, reranking strategies (cross-encoder, LLM-as-reranker), hybrid (dense + BM25), metadata filtering, query rewriting.

---

## Chapter 7 -- Prompt assembly

> Draft skeleton. Order of retrieved chunks, deduping, context window budgeting, role tagging, instruction placement, hard limits per provider.

---

## Chapter 8 -- Evaluation

> Draft skeleton. Golden sets, retrieval metrics (recall@K, MRR, nDCG), end-to-end metrics, LLM-as-judge, cost of evaluation, evaluation drift.

---

## Chapter 9 -- Failure modes

> Draft skeleton. The big four: hallucination despite retrieval, context stuffing degrading quality, retrieval misses on rare phrasing, stale or duplicated chunks. Each with its fingerprint and the fix.

> **Interactive target**: "spot the retrieval bug" mini-game -- short snippets, multiple choice.

---

## Chapter 10 -- Caching and cost

> Draft skeleton. What to cache (embeddings, retrieval results, prompts, completions). Invalidation rules. Cost math worked end to end on a realistic corpus.

---

## Chapter 11 -- Multi-tenant and privacy

> Draft skeleton. Per-tenant indices vs. metadata filters. PII scrubbing at ingest vs. at retrieval. Cross-tenant leakage classes and how to test for them.

---

## Chapter 12 -- Streaming and UX

> Draft skeleton. Token streaming, retrieval transparency (showing sources), latency budgets, perceived speed.

---

## Chapter 13 -- Tooling landscape

> Draft skeleton. A curated, opinionated map: vector stores, embedding providers, evaluation tooling, orchestration frameworks. No exhaustive lists; just the picks that survive a year.

---

## Chapter 14 -- Production rollout checklist

> Draft skeleton. Day-one observability, kill switches, content-source auditability, cost alarms, on-call ergonomics. A literal checklist.

---

## Chapter 15 -- Where RAG is going next

> Draft skeleton. Long-context vs. retrieval trade-off, native tool-use as alternative, agentic retrieval loops, structured retrieval (graphs, SQL), the open question of evaluation.

---

## Sources (to be filled)

> Cite as you write. Prefer primary sources (papers, official docs) over secondary commentary.

## Try it yourself

> At publish time, link to a "fork this recipe" pattern -- a minimal repo template that lets readers run the pipeline locally.

## Next steps

> Forward-link to the next recipe in the cookbook once it exists.

---

**About this recipe**

- Part of the [BrewPage Cookbook](../README.md).
- Published live on [brewpage.app](https://brewpage.app) once shipped.
- Source contract for the BrewPage API: [`brewpage-openapi`](https://github.com/kochetkov-ma/brewpage-openapi).
