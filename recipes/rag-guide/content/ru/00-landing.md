<!--
  RU-first landing for the RAG Guide (prototype, reduced depth).
  ASCII punctuation only, even inside Russian. Cite every technical claim inline.
  This is authored markdown; site-builder ports it to HTML later.
-->

# RAG Guide: sobiraem retrieval-augmented generation po shagam

## Problema, s kotoroj vy prishli

U vas est' LLM i papka dokumentov: instrukcii, tikety, baza znanij. Vy zadaete model voprosa po etim dokumentam i poluchaete uverennyj, no vydumannyj otvet. Model ne videla vashih dannyh na obuchenii i ne mozhet ih videt' - eto fundamental'noe ogranichenie, a ne bag prompta.

RAG (retrieval-augmented generation) reshaet imenno eto: pered generaciej my nahodim relevantnye fragmenty vashih dokumentov i podmeshivaem ih v zapros. Termin i bazovuyu arhitekturu vveli Lewis et al., 2020 ("Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", <https://arxiv.org/abs/2005.11401>): retriever dostaet dokumenty, generator pishet otvet, opirayas' na nih.

Etot recept - rabochij put', a ne obzor. K koncu prototipa vy projdete odin polnyj konvejer na zhivom primere: ot dokumenta do vektorov, gotovyh k poisku.

## Reshenie: konvejer iz 4 shagov

RAG na verhnem urovne - eto konvejer iz chetyreh shagov. Zapomnite etu kartu; ves' ostal'noj recept - eto drill-down vnutr' ee uzlov.

1. **Ingest + chunking** - chistim ishodnyj dokument i rezhem ego na chunki retrieval-razmera. Chunk - eta edinica, kotoruyu my dal'she embeddim, hranim i izvlekaem. Slishkom krupnye chunki razmyvayut smysl, slishkom melkie teryayut kontekst (<https://www.pinecone.io/learn/chunking-strategies/>).
2. **Embedding** - kazhdyj chunk prevrashchaem v vektor: spisok chisel fiksirovannoj dliny, kodiruyushchij smysl teksta tak, chtoby blizkie po smyslu teksty davali blizkie vektory (<https://platform.openai.com/docs/guides/embeddings>).
3. **Store + retrieve** - vektory kladem v vektornyj indeks i na zapros nahodim top-k blizhajshih chunkov priblizhennym poiskom blizhajshih sosedej (ANN); klassicheskij algoritm HNSW opisan v Malkov & Yashunin, 2016 (<https://arxiv.org/abs/1603.09320>).
4. **Generate** - najdennye chunki podmeshivaem v prompt, i LLM pishet otvet, opirayas' na nih, a ne na pamyat' (<https://arxiv.org/abs/2005.11401>).

Eti chetyre shaga - postoyannaya verhneurovnevaya karta vsego recepta. V polnoj versii kazhdyj shag raskryvaetsya v svoj drill-down; v etom prototipe my raskryvaem odin shag - **chunking** - i progonyaem zhivoj primer cherez pervye dva shaga.

## Voydite v drill-down: chunking

Nizhe - interaktivnaya diagramma stadii chunking v stile C4: tri urovnya vlozhennosti (sistema -> kontejnery -> komponenty). Klik po uzlu raskryvaet ego sostav; navedenie pokazyvaet kratkoe opisanie. Naverhu - sama stadiya Chunking; vnutri - Splitter (gde rezat'), Overlap (chto povtorit' na granice) i Metadata (chto prikrepit' k chunku). Glubzhe Splitter delitsya na strategii reza: fixed-size, recursive, structural.

<!--
interactive-engineer:
  element: ChunkingDrilldown
  purpose: Dat' chitatelyu projti stadiyu chunking sverhu vniz (sistema -> kontejner -> komponent) i ponyat', iz chego sostoit rez dokumenta.
  inputs:
    - dataSrc: shared/data/diagram-data.js (default export, klyuch stage "chunking")
    - stage: "chunking"
    - host: element [data-component="drilldown-host"] s data-stage="chunking" i data-diagram-src
    - termPopovers: uzly s "data-term" (chunk, overlap) podsvechivayut termin iz glossary.json
  recipe-path: recipes/rag-guide/variants/<theme>/index.html#chunking
-->

## Zhivoj primer: dokument -> chunki -> vektory

Centr recepta - animaciya odnogo konvejera na konkretnom dokumente. Vy vidite ishodnyj tekst (doc.text), zatem on raspadaetsya na tri chunka po granicam predlozhenij, i kazhdyj chunk "schlopyvaetsya" v vektor fiksirovannoj dliny. Eto te zhe shagi 1-2 iz karty vyshe, no na zhivyh dannyh; pokazannye chisla vektorov - kratkie zaglushki dlya maketa, a ne realnyj embedding (realnyj imeet dim=1536, sm. <https://platform.openai.com/docs/guides/embeddings>).

Upravlenie: play/pause i pereklyuchenie po shagam (split -> embed -> store). Pri ukazanii prefers-reduced-motion animaciya srazu prygaet v konechnoe sostoyanie.

<!--
interactive-engineer:
  element: WorkedExampleTimeline
  purpose: Pokazat' odin RAG-konvejer (split -> embed -> store) na real'nom korotkom dokumente, chtoby chitatel' uvidel sootvetstvie chunk <-> vektor.
  inputs:
    - dataSrc: shared/data/worked-example.json (doc, chunks[fromChar/toChar], vectors-stubs, steps[])
    - host: element .timeline s data-timeline-src; slot [data-slot="anim"] dlya process-anim.js
    - steps: poryadok iz steps[] (s1 split, s2 embed, s3 store); caption na RU iz dannyh
    - reducedMotion: pri prefers-reduced-motion - snap v konechnoe sostoyanie, anim tol'ko transform/opacity
  recipe-path: recipes/rag-guide/variants/<theme>/index.html#worked-example
-->

## Poprobujte sami

- Otkrojte drill-down chunking i projdite ot sistemy do komponenta `recursive`: eto strategiya reza po umolchaniyu v LangChain `RecursiveCharacterTextSplitter` (<https://python.langchain.com/docs/how_to/recursive_text_splitter/>).
- Progonite zhivoj primer poshagovo i sopostav'te kazhdyj chunk (c1..c3) s ego vektorom (v1..v3) po polyu `chunkId` v `worked-example.json`.
- Dal'she: glava **Chunking** razbiraet razmer chunka i overlap; glava **Embedding** - pochemu blizost' vektorov = blizost' smysla.

## Sources

- Lewis et al., 2020. Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. <https://arxiv.org/abs/2005.11401>
- Malkov & Yashunin, 2016. Efficient and robust approximate nearest neighbor search using HNSW graphs. <https://arxiv.org/abs/1603.09320>
- OpenAI. Embeddings guide. <https://platform.openai.com/docs/guides/embeddings>
- Pinecone. Chunking strategies. <https://www.pinecone.io/learn/chunking-strategies/>
- LangChain. RecursiveCharacterTextSplitter. <https://python.langchain.com/docs/how_to/recursive_text_splitter/>

## About this recipe

- Chast' [BrewPage Cookbook](../../../../README.md).
- Opublikovano zhivym na [brewpage.app](https://brewpage.app).
- Istochnik kontrakta BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
