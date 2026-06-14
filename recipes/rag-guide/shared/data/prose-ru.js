/**
 * prose-ru.js -- RU prose overlay for the RAG Guide (EN-primary bilingual flip).
 *
 * RESPONSIBILITY: carry the Russian translation of every translatable PROSE LEAF
 * of each chapter article, keyed by the page slug and the leaf's data-pk. The
 * static HTML is the EN source of truth; prose-i18n.js (shared/js/lib/prose-i18n.js)
 * overlays these RU strings onto the matching [data-pk] leaves when the locale is
 * "ru" and restores the captured EN when it goes back. This module owns NO EN copy.
 *
 * CONSUMED BY: prose-i18n.js -- init(article, { ruData: PROSE_RU, slug }).
 *
 * SHAPE (see _schema below):
 *   export default {
 *     [pageSlug]: {
 *       [pk]: { t: "..." } | { html: "...trusted inline tags..." },
 *       __title, __description, __ogTitle, __ogDesc,   // RU <head> meta
 *     },
 *     _schema: { ... }   // _-prefixed metadata; consumers SKIP every _-key
 *   }
 *
 * LEAF TYPES:
 *   { t: "..." }    -> applied via element.textContent  (no inline tags)
 *   { html: "..." } -> applied via element.innerHTML     (trusted authored inline
 *                      tags only: <strong>, <code>, <a href ...>, <b>, <br>, <em>)
 *
 * XSS HYGIENE (hard rule): this is a trusted, authored, inert data file. NO
 * <script>, NO on*= event-handler attributes, NO javascript: URLs. {html} values
 * carry only the ASCII inline tags listed above. All RU values are lifted verbatim
 * from the bilingual handoff (migration, not retranslation). ASCII punctuation only
 * (straight quotes, hyphens, three-dot ...); Cyrillic letters in RU string values.
 *
 * KEY PARITY: per page, the key set here MUST equal the set of data-pk attributes
 * stamped on that page's <article class="chapter-prose"> (and the handoff key set).
 * Counts: what-rag 37, why-rag 33, production 43, chunking 90, embedding 56,
 * assemble-context 34, search 33, vector-store 36, evaluation 36, generation 35,
 * payload-anatomy 53. index has NO entry (Atlas MAP landing, no chapter prose).
 */

const PROSE_RU = {
  "what-rag": {
    __title: "Что такое RAG - пайплайн - RAG С НУЛЯ",
    __description:
      "Что такое RAG: конвейер запрос -> эмбеддинг -> векторный индекс -> топ-k -> сборка контекста -> LLM -> ответ. Нажмите узел, чтобы заглянуть внутрь. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Что такое RAG",
    __ogDesc:
      "Что такое RAG: конвейер запрос -> эмбеддинг -> векторный индекс -> топ-k -> сборка контекста -> LLM -> ответ. Нажмите узел, чтобы заглянуть внутрь. Интерактивная глава BrewPage Cookbook.",

    "problem.h2": { t: "Проблема: модель не знает ваших данных" },
    "problem.p1": {
      t: 'Вы спрашиваете обычную LLM: "Сколько дней отпуска у сотрудника на испытательном сроке по нашей политике?" Модель отвечает уверенно - и мимо. Вашей внутренней политики она никогда не видела, поэтому просто генерирует правдоподобный текст. Решение не в том, чтобы "лучше спросить", а в том, чтобы ПЕРЕД ответом дать модели именно ваш документ.',
    },
    "problem.p2": {
      html: 'Именно это делает RAG: находит релевантные фрагменты ваших данных и подмешивает их в запрос, после чего модель отвечает по ним. Архитектуру ввели Lewis et al., 2020 (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>). Вот тот же вызов, но уже с retrieval - минимальный рабочий RAG на реальных API:',
    },
    "problem.p3": {
      html: 'Тут видны все три шага: retrieval (cosine -> top chunk), augmented (chunk в промпте), generation (ответ модели). Формы вызовов реальные: OpenAI Embeddings (<a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>) и Anthropic Messages (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>).',
    },
    "three.h2": { t: "Что такое RAG: три слова" },
    "three.p1": {
      html: "RAG = <strong>R</strong>etrieval-<strong>A</strong>ugmented <strong>G</strong>eneration. Три слова - три шага:",
    },
    "three.li1": {
      html: "<strong>Retrieval</strong> - найти нужные куски текста в ваших данных (в примере выше - cosine по векторам чанков).",
    },
    "three.li2": {
      html: "<strong>Augmented</strong> - добавить найденное прямо в запрос к модели (вставили <code>top</code> в <code>content</code>).",
    },
    "three.li3": {
      html: "<strong>Generation</strong> - модель формулирует ответ на основе этих кусков, а не памяти.",
    },
    "three.p2": {
      html: 'Это и есть определение из исходной работы: retriever выбирает документы, generator обуславливает ответ на них (Lewis et al., 2020, <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>).',
    },
    "not.h2": { t: "Чего RAG не делает" },
    "not.p1": { t: "RAG часто путают с соседними вещами. Четкие границы:" },
    "not.li1": {
      html: '<strong>Это не дообучение (fine-tuning).</strong> Fine-tuning меняет веса модели на ваших примерах; RAG веса не трогает вообще - он лишь подает данные во время запроса. Fine-tuning учит модель ФОРМЕ и стилю, RAG дает ей ФАКТЫ (см. разграничение в руководстве OpenAI по fine-tuning, <a href="https://platform.openai.com/docs/guides/fine-tuning" target="_blank" rel="noopener">platform.openai.com/docs/guides/fine-tuning</a>). Чтобы добавить новый документ, в RAG достаточно его заиндексировать, а не переобучать модель.',
    },
    "not.li2": {
      html: '<strong>Это не просто большое контекстное окно.</strong> "Запихнем все документы в prompt" не масштабируется и вредит: модели хуже используют информацию в середине длинного контекста - эффект "lost in the middle" (Liu et al., 2023, <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>). RAG подает модели только небольшой top-k релевантных кусков.',
    },
    "not.li3": {
      html: '<strong>Это не память модели.</strong> Между запросами модель ничего не запоминает; "память" в RAG живет в вашем внешнем индексе, а не внутри модели.',
    },
    "anatomy.h2": { t: "Анатомия конвейера" },
    "anatomy.p1": {
      t: "Те три слова разворачиваются в конвейер из нескольких стадий. Это карта всего рецепта; каждая стадия - отдельная глава маршрута:",
    },
    "anatomy.li1": {
      html: "<strong>chunking</strong> - режем документы на чанки retrieval-размера.",
    },
    "anatomy.li2": {
      html: "<strong>embedding</strong> - каждый чанк -> вектор фиксированной длины (dim 1536).",
    },
    "anatomy.li3": {
      html: "<strong>vector-store</strong> - векторы в индекс, готовый к поиску ближайших соседей.",
    },
    "anatomy.li4": {
      html: "<strong>search</strong> - запрос -> вектор запроса -> top-k ближайших чанков.",
    },
    "anatomy.li5": {
      html: "<strong>assemble-context</strong> - собираем top-k в один prompt в рамках token-бюджета.",
    },
    "anatomy.li6": {
      html: "<strong>generation</strong> - модель пишет заземленный ответ по собранному контексту.",
    },
    "anatomy.p2": {
      t: "Выше - интерактивная диаграмма этого конвейера: горизонтальный ряд узлов-стадий слева направо. Спина маршрута (spine) один раз прорисовывается при входе в экран; каждый узел можно открыть семантическим зумом (C4-style камера въезжает внутрь стадии), где раскрывается ее состав. Полоса прогресса зарабатывается по мере прохода по основному пути. Без JS страница показывает ту же цепочку стадий статической inline-SVG-схемой и полный текст.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "sources.li3": {
      html: 'OpenAI. Embeddings guide. <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>',
    },
    "sources.li4": {
      html: 'OpenAI. Fine-tuning guide (RAG vs fine-tuning contrast). <a href="https://platform.openai.com/docs/guides/fine-tuning" target="_blank" rel="noopener">platform.openai.com/docs/guides/fine-tuning</a>',
    },
    "sources.li5": {
      html: 'Anthropic. Messages API. <a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      html: "Откройте (drill, semantic zoom) узел <strong>embedding</strong> на диаграмме конвейера и посмотрите, во что он раскрывается - это та же стадия, что и глава embedding.",
    },
    "try.li2": {
      html: "Пройдите основной путь от узла <strong>chunking</strong> до <strong>generation</strong> и доведите полосу прогресса до конца - порядок узлов совпадает с порядком глав маршрута.",
    },
    "try.li3": {
      html: "Сравните стадии <strong>search</strong> и <strong>assemble-context</strong> дриллом: первая находит top-k, вторая пакует его в один prompt.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next": {
      html: "Следующая остановка - <strong>why-rag</strong>: почему обычная модель не справляется (training cutoff, нет приватных данных) и почему RAG дешевле и свежее, чем дообучение.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  "why-rag": {
    __title: "Зачем нужен RAG - с RAG / без RAG - RAG С НУЛЯ",
    __description:
      "Зачем нужен RAG: один вопрос, два тракта - из памяти модели и по найденному источнику. Интерактивное сравнение BrewPage Cookbook.",
    __ogTitle: "Зачем нужен RAG",
    __ogDesc:
      "Зачем нужен RAG: один вопрос, два тракта - из памяти модели и по найденному источнику. Интерактивное сравнение BrewPage Cookbook.",

    "problem.h2": { t: "Проблема: модель устаревает и не знает вашего" },
    "problem.p1": {
      html: 'Обычная модель обучена до некоторой даты (training cutoff) и после этого заморожена: о событиях и документах позже этой даты она не знает ничего. Например, обзор моделей Anthropic прямо указывает дату отсечки обучающих данных для каждой модели (<a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">docs.anthropic.com/en/docs/about-claude/models</a>). Плюс она никогда не видела ваших приватных документов. Итог - два источника ошибок: устаревшие факты и выдумки про ваши данные.',
    },
    "problem.p2": {
      t: "RAG убирает оба одним ходом: нужный факт подается в момент запроса из вашего свежего индекса. Сравните два пути одного и того же вопроса - без RAG и с RAG:",
    },
    "problem.p3": {
      html: 'Track B никогда не пишет ответ, пока контекст не подставлен: сначала retrieval, потом генерация. Форма вызова - реальный Anthropic Messages API (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>).',
    },
    "fails.h2": { t: "Почему обычная модель не справляется" },
    "fails.p1": { t: 'Две причины, обе структурные, а не "плохо спросили":' },
    "fails.li1": {
      html: '<strong>Training cutoff.</strong> После даты отсечки модель не знает нового; обновить инструкцию = снова трогать модель. Даты отсечки публикуются в обзоре моделей (<a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">docs.anthropic.com/en/docs/about-claude/models</a>).',
    },
    "fails.li2": {
      html: "<strong>Нет приватных данных.</strong> Ваши внутренние документы не были и не будут в общедоступном обучающем корпусе, поэтому любой ответ о них без retrieval - догадка.",
    },
    "fresh.h2": { t: "Свежие и приватные данные без переобучения" },
    "fresh.p1": {
      html: 'RAG хранит знания ВНЕ модели - во внешнем индексе, которым вы управляете сами. Добавить или обновить факт = переиндексировать один документ, а не переобучать модель. Именно за этим Lewis et al., 2020 и разделили параметрическую память (веса модели) и непараметрическую (внешний индекс документов): индекс можно менять без переобучения (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>). Практически: обновили строку в файле - помощник сразу отвечает по новой версии.',
    },
    "ground.h2": { t: "Меньше выдуманных фактов: grounding + цитаты" },
    "ground.p1": {
      html: 'Когда модель отвечает по поданному контексту, ответ заземлен (grounded) на конкретных фрагментах, и к каждому утверждению можно приложить ссылку на chunk-источник. Это и было главным результатом исходной работы: RAG дает более конкретные и фактичные ответы, чем чисто параметрическая модель (Lewis et al., 2020, <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>). Важно только подавать немного самых релевантных кусков и ставить главное ближе к краям prompt: модели хуже используют то, что зарыто в середине длинного контекста (Liu et al., 2023, <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>).',
    },
    "cost.h2": { t: "Стоимость: RAG против дообучения" },
    "cost.p1": {
      html: 'Дообучение (fine-tuning) требует собрать dataset, запустить обучение и повторять это при каждом обновлении данных - это отдельный цикл работы и расходов (<a href="https://platform.openai.com/docs/guides/fine-tuning" target="_blank" rel="noopener">platform.openai.com/docs/guides/fine-tuning</a>). RAG же добавляет один шаг retrieval перед обычным вызовом модели и индексирует новые документы инкрементально. Когда задача - дать модели ФАКТЫ, которые часто меняются, RAG обычно дешевле и быстрее в поддержке; fine-tuning остается для задач ФОРМЫ и стиля. (Это инженерный компромисс, а не абсолют: считайте на своих объемах - см. главу production.)',
    },
    "cost.p2": {
      html: 'Выше - интерактивная двухдорожечная трассировка одного запроса. <strong>Track A (без RAG):</strong> запрос идет прямо в модель -> устаревший или выдуманный ответ. <strong>Track B (с RAG):</strong> запрос сначала наполняет box контекста найденными чанками, и только ПОСЛЕ этого появляется заземленный ответ. Основной путь - Track B; некоторые узлы открываются дриллом (semantic zoom камеры) в подробность. Заземленный зеленый ответ никогда не рисуется до того, как retrieval завершен - это и есть дидактический смысл motion. Без JS обе дорожки показаны статической inline-SVG-схемой с полным текстом.',
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "sources.li3": {
      html: 'Anthropic. Models overview (model families, training cutoff). <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">docs.anthropic.com/en/docs/about-claude/models</a>',
    },
    "sources.li4": {
      html: 'Anthropic. Messages API. <a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>',
    },
    "sources.li5": {
      html: 'OpenAI. Fine-tuning guide (cost/lifecycle contrast). <a href="https://platform.openai.com/docs/guides/fine-tuning" target="_blank" rel="noopener">platform.openai.com/docs/guides/fine-tuning</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: "Запустите Track B и проследите, как узел контекста заполняется чанками ДО того, как появится заземленный ответ.",
    },
    "try.li2": {
      t: "Сравните Track A и Track B на одном вопросе: отметьте, что без retrieval ответ появляется сразу и без ссылки на источник.",
    },
    "try.li3": {
      t: "Откройте дриллом узел контекста в Track B и посмотрите, какие именно чанки попали в prompt и в каком порядке.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next": {
      html: "Следующая остановка - <strong>chunking</strong>: как резать большие документы на чанки retrieval-размера, где именно резать и как выбрать размер и overlap.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  production: {
    __title: "Продакшен-запуск - стоимость, кеш, доступ - RAG С НУЛЯ",
    __description:
      "Продакшен RAG: связать конвейер в живой сервис - скорость и стоимость запроса, кеш, мониторинг, доступ. Отметьте чеклист вывода в прод и посчитайте стоимость на своих числах. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Продакшен-запуск: живой сервис",
    __ogDesc:
      "Продакшен RAG: связать конвейер в живой сервис - скорость и стоимость запроса, кеш, мониторинг, доступ. Отметьте чеклист вывода в прод и посчитайте стоимость на своих числах. Интерактивная глава BrewPage Cookbook.",

    "problem.h2": { t: "Проблема, с которой вы пришли" },
    "problem.p1": {
      t: 'Прототип RAG работает у вас на ноутбуке. Но реальные пользователи приносят то, чего не было в демо: каждый запрос стоит денег и секунд, вопросы идут пачками в пик нагрузки, данные устаревают через неделю, а разным людям положено видеть разные документы. Без контроля над этим "работает на демо" превращается в "дорого, медленно, и утекают чужие данные".',
    },
    "problem.p2": {
      t: "Это вершина маршрута - продакшен (production): связать все звенья (chunking -> embedding -> store -> retrieve -> assemble -> generation) в сервис и держать его в форме. Здесь решаются четыре вещи: скорость и стоимость запроса, мониторинг и обновление данных, безопасность и доступ, постепенное улучшение по метрикам. Ниже - рабочий скелет сервиса с этими крючками.",
    },
    "endpoint.h2": { t: "Решение: продакшен-эндпоинт с контролем затрат" },
    "endpoint.p1": {
      t: "Вот рабочий эндпоинт на Python (FastAPI), который собирает весь конвейер и добавляет продакшен-крючки: кеш, измерение задержки, подсчет стоимости, фильтр доступа.",
    },
    "cost.h2": { t: "Скорость и стоимость запроса" },
    "cost.p1": {
      html: 'Каждый запрос платит за токены входа (инструкция + контекст + вопрос) и выхода (ответ). Цена считается по тарифу вендора за токены - например, публичный <a href="https://www.anthropic.com/pricing" target="_blank" rel="noopener">Anthropic pricing</a> задает отдельную цену за входные и выходные токены. Отсюда два рычага: меньше контекста (бюджет токенов из главы про сборку контекста) и короче ответ.',
    },
    "cost.p2": {
      html: "Третий рычаг - <strong>кеш</strong>. Одинаковые вопросы не должны заново платить за генерацию; <code>TTLCache</code> выше отдает готовый ответ, а TTL не дает кешу отдавать устаревшее после обновления данных. Отдельно кеш эмбеддинга запроса снимает повторный вызов эмбеддера на тот же текст.",
    },
    "cost.p3": {
      t: "Задержка (latency) складывается из двух частей: поиск по индексу (обычно миллисекунды, см. ANN в главе про векторное хранилище) и генерация (самая долгая часть). Стриминг из главы про генерацию не уменьшает общее время, но резко сокращает воспринимаемое ожидание - пользователь видит первые токены сразу.",
    },
    "monitor.h2": { t: "Мониторинг и обновление данных" },
    "monitor.p1": {
      t: "То, что вы не измеряете в продакшене, сломается тихо. Логируйте по каждому запросу: задержку, стоимость, число выданных кусков, был ли кеш-хит и (где пользователь дал согласие) его оценку ответа. Эти оценки - сырое топливо для золотого набора из главы про оценку: плохие ответы превращаются в новые тест-кейсы.",
    },
    "monitor.p2": {
      t: "Данные устаревают. Когда документ меняется, его нужно заново разбить на куски, пересчитать эмбеддинг и обновить в индексе - инкрементально, только изменившееся, а не весь корпус. После обновления сбросьте относящийся к нему кеш, иначе пользователь получит старый ответ по новому документу.",
    },
    "access.h2": { t: "Безопасность и доступ" },
    "access.p1": {
      html: "В многопользовательском сервисе разным людям положено видеть разные документы. Ключевой принцип: доступ проверяется на шаге retrieve, а не после генерации. Если модель увидела кусок в контексте, считайте, что пользователь уже получил к нему доступ - обрезать это в ответе поздно. Поэтому в <code>ask</code> retrieve получает <code>allowed_filter</code> пользователя и физически не возвращает куски, которые ему не положены.",
    },
    "access.p2": {
      html: 'Практически это фильтр по метаданным при поиске (см. фильтры по метаданным в главах про чанкинг и векторное хранилище): у каждого куска есть tenant/раздел/уровень доступа, и запрос ограничивается тем, что разрешено. Вендор векторной базы обычно дает для этого фильтрацию по метаданным - см., например, <a href="https://docs.pinecone.io/guides/index-data/indexing-overview#metadata" target="_blank" rel="noopener">Pinecone metadata filtering</a> или аналог у вашей базы. Отдельно: ключи API и токены доступа храните в секретах, не в коде и не в логах, и не кладите чувствительные данные в шаблон промпта, который может уйти в логи вендора.',
    },
    "access.p3": {
      t: "Если вы публикуете рецепт или демо на хостинге, соблюдайте правила платформы на пользовательском уровне (что можно размещать, как сообщить о нарушении) - без предположений о ее внутренней работе.",
    },
    "checklist.h2": { t: "Чеклист вывода в прод" },
    "checklist.p1": {
      t: "Выше - интерактивный чеклист с earned-progress: отметьте пункт, и полоса прогресса заполняется зеленым - до конца только когда закрыт каждый пункт. Те же пункты прозой:",
    },
    "checklist.li1": {
      t: "Бюджет токенов ограничен, контекст не раздут (assemble-context).",
    },
    "checklist.li2": {
      t: "Кеш ответов и эмбеддинга с разумным TTL; сброс кеша при обновлении данных.",
    },
    "checklist.li3": {
      t: "Логируются задержка, стоимость, число кусков, кеш-хит по каждому запросу.",
    },
    "checklist.li4": {
      t: "Инкрементальное обновление индекса при изменении документов.",
    },
    "checklist.li5": {
      t: "Доступ проверяется на шаге retrieve через фильтр по метаданным, а не после.",
    },
    "checklist.li6": {
      t: "Ключи и токены - в секретах, не в коде, не в логах, не в промпте.",
    },
    "checklist.li7": {
      t: "Золотой набор и регулярные прогоны оценки до/после правки (evaluation).",
    },
    "checklist.li8": {
      t: 'Запасной вариант "Этого нет в документах" работает для случаев без контекста (generation).',
    },
    "future.h2": { t: "Куда движется RAG" },
    "future.p1": {
      html: 'RAG быстро развивается: гибридный поиск (смысл + ключевые слова), реранкинг кросс-энкодером, агентные схемы с несколькими шагами retrieve и граф-RAG над связными сущностями. Базовый же конвейер - retrieve, augment, generate из <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">Lewis et al., 2020</a> - остается тем же каркасом, на который эти улучшения насаживаются. Освоив этот маршрут, вы можете читать любое новое расширение как вариацию знакомых стадий.',
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Anthropic. Pricing (цена за входные/выходные токены). <a href="https://www.anthropic.com/pricing" target="_blank" rel="noopener">anthropic.com/pricing</a>',
    },
    "sources.li3": {
      html: 'Pinecone. Metadata filtering (access via metadata). <a href="https://docs.pinecone.io/guides/index-data/indexing-overview#metadata" target="_blank" rel="noopener">docs.pinecone.io</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: "В калькуляторе введите свои tokens_in/tokens_out и тариф вендора: посмотрите цену одного запроса, потом добавьте QPS и получите месячную оценку.",
    },
    "try.li2": {
      t: "Поднимите долю кеш-хитов в калькуляторе и проследите, как падает стоимость - кеш это прямой рычаг экономики.",
    },
    "try.li3": {
      t: "Отмечайте пункты чеклиста по одному и смотрите, как заполняется earned-progress: незакрытый пункт о проверке доступа на шаге retrieve - это блокировщик выхода в прод.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next": {
      html: "Это вершина маршрута - вы прошли весь RAG от постановки проблемы до живого сервиса. Вернитесь на карту <strong>start</strong>, чтобы увидеть пройденный путь целиком, или откройте показательный <strong>payload-anatomy</strong>, где один реальный запрос разобран поле за полем сквозь все стадии.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  chunking: {
    __title: "Чанкинг - где резать документ - RAG С НУЛЯ",
    __description:
      "Чанкинг: каталог из 9 стратегий реза с рейтингами сложности и стоимости, рабочим Python и обучающими анимациями. Нажмите строку, чтобы раскрыть стратегию. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Стратегии реза: каталог",
    __ogDesc:
      "Чанкинг: каталог из 9 стратегий реза с рейтингами сложности и стоимости, рабочим Python и обучающими анимациями. Нажмите строку, чтобы раскрыть стратегию. Интерактивная глава BrewPage Cookbook.",

    "problem.h2": { t: "Проблема: где резать документ и насколько крупно" },
    "problem.p1": {
      html: 'Отдать ретриверу весь документ целиком не получится. Первая причина чисто техническая: модель эмбеддингов принимает текст ограниченной длины, и один гигантский фрагмент в нее просто не влезет. Вторая причина тоньше и важнее: даже когда длинный контекст помещается, модель хуже использует информацию в его середине - эффект "lost in the middle", измеренный на нескольких моделях: точность выше, когда нужный факт стоит в начале или в конце контекста, и заметно проседает в центре (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023, arXiv:2307.03172</a>). Поэтому большой документ режут на чанки - фрагменты retrieval-размера, которые дальше превращают в эмбеддинги, хранят в индексе и извлекают по одному.',
    },
    "problem.p2": {
      t: "Вопрос не в том, резать или нет, а в том, где резать и насколько крупно. Это и есть стадия чанкинга - одна из остановок на верхнеуровневой карте маршрута. Ключевая мысль главы: выбор стратегии реза - это измеряемый компромисс между простотой, ценой и качеством границ, а не одна правильная константа.",
    },
    "problem.p3": {
      html: 'RAG как метод - "найти, дополнить, сгенерировать" - введен в <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">Lewis et al., 2020, arXiv:2005.11401</a>; чанкинг - это первый шаг стадии поиска: без нарезки нечего превращать в эмбеддинги и нечего искать.',
    },
    "parts.h2": { t: "Из чего состоит чанкинг" },
    "parts.p1": {
      t: "При детализации стадия чанкинга распадается на три части. Это общий каркас любой стратегии - меняется только сплиттер.",
    },
    "parts.li1": {
      html: "<strong>Splitter</strong> - решает, ГДЕ резать. От этого зависит, попадет ли связанный смысл в один чанк или рез разорвет предложение пополам. Весь каталог ниже - это разные сплиттеры.",
    },
    "parts.li2": {
      html: '<strong>Overlap</strong> - общий хвост текста, который повторяется в конце одного чанка и в начале следующего. Без перекрытия факт, попавший на границу реза, не найдется целиком ни в одном чанке; небольшое перекрытие сохраняет контекст на стыке (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "parts.li3": {
      html: "<strong>Metadata</strong> - источник, позиция (<code>fromChar</code>/<code>toChar</code>) и теги, прикрепленные к чанку. Позже они нужны, чтобы фильтровать кандидатов в векторной базе и вернуть точную цитату в ответе генерации.",
    },
    "parts.p2": {
      html: 'Размер чанка и перекрытие - это компромисс, а не константа: мелкие чанки точнее попадают в запрос, но теряют окружающий контекст; крупные несут контекст, но размывают релевантность и упираются в "lost in the middle" (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023, arXiv:2307.03172</a>). Правильное значение зависит от ваших документов, поэтому его подбирают измерением на золотом наборе вопросов, а не угадыванием (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "parts.h3a": { t: "В чем мерить размер: символы или токены" },
    "parts.p3": {
      html: "Размер чанка можно считать в символах, а можно - в токенах, и это не косметическая разница. Символьный счет прост: длина строки в Python - это <code>len(text)</code>, никаких зависимостей. Но настоящий бюджет, в который упирается RAG, измеряется не в символах, а в токенах: и окно контекста модели, и счет за вызов считаются в токенах. Один токен - это в среднем кусок слова, и для разных языков соотношение символов к токенам разное (кириллица обычно дает больше токенов на тот же текст, чем латиница). Поэтому чанк в 1000 символов может неожиданно не влезть в токен-бюджет шага сборки контекста.",
    },
    "parts.p4": {
      html: 'Поэтому продакшен-сплиттеры считают именно токены тем же токенизатором, что и целевая модель. OpenAI публикует <code>tiktoken</code> - токенизатор ее моделей (<a href="https://github.com/openai/tiktoken" target="_blank" rel="noopener">OpenAI, tiktoken</a>; <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">OpenAI Embeddings guide</a>); LangChain оборачивает его в <code>TokenTextSplitter</code>, который режет по токенам, а не по символам (<a href="https://python.langchain.com/docs/how_to/split_by_token/" target="_blank" rel="noopener">LangChain, split by token</a>). Любую стратегию из каталога ниже можно реализовать как символьную (просто и без зависимостей) или как токенную (точнее по бюджету модели); единица счета - это ортогональная ручка к выбору сплиттера. В примерах ниже для наглядности счет символьный, но в продакшене ту же логику запускают по токенам.',
    },
    "catalog.h2": { t: "Стратегии реза: каталог" },
    "catalog.p1": {
      t: "Девять стратегий - от самой простой к самой умной. Сначала обзорная таблица с рейтингами - ее можно читать как шпаргалку и сравнивать строчки глазами. Под таблицей каждая стратегия раскрыта: как работает, когда применять, пошаговый алгоритм и (для основных) рабочий Python.",
    },
    "catalog.p2": {
      html: "Стоимость разбита на три оси, потому что они растут неравномерно: <strong>Token cost</strong> - сколько дополнительных токенов порождает стратегия; <strong>Time cost</strong> - задержка нарезки одного документа; <strong>Compute cost</strong> - вычислительная нагрузка. Рейтинги относительные (low / medium / high), а не абсолютные числа: они показывают порядок стратегий между собой, а не бенчмарк на вашем железе.",
    },
    "catalog.h3fixed": { t: "fixed-size: режем каждые N единиц" },
    "catalog.fixed.p1": {
      html: "<strong>Как работает.</strong> Самая простая стратегия: идем по тексту и отрезаем ровно N единиц (символов или токенов) подряд, игнорируя смысловые границы. Размер каждого чанка предсказуем; границы могут попадать посередине слова или предложения.",
    },
    "catalog.fixed.p2": {
      html: '<strong>Когда применять.</strong> Быстрый прототип; однородный текст без явной структуры; когда вам важна именно предсказуемость размера. Это базовая линия, от которой отталкиваются остальные стратегии (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "catalog.fixed.p3": {
      html: "<strong>Алгоритм.</strong> Задайте размер окна <code>size</code>; поставьте курсор <code>i = 0</code>; отрежьте подстроку <code>text[i : i + size]</code>; сдвиньте курсор <code>i = i + size</code>; повторяйте, пока <code>i &lt; len(text)</code>; последний чанк может быть короче <code>size</code> - это нормально.",
    },
    "catalog.fixed.p4": {
      t: "Анимация: резы падают через равные интервалы независимо от границ слов - рез может пасть посередине слова.",
    },
    "catalog.h3sliding": { t: "sliding-window (overlap): окно с перекрытием" },
    "catalog.sliding.p1": {
      html: "<strong>Как работает.</strong> То же fixed-size окно, но соседние чанки перекрываются на <code>overlap</code> единиц: каждый следующий чанк начинается не там, где кончился предыдущий, а на <code>overlap</code> раньше. Так факт, разорванный границей, целиком попадает хотя бы в один чанк.",
    },
    "catalog.sliding.p2": {
      html: '<strong>Когда применять.</strong> Когда факты часто ложатся на границы и потеря пограничного смысла недопустима. Цена - дублирование текста: часть токенов идет в индекс дважды (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "catalog.sliding.p3": {
      html: "<strong>Алгоритм.</strong> Задайте <code>size</code> и <code>overlap</code> (<code>0 &lt;= overlap &lt; size</code>); вычислите шаг <code>step = size - overlap</code>; режьте <code>text[i : i + size]</code> и сдвигайте курсор на <code>step</code>; хвост <code>overlap</code> предыдущего чанка повторяется в начале следующего.",
    },
    "catalog.sliding.p4": {
      t: "Анимация: окно едет по тексту с шагом step = size - overlap; зона перекрытия повторяется в соседнем чанке.",
    },
    "catalog.h3recursive": {
      t: "recursive (separator hierarchy): рез по приоритету разделителей",
    },
    "catalog.recursive.p1": {
      html: '<strong>Как работает.</strong> Режем по приоритетному списку разделителей - сначала по самым крупным (двойной перевод строки = абзац), потом по более мелким (перевод строки, предложение, пробел), пока каждый кусок не влезет в лимит <code>size</code>. Если кусок все еще больше лимита, к нему рекурсивно применяется следующий разделитель. Это стратегия по умолчанию в LangChain <code>RecursiveCharacterTextSplitter</code> (<a href="https://python.langchain.com/docs/how_to/recursive_text_splitter/" target="_blank" rel="noopener">LangChain, RecursiveCharacterTextSplitter</a>).',
    },
    "catalog.recursive.p2": {
      html: "<strong>Когда применять.</strong> Универсальный выбор по умолчанию для прозы: аккуратные границы по абзацам и предложениям, но ни один чанк не превышает лимит. Почти всегда лучше голого fixed-size при той же низкой цене.",
    },
    "catalog.recursive.bq1": {
      html: "Это упрощенная, но рабочая реализация той же идеи, что в LangChain <code>RecursiveCharacterTextSplitter</code>. Продакшен-сплиттер добавляет счет по токенам и перекрытие; логика спуска по разделителям - та же.",
    },
    "catalog.recursive.p3": {
      t: "Анимация: сначала рез по абзацам; куски, не влезшие в size, режутся по предложениям, потом по словам - спуск по дереву.",
    },
    "catalog.h3structure": {
      t: "structure-aware: рез по границам предложений и структуре",
    },
    "catalog.structure.p1": {
      html: "<strong>Как работает.</strong> Режем не по счету символов, а по естественным границам: концам предложений, заголовкам Markdown, элементам AST кода. Это лучше всего сохраняет смысл - чанк совпадает с законченной мыслью - но зависит от формата входа: нужны надежные границы.",
    },
    "catalog.structure.p2": {
      html: '<strong>Когда применять.</strong> Есть явная структура, которую ценно сохранить: документация с заголовками, код, транскрипты с репликами. Time cost выше fixed-size из-за этапа сегментации или разбора (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "catalog.structure.bq1": {
      html: 'Это упрощенная версия идеи LangChain <code>MarkdownHeaderTextSplitter</code>: режем по заголовкам и кладем уровень/текст заголовка в метаданные чанка (<a href="https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/" target="_blank" rel="noopener">LangChain, MarkdownHeaderTextSplitter</a>). Для предложений и AST кода обертка та же, меняется только парсер.',
    },
    "catalog.structure.p3": {
      t: "Анимация: резы ложатся только на концы предложений и после заголовка, никогда внутри фразы.",
    },
    "catalog.h3markdown": {
      t: "markdown / document-structure: рез по заголовкам документа",
    },
    "catalog.markdown.p1": {
      html: "<strong>Как работает.</strong> Частный, но очень частый случай structure-aware: документ уже размечен заголовками Markdown (<code>#</code>, <code>##</code>, ...). Режем по заголовкам, каждую секцию делаем чанком, а уровень и текст заголовка кладем в метаданные. Так чанк всегда совпадает с логической секцией, а в метаданных видно его место в иерархии документа.",
    },
    "catalog.markdown.p2": {
      html: '<strong>Когда применять.</strong> Документация, README, базы знаний в Markdown - все, где автор уже расставил структуру (<a href="https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/" target="_blank" rel="noopener">LangChain, MarkdownHeaderTextSplitter</a>). Рабочий Python для этой стратегии дан выше, в разделе structure-aware (функция <code>markdown_header_chunks</code>).',
    },
    "catalog.markdown.p3": {
      t: "Схема: каждая секция между заголовками # становится отдельным чанком; уровень заголовка едет в метаданные.",
    },
    "catalog.h3parent": {
      t: "parent-document (small-to-big): индексируем мелкое, возвращаем крупное",
    },
    "catalog.parent.p1": {
      html: "<strong>Как работает.</strong> Разводим единицу поиска и единицу контекста. Документ режется дважды: на мелкие дочерние чанки (точное попадание в запрос) и на крупные родительские (широкий контекст). В векторный индекс кладутся только мелкие чанки, но у каждого хранится ссылка на родителя. На поиске вы находите мелкий чанк, а в контекст модели подкладываете его крупного родителя.",
    },
    "catalog.parent.p2": {
      html: '<strong>Когда применять.</strong> Когда мелкие чанки выигрывают на поиске, но в ответе нужен более широкий кусок, чем нашлось. Это снимает главный минус мелкой нарезки - узкий контекст - без потери точности поиска (<a href="https://python.langchain.com/docs/how_to/parent_document_retriever/" target="_blank" rel="noopener">LangChain, ParentDocumentRetriever</a>).',
    },
    "catalog.parent.p3": {
      t: "Схема: мелкие дочерние чанки в индексе ссылаются на крупного родителя; на попадание возвращается родитель (small-to-big).",
    },
    "catalog.h3late": {
      t: "late chunking: эмбеддинг целого документа, потом пулинг по чанкам",
    },
    "catalog.late.p1": {
      html: '<strong>Как работает.</strong> Обычный конвейер сначала режет, потом эмбеддит каждый чанк изолированно - и чанк не знает ничего о соседях. Late chunking меняет порядок: сначала прогоняем весь документ через long-context модель эмбеддингов и получаем токенные представления, уже видевшие весь текст; и только потом пулим (усредняем) эти токенные векторы по границам чанков. Каждый итоговый вектор чанка несет контекст всего документа (<a href="https://arxiv.org/abs/2409.04701" target="_blank" rel="noopener">Gunther et al., 2024, "Late Chunking", arXiv:2409.04701</a>).',
    },
    "catalog.late.p2": {
      html: '<strong>Когда применять.</strong> Есть long-context модель эмбеддингов и важно, чтобы мелкий чанк не терял разрешение кореференций ("компания", "она", "этот продукт") за пределами своего фрагмента. Цена - один проход тяжелой модели по всему документу.',
    },
    "catalog.late.p3": {
      t: "Схема: весь документ эмбеддится одним проходом; токенные векторы потом усредняются по границам чанков (embed-whole-then-pool).",
    },
    "catalog.h3contextual": {
      t: "contextual retrieval: дописываем контекст перед эмбеддингом",
    },
    "catalog.contextual.p1": {
      html: '<strong>Как работает.</strong> Перед тем как эмбеддить чанк, дописываем ему короткое поясняющее предложение, которое ставит фрагмент в контекст всего документа. Это пояснение генерирует LLM по паре "документ + чанк". Эмбеддится и индексируется уже чанк-плюс-контекст, поэтому изолированный фрагмент перестает быть непонятным вне документа (<a href="https://www.anthropic.com/news/contextual-retrieval" target="_blank" rel="noopener">Anthropic, Contextual Retrieval</a>).',
    },
    "catalog.contextual.p2": {
      html: "<strong>Когда применять.</strong> Когда чанки часто оказываются неинформативными в отрыве от документа (таблицы, короткие пункты, местоимения без антецедента), и качество поиска важнее, чем разовая цена LLM на обогащение каждого чанка при индексации.",
    },
    "catalog.contextual.p3": {
      t: "Схема: к каждому чанку перед эмбеддингом дописывается LLM-сгенерированный поясняющий контекст (blurb prepended before embed).",
    },
    "catalog.h3semantic": {
      t: "semantic / LLM-based: рез по смысловым сдвигам",
    },
    "catalog.semantic.p1": {
      html: '<strong>Как работает.</strong> Вместо счета символов или разделителей решение о резе принимается по смыслу. Типичный подход: разбить текст на предложения, посчитать эмбеддинг каждого и ставить границу там, где соседние предложения резко расходятся по смыслу (падает косинусная близость между соседями). Вариант - спросить LLM, где логично разрезать. Границы получаются самыми "смысловыми", но каждый кандидат границы стоит вызова модели - отсюда high по всем трем осям стоимости (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "catalog.semantic.p2": {
      html: "<strong>Когда применять.</strong> Когда качество границ критично и оправдывает цену. Для большинства корпусов recursive дает 90% пользы за долю цены; semantic берется, когда измерения показывают, что границы - узкое место.",
    },
    "catalog.semantic.bq1": {
      html: "Порог подбирается измерением на золотом наборе, а не угадывается. Косинус как мера близости смысла разбирается в главе Embedding; semantic-чанкинг опирается на тот же принцип, но применяет его к границам реза, а не к поиску.",
    },
    "catalog.semantic.p3": {
      t: "Анимация: граница ставится там, где соседние предложения резко расходятся по смыслу (косинус падает ниже порога), а не на равных интервалах.",
    },
    "reveal.h2": { t: "Как каталог раскрывается: прогрессивное раскрытие" },
    "reveal.p1": {
      t: "Каталог устроен как semantic-zoom drill с двумя уровнями (больше двух нет):",
    },
    "reveal.li1": {
      html: "<strong>Уровень 0 - обзор.</strong> Видна только обзорная таблица стратегий с рейтингами. Это сравнительный слой: глазами пробегаете строчки и выбираете кандидата. Статичный no-JS вариант - именно эта таблица, полностью читаемая без скриптов.",
    },
    "reveal.li2": {
      html: "<strong>Уровень 1 - одна стратегия.</strong> Клик или drill по строчке стратегии делает semantic zoom в ее панель: развернутое \"как работает\" плюс \"когда применять\" плюс пошаговый алгоритм плюс (для базовых) рабочий Python плюс обучающая анимация реза именно этой стратегии. Выход из зума возвращает к таблице.",
    },
    "reveal.p2": {
      html: "Глубже уровня 1 зум не идет. Все анимации запускаются только когда панель на экране (IntersectionObserver) и только при <code>prefers-reduced-motion: no-preference</code>; иначе показывается конечное состояние над тем же DOM.",
    },
    "tradeoff.h2": { t: "Размер и перекрытие: компромисс" },
    "tradeoff.p1": {
      html: 'Размер чанка и перекрытие - две ручки одного компромисса. Мелкий чанк: точное попадание в запрос, но узкий контекст и риск разорвать факт. Крупный чанк: богатый контекст, но размытая релевантность и "lost in the middle" при сборке промпта (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023, arXiv:2307.03172</a>). Перекрытие смягчает главный минус реза по границам - потерю пограничного факта - ценой дублирования токенов (<a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">Pinecone, Chunking strategies</a>).',
    },
    "tradeoff.p2": {
      t: "Правило без магических чисел: не угадывайте. Возьмите золотой набор вопросов (см. главу Evaluation), прогоните две-три конфигурации (size/overlap/стратегия) и сравните recall нужных чанков. Стратегия из каталога выше - это пространство выбора; измерение - способ выбрать точку в нем.",
    },
    "live.h2": { t: "Связь с живым примером" },
    "live.p1": {
      html: "В живом примере из обзора исходный документ <code>doc.text</code> режется на три чанка по границам предложений - это фактически structure-aware рез по знаку конца предложения. Поля <code>fromChar</code>/<code>toChar</code> индексируют именно <code>doc.text</code>: каждый чанк - это точный срез исходного текста, а не его пересказ. Это и есть Metadata-позиция из drill-down в действии: по ней всегда можно восстановить, откуда взят чанк, и вернуть цитату в ответе.",
    },
    "live.p2": {
      t: "В этом примере чанки не пересекаются (overlap = 0) ради наглядности - это чистый structure-aware без sliding-window. Мысленно добавьте перекрытие: пусть второй чанк начинается на несколько слов раньше, захватывая хвост первого - так факт на границе предложений не потеряется. Это ровно переход от structure-aware к sliding-window из каталога выше.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "sources.li3": {
      html: 'Gunther et al., 2024. Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models. <a href="https://arxiv.org/abs/2409.04701" target="_blank" rel="noopener">arxiv.org/abs/2409.04701</a>',
    },
    "sources.li4": {
      html: 'LangChain. RecursiveCharacterTextSplitter. <a href="https://python.langchain.com/docs/how_to/recursive_text_splitter/" target="_blank" rel="noopener">recursive_text_splitter</a>',
    },
    "sources.li5": {
      html: 'LangChain. Split by token. <a href="https://python.langchain.com/docs/how_to/split_by_token/" target="_blank" rel="noopener">split_by_token</a>',
    },
    "sources.li6": {
      html: 'LangChain. MarkdownHeaderTextSplitter. <a href="https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/" target="_blank" rel="noopener">markdown_header_metadata_splitter</a>',
    },
    "sources.li7": {
      html: 'LangChain. ParentDocumentRetriever. <a href="https://python.langchain.com/docs/how_to/parent_document_retriever/" target="_blank" rel="noopener">parent_document_retriever</a>',
    },
    "sources.li8": {
      html: 'OpenAI. tiktoken (tokenizer). <a href="https://github.com/openai/tiktoken" target="_blank" rel="noopener">github.com/openai/tiktoken</a>',
    },
    "sources.li9": {
      html: 'OpenAI. Embeddings guide. <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>',
    },
    "sources.li10": {
      html: 'Anthropic. Contextual Retrieval. <a href="https://www.anthropic.com/news/contextual-retrieval" target="_blank" rel="noopener">anthropic.com/news/contextual-retrieval</a>',
    },
    "sources.li11": {
      html: 'Pinecone. Chunking strategies (vendor explainer). <a href="https://www.pinecone.io/learn/chunking-strategies/" target="_blank" rel="noopener">pinecone.io/learn/chunking-strategies</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      html: "Откройте каталог на уровне 0 и сравните строчки <code>fixed-size</code> и <code>recursive</code>: при той же низкой цене recursive дает аккуратные границы по разделителям - поэтому он выбор по умолчанию для прозы.",
    },
    "try.li2": {
      html: "Сделайте drill в стратегию <code>sliding-window</code> и запустите ее анимацию: посмотрите, как окно едет с шагом <code>step = size - overlap</code> и зона перекрытия повторяется в соседнем чанке.",
    },
    "try.li3": {
      html: 'Сделайте drill в <code>recursive</code> и пройдите анимацию спуска по разделителям <code>["\\n\\n", "\\n", " ", ""]</code>: те куски, что не влезли по абзацам, режутся по предложениям, потом по словам.',
    },
    "next.h2": { t: "Что дальше" },
    "next.p1": {
      html: "Следующая остановка маршрута - <strong>Embedding</strong>: она берет эти чанки и превращает каждый в числовой вектор, где близость = близость смысла (тот же косинус, на который опирается semantic-чанкинг).",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  embedding: {
    __title: "Эмбеддинг: превращаем фрагмент в вектор - RAG С НУЛЯ",
    __description:
      "Эмбеддинг: каждый фрагмент один раз превращается в вектор фиксированной длины (dim 1536). Косинусная близость = близость смысла, плотные / разреженные / гибридные векторы, выбор модели. Интерактивная анимация chunk -> вектор - BrewPage Cookbook.",
    __ogTitle: "Эмбеддинг: превращаем фрагмент в вектор",
    __ogDesc:
      "Эмбеддинг: каждый фрагмент один раз превращается в вектор фиксированной длины (dim 1536). Косинусная близость = близость смысла, плотные / разреженные / гибридные векторы, выбор модели. Интерактивная анимация chunk -> вектор - BrewPage Cookbook.",

    "problem.h2": { t: "Проблема" },
    "problem.p1": {
      t: 'У вас есть фрагменты - куски текста из прошлой главы. Вопрос пользователя тоже текст, но другими словами: "как вернуть деньги" против фрагмента "политика возврата средств". Сравнение строк здесь не работает: общих слов почти нет, а смысл один и тот же. Нужен способ искать по смыслу, а не по буквам.',
    },
    "problem.p2": {
      html: 'Решение - эмбеддинг (embedding): каждый фрагмент превращаем в вектор, числовой код его смысла, где близость векторов отражает близость смысла (<a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">OpenAI Embeddings guide</a>). Это второй шаг конвейера: после того как документ нарезан на фрагменты, каждый фрагмент один раз превращается в вектор, и дальше эти векторы идут в индекс.',
    },
    "problem.p3": {
      t: "Вот весь шаг целиком - реальный вызов API, который превращает список фрагментов в список векторов:",
    },
    "problem.p4": {
      t: "После этого у вас три вектора длины 1536 - по одному на фрагмент. Сам текст напрямую сравнивать больше не нужно: вся дальнейшая работа идет с числами.",
    },
    "what.h2": { t: "Что такое вектор здесь" },
    "what.p1": {
      html: "Вектор - это упорядоченный список чисел фиксированной длины <code>dim</code>. Модель-эмбеддер отображает текст в точку в <code>dim</code>-мерном пространстве так, чтобы тексты похожего смысла оказывались рядом. Например, OpenAI <code>text-embedding-3-small</code> выдает векторы длины 1536 (<a href=\"https://platform.openai.com/docs/guides/embeddings\" target=\"_blank\" rel=\"noopener\">OpenAI Embeddings guide</a>). Именно поэтому у каждого вектора стоит <code>dim: 1536</code>.",
    },
    "what.p2": {
      t: "Размерность - это не случайное число: ее задает модель, и она одинакова для всех векторов одной модели. Смешивать векторы разных моделей нельзя - они живут в разных пространствах, и сравнивать их бессмысленно.",
    },
    "what.p3": {
      html: 'Важно: числа в поле <code>values</code> в живом примере - это короткие заглушки для макета (по три значения на вектор), а не настоящий эмбеддинг. Настоящий вектор имеет все 1536 компонент; показывать их целиком бессмысленно, поэтому анимация показывает только сам факт "фрагмент -&gt; вектор", а не сырые числа.',
    },
    "cos.h2": { t: "Почему близость векторов = близость смысла" },
    "cos.p1": {
      html: "После того как фрагменты стали векторами, \"похожесть\" измеряют геометрически - чаще всего через косинусную близость (cosine similarity), косинус угла между векторами (<a href=\"https://platform.openai.com/docs/guides/embeddings\" target=\"_blank\" rel=\"noopener\">OpenAI Embeddings guide</a>). Чем меньше угол, тем ближе смысл. Значение косинуса лежит в диапазоне от -1 до 1; для текстовых эмбеддингов на практике работает диапазон примерно 0..1, где 1 - совпадение смысла, а около 0 - тексты про разное.",
    },
    "cos.p2": {
      html: "Почему именно 0..1, а не весь диапазон от -1 до 1: текстовые эмбеддинги обычно нормируют по длине (L2-нормализация) - каждый вектор приводят к единичной длине (<a href=\"https://platform.openai.com/docs/guides/embeddings\" target=\"_blank\" rel=\"noopener\">OpenAI Embeddings guide</a>). У нормированных векторов косинус совпадает со скалярным произведением (dot product), поэтому ранжировать по скалярному произведению - то же самое, что по косинусу, но дешевле: не нужно делить на нормы, которые и так равны единице.",
    },
    "cos.p3": {
      t: "Вот как косинусная близость двух векторов считается вручную - без библиотек, чтобы была видна формула:",
    },
    "cos.p4": {
      t: 'Фрагмент про возврат средств окажется ближе всего к запросу "как вернуть деньги", хотя ни одного общего ключевого слова между ними почти нет. Именно эта близость и позволяет на шаге retrieve достать top-k фрагментов, ближайших к вектору запроса, не сравнивая тексты побуквенно.',
    },
    "cos.p5": {
      html: 'Модели, которые учат такие представления предложений, описаны в работе <a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2019, Sentence-BERT</a>: они специально обучают encoder так, чтобы косинусная близость векторов соответствовала смысловой близости предложений. Это отличает современный трансформерный (transformer) подход на базе Sentence-BERT от классических методов вроде мешка слов или TF-IDF: классика считает совпадение слов, а трансформер кодирует смысл целого предложения в один вектор.',
    },
    "metrics.h2": { t: "Метрики близости: не только косинус" },
    "metrics.p1": { t: "Косинус - не единственная мера. На практике встречаются три:" },
    "metrics.li1": {
      html: "<strong>Косинусная близость</strong> (cosine) - косинус угла, игнорирует длину векторов.",
    },
    "metrics.li2": {
      html: "<strong>Скалярное произведение</strong> (dot product) - сумма покомпонентных произведений; учитывает и угол, и длину.",
    },
    "metrics.li3": {
      html: "<strong>Евклидово расстояние</strong> (Euclidean / L2, часто в квадрате - squared L2) - геометрическое расстояние между точками; меньше значит ближе.",
    },
    "metrics.p2": {
      html: 'Важный факт: для векторов, нормированных к единичной длине, все три метрики ранжируют соседей одинаково - порядок top-k не меняется, отличается только числовое значение. Векторные базы обычно дают выбрать любую из этих метрик при создании индекса (<a href="https://github.com/facebookresearch/faiss/wiki" target="_blank" rel="noopener">FAISS metric types</a>, <a href="https://github.com/pgvector/pgvector" target="_blank" rel="noopener">pgvector</a>), и это уже мостик к следующей главе про векторное хранилище, где метрика задается на уровне индекса.',
    },
    "dense.h2": { t: "Разреженные, плотные и гибридные векторы" },
    "dense.p1": {
      html: 'Эмбеддинги из трансформера - <strong>плотные</strong> (dense) векторы: все 1536 компонент заполнены числами, и каждая кодирует часть смысла (<a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2019, Sentence-BERT</a>). Им противопоставлены <strong>разреженные</strong> (sparse) представления вроде TF-IDF или BM25, где вектор - это веса по словарю и почти все компоненты равны нулю. Разреженный поиск по-прежнему выигрывает на точном совпадении терминов и редких токенах (артикулы, имена, коды), где важна именно буква слова (<a href="https://www.nowpublishers.com/article/Details/INR-019" target="_blank" rel="noopener">Robertson &amp; Zaragoza, 2009, BM25</a>). Поэтому на практике часто применяют <strong>гибридный поиск</strong> (hybrid retrieval): разреженный (BM25) и плотный (dense) объединяют, чтобы поймать и точные термины, и смысл.',
    },
    "more.h2": { t: "Дополнительно: что еще умеют эмбеддинги" },
    "more.li1": {
      html: "<strong>Усечение размерности (Matryoshka, MRL).</strong> Некоторые модели обучены так, что вектор можно обрезать до меньшей длины почти без потери качества; у OpenAI это параметр <code>dimensions</code> у <code>text-embedding-3</code> (<a href=\"https://arxiv.org/abs/2205.13147\" target=\"_blank\" rel=\"noopener\">Kusupati et al., 2022, Matryoshka Representation Learning</a>).",
    },
    "more.li2": {
      html: "<strong>Асимметричные эмбеддинги запроса и документа.</strong> Модели с инструкциями (E5, GTE) кодируют запрос и документ по-разному - например, дописывают префиксы <code>query:</code> и <code>passage:</code> (<a href=\"https://arxiv.org/abs/2212.03533\" target=\"_blank\" rel=\"noopener\">Wang et al., 2022, E5</a>).",
    },
    "more.li3": {
      html: '<strong>Многоязычные эмбеддинги.</strong> Один и тот же смысл на разных языках попадает в близкие точки одного пространства - запрос на русском находит документ на английском (<a href="https://arxiv.org/abs/2004.09813" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2020, Multilingual Sentence-BERT</a>).',
    },
    "more.li4": {
      html: "<strong>Квантизация.</strong> Векторы можно хранить в int8 или даже в бинарном виде - это резко уменьшает индекс ценой небольшой потери полноты (recall); подробнее в главе про векторное хранилище.",
    },
    "model.h2": { t: "Выбор модели, размерность, дрейф" },
    "model.p1": {
      t: "Модель эмбеддингов - это выбор, который напрямую определяет качество поиска:",
    },
    "model.li1": {
      html: "<strong>Размерность.</strong> Больше <code>dim</code> - обычно больше точности, но дороже хранение и медленнее поиск. <code>text-embedding-3-small</code> дает 1536 компонент; некоторые модели позволяют урезать размерность ради экономии (<a href=\"https://platform.openai.com/docs/guides/embeddings\" target=\"_blank\" rel=\"noopener\">OpenAI Embeddings guide</a>).",
    },
    "model.li2": {
      html: "<strong>Язык и домен.</strong> Модель должна понимать язык и терминологию ваших документов. Общие модели хороши широко; узкий домен иногда требует специально обученной модели.",
    },
    "model.li3": {
      html: "<strong>Дрейф модели (drift).</strong> Если вы сменили модель эмбеддингов, все старые векторы в индексе становятся несовместимы с новыми - их нужно пересчитать целиком. Векторы разных моделей нельзя сравнивать между собой.",
    },
    "model.p2": {
      t: "Главное правило: один раз выбрал модель - и фрагменты, и запросы превращай в векторы одной и той же моделью. Иначе запрос и фрагменты окажутся в разных пространствах, и их близость перестанет что-либо значить (это же правило про повторное использование одной модели: один выбор - один индекс).",
    },
    "link.h2": { t: "Связь с живым примером" },
    "link.p1": {
      html: "Шаг <code>s2</code> (kind=embed) берет те же три фрагмента c1..c3 из стадии нарезки и производит три вектора v1..v3. Связь явная: у каждого вектора есть поле <code>chunkId</code>, которое указывает на его фрагмент (v1 -&gt; c1, v2 -&gt; c2, v3 -&gt; c3). Это и есть отображение один-к-одному: один фрагмент дает ровно один вектор.",
    },
    "link.p2": {
      html: "После шага <code>s3</code> (store) векторы уходят в индекс - это следующая стадия конвейера (vector-store), которую следующая глава раскрывает отдельно.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'OpenAI. Embeddings guide (text-embedding-3-small, dim=1536, cosine similarity, L2-нормализация к единичной длине, параметр dimensions). <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>',
    },
    "sources.li2": {
      html: 'Reimers &amp; Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. <a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">arxiv.org/abs/1908.10084</a>',
    },
    "sources.li3": {
      html: 'Robertson &amp; Zaragoza, 2009. The Probabilistic Relevance Framework: BM25 and Beyond. <a href="https://www.nowpublishers.com/article/Details/INR-019" target="_blank" rel="noopener">nowpublishers.com/article/Details/INR-019</a>',
    },
    "sources.li4": {
      html: 'Kusupati et al., 2022. Matryoshka Representation Learning. <a href="https://arxiv.org/abs/2205.13147" target="_blank" rel="noopener">arxiv.org/abs/2205.13147</a>',
    },
    "sources.li5": {
      html: 'Wang et al., 2022. Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5). <a href="https://arxiv.org/abs/2212.03533" target="_blank" rel="noopener">arxiv.org/abs/2212.03533</a>',
    },
    "sources.li6": {
      html: 'Reimers &amp; Gurevych, 2020. Making Monolingual Sentence Embeddings Multilingual using Knowledge Distillation. <a href="https://arxiv.org/abs/2004.09813" target="_blank" rel="noopener">arxiv.org/abs/2004.09813</a>',
    },
    "sources.li7": {
      html: 'FAISS. Metric types and indexes wiki. <a href="https://github.com/facebookresearch/faiss/wiki" target="_blank" rel="noopener">github.com/facebookresearch/faiss/wiki</a>',
    },
    "sources.li8": {
      html: 'pgvector. Open-source vector similarity search for PostgreSQL (cosine / inner product / L2). <a href="https://github.com/pgvector/pgvector" target="_blank" rel="noopener">github.com/pgvector/pgvector</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: "Откройте интерактив embedding-materialize на узле Embedding (semantic zoom внутрь) и прогоните анимацию шага: смотрите, как текст фрагмента c1 разбивается на токены, а затем оседает в вектор v1. Обратите внимание: меняется представление (текст -> вектор), а не сам текст.",
    },
    "try.li2": {
      html: "Пройдите по векторам v1..v3 и сопоставьте каждый с фрагментом по полю <code>chunkId</code>. Убедитесь, что отображение строго один-к-одному (v1 -&gt; c1, v2 -&gt; c2, v3 -&gt; c3).",
    },
    "try.li3": {
      t: "Возьмите код cosine выше и посчитайте близость одного запроса к каждому из трех фрагментов; проверьте, что самый близкий по смыслу фрагмент получает наибольший балл, даже без общих слов.",
    },
    "next.h2": { t: "Что дальше" },
    "next.p1": {
      html: "Векторы готовы - дальше их нужно где-то хранить и быстро искать по ним ближайших. Следующая остановка: <strong>vector-store</strong> (векторная база и поиск ближайших соседей).",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  "assemble-context": {
    __title: "Сборка контекста - упаковка top-k в промпт - RAG С НУЛЯ",
    __description:
      "Сборка контекста: шаблон промпта, token budget, порядок кусков по краям (lost-in-the-middle) и удаление дублей. Откройте узел сборки и подвигайте бюджет токенов. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Сборка контекста",
    __ogDesc:
      "Сборка контекста: шаблон промпта, token budget, порядок кусков по краям (lost-in-the-middle) и удаление дублей. Откройте узел сборки и подвигайте бюджет токенов. Интерактивная глава BrewPage Cookbook.",

    "problem.h2": { t: "Проблема, с которой вы пришли" },
    "problem.p1": {
      t: "Этап retrieve вернул вам top-k фрагментов - скажем, 8 кусков, отсортированных по косинусной близости. Вы радостно склеиваете их в один текст, добавляете вопрос пользователя и отправляете в модель. Ответ приходит - и он хуже, чем мог бы быть: модель проигнорировала самый важный фрагмент, потому что вы поставили его в середину, а половина кусков - это дубли одного и того же абзаца, которые съели весь бюджет токенов.",
    },
    "problem.p2": {
      t: 'Это и есть стадия сборки контекста (assemble-context): не "все найденное в кучу", а инженерная сборка. Качество ответа определяют три решения: по какому шаблону собрать промпт, сколько контекста влезет в лимит модели и в каком порядке разложить куски. Ниже - рабочий путь от сырого top-k к готовому промпту.',
    },
    "problem.p3": {
      html: 'Это шаг augment из исходной работы по RAG: извлеченные документы подмешиваются во вход генератора (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">Lewis et al., 2020</a>). Размеченный вид самого запроса и ответа разобран в главе <a href="payload-anatomy.html">Анатомия запроса</a> - там подписано каждое поле промпта.',
    },
    "solution.h2": { t: "Решение: сборщик контекста целиком" },
    "solution.p1": {
      t: "Вот рабочая функция на Python, которая берет результаты top-k от retrieve и собирает из них промпт под бюджет токенов. Она делает сразу все четыре вещи: шаблон, бюджет, порядок, удаление дублей.",
    },
    "solution.p2": {
      html: "Функция <code>order_for_attention</code> раскладывает лучшие куски по краям окна, а слабые - в середину. Почему именно так, разберем ниже.",
    },
    "template.h2": { t: "Шаблон промпта" },
    "template.p1": {
      html: 'Промпт RAG - это не просто "вопрос". Это три части в фиксированном порядке: <strong>инструкция</strong> (как отвечать), <strong>контекст</strong> (найденные куски) и <strong>вопрос</strong> пользователя. Именно объединение извлеченного с запросом и есть определение RAG по <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">Lewis et al., 2020</a>: генератор видит не только вопрос, но и извлеченные документы как часть входа.',
    },
    "template.p2": {
      html: 'Инструкцию задавайте явно и жестко: "отвечай только по контексту, если данных нет - скажи об этом". Без нее модель достроит пробелы из собственной памяти - а это прямая дорога к выдумкам, с которыми борется глава про генерацию. Каждый кусок подписывайте источником (<code>[source]</code>), чтобы на шаге генерации модель могла сослаться на конкретный фрагмент.',
    },
    "budget.h2": { t: "Сколько контекста влезает" },
    "budget.p1": {
      html: 'У модели есть твердый предел - окно контекста (context window), максимум токенов на входе и выходе вместе. Например, семейство Claude работает с окном в 200 000 токенов (<a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">Anthropic, Models overview</a>). Это кажется огромным, но бюджет токенов под контекст всегда меньше окна: часть места занимают инструкция, вопрос, история диалога и место под ответ.',
    },
    "budget.p2": {
      html: 'Токен - это не слово и не символ; это единица, на которые токенизатор режет текст (части слов, знаки). Считать надо именно токены, а не символы - поэтому в коде выше <code>count_tokens</code> использует настоящий токенизатор <code>tiktoken</code> (<a href="https://github.com/openai/tiktoken" target="_blank" rel="noopener">OpenAI tiktoken</a>), а не <code>len(text)</code>. Большое окно не бесплатно: каждый лишний токен контекста - это деньги и задержка в каждом запросе (об этом - глава про продакшен).',
    },
    "order.h2": { t: "Порядок и приоритет кусков" },
    "order.p1": {
      html: 'Главный контринтуитивный факт этой главы: порядок кусков внутри промпта меняет ответ. Модели хуже всего используют информацию, попавшую в <strong>середину</strong> длинного контекста, и лучше всего - то, что стоит в <strong>начале или конце</strong>. Это эффект "lost in the middle": точность падает, когда нужный факт лежит посередине окна (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023</a>).',
    },
    "order.p2": {
      html: 'Практический вывод прямой: ставьте самые релевантные куски по краям, а менее важные - в середину. Именно это делает <code>order_for_attention</code>:',
    },
    "dedup.h2": { t: "Чистим дубли и обрезаем лишнее" },
    "dedup.p1": {
      t: "Retrieve часто возвращает почти-дубли: один и тот же абзац, попавший в два соседних куска с перекрытием (см. главу про чанкинг), или тот же факт из двух версий документа. Дубли не добавляют информации, но едят бюджет токенов и выталкивают из окна полезные куски. Шаг удаления дублей выше убирает точные повторы; для почти-дублей его расширяют сравнением по косинусной близости между кусками.",
    },
    "dedup.p2": {
      html: 'Когда все, что влезает, отобрано, остаток просто обрезается - это нормально. Цель сборки контекста не "вложить все", а вложить нужное в правильном порядке под бюджет. Выше - интерактивный сборщик: откройте узел сборки, подвигайте слайдер <code>max_context_tokens</code> и переключите порядок кусков - счетчик токенов покажет, что влезает, а что обрезается. Без JS страница показывает уже собранный промпт статической схемой и полный текст.',
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "sources.li3": {
      html: 'Anthropic. Models overview (context window). <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">docs.anthropic.com/en/docs/about-claude/models</a>',
    },
    "sources.li4": {
      html: 'OpenAI. tiktoken (tokenizer). <a href="https://github.com/openai/tiktoken" target="_blank" rel="noopener">github.com/openai/tiktoken</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      html: 'Откройте drill context-assembly и сдвиньте слайдер <code>max_context_tokens</code> вниз до 800: посмотрите, как нижние по score куски заметно обрезаются, когда счетчик токенов упирается в лимит.',
    },
    "try.li2": {
      t: 'Переключите тумблер порядка с "по score" на "по краям" и сравните раскладку: самые релевантные куски уезжают к началу и концу окна - это смягчение эффекта lost-in-the-middle.',
    },
    "try.li3": {
      t: "Найдите в списке два почти одинаковых куска и проследите, как шаг удаления дублей выбрасывает повтор, освобождая бюджет под следующий кусок.",
    },
    "next.h2": { t: "Что дальше" },
    "next.p1": {
      html: 'Собранный промпт уходит в модель. Следующая остановка - глава <strong><a href="generation.html">generation</a></strong>: как модель читает этот контекст и пишет заземленный ответ с цитатами. Полный вид запроса поле за полем - в главе <strong><a href="payload-anatomy.html">payload-anatomy</a></strong>.',
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  search: {
    __title: "Как работает поиск по документам - RAG С НУЛЯ",
    __description:
      "Семантический поиск по документам: запрос становится вектором, kNN возвращает top-k ближайших фрагментов по косинусу. Интерактивная карта векторного пространства - BrewPage Cookbook.",
    __ogTitle: "Как работает поиск по документам",
    __ogDesc: "Семантический поиск: близость по смыслу, а не по словам.",

    "problem.h2": { t: "Проблема" },
    "problem.p1": {
      t: 'Пользователь спрашивает: "как вернуть деньги за покупку". А в ваших документах нужный фрагмент называется "политика возврата средств" - ни слова "деньги", ни слова "вернуть" в нем нет. Полнотекстовый поиск по ключевым словам здесь промахнется: общих слов почти нет, а ответ лежит именно в этом фрагменте.',
    },
    "problem.p2": {
      html: 'Решение - поиск по смыслу (semantic search): запрос превращаем в вектор той же моделью, что и фрагменты, и ищем в индексе top-k фрагментов (top-k - несколько самых близких, обычно 3..10), ближайших к нему по косинусной близости (cosine - косинус угла между векторами, чем он ближе к 1, тем ближе смысл) (<a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">OpenAI Embeddings guide</a>). Этот шаг собирает все предыдущие в один живой запрос:',
    },
    "problem.p3": {
      t: 'Фрагмент "политика возврата средств" приходит первым, хотя слов из запроса в нем нет - потому что сравниваются смыслы, а не строки.',
    },
    "meaning.h2": { t: "Поиск по смыслу, а не по словам" },
    "meaning.p1": {
      html: 'Классический поиск по ключевым словам находит документы, где встречаются те же слова, что и в запросе. Он промахивается, когда об одном и том же люди пишут разными словами - синонимами, перефразировкой, на другом языке. Поиск по смыслу решает эту проблему: он сравнивает векторы, а близость векторов отражает близость смысла, а не совпадение слов (<a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">Reimers &amp; Gurevych, 2019, Sentence-BERT</a>).',
    },
    "qvec.h2": { t: "Запрос -&gt; вектор запроса" },
    "qvec.p1": {
      html: 'Первый шаг живого поиска - превратить текст запроса в вектор той же моделью эмбеддингов, что использовалась для фрагментов (<a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">OpenAI Embeddings guide</a>). Это критично: если запрос превратить в вектор одной моделью, а фрагменты - другой, они окажутся в разных пространствах, и косинусная близость между ними ничего не будет значить. В коде выше это шаг 1 в функции <code>retrieve</code>.',
    },
    "topk.h2": { t: "Top-k ближайших по косинусу" },
    "topk.p1": {
      html: 'Вектор запроса идет в индекс, и база возвращает <strong>top-k</strong> фрагментов, ближайших по косинусной близости - обычно k в диапазоне 3..10. Больший k дает больше материала, но и больше шума; меньший k точнее, но рискует пропустить нужный кусок. На большом архиве поиск ближайших опирается на ANN-индекс (HNSW), чтобы не перебирать все векторы подряд (<a href="https://arxiv.org/abs/1603.09320" target="_blank" rel="noopener">Malkov &amp; Yashunin, 2016, HNSW</a>).',
    },
    "rerank.h2": { t: "Переранжирование и гибридный поиск" },
    "rerank.p1": {
      t: "Top-k из векторного поиска - хорошая первая выборка, но ее можно уточнить:",
    },
    "rerank.li1": {
      html: "<strong>Переранжирование (reranking).</strong> Первый проход (bi-encoder) быстро отбирает кандидатов; второй проход cross-encoder'ом точнее переоценивает каждую пару (запрос, фрагмент) и меняет порядок. Cross-encoder дороже, поэтому его применяют только к уже отобранным кандидатам (<a href=\"https://arxiv.org/abs/1908.10084\" target=\"_blank\" rel=\"noopener\">Reimers &amp; Gurevych, 2019, Sentence-BERT</a>, раздел про bi- против cross-encoder).",
    },
    "rerank.li2": {
      html: '<strong>Гибридный поиск.</strong> Смысловой поиск по векторам комбинируют с классическим поиском по ключевым словам: векторы ловят смысл, а лексический поиск - точные термины, артикулы, имена, где важно совпадение самого слова (<a href="https://docs.pinecone.io/guides/search/hybrid-search" target="_blank" rel="noopener">Pinecone, hybrid search</a>).',
    },
    "rerank.p2": {
      t: "Это уточнения, а не замена: базовый смысловой top-k уже работает, а переранжирование и гибрид улучшают его там, где нужна дополнительная точность.",
    },
    "sees.h2": { t: "Что видит модель" },
    "sees.p1": {
      html: 'После поиска модель получает не весь архив, а только top-k найденных кусков. Это и быстрее, и дешевле, но перекладывает ответственность на поиск: если нужный фрагмент не попал в top-k, модель просто не увидит ответа. Поэтому порядок и полнота top-k важны - исследования показывают, что модели хуже используют информацию, закопанную в середине длинного контекста, поэтому самое релевантное лучше ставить ближе к краям (<a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023, Lost in the Middle</a>). Как именно упаковать эти куски в промпт - тема следующих глав.',
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'OpenAI. Embeddings guide (вектор запроса, cosine similarity). <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>',
    },
    "sources.li2": {
      html: 'Reimers &amp; Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks (bi- против cross-encoder). <a href="https://arxiv.org/abs/1908.10084" target="_blank" rel="noopener">arxiv.org/abs/1908.10084</a>',
    },
    "sources.li3": {
      html: 'Malkov &amp; Yashunin, 2016. Efficient and robust ANN search using Hierarchical Navigable Small World graphs. <a href="https://arxiv.org/abs/1603.09320" target="_blank" rel="noopener">arxiv.org/abs/1603.09320</a>',
    },
    "sources.li4": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "sources.li5": {
      html: 'Pinecone. Hybrid search guide. <a href="https://docs.pinecone.io/guides/search/hybrid-search" target="_blank" rel="noopener">docs.pinecone.io/guides/search/hybrid-search</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: 'Откройте интерактив vector-space-map: найдите точку-запрос и пройдите по нарисованным ребрам к top-k. Сделайте drill (semantic zoom) в далекую точку и прочитайте панель "почему не в top-k".',
    },
    "try.li2": {
      html: "Возьмите функцию <code>retrieve</code> выше и поменяйте <code>k</code> с 3 на 1 и на 10: посмотрите, как меняется набор и порядок возвращаемых фрагментов.",
    },
    "try.li3": {
      t: 'Задайте запрос синонимами, без слов из нужного фрагмента (например "возмещение средств" вместо "возврат"): проверьте, что смысловой поиск все равно находит правильный фрагмент - это и есть промах по ключевым словам, который он лечит.',
    },
    "next.h2": { t: "Что дальше" },
    "next.next1": {
      html: "Top-k найден - дальше его нужно аккуратно упаковать в один промпт к модели. Следующая остановка: <strong>assemble-context</strong> (сборка контекста: шаблон, бюджет токенов, порядок кусков).",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  "vector-store": {
    __title: "Векторное хранилище: храним векторы и ищем ближайших - RAG С НУЛЯ",
    __description:
      "Векторная база: хранит миллионы векторов и быстро находит ближайших соседей (ANN, HNSW). top-k, фильтры по метаданным, когда база не нужна. Интерактивная карта индекса - BrewPage Cookbook.",
    __ogTitle: "Векторное хранилище: храним векторы и ищем ближайших",
    __ogDesc: "Векторная база: миллионы векторов и быстрый поиск ближайших по смыслу.",

    "problem.h2": { t: "Проблема" },
    "problem.p1": {
      t: "У вас есть векторы - по одному на каждый фрагмент из прошлой главы. Когда приходит запрос, нужно найти несколько фрагментов, ближайших по смыслу к вектору запроса. Можно сравнить запрос со всеми векторами подряд - и при тысяче фрагментов это работает. Но при миллионе фрагментов перебор каждого на каждый запрос становится слишком медленным.",
    },
    "problem.p2": {
      t: "Решение - векторная база (vector store): специальное хранилище, которое держит векторы и умеет быстро находить ближайших соседей, не сравнивая запрос со всем архивом. Вот как выглядит шаг store плюс поиск на примере клиента векторной базы:",
    },
    "problem.p3": {
      t: "База сама хранит векторы, сама ищет ближайших и возвращает top-k вместе с их косинусной близостью - вам не нужно писать перебор руками.",
    },
    "why.h2": { t: "Зачем отдельная база" },
    "why.p1": {
      html: 'Векторная база решает две задачи сразу: <strong>хранит</strong> миллионы векторов и <strong>ищет</strong> среди них ближайшие по смыслу. Обычная база данных ищет по точному равенству или по ключевым словам; векторная - по геометрической близости в <code>dim</code>-мерном пространстве, то есть по смыслу (<a href="https://docs.pinecone.io/guides/get-started/overview" target="_blank" rel="noopener">Pinecone, vector database basics</a>).',
    },
    "why.p2": {
      t: "Это и есть то, чего не хватало на шаге поиска: быстрый смысловой поиск по всему архиву без побуквенного сравнения.",
    },
    "ann.h2": { t: "Приближенный поиск ближайших соседей (ANN)" },
    "ann.p1": {
      html: "Точный поиск ближайших соседей (kNN) сравнивает запрос со всеми векторами - это гарантирует правильный ответ, но растет линейно с размером архива. При миллионах фрагментов используют <strong>приближенный</strong> поиск (ANN, approximate nearest neighbour): он почти всегда находит тех же соседей, но во много раз быстрее, жертвуя небольшой долей точности ради скорости.",
    },
    "ann.p2": {
      html: 'Распространенный алгоритм ANN - <strong>HNSW</strong> (Hierarchical Navigable Small World): многослойный граф, по которому поиск "прыгает" от дальних узлов к ближайшим за логарифмическое число шагов вместо перебора всего множества (<a href="https://arxiv.org/abs/1603.09320" target="_blank" rel="noopener">Malkov &amp; Yashunin, 2016, HNSW</a>). Другие системы строят индексы поверх библиотек вроде <a href="https://arxiv.org/abs/1702.08734" target="_blank" rel="noopener">FAISS</a>, которая специально сделана для быстрого поиска по миллионам векторов.',
    },
    "topk.h2": { t: "Top-k и фильтры по метаданным" },
    "topk.p1": {
      html: "При поиске вы просите не один самый близкий вектор, а <strong>top-k</strong> - несколько ближайших (часто k=3..10). Это дает модели немного запасных кусков на случай, если самый ближайший не полностью покрывает вопрос.",
    },
    "topk.p2": {
      html: 'Вместе с вектором в базе хранятся <strong>метаданные</strong> (metadata) - источник, раздел, дата, права доступа. Фильтры по метаданным сужают поиск до нужного подмножества перед тем, как искать ближайших: например, только документы этого отдела или только то, что свежее определенной даты (<a href="https://docs.pinecone.io/guides/index-data/indexing-overview#metadata" target="_blank" rel="noopener">Pinecone, metadata filtering</a>). В коде выше это <code>filter={"section": "vozvrat"}</code>.',
    },
    "scale.h2": { t: "Масштаб: миллионы фрагментов без перебора" },
    "scale.p1": {
      html: 'Именно ANN-индекс делает смысловой поиск практичным на большом архиве. Вместо сравнения запроса с каждым из миллионов векторов граф HNSW приводит к ответу за логарифмическое число шагов (<a href="https://arxiv.org/abs/1603.09320" target="_blank" rel="noopener">Malkov &amp; Yashunin, 2016, HNSW</a>). Поэтому из 100000+ фрагментов top-5 ближайших достается за миллисекунды, а не за полный проход по базе.',
    },
    "when.h2": { t: "Когда векторная база не нужна" },
    "when.p1": { t: "Векторная база - не всегда правильный выбор:" },
    "when.li1": {
      html: "<strong>Маленький корпус.</strong> При нескольких сотнях или тысяче фрагментов точный перебор (kNN) в памяти прост, достаточно быстр и не требует отдельной инфраструктуры.",
    },
    "when.li2": {
      html: "<strong>Точное совпадение важнее смысла.</strong> Если вам нужен поиск по точным кодам, артикулам или ID - обычная база или полнотекстовый индекс точнее и дешевле.",
    },
    "when.li3": {
      html: '<strong>Уже есть подходящая база.</strong> Некоторые обычные СУБД поддерживают векторный поиск как расширение (например pgvector для PostgreSQL, <a href="https://github.com/pgvector/pgvector" target="_blank" rel="noopener">pgvector</a>) - тогда отдельная специальная база может быть избыточна.',
    },
    "when.p2": {
      t: "Правило: берите векторную базу, когда корпус большой И поиск идет именно по смыслу. Иначе она добавляет сложность без выгоды.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Malkov &amp; Yashunin, 2016. Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs. <a href="https://arxiv.org/abs/1603.09320" target="_blank" rel="noopener">arxiv.org/abs/1603.09320</a>',
    },
    "sources.li2": {
      html: 'Johnson, Douze &amp; Jegou, 2017. Billion-scale similarity search with GPUs (FAISS). <a href="https://arxiv.org/abs/1702.08734" target="_blank" rel="noopener">arxiv.org/abs/1702.08734</a>',
    },
    "sources.li3": {
      html: 'Pinecone. Database overview + metadata filtering. <a href="https://docs.pinecone.io/guides/get-started/overview" target="_blank" rel="noopener">docs.pinecone.io/guides/get-started/overview</a>',
    },
    "sources.li4": {
      html: 'pgvector. Open-source vector similarity search for PostgreSQL. <a href="https://github.com/pgvector/pgvector" target="_blank" rel="noopener">github.com/pgvector/pgvector</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      html: "Откройте интерактив ann-topk-drill: найдите узел-запрос и пройдите по нарисованному query path к его top-k соседям. Сделайте drill (semantic zoom) в одного из выбранных соседей и посмотрите его <code>cosine</code> и <code>metadata</code>.",
    },
    "try.li2": {
      html: 'Сравните, что вернется с фильтром по метаданным и без него: в коде выше уберите <code>filter={"section": "vozvrat"}</code> и посмотрите, как меняется набор top-k.',
    },
    "try.li3": {
      t: 'Прикиньте, нужна ли векторная база вашему случаю: сколько у вас фрагментов и ищете вы по смыслу или по точному совпадению - сверьтесь с разделом "Когда векторная база не нужна".',
    },
    "next.h2": { t: "Что дальше" },
    "next.next1": {
      html: "Векторы в индексе, ближайшие находятся быстро - дальше нужно превратить запрос пользователя в вектор и собрать top-k на живом запросе. Следующая остановка: <strong>search</strong> (поиск по смыслу во время запроса).",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  evaluation: {
    __title: "Оценка - precision@k и recall@k - RAG С НУЛЯ",
    __description:
      "Оценка RAG: измеряем точность поиска (precision@k, recall@k) и качество ответа на фиксированном золотом наборе. Подвигайте слайдер k и сравните before/after. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Оценка - precision@k и recall@k",
    __ogDesc:
      "Измеряем точность поиска и качество ответа на фиксированном золотом наборе.",

    "problem.h2": { t: "Проблема, с которой вы пришли" },
    "problem.p1": {
      t: 'Вы поменяли размер куска, добавили реранкинг и "чувствуете", что стало лучше. Но на следующей неделе другой вопрос стал отвечаться хуже - а вы этого не заметили, потому что проверяли на паре вопросов вручную. Без измерения вы не можете отличить улучшение от регрессии: каждая правка - это ставка вслепую.',
    },
    "problem.p2": {
      html: 'Это стадия оценки (evaluation): превратить "кажется лучше" в число. Измеряем две вещи отдельно - <strong>нашелся ли нужный кусок</strong> (точность поиска) и <strong>хорош ли ответ</strong> (качество генерации) - и прогоняем их на фиксированном наборе вопросов до и после каждой правки. Ниже - рабочий каркас оценки (eval-harness) над золотым набором.',
    },
    "harness.h2": { t: "Решение: каркас оценки над золотым набором" },
    "harness.p1": {
      t: "Вот рабочий каркас на Python. Золотой набор - это список вопросов, для каждого из которых заранее известны id релевантных кусков. Каркас прогоняет retrieve и считает precision@k и recall@k.",
    },
    "harness.p2": {
      html: "Главное правило: набор <code>golden</code> фиксирован, и обе версии (<code>v1</code>, <code>v2</code>) прогоняются на нем одном. Только так сравнение честное.",
    },
    "retrieval.h2": { t: "Точность поиска" },
    "retrieval.p1": {
      html: 'Retrieve - это задача информационного поиска (information retrieval), и метрики у нее стандартные. <strong>Precision@k</strong> = доля действительно релевантных среди первых k выданных; <strong>recall@k</strong> = доля найденных из всех существующих релевантных. Оба определены в классическом IR (<a href="https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html" target="_blank" rel="noopener">Manning, Raghavan, Schutze, Introduction to Information Retrieval, гл. 8</a>).',
    },
    "retrieval.p2": {
      t: "Различие важно на практике. Высокий precision@5, но низкий recall@5 значит: что выдали - то по делу, но часть нужных кусков не дотянулась до top-5 (увеличьте k или улучшите эмбеддинг). Высокий recall, но низкий precision: нужное есть, но тонет в мусоре, который съедает бюджет токенов на стадии сборки контекста. Именно поэтому метрики считают парой, а не одной.",
    },
    "quality.h2": { t: "Качество ответа" },
    "quality.p1": {
      t: "Точный retrieve еще не гарантирует хороший ответ: модель может правильно найти куски, но ответить неполно, не по делу или добавив выдумку. Качество ответа меряет другая группа метрик.",
    },
    "quality.p2": {
      html: 'Для RAG их формализует фреймворк <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener">RAGAS (Es et al., 2023)</a>: он предлагает <strong>faithfulness</strong> (насколько ответ заземлен на выданном контексте - мера против галлюцинаций из главы про генерацию), <strong>answer relevance</strong> (отвечает ли ответ именно на вопрос) и <strong>context relevance/precision</strong> (насколько выданный контекст относится к вопросу). RAGAS оценивает эти аспекты автоматически, без ручной разметки каждого ответа.',
    },
    "golden.h2": { t: "Золотой набор вопросов" },
    "golden.p1": {
      html: "Золотой набор - это фундамент всей оценки: список реальных вопросов с размеченными ответами/релевантными кусками. Правила: берите вопросы из реального трафика (а не придуманные), покрывайте разные темы и форматы и не меняйте набор между замерами - иначе <code>before</code> и <code>after</code> несравнимы. Размер - от нескольких десятков; чем больше, тем меньше шума в среднем.",
    },
    "feedback.h2": { t: "Обратная связь -&gt; метрики" },
    "feedback.p1": {
      t: 'Оценки пользователей (палец вверх/вниз, "не помогло") - это сырой сигнал. Превратите его в метрику: помеченные как плохие ответы разбирайте и добавляйте их вопросы в золотой набор с правильной разметкой. Так набор растет именно на тех случаях, где система ошибается, и следующая правка проверяется уже на них.',
    },
    "failures.h2": { t: "Типичные отказы и их следы" },
    "failures.p1": {
      t: "Когда метрика просела, причину видно по тому, какая именно упала:",
    },
    "failures.li1": {
      html: "<strong>Низкий recall@k</strong> - нужный кусок вообще не вернулся. След: проблема в retrieve (эмбеддинг, чанкинг, маленький k). См. главы про эмбеддинг/чанкинг.",
    },
    "failures.li2": {
      html: "<strong>Высокий recall, низкая faithfulness</strong> - кусок был, но ответ не заземлен (выдумка). След: слабая инструкция генерации. См. главу про генерацию.",
    },
    "failures.li3": {
      html: '<strong>Нужный кусок в контексте, но проигнорирован</strong> - часто он оказался в середине окна (lost-in-the-middle, <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">Liu et al., 2023</a>). След: порядок на стадии сборки контекста.',
    },
    "failures.p2": {
      t: "Выше - интерактивный калькулятор precision@k / recall@k над золотым набором. Слайдер k пересчитывает обе метрики, тумблер before/after сравнивает две дорожки на одном фиксированном наборе, а попадания в top-k подсвечиваются зеленым по мере того, как вы их находите. Без JS страница показывает разобранную золотую таблицу с теми же расчетами.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Manning, Raghavan, Schutze, 2008. Introduction to Information Retrieval, гл. 8 (precision/recall@k). <a href="https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html" target="_blank" rel="noopener">nlp.stanford.edu/IR-book</a>',
    },
    "sources.li2": {
      html: 'Es et al., 2023. RAGAS: Automated Evaluation of Retrieval Augmented Generation. <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener">arxiv.org/abs/2309.15217</a>',
    },
    "sources.li3": {
      html: 'Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener">arxiv.org/abs/2307.03172</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: "В калькуляторе подвигайте слайдер k от 1 до 10 на одном вопросе и проследите, как recall@k растет (попадает больше нужных кусков), а precision@k чаще падает - это и есть компромисс.",
    },
    "try.li2": {
      t: "Переключите тумблер before/after и сравните две дорожки на одном и том же золотом наборе: только фиксированный набор делает сравнение честным.",
    },
    "try.li3": {
      t: "Найдите вопрос с высоким recall, но низким precision, и подумайте, как лишние куски ударят по бюджету токенов на стадии сборки контекста.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next1": {
      html: "Система измерена и улучшается. Последняя остановка - глава <strong>production</strong>: как связать все звенья в живой сервис и держать его в форме - скорость, стоимость, мониторинг, доступ.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  generation: {
    __title: "Генерация - заземленный ответ с цитатами - RAG С НУЛЯ",
    __description:
      "Генерация в RAG: жесткая инструкция отвечать только по контексту, цитаты [source] для проверки заземления, борьба с галлюцинациями и честный отказ. Откройте узел ответа и проследите связь утверждение-источник. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Генерация - заземленный ответ с цитатами",
    __ogDesc:
      "Модель отвечает только по контексту, цитирует источники и честно признает пробелы.",

    "problem.h2": { t: "Проблема, с которой вы пришли" },
    "problem.p1": {
      t: 'Вы собрали идеальный контекст (глава про сборку контекста), отправили в модель - а она все равно выдумала деталь, которой в документах нет. Или ответила правильно, но без ссылки на источник, и пользователь не может это проверить. Или на вопрос, ответа на который в данных просто нет, уверенно выдала выдумку вместо честного "не знаю".',
    },
    "problem.p2": {
      t: "Это стадия генерации (generation): модель читает собранный контекст и пишет ответ. Сам факт, что контекст хороший, не гарантирует, что ответ будет на нем основан. Заземление (grounding) задается инструкциями и проверяется цитатами. Ниже - рабочий путь к ответу, который отвечает только по контексту, ссылается на фрагменты и честно признает пробелы.",
    },
    "problem.p3": {
      html: 'Полный вид запроса и ответа поле за полем - в главе <a href="payload-anatomy.html">Анатомия запроса</a>; здесь мы работаем с выходом генерации.',
    },
    "solution.h2": { t: "Решение: вызов генерации с заземлением" },
    "solution.p1": {
      t: "Вот рабочий вызов на Python через Anthropic SDK. Промпт собран на предыдущей стадии; здесь важны три вещи: жесткая системная инструкция, подписанные источники в контексте и разбор цитат из ответа.",
    },
    "solution.p2": {
      html: 'Модель и форма вызова - по <a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">Anthropic Messages API</a>; имя модели при запуске сверьте с <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">Models overview</a>. Подойдет любой вендор с чат-API - важны не имена, а три приема ниже.',
    },
    "instructions.h2": { t: "Инструкции: отвечай только по контексту" },
    "instructions.p1": {
      html: 'Генерация в RAG управляется системной инструкцией. Без явного "отвечай только по контексту" модель свободно добавляет то, что "знает" из обучения - и именно тут рождаются правдоподобные, но ложные факты. Сам смысл RAG по <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">Lewis et al., 2020</a> в том, чтобы ответ опирался на извлеченные документы, а не только на параметрическую память модели.',
    },
    "instructions.p2": {
      html: 'Инструкция в <code>SYSTEM</code> выше делает три вещи: ограничивает источник (только контекст), требует цитаты (<code>[source]</code>) и задает запасной вариант для пробела ("Этого нет в документах"). Это каркас заземления.',
    },
    "cite.h2": { t: "Цитирование источников в ответе" },
    "cite.p1": {
      html: "Цитата - это не украшение, а механизм проверки. Когда каждое утверждение помечено <code>[source]</code>, вы можете сопоставить его с конкретным куском и убедиться, что ответ действительно опирается на данные, а не на выдумку. Именно поэтому на стадии сборки контекста каждый кусок подписывался источником: подпись в контексте -&gt; ссылка в ответе -&gt; проверка заземления.",
    },
    "cite.p2": {
      html: "Функция <code>generate</code> выше вытаскивает все <code>[source]</code> из ответа. Если модель упомянула источник, которого не было в переданном контексте, это сигнал галлюцинации цитаты - такой ответ надо отклонять или перезапрашивать.",
    },
    "ground.h2": { t: "Борьба с выдумками (grounding/hallucination)" },
    "ground.p1": {
      html: 'Галлюцинация - это уверенное, бегло сформулированное утверждение, не подкрепленное источником. Это известная и устойчивая проблема генеративных моделей: обзор <a href="https://arxiv.org/abs/2202.03629" target="_blank" rel="noopener">Ji et al., 2023, "Survey of Hallucination in Natural Language Generation"</a> систематизирует виды галлюцинаций и отмечает, что модели склонны порождать текст, не заземленный на входных данных.',
    },
    "ground.p2": {
      html: 'RAG снижает галлюцинации, подкладывая проверяемый контекст, но сам по себе их не убирает. Три меры в связке: (1) жесткая инструкция "только по контексту"; (2) обязательные цитаты <code>[source]</code> с проверкой, что источник действительно был в контексте; (3) явный запасной вариант. Если в контексте нет ответа, правильный результат - честное "Этого нет в документах", а не правдоподобная выдумка. Этот отказ - фича, а не баг.',
    },
    "stream.h2": { t: "Тон, формат и стриминг" },
    "stream.p1": {
      t: 'Тон и формат задаются в той же инструкции: "отвечай кратко списком", "верни JSON с полями answer и sources". Формат - часть контракта с вашим UI.',
    },
    "stream.p2": {
      html: 'Стриминг улучшает восприятие: вместо ожидания целого ответа токены прибывают по мере генерации, и пользователь видит текст сразу. Anthropic Messages API отдает поток через server-sent events (<a href="https://docs.anthropic.com/en/api/messages-streaming" target="_blank" rel="noopener">Anthropic streaming</a>); функция <code>generate_stream</code> выше именно это и делает. Важно для заземления: зеленый "готовый" ответ в UI не показываем как финальный, пока генерация не завершилась и цитаты не проверили - частичный текст может еще дописать источник. Выше - интерактивный разбор: откройте узел ответа, наведитесь на утверждение и проследите связь до его куска-источника. Без JS страница показывает ответ с цитатами, список источников и случай честного отказа.',
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li2": {
      html: 'Ji et al., 2023. Survey of Hallucination in Natural Language Generation. <a href="https://arxiv.org/abs/2202.03629" target="_blank" rel="noopener">arxiv.org/abs/2202.03629</a>',
    },
    "sources.li3": {
      html: 'Anthropic. Messages API. <a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>',
    },
    "sources.li4": {
      html: 'Anthropic. Streaming Messages. <a href="https://docs.anthropic.com/en/api/messages-streaming" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages-streaming</a>',
    },
    "sources.li5": {
      html: 'Anthropic. Models overview. <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank" rel="noopener">docs.anthropic.com/en/docs/about-claude/models</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      t: "В grounded-answer-reveal наведитесь на любое утверждение ответа и проследите линию связи до его куска-источника: зеленый акцент загорается только когда цитата сопоставлена с реальным куском.",
    },
    "try.li2": {
      t: 'Включите случай "нет контекста" и посмотрите, что правильный ответ - это запасной вариант "Этого нет в документах", а не правдоподобная выдумка.',
    },
    "try.li3": {
      html: "Найдите в ответе <code>[source]</code>, которого нет среди кусков контекста (галлюцинация цитаты), и обратите внимание, почему такой ответ надо отклонять.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next1": {
      html: "Ответ есть - но хорош ли он? Следующая остановка - глава <strong><a href=\"evaluation.html\">evaluation</a></strong>: как системно измерить точность поиска и качество ответа на золотом наборе вопросов.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  "payload-anatomy": {
    __title: "Анатомия payload - один запрос RAG - RAG С НУЛЯ",
    __description:
      "Анатомия payload: реальный обмен с Anthropic Messages API из четырех ходов, размеченный по 17 функциональным блокам - функция и роль в конвейере RAG. Нажмите блок, чтобы заглянуть внутрь. Интерактивная глава BrewPage Cookbook.",
    __ogTitle: "Анатомия payload - один запрос RAG",
    __ogDesc:
      "Реальный обмен с Anthropic Messages API, размеченный по 17 блокам - функция и роль в RAG.",

    "problem.h2": { t: "Проблема, с которой вы пришли" },
    "problem.p1": {
      t: "Вы прошли весь маршрут - чанки, эмбеддинги, поиск, сборка контекста, генерация. Каждая глава показывала свою стадию отдельно. Но в живой системе все они сходятся в одну вещь: HTTP-запрос к LLM и ответ от нее. Это обычный JSON. И пока вы не увидите этот JSON целиком, с каждым полем на своем месте, RAG остается набором отдельных идей, а не одним механизмом.",
    },
    "problem.p2": {
      html: 'Здесь мы разбираем один реальный обмен с моделью: запрос, который вы шлете, и ответ, который приходит. Поля настоящие - это формат Anthropic Messages API (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>). Каждый функциональный блок размечен дважды: что он делает технически и какую роль играет в конвейере RAG. Это та самая сборка retrieve-augment-generate из статьи Lewis et al., 2020 (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>), но уже не на схеме, а в байтах, которые уходят по проводу.',
    },
    "pipeline.h2": { t: "Один payload сквозь весь конвейер" },
    "pipeline.p1": {
      html: 'RAG-запрос к Anthropic Messages API устроен так: вы кладете инструкции-заземление в <code>system</code>, собранный контекст и вопрос - в <code>messages</code>, а сам поиск выражаете как вызов инструмента (<code>tools</code> плюс <code>tool_choice</code>) (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>). Модель отвечает не одним текстом, а массивом блоков <code>content</code>: рассуждение (<code>thinking</code>), запрос на поиск (<code>tool_use</code>) и финальный текст. Поле <code>stop_reason</code> говорит, почему модель остановилась, а <code>usage</code> - сколько токенов это стоило (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>).',
    },
    "pipeline.p2": {
      html: "Выше - реальный обмен из четырех ходов: вы шлете вопрос с описанием инструмента поиска, модель просит вызвать поиск (<code>tool_use</code>), вы возвращаете найденные чанки (<code>tool_result</code>), модель пишет заземленный ответ.",
    },
    "pipeline.h3a": { t: "Ход 1. Запрос: вопрос плюс описание инструмента поиска" },
    "pipeline.p3": {
      html: '<code>system</code> - это слой заземления (grounding): жесткая инструкция отвечать только по найденному и честно признавать пробел (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>). В терминах RAG это и есть инструкция стадии generation из главы generation.html. <code>tools</code> описывает поиск как функцию, которую модель может вызвать - это объявление шага retrieve из статьи Lewis et al., 2020 (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>), выраженное в схеме tool use (<a href="https://docs.anthropic.com/en/api/tool-use" target="_blank" rel="noopener">docs.anthropic.com/en/api/tool-use</a>). <code>tool_choice: auto</code> отдает модели решение, нужен ли поиск (<a href="https://docs.anthropic.com/en/api/tool-use" target="_blank" rel="noopener">docs.anthropic.com/en/api/tool-use</a>). <code>thinking</code> включает расширенное рассуждение с бюджетом токенов (<a href="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" target="_blank" rel="noopener">docs.anthropic.com/en/docs/build-with-claude/extended-thinking</a>).',
    },
    "pipeline.h3b": { t: "Ход 2. Ответ: модель рассуждает и просит вызвать поиск" },
    "pipeline.p4": {
      html: 'Блок <code>thinking</code> - это рассуждение модели перед действием; в RAG это видимый план стадии retrieve, а не финальный ответ (<a href="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" target="_blank" rel="noopener">docs.anthropic.com/en/docs/build-with-claude/extended-thinking</a>). Блок <code>tool_use</code> - это и есть запрос на поиск: модель просит вызвать <code>search_docs</code> с конкретным <code>query</code> и <code>top_k</code> (<a href="https://docs.anthropic.com/en/api/tool-use" target="_blank" rel="noopener">docs.anthropic.com/en/api/tool-use</a>). <code>stop_reason: tool_use</code> - управляющий сигнал: модель остановилась не потому, что закончила, а потому, что ждет результат инструмента; ваш код обязан выполнить поиск и вернуть результат (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>). <code>usage</code> - сигнал бюджета и стоимости: <code>input_tokens</code> и <code>output_tokens</code> за этот ход (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>); в RAG раздутый <code>input_tokens</code> - первый признак, что собранный контекст слишком велик (см. assemble-context.html).',
    },
    "pipeline.h3c": { t: "Ход 3. Запрос с tool_result: возвращаем найденные чанки" },
    "pipeline.p5": {
      html: 'Ваш код запускает поиск (стадия retrieve: запрос -&gt; вектор -&gt; top-k по косинусу, как в search.html), затем продолжает тот же разговор, добавляя ответ ассистента и блок <code>tool_result</code> с найденными чанками. Форма вектора и метрика косинуса - из OpenAI Embeddings guide (<a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>).',
    },
    "pipeline.p6": {
      html: '<code>tool_result</code> - это возврат стадии retrieve в разговор: связан с запросом по <code>tool_use_id</code>, несет найденные чанки как текст (<a href="https://docs.anthropic.com/en/api/tool-use" target="_blank" rel="noopener">docs.anthropic.com/en/api/tool-use</a>). Внутри каждого чанка - метаданные стадий конвейера: <code>source</code>/<code>section</code>/<code>date</code> приходят из чанкинга (chunking.html), а <code>cosine</code>/<code>rank</code> - из поиска (search.html, метрика косинуса по OpenAI Embeddings guide, <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>). Этот блок и есть Augmented-шаг из Lewis et al., 2020: найденное подкладывается в контекст модели перед генерацией (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>).',
    },
    "pipeline.h3d": { t: "Ход 4. Заземленный ответ модели" },
    "pipeline.p7": {
      html: 'Здесь <code>content</code> - один блок <code>text</code>: финальный заземленный ответ со ссылкой на <code>source</code>, как требовала инструкция в <code>system</code>. Это стадия Generation из Lewis et al., 2020 (<a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>); связь с конкретными полями описана в generation.html. <code>stop_reason: end_turn</code> - управляющий сигнал, что модель закончила сама, а не из-за лимита (<a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>). <code>usage.input_tokens</code> вырос с 412 до 638 - это цена подложенного контекста: тот самый бюджетный сигнал, по которому в assemble-context.html решают, что обрезать.',
    },
    "map.h2": { t: "Карта блоков: функция и роль в RAG" },
    "map.p1": {
      t: "Greppable-таблица: каждый функциональный блок payload, его поля, техническая функция и доменная роль в конвейере RAG. Это и есть карта блоков для drill-взаимодействия выше; без JS она же служит статическим списком под payload.",
    },
    "map.li1": {
      html: "<strong>model</strong> (<code>model</code>) - какую модель вызвать; выбор генератора стадии Generation, влияет на лимит длины и стоимость.",
    },
    "map.li2": {
      html: "<strong>budget</strong> (<code>max_tokens</code>) - потолок длины ответа; контроль стоимости и задержки стадии Generation.",
    },
    "map.li3": {
      html: "<strong>thinking-config</strong> (<code>thinking.type</code>, <code>thinking.budget_tokens</code>) - включить расширенное рассуждение и его бюджет; бюджет на рассуждение стадий retrieve и generation.",
    },
    "map.li4": {
      html: "<strong>system</strong> (<code>system</code>) - системная инструкция модели; grounding: отвечать только по контексту плюс цитировать источник (generation.html).",
    },
    "map.li5": {
      html: "<strong>tools</strong> (<code>tools[].name</code>, <code>description</code>, <code>input_schema</code>) - описание доступных инструментов; объявление шага Retrieve как вызываемой функции (Lewis et al., 2020).",
    },
    "map.li6": {
      html: "<strong>tool-choice</strong> (<code>tool_choice.type</code>) - разрешить или заставить вызов; управление тем, запускать ли retrieve.",
    },
    "map.li7": {
      html: "<strong>messages-user</strong> (<code>messages[].role=user</code>, <code>content</code>) - реплика пользователя; вопрос - вход всего конвейера.",
    },
    "map.li8": {
      html: "<strong>messages-assistant</strong> (<code>messages[].role=assistant</code>, <code>content[]</code>) - реплика модели в истории; сохраненные рассуждение и запрос поиска для продолжения диалога.",
    },
    "map.li9": {
      html: "<strong>response-id</strong> (<code>id</code>, <code>type</code>, <code>role</code>, <code>model</code>) - идентификатор и тип ответа; привязка хода диалога, трассировка запроса.",
    },
    "map.li10": {
      html: "<strong>thinking-block</strong> (<code>content[].type=thinking</code>, <code>thinking</code>, <code>signature</code>) - видимое рассуждение модели; reasoning: план стадии retrieve, не финальный ответ.",
    },
    "map.li11": {
      html: "<strong>tool-use</strong> (<code>content[].type=tool_use</code>, <code>id</code>, <code>name</code>, <code>input</code>) - запрос модели вызвать инструмент; retrieve-вызов: query и top_k уходят в поиск (search.html).",
    },
    "map.li12": {
      html: "<strong>tool-result</strong> (<code>tool_result.tool_use_id</code>, <code>content[]</code>) - возврат результата инструмента; Augmented: найденные top-k чанки подкладываются в контекст (assemble-context.html).",
    },
    "map.li13": {
      html: "<strong>chunk-meta</strong> (<code>source</code>, <code>section</code>, <code>date</code>) - метаданные чанка; происхождение: задаются на стадии chunking (chunking.html).",
    },
    "map.li14": {
      html: "<strong>retrieval-score</strong> (<code>cosine</code>, <code>rank</code>) - оценка близости и позиция в top-k; качество retrieve: cosine 0..1, ранжирование (search.html).",
    },
    "map.li15": {
      html: "<strong>text-answer</strong> (<code>content[].type=text</code>, <code>text</code>) - финальный текст ответа; Generation: заземленный ответ со ссылкой на source.",
    },
    "map.li16": {
      html: "<strong>stop-reason</strong> (<code>stop_reason</code>, <code>stop_sequence</code>) - почему модель остановилась; управляющий сигнал: tool_use -&gt; выполнить поиск; end_turn -&gt; готово.",
    },
    "map.li17": {
      html: "<strong>usage</strong> (<code>usage.input_tokens</code>, <code>usage.output_tokens</code>) - расход токенов за ход; сигнал стоимости и бюджета: рост input_tokens = раздутый контекст (assemble-context.html).",
    },
    "drill.h2": { t: "Взаимодействие: drill по блокам payload" },
    "drill.p1": {
      html: "Отрисованный payload - не картинка, а карта. На верхнем уровне (zoom 0) вы видите весь обмен из четырех ходов: запрос, tool_use, tool_result, ответ. Каждый функциональный блок из таблицы выше подсвечивается при наведении. Один клик или Enter по блоку - семантический зум внутрь него (zoom 1): рядом разворачивается его карточка-аннотация с двумя строками - что делает технически и какую роль играет в RAG, плюс ссылка на главу-владельца (например, <code>tool_use</code> -&gt; search.html, <code>usage</code> -&gt; assemble-context.html). Это ровно два уровня зума: весь payload -&gt; один блок крупно. Возврат (Esc или кнопка назад) выводит камеру обратно к полному payload.",
    },
    "drill.p2": {
      t: "Без JS блок-карта работает как статичный размеченный JSON выше плюс список всех 17 блоков - читатель ничего не теряет.",
    },
    "sources.h2": { t: "Источники" },
    "sources.li1": {
      html: 'Anthropic. Messages API reference (model, max_tokens, system, messages, content blocks, stop_reason, stop_sequence, usage). <a href="https://docs.anthropic.com/en/api/messages" target="_blank" rel="noopener">docs.anthropic.com/en/api/messages</a>',
    },
    "sources.li2": {
      html: 'Anthropic. Tool use (tools, tool_choice, tool_use, tool_result, tool_use_id, input_schema). <a href="https://docs.anthropic.com/en/api/tool-use" target="_blank" rel="noopener">docs.anthropic.com/en/api/tool-use</a>',
    },
    "sources.li3": {
      html: 'Anthropic. Extended thinking (thinking blocks, budget_tokens). <a href="https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking" target="_blank" rel="noopener">docs.anthropic.com/en/docs/build-with-claude/extended-thinking</a>',
    },
    "sources.li4": {
      html: 'Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noopener">arxiv.org/abs/2005.11401</a>',
    },
    "sources.li5": {
      html: 'OpenAI. Embeddings guide (vector shape, cosine similarity). <a href="https://platform.openai.com/docs/guides/embeddings" target="_blank" rel="noopener">platform.openai.com/docs/guides/embeddings</a>',
    },
    "try.h2": { t: "Попробуйте сами" },
    "try.li1": {
      html: "Откройте drill по блоку <code>tool_use</code> (zoom 1) и проследите, как <code>input.query</code> и <code>top_k</code> уходят в стадию retrieve; сверьте с search.html.",
    },
    "try.li2": {
      html: "Раскройте блок <code>tool_result</code> и найдите внутри чанка поля <code>source</code>/<code>section</code>/<code>date</code> (из чанкинга) и <code>cosine</code>/<code>rank</code> (из поиска) - один блок несет следы сразу двух стадий конвейера.",
    },
    "try.li3": {
      html: "Сравните <code>usage.input_tokens</code> в ходе 2 (412) и в ходе 4 (638): раскройте блок <code>usage</code> и убедитесь, что рост - это цена подложенного контекста, тот самый бюджетный сигнал из assemble-context.html.",
    },
    "next.h2": { t: "Что дальше" },
    "next.next1": {
      html: "Этот payload - не отдельная глава маршрута, а сквозной разрез всего конвейера: на него ссылаются <strong>generation.html</strong> (как поля <code>system</code>/<code>content</code>/<code>stop_reason</code> дают заземленный ответ) и <strong>assemble-context.html</strong> (как <code>usage</code> и <code>tool_result</code> показывают бюджет контекста). Вернитесь к любой из них, чтобы увидеть свою стадию уже в байтах живого запроса.",
    },
    "about.h2": { t: "Об этом рецепте" },
    "about.li1": {
      html: 'Часть <a href="../../README.md">BrewPage Cookbook</a>.',
    },
    "about.li2": {
      html: 'Опубликовано живым на <a href="https://brewpage.app" target="_blank" rel="noopener">brewpage.app</a>.',
    },
    "about.li3": {
      html: 'Источник контракта BrewPage API: <a href="https://github.com/kochetkov-ma/brewpage-openapi" target="_blank" rel="noopener">brewpage-openapi</a>.',
    },
  },

  _schema: {
    purpose:
      "RU prose overlay for the RAG Guide chapter articles, consumed by prose-i18n.js to swap [data-pk] leaves between static EN and RU per active locale.",
    shape:
      "{ [pageSlug]: { [pk]: {t:string}|{html:string}, __title, __description, __ogTitle, __ogDesc }, _schema }",
    leafTypes: {
      t: "applied via element.textContent (no inline tags)",
      html: "applied via element.innerHTML (trusted authored inline tags: <strong>, <code>, <a>, <b>, <br>, <em>)",
    },
    metaKeys: ["__title", "__description", "__ogTitle", "__ogDesc"],
    rules: [
      "Consumers MUST skip every _-prefixed key (this _schema block).",
      "Per page, the pk key set MUST equal the page's stamped data-pk set and the handoff key set.",
      "ASCII punctuation only in every value; Cyrillic letters allowed inside RU string literals.",
      "Inert data file: no <script>, no on*= handlers, no javascript: URLs.",
    ],
    keyCounts: {
      "what-rag": 37,
      "why-rag": 33,
      production: 43,
      chunking: 90,
      embedding: 56,
      "assemble-context": 34,
      search: 33,
      "vector-store": 36,
      evaluation: 36,
      generation: 35,
      "payload-anatomy": 53,
    },
  },
};

export default PROSE_RU;
