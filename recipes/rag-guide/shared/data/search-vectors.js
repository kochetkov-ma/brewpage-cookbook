/**
 * search-vectors.js -- DATA CONTRACT for the "Как работает поиск по документам"
 * vector-space section. Consumed by shared/js/lib/vector-map.js (the 2D map +
 * settle + kNN reveal) and rendered into drill cards by the page glue's
 * renderPanel (shared/js/pages/search.js).
 *
 * Seeds harvested from the approved etalon (mokups/etalon/search.html DATA).
 * RU-first; shape is i18n-ready ({ ru, en } MAY replace any string later).
 * cookbook-author owns final VALUES; interactive-engineer owns the SHAPE +
 * the renderer. ASCII punctuation only. Trusted static copy (no user input):
 * `text`/`vector` MAY carry inline <mark> for the matched span.
 *
 * SHAPE
 * -----
 * Default export = {
 *   query:    QueryPoint,                  // the central comparison point
 *   k:        number,                      // top-k cutoff (k = 3)
 *   plot:     { cx, cy, viewW, viewH },    // query origin + viewBox size
 *   rings:    Ring[],                      // concentric cosine rings (decoration)
 *   points:   Point[]                      // every drillable doc point (near + far)
 * }
 *
 * QueryPoint:
 *   { id, cx, cy, label, text, tokens[], vector, dim, metric,
 *     crumb, head, title, src, body, deep:{ label, preview } }
 *
 * Point (a chunk in the 2D projection):
 *   {
 *     id,                                  // SVG group id == drill key
 *     kind:  "near" | "far",               // near = green/top-k; far = grey
 *     rank:  number,                        // global kNN rank (1..N)
 *     cx, cy,                               // settled 2D position
 *     cos:   string,                        // cosine value, e.g. "0.92"
 *     label, cosLabel,                      // in-plot label + cos caption
 *     topk:  boolean,                       // earned top-k membership
 *     ariaLabel,                            // SVG point aria-label
 *     crumb, head, title, src,              // drill card meta
 *     text,                                 // chunk text (trusted html, <mark> ok)
 *     shared,                               // shared keywords with query (the demo: "0")
 *     vector,                               // chunk vector readout
 *     lines?: [{ text, hit }],              // near: exact chunk lines (hit = matched)
 *     reason?: string,                      // far: why-not-top-k reason
 *     deep:  { label, preview }             // level-2 (lens-plus) deep target
 *   }
 *
 * RULES
 *   - every point id is unique and == its SVG group id (vector-map binds by id).
 *   - EVERY point is drillable, including far points (they open a why-not card).
 *   - text/vector html is TRUSTED static copy: ASCII only, no user input.
 *   - near points carry lines[]; far points carry reason; both carry deep.
 *   - cutCos = the last top-k cosine (rank k) -- shown as the why-not boundary.
 */

const T = (ru) => ru; // single-language seed today; swap for { ru, en } per field later.

export default {
  k: 3,
  cutCos: "0.74", // cosine of the last top-k member (#3) = the cutoff boundary

  plot: { cx: 240, cy: 210, viewW: 520, viewH: 420 },

  // concentric cosine rings -- decoration only (read below the points)
  rings: [
    { r: 42, label: "cos 0.90", ly: 172 },
    { r: 84, label: "cos 0.75", ly: 130 },
    { r: 126, label: "cos 0.55", ly: 88 },
    { r: 168, label: "cos 0.20", ly: 46 },
  ],

  query: {
    id: "pt-q",
    cx: 240,
    cy: 210,
    label: T("запрос"),
    text: T('"Сколько дней отпуска в году?"'),
    tokens: ["сколько", "дней", "отпуска", "в", "году"],
    vector: "[0.81, -0.12, 0.47, 0.05, -0.33, 0.19, ...]",
    dim: "1536",
    metric: "cosine",
    crumb: T("Запрос"),
    head: T("Точка запроса"),
    title: T('"Сколько дней отпуска в году?"'),
    src: T("запрос пользователя -> поисковый вектор"),
    body: T(
      "kNN ранжирует фрагменты по косинусной близости к этому вектору и возвращает top-k."
    ),
    deep: {
      label: T("Как kNN ранжирует по косинусу"),
      preview: "#1 0.92  >  #2 0.86  >  #3 0.74  | граница | 0.21  0.19  0.14",
    },
  },

  points: [
    // ---- NEAR (top-k, earned green) ----
    {
      id: "n1",
      kind: "near",
      rank: 1,
      cx: 322,
      cy: 158,
      cos: "0.92",
      label: T("отдых 28 дней"),
      cosLabel: "0.92",
      topk: true,
      ariaLabel: T(
        "Ближайший документ, косинус 0.92: ежегодный оплачиваемый отдых 28 дней. Откройте карточку фрагмента"
      ),
      crumb: T("Фрагмент #1"),
      head: T("Фрагмент документа - ранг #1"),
      title: T("Ежегодный оплачиваемый отдых"),
      src: "policy_hr.md  -  раздел 4.1  -  фрагмент 12",
      text: T(
        '"Каждому сотруднику предоставляется <mark>ежегодный оплачиваемый отдых</mark> продолжительностью 28 календарных дней."'
      ),
      shared: "0",
      vector: "[0.79, -0.10, 0.51, 0.03, -0.29, 0.22, ...]  (dim 1536)",
      lines: [
        { text: T("Каждому сотруднику предоставляется ежегодный"), hit: true },
        { text: T("оплачиваемый отдых продолжительностью"), hit: true },
        { text: T("28 календарных дней."), hit: false },
      ],
      deep: {
        label: T("Точные строки и вектор фрагмента"),
        preview: "vec[0.79, -0.10, 0.51, ...]  общих слов с запросом: 0",
      },
    },
    {
      id: "n2",
      kind: "near",
      rank: 2,
      cx: 170,
      cy: 142,
      cos: "0.86",
      label: T("перенос дней"),
      cosLabel: "0.86",
      topk: true,
      ariaLabel: T(
        "Ближайший документ, косинус 0.86: дни отдыха можно перенести. Откройте карточку фрагмента"
      ),
      crumb: T("Фрагмент #2"),
      head: T("Фрагмент документа - ранг #2"),
      title: T("Перенос дней отдыха"),
      src: "policy_hr.md  -  раздел 4.3  -  фрагмент 17",
      text: T(
        '"Неиспользованные <mark>дни отдыха можно перенести</mark> на следующий рабочий год по согласованию с руководителем."'
      ),
      shared: "0",
      vector: "[0.71, -0.18, 0.44, 0.09, -0.31, 0.14, ...]  (dim 1536)",
      lines: [
        { text: T("Неиспользованные дни отдыха можно"), hit: true },
        { text: T("перенести на следующий рабочий год"), hit: true },
        { text: T("по согласованию с руководителем."), hit: false },
      ],
      deep: {
        label: T("Точные строки и вектор фрагмента"),
        preview: "vec[0.71, -0.18, 0.44, ...]  общих слов с запросом: 0",
      },
    },
    {
      id: "n3",
      kind: "near",
      rank: 3,
      cx: 156,
      cy: 288,
      cos: "0.74",
      label: T("отгулы"),
      cosLabel: "0.74",
      topk: true,
      ariaLabel: T(
        "Ближайший документ, косинус 0.74: отгулы за переработку. Откройте карточку фрагмента"
      ),
      crumb: T("Фрагмент #3"),
      head: T("Фрагмент документа - ранг #3"),
      title: T("Отгулы за переработку"),
      src: "policy_hr.md  -  раздел 4.5  -  фрагмент 23",
      text: T(
        '"За сверхурочную работу сотруднику предоставляются дополнительные <mark>дни отдыха (отгулы)</mark> по выбору работника."'
      ),
      shared: "0",
      vector: "[0.63, -0.21, 0.39, 0.12, -0.27, 0.11, ...]  (dim 1536)",
      lines: [
        { text: T("За сверхурочную работу сотруднику"), hit: false },
        { text: T("предоставляются дополнительные дни отдыха"), hit: true },
        { text: T("(отгулы) по выбору работника."), hit: true },
      ],
      deep: {
        label: T("Точные строки и вектор фрагмента"),
        preview: "vec[0.63, -0.21, 0.39, ...]  общих слов с запросом: 0",
      },
    },

    // ---- FAR (grey, below cutoff -- STILL drillable, why-not-top-k) ----
    {
      id: "f1",
      kind: "far",
      rank: 4,
      cx: 408,
      cy: 92,
      cos: "0.21",
      label: T("командировки"),
      cosLabel: "0.21",
      topk: false,
      ariaLabel: T(
        "Далёкий документ, косинус 0.21: командировочные расходы. Откройте, чтобы узнать, почему он не вошёл в top-k"
      ),
      crumb: T("Не в top-k"),
      head: T("Фрагмент документа - НЕ вошёл в top-k"),
      title: T("Командировочные расходы"),
      src: "policy_travel.md  -  раздел 2.1  -  фрагмент 4",
      text: T(
        '"<mark>Командировочные расходы</mark> возмещаются на основании авансового отчёта в течение пяти рабочих дней."'
      ),
      shared: "0",
      vector: "[0.12, 0.44, -0.31, 0.27, 0.08, -0.19, ...]  (dim 1536)",
      reason: T(
        'Фрагмент про возмещение расходов в командировке, а не про продолжительность отдыха. Тема "деньги за поездку", а не "дни отпуска" - векторы расходятся.'
      ),
      deep: {
        label: T("Почему косинус низкий"),
        preview: "cos 0.21 < граница top-k (#3 = 0.74)  -> отсечён",
      },
    },
    {
      id: "f2",
      kind: "far",
      rank: 6,
      cx: 92,
      cy: 352,
      cos: "0.14",
      label: T("пропуск в офис"),
      cosLabel: "0.14",
      topk: false,
      ariaLabel: T(
        "Далёкий документ, косинус 0.14: пропуск на вход в офис. Откройте, чтобы узнать, почему он не вошёл в top-k"
      ),
      crumb: T("Не в top-k"),
      head: T("Фрагмент документа - НЕ вошёл в top-k"),
      title: T("Пропуск на вход в офис"),
      src: "policy_office.md  -  раздел 1.2  -  фрагмент 2",
      text: T(
        '"<mark>Пропуск на вход</mark> в офис оформляется в бюро пропусков при предъявлении паспорта."'
      ),
      shared: "0",
      vector: "[0.04, 0.47, -0.35, 0.31, 0.06, -0.17, ...]  (dim 1536)",
      reason: T(
        "Фрагмент про доступ в здание и оформление пропуска - совсем другая тема. Ни отдыха, ни дней, ни отпуска: вектор максимально далёк от запроса."
      ),
      deep: {
        label: T("Почему косинус низкий"),
        preview: "cos 0.14 < граница top-k (#3 = 0.74)  -> отсечён",
      },
    },
    {
      id: "f3",
      kind: "far",
      rank: 5,
      cx: 430,
      cy: 320,
      cos: "0.19",
      label: T("оплата проезда"),
      cosLabel: "0.19",
      topk: false,
      ariaLabel: T(
        "Далёкий документ, косинус 0.19: оплата проезда. Откройте, чтобы узнать, почему он не вошёл в top-k"
      ),
      crumb: T("Не в top-k"),
      head: T("Фрагмент документа - НЕ вошёл в top-k"),
      title: T("Оплата проезда"),
      src: "policy_travel.md  -  раздел 2.4  -  фрагмент 9",
      text: T(
        '"<mark>Оплата проезда</mark> до места работы компенсируется частично по корпоративному тарифу."'
      ),
      shared: "0",
      vector: "[0.09, 0.51, -0.28, 0.22, 0.14, -0.23, ...]  (dim 1536)",
      reason: T(
        'Речь о компенсации транспорта, а не об отдыхе. Слово "оплата" уводит вектор в сторону денег и проезда - смысл далёк от "сколько дней отпуска".'
      ),
      deep: {
        label: T("Почему косинус низкий"),
        preview: "cos 0.19 < граница top-k (#3 = 0.74)  -> отсечён",
      },
    },
  ],
};
