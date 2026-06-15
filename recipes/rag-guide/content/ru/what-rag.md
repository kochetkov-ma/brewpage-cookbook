<!--
  RU-first manuscript: what-rag.
  ASCII punctuation only, even inside Russian. Cite every technical claim inline.
  Strategy A: this md is the single source; CA hand-ports it to what-rag.html.
-->

# Что такое RAG

## Проблема: модель не знает ваших данных

Вы спрашиваете обычную LLM: "Сколько дней отпуска у сотрудника на испытательном сроке по нашей политике?" Модель отвечает уверенно - и мимо. Вашей внутренней политики она никогда не видела, поэтому просто генерирует правдоподобный текст. Решение не в том, чтобы "лучше спросить", а в том, чтобы ПЕРЕД ответом дать модели именно ваш документ.

Именно это делает RAG: находит релевантные фрагменты ваших данных и подмешивает их в запрос, после чего модель отвечает по ним. Архитектуру ввели Lewis et al., 2020 ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). Вот тот же вызов, но уже с retrieval - минимальный рабочий RAG на реальных API:

```python
# Minimalnyj RAG: snachala retrieval, potom generaciya po najdennomu.
from anthropic import Anthropic
from openai import OpenAI
import numpy as np

oa = OpenAI()        # OPENAI_API_KEY: schitaem embeddingi
anthropic = Anthropic()  # ANTHROPIC_API_KEY: generaciya

# Korpus = vashi chunki (zdes' uproshchen do spiska strok).
chunks = [
    "Otpusk na ispytatelnom sroke: 2 dnya za kazhdyj otrabotannyj mesyac.",
    "Komandirovki oformlyayutsya cherez portal ne pozdnee chem za 3 dnya.",
    "Udalenka soglasuetsya s rukovoditelem na kazhduyu nedelyu otdelno.",
]

def embed(texts):
    r = oa.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in r.data])  # razmernost zavisit ot modeli (naprimer, 1536 dlya text-embedding-3-small) -- sm. rukovodstvo OpenAI Embeddings

chunk_vecs = embed(chunks)
query = "Skolko dnej otpuska na ispytatelnom sroke?"
q_vec = embed([query])[0]

# Cosine similarity -> top-1 chunk (RETRIEVAL).
cos = chunk_vecs @ q_vec / (np.linalg.norm(chunk_vecs, axis=1) * np.linalg.norm(q_vec))
top = chunks[int(np.argmax(cos))]

# AUGMENTED + GENERATION: podkladyvaem najdennoe v prompt.
resp = anthropic.messages.create(
    model="claude-sonnet-4-6",  # tekushchaya model -- sm. obzor modelej
    max_tokens=300,
    messages=[{
        "role": "user",
        "content": f"Otvechaj tolko po kontekstu. Kontekst:\n{top}\n\nVopros: {query}",
    }],
)
print(resp.content[0].text)  # otvet opiraetsya na VASH chunk
```

Тут видны все три шага: retrieval (cosine -> top chunk), augmented (chunk в промпте), generation (ответ модели). Формы вызовов реальные: OpenAI Embeddings ([developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)) и Anthropic Messages ([platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)).

## Что такое RAG: три слова

RAG = **R**etrieval-**A**ugmented **G**eneration. Три слова - три шага:

- **Retrieval** - найти нужные куски текста в ваших данных (в примере выше - cosine по векторам чанков).
- **Augmented** - добавить найденное прямо в запрос к модели (вставили `top` в `content`).
- **Generation** - модель формулирует ответ на основе этих кусков, а не памяти.

Это и есть определение из исходной работы: retriever выбирает документы, generator обуславливает ответ на них (Lewis et al., 2020, [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)).

## Чего RAG не делает

RAG часто путают с соседними вещами. Четкие границы:

- **Это не дообучение (fine-tuning).** Fine-tuning меняет веса модели на ваших примерах; RAG веса не трогает вообще - он лишь подает данные во время запроса. Fine-tuning учит модель ФОРМЕ и стилю, RAG дает ей ФАКТЫ (см. разграничение в руководстве OpenAI по fine-tuning, [developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)). Чтобы добавить новый документ, в RAG достаточно его заиндексировать, а не переобучать модель.
- **Это не просто большое контекстное окно.** "Запихнем все документы в prompt" не масштабируется и вредит: модели хуже используют информацию в середине длинного контекста - эффект "lost in the middle" (Liu et al., 2023, [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)). RAG подает модели только небольшой top-k релевантных кусков.
- **Это не память модели.** Между запросами модель ничего не запоминает; "память" в RAG живет в вашем внешнем индексе, а не внутри модели.

## Анатомия конвейера

Те три слова разворачиваются в конвейер из нескольких стадий. Это карта всего рецепта; каждая стадия - отдельная глава маршрута:

1. **chunking** - режем документы на чанки retrieval-размера.
2. **embedding** - каждый чанк -> вектор фиксированной длины (dim 1536).
3. **vector-store** - векторы в индекс, готовый к поиску ближайших соседей.
4. **search** - запрос -> вектор запроса -> top-k ближайших чанков.
5. **assemble-context** - собираем top-k в один prompt в рамках token-бюджета.
6. **generation** - модель пишет заземленный ответ по собранному контексту.

Ниже - интерактивная диаграмма этого конвейера: горизонтальный ряд узлов-стадий слева направо. Спина маршрута (spine) один раз прорисовывается при входе в экран; каждый узел можно открыть семантическим зумом (C4-style камера въезжает внутрь стадии), где раскрывается ее состав. Полоса прогресса зарабатывается по мере прохода по основному пути. Без JS страница показывает ту же цепочку стадий статической inline-SVG-схемой и полный текст.

<!-- IE-BRIEF: element=pipeline-flow | purpose=Показать RAG как упорядоченный конвейер стадий и дать читателю drill (semantic zoom) внутрь любой стадии, чтобы увидеть ее состав и ее главу | inputs=shared/data/what-rag.js (default-export { order:string[], nodes:{[id]:{idx,anchor,label,hint,crumb,panel,deep?}} }, импортится в page glue, НЕ через data-*-src); mainPath = order; активный язык из i18n.js (RU) | host=[data-component="pipeline"] s data-slot="flow" (3 stacked paths edge-base/edge-draw/edge-prog) + data-slot="nodes" (ряд node-card стадий), внутри drill-camera stage [data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel) | recipe-path=shared/js/lib/pipeline.js + drilldown-zoom.js + progress.js (init(rootEl, config) => {destroy()}); page glue shared/js/pages/what-rag.js; inline SVG node/edge hooks .node/.edge | animation=spine (путь между узлами) рисуется один раз через gated stroke-dashoffset; узлы проявляются по очереди (opacity/translate); drill = transform-scale камеры в узел, не modal по умолчанию; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM; mobile 390/320 - узлы переходят в вертикальный stack; NO mascot/traveling dot -->

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- OpenAI. Embeddings guide. [developers.openai.com/api/docs/guides/embeddings](https://developers.openai.com/api/docs/guides/embeddings)
- OpenAI. Fine-tuning guide (RAG vs fine-tuning contrast). [developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)
- Anthropic. Messages API. [platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)

## Попробуйте сами

- Откройте (drill, semantic zoom) узел **embedding** на диаграмме конвейера и посмотрите, во что он раскрывается - это та же стадия, что и глава embedding.
- Пройдите основной путь от узла **chunking** до **generation** и доведите полосу прогресса до конца - порядок узлов совпадает с порядком глав маршрута.
- Сравните стадии **search** и **assemble-context** дриллом: первая находит top-k, вторая пакует его в один prompt.

## Что дальше

Следующая остановка - **why-rag**: почему обычная модель не справляется (training cutoff, нет приватных данных) и почему RAG дешевле и свежее, чем дообучение.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
