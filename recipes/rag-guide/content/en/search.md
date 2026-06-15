<!--
  EN translation of the RU-first search chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Search: searching by meaning at query time

## The problem

The user asks: "how to get my money back for a purchase". But in your documents the relevant fragment is called "refund policy" - not a single word "money" or "back" appears in it. A full-text keyword search will miss here: there are almost no shared words, yet the answer lies in exactly this fragment.

The solution is semantic search: turn the query into a vector with the same model used for the fragments, and search the index for the top-k fragments (top-k - the few closest, usually 3..10) nearest to it by cosine closeness (cosine - the cosine of the angle between vectors; the closer it is to 1, the closer the meaning) ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). This step gathers all the previous ones into one live request:

```python
# pip install pinecone openai
from pinecone import Pinecone
from openai import OpenAI

oai = OpenAI()
index = Pinecone().Index("docs")

def retrieve(query, k=3):
    # 1. query -> query vector (the same model as the chunks)
    qvec = oai.embeddings.create(
        model="text-embedding-3-small", input=query
    ).data[0].embedding
    # 2. top-k nearest by cosine
    res = index.query(vector=qvec, top_k=k, include_metadata=True)
    return [(m.id, round(m.score, 3), m.metadata["text"])
            for m in res.matches]

for cid, score, text in retrieve("kak vernut' den'gi za pokupku"):
    print(cid, score, text[:40])
# the refund chunk comes back first - with no words shared with the query
```

The fragment "refund policy" comes back first, even though none of the query's words appear in it - because meanings are compared, not strings.

## Search by meaning, not by words

A classic keyword search finds documents where the same words as in the query appear. It misses when people write about the same thing in different words - synonyms, paraphrases, another language. Semantic search solves this problem: it compares vectors, and the closeness of vectors reflects the closeness of meaning, not the overlap of words ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084)).

<!-- IE-BRIEF: element=vector-space-map | purpose=показать поиск по смыслу как геометрию: точка-запрос и точки-chunki оседают по cosine-близости, top-k связаны явными ребрами; каждая точка drillable - далекие точки открывают панель "почему не в top-k", есть keyword-miss callout | inputs=shared/data/search-vectors.js (default-export { query, k, plot, rings, points:[Point] }, импортируется в page glue, НЕ worked-example.json): query point + ~10 chunk points (координаты спроецированы из cosine), top_k (по умолчанию 3), cosine rings | host=[data-component="vector-map"] с data-slot="stage" (plot SVG) + rail data-slot="rail"/"qvec"/"ranklist" (embed readout + kNN ranklist + keyword-miss callout) | recipe-path=shared/js/lib/vector-map.js (раскладка 2D + cosine rings + kNN links) + drilldown-zoom.js (semantic zoom в точку); page glue shared/js/pages/search.js; mainPath=["pt-q","n1","n2","n3"] | animation=точки оседают на свои места по cosine (transform/opacity only), затем ребра top-k рисуются один раз (gated stroke-dashoffset), cosine rings проявляются; IO-gated + prefers-reduced-motion snaps to end state; mobile 390/320 сжатие scene; NO mascot dot; query path (запрос -> top-k) всегда нарисован явно -->

## Query -> query vector

The first step of live search is to turn the query text into a vector with the same embedding model that was used for the fragments ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). This is critical: if you embed the query with one model and the fragments with another, they end up in different spaces, and the cosine closeness between them means nothing. In the code above this is step 1 in the `retrieve` function.

## Top-k nearest by cosine

The query vector goes into the index, and the database returns the **top-k** fragments nearest by cosine closeness - usually k in the range 3..10. A larger k gives more material but also more noise; a smaller k is more precise but risks missing the needed piece. On a large archive, nearest-neighbour search relies on an ANN index (HNSW) so as not to scan all vectors in turn ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)).

## Reranking and hybrid search

The top-k from vector search is a good first selection, but it can be refined:

- **Reranking.** The first pass (bi-encoder) quickly selects candidates; the second pass with a cross-encoder more precisely re-scores each (query, fragment) pair and changes the order. A cross-encoder is more expensive, so it is applied only to already selected candidates ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084), the section on bi- vs cross-encoder).
- **Hybrid search.** Semantic vector search is combined with classic keyword search: vectors catch meaning, while lexical search catches exact terms, SKUs, names, where the match of the word itself matters ([Pinecone, hybrid search](https://docs.pinecone.io/guides/search/hybrid-search)).

These are refinements, not a replacement: the basic semantic top-k already works, and reranking and hybrid improve it where extra precision is needed.

## What the model sees

After the search, the model gets not the whole archive but only the top-k found pieces. This is both faster and cheaper, but it shifts the responsibility onto search: if the needed fragment did not make it into the top-k, the model simply will not see the answer. So the order and completeness of the top-k matter - research shows that models use information buried in the middle of a long context less well, so the most relevant should be placed nearer the edges ([Liu et al., 2023, Lost in the Middle](https://arxiv.org/abs/2307.03172)). Exactly how to pack these pieces into the prompt is the topic of the next chapters.

## Sources

- OpenAI. Embeddings guide (query vector, cosine similarity). <https://developers.openai.com/api/docs/guides/embeddings>
- Reimers & Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks (bi- vs cross-encoder). <https://arxiv.org/abs/1908.10084>
- Malkov & Yashunin, 2016. Efficient and robust ANN search using Hierarchical Navigable Small World graphs. <https://arxiv.org/abs/1603.09320>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Pinecone. Hybrid search guide. <https://docs.pinecone.io/guides/search/hybrid-search>

## Try it yourself

- Open the vector-space-map interaction: find the query point and walk the drawn edges to the top-k. Drill (semantic zoom) into a distant point and read the "why not in top-k" panel.
- Take the `retrieve` function above and change `k` from 3 to 1 and to 10: see how the set and order of returned fragments change.
- Pose the query in synonyms, without the words from the needed fragment (for example "reimbursement of funds" instead of "refund"): check that semantic search still finds the right fragment - this is exactly the keyword miss it cures.

## What is next

The top-k is found - next it needs to be carefully packed into a single prompt to the model. The next stop: **assemble-context** (context assembly: the template, the token budget, the order of pieces).

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
