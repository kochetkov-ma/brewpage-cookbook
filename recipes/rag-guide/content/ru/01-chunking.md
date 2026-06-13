<!--
  RU-first chunking core section (prototype). ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Chunking: rezhem dokument na chunki

## Problema

Vy ne mozhete otdat' retrieveru ves' dokument celikom. Vo-pervyh, embedding rabotaet s tekstom ogranichennoj dliny; vo-vtoryh, esli vstavit' v prompt ogromnyj fragment, otvet razmyvaetsya - "lost in the middle": modeli huzhe ispol'zuyut informaciyu v seredine dlinnogo konteksta (Liu et al., 2023, <https://arxiv.org/abs/2307.03172>). Poetomu dokument rezhut na chunki - fragmenty retrieval-razmera, kotorye dal'she embeddyat, hranyat i izvlekayut.

Vopros ne "rezat' ili net", a "gde rezat' i naskol'ko krupno". Eto i est' stadiya chunking - odin iz uzlov verhneurovnevoj karty iz obzora, kotoryj my zdes' raskryvaem.

## Iz chego sostoit chunking

V drill-down stadiya raspadaetsya na tri kontejnera:

- **Splitter** - reshaet, GDE rezat'. Ot etogo zavisit, popadet li svyazannyj smysl v odin chunk. Tri tipichnyh strategii:
  - *fixed-size*: rezhet kazhdye N tokenov. Prosto i bystro, no ignoriruet smyslovye granicy i mozhet razorvat' predlozhenie.
  - *recursive*: rezhet po prioritetnomu spisku separatorov (abzac -> predlozhenie -> slovo), poka chunk ne vlezet v limit. Eta strategiya po umolchaniyu v LangChain `RecursiveCharacterTextSplitter` (<https://python.langchain.com/docs/how_to/recursive_text_splitter/>).
  - *structural*: rezhet po strukture dokumenta (zagolovki Markdown, AST koda). Luchshe vsego sohranyaet smysl, no zavisit ot formata vhoda.
- **Overlap** - obshchij hvost teksta, kotoryj povtoryaetsya v konce odnogo chunka i v nachale sleduyushchego. Bez overlap fakt, razorvannyj granicej reza, ne najdetsya ni v odnom chunke celikom; nebol'shoj overlap sohranyaet kontekst na granice (<https://www.pinecone.io/learn/chunking-strategies/>).
- **Metadata** - istochnik, poziciya (fromChar/toChar) i tegi, prikreplennye k chunku. Pozzhe oni nuzhny, chtoby fil'trovat' kandidatov i vernut' citatu v otvete generacii.

Razmer chunka i overlap - eto kompromiss, a ne konstanta: melkie chunki tochnee popadayut, no teryayut kontekst; krupnye nesut kontekst, no razmyvayut relevantnost' i upirayutsya v "lost in the middle" (<https://arxiv.org/abs/2307.03172>). Pravil'noe znachenie zavisit ot vashih dokumentov, poetomu ego podbirayut izmereniem, a ne ugadyvaniem (<https://www.pinecone.io/learn/chunking-strategies/>).

## Svyaz' s zhivym primerom

V zhivom primere iz obzora ishodnyj dokument `doc.text` rezhetsya na tri chunka po granicam predlozhenij - eto faktcheski *structural*-rez po znaku konca predlozheniya:

- `c1` = simvoly [0, 85): pervoe predlozhenie pro to, chto RAG podmeshivaet dokumenty v zapros.
- `c2` = simvoly [85, 165): pro to, chto korpus rezhut na chunki i kazhdyj chunk prevrashchayut v vektor.
- `c3` = simvoly [165, 247): pro to, chto vektory hranyat v indekse i ishchut blizhajshie.

Polya `fromChar`/`toChar` v `worked-example.json` indeksiruyut imenno `doc.text`: kazhdyj chunk - eto tochnyj srez ishodnogo teksta, a ne ego pereskaz. Eto i est' Metadata-poziciya iz drill-down v dejstvii: po nej vsegda mozhno vosstanovit', otkuda vzyat chunk.

V etom primere chunki ne peresekayutsya (overlap = 0) radi naglyadnosti. Poprobujte myslenno dobavit' overlap: pust' `c2` nachinaetsya na neskol'ko slov ran'she, zahvatyvaya hvost `c1` - tak fakt na granice predlozhenij ne poteryaetsya.

## Try it yourself

- V drill-down razvernite Splitter do komponenta `recursive` i sravnite ego summary s `fixed-size`: pochemu prioritetnyj spisok separatorov rezhet akkuratnee, chem rez "kazhdye N tokenov".
- Progonite zhivoj primer i posmotrite, kak granicy chunkov c1..c3 lozhatsya na granicy predlozhenij doc.text.
- Dal'she: glava **Embedding** beret eti chunki i prevrashchaet kazhdyj v vektor.

## Sources

- Liu et al., 2023. Lost in the Middle: How Language Models Use Long Contexts. <https://arxiv.org/abs/2307.03172>
- Pinecone. Chunking strategies. <https://www.pinecone.io/learn/chunking-strategies/>
- LangChain. RecursiveCharacterTextSplitter. <https://python.langchain.com/docs/how_to/recursive_text_splitter/>

## About this recipe

- Chast' [BrewPage Cookbook](../../../../README.md).
- Opublikovano zhivym na [brewpage.app](https://brewpage.app).
- Istochnik kontrakta BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
