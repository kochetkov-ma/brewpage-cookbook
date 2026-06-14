/**
 * what-rag.js -- DATA CONTRACT for the "Что такое RAG" pipeline section.
 *
 * Consumed by shared/js/lib/pipeline.js. Seeds harvested from the approved
 * etalon (mokups/etalon/what-rag.html DRILL/DATA copy). RU-first; every
 * user-visible string is now { ru, en } so the i18n store (i18n.js) resolves by
 * active language (RU default). EN sourced from content/en/what-rag.md. ASCII
 * punctuation only, incl. inside Cyrillic.
 *
 * SHAPE
 * -----
 * Default export = {
 *   order:  string[]                       // pipeline node ids, left-to-right
 *                                          // (also the earned-progress order)
 *   nodes:  { [id]: PipelineNode }         // one rect node-card per id
 * }
 *
 * PipelineNode:
 *   {
 *     idx:    string                       // "01".."07" badge (lang-neutral)
 *     anchor: number                       // 0..100 camera pan target (% width)
 *     label:  {ru,en}                      // node-card name
 *     hint:   {ru,en}                      // node-card sub-hint
 *     crumb:  {ru,en}                      // short breadcrumb label at level 1
 *     panel:  PanelSpec                     // level-1 detail content
 *     deep?:  DeepSpec                      // optional level-2 (lens-plus) content
 *   }
 *
 * Localisation rule: every user-visible string is { ru, en }. Block `html`,
 * `vec[]`, `tokens[]`, code-ish readout values and budget numbers are kept as
 * lang-neutral strings (ASCII, same in both languages). pipeline.js resolves
 * every { ru, en } against the active i18n locale.
 *
 * PanelSpec / DeepSpec block kinds (rendered by pipeline.js renderBlocks):
 *   { kind: "tag",     text:{ru,en} }                       -- uppercase rust tag
 *   { kind: "p",       text:{ru,en} }                       -- paragraph
 *   { kind: "note",    text:{ru,en} }                       -- italic side note
 *   { kind: "rm",      text:{ru,en} }                       -- reduced-motion fallback line
 *   { kind: "readout", label:{ru,en}, html }                -- mono readout (html: trusted, ASCII)
 *   { kind: "embed",   text, tokens[], vec[], ellip, stages:[{ru,en}], vlbl:{ru,en} }
 *   { kind: "rank",    topk, items:[{chunk,w,cos}] }        -- cosine bars + top-k
 *   { kind: "cards",   items:[{src,txt}] }                  -- top-k chunk cards (src/txt lang-neutral)
 *   { kind: "assemble",lines:[{cls,text}], budget:{w,b}, budgetLabel:{ru,en}, budgetUnit:{ru,en} }
 *   { kind: "answer",  html, refs }                         -- grounded answer w/ cites
 *
 * RULES
 *   - order ids must all exist in nodes.
 *   - readout/answer html is TRUSTED static copy: ASCII only, no user input.
 *   - keep the seven nodes == seven progress steps (drilling a node earns green).
 *   - every user-visible prose field is { ru, en }; pipeline.js resolves by lang.
 */

const B = (ru, en) => ({ ru, en });

export default {
  order: ["n0", "n1", "n2", "n3", "n4", "n5", "n6"],
  nodes: {
    n0: {
      idx: "01",
      anchor: 0,
      label: B("Запрос", "Query"),
      hint: B("вопрос пользователя", "the user question"),
      crumb: B("Запрос", "Query"),
      panel: {
        tag: B("вход пользователя", "user input"),
        blocks: [
          { kind: "readout", label: B("текст запроса", "query text"), html: B('"Сколько дней отпуска в году?"', '"How many days of leave per year?"') },
          { kind: "p", text: B("Это исходный вопрос. RAG не отвечает на него по памяти модели - сначала он ищет ответ в ваших документах.", "This is the original question. RAG does not answer it from the model's memory - first it looks for the answer in your documents.") },
          { kind: "note", text: B("Дальше запрос превращается в вектор, чтобы стать сравнимым с фрагментами архива.", "Next the query is turned into a vector so it becomes comparable with the archive fragments.") },
        ],
      },
      deep: {
        crumb: B("разбор", "parse"),
        label: B("01.1 - Разбор запроса", "01.1 - Parsing the query"),
        tag: B("нормализация перед эмбеддингом", "normalisation before embedding"),
        blocks: [
          { kind: "readout", label: B("токены запроса", "query tokens"), html: B('["сколько", "дней", "отпуска", "в", "году", "?"] - <span class="num">6</span> токенов', '["how", "many", "days", "of", "leave", "?"] - <span class="num">6</span> tokens') },
          { kind: "readout", label: B("язык / тип", "language / type"), html: B('lang=ru - intent=factual-lookup - len=29 симв.', 'lang=en - intent=factual-lookup - len=29 chars') },
          { kind: "note", text: B("Запрос очищается и токенизируется, затем целиком кодируется в один вектор смысла.", "The query is cleaned and tokenised, then encoded as a whole into one meaning vector.") },
        ],
      },
    },
    n1: {
      idx: "02",
      anchor: 14,
      label: B("Эмбеддинг запроса", "Query embedding"),
      hint: B("текст -> вектор", "text -> vector"),
      crumb: B("Эмбеддинг", "Embedding"),
      panel: {
        tag: B("текст -> вектор", "text -> vector"),
        blocks: [
          { kind: "p", text: B("Смотрите, как текст превращается в 1536 чисел - координаты смысла в векторном пространстве.", "Watch the text turn into 1536 numbers - the coordinates of meaning in the vector space.") },
          {
            kind: "embed",
            text: B('"Сколько дней отпуска в году?"', '"How many days of leave per year?"'),
            tokens: [B("сколько", "how"), B("дней", "many"), B("отпуска", "days"), B("в", "of"), B("году", "leave"), "?"],
            vec: ["0.81", "-0.12", "0.47", "0.05", "-0.63", "0.21"],
            ellip: "... 1536",
            stages: [B("1 - исходный текст", "1 - source text"), B("2 - разбиение на токены", "2 - split into tokens"), B("3 - вычисление вектора - dim 1536", "3 - compute the vector - dim 1536")],
            vlbl: B("координаты смысла", "coordinates of meaning"),
          },
          { kind: "rm", text: B("Текст разбивается на токены, затем кодируется в вектор из 1536 чисел: [0.81, -0.12, 0.47, 0.05, -0.63, 0.21, ...].", "The text is split into tokens, then encoded into a vector of 1536 numbers: [0.81, -0.12, 0.47, 0.05, -0.63, 0.21, ...].") },
        ],
      },
      deep: {
        crumb: B("вектор", "vector"),
        label: B("02.1 - Координаты вектора", "02.1 - Vector coordinates"),
        tag: B("первые 8 из 1536 измерений", "first 8 of 1536 dimensions"),
        blocks: [
          { kind: "readout", label: B("q-vector [0..7]", "q-vector [0..7]"), html: '<span class="num">0.812</span>  <span class="num">-0.124</span>  <span class="num">0.470</span>  <span class="num">0.051</span><br><span class="num">-0.633</span>  <span class="num">0.209</span>  <span class="num">0.018</span>  <span class="num">-0.347</span>' },
          { kind: "readout", label: B("норма ||q||", "norm ||q||"), html: B('<span class="num">1.000</span> - вектор нормирован -> сравнение по косинусу', '<span class="num">1.000</span> - vector is normalised -> compared by cosine') },
          { kind: "note", text: B("Близость двух нормированных векторов = косинус угла между ними. Так индекс измеряет смысловое сходство запроса и фрагмента.", "The closeness of two normalised vectors = the cosine of the angle between them. That is how the index measures the semantic similarity of the query and a fragment.") },
        ],
      },
    },
    n2: {
      idx: "03",
      anchor: 28,
      label: B("Векторный индекс (ANN)", "Vector index (ANN)"),
      hint: B("ближайшие соседи", "nearest neighbours"),
      crumb: B("Индекс", "Index"),
      panel: {
        tag: B("поиск ближайших соседей", "nearest-neighbour search"),
        blocks: [
          { kind: "p", text: B("Индекс ищет фрагменты, чьи векторы ближе всего к вектору запроса по косинусу. Полосы заполняются по величине косинуса, верхние k=3 подсвечиваются:", "The index looks for fragments whose vectors are closest to the query vector by cosine. The bars fill by the cosine value, and the top k=3 are highlighted:") },
          {
            kind: "rank",
            topk: 3,
            items: [
              { chunk: "chunk #128", w: 92, cos: "cos 0.92" },
              { chunk: "chunk #054", w: 86, cos: "cos 0.86" },
              { chunk: "chunk #211", w: 74, cos: "cos 0.74" },
              { chunk: "chunk #009", w: 61, cos: "cos 0.61" },
            ],
          },
          { kind: "note", text: B("Это приближённый поиск соседей (ANN), не перебор всего архива - поэтому он быстрый даже на миллионах фрагментов.", "This is approximate nearest-neighbour search (ANN), not a scan of the whole archive - which is why it is fast even on millions of fragments.") },
        ],
      },
      deep: {
        crumb: B("фрагмент", "fragment"),
        label: B("03.1 - Ближайший фрагмент", "03.1 - The nearest fragment"),
        tag: B("chunk #128 - cos 0.92", "chunk #128 - cos 0.92"),
        blocks: [
          { kind: "cards", items: [{ src: B("policy.md, разд. 4", "policy.md, sect. 4"), txt: B('"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."', '"An employee is granted annual paid leave - 28 calendar days."') }] },
          { kind: "readout", label: B("метаданные", "metadata"), html: 'doc=policy.md - section=4 - tokens=<span class="num">19</span> - cos=<span class="num">0.92</span>' },
          { kind: "note", text: B("Самый близкий по смыслу фрагмент - именно он несёт прямой ответ на вопрос об отпуске.", "The fragment closest in meaning - it is the one that carries the direct answer to the question about leave.") },
        ],
      },
    },
    n3: {
      idx: "04",
      anchor: 42,
      label: B("Топ-k фрагментов", "Top-k fragments"),
      hint: B("k = 3", "k = 3"),
      crumb: B("Топ-k", "Top-k"),
      panel: {
        tag: B("k = 3 - источник + текст", "k = 3 - source + text"),
        blocks: [
          {
            kind: "cards",
            items: [
              { src: B("[1] policy.md, разд. 4", "[1] policy.md, sect. 4"), txt: B('"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."', '"An employee is granted annual paid leave - 28 calendar days."') },
              { src: B("[2] policy.md, разд. 4", "[2] policy.md, sect. 4"), txt: B('"Неиспользованные дни можно перенести на следующий год по согласованию с руководителем."', '"Unused days can be carried over to the next year by agreement with the manager."') },
              { src: B("[3] hr-faq.md", "[3] hr-faq.md"), txt: B('"Отпуск оформляется заявлением за 2 недели до начала."', '"Leave is requested in writing 2 weeks before it starts."') },
            ],
          },
          { kind: "note", text: B("Берём только k=3 лучших фрагмента - этого хватает для ответа и экономит бюджет токенов.", "We take only the k=3 best fragments - that is enough for the answer and saves the token budget.") },
        ],
      },
    },
    n4: {
      idx: "05",
      anchor: 57,
      label: B("Сборка контекста", "Context assembly"),
      hint: B("промпт + бюджет", "prompt + budget"),
      crumb: B("Контекст", "Context"),
      panel: {
        tag: B("фрагменты падают в шаблон промпта", "fragments drop into the prompt template"),
        blocks: [
          {
            kind: "assemble",
            lines: [
              { cls: "sys", text: B("Системная инструкция: отвечай только по контексту, ставь ссылки.", "System instruction: answer only from the context, add citations.") },
              { cls: "ctx", text: B("Контекст:", "Context:") },
              { cls: "ctx", text: B('[1] policy.md: "...ежегодный оплачиваемый отдых - 28 календарных дней."', '[1] policy.md: "...annual paid leave - 28 calendar days."') },
              { cls: "ctx", text: B('[2] policy.md: "Неиспользованные дни можно перенести..."', '[2] policy.md: "Unused days can be carried over..."') },
              { cls: "ctx", text: B('[3] hr-faq.md: "Отпуск оформляется заявлением за 2 недели."', '[3] hr-faq.md: "Leave is requested in writing 2 weeks ahead."') },
              { cls: "q", text: B("Вопрос: Сколько дней отпуска в году?", "Question: How many days of leave per year?") },
            ],
            budget: { w: 15, b: "1 240 / 8 192" },
            budgetLabel: B("бюджет токенов", "token budget"),
            budgetUnit: B("токенов", "tokens"),
          },
          { kind: "note", text: B("Инструкция + найденные фрагменты + вопрос собираются в один промпт. Модель отвечает строго по этому контексту.", "Instruction + the found fragments + the question are assembled into one prompt. The model answers strictly from this context.") },
        ],
      },
    },
    n5: {
      idx: "06",
      anchor: 71,
      label: B("LLM", "LLM"),
      hint: B("генерация", "generation"),
      crumb: B("LLM", "LLM"),
      panel: {
        tag: B("генерация ответа", "answer generation"),
        blocks: [
          { kind: "p", text: B("Модель получает собранный промпт и генерирует ответ, опираясь на переданный контекст, а не на свою память.", "The model receives the assembled prompt and generates an answer leaning on the supplied context, not on its memory.") },
          { kind: "readout", label: B("вход / выход", "input / output"), html: B('вход: <span class="num">1 240</span> токенов контекста - выход: ответ + маркеры цитат [1] [2]', 'input: <span class="num">1 240</span> context tokens - output: answer + citation markers [1] [2]') },
          { kind: "note", text: B("Контекст ограничивает модель найденными фрагментами - это и снижает выдумки (галлюцинации).", "The context limits the model to the found fragments - and that reduces made-up facts (hallucinations).") },
        ],
      },
    },
    n6: {
      idx: "07",
      anchor: 85,
      label: B("Ответ со ссылками", "Answer with citations"),
      hint: B("с цитатами", "with citations"),
      crumb: B("Ответ", "Answer"),
      panel: {
        tag: B("с цитатами на источники", "with citations to sources"),
        blocks: [
          { kind: "answer", html: B('По политике компании - 28 календарных дней оплачиваемого отпуска в год <cite>1</cite>. Неиспользованные дни можно перенести <cite>2</cite>.', 'Per company policy - 28 calendar days of paid leave per year <cite>1</cite>. Unused days can be carried over <cite>2</cite>.') },
          { kind: "readout", label: B("ссылки", "references"), html: B('[1] policy.md, разд. 4 - [2] policy.md, разд. 4', '[1] policy.md, sect. 4 - [2] policy.md, sect. 4') },
          { kind: "note", text: B("Ответ опирается на найденные фрагменты, а не на память модели - и каждое утверждение прослеживается до источника.", "The answer leans on the found fragments, not on the model's memory - and every statement is traceable to a source.") },
        ],
      },
    },
  },
};
