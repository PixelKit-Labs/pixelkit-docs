/**
 * @file build-diagrams.mjs
 * @description Renders every diagram spec in `docs/diagrams/*.json` to a themed inline SVG.
 *
 * Diagrams are authored as Archify specifications and rendered here into `docs/diagrams/*.svg`,
 * which are **committed**. `scripts/sync-docs.mjs` then substitutes them into the markdown at sync
 * time wherever it finds `<!-- diagram: name -->`.
 *
 * The generated SVG is committed rather than built on demand because Archify is a local authoring
 * tool, not a dependency of this site. A CI runner, a Cloudflare build, or a contributor without it
 * must still be able to build the docs — so the deploy path reads committed SVG and needs nothing
 * beyond Astro. Only someone *changing* a diagram needs Archify.
 *
 * The SVG carries no literal colours. Every shape is classed (`m-default`, `c-lane`, `t-backend`,
 * and so on) and coloured by `src/styles/archify.css`, which this script also extracts. Those rules
 * key off `[data-theme]`, which is the same attribute Starlight sets on `<html>`, so one SVG serves
 * both light and dark without a second render.
 *
 * Usage: `npm run build:diagrams`
 *   ARCHIFY_BIN overrides the path to archify's CLI entry point.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'docs', 'diagrams');
const CSS_OUT = path.join(ROOT, 'src', 'styles', 'archify.css');

const ARCHIFY_BIN =
  process.env.ARCHIFY_BIN ?? path.join(os.homedir(), '.claude', 'skills', 'archify', 'bin', 'archify.mjs');

/** `diagram_type` decides which renderer archify uses; it is declared in the spec itself. */
function diagramType(spec) {
  if (!spec.diagram_type) throw new Error('spec has no diagram_type');
  return spec.diagram_type;
}

/**
 * Removes `@media`, `@page` and `@supports` blocks and everything inside them.
 *
 * Necessary because the rule extractor below is flat: it has no concept of nesting, so a rule that
 * lives inside an at-rule would be lifted out of it and applied unconditionally. Archify ships a
 * `@media print` block that force-sets the entire light palette so a dark diagram prints legibly on
 * paper. Lifted out, that block repainted every diagram in light colours on a dark page — correct
 * markup, correct variables, wrong values, and nothing in the markup to suggest why.
 */
function stripAtRules(css) {
  let out = '';
  for (let i = 0; i < css.length; ) {
    if (css[i] !== '@') {
      out += css[i++];
      continue;
    }
    const open = css.indexOf('{', i);
    const semi = css.indexOf(';', i);
    // An at-rule without a block (`@import url(...);`) ends at the semicolon.
    if (open === -1 || (semi !== -1 && semi < open)) {
      i = semi === -1 ? css.length : semi + 1;
      continue;
    }
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

/**
 * Pulls the rules the SVGs actually depend on out of archify's full viewer stylesheet, which is
 * ~190 kB and mostly chrome this site does not render — toolbar, search, cards, presentation mode.
 * Kept: the `[data-theme]` custom-property blocks, and any rule whose selector names a class one of
 * the SVGs uses.
 *
 * `classes` is the union across every diagram, not the classes of one of them. This used to be
 * built from whichever spec sorted first, so a component type that only appeared in a later diagram
 * — `cloud`, `external`, `messagebus` — had its rule dropped. An SVG element with no matching rule
 * does not fall back to something readable: `fill` defaults to black, so those boxes and their
 * labels rendered black on black.
 */
function extractCss(html, classes) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  // Comments must go before the rules are split. The naive rule regex treats everything between
  // } and { as the selector, so a /* ... */ above a rule becomes part of it - which silently ate
  // the `:root, [data-theme="dark"]` selector and left only the light-theme blocks valid, so every
  // diagram rendered with light fills on a dark page.
  const stripped = stripAtRules(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const rules = [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

  const keep = rules.filter(([, selector, body]) => {
    if (/:root|\[data-theme/.test(selector) && /--/.test(body)) return true;
    return classes.some((c) => new RegExp(`\\.${c.replace(/-/g, '\\-')}(?![\\w-])`).test(selector));
  });

  return keep.map(([rule]) => rule.trim()).join('\n');
}

function main() {
  if (!existsSync(ARCHIFY_BIN)) {
    console.error(
      `build-diagrams: archify not found at ${ARCHIFY_BIN}.\n` +
        'Set ARCHIFY_BIN, or skip this script — the committed SVGs under docs/diagrams/ are what the\n' +
        'site builds from, so you only need archify to change a diagram.'
    );
    process.exit(1);
  }
  if (!existsSync(SPEC_DIR)) {
    console.log('build-diagrams: no docs/diagrams directory, nothing to do');
    return;
  }

  const specs = readdirSync(SPEC_DIR).filter((f) => f.endsWith('.json')).sort();
  if (specs.length === 0) {
    console.log('build-diagrams: no specs found');
    return;
  }

  const work = path.join(os.tmpdir(), 'pixelkit-diagram-build');
  mkdirSync(work, { recursive: true });

  // The stylesheet is shared by every diagram, so it has to be built from the union of what they
  // all use. Collected here and extracted once the loop has seen every SVG.
  const usedClasses = new Set();
  let viewerHtml = null;

  for (const file of specs) {
    const name = path.basename(file, '.json');
    const specPath = path.join(SPEC_DIR, file);
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    const htmlPath = path.join(work, `${name}.html`);

    // `render` rather than `deliver`: deliver writes a snapshot and receipt next to the output,
    // which belongs to a standalone artifact, not to an SVG that is about to be inlined.
    execFileSync(
      process.execPath,
      [ARCHIFY_BIN, 'render', diagramType(spec), specPath, htmlPath, '--quality', 'showcase'],
      { stdio: 'pipe' }
    );

    const html = readFileSync(htmlPath, 'utf8');
    const match = html.match(/<svg[\s\S]*?<\/svg>/);
    if (!match) throw new Error(`${name}: archify produced no inline <svg>`);
    let svg = match[0];

    // The title is the accessible name; without it a screen reader gets a shape with no meaning,
    // which is the same failure the ASCII diagrams had.
    const title = spec.meta?.title ?? name;
    if (!/<title>/.test(svg)) {
      svg = svg.replace(/<svg([^>]*)>/, `<svg$1 role="img" aria-label="${title.replace(/"/g, '&quot;')}"><title>${title}</title>`);
    }

    writeFileSync(path.join(SPEC_DIR, `${name}.svg`), `${svg}\n`, 'utf8');
    for (const m of svg.matchAll(/class="([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c) usedClasses.add(c);
    }
    viewerHtml ??= html;
    console.log(`build-diagrams: ${name} -> docs/diagrams/${name}.svg (${(svg.length / 1024).toFixed(1)} kB)`);
  }

  const sharedCss = extractCss(viewerHtml, [...usedClasses].sort());

  // A class with no rule renders black, which is not a visible-but-ugly failure: on a dark page it
  // is invisible, and on a light one it is black on black. Fail the build rather than ship it.
  const undefined_ = [...usedClasses].filter(
    (c) => !new RegExp(`\\.${c.replace(/-/g, '\\-')}(?![\\w-])`).test(sharedCss)
  );
  if (undefined_.length > 0) {
    console.error(
      `build-diagrams: ${undefined_.length} class(es) used by a diagram have no rule in the ` +
        `extracted stylesheet, so they would render black on black:\n  ${undefined_.join(', ')}`
    );
    process.exit(1);
  }

  mkdirSync(path.dirname(CSS_OUT), { recursive: true });
  writeFileSync(
    CSS_OUT,
    '/* Generated by scripts/build-diagrams.mjs. Do not edit.\n' +
      '   Colours for the inline diagram SVGs. Keyed off [data-theme], which Starlight sets on <html>,\n' +
      '   so one SVG serves both light and dark. */\n\n' +
      `${sharedCss}\n`,
    'utf8'
  );
  console.log(`build-diagrams: wrote ${path.relative(ROOT, CSS_OUT)} (${(sharedCss.length / 1024).toFixed(1)} kB)`);

  rmSync(work, { recursive: true, force: true });
}

main();
