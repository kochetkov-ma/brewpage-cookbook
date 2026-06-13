<!--
  RU-first embedding core section (prototype). ASCII punctuation only.
  Cite every technical claim inline. Authored markdown; HTML port comes later.
-->

# Embedding: chunk prevrashchaem v vektor

## Problema

U vas est' chunki - kuski teksta. Vopros polzovatelya - tozhe tekst, no drugimi slovami: "kak vernut' den'gi" vs chunk "politika vozvrata sredstv". Sravnenie strok zdes' ne rabotaet: sovpadayushchih slov pochti net, a smysl odin. Nuzhen sposob iskat' po smyslu, a ne po bukvam.

Reshenie - embedding: kazhdyj chunk prevrashchaem v vektor, chislovoj kod ego smysla, gde blizost' vektorov otrazhaet blizost' smysla (<https://platform.openai.com/docs/guides/embeddings>). Eto vtoroj shag konvejera iz obzora.

## Chto takoe vektor zdes'

Vektor - eto uporyadochennyj spisok chisel fiksirovannoj dliny `dim`. Model-embedder otobrazhaet tekst v tochku v `dim`-mernom prostranstve tak, chtoby teksty pohozhego smysla okazyvalis' ryadom. Naprimer, OpenAI `text-embedding-3-small` vydaet vektory dliny 1536 (<https://platform.openai.com/docs/guides/embeddings>). Imenno poetomu v `worked-example.json` u kazhdogo vektora `dim: 1536`.

Vazhno: chisla v `values` v zhivom primere - eto kratkie zaglushki dlya maketa (po tri znacheniya), a ne realnyj embedding. Realnyj vektor imeet vse 1536 komponent; pokazyvat' ih celikom bessmyslenno, poetomu animaciya pokazyvaet tol'ko fakt "chunk -> vektor", a ne syrye chisla.

## Pochemu blizost' vektorov = blizost' smysla

Posle togo kak chunki stali vektorami, "pohozhest'" izmeryayut geometricheski - chasche vsego cosine similarity, kosinus ugla mezhdu vektorami (<https://platform.openai.com/docs/guides/embeddings>). Chem men'she ugol, tem blizhe smysl. Imenno eta blizost' i pozvolyaet na shage retrieve dostat' top-k chunkov, blizhajshih k vektoru zaprosa, ne sravnivaya teksty pobukvenno.

Modeli, kotorye uchat takie predstavleniya predlozhenij, opisany v Reimers & Gurevych, 2019 ("Sentence-BERT", <https://arxiv.org/abs/1908.10084>): oni special'no obuchayut encoder tak, chtoby kosinusnaya blizost' vektorov sootvetstvovala smyslovoj blizosti predlozhenij.

## Svyaz' s zhivym primerom

Shag `s2` (kind=embed) v `worked-example.json` beret te zhe tri chunka c1..c3 iz chunking-stadii i proizvodit tri vektora v1..v3. Svyaz' yavnaya: u kazhdogo vektora est' pole `chunkId`, kotoroe ukazyvaet na ego chunk (v1 -> c1, v2 -> c2, v3 -> c3). Eto i est' otobrazhenie odin-k-odnomu: odin chunk daet rovno odin vektor.

Posle shaga `s3` (store) vektory uhodyat v indeks - eto uzhe sleduyushchaya stadiya konvejera (store/retrieve), kotoruyu polnaya versija recepta raskryvaet otdel'no.

## Try it yourself

- V `worked-example.json` projdite po vektoram v1..v3 i sopostav'te kazhdyj s chunkom po polyu `chunkId`. Ubedites', chto otobrazhenie strogo odin-k-odnomu.
- Progonite zhivoj primer do shaga embed i obratite vnimanie: menyaetsya predstavlenie (tekst -> vektor), a ne sam tekst.
- Dal'she: v polnoj versii sleduet stadiya store/retrieve - kak iz vektorov sobiraetsya indeks i kak iz nego dostayut top-k blizhajshih.

## Sources

- OpenAI. Embeddings guide (vklyuchaya text-embedding-3-small, dim=1536, cosine similarity). <https://platform.openai.com/docs/guides/embeddings>
- Reimers & Gurevych, 2019. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. <https://arxiv.org/abs/1908.10084>

## About this recipe

- Chast' [BrewPage Cookbook](../../../../README.md).
- Opublikovano zhivym na [brewpage.app](https://brewpage.app).
- Istochnik kontrakta BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
