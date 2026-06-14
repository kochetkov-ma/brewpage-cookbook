<!--
  RU-first assemble-context core section. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Сборка контекста: упаковываем найденное в один промпт

## Проблема, с которой вы пришли

Этап retrieve вернул вам top-k фрагментов - скажем, 8 кусков, отсортированных по косинусной близости. Вы радостно склеиваете их в один текст, добавляете вопрос пользователя и отправляете в модель. Ответ приходит - и он хуже, чем мог бы быть: модель проигнорировала самый важный фрагмент, потому что вы поставили его в середину, а половина кусков - это дубли одного и того же абзаца, которые съели весь бюджет токенов.

Это и есть стадия сборки контекста (assemble-context): не "все найденное в кучу", а инженерная сборка. Качество ответа определяют три решения: по какому шаблону собрать промпт, сколько контекста влезет в лимит модели и в каком порядке разложить куски. Ниже - рабочий путь от сырого top-k к готовому промпту.

Это шаг augment из исходной работы по RAG: извлеченные документы подмешиваются во вход генератора ([Lewis et al., 2020](https://arxiv.org/abs/2005.11401)). Размеченный вид самого запроса и ответа разобран в главе [Анатомия запроса](payload-anatomy.html) - там подписано каждое поле промпта.

## Решение: сборщик контекста целиком

Вот рабочая функция на Python, которая берет результаты top-k от retrieve и собирает из них промпт под бюджет токенов. Она делает сразу все четыре вещи: шаблон, бюджет, порядок, удаление дублей.

```python
# pip install tiktoken
import tiktoken

ENC = tiktoken.get_encoding("cl100k_base")  # tokenizer semejstva GPT-4/3.5

def count_tokens(text: str) -> int:
    return len(ENC.encode(text))

PROMPT_TEMPLATE = """Otvechaj tol'ko na osnove konteksta nizhe.
Esli otveta v kontekste net, skazhi ob etom chestno.

Kontekst:
{context}

Vopros: {question}
Otvet:"""

def assemble_context(question, retrieved, max_context_tokens=3000):
    """
    retrieved: spisok dict {id, text, score, source}, otsortirovannyj
               po ubyvaniyu score (samyj relevantnyj pervym).
    """
    # 1. Dedup: vybrasyvaem povtory po tekstu, sohranyaya luchshij score.
    seen, unique = set(), []
    for chunk in retrieved:
        key = chunk["text"].strip()
        if key not in seen:
            seen.add(key)
            unique.append(chunk)

    # 2. Poryadok: samoe vazhnoe - po krayam, ne v seredine (lost-in-the-middle).
    ranked = order_for_attention(unique)

    # 3. Token budget: nabiraem kuski, poka vlezaem v limit.
    picked, used = [], count_tokens(PROMPT_TEMPLATE) + count_tokens(question)
    for chunk in ranked:
        cost = count_tokens(chunk["text"]) + 8  # +razdelitel'/podpis' istochnika
        if used + cost > max_context_tokens:
            break  # ostal'noe ne vlezaet - obrezaem
        picked.append(chunk)
        used += cost

    # 4. Shablon: skleivaem s podpis'yu istochnika dlya posleduyushchih citat.
    context = "\n\n".join(f"[{c['source']}] {c['text']}" for c in picked)
    return PROMPT_TEMPLATE.format(context=context, question=question), picked
```

Функция `order_for_attention` раскладывает лучшие куски по краям окна, а слабые - в середину. Почему именно так, разберем ниже.

## Шаблон промпта

Промпт RAG - это не просто "вопрос". Это три части в фиксированном порядке: **инструкция** (как отвечать), **контекст** (найденные куски) и **вопрос** пользователя. Именно объединение извлеченного с запросом и есть определение RAG по [Lewis et al., 2020](https://arxiv.org/abs/2005.11401): генератор видит не только вопрос, но и извлеченные документы как часть входа.

Инструкцию задавайте явно и жестко: "отвечай только по контексту, если данных нет - скажи об этом". Без нее модель достроит пробелы из собственной памяти - а это прямая дорога к выдумкам, с которыми борется глава про генерацию. Каждый кусок подписывайте источником (`[source]`), чтобы на шаге генерации модель могла сослаться на конкретный фрагмент.

## Сколько контекста влезает

У модели есть твердый предел - окно контекста (context window), максимум токенов на входе и выходе вместе. Например, семейство Claude работает с окном в 200 000 токенов ([Anthropic, Models overview](https://docs.anthropic.com/en/docs/about-claude/models)). Это кажется огромным, но бюджет токенов под контекст всегда меньше окна: часть места занимают инструкция, вопрос, история диалога и место под ответ.

Токен - это не слово и не символ; это единица, на которые токенизатор режет текст (части слов, знаки). Считать надо именно токены, а не символы - поэтому в коде выше `count_tokens` использует настоящий токенизатор `tiktoken` ([OpenAI tiktoken](https://github.com/openai/tiktoken)), а не `len(text)`. Большое окно не бесплатно: каждый лишний токен контекста - это деньги и задержка в каждом запросе (об этом - глава про продакшен).

## Порядок и приоритет кусков

Главный контринтуитивный факт этой главы: порядок кусков внутри промпта меняет ответ. Модели хуже всего используют информацию, попавшую в **середину** длинного контекста, и лучше всего - то, что стоит в **начале или конце**. Это эффект "lost in the middle": точность падает, когда нужный факт лежит посередине окна ([Liu et al., 2023](https://arxiv.org/abs/2307.03172)).

Практический вывод прямой: ставьте самые релевантные куски по краям, а менее важные - в середину. Именно это делает `order_for_attention`:

```python
def order_for_attention(ranked):
    """Luchshie kuski - po krayam okna, slabye - v seredinu.
    ranked uzhe otsortirovan po ubyvaniyu relevantnosti."""
    head, tail = [], []
    for i, chunk in enumerate(ranked):
        (head if i % 2 == 0 else tail).append(chunk)
    return head + tail[::-1]   # ...silnye...slabye...silnye
```

## Чистим дубли и обрезаем лишнее

Retrieve часто возвращает почти-дубли: один и тот же абзац, попавший в два соседних куска с перекрытием (см. главу про чанкинг), или тот же факт из двух версий документа. Дубли не добавляют информации, но едят бюджет токенов и выталкивают из окна полезные куски. Шаг удаления дублей выше убирает точные повторы; для почти-дублей его расширяют сравнением по косинусной близости между кусками.

Когда все, что влезает, отобрано, остаток просто обрезается - это нормально. Цель сборки контекста не "вложить все", а вложить нужное в правильном порядке под бюджет.

<!-- IE-BRIEF: element=context-assembly-drill | purpose=показать как top-k чанки упаковываются в шаблон промпта под token budget, с порядком по краям и обрезкой лишнего | inputs=NET-NEW default-export shared/data/assemble-context.js { template, chunks:[{id,text,score,source,tokens}], maxContextTokens:{min:500,max:4000,default}, order:["by-score"|"by-edges"] } (slider + order toggle config-driven) | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); context-assembly-drill монтируется как level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped камера, semantic-zoom в узел assemble) + NET-NEW shared/js/lib/context-assembly.js, drivable timeline.js пошагово (dedup -> order -> budget -> fill) | animation=semantic zoom в assemble-узел; шаблон промпта заполняется ранжированными чанками по очереди (translate/opacity), счетчик токенов растет (mono text update), куски за бюджетом обрезаются через opacity-to-0 (ДВИЖЕНИЕ - opacity; высота снапается, НЕ tween height/max-height per do-not #5); transform/opacity only, IO-gated, reduced-motion сразу показывает финальный промпт; mobile 390/320 stack вертикально; NO mascot dot -->

В статичном (без JS) виде хост показывает уже собранный блок промпта с подписанными частями: инструкция, контекст (куски с `[source]`), вопрос - и подпись "остальное обрезано по бюджету".

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Anthropic. Models overview (context window). <https://docs.anthropic.com/en/docs/about-claude/models>
- OpenAI. tiktoken (tokenizer). <https://github.com/openai/tiktoken>

## Попробуйте сами

- Откройте drill context-assembly и сдвиньте слайдер `max_context_tokens` вниз до 800: посмотрите, как нижние по score куски заметно обрезаются, когда счетчик токенов упирается в лимит.
- Переключите тумблер порядка с "по score" на "по краям" и сравните раскладку: самые релевантные куски уезжают к началу и концу окна - это смягчение эффекта lost-in-the-middle.
- Найдите в списке два почти одинаковых куска и проследите, как шаг удаления дублей выбрасывает повтор, освобождая бюджет под следующий кусок.

## Что дальше

Собранный промпт уходит в модель. Следующая остановка - глава **generation**: как модель читает этот контекст и пишет заземленный ответ с цитатами. Полный вид запроса поле за полем - в главе **payload-anatomy**.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
