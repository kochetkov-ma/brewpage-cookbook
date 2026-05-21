# CLAUDE.md

This file gives Claude Code the full picture of what this repository is, where it sits and how to work in it. Read it before doing anything else.

## Identity

**BrewPage Cookbook** -- a standalone product brand under the BrewPage ecosystem.

- Repository: `kochetkov-ma/brewpage-cookbook`
- Bootstrapped: 2026-05-21
- Status: SCAFFOLD

What we are:

- An open-source collection of **interactive recipes** -- guides, demos, mini-apps, games -- for AI artifact workflows.
- Every recipe is a self-contained interactive artifact published live on **BrewPage hosting**.
- Editorial product. Standalone brand. Own release cadence, independent of the OpenAPI contract.

Precedent: [`anthropic-cookbook`](https://github.com/anthropics/anthropic-cookbook) (interactive AI guides), Stripe Press (standalone editorial brand under a developer platform).

## First recipe

`recipes/rag-guide.md` -- long-form interactive RAG walkthrough (about 15 pages, Astro+React, C4 drill-down, mini-games, client-side search). Target ~40 recipes total over time.

Plan: `features/01-rag-guide.md`.

## Where this lives in the BrewPage ecosystem

This repository is **one module** in the BrewPage ecosystem. By design, it knows about only two external surfaces:

### 1. BrewPage platform -- the live hosting service we publish to

| Surface | Where |
|---|---|
| Live platform | https://brewpage.app |
| llms.txt | https://brewpage.app/llms.txt |
| llms-full.txt | https://brewpage.app/llms-full.txt |
| Public OpenAPI | https://brewpage.app/api/openapi.yaml |
| Public homepage gallery | https://brewpage.app (`public` namespace) |

This is where every recipe ends up. The publishing target.

### 2. brewpage-openapi -- the sister coordination repository

| Surface | Where |
|---|---|
| GitHub repo | https://github.com/kochetkov-ma/brewpage-openapi |
| Local path (this machine) | `~/IdeaProjects/brewpage-openapi` |
| Reference folder for this module (remote) | https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook |
| Reference folder for this module (local) | `~/IdeaProjects/brewpage-openapi/modules/cookbook` |
| OpenAPI contract (source of truth) | `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml` |
| MCP server (read-only reference) | `~/IdeaProjects/brewpage-openapi/mcp-server/` |
| Master ecosystem plan | `~/IdeaProjects/brewpage-openapi/ECOSYSTEM-PLAN.md` |

What `brewpage-openapi` is:

- The **source of truth for the BrewPage REST API contract** (`openapi/openapi.yaml`).
- The **coordination layer** where reference stubs for every ecosystem module are indexed.

What we do with it from here:

- Pull contract changes (read the YAML, follow whatever the latest contract says).
- Treat its `modules/cookbook/` stub as the canonical entry-point for this module in ecosystem indexes.

What we do **not** do:

- Push code into `brewpage-openapi`. The reference stub there is maintained as part of `brewpage-openapi`'s own workflow.
- Cross-call agents living in `brewpage-openapi`'s `.claude/`. Their teams are out of scope.

## What this repository does **not** know about

The BrewPage ecosystem has other modules -- CLIs, browser extensions, IDE extensions, language clients, a GitHub Action, a HuggingFace Space. **They are intentionally invisible from this repository.**

If a recipe needs to demonstrate a sibling module (e.g. `brewpage` CLI or VS Code extension), link to its public package documentation -- do not wire cross-repo agent calls and do not assume any local sibling clone exists.

Coordination across modules happens in `brewpage-openapi`, never here.

## Where this repository itself lives

| Surface | Where |
|---|---|
| GitHub repo | https://github.com/kochetkov-ma/brewpage-cookbook |
| Local path (this machine) | `~/IdeaProjects/brewpage-cookbook` |
| Published recipes | https://brewpage.app (one URL per recipe; subdomain decision TBD) |
| Issue tracker | https://github.com/kochetkov-ma/brewpage-cookbook/issues |
| Releases | GitHub Releases + tags `vX.Y.Z` (unprefixed) on this repo |

## Stack

Planned (will land as the platform scaffold is built by the `astro-cookbook-platform` agent):

- Astro 5 -- static site generator, content-focused.
- React -- interactive islands.
- Tailwind CSS + daisyUI -- styling.
- Mermaid -- C4 diagrams with drill-down.
- Pagefind or Fuse.js -- client-side search.
- TypeScript -- strict mode.

Until then, `package.json` is a placeholder and recipes live as `.md` (not `.mdx`).

## Publishing pipeline

Every push to `main` -> `npm run build` -> publish `dist/` to BrewPage as a multi-file site.

Publish mechanism, in order of preference (fall back as needed):

1. [`kochetkov-ma/brewpage-action@v1`](https://github.com/kochetkov-ma/brewpage-action) -- preferred once released. This repository is the action's **first production consumer** (dogfood).
2. `brewpage` CLI -- `npx brewpage publish-site ./dist`. Used while the action is pre-release.
3. Direct REST against `https://brewpage.app` -- last resort.

Owner tokens for each recipe are stored as repo secrets (`BREWPAGE_OWNER_TOKEN_<RECIPE>`). **Never commit owner tokens.**

## Release flow

- Content-only PRs to `main` ship straight to the live URL on merge.
- Tag bumps (`vX.Y.Z`) mark curated milestones (e.g. a complete recipe ships).
- Tags are unprefixed -- `v0.1.0`, `v1.0.0` -- matching the rest of the BrewPage ecosystem.
- Do **not** edit `package.json` version manually; CI (once installed) overwrites it from the tag.

## Cross-link requirement (mandatory)

Every `README`, every published recipe page, every package listing must back-link to:

- https://brewpage.app
- https://github.com/kochetkov-ma/brewpage-openapi (contract source of truth)

This is a hard rule from `ECOSYSTEM-PLAN.md` in the coordination repo.

## File layout

```
brewpage-cookbook/
  README.md
  CLAUDE.md                              -- this file
  LICENSE                                -- Apache-2.0
  .gitignore
  package.json                           -- minimal placeholder
  features/                              -- short per-recipe plans, written before drafting
    01-rag-guide.md
  recipes/                               -- recipe drafts; will migrate to .mdx with Astro
    rag-guide.md
  .claude/
    teams/brewpage-cookbook/
      team.md                            -- planned agent team
    agents/                              -- created by /brewcode:teams or /brewcode:agents
```

## Voice and content style

Recipes are interactive teaching artifacts, not blog posts. Each recipe must:

- Open with a concrete problem and the runnable solution path.
- Use real, working code -- no pseudocode unless explicitly labelled.
- Include at least one interactive element (diagram drill-down, mini-game, calculator, sandbox).
- Cite sources for facts and decisions.
- End with a "try it yourself" / "next steps" pointer.

## Files that drift if you forget

When a recipe ships:

- `recipes/<name>.md` (or `.mdx`) -- content.
- `recipes/<name>/` -- assets if any.
- `README.md` recipe index entry.
- CI publish step if the recipe gets its own URL or secret.
- The corresponding `features/<NN>-<name>.md` plan should be marked `SHIPPED`.

When the BrewPage REST API changes upstream:

- Re-read `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml`.
- Update any code that calls REST directly.
- Bump the recipe metadata if any visible behaviour changed.

## Teams and agents

Team `brewpage-cookbook` is planned in `.claude/teams/brewpage-cookbook/team.md` (five planned agents). Individual agent files under `.claude/agents/` are scaffolded later via `/brewcode:teams` or `/brewcode:agents`.

Sibling teams (`brewpage-openapi`, `brewpage-ecosystem`) live in the coordination repo and are out of scope here.

## Notes for the model

- This is the **only** CLAUDE.md you need in this repository. Other modules in the ecosystem have their own CLAUDE.md in their own repos; ignore them.
- Default to recipe-quality writing: short paragraphs, concrete examples, runnable code, clear structure.
- Default response language is English (matches the OSS audience). Reply in the maintainer's language when chatting.
- When in doubt about API behaviour, the authoritative answer is in `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml`. Read it before guessing.
