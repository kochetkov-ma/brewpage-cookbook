<!--
  RU-first search chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Поиск: ищем по смыслу во время запроса

## Проблема

Пользователь спрашивает: "как вернуть деньги за покупку". А в ваших документах нужный фрагмент называется "политика возврата средств" - ни слова "деньги", ни слова "вернуть" в нем нет. Полнотекстовый поиск по ключевым словам здесь промахнется: общих слов почти нет, а ответ лежит именно в этом фрагменте.

Решение - поиск по смыслу (semantic search): запрос превращаем в вектор той же моделью, что и фрагменты, и ищем в индексе top-k фрагментов (top-k - несколько самых близких, обычно 3..10), ближайших к нему по косинусной близости (cosine - косинус угла между векторами, чем он ближе к 1, тем ближе смысл) ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). Этот шаг собирает все предыдущие в один живой запрос:

```python
# pip install pinecone openai
from pinecone import Pinecone
from openai import OpenAI

oai = OpenAI()
index = Pinecone().Index("docs")

def retrieve(query, k=3):
    # 1. запрос -> вектор запроса (та же модель, что и у chunks)
    qvec = oai.embeddings.create(
        model="text-embedding-3-small", input=query
    ).data[0].embedding
    # 2. top-k ближайших по cosine
    res = index.query(vector=qvec, top_k=k, include_metadata=True)
    return [(m.id, round(m.score, 3), m.metadata["text"])
            for m in res.matches]

for cid, score, text in retrieve("как вернуть деньги за покупку"):
    print(cid, score, text[:40])
# chunk про возврат средств приходит первым - без общих слов с запросом
```

Фрагмент "политика возврата средств" приходит первым, хотя слов из запроса в нем нет - потому что сравниваются смыслы, а не строки.

## Поиск по смыслу, а не по словам

Классический поиск по ключевым словам находит документы, где встречаются те же слова, что и в запросе. Он промахивается, когда об одном и том же люди пишут разными словами - синонимами, перефразировкой, на другом языке. Поиск по смыслу решает эту проблему: он сравнивает векторы, а близость векторов отражает близость смысла, а не совпадение слов ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084)).

<!-- IE-BRIEF: element=vector-space-map | purpose=показать поиск по смыслу как геометрию: точка-запрос и точки-chunki оседают по cosine-близости, top-k связаны явными ребрами; каждая точка drillable - далекие точки открывают панель "почему не в top-k", есть keyword-miss callout | inputs=shared/data/search-vectors.js (default-export { query, k, plot, rings, points:[Point] }, импортируется в page glue, НЕ worked-example.json): query point + ~10 chunk points (координаты спроецированы из cosine), top_k (по умолчанию 3), cosine rings | host=[data-component="vector-map"] с data-slot="stage" (plot SVG) + rail data-slot="rail"/"qvec"/"ranklist" (embed readout + kNN ranklist + keyword-miss callout) | recipe-path=shared/js/lib/vector-map.js (раскладка 2D + cosine rings + kNN links) + drilldown-zoom.js (semantic zoom в точку); page glue shared/js/pages/search.js; mainPath=["pt-q","n1","n2","n3"] | animation=точки оседают на свои места по cosine (transform/opacity only), затем ребра top-k рисуются один раз (gated stroke-dashoffset), cosine rings проявляются; IO-gated + prefers-reduced-motion snaps to end state; mobile 390/320 сжатие scene; NO mascot dot; query path (запрос -> top-k) всегда нарисован явно -->

## Запрос -> вектор запроса

Первый шаг живого поиска - превратить текст запроса в вектор той же моделью эмбеддингов, что использовалась для фрагментов ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). Это критично: если запрос превратить в вектор одной моделью, а фрагменты - другой, они окажутся в разных пространствах, и косинусная близость между ними ничего не будет значить. В коде выше это шаг 1 в функции `retrieve`.

## Top-k ближайших по косинусу

Вектор запроса идет в индекс, и база возвращает **top-k** фрагментов, ближайших по косинусной близости - обычно k в диапазоне 3..10. Больший k дает больше материала, но и больше шума; меньший k точнее, но рискует пропустить нужный кусок. На большом архиве поиск ближайших опирается на ANN-индекс (HNSW), чтобы не перебирать все векторы подряд ([Malkov & Yashunin, 2016, HNSW](https://arxiv.org/abs/1603.09320)).

## Переранжирование и гибридный поиск

Top-k из векторного поиска - хорошая первая выборка, но ее можно уточнить:

- **Переранжирование (reranking).** Первый проход (bi-encoder) быстро отбирает кандидатов; второй проход cross-encoder'ом точнее переоценивает каждую пару (запрос, фрагмент) и меняет порядок. Cross-encoder дороже, поэтому его применяют только к уже отобранным кандидатам ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084), раздел про bi- против cross-encoder).
- **Гибридный поиск.** Смысловой поиск по векторам комбинируют с классическим поиском по ключевым словам: векторы ловят смысл, а лексический поиск - точные термины, артикулы, имена, где важно совпадение самого слова ([Pinecone, hybrid search](https://docs.pinecone.io/guides/search/hybrid-search)).

Это уточнения, а не замена: базовый смысловой top-k уже работает, а переранжирование и гибрид улучшают его там, где нужна дополнительная точность.

## Что видит модель

После поиска модель получает не весь архив, а только top-k найденных кусков. Это и быстрее, и дешевле, но перекладывает ответственность на поиск: если нужный фрагмент не попал в top-k, модель просто не увидит ответа. Поэтому порядок и полнота top-k важны - исследования показывают, что модели хуже используют информацию, закопанную в середине длинного контекста, поэтому самое релевантное лучше ставить ближе к краям ([Liu et al., 2023, Lost in the Middle](https://arxiv.org/abs/2307.03172)). Как именно упаковать эти куски в промпт - тема следующих глав.

## Источники

- OpenAI. Embeddings guide (вектор запроса, cosine similarity). <https://developers.openai.com/api/docs/guides/embeddings>
- Reimers & Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks (bi- против cross-encoder). <https://arxiv.org/abs/1908.10084>
- Malkov & Yashunin, 2016. Efficient and robust ANN search using Hierarchical Navigable Small World graphs. <https://arxiv.org/abs/1603.09320>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Pinecone. Hybrid search guide. <https://docs.pinecone.io/guides/search/hybrid-search>

## Попробуйте сами

- Откройте интерактив vector-space-map: найдите точку-запрос и пройдите по нарисованным ребрам к top-k. Сделайте drill (semantic zoom) в далекую точку и прочитайте панель "почему не в top-k".
- Возьмите функцию `retrieve` выше и поменяйте `k` с 3 на 1 и на 10: посмотрите, как меняется набор и порядок возвращаемых фрагментов.
- Задайте запрос синонимами, без слов из нужного фрагмента (например "возмещение средств" вместо "возврат"): проверьте, что смысловой поиск все равно находит правильный фрагмент - это и есть промах по ключевым словам, который он лечит.

## Что дальше

Top-k найден - дальше его нужно аккуратно упаковать в один промпт к модели. Следующая остановка: **assemble-context** (сборка контекста: шаблон, бюджет токенов, порядок кусков).

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
