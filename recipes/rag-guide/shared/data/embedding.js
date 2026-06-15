/**
 * embedding.js -- DATA CONTRACT for the "Эмбеддинг" chapter centerpiece
 * (element=embedding-materialize). Consumed by shared/js/lib/process-anim.js,
 * which renders doc -> chunks -> vectors and sequences `steps` (split | embed |
 * store) on its own timeline.js clock. The embedding chapter leads on the
 * `embed` step: each chunk card materializes into a fixed-length vector card
 * (dim 1536) -- the representation changes, the text does not.
 *
 * Drilled into the Embedding node via drilldown-zoom.js; the page glue imports
 * THIS module (default export) and hands it as config.data to process-anim init
 * -- NOT fetched via data-*-src. RU-first; every copy field is { ru, en } so the
 * i18n store (i18n.js) resolves by active language (RU default). ASCII
 * punctuation only, incl. inside Cyrillic. Code-ish text (chunk bodies, vector
 * readouts) stays ASCII-Latin to mirror the chapter's runnable Python.
 *
 * SHAPE
 * -----
 * Default export = {
 *   _schema,                              // in-file metadata (consumers SKIP _*)
 *   doc:    { id, title:{ru,en}, text:{ru,en} },   // source text the chunks cut from
 *   chunks: [{ id, fromChar, toChar, text:{ru,en} }],  // one chunk per vector (1:1)
 *   vectors:[{ id, chunkId, dim, values[] }],      // values = SHORT layout stub
 *   steps:  [{ id, kind, caption:{ru,en}, targets[], duration }]
 * }
 *
 * process-anim.js render contract (see that module):
 *   - kind "split"  -> chunk cards emerge from the doc (targets = chunk ids)
 *   - kind "embed"  -> each chunk's vector card materializes (targets = chunk ids)
 *   - kind "store"  -> vectors settle into the index (targets = vector ids)
 *   - doc.text is rendered as per-chunk spans, so fromChar/toChar MUST tile
 *     doc.text exactly (no gaps/overlaps) for the split highlight to land.
 *
 * RULES
 *   - one vector per chunk, strictly 1:1: vector.chunkId references its chunk id
 *     (v1 -> c1, v2 -> c2, v3 -> c3); the chapter teaches this mapping.
 *   - dim is the REAL model width (1536, text-embedding-3-small); values[] is a
 *     3-number layout STUB only -- never a real embedding, never the full 1536.
 *   - fromChar/toChar are PER-LANGUAGE { ru, en } char offsets into the
 *     active-lang doc.text; doc.text and chunk.text are now per language (RU
 *     Cyrillic, EN English), so the offsets are stored per language and tile
 *     each script exactly. process-anim.js slices the active-lang doc.text by
 *     these (and, since doc.text == the concatenation of the active-lang chunk
 *     texts, also tiles correctly via its cursor fallback). These are
 *     JS-rendered data (no static no-JS HTML), so Cyrillic here is correct.
 *   - copy fields are { ru, en }; consumers resolve by active lang. ASCII only.
 *   - underscore-prefixed keys (_schema) are metadata; consumers MUST skip them.
 */

const B = (ru, en) => ({ ru, en });

// Per-language source doc. doc.text for each language is EXACTLY the
// concatenation of that language's chunk texts (see chunks below), so the
// fromChar/toChar offsets tile the active-lang doc.text with no gaps/overlaps.
// RU is real Cyrillic, EN is real English (canonical sample corpus shared across
// the guide). JS-rendered data => Cyrillic here is correct.
const DOC_RU =
  "Гарантия на электронику составляет 12 месяцев с даты покупки. " +
  "Командировки оформляются через портал не позднее чем за 3 дня. " +
  "Больничный оплачивается с первого дня.";
const DOC_EN =
  "The warranty on electronics is 12 months from the date of purchase. " +
  "Business trips are arranged through the portal no later than 3 days in advance. " +
  "Sick leave is paid from the first day.";

export default {
  _schema: {
    purpose:
      "embedding-materialize scene data: doc -> chunks -> vectors, with the embed step as the didactic centerpiece (chunk -> vector, dim 1536). Rendered by process-anim.js, sequenced by timeline.js.",
    shape: {
      doc: "{ id, title:{ru,en}, text:{ru,en} } -- source text; text rendered as per-chunk spans.",
      chunks:
        "[{ id, fromChar:{ru,en}, toChar:{ru,en}, text:{ru,en} }] -- ordered chunks; fromChar/toChar are per-language char offsets into the active-lang doc.text and MUST tile it exactly (doc.text == concatenation of active-lang chunk texts).",
      vectors:
        "[{ id, chunkId, dim, values[] }] -- one vector per chunk (1:1 via chunkId); dim=1536 real width; values[] is a 3-number layout stub, NOT a real embedding.",
      steps:
        "[{ id, kind, caption:{ru,en}, targets[], duration }] -- played in array order; kind in split|embed|store.",
    },
    step: {
      kind: "split -> chunk cards emerge (targets=chunk ids); embed -> vector cards materialize (targets=chunk ids); store -> vectors settle into index (targets=vector ids).",
      duration: "ms the step animates; timeline.js may scale by speed; reduced-motion snaps to end.",
    },
    rules: [
      "one vector per chunk, strictly 1:1 (vector.chunkId -> chunk.id: v1->c1, v2->c2, v3->c3).",
      "dim=1536 is the real model width; values[] is a 3-number layout stub only, never a real embedding, never the full 1536.",
      "fromChar/toChar are per-language { ru, en } offsets; for each language doc.text == the concatenation of that language's chunk texts, so the offsets tile doc.text exactly (no gaps/overlaps) and the split highlight lands.",
      "every copy field is { ru, en }; consumers resolve by active lang. ASCII punctuation only.",
      "transform/opacity only; reduced-motion jumps to end state over the same DOM (process-anim.js).",
      "underscore-prefixed keys (_schema) are metadata and MUST be skipped by consumers.",
    ],
  },

  doc: {
    id: "doc-embed-ru",
    title: B("FAQ магазина (исходный документ)", "Store FAQ (source document)"),
    text: B(DOC_RU, DOC_EN),
  },

  // chunks tile the active-lang doc.text exactly. Offsets per language:
  //   RU: [0,62) [62,125) [125,163)   EN: [0,68) [68,148) [148,186)
  chunks: [
    {
      id: "c1",
      fromChar: B(0, 0),
      toChar: B(62, 68),
      text: B(
        "Гарантия на электронику составляет 12 месяцев с даты покупки. ",
        "The warranty on electronics is 12 months from the date of purchase. "
      ),
    },
    {
      id: "c2",
      fromChar: B(62, 68),
      toChar: B(125, 148),
      text: B(
        "Командировки оформляются через портал не позднее чем за 3 дня. ",
        "Business trips are arranged through the portal no later than 3 days in advance. "
      ),
    },
    {
      id: "c3",
      fromChar: B(125, 148),
      toChar: B(163, 186),
      text: B(
        "Больничный оплачивается с первого дня.",
        "Sick leave is paid from the first day."
      ),
    },
  ],

  // one vector per chunk (1:1); dim is real (1536), values[] is a 3-number stub
  vectors: [
    { id: "v1", chunkId: "c1", dim: 1536, values: [0.018, -0.047, 0.091] },
    { id: "v2", chunkId: "c2", dim: 1536, values: [-0.029, 0.063, 0.012] },
    { id: "v3", chunkId: "c3", dim: 1536, values: [0.074, 0.021, -0.055] },
  ],

  steps: [
    {
      id: "s1",
      kind: "split",
      caption: B(
        "Шаг 1: берем готовые чанки - по одному куску текста на фрагмент.",
        "Step 1: take the ready chunks -- one piece of text per fragment."
      ),
      targets: ["c1", "c2", "c3"],
      duration: 800,
    },
    {
      id: "s2",
      kind: "embed",
      caption: B(
        "Шаг 2: каждый чанк превращается в вектор (длина зависит от модели, здесь 1536 для text-embedding-3-small) - меняется представление, не текст.",
        "Step 2: each chunk becomes a vector (length depends on the model, here 1536 for text-embedding-3-small) -- the representation changes, not the text."
      ),
      targets: ["c1", "c2", "c3"],
      duration: 1200,
    },
    {
      id: "s3",
      kind: "store",
      caption: B(
        "Шаг 3: векторы v1..v3 уходят в индекс; связь чанк -> вектор строго один-к-одному.",
        "Step 3: vectors v1..v3 go to the index; the chunk -> vector mapping is strictly one-to-one."
      ),
      targets: ["v1", "v2", "v3"],
      duration: 800,
    },
  ],
};
