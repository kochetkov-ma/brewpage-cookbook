#!/usr/bin/env node
// Stamp placeholder URL bases from the required server link; preserve published URLs.
// Node built-ins only; --dry-run reports without writes, repeated runs preserve bytes.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN = "REPLACE_AT_PUBLISH";
const PLACEHOLDER_BASE = `https://brewpage.app/public/${TOKEN}`;

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
  const link = typeof site.link === "string" ? site.link.trim() : "";
  if (!link) fail(`${SITE_JSON} is missing a non-empty server "link". Nothing was changed.`);
  let url;
  try {
    url = new URL(link);
  } catch {
    fail(`${SITE_JSON} has an invalid server "link". Nothing was changed.`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || link.includes(TOKEN)) {
    fail(`${SITE_JSON} requires a clean HTTPS server "link". Nothing was changed.`);
  }
  return { id, link };
}

function countToken(s) {
  return s.split(TOKEN).length - 1;
}

// Replace full placeholder bases; unknown token contexts fail before any page write.
function stampPages(link, dryRun) {
  const results = [];
  let total = 0;
  const changes = [];
  for (const rel of PAGES) {
    const path = join(RECIPE_DIR, rel);
    if (!existsSync(path)) {
      results.push({ rel, count: 0, missing: true });
      continue;
    }
    const before = readFileSync(path, "utf8");
    const count = countToken(before);
    const after = before.replaceAll(PLACEHOLDER_BASE, (base, offset) => {
      const suffix = before[offset + base.length];
      return suffix === "/" ? link.replace(/\/$/, "") : link;
    });
    if (after.includes(TOKEN)) fail(`${rel} has an unsupported placeholder context. Nothing was changed.`);
    if (count > 0) changes.push({ path, after });
    total += count;
    results.push({ rel, count });
  }
  if (!dryRun) for (const { path, after } of changes) writeFileSync(path, after);
  return { results, total };
}

// Index links copy the complete server link for either routing cohort.
function stampIndex(link, dryRun) {
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
      // Keep legacy consumers on the same server-returned URL.
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

  const pages = stampPages(link, dryRun);
  const idx = stampIndex(link, dryRun);

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
    console.log(`stamp-url: nothing to stamp -- no "${TOKEN}" found anywhere. No-op.`);
  } else {
    console.log(
      `stamp-url: ${dryRun ? "planned" : "applied"} ${grandTotal} replacement(s) ` +
        `across ${pages.results.filter((r) => r.count > 0).length} page(s)` +
        `${idx.replacements ? " + recipes/index.json" : ""}.`,
    );
  }
}

main();
