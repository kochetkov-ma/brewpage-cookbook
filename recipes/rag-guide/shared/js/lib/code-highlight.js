/**
 * code-highlight.js -- hand-rolled, zero-dependency syntax highlighter (Atlas
 * dark-code-plate). No Prism/highlight.js, no CDN, no webfont, no external
 * request (hard site rule). Static: no animation, no reveal.
 *
 * RESPONSIBILITY: tokenize a code string with a per-language sticky-regex table
 * and emit an HTML string of escaped `<span class="tok tok-KIND">...</span>`
 * pieces whose concatenated text content equals the input VERBATIM (whitespace,
 * newlines, every char preserved). Downstream consumers split the output on
 * `\n` to bucket tokens per line, so `\n` is emitted as plain escaped text and
 * never swallowed.
 *
 * Exports:
 *   highlight(code, lang) -> string   -- PURE; escaped HTML string.
 *   highlightInto(preEl, lang)        -- highlight one in-DOM <pre>/<code>.
 *   init(rootEl, config) -> { destroy() }  -- find <pre><code>, highlight by
 *                                             data-lang; idempotent, no global state.
 *
 * Token kind -> CSS class (consumers/CSS must match):
 *   kw->tok-kw  str->tok-str  num->tok-num  com->tok-com
 *   fn->tok-fn  op->tok-op    punc->tok-punc  key->tok-key
 * Unknown text emits as plain escaped text (no span). Unknown lang -> plaintext.
 *
 * Defensive: tokenization is wrapped in try/catch; on any failure the raw code
 * is returned escaped (degrades to plain text) -- it never throws to the page.
 */

const SUPPORTED = new Set(["python", "json", "sql", "bash", "plaintext"]);

/** Escape the four HTML-significant chars so output is innerHTML-safe. */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- per-language sticky-regex tables (order matters; first match wins) -----
// Each rule { kind, re } uses the sticky flag (y); the tokenizer sets
// re.lastIndex to the cursor and tries each rule in order at that position.

const PY_KW =
  "False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|" +
  "else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|" +
  "pass|raise|return|try|while|with|yield|match|case|self|cls";

const SQL_KW =
  "SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|" +
  "DROP|INDEX|VIEW|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|AS|AND|OR|NOT|" +
  "NULL|IS|IN|LIKE|BETWEEN|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|UNION|" +
  "ALL|COUNT|SUM|AVG|MIN|MAX|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|UNIQUE|" +
  "CONSTRAINT|CASE|WHEN|THEN|ELSE|END|ASC|DESC|INT|INTEGER|TEXT|VARCHAR|" +
  "BOOLEAN|FLOAT|REAL|VECTOR|WITH|RETURNING|EXISTS|CAST|USING";

const BASH_KW =
  "if|then|elif|else|fi|for|while|until|do|done|case|esac|in|function|select|" +
  "return|break|continue|local|export|readonly|declare|source|echo|cd|exit|" +
  "set|unset|trap|shift|read|test";

// Case-insensitive keyword match for SQL; case-sensitive for the rest.
const TABLES = {
  python: [
    { kind: "com", re: /#[^\n]*/y },
    // triple-quoted strings first (may span newlines), then single/double.
    { kind: "str", re: /[rbfRBF]{0,2}"""[\s\S]*?"""/y },
    { kind: "str", re: /[rbfRBF]{0,2}'''[\s\S]*?'''/y },
    { kind: "str", re: /[rbfRBF]{0,2}"(?:\\.|[^"\\\n])*"/y },
    { kind: "str", re: /[rbfRBF]{0,2}'(?:\\.|[^'\\\n])*'/y },
    { kind: "num", re: /\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?\b/y },
    { kind: "kw", re: new RegExp("\\b(?:" + PY_KW + ")\\b", "y") },
    { kind: "fn", re: /[A-Za-z_]\w*(?=\s*\()/y },
    { kind: "punc", re: /[()[\]{}.,:;@]/y },
    { kind: "op", re: /->|:=|\*\*|\/\/|[-+*/%<>=!&|^~]=?/y },
    { kind: null, re: /[A-Za-z_]\w*/y },
  ],
  json: [
    // an object key is a string immediately before a colon.
    { kind: "key", re: /"(?:\\.|[^"\\])*"(?=\s*:)/y },
    { kind: "str", re: /"(?:\\.|[^"\\])*"/y },
    { kind: "num", re: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
    { kind: "kw", re: /\b(?:true|false|null)\b/y },
    { kind: "punc", re: /[{}[\],:]/y },
  ],
  sql: [
    { kind: "com", re: /--[^\n]*/y },
    { kind: "com", re: /\/\*[\s\S]*?\*\//y },
    { kind: "str", re: /'(?:''|[^'])*'/y },
    { kind: "str", re: /"(?:""|[^"])*"/y },
    { kind: "num", re: /\b\d+(?:\.\d+)?\b/y },
    { kind: "kw", re: new RegExp("\\b(?:" + SQL_KW + ")\\b", "iy") },
    { kind: "fn", re: /[A-Za-z_]\w*(?=\s*\()/y },
    { kind: "punc", re: /[()[\],.;]/y },
    { kind: "op", re: /::|<>|!=|[-+*/%<>=]=?|\|\||&&/y },
    { kind: null, re: /[A-Za-z_]\w*/y },
  ],
  bash: [
    { kind: "com", re: /#[^\n]*/y },
    { kind: "str", re: /"(?:\\.|[^"\\])*"/y },
    { kind: "str", re: /'[^']*'/y },
    // $VAR / ${VAR} / $(...) references read as fn (identifier-ish accents).
    { kind: "fn", re: /\$\{[^}]*\}|\$\w+|\$\([^)]*\)/y },
    { kind: "num", re: /\b\d+\b/y },
    { kind: "kw", re: new RegExp("\\b(?:" + BASH_KW + ")\\b", "y") },
    { kind: "op", re: /&&|\|\||>>|<<|[|&<>=!]=?/y },
    { kind: "punc", re: /[()[\]{};]/y },
    { kind: null, re: /[A-Za-z_][\w-]*/y },
  ],
  plaintext: [],
};

function normalizeLang(lang) {
  const l = (lang || "").toString().trim().toLowerCase();
  if (l === "py") return "python";
  if (l === "sh" || l === "shell") return "bash";
  if (l === "js" || l === "javascript") return "plaintext";
  return SUPPORTED.has(l) ? l : "plaintext";
}

function emit(parts, kind, text) {
  if (text === "") return;
  if (kind) parts.push('<span class="tok tok-' + kind + '">' + escapeHtml(text) + "</span>");
  else parts.push(escapeHtml(text));
}

/**
 * Tokenize `code` against a rule table. Unmatched single chars are buffered and
 * flushed as plaintext so runs of unmatched text (incl. whitespace + newlines)
 * collapse into one escaped piece. Concatenated text == input verbatim.
 */
function tokenize(code, rules) {
  const parts = [];
  const n = code.length;
  let i = 0;
  let plain = "";
  while (i < n) {
    let matched = false;
    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];
      rule.re.lastIndex = i;
      const m = rule.re.exec(code);
      if (m && m.index === i && m[0].length > 0) {
        if (plain) {
          emit(parts, null, plain);
          plain = "";
        }
        emit(parts, rule.kind, m[0]);
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      plain += code[i];
      i++;
    }
  }
  if (plain) emit(parts, null, plain);
  return parts.join("");
}

/**
 * PURE highlighter. Returns an escaped HTML string of tok spans; on any error
 * returns the raw code escaped (plain-text degrade). Unknown lang -> plaintext.
 */
export function highlight(code, lang) {
  const src = code == null ? "" : String(code);
  const resolved = normalizeLang(lang);
  if (resolved === "plaintext") return escapeHtml(src);
  try {
    const rules = TABLES[resolved];
    if (!rules || rules.length === 0) return escapeHtml(src);
    return tokenize(src, rules);
  } catch (_e) {
    return escapeHtml(src);
  }
}

/**
 * Highlight a single in-DOM <pre>/<code>. Accepts the <pre> or the <code>; reads
 * textContent (so prior spans are stripped -> idempotent) and replaces content.
 */
export function highlightInto(preEl, lang) {
  if (!preEl) return;
  const codeEl =
    preEl.tagName && preEl.tagName.toLowerCase() === "code"
      ? preEl
      : preEl.querySelector("code") || preEl;
  const resolved = normalizeLang(lang != null ? lang : codeEl.getAttribute("data-lang"));
  const raw = codeEl.textContent;
  codeEl.innerHTML = highlight(raw, resolved);
  codeEl.setAttribute("data-highlighted", resolved);
}

/**
 * Find <pre><code> (or config.selector) under rootEl and highlight each by its
 * data-lang (default plaintext). Idempotent: re-reads textContent before
 * tokenizing so a second init does not double-wrap. No global state.
 */
export function init(rootEl, config) {
  const cfg = config || {};
  const root = rootEl || document;
  const selector = cfg.selector || "pre > code, pre code";
  const targets = Array.from(root.querySelectorAll(selector));
  // de-dup (the selector can match the same <code> twice)
  const seen = new Set();
  targets.forEach((codeEl) => {
    if (seen.has(codeEl)) return;
    seen.add(codeEl);
    const lang = cfg.lang || codeEl.getAttribute("data-lang") || "plaintext";
    highlightInto(codeEl, lang);
  });
  return {
    destroy() {
      // Highlighted content is a faithful re-render of the original text; the
      // marker is dropped so a later init re-reads clean textContent.
      seen.forEach((codeEl) => codeEl.removeAttribute("data-highlighted"));
    },
  };
}
