---
paths: ["**/*"]
---

[DICT: REG=registry, GHA=GitHub Actions]

# Versions -- pinning discipline (highest-priority rule)

!=floating versions ANYWHERE. Pin exact `X.Y.Z` in every artifact.

| Avoid | Instead |
|-------|---------|
| `@latest`, `latest`, `:stable`, `:edge`, `@main` | exact `X.Y.Z` |
| caret `^x.y` / tilde `~x.y` without verifying X.Y.Z | exact `X.Y.Z` |
| GHA `@v4` / `@main` | `@vX.Y.Z` |

## Stack note -- where pins actually live

This project is plain static HTML + minimal vanilla JavaScript (ES modules) + one small hand-written CSS file. NO framework, NO bundler, NO build step. Each recipe is a static folder published directly to BrewPage as a multi-file site. Because there is no framework or build, the main pin surface is third-party CDN `<script src>` / `<link href>` URLs.

## Pin in every artifact

| Artifact | Form |
|----------|------|
| CDN `<script src>` URLs | `.../pkg@X.Y.Z/...` -- !=`@latest` (e.g. a charting lib pinned to its exact version in the URL) |
| CDN `<link href>` stylesheet URLs | `.../pkg@X.Y.Z/...` -- !=`@latest` |
| GHA action refs | `owner/action@vX.Y.Z` |
| Any small npm tool (e.g. a static preview server) | `"pkg": "X.Y.Z"` (no `^`/`~`) |

## Procedure (before pinning anything)

1. Fetch latest stable from REG: npm `curl -s https://registry.npmjs.org/<pkg>/latest | jq -r .version`.
2. Scoped npm -- URL-encode `@` + `/` (e.g. `@scope%2Fpkg`).
3. Pin the exact resolved `X.Y.Z`. Re-verify quarterly + on major upstream news.

Reason: reproducibility -- today's build must match next month's. Precedent: Scalar CDN `@latest` broke brewpage-openapi.
