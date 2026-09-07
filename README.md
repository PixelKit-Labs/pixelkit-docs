# pixelkit-docs

The documentation site for [PixelKit](https://github.com/PixelKit-Labs/pixelkit-sdk), built with
[Astro Starlight](https://starlight.astro.build/).

## The markdown does not live here

It lives in `docs/` in the SDK repository, and that is deliberate. PixelKit's rule 2 requires a hook
change and its documentation to land in the same commit; if the prose lived in this repo that would
be impossible, and the docs would drift from the code within a week.

This repo renders. `scripts/sync-docs.mjs` shallow-clones the SDK repo before every build and copies
its `docs/` into a gitignored directory that Starlight reads. The only thing it changes is adding a
`title` to each page's frontmatter, taken from the file's own first heading.

## Running it

```bash
npm install
npm run dev        # clones the SDK repo for its docs, then serves
```

Working on documentation at the same time? Point it at your local checkout instead, and it will
pick up uncommitted changes:

```bash
PIXELKIT_DOCS=../pixelkit-sdk/docs npm run dev
```

| Variable | Effect |
| :--- | :--- |
| `PIXELKIT_DOCS` | Path to a local `docs/` directory. Skips cloning entirely. |
| `PIXELKIT_SDK_REPO` | Clone a different SDK repository. Defaults to `PixelKit-Labs/pixelkit-sdk`. |

## Editing the docs

Open a pull request against [PixelKit-Labs/pixelkit-sdk](https://github.com/PixelKit-Labs/pixelkit-sdk),
not this repository. Changes here only affect how pages are rendered — navigation, theme, layout.

MIT.
