# pixelkit-docs

The official documentation site and API specification for [PixelKit](https://github.com/PixelKit-Labs/pixelkit-sdk). Built with [Astro Starlight](https://starlight.astro.build/).

Visit the live site: [https://pixelkit-labs.github.io/pixelkit-docs/](https://pixelkit-labs.github.io/pixelkit-docs/)

---

## Architecture & Contract

This repository serves as the **contract and single source of truth** for the entire PixelKit ecosystem:

- **`data/hooks/*.json`**: Strict JSON schemas defining signatures, arguments, return fields, and behavioral contracts for all 53 hooks.
- **`docs/`**: Guides, tutorials, architecture overviews, troubleshooting, and agent documentation.
- **`public/openapi.yaml` & `public/openapi.json`**: Generated OpenAPI 3.1.0 specification defining all 53 hooks, actions, and telemetry endpoints.

### CI Contract Enforcement
The `pixelkit-sdk` monorepo runs `npm run check-docs` on every CI build. CI validates that:
1. Every hook exported by `@pixelkit-labs/sdk` has a matching contract definition in `data/hooks/`.
2. Every documented hook is actually exported.
3. Every field documented under `returns` strictly exists on the hook's TypeScript declaration type.
4. Agent guidance and recipes only import symbols exported by the current SDK version.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build static production site
npm run build
```

`scripts/sync-docs.mjs` transforms markdown files from `docs/` into `src/content/docs/`, generating page titles and Starlight frontmatter automatically.

---

## Contributing to Docs

- To update guide prose or tutorials, edit files under `docs/`.
- To update or add hook contracts, edit `data/hooks/<hookName>.json`.
- Run `npm run build:api-pages` and `npm run check:api` to regenerate reference pages and verify schema integrity before opening a PR.

---

## License

MIT © PixelKit Labs
