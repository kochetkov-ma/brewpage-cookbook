<!--
  EN translation of the RU-first generation core section. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Generation: the model writes a grounded answer

## The problem you came with

You assembled the perfect context (the context-assembly chapter), sent it to the model - and it still invented a detail that is not in the documents. Or it answered correctly but without a link to the source, and the user cannot verify it. Or, for a question whose answer simply is not in the data, it confidently produced a fabrication instead of an honest "I do not know".

This is the generation stage: the model reads the assembled context and writes the answer. The mere fact that the context is good does not guarantee that the answer will be based on it. Grounding is set by instructions and verified by citations. Below is the working path to an answer that responds only from the context, cites the fragments, and honestly admits gaps.

The full field-by-field view of the request and the answer is in the [Payload anatomy](payload-anatomy.html) chapter; here we work with the generation output.

## The solution: a generation call with grounding

Here is a working call in Python via the Anthropic SDK. The prompt was assembled at the previous stage; what matters here are three things: a firm system instruction, signed sources in the context, and parsing the citations from the answer.

```python
# pip install anthropic
import re
from anthropic import Anthropic

client = Anthropic()  # key in ANTHROPIC_API_KEY

SYSTEM = (
    "You answer only from the context provided. "
    "After each statement, add a reference to the source in the form [source]. "
    "If the answer is not in the context, reply: 'This is not in the documents.' "
    "Do not add facts from your own memory."
)

def generate(prompt: str):
    resp = client.messages.create(
        model="claude-sonnet-4-6",  # current model -- see the models overview
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = resp.content[0].text
    # Parse the [source] citations out of the answer to check grounding.
    cited = re.findall(r"\[([^\]]+)\]", answer)
    return answer, cited

def generate_stream(prompt: str):
    # Streaming: tokens arrive as they are generated - less waiting.
    with client.messages.stream(
        model="claude-sonnet-4-6",  # current model -- see the models overview
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
```

The model and the call shape follow the [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages); check the model name at launch against the [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). Any vendor with a chat API will do - what matters is not the names but the three techniques below.

## Instructions: answer only from the context

Generation in RAG is governed by the system instruction. Without an explicit "answer only from the context", the model freely adds what it "knows" from training - and that is exactly where plausible but false facts are born. The very meaning of RAG by [Lewis et al., 2020](https://arxiv.org/abs/2005.11401) is that the answer rests on the retrieved documents, not on the model's parametric memory alone.

The instruction in `SYSTEM` above does three things: it limits the source (only the context), requires citations (`[source]`), and sets a fallback for a gap ("This is not in the documents"). This is the skeleton of grounding.

## Citing sources in the answer

A citation is not decoration but a verification mechanism. When every claim is marked with `[source]`, you can match it against a concrete piece and confirm that the answer really rests on the data, not on a fabrication. That is exactly why, at the context-assembly stage, every piece was signed with its source: a signature in the context -> a link in the answer -> a grounding check.

The `generate` function above pulls out all `[source]` from the answer. If the model mentioned a source that was not in the supplied context, that is a signal of a citation hallucination - such an answer must be rejected or re-requested.

## Fighting fabrications (grounding/hallucination)

A hallucination is a confident, fluently phrased claim not backed by a source. This is a known and persistent problem of generative models: the survey [Ji et al., 2023, "Survey of Hallucination in Natural Language Generation"](https://arxiv.org/abs/2202.03629) systematizes the kinds of hallucinations and notes that models tend to produce text not grounded on the input data.

RAG reduces hallucinations by slipping in verifiable context, but it does not remove them by itself. Three measures together: (1) a firm "only from the context" instruction; (2) mandatory `[source]` citations with a check that the source was really in the context; (3) an explicit fallback. If there is no answer in the context, the correct result is an honest "This is not in the documents", not a plausible fabrication. This refusal is a feature, not a bug.

## Tone, format, and streaming

Tone and format are set in the same instruction: "answer briefly as a list", "return JSON with the fields answer and sources". Format is part of the contract with your UI.

Streaming improves perception: instead of waiting for the whole answer, tokens arrive as they are generated, and the user sees text right away. The Anthropic Messages API delivers the stream via server-sent events ([Anthropic streaming](https://platform.claude.com/docs/en/api/messages-streaming)); the `generate_stream` function above does exactly this. Important for grounding: do not show the green "ready" answer in the UI as final until generation has finished and the citations are verified - partial text may still append a source.

<!-- IE-BRIEF: element=grounded-answer-reveal | purpose=показать что каждое утверждение ответа построено ИЗ конкретного чанка и заземлено на нем; ответ появляется только по мере завершения заземления, не pre-painted | inputs=NET-NEW default-export shared/data/generation.js { contextChunks:[{id,source,text}], answer:"...[source:c1]...", claims:[{text,chunkId}], noContext:bool } ([source] маркеры в ответе связывают claims с чанками) | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); grounded-answer-reveal монтируется как level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped камера, zoom в связь утверждение<->chunk) + NET-NEW shared/js/lib/grounded-answer.js на timeline.js (пошаговое построение ответа по цитатам) | animation=каждое утверждение ответа проявляется после того как его chunk-источник подсветился (линия связи рисуется gated stroke-dashoffset); зеленый акцент заземления загорается только когда цитата сопоставлена; no-context кейс показывает fallback "Этого нет в документах" без зеленого; transform/opacity only, IO-gated, reduced-motion сразу показывает final с нарисованными связями; mobile 390/320 ответ и чанки stack; NO mascot dot -->

In the static (no-JS) view, the host shows the answer where each claim is followed by `[source]`, and next to it a list of source pieces - the reader sees the link without animation. Separately, a block with the fallback for the case "there is no answer in the context".

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Ji et al., 2023. Survey of Hallucination in Natural Language Generation. <https://arxiv.org/abs/2202.03629>
- Anthropic. Messages API. <https://platform.claude.com/docs/en/api/messages>
- Anthropic. Streaming Messages. <https://platform.claude.com/docs/en/api/messages-streaming>
- Anthropic. Models overview. <https://platform.claude.com/docs/en/about-claude/models/overview>

## Try it yourself

- In grounded-answer-reveal hover over any claim of the answer and trace the link line to its source piece: the green accent lights up only when the citation is matched to a real piece.
- Turn on the "no context" case and see that the correct answer is the fallback "This is not in the documents", not a plausible fabrication.
- Find a `[source]` in the answer that is not among the context pieces (a citation hallucination), and note why such an answer must be rejected.

## What is next

There is an answer - but is it good? The next stop is the **evaluation** chapter: how to systematically measure retrieval accuracy and answer quality on a golden set of questions.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
