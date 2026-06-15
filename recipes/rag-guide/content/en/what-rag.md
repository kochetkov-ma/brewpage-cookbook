<!--
  EN translation of the RU-first manuscript: what-rag.
  ASCII punctuation only. Cite every technical claim inline.
  Strategy A: the RU md is the single source; this EN md is its translation.
-->

# What RAG is

## The problem: the model does not know your data

You ask an ordinary LLM: "How many vacation days does an employee on probation get under our policy?" The model answers confidently - and wrong. It has never seen your internal policy, so it just generates plausible text. The fix is not to "ask better" but to hand the model your actual document BEFORE it answers.

That is exactly what RAG does: it finds the relevant fragments of your data and mixes them into the request, after which the model answers from them. The architecture was introduced by Lewis et al., 2020 ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). Here is the same call, now with retrieval - a minimal working RAG on real APIs:

```python
# Minimal RAG: retrieval first, then generation over what was found.
from anthropic import Anthropic
from openai import OpenAI
import numpy as np

oa = OpenAI()        # OPENAI_API_KEY: compute the embeddings
anthropic = Anthropic()  # ANTHROPIC_API_KEY: generation

# Corpus = your chunks (simplified here to a list of strings).
chunks = [
    "Vacation during probation: 2 days for each month worked.",
    "Business trips are arranged through the portal no later than 3 days in advance.",
    "Remote work is agreed with your manager separately for each week.",
]

def embed(texts):
    r = oa.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in r.data])  # dim depends on the model (e.g. 1536 for text-embedding-3-small) -- see the OpenAI Embeddings guide

chunk_vecs = embed(chunks)
query = "How many vacation days are there during probation?"
q_vec = embed([query])[0]

# Cosine similarity -> top-1 chunk (RETRIEVAL).
cos = chunk_vecs @ q_vec / (np.linalg.norm(chunk_vecs, axis=1) * np.linalg.norm(q_vec))
top = chunks[int(np.argmax(cos))]

# AUGMENTED + GENERATION: slot what was found into the prompt.
resp = anthropic.messages.create(
    model="claude-sonnet-4-6",  # current model -- see the models overview
    max_tokens=300,
    messages=[{
        "role": "user",
        "content": f"Answer only from the context. Context:\n{top}\n\nQuestion: {query}",
    }],
)
print(resp.content[0].text)  # the answer rests on YOUR chunk
```

All three steps are visible here: retrieval (cosine -> top chunk), augmented (the chunk in the prompt), generation (the model's answer). The call shapes are real: OpenAI Embeddings ([developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)) and Anthropic Messages ([platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)).

## What RAG is: three words

RAG = **R**etrieval-**A**ugmented **G**eneration. Three words - three steps:

- **Retrieval** - find the right pieces of text in your data (in the example above, cosine over the chunk vectors).
- **Augmented** - add what you found straight into the request to the model (we inserted `top` into `content`).
- **Generation** - the model formulates an answer based on those pieces, not on memory.

This is exactly the definition from the original work: the retriever selects documents, the generator conditions the answer on them (Lewis et al., 2020, [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)).

## What RAG does not do

RAG is often confused with neighbouring things. The clear boundaries:

- **It is not fine-tuning.** Fine-tuning changes the model's weights on your examples; RAG does not touch the weights at all - it only feeds data at request time. Fine-tuning teaches the model FORM and style, RAG gives it FACTS (see the distinction in OpenAI's fine-tuning guide, [developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)). To add a new document in RAG it is enough to index it, not to retrain the model.
- **It is not just a large context window.** "Let us stuff all the documents into the prompt" does not scale and even hurts: models use information in the middle of a long context less well - the "lost in the middle" effect (Liu et al., 2023, [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)). RAG feeds the model only a small top-k of relevant pieces.
- **It is not the model's memory.** The model remembers nothing between requests; "memory" in RAG lives in your external index, not inside the model.

## Anatomy of the pipeline

Those three words unfold into a pipeline of several stages. This is the map of the whole recipe; each stage is a separate chapter of the route:

1. **chunking** - cut documents into retrieval-sized chunks.
2. **embedding** - each chunk -> a fixed-length vector (dim 1536).
3. **vector-store** - vectors into an index ready for nearest-neighbour search.
4. **search** - query -> query vector -> top-k nearest chunks.
5. **assemble-context** - pack the top-k into a single prompt within the token budget.
6. **generation** - the model writes a grounded answer from the assembled context.

Below is an interactive diagram of this pipeline: a horizontal row of stage nodes from left to right. The route spine draws once when it enters the screen; each node can be opened with a semantic zoom (a C4-style camera moves inside the stage), where its composition unfolds. The progress bar is earned as you walk the main path. With JS off, the page shows the same chain of stages as a static inline-SVG schematic plus the full text.

<!-- IE-BRIEF: element=pipeline-flow | purpose=Показать RAG как упорядоченный конвейер стадий и дать читателю drill (semantic zoom) внутрь любой стадии, чтобы увидеть ее состав и ее главу | inputs=shared/data/what-rag.js (default-export { order:string[], nodes:{[id]:{idx,anchor,label,hint,crumb,panel,deep?}} }, импортится в page glue, НЕ через data-*-src); mainPath = order; активный язык из i18n.js (RU) | host=[data-component="pipeline"] s data-slot="flow" (3 stacked paths edge-base/edge-draw/edge-prog) + data-slot="nodes" (ряд node-card стадий), внутри drill-camera stage [data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/pipeline.js + drilldown-zoom.js + progress.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/what-rag.js; inline SVG node/edge hooks .node/.edge | animation=spine (путь между узлами) рисуется один раз через gated stroke-dashoffset; узлы проявляются по очереди (opacity/translate); drill = transform-scale камеры в узел, не modal по умолчанию; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM; mobile 390/320 - узлы переходят в вертикальный stack; NO mascot/traveling dot -->

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- OpenAI. Embeddings guide. [developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- OpenAI. Fine-tuning guide (RAG vs fine-tuning contrast). [developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)
- Anthropic. Messages API. [platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)

## Try it yourself

- Open (drill, semantic zoom) the **embedding** node on the pipeline diagram and see what it unfolds into - it is the same stage as the embedding chapter.
- Walk the main path from the **chunking** node to **generation** and bring the progress bar to the end - the node order matches the chapter order of the route.
- Compare the **search** and **assemble-context** stages by drilling: the first finds the top-k, the second packs it into a single prompt.

## What is next

The next stop is **why-rag**: why an ordinary model cannot cope (training cutoff, no private data) and why RAG is cheaper and fresher than fine-tuning.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
