# Team: brewpage-cookbook

| Field | Value |
|-------|-------|
| Created | 2026-05-21 |
| Last update | 2026-05-21 |
| Agents planned | 5 |
| Agents active | 0 |
| Project | `~/IdeaProjects/brewpage-cookbook` |
| Repo | https://github.com/kochetkov-ma/brewpage-cookbook |
| Phase | SCAFFOLD |
| Model default | `opus` (downgrade per-agent only if cost requires) |

> Scope: standalone **BrewPage Cookbook** product. Sibling teams (`brewpage-openapi`, `brewpage-ecosystem`) live in the `brewpage-openapi` repo and are out of scope for this team. Coordination across teams happens via documentation links, never via cross-repo agent calls.

## Mission

Ship interactive recipes -- guides, demos, mini-apps, games -- published live on [brewpage.app](https://brewpage.app). First recipe: long-form RAG guide. Target ~40 recipes over time.

## Planned agents

These are **role definitions**, not yet `.claude/agents/*.md` files. The maintainer will run a scaffolding skill (`/brewcode:teams` or `/brewcode:agents`) to produce the per-agent files. Add or split roles only after a recipe shows the need.

| Agent | Domain | Mission | Triggers | Status |
|-------|--------|---------|----------|--------|
| `cookbook-author` | `recipes/**`, `features/**`, content voice, outline, editorial decisions | Owns recipe MDX. Plans, drafts, edits, ships content. Cites sources. Enforces voice and structure documented in `CLAUDE.md`. | recipe content, draft, outline, edit, mdx, copy, voice, source, citation, editorial pass | planned |
| `astro-cookbook-platform` | Astro 5 platform, Tailwind + daisyUI, layouts, routing, build pipeline, content collections schema, client-side search wiring | Owns the Astro scaffold and shared platform layer. Installs deps. Decides build/preview commands. Wires `src/content/recipes` collection and search index. | astro, layout, component, content collection, BaseLayout, RecipeLayout, tailwind, daisyui, pagefind, fuse, build, dev server | planned |
| `interactive-engineer` | React islands -- C4 drill-down, mini-games, sandboxes, embedding visualiser, code playgrounds | Builds and maintains every interactive element across recipes. Owns reusable component library under `src/components/interactive/`. | react, island, c4, mermaid, drill-down, mini-game, sandbox, visualiser, slider, embedding map, interactive | planned |
| `brewpage-platform-expert` | Read-only adviser: BrewPage REST API + CLI + MCP server + SEO/growth context | Explains how to publish correctly, how namespaces/owner-tokens/passwords work, when to use multi-file vs. single-file publish, and how to align recipes with the growth story documented in `brewpage-openapi/.claude/features/deep-research-report.md`. Never edits content directly. | publish-site, namespace, owner-token, password, ttl-days, brewpage-action, brewpage cli, mcp, anchor cluster, seo, AI artifact hosting | planned |
| `release-engineer` | `.github/workflows/*.yml`, tag flow, `brewpage-action` integration, secret management | Owns CI/CD. Publishes recipes to brewpage.app on push to main and on tags. Falls back to `brewpage` CLI or direct REST while `brewpage-action` is pre-release. Masks owner tokens. Synchronises `package.json` version from tags. | github actions, workflow, ci, cd, tag, release, brewpage-action, secret, BREWPAGE_OWNER_TOKEN, publish step | planned |

## Read-only vs. write agents

- `brewpage-platform-expert` is **read-only**. It returns findings/recommendations and never edits files. The manager dispatches resulting edits to the appropriate write agent.
- The other four agents own writes within their domain.

## Build order (for first recipe)

```
astro-cookbook-platform (scaffold)
        |
        +--> cookbook-author (drafts content)
        |
        +--> interactive-engineer (builds C4 + games)
                                |
                                +--> release-engineer (wires publish pipeline)

brewpage-platform-expert -- advises any of the above on demand
```

## How to expand the team

Add a new agent when a recipe surfaces a clear, recurring role gap (e.g. `c4-diagram-author` if Mermaid is replaced by hand-drawn SVG; `editor-in-chief` if recipe volume exceeds one author's bandwidth).

Procedure:

1. Add a row to **Planned agents** above with name, domain, mission, triggers.
2. Run `/brewcode:agents create <name>` (or `/brewcode:teams update`) to scaffold the `.md`.
3. When active, flip `Status` to `active` and add an `Updated` date.

## Cross-team coordination

This team does **not** call agents in other teams or other repos.

External read-only references:

- **BrewPage platform** -- https://brewpage.app (target of every publish).
- **brewpage-openapi** -- https://github.com/kochetkov-ma/brewpage-openapi (REST contract source of truth + ecosystem coordination + this module's stub folder `modules/cookbook/`).
- **Deep-research / growth context** -- `~/IdeaProjects/brewpage-openapi/.claude/features/deep-research-report.md` (consulted by `brewpage-platform-expert` when aligning recipe positioning with anchor clusters).

If a recipe needs to demonstrate a sibling module (CLI, extension, Action), link to its public package documentation. Never wire cross-repo agent calls and never assume any local sibling clone exists.

## Activity log

Per-agent activity will be tracked at `.claude/teams/brewpage-cookbook/trace.jsonl` once agents land.

## Notes for the scaffolding skill

When `/brewcode:teams` or `/brewcode:agents` is run against this file:

- Default model: `opus` for all five agents.
- Tooling: each agent gets `Read, Edit, Write, Glob, Grep, Bash`; the read-only `brewpage-platform-expert` gets `Read, Grep, Glob, Bash` only.
- Place generated agent files under `.claude/agents/<name>.md`.
- Each agent's description should be specific enough to delegate reliably (see triggers column above).
- Cross-link every agent back to this `team.md` in its frontmatter description.
