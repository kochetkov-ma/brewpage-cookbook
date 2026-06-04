# How to Author a Recipe

Working guide for writing a **BrewPage Cookbook** recipe. Read before drafting.

If you only remember one thing: a recipe is a thing the reader *uses*, not a thing they *read*.

---

## 1. What a recipe IS

A recipe is an **interactive teaching artifact**, not a blog post.

A blog post explains. A recipe makes the reader do the work, see the result, and leave with a usable mental model. The difference is concrete:

- A blog post about chunking *describes* what overlap does. A recipe gives the reader a slider, shows chunks change live, and scores the result.
- A blog post about retrieval bugs *lists* the common ones. A recipe drops them into a "spot the bug" mini-game and makes the reader find them.

Every recipe is a self-contained interactive artifact that ships live on BrewPage hosting at one URL. It earns its place by teaching something hands-on that prose alone cannot. If a draft reads like an article that happens to have a code block, it is not a recipe yet.

---

## 2. Voice and style rules

Hard rules. Apply every one.

- **Open with a concrete problem, then the runnable solution path.** First paragraph names a real pain and points straight at what the reader builds. No throat-clearing, no history lesson, no "in this guide we will."
- **Real, working code only.** Every snippet must run as written. No pseudocode unless you label it `# pseudocode` on the line above. If a sample is partial, say so and link to the full source.
- **At least one interactive element per recipe.** Diagram drill-down, mini-game, calculator, sandbox, visualiser -- minimum one, ideally several placed where they teach the hardest idea in the chapter. Zero interactivity = not shippable.
- **Cite sources for facts and decisions.** Any claim of fact, any "we chose X over Y," any benchmark or number gets an inline link to a **primary source** -- the paper, the RFC, the vendor's own docs. Not a blog summary. See section 5.
- **Direct, second person.** Write "you," not "the user," not "one," not "we" (except when describing a genuinely shared decision).
- **ASCII punctuation only.** Straight quotes `'` `"`, hyphens `-`, three-dot ellipsis `...`. No smart quotes, no em-dashes, no Unicode punctuation.
- **End with "try it yourself" / "next steps."** Close every recipe with a concrete action the reader takes next -- a fork-this template, a local run, an exercise -- and a forward pointer to a related recipe.

Default to short paragraphs, concrete examples, and clear structure. When a sentence can be cut, cut it.

---

## 3. Recipe structure template

A recipe is **metadata + body**. Capture the metadata first, lock a section outline, get sign-off, *then* expand prose into HTML.

### Metadata

Every recipe records this metadata. Two complementary homes, both required:

1. **In the page head** -- as plain HTML `<meta>` tags and the `<title>`, so the published page describes itself:

```html
<title>RAG Guide</title>
<meta name="description" content="A hands-on, opinionated tour of production retrieval-augmented generation.">
<meta name="keywords" content="rag, retrieval, embeddings, llm">
<meta name="cookbook:pubDate" content="2026-05-21">
<meta name="cookbook:difficulty" content="intermediate">
```

2. **As a row in the recipes index** -- a small `recipes/index.json` entry (the same file the client-side search reads), so the cookbook can list and link the recipe:

```json
{
  "slug": "rag-guide",
  "title": "RAG Guide",
  "description": "A hands-on, opinionated tour of production retrieval-augmented generation.",
  "pubDate": "2026-05-21",
  "tags": ["rag", "retrieval", "embeddings", "llm"],
  "difficulty": "intermediate"
}
```

| Field | Rule |
|---|---|
| `title` | Short, plain, no marketing adjectives. |
| `description` | One sentence, used for the index card and the `<meta description>`. |
| `pubDate` | ISO `YYYY-MM-DD`. Set on first publish; do not back-date. |
| `tags` | Lowercase, hyphenated, 3-6 of them. Reused across recipes for discovery. |
| `difficulty` | One of `beginner`, `intermediate`, `advanced`. Set the audience expectation honestly. |

Keep the head `<meta>` and the index row in sync; they describe the same recipe.

### Body, in authoring order

Do not write top-to-bottom on the first pass. Work in this order:

1. **Lock the section outline first.** List every chapter as an `<h2>` heading with a one-line intent note under it. Get this approved before writing any prose. The outline is the contract.
2. **Write the sign-off blocks early** -- a `Sources` section, a `Try it yourself` section, a `Next steps` section, and the **About this recipe** cross-link footer. Writing the ending first keeps the body pointed at a destination.
3. **Expand chapters last.** Fill each section with prose, working code, and the interactive briefs (section 4). Lead each chapter with its problem, same as the recipe as a whole.

A chapter still skeleton stays marked with a visible `Draft skeleton.` note and a one-line description of what it must cover. The current `recipes/rag-guide/` is a worked example -- TL;DR, chapter table with status, skeleton chapters with inline interactive targets, and sign-off blocks in place.

---

## 4. Interactivity toolkit and the author / engineer handoff

Toolkit available to recipes:

- **Drill-down diagrams** (inline SVG) -- system to container to component, clickable, with vanilla-JS show/hide.
- **Mini-games** -- multiple-choice "spot the bug," tuning challenges, decision drills.
- **Calculators** -- cost math, token budgets, latency estimates the reader can plug their own numbers into.
- **Sandboxes** -- live parameter playgrounds (e.g. a chunking slider with a quality score).
- **Visualisers** -- 2D projections, charts, before/after previews.
- **Client-side search** -- full-text across the whole recipe, returning hits in under 100ms.

### The handoff: you describe, you do NOT implement

You are the author. **You do not write the interactive JavaScript.** The `interactive-engineer` does.

Your job for every interactive element:

1. **Describe in prose** what the reader sees and does -- in the body text, so the recipe reads complete even before the interactive piece exists.
2. **Leave an HTML-comment brief** at the exact insertion point, addressed to the engineer. One brief per element. Format:

```html
<!--
interactive-engineer:
  element: ChunkingSandbox
  purpose: Let the reader feel how chunk size + overlap change retrieval quality.
  inputs:
    - corpus: small fixed sample doc (provided in recipe assets)
    - sizeRange: 128..1024 tokens, default 512
    - overlapRange: 0..256 tokens, default 64
    - showQualityScore: true
  recipe-path: recipes/rag-guide/index.html#chapter-4-chunking-strategies
-->
```

The brief carries at minimum: **element** (name), **purpose** (the one idea it teaches), **inputs** (controls, ranges, defaults, data source), and **recipe-path** (where it lives). Add notes for edge cases, empty states, or a11y needs.

Keep the prose description and the brief in sync. The reader gets the prose; the engineer gets the brief; neither blocks the other.

---

## 5. Citation format

Cite as you write -- never "I will add sources later."

- **Inline hyperlinks to primary sources.** Link the claim directly to the paper, RFC, or vendor doc that backs it. A sentence about a retrieval method links to the arXiv paper, not a blog that paraphrases it.
- **Primary over secondary, always.** Original paper > official docs > standards document > reputable secondary (last resort, only when no primary exists).
- **Every fact, decision, and number is cited.** Benchmarks, "we chose X," version-specific behaviour, and quantitative claims all need a link. Unsourced numbers do not ship.
- **Per-recipe `## Sources` section.** In addition to inline links, maintain a `## Sources` block listing primary references -- a reading list and home for the inline links.
- **Stable links.** Prefer DOIs, arXiv abstract URLs, and versioned vendor doc pages over links that rot.

---

## 6. Mandatory cross-links

Hard rule from `ECOSYSTEM-PLAN.md` in the coordination repo. **Every published recipe page** must back-link to both:

- <https://brewpage.app>
- <https://github.com/kochetkov-ma/brewpage-openapi>

Put them in the recipe's `**About this recipe**` footer (and wherever the page chrome repeats them). Same requirement applies to the `README` and any package listing. A page missing either link is not done.

```markdown
**About this recipe**

- Part of the [BrewPage Cookbook](../README.md).
- Published live on [brewpage.app](https://brewpage.app).
- Source contract for the BrewPage API: [brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi).
```

---

## 7. Definition of Done

A recipe ships only when **all** of these are true. Derive the recipe-specific page count and search-corpus size from its own `features/NN-*.md` plan.

- [ ] **All chapters complete** and an editorial pass done end to end.
- [ ] **Every interactive element works with no console errors** in the latest Chrome, Firefox, and Safari.
- [ ] **Lighthouse: performance >= 90, accessibility >= 95.**
- [ ] **Client-side search returns hits in < 100ms** on the recipe's full corpus.
- [ ] **Cross-links present on every page** -- `brewpage.app` and `brewpage-openapi` (section 6).
- [ ] **Recipe added to the `README.md` index** and to the `recipes/` table, with its live URL pinned.
- [ ] **The corresponding `features/NN-<name>.md` plan is marked `SHIPPED`.**

If any box is unchecked, the recipe is in progress, not shipped. Do not tag a milestone (`vX.Y.Z`) until every box is checked.

---

## 8. Files that drift when a recipe ships

When a recipe goes live, update these in the same change:

**When the recipe ships:**

- `recipes/<name>/` -- the static folder itself (HTML, CSS, JS, assets).
- `recipes/index.json` -- the recipes index row (also feeds client-side search).
- `README.md` -- the recipe index entry.
- CI publish step -- if the recipe gets its own URL or owner-token secret.
- `features/<NN>-<name>.md` -- the plan, marked `SHIPPED`.

**When the BrewPage REST API changes upstream:**

- Re-read `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml`.
- Update any recipe code that calls REST directly.
- Bump the recipe metadata if any visible behaviour changed.

---

*This guide reflects the voice and rules in `CLAUDE.md` and the Definition of Done in `features/01-rag-guide.md`. When those drift, update this guide in lockstep.*
