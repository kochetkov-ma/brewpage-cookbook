/**
 * generation.js -- DATA CONTRACT for the "Генерация" grounded-answer reveal.
 *
 * Consumed by shared/js/lib/grounded-answer.js (claim <-> chunk link reveal).
 * The page glue (pages/generation.js) imports this default export, strips
 * _-prefixed keys (stripMeta), resolves { ru, en } by the active locale
 * (i18n.js), and hands the resolved object to grounded-answer.init as
 * config.data. cookbook-author owns the final VALUES; interactive-engineer owns
 * the SHAPE + the renderer. ASCII punctuation only (incl. inside Russian).
 *
 * The model id where shown is `claude-sonnet-4-6` (Anthropic Messages API).
 *
 * SHAPE (every _-prefixed key is metadata; consumers skip it via stripMeta)
 * ------------------------------------------------------------------------
 * Default export = {
 *   ru: GenerationModel,                // RU-first
 *   en: GenerationModel                 // EN parallel (i18n-ready)
 * }
 *
 * GenerationModel:
 *   {
 *     model: string,                    // model id shown in the readout
 *     system: string,                   // the grounding system instruction (display)
 *     contextChunks: [ Chunk ],         // the source chunks the answer is built from
 *     claims: [ Claim ],                // ordered answer claims, each linked to a chunk
 *     noContext: NoContextCase,         // the honest-fallback case (no answer in context)
 *     ui: { ... }                       // localized labels / captions (see below)
 *   }
 *
 * Chunk:
 *   { id: string, source: string, text: string }   // id == [source:id] in claims
 *
 * Claim:
 *   {
 *     id: string,                       // stable id (a1..aN)
 *     text: string,                     // the claim sentence (no source marker inside)
 *     chunkId: string | null,           // the chunk it is grounded on; null => ungrounded
 *     cite: string,                     // the rendered [source] marker, e.g. "[1]"
 *     hallucinated?: boolean            // true => cites a source NOT in contextChunks
 *   }
 *
 * NoContextCase:
 *   { question: string, fallback: string, note: string }
 *
 * RULES
 *   - every grounded claim.chunkId MUST exist in contextChunks (else it is a
 *     hallucinated citation -> set hallucinated:true and chunkId to the missing id).
 *   - claims are authored in answer reading order.
 *   - exactly one hallucinated claim so the "reject this answer" lesson is visible.
 *   - text/system are TRUSTED static copy: no user input, no html.
 */

const data = {
  _schema: {
    purpose:
      "context chunks + grounded answer claims + no-context fallback for the generation reveal",
    shape:
      "{ ru, en } -> { model, system, contextChunks[], claims[], noContext, ui }",
    rules:
      "skip _-prefixed keys; grounded chunkId must exist in contextChunks; one hallucinated claim; trusted static text",
    model: "claude-sonnet-4-6",
  },

  ru: {
    model: "claude-sonnet-4-6",
    system:
      "Ты отвечаешь только на основе переданного контекста. После каждого утверждения ставь ссылку на источник в виде [source]. Если ответа в контексте нет, ответь: 'Этого нет в документах.' Не добавляй факты из собственной памяти.",
    contextChunks: [
      {
        id: "c1",
        source: "policy.md, разд. 4",
        text:
          '"Сотруднику предоставляется ежегодный оплачиваемый отдых - 28 календарных дней."',
      },
      {
        id: "c2",
        source: "policy.md, разд. 4",
        text:
          '"Неиспользованные дни можно перенести на следующий год по согласованию с руководителем."',
      },
      {
        id: "c3",
        source: "hr-faq.md",
        text: '"Отпуск оформляется заявлением за 2 недели до начала."',
      },
    ],
    claims: [
      {
        id: "a1",
        text: "По политике компании - 28 календарных дней оплачиваемого отпуска в год",
        chunkId: "c1",
        cite: "[1]",
      },
      {
        id: "a2",
        text: "Неиспользованные дни можно перенести на следующий год по согласованию с руководителем",
        chunkId: "c2",
        cite: "[2]",
      },
      {
        id: "a3",
        text: "Заявление подается за 2 недели до начала отпуска",
        chunkId: "c3",
        cite: "[3]",
      },
      {
        id: "a4",
        text: "За выслугу лет добавляется 5 дополнительных дней",
        chunkId: "c9",
        cite: "[9]",
        hallucinated: true,
      },
    ],
    noContext: {
      question: "Можно ли взять отпуск авансом за следующий год?",
      fallback: "Этого нет в документах.",
      note:
        "В контексте нет такого правила. Правильный результат - честный отказ, а не правдоподобная выдумка.",
    },
    ui: {
      answerTitle: "Ответ модели",
      contextTitle: "Контекст: источники",
      systemTitle: "Системная инструкция",
      hoverHint: "Наведите на утверждение - подсветится его источник.",
      groundedBadge: "заземлено",
      hallucinatedBadge: "цитата не из контекста - отклонить",
      noContextLabel: "Случай: ответа в контексте нет",
      toggleNoContext: "Показать случай без контекста",
      toggleAnswer: "Вернуться к ответу с цитатами",
      modelLabel: "модель",
      captionGround: "Каждое утверждение строится из конкретного куска и заземляется на нем.",
      captionReveal: "Утверждение проявляется только после того, как его источник сопоставлен.",
      captionHallucination: "Источника [9] нет в контексте - это галлюцинация цитаты.",
    },
  },

  en: {
    model: "claude-sonnet-4-6",
    system:
      "You answer only from the provided context. After each statement add a source link as [source]. If the answer is not in the context, reply: 'This is not in the documents.' Do not add facts from your own memory.",
    contextChunks: [
      {
        id: "c1",
        source: "policy.md, sec. 4",
        text: '"The employee is granted paid annual leave - 28 calendar days."',
      },
      {
        id: "c2",
        source: "policy.md, sec. 4",
        text:
          '"Unused days may be carried over to the next year with manager approval."',
      },
      {
        id: "c3",
        source: "hr-faq.md",
        text: '"Leave is requested in writing 2 weeks in advance."',
      },
    ],
    claims: [
      {
        id: "a1",
        text: "Company policy grants 28 calendar days of paid leave per year",
        chunkId: "c1",
        cite: "[1]",
      },
      {
        id: "a2",
        text: "Unused days may be carried over to the next year with manager approval",
        chunkId: "c2",
        cite: "[2]",
      },
      {
        id: "a3",
        text: "The request is submitted 2 weeks before the leave starts",
        chunkId: "c3",
        cite: "[3]",
      },
      {
        id: "a4",
        text: "Seniority adds 5 extra days",
        chunkId: "c9",
        cite: "[9]",
        hallucinated: true,
      },
    ],
    noContext: {
      question: "Can I take leave in advance against next year?",
      fallback: "This is not in the documents.",
      note:
        "There is no such rule in the context. The correct result is an honest refusal, not a plausible fabrication.",
    },
    ui: {
      answerTitle: "Model answer",
      contextTitle: "Context: sources",
      systemTitle: "System instruction",
      hoverHint: "Hover a statement - its source highlights.",
      groundedBadge: "grounded",
      hallucinatedBadge: "citation not in context - reject",
      noContextLabel: "Case: no answer in context",
      toggleNoContext: "Show the no-context case",
      toggleAnswer: "Back to the cited answer",
      modelLabel: "model",
      captionGround: "Each statement is built from a specific chunk and grounded on it.",
      captionReveal: "A statement appears only after its source has been matched.",
      captionHallucination: "Source [9] is not in the context - this is a citation hallucination.",
    },
  },
};

export default data;
