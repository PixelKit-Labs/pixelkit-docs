/**
 * @file check-diagrams.mjs
 * @description Fails the build when a diagram is missing, stale, or orphaned.
 *
 * The ASCII diagrams this replaced rotted silently: their alignment collapsed, two copies of the
 * same picture drifted into disagreeing about the hardware, and nothing ever said so. Replacing
 * them with generated SVG removes that failure only if something checks the generated output still
 * matches its source.
 *
 * Three checks:
 *   1. Every `<!-- diagram: name -->` in docs/ has a matching docs/diagrams/name.svg.
 *   2. Every spec has an SVG at least as new as it — a spec edited without rerunning
 *      `npm run build:diagrams` would otherwise publish the previous picture.
 *   3. Every spec is actually referenced by a page, so a diagram nobody shows gets noticed rather
 *      than quietly maintained forever.
 *
 * Runs in `npm run build` and needs nothing but Node, so CI catches all three without Archify.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const DIAGRAMS = path.join(DOCS, 'diagrams');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

const failures = [];

const pages = walk(DOCS).filter((f) => /\.mdx?$/.test(f));
const referenced = new Map();

for (const page of pages) {
  const body = readFileSync(page, 'utf8');
  for (const m of body.matchAll(/<!--\s*diagram:\s*([a-z0-9-]+)\s*-->/g)) {
    const name = m[1];
    referenced.set(name, path.relative(ROOT, page));
    if (!existsSync(path.join(DIAGRAMS, `${name}.svg`))) {
      failures.push(
        `${path.relative(ROOT, page)} references diagram "${name}", but docs/diagrams/${name}.svg ` +
          'does not exist. Add the spec and run `npm run build:diagrams`.'
      );
    }
  }
}

const specs = existsSync(DIAGRAMS)
  ? readdirSync(DIAGRAMS).filter((f) => f.endsWith('.json')).map((f) => path.basename(f, '.json'))
  : [];

for (const name of specs) {
  const specPath = path.join(DIAGRAMS, `${name}.json`);
  const svgPath = path.join(DIAGRAMS, `${name}.svg`);

  if (!existsSync(svgPath)) {
    failures.push(`docs/diagrams/${name}.json has no rendered SVG. Run \`npm run build:diagrams\`.`);
    continue;
  }
  if (statSync(specPath).mtimeMs > statSync(svgPath).mtimeMs) {
    failures.push(
      `docs/diagrams/${name}.json is newer than its SVG, so the published picture is the previous ` +
        'one. Run `npm run build:diagrams`.'
    );
  }
  if (!referenced.has(name)) {
    failures.push(
      `docs/diagrams/${name} is rendered but no page references it. Add ` +
        `\`<!-- diagram: ${name} -->\` to a page, or delete the spec.`
    );
  }
}

if (failures.length) {
  console.error(`\ncheck-diagrams failed with ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Diagrams consistent: ${specs.length} spec(s), each rendered, current, and shown on a page.`
);
