# BrewPage Platform -- Reference for Recipe-Authoring Agents

> Audience: agents authoring BrewPage Cookbook recipes that publish to the BrewPage hosting platform.
> Scope: what BrewPage is, what it hosts, how to publish, and the limits/visibility rules that constrain a recipe.
> Every non-obvious number and endpoint below is traceable to a source file -- see the **Sources** section at the end.
> Facts not confirmable in source are marked `(verify in <file>)`. Do not treat unmarked claims as guesses.

Delivery compatibility updated: 2026-10-05; other snapshot values require re-verification.

> **Source of truth = the LIVE platform.** Re-verify against these before relying on any value:
> - `https://brewpage.app/api/openapi.yaml` (REST contract)
> - `https://brewpage.app/llms.txt`
> - `https://brewpage.app/llms-full.txt`
>
> This file is a convenience SNAPSHOT (as of 2026-06-04). Re-verify against the live source before relying on any value; do NOT hardcode versions or counts that drift. Stable contractual limits (size / TTL / rate limits in the tables below) are the platform's documented limits and are safe to cite; counts and versions that move upstream (crawler-UA count, trusted-embed host count, `info.version`) must be read live, not copied from here.

---

## 1. What BrewPage is + positioning

BrewPage is a free instant hosting service for HTML pages, Markdown documents, AI artifacts, key-value data, JSON documents, multi-file sites, and files. Returns a short, shareable HTTPS link. No registration required.
[S1 lines 5-7; S5 lines 3-7]

REST/owner API base: `https://brewpage.app`. Share URLs may use the apex or a publication-specific content host; always copy the returned `link`.
[S2 servers; S1 §Project; S5 line 6]

**Positioning (verbatim from platform CLAUDE.md):** core edge is completely **free**, **faster**, and **AI/agent-friendly**. Top competitor: **`static.app`** (steep pricing). [S1 §Project "Positioning"]

For a cookbook recipe: a recipe is a self-contained interactive artifact you publish to BrewPage and share by URL. No build server, no account, no per-seat cost -- the platform is designed to be driven by an agent over plain HTTP.

---

## 2. Content types and endpoint groups

BrewPage groups its API by content type (OpenAPI `tags`). [S2 tags block, lines 72-96] Endpoint paths confirmed in the OpenAPI spec unless marked otherwise.

| Content type | What it is | Create | Read (short URL) | Update | Delete |
|---|---|---|---|---|---|
| **HTML** | Single HTML page. | `POST /api/html` | Server-returned `link` or `GET /api/html/{ns}/{id}` | `PUT /api/html/{ns}/{id}` | `DELETE /api/html/{ns}/{id}` |
| **Markdown** | Markdown rendered to styled HTML. Same endpoint group as HTML -- select with `?format=markdown` (or `md`). | `POST /api/html?format=markdown` | same as HTML | `PUT /api/html/{ns}/{id}` | `DELETE /api/html/{ns}/{id}` |
| **KV** | Key-value store, up to 1000 keys per store, no version history. | `POST /api/kv` (creates store + first key) | `GET /api/kv/{ns}/{id}/{key}` | `PUT /api/kv/{ns}/{id}/{key}` (upsert key) | `DELETE /api/kv/{ns}/{id}/{key}` (one key) · `DELETE /api/kv/{ns}/{id}` (whole store) |
| **JSON** | Arbitrary JSON value, including objects, arrays, scalars and null. | `POST /api/json` | `GET /api/json/{ns}/{id}` | `PUT /api/json/{ns}/{id}` | `DELETE /api/json/{ns}/{id}` |
| **File** | Single uploaded file (multipart `file`). Inline preview for images/PDF/media. | `POST /api/files` | `GET /api/files/{ns}/{id}` or `GET /{ns}/{id}` | -- (no PUT; delete + recreate) | `DELETE /api/files/{ns}/{id}` |
| **Multi-file site** | Multi-file HTML bundle (ZIP archive **or** parallel `files` + `paths` arrays). Relative links between files work. | `POST /api/sites` | Server-returned `link`; OLD apex paths or NEW native content host | `PUT /api/sites/{ns}/{id}` (full-replace republish; keeps URL + id) | `DELETE /api/sites/{ns}/{id}` |

Sources: HTML create/get/put/delete [S2 lines 852-983, 383-532]; Markdown via `format` query [S2 lines 904-911]; KV [S2 lines 644-745, 98-250, 1377-1455]; JSON [S2 lines 251-382, 746-851]; Files [S2 lines 984-1108, 1516-1603]; Sites (ZIP or `files`+`paths`, full-replace `PUT`) [S2 lines 1604-1831; S5 lines 18-25].

Notes relevant to recipes:

- **Single page vs multi-file site.** One-file recipe → `POST /api/html`. Recipe that ships multiple HTML/CSS/JS assets (the typical built cookbook recipe) → `POST /api/sites` as a ZIP or `files`+`paths` bundle; entry file is auto-detected (`index.html` preferred) or set with `?entry=`. [S2 lines 1604-1705; S5 lines 18-22]
- **Updating a shared link.** HTML / JSON / KV support `PUT` to replace content while keeping the same short URL. **Sites also support `PUT /api/sites/{ns}/{id}`** -- a full-replace republish that swaps the entire file set while keeping the same URL + id (requires `X-Owner-Token`; accepts the same ZIP archive or `files`+`paths` body as create). This is the canonical way to update a published recipe; DELETE-then-POST mints a new id/URL and should be avoided. [S2 lines 1830-1895; S2 lines 432-441; S5 line 74]
- **HTML update:** tags, password, filename and showTopBar remain unchanged. Format may be supplied on PUT; the JSON body field takes precedence over the query parameter. [S2 HTML update contract]
- **HTML also accepts raw bodies.** Besides `application/json` (`{"content":"..."}`), `POST /api/html` accepts raw `text/*` (HTML, Markdown, YAML, XML, CSV, code) and `application/octet-stream` (binary auto-routes to `/api/files`). [S2 lines 856-952; S5 line 13]
- **Raw bytes for embeds.** OLD short URLs retain `?raw=1`/`?dl=1` behavior. NEW native roots preserve file MIME semantics; `raw`/`inline` do not bypass NEW sandbox/download protections. [S2 publication delivery and short-link paths]

### OLD and NEW delivery compatibility

OLD publications have no `routingCohort=new-v1` metadata and retain their historical links, rendering and access behavior. The existing RAG Guide descriptor and its apex canonical/OG/sitemap URLs remain unchanged; compatibility work does not migrate or republish it.

NEW creation supports `X-Delivery-Mode: path|subdomain`. Sites and non-public publications require `subdomain`; explicit `path` is rejected. Public non-sites default to `path` and may choose `subdomain`, independently of password protection. Ordinary PUT preserves hosting; OLD publications cannot switch modes.

Use the server `link` unchanged. Host identity is separate from the resource ID; never derive a host or append `/public/<id>`. NEW site roots end in `/`; child pages, assets, directory indexes and root-relative paths resolve natively on that host. Missing files return 404 with no SPA fallback. Authored HTML documents run without platform wrappers and may receive the read-only attribution badge; viewer content uses the platform viewer. Management APIs stay on the apex.

Eligible public HTML, sites and files may receive `X-Robots-Tag: all` on native hosts. Unlisted, protected or otherwise ineligible responses retain `noindex, nofollow`. Native hosts have no separate sitemap or SEO alias; crawler access restrictions apply separately. OLD apex SEO behavior remains unchanged. Public visibility does not guarantee search indexing or ranking.

Share protected NEW publications with the clean returned `link`. Browser unlock uses trusted top-level navigation through `unlock.brewpage.app`, followed by a resource-scoped host-only reader session. Never place passwords or owner tokens in NEW share URLs. Automated password reads and owner operations use apex API headers; OLD query-password compatibility is not the NEW browser unlock flow.

Source: [REST publication-delivery contract](https://github.com/kochetkov-ma/brewpage-openapi/blob/main/openapi/openapi.yaml), verified against the local coordination contract and platform public `llms-full.txt`.

---

## 3. Namespaces and the privacy boundary

Every resource lives in a **namespace** (`ns`). OLD short links use `/{ns}/{id}`; NEW links depend on delivery mode and must be copied from the server. Namespace and resource ID still address the apex management API. [S2 publication delivery]

- **Default namespace is literally `public`.** Omitting `?ns=...` puts content into the `public` namespace. [S2 lines 10-26]
- **Privacy boundary -- only `public/` is shared.** Gallery eligibility requires `public` and no password. Custom namespaces and protected publications are excluded from gallery/sitemap discovery and retain native `noindex, nofollow`. Eligible public native responses may permit indexing; gallery eligibility alone does not promise it. [S2 publication delivery; S5 privacy]
- **Custom namespace format:** `[a-z0-9-]{1,32}`, auto-created on first use. [S2 namespace contract]
- **The direct short URL stays reachable** by anyone who knows it, regardless of namespace -- privacy means "not listed / not indexed", not "secret". [S2 lines 22-23; S5 line 47]
- **Collision** on `ns+id` → server returns `409 Conflict`; retry with a different `id` or omit `id` to let the server generate one. [S2 lines 27, 1217-1218]

**Recipe guidance:** a public, discoverable recipe belongs in `public` with no password. A draft or private preview should use a custom namespace (e.g. `?ns=cookbook-draft-2026`) and/or an `X-Password` so it stays out of the gallery and sitemap.

---

## 4. Limits

Ground-truth limits (verbatim from platform CLAUDE.md `## Limits` table). [S1 §Limits]

| Resource | Limit |
|---|---|
| HTML | 5 MB, TTL def 15d / max 30d |
| KV value | 1 MB, 1000 keys/store, TTL def 15d / max 30d |
| JSON doc | 1 MB, 10 000 docs/NS, TTL def 15d / max 30d |
| File | 5 MB (video 20 MB, audio 5 MB), 1000 files/NS, TTL def 15d / max 30d |
| Site bundle | 20 MB total, 100 files/site, 5 MB per file, TTL def 15d / max 30d |
| DB | 10 MB, 5s query timeout |
| Rate: uploads | Operation- and namespace-specific; consult current API contract |
| Rate: reads | 300/min/IP |

**TTL (retention).** `ttl` (days) applies to html, markdown, json, kv, files, and sites. Default `15`, normal requested range `1..30`, subject to owner-specific effective limits. Site PUT retains the original expiry; separately eligible automatic extension may change it. Treat the returned `expiresAt` as authoritative. Expired resources become unavailable and are removed by cleanup. The `ttl` query also accepts a suffixed form such as `30d` or `30 days`. [S2 TTL contract]

**Recipe sizing implication:** a built multi-file recipe must fit **20 MB total / 100 files / 5 MB per file**. Keep heavy media (video/large images) as separate `/api/files` uploads referenced by URL rather than bundled, since the site bundle ceiling is the binding constraint.

---

## 5. Rate limits

- **Uploads:** operation- and namespace-specific limits apply. **Reads:** the documented default is 300 per minute per IP; current configuration and owner policy govern effective limits.
- Rate limits apply to `/api/**` endpoints. Publish under your own identifiable User-Agent and follow the current API contract rather than assuming one upload quota for every operation.
- Exceeding a limit returns **HTTP 429**. [S2 lines 740-745, 978-983, 1745-1750]
- **`User-Agent` is REQUIRED on every request**, format `AgentName/version` (e.g. `Claude/4.5`, `MyBot/2.1`). Anonymous or spoofed UAs may be rate-limited, rejected, or flagged. [S2 lines 47-51; S5 lines 50-53]
- Every request (publish and read) is logged server-side (IP, UA, method, path, status, latency) with 30-day retention. [S2 lines 53-59; S5 lines 55-59]

---

## 6. Publishing surfaces for a cookbook

Three ways to publish, lowest-level first:

1. **REST API** -- base `https://brewpage.app`. Always available, no SDK required. §2 table is the contract; machine-readable contract is the OpenAPI spec (see §7). [S2 servers]

2. **`brewpage` CLI** -- ecosystem module (command-line publisher). [cookbook README §"Where this fits"; cookbook `.claude/agents/brewpage-platform-expert.md`] Release status: **see `ecosystem.md`** -- do not assert a version here.

3. **`brewpage-action` GitHub Action** (`kochetkov-ma/brewpage-action`) -- ecosystem module; released and in use: the preferred path for CI publishing, with this cookbook as its first production consumer (dogfood). [cookbook `CLAUDE.md` §6, cookbook README §"Publishing"] Release status: **see `ecosystem.md`** -- do not assert a version here.

> Treat both the CLI and the Action as ecosystem modules and reference `ecosystem.md` for their current release state and exact invocation. The Action is released and in use. The CLI is not released; until it is, the REST API in §2 is its fallback.

### Owner-token model

Every creation response returns an **`ownerToken`** -- a 32-character ownership-proof token, generated once at create and stored hashed at rest. [S4 lines 610-617]

- **Returned once at creation.** All POST responses carry: `id` (10-char), `namespace`, `link` (short URL), `ownerLink` (API URL), `ownerToken`. [S5 lines 61-64]
- **Required for mutate.** Send as `X-Owner-Token` header on every update/delete (and pass on later creates to group entities under one owner). [S5 lines 64, 80-87; S4 lines 615-618]
- **Never recoverable.** If you lose the owner token there is **no recovery** -- the page auto-deletes at TTL expiry; for abuse use the report form. [S5 lines 139-140] (Wording confirmed verbatim against `llms.txt` FAQ.)
- List endpoints (`GET /api/html | /api/kv | /api/json | /api/files`) return only your entities when you send `X-Owner-Token`; without it they return an empty list. The gallery is always public and is never token-filtered. [S5 lines 84-86; S4 lines 620-633]

**Recipe guidance:** the authoring agent must persist the `ownerToken` (e.g. in repo CI secrets / session state) at publish time, because every later re-publish, edit, or takedown of that exact resource requires it and it cannot be re-issued.

---

## 7. LLM / agent surfaces

BrewPage exposes machine-readable entry points designed for agents:

| Surface | URL | Notes |
|---|---|---|
| LLM index | `https://brewpage.app/llms.txt` | Compact "what + how to publish" index. [S5 entire file] |
| LLM full reference | `https://brewpage.app/llms-full.txt` | Full prose reference incl. owner-token + raw-body details. [S4 entire file] |
| OpenAPI (YAML) | `https://brewpage.app/api/openapi.yaml` | Preferred for LLM context (~25% fewer tokens). Alias: `/v3/api-docs.yaml`. [S5 line 168; S4 line 712] |
| OpenAPI (JSON) | `https://brewpage.app/api/openapi.json` | For programmatic clients / MCP / codegen. Alias: `/v3/api-docs`. [S6; S4 line 713] |
| robots.txt | `https://brewpage.app/robots.txt` | Crawl policy (see below). [S7 entire file] |

**robots.txt posture.** `Allow: /` for everyone, then explicit per-path `Disallow` of API/internal/admin routes (`/api/admin/`, `/api/files/`, `/api/html/`, `/api/json/`, `/api/kv/`, `/api/sites/`, `/api/gallery`, `/api/stats`, `/v3/api-docs`, `/actuator/`, etc.). The same allow-public/disallow-API stanza is repeated for a list of named search and AI crawler user-agents (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, GoogleOther, Applebot, CCBot, ...) -- i.e. AI search bots are explicitly welcomed onto public content. The exact set drifts; read the live `robots.txt` rather than relying on a count here. Sitemaps advertised at the bottom (`/sitemap-index.xml`, `/sitemap.xml`, `/sitemap-images.xml`). [S7 lines 1-18, 20-523, 528-531]

For an authoring agent: the OpenAPI YAML at `/api/openapi.yaml` is the canonical, lowest-token contract to load before publishing. The source-of-truth copy lives in the sibling repo (`brewpage-openapi/openapi/openapi.yaml`) -- see `ecosystem.md`.

---

## 8. SEO / gallery / sitemap -- what makes a recipe discoverable

Public gallery/sitemap discovery and native response indexing are separate. Eligible public native HTML, sites and files may permit indexing, without a separate native sitemap/SEO alias. Basic public discovery requirements are:

1. it is in the `public` namespace, **and**
2. it has **no password**, **and**
3. its **remaining TTL exceeds the configured sitemap threshold** (sitemap only; other eligibility requirements also apply).

[S1 §Privacy + §Limits; S5 lines 36-48; S6 seo.md]

- **Gallery (`GET /api/gallery`).** Lists `public`-namespace, no-password pages with optional case-insensitive search over title/tags; paginated; `sort=date|views`. Custom-namespace or password-protected items are excluded. [S2 lines 1456-1515; S5 lines 39-42]
- **Apex sitemap retention.** Inclusion requires remaining TTL above the configured threshold, rather than a fixed initial TTL. Native indexing uses its own response policy; sitemap inclusion does not create a native sitemap or guarantee indexing. Gallery eligibility uses namespace/password filters independently.

**Recipe guidance:** OLD apex recipes retain their existing SEO links and sitemap behavior. NEW sites require native subdomains; eligible public sites may permit indexing, but `public`, no password and `ttl=30` do not guarantee it. Custom namespaces are unlisted, while passwords provide access protection.

---

## 9. Embedding interactive widgets in a hosted recipe

Cookbook recipes are interactive and often embed third-party widgets (videos, code sandboxes, charts, design embeds). BrewPage allows this through a **trusted-embed-domain allowlist**, but with security constraints.

- User HTML is loaded inside a **sandboxed iframe**, and the platform maintains an **allowlist of trusted embed hosts** (YouTube, Figma, CodePen, CodeSandbox, Observable, etc.).
- The allowlist relevant to recipe interactivity includes (non-exhaustive): **youtube / youtu.be, vimeo, codepen, jsfiddle, codesandbox, stackblitz, replit, github / gist, figma / embed.figma.com, observablehq, flourish, datawrapper, miro, canva, open.spotify / soundcloud, calendly, typeform, docs.google / forms.gle**. The exact host set drifts; treat this as illustrative and check the live publish list rather than relying on a fixed count.
- **Content-Security-Policy.** The platform applies CSP/sandbox controls; embeds outside the allowlist are constrained. Wildcard third-party domains are not used (explicit subdomains only). Treat CSP behavior as platform-owned.
- **Adding a new trusted embed domain** is a platform change. An authoring agent should not assume a non-listed host will embed -- pick a widget from the allowlist, or request a platform change.

**Recipe guidance:** when a recipe needs an embed, prefer a host already on the allowlist (e.g. CodeSandbox / StackBlitz / Observable for live code, YouTube/Vimeo for video, Figma for design). For raw media you control, upload via `/api/files` and embed with `?raw=1` so the original Content-Type is served. [S2 lines 1109-1166]

---

## Caveats / facts not fully confirmable in source

- **CLI and Action release status / versions** -- intentionally not asserted here. The platform `llms.txt` advertises only the MCP server (`brewpage-mcp`) and the Claude Code `brewdoc:publish` skill as tooling [S5 lines 89-96]; the cookbook's own CLAUDE.md/README describe `brewpage-action` as released and in use and the `brewpage` CLI as planned, not on npm. Confirm current status in `ecosystem.md`. (verify in `ecosystem.md`)
- **Create and update identity.** A create response may refer to an existing publication. Preserve its returned identity and link. Use `PUT /api/html/{ns}/{id}` with the original `X-Owner-Token` to update a specific owned publication.

---

## Sources

The numeric `[S# lines N]` markers above point at the platform's own published, user-facing sources. Re-verify any value against the live source before relying on it:

- **S1** = platform positioning, Limits table, namespaces/privacy, rate limits, SEO/sitemap visibility rules (as published on `https://brewpage.app`).
- **S2** = `~/IdeaProjects/brewpage-openapi/openapi/openapi.yaml` -- public REST contract (servers, tags, paths). Source of truth for endpoints. (`info.version` moves upstream -- do not hardcode; fetch live.)
- **S3** = platform module map / headers overview (user-facing).
- **S4** = `https://brewpage.app/llms-full.txt` -- owner-token model, raw-body details, OpenAPI JSON/YAML URLs.
- **S5** = `https://brewpage.app/llms.txt` -- publish surfaces, visibility rules, TTL, owner-token FAQ ("no recovery"), tooling.
- **S6** = platform SEO notes -- sitemap visibility rule, robots posture, OpenAPI alias paths (user-facing).
- **S7** = `https://brewpage.app/robots.txt` -- crawl policy, AI-bot allow-list, sitemaps.
- Cookbook self-reference: `~/IdeaProjects/brewpage-cookbook/CLAUDE.md`, `README.md`, `.claude/agents/brewpage-platform-expert.md` -- `brewpage` CLI and `brewpage-action` as ecosystem modules.
