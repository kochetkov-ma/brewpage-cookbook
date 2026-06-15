<!--
  EN translation of the RU-first embedding chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Embedding: turning a fragment into a vector

## The problem

You have fragments - pieces of text from the previous chapter. The user's question is text too, but in different words: "how to get my money back" versus the fragment "refund policy". String comparison does not work here: they have almost no words in common, yet the meaning is the same. You need a way to search by meaning, not by letters.

The solution is the embedding: turn each fragment into a vector, a numeric code of its meaning, where the closeness of vectors reflects the closeness of meaning ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). This is the second step of the pipeline: after the document is cut into fragments, each fragment is turned into a vector once, and from there the vectors go into the index.

Here is the whole step at once - the real API call that turns a list of fragments into a list of vectors:

```python
# pip install openai
from openai import OpenAI

client = OpenAI()

chunks = [
    "The refund policy: a product may be returned within 30 days.",
    "The warranty on electronics is 12 months from the date of purchase.",
    "City delivery takes one business day.",
]

resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=chunks,
)

# one vector per chunk, strictly one-to-one
vectors = [item.embedding for item in resp.data]
print(len(vectors), "vectors")         # 3
print(len(vectors[0]), "components")   # 1536
```

After this you have three vectors of length 1536 - one per fragment. There is no need to compare the text directly anymore: all further work runs on numbers.

## What a vector is here

A vector is an ordered list of numbers of fixed length `dim`. The embedding model maps text into a point in a `dim`-dimensional space so that texts of similar meaning end up near each other. For example, OpenAI's `text-embedding-3-small` produces vectors of length 1536 ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). That is exactly why every vector in `worked-example.json` carries `dim: 1536`.

The dimensionality is not a random number: the model sets it, and it is the same for all vectors of one model. You cannot mix vectors from different models - they live in different spaces, and comparing them is meaningless.

Important: the numbers in the `values` field of the live example are short stubs for the mockup (three values per vector), not a real embedding. A real vector has all 1536 components; showing them in full is pointless, so the animation shows only the fact "fragment -> vector", not the raw numbers.

<!-- IE-BRIEF: element=embedding-materialize | purpose=показать механизм chunk -> вектор: исходный текст разбивается на токены, затем числа вектора (dim 1536) "материализуются" / оседают на месте, демонстрируя что меняется представление а не текст | inputs=один chunk-text из worked-example.json (chunk c1) + его вектор-stub v1 (dim 1536, values - заглушка) | host=data-component="embedding-materialize" data-slot="anim" data-src="../shared/data/worked-example.json" | recipe-path=shared/js/lib/process-anim.js (renderer одного embed-шага в [data-slot=anim]); drill через drilldown-zoom.js в node Embedding | animation=текст -> tokens -> вектор оседает; transform/opacity only, gated one-shot; IO-gated + prefers-reduced-motion snaps to end state над тем же DOM; mobile 390/320 stack вертикально; NO mascot dot; query/chunk path нарисован явно -->

## Why vector closeness = closeness of meaning

Once fragments have become vectors, "similarity" is measured geometrically - most often via cosine similarity, the cosine of the angle between vectors ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). The smaller the angle, the closer the meaning. The cosine value lies in the range from -1 to 1; for text embeddings, in practice the range of roughly 0..1 applies, where 1 is a match of meaning and around 0 means the texts are about different things.

Why 0..1 rather than the full range from -1 to 1: text embeddings are usually normalized by length (L2 normalization) - each vector is brought to unit length ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). For normalized vectors the cosine coincides with the dot product, so ranking by dot product is the same as ranking by cosine, but cheaper: you do not need to divide by the norms, which already equal one.

Here is how the cosine similarity of two vectors is computed by hand - without libraries, so the formula is visible:

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

query_vec = client.embeddings.create(
    model="text-embedding-3-small",
    input="how to get a refund for a purchase",
).data[0].embedding

# closeness of the query to each chunk
scores = [(i, cosine(query_vec, v)) for i, v in enumerate(vectors)]
scores.sort(key=lambda t: t[1], reverse=True)
print(scores[0])   # chunk 0 (refund policy) - the closest
```

The fragment about refunds will turn out to be closest to the query "how to get my money back", even though they have almost no key words in common. It is exactly this closeness that lets the retrieve step pull the top-k fragments nearest to the query vector without comparing texts letter by letter.

The models that learn such sentence representations are described in the work of [Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084): they specifically train the encoder so that cosine closeness of vectors corresponds to the semantic closeness of sentences. This is what distinguishes the modern transformer approach based on Sentence-BERT from classic methods like bag-of-words or TF-IDF: the classics count word overlap, while the transformer encodes the meaning of a whole sentence into a single vector.

## Closeness metrics: not only cosine

Cosine is not the only measure. In practice three appear:

- **Cosine similarity** (cosine) - the cosine of the angle, ignores vector length.
- **Dot product** - the sum of component-wise products; accounts for both angle and length.
- **Euclidean distance** (Euclidean / L2, often squared - squared L2) - the geometric distance between points; less means closer.

An important fact: for vectors normalized to unit length, all three metrics rank neighbours identically - the order of the top-k does not change, only the numeric value differs. Vector databases usually let you choose any of these metrics when creating the index ([FAISS metric types](https://github.com/facebookresearch/faiss/wiki), [pgvector](https://github.com/pgvector/pgvector)), and this is already a bridge to the next chapter on the vector store, where the metric is set at the index level.

## Sparse, dense, and hybrid vectors

Embeddings from a transformer are **dense** vectors: all 1536 components are filled with numbers, and each encodes part of the meaning ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084)). They contrast with **sparse** representations like TF-IDF or BM25, where the vector is a set of weights over the vocabulary and almost all components are zero. Sparse search still wins on exact term matches and rare tokens (SKUs, names, codes), where the literal word matters ([Robertson & Zaragoza, 2009, BM25](https://nlp.stanford.edu/IR-book/)). That is why in practice people often use **hybrid retrieval**: sparse (BM25) and dense are combined to catch both exact terms and meaning.

## Extra: what else embeddings can do

- **Dimensionality truncation (Matryoshka, MRL).** Some models are trained so that the vector can be cut to a shorter length with almost no quality loss; in OpenAI this is the `dimensions` parameter on `text-embedding-3` ([Kusupati et al., 2022, Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)).
- **Asymmetric query and document embeddings.** Instruction models (E5, GTE) encode the query and the document differently - for example by prepending `query:` and `passage:` prefixes ([Wang et al., 2022, E5](https://arxiv.org/abs/2212.03533)).
- **Multilingual embeddings.** The same meaning in different languages lands in nearby points of one space - a query in Russian finds a document in English ([Reimers & Gurevych, 2020, Multilingual Sentence-BERT](https://arxiv.org/abs/2004.09813)).
- **Quantization.** Vectors can be stored as int8 or even in binary form - this sharply shrinks the index at the cost of a small loss in recall; more in the vector store chapter.

## Model choice, dimensionality, drift

The embedding model is a choice that directly determines search quality:

- **Dimensionality.** A larger `dim` usually means more accuracy, but more expensive storage and slower search. `text-embedding-3-small` gives 1536 components; some models let you trim the dimensionality to save resources ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)).
- **Language and domain.** The model must understand the language and terminology of your documents. General models are good broadly; a narrow domain sometimes requires a specially trained model.
- **Model drift.** If you change the embedding model, all the old vectors in the index become incompatible with the new ones - they must be recomputed entirely. Vectors from different models cannot be compared with one another.

The main rule: once you have chosen a model, turn both fragments and queries into vectors with that same model. Otherwise the query and the fragments end up in different spaces, and their closeness stops meaning anything (this is the same rule about reusing one model: one choice - one index).

## Link to the live example

Step `s2` (kind=embed) in `worked-example.json` takes the same three fragments c1..c3 from the splitting stage and produces three vectors v1..v3. The link is explicit: each vector has a `chunkId` field pointing to its fragment (v1 -> c1, v2 -> c2, v3 -> c3). This is the one-to-one mapping: one fragment yields exactly one vector.

After step `s3` (store) the vectors go into the index - that is the next stage of the pipeline (vector-store), which the next chapter covers separately.

## Sources

- OpenAI. Embeddings guide (text-embedding-3-small, dim=1536, cosine similarity, L2 normalization to unit length, the dimensions parameter). <https://developers.openai.com/api/docs/guides/embeddings>
- Reimers & Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. <https://arxiv.org/abs/1908.10084>
- Robertson & Zaragoza, 2009. The Probabilistic Relevance Framework: BM25 and Beyond. <https://nlp.stanford.edu/IR-book/>
- Kusupati et al., 2022. Matryoshka Representation Learning. <https://arxiv.org/abs/2205.13147>
- Wang et al., 2022. Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5). <https://arxiv.org/abs/2212.03533>
- Reimers & Gurevych, 2020. Making Monolingual Sentence Embeddings Multilingual using Knowledge Distillation. <https://arxiv.org/abs/2004.09813>
- FAISS. Metric types and indexes wiki. <https://github.com/facebookresearch/faiss/wiki>
- pgvector. Open-source vector similarity search for PostgreSQL (cosine / inner product / L2). <https://github.com/pgvector/pgvector>

## Try it yourself

- Open the embedding-materialize interaction on the Embedding node (semantic zoom inside) and run the step animation: watch how the text of fragment c1 splits into tokens and then settles into vector v1. Note: the representation changes (text -> vector), not the text itself.
- In `worked-example.json` walk through vectors v1..v3 and match each to its fragment via the `chunkId` field. Confirm that the mapping is strictly one-to-one (v1 -> c1, v2 -> c2, v3 -> c3).
- Take the cosine code above and compute the closeness of one query to each of the three fragments; check that the fragment closest in meaning gets the highest score, even with no shared words.

## What is next

The vectors are ready - next they need to be stored somewhere and searched quickly for nearest neighbours. The next stop: **vector-store** (the vector database and nearest-neighbour search).

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
