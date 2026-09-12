/**
 * @file build-api-pages.mjs
 * @description Writes a reference page for any hook that does not have one, and keeps the section
 * indexes in step with `data/hooks`.
 *
 * Adding a hook means adding its definition to `data/hooks`. Before this script, it also meant
 * hand-writing a page in the right section and adding it to two index tables, and forgetting was
 * silent until `check-api-reference` started failing the build on it. This closes that: run it, and
 * every hook has a page.
 *
 * **It never touches a page that already exists.** The 39 original pages carry prose that is richer
 * than the JSON — "Not scheduler load", `"unknown"` before the first read — which is why they were
 * split out of the old category pages rather than generated from `data/hooks` in the first place.
 * Regenerating them would quietly flatten that. A generated page is a starting point for a new
 * hook, and editing it afterwards is expected.
 *
 * The index blocks *are* regenerated, between markers, so the surrounding prose survives. The
 * hand-maintained version of those tables had drifted: it listed useUWB in two sections and useVideo
 * in the wrong one.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'docs', 'api');
const HOOKS_DIR = path.join(ROOT, 'data', 'hooks');

const SECTION_OF = {
  silicon: 'silicon-compute', compute: 'silicon-compute', ai: 'neural-ai',
  sensors: 'sensors-actuators', radios: 'radios-security', security: 'radios-security', system: 'system-media', pro: 'pro-exclusives',
};
const SECTION_LABEL = {
  'silicon-compute': 'Silicon and compute',
  'neural-ai': 'Neural and AI',
  'sensors-actuators': 'Sensors and actuators',
  'radios-security': 'Radios and security',
  'system-media': 'System and media',
  'pro-exclusives': 'Pixel Pro exclusives',
};

const START = '<!-- hooks:start -->';
const END = '<!-- hooks:end -->';

/** Escapes the pipes in a type or description so they cannot break out of their table cell. */
const cell = (s) => String(s ?? '').replace(/(?<!\\)\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

function table(header, rows) {
  return [`| ${header.join(' | ')} |`, `|${header.map(() => ' :--- ').join('|')}|`, ...rows].join('\n');
}

function renderPage(hook) {
  const out = [`# ${hook.name}`, ''];
  if (hook.description) out.push(hook.description, '');
  else if (hook.summary) out.push(hook.summary, '');

  if (hook.signature) {
    out.push('## Signature', '```typescript', hook.signature, '```', '');
  }

  if (hook.params?.length) {
    out.push(
      '## Inputs',
      table(['Parameter', 'Type', 'Description'],
        hook.params.map((p) => `| \`${p.name}\` | \`${cell(p.type)}\` | ${cell(p.desc)} |`)),
      ''
    );
  }

  out.push(
    '## Outputs',
    table(['Field', 'Type', 'Description'],
      (hook.returns ?? []).map((r) => `| \`${r.name}\` | \`${cell(r.type)}\` | ${cell(r.desc)} |`)),
    ''
  );

  if (hook.actions?.length) {
    out.push(
      '## Functions',
      table(['Function', 'Inputs', 'Returns', 'Description'],
        hook.actions.map((a) => {
          const inputs = a.inputs?.length
            ? a.inputs.map((i) => `\`${i.name}: ${i.type}\` — ${i.desc}`).join(' ')
            : 'none';
          return `| \`${a.name}\` | ${cell(inputs)} | ${cell(a.output) || '`void`'} | ${cell(a.desc)} |`;
        })),
      ''
    );
  }

  if (hook.example) out.push('## Example', '```tsx', hook.example.trim(), '```', '');
  if (hook.agentNote) out.push(`:::note\n${hook.agentNote}\n:::`, '');

  return `${out.join('\n')}`;
}

/** Replaces the text between the markers, leaving the rest of the file alone. */
function replaceBlock(file, block, what) {
  const original = readFileSync(file, 'utf8');
  const from = original.indexOf(START);
  const to = original.indexOf(END);
  if (from === -1 || to === -1) {
    throw new Error(`${file}: missing ${START} / ${END} markers, so ${what} cannot be regenerated.`);
  }
  const next = `${original.slice(0, from + START.length)}\n${block}\n${original.slice(to)}`;
  if (next !== original) {
    writeFileSync(file, next, 'utf8');
    return true;
  }
  return false;
}

const hooks = readdirSync(HOOKS_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(path.join(HOOKS_DIR, f), 'utf8')))
  .sort((a, b) => a.name.localeCompare(b.name));

const written = [];
const bySection = new Map(Object.keys(SECTION_LABEL).map((s) => [s, []]));

for (const hook of hooks) {
  const section = SECTION_OF[hook.category];
  if (!section) throw new Error(`${hook.name}: category "${hook.category}" maps to no section.`);
  const slug = hook.name.toLowerCase();
  bySection.get(section).push(hook);

  const file = path.join(API_DIR, section, `${slug}.md`);
  if (existsSync(file)) continue;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, renderPage(hook), 'utf8');
  written.push(`docs/api/${section}/${slug}.md`);
}

let indexes = 0;
for (const [section, list] of bySection) {
  const file = path.join(API_DIR, section, 'README.md');
  if (!existsSync(file)) continue;
  const rows = list.map((h) => `| [\`${h.name}\`](./${h.name.toLowerCase()}.md) | ${cell(h.summary)} |`);
  if (replaceBlock(file, table(['Hook', 'What it reads'], rows), `the ${section} index`)) indexes += 1;
}

const hubBlock = Object.entries(SECTION_LABEL)
  .map(([slug, label]) => {
    const rows = bySection.get(slug)
      .map((h) => `| [\`${h.name}\`](./${slug}/${h.name.toLowerCase()}.md) | ${cell(h.summary)} |`);
    return [`### [${label}](./${slug}/)`, '', table(['Hook', 'What it reads'], rows), ''].join('\n');
  })
  .join('\n');
if (replaceBlock(path.join(API_DIR, 'README.md'), hubBlock, 'the API index')) indexes += 1;

console.log(
  `build-api-pages: ${hooks.length} hook(s); ` +
    `${written.length} page(s) written, ${hooks.length - written.length} left as authored; ` +
    `${indexes} index block(s) updated`
);
for (const f of written) console.log(`  + ${f}`);
