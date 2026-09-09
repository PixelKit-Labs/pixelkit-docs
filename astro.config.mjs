// @ts-check
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DOCS = path.resolve(__dirname, 'src', 'content', 'docs');

/**
 * Human labels for the section slugs `scripts/sync-docs.mjs` writes. A directory not listed here
 * (a brand new `docs/` subdirectory that has not been mapped) still gets a sidebar group — its
 * label just falls back to a title-cased version of its slug — so the sidebar never needs a config
 * edit to pick up new material.
 */
const KNOWN_LABELS = {
  'getting-started': 'Getting Started',
  api: 'API Reference',
  guides: 'Guides',
  'for-coding-agents': 'For Coding Agents',
  project: 'Project',
};

/** Preferred left-to-right order; anything else sorts after, alphabetically. */
const ORDER = ['getting-started', 'api', 'guides', 'for-coding-agents', 'project'];

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Builds the sidebar from whatever section directories `scripts/sync-docs.mjs` actually produced
 * under `src/content/docs/` (itself a mirror of the repo's `docs/` tree — see that script's
 * header comment). Each entry uses Starlight's `autogenerate`, so pages within a section are
 * derived from the directory listing too: add a file under `docs/guides/`, run the sync, and it
 * appears with no change here.
 */
function buildSidebar() {
  if (!existsSync(CONTENT_DOCS)) return [];

  const sections = readdirSync(CONTENT_DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  return sections.map((slug) => ({
    label: KNOWN_LABELS[slug] ?? titleCase(slug),
    items: [{ autogenerate: { directory: slug } }],
  }));
}

/**
 * Redirects every page's .md URL to the page itself.
 *
 * The prose is written to be read on GitHub too, so a reader who follows a link from a repository,
 * or types the path they saw in the source tree, arrives at /api/silicon-compute.md and gets a 404.
 * The page exists; only the extension is wrong. Generated from the synced tree rather than
 * hand-listed, so a new page is covered without touching this file.
 */
function buildRedirects() {
  if (!existsSync(CONTENT_DOCS)) return {};
  const out = {};
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), `${prefix}/${entry.name}`);
        continue;
      }
      if (!/.mdx?$/.test(entry.name)) continue;
      const base = entry.name.replace(/.mdx?$/, '');
      if (base === '404') continue;
      const route = base === 'index' ? `${prefix}/` : `${prefix}/${base}/`;
      out[`${prefix}/${base}.md`] = route;
    }
  };
  walk(CONTENT_DOCS, '');
  return out;
}

// https://astro.build/config
export default defineConfig({
  redirects: buildRedirects(),
  integrations: [
    starlight({
      title: 'PixelKit',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/PixelKit-Labs/pixelkit-sdk' }],
      sidebar: buildSidebar(),
      customCss: ['./src/styles/pixelkit.css', './src/styles/archify.css'],
    }),
  ],
});
