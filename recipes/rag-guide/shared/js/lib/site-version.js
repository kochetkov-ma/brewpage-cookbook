/**
 * site-version.js -- footer version stamp renderer for the RAG Guide.
 *
 * RESPONSIBILITY: enhance the static footer version slot with the live release
 * version. Fetches the same-origin static shared/data/version.json (the stamp
 * script's output), finds the slot [data-component="site-version"] within the
 * mounted root, and rewrites the .version-value anchor text to `v<version>` and
 * its href to the GitHub releases-tag URL for that version. Progressive
 * enhancement only: the page already ships a correct, stamp-synced no-JS
 * fallback inside the slot; this module merely refreshes it at runtime.
 *
 * GUARDED: if the fetch fails, the JSON is malformed, the slot is absent, or the
 * .version-value anchor is missing, the existing static fallback is left exactly
 * as authored -- the slot is NEVER blanked. No throw escapes init().
 *
 * NO MOTION: text/href swap only; nothing animates, so reduced-motion is moot.
 *
 * CONTRACT: export function init(rootEl, config) -> { destroy() }.
 *   config.versionSrc  path to version.json (default "shared/data/version.json",
 *                      matching how the other libs resolve shared/data/* paths --
 *                      a recipe-root-relative path; page glue may override per the
 *                      page's directory if it ever differs).
 *   config.repoUrl     GitHub repo base for the releases-tag link
 *                      (default REPO_URL below).
 * destroy(): no-op cleanup (no listeners/timers are held; defined for the
 *   standard lib lifecycle so page glue can call it uniformly on pagehide).
 */

import { qs, fetchJson, stripMeta } from "./dom.js";

const DEFAULT_VERSION_SRC = "shared/data/version.json";
const REPO_URL = "https://github.com/kochetkov-ma/brewpage-cookbook";
const PLACEHOLDER = "0.0.0-dev"; // skeleton marker -- do not render as a release

/** Build the GitHub releases-tag URL for a bare semver. */
function tagUrl(repoUrl, version) {
  return repoUrl + "/releases/tag/v" + version;
}

/**
 * True only for a usable release version string: non-empty, not the dev
 * placeholder, and free of characters that have no business in a tag/href.
 */
function isRenderable(version) {
  return (
    typeof version === "string" &&
    version.length > 0 &&
    version !== PLACEHOLDER &&
    /^[0-9A-Za-z.\-+]+$/.test(version)
  );
}

export function init(rootEl, config) {
  const cfg = config || {};
  const versionSrc = cfg.versionSrc || DEFAULT_VERSION_SRC;
  const repoUrl = cfg.repoUrl || REPO_URL;

  const slot = rootEl ? qs('[data-component="site-version"]', rootEl) : null;
  // Slot absent -> nothing to enhance; the page's static fallback (if any) stands.
  if (!slot) return { destroy() {} };

  const anchor = qs(".version-value", slot);
  // Anchor absent -> leave the slot untouched (never blank a malformed fallback).
  if (!anchor) return { destroy() {} };

  let cancelled = false;

  // Fire-and-forget: any failure path leaves the static fallback intact.
  fetchJson(versionSrc)
    .then((raw) => {
      if (cancelled || !raw) return;
      const data = stripMeta(raw);
      const version = data.version;
      if (!isRenderable(version)) return; // keep the static fallback
      anchor.textContent = "v" + version;
      anchor.setAttribute("href", tagUrl(repoUrl, version));
    })
    .catch(() => {
      /* fetch/parse failed -> static fallback holds; never blank the slot */
    });

  return {
    destroy() {
      // No DOM/listeners owned; flag the in-flight fetch so a late resolve is
      // a no-op after the page tears down.
      cancelled = true;
    },
  };
}
