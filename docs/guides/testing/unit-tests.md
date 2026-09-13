# Unit tests

> **The pure logic behind the hooks, tested in Node without a device: 53 tests across six files, run on every push.**

A hook needs React and a phone, but the decisions inside it often do not. Which Pixel generation has
UWB, how barometric pressure becomes altitude, how two embeddings are compared — these are pure
functions, and they are where a wrong answer passes every static check. The type checker cannot tell
that `generation >= 12` should have been `>= 11`. A test can.

```bash
npm test          # node --test "test/**/*.test.ts"
```

Node 24 runs the TypeScript directly, so the suite adds no dependency. It runs in `npm run verify`
and in CI on every push.

## What is covered

| File | Tests | What it proves |
| :--- | ---: | :--- |
| `capabilities.test.ts` | 16 | `resolveCapabilities` gives the right hardware per Pixel generation, reports nothing on a non-Pixel rather than guessing, opens Android API gates at the right level, and says whether its answer came from the model table or the device. `verifyCapabilities` lets a real device probe override the table. |
| `observability.test.ts` | 23 | `traced` returns and records on success, rethrows and counts on failure; `tracedSafe` returns the fallback but never swallows the failure; `noteExpected` is counted and deliberately not logged; `normalizeError` turns anything thrown into a message; the diagnostics getters sort and filter correctly; `resetObservability` clears everything. |
| `altimeter.test.ts` | 5 | The barometric formula behind `useAltimeter`. |
| `embeddings.test.ts` | 4 | The cosine-similarity maths behind `useEmbeddings`. |
| `radios.test.ts` | 3 | Logic in `useWifi7MLO` and `useWifiRTT`. |
| `charging.test.ts` | 2 | Logic shared by `useChargingIntelligence` and `useADPF`. |

The capabilities suite has been mutation-checked: changing `generation >= 11` to `>= 12` in
`capabilities.ts` fails two tests, which is the evidence that it tests the table rather than merely
running it.

## What is not covered

Anything that needs a renderer or real silicon. `useObservability` is the one React-dependent export
in the observability module and is left out for that reason. Whether a hook actually reads
`hardware` on a Pixel is the job of [on-device verification with ARTEMIS](../../artemis/README.md).

One gap is worth naming because the tests look as though they cover it. The observability suite
calls `traced` sequentially, and sequential calls are correlated correctly. Overlapping calls are
not, and nothing here exercises them — see [Traces](../../observability/traces.md) for what goes
wrong and how it was measured.
