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

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'PixelKit',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/PixelKit-Labs/pixelkit' }],
      sidebar: buildSidebar(),
    }),
  ],
});
