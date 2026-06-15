<!--
  EN translation of the RU-first evaluation core section. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Evaluation: measuring retrieval accuracy and answer quality

## The problem you came with

You changed the chunk size, added reranking, and "feel" that it got better. But next week another question started being answered worse - and you did not notice, because you checked a couple of questions by hand. Without measurement you cannot tell an improvement from a regression: every edit is a blind bet.

This is the evaluation stage: turning "seems better" into a number. We measure two things separately - **was the needed piece found** (retrieval accuracy) and **is the answer good** (generation quality) - and run them on a fixed set of questions before and after each edit. Below is a working eval-harness over a golden set.

## The solution: an eval harness over a golden set

Here is a working harness in Python. The golden set is a list of questions, for each of which the ids of the relevant pieces are known in advance. The harness runs retrieve and computes precision@k and recall@k.

```python
golden = [
    {
        "q": "How do I return a product?",
        "relevant": {"policy-12", "policy-13"},   # ids of chunks with the answer
    },
    {
        "q": "How many days do I have to return it?",
        "relevant": {"policy-13"},
    },
    # ...50+ questions: the more, the more stable the metric
]

def precision_recall_at_k(retrieved_ids, relevant, k):
    """retrieved_ids: top-k ids from retrieve, by descending score.
       relevant: the set of ids of the genuinely needed chunks."""
    top_k = retrieved_ids[:k]
    hits = sum(1 for cid in top_k if cid in relevant)
    precision = hits / k                      # share of hits among the returned k
    recall = hits / len(relevant)             # share found out of all needed
    return precision, recall

def evaluate(retriever, golden, k=5):
    p_sum = r_sum = 0.0
    for item in golden:
        ids = retriever(item["q"])            # your retrieve -> list of ids
        p, r = precision_recall_at_k(ids, item["relevant"], k)
        p_sum += p
        r_sum += r
    n = len(golden)
    return {"precision@k": p_sum / n, "recall@k": r_sum / n, "k": k, "n": n}

# Compare before/after an edit on the same set:
before = evaluate(retriever_v1, golden, k=5)
after  = evaluate(retriever_v2, golden, k=5)
print(before, after)
```

The main rule: the `golden` set is fixed, and both versions (`v1`, `v2`) are run on the same one. Only that way is the comparison honest.

## Retrieval accuracy

Retrieve is an information-retrieval task, and its metrics are standard. **Precision@k** = the fraction of genuinely relevant among the first k returned; **recall@k** = the fraction found out of all existing relevant ones. Both are defined in classic IR ([Manning, Raghavan, Schutze, Introduction to Information Retrieval, ch. 8](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html)).

The distinction matters in practice. High precision@5 but low recall@5 means: what you returned was on point, but some needed pieces did not reach the top-5 (increase k or improve the embedding). High recall but low precision: the needed is present but drowns in junk, which eats the token budget at the context-assembly stage. That is exactly why the metrics are computed as a pair, not as one.

## Answer quality

Accurate retrieve does not yet guarantee a good answer: the model may correctly find pieces but answer incompletely, off-topic, or with an added fabrication. Answer quality is measured by another group of metrics.

For RAG, the [RAGAS framework (Es et al., 2023)](https://arxiv.org/abs/2309.15217) formalizes them: it proposes **faithfulness** (how grounded the answer is on the returned context - a measure against the hallucinations from the generation chapter), **answer relevance** (whether the answer responds to the actual question), and **context relevance/precision** (how much the returned context relates to the question). RAGAS evaluates these aspects automatically, without manually labelling every answer.

```python
# pip install ragas datasets
from ragas import evaluate as ragas_evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from datasets import Dataset

ds = Dataset.from_dict({
    "question":     [it["q"] for it in samples],
    "answer":       [it["answer"] for it in samples],     # generation output
    "contexts":     [it["contexts"] for it in samples],   # chunks shown to the model
    "ground_truth": [it["truth"] for it in samples],      # reference from golden
})
report = ragas_evaluate(ds, metrics=[faithfulness, answer_relevancy, context_precision])
print(report)
```

## The golden set of questions

The golden set is the foundation of all evaluation: a list of real questions with labelled answers/relevant pieces. The rules: take questions from real traffic (not made-up ones), cover different topics and formats, and do not change the set between measurements - otherwise `before` and `after` are not comparable. The size - from several dozen; the larger, the less noise in the average.

## Feedback -> metrics

User ratings (thumbs up/down, "did not help") are a raw signal. Turn it into a metric: review the answers marked as bad and add their questions to the golden set with the correct labelling. That way the set grows precisely on the cases where the system errs, and the next edit is checked on them.

## Typical failures and their traces

When a metric drops, the cause is visible by which one fell:

- **Low recall@k** - the needed piece was not returned at all. Trace: the problem is in retrieve (embedding, chunking, a small k). See the embedding/chunking chapters.
- **High recall, low faithfulness** - the piece was there, but the answer is not grounded (a fabrication). Trace: a weak generation instruction. See the generation chapter.
- **The needed piece is in the context but ignored** - often it ended up in the middle of the window (lost-in-the-middle, [Liu et al., 2023](https://arxiv.org/abs/2307.03172)). Trace: the order at the context-assembly stage.

<!-- IE-BRIEF: element=metric-at-k-eval-calculator | purpose=дать читателю почувствовать как precision@k и recall@k меняются при изменении k на реальном золотом sample, и сравнить before/after | inputs=NET-NEW default-export shared/data/evaluation.js { golden:[{q, relevant_ids[], retrieved_ids[]}] (3-5 вопросов вшиты, retrieved_ids per run для before/after), kRange:{min:1,max:10,default}, runs:["before","after"] }; slider k; тумблер before/after | host=[data-component="metric-eval-calculator"]; optional drill в один вопрос через [data-component="drilldown-host"] | recipe-path=NET-NEW shared/js/lib/eval-calculator.js (init(rootEl,{data})=>{destroy()}; чистый расчет precision@k/recall@k + bar render) + drilldown-zoom.js для зума в один вопрос (видно какие из top-k попали в relevant) | animation=при движении слайдера k столбцы precision@k и recall@k пересчитываются (width/transform tween); попадания в top-k подсвечиваются зеленым акцентом как earned; before/after - две дорожки рядом; transform/opacity и gated width only, IO-gated, reduced-motion сразу показывает итоговые столбцы; mobile 390/320 дорожки stack; NO mascot dot -->

In the static (no-JS) view, the host shows the parsed golden table: the question, its relevant ids, the returned top-k, and the computed precision@k/recall@k for several values of k.

## Sources

- Manning, Raghavan, Schutze, 2008. Introduction to Information Retrieval, ch. 8 (precision/recall@k). <https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html>
- Es et al., 2023. RAGAS: Automated Evaluation of Retrieval Augmented Generation. <https://arxiv.org/abs/2309.15217>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>

## Try it yourself

- In metric-eval-calculator move the k slider from 1 to 10 on one question and watch how recall@k grows (more needed pieces are caught) while precision@k more often falls - this is exactly the trade-off.
- Switch the before/after toggle and compare the two tracks on the same golden set: only a fixed set makes the comparison honest.
- Find a question with high recall but low precision, and think about how the extra pieces will hit the token budget at the context-assembly stage.

## What is next

The system is measured and improving. The last stop is the **production** chapter: how to wire all the links into a live service and keep it in shape - speed, cost, monitoring, access.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
