<!--
  RU-first evaluation core section. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Оценка: измеряем точность поиска и качество ответа

## Проблема, с которой вы пришли

Вы поменяли размер куска, добавили реранкинг и "чувствуете", что стало лучше. Но на следующей неделе другой вопрос стал отвечаться хуже - а вы этого не заметили, потому что проверяли на паре вопросов вручную. Без измерения вы не можете отличить улучшение от регрессии: каждая правка - это ставка вслепую.

Это стадия оценки (evaluation): превратить "кажется лучше" в число. Измеряем две вещи отдельно - **нашелся ли нужный кусок** (точность поиска) и **хорош ли ответ** (качество генерации) - и прогоняем их на фиксированном наборе вопросов до и после каждой правки. Ниже - рабочий каркас оценки (eval-harness) над золотым набором.

## Решение: каркас оценки над золотым набором

Вот рабочий каркас на Python. Золотой набор - это список вопросов, для каждого из которых заранее известны id релевантных кусков. Каркас прогоняет retrieve и считает precision@k и recall@k.

```python
golden = [
    {
        "q": "Как вернуть товар?",
        "relevant": {"policy-12", "policy-13"},   # id chunks с ответом
    },
    {
        "q": "Сколько дней на возврат?",
        "relevant": {"policy-13"},
    },
    # ...50+ вопросов: чем больше, тем устойчивее метрика
]

def precision_recall_at_k(retrieved_ids, relevant, k):
    """retrieved_ids: top-k id от retrieve, по убыванию score.
       relevant: множество id действительно нужных chunks."""
    top_k = retrieved_ids[:k]
    hits = sum(1 for cid in top_k if cid in relevant)
    precision = hits / k                      # доля попаданий среди выданных k
    recall = hits / len(relevant)             # доля найденных из всех нужных
    return precision, recall

def evaluate(retriever, golden, k=5):
    p_sum = r_sum = 0.0
    for item in golden:
        ids = retriever(item["q"])            # ваш retrieve -> список id
        p, r = precision_recall_at_k(ids, item["relevant"], k)
        p_sum += p
        r_sum += r
    n = len(golden)
    return {"precision@k": p_sum / n, "recall@k": r_sum / n, "k": k, "n": n}

# Сравнение до/после правки на одном и том же наборе:
before = evaluate(retriever_v1, golden, k=5)
after  = evaluate(retriever_v2, golden, k=5)
print(before, after)
```

Главное правило: набор `golden` фиксирован, и обе версии (`v1`, `v2`) прогоняются на нем одном. Только так сравнение честное.

## Точность поиска

Retrieve - это задача информационного поиска (information retrieval), и метрики у нее стандартные. **Precision@k** = доля действительно релевантных среди первых k выданных; **recall@k** = доля найденных из всех существующих релевантных. Оба определены в классическом IR ([Manning, Raghavan, Schutze, Introduction to Information Retrieval, гл. 8](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html)).

Различие важно на практике. Высокий precision@5, но низкий recall@5 значит: что выдали - то по делу, но часть нужных кусков не дотянулась до top-5 (увеличьте k или улучшите эмбеддинг). Высокий recall, но низкий precision: нужное есть, но тонет в мусоре, который съедает бюджет токенов на стадии сборки контекста. Именно поэтому метрики считают парой, а не одной.

## Качество ответа

Точный retrieve еще не гарантирует хороший ответ: модель может правильно найти куски, но ответить неполно, не по делу или добавив выдумку. Качество ответа меряет другая группа метрик.

Для RAG их формализует фреймворк [RAGAS (Es et al., 2023)](https://arxiv.org/abs/2309.15217): он предлагает **faithfulness** (насколько ответ заземлен на выданном контексте - мера против галлюцинаций из главы про генерацию), **answer relevance** (отвечает ли ответ именно на вопрос) и **context relevance/precision** (насколько выданный контекст относится к вопросу). RAGAS оценивает эти аспекты автоматически, без ручной разметки каждого ответа.

```python
# pip install ragas datasets
from ragas import evaluate as ragas_evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from datasets import Dataset

ds = Dataset.from_dict({
    "question":     [it["q"] for it in samples],
    "answer":       [it["answer"] for it in samples],     # выход generation
    "contexts":     [it["contexts"] for it in samples],   # chunks, виденные моделью
    "ground_truth": [it["truth"] for it in samples],      # эталон из golden
})
report = ragas_evaluate(ds, metrics=[faithfulness, answer_relevancy, context_precision])
print(report)
```

## Золотой набор вопросов

Золотой набор - это фундамент всей оценки: список реальных вопросов с размеченными ответами/релевантными кусками. Правила: берите вопросы из реального трафика (а не придуманные), покрывайте разные темы и форматы и не меняйте набор между замерами - иначе `before` и `after` несравнимы. Размер - от нескольких десятков; чем больше, тем меньше шума в среднем.

## Обратная связь -> метрики

Оценки пользователей (палец вверх/вниз, "не помогло") - это сырой сигнал. Превратите его в метрику: помеченные как плохие ответы разбирайте и добавляйте их вопросы в золотой набор с правильной разметкой. Так набор растет именно на тех случаях, где система ошибается, и следующая правка проверяется уже на них.

## Типичные отказы и их следы

Когда метрика просела, причину видно по тому, какая именно упала:

- **Низкий recall@k** - нужный кусок вообще не вернулся. След: проблема в retrieve (эмбеддинг, чанкинг, маленький k). См. главы про эмбеддинг/чанкинг.
- **Высокий recall, низкая faithfulness** - кусок был, но ответ не заземлен (выдумка). След: слабая инструкция генерации. См. главу про генерацию.
- **Нужный кусок в контексте, но проигнорирован** - часто он оказался в середине окна (lost-in-the-middle, [Liu et al., 2023](https://arxiv.org/abs/2307.03172)). След: порядок на стадии сборки контекста.

<!-- IE-BRIEF: element=metric-at-k-eval-calculator | purpose=дать читателю почувствовать как precision@k и recall@k меняются при изменении k на реальном золотом sample, и сравнить before/after | inputs=NET-NEW default-export shared/data/evaluation.js { golden:[{q, relevant_ids[], retrieved_ids[]}] (3-5 вопросов вшиты, retrieved_ids per run для before/after), kRange:{min:1,max:10,default}, runs:["before","after"] }; slider k; тумблер before/after | host=[data-component="metric-eval-calculator"]; optional drill в один вопрос через [data-component="drilldown-host"] | recipe-path=NET-NEW shared/js/lib/eval-calculator.js (init(rootEl,{data})=>{destroy()}; чистый расчет precision@k/recall@k + bar render) + drilldown-zoom.js для зума в один вопрос (видно какие из top-k попали в relevant) | animation=при движении слайдера k столбцы precision@k и recall@k пересчитываются (width/transform tween); попадания в top-k подсвечиваются зеленым акцентом как earned; before/after - две дорожки рядом; transform/opacity и gated width only, IO-gated, reduced-motion сразу показывает итоговые столбцы; mobile 390/320 дорожки stack; NO mascot dot -->

В статичном (без JS) виде хост показывает разобранную золотую таблицу: вопрос, его relevant-id, выданный top-k и посчитанные precision@k/recall@k для нескольких значений k.

## Источники

- Manning, Raghavan, Schutze, 2008. Introduction to Information Retrieval, гл. 8 (precision/recall@k). <https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html>
- Es et al., 2023. RAGAS: Automated Evaluation of Retrieval Augmented Generation. <https://arxiv.org/abs/2309.15217>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>

## Попробуйте сами

- В metric-eval-calculator подвигайте слайдер k от 1 до 10 на одном вопросе и проследите, как recall@k растет (попадает больше нужных кусков), а precision@k чаще падает - это и есть компромисс.
- Переключите тумблер before/after и сравните две дорожки на одном и том же золотом наборе: только фиксированный набор делает сравнение честным.
- Найдите вопрос с высоким recall, но низким precision, и подумайте, как лишние куски ударят по бюджету токенов на стадии сборки контекста.

## Что дальше

Система измерена и улучшается. Последняя остановка - глава **production**: как связать все звенья в живой сервис и держать его в форме - скорость, стоимость, мониторинг, доступ.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
