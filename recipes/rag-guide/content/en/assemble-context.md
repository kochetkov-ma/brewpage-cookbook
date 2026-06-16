<!--
  EN translation of the RU-first assemble-context core section. ASCII punctuation only.
  Cite every technical claim inline. The RU md is the single source.
-->

# Context assembly: packing the results into one prompt

## The problem you came with

The retrieve stage returned you the top-k fragments - say 8 pieces, sorted by cosine closeness. You happily glue them into one text, add the user's question, and send it to the model. The answer comes back - and it is worse than it could be: the model ignored the most important fragment because you put it in the middle, and half the pieces are duplicates of the same paragraph that ate up the whole token budget.

This is the context-assembly stage: not "everything found into a heap" but an engineering assembly. Three decisions determine answer quality: which template to assemble the prompt by, how much context fits into the model's limit, and in what order to lay out the pieces. Below is the working path from a raw top-k to a finished prompt.

This is the augment step from the original RAG work: the retrieved documents are mixed into the generator's input ([Lewis et al., 2020](https://arxiv.org/abs/2005.11401)). The annotated view of the request and the answer itself is taken apart in the chapter [Payload anatomy](payload-anatomy.html) - there every field of the prompt is labelled.

## The solution: the context assembler in full

Here is a working Python function that takes the top-k results from retrieve and assembles a prompt from them under a token budget. It does all four things at once: template, budget, order, deduplication.

```python
# pip install tiktoken
import tiktoken

ENC = tiktoken.get_encoding("cl100k_base")  # OpenAI tokenizer: fast OFFLINE APPROXIMATION, not Claude-accurate; for exact Claude counts use client.messages.count_tokens()

def count_tokens(text: str) -> int:
    return len(ENC.encode(text))

PROMPT_TEMPLATE = """Answer only from the context below.
If the answer is not in the context, say so honestly.

Context:
{context}

Question: {question}
Answer:"""

def assemble_context(question, retrieved, max_context_tokens=3000):
    """
    retrieved: list of dict {id, text, score, source}, sorted
               by descending score (most relevant first).
    """
    # 1. Dedup: drop text repeats, keeping the best score.
    seen, unique = set(), []
    for chunk in retrieved:
        key = chunk["text"].strip()
        if key not in seen:
            seen.add(key)
            unique.append(chunk)

    # 2. Order: most important at the edges, not the middle (lost-in-the-middle).
    ranked = order_for_attention(unique)

    # 3. Token budget: take chunks while they fit the limit.
    picked, used = [], count_tokens(PROMPT_TEMPLATE) + count_tokens(question)
    for chunk in ranked:
        cost = count_tokens(chunk["text"]) + 8  # +separator/source tag
        if used + cost > max_context_tokens:
            break  # the rest does not fit - trim it
        picked.append(chunk)
        used += cost

    # 4. Template: glue with the source tag for later citations.
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in picked)
    return PROMPT_TEMPLATE.format(context=context, question=question), picked
```

The `order_for_attention` function lays the best pieces at the edges of the window and the weak ones in the middle. Why exactly this way, we take apart below.

## The prompt template

A RAG prompt is not just "the question". It is three parts in a fixed order: the **instruction** (how to answer), the **context** (the found pieces), and the user's **question**. It is exactly this combination of the retrieved with the query that is the definition of RAG by [Lewis et al., 2020](https://arxiv.org/abs/2005.11401): the generator sees not only the question but also the retrieved documents as part of the input.

Set the instruction explicitly and firmly: "answer only from the context; if there is no data, say so". Without it the model will fill the gaps from its own memory - and that is a direct road to fabrications, which the generation chapter fights. Sign each piece with its source (`[source]`) so that at the generation step the model can cite a concrete fragment.

## How much context fits

The model has a hard limit - the context window, the maximum tokens on input and output together. For example, the Claude family works with a window of 200,000 tokens ([Anthropic, Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)). That seems huge, but the token budget for context is always smaller than the window: part of the space is taken by the instruction, the question, the dialogue history, and room for the answer.

A token is not a word and not a character; it is the unit into which the tokenizer cuts text (parts of words, punctuation). You must count tokens, not characters - that is why in the code above `count_tokens` uses a real tokenizer, `tiktoken` ([OpenAI tiktoken](https://github.com/openai/tiktoken)), rather than `len(text)`. Note: tiktoken is an OpenAI tokenizer and a fast offline approximation only; it is not exact for Claude, so for precise Claude counts use the Anthropic `client.messages.count_tokens()` API ([Anthropic Messages API](https://platform.claude.com/docs/en/api/messages)). A large window is not free: every extra context token is money and latency on every request (more on this in the production chapter).

## Order and priority of the pieces

The main counterintuitive fact of this chapter: the order of pieces within the prompt changes the answer. Models use information that lands in the **middle** of a long context worst, and what stands at the **beginning or end** best. This is the "lost in the middle" effect: accuracy drops when the needed fact lies in the middle of the window ([Liu et al., 2023](https://arxiv.org/abs/2307.03172)).

The practical conclusion is direct: put the most relevant pieces at the edges and the less important ones in the middle. That is exactly what `order_for_attention` does:

```python
def order_for_attention(ranked):
    """Best chunks at the window edges, weak ones in the middle.
    ranked is already sorted by descending relevance."""
    head, tail = [], []
    for i, chunk in enumerate(ranked):
        (head if i % 2 == 0 else tail).append(chunk)
    return head + tail[::-1]   # ...strong...weak...strong
```

## Cleaning duplicates and trimming the excess

Retrieve often returns near-duplicates: the same paragraph that landed in two adjacent overlapping pieces (see the chunking chapter), or the same fact from two versions of a document. Duplicates add no information but eat the token budget and push useful pieces out of the window. The deduplication step above removes exact repeats; for near-duplicates it is extended with a comparison by cosine closeness between pieces.

When everything that fits has been selected, the remainder is simply trimmed - and that is fine. The goal of context assembly is not "fit everything" but "fit the needed in the right order under budget".

<!-- IE-BRIEF: element=context-assembly-drill | purpose=показать как top-k чанки упаковываются в шаблон промпта под token budget, с порядком по краям и обрезкой лишнего | inputs=NET-NEW default-export shared/data/assemble-context.js { template, chunks:[{id,text,score,source,tokens}], maxContextTokens:{min:500,max:4000,default}, order:["by-score"|"by-edges"] } (slider + order toggle config-driven) | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); context-assembly-drill монтируется как level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped камера, semantic-zoom в узел assemble) + NET-NEW shared/js/lib/context-assembly.js, drivable timeline.js пошагово (dedup -> order -> budget -> fill) | animation=semantic zoom в assemble-узел; шаблон промпта заполняется ранжированными чанками по очереди (translate/opacity), счетчик токенов растет (mono text update), куски за бюджетом обрезаются через opacity-to-0 (ДВИЖЕНИЕ - opacity; высота снапается, НЕ tween height/max-height per do-not #5); transform/opacity only, IO-gated, reduced-motion сразу показывает финальный промпт; mobile 390/320 stack вертикально; NO mascot dot -->

In the static (no-JS) view, the host shows the already-assembled prompt block with its parts labelled: instruction, context (pieces with `[source]`), question - plus a caption "the rest trimmed by budget".

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Anthropic. Models overview (context window). <https://platform.claude.com/docs/en/about-claude/models/overview>
- OpenAI. tiktoken (tokenizer). <https://github.com/openai/tiktoken>

## Try it yourself

- Open the context-assembly drill and slide `max_context_tokens` down to 800: see how the lower-score pieces get visibly trimmed once the token counter hits the limit.
- Switch the order toggle from "by score" to "by edges" and compare the layout: the most relevant pieces move to the beginning and end of the window - this is the mitigation of the lost-in-the-middle effect.
- Find two nearly identical pieces in the list and watch how the deduplication step drops the repeat, freeing budget for the next piece.

## What is next

The assembled prompt goes to the model. The next stop is the **generation** chapter: how the model reads this context and writes a grounded answer with citations. The full field-by-field view of the request is in the **payload-anatomy** chapter.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
