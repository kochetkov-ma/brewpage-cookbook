<!--
  EN translation of the RU-first vector-store chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Vector store: storing vectors and finding the nearest

## The problem

You have vectors - one per fragment from the previous chapter. When a query arrives, you need to find a few fragments closest in meaning to the query vector. You could compare the query against every vector in turn - and with a thousand fragments that works. But with a million fragments, scanning each one on every query becomes too slow.

The solution is a vector store: a specialized storage that holds vectors and can quickly find nearest neighbours without comparing the query against the whole archive. Here is what the store step plus search look like using a vector-database client:

```python
# pip install pinecone openai
from pinecone import Pinecone
from openai import OpenAI

oai = OpenAI()
pc = Pinecone()
index = pc.Index("docs")

# store: put the vector + metadata + chunk text
def embed(text):
    return oai.embeddings.create(
        model="text-embedding-3-small", input=text
    ).data[0].embedding

index.upsert(vectors=[
    {"id": "c1", "values": embed("Politika vozvrata: vernut' tovar mozhno v 30 dnej."),
     "metadata": {"source": "faq.md", "section": "vozvrat", "text": "..."}},
    {"id": "c2", "values": embed("Garantiya na elektroniku 12 mesyacev."),
     "metadata": {"source": "faq.md", "section": "garantiya", "text": "..."}},
])

# search: top-k nearest to the query vector
res = index.query(
    vector=embed("kak vernut' den'gi za pokupku"),
    top_k=3,
    include_metadata=True,
    filter={"section": "vozvrat"},   # metadata filter
)
for m in res.matches:
    print(m.id, round(m.score, 3), m.metadata["section"])
```

The database stores the vectors itself, searches for the nearest itself, and returns the top-k together with their cosine closeness - you do not have to write a scan by hand.

## Why a separate database

A vector database solves two tasks at once: it **stores** millions of vectors and **searches** among them for the nearest by meaning. An ordinary database searches by exact equality or by keywords; a vector database searches by geometric closeness in `dim`-dimensional space, that is, by meaning ([Pinecone, vector database basics](https://docs.pinecone.io/guides/get-started/overview)).

This is exactly what was missing at the search step: fast semantic search over the whole archive without letter-by-letter comparison.

## Approximate nearest neighbour search (ANN)

Exact nearest-neighbour search (kNN) compares the query against all vectors - this guarantees the correct answer but grows linearly with the archive size. With millions of fragments people use **approximate** search (ANN, approximate nearest neighbour): it almost always finds the same neighbours but many times faster, sacrificing a small fraction of accuracy for speed.

A common ANN algorithm is **HNSW** (Hierarchical Navigable Small World): a multi-layer graph through which the search "hops" from distant nodes to the nearest in a logarithmic number of steps instead of scanning the whole set ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)). Other systems build indexes on top of libraries like [FAISS](https://arxiv.org/abs/1702.08734), which is purpose-built for fast search over millions of vectors.

<!-- IE-BRIEF: element=ann-topk-drill | purpose=показать как из вектора запроса находятся top-k ближайших соседей в небольшом индексе: query path нарисован явно от узла-запроса к выбранным соседям, drill (semantic zoom) в выбранный узел показывает его metadata + cosine | inputs=NET-NEW default-export shared/data/vector-store.js (по образцу search-vectors.js: { query, k, plot, rings?, points:[{id,kind,cx,cy,cos,rank,topk?,metadata,deep}] }, ~8-10 узлов + 1 query + top_k=3; layout stubs, не реальные embeddingi); импортируется в page glue | host=[data-component="drilldown-host"] с data-slot="stage" (index SVG) + data-slot="crumbs" + data-slot="zoomout" + data-slot="panel" | recipe-path=shared/js/lib/drilldown-zoom.js (shipped semantic-zoom камера внутрь узла, не modal по умолчанию) + reuse vector-map.js point+link машинерии для ~8-10-node index SVG и query-edge draw (или тонкий NET-NEW index-map.js, если vector-map.js слишком search-специфичен) | animation=ребра от запроса к top-k рисуются один раз (gated stroke-dashoffset), ближайшие узлы подсвечиваются; transform/opacity only; IO-gated + prefers-reduced-motion snaps to end; mobile 390/320 перекомпоновка узлов; NO mascot dot; query path всегда нарисован -->

## Top-k and metadata filters

In a search you ask not for the single closest vector but for the **top-k** - several nearest ones (often k=3..10). This gives the model a few spare pieces in case the closest one does not fully cover the question.

Together with the vector, the database stores **metadata** - source, section, date, access rights. Metadata filters narrow the search to the needed subset before searching for the nearest: for example, only documents from this department or only what is fresher than a certain date ([Pinecone, metadata filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata)). In the code above this is `filter={"section": "vozvrat"}`.

## Scale: millions of fragments without a scan

It is exactly the ANN index that makes semantic search practical on a large archive. Instead of comparing the query against each of millions of vectors, the HNSW graph leads to the answer in a logarithmic number of steps ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)). So from 100000+ fragments the top-5 nearest are fetched in milliseconds, not in a full pass over the database.

## When you do not need a vector database

A vector database is not always the right choice:

- **Small corpus.** With a few hundred or a thousand fragments, an exact in-memory scan (kNN) is simple, fast enough, and needs no separate infrastructure.
- **Exact match matters more than meaning.** If you need to search by exact codes, SKUs, or IDs - an ordinary database or a full-text index is more precise and cheaper.
- **You already have a suitable database.** Some ordinary DBMSs support vector search as an extension (for example pgvector for PostgreSQL, [pgvector](https://github.com/pgvector/pgvector)) - then a separate specialized database may be redundant.

The rule: take a vector database when the corpus is large AND the search is genuinely by meaning. Otherwise it adds complexity without payoff.

## Sources

- Malkov & Yashunin, 2016. Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs. <https://arxiv.org/abs/1603.09320>
- Johnson, Douze & Jegou, 2017. Billion-scale similarity search with GPUs (FAISS). <https://arxiv.org/abs/1702.08734>
- Pinecone. Database overview + metadata filtering. <https://docs.pinecone.io/guides/get-started/overview>
- pgvector. Open-source vector similarity search for PostgreSQL. <https://github.com/pgvector/pgvector>

## Try it yourself

- Open the ann-topk-drill interaction: find the query node and walk the drawn query path to its top-k neighbours. Drill (semantic zoom) into one of the selected neighbours and look at its `cosine` and `metadata`.
- Compare what comes back with and without a metadata filter: in the code above remove `filter={"section": "vozvrat"}` and see how the top-k set changes.
- Estimate whether a vector database fits your case: how many fragments do you have, and do you search by meaning or by exact match - check against the section "When you do not need a vector database".

## What is next

The vectors are in the index and the nearest are found quickly - next you need to turn the user's query into a vector and assemble the top-k on a live request. The next stop: **search** (searching by meaning at query time).

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
