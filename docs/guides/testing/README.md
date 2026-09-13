# Testing

> **The three layers that decide whether PixelKit is working: unit tests, contract checks, and verification on a real Pixel.**

Each layer answers a different question, and none of them can stand in for another. A unit test
proves the logic is right. A contract check proves the code, the documentation and the template
still agree. Only a real device proves a hook reads `hardware`.

| Layer | Answers | Run with | Needs a device | Where it runs |
| :--- | :--- | :--- | :--- | :--- |
| [Unit tests](./unit-tests.md) | Is the logic inside a hook right? | `npm test` | No | SDK CI, every push |
| [Contract checks](./contract-checks.md) | Do the code, the docs and the template still agree? | `npm run verify` (SDK), `npm run build` (docs), `npm run verify` (template) | No | CI in all three repositories, every push |
| [Hardware verification](./artemis.md) | Does each hook read real silicon on a real Pixel? | `npm run test:e2e` | Yes | On demand, against a connected phone |

The first two gate every commit. The third cannot run in CI, because there is no Pixel 11 Pro in a
CI runner — which is why it exists as a separate layer rather than being skipped.

## What a green build does and does not mean

A green build means the logic is tested, every exported hook is documented with fields that exist
on its type, the documentation builds with no dead links, and the template can import and exercise
the SDK. It does not mean a single reading came off real hardware. That claim is only ever made by
hardware verification, and only for the recipes that were run.
