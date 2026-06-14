<!--
  EN translation of the RU-first manuscript: why-rag.
  ASCII punctuation only. Cite every technical claim inline.
  Strategy A: the RU md is the single source; this EN md is its translation.
-->

# Why you need RAG

## The problem: the model goes stale and does not know yours

An ordinary model is trained up to some date (the training cutoff) and frozen after that: about events and documents later than that date it knows nothing. For example, the Anthropic models overview explicitly states the training-data cutoff date for each model ([docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models)). On top of that, it has never seen your private documents. The result is two sources of error: stale facts and fabrications about your data.

RAG removes both in one move: the needed fact is fed at request time from your fresh index. Compare two paths of the same question - without RAG and with RAG:

```python
# Same question, two paths. Track A: no context. Track B: with retrieval.
from anthropic import Anthropic

client = Anthropic()  # ANTHROPIC_API_KEY
question = "Po nashej politike: skolko dnej otpuska na ispytatelnom sroke?"

def ask(context=None):
    if context:
        prompt = (
            "Otvechaj tolko po kontekstu. Esli otveta net v kontekste, "
            f"skazhi 'etogo net v dokumentah'.\nKontekst:\n{context}\n\nVopros: {question}"
        )
    else:
        prompt = question
    r = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text

# Track A (no RAG): answer from memory - may be a fabrication about YOUR policy.
print("BEZ RAG:", ask())

# Track B (with RAG): retrieval supplies a real chunk, the answer is grounded.
retrieved = "Otpusk na ispytatelnom sroke: 2 dnya za kazhdyj otrabotannyj mesyac."
print("S RAG: ", ask(context=retrieved))
```

Track B never writes the answer until the context is substituted in: retrieval first, then generation. The call shape is the real Anthropic Messages API ([docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)).

## Why an ordinary model cannot cope

Two reasons, both structural rather than "you asked badly":

- **Training cutoff.** After the cutoff date the model does not know anything new; updating its knowledge means touching the model again. The cutoff dates are published in the models overview ([docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models)).
- **No private data.** Your internal documents were not and will not be in the public training corpus, so any answer about them without retrieval is a guess.

## Fresh and private data without retraining

RAG keeps knowledge OUTSIDE the model - in an external index you manage yourself. Adding or updating a fact = re-indexing one document, not retraining the model. That is exactly why Lewis et al., 2020 separated parametric memory (the model's weights) from non-parametric memory (the external document index): the index can be changed without retraining ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). In practice: you update a line in a file and the assistant immediately answers from the new version.

## Fewer fabricated facts: grounding + citations

When the model answers from the supplied context, the answer is grounded on concrete fragments, and you can attach a link to the source chunk for every claim. This was the main result of the original work: RAG gives more specific and factual answers than a purely parametric model (Lewis et al., 2020, [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). The only catch is to supply just a few of the most relevant pieces and put the important ones nearer the edges of the prompt: models use what is buried in the middle of a long context less well (Liu et al., 2023, [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)).

## Cost: RAG versus fine-tuning

Fine-tuning requires collecting a dataset, running training, and repeating that at every data update - a separate cycle of work and expense ([platform.openai.com/docs/guides/fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)). RAG, by contrast, adds one retrieval step before an ordinary model call and indexes new documents incrementally. When the task is to give the model FACTS that change often, RAG is usually cheaper and faster to maintain; fine-tuning stays for tasks of FORM and style. (This is an engineering trade-off, not an absolute: do the math on your own volumes - see the production chapter.)

Below is an interactive two-track trace of one request. **Track A (without RAG):** the request goes straight to the model -> a stale or fabricated answer. **Track B (with RAG):** the request first fills the context box with the retrieved chunks, and only AFTER that does the grounded answer appear. The main path is Track B; some nodes open by drill (semantic-zoom camera) into detail. The grounded green answer is never drawn before retrieval is complete - that is the didactic meaning of the motion. With JS off, both tracks are shown as a static inline-SVG schematic with the full text.

<!-- IE-BRIEF: element=comparison | purpose=Наглядно противопоставить путь без RAG (stale/hallucinated) и с RAG (retrieval заполняет контекст ПЕРЕД заземленным ответом), чтобы показать, что grounding зависит от retrieval | inputs=shared/data/why-rag.js (default-export { question:{ru,en}, note, tracks:[A,B], takeaways:[], drill:{<key>:detail} }, импортится в page glue, НЕ worked-example.json); две дорожки A/B с фиксированным вопросом; активный язык из i18n.js (RU) | host=[data-component="comparison"] s data-slot="tracks" (две .track секции .cmp-node; context-узел = .cmp-node--grounding) + data-slot="takeaways" + data-slot="drill-layer" (modal камера) | recipe-path=shared/js/lib/comparison.js (собственная modal камера внутри модуля) (init(rootEl, config) => {destroy()}); page glue shared/js/pages/why-rag.js; mainPath = Track B ["B-q","B-embed","B-index","B-context","B-out"]; inline SVG .node/.edge | animation=Track B: чанки въезжают в .cmp-node--grounding контекст (translate/opacity) по очереди, затем answer-block проявляется (opacity) - строго ПОСЛЕ заполнения контекста, никогда до; Track A сразу дает ответ без retrieval-шага; drill = transform-scale камеры в узел; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM (контекст уже полон, ответ уже виден); mobile 390/320 - дорожки в вертикальный stack; NO mascot/traveling dot -->

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- Anthropic. Models overview (model families, training cutoff). [docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models)
- Anthropic. Messages API. [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)
- OpenAI. Fine-tuning guide (cost/lifecycle contrast). [platform.openai.com/docs/guides/fine-tuning](https://platform.openai.com/docs/guides/fine-tuning)

## Try it yourself

- Run Track B and watch how the context node (.cmp-node--grounding) fills with chunks BEFORE the grounded answer appears (Track B in `data/why-rag.js`).
- Compare Track A and Track B on one question: note that without retrieval the answer appears immediately and without a link to a source.
- Drill into the context node in Track B and see exactly which chunks made it into the prompt and in what order.

## What is next

The next stop is **chunking**: how to cut large documents into retrieval-sized chunks, where exactly to cut, and how to choose the size and overlap.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
