---
paths: ["**/*"]
---

[DICT: BP=BrewPage, NS=namespace, UF=user-facing]

# Privacy -- public repo, no platform internals

This repo is PUBLIC (`github.com/kochetkov-ma/brewpage-cookbook`). Treat everything committed here as world-readable.

| Rule | Detail |
|------|--------|
| No abuse-defence internals | Never disclose BP platform abuse-defence / anti-spam / content-moderation INTERNALS. Forbidden categories: detection mechanisms, scoring, thresholds, similarity measures, cooldown windows, clustering, content hiding/soft-removal, and scanner behaviour -- and any number, algorithm name, or rule behind them. |
| Abstract only | When this repo must mention such platform behaviour, describe it ONLY at the UF level already published on `https://brewpage.app` + `/llms.txt` (e.g. "content may be removed for abuse; report via the report form"). !=mechanism, !=metric, !=internal-doc reference. |
| Even this rule stays abstract | Name the abstract categories only; never write a concrete algorithm name, number, threshold, or tier into a committed file -- including this rule file. |
| Only `public/` is shareable | Only the `public/` NS is shareable. !=include private-namespace IDs, user content, secrets, or owner tokens in any committed file, doc, example, or report. |
