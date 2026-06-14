/**
 * search-vectors.js -- DATA CONTRACT for the "Как работает поиск по документам"
 * vector-space section. Consumed by shared/js/lib/vector-map.js (the 2D map +
 * settle + kNN reveal) and rendered into drill cards by the page glue's
 * renderPanel (shared/js/pages/search.js).
 *
 * Seeds harvested from the approved etalon (mokups/etalon/search.html DATA).
 * RU-first; every user-visible string is now { ru, en } so the i18n store
 * (i18n.js) resolves by active language (RU default). EN sourced from
 * content/en/search.md. ASCII punctuation only, incl. inside Cyrillic.
 * Trusted static copy (no user input): `text`/`vector` MAY carry inline <mark>
 * for the matched span.
 *
 * SHAPE
 * -----
 * Default export = {
 *   query:    QueryPoint,                  // the central comparison point
 *   k:        number,                      // top-k cutoff (k = 3)
 *   cutCos:   string,                      // cosine of the last top-k member (#3)
 *   plot:     { cx, cy, viewW, viewH },    // query origin + viewBox size
 *   rings:    Ring[],                      // concentric cosine rings (decoration)
 *   points:   Point[]                      // every drillable doc point (near + far)
 * }
 *
 * QueryPoint:
 *   { id, cx, cy, label:{ru,en}, text:{ru,en}, tokens[], vector, dim, metric,
 *     crumb:{ru,en}, head:{ru,en}, title:{ru,en}, src:{ru,en}, body:{ru,en},
 *     ariaLabel:{ru,en}, deep:{ label:{ru,en}, preview } }
 *
 * Point (a chunk in the 2D projection):
 *   {
 *     id,                                  // SVG group id == drill key
 *     kind:  "near" | "far",               // near = green/top-k; far = grey
 *     rank:  number,                        // global kNN rank (1..N)
 *     cx, cy,                               // settled 2D position
 *     cos:   string,                        // cosine value, e.g. "0.92"
 *     label:{ru,en}, cosLabel,              // in-plot label + cos caption
 *     topk:  boolean,                       // earned top-k membership
 *     ariaLabel:{ru,en},                    // SVG point aria-label
 *     crumb:{ru,en}, head:{ru,en}, title:{ru,en}, src:{ru,en}, // drill card meta
 *     text:{ru,en},                         // chunk text (trusted html, <mark> ok)
 *     shared,                               // shared keywords with query (the demo: "0")
 *     vector,                               // chunk vector readout
 *     lines?: [{ text:{ru,en}, hit }],      // near: exact chunk lines (hit = matched)
 *     reason?:{ru,en},                      // far: why-not-top-k reason
 *     deep:  { label:{ru,en}, preview }     // level-2 (lens-plus) deep target
 *   }
 *
 * RULES
 *   - every point id is unique and == its SVG group id (vector-map binds by id).
 *   - EVERY point is drillable, including far points (they open a why-not card).
 *   - text/vector html is TRUSTED static copy: ASCII only, no user input.
 *   - near points carry lines[]; far points carry reason; both carry deep.
 *   - cutCos = the last top-k cosine (rank k) -- shown as the why-not boundary.
 *   - every user-visible string is { ru, en }; consumers resolve by active lang.
 *   - `src` keeps RU and EN identical where it is a file path / code-ish token.
 */

const B = (ru, en) => ({ ru, en });

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
    label: B("запрос", "query"),
    text: B('"Сколько дней отпуска в году?"', '"How many days of leave per year?"'),
    tokens: [B("сколько", "how"), B("дней", "many"), B("отпуска", "days"), B("в", "of"), B("году", "leave")],
    vector: "[0.81, -0.12, 0.47, 0.05, -0.33, 0.19, ...]",
    dim: "1536",
    metric: "cosine",
    crumb: B("Запрос", "Query"),
    head: B("Точка запроса", "Query point"),
    title: B('"Сколько дней отпуска в году?"', '"How many days of leave per year?"'),
    src: B(
      "запрос пользователя -> поисковый вектор",
      "user query -> search vector"
    ),
    body: B(
      "kNN ранжирует фрагменты по косинусной близости к этому вектору и возвращает top-k.",
      "kNN ranks fragments by cosine closeness to this vector and returns the top-k."
    ),
    ariaLabel: B(
      "Точка запроса. Откройте, чтобы увидеть вектор и ранжирование kNN",
      "Query point. Open it to see the vector and the kNN ranking"
    ),
    deep: {
      label: B("Как kNN ранжирует по косинусу", "How kNN ranks by cosine"),
      preview: "#1 0.92  >  #2 0.86  >  #3 0.74  | boundary | 0.21  0.19  0.14",
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
      label: B("отдых 28 дней", "leave 28 days"),
      cosLabel: "0.92",
      topk: true,
      ariaLabel: B(
        "Ближайший документ, косинус 0.92: ежегодный оплачиваемый отдых 28 дней. Откройте карточку фрагмента",
        "Nearest document, cosine 0.92: 28 days of annual paid leave. Open the fragment card"
      ),
      crumb: B("Фрагмент #1", "Fragment #1"),
      head: B("Фрагмент документа - ранг #1", "Document fragment - rank #1"),
      title: B("Ежегодный оплачиваемый отдых", "Annual paid leave"),
      src: B("policy_hr.md  -  раздел 4.1  -  фрагмент 12", "policy_hr.md  -  section 4.1  -  fragment 12"),
      text: B(
        '"Каждому сотруднику предоставляется <mark>ежегодный оплачиваемый отдых</mark> продолжительностью 28 календарных дней."',
        '"Every employee is granted <mark>annual paid leave</mark> of 28 calendar days."'
      ),
      shared: "0",
      vector: "[0.79, -0.10, 0.51, 0.03, -0.29, 0.22, ...]  (dim 1536)",
      lines: [
        { text: B("Каждому сотруднику предоставляется ежегодный", "Every employee is granted annual"), hit: true },
        { text: B("оплачиваемый отдых продолжительностью", "paid leave of a duration of"), hit: true },
        { text: B("28 календарных дней.", "28 calendar days."), hit: false },
      ],
      deep: {
        label: B("Точные строки и вектор фрагмента", "Exact lines and the fragment vector"),
        preview: "vec[0.79, -0.10, 0.51, ...]  shared words with query: 0",
      },
    },
    {
      id: "n2",
      kind: "near",
      rank: 2,
      cx: 170,
      cy: 142,
      cos: "0.86",
      label: B("перенос дней", "carry-over of days"),
      cosLabel: "0.86",
      topk: true,
      ariaLabel: B(
        "Ближайший документ, косинус 0.86: дни отдыха можно перенести. Откройте карточку фрагмента",
        "Nearest document, cosine 0.86: leave days can be carried over. Open the fragment card"
      ),
      crumb: B("Фрагмент #2", "Fragment #2"),
      head: B("Фрагмент документа - ранг #2", "Document fragment - rank #2"),
      title: B("Перенос дней отдыха", "Carrying over leave days"),
      src: B("policy_hr.md  -  раздел 4.3  -  фрагмент 17", "policy_hr.md  -  section 4.3  -  fragment 17"),
      text: B(
        '"Неиспользованные <mark>дни отдыха можно перенести</mark> на следующий рабочий год по согласованию с руководителем."',
        '"Unused <mark>leave days can be carried over</mark> to the next working year by agreement with the manager."'
      ),
      shared: "0",
      vector: "[0.71, -0.18, 0.44, 0.09, -0.31, 0.14, ...]  (dim 1536)",
      lines: [
        { text: B("Неиспользованные дни отдыха можно", "Unused leave days can be"), hit: true },
        { text: B("перенести на следующий рабочий год", "carried over to the next working year"), hit: true },
        { text: B("по согласованию с руководителем.", "by agreement with the manager."), hit: false },
      ],
      deep: {
        label: B("Точные строки и вектор фрагмента", "Exact lines and the fragment vector"),
        preview: "vec[0.71, -0.18, 0.44, ...]  shared words with query: 0",
      },
    },
    {
      id: "n3",
      kind: "near",
      rank: 3,
      cx: 156,
      cy: 288,
      cos: "0.74",
      label: B("отгулы", "time off in lieu"),
      cosLabel: "0.74",
      topk: true,
      ariaLabel: B(
        "Ближайший документ, косинус 0.74: отгулы за переработку. Откройте карточку фрагмента",
        "Nearest document, cosine 0.74: time off in lieu of overtime. Open the fragment card"
      ),
      crumb: B("Фрагмент #3", "Fragment #3"),
      head: B("Фрагмент документа - ранг #3", "Document fragment - rank #3"),
      title: B("Отгулы за переработку", "Time off in lieu of overtime"),
      src: B("policy_hr.md  -  раздел 4.5  -  фрагмент 23", "policy_hr.md  -  section 4.5  -  fragment 23"),
      text: B(
        '"За сверхурочную работу сотруднику предоставляются дополнительные <mark>дни отдыха (отгулы)</mark> по выбору работника."',
        '"For overtime work an employee is granted extra <mark>days off (time off in lieu)</mark> at the employee\'s choice."'
      ),
      shared: "0",
      vector: "[0.63, -0.21, 0.39, 0.12, -0.27, 0.11, ...]  (dim 1536)",
      lines: [
        { text: B("За сверхурочную работу сотруднику", "For overtime work an employee"), hit: false },
        { text: B("предоставляются дополнительные дни отдыха", "is granted extra days off"), hit: true },
        { text: B("(отгулы) по выбору работника.", "(time off in lieu) at the employee's choice."), hit: true },
      ],
      deep: {
        label: B("Точные строки и вектор фрагмента", "Exact lines and the fragment vector"),
        preview: "vec[0.63, -0.21, 0.39, ...]  shared words with query: 0",
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
      label: B("командировки", "business trips"),
      cosLabel: "0.21",
      topk: false,
      ariaLabel: B(
        "Далёкий документ, косинус 0.21: командировочные расходы. Откройте, чтобы узнать, почему он не вошёл в top-k",
        "Distant document, cosine 0.21: travel expenses. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Фрагмент документа - НЕ вошёл в top-k", "Document fragment - did NOT make the top-k"),
      title: B("Командировочные расходы", "Travel expenses"),
      src: B("policy_travel.md  -  раздел 2.1  -  фрагмент 4", "policy_travel.md  -  section 2.1  -  fragment 4"),
      text: B(
        '"<mark>Командировочные расходы</mark> возмещаются на основании авансового отчёта в течение пяти рабочих дней."',
        '"<mark>Travel expenses</mark> are reimbursed against an expense report within five working days."'
      ),
      shared: "0",
      vector: "[0.12, 0.44, -0.31, 0.27, 0.08, -0.19, ...]  (dim 1536)",
      reason: B(
        'Фрагмент про возмещение расходов в командировке, а не про продолжительность отдыха. Тема "деньги за поездку", а не "дни отпуска" - векторы расходятся.',
        'This fragment is about reimbursing trip expenses, not about leave length. The topic is "money for a trip", not "leave days" - the vectors diverge.'
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.21 < top-k boundary (#3 = 0.74)  -> cut",
      },
    },
    {
      id: "f2",
      kind: "far",
      rank: 6,
      cx: 92,
      cy: 352,
      cos: "0.14",
      label: B("пропуск в офис", "office pass"),
      cosLabel: "0.14",
      topk: false,
      ariaLabel: B(
        "Далёкий документ, косинус 0.14: пропуск на вход в офис. Откройте, чтобы узнать, почему он не вошёл в top-k",
        "Distant document, cosine 0.14: office entry pass. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Фрагмент документа - НЕ вошёл в top-k", "Document fragment - did NOT make the top-k"),
      title: B("Пропуск на вход в офис", "Office entry pass"),
      src: B("policy_office.md  -  раздел 1.2  -  фрагмент 2", "policy_office.md  -  section 1.2  -  fragment 2"),
      text: B(
        '"<mark>Пропуск на вход</mark> в офис оформляется в бюро пропусков при предъявлении паспорта."',
        '"An <mark>entry pass</mark> for the office is issued at the pass desk on presenting a passport."'
      ),
      shared: "0",
      vector: "[0.04, 0.47, -0.35, 0.31, 0.06, -0.17, ...]  (dim 1536)",
      reason: B(
        "Фрагмент про доступ в здание и оформление пропуска - совсем другая тема. Ни отдыха, ни дней, ни отпуска: вектор максимально далёк от запроса.",
        "This fragment is about building access and issuing a pass - a completely different topic. No leave, no days, no vacation: the vector is as far from the query as it gets."
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.14 < top-k boundary (#3 = 0.74)  -> cut",
      },
    },
    {
      id: "f3",
      kind: "far",
      rank: 5,
      cx: 430,
      cy: 320,
      cos: "0.19",
      label: B("оплата проезда", "commute reimbursement"),
      cosLabel: "0.19",
      topk: false,
      ariaLabel: B(
        "Далёкий документ, косинус 0.19: оплата проезда. Откройте, чтобы узнать, почему он не вошёл в top-k",
        "Distant document, cosine 0.19: commute reimbursement. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Фрагмент документа - НЕ вошёл в top-k", "Document fragment - did NOT make the top-k"),
      title: B("Оплата проезда", "Commute reimbursement"),
      src: B("policy_travel.md  -  раздел 2.4  -  фрагмент 9", "policy_travel.md  -  section 2.4  -  fragment 9"),
      text: B(
        '"<mark>Оплата проезда</mark> до места работы компенсируется частично по корпоративному тарифу."',
        '"<mark>The commute</mark> to the workplace is partly reimbursed at the corporate rate."'
      ),
      shared: "0",
      vector: "[0.09, 0.51, -0.28, 0.22, 0.14, -0.23, ...]  (dim 1536)",
      reason: B(
        'Речь о компенсации транспорта, а не об отдыхе. Слово "оплата" уводит вектор в сторону денег и проезда - смысл далёк от "сколько дней отпуска".',
        'This is about reimbursing transport, not about leave. The word "payment" pulls the vector toward money and commuting - the meaning is far from "how many leave days".'
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.19 < top-k boundary (#3 = 0.74)  -> cut",
      },
    },
  ],
};
