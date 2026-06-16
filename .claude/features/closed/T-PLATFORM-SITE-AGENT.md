---
id: T-PLATFORM-SITE-AGENT
title: "Create specialized cookbook-site builder agent encoding the shared component/style/class/theme/lib catalog"
status: closed
priority: P1
owner: brewcode:agent-creator
created: 2026-06-08
updated: 2026-06-08
tags: [platform, agent, prototype]
links: []
---

## Context
After the shared architecture is built and documented, encode it into a specialized
cookbook-site builder agent so future site work reuses the established components, styles,
class names, themes, and ES-module lib instead of improvising. The agent must carry the catalog
of shared components, the CSS-variable/theme model, the class conventions, and the JS lib API.

## Acceptance
- [ ] New specialized agent created under `.claude/agents/` for cookbook-site building.
- [ ] Agent encodes the shared catalog: `shared/components/*.html`, `base.css` + theme model, class conventions, and the `shared/js/lib` module API.
- [ ] Agent references `.claude/rules/site-architecture.md` as source of truth (no duplication/fork).
- [ ] Agent scope respects existing role boundaries (delegates board moves to `TT`).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: Created for the 3-theme prototype/compare phase.
- BLOCKED BY `T-RECIPE-RAG-GUIDE` (catalog stabilizes once the prototype is assembled) and
  `M-DOCS-SITE-ARCH` (agent encodes the documented architecture).
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED (R2 bookend). DONE: new agent `.claude/agents/recipe-site-architect.md`
  (model opus) created, encoding the shared catalog and referencing
  `.claude/rules/site-architecture.md` as source of truth.
- Prototype phase -- no release tag, nothing published to brewpage.app.
