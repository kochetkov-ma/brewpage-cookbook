<!--
  RU-first production core section. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
  PRIVACY: access/security only at user-facing level; NO platform internals.
-->

# Продакшен-запуск: живой сервис для реальных пользователей

## Проблема, с которой вы пришли

Прототип RAG работает у вас на ноутбуке. Но реальные пользователи приносят то, чего не было в демо: каждый запрос стоит денег и секунд, вопросы идут пачками в пик нагрузки, данные устаревают через неделю, а разным людям положено видеть разные документы. Без контроля над этим "работает на демо" превращается в "дорого, медленно, и утекают чужие данные".

Это вершина маршрута - продакшен (production): связать все звенья (chunking -> embedding -> store -> retrieve -> assemble -> generation) в сервис и держать его в форме. Здесь решаются четыре вещи: скорость и стоимость запроса, мониторинг и обновление данных, безопасность и доступ, постепенное улучшение по метрикам. Ниже - рабочий скелет сервиса с этими крючками.

## Решение: продакшен-эндпоинт с контролем затрат

Вот рабочий эндпоинт на Python (FastAPI), который собирает весь конвейер и добавляет продакшен-крючки: кеш, измерение задержки, подсчет стоимости, фильтр доступа.

```python
# pip install fastapi uvicorn cachetools
import time, hashlib
from cachetools import TTLCache
from fastapi import FastAPI, Depends

app = FastAPI()
# Кеш ответов: одинаковый вопрос не платит дважды. TTL - чтобы не отдавать устаревшее.
answer_cache = TTLCache(maxsize=10_000, ttl=3600)

# Цена за 1M токенов - сверьте с pricing вендора перед расчетом.
PRICE_IN_PER_MTOK = 3.00   # USD/1M -- подставьте тариф вашего поставщика (см. страницу цен Anthropic)
PRICE_OUT_PER_MTOK = 15.00  # USD/1M -- подставьте тариф вашего поставщика (см. страницу цен Anthropic)

def cost_usd(tokens_in, tokens_out):
    return (tokens_in / 1e6) * PRICE_IN_PER_MTOK + (tokens_out / 1e6) * PRICE_OUT_PER_MTOK

@app.post("/ask")
def ask(question: str, user=Depends(current_user)):
    t0 = time.perf_counter()
    key = hashlib.sha256(f"{user.tenant}:{question}".encode()).hexdigest()
    if key in answer_cache:
        return {"answer": answer_cache[key], "cached": True}

    # Доступ: retrieve видит только документы, разрешенные этому пользователю.
    chunks = retrieve(question, allowed_filter=user.acl_filter)
    prompt, used = assemble_context(question, chunks)
    answer, tokens_in, tokens_out = generate_with_usage(prompt)

    answer_cache[key] = answer
    latency_ms = (time.perf_counter() - t0) * 1000
    log_metrics(  # уходит в ваш monitoring, не в ответ пользователю
        user=user.id, latency_ms=latency_ms,
        cost=cost_usd(tokens_in, tokens_out), n_chunks=len(chunks),
    )
    return {"answer": answer, "cached": False, "latency_ms": round(latency_ms)}
```

## Скорость и стоимость запроса

Каждый запрос платит за токены входа (инструкция + контекст + вопрос) и выхода (ответ). Цена считается по тарифу вендора за токены - например, публичный [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) задает отдельную цену за входные и выходные токены. Отсюда два рычага: меньше контекста (бюджет токенов из главы про сборку контекста) и короче ответ.

Третий рычаг - **кеш**. Одинаковые вопросы не должны заново платить за генерацию; `TTLCache` выше отдает готовый ответ, а TTL не дает кешу отдавать устаревшее после обновления данных. Отдельно кеш эмбеддинга запроса снимает повторный вызов эмбеддера на тот же текст.

Задержка (latency) складывается из двух частей: поиск по индексу (обычно миллисекунды, см. ANN в главе про векторное хранилище) и генерация (самая долгая часть). Стриминг из главы про генерацию не уменьшает общее время, но резко сокращает воспринимаемое ожидание - пользователь видит первые токены сразу.

## Мониторинг и обновление данных

То, что вы не измеряете в продакшене, сломается тихо. Логируйте по каждому запросу: задержку, стоимость, число выданных кусков, был ли кеш-хит и (где пользователь дал согласие) его оценку ответа. Эти оценки - сырое топливо для золотого набора из главы про оценку: плохие ответы превращаются в новые тест-кейсы.

Данные устаревают. Когда документ меняется, его нужно заново разбить на куски, пересчитать эмбеддинг и обновить в индексе - инкрементально, только изменившееся, а не весь корпус. После обновления сбросьте относящийся к нему кеш, иначе пользователь получит старый ответ по новому документу.

## Безопасность и доступ

В многопользовательском сервисе разным людям положено видеть разные документы. Ключевой принцип: доступ проверяется на шаге retrieve, а не после генерации. Если модель увидела кусок в контексте, считайте, что пользователь уже получил к нему доступ - обрезать это в ответе поздно. Поэтому в `ask` retrieve получает `allowed_filter` пользователя и физически не возвращает куски, которые ему не положены.

Практически это фильтр по метаданным при поиске (см. фильтры по метаданным в главах про чанкинг и векторное хранилище): у каждого куска есть tenant/раздел/уровень доступа, и запрос ограничивается тем, что разрешено. Вендор векторной базы обычно дает для этого фильтрацию по метаданным - см., например, [Pinecone metadata filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata) или аналог у вашей базы. Отдельно: ключи API и токены доступа храните в секретах, не в коде и не в логах, и не кладите чувствительные данные в шаблон промпта, который может уйти в логи вендора.

Если вы публикуете рецепт или демо на хостинге, соблюдайте правила платформы на пользовательском уровне (что можно размещать, как сообщить о нарушении) - без предположений о ее внутренней работе.

## Чеклист вывода в прод

- [ ] Бюджет токенов ограничен, контекст не раздут (assemble-context).
- [ ] Кеш ответов и эмбеддинга с разумным TTL; сброс кеша при обновлении данных.
- [ ] Логируются задержка, стоимость, число кусков, кеш-хит по каждому запросу.
- [ ] Инкрементальное обновление индекса при изменении документов.
- [ ] Доступ проверяется на шаге retrieve через фильтр по метаданным, а не после.
- [ ] Ключи и токены - в секретах, не в коде, не в логах, не в промпте.
- [ ] Золотой набор и регулярные прогоны оценки до/после правки (evaluation).
- [ ] Запасной вариант "Этого нет в документах" работает для случаев без контекста (generation).

## Куда движется RAG

RAG быстро развивается: гибридный поиск (смысл + ключевые слова), реранкинг кросс-энкодером, агентные схемы с несколькими шагами retrieve и граф-RAG над связными сущностями. Базовый же конвейер - retrieve, augment, generate из [Lewis et al., 2020](https://arxiv.org/abs/2005.11401) - остается тем же каркасом, на который эти улучшения насаживаются. Освоив этот маршрут, вы можете читать любое новое расширение как вариацию знакомых стадий.

<!-- IE-BRIEF: element=rollout-checklist-cost-calculator | purpose=дать читателю (1) интерактивный rollout-checklist с earned-progress и (2) калькулятор стоимости и latency на его собственных числах | inputs=NET-NEW default-export shared/data/production.js { checklist:[{id, ru, en, done:false}], calc:{tokensIn, tokensOut, priceInPerM, priceOutPerM, qps, cacheHitRate} } (defaults) | host=[data-component="rollout-cost-calculator"]; optional drill в пункт через [data-component="drilldown-host"] | recipe-path=checklist earned-progress = REUSE shared/js/lib/progress.js (purpose-built earned-main-path strip + width fill; НЕ timeline.js/process-anim.js); cost/latency math + readout = NET-NEW shared/js/lib/cost-calculator.js (чистый расчет cost=tok_in*price_in+tok_out*price_out + месячная оценка); drilldown-zoom.js для зума в пункт checklista | animation=отметка пункта checklista зажигает зеленый earned-segment progress-strip (width tween); при изменении чисел цифры стоимости/latency пересчитываются (opacity/transform tween на обновлении); transform/opacity и gated width only, IO-gated, reduced-motion сразу показывает итог; mobile 390/320 checklist и калькулятор stack; NO mascot dot -->

В статичном (без JS) виде хост показывает весь чеклист как прозаический список (как выше) и разобранный пример расчета стоимости одного запроса с подписанными слагаемыми.

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Anthropic. Pricing (цена за входные/выходные токены). <https://platform.claude.com/docs/en/about-claude/pricing>
- Pinecone. Metadata filtering (access via metadata). <https://docs.pinecone.io/guides/index-data/indexing-overview#metadata>

## Попробуйте сами

- В rollout-cost-calculator введите свои tokens_in/tokens_out и тариф вендора: посмотрите цену одного запроса, потом добавьте QPS и получите месячную оценку.
- Поднимите долю кеш-хитов в калькуляторе и проследите, как падает стоимость - кеш это прямой рычаг экономики.
- Отмечайте пункты чеклиста по одному и смотрите, как заполняется earned-progress: незакрытый пункт о проверке доступа на шаге retrieve - это блокировщик выхода в прод.

## Что дальше

Это вершина маршрута - вы прошли весь RAG от постановки проблемы до живого сервиса. Вернитесь на карту **start**, чтобы увидеть пройденный путь целиком, или откройте показательный **payload-anatomy**, где один реальный запрос разобран поле за полем сквозь все стадии.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
