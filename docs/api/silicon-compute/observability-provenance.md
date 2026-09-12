# Observability & provenance

`packages/sdk/src/core/observability.ts` gives every reading a **source**:

| `TelemetrySource` | Meaning |
| :--- | :--- |
| `hardware` | Read from an Android API or sensor |
| `derived` | Computed from hardware readings (e.g. app CPU share) |
| `unavailable` | The API/hardware is absent; the value is `null` |

There is deliberately no `simulated` member: the type makes a fabricated reading unrepresentable.

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `logEvent(module, event, data?, level?)` | `module: string` — hook the event belongs to. `event: string` — short description. `data?: Record<string, unknown>` — structured detail. `level?: 'info' \| 'warn' \| 'error'` — severity, default `'info'`. | `void` | Appends to the in-memory event ring and echoes to the console with the `[PixelKit]` prefix, so `adb logcat -s ReactNativeJS \| grep PixelKit` shows it. Carries the active trace id when inside a `traced` call. |
| `recordMetric(module, metric, value, source)` | `module: string`. `metric: string` — metric name. `value: unknown` — the reading. `source: TelemetrySource` — where it came from. | `void` | Stores the latest value per `module.metric` with its provenance. Not logged per sample; it feeds the debug panel and `getSourceSummary()`. |
| `normalizeError(e)` | `e: unknown` — anything thrown | `NormalizedError` — `{ message: string; code?: string; name?: string }` | Reduces native `CodedException`s, `Error`s, string rejections and plain objects to one shape. |
| `logError(module, event, e, data?)` | `module: string`. `event: string`. `e: unknown` — the thrown value. `data?: Record<string, unknown>`. | `NormalizedError` — ready to put straight into an `error` state field | Logs at error level and increments the module's error counter. A caught error is never discarded silently. |
| `traced(module, op, fn, data?, source?)` | `module: string`. `op: string` — operation name. `fn: () => Promise<T> \| T` — the work. `data?: Record<string, unknown>` — context to attach. `source?: TelemetrySource` — provenance for the duration metric, default `'hardware'`. | `Promise<T>` — whatever `fn` resolves to; rethrows on failure | Times the operation, gives it a correlation id (nested calls inherit the parent's), records `<op>Ms` as a metric and logs the outcome. Logs at warn when it runs longer than the slow-operation threshold. |
| `tracedSafe(module, op, fn, fallback, data?)` | Same as `traced`, plus `fallback: T` — the value to return if `fn` throws. | `Promise<T>` — the result, or `fallback` | For survivable failures: the error is still logged and counted, but control flow continues. |
| `useObservability()` | none | `{ events, metrics, traces, sources, errorCounts, health, slowest }` | React hook giving a live view for a diagnostics panel, throttled to ≤4 Hz. |
| `getRecentEvents()` / `getMetrics()` / `getTraces()` | none | `TelemetryEvent[]` / `MetricRecord[]` / `TraceRecord[]` | Non-React snapshots for tests and agents. |
| `getSourceSummary()` | none | `Record<string, TelemetrySource[]>` — the provenance values each module currently reports | Answers "is this module reading real hardware right now?". |
| `getSlowestTraces(limit?)` | `limit?: number` — how many to return, default 10 | `TraceRecord[]` sorted slowest first | Finds what is making the app feel heavy. |
| `getTrace(id)` | `id: string` — a correlation id | `{ trace?: TraceRecord; events: TelemetryEvent[] }` | Every event and the trace sharing one id, in order. |
| `getErrorCounts()` | none | `Record<string, number>` — failures per module | Cumulative since launch or the last reset. |
| `getHealthSummary()` | none | `{ module, errors, traces, slowestMs }[]`, worst first | One line per module for a health strip. |
| `resetObservability()` | none | `void` | Clears events, traces, metrics and error counts. For tests and a "reset diagnostics" control. |

`MetricCard` renders the `source` prop as a footer tag, which is how provenance reaches the user.
