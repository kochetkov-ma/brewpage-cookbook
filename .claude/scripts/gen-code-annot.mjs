// One-shot generator for shared/data/code-annot.js (task W2-DATA / W6-FIX).
// Extracts each fenced python block from content/{ru,en}/<page>.md verbatim,
// pairs it with the caption + regions defined here, and writes ONE merged
// default-export module (a map keyed by block key) matching the code-blocks.js
// contract. Run from repo root via node.
//
// W6-FIX consolidation: previously emitted 16 per-block files under
// shared/data/code-annot/<key>.js; those pushed the recipe over the 100-file
// publish cap. Now emits a SINGLE module shared/data/code-annot.js whose default
// export is { _schema, "<key>": { lang, code, caption, regions }, ... } -- each
// entry preserves the exact prior per-block content. code-blocks.js imports this
// one map and looks up map[key].

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const RG = join(REPO, "recipes", "rag-guide");
const CONTENT = join(RG, "content");
const OUT_FILE = join(RG, "shared", "data", "code-annot.js");

// Extract the fenced block that OPENS at 1-based line `openLine` (the ```python
// line). Returns the verbatim inner text (no trailing newline), closing at the
// next line that is exactly ``` .
function extractBlock(absPath, openLine) {
  const lines = readFileSync(absPath, "utf8").split("\n");
  const out = [];
  for (let i = openLine; i < lines.length; i++) {
    if (lines[i] === "```") return out.join("\n");
    out.push(lines[i]);
  }
  throw new Error(`no closing fence in ${absPath} from line ${openLine}`);
}

function lineCount(s) {
  return s.split("\n").length;
}

// One entry per output file.
const BLOCKS = [
  {
    key: "what-rag-minimal-rag",
    page: "what-rag",
    ru: 15,
    en: 15,
    caption: {
      ru: "Минимальный рабочий RAG на реальных API: retrieval -> augmented -> generation.",
      en: "A minimal working RAG on real APIs: retrieval -> augmented -> generation.",
    },
    regions: [
      { id: "wr-clients", lines: [6, 7], label: { ru: "Клиенты API", en: "API clients" }, explain: { ru: "Два клиента: OpenAI считает эмбеддинги, Anthropic генерирует ответ. Ключи берутся из переменных окружения, а не из кода.", en: "Two clients: OpenAI computes the embeddings, Anthropic generates the answer. Keys come from environment variables, not from code." } },
      { id: "wr-corpus", lines: [9, 14], label: { ru: "Корпус чанков", en: "Chunk corpus" }, explain: { ru: "Ваша база знаний, упрощенная до списка строк. В реальном RAG это чанки документов из векторного индекса.", en: "Your knowledge base, simplified to a list of strings. In real RAG these are document chunks from a vector index." } },
      { id: "wr-embed", lines: [16, 18], label: { ru: "Функция embed", en: "embed function" }, explain: { ru: "Каждый текст превращается в вектор фиксированной длины (dim 1536 для text-embedding-3-small). Формы вызова реальные (OpenAI Embeddings, developers.openai.com/api/docs/guides/embeddings).", en: "Each text becomes a fixed-length vector (dim 1536 for text-embedding-3-small). The call shapes are real (OpenAI Embeddings, developers.openai.com/api/docs/guides/embeddings)." } },
      { id: "wr-query", lines: [20, 22], label: { ru: "Вектор запроса", en: "Query vector" }, explain: { ru: "Вопрос пользователя встраивается тем же эмбеддером, что и чанки - иначе векторы несравнимы в одном пространстве.", en: "The user question is embedded with the same embedder as the chunks - otherwise the vectors are not comparable in one space." } },
      { id: "wr-retrieval", lines: [24, 26], label: { ru: "Retrieval: cosine", en: "Retrieval: cosine" }, explain: { ru: "Косинусная близость между вектором запроса и каждым чанком; argmax дает самый близкий чанк. Это шаг RETRIEVAL.", en: "Cosine similarity between the query vector and each chunk; argmax picks the closest chunk. This is the RETRIEVAL step." } },
      { id: "wr-augment-generate", lines: [28, 37], label: { ru: "Augmented + generation", en: "Augmented + generation" }, explain: { ru: "Найденный чанк подкладывается в промпт (augmented), и модель отвечает только по нему (generation). Форма вызова - реальный Anthropic Messages API (platform.claude.com/docs/en/api/messages).", en: "The found chunk is slotted into the prompt (augmented), and the model answers only from it (generation). The call shape is the real Anthropic Messages API (platform.claude.com/docs/en/api/messages)." } },
    ],
  },
  {
    key: "why-rag-two-track",
    page: "why-rag",
    ru: 15,
    en: 15,
    caption: {
      ru: "Один вопрос двумя путями: без RAG (из памяти) и с RAG (заземленный по чанку).",
      en: "One question, two paths: without RAG (from memory) and with RAG (grounded on a chunk).",
    },
    regions: [
      { id: "wb-client", lines: [2, 5], label: { ru: "Клиент и вопрос", en: "Client and question" }, explain: { ru: "Один Anthropic-клиент и один фиксированный вопрос про внутреннюю политику - точка, где обычная модель не знает ваших данных.", en: "One Anthropic client and one fixed question about internal policy - the point where an ordinary model does not know your data." } },
      { id: "wb-ask-context", lines: [7, 12], label: { ru: "Ветка с контекстом", en: "With-context branch" }, explain: { ru: "Когда контекст передан, инструкция велит отвечать только по нему и честно сказать 'этого нет в документах', если ответа нет - основа заземления.", en: "When context is passed, the instruction tells the model to answer only from it and to say 'this is not in the documents' if there is no answer - the basis of grounding." } },
      { id: "wb-ask-nocontext", lines: [13, 20], label: { ru: "Ветка без контекста", en: "No-context branch" }, explain: { ru: "Без контекста промпт - это голый вопрос; вызов Messages API одинаков для обоих путей, отличается только входной промпт.", en: "Without context the prompt is the bare question; the Messages API call is identical for both paths, only the input prompt differs." } },
      { id: "wb-track-a", lines: [22, 23], label: { ru: "Track A: без RAG", en: "Track A: no RAG" }, explain: { ru: "Вызов без контекста: ответ идет из параметрической памяти и может быть выдумкой про именно вашу политику.", en: "Call with no context: the answer comes from parametric memory and may be a fabrication about your specific policy." } },
      { id: "wb-track-b", lines: [25, 27], label: { ru: "Track B: с RAG", en: "Track B: with RAG" }, explain: { ru: "Сначала retrieval дает реальный чанк, потом он идет в контекст и ответ заземлен на нем. Ответ никогда не пишется до подстановки контекста.", en: "Retrieval supplies a real chunk first, then it goes into the context and the answer is grounded on it. The answer is never written before the context is substituted in." } },
    ],
  },
  {
    key: "production-fastapi-endpoint",
    page: "production",
    ru: 19,
    en: 19,
    caption: {
      ru: "Продакшен-эндпоинт на FastAPI: кеш, подсчет стоимости, latency и фильтр доступа.",
      en: "A FastAPI production endpoint: cache, cost accounting, latency, and an access filter.",
    },
    regions: [
      { id: "pr-cache", lines: [6, 8], label: { ru: "TTL-кеш ответов", en: "TTL answer cache" }, explain: { ru: "Одинаковый вопрос не платит за генерацию дважды; TTL не дает кешу отдавать устаревшее после обновления данных.", en: "The same question does not pay for generation twice; the TTL keeps the cache from serving stale content after a data update." } },
      { id: "pr-pricing", lines: [10, 15], label: { ru: "Расчет стоимости", en: "Cost calculation" }, explain: { ru: "Отдельная цена за входные и выходные токены; сверьте с прайсингом вендора (например, Anthropic pricing, platform.claude.com/docs/en/about-claude/pricing). cost_usd складывает оба слагаемых.", en: "Separate price for input and output tokens; check the vendor pricing (for example Anthropic pricing, platform.claude.com/docs/en/about-claude/pricing). cost_usd sums both addends." } },
      { id: "pr-cache-key", lines: [17, 22], label: { ru: "Кеш-ключ по tenant", en: "Tenant-scoped cache key" }, explain: { ru: "Ключ кеша включает tenant пользователя, чтобы ответы разных tenant не смешивались; при попадании возвращаем готовый ответ без генерации.", en: "The cache key includes the user tenant so different tenants' answers never mix; on a hit we return the ready answer with no generation." } },
      { id: "pr-access", lines: [24, 25], label: { ru: "Доступ на retrieve", en: "Access at retrieve" }, explain: { ru: "Доступ проверяется на шаге retrieve, а не после генерации: retrieve получает allowed_filter и физически не возвращает запрещенные куски. Если кусок попал в контекст, считайте, что пользователь уже получил к нему доступ.", en: "Access is checked at the retrieve step, not after generation: retrieve takes allowed_filter and physically does not return forbidden chunks. If a chunk made it into the context, assume the user already has access to it." } },
      { id: "pr-pipeline", lines: [26, 27], label: { ru: "Сборка и генерация", en: "Assemble and generate" }, explain: { ru: "Найденные чанки пакуются в один промпт в рамках токен-бюджета, затем генерация возвращает ответ вместе с учетом токенов для стоимости.", en: "The found chunks are packed into one prompt within the token budget, then generation returns the answer together with token usage for the cost." } },
      { id: "pr-metrics", lines: [29, 35], label: { ru: "Метрики и ответ", en: "Metrics and response" }, explain: { ru: "Ответ кладется в кеш; latency, стоимость и число кусков логируются в мониторинг (не в ответ пользователю). То, что не измеряется, сломается тихо.", en: "The answer is cached; latency, cost, and the number of chunks are logged to monitoring (not into the user's answer). What you do not measure will break silently." } },
    ],
  },
  {
    key: "embedding-embed-call",
    page: "embedding",
    ru: 17,
    en: 16,
    caption: {
      ru: "Реальный вызов API эмбеддингов: список чанков -> список векторов, строго один-к-одному.",
      en: "A real embeddings API call: a list of chunks -> a list of vectors, strictly one-to-one.",
    },
    regions: [
      { id: "install", lines: [1, 1], label: { ru: "Установка пакета", en: "Install the package" }, explain: { ru: "Комментарий с командой установки официального клиента OpenAI; в самом коде не исполняется.", en: "A comment with the install command for the official OpenAI client; it does not run in the code itself." } },
      { id: "client", lines: [2, 4], label: { ru: "Клиент OpenAI", en: "OpenAI client" }, explain: { ru: "Импортируем клиент и создаем экземпляр; ключ API он берет из окружения.", en: "Import the client and create an instance; it reads the API key from the environment." } },
      { id: "chunks-input", lines: [6, 10], label: { ru: "Входные чанки", en: "Input chunks" }, explain: { ru: "Список из трех текстовых фрагментов - это вход эмбеддера; реальный текст справочных документов на естественном языке.", en: "A list of three text fragments is the embedder input; natural-language snippets from reference documents." } },
      { id: "embed-call", lines: [12, 15], label: { ru: "Вызов эмбеддинга", en: "Embedding call" }, explain: { ru: "Один вызов create с моделью text-embedding-3-small и сразу всем списком чанков на входе.", en: "One create call with the text-embedding-3-small model and the whole chunk list as input." } },
      { id: "collect-vectors", lines: [18, 20], label: { ru: "Сбор векторов", en: "Collect vectors" }, explain: { ru: "Достаем по вектору на каждый элемент ответа - связь чанк-вектор строго один-к-одному. На выходе три вектора по 1536 компонент.", en: "Pull one vector per response item - the chunk-to-vector link is strictly one-to-one. The output is three vectors of 1536 components each." } },
    ],
  },
  {
    key: "embedding-cosine",
    page: "embedding",
    ru: 60,
    en: 59,
    caption: {
      ru: "Косинусная близость вручную, без библиотек: чем ближе вектор запроса к вектору чанка, тем ближе смысл.",
      en: "Cosine similarity by hand, no libraries: the closer the query vector is to a chunk vector, the closer the meaning.",
    },
    regions: [
      { id: "cosine-fn", lines: [3, 7], label: { ru: "Формула косинуса", en: "Cosine formula" }, explain: { ru: "Скалярное произведение, деленное на произведение длин (норм) двух векторов; так видна сама формула без зависимостей.", en: "The dot product divided by the product of the two vectors' lengths (norms); this shows the formula itself with no dependencies." } },
      { id: "query-vec", lines: [9, 12], label: { ru: "Вектор запроса", en: "Query vector" }, explain: { ru: "Тот же эмбеддер кодирует запрос пользователя в вектор - той же моделью, что и чанки, иначе сравнение бессмысленно.", en: "The same embedder encodes the user query into a vector - the same model as the chunks, otherwise the comparison is meaningless." } },
      { id: "rank", lines: [14, 17], label: { ru: "Ранжирование по близости", en: "Rank by closeness" }, explain: { ru: "Считаем близость запроса к каждому чанку и сортируем по убыванию; самый близкий по смыслу чанк выходит первым, даже без общих слов.", en: "Compute the query's closeness to each chunk and sort descending; the chunk closest in meaning comes first, even with no shared words." } },
    ],
  },
  {
    key: "assemble-context-assembler",
    page: "assemble-context",
    ru: 20,
    en: 20,
    caption: {
      ru: "Сборщик контекста целиком: dedup, порядок по краям, бюджет токенов и шаблон промпта в одной функции.",
      en: "The full context assembler: dedup, edge ordering, token budget, and the prompt template in one function.",
    },
    regions: [
      { id: "tokenizer", lines: [1, 7], label: { ru: "Счет токенов", en: "Token counting" }, explain: { ru: "Берем настоящий токенизатор tiktoken (семейство GPT-4/3.5) и считаем токены, а не символы - бюджет модели меряется в токенах.", en: "Take the real tiktoken tokenizer (GPT-4/3.5 family) and count tokens, not characters - the model budget is measured in tokens." } },
      { id: "template", lines: [9, 16], label: { ru: "Шаблон промпта", en: "Prompt template" }, explain: { ru: "Три части в фиксированном порядке: инструкция, плейсхолдер контекста и вопрос. Текст шаблона - строковый литерал, одинаковый в обоих вариантах.", en: "Three parts in a fixed order: instruction, the context placeholder, and the question. The template text is a string literal, identical in both variants." } },
      { id: "dedup", lines: [18, 29], label: { ru: "Удаление дублей", en: "Deduplication" }, explain: { ru: "Выбрасываем точные повторы текста, сохраняя первый (лучший по score) экземпляр - дубли едят бюджет, но не несут новой информации.", en: "Drop exact text repeats, keeping the first (best-score) instance - duplicates eat budget but carry no new information." } },
      { id: "order", lines: [31, 32], label: { ru: "Порядок по краям", en: "Edge ordering" }, explain: { ru: "Раскладываем куски так, чтобы самые важные стояли по краям окна, а не в середине - смягчение эффекта lost-in-the-middle.", en: "Lay out the pieces so the most important ones sit at the window edges, not the middle - mitigating the lost-in-the-middle effect." } },
      { id: "budget", lines: [34, 42], label: { ru: "Бюджет токенов", en: "Token budget" }, explain: { ru: "Набираем куски по очереди, пока сумма токенов влезает в лимит; как только следующий не влезает - останавливаемся и обрезаем остаток.", en: "Take pieces one by one while the token sum fits the limit; as soon as the next one does not fit, stop and trim the rest." } },
      { id: "fill", lines: [43, 45], label: { ru: "Заполнение шаблона", en: "Fill the template" }, explain: { ru: "Склеиваем отобранные куски с подписью источника [source] и подставляем в шаблон вместе с вопросом - готовый промпт для генерации.", en: "Glue the picked pieces with their [source] tag and substitute them into the template along with the question - the finished prompt for generation." } },
    ],
  },
  {
    key: "assemble-context-order",
    page: "assemble-context",
    ru: 88,
    en: 88,
    caption: {
      ru: "Раскладка по краям: сильные куски уезжают к началу и концу окна, слабые - в середину.",
      en: "Edge layout: strong pieces move to the start and end of the window, weak ones to the middle.",
    },
    regions: [
      { id: "signature", lines: [1, 3], label: { ru: "Вход функции", en: "Function input" }, explain: { ru: "На вход приходит ranked - куски, уже отсортированные по убыванию релевантности; задача - переставить их под внимание модели.", en: "The input is ranked - pieces already sorted by descending relevance; the job is to reorder them for the model's attention." } },
      { id: "split-heads-tails", lines: [4, 6], label: { ru: "Разводим на края", en: "Split into edges" }, explain: { ru: "Чередуем: четные по индексу куски идут в head, нечетные - в tail; так сильнейшие распределяются к обоим краям окна.", en: "Alternate: even-indexed pieces go to head, odd-indexed ones to tail; this spreads the strongest toward both window edges." } },
      { id: "recombine", lines: [7, 7], label: { ru: "Сборка край-середина-край", en: "Edge-middle-edge recombine" }, explain: { ru: "Склеиваем head с развернутым tail, получая раскладку сильные...слабые...сильные - середина окна достается наименее важным кускам.", en: "Glue head with the reversed tail, yielding a strong...weak...strong layout - the window middle goes to the least important pieces." } },
    ],
  },
  {
    key: "search-retrieve",
    page: "search",
    ru: 14,
    en: 14,
    caption: {
      ru: "Живой retrieve: запрос -> вектор той же моделью -> top-k ближайших по cosine из индекса.",
      en: "Live retrieve: query -> vector with the same model -> top-k nearest by cosine from the index.",
    },
    regions: [
      { id: "deps", lines: [1, 1], label: { ru: "Установка клиентов", en: "Install clients" }, explain: { ru: "Ставим клиенты Pinecone и OpenAI - векторная база плюс модель эмбеддингов.", en: "Install the Pinecone and OpenAI clients - the vector store plus the embedding model." } },
      { id: "clients", lines: [2, 6], label: { ru: "Клиенты и индекс", en: "Clients and index" }, explain: { ru: "Создаем клиент OpenAI и открываем индекс docs в Pinecone.", en: "Create the OpenAI client and open the docs index in Pinecone." } },
      { id: "embed-q", lines: [9, 12], label: { ru: "Вектор запроса", en: "Query vector" }, explain: { ru: "Превращаем текст запроса в вектор ТОЙ ЖЕ моделью, что и чанки - иначе пространства не совпадут.", en: "Turn the query text into a vector with the SAME model as the chunks - otherwise the spaces will not match." } },
      { id: "topk", lines: [13, 16], label: { ru: "Top-k по cosine", en: "Top-k by cosine" }, explain: { ru: "Отдаем вектор в индекс и берем top-k ближайших, возвращая id, score и текст.", en: "Send the vector to the index and take the top-k nearest, returning id, score and text." } },
      { id: "run", lines: [18, 20], label: { ru: "Запуск на запросе", en: "Run on a query" }, explain: { ru: "Запускаем retrieve на живом запросе: нужный чанк приходит первым без общих слов.", en: "Run retrieve on a live query: the needed chunk comes back first with no shared words." } },
    ],
  },
  {
    key: "vector-store-upsert-query",
    page: "vector-store",
    ru: 14,
    en: 14,
    caption: {
      ru: "Векторная база: upsert векторов с metadata, затем поиск top-k ближайших с фильтром по metadata.",
      en: "Vector store: upsert vectors with metadata, then search the top-k nearest with a metadata filter.",
    },
    regions: [
      { id: "clients", lines: [1, 7], label: { ru: "Клиенты и индекс", en: "Clients and index" }, explain: { ru: "Клиент OpenAI для эмбеддингов и индекс docs в Pinecone - хранилище векторов.", en: "The OpenAI client for embeddings and the docs index in Pinecone - the vector store." } },
      { id: "embed-fn", lines: [9, 13], label: { ru: "Функция embed", en: "embed helper" }, explain: { ru: "Вспомогательная функция: текст -> вектор той же моделью для store и поиска.", en: "A helper: text -> vector with the same model for both store and search." } },
      { id: "upsert", lines: [15, 20], label: { ru: "Upsert с metadata", en: "Upsert with metadata" }, explain: { ru: "Кладем в базу вектор вместе с metadata (source, section, text) - база хранит их рядом.", en: "Put each vector into the store together with its metadata (source, section, text) - the store keeps them side by side." } },
      { id: "query", lines: [22, 28], label: { ru: "Поиск с фильтром", en: "Filtered search" }, explain: { ru: "Ищем top-3 ближайших, но сначала сужаем поиск фильтром по metadata (section refund).", en: "Search for the top-3 nearest, but first narrow the search with a metadata filter (section refund)." } },
      { id: "print", lines: [29, 30], label: { ru: "Вывод совпадений", en: "Print matches" }, explain: { ru: "Печатаем id, cosine-score и раздел каждого найденного совпадения.", en: "Print the id, cosine score and section of each returned match." } },
    ],
  },
  {
    key: "evaluation-harness",
    page: "evaluation",
    ru: 18,
    en: 18,
    caption: {
      ru: "Eval-харнесс над золотым набором: считаем precision@k и recall@k и сравниваем две версии на одном наборе.",
      en: "Eval harness over a golden set: compute precision@k and recall@k and compare two versions on the same set.",
    },
    regions: [
      { id: "golden", lines: [1, 11], label: { ru: "Золотой набор", en: "Golden set" }, explain: { ru: "Список вопросов, для каждого заранее размечены id релевантных чанков - фундамент оценки.", en: "A list of questions, each pre-labelled with the ids of its relevant chunks - the foundation of evaluation." } },
      { id: "pr-at-k", lines: [13, 20], label: { ru: "precision@k и recall@k", en: "precision@k and recall@k" }, explain: { ru: "Считаем попадания в первых k: precision - доля среди выданных, recall - доля из всех нужных.", en: "Count hits in the first k: precision is the share among the returned, recall is the share of all needed." } },
      { id: "evaluate", lines: [22, 30], label: { ru: "Прогон по набору", en: "Run over the set" }, explain: { ru: "Прогоняем retriever по всем вопросам и усредняем precision@k и recall@k по набору.", en: "Run the retriever over every question and average precision@k and recall@k across the set." } },
      { id: "ab-compare", lines: [32, 35], label: { ru: "Сравнение до/после", en: "Before/after compare" }, explain: { ru: "Обе версии retriever прогоняются на ОДНОМ фиксированном наборе - только так сравнение честное.", en: "Both retriever versions run on the SAME fixed set - only that way is the comparison honest." } },
    ],
  },
  {
    key: "evaluation-ragas",
    page: "evaluation",
    ru: 70,
    en: 70,
    caption: {
      ru: "RAGAS: автоматическая оценка качества ответа - faithfulness, answer relevancy, context precision.",
      en: "RAGAS: automated answer-quality evaluation - faithfulness, answer relevancy, context precision.",
    },
    regions: [
      { id: "imports", lines: [1, 4], label: { ru: "Метрики RAGAS", en: "RAGAS metrics" }, explain: { ru: "Ставим ragas и подключаем три метрики качества: faithfulness, answer_relevancy, context_precision.", en: "Install ragas and import the three quality metrics: faithfulness, answer_relevancy, context_precision." } },
      { id: "dataset", lines: [6, 11], label: { ru: "Датасет оценки", en: "Eval dataset" }, explain: { ru: "Собираем dataset из вопросов, ответов генерации, выданных чанков и эталона из golden.", en: "Assemble the dataset from questions, generation answers, the returned chunks and the golden reference." } },
      { id: "run", lines: [12, 13], label: { ru: "Запуск оценки", en: "Run evaluation" }, explain: { ru: "Прогоняем RAGAS по датасету - он считает метрики автоматически, без ручной разметки каждого ответа.", en: "Run RAGAS over the dataset - it scores the metrics automatically, with no manual labelling of each answer." } },
    ],
  },
  {
    key: "chunking-fixed-size",
    page: "chunking",
    ru: 77,
    en: 77,
    caption: {
      ru: "fixed-size: режем ровно по N единиц подряд, игнорируя смысловые границы.",
      en: "fixed-size: cut exactly N units in a row, ignoring meaning boundaries.",
    },
    regions: [
      { id: "guard", lines: [1, 3], label: { ru: "Проверка размера", en: "Size guard" }, explain: { ru: "Сигнатура функции и защита от неположительного размера окна - иначе рез не имеет смысла.", en: "The function signature and a guard against a non-positive window size - otherwise the cut makes no sense." } },
      { id: "slice", lines: [4, 4], label: { ru: "Нарезка по шагу size", en: "Slice by step size" }, explain: { ru: "Один проход срезами text[i:i+size] с шагом size - резы падают через равные интервалы, игнорируя слова.", en: "A single pass of text[i:i+size] slices stepping by size - cuts fall at equal intervals, ignoring words." } },
      { id: "demo", lines: [7, 12], label: { ru: "Демонстрация", en: "Demo run" }, explain: { ru: "Пример на документе с size=60; печатает каждый чанк - видно, что границы могут пасть посередине слова.", en: "An example over a document with size=60; prints each chunk - boundaries can land mid-word." } },
    ],
  },
  {
    key: "chunking-sliding-window",
    page: "chunking",
    ru: 109,
    en: 109,
    caption: {
      ru: "sliding-window: то же окно, но соседние чанки перекрываются на overlap единиц.",
      en: "sliding-window: the same window, but neighbouring chunks overlap by overlap units.",
    },
    regions: [
      { id: "guards", lines: [1, 5], label: { ru: "Проверки size и overlap", en: "Size and overlap guards" }, explain: { ru: "Сигнатура и две защиты: положительный size и 0 <= overlap < size, иначе окно не сдвигается вперед.", en: "The signature and two guards: a positive size and 0 <= overlap < size, otherwise the window does not move forward." } },
      { id: "step", lines: [6, 8], label: { ru: "Шаг с перекрытием", en: "Overlapping step" }, explain: { ru: "Шаг step = size - overlap меньше окна, поэтому соседние чанки накладываются на overlap единиц.", en: "The step step = size - overlap is smaller than the window, so neighbouring chunks overlap by overlap units." } },
      { id: "loop", lines: [9, 12], label: { ru: "Цикл нарезки", en: "Cutting loop" }, explain: { ru: "Режем text[i:i+size] и двигаем курсор на step; хвост overlap предыдущего чанка повторяется в начале следующего.", en: "Cut text[i:i+size] and advance the cursor by step; the overlap tail of the previous chunk repeats at the start of the next." } },
      { id: "demo", lines: [15, 19], label: { ru: "Демонстрация", en: "Demo run" }, explain: { ru: "Пример с size=50, overlap=15; печать чанков показывает повторяющийся пограничный хвост.", en: "An example with size=50, overlap=15; printing the chunks shows the repeated boundary tail." } },
    ],
  },
  {
    key: "chunking-recursive",
    page: "chunking",
    ru: 148,
    en: 148,
    caption: {
      ru: "recursive: спуск по приоритету разделителей, пока кусок не влезет в лимит size.",
      en: "recursive: descend the separator priority until a piece fits the size limit.",
    },
    regions: [
      { id: "base-case", lines: [1, 6], label: { ru: "База рекурсии", en: "Recursion base" }, explain: { ru: "Список разделителей по умолчанию от крупного к мелкому; если текст уже влезает в size, он возвращается как есть.", en: "A default separator list from coarse to fine; if the text already fits size, it is returned as is." } },
      { id: "split-by-sep", lines: [8, 10], label: { ru: "Рез текущим разделителем", en: "Split by current separator" }, explain: { ru: "Берем первый разделитель уровня и режем им; пустой разделитель означает рез по символам.", en: "Take the first separator of the level and split by it; an empty separator means a per-character cut." } },
      { id: "accumulate", lines: [12, 19], label: { ru: "Склейка мелких кусков", en: "Glue small pieces" }, explain: { ru: "Копим части в буфер, пока сумма влезает в size - чтобы не плодить слишком мелкие чанки.", en: "Accumulate parts in a buffer while the sum fits size - so as not to breed overly small chunks." } },
      { id: "descend", lines: [20, 30], label: { ru: "Спуск на следующий уровень", en: "Descend a level" }, explain: { ru: "Если часть все еще больше size, рекурсивно применяем СЛЕДУЮЩИЙ разделитель; когда разделители кончились - жесткий fixed-size рез.", en: "If a part is still larger than size, recursively apply the NEXT separator; when separators run out, a hard fixed-size cut." } },
      { id: "demo", lines: [34, 39], label: { ru: "Демонстрация", en: "Demo run" }, explain: { ru: "Документ с абзацами через двойной перевод строки и size=70; виден спуск от абзацев к предложениям и словам.", en: "A document with paragraphs via blank lines and size=70; you see the descent from paragraphs to sentences and words." } },
    ],
  },
  {
    key: "chunking-markdown-header",
    page: "chunking",
    ru: 211,
    en: 211,
    caption: {
      ru: "structure-aware (markdown): режем по заголовкам, уровень заголовка кладем в метаданные чанка.",
      en: "structure-aware (markdown): cut by headings, put the heading level into the chunk metadata.",
    },
    regions: [
      { id: "state", lines: [4, 7], label: { ru: "Состояние разбора", en: "Parse state" }, explain: { ru: "Заводим список секций, текущий заголовок и буфер тела - простой потоковый парсер по строкам.", en: "Set up a sections list, the current heading, and a body buffer - a simple line-by-line streaming parser." } },
      { id: "flush", lines: [9, 12], label: { ru: "Закрытие секции", en: "Flush a section" }, explain: { ru: "flush сбрасывает накопленное тело в секцию вместе с ее заголовком, если тело непустое.", en: "flush dumps the accumulated body into a section together with its heading, if the body is non-empty." } },
      { id: "scan-headings", lines: [14, 22], label: { ru: "Поиск заголовков", en: "Scan headings" }, explain: { ru: "Регулярка ловит строки # .. ###### ; на каждом заголовке закрываем прошлую секцию и запоминаем новый заголовок.", en: "The regex catches # .. ###### lines; on each heading we close the previous section and remember the new heading." } },
      { id: "emit-chunks", lines: [24, 32], label: { ru: "Секции в чанки", en: "Sections to chunks" }, explain: { ru: "Каждая секция становится чанком с метаданными заголовка; слишком длинную секцию режем запасным fixed-size.", en: "Each section becomes a chunk with heading metadata; an over-long section is cut with a fallback fixed-size pass." } },
      { id: "demo", lines: [35, 41], label: { ru: "Демонстрация", en: "Demo run" }, explain: { ru: "Markdown-документ с # и ## ; печать показывает заголовок рядом с телом каждого чанка.", en: "A Markdown document with # and ##; printing shows the heading next to each chunk body." } },
    ],
  },
  {
    key: "generation-grounded-call",
    page: "generation",
    ru: 20,
    en: 20,
    caption: {
      ru: "Вызов генерации с заземлением: жесткий system, разбор [source]-цитат и streaming-вариант.",
      en: "Grounded generation call: a firm system instruction, [source] citation parsing, and a streaming variant.",
    },
    regions: [
      { id: "client", lines: [1, 5], label: { ru: "Клиент Anthropic", en: "Anthropic client" }, explain: { ru: "Ставим SDK и создаем клиент - ключ берется из переменной ANTHROPIC_API_KEY.", en: "Install the SDK and create the client - the key is read from ANTHROPIC_API_KEY." } },
      { id: "system", lines: [7, 12], label: { ru: "Инструкция заземления", en: "Grounding instruction" }, explain: { ru: "System делает три вещи: только по контексту, цитаты [source] и честный запасной ответ при пробеле.", en: "The system instruction does three things: only-from-context, [source] citations, and an honest fallback on a gap." } },
      { id: "generate", lines: [14, 24], label: { ru: "Вызов и разбор цитат", en: "Call and parse citations" }, explain: { ru: "Вызываем модель и вытаскиваем все [source] из ответа - проверка, что ответ заземлен на контексте.", en: "Call the model and pull every [source] out of the answer - a check that the answer is grounded on the context." } },
      { id: "stream", lines: [26, 35], label: { ru: "Streaming-вариант", en: "Streaming variant" }, explain: { ru: "То же, но токены отдаются по мере генерации через stream - пользователь видит текст сразу.", en: "The same call, but tokens are yielded as they are generated via stream - the user sees text right away." } },
    ],
  },
];

const SCHEMA = {
  purpose:
    "Annotated bilingual code block for the RAG Guide code-blocks layer (code-blocks.js + code-annot.js).",
  shape:
    "{ lang, code:{ru,en}, caption:{ru,en}, regions:[{id,lines:[s,e],label:{ru,en},explain:{ru,en}}] }",
  rules: [
    "code.ru/code.en line-aligned (equal line count); only comments differ.",
    "regions sorted ascending by start line, non-overlapping, [s,e] within 1..lineCount.",
    "ASCII outside ru strings; consumers skip any _-prefixed key.",
  ],
};

// Emit ONE merged map entry "<key>": { lang, code, caption, regions }. We rely on
// JSON.stringify for safe escaping of the verbatim code strings (JSON is a subset
// of JS object-literal syntax), then indent the literal to sit at map depth 1.
function entryBody(key, lang, code, caption, regions) {
  const data = { lang, code, caption, regions };
  const json = JSON.stringify(data, null, 2);
  return `  ${JSON.stringify(key)}: ${indentNested(json, "  ")}`;
}

// Re-indent a JSON.stringify'd block (2-space indent at depth 0) so that every
// line after the first is prefixed with `pad`, placing the value at the right
// depth inside the surrounding object literal. The first line keeps its position
// (it follows the `"<key>": ` on the same source line).
function indentNested(json, pad) {
  const lines = json.split("\n");
  return lines.map((l, i) => (i === 0 ? l : pad + l)).join("\n");
}

const results = [];
const mismatches = [];
const entries = [];

for (const b of BLOCKS) {
  const ruPath = join(CONTENT, "ru", `${b.page}.md`);
  const enPath = join(CONTENT, "en", `${b.page}.md`);
  const codeRu = extractBlock(ruPath, b.ru);
  const codeEn = extractBlock(enPath, b.en);
  const nRu = lineCount(codeRu);
  const nEn = lineCount(codeEn);
  if (nRu !== nEn) {
    mismatches.push(`${b.key}: ru=${nRu} en=${nEn}`);
    continue;
  }
  // validate regions
  let prevEnd = 0;
  for (const r of b.regions) {
    const [s, e] = r.lines;
    if (s < 1 || e > nRu || s > e) {
      mismatches.push(`${b.key} region ${r.id} out of range [${s},${e}] (lineCount ${nRu})`);
    }
    if (s <= prevEnd) {
      mismatches.push(`${b.key} region ${r.id} overlaps/unsorted (start ${s} <= prevEnd ${prevEnd})`);
    }
    prevEnd = e;
  }
  entries.push(entryBody(b.key, b.lang || "python", { ru: codeRu, en: codeEn }, b.caption, b.regions));
  results.push({ key: b.key, lines: nRu });
}

if (mismatches.length) {
  console.log("MISMATCHES (BLOCKERS):");
  for (const m of mismatches) console.log(`  ${m}`);
  process.exitCode = 1;
} else {
  const merged =
    `// AUTO-GENERATED by .claude/scripts/gen-code-annot.mjs (tasks W2-DATA, W6-FIX). Do not\n` +
    `// hand-edit; regenerate from content/{ru,en}/<page>.md + the in-script region table.\n` +
    `// Data contract: shared/js/lib/code-blocks.js (default export = a map keyed by block key,\n` +
    `// imported once; the loader looks up map[key]). Consolidated from 16 per-block files into\n` +
    `// this single module to stay under the BrewPage 100-file publish cap (W6-FIX, blocker L2).\n` +
    `//\n` +
    `// Shape: { _schema, "<key>": { lang, code:{ru,en}, caption:{ru,en}, regions:[...] }, ... }.\n` +
    `// Consumers MUST skip every _-prefixed key when iterating block keys.\n\n` +
    `const _schema = ${JSON.stringify(SCHEMA, null, 2)};\n\n` +
    `export default {\n` +
    `  _schema,\n` +
    entries.join(",\n") +
    `\n};\n`;
  writeFileSync(OUT_FILE, merged, "utf8");
  console.log("WRITTEN:");
  console.log(`  shared/data/code-annot.js  ${statSync(OUT_FILE).size} bytes  (${results.length} blocks)`);
  for (const r of results) console.log(`    ${r.key}  (${r.lines} code lines)`);
  console.log("\nNo mismatches. All regions in range, sorted, non-overlapping.");
}
