<!--
  RU-first manuscript: start (the trailhead / overview).
  Renamed from 00-landing.md; the landing IS this chapter (Atlas MAP).
  ASCII punctuation only, even inside Russian. Cite every technical claim inline.
  Strategy A: this md is the single source; CA hand-ports it to index.html.
-->

# RAG Guide: собираем retrieval-augmented generation по шагам

## Проблема, с которой вы пришли

У вас есть LLM и папка документов: инструкции, тикеты, база знаний. Вы задаете модели вопрос по этим документам и получаете уверенный, но выдуманный ответ. Модель не видела ваших данных на обучении и не может их видеть - это фундаментальное ограничение, а не баг промпта.

RAG (retrieval-augmented generation) решает именно это: перед генерацией мы находим релевантные фрагменты ваших документов и подмешиваем их в запрос. Термин и базовую архитектуру ввели Lewis et al., 2020, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)): retriever достает документы, generator пишет ответ, опираясь на них.

Этот рецепт - рабочий путь, а не обзор. К вершине маршрута у вас будет рабочая модель конвейера: от документа через векторы и поиск до заземленного (grounded) ответа со ссылками на источники.

Вот минимальный запрос к модели БЕЗ RAG - именно так рождается уверенная выдумка, когда нужных фактов нет в обучении:

```python
# Bez RAG: model otvechaet iz pamyati, bez dostupa k vashim dokumentam.
from anthropic import Anthropic

client = Anthropic()  # ANTHROPIC_API_KEY iz okruzheniya

resp = client.messages.create(
    model="claude-sonnet-4-6",  # tekushchaya model -- sm. obzor modelej
    max_tokens=512,
    messages=[
        {"role": "user", "content": "Skolko dnej otpuska u sotrudnika na ispytatelnom sroke?"}
    ],
)
print(resp.content[0].text)  # pravdopodobno, no ne fakt iz VASHEJ politiki
```

Форма вызова - реальный Anthropic Messages API ([platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)). Весь остальной рецепт добавляет перед этим вызовом шаг retrieval, чтобы в `content` попал ваш контекст.

## Что вы получите в конце пути

Своего помощника, который отвечает строго по вашим документам, а не наугад: находит нужные фрагменты, подкладывает их в запрос, ссылается на источник и честно говорит "этого нет в документах", когда ответа нет. Вы пройдете все звенья: chunking, embedding, векторная база, поиск, сборка контекста, генерация, оценка качества и вывод в прод.

## Как читать эту карту

Карта читается слева направо, от 0% к 100%: маршрут из остановок, где каждая - отдельная глава. Заранее знать ничего не нужно; термины вводятся по ходу. Любую остановку можно открыть и прочитать отдельно - это и есть главный интерактив этой страницы.

Ниже - сама интерактивная карта-маршрут. Ржавая линия маршрута проходит через 11 флажков-остановок; клик по флажку открывает его field note (краткое описание + пункты + пример) прямо на месте, не уводя со страницы. Полоса прогресса наверху заполняется по мере того, как вы открываете остановки - это заработанный прогресс, а не декорация. В один момент открыта ровно одна заметка.

<!-- IE-BRIEF: element=map-route | purpose=Показать весь маршрут RAG как упорядоченный список остановок и дать читателю открыть любую главу на месте; field note каждой остановки = trailhead этой главы | inputs=shared/data/nav.json (routeD, stops[] s ru.{label,blurb,pts,ex}, ui.ru); активный язык из i18n.js (RU default); single-open state (открыта одна заметка) | host=[data-component="trail"] s data-slot="svg" (route SVG) + data-slot="note" (field note) + data-slot="progress" (заработанная полоса); nav.json фетчится в page glue (stripMeta), НЕ через data-*-src | recipe-path=shared/js/lib/map-route.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/landing.js; SVG pins sampled on routeD via getPointAtLength (no drift) | animation=флажки проявляются по очереди вдоль routeD (opacity/translate), полоса прогресса растет по width при открытии остановки; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM; mobile 390/320 - карта скроллится по горизонтали, заметка под ней; NO mascot/traveling dot -->

## Маршрут: 11 остановок

Это полный маршрут в порядке прохождения. Каждая остановка - отдельная глава; первые три (`start`, `what-rag`, `why-rag`) задают базу, дальше идет сам конвейер.

1. **start** - эта страница: проблема и карта всего пути.
2. **what-rag** - что такое RAG (retrieval-augmented generation) и чем он не является.
3. **why-rag** - зачем он нужен: свежие и приватные данные, меньше выдумок, дешевле дообучения.
4. **chunking** - режем большие документы на чанки retrieval-размера.
5. **embedding** - превращаем каждый чанк в вектор фиксированной длины.
6. **vector-store** - храним векторы в индексе и ищем ближайших соседей (ANN), классика - HNSW.
7. **search** - на запрос находим top-k ближайших по смыслу чанков.
8. **assemble-context** - собираем найденное в один prompt в рамках token-бюджета.
9. **generation** - модель пишет ответ, опираясь на контекст, а не на память.
10. **evaluation** - системно измеряем точность поиска и качество ответа.
11. **production** - собираем все в сервис: скорость, стоимость, мониторинг, доступ.

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Anthropic. Messages API. [platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)

(Технические источники по каждой стадии живут в соответствующих главах: chunking, embedding, vector-store, search, generation, evaluation.)

## Попробуйте сами

- Откройте на карте остановку **what-rag**: прочитайте ее field note (`blurb` + `pts` из `nav.json`) и посмотрите, как расшифровывается RAG на три шага.
- Пройдите все 11 флажков по очереди и доведите полосу прогресса до 100% - каждая открытая остановка = заработанный шаг маршрута (поле `id` в `nav.json`).
- Сравните остановки **why-rag** и **production**: первая говорит, зачем нужен RAG, последняя - как довести его до реальных пользователей.

## Что дальше

Следующая остановка - **what-rag**: разберем три слова в названии (retrieve, augment, generate) и четко отделим RAG от дообучения и от простого расширения контекста.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
