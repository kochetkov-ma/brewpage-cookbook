# BrewPage Cookbook

Interactive recipes for AI artifact workflows -- guides, demos, mini-apps and games, each built as a self-contained interactive artifact and published live on [brewpage.app](https://brewpage.app). It is a standalone editorial brand under the BrewPage ecosystem (in the spirit of the [anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) and Stripe Press), not a docs folder or a marketing site. The target is roughly 40 recipes over time. Status: **SCAFFOLD** (pre-release, no production tag yet). Bootstrapped 2026-05-21.

## First recipe

[RAG Guide](./recipes/rag-guide/) -- a long-form interactive walkthrough of retrieval-augmented generation, with inline-SVG drill-down diagrams, mini-games and client-side search. It doubles as the production dogfood for the publish pipeline. _Draft._

The editorial plan for it lives in [`features/01-rag-guide.md`](./features/01-rag-guide.md).

## What this is

Each recipe is a thing the reader *uses*, not a thing they *read*: it opens with a concrete problem, gives a runnable solution path, includes at least one interactive element, cites every claim to a primary source, and closes with "try it yourself" and "next steps." Recipes are authored here as plain static HTML with a little vanilla JavaScript, and published to BrewPage as multi-file sites -- no build step, the files ship exactly as authored. The cookbook keeps its own release cadence, independent of the BrewPage REST contract.

## Documentation

The deeper references live in [`docs/`](./docs/) -- read the one whose topic you are touching:

- [`docs/brewpage-platform.md`](./docs/brewpage-platform.md) -- what the BrewPage platform hosts and how to publish to it: content types, endpoints, namespaces and the privacy boundary, limits, rate limits, owner tokens, and the trusted-embed rules a recipe must live within.
- [`docs/ecosystem.md`](./docs/ecosystem.md) -- the full ecosystem map: every sibling module with its local path and GitHub URL, the contract source of truth, and where the cookbook fits in the build order.
- [`docs/cookbook-architecture.md`](./docs/cookbook-architecture.md) -- the engineering reference: stack, repository layout, recipe lifecycle, the publish pipeline, and the release flow.
- [`docs/recipe-authoring.md`](./docs/recipe-authoring.md) -- the editorial standard: voice and style rules, the structure template, the author/engineer handoff, citation format, and the per-recipe Definition of Done.

## How work is tracked

The canonical work list is the task board at [`.claude/features/board.md`](./.claude/features/board.md). Folder name equals task status -- a task file moves through `backlog/`, `todo/`, `progress/` and `closed/` as it advances, and the board row moves with it. There is no root `TODO.md`. Board transitions (claiming, moving, closing, recording the release tag and commit) go through the `task-tracker` agent so the board, the task frontmatter and the folder always stay in lockstep; they are not hand-edited. The full procedure is in [`.claude/features/TRACKER.md`](./.claude/features/TRACKER.md). Per-recipe editorial plans are a separate surface and live in [`features/`](./features/).

## Agents

Six domain agents live under [`.claude/agents/`](./.claude/agents/), each owning one slice of the work:

- [`cookbook-author`](./.claude/agents/cookbook-author.md) -- recipe content owner: plans, drafts, edits and ships recipe prose, voice and citations.
- [`site-builder`](./.claude/agents/site-builder.md) -- builds and owns the site platform: scaffold, shared layouts, content schema, search wiring and dependencies.
- [`interactive-engineer`](./.claude/agents/interactive-engineer.md) -- builds every interactive element (C4 drill-downs, mini-games, sandboxes, visualisers) and the reusable component library.
- [`release-engineer`](./.claude/agents/release-engineer.md) -- owns CI/CD: GitHub Actions workflows, the tag flow, the publish step and secret masking.
- [`brewpage-platform-expert`](./.claude/agents/brewpage-platform-expert.md) -- read-only adviser on the BrewPage REST/CLI/MCP/action surfaces, namespaces, owner tokens and TTL; routes edits to the write agents.
- [`task-tracker`](./.claude/agents/task-tracker.md) -- owns the task board: claims, moves and closes tasks, grooms the backlog, and keeps everything in sync.

The team definition (roles, build order, expansion) is in [`.claude/teams/brewpage-cookbook/team.md`](./.claude/teams/brewpage-cookbook/team.md).

## Stack

Deliberately the simplest stack -- plain static HTML, no framework, no build step:

- **Plain static HTML** -- one file per page; about 90% of a recipe is just HTML.
- **Minimal vanilla JavaScript (ES modules)** -- added only where real interactivity is needed.
- **One small hand-written CSS file** -- styling via CSS variables; no Tailwind, no component library.
- **Inline SVG or static images** -- for diagrams, drawn by hand or exported once, not generated at build time.
- **Tiny vanilla JS over a small JSON index** -- in-browser client-side search, if a recipe needs it.

There is no bundler, no compile step, and no `dist/`: a recipe is a self-contained folder of static files that ships exactly as authored. Any third-party JS or CSS is loaded from a CDN pinned to an exact `X.Y.Z` -- no floating versions (`@latest`, `^x.y`, `~x.y`, `:latest` and friends are forbidden anywhere). The concrete version numbers are resolved against the registry before use, not guessed here.

## Publishing

Every push to `main` publishes the recipe's static folder directly to BrewPage as a multi-file site -- there is no build step (a recipe is a multi-file bundle, so it must fit 20 MB total / 100 files / 5 MB per file). The publish mechanism is chosen in preference order, falling back only as needed:

1. **`brewpage-action`** -- preferred; this repo is its first production consumer (dogfood). [`kochetkov-ma/brewpage-action`](https://github.com/kochetkov-ma/brewpage-action), once released.
2. **`brewpage` CLI** -- `npx brewpage publish-site ./recipes/<slug>`, while the action is pre-release.
3. **Direct REST** against `https://brewpage.app` -- last resort.

Each recipe has its own BrewPage owner token, stored as a masked GitHub repo secret and injected at CI time. Owner tokens are never committed and are not recoverable. Content-only changes ship to the live URL on merge; a tag (unprefixed `vX.Y.Z`) marks a curated milestone.

## Where this fits

This repository is **one module** in the BrewPage ecosystem. It knows about only two external surfaces: the live platform at [brewpage.app](https://brewpage.app) (the publish target) and the coordination repo [`brewpage-openapi`](https://github.com/kochetkov-ma/brewpage-openapi), which holds the REST contract (the source of truth) and the master ecosystem plan every module consumes. All other modules -- CLIs, extensions, clients, the Action, the MCP server -- are coordinated through `brewpage-openapi` and are intentionally invisible from here. A reference stub for this module lives in the coordination repo at [`modules/cookbook/`](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook). The full repo map is in [`docs/ecosystem.md`](./docs/ecosystem.md).

## Layout

```
brewpage-cookbook/
  README.md              -- this file (humans)
  CLAUDE.md              -- project identity for Claude Code (LLM-facing)
  LICENSE                -- Apache-2.0
  docs/                  -- engineering & authoring references
    brewpage-platform.md       -- platform reference (publish, limits, embeds)
    ecosystem.md               -- ecosystem & repo map
    cookbook-architecture.md   -- stack, layout, pipeline, release flow
    recipe-authoring.md        -- voice, structure, Definition of Done
  features/              -- per-recipe editorial plans
    01-rag-guide.md
  recipes/               -- one self-contained static folder per recipe (HTML/CSS/JS/assets)
    rag-guide/
      index.html
  .claude/
    agents/              -- six domain agents
    features/            -- task board (canonical work list) + tracking procedure
    rules/               -- auto-loaded version/content/docs/task/privacy rules
    teams/brewpage-cookbook/
      team.md            -- agent team definition
```

## License

Apache-2.0. See [LICENSE](./LICENSE).

## Links

- BrewPage platform -- https://brewpage.app
- Ecosystem coordination / contract repo -- https://github.com/kochetkov-ma/brewpage-openapi
- Reference stub in the coordination repo -- https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook
- This repo -- https://github.com/kochetkov-ma/brewpage-cookbook
- Issues -- https://github.com/kochetkov-ma/brewpage-cookbook/issues

---

_Bootstrapped: 2026-05-21._
