/**
 * payload-anatomy.js -- DATA CONTRACT for the "Анатомия payload" showcase
 * (non-route chapter content/ru/payload-anatomy.md, owning task CT-JSON-PAYLOAD;
 * IE task S-IE-PAYLOAD).
 *
 * Consumed by shared/js/lib/drilldown-zoom.js (the shipped semantic-zoom camera)
 * driven by page glue shared/js/pages/payload-anatomy.js. The page renders the
 * 4-turn Anthropic Messages API exchange as an annotated <pre>/<code> block; each
 * functional region is wrapped in a per-block hook span. Clicking/Enter on a
 * block calls camera.openNode({ id, crumb, data }) where data == the matching
 * blocks[] entry; the glue's renderPanel(entry) builds the annotation card from
 * entry.data (Function + RAG role + owning-chapter link). EXACTLY 2 zoom levels:
 * zoom 0 = whole payload (blocks highlight on hover); zoom 1 = one block detail.
 * NO SVG -- the payload is annotated text, not a diagram.
 *
 * SPAN-ID NAMING (markup contract for SB / page glue)
 * ---------------------------------------------------
 * Every highlightable region in the rendered <pre>/<code> carries:
 *     data-block="<block.id>"   -- the drill key; MUST equal a blocks[].id below.
 *     role="button" tabindex="0" -- focusable; Enter/Space + click open zoom 1.
 *     aria-label                 -- supplied by the glue from block.aria[lang].
 * A block.id MAY appear on MORE THAN ONE span (e.g. `system` text repeats in
 * turn 1 and turn 3; `messages-user` appears in turns 1 and 3). All spans that
 * share a data-block open the SAME annotation card. The 17 ids are exactly the
 * keys listed in `order` below; they match the greppable block-map table in
 * content/ru/payload-anatomy.md ("Карта блоков") and the spec block map.
 * Per-turn anchoring is informational only: each block lists `turns: number[]`
 * (1..4) saying which of the 4 rendered turns contain a span for it.
 *
 * SHAPE
 * -----
 * Default export = {
 *   model:   string,                 // model id echoed in every turn ("claude-sonnet-4-6")
 *   turns:   Turn[],                 // 4 turns; each .json is a valid ASCII JSON string
 *   order:   string[],              // the 17 block ids, table order (== drill keys)
 *   blocks:  { [id]: Block }         // annotation map, keyed by data-block id
 * }
 *
 * Turn:
 *   {
 *     n:       1 | 2 | 3 | 4,         // turn index
 *     dir:     "request" | "response",
 *     title:   { ru, en },            // short turn caption
 *     json:    string                 // VALID, ASCII-only JSON payload for this turn
 *   }
 *
 * Block (one annotation card; the 17 functional blocks):
 *   {
 *     id:      string,                // == data-block hook + drill key (in `order`)
 *     fields:  string[],              // payload field paths this block highlights
 *     turns:   number[],              // which rendered turns (1..4) carry a span
 *     crumb:   { ru, en },            // level-1 breadcrumb label
 *     aria:    { ru, en },            // accessible name for the focusable span
 *     function:{ ru, en },            // technical Function (card row 1)
 *     ragRole: { ru, en },            // RAG domain role (card row 2)
 *     chapter: { href, label: { ru, en } } | null  // owning-chapter back-link
 *   }
 *
 * RULES
 *   - ASCII ONLY everywhere except inside ru copy strings (Cyrillic allowed there).
 *   - Every turn.json MUST be valid JSON (JSON.parse-able) AND pure ASCII.
 *   - order.length === 17 and lists every key of blocks exactly once.
 *   - Consumers MUST skip any future `_`-prefixed key.
 *   - chapter.href points at a sibling chapter HTML page (same site); null == no
 *     single owner (cross-cutting block).
 *   - drilldown-zoom config the page glue must pass:
 *       init(host, {
 *         renderPanel: (entry) => buildCard(blocks[entry.id]),  // REQUIRED
 *         labels: { topCrumb, zoomOut },                        // optional
 *         announce, onSelect                                    // optional
 *       })
 *     and on a block span: camera.openNode({
 *       id: blockId, crumb: blocks[blockId].crumb[lang], data: blocks[blockId], fromEl: span
 *     });  // never openDeep -- this showcase is 2 levels total (zoom0 -> zoom1).
 */

// In-file schema marker (mirrors the JSON _schema convention for JS data files).
const _schema = {
  purpose:
    "Annotated 4-turn Anthropic Messages API RAG exchange + 17-block annotation map for the payload-anatomy semantic-zoom drill (drilldown-zoom.js).",
  shape: "{ model, turns:[{n,dir,title{ru,en},json}], order:string[17], blocks:{[id]:Block} }",
  rules: [
    "ASCII only outside ru copy strings; every turn.json is valid JSON + ASCII.",
    "order lists all 17 block ids once; block.id == data-block markup hook == drill key.",
    "max 2 zoom levels (whole payload -> one block); openNode only, never openDeep.",
    "skip any _-prefixed key.",
  ],
};

// The system instruction string, reused verbatim in turns 1 and 3 (ASCII, grounding rules).
const SYSTEM =
  "You are a support assistant. Answer ONLY from the text returned by the search_docs tool. " +
  "If the answer is not in the found pieces, honestly say: this is not in the documents. " +
  "Cite the source of each fact via the source field.";

// ---- The 4 turns. Each `json` is a real, parse-able, ASCII-only payload. ----

const TURN1 = {
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  thinking: { type: "enabled", budget_tokens: 2048 },
  system: SYSTEM,
  tools: [
    {
      name: "search_docs",
      description: "Semantic search for the top-k chunks over the vector knowledge base.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The user's search query" },
          top_k: { type: "integer", description: "How many nearest chunks to return", default: 4 },
        },
        required: ["query"],
      },
    },
  ],
  tool_choice: { type: "auto" },
  messages: [
    { role: "user", content: "How many vacation days does an employee get after three years of service?" },
  ],
};

const TURN2 = {
  id: "msg_01XAbcRequestDemo",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-4-6",
  content: [
    {
      type: "thinking",
      thinking:
        "A question about vacation days after three years of service. The system says to answer only " +
        "from what was found; I have no data of my own. I need to call search_docs with a query about vacation and length of service.",
      signature: "EqoBCkgDEMODEMOsignaturePLACEHOLDER==",
    },
    {
      type: "tool_use",
      id: "toolu_01A09q90qwDEMO",
      name: "search_docs",
      input: { query: "vacation days length of service three years policy", top_k: 4 },
    },
  ],
  stop_reason: "tool_use",
  stop_sequence: null,
  usage: { input_tokens: 412, output_tokens: 76 },
};

const TURN3 = {
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: SYSTEM,
  tools: [
    {
      name: "search_docs",
      description: "Semantic search for the top-k chunks over the vector knowledge base.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string" },
          top_k: { type: "integer" },
        },
        required: ["query"],
      },
    },
  ],
  messages: [
    { role: "user", content: "How many vacation days does an employee get after three years of service?" },
    {
      role: "assistant",
      content: [
        {
          type: "thinking",
          thinking:
            "A question about vacation days after three years of service. I need to call search_docs.",
          signature: "EqoBCkgDEMODEMOsignaturePLACEHOLDER==",
        },
        {
          type: "tool_use",
          id: "toolu_01A09q90qwDEMO",
          name: "search_docs",
          input: { query: "vacation days length of service three years policy", top_k: 4 },
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_01A09q90qwDEMO",
          content: [
            {
              type: "text",
              text:
                "[chunk c-118 | source=hr-policy.md | section=Vacation | date=2026-01-10 | " +
                "cosine=0.83 | rank=1] After 3 full years of service an employee is entitled to 28 " +
                "calendar days of paid vacation per year.",
            },
            {
              type: "text",
              text:
                "[chunk c-119 | source=hr-policy.md | section=Vacation | date=2026-01-10 | " +
                "cosine=0.71 | rank=2] The base vacation for under 3 years of service is 24 " +
                "calendar days.",
            },
          ],
        },
      ],
    },
  ],
};

const TURN4 = {
  id: "msg_01YDefResponseDemo",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-4-6",
  content: [
    {
      type: "text",
      text:
        "After three full years of service an employee is entitled to 28 calendar days of paid " +
        "vacation per year (source: hr-policy.md, section Vacation).",
    },
  ],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 638, output_tokens: 41 },
};

// Pretty-print to stable, ASCII, parse-able JSON strings (2-space indent).
const jstr = (obj) => JSON.stringify(obj, null, 2);

const turns = [
  {
    n: 1,
    dir: "request",
    title: { ru: "Ход 1. Запрос: вопрос + описание инструмента поиска", en: "Turn 1. Request: question + search tool description" },
    json: jstr(TURN1),
  },
  {
    n: 2,
    dir: "response",
    title: { ru: "Ход 2. Ответ: модель рассуждает и просит вызвать поиск", en: "Turn 2. Response: model reasons and requests the search call" },
    json: jstr(TURN2),
  },
  {
    n: 3,
    dir: "request",
    title: { ru: "Ход 3. Запрос с tool_result: возвращаем найденные чанки", en: "Turn 3. Request with tool_result: return the retrieved chunks" },
    json: jstr(TURN3),
  },
  {
    n: 4,
    dir: "response",
    title: { ru: "Ход 4. Заземленный ответ модели", en: "Turn 4. Grounded answer from the model" },
    json: jstr(TURN4),
  },
];

// ---- The 17-block annotation map (table order from the chapter / spec). ----

const order = [
  "model",
  "budget",
  "thinking-config",
  "system",
  "tools",
  "tool-choice",
  "messages-user",
  "messages-assistant",
  "response-id",
  "thinking-block",
  "tool-use",
  "tool-result",
  "chunk-meta",
  "retrieval-score",
  "text-answer",
  "stop-reason",
  "usage",
];

const blocks = {
  model: {
    id: "model",
    fields: ["model"],
    turns: [1, 2, 3, 4],
    crumb: { ru: "model", en: "model" },
    aria: { ru: "Блок model: какую модель вызвать", en: "Block model: which model to call" },
    function: {
      ru: "Какую модель вызвать. Здесь claude-sonnet-4-6; сервер эхом возвращает этот id в каждом ответе.",
      en: "Which model to call. Here a current Claude model (see the models overview); the server echoes this id back in every response.",
    },
    ragRole: {
      ru: "Выбор генератора стадии Generation; определяет предел длины контекста и стоимость запроса.",
      en: "Generator choice for the Generation stage; drives the context length limit and request cost.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  budget: {
    id: "budget",
    fields: ["max_tokens"],
    turns: [1, 3],
    crumb: { ru: "max_tokens", en: "max_tokens" },
    aria: { ru: "Блок max_tokens: потолок длины ответа", en: "Block max_tokens: answer length ceiling" },
    function: {
      ru: "Потолок длины ответа в токенах. Модель остановится, достигнув его (stop_reason max_tokens).",
      en: "Answer length ceiling in tokens. The model stops once it is hit (stop_reason max_tokens).",
    },
    ragRole: {
      ru: "Контроль стоимости и задержки стадии Generation: короткий потолок = дешевле и быстрее.",
      en: "Cost and latency control of the Generation stage: a shorter ceiling is cheaper and faster.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  "thinking-config": {
    id: "thinking-config",
    fields: ["thinking.type", "thinking.budget_tokens"],
    turns: [1],
    crumb: { ru: "thinking config", en: "thinking config" },
    aria: { ru: "Блок thinking config: включить расширенное рассуждение", en: "Block thinking config: enable extended reasoning" },
    function: {
      ru: "Включает расширенное рассуждение (type enabled) и задает его бюджет токенов (budget_tokens).",
      en: "Enables extended thinking (type enabled) and sets its token budget (budget_tokens).",
    },
    ragRole: {
      ru: "Бюджет на рассуждение стадий retrieve и generation: сколько модель может думать перед действием.",
      en: "Reasoning budget for the retrieve and generation stages: how much the model may think before acting.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  system: {
    id: "system",
    fields: ["system"],
    turns: [1, 3],
    crumb: { ru: "system", en: "system" },
    aria: { ru: "Блок system: системная инструкция заземления", en: "Block system: grounding system instruction" },
    function: {
      ru: "Системная инструкция модели: жесткое правило отвечать только по найденному и честно признавать пробел.",
      en: "The system instruction: a hard rule to answer only from retrieved text and to admit gaps honestly.",
    },
    ragRole: {
      ru: "Заземление: правила отвечать только по контексту и цитировать источник - инструкция стадии Generation.",
      en: "Grounding: answer-only-from-context plus cite-the-source rules - the Generation-stage instruction.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  tools: {
    id: "tools",
    fields: ["tools[].name", "tools[].description", "tools[].input_schema"],
    turns: [1, 3],
    crumb: { ru: "tools", en: "tools" },
    aria: { ru: "Блок tools: описание инструмента поиска", en: "Block tools: search tool description" },
    function: {
      ru: "Описывает доступные инструменты: имя, описание и input_schema функции search_docs, которую модель может вызвать.",
      en: "Declares the available tools: the name, description and input_schema of the search_docs function the model may call.",
    },
    ragRole: {
      ru: "Объявление шага Retrieve как вызываемой функции (Lewis et al., 2020), выраженное в схеме tool use.",
      en: "Declares the Retrieve step as a callable function (Lewis et al., 2020), expressed in the tool-use schema.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "tool-choice": {
    id: "tool-choice",
    fields: ["tool_choice.type"],
    turns: [1],
    crumb: { ru: "tool_choice", en: "tool_choice" },
    aria: { ru: "Блок tool_choice: разрешить или заставить вызов", en: "Block tool_choice: allow or force the tool call" },
    function: {
      ru: "Управляет вызовом инструмента: auto отдает решение модели, any/tool заставляют ее вызвать поиск.",
      en: "Controls the tool call: auto lets the model decide, any/tool force it to call the search.",
    },
    ragRole: {
      ru: "Управление тем, запускать ли Retrieve: разрешить модели самой решить, нужен ли поиск.",
      en: "Controls whether Retrieve runs: lets the model decide on its own if a search is needed.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "messages-user": {
    id: "messages-user",
    fields: ["messages[].role=user", "messages[].content"],
    turns: [1, 3],
    crumb: { ru: "user message", en: "user message" },
    aria: { ru: "Блок user message: реплика пользователя", en: "Block user message: the user turn" },
    function: {
      ru: "Реплика пользователя в диалоге: роль user и текст вопроса (или массив content-блоков, например tool_result).",
      en: "The user turn in the dialog: role user plus the question text (or an array of content blocks, e.g. tool_result).",
    },
    ragRole: {
      ru: "Вопрос - вход всего конвейера RAG: именно он превращается в вектор запроса на стадии retrieve.",
      en: "The question is the input to the whole RAG pipeline: it becomes the query vector at the retrieve stage.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "messages-assistant": {
    id: "messages-assistant",
    fields: ["messages[].role=assistant", "messages[].content[]"],
    turns: [3],
    crumb: { ru: "assistant message", en: "assistant message" },
    aria: { ru: "Блок assistant message: реплика модели в истории", en: "Block assistant message: the model turn in history" },
    function: {
      ru: "Реплика модели, вставленная обратно в messages: сохраненные блоки thinking и tool_use продолжают диалог.",
      en: "The model turn fed back into messages: the saved thinking and tool_use blocks continue the dialog.",
    },
    ragRole: {
      ru: "Сохраненные рассуждение и запрос поиска: без них следующий tool_result не с чем связать.",
      en: "The saved reasoning and search request: without them the next tool_result has nothing to bind to.",
    },
    chapter: null,
  },
  "response-id": {
    id: "response-id",
    fields: ["id", "type", "role", "model"],
    turns: [2, 4],
    crumb: { ru: "response id", en: "response id" },
    aria: { ru: "Блок response id: идентификатор сообщения-ответа", en: "Block response id: response message id" },
    function: {
      ru: "Идентификатор и тип сообщения-ответа: id, type message, role assistant и эхом возвращенный model.",
      en: "The id and type of the response message: id, type message, role assistant and the echoed model.",
    },
    ragRole: {
      ru: "Привязка хода диалога и трассировка запроса: по id отслеживают конкретный обмен в логах.",
      en: "Turn binding and request tracing: the id lets you track one specific exchange in logs.",
    },
    chapter: null,
  },
  "thinking-block": {
    id: "thinking-block",
    fields: ["content[].type=thinking", "content[].thinking", "content[].signature"],
    turns: [2, 3],
    crumb: { ru: "thinking block", en: "thinking block" },
    aria: { ru: "Блок thinking: видимое рассуждение модели", en: "Block thinking: visible model reasoning" },
    function: {
      ru: "Видимое рассуждение модели перед действием: текст thinking плюс криптографическая signature блока.",
      en: "The model's visible reasoning before acting: the thinking text plus the block's cryptographic signature.",
    },
    ragRole: {
      ru: "Reasoning: план стадии retrieve (надо вызвать поиск), а не финальный ответ пользователю.",
      en: "Reasoning: the retrieve-stage plan (it must call the search), not the final answer to the user.",
    },
    chapter: null,
  },
  "tool-use": {
    id: "tool-use",
    fields: ["content[].type=tool_use", "content[].id", "content[].name", "content[].input"],
    turns: [2, 3],
    crumb: { ru: "tool_use", en: "tool_use" },
    aria: { ru: "Блок tool_use: запрос модели вызвать поиск", en: "Block tool_use: model asks to call the search" },
    function: {
      ru: "Запрос модели вызвать инструмент: name search_docs, input с query и top_k, и id для связи с результатом.",
      en: "The model's request to call a tool: name search_docs, an input with query and top_k, and an id to bind the result.",
    },
    ragRole: {
      ru: "Retrieve-вызов: именно query и top_k уходят в стадию поиска (вектор запроса -> top-k по cosine).",
      en: "The Retrieve call: the query and top_k go into the search stage (query vector -> top-k by cosine).",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "tool-result": {
    id: "tool-result",
    fields: ["content[].type=tool_result", "tool_use_id", "content[]"],
    turns: [3],
    crumb: { ru: "tool_result", en: "tool_result" },
    aria: { ru: "Блок tool_result: возврат найденных чанков", en: "Block tool_result: return of the retrieved chunks" },
    function: {
      ru: "Возврат результата инструмента в диалог: связан с запросом по tool_use_id, несет найденные чанки как текст.",
      en: "Returns the tool result into the dialog: bound to the request by tool_use_id, carrying the retrieved chunks as text.",
    },
    ragRole: {
      ru: "Augmented-шаг (Lewis et al., 2020): найденные top-k чанки подкладываются в контекст модели перед генерацией.",
      en: "The Augmented step (Lewis et al., 2020): the retrieved top-k chunks are injected into the model context before generation.",
    },
    chapter: { href: "assemble-context.html", label: { ru: "assemble-context.html", en: "assemble-context.html" } },
  },
  "chunk-meta": {
    id: "chunk-meta",
    fields: ["source", "section", "date"],
    turns: [3],
    crumb: { ru: "chunk metadata", en: "chunk metadata" },
    aria: { ru: "Блок chunk metadata: source, section, date", en: "Block chunk metadata: source, section, date" },
    function: {
      ru: "Метаданные чанка внутри tool_result: source (файл), section (раздел) и date - приклеены к тексту куска.",
      en: "Chunk metadata inside tool_result: source (file), section and date - attached to the chunk text.",
    },
    ragRole: {
      ru: "Происхождение чанка: source/section/date задаются на стадии chunking и позволяют сослаться на источник.",
      en: "Chunk provenance: source/section/date are set at the chunking stage and let the answer cite the source.",
    },
    chapter: { href: "chunking.html", label: { ru: "chunking.html", en: "chunking.html" } },
  },
  "retrieval-score": {
    id: "retrieval-score",
    fields: ["cosine", "rank"],
    turns: [3],
    crumb: { ru: "retrieval score", en: "retrieval score" },
    aria: { ru: "Блок retrieval score: cosine и rank", en: "Block retrieval score: cosine and rank" },
    function: {
      ru: "Оценка близости и позиция в top-k: cosine (0..1) и rank каждого чанка, приклеенные к его тексту.",
      en: "Proximity score and top-k position: cosine (0..1) and rank of each chunk, attached to its text.",
    },
    ragRole: {
      ru: "Качество retrieve: cosine измеряет смысловую близость к запросу, rank - порядок в top-k (search.html).",
      en: "Retrieve quality: cosine measures semantic proximity to the query, rank is the top-k order (search.html).",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "text-answer": {
    id: "text-answer",
    fields: ["content[].type=text", "content[].text"],
    turns: [4],
    crumb: { ru: "text answer", en: "text answer" },
    aria: { ru: "Блок text: финальный заземленный ответ", en: "Block text: the final grounded answer" },
    function: {
      ru: "Финальный текст ответа: один блок content type text со ссылкой на source, как требовала инструкция в system.",
      en: "The final answer text: one content block of type text with a source link, as the system instruction required.",
    },
    ragRole: {
      ru: "Generation: заземленный ответ, построенный из найденных чанков, с явной ссылкой на источник.",
      en: "Generation: the grounded answer built from the retrieved chunks, with an explicit source link.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  "stop-reason": {
    id: "stop-reason",
    fields: ["stop_reason", "stop_sequence"],
    turns: [2, 4],
    crumb: { ru: "stop_reason", en: "stop_reason" },
    aria: { ru: "Блок stop_reason: почему модель остановилась", en: "Block stop_reason: why the model stopped" },
    function: {
      ru: "Почему модель остановилась: tool_use - ждет результат инструмента; end_turn - закончила сама; плюс stop_sequence.",
      en: "Why the model stopped: tool_use - it waits for a tool result; end_turn - it finished on its own; plus stop_sequence.",
    },
    ragRole: {
      ru: "Управляющий сигнал конвейера: tool_use -> ваш код обязан выполнить поиск; end_turn -> ответ готов.",
      en: "The pipeline control signal: tool_use -> your code must run the search; end_turn -> the answer is done.",
    },
    chapter: null,
  },
  usage: {
    id: "usage",
    fields: ["usage.input_tokens", "usage.output_tokens"],
    turns: [2, 4],
    crumb: { ru: "usage", en: "usage" },
    aria: { ru: "Блок usage: расход токенов за ход", en: "Block usage: per-turn token spend" },
    function: {
      ru: "Расход токенов за ход: input_tokens и output_tokens. В примере input растет с 412 (ход 2) до 638 (ход 4).",
      en: "Per-turn token spend: input_tokens and output_tokens. In the demo input grows from 412 (turn 2) to 638 (turn 4).",
    },
    ragRole: {
      ru: "Сигнал стоимости и бюджета: рост input_tokens после tool_result - цена подложенного контекста (assemble-context.html).",
      en: "Cost and budget signal: input_tokens rising after tool_result is the price of the injected context (assemble-context.html).",
    },
    chapter: { href: "assemble-context.html", label: { ru: "assemble-context.html", en: "assemble-context.html" } },
  },
};

export default {
  _schema,
  model: "claude-sonnet-4-6",
  turns,
  order,
  blocks,
};
