<!--
  EN translation of the RU-first showcase chapter (non-route): payload-anatomy.
  ASCII punctuation only (straight quotes, hyphens, three-dot ...).
  Cite every technical claim inline to a PRIMARY source. The RU md is the single source.
  Owning task: CT-JSON-PAYLOAD. Do NOT touch shared/data/*.js, shared/*, the board, or other chapters.
-->

# Payload anatomy: one RAG request under the microscope

## The problem you came with

You walked the whole route - chunks, embeddings, search, context assembly, generation. Each chapter showed its stage in isolation. But in a live system they all converge into one thing: an HTTP request to the LLM and a response from it. This is ordinary JSON. And until you see this JSON in full, with every field in its place, RAG stays a set of separate ideas rather than one mechanism.

Here we take apart one real exchange with the model: the request you send and the response that comes back. The fields are real - this is the format of the Anthropic Messages API (<https://platform.claude.com/docs/en/api/messages>). Each functional block is labelled twice: what it does technically and what role it plays in the RAG pipeline. This is that same retrieve-augment-generate assembly from the paper Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>), but no longer on a diagram - in the bytes that go over the wire.

## One payload through the whole pipeline

A RAG request to the Anthropic Messages API is arranged like this: you put the grounding instructions in `system`, the assembled context and the question in `messages`, and you express the search itself as a tool call (`tools` plus `tool_choice`) (<https://platform.claude.com/docs/en/api/messages>). The model answers not with a single text but with an array of `content` blocks: reasoning (`thinking`), a search request (`tool_use`), and the final text. The `stop_reason` field tells why the model stopped, and `usage` - how many tokens it cost (<https://platform.claude.com/docs/en/api/messages>).

Below is a real exchange of three turns: you send the question with a description of the search tool, the model asks to call the search (`tool_use`), you return the found chunks (`tool_result`), the model writes a grounded answer.

### Turn 1. Request: the question plus a description of the search tool

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 2048
  },
  "system": "You are a support assistant. Answer ONLY from the text returned by the search_docs tool. If the answer is not in the found pieces, honestly say: this is not in the documents. Cite the source of each fact via the source field.",
  "tools": [
    {
      "name": "search_docs",
      "description": "Semantic search for the top-k chunks over the vector knowledge base.",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "The user's search query" },
          "top_k": { "type": "integer", "description": "How many nearest chunks to return", "default": 4 }
        },
        "required": ["query"]
      }
    }
  ],
  "tool_choice": { "type": "auto" },
  "messages": [
    {
      "role": "user",
      "content": "How many vacation days does an employee get after three years of service?"
    }
  ]
}
```

`system` is the grounding layer: a firm instruction to answer only from what was found and to honestly admit a gap (<https://platform.claude.com/docs/en/api/messages>). In RAG terms this is exactly the instruction of the generation stage from generation.html. `tools` describes search as a function the model can call - this is the declaration of the retrieve step from the paper Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>), expressed in the tool-use schema (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `tool_choice: auto` leaves the model to decide whether search is needed (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `thinking` enables extended reasoning with a token budget (<https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>).

### Turn 2. Response: the model reasons and asks to call the search

```json
{
  "id": "msg_01XAbc...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-6",
  "content": [
    {
      "type": "thinking",
      "thinking": "A question about vacation days after three years of service. The system says to answer only from what was found; I have no data of my own. I need to call search_docs with a query about vacation and length of service.",
      "signature": "EqoBCkg...=="
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw",
      "name": "search_docs",
      "input": {
        "query": "vacation days length of service three years policy",
        "top_k": 4
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 412,
    "output_tokens": 76
  }
}
```

The `thinking` block is the model's reasoning before acting; in RAG this is the visible plan of the retrieve stage, not the final answer (<https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>). The `tool_use` block is exactly the search request: the model asks to call `search_docs` with a concrete `query` and `top_k` (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `stop_reason: tool_use` is a control signal: the model stopped not because it finished but because it is waiting for the tool result; your code must run the search and return the result (<https://platform.claude.com/docs/en/api/messages>). `usage` is a budget and cost signal: `input_tokens` and `output_tokens` for this turn (<https://platform.claude.com/docs/en/api/messages>); in RAG a bloated `input_tokens` is the first sign that the assembled context is too large (see assemble-context.html).

### Turn 3. Request with tool_result: returning the found chunks

Your code runs the search (the retrieve stage: query -> vector -> top-k by cosine, as in search.html), then continues the same conversation, appending the assistant's response and a `tool_result` block with the found chunks. The vector shape and the cosine metric are from the OpenAI Embeddings guide (<https://developers.openai.com/api/docs/guides/embeddings>).

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": "You are a support assistant. Answer ONLY from the text returned by the search_docs tool. If the answer is not in the found pieces, honestly say: this is not in the documents. Cite the source of each fact via the source field.",
  "tools": [
    { "name": "search_docs", "description": "Semantic search for the top-k chunks over the vector knowledge base.", "input_schema": { "type": "object", "properties": { "query": { "type": "string" }, "top_k": { "type": "integer" } }, "required": ["query"] } }
  ],
  "messages": [
    { "role": "user", "content": "How many vacation days does an employee get after three years of service?" },
    {
      "role": "assistant",
      "content": [
        { "type": "thinking", "thinking": "...", "signature": "EqoBCkg...==" },
        { "type": "tool_use", "id": "toolu_01A09q90qw", "name": "search_docs", "input": { "query": "vacation days length of service three years policy", "top_k": 4 } }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01A09q90qw",
          "content": [
            { "type": "text", "text": "[chunk c-118 | source=hr-policy.md | section=Vacation | date=2026-01-10 | cosine=0.83 | rank=1] After 3 full years of service an employee is entitled to 28 calendar days of paid vacation per year." },
            { "type": "text", "text": "[chunk c-119 | source=hr-policy.md | section=Vacation | date=2026-01-10 | cosine=0.71 | rank=2] The base vacation for under 3 years of service is 24 calendar days." }
          ]
        }
      ]
    }
  ]
}
```

`tool_result` is the return of the retrieve stage into the conversation: linked to the request by `tool_use_id`, carrying the found chunks as text (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). Inside each chunk are pipeline-stage metadata: `source`/`section`/`date` come from chunking (chunking.html), while `cosine`/`rank` come from search (search.html, the cosine metric per the OpenAI Embeddings guide, <https://developers.openai.com/api/docs/guides/embeddings>). This block is exactly the Augmented step from Lewis et al., 2020: what was found is slipped into the model's context before generation (<https://arxiv.org/abs/2005.11401>).

### Turn 4 (final answer). The model's grounded answer

```json
{
  "id": "msg_01YDef...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-6",
  "content": [
    {
      "type": "text",
      "text": "After three full years of service an employee is entitled to 28 calendar days of paid vacation per year (source: hr-policy.md, section Vacation)."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 638,
    "output_tokens": 41
  }
}
```

Here `content` is one `text` block: the final grounded answer with a link to `source`, as the instruction in `system` required. This is the Generation stage from Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>); the link to the concrete fields is described in generation.html. `stop_reason: end_turn` is a control signal that the model finished on its own, not because of a limit (<https://platform.claude.com/docs/en/api/messages>). `usage.input_tokens` grew from 412 to 638 - this is the price of the supplied context: that same budget signal by which assemble-context.html decides what to trim.

## A map of the blocks: function and role in RAG

A greppable table: each functional block of the payload, its fields, its technical function, and its domain role in the RAG pipeline. This is the map of blocks for the drill interaction below.

| Block | Fields | Function | Role in RAG |
|-------|----------|----------|-----------------|
| model | `model` | Which model to call | Choice of the generator for the Generation stage; affects length limit and cost |
| budget | `max_tokens` | Ceiling on answer length | Cost and latency control of the Generation stage |
| thinking-config | `thinking.type`, `thinking.budget_tokens` | Enable extended reasoning and its budget | Reasoning budget for the retrieve and generation stages |
| system | `system` | The model's system instruction | Grounding: rules to answer only from the context plus cite the source (generation.html) |
| tools | `tools[].name`, `description`, `input_schema` | Description of the available tools | Declaration of the Retrieve step as a callable function (Lewis et al., 2020) |
| tool-choice | `tool_choice.type` | Allow or force a tool call | Control over whether to run retrieve |
| messages-user | `messages[].role=user`, `content` | The user's turn | The question - the input of the whole pipeline |
| messages-assistant | `messages[].role=assistant`, `content[]` | The model's turn in the history | Saved reasoning and search request to continue the dialogue |
| response-id | `id`, `type`, `role`, `model` | Identifier and type of the response message | Binding of the dialogue turn; request tracing |
| thinking-block | `content[].type=thinking`, `thinking`, `signature` | The model's visible reasoning | Reasoning: the plan of the retrieve stage, not the final answer |
| tool-use | `content[].type=tool_use`, `id`, `name`, `input` | The model's request to call a tool | The Retrieve call: query and top_k go to the search (search.html) |
| tool-result | `tool_result.tool_use_id`, `content[]` | Returning the tool result into the dialogue | Augmented: the found top-k chunks are slipped into the context (assemble-context.html) |
| chunk-meta | `source`, `section`, `date` | Chunk metadata | Provenance: set at the chunking stage (chunking.html) |
| retrieval-score | `cosine`, `rank` | Closeness score and position in the top-k | Retrieve quality: cosine 0..1, ranking (search.html) |
| text-answer | `content[].type=text`, `text` | The final answer text | Generation: the grounded answer with a link to source |
| stop-reason | `stop_reason`, `stop_sequence` | Why the model stopped | Control signal: `tool_use` -> run the search; `end_turn` -> done |
| usage | `usage.input_tokens`, `usage.output_tokens` | Token spend per turn | Cost and budget signal: a rise in input_tokens = bloated context (assemble-context.html) |

## Interaction: drill across the payload blocks

The rendered payload is not a picture but a map. At the top level (zoom 0) you see the whole exchange of four turns: request, tool_use, tool_result, answer. Each functional block from the table above highlights on hover. One click or Enter on a block is a semantic zoom inside it (zoom 1): the block takes the stage, and beside it unfolds its annotation card with two lines - what it does technically and what role it plays in RAG, plus a link to the owning chapter (for example, `tool_use` -> search.html, `usage` -> assemble-context.html). This is exactly two zoom levels: the whole payload -> one block up close. Going back (Esc or the back button) pulls the camera out to the full payload.

With JS off, the block map works as the static labelled table above plus the JSON itself with captions - the reader loses nothing.

<!-- IE-BRIEF: element=payload-anatomy-drill | purpose=Дать читателю навести/раскрыть любой функциональный блок отрисованного RAG payload и сразу увидеть его техническую функцию + доменную роль в конвейере RAG, со ссылкой на главу-владельца | inputs=размеченный request/response JSON (4 хода: request, tool_use response, tool_result request, final text response) + block map (17 строк таблицы Блок|Поля|Функция|Роль в RAG; каждая строка несет block-id, поля для подсветки и chapter-link); NET-NEW default-export data/payload-anatomy.js { turns[], blocks[{id,fields,function{ru,en},ragRole{ru,en},chapter,highlight[]}] } | host=[data-component="payload-anatomy-drill"] (drill через built drill-host slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/drilldown-zoom.js (готовая semantic-zoom камера, init(rootEl, config)=>{destroy()}); page glue shared/js/pages/payload-anatomy.js поставляет renderPanel (карточка Function + RAG role + chapter-link на блок); payload рендерится как аннотированный HTML <pre>/<code> с per-block hooks, не SVG | animation=reveal: transform/opacity only; IO-gated; reduced-motion snaps to end over the same DOM; <=2 zoom levels (whole payload -> one block detail); mobile 390/320; NO mascot/traveling dot -->

## Sources

- Anthropic. Messages API reference (model, max_tokens, system, messages, content blocks, stop_reason, stop_sequence, usage). <https://platform.claude.com/docs/en/api/messages>
- Anthropic. Tool use (tools, tool_choice, tool_use, tool_result, tool_use_id, input_schema). <https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>
- Anthropic. Extended thinking (thinking blocks, budget_tokens). <https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>
- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- OpenAI. Embeddings guide (vector shape, cosine similarity). <https://developers.openai.com/api/docs/guides/embeddings>

## Try it yourself

- Open the drill on the `tool_use` block (zoom 1) and trace how `input.query` and `top_k` go into the retrieve stage; check against search.html.
- Expand the `tool_result` block and find inside the chunk the fields `source`/`section`/`date` (from chunking) and `cosine`/`rank` (from search) - one block carries the traces of two pipeline stages at once.
- Compare `usage.input_tokens` in turn 2 (412) and in turn 4 (638): expand the `usage` block and confirm that the growth is the price of the supplied context, that same budget signal from assemble-context.html.

## What is next

This payload is not a separate chapter of the route but a cross-section through the whole pipeline: it is referenced by generation.html (how the `system`/`content`/`stop_reason` fields produce a grounded answer) and assemble-context.html (how `usage` and `tool_result` show the context budget). Go back to either of them to see your stage already in the bytes of a live request.

## About this recipe

- Part of the [BrewPage Cookbook](../../../../README.md).
- Published live at [brewpage.app](https://brewpage.app).
- BrewPage API contract source: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
