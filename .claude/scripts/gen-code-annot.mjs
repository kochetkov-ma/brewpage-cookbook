// One-shot generator for shared/data/code-annot.js (task W2-DATA / W6-FIX).
// Extracts each fenced python block from content/{ru,en}/<page>.md verbatim,
// pairs it with the caption + regions defined here, and writes ONE merged
// default-export module (a map keyed by block key) matching the code-blocks.js
// contract. Run from repo root via node.
//
// W6-FIX consolidation: previously emitted 16 per-block files under
// shared/data/code-annot/<key>.js; those pushed the recipe over the 100-file
// publish cap. Now emits a SINGLE module shared/data/code-annot.js whose default
// export is { _schema, "<key>": { lang, code, caption, regions }, ... } -- each
// entry preserves the exact prior per-block content. code-blocks.js imports this
// one map and looks up map[key].

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const RG = join(REPO, "recipes", "rag-guide");
const CONTENT = join(RG, "content");
const OUT_FILE = join(RG, "shared", "data", "code-annot.js");

// Extract the fenced block that OPENS at 1-based line `openLine` (the ```python
// line). Returns the verbatim inner text (no trailing newline), closing at the
// next line that is exactly ``` .
function extractBlock(absPath, openLine) {
  const lines = readFileSync(absPath, "utf8").split("\n");
  const out = [];
  for (let i = openLine; i < lines.length; i++) {
    if (lines[i] === "```") return out.join("\n");
    out.push(lines[i]);
  }
  throw new Error(`no closing fence in ${absPath} from line ${openLine}`);
}

function lineCount(s) {
  return s.split("\n").length;
}

// One entry per output file.
const BLOCKS = [
  {
    key: "what-rag-minimal-rag",
    page: "what-rag",
    ru: 15,
    en: 15,
    caption: {
      ru: "Minimalnyj rabochij RAG na realnyh API: retrieval -> augmented -> generation.",
      en: "A minimal working RAG on real APIs: retrieval -> augmented -> generation.",
    },
    regions: [
      { id: "wr-clients", lines: [6, 7], label: { ru: "Klienty API", en: "API clients" }, explain: { ru: "Dva klienta: OpenAI schitaet embeddingi, Anthropic generiruet otvet. Kljuchi berutsya iz peremennyh okruzhenija, ne iz koda.", en: "Two clients: OpenAI computes the embeddings, Anthropic generates the answer. Keys come from environment variables, not from code." } },
      { id: "wr-corpus", lines: [9, 14], label: { ru: "Korpus chunkov", en: "Chunk corpus" }, explain: { ru: "Vasha baza znanij, uproshchennaja do spiska strok. V realnom RAG eto chunki dokumentov iz vektornogo indeksa.", en: "Your knowledge base, simplified to a list of strings. In real RAG these are document chunks from a vector index." } },
      { id: "wr-embed", lines: [16, 18], label: { ru: "Funkcija embed", en: "embed function" }, explain: { ru: "Kazhdyj tekst prevrashchaetsja v vektor fiksirovannoj dliny (dim 1536 dlja text-embedding-3-small). Formy vyzova realnye (OpenAI Embeddings, platform.openai.com/docs/guides/embeddings).", en: "Each text becomes a fixed-length vector (dim 1536 for text-embedding-3-small). The call shapes are real (OpenAI Embeddings, platform.openai.com/docs/guides/embeddings)." } },
      { id: "wr-query", lines: [20, 22], label: { ru: "Vektor zaprosa", en: "Query vector" }, explain: { ru: "Vopros polzovatelja vstraivaetsja tem zhe embedderom, chto i chunki - inache vektory ne sravnimy v odnom prostranstve.", en: "The user question is embedded with the same embedder as the chunks - otherwise the vectors are not comparable in one space." } },
      { id: "wr-retrieval", lines: [24, 26], label: { ru: "Retrieval: cosine", en: "Retrieval: cosine" }, explain: { ru: "Cosine similarity mezhdu vektorom zaprosa i kazhdym chunkom; argmax daet samyj blizkij chunk. Eto shag RETRIEVAL.", en: "Cosine similarity between the query vector and each chunk; argmax picks the closest chunk. This is the RETRIEVAL step." } },
      { id: "wr-augment-generate", lines: [28, 37], label: { ru: "Augmented + generation", en: "Augmented + generation" }, explain: { ru: "Najdennyj chunk podkladyvaetsja v prompt (augmented), i model otvechaet tolko po nemu (generation). Forma vyzova - realnyj Anthropic Messages API (docs.anthropic.com/en/api/messages).", en: "The found chunk is slotted into the prompt (augmented), and the model answers only from it (generation). The call shape is the real Anthropic Messages API (docs.anthropic.com/en/api/messages)." } },
    ],
  },
  {
    key: "why-rag-two-track",
    page: "why-rag",
    ru: 15,
    en: 15,
    caption: {
      ru: "Odin vopros dvumja putjami: bez RAG (iz pamjati) i s RAG (zazemlennyj po chunku).",
      en: "One question, two paths: without RAG (from memory) and with RAG (grounded on a chunk).",
    },
    regions: [
      { id: "wb-client", lines: [2, 5], label: { ru: "Klient i vopros", en: "Client and question" }, explain: { ru: "Odin Anthropic-klient i odin fiksirovannyj vopros pro vnutrennjuju politiku - tochka, gde obychnaja model ne znaet vashih dannyh.", en: "One Anthropic client and one fixed question about internal policy - the point where an ordinary model does not know your data." } },
      { id: "wb-ask-context", lines: [7, 12], label: { ru: "Vetka s kontekstom", en: "With-context branch" }, explain: { ru: "Kogda kontekst peredan, instrukcija velit otvechat tolko po nemu i chestno skazat 'etogo net v dokumentah', esli otveta net - osnova groundinga.", en: "When context is passed, the instruction tells the model to answer only from it and to say 'etogo net v dokumentah' if there is no answer - the basis of grounding." } },
      { id: "wb-ask-nocontext", lines: [13, 20], label: { ru: "Vetka bez konteksta", en: "No-context branch" }, explain: { ru: "Bez konteksta prompt - eto golyj vopros; vyzov Messages API odinakov dlja oboih putej, otlichaetsja tolko vhodnoj prompt.", en: "Without context the prompt is the bare question; the Messages API call is identical for both paths, only the input prompt differs." } },
      { id: "wb-track-a", lines: [22, 23], label: { ru: "Track A: bez RAG", en: "Track A: no RAG" }, explain: { ru: "Vyzov bez konteksta: otvet idet iz parametricheskoj pamjati i mozhet byt vydumkoj pro imenno vashu politiku.", en: "Call with no context: the answer comes from parametric memory and may be a fabrication about your specific policy." } },
      { id: "wb-track-b", lines: [25, 27], label: { ru: "Track B: s RAG", en: "Track B: with RAG" }, explain: { ru: "Snachala retrieval daet realnyj chunk, potom on idet v kontekst i otvet zazemlen na nem. Otvet nikogda ne pishetsja do podstanovki konteksta.", en: "Retrieval supplies a real chunk first, then it goes into the context and the answer is grounded on it. The answer is never written before the context is substituted in." } },
    ],
  },
  {
    key: "production-fastapi-endpoint",
    page: "production",
    ru: 19,
    en: 19,
    caption: {
      ru: "Produkshen-endpoint na FastAPI: kesh, podschet stoimosti, latency i filtr dostupa.",
      en: "A FastAPI production endpoint: cache, cost accounting, latency, and an access filter.",
    },
    regions: [
      { id: "pr-cache", lines: [6, 8], label: { ru: "TTL-kesh otvetov", en: "TTL answer cache" }, explain: { ru: "Odinakovyj vopros ne platit za generaciju dvazhdy; TTL ne daet kesh otdavat ustarevshee posle obnovlenija dannyh.", en: "The same question does not pay for generation twice; the TTL keeps the cache from serving stale content after a data update." } },
      { id: "pr-pricing", lines: [10, 15], label: { ru: "Raschet stoimosti", en: "Cost calculation" }, explain: { ru: "Otdelnaja cena za vhodnye i vyhodnye tokeny; svetit s pricing vendora (naprimer, Anthropic pricing, anthropic.com/pricing). cost_usd skladyvaet oba slagaemyh.", en: "Separate price for input and output tokens; check the vendor pricing (for example Anthropic pricing, anthropic.com/pricing). cost_usd sums both addends." } },
      { id: "pr-cache-key", lines: [17, 22], label: { ru: "Kesh-kljuch po tenant", en: "Tenant-scoped cache key" }, explain: { ru: "Kljuch kesha vkljuchaet tenant polzovatelja, chtoby otvety raznyh tenantov ne smeshivalis; pri popadanii vozvrashchaem gotovyj otvet bez generacii.", en: "The cache key includes the user tenant so different tenants' answers never mix; on a hit we return the ready answer with no generation." } },
      { id: "pr-access", lines: [24, 25], label: { ru: "Dostup na retrieve", en: "Access at retrieve" }, explain: { ru: "Dostup proverjaetsja na shage retrieve, a ne posle generacii: retrieve poluchaet allowed_filter i fizicheski ne vozvrashchaet zapreshchennye kuski. Esli kusok popal v kontekst, schitajte, chto polzovatel uzhe poluchil k nemu dostup.", en: "Access is checked at the retrieve step, not after generation: retrieve takes allowed_filter and physically does not return forbidden chunks. If a chunk made it into the context, assume the user already has access to it." } },
      { id: "pr-pipeline", lines: [26, 27], label: { ru: "Sborka i generacija", en: "Assemble and generate" }, explain: { ru: "Najdennye chunki pakujutsja v odin prompt v ramkah token-bjudzheta, zatem generacija vozvrashchaet otvet vmeste s uchetom tokenov dlja stoimosti.", en: "The found chunks are packed into one prompt within the token budget, then generation returns the answer together with token usage for the cost." } },
      { id: "pr-metrics", lines: [29, 35], label: { ru: "Metriki i otvet", en: "Metrics and response" }, explain: { ru: "Otvet kladetsja v kesh; latency, stoimost i chislo kuskov logirujutsya v monitoring (ne v otvet polzovatelju). To, chto ne izmerjaeshsja, slomaetsja tiho.", en: "The answer is cached; latency, cost, and the number of chunks are logged to monitoring (not into the user's answer). What you do not measure will break silently." } },
    ],
  },
  {
    key: "embedding-embed-call",
    page: "embedding",
    ru: 17,
    en: 16,
    caption: {
      ru: "Realnyj vyzov API embeddingov: spisok chankov -> spisok vektorov, strogo odin-k-odnomu.",
      en: "A real embeddings API call: a list of chunks -> a list of vectors, strictly one-to-one.",
    },
    regions: [
      { id: "install", lines: [1, 1], label: { ru: "Ustanovka paketa", en: "Install the package" }, explain: { ru: "Kommentarij s komandoj ustanovki oficialnogo klienta OpenAI; v samom kode ne ispolnjaetsja.", en: "A comment with the install command for the official OpenAI client; it does not run in the code itself." } },
      { id: "client", lines: [2, 4], label: { ru: "Klient OpenAI", en: "OpenAI client" }, explain: { ru: "Importiruem klient i sozdaem ekzempljar; kljuch API on beret iz okruzhenija.", en: "Import the client and create an instance; it reads the API key from the environment." } },
      { id: "chunks-input", lines: [6, 10], label: { ru: "Vhodnye chanki", en: "Input chunks" }, explain: { ru: "Spisok iz treh tekstovyh fragmentov - eto vhod embeddera; stroki dany v translite, chtoby ostatsja ASCII.", en: "A list of three text fragments is the embedder input; the strings are transliterated to stay ASCII." } },
      { id: "embed-call", lines: [12, 15], label: { ru: "Vyzov embeddinga", en: "Embedding call" }, explain: { ru: "Odin vyzov create s modelju text-embedding-3-small i srazu vsem spiskom chankov na vhode.", en: "One create call with the text-embedding-3-small model and the whole chunk list as input." } },
      { id: "collect-vectors", lines: [18, 20], label: { ru: "Sbor vektorov", en: "Collect vectors" }, explain: { ru: "Dostaem po vektoru na kazhdyj element otveta - svjaz chank-vektor strogo odin-k-odnomu. Na vyhode tri vektora po 1536 komponent.", en: "Pull one vector per response item - the chunk-to-vector link is strictly one-to-one. The output is three vectors of 1536 components each." } },
    ],
  },
  {
    key: "embedding-cosine",
    page: "embedding",
    ru: 60,
    en: 59,
    caption: {
      ru: "Kosinusnaja blizost vruchnuju, bez bibliotek: chem blizhe vektor zaprosa k vektoru chanka, tem blizhe smysl.",
      en: "Cosine similarity by hand, no libraries: the closer the query vector is to a chunk vector, the closer the meaning.",
    },
    regions: [
      { id: "cosine-fn", lines: [3, 7], label: { ru: "Formula kosinusa", en: "Cosine formula" }, explain: { ru: "Skaljarnoe proizvedenie, delennoe na proizvedenie dlin (norm) dvuh vektorov; tak vidna sama formula bez zavisimostej.", en: "The dot product divided by the product of the two vectors' lengths (norms); this shows the formula itself with no dependencies." } },
      { id: "query-vec", lines: [9, 12], label: { ru: "Vektor zaprosa", en: "Query vector" }, explain: { ru: "Tot zhe embedder kodiruet zapros polzovatelja v vektor - toj zhe modelju, chto i chanki, inache sravnenie bessmyslenno.", en: "The same embedder encodes the user query into a vector - the same model as the chunks, otherwise the comparison is meaningless." } },
      { id: "rank", lines: [14, 17], label: { ru: "Ranzhirovanie po blizosti", en: "Rank by closeness" }, explain: { ru: "Schitaem blizost zaprosa k kazhdomu chanku i sortiruem po ubyvaniju; samyj blizkij po smyslu chank vyhodit pervym, dazhe bez obshchih slov.", en: "Compute the query's closeness to each chunk and sort descending; the chunk closest in meaning comes first, even with no shared words." } },
    ],
  },
  {
    key: "assemble-context-assembler",
    page: "assemble-context",
    ru: 20,
    en: 20,
    caption: {
      ru: "Sborshchik konteksta celikom: dedup, porjadok po krajam, bjudzhet tokenov i shablon prompta v odnoj funkcii.",
      en: "The full context assembler: dedup, edge ordering, token budget, and the prompt template in one function.",
    },
    regions: [
      { id: "tokenizer", lines: [1, 7], label: { ru: "Schet tokenov", en: "Token counting" }, explain: { ru: "Berem nastojashchij tokenizer tiktoken (semejstvo GPT-4/3.5) i schitaem tokeny, a ne simvoly - bjudzhet modeli merjaetsja v tokenah.", en: "Take the real tiktoken tokenizer (GPT-4/3.5 family) and count tokens, not characters - the model budget is measured in tokens." } },
      { id: "template", lines: [9, 16], label: { ru: "Shablon prompta", en: "Prompt template" }, explain: { ru: "Tri chasti v fiksirovannom porjadke: instrukcija, plejsholder konteksta i vopros. Tekst shablona - strokovyj literal, odinakovyj v oboih variantah.", en: "Three parts in a fixed order: instruction, the context placeholder, and the question. The template text is a string literal, identical in both variants." } },
      { id: "dedup", lines: [18, 29], label: { ru: "Udalenie dublej", en: "Deduplication" }, explain: { ru: "Vybrasyvaem tochnye povtory teksta, sohranjaja pervyj (luchshij po score) ekzempljar - dubli edjat bjudzhet, no ne nesut novoj informacii.", en: "Drop exact text repeats, keeping the first (best-score) instance - duplicates eat budget but carry no new information." } },
      { id: "order", lines: [31, 32], label: { ru: "Porjadok po krajam", en: "Edge ordering" }, explain: { ru: "Raskladyvaem kuski tak, chtoby samye vazhnye stojali po krajam okna, a ne v seredine - smjagchenie effekta lost-in-the-middle.", en: "Lay out the pieces so the most important ones sit at the window edges, not the middle - mitigating the lost-in-the-middle effect." } },
      { id: "budget", lines: [34, 42], label: { ru: "Bjudzhet tokenov", en: "Token budget" }, explain: { ru: "Nabiraem kuski po ocheredi, poka summa tokenov vlezaet v limit; kak tolko sledujushchij ne vlezaet - ostanavlivaemsja i obrezaem ostatok.", en: "Take pieces one by one while the token sum fits the limit; as soon as the next one does not fit, stop and trim the rest." } },
      { id: "fill", lines: [43, 45], label: { ru: "Zapolnenie shablona", en: "Fill the template" }, explain: { ru: "Skleivaem otobrannye kuski s podpisju istochnika [source] i podstavljaem v shablon vmeste s voprosom - gotovyj prompt dlja generacii.", en: "Glue the picked pieces with their [source] tag and substitute them into the template along with the question - the finished prompt for generation." } },
    ],
  },
  {
    key: "assemble-context-order",
    page: "assemble-context",
    ru: 88,
    en: 88,
    caption: {
      ru: "Raskladka po krajam: silnye kuski uezzhajut k nachalu i koncu okna, slabye - v seredinu.",
      en: "Edge layout: strong pieces move to the start and end of the window, weak ones to the middle.",
    },
    regions: [
      { id: "signature", lines: [1, 3], label: { ru: "Vhod funkcii", en: "Function input" }, explain: { ru: "Na vhod prihodit ranked - kuski, uzhe otsortirovannye po ubyvaniju relevantnosti; zadacha - perestavit ih pod vnimanie modeli.", en: "The input is ranked - pieces already sorted by descending relevance; the job is to reorder them for the model's attention." } },
      { id: "split-heads-tails", lines: [4, 6], label: { ru: "Razvodim na kraja", en: "Split into edges" }, explain: { ru: "Cheredkem: chetnye po indeksu kuski idut v head, nechetnye - v tail; tak silnejshie raspredeljajutsja k oboim krajam okna.", en: "Alternate: even-indexed pieces go to head, odd-indexed ones to tail; this spreads the strongest toward both window edges." } },
      { id: "recombine", lines: [7, 7], label: { ru: "Sborka kraja-seredina-kraja", en: "Edge-middle-edge recombine" }, explain: { ru: "Skleivaem head s razvernutym tail, poluchaja raskladku silnye...slabye...silnye - seredina okna dostaetsja naimenee vazhnym kuskam.", en: "Glue head with the reversed tail, yielding a strong...weak...strong layout - the window middle goes to the least important pieces." } },
    ],
  },
  {
    key: "search-retrieve",
    page: "search",
    ru: 14,
    en: 14,
    caption: {
      ru: "Zhivoj retrieve: zapros -> vektor toj zhe modelju -> top-k blizhajshih po cosine iz indeksa.",
      en: "Live retrieve: query -> vector with the same model -> top-k nearest by cosine from the index.",
    },
    regions: [
      { id: "deps", lines: [1, 1], label: { ru: "Ustanovka klientov", en: "Install clients" }, explain: { ru: "Stavim klienty Pinecone i OpenAI - vektornaya baza plyus model embeddingov.", en: "Install the Pinecone and OpenAI clients - the vector store plus the embedding model." } },
      { id: "clients", lines: [2, 6], label: { ru: "Klienty i indeks", en: "Clients and index" }, explain: { ru: "Sozdaem klient OpenAI i otkryvaem indeks docs v Pinecone.", en: "Create the OpenAI client and open the docs index in Pinecone." } },
      { id: "embed-q", lines: [9, 12], label: { ru: "Vektor zaprosa", en: "Query vector" }, explain: { ru: "Prevrashchaem tekst zaprosa v vektor TOJ ZHE modelju, chto i chunki - inache prostranstva ne sovpadut.", en: "Turn the query text into a vector with the SAME model as the chunks - otherwise the spaces will not match." } },
      { id: "topk", lines: [13, 16], label: { ru: "Top-k po cosine", en: "Top-k by cosine" }, explain: { ru: "Otdaem vektor v indeks i beriom top-k blizhajshih, vozvrashchaja id, score i tekst.", en: "Send the vector to the index and take the top-k nearest, returning id, score and text." } },
      { id: "run", lines: [18, 20], label: { ru: "Zapusk na zaprose", en: "Run on a query" }, explain: { ru: "Zapuskaem retrieve na zhivom zaprose: nuzhnyj chunk prihodit pervym bez obshchih slov.", en: "Run retrieve on a live query: the needed chunk comes back first with no shared words." } },
    ],
  },
  {
    key: "vector-store-upsert-query",
    page: "vector-store",
    ru: 14,
    en: 14,
    caption: {
      ru: "Vektornaya baza: upsert vektorov s metadata, zatem poisk top-k blizhajshih s filtrom po metadata.",
      en: "Vector store: upsert vectors with metadata, then search the top-k nearest with a metadata filter.",
    },
    regions: [
      { id: "clients", lines: [1, 7], label: { ru: "Klienty i indeks", en: "Clients and index" }, explain: { ru: "Klient OpenAI dlja embeddingov i indeks docs v Pinecone - hranilishche vektorov.", en: "The OpenAI client for embeddings and the docs index in Pinecone - the vector store." } },
      { id: "embed-fn", lines: [9, 13], label: { ru: "Funkcija embed", en: "embed helper" }, explain: { ru: "Vspomogatelnaja funkcija: tekst -> vektor toj zhe modelju dlja store i poiska.", en: "A helper: text -> vector with the same model for both store and search." } },
      { id: "upsert", lines: [15, 20], label: { ru: "Upsert s metadata", en: "Upsert with metadata" }, explain: { ru: "Kladem v bazu vektor vmeste s metadata (source, section, text) - baza hranit ih rjadom.", en: "Put each vector into the store together with its metadata (source, section, text) - the store keeps them side by side." } },
      { id: "query", lines: [22, 28], label: { ru: "Poisk s filtrom", en: "Filtered search" }, explain: { ru: "Ishchem top-3 blizhajshih, no snachala suzhaem poisk filtrom po metadata (section vozvrat).", en: "Search for the top-3 nearest, but first narrow the search with a metadata filter (section vozvrat)." } },
      { id: "print", lines: [29, 30], label: { ru: "Vyvod sovpadenij", en: "Print matches" }, explain: { ru: "Pechataem id, cosine-score i razdel kazhdogo najdennogo sovpadenija.", en: "Print the id, cosine score and section of each returned match." } },
    ],
  },
  {
    key: "evaluation-harness",
    page: "evaluation",
    ru: 18,
    en: 18,
    caption: {
      ru: "Eval-harness nad zolotym naborom: schitaem precision@k i recall@k i sravnivaem dve versii na odnom nabore.",
      en: "Eval harness over a golden set: compute precision@k and recall@k and compare two versions on the same set.",
    },
    regions: [
      { id: "golden", lines: [1, 11], label: { ru: "Zolotoj nabor", en: "Golden set" }, explain: { ru: "Spisok voprosov, dlja kazhdogo zaranee razmecheny id relevantnyh chunkov - fundament ocenki.", en: "A list of questions, each pre-labelled with the ids of its relevant chunks - the foundation of evaluation." } },
      { id: "pr-at-k", lines: [13, 20], label: { ru: "precision@k i recall@k", en: "precision@k and recall@k" }, explain: { ru: "Schitaem popadanija v pervyh k: precision - dolja sredi vydannyh, recall - dolja iz vseh nuzhnyh.", en: "Count hits in the first k: precision is the share among the returned, recall is the share of all needed." } },
      { id: "evaluate", lines: [22, 30], label: { ru: "Progon po naboru", en: "Run over the set" }, explain: { ru: "Proganjaem retriever po vsem voprosam i usrednjaem precision@k i recall@k po naboru.", en: "Run the retriever over every question and average precision@k and recall@k across the set." } },
      { id: "ab-compare", lines: [32, 35], label: { ru: "Sravnenie do/posle", en: "Before/after compare" }, explain: { ru: "Obe versii retrievera proganjajutsja na ODNOM fiksirovannom nabore - tolko tak sravnenie chestnoe.", en: "Both retriever versions run on the SAME fixed set - only that way is the comparison honest." } },
    ],
  },
  {
    key: "evaluation-ragas",
    page: "evaluation",
    ru: 70,
    en: 70,
    caption: {
      ru: "RAGAS: avtomaticheskaja ocenka kachestva otveta - faithfulness, answer relevancy, context precision.",
      en: "RAGAS: automated answer-quality evaluation - faithfulness, answer relevancy, context precision.",
    },
    regions: [
      { id: "imports", lines: [1, 4], label: { ru: "Metriki RAGAS", en: "RAGAS metrics" }, explain: { ru: "Stavim ragas i podkljuchaem tri metriki kachestva: faithfulness, answer_relevancy, context_precision.", en: "Install ragas and import the three quality metrics: faithfulness, answer_relevancy, context_precision." } },
      { id: "dataset", lines: [6, 11], label: { ru: "Datset ocenki", en: "Eval dataset" }, explain: { ru: "Sobiraem dataset iz voprosov, otvetov generacii, vydannyh chunkov i etalona iz golden.", en: "Assemble the dataset from questions, generation answers, the returned chunks and the golden reference." } },
      { id: "run", lines: [12, 13], label: { ru: "Zapusk ocenki", en: "Run evaluation" }, explain: { ru: "Proganjaem RAGAS po datasetu - on schitaet metriki avtomaticheski, bez ruchnoj razmetki kazhdogo otveta.", en: "Run RAGAS over the dataset - it scores the metrics automatically, with no manual labelling of each answer." } },
    ],
  },
  {
    key: "chunking-fixed-size",
    page: "chunking",
    ru: 77,
    en: 77,
    caption: {
      ru: "fixed-size: rezhem rovno po N edinic podrjad, ignoriruja smyslovye granicy.",
      en: "fixed-size: cut exactly N units in a row, ignoring meaning boundaries.",
    },
    regions: [
      { id: "guard", lines: [1, 3], label: { ru: "Proverka razmera", en: "Size guard" }, explain: { ru: "Signatura funkcii i zashchita ot nepozitivnogo razmera okna - inache rez ne imeet smysla.", en: "The function signature and a guard against a non-positive window size - otherwise the cut makes no sense." } },
      { id: "slice", lines: [4, 4], label: { ru: "Narezka po shagu size", en: "Slice by step size" }, explain: { ru: "Odin prohod srezami text[i:i+size] s shagom size - rezy padajut cherez ravnye intervaly, ignoriruja slova.", en: "A single pass of text[i:i+size] slices stepping by size - cuts fall at equal intervals, ignoring words." } },
      { id: "demo", lines: [7, 12], label: { ru: "Demonstracija", en: "Demo run" }, explain: { ru: "Primer na transliterirovannom dokumente s size=60; pechataet kazhdyj chank - vidno, chto granicy mogut past poseredine slova.", en: "An example over a transliterated document with size=60; prints each chunk - boundaries can land mid-word." } },
    ],
  },
  {
    key: "chunking-sliding-window",
    page: "chunking",
    ru: 109,
    en: 109,
    caption: {
      ru: "sliding-window: to zhe okno, no sosednie chanki perekryvajutsja na overlap edinic.",
      en: "sliding-window: the same window, but neighbouring chunks overlap by overlap units.",
    },
    regions: [
      { id: "guards", lines: [1, 5], label: { ru: "Proverki size i overlap", en: "Size and overlap guards" }, explain: { ru: "Signatura i dve zashchity: polozhitelnyj size i 0 <= overlap < size, inache okno ne sdvigaetsja vpered.", en: "The signature and two guards: a positive size and 0 <= overlap < size, otherwise the window does not move forward." } },
      { id: "step", lines: [6, 8], label: { ru: "Shag s perekrytiem", en: "Overlapping step" }, explain: { ru: "Shag step = size - overlap menshe okna, poetomu sosednie chanki nakladyvajutsja na overlap edinic.", en: "The step step = size - overlap is smaller than the window, so neighbouring chunks overlap by overlap units." } },
      { id: "loop", lines: [9, 12], label: { ru: "Cikl narezki", en: "Cutting loop" }, explain: { ru: "Rezhem text[i:i+size] i dvigaem kursor na step; hvost overlap predydushchego chanka povtorjaetsja v nachale sledujushchego.", en: "Cut text[i:i+size] and advance the cursor by step; the overlap tail of the previous chunk repeats at the start of the next." } },
      { id: "demo", lines: [15, 19], label: { ru: "Demonstracija", en: "Demo run" }, explain: { ru: "Primer s size=50, overlap=15; pechat chankov pokazyvaet povtorjajushchijsja pogranichnyj hvost.", en: "An example with size=50, overlap=15; printing the chunks shows the repeated boundary tail." } },
    ],
  },
  {
    key: "chunking-recursive",
    page: "chunking",
    ru: 148,
    en: 148,
    caption: {
      ru: "recursive: spusk po prioritetu razdelitelej, poka kusok ne vlezet v limit size.",
      en: "recursive: descend the separator priority until a piece fits the size limit.",
    },
    regions: [
      { id: "base-case", lines: [1, 6], label: { ru: "Baza rekursii", en: "Recursion base" }, explain: { ru: "Spisok razdelitelej po umolchaniju ot krupnogo k melkomu; esli tekst uzhe vlezaet v size, on vozvrashchaetsja kak est.", en: "A default separator list from coarse to fine; if the text already fits size, it is returned as is." } },
      { id: "split-by-sep", lines: [8, 10], label: { ru: "Rez tekushchim razdelitelem", en: "Split by current separator" }, explain: { ru: "Berem pervyj razdelitel urovnja i rezhem im; pustoj razdelitel oznachaet rez po simvolam.", en: "Take the first separator of the level and split by it; an empty separator means a per-character cut." } },
      { id: "accumulate", lines: [12, 19], label: { ru: "Sklejka melkih kuskov", en: "Glue small pieces" }, explain: { ru: "Kopim chasti v bufer, poka summa vlezaet v size - chtoby ne plodit slishkom melkie chanki.", en: "Accumulate parts in a buffer while the sum fits size - so as not to breed overly small chunks." } },
      { id: "descend", lines: [20, 30], label: { ru: "Spusk na sledujushchij uroven", en: "Descend a level" }, explain: { ru: "Esli chast vse eshche bolshe size, rekursivno primenjaem SLEDUJUSHCHIJ razdelitel; kogda razdeliteli konchilis - zhestkij fixed-size rez.", en: "If a part is still larger than size, recursively apply the NEXT separator; when separators run out, a hard fixed-size cut." } },
      { id: "demo", lines: [34, 39], label: { ru: "Demonstracija", en: "Demo run" }, explain: { ru: "Dokument s abzacami cherez dvojnoj perevod stroki i size=70; vidno spusk ot abzacev k predlozhenijam i slovam.", en: "A document with paragraphs via blank lines and size=70; you see the descent from paragraphs to sentences and words." } },
    ],
  },
  {
    key: "chunking-markdown-header",
    page: "chunking",
    ru: 211,
    en: 211,
    caption: {
      ru: "structure-aware (markdown): rezhem po zagolovkam, uroven zagolovka kladem v metadannye chanka.",
      en: "structure-aware (markdown): cut by headings, put the heading level into the chunk metadata.",
    },
    regions: [
      { id: "state", lines: [4, 7], label: { ru: "Sostojanie razbora", en: "Parse state" }, explain: { ru: "Zavodim spisok sekcij, tekushchij zagolovok i bufer tela - prostoj potokovyj parser po strokam.", en: "Set up a sections list, the current heading, and a body buffer - a simple line-by-line streaming parser." } },
      { id: "flush", lines: [9, 12], label: { ru: "Zakrytie sekcii", en: "Flush a section" }, explain: { ru: "flush sbrasyvaet nakoplennoe telo v sekciju vmeste s ee zagolovkom, esli telo nepustoe.", en: "flush dumps the accumulated body into a section together with its heading, if the body is non-empty." } },
      { id: "scan-headings", lines: [14, 22], label: { ru: "Poisk zagolovkov", en: "Scan headings" }, explain: { ru: "Reguljarka lovit stroki # .. ###### ; na kazhdom zagolovke zakryvaem proshluju sekciju i zapominaem novyj zagolovok.", en: "The regex catches # .. ###### lines; on each heading we close the previous section and remember the new heading." } },
      { id: "emit-chunks", lines: [24, 32], label: { ru: "Sekcii v chanki", en: "Sections to chunks" }, explain: { ru: "Kazhdaja sekcija stanovitsja chankom s metadannymi zagolovka; slishkom dlinnuju sekciju rezhem zapasnym fixed-size.", en: "Each section becomes a chunk with heading metadata; an over-long section is cut with a fallback fixed-size pass." } },
      { id: "demo", lines: [35, 41], label: { ru: "Demonstracija", en: "Demo run" }, explain: { ru: "Markdown-dokument s # i ## ; pechat pokazyvaet zagolovok rjadom s telom kazhdogo chanka.", en: "A Markdown document with # and ##; printing shows the heading next to each chunk body." } },
    ],
  },
  {
    key: "generation-grounded-call",
    page: "generation",
    ru: 20,
    en: 20,
    caption: {
      ru: "Vyzov generacii s zazemleniem: zhestkij system, razbor [source]-citat i streaming-variant.",
      en: "Grounded generation call: a firm system instruction, [source] citation parsing, and a streaming variant.",
    },
    regions: [
      { id: "client", lines: [1, 5], label: { ru: "Klient Anthropic", en: "Anthropic client" }, explain: { ru: "Stavim SDK i sozdaem klient - kljuch beriotsja iz peremennoj ANTHROPIC_API_KEY.", en: "Install the SDK and create the client - the key is read from ANTHROPIC_API_KEY." } },
      { id: "system", lines: [7, 12], label: { ru: "Instrukcija zazemlenija", en: "Grounding instruction" }, explain: { ru: "System delaet tri veshchi: tolko po kontekstu, citaty [source] i chestnyj zapasnoj otvet pri probele.", en: "The system instruction does three things: only-from-context, [source] citations, and an honest fallback on a gap." } },
      { id: "generate", lines: [14, 24], label: { ru: "Vyzov i razbor citat", en: "Call and parse citations" }, explain: { ru: "Vyzyvaem model i vytaskivaem vse [source] iz otveta - proverka, chto otvet zazemlen na kontekste.", en: "Call the model and pull every [source] out of the answer - a check that the answer is grounded on the context." } },
      { id: "stream", lines: [26, 35], label: { ru: "Streaming-variant", en: "Streaming variant" }, explain: { ru: "To zhe, no tokeny otdajutsja po mere generacii cherez stream - polzovatel vidit tekst srazu.", en: "The same call, but tokens are yielded as they are generated via stream - the user sees text right away." } },
    ],
  },
];

const SCHEMA = {
  purpose:
    "Annotated bilingual code block for the RAG Guide code-blocks layer (code-blocks.js + code-annot.js).",
  shape:
    "{ lang, code:{ru,en}, caption:{ru,en}, regions:[{id,lines:[s,e],label:{ru,en},explain:{ru,en}}] }",
  rules: [
    "code.ru/code.en line-aligned (equal line count); only comments differ.",
    "regions sorted ascending by start line, non-overlapping, [s,e] within 1..lineCount.",
    "ASCII outside ru strings; consumers skip any _-prefixed key.",
  ],
};

// Emit ONE merged map entry "<key>": { lang, code, caption, regions }. We rely on
// JSON.stringify for safe escaping of the verbatim code strings (JSON is a subset
// of JS object-literal syntax), then indent the literal to sit at map depth 1.
function entryBody(key, lang, code, caption, regions) {
  const data = { lang, code, caption, regions };
  const json = JSON.stringify(data, null, 2);
  return `  ${JSON.stringify(key)}: ${indentNested(json, "  ")}`;
}

// Re-indent a JSON.stringify'd block (2-space indent at depth 0) so that every
// line after the first is prefixed with `pad`, placing the value at the right
// depth inside the surrounding object literal. The first line keeps its position
// (it follows the `"<key>": ` on the same source line).
function indentNested(json, pad) {
  const lines = json.split("\n");
  return lines.map((l, i) => (i === 0 ? l : pad + l)).join("\n");
}

const results = [];
const mismatches = [];
const entries = [];

for (const b of BLOCKS) {
  const ruPath = join(CONTENT, "ru", `${b.page}.md`);
  const enPath = join(CONTENT, "en", `${b.page}.md`);
  const codeRu = extractBlock(ruPath, b.ru);
  const codeEn = extractBlock(enPath, b.en);
  const nRu = lineCount(codeRu);
  const nEn = lineCount(codeEn);
  if (nRu !== nEn) {
    mismatches.push(`${b.key}: ru=${nRu} en=${nEn}`);
    continue;
  }
  // validate regions
  let prevEnd = 0;
  for (const r of b.regions) {
    const [s, e] = r.lines;
    if (s < 1 || e > nRu || s > e) {
      mismatches.push(`${b.key} region ${r.id} out of range [${s},${e}] (lineCount ${nRu})`);
    }
    if (s <= prevEnd) {
      mismatches.push(`${b.key} region ${r.id} overlaps/unsorted (start ${s} <= prevEnd ${prevEnd})`);
    }
    prevEnd = e;
  }
  entries.push(entryBody(b.key, b.lang || "python", { ru: codeRu, en: codeEn }, b.caption, b.regions));
  results.push({ key: b.key, lines: nRu });
}

if (mismatches.length) {
  console.log("MISMATCHES (BLOCKERS):");
  for (const m of mismatches) console.log(`  ${m}`);
  process.exitCode = 1;
} else {
  const merged =
    `// AUTO-GENERATED by .claude/scripts/gen-code-annot.mjs (tasks W2-DATA, W6-FIX). Do not\n` +
    `// hand-edit; regenerate from content/{ru,en}/<page>.md + the in-script region table.\n` +
    `// Data contract: shared/js/lib/code-blocks.js (default export = a map keyed by block key,\n` +
    `// imported once; the loader looks up map[key]). Consolidated from 16 per-block files into\n` +
    `// this single module to stay under the BrewPage 100-file publish cap (W6-FIX, blocker L2).\n` +
    `//\n` +
    `// Shape: { _schema, "<key>": { lang, code:{ru,en}, caption:{ru,en}, regions:[...] }, ... }.\n` +
    `// Consumers MUST skip every _-prefixed key when iterating block keys.\n\n` +
    `const _schema = ${JSON.stringify(SCHEMA, null, 2)};\n\n` +
    `export default {\n` +
    `  _schema,\n` +
    entries.join(",\n") +
    `\n};\n`;
  writeFileSync(OUT_FILE, merged, "utf8");
  console.log("WRITTEN:");
  console.log(`  shared/data/code-annot.js  ${statSync(OUT_FILE).size} bytes  (${results.length} blocks)`);
  for (const r of results) console.log(`    ${r.key}  (${r.lines} code lines)`);
  console.log("\nNo mismatches. All regions in range, sorted, non-overlapping.");
}
