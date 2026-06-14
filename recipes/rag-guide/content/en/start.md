<!--
  EN translation of the RU-first manuscript: start (the trailhead / overview).
  The landing IS this chapter (Atlas MAP).
  ASCII punctuation only. Cite every technical claim inline.
  Strategy A: the RU md is the single source; this EN md is its translation.
-->

# RAG Guide: build retrieval-augmented generation step by step

## The problem you came with

You have an LLM and a folder of documents: manuals, tickets, a knowledge base. You ask the model a question about those documents and get back a confident but invented answer. The model never saw your data during training and cannot see it now - that is a fundamental limitation, not a prompt bug.

RAG (retrieval-augmented generation) solves exactly this: before generating, we find the relevant fragments of your documents and mix them into the request. The term and the core architecture were introduced by Lewis et al., 2020, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)): a retriever fetches documents, a generator writes the answer grounded on them.

This recipe is a working path, not a survey. By the top of the route you will have a working model of the pipeline: from a document, through vectors and search, to a grounded answer with links to its sources.

Here is a minimal request to the model WITHOUT RAG - this is exactly how a confident fabrication is born when the needed facts were not in training:

```python
# Bez RAG: model otvechaet iz pamyati, bez dostupa k vashim dokumentam.
from anthropic import Anthropic

client = Anthropic()  # ANTHROPIC_API_KEY iz okruzheniya

resp = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=512,
    messages=[
        {"role": "user", "content": "Skolko dnej otpuska u sotrudnika na ispytatelnom sroke?"}
    ],
)
print(resp.content[0].text)  # pravdopodobno, no ne fakt iz VASHEJ politiki
```

The shape of the call is the real Anthropic Messages API ([docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)). The whole rest of the recipe adds a retrieval step before this call so that your context lands in `content`.

## What you get at the end of the path

Your own assistant that answers strictly from your documents instead of guessing: it finds the right fragments, slips them into the request, cites the source, and honestly says "this is not in the documents" when there is no answer. You will walk every link: chunking, embedding, the vector store, search, context assembly, generation, quality evaluation, and shipping to production.

## How to read this map

The map reads left to right, from 0% to 100%: a route of stops where each one is a separate chapter. You need to know nothing in advance; terms are introduced as you go. Any stop can be opened and read on its own - that is the main interaction of this page.

Below is the interactive route map itself. The rust-colored route line runs through 11 flag-stops; clicking a flag opens its field note (a short blurb + points + an example) right there, without taking you off the page. The progress bar at the top fills as you open stops - this is earned progress, not decoration. Exactly one note is open at any moment.

<!-- IE-BRIEF: element=map-route | purpose=Показать весь маршрут RAG как упорядоченный список остановок и дать читателю открыть любую главу на месте; field note каждой остановки = trailhead этой главы | inputs=shared/data/nav.json (routeD, stops[] s ru.{label,blurb,pts,ex}, ui.ru); активный язык из i18n.js (RU default); single-open state (открыта одна заметка) | host=[data-component="trail"] s data-slot="svg" (route SVG) + data-slot="note" (field note) + data-slot="progress" (заработанная полоса); nav.json фетчится в page glue (stripMeta), НЕ через data-*-src | recipe-path=shared/js/lib/map-route.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/landing.js; SVG pins sampled on routeD via getPointAtLength (no drift) | animation=флажки проявляются по очереди вдоль routeD (opacity/translate), полоса прогресса растет по width при открытии остановки; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM; mobile 390/320 - карта скроллится по горизонтали, заметка под ней; NO mascot/traveling dot -->

## The route: 11 stops

This is the full route in walking order. Each stop is a separate chapter; the first three (`start`, `what-rag`, `why-rag`) set the foundation, then the pipeline itself begins.

1. **start** - this page: the problem and the map of the whole path.
2. **what-rag** - what RAG (retrieval-augmented generation) is and what it is not.
3. **why-rag** - why you need it: fresh and private data, fewer fabrications, cheaper than fine-tuning.
4. **chunking** - cut large documents into retrieval-sized chunks.
5. **embedding** - turn each chunk into a fixed-length vector.
6. **vector-store** - store vectors in an index and search nearest neighbours (ANN), the classic being HNSW.
7. **search** - for a query, find the top-k chunks closest in meaning.
8. **assemble-context** - pack the results into a single prompt within the token budget.
9. **generation** - the model writes an answer grounded on the context, not on memory.
10. **evaluation** - systematically measure retrieval accuracy and answer quality.
11. **production** - wire it all into a service: speed, cost, monitoring, access.

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Anthropic. Messages API. [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)

(Technical sources for each stage live in the corresponding chapters: chunking, embedding, vector-store, search, generation, evaluation.)

## Try it yourself

- Open the **what-rag** stop on the map: read its field note (`blurb` + `pts` from `nav.json`) and see how RAG unfolds into three steps.
- Walk all 11 flags one by one and bring the progress bar to 100% - each opened stop = an earned step of the route (the `id` field in `nav.json`).
- Compare the **why-rag** and **production** stops: the first says why you need RAG, the last how to bring it to real users.

## What is next

The next stop is **what-rag**: we take apart the three words in the name (retrieve, augment, generate) and clearly separate RAG from fine-tuning and from simply expanding the context.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
