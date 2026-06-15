<!--
  RU-first manuscript: why-rag.
  ASCII punctuation only, even inside Russian. Cite every technical claim inline.
  Strategy A: this md is the single source; CA hand-ports it to why-rag.html.
-->

# Зачем нужен RAG

## Проблема: модель устаревает и не знает вашего

Обычная модель обучена до некоторой даты (training cutoff) и после этого заморожена: о событиях и документах позже этой даты она не знает ничего. Например, обзор моделей Anthropic прямо указывает дату отсечки обучающих данных для каждой модели ([platform.claude.com/docs/en/docs/about-claude/models](https://platform.claude.com/docs/en/docs/about-claude/models)). Плюс она никогда не видела ваших приватных документов. Итог - два источника ошибок: устаревшие факты и выдумки про ваши данные.

RAG убирает оба одним ходом: нужный факт подается в момент запроса из вашего свежего индекса. Сравните два пути одного и того же вопроса - без RAG и с RAG:

```python
# Тот же вопрос двумя путями. Track A: без контекста. Track B: с retrieval.
from anthropic import Anthropic

client = Anthropic()  # ANTHROPIC_API_KEY
question = "По нашей политике: сколько дней отпуска на испытательном сроке?"

def ask(context=None):
    if context:
        prompt = (
            "Отвечай только по контексту. Если ответа нет в контексте, "
            f"скажи 'этого нет в документах'.\nКонтекст:\n{context}\n\nВопрос: {question}"
        )
    else:
        prompt = question
    r = client.messages.create(
        model="claude-sonnet-4-6",  # текущая модель -- см. обзор моделей
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text

# Track A (без RAG): ответ из памяти - может быть выдумкой про ВАШУ политику.
print("БЕЗ RAG:", ask())

# Track B (с RAG): retrieval дает реальный chunk, ответ заземлен.
retrieved = "Отпуск на испытательном сроке: 2 дня за каждый отработанный месяц."
print("С RAG: ", ask(context=retrieved))
```

Track B никогда не пишет ответ, пока контекст не подставлен: сначала retrieval, потом генерация. Форма вызова - реальный Anthropic Messages API ([platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)).

## Почему обычная модель не справляется

Две причины, обе структурные, а не "плохо спросили":

- **Training cutoff.** После даты отсечки модель не знает нового; обновить инструкцию = снова трогать модель. Даты отсечки публикуются в обзоре моделей ([platform.claude.com/docs/en/docs/about-claude/models](https://platform.claude.com/docs/en/docs/about-claude/models)).
- **Нет приватных данных.** Ваши внутренние документы не были и не будут в общедоступном обучающем корпусе, поэтому любой ответ о них без retrieval - догадка.

## Свежие и приватные данные без переобучения

RAG хранит знания ВНЕ модели - во внешнем индексе, которым вы управляете сами. Добавить или обновить факт = переиндексировать один документ, а не переобучать модель. Именно за этим Lewis et al., 2020 и разделили параметрическую память (веса модели) и непараметрическую (внешний индекс документов): индекс можно менять без переобучения ([arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). Практически: обновили строку в файле - помощник сразу отвечает по новой версии.

## Меньше выдуманных фактов: grounding + цитаты

Когда модель отвечает по поданному контексту, ответ заземлен (grounded) на конкретных фрагментах, и к каждому утверждению можно приложить ссылку на chunk-источник. Это и было главным результатом исходной работы: RAG дает более конкретные и фактичные ответы, чем чисто параметрическая модель (Lewis et al., 2020, [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)). Важно только подавать немного самых релевантных кусков и ставить главное ближе к краям prompt: модели хуже используют то, что зарыто в середине длинного контекста (Liu et al., 2023, [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)).

## Стоимость: RAG против дообучения

Дообучение (fine-tuning) требует собрать dataset, запустить обучение и повторять это при каждом обновлении данных - это отдельный цикл работы и расходов ([developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)). RAG же добавляет один шаг retrieval перед обычным вызовом модели и индексирует новые документы инкрементально. Когда задача - дать модели ФАКТЫ, которые часто меняются, RAG обычно дешевле и быстрее в поддержке; fine-tuning остается для задач ФОРМЫ и стиля. (Это инженерный компромисс, а не абсолют: считайте на своих объемах - см. главу production.)

Ниже - интерактивная двухдорожечная трассировка одного запроса. **Track A (без RAG):** запрос идет прямо в модель -> устаревший или выдуманный ответ. **Track B (с RAG):** запрос сначала наполняет box контекста найденными чанками, и только ПОСЛЕ этого появляется заземленный ответ. Основной путь - Track B; некоторые узлы открываются дриллом (semantic zoom камеры) в подробность. Заземленный зеленый ответ никогда не рисуется до того, как retrieval завершен - это и есть дидактический смысл motion. Без JS обе дорожки показаны статической inline-SVG-схемой с полным текстом.

<!-- IE-BRIEF: element=comparison | purpose=Наглядно противопоставить путь без RAG (stale/hallucinated) и с RAG (retrieval заполняет контекст ПЕРЕД заземленным ответом), чтобы показать, что grounding зависит от retrieval | inputs=shared/data/why-rag.js (default-export { question:{ru,en}, note, tracks:[A,B], takeaways:[], drill:{<key>:detail} }, импортится в page glue, НЕ worked-example.json); две дорожки A/B с фиксированным вопросом; активный язык из i18n.js (RU) | host=[data-component="comparison"] s data-slot="tracks" (две .track секции .cmp-node; context-узел = .cmp-node--grounding) + data-slot="takeaways" + data-slot="drill-layer" (modal камера) | recipe-path=shared/js/lib/comparison.js (собственная modal камера внутри модуля) (init(rootEl, config) => {destroy()}); page glue shared/js/pages/why-rag.js; mainPath = Track B ["B-q","B-embed","B-index","B-context","B-out"]; inline SVG .node/.edge | animation=Track B: чанки въезжают в .cmp-node--grounding контекст (translate/opacity) по очереди, затем answer-block проявляется (opacity) - строго ПОСЛЕ заполнения контекста, никогда до; Track A сразу дает ответ без retrieval-шага; drill = transform-scale камеры в узел; IO-gated, prefers-reduced-motion snaps to конечное состояние над тем же DOM (контекст уже полон, ответ уже виден); mobile 390/320 - дорожки в вертикальный stack; NO mascot/traveling dot -->

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. [arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)
- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. [arxiv.org/abs/2307.03172](https://arxiv.org/abs/2307.03172)
- Anthropic. Models overview (model families, training cutoff). [platform.claude.com/docs/en/docs/about-claude/models](https://platform.claude.com/docs/en/docs/about-claude/models)
- Anthropic. Messages API. [platform.claude.com/docs/en/api/messages](https://platform.claude.com/docs/en/api/messages)
- OpenAI. Fine-tuning guide (cost/lifecycle contrast). [developers.openai.com/api/docs/guides/model-optimization](https://developers.openai.com/api/docs/guides/model-optimization)

## Попробуйте сами

- Запустите Track B и проследите, как узел контекста (.cmp-node--grounding) заполняется чанками ДО того, как появится заземленный ответ (Track B в `data/why-rag.js`).
- Сравните Track A и Track B на одном вопросе: отметьте, что без retrieval ответ появляется сразу и без ссылки на источник.
- Откройте дриллом узел контекста в Track B и посмотрите, какие именно чанки попали в prompt и в каком порядке.

## Что дальше

Следующая остановка - **chunking**: как резать большие документы на чанки retrieval-размера, где именно резать и как выбрать размер и overlap.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
