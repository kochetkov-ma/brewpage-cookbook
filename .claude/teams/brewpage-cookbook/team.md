# Team: brewpage-cookbook

| Field | Value |
|-------|-------|
| Created | 2026-05-21 |
| Last update | 2026-06-04 |
| Agents planned | 6 |
| Agents active | 6 |
| Project | `~/IdeaProjects/brewpage-cookbook` |
| Repo | https://github.com/kochetkov-ma/brewpage-cookbook |
| Phase | ACTIVE |
| Model default | `opus` (downgrade per-agent only if cost requires) |

> Scope: standalone **BrewPage Cookbook** product. Sibling teams (`brewpage-openapi`, `brewpage-ecosystem`) live in the `brewpage-openapi` repo and are out of scope for this team. Coordination across teams happens via documentation links, never via cross-repo agent calls.

## Stack (decided)

Plain static HTML + minimal vanilla JS (ES modules) + one hand-written CSS file. NO framework (no Astro/React/Vue), NO bundler, NO build step, NO MDX, NO UI library. Around 90 percent of a recipe is plain HTML; vanilla JS only where interactivity is genuinely needed. Each recipe is a self-contained folder (`index.html` + `assets/` for `css/`, `js/`, `img/`) published DIRECTLY to BrewPage as a multi-file site -- no `dist/`, no compile. Any third-party JS/CSS comes from a CDN pinned to an exact version per `.claude/rules/versions.md`.

## Mission

Ship interactive recipes -- guides, demos, mini-apps, games -- published live on [brewpage.app](https://brewpage.app). First recipe: long-form RAG guide. Target ~40 recipes over time.

## Docs (read before starting)

| Doc | Covers | Primary readers |
|-----|--------|-----------------|
| `docs/brewpage-platform.md` | BrewPage platform reference -- limits, endpoints, namespaces, publishing, embeds/CSP | `brewpage-platform-expert` (primary), all |
| `docs/ecosystem.md` | Ecosystem repo map -- local paths + GitHub URLs, contract source of truth | `brewpage-platform-expert`, `release-engineer` |
| `docs/cookbook-architecture.md` | Stack, repo layout, publishing pipeline, release flow | `site-builder`, `release-engineer` |
| `docs/recipe-authoring.md` | Recipe voice + structure + Definition-of-Done + handoff-brief format | `cookbook-author` (primary), `interactive-engineer` |

Auto-loaded rules live in `.claude/rules/` (`versions.md`, `content.md`, `docs.md`, `tasks.md`). The canonical task board is `.claude/features/board.md` (procedure `.claude/features/TRACKER.md`).

## Agents

Active agents -- scaffolded at `.claude/agents/<name>.md`. Source of truth for the role definitions stays in this table; the agent files cross-link back here.

| Agent | Domain | Mission | Triggers | Status | Updated |
|-------|--------|---------|----------|--------|---------|
| `cookbook-author` | `recipes/**`, `features/**`, content voice, outline, editorial decisions | Owns recipe content as static HTML (no MDX). Plans, drafts, edits, ships content. Describes interactivity and hands a brief to `interactive-engineer`. Cites sources. Enforces voice and structure documented in `CLAUDE.md`. | recipe content, draft, outline, edit, static html, copy, voice, source, citation, editorial pass | active | 2026-06-04 |
| `site-builder` | Static-site scaffold (plain HTML + vanilla JS + one hand-written CSS file, no framework, no build step), shared header/footer partial, base.css, recipe folder layout, recipe content schema, client-side search wiring, pin-exact CDN deps | Owns the static-site scaffold. Builds the index, shared header/footer, base.css with CSS variables, optional search.js. Defines local preview + direct publish. Wires the recipe content schema. | scaffold, static html, layout, header, footer, base.css, css variables, preview, recipe layout, content schema, client-side search, vanilla js, cdn pin | active | 2026-06-04 |
| `interactive-engineer` | Interactive elements in vanilla JS -- C4 drill-down, mini-games, sandboxes, embedding visualiser, code playgrounds (no framework, no UI library) | Builds and maintains every interactive element across recipes in plain vanilla JS (ES modules). Diagrams are inline SVG or static images. Owns the reusable vanilla-JS bits under `assets/js/` (shared in `assets/js/lib/`). | c4, svg diagram, drill-down, mini-game, sandbox, visualiser, slider, embedding map, interactive, vanilla js, es module | active | 2026-06-04 |
| `brewpage-platform-expert` | Read-only adviser: BrewPage REST API + CLI + MCP server + SEO/growth context | Explains how to publish correctly, how namespaces/owner-tokens/passwords work, when to use multi-file vs. single-file publish, and how to align recipes with the growth story documented in `brewpage-openapi/.claude/features/deep-research-report.md`. Never edits content directly. | publish-site, namespace, owner-token, password, ttl-days, brewpage-action, brewpage cli, mcp, anchor cluster, seo, AI artifact hosting | active | 2026-05-21 |
| `release-engineer` | `.github/workflows/*.yml`, tag flow, `brewpage-action` integration, secret management | Owns CI/CD. Publishes the static recipe folder DIRECTLY to brewpage.app on push to main and on tags -- no npm build, no `dist/`. Mechanism order: `brewpage-action`, then `brewpage` CLI, then direct REST. Pins GitHub Actions to exact versions; tags are unprefixed `vX.Y.Z`. Masks owner tokens. | github actions, workflow, ci, cd, tag, release, brewpage-action, secret, BREWPAGE_OWNER_TOKEN, publish step | active | 2026-06-04 |
| `task-tracker` | `.claude/features/**` task board (read+write within `features/` ONLY) | Cross-cutting bookkeeping. Owns the canonical task board: claims tasks (`todo -> progress`), records owners/deps, and closes shipped work with a `vX.Y.Z` tag + SHA. Bookend procedure in `.claude/features/TRACKER.md`. The other five agents never hand-edit `features/`. | task board, claim, progress, close, tag, sha, board, tracker, status, backlog | active | 2026-06-04 |

## Read-only vs. write agents

- `brewpage-platform-expert` is **read-only**. It returns findings/recommendations and never edits files. The manager dispatches resulting edits to the appropriate write agent.
- `task-tracker` is a **scoped writer**: it reads anywhere but writes ONLY inside `.claude/features/**`. It owns the canonical task board; no other agent hand-edits `features/`.
- The remaining four agents (`cookbook-author`, `site-builder`, `interactive-engineer`, `release-engineer`) own writes within their product domain and delegate every board transition to `task-tracker`.

## Build order (for first recipe)

```
site-builder (static-site scaffold: index + header/footer + base.css + preview)
        |
        +--> cookbook-author (drafts content as static HTML)
        |
        +--> interactive-engineer (builds C4 + games in vanilla JS)
                                |
                                +--> release-engineer (wires direct static publish pipeline)

brewpage-platform-expert -- advises any of the above on demand (cross-cutting, read-only)
task-tracker             -- moves the board for any of the above (cross-cutting bookkeeping; writes only in .claude/features/**)
```

## How to expand the team

Add a new agent when a recipe surfaces a clear, recurring role gap (e.g. `c4-diagram-author` if hand-drawn SVG diagrams need a dedicated owner; `editor-in-chief` if recipe volume exceeds one author's bandwidth).

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

- Default model: `opus` for all six agents.
- Tooling: each write agent gets `Read, Edit, Write, Glob, Grep, Bash`; the read-only `brewpage-platform-expert` gets `Read, Grep, Glob, Bash` only. `task-tracker` gets write tools but is scoped to `.claude/features/**` by its instructions.
- Place generated agent files under `.claude/agents/<name>.md`.
- Each agent's description should be specific enough to delegate reliably (see triggers column above).
- Cross-link every agent back to this `team.md` in its frontmatter description.
