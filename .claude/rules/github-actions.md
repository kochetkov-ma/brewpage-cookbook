---
paths: ["**/*"]
---

[DICT: GHA=GitHub Actions, BA=brewpage-action, REG=registry]

# GitHub Actions -- workflow + custom-action discipline (pointer)

> Condensed pointer. Full expertise: `github-actions-engineer` agent. Pin-exact base rule: `.claude/rules/versions.md`.

## Pin every `uses:` to exact `vX.Y.Z`

!=`@latest`, !=bare floating major `@v4`, !=`@main`, !=caret/tilde. Third-party => exact tag or full-length commit SHA. Verify first: `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name`.

| Action | Verified pin |
|--------|--------------|
| `actions/checkout` | `@v6.0.3` |
| `actions/setup-node` | `@v6.4.0` |
| `softprops/action-gh-release` | `@v3.0.0` |
| `actions/upload-artifact` | `@v7.0.1` |

> Exception that proves the rule: CONSUMERS of BA reference it as `@v1` (published major-tag contract) -- separate from how a repo pins its OWN deps. Precedent: Scalar `@latest` CDN pin broke a sibling repo.

## Core rules

| Rule | Detail |
|------|--------|
| Secret masking | `core.setSecret(token)` BEFORE any `setOutput`/log/summary -- masking only redacts output emitted AFTER it. Owner-token leak = unmanageable forever. |
| Outputs | via `$GITHUB_OUTPUT` / `$GITHUB_ENV` (`@actions/core` `setOutput`). NEVER deprecated `::set-output::` / `::set-env::`. |
| Permissions | least-privilege `permissions:` -- default read, escalate per-job only. |
| Concurrency | `concurrency` group + `cancel-in-progress` on every workflow. |
| Bash | `set -euo pipefail` at top of every multi-line `run:` block; `if-no-files-found:` on `upload-artifact`. |

## node24 action -- dist/ drift commit rule (BA)

BA is a node24 TypeScript action (`runs.using: node24`, `main: dist/index.js`). Consumers run the COMMITTED Rollup `dist/index.js`, NOT `src/`. Every `src/` change => `npm run build` + commit `dist/`; `git diff --exit-code dist/` must be clean. `check-dist.yml` fails on drift; `release.yml` refuses to release on stale `dist/`. Stale bundle silently ships old code.

## Release pattern -- tag-based, unprefixed, major-tag move

Bump `package.json` -> build + commit `dist/` -> `git tag -a vX.Y.Z` -> `git push origin main && git push origin vX.Y.Z`. Tags **unprefixed** `vX.Y.Z` (one package/repo => clean `@v1` Marketplace ref). `release.yml` (on `v*.*.*` tag) verifies dist/, creates the GitHub Release, then **force-moves major tag `v1`** to the released commit so `@v1` consumers auto-update. No release-please, no release PR. Marketplace `action.yml` must keep `name`/`description`/`runs`/`branding`.

## Inputs/outputs three-file drift rule

When action inputs/outputs change, update ALL THREE in the same change: `action.yml`, repo `README.md`, `brewpage-openapi/modules/action/README.md`.

## brewpage-action -- canonical reference

| What | Where |
|------|-------|
| Repo (local) | `~/IdeaProjects/brewpage-action` |
| Repo (GitHub) | https://github.com/kochetkov-ma/brewpage-action |
| Repo rules | `~/IdeaProjects/brewpage-action/CLAUDE.md` |
| Canonical examples | that repo's `action.yml`, `.github/workflows/release.yml`, `.github/workflows/check-dist.yml` |

Read those before authoring or modelling any workflow. Cookbook recipe-publish pipeline stays with `release-engineer`; board moves go through `task-tracker`.
