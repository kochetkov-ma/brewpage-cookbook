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
 *   model:   string,                 // model id echoed in every turn ("claude-sonnet-4-5")
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
  "Ty pomoshchnik podderzhki. Otvechaj TOL'KO po tekstu, kotoryj vernul instrument search_docs. " +
  "Esli otveta v najdennyh kuskah net, chestno skazhi: etogo net v dokumentah. " +
  "Ukazyvaj istochnik kazhdogo fakta po polyu source.";

// ---- The 4 turns. Each `json` is a real, parse-able, ASCII-only payload. ----

const TURN1 = {
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  thinking: { type: "enabled", budget_tokens: 2048 },
  system: SYSTEM,
  tools: [
    {
      name: "search_docs",
      description: "Semanticheskij poisk top-k chunkov po vektornoj baze znanij.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Poiskovyj zapros polzovatelya" },
          top_k: { type: "integer", description: "Skol'ko blizhajshih chunkov vernut'", default: 4 },
        },
        required: ["query"],
      },
    },
  ],
  tool_choice: { type: "auto" },
  messages: [
    { role: "user", content: "Skol'ko dnej otpuska u sotrudnika posle treh let raboty?" },
  ],
};

const TURN2 = {
  id: "msg_01XAbcRequestDemo",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-4-5",
  content: [
    {
      type: "thinking",
      thinking:
        "Vopros pro dni otpuska posle treh let stazha. V system skazano otvechat' tol'ko po " +
        "najdennomu, svoih dannyh u menya net. Nado vyzvat' search_docs s zaprosom pro otpusk i stazh.",
      signature: "EqoBCkgDEMODEMOsignaturePLACEHOLDER==",
    },
    {
      type: "tool_use",
      id: "toolu_01A09q90qwDEMO",
      name: "search_docs",
      input: { query: "dni otpuska stazh tri goda politika", top_k: 4 },
    },
  ],
  stop_reason: "tool_use",
  stop_sequence: null,
  usage: { input_tokens: 412, output_tokens: 76 },
};

const TURN3 = {
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  system: SYSTEM,
  tools: [
    {
      name: "search_docs",
      description: "Semanticheskij poisk top-k chunkov po vektornoj baze znanij.",
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
    { role: "user", content: "Skol'ko dnej otpuska u sotrudnika posle treh let raboty?" },
    {
      role: "assistant",
      content: [
        {
          type: "thinking",
          thinking:
            "Vopros pro dni otpuska posle treh let stazha. Nado vyzvat' search_docs.",
          signature: "EqoBCkgDEMODEMOsignaturePLACEHOLDER==",
        },
        {
          type: "tool_use",
          id: "toolu_01A09q90qwDEMO",
          name: "search_docs",
          input: { query: "dni otpuska stazh tri goda politika", top_k: 4 },
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
                "[chunk c-118 | source=hr-policy.md | section=Otpuska | date=2026-01-10 | " +
                "cosine=0.83 | rank=1] Posle 3 polnyh let stazha sotrudniku polagaetsya 28 " +
                "kalendarnyh dnej oplachivaemogo otpuska v god.",
            },
            {
              type: "text",
              text:
                "[chunk c-119 | source=hr-policy.md | section=Otpuska | date=2026-01-10 | " +
                "cosine=0.71 | rank=2] Bazovyj otpusk pri stazhe do 3 let sostavlyaet 24 " +
                "kalendarnyh dnya.",
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
  model: "claude-sonnet-4-5",
  content: [
    {
      type: "text",
      text:
        "Posle treh polnyh let stazha sotrudniku polagaetsya 28 kalendarnyh dnej oplachivaemogo " +
        "otpuska v god (istochnik: hr-policy.md, razdel Otpuska).",
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
    title: { ru: "Hod 1. Zapros: vopros + opisanie instrumenta poiska", en: "Turn 1. Request: question + search tool description" },
    json: jstr(TURN1),
  },
  {
    n: 2,
    dir: "response",
    title: { ru: "Hod 2. Otvet: model rassuzhdaet i prosit vyzvat' poisk", en: "Turn 2. Response: model reasons and requests the search call" },
    json: jstr(TURN2),
  },
  {
    n: 3,
    dir: "request",
    title: { ru: "Hod 3. Zapros s tool_result: vozvrashchaem najdennye chunki", en: "Turn 3. Request with tool_result: return the retrieved chunks" },
    json: jstr(TURN3),
  },
  {
    n: 4,
    dir: "response",
    title: { ru: "Hod 4. Zazemlennyj otvet modeli", en: "Turn 4. Grounded answer from the model" },
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
    aria: { ru: "Blok model: kakuyu model vyzvat'", en: "Block model: which model to call" },
    function: {
      ru: "Kakuyu model vyzvat'. Zdes' claude-sonnet-4-5; modeli s servera ehom vozvrashchayut etot id v kazhdom otvete.",
      en: "Which model to call. Here claude-sonnet-4-5; the server echoes this id back in every response.",
    },
    ragRole: {
      ru: "Vybor generatora stadii Generation; opredelyaet predel dliny konteksta i stoimost zaprosa.",
      en: "Generator choice for the Generation stage; drives the context length limit and request cost.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  budget: {
    id: "budget",
    fields: ["max_tokens"],
    turns: [1, 3],
    crumb: { ru: "max_tokens", en: "max_tokens" },
    aria: { ru: "Blok max_tokens: potolok dliny otveta", en: "Block max_tokens: answer length ceiling" },
    function: {
      ru: "Potolok dliny otveta v tokenah. Model ostanovitsya, dostignuv ego (stop_reason max_tokens).",
      en: "Answer length ceiling in tokens. The model stops once it is hit (stop_reason max_tokens).",
    },
    ragRole: {
      ru: "Kontrol stoimosti i zaderzhki stadii Generation: korotkij potolok = deshevle i bystree.",
      en: "Cost and latency control of the Generation stage: a shorter ceiling is cheaper and faster.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  "thinking-config": {
    id: "thinking-config",
    fields: ["thinking.type", "thinking.budget_tokens"],
    turns: [1],
    crumb: { ru: "thinking config", en: "thinking config" },
    aria: { ru: "Blok thinking config: vklyuchit rasshirennoe rassuzhdenie", en: "Block thinking config: enable extended reasoning" },
    function: {
      ru: "Vklyuchaet rasshirennoe rassuzhdenie (type enabled) i zadaet ego byudzhet tokenov (budget_tokens).",
      en: "Enables extended thinking (type enabled) and sets its token budget (budget_tokens).",
    },
    ragRole: {
      ru: "Byudzhet na rassuzhdenie stadij retrieve i generation: skolko model mozhet dumat' pered dejstviem.",
      en: "Reasoning budget for the retrieve and generation stages: how much the model may think before acting.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  system: {
    id: "system",
    fields: ["system"],
    turns: [1, 3],
    crumb: { ru: "system", en: "system" },
    aria: { ru: "Blok system: sistemnaya instrukciya zazemleniya", en: "Block system: grounding system instruction" },
    function: {
      ru: "Sistemnaya instrukciya modeli: zhestkoe pravilo otvechat' tol'ko po najdennomu i chestno priznavat' probel.",
      en: "The system instruction: a hard rule to answer only from retrieved text and to admit gaps honestly.",
    },
    ragRole: {
      ru: "Grounding: pravila otvechat' tol'ko po kontekstu i citirovat' istochnik - instrukciya stadii Generation.",
      en: "Grounding: answer-only-from-context plus cite-the-source rules - the Generation-stage instruction.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  tools: {
    id: "tools",
    fields: ["tools[].name", "tools[].description", "tools[].input_schema"],
    turns: [1, 3],
    crumb: { ru: "tools", en: "tools" },
    aria: { ru: "Blok tools: opisanie instrumenta poiska", en: "Block tools: search tool description" },
    function: {
      ru: "Opisyvaet dostupnye instrumenty: imya, opisanie i input_schema funkcii search_docs, kotoruyu model mozhet vyzvat'.",
      en: "Declares the available tools: the name, description and input_schema of the search_docs function the model may call.",
    },
    ragRole: {
      ru: "Obyavlenie shaga Retrieve kak vyzyvaemoj funkcii (Lewis et al., 2020), vyrazhennoe v sheme tool use.",
      en: "Declares the Retrieve step as a callable function (Lewis et al., 2020), expressed in the tool-use schema.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "tool-choice": {
    id: "tool-choice",
    fields: ["tool_choice.type"],
    turns: [1],
    crumb: { ru: "tool_choice", en: "tool_choice" },
    aria: { ru: "Blok tool_choice: razreshit ili zastavit vyzov", en: "Block tool_choice: allow or force the tool call" },
    function: {
      ru: "Upravlyaet vyzovom instrumenta: auto otdaet reshenie modeli, any/tool zastavlyayut ee vyzvat poisk.",
      en: "Controls the tool call: auto lets the model decide, any/tool force it to call the search.",
    },
    ragRole: {
      ru: "Upravlenie tem, zapuskat' li Retrieve: razreshit modeli samoj reshit', nuzhen li poisk.",
      en: "Controls whether Retrieve runs: lets the model decide on its own if a search is needed.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "messages-user": {
    id: "messages-user",
    fields: ["messages[].role=user", "messages[].content"],
    turns: [1, 3],
    crumb: { ru: "user message", en: "user message" },
    aria: { ru: "Blok user message: replika polzovatelya", en: "Block user message: the user turn" },
    function: {
      ru: "Replika polzovatelya v dialoge: rol user i tekst voprosa (ili massiv content-blokov, naprimer tool_result).",
      en: "The user turn in the dialog: role user plus the question text (or an array of content blocks, e.g. tool_result).",
    },
    ragRole: {
      ru: "Vopros - vhod vsego konvejera RAG: imenno on prevrashchaetsya v vektor zaprosa na stadii retrieve.",
      en: "The question is the input to the whole RAG pipeline: it becomes the query vector at the retrieve stage.",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "messages-assistant": {
    id: "messages-assistant",
    fields: ["messages[].role=assistant", "messages[].content[]"],
    turns: [3],
    crumb: { ru: "assistant message", en: "assistant message" },
    aria: { ru: "Blok assistant message: replika modeli v istorii", en: "Block assistant message: the model turn in history" },
    function: {
      ru: "Replika modeli, vstavlennaya obratno v messages: sohranennye bloki thinking i tool_use prodolzhayut dialog.",
      en: "The model turn fed back into messages: the saved thinking and tool_use blocks continue the dialog.",
    },
    ragRole: {
      ru: "Sohranennye rassuzhdenie i zapros poiska: bez nih sleduyushchij tool_result ne s chem svyazat'.",
      en: "The saved reasoning and search request: without them the next tool_result has nothing to bind to.",
    },
    chapter: null,
  },
  "response-id": {
    id: "response-id",
    fields: ["id", "type", "role", "model"],
    turns: [2, 4],
    crumb: { ru: "response id", en: "response id" },
    aria: { ru: "Blok response id: identifikator soobshcheniya-otveta", en: "Block response id: response message id" },
    function: {
      ru: "Identifikator i tip soobshcheniya-otveta: id, type message, role assistant i ehom vozvrashchennyj model.",
      en: "The id and type of the response message: id, type message, role assistant and the echoed model.",
    },
    ragRole: {
      ru: "Privyazka hoda dialoga i trassirovka zaprosa: po id otslezhivayut konkretnyj obmen v logah.",
      en: "Turn binding and request tracing: the id lets you track one specific exchange in logs.",
    },
    chapter: null,
  },
  "thinking-block": {
    id: "thinking-block",
    fields: ["content[].type=thinking", "content[].thinking", "content[].signature"],
    turns: [2, 3],
    crumb: { ru: "thinking block", en: "thinking block" },
    aria: { ru: "Blok thinking: vidimoe rassuzhdenie modeli", en: "Block thinking: visible model reasoning" },
    function: {
      ru: "Vidimoe rassuzhdenie modeli pered dejstviem: tekst thinking plyus kriptograficheskaya signature bloka.",
      en: "The model's visible reasoning before acting: the thinking text plus the block's cryptographic signature.",
    },
    ragRole: {
      ru: "Reasoning: plan stadii retrieve (nado vyzvat' poisk), a ne finalnyj otvet polzovatelyu.",
      en: "Reasoning: the retrieve-stage plan (it must call the search), not the final answer to the user.",
    },
    chapter: null,
  },
  "tool-use": {
    id: "tool-use",
    fields: ["content[].type=tool_use", "content[].id", "content[].name", "content[].input"],
    turns: [2, 3],
    crumb: { ru: "tool_use", en: "tool_use" },
    aria: { ru: "Blok tool_use: zapros modeli vyzvat poisk", en: "Block tool_use: model asks to call the search" },
    function: {
      ru: "Zapros modeli vyzvat instrument: name search_docs, input s query i top_k, i id dlya svyazi s rezultatom.",
      en: "The model's request to call a tool: name search_docs, an input with query and top_k, and an id to bind the result.",
    },
    ragRole: {
      ru: "Retrieve-vyzov: imenno query i top_k uhodyat v stadiyu poiska (vektor zaprosa -> top-k po cosine).",
      en: "The Retrieve call: the query and top_k go into the search stage (query vector -> top-k by cosine).",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "tool-result": {
    id: "tool-result",
    fields: ["content[].type=tool_result", "tool_use_id", "content[]"],
    turns: [3],
    crumb: { ru: "tool_result", en: "tool_result" },
    aria: { ru: "Blok tool_result: vozvrat najdennyh chunkov", en: "Block tool_result: return of the retrieved chunks" },
    function: {
      ru: "Vozvrat rezultata instrumenta v dialog: svyazan s zaprosom po tool_use_id, neset najdennye chunki kak tekst.",
      en: "Returns the tool result into the dialog: bound to the request by tool_use_id, carrying the retrieved chunks as text.",
    },
    ragRole: {
      ru: "Augmented-shag (Lewis et al., 2020): najdennye top-k chunki podkladyvayutsya v kontekst modeli pered generaciej.",
      en: "The Augmented step (Lewis et al., 2020): the retrieved top-k chunks are injected into the model context before generation.",
    },
    chapter: { href: "assemble-context.html", label: { ru: "assemble-context.html", en: "assemble-context.html" } },
  },
  "chunk-meta": {
    id: "chunk-meta",
    fields: ["source", "section", "date"],
    turns: [3],
    crumb: { ru: "chunk metadata", en: "chunk metadata" },
    aria: { ru: "Blok chunk metadata: source, section, date", en: "Block chunk metadata: source, section, date" },
    function: {
      ru: "Metadannye chunka vnutri tool_result: source (fajl), section (razdel) i date - prikleeny k tekstu kuska.",
      en: "Chunk metadata inside tool_result: source (file), section and date - attached to the chunk text.",
    },
    ragRole: {
      ru: "Proishozhdenie chunka: source/section/date zadayutsya na stadii chunking i pozvolyayut soslat'sya na istochnik.",
      en: "Chunk provenance: source/section/date are set at the chunking stage and let the answer cite the source.",
    },
    chapter: { href: "chunking.html", label: { ru: "chunking.html", en: "chunking.html" } },
  },
  "retrieval-score": {
    id: "retrieval-score",
    fields: ["cosine", "rank"],
    turns: [3],
    crumb: { ru: "retrieval score", en: "retrieval score" },
    aria: { ru: "Blok retrieval score: cosine i rank", en: "Block retrieval score: cosine and rank" },
    function: {
      ru: "Ocenka blizosti i poziciya v top-k: cosine (0..1) i rank kazhdogo chunka, prikleennye k ego tekstu.",
      en: "Proximity score and top-k position: cosine (0..1) and rank of each chunk, attached to its text.",
    },
    ragRole: {
      ru: "Kachestvo retrieve: cosine izmeryaet smyslovuyu blizost' k zaprosu, rank - poryadok v top-k (search.html).",
      en: "Retrieve quality: cosine measures semantic proximity to the query, rank is the top-k order (search.html).",
    },
    chapter: { href: "search.html", label: { ru: "search.html", en: "search.html" } },
  },
  "text-answer": {
    id: "text-answer",
    fields: ["content[].type=text", "content[].text"],
    turns: [4],
    crumb: { ru: "text answer", en: "text answer" },
    aria: { ru: "Blok text: finalnyj zazemlennyj otvet", en: "Block text: the final grounded answer" },
    function: {
      ru: "Finalnyj tekst otveta: odin blok content type text so ssylkoj na source, kak trebovala instrukciya v system.",
      en: "The final answer text: one content block of type text with a source link, as the system instruction required.",
    },
    ragRole: {
      ru: "Generation: zazemlennyj otvet, postroennyj iz najdennyh chunkov, s yavnoj ssylkoj na istochnik.",
      en: "Generation: the grounded answer built from the retrieved chunks, with an explicit source link.",
    },
    chapter: { href: "generation.html", label: { ru: "generation.html", en: "generation.html" } },
  },
  "stop-reason": {
    id: "stop-reason",
    fields: ["stop_reason", "stop_sequence"],
    turns: [2, 4],
    crumb: { ru: "stop_reason", en: "stop_reason" },
    aria: { ru: "Blok stop_reason: pochemu model ostanovilas'", en: "Block stop_reason: why the model stopped" },
    function: {
      ru: "Pochemu model ostanovilas': tool_use - zhdet rezultat instrumenta; end_turn - zakonchila sama; plyus stop_sequence.",
      en: "Why the model stopped: tool_use - it waits for a tool result; end_turn - it finished on its own; plus stop_sequence.",
    },
    ragRole: {
      ru: "Upravlyayushchij signal konvejera: tool_use -> vash kod obyazan vypolnit' poisk; end_turn -> otvet gotov.",
      en: "The pipeline control signal: tool_use -> your code must run the search; end_turn -> the answer is done.",
    },
    chapter: null,
  },
  usage: {
    id: "usage",
    fields: ["usage.input_tokens", "usage.output_tokens"],
    turns: [2, 4],
    crumb: { ru: "usage", en: "usage" },
    aria: { ru: "Blok usage: rashod tokenov za hod", en: "Block usage: per-turn token spend" },
    function: {
      ru: "Rashod tokenov za hod: input_tokens i output_tokens. V primere input rastet s 412 (hod 2) do 638 (hod 4).",
      en: "Per-turn token spend: input_tokens and output_tokens. In the demo input grows from 412 (turn 2) to 638 (turn 4).",
    },
    ragRole: {
      ru: "Signal stoimosti i byudzheta: rost input_tokens posle tool_result - cena podlozhennogo konteksta (assemble-context.html).",
      en: "Cost and budget signal: input_tokens rising after tool_result is the price of the injected context (assemble-context.html).",
    },
    chapter: { href: "assemble-context.html", label: { ru: "assemble-context.html", en: "assemble-context.html" } },
  },
};

export default {
  _schema,
  model: "claude-sonnet-4-5",
  turns,
  order,
  blocks,
};
