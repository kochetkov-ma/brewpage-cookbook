/**
 * what-rag.js -- DATA CONTRACT for the "Что такое RAG" pipeline section.
 *
 * Consumed by shared/js/lib/pipeline.js. Seeds harvested from the approved
 * etalon (mokups/etalon/what-rag.html DRILL/DATA copy). RU-first; the shape is
 * i18n-ready ({ ru, en } where copy differs by language). cookbook-author owns
 * the final VALUES; interactive-engineer owns the SHAPE + the renderer.
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
 *     idx:    string                       // "01".."07" badge
 *     anchor: number                       // 0..100 camera pan target (% width)
 *     label:  string                       // node-card name
 *     hint:   string                       // node-card sub-hint
 *     crumb:  string                       // short breadcrumb label at level 1
 *     panel:  PanelSpec                     // level-1 detail content
 *     deep?:  DeepSpec                      // optional level-2 (lens-plus) content
 *   }
 *
 * PanelSpec / DeepSpec block kinds (rendered by pipeline.js renderBlocks):
 *   { kind: "tag",     text }                              -- uppercase rust tag
 *   { kind: "p",       text }                              -- paragraph
 *   { kind: "note",    text }                              -- italic side note
 *   { kind: "readout", label, html }                       -- mono readout (html: trusted, ASCII)
 *   { kind: "embed",   text, tokens[], vec[], ellip }      -- text->tokens->vector didactic
 *   { kind: "rank",    topk, items:[{chunk,w,cos}] }       -- cosine bars + top-k
 *   { kind: "cards",   items:[{src,txt}] }                 -- top-k chunk cards
 *   { kind: "assemble",lines:[{cls,text}], budget:{w,b} }  -- prompt assembly + budget
 *   { kind: "answer",  html, refs }                        -- grounded answer w/ cites
 *
 * RULES
 *   - order ids must all exist in nodes.
 *   - readout/answer html is TRUSTED static copy: ASCII only, no user input.
 *   - keep the seven nodes == seven progress steps (drilling a node earns green).
 */

const T = (ru) => ru; // single-language seed today; swap for { ru, en } per field later.

export default {
  order: ["n0", "n1", "n2", "n3", "n4", "n5", "n6"],
  nodes: {
    n0: {
      idx: "01",
      anchor: 0,
      label: T("Запрос"),
      hint: T("вопрос пользователя"),
      crumb: T("Запрос"),
      panel: {
        tag: T("вход пользователя"),
        blocks: [
          { kind: "readout", label: T("текст запроса"), html: '"Сколько дней отпуска в году?"' },
          { kind: "p", text: T("Это исходный вопрос. RAG не отвечает на него по памяти модели - сначала он ищет ответ в ваших документах.") },
          { kind: "note", text: T("Дальше запрос превращается в вектор, чтобы стать сравнимым с фрагментами архива.") },
        ],
      },
      deep: {
        crumb: T("разбор"),
        label: T("01.1 - Разбор запроса"),
        tag: T("нормализация перед эмбеддингом"),
        blocks: [
          { kind: "readout", label: T("токены запроса"), html: '["сколько", "дней", "отпуска", "в", "году", "?"] - <span class="num">6</span> токенов' },
          { kind: "readout", label: T("язык / тип"), html: 'lang=ru - intent=factual-lookup - len=29 симв.' },
          { kind: "note", text: T("Запрос очищается и токенизируется, затем целиком кодируется в один вектор смысла.") },
        ],
      },
    },
    n1: {
      idx: "02",
      anchor: 14,
      label: T("Эмбеддинг запроса"),
      hint: T("текст -> вектор"),
      crumb: T("Эмбеддинг"),
      panel: {
        tag: T("текст -> вектор"),
        blocks: [
          { kind: "p", text: T("Смотрите, как текст превращается в 1536 чисел - координаты смысла в векторном пространстве.") },
          {
            kind: "embed",
            text: '"Сколько дней отпуска в году?"',
            tokens: ["сколько", "дней", "отпуска", "в", "году", "?"],
            vec: ["0.81", "-0.12", "0.47", "0.05", "-0.63", "0.21"],
            ellip: "... 1536",
            stages: [T("1 - исходный текст"), T("2 - разбиение на токены"), T("3 - вычисление вектора - dim 1536")],
            vlbl: T("координаты смысла"),
          },
          { kind: "rm", text: T("Текст разбивается на токены, затем кодируется в вектор из 1536 чисел: [0.81, -0.12, 0.47, 0.05, -0.63, 0.21, ...].") },
        ],
      },
      deep: {
        crumb: T("вектор"),
        label: T("02.1 - Координаты вектора"),
        tag: T("первые 8 из 1536 измерений"),
        blocks: [
          { kind: "readout", label: T("q-vector [0..7]"), html: '<span class="num">0.812</span>  <span class="num">-0.124</span>  <span class="num">0.470</span>  <span class="num">0.051</span><br><span class="num">-0.633</span>  <span class="num">0.209</span>  <span class="num">0.018</span>  <span class="num">-0.347</span>' },
          { kind: "readout", label: T("норма ||q||"), html: '<span class="num">1.000</span> - вектор нормирован -> сравнение по косинусу' },
          { kind: "note", text: T("Близость двух нормированных векторов = косинус угла между ними. Так индекс измеряет смысловое сходство запроса и фрагмента.") },
        ],
      },
    },
    n2: {
      idx: "03",
      anchor: 28,
      label: T("Векторный индекс (ANN)"),
      hint: T("ближайшие соседи"),
      crumb: T("Индекс"),
      panel: {
        tag: T("поиск ближайших соседей"),
        blocks: [
          { kind: "p", text: T("Индекс ищет фрагменты, чьи векторы ближе всего к вектору запроса по косинусу. Полосы заполняются по величине косинуса, верхние k=3 подсвечиваются:") },
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
          { kind: "note", text: T("Это приближённый поиск соседей (ANN), не перебор всего архива - поэтому он быстрый даже на миллионах фрагментов.") },
        ],
      },
      deep: {
        crumb: T("фрагмент"),
        label: T("03.1 - Ближайший фрагмент"),
        tag: T("chunk #128 - cos 0.92"),
        blocks: [
          { kind: "cards", items: [{ src: "policy.md, разд. 4", txt: '"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."' }] },
          { kind: "readout", label: T("метаданные"), html: 'doc=policy.md - section=4 - tokens=<span class="num">19</span> - cos=<span class="num">0.92</span>' },
          { kind: "note", text: T("Самый близкий по смыслу фрагмент - именно он несёт прямой ответ на вопрос об отпуске.") },
        ],
      },
    },
    n3: {
      idx: "04",
      anchor: 42,
      label: T("Топ-k фрагментов"),
      hint: T("k = 3"),
      crumb: T("Топ-k"),
      panel: {
        tag: T("k = 3 - источник + текст"),
        blocks: [
          {
            kind: "cards",
            items: [
              { src: "[1] policy.md, разд. 4", txt: '"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."' },
              { src: "[2] policy.md, разд. 4", txt: '"Неиспользованные дни можно перенести на следующий год по согласованию с руководителем."' },
              { src: "[3] hr-faq.md", txt: '"Отпуск оформляется заявлением за 2 недели до начала."' },
            ],
          },
          { kind: "note", text: T("Берём только k=3 лучших фрагмента - этого хватает для ответа и экономит бюджет токенов.") },
        ],
      },
    },
    n4: {
      idx: "05",
      anchor: 57,
      label: T("Сборка контекста"),
      hint: T("промпт + бюджет"),
      crumb: T("Контекст"),
      panel: {
        tag: T("фрагменты падают в шаблон промпта"),
        blocks: [
          {
            kind: "assemble",
            lines: [
              { cls: "sys", text: "Системная инструкция: отвечай только по контексту, ставь ссылки." },
              { cls: "ctx", text: "Контекст:" },
              { cls: "ctx", text: '[1] policy.md: "...ежегодный оплачиваемый отдых - 28 календарных дней."' },
              { cls: "ctx", text: '[2] policy.md: "Неиспользованные дни можно перенести..."' },
              { cls: "ctx", text: '[3] hr-faq.md: "Отпуск оформляется заявлением за 2 недели."' },
              { cls: "q", text: "Вопрос: Сколько дней отпуска в году?" },
            ],
            budget: { w: 15, b: "1 240 / 8 192" },
            budgetLabel: T("бюджет токенов"),
            budgetUnit: T("токенов"),
          },
          { kind: "note", text: T("Инструкция + найденные фрагменты + вопрос собираются в один промпт. Модель отвечает строго по этому контексту.") },
        ],
      },
    },
    n5: {
      idx: "06",
      anchor: 71,
      label: T("LLM"),
      hint: T("генерация"),
      crumb: T("LLM"),
      panel: {
        tag: T("генерация ответа"),
        blocks: [
          { kind: "p", text: T("Модель получает собранный промпт и генерирует ответ, опираясь на переданный контекст, а не на свою память.") },
          { kind: "readout", label: T("вход / выход"), html: 'вход: <span class="num">1 240</span> токенов контекста - выход: ответ + маркеры цитат [1] [2]' },
          { kind: "note", text: T("Контекст ограничивает модель найденными фрагментами - это и снижает выдумки (галлюцинации).") },
        ],
      },
    },
    n6: {
      idx: "07",
      anchor: 85,
      label: T("Ответ со ссылками"),
      hint: T("с цитатами"),
      crumb: T("Ответ"),
      panel: {
        tag: T("с цитатами на источники"),
        blocks: [
          { kind: "answer", html: 'По политике компании - 28 календарных дней оплачиваемого отпуска в год <cite>1</cite>. Неиспользованные дни можно перенести <cite>2</cite>.' },
          { kind: "readout", label: T("ссылки"), html: '[1] policy.md, разд. 4 - [2] policy.md, разд. 4' },
          { kind: "note", text: T("Ответ опирается на найденные фрагменты, а не на память модели - и каждое утверждение прослеживается до источника.") },
        ],
      },
    },
  },
};
