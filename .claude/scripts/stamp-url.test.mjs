import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scripts = dirname(fileURLToPath(import.meta.url));
const placeholder = "https://brewpage.app/public/REPLACE_AT_PUBLISH";
const source = [placeholder, `${placeholder}/`, `${placeholder}/chunking.html?lang=en#chunk`,
  `${placeholder}/shared/og/image.png`, `${placeholder}?q={search_term_string}`].join("\n");

function fixture(t, link) {
  const root = mkdtempSync(join(tmpdir(), "cookbook-stamp-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scriptDir = join(root, ".claude", "scripts");
  const recipe = join(root, "recipes", "rag-guide");
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(recipe, { recursive: true });
  const script = join(scriptDir, "stamp-url.mjs");
  copyFileSync(join(scripts, "stamp-url.mjs"), script);
  const site = { namespace: "public", id: "AbCdEf1234", link };
  const descriptor = join(recipe, ".brewpage-site.json");
  writeFileSync(descriptor, JSON.stringify(site));
  const page = join(recipe, "index.html");
  const sitemap = join(recipe, "sitemap.xml");
  const index = join(root, "recipes", "index.json");
  writeFileSync(page, source);
  writeFileSync(sitemap, `<loc>${placeholder}/chunking.html?lang=en</loc>`);
  writeFileSync(index, JSON.stringify({ recipes: [{ slug: "rag-guide", liveLink: placeholder, liveUrl: placeholder }] }, null, 2) + "\n");
  const run = (...args) => spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8", env: { ...process.env, STAMP_SITE_JSON: descriptor },
  });
  const snapshot = () => [page, sitemap, index, descriptor].map(path => readFileSync(path, "utf8"));
  return { run, snapshot, page, index };
}

for (const [cohort, link] of [
  ["OLD", "https://brewpage.app/public/AbCdEf1234"],
  ["NEW", "https://a1b2c3d4e5.brewpage.app/"],
]) {
  test(`${cohort} stamps full server bases with root, child, asset and query suffixes idempotently`, t => {
    // GIVEN: isolated public fixture with placeholder URLs.
    const f = fixture(t, link);
    assert.equal(f.snapshot()[0], source, "fixture contains the exact placeholder source");
    // WHEN: stamp from the descriptor's complete server link.
    const result = f.run();
    // THEN: every suffix uses the actual base without double slashes.
    assert.equal(result.status, 0, result.stderr);
    const base = link.replace(/\/$/, "");
    assert.equal(f.snapshot()[0], [link, `${base}/`, `${base}/chunking.html?lang=en#chunk`,
      `${base}/shared/og/image.png`, `${link}?q={search_term_string}`].join("\n"), "page URLs preserve suffixes");
    assert.equal(f.snapshot()[1], `<loc>${base}/chunking.html?lang=en</loc>`, "sitemap uses the server base");
    assert.deepEqual(JSON.parse(readFileSync(f.index, "utf8")), {
      recipes: [{ slug: "rag-guide", liveLink: link, liveUrl: link }],
    }, "both index links equal the exact server link");
    const stamped = f.snapshot();
    assert.equal(f.run().status, 0, "second stamping succeeds");
    assert.deepEqual(f.snapshot(), stamped, "second stamping changes no bytes");
  });
}

test("missing server link refuses all writes", t => {
  // GIVEN: valid resource ID but no server link.
  const f = fixture(t, undefined);
  const before = f.snapshot();
  assert.equal(JSON.parse(before[3]).id, "AbCdEf1234", "fixture ID is supplied");
  // WHEN: stamp without an authoritative URL.
  const result = f.run();
  // THEN: fallback URL construction cannot silently succeed.
  assert.equal(result.status, 1, "missing link fails");
  assert.match(result.stderr, /missing a non-empty server "link"/, "error names the required link");
  assert.deepEqual(f.snapshot(), before, "refusal changes no files");
});

test("credentials or query in a descriptor link refuse all writes", t => {
  // GIVEN: descriptor violates the clean share-link contract.
  const f = fixture(t, "https://a1b2c3d4e5.brewpage.app/?password=synthetic");
  const before = f.snapshot();
  assert.equal(JSON.parse(before[3]).link, "https://a1b2c3d4e5.brewpage.app/?password=synthetic", "invalid fixture link is exact");
  // WHEN: stamp from an unsafe descriptor link.
  const result = f.run();
  // THEN: invalid link is rejected before writes.
  assert.equal(result.status, 1, "query-bearing link fails");
  assert.match(result.stderr, /requires a clean HTTPS server "link"/, "error identifies the clean-link requirement");
  assert.deepEqual(f.snapshot(), before, "refusal changes no files");
});

test("dry run preserves bytes and published OLD URLs remain unchanged", t => {
  // GIVEN: a mixed fixture containing an already-published OLD URL.
  const f = fixture(t, "https://a1b2c3d4e5.brewpage.app/");
  const published = "https://brewpage.app/public/OldGuide01/chunking.html?lang=en";
  writeFileSync(f.page, `${source}\n${published}`);
  const before = f.snapshot();
  assert.equal(before[0], `${source}\n${published}`, "mixed fixture is complete");
  // WHEN: preview followed by an actual stamp.
  const preview = f.run("--dry-run");
  // THEN: preview does not write and apply retains existing URLs.
  assert.equal(preview.status, 0, "dry run succeeds");
  assert.deepEqual(f.snapshot(), before, "dry run changes no bytes");
  assert.equal(f.run().status, 0, "apply succeeds");
  assert.equal(f.snapshot()[0].split("\n").at(-1), published, "published OLD URL stays exact");
});

test("release body uses the action URL and refuses a missing output", t => {
  // GIVEN: actual workflow shell, isolated release-body inputs and a synthetic URL.
  const workflow = readFileSync(join(scripts, "..", "..", ".github", "workflows", "publish-recipe.yml"), "utf8");
  assert.match(workflow, /LIVE_LINK: \$\{\{ steps\.brewpage\.outputs\.url \}\}/, "LIVE_LINK binds to the action output");
  const block = workflow.match(/- name: Build release body[\s\S]*?run: \|\n([\s\S]*?)\n      - name:/);
  assert.ok(block, "release body shell exists");
  const shell = block[1].replace(/^          /gm, "");
  const f = fixture(t, "https://a1b2c3d4e5.brewpage.app/");
  const root = dirname(dirname(f.index));
  const link = "https://serverchosen.brewpage.app/";
  const env = { ...process.env, LIVE_LINK: link, REF_NAME: "v0.0.0", RUNNER_TEMP: root, GITHUB_OUTPUT: join(root, "outputs") };
  // WHEN: execute the workflow body with the action output, then without it.
  const result = spawnSync("bash", ["-c", shell], { cwd: root, env, encoding: "utf8" });
  // THEN: body links copy the server output and missing output fails.
  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(join(root, "release-body.md"), "utf8"), /  https:\/\/serverchosen\.brewpage\.app\/\n/, "release points to the server URL");
  assert.doesNotMatch(shell, /LIVE_ID|https:\/\/brewpage\.app\/public\//, "body never reconstructs URLs");
  assert.equal(spawnSync("bash", ["-c", shell], { cwd: root, env: { ...env, LIVE_LINK: "" }, encoding: "utf8" }).status, 1, "missing action URL fails");
});
