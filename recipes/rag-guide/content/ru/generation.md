<!--
  RU-first generation core section. ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Генерация: модель пишет заземленный ответ

## Проблема, с которой вы пришли

Вы собрали идеальный контекст (глава про сборку контекста), отправили в модель - а она все равно выдумала деталь, которой в документах нет. Или ответила правильно, но без ссылки на источник, и пользователь не может это проверить. Или на вопрос, ответа на который в данных просто нет, уверенно выдала выдумку вместо честного "не знаю".

Это стадия генерации (generation): модель читает собранный контекст и пишет ответ. Сам факт, что контекст хороший, не гарантирует, что ответ будет на нем основан. Заземление (grounding) задается инструкциями и проверяется цитатами. Ниже - рабочий путь к ответу, который отвечает только по контексту, ссылается на фрагменты и честно признает пробелы.

Полный вид запроса и ответа поле за полем - в главе [Анатомия запроса](payload-anatomy.html); здесь мы работаем с выходом генерации.

## Решение: вызов генерации с заземлением

Вот рабочий вызов на Python через Anthropic SDK. Промпт собран на предыдущей стадии; здесь важны три вещи: жесткая системная инструкция, подписанные источники в контексте и разбор цитат из ответа.

```python
# pip install anthropic
import re
from anthropic import Anthropic

client = Anthropic()  # kluch v ANTHROPIC_API_KEY

SYSTEM = (
    "Ty otvechaesh' tol'ko na osnove peredannogo konteksta. "
    "Posle kazhdogo utverzhdeniya stav' ssylku na istochnik v vide [source]. "
    "Esli otveta v kontekste net, otvet': 'Etogo net v dokumentah.' "
    "Ne dobavlyaj fakty iz sobstvennoj pamyati."
)

def generate(prompt: str):
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = resp.content[0].text
    # Razbiraem citaty [source] iz otveta dlya proverki zazemleniya.
    cited = re.findall(r"\[([^\]]+)\]", answer)
    return answer, cited

def generate_stream(prompt: str):
    # Streaming: tokeny pribyvayut po mere generacii - menshe ozhidanie.
    with client.messages.stream(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
```

Модель и форма вызова - по [Anthropic Messages API](https://docs.anthropic.com/en/api/messages); имя модели при запуске сверьте с [Models overview](https://docs.anthropic.com/en/docs/about-claude/models). Подойдет любой вендор с чат-API - важны не имена, а три приема ниже.

## Инструкции: отвечай только по контексту

Генерация в RAG управляется системной инструкцией. Без явного "отвечай только по контексту" модель свободно добавляет то, что "знает" из обучения - и именно тут рождаются правдоподобные, но ложные факты. Сам смысл RAG по [Lewis et al., 2020](https://arxiv.org/abs/2005.11401) в том, чтобы ответ опирался на извлеченные документы, а не только на параметрическую память модели.

Инструкция в `SYSTEM` выше делает три вещи: ограничивает источник (только контекст), требует цитаты (`[source]`) и задает запасной вариант для пробела ("Этого нет в документах"). Это каркас заземления.

## Цитирование источников в ответе

Цитата - это не украшение, а механизм проверки. Когда каждое утверждение помечено `[source]`, вы можете сопоставить его с конкретным куском и убедиться, что ответ действительно опирается на данные, а не на выдумку. Именно поэтому на стадии сборки контекста каждый кусок подписывался источником: подпись в контексте -> ссылка в ответе -> проверка заземления.

Функция `generate` выше вытаскивает все `[source]` из ответа. Если модель упомянула источник, которого не было в переданном контексте, это сигнал галлюцинации цитаты - такой ответ надо отклонять или перезапрашивать.

## Борьба с выдумками (grounding/hallucination)

Галлюцинация - это уверенное, бегло сформулированное утверждение, не подкрепленное источником. Это известная и устойчивая проблема генеративных моделей: обзор [Ji et al., 2023, "Survey of Hallucination in Natural Language Generation"](https://arxiv.org/abs/2202.03629) систематизирует виды галлюцинаций и отмечает, что модели склонны порождать текст, не заземленный на входных данных.

RAG снижает галлюцинации, подкладывая проверяемый контекст, но сам по себе их не убирает. Три меры в связке: (1) жесткая инструкция "только по контексту"; (2) обязательные цитаты `[source]` с проверкой, что источник действительно был в контексте; (3) явный запасной вариант. Если в контексте нет ответа, правильный результат - честное "Этого нет в документах", а не правдоподобная выдумка. Этот отказ - фича, а не баг.

## Тон, формат и стриминг

Тон и формат задаются в той же инструкции: "отвечай кратко списком", "верни JSON с полями answer и sources". Формат - часть контракта с вашим UI.

Стриминг улучшает восприятие: вместо ожидания целого ответа токены прибывают по мере генерации, и пользователь видит текст сразу. Anthropic Messages API отдает поток через server-sent events ([Anthropic streaming](https://docs.anthropic.com/en/api/messages-streaming)); функция `generate_stream` выше именно это и делает. Важно для заземления: зеленый "готовый" ответ в UI не показываем как финальный, пока генерация не завершилась и цитаты не проверили - частичный текст может еще дописать источник.

<!-- IE-BRIEF: element=grounded-answer-reveal | purpose=показать что каждое утверждение ответа построено ИЗ конкретного чанка и заземлено на нем; ответ появляется только по мере завершения заземления, не pre-painted | inputs=NET-NEW default-export shared/data/generation.js { contextChunks:[{id,source,text}], answer:"...[source:c1]...", claims:[{text,chunkId}], noContext:bool } ([source] маркеры в ответе связывают claims с чанками) | host=[data-component="drilldown-host"] (slots stage/crumbs/zoomout/panel); grounded-answer-reveal монтируется как level-1 panel content | recipe-path=shared/js/lib/drilldown-zoom.js (shipped камера, zoom в связь утверждение<->chunk) + NET-NEW shared/js/lib/grounded-answer.js на timeline.js (пошаговое построение ответа по цитатам) | animation=каждое утверждение ответа проявляется после того как его chunk-источник подсветился (линия связи рисуется gated stroke-dashoffset); зеленый акцент заземления загорается только когда цитата сопоставлена; no-context кейс показывает fallback "Этого нет в документах" без зеленого; transform/opacity only, IO-gated, reduced-motion сразу показывает final с нарисованными связями; mobile 390/320 ответ и чанки stack; NO mascot dot -->

В статичном (без JS) виде хост показывает ответ, где после каждого утверждения стоит `[source]`, и рядом список кусков-источников - читатель видит связь без анимации. Отдельно - блок с запасным вариантом для случая "в контексте ответа нет".

## Источники

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Ji et al., 2023. Survey of Hallucination in Natural Language Generation. <https://arxiv.org/abs/2202.03629>
- Anthropic. Messages API. <https://docs.anthropic.com/en/api/messages>
- Anthropic. Streaming Messages. <https://docs.anthropic.com/en/api/messages-streaming>
- Anthropic. Models overview. <https://docs.anthropic.com/en/docs/about-claude/models>

## Попробуйте сами

- В grounded-answer-reveal наведитесь на любое утверждение ответа и проследите линию связи до его куска-источника: зеленый акцент загорается только когда цитата сопоставлена с реальным куском.
- Включите случай "нет контекста" и посмотрите, что правильный ответ - это запасной вариант "Этого нет в документах", а не правдоподобная выдумка.
- Найдите в ответе `[source]`, которого нет среди кусков контекста (галлюцинация цитаты), и обратите внимание, почему такой ответ надо отклонять.

## Что дальше

Ответ есть - но хорош ли он? Следующая остановка - глава **evaluation**: как системно измерить точность поиска и качество ответа на золотом наборе вопросов.

## Об этом рецепте

- Часть [BrewPage Cookbook](../../../../README.md).
- Опубликовано живым на [brewpage.app](https://brewpage.app).
- Источник контракта BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
