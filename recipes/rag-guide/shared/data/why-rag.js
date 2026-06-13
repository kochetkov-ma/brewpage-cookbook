/**
 * why-rag.js (data) -- the "Зачем он нужен" comparison section model (AtlasMD 3.10).
 *
 * RESPONSIBILITY: pure data for the two-track comparison (Без RAG / С RAG),
 * the progressive-reveal order, and the 2-level modal drill content. No DOM,
 * no behaviour -- comparison.js renders this; drilldown-zoom.js drives the
 * camera. RU-first, EN parallel ({ru,en}); consumers resolve by active locale.
 *
 * SHAPE (every _-prefixed key is metadata, consumers skip it via stripMeta):
 *   question: { ru, en }            -- the shared user question both tracks answer
 *   note:     { ru, en }            -- why the question is interesting (stale memory)
 *   tracks:   [ track ]             -- exactly two: A (no RAG), B (with RAG)
 *     track: { id:'A'|'B', tag:{ru,en}, sub:{ru,en}, nodes:[ node ] }
 *     node:  {
 *       id, kind?:'llmA'|'out-bad'|'out-good'|'grounding',
 *       k:{ru,en}, t:{ru,en}, d:{ru,en} (html-safe inline),
 *       freeze?:{ru,en}, flag?:{ru,en}, flagGood?:bool,
 *       drill?:'<DRILL key>'        -- present => node opens the modal drill
 *     }
 *   takeaways:[ { ru, en } ]        -- "why B is better" grid (html-safe inline)
 *   drill:    { <key>: detail }     -- top-level drill entries (level 1)
 *     detail: { crumb:{ru,en}, title:{ru,en}, lead:{ru,en},
 *               bodyHtml:{ru,en},  -- localised inner html for the panel body
 *               deepKey?:string, deepLabel?:{ru,en},  -- lens-plus drill to level 2
 *               deep?:{ <deepKey>: detail } }          -- level-2 entry (no further deep)
 *
 * NOTE: bodyHtml is authored inline html using only the section's themed
 * classes (.kv / .chunkcard / .detail-body etc). ASCII punctuation only.
 */

const data = {
  _schema: {
    purpose: "two-track comparison + 2-level modal drill for the why-rag section",
    rules: "skip _-prefixed keys; exactly two tracks (A no-RAG, B with-RAG); max 2 drill levels",
  },

  question: {
    ru: '"Какой лимит загрузки файлов на тарифе Pro?"',
    en: '"What is the file-upload limit on the Pro plan?"',
  },
  note: {
    ru: "ответ недавно изменился - память модели устарела",
    en: "the answer changed recently - the model memory is stale",
  },

  tracks: [
    {
      id: "A",
      tag: { ru: "Без RAG", en: "No RAG" },
      sub: {
        ru: "Модель отвечает из памяти - извлечения нет",
        en: "The model answers from memory - no retrieval",
      },
      nodes: [
        {
          id: "A-q",
          k: { ru: "Запрос", en: "Query" },
          t: { ru: "Вопрос пользователя", en: "User question" },
          d: {
            ru: '"Какой лимит загрузки файлов на тарифе Pro?"',
            en: '"What is the file-upload limit on the Pro plan?"',
          },
        },
        {
          id: "A-llm",
          kind: "llmA",
          drill: "A-llm",
          k: { ru: "LLM - только веса", en: "LLM - weights only" },
          t: { ru: "Ответ из замороженных знаний", en: "Answer from frozen knowledge" },
          d: {
            ru: 'training cutoff: <span class="mono">обучение до 2024-06</span>. Свежего источника нет - ответ собран из весов.',
            en: 'training cutoff: <span class="mono">trained up to 2024-06</span>. No fresh source - the answer is assembled from weights.',
          },
          freeze: { ru: "веса заморожены - извлечения нет", en: "weights frozen - no retrieval" },
        },
        {
          id: "A-out",
          kind: "out-bad",
          k: { ru: "Ответ", en: "Answer" },
          t: { ru: '"Лимит - 100 файлов."', en: '"The limit is 100 files."' },
          d: {
            ru: '<span class="stale">источник не указан - данные могли устареть</span>',
            en: '<span class="stale">no source cited - the data may be stale</span>',
          },
          flag: { ru: "возможна галлюцинация", en: "possible hallucination" },
        },
      ],
    },
    {
      id: "B",
      tag: { ru: "С RAG", en: "With RAG" },
      sub: {
        ru: "Модель отвечает по найденному источнику",
        en: "The model answers from the retrieved source",
      },
      nodes: [
        {
          id: "B-q",
          k: { ru: "Запрос", en: "Query" },
          t: { ru: "Вопрос пользователя", en: "User question" },
          d: {
            ru: '"Какой лимит загрузки файлов на тарифе Pro?"',
            en: '"What is the file-upload limit on the Pro plan?"',
          },
        },
        {
          id: "B-embed",
          k: { ru: "Эмбеддинг", en: "Embedding" },
          t: { ru: "Вопрос -> вектор", en: "Question -> vector" },
          d: {
            ru: 'текст кодируется в вектор размерности <span class="mono">1536</span> для поиска по смыслу',
            en: 'the text is encoded into a <span class="mono">1536</span>-dim vector for semantic search',
          },
        },
        {
          id: "B-index",
          drill: "B-index",
          k: { ru: "Векторный индекс - топ-k", en: "Vector index - top-k" },
          t: { ru: "Поиск свежих фрагментов", en: "Retrieve fresh chunks" },
          d: {
            ru: 'найден чанк <span class="mono">limits.md</span> (обновлён сегодня), cosine <span class="mono">0.94</span>',
            en: 'found chunk <span class="mono">limits.md</span> (updated today), cosine <span class="mono">0.94</span>',
          },
        },
        {
          id: "B-context",
          kind: "grounding",
          k: { ru: "Сборка контекста", en: "Context assembly" },
          t: { ru: "Фрагмент -> промпт LLM", en: "Chunk -> LLM prompt" },
          d: {
            ru: 'найденный текст подкладывается в запрос как опора - <span class="mono">grounding</span>',
            en: 'the retrieved text is laid into the prompt as support - <span class="mono">grounding</span>',
          },
        },
        {
          id: "B-out",
          kind: "out-good",
          k: { ru: "Ответ со ссылкой", en: "Answer with citation" },
          t: {
            ru: '"На Pro - до 500 файлов, суммарно 20 МБ [1]."',
            en: '"On Pro - up to 500 files, 20 MB total [1]."',
          },
          d: {
            ru: '<span class="cite">[1] limits.md, разд. 2</span> - <span class="fresh">источник обновлён сегодня</span>',
            en: '<span class="cite">[1] limits.md, sec. 2</span> - <span class="fresh">source updated today</span>',
          },
          flag: { ru: "опора на источник - есть цитата", en: "grounded - has a citation" },
          flagGood: true,
        },
      ],
    },
  ],

  takeaways: [
    {
      ru: "<b>Свежие и приватные данные без переобучения.</b> RAG подкладывает источник в момент ответа - не нужно заново обучать модель ради каждого обновления.",
      en: "<b>Fresh and private data without retraining.</b> RAG supplies the source at answer time - no need to retrain the model for every update.",
    },
    {
      ru: "<b>Меньше выдуманных фактов.</b> Ответ опирается на найденный текст (grounding), а не на догадку из весов - это снижает галлюцинации.",
      en: "<b>Fewer made-up facts.</b> The answer rests on the retrieved text (grounding), not a guess from weights - this reduces hallucinations.",
    },
    {
      ru: '<b>Ссылки на источники.</b> Видно, откуда взят ответ: цитата <span class="cite">[1]</span> ведёт к конкретному документу и разделу.',
      en: '<b>Source citations.</b> You can see where the answer came from: citation <span class="cite">[1]</span> points to a specific document and section.',
    },
    {
      ru: "<b>Дешевле дообучения.</b> Обновить документ в индексе - минуты; дообучать модель под каждое изменение - дорого и медленно.",
      en: "<b>Cheaper than fine-tuning.</b> Updating a document in the index takes minutes; fine-tuning the model for every change is costly and slow.",
    },
  ],

  drill: {
    "A-llm": {
      crumb: { ru: "LLM", en: "LLM" },
      title: { ru: "LLM без источника", en: "LLM with no source" },
      lead: {
        ru: "Модель отвечает только из весов, обученных давно.",
        en: "The model answers only from weights trained long ago.",
      },
      bodyHtml: {
        ru:
          '<div class="detail-body">' +
          "<p><b>Знания заморожены на 2024-06.</b> Свежего источника в запросе нет, поэтому ответ - это <b>догадка</b> по статистике обучающих текстов, а не факт из документа.</p>" +
          '<div class="kv">training cutoff : 2024-06\nретривал       : нет\nисточник       : отсутствует\nответ          : "Лимит - 100 файлов." (устарел)</div>' +
          "<p>Так появляется <b>галлюцинация</b>: правдоподобная, но неверная цифра. Проверить её нечем - ссылки нет.</p>" +
          "</div>",
        en:
          '<div class="detail-body">' +
          "<p><b>Knowledge is frozen at 2024-06.</b> There is no fresh source in the prompt, so the answer is a <b>guess</b> from training-text statistics, not a fact from a document.</p>" +
          '<div class="kv">training cutoff : 2024-06\nretrieval       : none\nsource          : absent\nanswer          : "The limit is 100 files." (stale)</div>' +
          "<p>That is how a <b>hallucination</b> appears: a plausible but wrong number. There is nothing to verify it against - no citation.</p>" +
          "</div>",
      },
      deepKey: "A-llm-deep",
      deepLabel: { ru: 'откуда модель берёт "100"', en: 'where the model gets "100"' },
      deep: {
        "A-llm-deep": {
          crumb: { ru: "Веса", en: "Weights" },
          title: { ru: "Как веса выдают число", en: "How weights produce a number" },
          lead: {
            ru: "Заметка об устройстве ответа без источника.",
            en: "A note on how a source-less answer is formed.",
          },
          bodyHtml: {
            ru:
              '<div class="detail-body">' +
              '<p>Внутри нет таблицы лимитов. Модель предсказывает <b>наиболее вероятное продолжение</b> фразы "лимит файлов на Pro - ...". В обучающих текстах чаще встречалось круглое <span class="kv-inline">100</span>, и оно всплывает как ответ.</p>' +
              '<div class="kv">P("100" | "лимит Pro -") - высокая\nP("500" | "лимит Pro -") - низкая (новое значение\n                          в обучении не встречалось)</div>' +
              "<p>Это <b>не ложь</b> модели, а <b>статистическая память</b>: правило изменилось после cutoff, а веса об этом не знают. Без RAG исправить нельзя, не переобучая модель.</p>" +
              "</div>",
            en:
              '<div class="detail-body">' +
              '<p>There is no limits table inside. The model predicts the <b>most likely continuation</b> of "Pro file limit is ...". A round <span class="kv-inline">100</span> appeared more often in training text, so it surfaces as the answer.</p>' +
              '<div class="kv">P("100" | "Pro limit is") - high\nP("500" | "Pro limit is") - low (the new value\n                          never appeared in training)</div>' +
              "<p>This is <b>not a lie</b> by the model but <b>statistical memory</b>: the rule changed after the cutoff and the weights do not know it. Without RAG you cannot fix it without retraining the model.</p>" +
              "</div>",
          },
        },
      },
    },
    "B-index": {
      crumb: { ru: "Индекс", en: "Index" },
      title: { ru: "Найденный свежий фрагмент", en: "The retrieved fresh chunk" },
      lead: {
        ru: "Векторный поиск вернул ближайший по смыслу чанк.",
        en: "Vector search returned the nearest chunk by meaning.",
      },
      bodyHtml: {
        ru:
          '<div class="detail-body">' +
          '<div class="chunkcard">' +
          '<div class="src"><span>limits.md - разд. 2</span><span>cosine 0.94</span></div>' +
          '<p class="txt">"Pro: до 500 файлов, 20 МБ суммарно."</p>' +
          "</div>" +
          "<p><b>Обновлён сегодня.</b> Документ свежее, чем обучение модели, поэтому ответ берёт <b>актуальную</b> цифру, а не память весов.</p>" +
          '<div class="kv">top-k        : 3\nвыбран чанк  : limits.md#2\ncosine       : 0.94 (ближайший)\nсвежесть     : обновлён сегодня</div>' +
          "</div>",
        en:
          '<div class="detail-body">' +
          '<div class="chunkcard">' +
          '<div class="src"><span>limits.md - sec. 2</span><span>cosine 0.94</span></div>' +
          '<p class="txt">"Pro: up to 500 files, 20 MB total."</p>' +
          "</div>" +
          "<p><b>Updated today.</b> The document is fresher than the model training, so the answer takes the <b>current</b> number, not the memory of the weights.</p>" +
          '<div class="kv">top-k        : 3\nchosen chunk : limits.md#2\ncosine       : 0.94 (nearest)\nfreshness    : updated today</div>' +
          "</div>",
      },
      deepKey: "B-index-deep",
      deepLabel: { ru: "точные строки limits.md", en: "exact lines of limits.md" },
      deep: {
        "B-index-deep": {
          crumb: { ru: "Источник", en: "Source" },
          title: { ru: "Точные строки источника", en: "The exact source lines" },
          lead: {
            ru: "Что именно процитировано в ответе [1].",
            en: "Exactly what is cited in answer [1].",
          },
          bodyHtml: {
            ru:
              '<div class="detail-body">' +
              '<div class="kv"># limits.md  (обновлён сегодня)\n\n## 2. Тарифы\n  Free : до 50 файлов,   5 МБ суммарно\n> Pro  : до 500 файлов, 20 МБ суммарно   <- [1]\n  Team : до 2000 файлов, 100 МБ суммарно</div>' +
              '<p>Ответ <b>"до 500 файлов, суммарно 20 МБ [1]"</b> взят дословно из строки <b>Pro</b>. Цитата <span class="cite">[1]</span> ведёт сюда - читатель может <b>проверить</b> источник.</p>' +
              "<p>Поменялось правило - правят <b>файл</b> и переиндексируют. Модель <b>не дообучают</b>: то же извлечение вернёт новую цифру.</p>" +
              "</div>",
            en:
              '<div class="detail-body">' +
              '<div class="kv"># limits.md  (updated today)\n\n## 2. Plans\n  Free : up to 50 files,    5 MB total\n> Pro  : up to 500 files,  20 MB total   <- [1]\n  Team : up to 2000 files, 100 MB total</div>' +
              '<p>The answer <b>"up to 500 files, 20 MB total [1]"</b> is taken verbatim from the <b>Pro</b> line. Citation <span class="cite">[1]</span> points here - the reader can <b>verify</b> the source.</p>' +
              "<p>When the rule changes you edit the <b>file</b> and re-index. The model is <b>not fine-tuned</b>: the same retrieval returns the new number.</p>" +
              "</div>",
          },
        },
      },
    },
  },
};

export default data;
