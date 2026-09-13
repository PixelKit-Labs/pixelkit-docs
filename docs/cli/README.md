# CLI

> **`@pixelkit-labs/cli` diagnoses why every hook is showing "—", by running the checks a maintainer would run by hand.**

A PixelKit hook that cannot read real hardware reports `source: 'unavailable'` and renders an em
dash. That is correct, and it is also what every hook does at once on the wrong device, without a
development build, or with the native packages missing. From inside the app those look identical.
`pixelkit doctor` tells them apart.

```bash
npx @pixelkit-labs/cli doctor
```

Or as a dev dependency:

```bash
npm install --save-dev @pixelkit-labs/cli
npx pixelkit doctor
```

Run it from your app's root: one of its checks resolves the PixelKit packages from the working
directory, the way your app would.

It needs Node 18 or later and nothing else — no third-party dependencies, only Node's own
`child_process` and `util`. It is published separately from the SDK and versions on its own.

## In this section

| Page | What it covers |
| :--- | :--- |
| [pixelkit doctor](./doctor.md) | Usage, options, what the output means, exit codes, and using it in a script. |
| [What doctor checks](./checks.md) | The six checks, the command behind each, and what to do when one fails. |

Source: [`PixelKit-Labs/pixelkit-cli`](https://github.com/PixelKit-Labs/pixelkit-cli).
