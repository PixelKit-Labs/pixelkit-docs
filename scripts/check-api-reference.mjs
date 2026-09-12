/**
 * @file check-api-reference.mjs
 * @description Proves the rendered API reference and `data/hooks` describe the same hooks.
 *
 * `data/hooks/*.json` is the copy the SDK's own CI checks: it fails if a hook is exported with no
 * entry, or if an entry names a returned field that is not on the hook's declared type. That
 * guarantee stopped at the JSON. The pages a reader actually lands on are hand-written prose, and
 * their prose is deliberately richer than the JSON ("Not scheduler load", `"unknown"` before the
 * first read), so they are not generated from it and cannot simply be diffed against it.
 *
 * What can be checked is the structure: every hook has exactly one page, in the section its
 * category says it belongs to, and that page's Outputs table lists exactly the fields the verified
 * JSON lists. A field added to a hook and documented on its page but never added to the JSON now
 * fails here; previously it passed everywhere, because nothing compared the two.
 *
 * Run by `npm run build`. Field *wording* is intentionally not compared — only the set of fields.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'docs', 'api');
const HOOKS_DIR = path.join(ROOT, 'data', 'hooks');

/** `data/hooks` category -> the section directory that documents it. */
const SECTION_OF = {
  silicon: 'silicon-compute',
  compute: 'silicon-compute',
  ai: 'neural-ai',
  sensors: 'sensors-actuators',
  radios: 'radios-security',
  system: 'system-media',
  pro: 'pro-exclusives',
};

/**
 * Optional list of field differences to tolerate, for recording a gap that cannot be closed in the
 * same change that introduces it.
 *
 * It is currently absent, because there are none: the 81 differences this check found when it was
 * written have all been closed. 51 were fields that existed on the type and were documented on the
 * page but had never reached `data/hooks`, so the SDK's own check-docs — which proves every field
 * in the JSON is on the type, but never the reverse — could not see them; they were added, with the
 * page's wording, which is the better of the two. 8 were callables declared in the JSON that no
 * table on the page listed, so the rows were added. The remaining 22 were this script's own fault:
 * its parser only accepted a cell holding exactly one backticked name, so rows naming several at
 * once were skipped entirely.
 *
 * If an entry is ever added here it is debt, not an exemption: an entry that stops describing a
 * real difference fails the check too, so the file can only shrink.
 */
const BASELINE_PATH = path.join(__dirname, 'api-reference-gaps.json');
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {};

const failures = [];
const staleBaseline = [];

const hooks = readdirSync(HOOKS_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(path.join(HOOKS_DIR, f), 'utf8')));

/**
 * Collects the first-column identifiers of the table under a given `## Heading`.
 *
 * One row often names several fields, and does it two different ways: `` `isMuted` / `isLooping` ``
 * and `` `selection()` `light()` `medium()` ``. Every backticked token in the cell is taken, rather
 * than requiring the cell to hold exactly one — which skipped those rows entirely and reported all
 * of their fields as undocumented.
 */
function tableFieldsUnder(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${heading}\\s*$`).test(l));
  if (start === -1) return null;

  const fields = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    if (!/^\|/.test(line)) continue;
    if (/^\|\s*:?-+/.test(line)) continue;
    const firstCell = line.split(/(?<!\\)\|/)[1];
    if (!firstCell) continue;
    for (const token of firstCell.matchAll(/`([^`]+)`/g)) fields.push(token[1].trim());
  }
  return fields;
}

/**
 * The page and the JSON describe the same surface in two shapes, so both sides are reduced to a set
 * of top-level field names before comparison:
 *
 *   - A callable is a returned field, but the pages give it its own `## Functions` table while the
 *     JSON keeps it in `returns`. Both tables count.
 *   - `useRadios` documents `nfc.antennaState`; the JSON declares `nfc`. Only the root is compared,
 *     because the JSON deliberately stops at the object.
 *   - Some JSON entries cover several fields in one row, as `isPixel / isProModel / isFoldable`.
 *   - A callable is written with its parameter list, and the two sources name parameters
 *     differently: `reportWorkDuration(actualMs, targetMs?)` against
 *     `reportWorkDuration(actualWorkDurationMs, targetDurationMs?)`. Only the name is compared;
 *     parameter names are the Inputs table's business.
 *
 * Wording is never compared. The page prose is richer on purpose and should stay that way.
 */
function normaliseFields(names) {
  const out = new Set();
  for (const raw of names) {
    // Grouped rows are split first. Stripping arguments first would only reach the last entry,
    // because the pattern is anchored, leaving `selection() / light()` as `selection()`.
    for (const part of raw.split('/')) {
      const root = part.trim().replace(/\([^)]*\)$/, '').split('.')[0].trim();
      if (root) out.add(root);
    }
  }
  return out;
}

const seen = new Map();

for (const hook of hooks) {
  const section = SECTION_OF[hook.category];
  if (!section) {
    failures.push(`${hook.name}: category "${hook.category}" maps to no section directory.`);
    continue;
  }

  const relative = `docs/api/${section}/${hook.name.toLowerCase()}.md`;
  const file = path.join(ROOT, relative);
  if (!existsSync(file)) {
    failures.push(
      `${hook.name}: no page at ${relative}. Its category is "${hook.category}", so its page belongs in that section.`
    );
    continue;
  }
  seen.set(path.resolve(file), hook.name);

  const markdown = readFileSync(file, 'utf8');
  const outputs = tableFieldsUnder(markdown, 'Outputs');
  if (outputs === null) {
    failures.push(`${hook.name}: ${relative} has no "## Outputs" section.`);
    continue;
  }

  const onPage = normaliseFields([...outputs, ...(tableFieldsUnder(markdown, 'Functions') ?? [])]);
  const declared = normaliseFields([
    ...(hook.returns ?? []).map((r) => r.name),
    ...(hook.actions ?? []).map((a) => a.name),
  ]);

  const allowed = baseline[hook.name] ?? {};
  const allowedMissing = new Set(allowed.absentFromPage ?? []);
  const allowedExtra = new Set(allowed.absentFromData ?? []);

  const missing = [...declared].filter((f) => !onPage.has(f) && !allowedMissing.has(f));
  const extra = [...onPage].filter((f) => !declared.has(f) && !allowedExtra.has(f));

  if (missing.length) {
    failures.push(
      `${hook.name}: declared in data/hooks but documented on no table of ${relative}: ${missing.join(', ')}.`
    );
  }
  if (extra.length) {
    failures.push(
      `${hook.name}: documented on ${relative} but absent from data/hooks, so the SDK never checks it against the type: ${extra.join(', ')}.`
    );
  }

  // A baseline entry that no longer describes a real difference has been fixed; requiring its
  // removal is what stops the file outliving the debt it records.
  for (const f of allowedMissing) {
    if (onPage.has(f)) staleBaseline.push(`${hook.name}.absentFromPage: ${f} is now documented.`);
  }
  for (const f of allowedExtra) {
    if (declared.has(f)) staleBaseline.push(`${hook.name}.absentFromData: ${f} is now in data/hooks.`);
  }
}

// A leaf with no hook behind it is either a renamed hook or a page for something that no longer
// exists. The three known non-hook pages are listed so they do not read as orphans.
const NON_HOOK_PAGES = new Set(['geminiclient.md', 'observability-provenance.md', 'pixelnative-module.md']);
for (const entry of readdirSync(API_DIR, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const dir = path.join(API_DIR, entry.name);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')) {
    if (NON_HOOK_PAGES.has(file)) continue;
    if (!seen.has(path.resolve(path.join(dir, file)))) {
      failures.push(
        `docs/api/${entry.name}/${file} documents no hook in data/hooks. Remove it, or add the hook's definition.`
      );
    }
  }
}

if (failures.length || staleBaseline.length) {
  if (failures.length) {
    console.error(`check-api-reference: ${failures.length} problem(s)\n`);
    for (const f of failures) console.error(`  - ${f}`);
  }
  if (staleBaseline.length) {
    console.error(
      `\ncheck-api-reference: ${staleBaseline.length} baseline entr(ies) in scripts/api-reference-gaps.json ` +
        'no longer describe a real difference. Delete them:\n'
    );
    for (const f of staleBaseline) console.error(`  - ${f}`);
  }
  process.exit(1);
}

const debt = Object.values(baseline).reduce(
  (n, e) => n + (e.absentFromPage?.length ?? 0) + (e.absentFromData?.length ?? 0),
  0
);
console.log(
  `API reference consistent: ${hooks.length} hooks, each with one page in its own section, ` +
    `every page has an Outputs table, and no page documents a hook that no longer exists.` +
    (debt ? `\n  ${debt} known field gap(s) held in scripts/api-reference-gaps.json; new ones fail this check.` : '')
);
