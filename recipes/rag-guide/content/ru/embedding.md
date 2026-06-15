<!--
  RU-first embedding chapter manuscript. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
  Derived from the earlier 02-embedding.md prototype (renamed, expanded).
-->

# Эмбеддинг: превращаем фрагмент в вектор

## Проблема

У вас есть фрагменты - куски текста из прошлой главы. Вопрос пользователя тоже текст, но другими словами: "как вернуть деньги" против фрагмента "политика возврата средств". Сравнение строк здесь не работает: общих слов почти нет, а смысл один и тот же. Нужен способ искать по смыслу, а не по буквам.

Решение - эмбеддинг (embedding): каждый фрагмент превращаем в вектор, числовой код его смысла, где близость векторов отражает близость смысла ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). Это второй шаг конвейера: после того как документ нарезан на фрагменты, каждый фрагмент один раз превращается в вектор, и дальше эти векторы идут в индекс.

Вот весь шаг целиком - реальный вызов API, который превращает список фрагментов в список векторов:

```python
# pip install openai
from openai import OpenAI

client = OpenAI()

chunks = [
    "Politika vozvrata sredstv: vernut' tovar mozhno v techenie 30 dnej.",
    "Garantiya na elektroniku sostavlyaet 12 mesyacev s daty pokupki.",
    "Dostavka po gorodu zanimaet odin rabochij den'.",
]

resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=chunks,
)

# odin vektor na kazhdyj chunk, strogo odin-k-odnomu
vectors = [item.embedding for item in resp.data]
print(len(vectors), "vektorov")        # 3
print(len(vectors[0]), "komponent")    # 1536
```

После этого у вас три вектора длины 1536 - по одному на фрагмент. Сам текст напрямую сравнивать больше не нужно: вся дальнейшая работа идет с числами.

## Что такое вектор здесь

Вектор - это упорядоченный список чисел фиксированной длины `dim`. Модель-эмбеддер отображает текст в точку в `dim`-мерном пространстве так, чтобы тексты похожего смысла оказывались рядом. Например, OpenAI `text-embedding-3-small` выдает векторы длины 1536 ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). Именно поэтому в `worked-example.json` у каждого вектора стоит `dim: 1536`.

Размерность - это не случайное число: ее задает модель, и она одинакова для всех векторов одной модели. Смешивать векторы разных моделей нельзя - они живут в разных пространствах, и сравнивать их бессмысленно.

Важно: числа в поле `values` в живом примере - это короткие заглушки для макета (по три значения на вектор), а не настоящий эмбеддинг. Настоящий вектор имеет все 1536 компонент; показывать их целиком бессмысленно, поэтому анимация показывает только сам факт "фрагмент -> вектор", а не сырые числа.

<!-- IE-BRIEF: element=embedding-materialize | purpose=показать механизм chunk -> вектор: исходный текст разбивается на токены, затем числа вектора (dim 1536) "материализуются" / оседают на месте, демонстрируя что меняется представление а не текст | inputs=один chunk-text из worked-example.json (chunk c1) + его вектор-stub v1 (dim 1536, values - заглушка) | host=data-component="embedding-materialize" data-slot="anim" data-src="../shared/data/worked-example.json" | recipe-path=shared/js/lib/process-anim.js (renderer одного embed-шага в [data-slot=anim]); drill через drilldown-zoom.js в node Embedding | animation=текст -> tokens -> вектор оседает; transform/opacity only, gated one-shot; IO-gated + prefers-reduced-motion snaps to end state над тем же DOM; mobile 390/320 stack вертикально; NO mascot dot; query/chunk path нарисован явно -->

## Почему близость векторов = близость смысла

После того как фрагменты стали векторами, "похожесть" измеряют геометрически - чаще всего через косинусную близость (cosine similarity), косинус угла между векторами ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). Чем меньше угол, тем ближе смысл. Значение косинуса лежит в диапазоне от -1 до 1; для текстовых эмбеддингов на практике работает диапазон примерно 0..1, где 1 - совпадение смысла, а около 0 - тексты про разное.

Почему именно 0..1, а не весь диапазон от -1 до 1: текстовые эмбеддинги обычно нормируют по длине (L2-нормализация) - каждый вектор приводят к единичной длине ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)). У нормированных векторов косинус совпадает со скалярным произведением (dot product), поэтому ранжировать по скалярному произведению - то же самое, что по косинусу, но дешевле: не нужно делить на нормы, которые и так равны единице.

Вот как косинусная близость двух векторов считается вручную - без библиотек, чтобы была видна формула:

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb)

query_vec = client.embeddings.create(
    model="text-embedding-3-small",
    input="kak vernut' den'gi za pokupku",
).data[0].embedding

# blizost' zaprosa k kazhdomu chunku
scores = [(i, cosine(query_vec, v)) for i, v in enumerate(vectors)]
scores.sort(key=lambda t: t[1], reverse=True)
print(scores[0])   # chunk 0 (politika vozvrata) - samyj blizkij
```

Фрагмент про возврат средств окажется ближе всего к запросу "как вернуть деньги", хотя ни одного общего ключевого слова между ними почти нет. Именно эта близость и позволяет на шаге retrieve достать top-k фрагментов, ближайших к вектору запроса, не сравнивая тексты побуквенно.

Модели, которые учат такие представления предложений, описаны в работе [Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084): они специально обучают encoder так, чтобы косинусная близость векторов соответствовала смысловой близости предложений. Это отличает современный трансформерный (transformer) подход на базе Sentence-BERT от классических методов вроде мешка слов или TF-IDF: классика считает совпадение слов, а трансформер кодирует смысл целого предложения в один вектор.

## Метрики близости: не только косинус

Косинус - не единственная мера. На практике встречаются три:

- **Косинусная близость** (cosine) - косинус угла, игнорирует длину векторов.
- **Скалярное произведение** (dot product) - сумма покомпонентных произведений; учитывает и угол, и длину.
- **Евклидово расстояние** (Euclidean / L2, часто в квадрате - squared L2) - геометрическое расстояние между точками; меньше значит ближе.

Важный факт: для векторов, нормированных к единичной длине, все три метрики ранжируют соседей одинаково - порядок top-k не меняется, отличается только числовое значение. Векторные базы обычно дают выбрать любую из этих метрик при создании индекса ([FAISS metric types](https://github.com/facebookresearch/faiss/wiki), [pgvector](https://github.com/pgvector/pgvector)), и это уже мостик к следующей главе про векторное хранилище, где метрика задается на уровне индекса.

## Разреженные, плотные и гибридные векторы

Эмбеддинги из трансформера - **плотные** (dense) векторы: все 1536 компонент заполнены числами, и каждая кодирует часть смысла ([Reimers & Gurevych, 2019, Sentence-BERT](https://arxiv.org/abs/1908.10084)). Им противопоставлены **разреженные** (sparse) представления вроде TF-IDF или BM25, где вектор - это веса по словарю и почти все компоненты равны нулю. Разреженный поиск по-прежнему выигрывает на точном совпадении терминов и редких токенах (артикулы, имена, коды), где важна именно буква слова ([Robertson & Zaragoza, 2009, BM25](https://nlp.stanford.edu/IR-book/)). Поэтому на практике часто применяют **гибридный поиск** (hybrid retrieval): разреженный (BM25) и плотный (dense) объединяют, чтобы поймать и точные термины, и смысл.

## Дополнительно: что еще умеют эмбеддинги

- **Усечение размерности (Matryoshka, MRL).** Некоторые модели обучены так, что вектор можно обрезать до меньшей длины почти без потери качества; у OpenAI это параметр `dimensions` у `text-embedding-3` ([Kusupati et al., 2022, Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)).
- **Асимметричные эмбеддинги запроса и документа.** Модели с инструкциями (E5, GTE) кодируют запрос и документ по-разному - например, дописывают префиксы `query:` и `passage:` ([Wang et al., 2022, E5](https://arxiv.org/abs/2212.03533)).
- **Многоязычные эмбеддинги.** Один и тот же смысл на разных языках попадает в близкие точки одного пространства - запрос на русском находит документ на английском ([Reimers & Gurevych, 2020, Multilingual Sentence-BERT](https://arxiv.org/abs/2004.09813)).
- **Квантизация.** Векторы можно хранить в int8 или даже в бинарном виде - это резко уменьшает индекс ценой небольшой потери полноты (recall); подробнее в главе про векторное хранилище.

## Выбор модели, размерность, дрейф

Модель эмбеддингов - это выбор, который напрямую определяет качество поиска:

- **Размерность.** Больше `dim` - обычно больше точности, но дороже хранение и медленнее поиск. `text-embedding-3-small` дает 1536 компонент; некоторые модели позволяют урезать размерность ради экономии ([OpenAI Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings)).
- **Язык и домен.** Модель должна понимать язык и терминологию ваших документов. Общие модели хороши широко; узкий домен иногда требует специально обученной модели.
- **Дрейф модели (drift).** Если вы сменили модель эмбеддингов, все старые векторы в индексе становятся несовместимы с новыми - их нужно пересчитать целиком. Векторы разных моделей нельзя сравнивать между собой.

Главное правило: один раз выбрал модель - и фрагменты, и запросы превращай в векторы одной и той же моделью. Иначе запрос и фрагменты окажутся в разных пространствах, и их близость перестанет что-либо значить (это же правило про повторное использование одной модели: один выбор - один индекс).

## Связь с живым примером

Шаг `s2` (kind=embed) в `worked-example.json` берет те же три фрагмента c1..c3 из стадии нарезки и производит три вектора v1..v3. Связь явная: у каждого вектора есть поле `chunkId`, которое указывает на его фрагмент (v1 -> c1, v2 -> c2, v3 -> c3). Это и есть отображение один-к-одному: один фрагмент дает ровно один вектор.

После шага `s3` (store) векторы уходят в индекс - это следующая стадия конвейера (vector-store), которую следующая глава раскрывает отдельно.

## Источники

- OpenAI. Embeddings guide (text-embedding-3-small, dim=1536, cosine similarity, L2-нормализация к единичной длине, параметр dimensions). <https://developers.openai.com/api/docs/guides/embeddings>
- Reimers & Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. <https://arxiv.org/abs/1908.10084>
- Robertson & Zaragoza, 2009. The Probabilistic Relevance Framework: BM25 and Beyond. <https://nlp.stanford.edu/IR-book/>
- Kusupati et al., 2022. Matryoshka Representation Learning. <https://arxiv.org/abs/2205.13147>
- Wang et al., 2022. Text Embeddings by Weakly-Supervised Contrastive Pre-training (E5). <https://arxiv.org/abs/2212.03533>
- Reimers & Gurevych, 2020. Making Monolingual Sentence Embeddings Multilingual using Knowledge Distillation. <https://arxiv.org/abs/2004.09813>
- FAISS. Metric types and indexes wiki. <https://github.com/facebookresearch/faiss/wiki>
- pgvector. Open-source vector similarity search for PostgreSQL (cosine / inner product / L2). <https://github.com/pgvector/pgvector>

## Попробуйте сами

- Откройте интерактив embedding-materialize на узле Embedding (semantic zoom внутрь) и прогоните анимацию шага: смотрите, как текст фрагмента c1 разбивается на токены, а затем оседает в вектор v1. Обратите внимание: меняется представление (текст -> вектор), а не сам текст.
- В `worked-example.json` пройдите по векторам v1..v3 и сопоставьте каждый с фрагментом по полю `chunkId`. Убедитесь, что отображение строго один-к-одному (v1 -> c1, v2 -> c2, v3 -> c3).
- Возьмите код cosine выше и посчитайте близость одного запроса к каждому из трех фрагментов; проверьте, что самый близкий по смыслу фрагмент получает наибольший балл, даже без общих слов.

## Что дальше

Векторы готовы - дальше их нужно где-то хранить и быстро искать по ним ближайших. Следующая остановка: **vector-store** (векторная база и поиск ближайших соседей).

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
