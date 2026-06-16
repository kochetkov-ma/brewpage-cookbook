---
id: BUG-INTERACTIVE-PROCESS-ANIM-REDUCED-MOTION
title: embedding process-anim fails harness V3 under prefers-reduced-motion (node settles at width:auto)
status: backlog
priority: P2
owner:
created: 2026-06-14
updated: 2026-06-14
tags: [rag-guide, interactive, process-anim, reduced-motion, a11y]
links: []
---

## Context
Surfaced during `T-RECIPE-RAG-CODEBLOCKS` verification but NOT caused by the code-block work (pre-existing).
On the `embedding` page, the `process-anim` host fails harness check V3 under `prefers-reduced-motion`: a node
settles at `width:auto` instead of the fixed end width (~48.45px), so the reduced-motion settled DOM differs from
the no-preference end state. Reduced-motion must snap to the SAME end DOM as the animated path (site-architecture
rule: manual stepper over identical markup, snap to end state).

Owner suggestion: interactive-engineer.

## Acceptance
- [ ] V3 passes under `prefers-reduced-motion`: the settled node width matches the no-preference end width
      (~48.45px), reduced-motion end DOM == no-preference end DOM.

## Notes
Filed from the `T-RECIPE-RAG-CODEBLOCKS` close (W7-BOARD). On close, record the release tag `vX.Y.Z`
(unprefixed) + commit SHA here.
