# Observability

> **What PixelKit records about itself while it runs — logs, metrics, traces, health and provenance — where each one lives, and where the stack currently stops.**

Every hook routes its calls to hardware, the network, a native module or the file system through
one module, [`packages/sdk/src/core/observability.ts`](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/core/observability.ts).
That is a project rule rather than a convention: a call that touches the outside world is wrapped
in `traced`, a failure surfaces through an `error` field, and an empty `catch` is not allowed. 52 of
the SDK's source files call into it.

It is in-process. Everything below is held in memory on the device and read from inside the app or
from `adb logcat`.

| Pillar | What exists | Read it with | Page |
| :--- | :--- | :--- | :--- |
| **Logs** | `logEvent` and `logError`, a 400-event ring buffer, every event echoed to the device log | `getRecentEvents()`, `adb logcat` | [Logs](./logs.md) |
| **Metrics** | `recordMetric`, the latest value of each reading with its provenance; every traced call records its own duration | `getMetrics()` | [Metrics](./metrics.md) |
| **Traces** | `traced` and `tracedSafe`: timed, given an id, recorded as succeeded or failed; a 200-trace ring buffer | `getTraces()`, `getTrace(id)`, `getSlowestTraces()` | [Traces](./traces.md) |
| **Monitoring** | A per-module health summary — errors, trace count, slowest operation — and a live React hook over all of it | `getHealthSummary()`, `useObservability()` | [Monitoring](./monitoring.md) |
| **Telemetry** | A provenance tag on every reading, with no way to represent a made-up value | the `source` field, `getSourceSummary()` | [Telemetry](./telemetry.md) |

Below the JavaScript layer, [`usePerfetto`](../guides/perfetto-profiling.md) records kernel
scheduling, clock frequencies and app markers into a system trace. That is a separate mechanism
from `traced`, and the two are not joined.

The full function list, with inputs and outputs, is on the
[API reference page](../api/silicon-compute/observability-provenance.md).

## Where the stack stops

Measured against a complete observability stack, the layer is strongest on provenance — no other
part of the SDK makes a fabricated reading unrepresentable — and weakest on getting data off the
device. In priority order, the first being a correctness bug rather than a missing feature:

| Gap | What it means in practice | What closing it takes |
| :--- | :--- | :--- |
| **Correlation breaks when calls overlap** | An event logged after an `await` can carry another operation's trace id, or none at all. Measured with two overlapping `traced` calls, not inferred — see [Traces](./traces.md#correlation-when-calls-overlap). | Pass the trace context into the traced function explicitly — `traced(module, op, (ctx) => …)`, with `ctx.log` — because Hermes has no `AsyncLocalStorage` to propagate it implicitly. |
| **Nesting is recorded flat** | An operation inside another is stored as an unrelated trace, so a user action cannot be viewed as a tree. | Store the parent id on `TraceRecord`. `traced` already computes it and throws it away. |
| **Nothing leaves the device** | All five pillars live in memory and are gone on restart; there is no path to a backend. | A public subscription and an exporter interface, with OTLP over HTTP as an opt-in package so the SDK itself stays dependency-free. |
| **Only React can observe changes** | The listener set exists, but the only way to join it is `useObservability`. A non-React consumer, or an exporter, has to poll. | Export `subscribe(listener)`. |
| **Metrics are the last value only** | No history, no rates, no histograms, no percentiles, so a trend cannot be charted from the SDK. | A bounded sample window or a histogram per metric. |
| **The limits are constants** | 400 events, 200 traces and a 1,500 ms slow threshold are fixed at build time. | `configureObservability({ maxEvents, maxTraces, slowOpMs, consoleLevel })`. |
| **Every event reaches the console** | There is no level threshold, which is right in development and noisy in production. | A console level setting, part of the same configuration call. |
| **The native modules are silent** | Time spent and failures inside the Kotlin modules are visible only through the JavaScript call that wraps them. | A native event channel that feeds `logEvent`. |
| **No monitoring view in the SDK** | The health panel lives in the template. An app built without it has no view unless it builds one. | An Observability view in `PixelKitDevTools`, which is the SDK's one UI component. |
| **No alerting** | Nothing flags a module whose error count or slowest trace crosses a line. | Threshold callbacks on the health summary. |

None of this is simulated to look finished. Every gap above is a statement about the current code,
and the first one was confirmed by running it.
