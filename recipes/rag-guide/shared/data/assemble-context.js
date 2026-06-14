/**
 * assemble-context.js -- DATA CONTRACT for the "Сборка контекста" assemble drill.
 *
 * Consumed by shared/js/lib/context-assembly.js (template fill + token-budget
 * visual). The page glue (pages/assemble-context.js) imports this default
 * export, strips _-prefixed keys (stripMeta), resolves { ru, en } by the active
 * locale (i18n.js), and hands the resolved object to context-assembly.init as
 * config.data. cookbook-author owns the final VALUES; interactive-engineer owns
 * the SHAPE + the renderer. ASCII punctuation only (incl. inside Russian).
 *
 * SHAPE (every _-prefixed key is metadata; consumers skip it via stripMeta)
 * ------------------------------------------------------------------------
 * Default export = {
 *   ru: AssembleModel,                  // RU-first
 *   en: AssembleModel                   // EN parallel (i18n-ready)
 * }
 *
 * AssembleModel:
 *   {
 *     template: {                       // the prompt template, split into parts
 *       instruction: string,            // system-style line(s); ASCII/Cyrillic text
 *       contextLabel: string,           // the "Контекст:" lead line
 *       questionLabel: string,          // the "Вопрос:" lead line
 *       answerLabel: string,            // the trailing "Ответ:" line
 *       question: string,               // the user question filled into the prompt
 *       fixedTokens: number             // tokens spent by template+question (the
 *                                       // budget floor before any chunk is added)
 *     },
 *     chunks: [ Chunk ],                // the retrieved top-k, score-desc input
 *     maxContextTokens: {               // the budget slider model
 *       min: number, max: number,
 *       step: number, default: number
 *     },
 *     order: [ "by-score" | "by-edges" ],  // available order toggles, in UI order
 *     defaultOrder: "by-score" | "by-edges",
 *     ui: {                             // localized control + readout labels
 *       budgetSliderLabel, orderToggleLabel,
 *       orderByScore, orderByEdges,
 *       counterLabel, tokensUnit,
 *       trimmedNote, dupBadge, captionDedup, captionOrder,
 *       captionBudget, captionFill
 *     }
 *   }
 *
 * Chunk:
 *   {
 *     id: string,                       // stable id (c1..cN)
 *     source: string,                   // [source] tag, e.g. "policy.md"
 *     text: string,                     // chunk body (ASCII/Cyrillic, no user input)
 *     score: number,                    // cosine score 0..1 (sort key, desc)
 *     tokens: number,                   // token cost of this chunk (+separator)
 *     dupOf?: string                    // if set, this chunk is a near-duplicate
 *                                       // of chunk dupOf and is dropped at dedup
 *   }
 *
 * RULES
 *   - chunks are authored in score-desc order (the retrieve output).
 *   - exactly one near-duplicate pair (dupOf) so the dedup step is visible.
 *   - text/instruction are TRUSTED static copy: no user input, no html.
 *   - token numbers are illustrative seeds; renderer treats them as given.
 *   - over-budget chunks are trimmed by the renderer via opacity (height SNAPS).
 */

const data = {
  _schema: {
    purpose:
      "template + ranked chunks + token-budget model for the assemble-context drill",
    shape:
      "{ ru, en } -> { template, chunks[], maxContextTokens, order[], defaultOrder, ui }",
    rules:
      "skip _-prefixed keys; chunks score-desc; one dupOf pair; trusted static text; tokens are seeds",
  },

  ru: {
    template: {
      instruction:
        "Отвечай только на основе контекста ниже. Если ответа в контексте нет, скажи об этом честно.",
      contextLabel: "Контекст:",
      questionLabel: "Вопрос:",
      answerLabel: "Ответ:",
      question: "Сколько дней отпуска в году?",
      fixedTokens: 80,
    },
    chunks: [
      {
        id: "c1",
        source: "policy.md",
        text:
          '"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."',
        score: 0.92,
        tokens: 360,
      },
      {
        id: "c2",
        source: "policy.md",
        text:
          '"Неиспользованные дни можно перенести на следующий год по согласованию с руководителем."',
        score: 0.86,
        tokens: 320,
      },
      {
        id: "c3",
        source: "hr-faq.md",
        text: '"Отпуск оформляется заявлением за 2 недели до начала."',
        score: 0.74,
        tokens: 240,
      },
      {
        id: "c4",
        source: "policy.md (копия)",
        text:
          '"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."',
        score: 0.71,
        tokens: 360,
        dupOf: "c1",
      },
      {
        id: "c5",
        source: "handbook.md",
        text:
          '"Дополнительные дни отдыха предоставляются за выслугу лет - см. таблицу стажа."',
        score: 0.58,
        tokens: 300,
      },
    ],
    maxContextTokens: { min: 500, max: 4000, step: 100, default: 1600 },
    order: ["by-score", "by-edges"],
    defaultOrder: "by-score",
    ui: {
      budgetSliderLabel: "max_context_tokens",
      orderToggleLabel: "Порядок кусков",
      orderByScore: "по score",
      orderByEdges: "по краям",
      counterLabel: "бюджет токенов",
      tokensUnit: "токенов",
      trimmedNote: "остальное обрезано по бюджету",
      dupBadge: "дубль - выброшен",
      captionDedup: "Шаг 1: убираем точные дубли - повтор не добавляет смысла, но ест бюджет.",
      captionOrder:
        "Шаг 2: раскладываем порядок - сильные куски по краям окна (lost-in-the-middle).",
      captionBudget: "Шаг 3: считаем токены - набираем куски, пока влезаем в лимит.",
      captionFill: "Шаг 4: заполняем шаблон промпта отобранными кусками с подписью источника.",
    },
  },

  en: {
    template: {
      instruction:
        "Answer only from the context below. If the answer is not in the context, say so honestly.",
      contextLabel: "Context:",
      questionLabel: "Question:",
      answerLabel: "Answer:",
      question: "How many vacation days per year?",
      fixedTokens: 80,
    },
    chunks: [
      {
        id: "c1",
        source: "policy.md",
        text: '"The employee is granted paid annual leave - 28 calendar days."',
        score: 0.92,
        tokens: 360,
      },
      {
        id: "c2",
        source: "policy.md",
        text:
          '"Unused days may be carried over to the next year with manager approval."',
        score: 0.86,
        tokens: 320,
      },
      {
        id: "c3",
        source: "hr-faq.md",
        text: '"Leave is requested in writing 2 weeks in advance."',
        score: 0.74,
        tokens: 240,
      },
      {
        id: "c4",
        source: "policy.md (copy)",
        text: '"The employee is granted paid annual leave - 28 calendar days."',
        score: 0.71,
        tokens: 360,
        dupOf: "c1",
      },
      {
        id: "c5",
        source: "handbook.md",
        text: '"Extra rest days are granted for seniority - see the tenure table."',
        score: 0.58,
        tokens: 300,
      },
    ],
    maxContextTokens: { min: 500, max: 4000, step: 100, default: 1600 },
    order: ["by-score", "by-edges"],
    defaultOrder: "by-score",
    ui: {
      budgetSliderLabel: "max_context_tokens",
      orderToggleLabel: "Chunk order",
      orderByScore: "by score",
      orderByEdges: "by edges",
      counterLabel: "token budget",
      tokensUnit: "tokens",
      trimmedNote: "the rest is trimmed by budget",
      dupBadge: "duplicate - dropped",
      captionDedup: "Step 1: drop exact duplicates - a repeat adds no meaning but eats budget.",
      captionOrder:
        "Step 2: lay out the order - strong chunks at the edges (lost-in-the-middle).",
      captionBudget: "Step 3: count tokens - take chunks while they fit the limit.",
      captionFill: "Step 4: fill the prompt template with the picked chunks, tagged by source.",
    },
  },
};

export default data;
