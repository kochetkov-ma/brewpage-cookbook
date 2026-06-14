/**
 * evaluation.js -- DATA CONTRACT for the evaluation chapter metric calculator.
 *
 * Consumed by shared/js/lib/eval-calculator.js. RU-first, i18n-ready: copy
 * fields are { ru, en }. cookbook-author owns the final VALUES; interactive-
 * engineer owns the SHAPE + the renderer.
 *
 * The calculator recomputes precision@k and recall@k over a small golden set as
 * the reader moves a k slider, and contrasts two retriever runs ("before" /
 * "after") on the SAME fixed golden set (the chapter's honesty rule).
 *
 * SHAPE
 * -----
 * Default export = {
 *   _schema: { ... }                         // metadata; consumers skip _keys
 *   kRange: { min, max, default }            // slider bounds + initial k
 *   runs:   string[]                         // run ids, e.g. ["before","after"]
 *   runLabels: { [runId]: { ru, en } }       // toggle/track labels per run
 *   golden: GoldenItem[]                      // 3-5 questions, ids vary by run
 *   ui:     { ru: {...}, en: {...} }          // static labels (axis, toggle, ...)
 * }
 *
 * GoldenItem:
 *   {
 *     id:           string                    // stable question id
 *     q:            { ru, en }                // the question text
 *     relevant_ids: string[]                  // the truly relevant chunk ids
 *     retrieved:    { [runId]: string[] }     // top-N ids per run, score-desc
 *   }
 *
 * RULES
 *   - relevant_ids is the SAME for every run (golden set is fixed; only the
 *     retriever output differs run-to-run -- that is what before/after compares).
 *   - retrieved[runId] is ordered best-first; the calculator slices top-k.
 *   - every run id in `runs` must have an entry in runLabels and in every
 *     golden item's `retrieved`.
 *   - precision@k = hits_in_topk / k ; recall@k = hits_in_topk / |relevant_ids|.
 *   - all copy is ASCII-punctuation; ru strings are Cyrillic.
 */

export default {
  _schema: {
    purpose:
      "Golden-set sample driving the precision@k / recall@k calculator with before/after retriever runs on a fixed question set.",
    shape:
      "{ kRange:{min,max,default}, runs[], runLabels{}, golden:[{id,q,relevant_ids[],retrieved{run:ids[]}}], ui{ru,en} }",
    rules: [
      "relevant_ids fixed across runs; only retrieved[] differs per run",
      "retrieved[run] ordered best-first; calculator slices top-k",
      "precision@k = hits/k ; recall@k = hits/|relevant_ids|",
      "consumers MUST skip every _-prefixed key",
    ],
  },

  kRange: { min: 1, max: 10, default: 5 },

  runs: ["before", "after"],
  runLabels: {
    before: { ru: "До правки (v1)", en: "Before (v1)" },
    after: { ru: "После правки (v2)", en: "After (v2)" },
  },

  golden: [
    {
      id: "g1",
      q: {
        ru: "Как вернуть товар?",
        en: "How do I return an item?",
      },
      relevant_ids: ["policy-12", "policy-13"],
      retrieved: {
        // before: relevant pieces sit deeper in the list
        before: [
          "faq-07",
          "policy-12",
          "promo-02",
          "policy-13",
          "faq-31",
          "policy-12b",
          "ship-04",
          "policy-44",
          "faq-09",
          "promo-08",
        ],
        // after: relevant pieces ranked to the very top
        after: [
          "policy-12",
          "policy-13",
          "faq-07",
          "policy-12b",
          "promo-02",
          "ship-04",
          "faq-31",
          "policy-44",
          "faq-09",
          "promo-08",
        ],
      },
    },
    {
      id: "g2",
      q: {
        ru: "Сколько дней на возврат?",
        en: "How many days do I have to return?",
      },
      relevant_ids: ["policy-13"],
      retrieved: {
        before: [
          "policy-12",
          "faq-31",
          "policy-13",
          "ship-04",
          "promo-02",
          "faq-07",
          "policy-44",
          "faq-09",
          "policy-12b",
          "promo-08",
        ],
        after: [
          "policy-13",
          "policy-12",
          "faq-31",
          "ship-04",
          "promo-02",
          "faq-07",
          "policy-44",
          "faq-09",
          "policy-12b",
          "promo-08",
        ],
      },
    },
    {
      id: "g3",
      q: {
        ru: "Можно ли вернуть товар без чека?",
        en: "Can I return an item without a receipt?",
      },
      relevant_ids: ["policy-13", "policy-44", "faq-31"],
      retrieved: {
        before: [
          "promo-02",
          "policy-13",
          "faq-07",
          "ship-04",
          "policy-44",
          "faq-09",
          "promo-08",
          "faq-31",
          "policy-12",
          "policy-12b",
        ],
        after: [
          "policy-13",
          "faq-31",
          "policy-44",
          "policy-12",
          "promo-02",
          "faq-07",
          "ship-04",
          "faq-09",
          "promo-08",
          "policy-12b",
        ],
      },
    },
  ],

  ui: {
    ru: {
      kLabel: "Значение k (top-k)",
      precision: "precision@k",
      recall: "recall@k",
      questionLabel: "Вопрос",
      relevantLabel: "нужные куски",
      topkLabel: "выдано (top-k)",
      hit: "попал",
      miss: "лишний",
      hitsSummary: "попаданий в top-k",
      averaged: "среднее по золотому набору",
      decK: "уменьшить k",
      incK: "увеличить k",
    },
    en: {
      kLabel: "k value (top-k)",
      precision: "precision@k",
      recall: "recall@k",
      questionLabel: "Question",
      relevantLabel: "relevant chunks",
      topkLabel: "retrieved (top-k)",
      hit: "hit",
      miss: "extra",
      hitsSummary: "hits in top-k",
      averaged: "averaged over the golden set",
      decK: "decrease k",
      incK: "increase k",
    },
  },
};
