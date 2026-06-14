#!/usr/bin/env node
// stamp-version.mjs -- no-build version stamper for brewpage-cookbook.
//
// Derives the version from git and stamps it into three surfaces:
//   1. recipes/rag-guide/shared/data/version.json  (version, commit, date)
//   2. package.json                                ("version" field, no "v" prefix)
//   3. footer fallback anchors                     (every *.html with a
//      class="version-value" anchor: inner text + /releases/tag/vX.Y.Z href)
//
// Zero external dependencies: only node:fs, node:child_process, node:path,
// node:url. Runs manually now; a future CI workflow calls the SAME script.
//
// Idempotent: running twice with the same git state (and same --version)
// yields byte-identical files. Anchored replaces only; no commit, no tag.
//
// Usage:
//   node .claude/scripts/stamp-version.mjs                 # derive from git
//   node .claude/scripts/stamp-version.mjs --version v0.1.0
//   node .claude/scripts/stamp-version.mjs --dry-run
//   node .claude/scripts/stamp-version.mjs --version v0.1.0 --dry-run

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// --- repo root (script lives in <root>/.claude/scripts/) -------------------
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..", "..");

// --- target paths (relative to repo root) ----------------------------------
const VERSION_JSON_PATH = join(
  REPO_ROOT,
  "recipes/rag-guide/shared/data/version.json"
);
const PACKAGE_JSON_PATH = join(REPO_ROOT, "package.json");
// Footer fallbacks: every committed *.html carrying a version-value anchor.
// Today that is footer.html + the inlined page footers added by later tasks;
// the script discovers them at runtime via git ls-files so it stays correct
// as pages gain the slot.

// --- tiny arg parser --------------------------------------------------------
function parseArgs(argv) {
  const out = { version: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      out.dryRun = true;
    } else if (a === "--version") {
      out.version = argv[++i];
    } else if (a.startsWith("--version=")) {
      out.version = a.slice("--version=".length);
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    } else {
      throw new Error("Unknown argument: " + a);
    }
  }
  return out;
}

function usage() {
  return [
    "stamp-version.mjs -- stamp the version into version.json, package.json, footers.",
    "",
    "Usage:",
    "  node .claude/scripts/stamp-version.mjs [--version vX.Y.Z] [--dry-run]",
    "",
    "Options:",
    "  --version vX.Y.Z   Override the derived version (CLI takes precedence).",
    "  --dry-run          Print what would change; write nothing.",
    "  --help, -h         Show this help.",
    "",
    "Version source precedence:",
    "  --version > git describe --tags --exact-match > dev fallback.",
  ].join("\n");
}

// --- git helpers (best-effort; tolerate missing git/tags) -------------------
function git(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function gitTry(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

// --- version derivation -----------------------------------------------------
// Returns { tagVersion, semver, source } where:
//   tagVersion = "vX.Y.Z..." form for the footer anchor + href
//   semver     = package.json value (leading "v" stripped)
function deriveVersion(cliVersion) {
  if (cliVersion) {
    return normalize(cliVersion, "cli");
  }
  const exact = gitTry(["describe", "--tags", "--exact-match"]);
  if (exact) {
    return normalize(exact, "git-exact-tag");
  }
  // Dev fallback: 0.0.0-dev+<short>. Stable for a given commit.
  const short =
    gitTry(["rev-parse", "--short", "HEAD"]) || "0000000";
  const tagVersion = "v0.0.0-dev+" + short;
  return { tagVersion, semver: "0.0.0-dev+" + short, source: "dev-fallback" };
}

function normalize(raw, source) {
  const trimmed = raw.trim();
  const semver = trimmed.replace(/^v/, "");
  const tagVersion = trimmed.startsWith("v") ? trimmed : "v" + trimmed;
  return { tagVersion, semver, source };
}

// --- commit + date ----------------------------------------------------------
function gitCommit() {
  return gitTry(["rev-parse", "--short", "HEAD"]) || "0000000";
}

function gitDate() {
  // Committer date, ISO yyyy-mm-dd.
  return gitTry(["log", "-1", "--format=%cs"]) || "1970-01-01";
}

// --- deterministic version.json serialization -------------------------------
// Stable key order: _schema (if present) preserved, then version/commit/date.
// Pretty JSON, 2-space indent, trailing newline.
function buildVersionJson(existingRaw, semver, commit, date) {
  let existing = {};
  if (existingRaw != null) {
    try {
      existing = JSON.parse(existingRaw);
    } catch {
      existing = {};
    }
  }
  // Preserve any _schema (or other _-prefixed) metadata authored by V1-VERSION-LIB.
  const ordered = {};
  ordered.version = semver;
  ordered.commit = commit;
  ordered.date = date;
  for (const k of Object.keys(existing)) {
    if (k === "version" || k === "commit" || k === "date") continue;
    ordered[k] = existing[k];
  }
  return JSON.stringify(ordered, null, 2) + "\n";
}

// --- package.json version field (anchored, format-preserving) ---------------
function stampPackageVersion(raw, semver) {
  // Match the top-level "version": "..." string field, replace only its value.
  const re = /("version"\s*:\s*")[^"]*(")/;
  if (!re.test(raw)) {
    throw new Error('package.json has no "version" field to stamp.');
  }
  return raw.replace(re, (_m, p1, p2) => p1 + semver + p2);
}

// --- footer anchor (anchored, idempotent) -----------------------------------
// Matches an <a> with class="version-value": rewrites its /releases/tag/vX.Y.Z
// href segment and its inner text to tagVersion. No-op for files lacking it.
function stampFooter(raw, tagVersion) {
  let changed = false;

  // 1. href release-tag segment: .../releases/tag/<anything-but-quote-or-slash>
  const out1 = raw.replace(
    /(\/releases\/tag\/)[^"'\s<>]+/g,
    (_m, p1) => {
      changed = true;
      return p1 + tagVersion;
    }
  );

  // 2. inner text of the version-value anchor. Match the opening tag (which
  //    carries class="version-value" in any attribute position), then the
  //    text up to </a>. Tolerates attribute order around the class hook.
  const anchorRe =
    /(<a\b[^>]*\bclass=("|')[^"']*\bversion-value\b[^"']*\2[^>]*>)([\s\S]*?)(<\/a>)/g;
  const out2 = out1.replace(anchorRe, (_m, open, _q, inner, close) => {
    if (inner === tagVersion) return open + inner + close;
    changed = true;
    return open + tagVersion + close;
  });

  return { content: out2, changed };
}

// --- list candidate footer files via git (committed *.html only) ------------
function listFooterFiles() {
  const tracked = gitTry(["ls-files", "*.html", "recipes/**/*.html"]);
  const set = new Set();
  if (tracked) {
    for (const line of tracked.split("\n")) {
      const t = line.trim();
      if (t) set.add(join(REPO_ROOT, t));
    }
  }
  // Always include the canonical footer partial even if path patterns miss it.
  set.add(join(REPO_ROOT, "recipes/rag-guide/shared/components/footer.html"));
  return [...set].filter((p) => existsSync(p));
}

// --- main -------------------------------------------------------------------
function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(String(e.message) + "\n\n" + usage() + "\n");
    process.exit(2);
  }
  if (args.help) {
    process.stdout.write(usage() + "\n");
    return;
  }

  const { tagVersion, semver, source } = deriveVersion(args.version);
  const commit = gitCommit();
  const date = gitDate();

  const rel = (p) => relative(REPO_ROOT, p) || p;
  const log = (s) => process.stdout.write(s + "\n");
  const mode = args.dryRun ? "DRY-RUN" : "WRITE";

  log("stamp-version [" + mode + "]");
  log("  source:  " + source);
  log("  version: " + semver + "  (tag form: " + tagVersion + ")");
  log("  commit:  " + commit);
  log("  date:    " + date);
  log("");

  let writes = 0;
  let noops = 0;

  // 1. version.json -----------------------------------------------------------
  {
    const existingRaw = existsSync(VERSION_JSON_PATH)
      ? readFileSync(VERSION_JSON_PATH, "utf8")
      : null;
    if (existingRaw == null) {
      log("  [skip] " + rel(VERSION_JSON_PATH) + " (missing; owned by V1-VERSION-LIB)");
    } else {
      const next = buildVersionJson(existingRaw, semver, commit, date);
      if (next === existingRaw) {
        log("  [same] " + rel(VERSION_JSON_PATH));
        noops++;
      } else {
        log("  [edit] " + rel(VERSION_JSON_PATH) + " -> version/commit/date");
        if (!args.dryRun) writeFileSync(VERSION_JSON_PATH, next);
        writes++;
      }
    }
  }

  // 2. package.json -----------------------------------------------------------
  {
    if (!existsSync(PACKAGE_JSON_PATH)) {
      log("  [skip] package.json (missing)");
    } else {
      const raw = readFileSync(PACKAGE_JSON_PATH, "utf8");
      const next = stampPackageVersion(raw, semver);
      if (next === raw) {
        log("  [same] package.json");
        noops++;
      } else {
        log('  [edit] package.json -> "version": "' + semver + '"');
        if (!args.dryRun) writeFileSync(PACKAGE_JSON_PATH, next);
        writes++;
      }
    }
  }

  // 3. footer fallbacks -------------------------------------------------------
  {
    const files = listFooterFiles();
    let footerHits = 0;
    for (const f of files) {
      const raw = readFileSync(f, "utf8");
      if (!raw.includes("version-value") && !raw.includes("/releases/tag/")) {
        continue; // no slot yet -- silent no-op
      }
      const { content, changed } = stampFooter(raw, tagVersion);
      footerHits++;
      if (!changed || content === raw) {
        log("  [same] " + rel(f) + " (footer anchor)");
        noops++;
      } else {
        log("  [edit] " + rel(f) + " -> footer anchor " + tagVersion);
        if (!args.dryRun) writeFileSync(f, content);
        writes++;
      }
    }
    if (footerHits === 0) {
      log(
        "  [info] no footer carries a version-value anchor yet (added by later V3 tasks); footer stamping is a no-op."
      );
    }
  }

  log("");
  log("  summary: " + writes + " to write, " + noops + " unchanged" + (args.dryRun ? " (dry-run: nothing written)" : ""));
}

main();
