<!--
  RU-first vector-store chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Векторное хранилище: храним векторы и ищем ближайших

## Проблема

У вас есть векторы - по одному на каждый фрагмент из прошлой главы. Когда приходит запрос, нужно найти несколько фрагментов, ближайших по смыслу к вектору запроса. Можно сравнить запрос со всеми векторами подряд - и при тысяче фрагментов это работает. Но при миллионе фрагментов перебор каждого на каждый запрос становится слишком медленным.

Решение - векторная база (vector store): специальное хранилище, которое держит векторы и умеет быстро находить ближайших соседей, не сравнивая запрос со всем архивом. Вот как выглядит шаг store плюс поиск на примере клиента векторной базы:

```python
# pip install pinecone openai
from pinecone import Pinecone
from openai import OpenAI

oai = OpenAI()
pc = Pinecone()
index = pc.Index("docs")

# store: кладем вектор + metadata + текст chunk
def embed(text):
    return oai.embeddings.create(
        model="text-embedding-3-small", input=text
    ).data[0].embedding

index.upsert(vectors=[
    {"id": "c1", "values": embed("Политика возврата: вернуть товар можно в 30 дней."),
     "metadata": {"source": "faq.md", "section": "возврат", "text": "..."}},
    {"id": "c2", "values": embed("Гарантия на электронику составляет 12 месяцев с даты покупки."),
     "metadata": {"source": "faq.md", "section": "гарантия", "text": "..."}},
])

# поиск: top-k ближайших к вектору запроса
res = index.query(
    vector=embed("как вернуть деньги за покупку"),
    top_k=3,
    include_metadata=True,
    filter={"section": "возврат"},   # metadata-фильтр
)
for m in res.matches:
    print(m.id, round(m.score, 3), m.metadata["section"])
```

База сама хранит векторы, сама ищет ближайших и возвращает top-k вместе с их косинусной близостью - вам не нужно писать перебор руками.

## Зачем отдельная база

Векторная база решает две задачи сразу: **хранит** миллионы векторов и **ищет** среди них ближайшие по смыслу. Обычная база данных ищет по точному равенству или по ключевым словам; векторная - по геометрической близости в `dim`-мерном пространстве, то есть по смыслу ([Pinecone, vector database basics](https://docs.pinecone.io/guides/get-started/overview)).

Это и есть то, чего не хватало на шаге поиска: быстрый смысловой поиск по всему архиву без побуквенного сравнения.

## Приближенный поиск ближайших соседей (ANN)

Точный поиск ближайших соседей (kNN) сравнивает запрос со всеми векторами - это гарантирует правильный ответ, но растет линейно с размером архива. При миллионах фрагментов используют **приближенный** поиск (ANN, approximate nearest neighbour): он почти всегда находит тех же соседей, но во много раз быстрее, жертвуя небольшой долей точности ради скорости.

Распространенный алгоритм ANN - **HNSW** (Hierarchical Navigable Small World): многослойный граф, по которому поиск "прыгает" от дальних узлов к ближайшим за логарифмическое число шагов вместо перебора всего множества ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)). Другие системы строят индексы поверх библиотек вроде [FAISS](https://arxiv.org/abs/1702.08734), которая специально сделана для быстрого поиска по миллионам векторов.

<!-- IE-BRIEF: element=ann-topk-drill | purpose=показать как из вектора запроса находятся top-k ближайших соседей в небольшом индексе: query path нарисован явно от узла-запроса к выбранным соседям, drill (semantic zoom) в выбранный узел показывает его metadata + cosine | inputs=NET-NEW default-export shared/data/vector-store.js (по образцу search-vectors.js: { query, k, plot, rings?, points:[{id,kind,cx,cy,cos,rank,topk?,metadata,deep}] }, ~8-10 узлов + 1 query + top_k=3; layout stubs, не реальные embeddingi); импортируется в page glue | host=[data-component="drilldown-host"] с data-slot="stage" (index SVG) + data-slot="crumbs" + data-slot="zoomout" + data-slot="panel" | recipe-path=shared/js/lib/drilldown-zoom.js (shipped semantic-zoom камера внутрь узла, не modal по умолчанию) + reuse vector-map.js point+link машинерии для ~8-10-node index SVG и query-edge draw (или тонкий NET-NEW index-map.js, если vector-map.js слишком search-специфичен) | animation=ребра от запроса к top-k рисуются один раз (gated stroke-dashoffset), ближайшие узлы подсвечиваются; transform/opacity only; IO-gated + prefers-reduced-motion snaps to end; mobile 390/320 перекомпоновка узлов; NO mascot dot; query path всегда нарисован -->

## Top-k и фильтры по метаданным

При поиске вы просите не один самый близкий вектор, а **top-k** - несколько ближайших (часто k=3..10). Это дает модели немного запасных кусков на случай, если самый ближайший не полностью покрывает вопрос.

Вместе с вектором в базе хранятся **метаданные** (metadata) - источник, раздел, дата, права доступа. Фильтры по метаданным сужают поиск до нужного подмножества перед тем, как искать ближайших: например, только документы этого отдела или только то, что свежее определенной даты ([Pinecone, metadata filtering](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata)). В коде выше это `filter={"section": "vozvrat"}`.

## Масштаб: миллионы фрагментов без перебора

Именно ANN-индекс делает смысловой поиск практичным на большом архиве. Вместо сравнения запроса с каждым из миллионов векторов граф HNSW приводит к ответу за логарифмическое число шагов ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)). Поэтому из 100000+ фрагментов top-5 ближайших достается за миллисекунды, а не за полный проход по базе.

## Когда векторная база не нужна

Векторная база - не всегда правильный выбор:

- **Маленький корпус.** При нескольких сотнях или тысяче фрагментов точный перебор (kNN) в памяти прост, достаточно быстр и не требует отдельной инфраструктуры.
- **Точное совпадение важнее смысла.** Если вам нужен поиск по точным кодам, артикулам или ID - обычная база или полнотекстовый индекс точнее и дешевле.
- **Уже есть подходящая база.** Некоторые обычные СУБД поддерживают векторный поиск как расширение (например pgvector для PostgreSQL, [pgvector](https://github.com/pgvector/pgvector)) - тогда отдельная специальная база может быть избыточна.

Правило: берите векторную базу, когда корпус большой И поиск идет именно по смыслу. Иначе она добавляет сложность без выгоды.

## Источники

- Malkov & Yashunin, 2016. Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs. <https://arxiv.org/abs/1603.09320>
- Johnson, Douze & Jegou, 2017. Billion-scale similarity search with GPUs (FAISS). <https://arxiv.org/abs/1702.08734>
- Pinecone. Database overview + metadata filtering. <https://docs.pinecone.io/guides/get-started/overview>
- pgvector. Open-source vector similarity search for PostgreSQL. <https://github.com/pgvector/pgvector>

## Попробуйте сами

- Откройте интерактив ann-topk-drill: найдите узел-запрос и пройдите по нарисованному query path к его top-k соседям. Сделайте drill (semantic zoom) в одного из выбранных соседей и посмотрите его `cosine` и `metadata`.
- Сравните, что вернется с фильтром по метаданным и без него: в коде выше уберите `filter={"section": "refund"}` и посмотрите, как меняется набор top-k.
- Прикиньте, нужна ли векторная база вашему случаю: сколько у вас фрагментов и ищете вы по смыслу или по точному совпадению - сверьтесь с разделом "Когда векторная база не нужна".

## Что дальше

Векторы в индексе, ближайшие находятся быстро - дальше нужно превратить запрос пользователя в вектор и собрать top-k на живом запросе. Следующая остановка: **search** (поиск по смыслу во время запроса).

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
