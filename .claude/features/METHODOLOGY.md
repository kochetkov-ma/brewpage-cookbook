---
doc_type: llm
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

# brewpage-cookbook task methodology

Domains: RECIPE, PLATFORM, CONTENT, INTERACTIVE, CI, DOCS, SEO. Derive the method from the domain's risks and local instructions; specialize it in each task's `## Methodology` before implementation. Keep this shared method about the domain, not one task's execution history. Content follows English.

Cross-domain rules (all paths): `.claude/rules/{content,docs,github-actions,privacy,site-architecture,versions}.md`; board rules: `.claude/rules/tasks.md`.

| Domain | Authoritative instructions | Review strategy | Narrow reliable tests/checks |
|--------|----------------------------|-----------------|-----------------------------|
| RECIPE | `docs/cookbook-architecture.md`, `recipes/rag-guide/AtlasMD.md`, `.claude/rules/site-architecture.md`, `.claude/features/specs/*` | owners `site-builder`, `recipe-site-architect`; risks: forking the shared lib/theme model, broken no-JS fallback, publish limits (100 files / 20 MB / 5 MB per file) | Playwright harness `node harness.js [--pages a,b]` in `.claude/reports/20260614-120000_rag-site-verify/` (git-ignored, needs `npm install` first) -- no plain-repo check: gap |
| PLATFORM | `docs/brewpage-platform.md`, `docs/ecosystem.md`, `.claude/rules/site-architecture.md`, `.claude/rules/versions.md` | owners `site-builder`, `recipe-site-architect`; adviser `brewpage-platform-expert` (read-only); risks: forked `base.css`, non-exact CDN pins | `node --test .claude/scripts/stamp-version.test.mjs .claude/scripts/stamp-url.test.mjs`; `node .claude/scripts/stamp-version.mjs --dry-run`; else gap |
| CONTENT | `docs/recipe-authoring.md`, `.claude/rules/content.md`, `.claude/rules/privacy.md`, `CLAUDE.md` sections 9-10 | owner `cookbook-author`; risks: EN/RU drift, platform-internals disclosure, missing mandatory cross-links, uncited claims | no verified check -- gap (manual review against the DoD) |
| INTERACTIVE | `.claude/rules/site-architecture.md` sections 4-5, `recipes/rag-guide/AtlasMD.md` | owner `interactive-engineer` (page glue: `recipe-site-architect`); risks: reduced-motion + no-JS behaviour, lib `init(root, config)` contract | harness V/Vcb groups (same install caveat as RECIPE) -- no plain-repo check: gap |
| CI | `.claude/rules/github-actions.md`, `.claude/rules/versions.md`, `CLAUDE.md` section 6, `docs/cookbook-architecture.md` | owners `release-engineer` (recipe publish), `github-actions-engineer`; risks: floating action pins, owner-token leak, a tag push publishes live | `node --test .claude/scripts/stamp-version.test.mjs .claude/scripts/stamp-url.test.mjs`; `node .claude/scripts/stamp-url.mjs --dry-run`; `publish-recipe.yml` runs only on tag/dispatch and publishes live -- no pre-merge CI check: gap |
| DOCS | `.claude/rules/docs.md`, `CLAUDE.md` sections 2 and 8 | no owning agent (route by topic); risk: docs drifting from code | no verified check -- gap |
| SEO | `docs/brewpage-platform.md` (SEO/growth), `.claude/rules/content.md` | owner `site-builder`; adviser `brewpage-platform-expert`; risks: canonical/hreflang/og tags, unresolved publish-time URL placeholders | `node .claude/scripts/stamp-url.mjs --dry-run`; harness SEO group (install caveat) |

At task start, the main session uses `task-board` to prepare a unique session anti-drift schedule for EACH active top-level task: hourly by default, user cadence overrides it. Announce cadence and session scope; retain the task-specific prompt and base checklist before creation. Child work units are graph nodes of their parent, not independent timers. Scheduling/lifecycle: `ANTI-DRIFT.md`.

Base work for every task: confirm goal/scope and latest user corrections; assign bounded owners/dependencies; implement; simplify; review correctness/safety, then clarity/maintainability/missing validation; run the task's reliable checks; reconcile graph/board/evidence; stop its schedule on completion/cancellation. Tasks refine this checklist with domain-specific work and acceptance evidence. Do not add release work without authorization.
