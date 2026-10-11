import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "cookbook-version-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".claude/scripts"), { recursive: true });
  mkdirSync(join(root, "recipes/rag-guide/shared/data"), { recursive: true });
  mkdirSync(join(root, "recipes/rag-guide/shared/components"), { recursive: true });
  copyFileSync(new URL("stamp-version.mjs", import.meta.url), join(root, ".claude/scripts/stamp-version.mjs"));
  writeFileSync(join(root, "package.json"), '{"version":"0.1.9"}\n');
  writeFileSync(join(root, "recipes/rag-guide/shared/data/version.json"), '{"version":"0.1.9"}\n');
  writeFileSync(join(root, "recipes/rag-guide/shared/components/footer.html"), '<a class="version-value" href="https://github.com/kochetkov-ma/brewpage-cookbook/releases/tag/v0.1.9">v0.1.9</a>');
  return root;
}

test("release version stamps package, data and footer idempotently", t => {
  // GIVEN an isolated recipe with all three version surfaces.
  const root = fixture(t);
  const paths = ["package.json", "recipes/rag-guide/shared/data/version.json", "recipes/rag-guide/shared/components/footer.html"];
  // WHEN stamping the same release twice.
  const first = spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", "v0.1.10"], { encoding: "utf8" });
  assert.equal(first.status, 0, "first release stamp succeeds");
  const bytes = paths.map(path => readFileSync(join(root, path), "utf8"));
  const second = spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", "v0.1.10"], { encoding: "utf8" });
  // THEN all carriers match and a repeated stamp preserves every byte.
  assert.equal(second.status, 0, "second release stamp succeeds");
  assert.deepEqual(paths.map(path => readFileSync(join(root, path), "utf8")), bytes, "stamping is byte-idempotent");
  assert.equal(JSON.parse(bytes[0]).version, "0.1.10", "package carries release semver");
  assert.equal(JSON.parse(bytes[1]).version, "0.1.10", "runtime data carries release semver");
  assert.equal(bytes[2], '<a class="version-value" href="https://github.com/kochetkov-ma/brewpage-cookbook/releases/tag/v0.1.10">v0.1.10</a>', "footer carries matching release link and text");
});

test("branch names are rejected before changing any version surface", t => {
  // GIVEN a manual dispatch branch name and unchanged package bytes.
  const root = fixture(t);
  const before = readFileSync(join(root, "package.json"), "utf8");
  // WHEN a branch is incorrectly supplied as an explicit version.
  const result = spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", "main"], { encoding: "utf8" });
  // THEN stamping refuses the branch and preserves the original bytes.
  assert.equal(result.status, 1, "invalid explicit version exits unsuccessfully");
  assert.match(result.stderr, /Expected a semantic version, received: main/, "error explains rejected branch name");
  assert.equal(readFileSync(join(root, "package.json"), "utf8"), before, "rejected version performs no package write");
});

function fixtureGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, "fixture git " + args[0] + " succeeds: " + result.stderr);
  return result.stdout.trim();
}

test("production stamping accepts only an existing release tag at HEAD", t => {
  // GIVEN a committed fixture with an annotated release tag at HEAD.
  const root = fixture(t);
  fixtureGit(root, ["init", "--quiet"]);
  fixtureGit(root, ["config", "user.name", "Version fixture"]);
  fixtureGit(root, ["config", "user.email", "fixture@example.com"]);
  fixtureGit(root, ["add", "."]);
  fixtureGit(root, ["commit", "--quiet", "-m", "Fixture"]);
  fixtureGit(root, ["tag", "-a", "v0.1.10", "-m", "Fixture release"]);
  const head = fixtureGit(root, ["rev-parse", "HEAD"]);
  assert.equal(fixtureGit(root, ["rev-parse", "refs/tags/v0.1.10^{commit}"]), head, "release fixture tag points to HEAD");
  // WHEN publishing the checked-out tag with the production guard.
  const result = spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", "v0.1.10", "--require-head-tag"], { encoding: "utf8" });
  // THEN the published carrier uses the existing tag version.
  assert.equal(result.status, 0, "checked-out release stamp succeeds");
  assert.equal(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version, "0.1.10", "production package matches release tag");
});

test("production stamping refuses missing and stale tags without writes", t => {
  // GIVEN a release tag on a previous commit and unchanged version surfaces.
  const root = fixture(t);
  fixtureGit(root, ["init", "--quiet"]);
  fixtureGit(root, ["config", "user.name", "Version fixture"]);
  fixtureGit(root, ["config", "user.email", "fixture@example.com"]);
  fixtureGit(root, ["add", "."]);
  fixtureGit(root, ["commit", "--quiet", "-m", "Fixture"]);
  fixtureGit(root, ["tag", "v0.1.10"]);
  fixtureGit(root, ["commit", "--allow-empty", "--quiet", "-m", "Later source"]);
  const paths = ["package.json", "recipes/rag-guide/shared/data/version.json", "recipes/rag-guide/shared/components/footer.html"];
  const before = paths.map(path => readFileSync(join(root, path), "utf8"));
  assert.notEqual(fixtureGit(root, ["rev-parse", "refs/tags/v0.1.10^{commit}"]), fixtureGit(root, ["rev-parse", "HEAD"]), "fixture tag is stale");
  // WHEN stale and nonexistent release versions are supplied.
  const results = ["v0.1.10", "v0.1.11"].map(version => spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", version, "--require-head-tag"], { encoding: "utf8" }));
  // THEN both calls fail and every version carrier remains unchanged.
  assert.deepEqual(results.map(result => result.status), [1, 1], "stale and missing release tags fail");
  assert.deepEqual(paths.map(path => readFileSync(join(root, path), "utf8")), before, "rejected release tags leave all carriers unchanged");
});

test("malformed semantic versions and missing CLI values fail before writing", t => {
  // GIVEN an untouched recipe fixture.
  const root = fixture(t);
  const before = readFileSync(join(root, "package.json"), "utf8");
  assert.equal(JSON.parse(before).version, "0.1.9", "fixture starts with expected version");
  // WHEN invalid semver components or a missing option value are supplied.
  const values = ["v01.2.3", "v1.2.3-a..b", "v1.2.3-01", "v1.2.3+", ""];
  const results = values.map(value => spawnSync(process.execPath, [join(root, ".claude/scripts/stamp-version.mjs"), "--version", value], { encoding: "utf8" }));
  // THEN each request is rejected without changing the package.
  assert.deepEqual(results.map(result => result.status), [1, 1, 1, 1, 2], "malformed versions and missing values fail");
  assert.equal(readFileSync(join(root, "package.json"), "utf8"), before, "invalid versions leave package bytes unchanged");
});
