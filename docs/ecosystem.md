# BrewPage Ecosystem Map

The **cookbook is one module** in the BrewPage ecosystem, not a standalone project. It is an editorial product: a set of interactive recipes published live on the platform. As a module it needs to know only **two external surfaces** -- the **live platform** at [https://brewpage.app](https://brewpage.app) (where recipes are hosted) and the **coordination repo** at [https://github.com/kochetkov-ma/brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi) (the OpenAPI contract + master plan that every module consumes). Everything else in the ecosystem is coordinated through that one repo; the cookbook does not depend directly on the clients, CLIs, or extensions listed below.

## Coordination & contract

| Role | Location |
|---|---|
| **Source of truth (API contract)** | `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml` -- remote: [openapi/openapi.yaml](https://github.com/kochetkov-ma/brewpage-openapi/blob/main/openapi/openapi.yaml) |
| **Master plan** | `~/IdeaProjects/brewpage-openapi/ECOSYSTEM-PLAN.md` -- remote: [ECOSYSTEM-PLAN.md](https://github.com/kochetkov-ma/brewpage-openapi/blob/main/ECOSYSTEM-PLAN.md) |
| **Module reference stubs** | `~/IdeaProjects/brewpage-openapi/modules/<name>/` -- remote: [modules/](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules) |
| **Released MCP server (exception -- lives in coordination repo)** | `~/IdeaProjects/brewpage-openapi/mcp-server/` -- remote: [mcp-server/](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/mcp-server) |

Strategy (locked 2026-05-20 in `ECOSYSTEM-PLAN.md`): **per-repo distribution + monorepo coordination from `brewpage-openapi`**. Every module ships from its own GitHub repo (`kochetkov-ma/brewpage-*`); `brewpage-openapi` holds the contract, the existing `mcp-server`, the agents/skills, the master plan, and one reference folder per module under `modules/<name>/`. No git submodules -- the reference folder is either a stub `README.md` (module not yet built) or a working snapshot of the dev repo's tree (module built).

## Repo map

GitHub URLs follow `https://github.com/kochetkov-ma/<repo>`. Every URL below is traceable either to the `ECOSYSTEM-PLAN.md` "Repo map" / "Naming conventions" tables or to a confirmed local repo. Local paths were each checked with `ls -d`.

### Live repos (confirmed to exist locally)

| Repo | Purpose | Local path | Local exists? | GitHub URL | Status |
|---|---|---|---|---|---|
| `brewpage-app` | Proprietary platform: HTML/KV/JSON/file hosting backend (Spring/Kotlin) + frontend + infra. Serves `brewpage.app`. | `~/IdeaProjects/brewpage-app` | **yes** | `github.com/kochetkov-ma/brewpage-app` (inferred -- not named in ECOSYSTEM-PLAN.md; the platform itself, kept private) | RELEASED (live platform) |
| `brewpage-openapi` | **Coordination layer.** OpenAPI contract (source of truth), released `mcp-server` (npm `brewpage-mcp`), Astro doc site, agents/skills, master plan, module stubs. | `~/IdeaProjects/brewpage-openapi` | **yes** | [github.com/kochetkov-ma/brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi) | RELEASED |
| `brewpage-cookbook` | **This repo.** Interactive recipes for AI artifact workflows, published live on BrewPage. One module / dogfood consumer. | `~/IdeaProjects/brewpage-cookbook` | **yes** | [github.com/kochetkov-ma/brewpage-cookbook](https://github.com/kochetkov-ma/brewpage-cookbook) | SCAFFOLD (`modules/cookbook/`, Phase P1, task #11) |

#### Confirmed-local repos not part of the BrewPage publishing ecosystem

These exist locally and are named in the project memory's "confirmed-real" list, but they are **not** listed in `ECOSYSTEM-PLAN.md` and are not BrewPage modules. Listed here only for completeness so they are not mistaken for ecosystem modules.

| Repo | Purpose | Local path | Local exists? | GitHub URL | Status |
|---|---|---|---|---|---|
| `brewcode-app` | Separate product: private infra repo for Brewcode (`brewcode.app`) -- VPS/deploy/ops. Sibling, not a BrewPage module. | `~/IdeaProjects/brewcode-app` | **yes** | `github.com/kochetkov-ma/brewcode-app` (inferred -- not in ECOSYSTEM-PLAN.md) | out of ecosystem scope |
| `claude-brewcode` | Separate product: Claude Code plugin / marketplace (`doc-claude.brewcode.app`). Sibling, not a BrewPage module. | `~/IdeaProjects/claude-brewcode` | **yes** | [github.com/kochetkov-ma/claude-brewcode](https://github.com/kochetkov-ma/claude-brewcode) (confirmed via repo README badges) | out of ecosystem scope |
| `brewai-hub` | Separate product: "Speech Hub" self-hosted STT API. Unrelated to BrewPage hosting / publishing. | `~/IdeaProjects/brewai-hub` | **yes** | `github.com/kochetkov-ma/brewai-hub` (inferred -- not in ECOSYSTEM-PLAN.md) | out of ecosystem scope |

### Planned modules (stubs in `brewpage-openapi/modules/`)

Each is a **reference stub** under `brewpage-openapi/modules/<name>/` -- confirmed present (listed via `ls -d`). None has a standalone local repo: each `ls -d ~/IdeaProjects/<repo>` returned MISSING. The "Future repo" / GitHub URL comes straight from the `ECOSYSTEM-PLAN.md` Repo-map table. Status = the phase / task from that table.

| Module | Purpose / channel | Stub path (local, confirmed) | Standalone repo exists locally? | GitHub URL (future repo) | Status |
|---|---|---|---|---|---|
| `brewpage-mcp` (MCP server) | TypeScript stdio MCP server, npm `brewpage-mcp`. **Lives inside `brewpage-openapi`** (root `mcp-server/`), not a separate repo. | `~/IdeaProjects/brewpage-openapi/mcp-server` | n/a (part of `brewpage-openapi`) | [github.com/kochetkov-ma/brewpage-openapi/tree/main/mcp-server](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/mcp-server) | RELEASED |
| `client-ts` | TS client library, npm `brewpage-client`. | `~/IdeaProjects/brewpage-openapi/modules/client-ts/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-client-ts` | PLANNED P1 (task #1) |
| `cli-node` | Node CLI, npm `brewpage`. | `~/IdeaProjects/brewpage-openapi/modules/cli-node/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-cli` | PLANNED P1 (task #3) |
| `ext-vscode` | VS Code extension (VS Marketplace + Open VSX). | `~/IdeaProjects/brewpage-openapi/modules/ext-vscode/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-vscode` | PLANNED P1 (task #6) |
| `action` | GitHub Action (Actions Marketplace), `@v1`. **Cookbook's publish dependency.** | `~/IdeaProjects/brewpage-openapi/modules/action/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-action` | PLANNED P1 (task #8) |
| `client-python` | Python client, PyPI `brewpage-client`. | `~/IdeaProjects/brewpage-openapi/modules/client-python/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-client-python` | PLANNED P2 (task #2) |
| `cli-python` | Python CLI, PyPI `brewpage`. | `~/IdeaProjects/brewpage-openapi/modules/cli-python/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-cli-python` | PLANNED P2 (task #4) |
| `ext-chrome` | Browser extension (Chrome Web Store + Edge + AMO). | `~/IdeaProjects/brewpage-openapi/modules/ext-chrome/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-chrome` | PLANNED P2 (task #7) |
| `cli-homebrew` | Homebrew tap, `brew install kochetkov-ma/tap/brewpage`. Repo named `homebrew-tap` (Homebrew naming requirement). | `~/IdeaProjects/brewpage-openapi/modules/cli-homebrew/` | no (stub-only) | `github.com/kochetkov-ma/homebrew-tap` | PLANNED P2 (task #5) |
| `docs-user` | User-facing docs site (Astro, GitHub Pages). | `~/IdeaProjects/brewpage-openapi/modules/docs-user/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-docs` | PLANNED P2 (task #9) |
| `hf-space` | HuggingFace Space (static SDK), P3 backlink surface. | `~/IdeaProjects/brewpage-openapi/modules/hf-space/` | no (stub-only) | `github.com/kochetkov-ma/brewpage-hf-space` | PLANNED P3 (task #10) |
| `cookbook` | Reference stub for **this** repo (`brewpage-cookbook`). | `~/IdeaProjects/brewpage-openapi/modules/cookbook/` | dev repo IS `brewpage-cookbook` (see Live repos) | [github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook) | SCAFFOLD / PLANNED P1 (task #11) |

> **Inference flags.** `brewpage-app`, `brewcode-app`, `brewai-hub` GitHub URLs are **inferred** from the `kochetkov-ma/<repo>` convention -- not named in `ECOSYSTEM-PLAN.md`. `claude-brewcode` is confirmed (its own README links to `github.com/kochetkov-ma/claude-brewcode`). All planned-module GitHub URLs are **explicit** in the `ECOSYSTEM-PLAN.md` Repo-map table.

## Where the cookbook fits

The cookbook is an **independent, P1 module** and the ecosystem's **first production consumer / dogfood**. In the `ECOSYSTEM-PLAN.md` build order it has no upstream blocker except its publish path:

```
cookbook  (independent -- consumes brewpage-action for publish; first production consumer / dogfood)
```

**Publish path.** Recipes are authored here as **plain static HTML with a little vanilla JavaScript** (no build step), then **published to `brewpage.app`** as hosted multi-file sites -- the static folder ships exactly as authored. The intended publish mechanism is the GitHub Action **`brewpage-action`** (`modules/action/`, planned P1) -- i.e. the cookbook eats the ecosystem's own dog food. Both `brewpage-action` and the `brewpage` CLI (`modules/cli-node/`, planned P1) are not yet released, so **today the only working publish path is a direct REST call** against the OpenAPI contract; switch to the Action (preferred), then the CLI, once they ship. The cookbook's own `README.md` already states this: it publishes "via `brewpage-action` (once released) or the `brewpage` CLI."

The cookbook depends on **only two external surfaces**:
1. **The platform** -- [https://brewpage.app](https://brewpage.app) -- the host for every recipe.
2. **The coordination repo** -- [https://github.com/kochetkov-ma/brewpage-openapi](https://github.com/kochetkov-ma/brewpage-openapi) -- the contract it (indirectly, via the Action/CLI) publishes against.

A reference stub for this module lives in the coordination repo at [`modules/cookbook/`](https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook).

## Mandatory cross-link rule

Hard rule from `ECOSYSTEM-PLAN.md` ("Cross-links -- Mandatory in every artefact") and reinforced in `brewpage-openapi/CLAUDE.md`: **every README, every recipe, every package/marketplace listing must back-link to both**:

- the platform home -- **https://brewpage.app**
- the contract source of truth -- **https://github.com/kochetkov-ma/brewpage-openapi**

Where applicable, also link the module's own dev repo and (once it exists) the user-facing docs site `brewpage-docs`. Match the existing `brewpage-mcp` README link pattern. This is non-negotiable: it powers the SEO entity-graph and AI-search discoverability that justified the per-repo strategy over a monorepo (decision logged 2026-05-20).

---

**Links**
- Platform -- https://brewpage.app
- Coordination / contract repo -- https://github.com/kochetkov-ma/brewpage-openapi
- This repo -- https://github.com/kochetkov-ma/brewpage-cookbook
- Reference stub -- https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook
