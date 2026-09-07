# pixelkit-docs

The documentation for [PixelKit](https://github.com/PixelKit-Labs/pixelkit-sdk), and the site that
renders it. Built with [Astro Starlight](https://starlight.astro.build/).

## This is the source of truth

The prose in `docs/` and the structured hook definitions in `data/hooks/` are the contract, and the
SDK is checked against them rather than the other way round. `pixelkit-sdk` runs `npm run check-docs`
in CI, which clones this repository and fails the build if:

- a hook it exports has no entry here,
- an entry describes a hook it no longer exports, or
- an entry documents a returned field that is not on the hook's declared type.

So a page going stale is not a documentation problem someone notices months later. It is a red build
on the SDK, naming the hook and the field.

`data/hooks/*.json` is one file per hook: summary, description, signature, every parameter, every
returned field with its real type, and a contract for each function it exposes — what the arguments
do, what the call resolves to, and what failure looks like.

## Running it

```bash
npm install
npm run dev
```

`scripts/sync-docs.mjs` copies `docs/` into `src/content/docs/`, which is gitignored and rebuilt
every time, injecting the `title` frontmatter Starlight needs from each file's own first heading.
Nothing else about the prose is changed.

The landing page at `src/pages/index.astro` sits outside that pipeline and is hand-written.

The sidebar is derived from the directories present under `docs/`, so a new page appears without
touching config, and a removed directory takes its section with it.

## Editing

Prose lives in `docs/`. A hook's contract lives in `data/hooks/<hookName>.json`. Change either here
and open a pull request — the SDK's next CI run will tell you if the contract no longer matches the
code.

MIT.
