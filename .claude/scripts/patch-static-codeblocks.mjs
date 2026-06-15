// One-shot patcher: sync each recipe HTML page's STATIC <pre><code> block and its
// code-block figcaption data-ru attribute to the regenerated code-annot.js map.
//
// Rationale: the static <pre><code> is the no-JS EN fallback (default locale = en),
// so it MUST hold proper English == code.en. The code-block <figcaption> data-ru is
// the RU no-JS fallback, so it holds proper Cyrillic == caption.ru. The visible
// figcaption text + data-en stay English (already correct). JS-on rendering comes
// from code-annot.js via code-blocks.js, so this keeps no-JS and JS-on in agreement.
//
// Scope: ONLY edits, for each <figure data-annot="KEY">, (1) the figcaption data-ru
// value and (2) the <pre><code> inner text. Leaves everything else untouched. Edits
// files in place; no git operations.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const RG = join(HERE, "..", "..", "recipes", "rag-guide");

const MAP = (await import(join(RG, "shared", "data", "code-annot.js"))).default;

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Escape a string for safe use inside a double-quoted HTML attribute value.
function escAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// page slug -> data-annot keys present (in document order is irrelevant; we patch by key)
const PAGE_KEYS = {
  "what-rag": ["what-rag-minimal-rag"],
  "why-rag": ["why-rag-two-track"],
  "production": ["production-fastapi-endpoint"],
  "embedding": ["embedding-embed-call", "embedding-cosine"],
  "assemble-context": ["assemble-context-assembler", "assemble-context-order"],
  "search": ["search-retrieve"],
  "vector-store": ["vector-store-upsert-query"],
  "evaluation": ["evaluation-harness", "evaluation-ragas"],
  "chunking": ["chunking-fixed-size", "chunking-sliding-window", "chunking-recursive", "chunking-markdown-header"],
  "generation": ["generation-grounded-call"],
};

let totalCode = 0;
let totalCap = 0;
const report = [];

for (const [slug, keys] of Object.entries(PAGE_KEYS)) {
  const file = join(RG, `${slug}.html`);
  let html = readFileSync(file, "utf8");
  let pageCode = 0;
  let pageCap = 0;

  for (const key of keys) {
    const block = MAP[key];
    if (!block) {
      report.push(`  ${slug}: MISSING key ${key} in map`);
      continue;
    }
    const enCode = escHtml(block.code.en);
    const ruCap = escAttr(block.caption.ru);

    // Locate the <figure ... data-annot="KEY"> ... up to its closing </code></pre>.
    const figIdx = html.indexOf(`data-annot="${key}"`);
    if (figIdx === -1) {
      report.push(`  ${slug}: no figure for ${key}`);
      continue;
    }
    // 1) figcaption data-ru: the FIRST data-ru="..." occurring after figIdx and
    //    before the first <pre> after figIdx.
    const preIdx = html.indexOf("<pre>", figIdx);
    const capSlice = html.slice(figIdx, preIdx);
    const capMatch = capSlice.match(/data-ru="([\s\S]*?)"/);
    if (capMatch) {
      const before = html.slice(0, figIdx);
      const after = html.slice(figIdx);
      const newAfter = after.replace(/data-ru="[\s\S]*?"/, `data-ru="${ruCap}"`);
      html = before + newAfter;
      pageCap++;
    } else {
      report.push(`  ${slug}/${key}: no figcaption data-ru found`);
    }

    // 2) <pre><code> ... </code></pre> inner replacement (first one after figIdx).
    const preStart = html.indexOf("<pre><code>", html.indexOf(`data-annot="${key}"`));
    if (preStart === -1) {
      report.push(`  ${slug}/${key}: no <pre><code> found`);
      continue;
    }
    const codeOpen = preStart + "<pre><code>".length;
    const codeClose = html.indexOf("</code></pre>", codeOpen);
    if (codeClose === -1) {
      report.push(`  ${slug}/${key}: no </code></pre> close`);
      continue;
    }
    html = html.slice(0, codeOpen) + enCode + html.slice(codeClose);
    pageCode++;
  }

  writeFileSync(file, html, "utf8");
  totalCode += pageCode;
  totalCap += pageCap;
  report.push(`${slug}.html: ${pageCode} code block(s), ${pageCap} figcaption(s) patched`);
}

console.log(report.join("\n"));
console.log(`\nTOTAL: ${totalCode} <pre><code> blocks, ${totalCap} figcaptions synced to code-annot.js`);
