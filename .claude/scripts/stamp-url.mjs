#!/usr/bin/env node
// stamp-url.mjs -- stamp the real BrewPage site id/link into the RAG Guide SEO
// surfaces after publish.
//
// WHAT IT DOES
//   1. Reads recipes/rag-guide/.brewpage-site.json (created by the publish
//      bootstrap step) of shape:
//        { "namespace": "public", "id": "<10-char-id>",
//          "link": "https://brewpage.app/public/<id>" }
//   2. Replaces the placeholder token REPLACE_AT_PUBLISH with the real site id
//      everywhere it occurs across the 12 RAG Guide pages + sitemap.xml.
//      In EVERY committed surface the placeholder is the bare id segment inside
//      a URL path (e.g. https://brewpage.app/public/REPLACE_AT_PUBLISH/...),
//      so a single token -> id swap correctly covers canonical, og:url,
//      og:image, twitter:image, hreflang alternates, JSON-LD url/@id/image,
//      breadcrumb items, the WebSite urlTemplate and the sitemap <loc>s.
//   3. Updates recipes/index.json so the rag-guide entry carries a `liveLink`
//      field of form https://brewpage.app/public/<id> (the full link straight
//      from .brewpage-site.json -- ONE source of truth: this script owns the
//      fill). The legacy `liveUrl` field is stamped to the SAME
//      https://brewpage.app/public/<id> form so there is one correct URL form
//      everywhere (the publish workflow reads liveUrl for the release body).
//
// ZERO DEPENDENCIES: node:fs / node:path / node:url only.
//
// IDEMPOTENT: anchors on the literal token REPLACE_AT_PUBLISH. A second run
// (token already gone) is a clean no-op that reports "nothing to stamp". If the
// real id is already present it is detected and re-stamping is skipped. Running
// twice yields byte-identical files.
//
// USAGE
//   node .claude/scripts/stamp-url.mjs --dry-run   # report only, change nothing
//   node .claude/scripts/stamp-url.mjs             # apply + report per-file counts
//
// Exit codes: 0 ok (incl. clean no-op) | 1 error (e.g. site.json missing).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN = "REPLACE_AT_PUBLISH";

// repo root = two levels up from .claude/scripts/
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..", "..");
const RECIPE_DIR = join(REPO_ROOT, "recipes", "rag-guide");
// Default site descriptor path; STAMP_SITE_JSON env var overrides it (used by
// the publish bootstrap and by --dry-run smoke tests before the real file exists).
const SITE_JSON = process.env.STAMP_SITE_JSON || join(RECIPE_DIR, ".brewpage-site.json");
const INDEX_JSON = join(REPO_ROOT, "recipes", "index.json");

// 12 pages + sitemap, relative to RECIPE_DIR
const PAGES = [
  "assemble-context.html",
  "chunking.html",
  "embedding.html",
  "evaluation.html",
  "generation.html",
  "index.html",
  "payload-anatomy.html",
  "production.html",
  "search.html",
  "vector-store.html",
  "what-rag.html",
  "why-rag.html",
  "sitemap.xml",
];

function fail(msg) {
  console.error(`stamp-url: ERROR ${msg}`);
  process.exit(1);
}

function readSite() {
  if (!existsSync(SITE_JSON)) {
    fail(
      `${SITE_JSON} not found. It is written by the publish bootstrap step ` +
        `before this script runs for real. Nothing was changed.`,
    );
  }
  let site;
  try {
    site = JSON.parse(readFileSync(SITE_JSON, "utf8"));
  } catch (e) {
    fail(`${SITE_JSON} is not valid JSON: ${e.message}`);
  }
  const id = typeof site.id === "string" ? site.id.trim() : "";
  if (!id) fail(`${SITE_JSON} is missing a non-empty string "id".`);
  const link =
    typeof site.link === "string" && site.link.trim()
      ? site.link.trim()
      : `https://brewpage.app/public/${id}`;
  return { id, link };
}

function countToken(s) {
  return s.split(TOKEN).length - 1;
}

// Replace bare-id token occurrences with the real id in one file's text.
function stampPages(id, dryRun) {
  const results = [];
  let total = 0;
  let alreadyStamped = false;
  for (const rel of PAGES) {
    const path = join(RECIPE_DIR, rel);
    if (!existsSync(path)) {
      results.push({ rel, count: 0, missing: true });
      continue;
    }
    const before = readFileSync(path, "utf8");
    const count = countToken(before);
    if (count > 0 && before.includes(`/public/${id}`)) alreadyStamped = true;
    if (count > 0 && !dryRun) {
      const after = before.split(TOKEN).join(id);
      writeFileSync(path, after);
    }
    total += count;
    results.push({ rel, count });
  }
  return { results, total, alreadyStamped };
}

// Ensure index.json rag-guide entry carries liveLink = full link AND liveUrl =
// the SAME https://brewpage.app/public/<id> form (one correct URL form
// everywhere; the publish workflow reads liveUrl for the release body).
// Preserves trailing newline. Returns { changed, replacements }.
function stampIndex(id, link, dryRun) {
  if (!existsSync(INDEX_JSON)) return { changed: false, replacements: 0, missing: true };
  const raw = readFileSync(INDEX_JSON, "utf8");
  const hadTrailingNl = raw.endsWith("\n");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    fail(`${INDEX_JSON} is not valid JSON: ${e.message}`);
  }
  let replacements = 0;
  const recipes = Array.isArray(data.recipes) ? data.recipes : [];
  for (const r of recipes) {
    if (r && r.slug === "rag-guide") {
      // liveLink: full link, single source of truth.
      if (r.liveLink !== link) {
        r.liveLink = link;
        replacements += 1;
      }
      // legacy liveUrl: stamp to the SAME /public/<id> link form (one correct
      // form everywhere). Covers both the REPLACE_AT_PUBLISH placeholder and
      // the old bare https://brewpage.app/<id> (no /public/) form.
      if (typeof r.liveUrl === "string" && r.liveUrl !== link) {
        r.liveUrl = link;
        replacements += 1;
      }
    }
  }
  if (replacements > 0 && !dryRun) {
    let out = JSON.stringify(data, null, 2);
    if (hadTrailingNl) out += "\n";
    writeFileSync(INDEX_JSON, out);
  }
  return { changed: replacements > 0, replacements };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { id, link } = readSite();

  console.log(`stamp-url: site id = ${id}`);
  console.log(`stamp-url: site link = ${link}`);
  console.log(`stamp-url: mode = ${dryRun ? "DRY-RUN (no writes)" : "APPLY"}`);
  console.log("");

  const pages = stampPages(id, dryRun);
  const idx = stampIndex(id, link, dryRun);

  console.log("Pages (recipes/rag-guide/):");
  for (const r of pages.results) {
    if (r.missing) {
      console.log(`  ${r.rel.padEnd(24)} MISSING (skipped)`);
    } else {
      console.log(`  ${r.rel.padEnd(24)} ${r.count} replacement(s)`);
    }
  }
  console.log("");
  console.log("recipes/index.json:");
  if (idx.missing) {
    console.log("  MISSING (skipped)");
  } else {
    console.log(`  liveLink/liveUrl fields: ${idx.replacements} change(s)`);
  }
  console.log("");

  const grandTotal = pages.total + (idx.replacements || 0);
  if (grandTotal === 0) {
    if (pages.alreadyStamped) {
      console.log(
        `stamp-url: nothing to stamp -- id "${id}" already present, no "${TOKEN}" left. No-op.`,
      );
    } else {
      console.log(`stamp-url: nothing to stamp -- no "${TOKEN}" found anywhere. No-op.`);
    }
  } else {
    console.log(
      `stamp-url: ${dryRun ? "planned" : "applied"} ${grandTotal} replacement(s) ` +
        `across ${pages.results.filter((r) => r.count > 0).length} page(s)` +
        `${idx.replacements ? " + recipes/index.json" : ""}.`,
    );
  }
}

main();
