/**
 * @file link-descriptions.mjs
 * @description One short description per page, keyed by the URL that page is served at.
 *
 * Used to give every internal link a tooltip saying where it goes, so a reader can tell whether a
 * link is worth following without following it. The text is never written for the tooltip: it is
 * the target page's own first line, or for a hook page the same `summary` the API index shows, so
 * a tooltip cannot describe a page differently from the page itself.
 *
 * External links are deliberately absent. There is no honest source for what is on the other end of
 * one, and a tooltip repeating the domain is noise.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBase } from './site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DOCS = path.join(ROOT, 'docs');
const HOOKS = path.join(ROOT, 'data', 'hooks');

/** The route tables `scripts/sync-docs.mjs` uses, duplicated here rather than imported: that script
 *  runs as a CLI and doing the work at import time would clone nothing but trouble. */
const TOP_LEVEL_FILE_ROUTES = {
  'README.md': 'readme.md',
  'AI_PRIMER.md': 'for-coding-agents/ai-primer.md',
  'PRIVACY.md': 'project/privacy.md',
  'store-listing.md': 'project/store-listing.md',
};
const DIRECTORY_ROUTES = { 'ai-guidance': 'for-coding-agents' };

/** Mirrors docsPathToUrl in sync-docs.mjs: docs-relative path -> served URL. */
function routeFor(relative) {
  const segments = relative.split('/');
  let route;
  if (segments.length === 1) {
    route = TOP_LEVEL_FILE_ROUTES[segments[0]] ?? `project/${segments[0]}`;
  } else {
    const [dir, ...rest] = segments;
    const mapped = DIRECTORY_ROUTES[dir] ?? dir;
    const last = rest[rest.length - 1] === 'README.md' ? 'index.md' : rest[rest.length - 1];
    route = [mapped, ...rest.slice(0, -1), last].join('/');
  }
  const withoutExtension = route.replace(/\.mdx?$/, '');
  return withBase(`/${withoutExtension.replace(/\/index$/, '')}/`);
}

/** Trims markdown emphasis and links out of a line so it reads as plain text in a tooltip. */
function plain(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first blockquote, else the first real paragraph. Capped so a tooltip stays a tooltip. */
function describe(markdown) {
  const body = markdown.replace(/^#[^\n]*\r?\n/, '');
  const quote = body.match(/^>\s*(.+?)\s*$/m);
  const candidate =
    (quote && plain(quote[1])) ||
    plain(
      body
        .split(/\r?\n\r?\n/)
        .map((s) => s.trim())
        .find(
          (s) =>
            s &&
            !s.startsWith('#') &&
            !s.startsWith('>') &&
            !s.startsWith('|') &&
            !s.startsWith('```') &&
            !s.startsWith('<!--') &&
            !s.startsWith('<')
        ) ?? ''
    );

  if (!candidate) return null;
  // One sentence where there is a clean break, otherwise a hard cap.
  const sentence = candidate.match(/^(.{40,180}?[.!?])\s/);
  const text = sentence ? sentence[1] : candidate;
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}

export function buildLinkDescriptions() {
  const map = new Map();
  if (!existsSync(DOCS)) return map;

  // Hook pages first: their summary is written to describe the hook in one line, which is exactly
  // what a tooltip wants, and it is the same string the API index shows.
  const summaries = new Map();
  if (existsSync(HOOKS)) {
    for (const file of readdirSync(HOOKS).filter((f) => f.endsWith('.json'))) {
      const hook = JSON.parse(readFileSync(path.join(HOOKS, file), 'utf8'));
      if (hook.summary) summaries.set(hook.name.toLowerCase(), hook.summary);
    }
  }

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const relative = path.relative(DOCS, full).split(path.sep).join('/');
      const route = routeFor(relative);
      const slug = entry.name.replace(/\.md$/, '').toLowerCase();

      const description = summaries.get(slug) ?? describe(readFileSync(full, 'utf8'));
      if (description) map.set(route, description);
    }
  };
  walk(DOCS);

  return map;
}
