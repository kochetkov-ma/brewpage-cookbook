# BrewPage Cookbook

Interactive recipes for AI artifact workflows -- guides, demos, mini-apps and games published live on [brewpage.app](https://brewpage.app).

> **Status:** SCAFFOLD. Bootstrapped 2026-05-21. First recipe in progress.

## First recipe

[RAG Guide](./recipes/rag-guide.md) -- a long-form interactive walkthrough of retrieval-augmented generation (about 15 pages, C4 drill-down diagrams, mini-games, client-side search). _Draft._

Plan: [`features/01-rag-guide.md`](./features/01-rag-guide.md).

## What this is

A standalone editorial product under the BrewPage ecosystem. Each recipe is a self-contained interactive artifact you can read, play with and learn from -- hosted live on BrewPage.

Target: about 40 recipes covering AI artifact patterns, agent workflows, content hosting and MCP integrations.

Precedent: [anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) (interactive AI guides), Stripe Press (standalone editorial brand under a developer platform).

## Stack

Astro 5, React (interactive islands), Tailwind + daisyUI, Mermaid (C4 diagrams), client-side search.

The scaffold is intentionally minimal right now -- the platform layer will be installed by the `astro-cookbook-platform` agent (see `.claude/teams/brewpage-cookbook/team.md`).

## Where this fits

This repository is **one module** in the BrewPage ecosystem. The coordination layer (and the source-of-truth OpenAPI contract for the BrewPage REST API) lives at [`brewpage-openapi`](https://github.com/kochetkov-ma/brewpage-openapi). Recipes here publish to [brewpage.app](https://brewpage.app) via [`brewpage-action`](https://github.com/kochetkov-ma/brewpage-action) (once released) or the `brewpage` CLI.

A reference stub for this module lives in the coordination repo at [`modules/cookbook/`](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook).

## Layout

```
brewpage-cookbook/
  README.md              -- this file (humans)
  CLAUDE.md              -- project identity for Claude Code
  LICENSE                -- Apache-2.0
  package.json           -- minimal scaffold; Astro deps installed later
  features/              -- per-recipe plans (short, written before drafting)
    01-rag-guide.md
  recipes/               -- recipe drafts in Markdown; migrate to MDX once Astro lands
    rag-guide.md
  .claude/
    teams/brewpage-cookbook/
      team.md            -- planned agent team
```

## Contributing

Coming soon. For now this is a hand-curated cookbook driven by a single maintainer.

## License

Apache-2.0. See [LICENSE](./LICENSE).

## Links

- BrewPage -- https://brewpage.app
- Ecosystem coordination repo -- https://github.com/kochetkov-ma/brewpage-openapi
- Reference folder in coordination repo -- https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook
- This repo -- https://github.com/kochetkov-ma/brewpage-cookbook
- Issues -- https://github.com/kochetkov-ma/brewpage-cookbook/issues

---

_Bootstrapped: 2026-05-21. Last updated: 2026-05-21._
