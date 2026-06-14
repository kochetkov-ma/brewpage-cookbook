/**
 * chunking.js -- DATA CONTRACT for the "Чанкинг" (chunking) chapter.
 *
 * Consumed by:
 *   - shared/js/pages/chunking.js (page glue): builds the level-0 ratings table
 *     + per-strategy level-1 panels for the ChunkingStrategyCatalog drill
 *     (drilldown-zoom.js camera).
 *   - shared/js/lib/chunk-anim.js: the 5 core strategies that carry a didactic
 *     cut animation pass `strategy.anim` ({ mode, params }) into chunk-anim init.
 *
 * RU-first, i18n-ready: every reader-visible copy field is { ru, en }. ru is the
 * native Cyrillic from content/ru/chunking.md; en is a drafted placeholder the
 * wiring task may refine. cookbook-author owns final VALUES; interactive-engineer
 * owns the SHAPE + the renderer. ASCII punctuation only, even in ru.
 *
 * SHAPE
 * -----
 * Default export = {
 *   _schema:    metadata (skip every _-prefixed key, see dom.js stripMeta)
 *   ui:         { ...labels:{ru,en} }   shared UI strings (column heads, buttons)
 *   ratings:    { complexity:[...], tokenCost:[...], timeCost:[...], computeCost:[...] }
 *               allowed rating tokens, lowest->highest (for legend/order only)
 *   strategies: Strategy[]               the 9-row catalog, route order low->high
 * }
 *
 * Strategy:
 *   {
 *     id:          string                 stable slug, e.g. "fixed-size"
 *     name:        { ru, en }             catalog row + panel heading
 *     complexity:  rating                 "low" | "medium" | "high"
 *     tokenCost:   rating                 (allows "low-medium" etc per manuscript)
 *     timeCost:    rating
 *     computeCost: rating
 *     how:         { ru, en }             "how it works" prose (panel)
 *     when:        { ru, en }             "when to use" prose (panel + table cell)
 *     algorithm:   { ru:[step], en:[step] }  ordered step-by-step list
 *     python?:     { ru, en } | null       runnable snippet (ASCII); ru==en (comment-free), null if none
 *     anim?:       AnimSpec | null         present only for the 5 core strategies
 *     schematic?:  { ru, en } | null       static schematic caption for non-anim
 *   }
 *
 * AnimSpec (passed verbatim to chunk-anim.js init as config.anim):
 *   {
 *     mode:   "fixed"|"sliding"|"recursive"|"structure"|"semantic"
 *     params: mode-specific (documented per mode below)
 *     caption:{ ru, en }                  one-line "what you are seeing"
 *   }
 *
 * chunk-anim modes + their params (the 5 the module switches on):
 *   fixed:     { text, size }                       cuts at 0,size,2*size,...
 *   sliding:   { text, size, overlap }              window slides by size-overlap
 *   recursive: { text, separators[], size }         descent down separator levels
 *   structure: { text, boundaries[], forbidden[] }  cuts only at boundary indices
 *   semantic:  { sentences[], sims[], threshold }   cut where neighbour sim<threshold
 * (text uses ASCII transliteration to keep cut positions stable across fonts.)
 *
 * RULES
 *   - Every reader-visible string is { ru, en }. Code (python, anim text) is ASCII.
 *   - rating tokens stay within the documented vocabulary (low/medium/high + hyphenated).
 *   - Only the 5 core strategies carry anim; the other 4 carry schematic (no anim).
 *   - Do not rename fields without a PR note (CA/IE/SB match without guessing).
 */

const _schema = {
  purpose: "9-strategy chunking catalog + per-strategy algorithm/python/anim for the ChunkingStrategyCatalog drill",
  consumers: ["shared/js/pages/chunking.js", "shared/js/lib/chunk-anim.js"],
  topLevelKeys: ["_schema", "ui", "ratings", "strategies"],
  animModes: ["fixed", "sliding", "recursive", "structure", "semantic"],
  ratingVocabulary: ["low", "low-medium", "medium", "medium-high", "high"],
};

const ui = {
  colStrategy: { ru: "Стратегия", en: "Strategy" },
  colComplexity: { ru: "Сложность", en: "Complexity" },
  colTokenCost: { ru: "Токены", en: "Token cost" },
  colTimeCost: { ru: "Время", en: "Time cost" },
  colComputeCost: { ru: "Вычисления", en: "Compute cost" },
  colWhen: { ru: "Когда применять", en: "When to use" },
  drillHint: { ru: "Нажмите строку, чтобы раскрыть стратегию", en: "Open a row to drill into a strategy" },
  howHead: { ru: "Как работает", en: "How it works" },
  whenHead: { ru: "Когда применять", en: "When to use" },
  algoHead: { ru: "Алгоритм", en: "Algorithm" },
  pythonHead: { ru: "Рабочий Python", en: "Runnable Python" },
  animHead: { ru: "Анимация реза", en: "Cut animation" },
  schematicHead: { ru: "Схема", en: "Schematic" },
};

const ratings = {
  complexity: ["low", "medium", "high"],
  tokenCost: ["low", "low-medium", "medium", "medium-high", "high"],
  timeCost: ["low", "low-medium", "medium", "medium-high", "high"],
  computeCost: ["low", "low-medium", "medium", "medium-high", "high"],
};

// ASCII-transliterated sample doc (keeps cut positions glyph-stable across fonts).
const DOC_FIXED =
  "RAG podmeshivaet vashi dokumenty v zapros k modeli. " +
  "Korpus rezhut na chunki i kazhdyj prevrashchayut v vektor. " +
  "Vektory hranyat v indekse i ishchut blizhajshie po smyslu.";

const DOC_SLIDING =
  "RAG podmeshivaet vashi dokumenty v zapros k modeli. " +
  "Korpus rezhut na chunki i kazhdyj prevrashchayut v vektor.";

const DOC_RECURSIVE =
  "RAG podmeshivaet dokumenty v zapros.\n\n" +
  "Korpus rezhut na chunki. Kazhdyj chunk embeddyat.\n\n" +
  "Vektory hranyat v indekse i ishchut blizhajshie po smyslu.";

const DOC_STRUCTURE =
  "# Otpuska\n" +
  "Posle 3 let stazha polagaetsya 28 dnej otpuska. " +
  "Otpusk oformlyaetsya zayavleniem za 2 nedeli. " +
  "Neispolzovannye dni perenosyatsya na sleduyushchij god.";

const PY_FIXED = [
  "def fixed_size_chunks(text: str, size: int) -> list[str]:",
  "    if size <= 0:",
  '        raise ValueError("size must be positive")',
  "    return [text[i:i + size] for i in range(0, len(text), size)]",
].join("\n");

const PY_SLIDING = [
  "def sliding_window_chunks(text: str, size: int, overlap: int) -> list[str]:",
  "    if size <= 0:",
  '        raise ValueError("size must be positive")',
  "    if not 0 <= overlap < size:",
  '        raise ValueError("overlap must satisfy 0 <= overlap < size")',
  "    step = size - overlap",
  "    chunks = []",
  "    i = 0",
  "    while i < len(text):",
  "        chunks.append(text[i:i + size])",
  "        i += step",
  "    return chunks",
].join("\n");

const PY_RECURSIVE = [
  "def recursive_chunks(text: str, size: int,",
  "                     separators: list[str] | None = None) -> list[str]:",
  '    if separators is None:',
  '        separators = ["\\n\\n", "\\n", " ", ""]',
  "    if len(text) <= size:",
  "        return [text] if text else []",
  "    sep = separators[0]",
  "    rest = separators[1:]",
  '    parts = list(text) if sep == "" else text.split(sep)',
  "    chunks: list[str] = []",
  '    buf = ""',
  '    glue = "" if sep == "" else sep',
  "    for part in parts:",
  "        candidate = part if not buf else buf + glue + part",
  "        if len(candidate) <= size:",
  "            buf = candidate",
  "            continue",
  "        if buf:",
  "            chunks.append(buf)",
  '            buf = ""',
  "        if len(part) <= size:",
  "            buf = part",
  "        elif rest:",
  "            chunks.extend(recursive_chunks(part, size, rest))",
  "        else:",
  "            chunks.extend(part[i:i + size] for i in range(0, len(part), size))",
  "    if buf:",
  "        chunks.append(buf)",
  "    return chunks",
].join("\n");

const PY_MARKDOWN = [
  "import re",
  "",
  "def markdown_header_chunks(text: str, size: int) -> list[dict]:",
  "    sections: list[dict] = []",
  '    heading = ""',
  "    buf: list[str] = []",
  "    def flush() -> None:",
  '        body = "\\n".join(buf).strip()',
  "        if body:",
  '            sections.append({"heading": heading, "text": body})',
  "    for line in text.splitlines():",
  '        m = re.match(r"^(#{1,6})\\s+(.*)$", line)',
  "        if m:",
  "            flush()",
  "            buf = []",
  "            heading = m.group(2).strip()",
  "        else:",
  "            buf.append(line)",
  "    flush()",
  "    chunks: list[dict] = []",
  "    for sec in sections:",
  '        body = sec["text"]',
  "        if len(body) <= size:",
  "            chunks.append(sec)",
  "            continue",
  "        for i in range(0, len(body), size):",
  '            chunks.append({"heading": sec["heading"], "text": body[i:i + size]})',
  "    return chunks",
].join("\n");

const strategies = [
  {
    id: "fixed-size",
    name: { ru: "fixed-size: рез каждые N единиц", en: "fixed-size: cut every N units" },
    complexity: "low",
    tokenCost: "low",
    timeCost: "low",
    computeCost: "low",
    how: {
      ru: "Самая простая стратегия: идем по тексту и отрезаем ровно N единиц подряд, игнорируя смысловые границы. Размер каждого чанка предсказуем; границы могут попадать посередине слова или предложения.",
      en: "The simplest strategy: walk the text and cut exactly N units in a row, ignoring meaning boundaries. Every chunk size is predictable; cuts may land inside a word or sentence.",
    },
    when: {
      ru: "Быстрый прототип, однородный текст без явной структуры; нужна предсказуемость размера чанка.",
      en: "Fast prototype, homogeneous text with no clear structure; you need predictable chunk size.",
    },
    algorithm: {
      ru: [
        "Задайте размер окна size (в символах или токенах).",
        "Поставьте курсор i = 0.",
        "Отрежьте подстроку text[i : i + size] - это очередной чанк.",
        "Сдвиньте курсор: i = i + size.",
        "Повторяйте, пока i < len(text).",
        "Последний чанк может оказаться короче size - это нормально.",
      ],
      en: [
        "Set the window size (in characters or tokens).",
        "Put a cursor at i = 0.",
        "Cut the substring text[i : i + size] - that is the next chunk.",
        "Advance the cursor: i = i + size.",
        "Repeat while i < len(text).",
        "The last chunk may be shorter than size - that is fine.",
      ],
    },
    python: { ru: PY_FIXED, en: PY_FIXED },
    anim: {
      mode: "fixed",
      params: { text: DOC_FIXED, size: 60 },
      caption: {
        ru: "Резы падают через равные интервалы независимо от границ слов - рез может пасть посередине слова.",
        en: "Cuts fall at equal intervals regardless of word boundaries - a cut can land mid-word.",
      },
    },
    schematic: null,
  },
  {
    id: "sliding-window",
    name: { ru: "sliding-window: окно с перекрытием", en: "sliding-window: overlapping window" },
    complexity: "low",
    tokenCost: "medium",
    timeCost: "low",
    computeCost: "low",
    how: {
      ru: "То же fixed-size окно, но соседние чанки перекрываются на overlap единиц: каждый следующий чанк начинается на overlap раньше. Так факт, разорванный границей, целиком попадает хотя бы в один чанк.",
      en: "Same fixed-size window, but neighbouring chunks overlap by overlap units: each next chunk starts overlap earlier. A fact split by a boundary still lands whole in at least one chunk.",
    },
    when: {
      ru: "Факты часто попадают на границы; надо гарантировать, что пограничный смысл не потеряется.",
      en: "Facts often land on boundaries; you must guarantee boundary meaning is not lost.",
    },
    algorithm: {
      ru: [
        "Задайте size и overlap, причем 0 <= overlap < size.",
        "Вычислите шаг: step = size - overlap.",
        "Поставьте курсор i = 0.",
        "Отрежьте чанк text[i : i + size].",
        "Сдвиньте курсор на шаг: i = i + step.",
        "Повторяйте, пока i < len(text); хвост overlap повторяется в начале следующего чанка.",
      ],
      en: [
        "Set size and overlap, with 0 <= overlap < size.",
        "Compute the step: step = size - overlap.",
        "Put a cursor at i = 0.",
        "Cut the chunk text[i : i + size].",
        "Advance the cursor by the step: i = i + step.",
        "Repeat while i < len(text); the overlap tail repeats at the start of the next chunk.",
      ],
    },
    python: { ru: PY_SLIDING, en: PY_SLIDING },
    anim: {
      mode: "sliding",
      params: { text: DOC_SLIDING, size: 50, overlap: 15 },
      caption: {
        ru: "Окно едет по тексту с шагом step = size - overlap; зона перекрытия повторяется в соседнем чанке.",
        en: "The window slides by step = size - overlap; the overlap zone repeats in the neighbour chunk.",
      },
    },
    schematic: null,
  },
  {
    id: "recursive",
    name: { ru: "recursive: рез по приоритету разделителей", en: "recursive: separator-hierarchy split" },
    complexity: "medium",
    tokenCost: "low",
    timeCost: "low",
    computeCost: "low",
    how: {
      ru: "Режем по приоритетному списку разделителей - сначала по крупным (абзац), потом по мелким (строка, предложение, пробел), пока кусок не влезет в лимит size. Если кусок все еще больше лимита, к нему рекурсивно применяется следующий разделитель.",
      en: "Cut by a priority list of separators - first by the coarse one (paragraph), then by finer ones (line, sentence, space) until each piece fits the size limit. If a piece is still too big, the next separator is applied recursively.",
    },
    when: {
      ru: "Универсальный выбор по умолчанию для прозы: режем по абзацам и предложениям, но жестко держим лимит размера.",
      en: "Universal default for prose: cut by paragraphs and sentences, but hard-hold the size limit.",
    },
    algorithm: {
      ru: [
        'Задайте size и список разделителей separators от крупного к мелкому, например ["\\n\\n", "\\n", " ", ""].',
        "Возьмите первый разделитель и разбейте текст по нему на части.",
        "Если длина части <= size, это готовый кусок.",
        "Если часть длиннее size, рекурсивно примените СЛЕДУЮЩИЙ разделитель.",
        'Если разделители кончились, режьте жестко fixed-size (последний разделитель "" - рез по символам).',
        "Склейте соседние мелкие куски обратно, пока сумма не превысит size.",
      ],
      en: [
        'Set size and an ordered separators list coarse->fine, e.g. ["\\n\\n", "\\n", " ", ""].',
        "Take the first separator and split the text by it into parts.",
        "If a part length is <= size, it is a finished piece.",
        "If a part is longer than size, recursively apply the NEXT separator.",
        'If separators run out, fall back to a hard fixed-size cut (the last "" separator means per-character).',
        "Glue adjacent small pieces back together until the sum would exceed size.",
      ],
    },
    python: { ru: PY_RECURSIVE, en: PY_RECURSIVE },
    anim: {
      mode: "recursive",
      params: { text: DOC_RECURSIVE, separators: ["\n\n", "\n", " ", ""], size: 70 },
      caption: {
        ru: "Сначала рез по абзацам; куски, не влезшие в size, режутся по предложениям, потом по словам - спуск по дереву.",
        en: "First cut on paragraphs; pieces over size are cut on sentences, then words - a descent down the tree.",
      },
    },
    schematic: null,
  },
  {
    id: "structure-aware",
    name: { ru: "structure-aware: рез по границам структуры", en: "structure-aware: cut on structure boundaries" },
    complexity: "medium",
    tokenCost: "low",
    timeCost: "medium",
    computeCost: "low-medium",
    how: {
      ru: "Режем не по счету символов, а по естественным границам: концам предложений, заголовкам Markdown, элементам AST кода. Чанк совпадает с законченной мыслью, но это зависит от формата входа: нужны надежные границы.",
      en: "Cut by natural boundaries, not character count: sentence ends, Markdown headings, code AST nodes. A chunk matches a complete thought, but it depends on the input format having reliable boundaries.",
    },
    when: {
      ru: "Есть надежная структура (заголовки Markdown, AST кода, границы предложений), которую нужно сохранить.",
      en: "Reliable structure exists (Markdown headings, code AST, sentence boundaries) and is worth preserving.",
    },
    algorithm: {
      ru: [
        "Выберите тип границ под формат: предложения для прозы, заголовки для Markdown, узлы AST для кода.",
        "Прогоните текст через соответствующий разбор - получите список элементов.",
        "Накапливайте элементы в текущий чанк, пока суммарный размер <= size.",
        "Как только следующий элемент не влезает - закройте чанк и начните новый.",
        "Никогда не режьте внутри элемента, чтобы не разорвать законченную мысль.",
        "Если один элемент сам по себе больше size - только тогда примените к нему запасной fixed-size рез.",
      ],
      en: [
        "Pick the boundary type for the format: sentences for prose, headings for Markdown, AST nodes for code.",
        "Run the text through the matching parse to get a list of elements.",
        "Accumulate elements into the current chunk while the total size <= size.",
        "As soon as the next element does not fit - close the chunk and start a new one.",
        "Never cut inside an element so a complete thought is not torn apart.",
        "Only if a single element is larger than size, apply a fallback fixed-size cut to it.",
      ],
    },
    python: { ru: PY_MARKDOWN, en: PY_MARKDOWN },
    anim: {
      mode: "structure",
      // boundaries: char indices where a cut is allowed (end of heading + sentence ends).
      // forbidden: char indices of mid-sentence positions briefly flagged + skipped.
      params: {
        text: DOC_STRUCTURE,
        boundaries: [9, 56, 102, 153],
        forbidden: [30, 78, 125],
      },
      caption: {
        ru: "Резы ложатся только на концы предложений и после заголовка, никогда внутри фразы.",
        en: "Cuts land only at sentence ends and after the heading, never inside a phrase.",
      },
    },
    schematic: null,
  },
  {
    id: "markdown-header",
    name: { ru: "markdown: рез по заголовкам документа", en: "markdown: split on document headers" },
    complexity: "medium",
    tokenCost: "low",
    timeCost: "low-medium",
    computeCost: "low",
    how: {
      ru: "Частный, но очень частый случай structure-aware: документ уже размечен заголовками Markdown. Режем по заголовкам, каждую секцию делаем чанком, а уровень и текст заголовка кладем в метаданные.",
      en: "A common special case of structure-aware: the document is already marked up with Markdown headings. Cut by headings, make each section a chunk, and put the heading level and text into metadata.",
    },
    when: {
      ru: "Документ в Markdown с заголовками: режем по #/##, а уровень заголовков кладем в метаданные чанка.",
      en: "A Markdown document with headings: cut on #/##, and store the heading level in the chunk metadata.",
    },
    algorithm: {
      ru: [
        "Идите по строкам документа и ловите строки-заголовки (#..######).",
        "На каждом заголовке закрывайте предыдущую секцию и открывайте новую, запоминая уровень и текст.",
        "Тело между заголовками копите в текущую секцию.",
        "Превратите каждую секцию в чанк, прикрепив метаданные заголовка (уровень, путь заголовков).",
        "Если секция длиннее size, примените запасной recursive или fixed-size рез, сохранив те же метаданные.",
      ],
      en: [
        "Walk the document lines and catch heading lines (#..######).",
        "On each heading, close the previous section and open a new one, remembering its level and text.",
        "Accumulate the body between headings into the current section.",
        "Turn each section into a chunk, attaching heading metadata (level, heading path).",
        "If a section is longer than size, apply a fallback recursive or fixed-size cut, keeping the same metadata.",
      ],
    },
    python: { ru: PY_MARKDOWN, en: PY_MARKDOWN },
    anim: null,
    schematic: {
      ru: "Каждая секция между заголовками # становится отдельным чанком; уровень заголовка едет в метаданные.",
      en: "Each section between # headings becomes its own chunk; the heading level rides along in metadata.",
    },
  },
  {
    id: "parent-document",
    name: { ru: "parent-document: индексируем мелкое, возвращаем крупное", en: "parent-document: index small, return big" },
    complexity: "medium",
    tokenCost: "medium",
    timeCost: "medium",
    computeCost: "low-medium",
    how: {
      ru: "Разводим единицу поиска и единицу контекста. Документ режется дважды: на мелкие дочерние чанки (точное попадание) и крупные родительские (широкий контекст). В индекс кладут только мелкие, но у каждого ссылка на родителя; в контекст подкладывают родителя.",
      en: "Split the unit of search from the unit of context. The document is cut twice: into small child chunks (precise match) and large parent chunks (broad context). Only the small ones are indexed, each linking to its parent; the parent is what gets fed into context.",
    },
    when: {
      ru: "Нужна точность мелких чанков на поиске, но широкий контекст в ответе: индексируем мелкие, возвращаем родительские.",
      en: "You need small-chunk precision at search time but broad context in the answer: index the small ones, return the parents.",
    },
    algorithm: {
      ru: [
        "Нарежьте документ на крупные родительские чанки и присвойте каждому parent_id.",
        "Каждый родительский чанк нарежьте на мелкие дочерние со ссылкой parent_id.",
        "В векторный индекс положите ТОЛЬКО дочерние чанки; родительские храните отдельно по parent_id.",
        "На запросе найдите top-k дочерних чанков обычным семантическим поиском.",
        "По их parent_id достаньте родительские чанки (дедуплицируя) и подложите в контекст именно родителей.",
      ],
      en: [
        "Cut the document into large parent chunks and give each a parent_id.",
        "Cut each parent chunk into small child chunks carrying a parent_id link.",
        "Index ONLY the child chunks; keep the parents separately, keyed by parent_id.",
        "At query time find the top-k child chunks with ordinary semantic search.",
        "Use their parent_id to fetch the parent chunks (deduplicating) and feed the parents into context.",
      ],
    },
    python: null,
    anim: null,
    schematic: {
      ru: "Мелкие дочерние чанки в индексе ссылаются на крупного родителя; на попадание возвращается родитель (small-to-big).",
      en: "Small child chunks in the index point at a big parent; on a hit the parent is returned (small-to-big).",
    },
  },
  {
    id: "late-chunking",
    name: { ru: "late chunking: эмбеддинг целого, потом пулинг", en: "late chunking: embed whole, then pool" },
    complexity: "high",
    tokenCost: "low",
    timeCost: "medium",
    computeCost: "medium-high",
    how: {
      ru: "Обычный конвейер сначала режет, потом эмбеддит каждый чанк изолированно. Late chunking меняет порядок: сначала прогоняем весь документ через long-context модель и получаем токенные векторы, видевшие весь текст, и только потом пулим их по границам чанков. Каждый вектор чанка несет контекст всего документа.",
      en: "The usual pipeline cuts first, then embeds each chunk in isolation. Late chunking flips the order: first run the whole document through a long-context model to get token vectors that have seen all the text, then pool them along chunk boundaries. Each chunk vector carries document-wide context.",
    },
    when: {
      ru: "Есть long-context модель эмбеддингов; чанк должен нести контекст всего документа, а не только своего фрагмента.",
      en: "A long-context embedding model is available; each chunk must carry document-wide context, not just its own span.",
    },
    algorithm: {
      ru: [
        "Прогоните весь документ через long-context модель и получите токенные векторы (по вектору на токен).",
        "Определите границы чанков обычным сплиттером (любая стратегия из каталога).",
        "Для каждого чанка возьмите попавшие в его границы токенные векторы и спулите их (среднее) в один вектор чанка.",
        "В индекс кладите эти контекстно-обогащенные векторы чанков; текст чанков остается прежним.",
      ],
      en: [
        "Run the whole document through a long-context model to get token vectors (one vector per token).",
        "Determine chunk boundaries with an ordinary splitter (any catalog strategy).",
        "For each chunk, take the token vectors that fall inside its boundaries and pool them (mean) into one chunk vector.",
        "Index these context-enriched chunk vectors; the chunk text stays the same.",
      ],
    },
    python: null,
    anim: null,
    schematic: {
      ru: "Весь документ эмбеддится одним проходом; токенные векторы потом усредняются по границам чанков (embed-whole-then-pool).",
      en: "The whole document is embedded in one pass; token vectors are then averaged along chunk boundaries (embed-whole-then-pool).",
    },
  },
  {
    id: "contextual-retrieval",
    name: { ru: "contextual retrieval: контекст перед эмбеддингом", en: "contextual retrieval: context before embedding" },
    complexity: "high",
    tokenCost: "high",
    timeCost: "high",
    computeCost: "high",
    how: {
      ru: "Перед эмбеддингом чанку дописывают короткое поясняющее предложение, ставящее фрагмент в контекст всего документа. Пояснение генерирует LLM по паре документ+чанк. Эмбеддится и индексируется уже чанк-плюс-контекст, поэтому изолированный фрагмент перестает быть непонятным вне документа.",
      en: "Before embedding, a short explaining sentence is prepended to the chunk, placing it in the context of the whole document. An LLM generates that blurb from the document+chunk pair. The chunk-plus-context is what gets embedded and indexed, so an isolated chunk is no longer meaningless out of context.",
    },
    when: {
      ru: "Изолированные чанки теряют смысл без документа; цена LLM-обогащения каждого чанка оправдана качеством поиска.",
      en: "Isolated chunks lose meaning without the document; the cost of LLM-enriching each chunk is justified by retrieval quality.",
    },
    algorithm: {
      ru: [
        "Нарежьте документ любым сплиттером из каталога.",
        "Для каждого чанка попросите LLM написать короткий контекст: где этот фрагмент и о чем он, в одну-две фразы.",
        "Допишите этот контекст в начало чанка.",
        "Эмбеддите и индексируйте уже обогащенный чанк (контекст плюс исходный текст).",
        "На поиске работаете как обычно; в ответ при желании подставляете исходный текст чанка без служебного контекста.",
      ],
      en: [
        "Cut the document with any splitter from the catalog.",
        "For each chunk, ask an LLM to write a short context: where the fragment sits and what it is about, in one or two sentences.",
        "Prepend that context to the chunk.",
        "Embed and index the enriched chunk (context plus the original text).",
        "Search as usual; optionally substitute the original chunk text without the helper context in the answer.",
      ],
    },
    python: null,
    anim: null,
    schematic: {
      ru: "К каждому чанку перед эмбеддингом дописывается LLM-сгенерированный поясняющий контекст (blurb prepended before embed).",
      en: "An LLM-generated explaining blurb is prepended to each chunk before embedding (blurb prepended before embed).",
    },
  },
  {
    id: "semantic",
    name: { ru: "semantic: рез по смысловым сдвигам", en: "semantic: cut on meaning shifts" },
    complexity: "high",
    tokenCost: "high",
    timeCost: "high",
    computeCost: "high",
    how: {
      ru: "Решение о резе принимается по смыслу. Типичный подход: разбить текст на предложения, посчитать эмбеддинг каждого и ставить границу там, где соседние предложения резко расходятся по смыслу (падает косинусная близость). Вариант - спросить LLM, где логично разрезать.",
      en: "The cut decision is made by meaning. A typical approach: split into sentences, embed each, and place a boundary where neighbouring sentences diverge sharply in meaning (cosine similarity drops). A variant asks an LLM where to cut.",
    },
    when: {
      ru: "Качество границ критично и оправдывает цену; рез по смысловым сдвигам, а не по символам.",
      en: "Boundary quality is critical and justifies the cost; cut on meaning shifts, not on characters.",
    },
    algorithm: {
      ru: [
        "Разбейте текст на предложения (базовая сегментация, как в structure-aware).",
        "Посчитайте эмбеддинг каждого предложения одной моделью эмбеддингов.",
        "Идите по соседним парам предложений и считайте косинусную близость между соседями.",
        "Отметьте кандидаты границ там, где близость падает ниже порога (резкий смысловой сдвиг).",
        "Сгруппируйте предложения между границами в чанки; следите, чтобы чанк не превысил size.",
        "Опционально: вместо порога спросите LLM, где разрезать данный фрагмент.",
      ],
      en: [
        "Split the text into sentences (basic segmentation, as in structure-aware).",
        "Embed each sentence with one embedding model.",
        "Walk adjacent sentence pairs and compute the cosine similarity between neighbours.",
        "Mark boundary candidates where similarity drops below the threshold (a sharp meaning shift).",
        "Group sentences between boundaries into chunks; keep a chunk from exceeding size.",
        "Optionally: instead of a threshold, ask an LLM where to cut this fragment.",
      ],
    },
    python: null,
    anim: {
      mode: "semantic",
      // sentences shown as rows; sims[i] = neighbour similarity between sentence i and i+1.
      // A cut is placed after sentence i when sims[i] < threshold.
      params: {
        sentences: [
          "RAG podmeshivaet dokumenty v zapros.",
          "Korpus rezhut na chunki.",
          "Kazhdyj chunk prevrashchayut v vektor.",
          "Otpusk sostavlyaet 28 dnej v god.",
          "Bolnichnyj oplachivaetsya s pervogo dnya.",
        ],
        sims: [0.81, 0.78, 0.34, 0.71],
        threshold: 0.5,
      },
      caption: {
        ru: "Граница ставится там, где соседние предложения резко расходятся по смыслу (косинус падает ниже порога), а не на равных интервалах.",
        en: "A boundary is placed where neighbouring sentences diverge in meaning (cosine drops below the threshold), not at equal intervals.",
      },
    },
    schematic: null,
  },
];

export default { _schema, ui, ratings, strategies };
