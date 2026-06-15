<!--
  EN translation of the RU-first chunking chapter (manuscript / md-as-source, strategy A).
  ASCII punctuation only. Cite every technical claim inline.
  The RU md is the single source.
  Slug: chunking. Route order: ... why-rag -> chunking -> embedding -> vector-store -> search -> assemble-context ...
-->

# Chunking: where to cut a document and how large

## The problem

You cannot hand the retriever the whole document at once. The first reason is purely technical: the embedding model accepts text of limited length, and one giant fragment simply will not fit. The second reason is subtler and more important: even when a long context fits, the model uses information in its middle worse - the "lost in the middle" effect, measured on several models: accuracy is higher when the needed fact stands at the beginning or the end of the context, and noticeably sags in the center ([Liu et al., 2023, arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). So a large document is cut into chunks - retrieval-sized fragments that are then turned into embeddings, stored in the index, and retrieved one at a time.

The question is not whether to cut but where to cut and how large. This is the chunking stage - one of the stops on the high-level route map. The key idea of the chapter: the choice of cutting strategy is a measurable trade-off between simplicity, cost, and boundary quality, not a single correct constant. Below is a catalog of strategies with explicit complexity and cost ratings, working Python for the main ones, step-by-step algorithms for each, and teaching animations that, for the main algorithms, show WHERE the cuts land.

RAG as a method - "find, augment, generate" - was introduced in [Lewis et al., 2020, arXiv:2005.11401](https://arxiv.org/abs/2005.11401); chunking is the first step of the retrieval stage: without cutting there is nothing to turn into embeddings and nothing to search.

## What chunking consists of

When detailed, the chunking stage breaks into three parts. This is the general frame of any strategy - only the splitter changes.

- **Splitter** - decides WHERE to cut. On this depends whether related meaning lands in one chunk or a cut tears a sentence in half. The whole catalog below is different splitters.
- **Overlap** - the shared tail of text that repeats at the end of one chunk and the start of the next. Without overlap, a fact that landed on a cut boundary will not be found in full in any one chunk; a small overlap preserves context at the seam ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).
- **Metadata** - the source, position (`fromChar`/`toChar`), and tags attached to the chunk. Later they are needed to filter candidates in the vector database and to return an exact citation in the generation answer.

Chunk size and overlap are a trade-off, not a constant: small chunks hit the query more precisely but lose surrounding context; large ones carry context but blur relevance and run into "lost in the middle" ([Liu et al., 2023, arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). The right value depends on your documents, so it is chosen by measuring on a golden set of questions, not by guessing ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

### What to measure size in: characters or tokens

Chunk size can be counted in characters or in tokens, and this is not a cosmetic difference. The character count is simple: a string's length in Python is `len(text)`, no dependencies. But the real budget that RAG runs into is measured not in characters but in tokens: both the model's context window and the bill for a call are counted in tokens, not characters. One token is on average a piece of a word, and the character-to-token ratio differs for different languages and alphabets (Cyrillic usually yields more tokens for the same text than Latin). So a chunk of 1000 characters may unexpectedly fail to fit into the token budget of the context-assembly step.

That is why production splitters count tokens specifically, with the same tokenizer as the target model. OpenAI publishes `tiktoken` - the tokenizer of its models ([OpenAI, tiktoken](https://github.com/openai/tiktoken); [OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)); LangChain wraps it in `TokenTextSplitter`, which cuts by tokens rather than characters ([LangChain, split by token](https://reference.langchain.com/python/langchain-text-splitters/base/TokenTextSplitter)). Any strategy from the catalog below can be implemented as character-based (simple and dependency-free) or token-based (more accurate to the model's budget); the unit of counting is an orthogonal knob to the choice of splitter. In the examples below the count is character-based for clarity, but in production the same logic is run by tokens.

## Cutting strategies: the catalog

Nine strategies - from the simplest to the smartest. First an overview table with ratings - you can read it as a cheat sheet and compare rows by eye. Under the table each strategy is unfolded: how it works, when to apply it, a step-by-step algorithm, and (for the main ones) working Python.

Cost is broken into three axes because they grow unevenly:

- **Token cost** - how many extra tokens the strategy produces (overlap duplicates text; a semantic cut may call an embedding or an LLM on each candidate boundary).
- **Time cost** - the latency of cutting one document (pure string-split is instant; model calls add network latency).
- **Compute cost** - the computational load (CPU on parsing versus GPU or model API calls).

The ratings are relative (low / medium / high), not absolute numbers: they show the order of strategies relative to one another, not a benchmark on your hardware.

| Strategy | Complexity | Token cost | Time cost | Compute cost | When to use |
|---|---|---|---|---|---|
| fixed-size | low | low | low | low | Quick prototype, uniform text without explicit structure; you need predictable chunk size. |
| sliding-window (overlap) | low | medium | low | low | Facts often land on boundaries; you must guarantee that boundary meaning is not lost. |
| recursive (separator hierarchy) | medium | low | low | low | The universal default for prose: cut by paragraphs and sentences, but firmly hold the size limit. |
| sentence / structure-aware | medium | low | medium | low-medium | There is reliable structure (Markdown headings, code AST, sentence boundaries) that must be preserved. |
| markdown / document-structure | medium | low | medium | low | A Markdown document with headings: cut by `#`/`##`, and put the heading level into the chunk metadata. |
| parent-document (small-to-big) | medium | medium | medium | low-medium | You need the precision of small chunks in search but broad context in the answer: index small, return parents. |
| late chunking | high | medium | high | high | There is a long-context embedding model; the chunk must carry the context of the whole document, not just its own fragment. |
| contextual retrieval | high | high | high | high | Isolated chunks lose meaning without the document; the price of LLM-enriching each chunk is justified by search quality. |
| semantic / LLM-based | high | high | high | high | Boundary quality is critical and justifies the price; cut by semantic shifts, not by characters. |

The progressive disclosure of the catalog is described below in the section "How the catalog unfolds": the overview table is level 0, diving into one strategy is level 1 (the algorithm plus the animation). There is no zoom deeper than two levels.

<!-- IE-BRIEF: element=ChunkingStrategyCatalog | purpose=Показать весь каталог стратегий реза как сравнимую таблицу рейтингов и дать drill в любую стратегию до ее алгоритма | inputs=NET-NEW default-export shared/data/chunking.js { strategies:[{ id, ru:{name,how,when}, en, complexity, tokenCost, timeCost, computeCost, algorithm:[steps], python?, anim:{element,params} }] } (строки каталога из этой таблицы); по одному drill-target на стратегию | host=[data-component="drilldown-host"] с data-slot="stage" (таблица рейтингов на 9 строк как drillable rows/nodes) + data-slot="crumbs" + data-slot="zoomout" + data-slot="panel" | recipe-path=shared/js/lib/drilldown-zoom.js (готовая semantic-zoom камера, level0 table -> level1 strategy panel через renderPanel); page glue NET-NEW pages/chunking.js поставляет данные каталога + per-strategy panel DOM | animation=на drill: выбранная строка/узел стратегии растягивается в панель через scale+translate (transform) и затемняет соседние (opacity); IO-gated; reduced-motion: панель сразу в конечном состоянии без перехода; mobile 390/320: таблица скроллится горизонтально, панель на весь экран; NO mascot dot -->

### fixed-size: cut every N units

**How it works.** The simplest strategy: walk through the text and cut off exactly N units (characters or tokens) in a row, ignoring semantic boundaries. The size of each chunk is predictable; boundaries may land in the middle of a word or sentence.

**When to apply.** A quick prototype; uniform text without explicit structure; when you specifically care about size predictability (for example, a hard per-chunk budget). This is the baseline from which the other strategies push off ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

**Algorithm (step by step).**

1. Set the window size `size` (in characters or tokens).
2. Place the cursor `i = 0`.
3. Cut off the substring `text[i : i + size]` - this is the next chunk.
4. Move the cursor: `i = i + size`.
5. Repeat steps 3-4 while `i < len(text)`.
6. The last chunk may turn out shorter than `size` - that is fine.

```python
def fixed_size_chunks(text: str, size: int) -> list[str]:
    if size <= 0:
        raise ValueError("size must be positive")
    return [text[i:i + size] for i in range(0, len(text), size)]


if __name__ == "__main__":
    doc = "RAG mixes your documents into the prompt sent to the model. " \
          "The corpus is cut into chunks and each one is turned into a vector. " \
          "The vectors are stored in an index and the nearest by meaning are found."
    for n, chunk in enumerate(fixed_size_chunks(doc, 60)):
        print(n, repr(chunk))
```

<!-- IE-BRIEF: element=FixedSizeCutAnim | purpose=Показать механизм реза fixed-size: резы падают через равные интервалы независимо от границ слов | inputs=строка примера doc; size=60 (как в Python выше); позиции резов = 0,60,120,...; из strategy.anim.params в data/chunking.js | host=[data-slot="anim"] внутри level-1 панели стратегии fixed-size | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=fixed (один модуль на все анимации каталога, reuses timeline.js как rAF часы; НЕ process-anim.js, который рендерит только split/embed/store) | animation=на экране строка текста monospace; вертикальные линии-резы появляются по очереди через scaleY 0->1 (transform) на равных интервалах, каждый chunk подсвечивается opacity; видно, что рез может пасть посередине слова; IO-gated; reduced-motion: все резы сразу нарисованы в конечном состоянии; mobile 390/320: текст переносится, резы маркируются на каждой строке; NO mascot dot -->

### sliding-window (overlap): a window with overlap

**How it works.** The same fixed-size window, but adjacent chunks overlap by `overlap` units: each next chunk begins not where the previous one ended but `overlap` earlier. This way a fact torn by a boundary lands in full in at least one chunk.

**When to apply.** When facts often fall on boundaries and losing boundary meaning is unacceptable. The price is text duplication: some tokens go into the index twice (hence the "medium" token cost in the table) ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

**Algorithm (step by step).**

1. Set `size` and `overlap`, with `0 <= overlap < size` (otherwise the window does not move forward).
2. Compute the step: `step = size - overlap`.
3. Place the cursor `i = 0`.
4. Cut the chunk `text[i : i + size]`.
5. Move the cursor by the step: `i = i + step`.
6. Repeat steps 4-5 while `i < len(text)`. The `overlap` tail of the previous chunk repeats at the start of the next.

```python
def sliding_window_chunks(text: str, size: int, overlap: int) -> list[str]:
    if size <= 0:
        raise ValueError("size must be positive")
    if not 0 <= overlap < size:
        raise ValueError("overlap must satisfy 0 <= overlap < size")
    step = size - overlap
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i:i + size])
        i += step
    return chunks


if __name__ == "__main__":
    doc = "RAG mixes your documents into the prompt sent to the model. " \
          "The corpus is cut into chunks and each one is turned into a vector."
    for n, chunk in enumerate(sliding_window_chunks(doc, 50, 15)):
        print(n, repr(chunk))
```

<!-- IE-BRIEF: element=SlidingWindowAnim | purpose=Показать механизм перекрытия: окно фиксированной ширины едет по тексту с шагом step=size-overlap, соседние окна накладываются | inputs=строка примера doc; size=50; overlap=15; step=35; из strategy.anim.params в data/chunking.js | host=[data-slot="anim"] внутри level-1 панели стратегии sliding-window | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=sliding (reuses timeline.js; НЕ process-anim.js) | animation=полупрозрачный прямоугольник-окно сдвигается вдоль строки через translateX (transform) на step за шаг; зона перекрытия с соседним окном подсвечивается opacity, чтобы было видно, что хвост повторяется; IO-gated; reduced-motion: все окна показаны одновременно стопкой с видимым перекрытием в конечном состоянии; mobile 390/320: текст переносится, окно маркируется скобкой; NO mascot dot -->

### recursive (separator hierarchy): cut by separator priority

**How it works.** Cut by a prioritized list of separators - first by the largest (a double newline = a paragraph), then by smaller ones (a newline, a sentence, a space), until each piece fits the limit `size`. If a piece is still larger than the limit, the next separator from the list is applied to it recursively. This is the default strategy in LangChain's `RecursiveCharacterTextSplitter`: it tries to cut by `["\n\n", "\n", " ", ""]` in exactly this order, keeping paragraphs and sentences whole as long as possible ([LangChain, RecursiveCharacterTextSplitter](https://reference.langchain.com/python/langchain-text-splitters/character/RecursiveCharacterTextSplitter)).

**When to apply.** The universal default for prose: it gives neat boundaries (by paragraphs and sentences) but guarantees that no chunk exceeds the limit. Almost always better than bare fixed-size at the same low price.

**Algorithm (step by step).**

1. Set `size` and an ordered list of separators `separators` from large to small, for example `["\n\n", "\n", " ", ""]`.
2. Take the first separator from the list and split the text by it into parts.
3. For each part: if its length is `<= size`, it is a finished piece.
4. If the part is still longer than `size`, recursively apply steps 2-4 to that part with the NEXT separator from the list.
5. If the separators run out and a piece is still longer than `size`, cut it hard fixed-size (the last separator `""` means a cut by characters).
6. Glue adjacent small pieces back together until the sum exceeds `size` (so as not to breed overly small chunks).

```python
def recursive_chunks(text: str, size: int,
                     separators: list[str] | None = None) -> list[str]:
    if separators is None:
        separators = ["\n\n", "\n", " ", ""]
    if len(text) <= size:
        return [text] if text else []

    sep = separators[0]
    rest = separators[1:]
    parts = list(text) if sep == "" else text.split(sep)

    chunks: list[str] = []
    buf = ""
    glue = "" if sep == "" else sep
    for part in parts:
        candidate = part if not buf else buf + glue + part
        if len(candidate) <= size:
            buf = candidate
            continue
        if buf:
            chunks.append(buf)
            buf = ""
        if len(part) <= size:
            buf = part
        elif rest:
            chunks.extend(recursive_chunks(part, size, rest))
        else:
            chunks.extend(part[i:i + size] for i in range(0, len(part), size))
    if buf:
        chunks.append(buf)
    return chunks


if __name__ == "__main__":
    doc = ("RAG mixes your documents into the prompt.\n\n"
           "The corpus is cut into chunks. Each chunk is embedded.\n\n"
           "The vectors are stored in an index and the nearest by meaning are found.")
    for n, chunk in enumerate(recursive_chunks(doc, 70)):
        print(n, repr(chunk))
```

> This is a simplified but working implementation of the same idea as in LangChain's `RecursiveCharacterTextSplitter`. A production splitter adds token counting and overlap; the logic of descending through the separators is the same ([LangChain, RecursiveCharacterTextSplitter](https://reference.langchain.com/python/langchain-text-splitters/character/RecursiveCharacterTextSplitter)).

<!-- IE-BRIEF: element=RecursiveDescentAnim | purpose=Показать рекурсивный спуск по иерархии separators: сначала рез по абзацам, те куски, что не влезли, режутся по предложениям, потом по словам - древовидный спуск | inputs=строка doc с \n\n и предложениями; separators=["\n\n","\n"," ",""]; size=70; из strategy.anim.params в data/chunking.js | host=[data-slot="anim"] внутри level-1 панели стратегии recursive | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=recursive (reuses timeline.js; НЕ process-anim.js) | animation=текст показан блоком; уровень 0 - резы по \n\n появляются через scaleY (transform); куски, превысившие size, подсвечиваются opacity и на следующем шаге в них появляются резы следующего separator (спуск на уровень ниже) - визуально как descent по дереву; IO-gated; reduced-motion: сразу показаны все финальные границы с пометкой уровня separator; mobile 390/320: блок сужается, уровни separators маркируются цветом border по theme accent; NO mascot dot -->

### sentence / structure-aware: cut by sentence boundaries and structure

**How it works.** Cut not by a character count but by natural boundaries: sentence ends, Markdown headings, code AST elements. This best preserves meaning - a chunk coincides with a finished thought - but depends on the input format: you need reliable boundaries (sentence segmentation for prose, a parser for Markdown or code).

**When to apply.** There is explicit structure worth preserving: documentation with headings, code, transcripts with turns. Time cost is higher than fixed-size due to the segmentation or parsing stage, but token and compute cost stay modest as long as you do not call a heavy model ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

**Algorithm (step by step).**

1. Choose the boundary type for the format: sentences for prose, headings for Markdown, AST nodes for code.
2. Run the text through the corresponding parse (a sentence segmenter, a Markdown parser, a code parser) - get a list of elements.
3. Walk the elements and accumulate them into the current chunk while the total size is `<= size`.
4. As soon as the next element does not fit - close the current chunk and start a new one with this element.
5. Never cut inside an element (a sentence or a heading block) so as not to tear a finished thought.
6. If one element is itself larger than `size` (a long piece of code) - only then apply a fallback fixed-size or recursive cut to it.

A working example for the most common case - splitting by Markdown headings. The parser here is trivial (lines starting with `#`), and the whole idea is not to cut inside a section and to carry the heading level in the metadata:

```python
import re


def markdown_header_chunks(text: str, size: int) -> list[dict]:
    sections: list[dict] = []
    heading = ""
    buf: list[str] = []

    def flush() -> None:
        body = "\n".join(buf).strip()
        if body:
            sections.append({"heading": heading, "text": body})

    for line in text.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            flush()
            buf = []
            heading = m.group(2).strip()
        else:
            buf.append(line)
    flush()

    chunks: list[dict] = []
    for sec in sections:
        body = sec["text"]
        if len(body) <= size:
            chunks.append(sec)
            continue
        for i in range(0, len(body), size):
            chunks.append({"heading": sec["heading"], "text": body[i:i + size]})
    return chunks


if __name__ == "__main__":
    doc = ("# Vacation\n"
           "After 3 years of service you are entitled to 28 days of vacation.\n"
           "## Sick leave\n"
           "Sick leave is paid from the first day.")
    for n, chunk in enumerate(markdown_header_chunks(doc, 200)):
        print(n, chunk["heading"], repr(chunk["text"]))
```

> This is a simplified version of the idea of LangChain's `MarkdownHeaderTextSplitter`: cut by headings and put the heading level/text into the chunk metadata so that at search time you can see which section the fragment came from ([LangChain, MarkdownHeaderTextSplitter](https://reference.langchain.com/python/langchain-text-splitters/markdown/MarkdownHeaderTextSplitter)). For sentences and code AST the wrapper of steps 1-6 is the same, only the parser changes.

<!-- IE-BRIEF: element=StructureAwareAnim | purpose=Показать, что резы ложатся только на границы предложений/заголовков, никогда не внутри; сравнить с fixed-size, где рез может пасть в середине фразы | inputs=короткий текст с 3-4 предложениями и одним заголовком; границы = позиции концов предложений и заголовка; из strategy.anim.params в data/chunking.js | host=[data-slot="anim"] внутри level-1 панели стратегии structure-aware | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=structure (reuses timeline.js; НЕ process-anim.js; defer-candidate если milestone тесный - панель деградирует до алгоритм-шаги + проза) | animation=текст с выделенными предложениями; резы появляются через scaleY (transform) строго на концах предложений/после заголовка; "запрещенные" позиции внутри предложения кратко подсвечиваются opacity и пропускаются; IO-gated; reduced-motion: все структурные границы сразу нарисованы; mobile 390/320: предложения переносятся, границы маркируются на концах; NO mascot dot -->

### markdown / document-structure: cut by document headings

**How it works.** A particular but very common case of structure-aware: the document is already marked up with Markdown headings (`#`, `##`, ...). Cut by headings, make each section a chunk, and put the heading level and text into the metadata. This way a chunk always coincides with a logical section, and the metadata shows its place in the document hierarchy.

**When to apply.** Documentation, READMEs, knowledge bases in Markdown - anything where the author already laid out the structure. The heading metadata later helps to filter and to show the reader which section the answer came from ([LangChain, MarkdownHeaderTextSplitter](https://reference.langchain.com/python/langchain-text-splitters/markdown/MarkdownHeaderTextSplitter)).

**Algorithm (step by step).**

1. Walk the document's lines and catch heading lines (`#`..`######`).
2. At each heading, close the previous section and open a new one, remembering the heading's level and text.
3. Accumulate the body between headings into the current section.
4. Turn each section into a chunk, attaching the heading metadata to it (level, the path of headings).
5. If one section is longer than `size`, apply a fallback recursive or fixed-size cut to it, keeping the same metadata.

The working Python for this strategy is given above, in the structure-aware section (the `markdown_header_chunks` function).

### parent-document (small-to-big): index small, return large

**How it works.** Separate the unit of search from the unit of context. The document is cut twice: into small child chunks (precise hit on the query) and into large parent ones (broad context). Only the small chunks go into the vector index, but each stores a reference to its parent. At search time you find a small chunk, and into the model's context you slip its large parent - so the hit stays precise while the answer gets surrounding context.

**When to apply.** When small chunks win at search (for reasons from "lost in the middle"), but the answer needs a wider piece than was found. This removes the main downside of small chunking - narrow context - without losing search precision ([LangChain, ParentDocumentRetriever](https://reference.langchain.com/python/langchain-classic/retrievers/parent_document_retriever/ParentDocumentRetriever)).

**Algorithm (step by step).**

1. Cut the document into large parent chunks and assign each a `parent_id`.
2. Cut each parent chunk into small children, giving each a `parent_id` reference.
3. Put ONLY the child chunks into the vector index; store the parents separately by `parent_id`.
4. On a query, find the top-k child chunks with ordinary semantic search.
5. By their `parent_id`, fetch the parent chunks (deduplicating repeats) and slip exactly the parents into the context.

### late chunking: embed the whole document, then pool by chunks

**How it works.** The ordinary pipeline first cuts, then embeds each chunk in isolation - and the chunk knows nothing about its neighbours. Late chunking reverses the order: first run the whole document through a long-context embedding model and get token representations that have already seen the whole text; and only then pool (average) these token vectors by the chunk boundaries. Each resulting chunk vector carries the context of the whole document, even though the chunk itself stays small ([Gunther et al., 2024, "Late Chunking", arXiv:2409.04701](https://arxiv.org/abs/2409.04701)).

**When to apply.** There is a long-context embedding model and it matters that a small chunk does not lose the resolution of coreferences ("the company", "it", "this product") beyond its fragment. The price is one pass of a heavy model over the whole document.

**Algorithm (step by step).**

1. Run the whole document through a long-context embedding model and get token representations (a vector per token), not one vector for the whole text.
2. Determine the chunk boundaries with an ordinary splitter (any strategy from the catalog).
3. For each chunk, take the token vectors that fall within its boundaries and pool them (average) into one chunk vector.
4. Put these context-enriched chunk vectors into the index; the chunk text stays the same.

### contextual retrieval: prepend context before embedding

**How it works.** Before embedding a chunk, prepend a short explanatory sentence to it that places the fragment in the context of the whole document (what the document is about, which section the chunk belongs to). This explanation is generated by an LLM from the pair "document + chunk". What is embedded and indexed is the chunk-plus-context, so an isolated fragment stops being incomprehensible outside the document ([Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)).

**When to apply.** When chunks often turn out uninformative in isolation from the document (tables, short bullet points, pronouns without an antecedent), and search quality matters more than the one-time price of an LLM enriching each chunk at indexing time ([Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)).

**Algorithm (step by step).**

1. Cut the document with any splitter from the catalog.
2. For each chunk, ask an LLM to write a short context: where this fragment is in the document and what it is about, in one or two phrases.
3. Prepend this context to the start of the chunk.
4. Embed and index the already enriched chunk (context plus the original text).
5. At search time you work as usual; in the answer you can, if you wish, substitute the chunk's original text without the service context.

### semantic / LLM-based: cut by semantic shifts

**How it works.** Instead of counting characters or separators, the decision to cut is made by meaning. The typical approach: split the text into sentences, compute the embedding of each, and place a boundary where adjacent sentences diverge sharply in meaning (the cosine closeness between neighbours drops). A variant is to ask an LLM where it is logical to cut. The boundaries come out the most "semantic", but each candidate boundary costs a model call - hence high on all three cost axes ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

**When to apply.** When boundary quality is critical and justifies the price: expensive queries where a retriever miss costs more than the bill for embeddings or an LLM at the cutting stage. For most corpora, recursive gives 90% of the benefit for a fraction of the price; semantic is taken when measurements show that boundaries are the bottleneck.

**Algorithm (step by step).**

1. Split the text into sentences (basic segmentation, as in structure-aware).
2. Compute the embedding of each sentence with one embedding model.
3. Walk adjacent pairs of sentences and compute the cosine closeness between neighbours.
4. Mark boundary candidates where the closeness between neighbours falls below a threshold (a sharp semantic shift).
5. Group the sentences between adjacent boundaries into chunks; make sure a chunk does not exceed `size` - otherwise place an extra boundary inside.
6. Optionally: instead of an embedding threshold, ask an LLM where to cut a given fragment, and use its answer as boundaries (this is what gives the maximum token/time/compute cost).

> The threshold in step 4 is chosen by measuring on a golden set, not guessed ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)). Cosine as a measure of meaning closeness is taken apart in the Embedding chapter; semantic chunking relies on the same principle but applies it to cut boundaries rather than to search.

<!-- IE-BRIEF: element=SemanticShiftAnim | purpose=Показать, что граница ставится там, где соседние предложения резко расходятся по смыслу (падает cosine), а не на равных интервалах | inputs=4-5 предложений; ряд cosine-схожести между соседями (stub значения); порог; из strategy.anim.params в data/chunking.js | host=[data-slot="anim"] внутри level-1 панели стратегии semantic | recipe-path=NET-NEW shared/js/lib/chunk-anim.js mode=semantic (reuses timeline.js; НЕ process-anim.js; defer-candidate если milestone тесный - панель деградирует до алгоритм-шаги + проза) | animation=ряд предложений; между соседями столбики схожести растут через scaleY (transform); там, где столбик ниже порога, на следующем шаге появляется рез через scaleY; видно, что резы ложатся на смысловые сдвиги, а не равномерно; IO-gated; reduced-motion: столбики и резы сразу в конечном состоянии; mobile 390/320: столбики и предложения в столбик; NO mascot dot -->

## How the catalog unfolds: progressive disclosure

The catalog is arranged as a semantic-zoom drill with two levels (there are no more than two):

- **Level 0 - overview.** Only the overview table of strategies with ratings is visible (Complexity, Token/Time/Compute cost, When to use). This is the comparison layer: you run your eyes over the rows and pick a candidate. The static no-JS variant is exactly this table, fully readable without scripts.
- **Level 1 - one strategy.** A click or drill on a strategy row performs a semantic zoom into its panel: an unfolded "how it works" plus "when to apply" plus the step-by-step algorithm plus (for the basic ones) working Python plus a teaching animation of the cut for exactly this strategy. Exiting the zoom returns to the table.

The zoom does not go deeper than level 1: the algorithm and the animation are the smallest scale. All animations run only when the panel is on screen (IntersectionObserver) and only under `prefers-reduced-motion: no-preference`; otherwise the end state is shown over the same DOM.

## Size and overlap: the trade-off

Chunk size and overlap are two knobs of one trade-off. A small chunk: a precise hit on the query, but narrow context and the risk of tearing a fact. A large chunk: rich context, but blurred relevance and "lost in the middle" when assembling the prompt ([Liu et al., 2023, arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). Overlap softens the main downside of cutting by boundaries - the loss of a boundary fact - at the price of token duplication ([Pinecone, Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)).

The rule with no magic numbers: do not guess. Take a golden set of questions (see the Evaluation chapter), run two or three configurations (size/overlap/strategy), and compare the recall of the needed chunks. The strategy from the catalog above is the space of choices; measurement is the way to pick a point in it.

## Link to the live example

In the live example from the overview, the source document `doc.text` is cut into three chunks by sentence boundaries - this is effectively a structure-aware cut by the end-of-sentence mark:

- `c1` = characters [0, 85): the first sentence about RAG mixing documents into the request.
- `c2` = characters [85, 165): about the corpus being cut into chunks and each chunk turned into a vector.
- `c3` = characters [165, 247): about vectors being stored in the index and the nearest searched.

The `fromChar`/`toChar` fields in `worked-example.json` index exactly `doc.text`: each chunk is a precise slice of the source text, not a retelling of it. This is the Metadata-position from the drill-down in action: by it you can always reconstruct where the chunk came from and return a citation in the answer.

In this example the chunks do not overlap (overlap = 0) for clarity - this is pure structure-aware without sliding-window. Mentally add overlap: let `c2` begin a few words earlier, capturing the tail of `c1` - that way a fact on the sentence boundary is not lost. This is exactly the transition from structure-aware to sliding-window from the catalog above.

## Sources

Primary:

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Gunther et al., 2024. Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models. <https://arxiv.org/abs/2409.04701>
- LangChain. RecursiveCharacterTextSplitter (how-to). <https://reference.langchain.com/python/langchain-text-splitters/character/RecursiveCharacterTextSplitter>
- LangChain. Split by token. <https://reference.langchain.com/python/langchain-text-splitters/base/TokenTextSplitter>
- LangChain. MarkdownHeaderTextSplitter. <https://reference.langchain.com/python/langchain-text-splitters/markdown/MarkdownHeaderTextSplitter>
- LangChain. ParentDocumentRetriever. <https://reference.langchain.com/python/langchain-classic/retrievers/parent_document_retriever/ParentDocumentRetriever>
- OpenAI. tiktoken (tokenizer). <https://github.com/openai/tiktoken>
- OpenAI. Embeddings guide. <https://developers.openai.com/api/docs/guides/embeddings>
- Anthropic. Contextual Retrieval. <https://www.anthropic.com/news/contextual-retrieval>

Secondary (vendor explainer):

- Pinecone. Chunking strategies (overview article). <https://www.pinecone.io/learn/chunking-strategies/>

## Try it yourself

- Open the catalog at level 0 and compare the `fixed-size` and `recursive` rows: at the same low price, recursive gives neat boundaries by separators - that is why it is the default for prose.
- Drill into the `sliding-window` strategy and run its animation: watch how the window moves with step `step = size - overlap` and the overlap zone repeats in the adjacent chunk (the overlap field from "What chunking consists of").
- Drill into `recursive` and walk the animation of descending through the separators `["\n\n", "\n", " ", ""]`: the pieces that did not fit by paragraphs are cut by sentences, then by words - the same descent as in the working Python above.

## What is next

The next stop of the route is **Embedding**: it takes these chunks and turns each into a numeric vector, where closeness = closeness of meaning (the same cosine that semantic chunking relies on).

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
