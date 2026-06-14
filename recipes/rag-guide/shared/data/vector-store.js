/**
 * vector-store.js -- DATA CONTRACT for the "Векторное хранилище" chapter
 * centerpiece (element=ann-topk-drill). Drives shared/js/lib/vector-map.js
 * (the small index schematic: query node + ~9 vector nodes, settle, explicit
 * query -> top-k links) and is rendered into drill cards by the page glue's
 * renderPanel (drilldown-zoom.js -> a chosen neighbour's cosine + metadata).
 *
 * REUSE NOTE (IE): this chapter reuses vector-map.js as-is -- it already renders
 * query + points by cx/cy, draws the query->near (top-k) links, settles points
 * by cosine, makes EVERY point drillable, and shows cosine rings. No new lib
 * module (index-map.js) was needed; the ANN/top-k "index" is the same 2D
 * point-and-link machinery as the search map, only seeded as a small index.
 *
 * The page glue imports THIS module (default export) and passes it as
 * config.data to vector-map.init -- NOT fetched via data-*-src. RU-first; every
 * user-visible string is now { ru, en } so the i18n store (i18n.js) resolves by
 * active language (RU default). EN sourced from content/en/vector-store.md.
 * ASCII punctuation only, incl. inside Cyrillic. Trusted static copy (no user
 * input): text/vector MAY carry inline <mark> for an emphasized span.
 *
 * SHAPE  (mirrors search-vectors.js so vector-map.js consumes it unchanged)
 * -----
 * Default export = {
 *   _schema,                              // in-file metadata (consumers SKIP _*)
 *   k:       number,                      // top-k cutoff (k = 3 = top_k)
 *   cutCos:  string,                      // cosine of the last top-k member (#3)
 *   plot:    { cx, cy, viewW, viewH },    // query origin + viewBox size
 *   rings:   Ring[],                      // concentric cosine rings (decoration)
 *   query:   QueryPoint,                  // the central query node
 *   points:  Point[]                      // every drillable index node (near+far)
 * }
 *
 * QueryPoint:
 *   { id, cx, cy, label:{ru,en}, text:{ru,en}, tokens[], vector, dim, metric,
 *     crumb:{ru,en}, head:{ru,en}, title:{ru,en}, src:{ru,en}, body:{ru,en},
 *     ariaLabel:{ru,en}, deep:{ label:{ru,en}, preview } }
 *
 * Point (a stored vector in the small index):
 *   {
 *     id,                                  // SVG group id == drill key (unique)
 *     kind:  "near" | "far",               // near = top-k (earned green); far = grey
 *     rank:  number,                        // global kNN rank (1..N)
 *     cx, cy,                               // settled 2D position (layout stub)
 *     cos:   string,                        // cosine value, e.g. "0.91"
 *     label:{ru,en}, cosLabel,              // in-plot label + cos caption
 *     topk:  boolean,                       // earned top-k membership
 *     ariaLabel:{ru,en},                    // SVG point aria-label
 *     crumb:{ru,en}, head:{ru,en}, title:{ru,en}, src:{ru,en}, // drill card meta
 *     text:{ru,en},                         // stored chunk text (trusted html, <mark> ok)
 *     metadata: { source, section, date, access },  // code-ish, shared across langs
 *     vector,                               // stored vector readout (stub)
 *     reason?:{ru,en},                      // far: why-not-top-k reason
 *     deep:  { label:{ru,en}, preview }     // level-2 (lens-plus) deep target
 *   }
 *
 * RULES
 *   - every point id is unique and == its SVG group id (vector-map binds by id).
 *   - EVERY point is drillable, including far points (they open a why-not card).
 *   - near points (kind="near", topk=true) are exactly k of them, ranks 1..k;
 *     vector-map.js draws a query->point link for each near point in rank order.
 *   - cutCos = the last top-k cosine (rank k) -- the why-not boundary far points cite.
 *   - text/vector html is TRUSTED static copy: ASCII only, no user input.
 *   - metadata mirrors the chapter's `filter={...}`: the index stores source /
 *     section / date / access beside each vector; the drill card shows them. It
 *     is code-ish (file paths, dates) and is the same in both languages, so it
 *     is NOT { ru, en } wrapped.
 *   - every user-visible prose field is { ru, en }; consumers resolve by lang.
 *   - underscore-prefixed keys (_schema) are metadata; consumers MUST skip them.
 *
 * Layout note: positions are LAYOUT STUBS (a small hand-placed index), not real
 * embeddings. cx/cy live inside plot.viewW x plot.viewH; nearest = closest to
 * (plot.cx, plot.cy). Mobile 390/320 reflow is vector-map.js's responsibility.
 */

const B = (ru, en) => ({ ru, en });

export default {
  _schema: {
    purpose:
      "ann-topk-drill index data: query node + small index of stored vectors. Drives vector-map.js (settle + query->top-k links) and drilldown-zoom.js (drill a neighbour -> its cosine + metadata). Mirrors search-vectors.js so vector-map.js consumes it unchanged.",
    shape: {
      k: "number -- top-k cutoff (= top_k = 3).",
      cutCos: "string -- cosine of the last top-k member (rank k); the why-not boundary.",
      plot: "{ cx, cy, viewW, viewH } -- query origin + viewBox size.",
      rings: "Ring[] -- concentric cosine rings (decoration only).",
      query: "QueryPoint -- central query node { id, cx, cy, label{ru,en}, text{ru,en}, tokens[], vector, dim, metric, crumb{ru,en}, head{ru,en}, title{ru,en}, src{ru,en}, body{ru,en}, ariaLabel{ru,en}, deep }.",
      points:
        "Point[] -- every drillable index node { id, kind(near|far), rank, cx, cy, cos, label{ru,en}, cosLabel, topk, ariaLabel{ru,en}, crumb{ru,en}, head{ru,en}, title{ru,en}, src{ru,en}, text{ru,en}, metadata{source,section,date,access}, vector, reason?{ru,en}(far), deep }.",
    },
    rules: [
      "every point id is unique and == its SVG group id (vector-map binds by id).",
      "EVERY point is drillable, incl. far points (they open a why-not-top-k card).",
      "exactly k near points (kind=near, topk=true), ranks 1..k; vector-map draws a query->point link per near point.",
      "cutCos = the last top-k cosine; far points cite it as the boundary.",
      "text/vector html is TRUSTED static copy: ASCII only, no user input.",
      "metadata mirrors the chapter filter={...}: source/section/date/access stored beside each vector; code-ish, NOT { ru, en } wrapped.",
      "every user-visible prose field is { ru, en }; consumers resolve by active lang.",
      "underscore-prefixed keys (_schema) are metadata and MUST be skipped by consumers.",
    ],
  },

  k: 3, // top_k = 3 (as in the chapter's index.query(top_k=3))
  cutCos: "0.78", // cosine of the last top-k member (#3) = the cutoff boundary

  plot: { cx: 240, cy: 210, viewW: 520, viewH: 420 },

  // concentric cosine rings -- decoration only (read below the nodes)
  rings: [
    { r: 42, label: "cos 0.90", ly: 172 },
    { r: 84, label: "cos 0.78", ly: 130 },
    { r: 126, label: "cos 0.55", ly: 88 },
    { r: 168, label: "cos 0.20", ly: 46 },
  ],

  query: {
    id: "q",
    cx: 240,
    cy: 210,
    label: B("zapros", "query"),
    text: B('"kak vernut den\'gi za pokupku"', '"how to get my money back for a purchase"'),
    tokens: ["kak", "vernut", "den'gi", "za", "pokupku"],
    vector: "[0.80, -0.11, 0.46, 0.06, -0.34, 0.20, ...]",
    dim: "1536",
    metric: "cosine",
    crumb: B("Запрос", "Query"),
    head: B("Вектор запроса", "Query vector"),
    title: B('"kak vernut den\'gi za pokupku"', '"how to get my money back for a purchase"'),
    src: B("запрос пользователя -> поисковый вектор", "user query -> search vector"),
    body: B(
      "База ищет top-k ближайших к этому вектору по косинусу и возвращает их вместе со скором - без перебора всего архива (ANN).",
      "The store searches for the top-k nearest to this vector by cosine and returns them with a score - without scanning the whole archive (ANN)."
    ),
    ariaLabel: B(
      "Узел запроса. Откройте, чтобы увидеть вектор и как ANN находит ближайших",
      "Query node. Open it to see the vector and how ANN finds the nearest"
    ),
    deep: {
      label: B("Как ANN находит ближайших", "How ANN finds the nearest"),
      preview: "#1 0.91  >  #2 0.85  >  #3 0.78  | boundary | 0.24  0.19  0.12",
    },
  },

  points: [
    // ---- NEAR (top-k = 3, earned green) ----
    {
      id: "c1",
      kind: "near",
      rank: 1,
      cx: 320,
      cy: 156,
      cos: "0.91",
      label: B("vozvrat 30 dnej", "refund 30 days"),
      cosLabel: "0.91",
      topk: true,
      ariaLabel: B(
        "Ближайший вектор, косинус 0.91: возврат товара в течение 30 дней. Откройте узел, чтобы увидеть его метаданные и косинус",
        "Nearest vector, cosine 0.91: a product can be returned within 30 days. Open the node to see its metadata and cosine"
      ),
      crumb: B("Сосед #1", "Neighbour #1"),
      head: B("Вектор в индексе - ранг #1", "Vector in the index - rank #1"),
      title: B("Политика возврата средств", "Refund policy"),
      src: B("faq.md  -  раздел vozvrat", "faq.md  -  section vozvrat"),
      text: B(
        '"<mark>Politika vozvrata sredstv</mark>: vernut tovar mozhno v techenie 30 dnej."',
        '"<mark>Refund policy</mark>: a product can be returned within 30 days."'
      ),
      metadata: {
        source: "faq.md",
        section: "vozvrat",
        date: "2026-02-10",
        access: "public",
      },
      vector: "[0.79, -0.10, 0.48, 0.04, -0.31, 0.21, ...]  (dim 1536)",
      deep: {
        label: B("Метаданные и вектор соседа", "Neighbour metadata and vector"),
        preview: "source=faq.md  section=vozvrat  cos 0.91  vec[0.79, -0.10, 0.48, ...]",
      },
    },
    {
      id: "c2",
      kind: "near",
      rank: 2,
      cx: 168,
      cy: 144,
      cos: "0.85",
      label: B("garantiya 12 mes", "warranty 12 mo"),
      cosLabel: "0.85",
      topk: true,
      ariaLabel: B(
        "Ближайший вектор, косинус 0.85: гарантия на электронику 12 месяцев. Откройте узел, чтобы увидеть его метаданные и косинус",
        "Nearest vector, cosine 0.85: electronics warranty of 12 months. Open the node to see its metadata and cosine"
      ),
      crumb: B("Сосед #2", "Neighbour #2"),
      head: B("Вектор в индексе - ранг #2", "Vector in the index - rank #2"),
      title: B("Гарантия на электронику", "Electronics warranty"),
      src: B("faq.md  -  раздел garantiya", "faq.md  -  section garantiya"),
      text: B(
        '"<mark>Garantiya na elektroniku</mark> sostavlyaet 12 mesyacev s daty pokupki."',
        '"<mark>The electronics warranty</mark> is 12 months from the purchase date."'
      ),
      metadata: {
        source: "faq.md",
        section: "garantiya",
        date: "2026-01-22",
        access: "public",
      },
      vector: "[0.70, -0.17, 0.43, 0.10, -0.29, 0.15, ...]  (dim 1536)",
      deep: {
        label: B("Метаданные и вектор соседа", "Neighbour metadata and vector"),
        preview: "source=faq.md  section=garantiya  cos 0.85  vec[0.70, -0.17, 0.43, ...]",
      },
    },
    {
      id: "c3",
      kind: "near",
      rank: 3,
      cx: 158,
      cy: 286,
      cos: "0.78",
      label: B("obmen tovara", "product exchange"),
      cosLabel: "0.78",
      topk: true,
      ariaLabel: B(
        "Ближайший вектор, косинус 0.78: обмен товара на другой размер. Откройте узел, чтобы увидеть его метаданные и косинус",
        "Nearest vector, cosine 0.78: exchanging a product for another size. Open the node to see its metadata and cosine"
      ),
      crumb: B("Сосед #3", "Neighbour #3"),
      head: B("Вектор в индексе - ранг #3", "Vector in the index - rank #3"),
      title: B("Обмен товара", "Product exchange"),
      src: B("faq.md  -  раздел vozvrat", "faq.md  -  section vozvrat"),
      text: B(
        '"Tovar mozhno <mark>obmenyat na drugoj razmer</mark> v techenie 14 dnej pri sohranenii cheka."',
        '"A product can be <mark>exchanged for another size</mark> within 14 days if the receipt is kept."'
      ),
      metadata: {
        source: "faq.md",
        section: "vozvrat",
        date: "2026-02-10",
        access: "public",
      },
      vector: "[0.62, -0.20, 0.38, 0.13, -0.26, 0.12, ...]  (dim 1536)",
      deep: {
        label: B("Метаданные и вектор соседа", "Neighbour metadata and vector"),
        preview: "source=faq.md  section=vozvrat  cos 0.78  vec[0.62, -0.20, 0.38, ...]",
      },
    },

    // ---- FAR (grey, below cutoff -- STILL drillable, why-not-top-k) ----
    {
      id: "f1",
      kind: "far",
      rank: 4,
      cx: 406,
      cy: 96,
      cos: "0.24",
      label: B("dostavka", "delivery"),
      cosLabel: "0.24",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.24: доставка по городу. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.24: city delivery. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Доставка по городу", "City delivery"),
      src: B("faq.md  -  раздел dostavka", "faq.md  -  section dostavka"),
      text: B(
        '"<mark>Dostavka po gorodu</mark> zanimaet odin rabochij den."',
        '"<mark>City delivery</mark> takes one business day."'
      ),
      metadata: {
        source: "faq.md",
        section: "dostavka",
        date: "2026-03-01",
        access: "public",
      },
      vector: "[0.13, 0.42, -0.30, 0.26, 0.09, -0.18, ...]  (dim 1536)",
      reason: B(
        'Фрагмент про сроки доставки, а не про возврат денег. Тема "kogda privezut", а не "kak vernut" - векторы расходятся, косинус низкий.',
        'This fragment is about delivery times, not about getting money back. The topic is "when it arrives", not "how to refund" - the vectors diverge, the cosine is low.'
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.24 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
    {
      id: "f2",
      kind: "far",
      rank: 6,
      cx: 90,
      cy: 350,
      cos: "0.12",
      label: B("rezhim raboty", "opening hours"),
      cosLabel: "0.12",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.12: режим работы магазина. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.12: store opening hours. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Режим работы магазина", "Store opening hours"),
      src: B("faq.md  -  раздел kontakty", "faq.md  -  section kontakty"),
      text: B(
        '"Magazin <mark>rabotaet</mark> ezhednevno s 10:00 do 22:00 bez vyhodnyh."',
        '"The store is <mark>open</mark> daily from 10:00 to 22:00 with no days off."'
      ),
      metadata: {
        source: "faq.md",
        section: "kontakty",
        date: "2026-02-28",
        access: "public",
      },
      vector: "[0.05, 0.46, -0.34, 0.30, 0.07, -0.16, ...]  (dim 1536)",
      reason: B(
        "Фрагмент про часы работы - совсем другая тема. Ни возврата, ни денег, ни покупки: вектор максимально далек от запроса.",
        "This fragment is about opening hours - a completely different topic. No refund, no money, no purchase: the vector is as far from the query as it gets."
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.12 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
    {
      id: "f3",
      kind: "far",
      rank: 5,
      cx: 428,
      cy: 318,
      cos: "0.19",
      label: B("bonusy", "loyalty points"),
      cosLabel: "0.19",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.19: бонусная программа. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.19: loyalty programme. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Бонусная программа", "Loyalty programme"),
      src: B("faq.md  -  раздел bonusy", "faq.md  -  section bonusy"),
      text: B(
        '"Za kazhduyu pokupku nachislyayutsya <mark>bonusnye bally</mark> - 1 ball za 100 rublej."',
        '"<mark>Loyalty points</mark> are awarded for every purchase - 1 point per 100 roubles."'
      ),
      metadata: {
        source: "faq.md",
        section: "bonusy",
        date: "2026-01-15",
        access: "public",
      },
      vector: "[0.10, 0.49, -0.27, 0.23, 0.15, -0.22, ...]  (dim 1536)",
      reason: B(
        'Речь про начисление бонусов за покупку, а не про возврат денег. Слово "pokupka" есть, но смысл - "kopit bally", а не "vernut sredstva".',
        'This is about awarding points for a purchase, not about getting money back. The word "purchase" is there, but the meaning is "collect points", not "refund money".'
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.19 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
    {
      id: "f4",
      kind: "far",
      rank: 7,
      cx: 300,
      cy: 360,
      cos: "0.16",
      label: B("samovyvoz", "pickup point"),
      cosLabel: "0.16",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.16: пункты самовывоза. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.16: pickup points. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Пункты самовывоза", "Pickup points"),
      src: B("faq.md  -  раздел dostavka", "faq.md  -  section dostavka"),
      text: B(
        '"Zakaz mozhno zabrat samostoyatelno v <mark>punktah samovyvoza</mark> v techenie 5 dnej."',
        '"An order can be collected yourself at a <mark>pickup point</mark> within 5 days."'
      ),
      metadata: {
        source: "faq.md",
        section: "dostavka",
        date: "2026-03-01",
        access: "public",
      },
      vector: "[0.15, 0.40, -0.29, 0.24, 0.11, -0.20, ...]  (dim 1536)",
      reason: B(
        "Фрагмент про получение заказа, а не про возврат денег. Близок по тематике к доставке, но не к возврату средств.",
        "This fragment is about collecting an order, not about getting money back. Topically close to delivery, but not to refunds."
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.16 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
    {
      id: "f5",
      kind: "far",
      rank: 8,
      cx: 64,
      cy: 196,
      cos: "0.10",
      label: B("podarochnaya karta", "gift card"),
      cosLabel: "0.10",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.10: подарочная карта. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.10: gift card. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Подарочная карта", "Gift card"),
      src: B("faq.md  -  раздел bonusy", "faq.md  -  section bonusy"),
      text: B(
        '"<mark>Podarochnuyu kartu</mark> mozhno aktivirovat na sajte ili v lyubom magazine seti."',
        '"A <mark>gift card</mark> can be activated on the website or in any store of the chain."'
      ),
      metadata: {
        source: "faq.md",
        section: "bonusy",
        date: "2026-01-15",
        access: "public",
      },
      vector: "[0.08, 0.45, -0.33, 0.28, 0.13, -0.19, ...]  (dim 1536)",
      reason: B(
        "Фрагмент про активацию подарочной карты - тема денег есть, но это пополнение, а не возврат средств за покупку.",
        "This fragment is about activating a gift card - money is involved, but it is topping up, not refunding the money for a purchase."
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.10 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
    {
      id: "f6",
      kind: "far",
      rank: 9,
      cx: 360,
      cy: 264,
      cos: "0.14",
      label: B("oplata kartoj", "card payment"),
      cosLabel: "0.14",
      topk: false,
      ariaLabel: B(
        "Далекий вектор, косинус 0.14: способы оплаты. Откройте, чтобы узнать, почему он не вошел в top-k",
        "Distant vector, cosine 0.14: payment methods. Open it to find out why it did not make the top-k"
      ),
      crumb: B("Не в top-k", "Not in top-k"),
      head: B("Вектор в индексе - НЕ вошел в top-k", "Vector in the index - did NOT make the top-k"),
      title: B("Способы оплаты", "Payment methods"),
      src: B("faq.md  -  раздел oplata", "faq.md  -  section oplata"),
      text: B(
        '"<mark>Oplata kartoj</mark> dostupna onlajn i na kasse; nalichnye prinimayutsya tolko v magazine."',
        '"<mark>Card payment</mark> is available online and at the till; cash is accepted only in store."'
      ),
      metadata: {
        source: "faq.md",
        section: "oplata",
        date: "2026-02-05",
        access: "public",
      },
      vector: "[0.11, 0.43, -0.31, 0.25, 0.10, -0.21, ...]  (dim 1536)",
      reason: B(
        'Фрагмент про оплату покупки картой. Слова "oplata", "karta" близки к деньгам, но смысл - "kak zaplatit", а не "kak vernut" - вектор уходит в сторону.',
        'This fragment is about paying for a purchase by card. The words "payment" and "card" are close to money, but the meaning is "how to pay", not "how to refund" - the vector drifts away.'
      ),
      deep: {
        label: B("Почему косинус низкий", "Why the cosine is low"),
        preview: "cos 0.14 < top-k boundary (#3 = 0.78)  -> cut",
      },
    },
  ],
};
