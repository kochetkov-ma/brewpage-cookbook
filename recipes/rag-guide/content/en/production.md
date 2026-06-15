<!--
  EN translation of the RU-first production core section. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
  PRIVACY: access/security only at user-facing level; NO platform internals.
-->

# Production launch: a live service for real users

## The problem you came with

The RAG prototype works on your laptop. But real users bring what the demo did not: every request costs money and seconds, questions come in bursts at peak load, data goes stale within a week, and different people are supposed to see different documents. Without control over this, "works on the demo" turns into "expensive, slow, and someone else's data is leaking".

This is the top of the route - production: wire all the links (chunking -> embedding -> store -> retrieve -> assemble -> generation) into a service and keep it in shape. Four things are decided here: speed and cost of a request, monitoring and data updates, security and access, gradual improvement by metrics. Below is a working skeleton of a service with these hooks.

## The solution: a production endpoint with cost control

Here is a working endpoint in Python (FastAPI) that assembles the whole pipeline and adds production hooks: a cache, latency measurement, cost accounting, an access filter.

```python
# pip install fastapi uvicorn cachetools
import time, hashlib
from cachetools import TTLCache
from fastapi import FastAPI, Depends

app = FastAPI()
# Answer cache: the same question does not pay twice. TTL - so we do not serve stale content.
answer_cache = TTLCache(maxsize=10_000, ttl=3600)

# Price per 1M tokens - check against the vendor pricing before you compute.
PRICE_IN_PER_MTOK = 3.00   # USD/1M -- replace with your vendor rate (see the Anthropic pricing page)
PRICE_OUT_PER_MTOK = 15.00  # USD/1M -- replace with your vendor rate (see the Anthropic pricing page)

def cost_usd(tokens_in, tokens_out):
    return (tokens_in / 1e6) * PRICE_IN_PER_MTOK + (tokens_out / 1e6) * PRICE_OUT_PER_MTOK

@app.post("/ask")
def ask(question: str, user=Depends(current_user)):
    t0 = time.perf_counter()
    key = hashlib.sha256(f"{user.tenant}:{question}".encode()).hexdigest()
    if key in answer_cache:
        return {"answer": answer_cache[key], "cached": True}

    # Access: retrieve sees only the documents permitted to this user.
    chunks = retrieve(question, allowed_filter=user.acl_filter)
    prompt, used = assemble_context(question, chunks)
    answer, tokens_in, tokens_out = generate_with_usage(prompt)

    answer_cache[key] = answer
    latency_ms = (time.perf_counter() - t0) * 1000
    log_metrics(  # goes to your monitoring, not into the user's answer
        user=user.id, latency_ms=latency_ms,
        cost=cost_usd(tokens_in, tokens_out), n_chunks=len(chunks),
    )
    return {"answer": answer, "cached": False, "latency_ms": round(latency_ms)}
```

## Speed and cost of a request

Every request pays for input tokens (instruction + context + question) and output tokens (the answer). The price is computed by the vendor's per-token rate - for example, the public [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) sets a separate price for input and output tokens. From here come two levers: less context (the token budget from the context-assembly chapter) and a shorter answer.

The third lever is the **cache**. Identical questions should not pay for generation again; the `TTLCache` above returns a ready answer, while the TTL keeps the cache from serving stale content after a data update. Separately, a cache of the query embedding removes a repeat call to the embedder on the same text.

Latency consists of two parts: the index search (usually milliseconds, see ANN in the vector-store chapter) and generation (the longest part). Streaming from the generation chapter does not reduce the total time, but it sharply cuts the perceived wait - the user sees the first tokens right away.

## Monitoring and data updates

What you do not measure in production will break silently. Log per request: latency, cost, the number of returned pieces, whether there was a cache hit, and (where the user consented) their rating of the answer. These ratings are the raw fuel for the golden set from the evaluation chapter: bad answers turn into new test cases.

Data goes stale. When a document changes, it must be re-chunked, re-embedded, and updated in the index - incrementally, only what changed, not the whole corpus. After an update, flush the cache related to it, otherwise the user gets an old answer for a new document.

## Security and access

In a multi-user service, different people are supposed to see different documents. The key principle: access is checked at the retrieve step, not after generation. If the model saw a piece in the context, assume the user has already gained access to it - trimming that in the answer is too late. So in `ask`, retrieve receives the user's `allowed_filter` and physically does not return pieces they are not entitled to.

In practice this is a metadata filter at search time (see metadata filters in the chunking and vector-store chapters): each piece has a tenant/section/access level, and the query is restricted to what is permitted. The vector-database vendor usually provides metadata filtering for this - see, for example, [Pinecone metadata filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata) or the equivalent in your database. Separately: keep API keys and access tokens in secrets, not in code and not in logs, and do not put sensitive data into the prompt template, which may go into the vendor's logs.

If you publish a recipe or demo on a hosting service, follow the platform's rules at the user-facing level (what may be posted, how to report a violation) - without assumptions about its internal workings.

## Rollout checklist

- [ ] The token budget is bounded, the context is not bloated (assemble-context).
- [ ] A cache of answers and embeddings with a reasonable TTL; cache flush on data update.
- [ ] Latency, cost, the number of pieces, and the cache hit are logged per request.
- [ ] Incremental index update when documents change.
- [ ] Access is checked at the retrieve step via a metadata filter, not afterward.
- [ ] Keys and tokens are in secrets, not in code, not in logs, not in the prompt.
- [ ] A golden set and regular evaluation runs before/after each edit (evaluation).
- [ ] The "This is not in the documents" fallback works for cases without context (generation).

## Where RAG is heading

RAG is developing fast: hybrid search (meaning + keywords), cross-encoder reranking, agentic schemes with several retrieve steps, and graph-RAG over connected entities. But the basic pipeline - retrieve, augment, generate from [Lewis et al., 2020](https://arxiv.org/abs/2005.11401) - remains the same skeleton onto which these improvements are grafted. Having mastered this route, you can read any new extension as a variation of familiar stages.

<!-- IE-BRIEF: element=rollout-checklist-cost-calculator | purpose=дать читателю (1) интерактивный rollout-checklist с earned-progress и (2) калькулятор стоимости и latency на его собственных числах | inputs=NET-NEW default-export shared/data/production.js { checklist:[{id, ru, en, done:false}], calc:{tokensIn, tokensOut, priceInPerM, priceOutPerM, qps, cacheHitRate} } (defaults) | host=[data-component="rollout-cost-calculator"]; optional drill в пункт через [data-component="drilldown-host"] | recipe-path=checklist earned-progress = REUSE shared/js/lib/progress.js (purpose-built earned-main-path strip + width fill; НЕ timeline.js/process-anim.js); cost/latency math + readout = NET-NEW shared/js/lib/cost-calculator.js (чистый расчет cost=tok_in*price_in+tok_out*price_out + месячная оценка); drilldown-zoom.js для зума в пункт checklista | animation=отметка пункта checklista зажигает зеленый earned-segment progress-strip (width tween); при изменении чисел цифры стоимости/latency пересчитываются (opacity/transform tween на обновлении); transform/opacity и gated width only, IO-gated, reduced-motion сразу показывает итог; mobile 390/320 checklist и калькулятор stack; NO mascot dot -->

In the static (no-JS) view, the host shows the whole checklist as a prose list (as above) and a parsed example of computing the cost of one request with the addends labelled.

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Anthropic. Pricing (price per input/output tokens). <https://platform.claude.com/docs/en/about-claude/pricing>
- Pinecone. Metadata filtering (access via metadata). <https://docs.pinecone.io/guides/index-data/indexing-overview#metadata>

## Try it yourself

- In rollout-cost-calculator enter your own tokens_in/tokens_out and the vendor's rate: see the price of one request, then add QPS and get a monthly estimate.
- Raise the cache-hit rate in the calculator and watch the cost fall - the cache is a direct lever on the economics.
- Check the checklist items one by one and watch the earned-progress fill: an unclosed item about checking access at the retrieve step is a blocker for going to production.

## What is next

This is the top of the route - you have walked all of RAG from stating the problem to a live service. Go back to the **start** map to see the whole path you covered, or open the illustrative **payload-anatomy**, where one real request is taken apart field by field across all the stages.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
