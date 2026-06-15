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
 *   - fromChar/toChar index into the ACTIVE-LANG doc.text; keep ru/en lengths so
 *     the offsets tile both (here ASCII-Latin doc.text is shared verbatim).
 *   - copy fields are { ru, en }; consumers resolve by active lang. ASCII only.
 *   - underscore-prefixed keys (_schema) are metadata; consumers MUST skip them.
 */

const B = (ru, en) => ({ ru, en });

// doc.text is identical across langs here (ASCII-Latin source, like the chapter
// Python). Offsets below index this exact string for the split highlight.
const DOC_TEXT =
  "Politika vozvrata sredstv: vernut' tovar mozhno v techenie 30 dnej. " +
  "Garantiya na elektroniku sostavlyaet 12 mesyacev s daty pokupki. " +
  "Dostavka po gorodu zanimaet odin rabochij den'.";

export default {
  _schema: {
    purpose:
      "embedding-materialize scene data: doc -> chunks -> vectors, with the embed step as the didactic centerpiece (chunk -> vector, dim 1536). Rendered by process-anim.js, sequenced by timeline.js.",
    shape: {
      doc: "{ id, title:{ru,en}, text:{ru,en} } -- source text; text rendered as per-chunk spans.",
      chunks:
        "[{ id, fromChar, toChar, text:{ru,en} }] -- ordered chunks; fromChar/toChar index into doc.text (active lang) and MUST tile it exactly.",
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
      "fromChar/toChar must tile doc.text exactly (no gaps/overlaps) so the split highlight lands.",
      "every copy field is { ru, en }; consumers resolve by active lang. ASCII punctuation only.",
      "transform/opacity only; reduced-motion jumps to end state over the same DOM (process-anim.js).",
      "underscore-prefixed keys (_schema) are metadata and MUST be skipped by consumers.",
    ],
  },

  doc: {
    id: "doc-embed-ru",
    title: B("FAQ magazina (ishodnyj dokument)", "Store FAQ (source document)"),
    text: B(DOC_TEXT, DOC_TEXT),
  },

  // chunks tile doc.text exactly: [0,68) [68,133) [133,180)
  chunks: [
    {
      id: "c1",
      fromChar: 0,
      toChar: 68,
      text: B(
        "Politika vozvrata sredstv: vernut' tovar mozhno v techenie 30 dnej. ",
        "Refund policy: a product can be returned within 30 days. "
      ),
    },
    {
      id: "c2",
      fromChar: 68,
      toChar: 133,
      text: B(
        "Garantiya na elektroniku sostavlyaet 12 mesyacev s daty pokupki. ",
        "Electronics warranty is 12 months from the purchase date. "
      ),
    },
    {
      id: "c3",
      fromChar: 133,
      toChar: 180,
      text: B(
        "Dostavka po gorodu zanimaet odin rabochij den'.",
        "City delivery takes one business day."
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
        "Shag 1: berem gotovye chunki - po odnomu kusku teksta na fragment.",
        "Step 1: take the ready chunks -- one piece of text per fragment."
      ),
      targets: ["c1", "c2", "c3"],
      duration: 800,
    },
    {
      id: "s2",
      kind: "embed",
      caption: B(
        "Shag 2: kazhdyj chunk prevrashchaetsya v vektor (dlina zavisit ot modeli, zdes' 1536 dlja text-embedding-3-small) - menyaetsya predstavlenie, ne tekst.",
        "Step 2: each chunk becomes a vector (length depends on the model, here 1536 for text-embedding-3-small) -- the representation changes, not the text."
      ),
      targets: ["c1", "c2", "c3"],
      duration: 1200,
    },
    {
      id: "s3",
      kind: "store",
      caption: B(
        "Shag 3: vektory v1..v3 uhodyat v indeks; svyaz' chunk -> vektor strogo odin-k-odnomu.",
        "Step 3: vectors v1..v3 go to the index; the chunk -> vector mapping is strictly one-to-one."
      ),
      targets: ["v1", "v2", "v3"],
      duration: 800,
    },
  ],
};
