/**
 * @file site.config.mjs
 * @description Where the site is published, in one place.
 *
 * Both `astro.config.mjs` and `scripts/sync-docs.mjs` need this. Astro prefixes its own links with
 * `base` automatically, but the links this project generates are written into markdown as
 * site-absolute paths (`/api/neural-ai/`) by the sync script, and Astro does not rewrite those. If
 * the two disagreed, every cross-page link would 404 on the deployed site while working locally —
 * the same class of failure the sync script was written to fix.
 *
 * On GitHub Pages a project site is served under the repository name, so BASE is `/pixelkit-docs`.
 * Point DOCS_BASE at `/` (and SITE at the domain) if this ever moves to a custom domain.
 */

export const SITE = process.env.DOCS_SITE ?? 'https://pixelkit-labs.github.io';
export const BASE = process.env.DOCS_BASE ?? '/pixelkit-docs';

/** Joins BASE with a site-absolute path, collapsing the slash between them. */
export function withBase(pathname) {
  const base = BASE.replace(/\/$/, '');
  return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
