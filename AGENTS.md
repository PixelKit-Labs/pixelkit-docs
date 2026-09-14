# pixelkit-docs: Agent Guide

This file is the single source of truth for any coding agent (Claude, Gemini, Antigravity, Codex, Delta) working in this repository. `CLAUDE.md`, `AGENTS.md` and `GEMINI.md` are identical copies; keep all three in sync — `sha256sum AGENTS.md CLAUDE.md GEMINI.md` must print one hash.

## Project

The PixelKit documentation site, built with Astro and Starlight and published to https://pixelkit-labs.github.io/pixelkit-docs/ on every push to `main`.

- `docs/` is the authored source. `npm run sync` copies it into `src/content/docs/`, which is generated and gitignored: never edit anything there.
- `data/hooks/*.json` is the machine-readable contract for every hook. pixelkit-sdk's CI (`check-docs`) fails when it disagrees with the code, and pixelkit-template generates its in-app Docs tab from it, so a wrong field here is wrong in three places.

The SDK is at https://github.com/PixelKit-Labs/pixelkit-sdk, the demo app at https://github.com/PixelKit-Labs/pixelkit-template, and the CLI at https://github.com/PixelKit-Labs/pixelkit-cli.

## Rules

1. **Nothing is simulated.** The documentation never describes a reading the code cannot take. A value that cannot be read is `null`, renders as "—", and reports `unavailable`; say so rather than implying a number.
2. **One page per hook.** A new hook is a `data/hooks/<hook>.json` — `name`, `category`, `summary`, `signature`, `params`, `returns`, `actions`, `example`, `agentNote` — followed by `npm run build:api-pages`, which writes its page under `docs/api/<section>/` and regenerates the indexes. It never overwrites a page that exists: the existing pages carry hand-written prose richer than the JSON, and are edited by hand. Add the hook's row to the mapping table in `docs/AI_PRIMER.md` too.
3. **A new category needs a section.** `category` maps to a section directory in `SECTION_OF`, which appears in `scripts/build-api-pages.mjs`, `scripts/check-api-reference.mjs` and `src/pages/index.astro`. Add a new category to all three.
4. **Generated text is not edited by hand.** Text between `<!-- hooks:start -->` and `<!-- hooks:end -->` is rewritten by `build:api-pages`. Diagrams are `docs/diagrams/<name>.json` specs rendered by `npm run build:diagrams` (Archify): edit the spec, never the SVG or `src/styles/archify.css`.
5. **Every page opens with a tagline.** The first line under the title is a `> **…**` blockquote. It becomes the tooltip on every link to that page, so it has to stand on its own. `check:api` fails a page that opens with a code block, a table or raw HTML.
6. **Links are relative `.md` paths.** `npm run sync` rewrites them to the served URLs and fails the build on one that points at nothing. A published page that moves or goes away gets an entry in `RETIRED_ROUTES` in `astro.config.mjs`, so its URL redirects instead of 404ing.
7. **Keep every surface current.** When pixelkit-sdk adds, removes or renames a hook, changes what one returns, or changes an import path, this repository changes with it: the `data/hooks` entry, the page, the primer row, and any example that uses the name. Hook counts stated in prose, such as `docs/getting-started/README.md`, are checked by nothing; prefer describing over counting. pixelkit-sdk's own guide (rule 7) has the full cross-repository table.
8. **No changelog here.** This repository has no version line, so the commit message is the record: write it to say why the change was made, not only what changed.
9. **Coordinate with other agents.** Run `git status` and `git log --oneline -5` before editing and `git pull --rebase` before pushing; another agent may have committed. Prefer targeted edits over whole-file rewrites on files touched recently by others.

## Validation

`npm run build` must pass. It runs, in order:

- `check:diagrams` — every spec in `docs/diagrams/` is rendered, current, and shown on a page.
- `check:api` — every hook in `data/hooks` has exactly one page, in the section its category names; each page's Outputs and Functions tables list the same fields as its JSON; no page documents a hook that no longer exists; the primer's mapping table names every hook; every page opens with a line of prose.
- `sync` — no link between pages points at a missing file.
- `astro build`.

CI runs the same build on every push (`build.yml`); `deploy.yml` publishes `main` to GitHub Pages.

## Map

```
docs/                        authored pages; one directory per sidebar section
docs/api/<section>/          one page per hook, plus a hub README per section
docs/diagrams/               Archify specs and their rendered SVGs
data/hooks/                  the hook contract, one JSON file per hook
scripts/sync-docs.mjs        docs/ -> src/content/docs, titles, diagrams, link rewriting
scripts/build-api-pages.mjs  pages for hooks that have none, and the index blocks
scripts/check-api-reference.mjs  the check:api guard
scripts/build-diagrams.mjs   renders diagram specs; check-diagrams.mjs guards them
src/pages/index.astro        the landing page; its hook table is read from data/hooks
link-descriptions.mjs        the tooltip text for every internal link
astro.config.mjs             sidebar, redirects, Markdown plugins
```
