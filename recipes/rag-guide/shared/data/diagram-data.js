/**
 * diagram-data.js -- DATA CONTRACT for the C4 drill-down (drilldown.js).
 *
 * This is a CONTRACT. interactive-engineer renders against it; cookbook-author
 * fills real labels/summaries. Do not change field names without a PR note.
 *
 * SHAPE
 * -----
 * Default export = an object keyed by top-level STAGE id. Each stage value is
 * a flat node map: { [nodeId]: Node }. A stage is a 3-level C4 tree:
 *   level 1 "system"     -> the stage as a whole (one root node)
 *   level 2 "container"  -> major parts of the stage
 *   level 3 "component"  -> pieces inside a container
 *
 * Node:
 *   {
 *     id:        string,                 // unique within the stage
 *     label:     string,                 // short display name
 *     level:     "system"|"container"|"component",
 *     parent:    string|null,            // parent node id (null for the root)
 *     children:  string[],               // child node ids (drill-down targets)
 *     summary:   string,                 // 1-2 sentence description (popover)
 *     "data-term"?: string               // optional glossary.json key to link
 *   }
 *
 * RULES
 *   - Exactly one node per stage has level "system" and parent null (the root).
 *   - children[] ids must exist in the same stage map.
 *   - A node with children is drillable; a leaf (children: []) shows summary only.
 *   - Keep labels short (fit an SVG node box); put detail in summary.
 *
 * Below: a minimal PLACEHOLDER example for ONE stage ("chunking"). Add more
 * stages (ingest, embed, store, retrieve, rerank, generate) using the same shape.
 */
export default {
  chunking: {
    "chunk-system": {
      id: "chunk-system",
      label: "Chunking",
      level: "system",
      parent: null,
      children: ["splitter", "overlap", "metadata"],
      summary: "Rezhet ochishchennyj dokument na chunki retrieval-razmera. Razmer chunka i overlap napryamuyu vliyayut na kachestvo poiska.",
      "data-term": "chunk",
    },
    splitter: {
      id: "splitter",
      label: "Splitter",
      level: "container",
      parent: "chunk-system",
      children: ["fixed-size", "recursive", "structural"],
      summary: "Reshaet, GDE rezat' dokument. Vybor strategii reza opredelyaet, popadet li svyazannyj smysl v odin chunk.",
    },
    overlap: {
      id: "overlap",
      label: "Overlap",
      level: "container",
      parent: "chunk-system",
      children: ["sliding-window", "sentence-tail"],
      summary: "Povtoryaet hvost odnogo chunka v nachale sleduyushchego, chtoby smysl ne teryalsya na granice reza.",
      "data-term": "overlap",
    },
    metadata: {
      id: "metadata",
      label: "Metadata",
      level: "container",
      parent: "chunk-system",
      children: ["source-ref", "position-ref", "tags"],
      summary: "Krepit k kazhdomu chunku istochnik, poziciyu i tegi, chtoby fil'trovat' i citirovat' na etape retrieval.",
    },
    "fixed-size": {
      id: "fixed-size",
      label: "Fixed-size",
      level: "component",
      parent: "splitter",
      children: [],
      summary: "Rezhet kazhdye N tokenov. Prosto i bystro, no ignoriruet smyslovye granicy i mozhet razorvat' predlozhenie.",
    },
    recursive: {
      id: "recursive",
      label: "Recursive",
      level: "component",
      parent: "splitter",
      children: [],
      summary: "Rezhet po prioritetnomu spisku separatorov (abzac -> predlozhenie -> slovo), poka chunk ne vlezet v limit. Strategiya po umolchaniyu v LangChain RecursiveCharacterTextSplitter.",
    },
    structural: {
      id: "structural",
      label: "Structural",
      level: "component",
      parent: "splitter",
      children: [],
      summary: "Rezhet po strukture dokumenta (zagolovki Markdown, AST koda). Luchshe vsego sohranyaet smysl, no zavisit ot formata.",
    },
    "sliding-window": {
      id: "sliding-window",
      label: "Sliding window",
      level: "component",
      parent: "overlap",
      children: [],
      summary: "Sdvigaet okno na (razmer - overlap) tokenov; sosednie chunki delyat fiksirovannyj obshchij hvost.",
    },
    "sentence-tail": {
      id: "sentence-tail",
      label: "Sentence tail",
      level: "component",
      parent: "overlap",
      children: [],
      summary: "Perenosit v sleduyushchij chunk celye poslednie predlozheniya, a ne obryvok po tokenam. Granica overlap ne razryvaet slova.",
    },
    "source-ref": {
      id: "source-ref",
      label: "Source ref",
      level: "component",
      parent: "metadata",
      children: [],
      summary: "Id dokumenta i URL istochnika; nuzhny, chtoby vernut' citatu v otvete generacii.",
    },
    "position-ref": {
      id: "position-ref",
      label: "Position ref",
      level: "component",
      parent: "metadata",
      children: [],
      summary: "fromChar/toChar ili nomer chunka v dokumente; pozvolyayut vosstanovit' poryadok i sosedej.",
    },
    tags: {
      id: "tags",
      label: "Tags",
      level: "component",
      parent: "metadata",
      children: [],
      summary: "Proizvol'nye metki (razdel, yazyk, dostup), po kotorym fil'truyut kandidatov pered poiskom blizhajshih.",
    },
  },
};
