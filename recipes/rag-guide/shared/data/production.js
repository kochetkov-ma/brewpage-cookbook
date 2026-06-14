/**
 * production.js -- DATA CONTRACT for the production chapter:
 *   (1) the rollout checklist (consumed via shared/js/lib/progress.js as an
 *       earned-progress strip + the cost-calculator's checkbox list), and
 *   (2) the cost/latency calculator defaults (shared/js/lib/cost-calculator.js).
 *
 * RU-first, i18n-ready: copy fields are { ru, en }. cookbook-author owns the
 * final VALUES; interactive-engineer owns the SHAPE + the renderers.
 *
 * SHAPE
 * -----
 * Default export = {
 *   _schema:   { ... }                        // metadata; consumers skip _keys
 *   checklist: ChecklistItem[]                 // rollout gate items, route order
 *   calc:      CalcDefaults                    // cost/latency calculator inputs
 *   ui:        { ru: {...}, en: {...} }         // static labels
 * }
 *
 * ChecklistItem:
 *   { id: string, ru: string, en: string, done: boolean }   // done = initial
 *
 * CalcDefaults (one /ask request, then scaled to a month):
 *   {
 *     tokensIn:      number    // prompt tokens per request (instruction+ctx+q)
 *     tokensOut:     number    // answer tokens per request
 *     priceInPerM:   number    // USD per 1M input tokens (vendor tariff)
 *     priceOutPerM:  number    // USD per 1M output tokens
 *     qps:           number    // sustained queries per second (monthly scale)
 *     cacheHitRate:  number    // 0..1; cached requests skip generation cost
 *     latencyIndexMs: number   // index/retrieve latency (ms), the fast part
 *     latencyGenMs:   number   // generation latency (ms), the slow part
 *   }
 *
 * RULES
 *   - cost per request = tokensIn/1e6*priceInPerM + tokensOut/1e6*priceOutPerM
 *   - cacheHitRate scales monthly generation cost by (1 - cacheHitRate)
 *   - checklist ids are the progress.js mainPath ids (drilling/checking earns).
 *   - all copy ASCII-punctuation; ru strings Cyrillic.
 */

export default {
  _schema: {
    purpose:
      "Rollout checklist (earned-progress via progress.js) + cost/latency calculator defaults for the production chapter.",
    shape:
      "{ checklist:[{id,ru,en,done}], calc:{tokensIn,tokensOut,priceInPerM,priceOutPerM,qps,cacheHitRate,latencyIndexMs,latencyGenMs}, ui{ru,en} }",
    rules: [
      "cost/req = tokensIn/1e6*priceInPerM + tokensOut/1e6*priceOutPerM",
      "monthly generation cost scales by (1 - cacheHitRate)",
      "checklist ids double as the progress.js mainPath",
      "consumers MUST skip every _-prefixed key",
    ],
  },

  checklist: [
    {
      id: "budget",
      ru: "Бюджет токенов ограничен, контекст не раздут (assemble-context).",
      en: "Token budget capped, context not bloated (assemble-context).",
      done: false,
    },
    {
      id: "cache",
      ru: "Кеш ответов и эмбеддинга с разумным TTL; сброс кеша при обновлении данных.",
      en: "Answer + embedding cache with a sane TTL; cache flush on data update.",
      done: false,
    },
    {
      id: "metrics",
      ru: "Логируются задержка, стоимость, число кусков, кеш-хит по каждому запросу.",
      en: "Latency, cost, chunk count, cache-hit logged per request.",
      done: false,
    },
    {
      id: "refresh",
      ru: "Инкрементальное обновление индекса при изменении документов.",
      en: "Incremental index refresh when documents change.",
      done: false,
    },
    {
      id: "access",
      ru: "Доступ проверяется на шаге retrieve через фильтр по метаданным, а не после.",
      en: "Access enforced at retrieve via a metadata filter, not after.",
      done: false,
    },
    {
      id: "secrets",
      ru: "Ключи и токены - в секретах, не в коде, не в логах, не в промпте.",
      en: "Keys and tokens in secrets, not in code, logs, or the prompt.",
      done: false,
    },
    {
      id: "eval",
      ru: "Золотой набор и регулярные прогоны оценки до/после правки (evaluation).",
      en: "Golden set and regular before/after eval runs (evaluation).",
      done: false,
    },
    {
      id: "fallback",
      ru: 'Запасной вариант "Этого нет в документах" работает для случаев без контекста (generation).',
      en: 'The "not in the documents" fallback works for no-context cases (generation).',
      done: false,
    },
  ],

  calc: {
    tokensIn: 1240,
    tokensOut: 320,
    priceInPerM: 3.0,
    priceOutPerM: 15.0,
    qps: 2,
    cacheHitRate: 0.3,
    latencyIndexMs: 25,
    latencyGenMs: 1400,
  },

  ui: {
    ru: {
      checklistTitle: "Чеклист вывода в прод",
      calcTitle: "Калькулятор стоимости и задержки",
      tokensIn: "Токены входа",
      tokensOut: "Токены выхода",
      priceInPerM: "Цена входа за 1M, $",
      priceOutPerM: "Цена выхода за 1M, $",
      qps: "Запросов в секунду",
      cacheHitRate: "Доля кеш-хитов, %",
      perRequest: "Стоимость запроса",
      perMonth: "Оценка в месяц",
      latency: "Задержка запроса",
      latencyIndex: "поиск по индексу",
      latencyGen: "генерация",
      cachedSaving: "экономия на кеше",
      dec: "уменьшить",
      inc: "увеличить",
      done: "Готово к проду",
    },
    en: {
      checklistTitle: "Production rollout checklist",
      calcTitle: "Cost and latency calculator",
      tokensIn: "Input tokens",
      tokensOut: "Output tokens",
      priceInPerM: "Input price per 1M, $",
      priceOutPerM: "Output price per 1M, $",
      qps: "Queries per second",
      cacheHitRate: "Cache-hit rate, %",
      perRequest: "Cost per request",
      perMonth: "Monthly estimate",
      latency: "Request latency",
      latencyIndex: "index search",
      latencyGen: "generation",
      cachedSaving: "cache saving",
      dec: "decrease",
      inc: "increase",
      done: "Ready for production",
    },
  },
};
