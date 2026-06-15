<!--
  RU-first showcase chapter (non-route): payload-anatomy.
  ASCII punctuation only, even inside Russian (straight quotes, hyphens, three-dot ...).
  Native Cyrillic Russian prose, hand-written (not back-transliterated).
  Cite every technical claim inline to a PRIMARY source. Authored markdown; HTML port comes later.
  Owning task: CT-JSON-PAYLOAD. Do NOT touch shared/data/*.js, shared/*, the board, or other chapters.
-->

# Анатомия payload: один запрос RAG под микроскопом

## Проблема, с которой вы пришли

Вы прошли весь маршрут - чанки, эмбеддинги, поиск, сборка контекста, генерация. Каждая глава показывала свою стадию отдельно. Но в живой системе все они сходятся в одну вещь: HTTP-запрос к LLM и ответ от нее. Это обычный JSON. И пока вы не увидите этот JSON целиком, с каждым полем на своем месте, RAG остается набором отдельных идей, а не одним механизмом.

Здесь мы разбираем один реальный обмен с моделью: запрос, который вы шлете, и ответ, который приходит. Поля настоящие - это формат Anthropic Messages API (<https://platform.claude.com/docs/en/api/messages>). Каждый функциональный блок размечен дважды: что он делает технически и какую роль играет в конвейере RAG. Это та самая сборка retrieve-augment-generate из статьи Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>), но уже не на схеме, а в байтах, которые уходят по проводу.

## Один payload сквозь весь конвейер

RAG-запрос к Anthropic Messages API устроен так: вы кладете инструкции-заземление в `system`, собранный контекст и вопрос - в `messages`, а сам поиск выражаете как вызов инструмента (`tools` плюс `tool_choice`) (<https://platform.claude.com/docs/en/api/messages>). Модель отвечает не одним текстом, а массивом блоков `content`: рассуждение (`thinking`), запрос на поиск (`tool_use`) и финальный текст. Поле `stop_reason` говорит, почему модель остановилась, а `usage` - сколько токенов это стоило (<https://platform.claude.com/docs/en/api/messages>).

Ниже - реальный обмен из трех ходов: вы шлете вопрос с описанием инструмента поиска, модель просит вызвать поиск (`tool_use`), вы возвращаете найденные чанки (`tool_result`), модель пишет заземленный ответ.

### Ход 1. Запрос: вопрос плюс описание инструмента поиска

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 2048
  },
  "system": "Ты помощник поддержки. Отвечай ТОЛЬКО по тексту, который вернул инструмент search_docs. Если ответа в найденных кусках нет, честно скажи: этого нет в документах. Указывай источник каждого факта по полю source.",
  "tools": [
    {
      "name": "search_docs",
      "description": "Семантический поиск top-k chunks по векторной базе знаний.",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Поисковый запрос пользователя" },
          "top_k": { "type": "integer", "description": "Сколько ближайших chunks вернуть", "default": 4 }
        },
        "required": ["query"]
      }
    }
  ],
  "tool_choice": { "type": "auto" },
  "messages": [
    {
      "role": "user",
      "content": "Сколько дней отпуска у сотрудника после трех лет работы?"
    }
  ]
}
```

`system` - это слой заземления (grounding): жесткая инструкция отвечать только по найденному и честно признавать пробел (<https://platform.claude.com/docs/en/api/messages>). В терминах RAG это и есть инструкция стадии generation из главы generation.html. `tools` описывает поиск как функцию, которую модель может вызвать - это объявление шага retrieve из статьи Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>), выраженное в схеме tool use (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `tool_choice: auto` отдает модели решение, нужен ли поиск (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `thinking` включает расширенное рассуждение с бюджетом токенов (<https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>).

### Ход 2. Ответ: модель рассуждает и просит вызвать поиск

```json
{
  "id": "msg_01XAbc...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-6",
  "content": [
    {
      "type": "thinking",
      "thinking": "Вопрос про дни отпуска после трех лет стажа. В system сказано отвечать только по найденному, своих данных у меня нет. Надо вызвать search_docs с запросом про отпуск и стаж.",
      "signature": "EqoBCkg...=="
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw",
      "name": "search_docs",
      "input": {
        "query": "дни отпуска стаж три года политика",
        "top_k": 4
      }
    }
  ],
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 412,
    "output_tokens": 76
  }
}
```

Блок `thinking` - это рассуждение модели перед действием; в RAG это видимый план стадии retrieve, а не финальный ответ (<https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>). Блок `tool_use` - это и есть запрос на поиск: модель просит вызвать `search_docs` с конкретным `query` и `top_k` (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). `stop_reason: tool_use` - управляющий сигнал: модель остановилась не потому, что закончила, а потому, что ждет результат инструмента; ваш код обязан выполнить поиск и вернуть результат (<https://platform.claude.com/docs/en/api/messages>). `usage` - сигнал бюджета и стоимости: `input_tokens` и `output_tokens` за этот ход (<https://platform.claude.com/docs/en/api/messages>); в RAG раздутый `input_tokens` - первый признак, что собранный контекст слишком велик (см. assemble-context.html).

### Ход 3. Запрос с tool_result: возвращаем найденные чанки

Ваш код запускает поиск (стадия retrieve: запрос -> вектор -> top-k по косинусу, как в search.html), затем продолжает тот же разговор, добавляя ответ ассистента и блок `tool_result` с найденными чанками. Форма вектора и метрика косинуса - из OpenAI Embeddings guide (<https://developers.openai.com/api/docs/guides/embeddings>).

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1024,
  "system": "Ты помощник поддержки. Отвечай ТОЛЬКО по тексту, который вернул инструмент search_docs. Если ответа в найденных кусках нет, честно скажи: этого нет в документах. Указывай источник каждого факта по полю source.",
  "tools": [
    { "name": "search_docs", "description": "Семантический поиск top-k chunks по векторной базе знаний.", "input_schema": { "type": "object", "properties": { "query": { "type": "string" }, "top_k": { "type": "integer" } }, "required": ["query"] } }
  ],
  "messages": [
    { "role": "user", "content": "Сколько дней отпуска у сотрудника после трех лет работы?" },
    {
      "role": "assistant",
      "content": [
        { "type": "thinking", "thinking": "...", "signature": "EqoBCkg...==" },
        { "type": "tool_use", "id": "toolu_01A09q90qw", "name": "search_docs", "input": { "query": "дни отпуска стаж три года политика", "top_k": 4 } }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01A09q90qw",
          "content": [
            { "type": "text", "text": "[chunk c-118 | source=hr-policy.md | section=Отпуска | date=2026-01-10 | cosine=0.83 | rank=1] После 3 полных лет стажа сотруднику полагается 28 календарных дней оплачиваемого отпуска в год." },
            { "type": "text", "text": "[chunk c-119 | source=hr-policy.md | section=Отпуска | date=2026-01-10 | cosine=0.71 | rank=2] Базовый отпуск при стаже до 3 лет составляет 24 календарных дня." }
          ]
        }
      ]
    }
  ]
}
```

`tool_result` - это возврат стадии retrieve в разговор: связан с запросом по `tool_use_id`, несет найденные чанки как текст (<https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>). Внутри каждого чанка - метаданные стадий конвейера: `source`/`section`/`date` приходят из чанкинга (chunking.html), а `cosine`/`rank` - из поиска (search.html, метрика косинуса по OpenAI Embeddings guide, <https://developers.openai.com/api/docs/guides/embeddings>). Этот блок и есть Augmented-шаг из Lewis et al., 2020: найденное подкладывается в контекст модели перед генерацией (<https://arxiv.org/abs/2005.11401>).

### Ход 4 (финал ответа). Заземленный ответ модели

```json
{
  "id": "msg_01YDef...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-6",
  "content": [
    {
      "type": "text",
      "text": "После трех полных лет стажа сотруднику полагается 28 календарных дней оплачиваемого отпуска в год (источник: hr-policy.md, раздел Отпуска)."
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 638,
    "output_tokens": 41
  }
}
```

Здесь `content` - один блок `text`: финальный заземленный ответ со ссылкой на `source`, как требовала инструкция в `system`. Это стадия Generation из Lewis et al., 2020 (<https://arxiv.org/abs/2005.11401>); связь с конкретными полями описана в generation.html. `stop_reason: end_turn` - управляющий сигнал, что модель закончила сама, а не из-за лимита (<https://platform.claude.com/docs/en/api/messages>). `usage.input_tokens` вырос с 412 до 638 - это цена подложенного контекста: тот самый бюджетный сигнал, по которому в assemble-context.html решают, что обрезать.

## Карта блоков: функция и роль в RAG

Greppable-таблица: каждый функциональный блок payload, его поля, техническая функция и доменная роль в конвейере RAG. Это и есть карта блоков для drill-взаимодействия ниже.

| Блок | Поля | Функция | Роль в RAG |
|-------|----------|----------|-----------------|
| model | `model` | Какую модель вызвать | Выбор генератора стадии Generation; влияет на лимит длины и стоимость |
| budget | `max_tokens` | Потолок длины ответа | Контроль стоимости и задержки стадии Generation |
| thinking-config | `thinking.type`, `thinking.budget_tokens` | Включить расширенное рассуждение и его бюджет | Бюджет на рассуждение стадий retrieve и generation |
| system | `system` | Системная инструкция модели | Grounding: правила отвечать только по контексту плюс цитировать источник (generation.html) |
| tools | `tools[].name`, `description`, `input_schema` | Описание доступных инструментов | Объявление шага Retrieve как вызываемой функции (Lewis et al., 2020) |
| tool-choice | `tool_choice.type` | Разрешить или заставить вызов инструмента | Управление тем, запускать ли retrieve |
| messages-user | `messages[].role=user`, `content` | Реплика пользователя | Вопрос - вход всего конвейера |
| messages-assistant | `messages[].role=assistant`, `content[]` | Реплика модели в истории | Сохраненные рассуждение и запрос поиска для продолжения диалога |
| response-id | `id`, `type`, `role`, `model` | Идентификатор и тип сообщения-ответа | Привязка хода диалога; трассировка запроса |
| thinking-block | `content[].type=thinking`, `thinking`, `signature` | Видимое рассуждение модели | Reasoning: план стадии retrieve, не финальный ответ |
| tool-use | `content[].type=tool_use`, `id`, `name`, `input` | Запрос модели вызвать инструмент | Retrieve-вызов: query и top_k уходят в поиск (search.html) |
| tool-result | `tool_result.tool_use_id`, `content[]` | Возврат результата инструмента в диалог | Augmented: найденные top-k чанки подкладываются в контекст (assemble-context.html) |
| chunk-meta | `source`, `section`, `date` | Метаданные чанка | Происхождение: задаются на стадии chunking (chunking.html) |
| retrieval-score | `cosine`, `rank` | Оценка близости и позиция в top-k | Качество retrieve: cosine 0..1, ранжирование (search.html) |
| text-answer | `content[].type=text`, `text` | Финальный текст ответа | Generation: заземленный ответ со ссылкой на source |
| stop-reason | `stop_reason`, `stop_sequence` | Почему модель остановилась | Управляющий сигнал: `tool_use` -> выполнить поиск; `end_turn` -> готово |
| usage | `usage.input_tokens`, `usage.output_tokens` | Расход токенов за ход | Сигнал стоимости и бюджета: рост input_tokens = раздутый контекст (assemble-context.html) |

## Взаимодействие: drill по блокам payload

Отрисованный payload - не картинка, а карта. На верхнем уровне (zoom 0) вы видите весь обмен из четырех ходов: запрос, tool_use, tool_result, ответ. Каждый функциональный блок из таблицы выше подсвечивается при наведении. Один клик или Enter по блоку - семантический зум внутрь него (zoom 1): блок занимает сцену, рядом разворачивается его карточка-аннотация с двумя строками - что делает технически и какую роль играет в RAG, плюс ссылка на главу-владельца (например, `tool_use` -> search.html, `usage` -> assemble-context.html). Это ровно два уровня зума: весь payload -> один блок крупно. Возврат (Esc или кнопка назад) выводит камеру обратно к полному payload.

Без JS блок-карта работает как статичная размеченная таблица выше плюс сам JSON с подписями - читатель ничего не теряет.

<!-- IE-BRIEF: element=payload-anatomy-drill | purpose=Дать читателю навести/раскрыть любой функциональный блок отрисованного RAG payload и сразу увидеть его техническую функцию + доменную роль в конвейере RAG, со ссылкой на главу-владельца | inputs=размеченный request/response JSON (4 хода: request, tool_use response, tool_result request, final text response) + block map (17 строк таблицы Блок|Поля|Функция|Роль в RAG; каждая строка несет block-id, поля для подсветки и chapter-link); NET-NEW default-export data/payload-anatomy.js { turns[], blocks[{id,fields,function{ru,en},ragRole{ru,en},chapter,highlight[]}] } | host=[data-component="payload-anatomy-drill"] (drill через built drill-host slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/drilldown-zoom.js (готовая semantic-zoom камера, init(rootEl, config)=>{destroy()}); page glue shared/js/pages/payload-anatomy.js поставляет renderPanel (карточка Function + RAG role + chapter-link на блок); payload рендерится как аннотированный HTML <pre>/<code> с per-block hooks, не SVG | animation=reveal: transform/opacity only; IO-gated; reduced-motion snaps to end over the same DOM; <=2 zoom levels (whole payload -> one block detail); mobile 390/320; NO mascot/traveling dot -->

## Источники

- Anthropic. Messages API reference (model, max_tokens, system, messages, content blocks, stop_reason, stop_sequence, usage). <https://platform.claude.com/docs/en/api/messages>
- Anthropic. Tool use (tools, tool_choice, tool_use, tool_result, tool_use_id, input_schema). <https://platform.claude.com/docs/en/docs/build-with-claude/tool-use/overview>
- Anthropic. Extended thinking (thinking blocks, budget_tokens). <https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking>
- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- OpenAI. Embeddings guide (vector shape, cosine similarity). <https://developers.openai.com/api/docs/guides/embeddings>

## Попробуйте сами

- Откройте drill по блоку `tool_use` (zoom 1) и проследите, как `input.query` и `top_k` уходят в стадию retrieve; сверьте с search.html.
- Раскройте блок `tool_result` и найдите внутри чанка поля `source`/`section`/`date` (из чанкинга) и `cosine`/`rank` (из поиска) - один блок несет следы сразу двух стадий конвейера.
- Сравните `usage.input_tokens` в ходе 2 (412) и в ходе 4 (638): раскройте блок `usage` и убедитесь, что рост - это цена подложенного контекста, тот самый бюджетный сигнал из assemble-context.html.

## Что дальше

Этот payload - не отдельная глава маршрута, а сквозной разрез всего конвейера: на него ссылаются generation.html (как поля `system`/`content`/`stop_reason` дают заземленный ответ) и assemble-context.html (как `usage` и `tool_result` показывают бюджет контекста). Вернитесь к любой из них, чтобы увидеть свою стадию уже в байтах живого запроса.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
