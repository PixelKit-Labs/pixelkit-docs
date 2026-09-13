# Telemetry and provenance

> **Every reading says where it came from, and there is no way to say "made up".**

## The three sources

```ts
type TelemetrySource = 'hardware' | 'derived' | 'unavailable';
```

| Source | Means |
| :--- | :--- |
| `'hardware'` | Read from a device API during this run. |
| `'derived'` | Computed from hardware readings, and labelled as computed — `useAltimeter`'s altitude, worked out from barometric pressure, is `derived`. |
| `'unavailable'` | Could not be read. The value is `null`, and renders as an em dash. |

There is deliberately no `'simulated'`. Nothing in the SDK fabricates a reading, and the type makes
that unrepresentable rather than leaving it to a reviewer to catch.

## Where it appears

- **On every hook.** Each hook returns `source`, so a component can always answer "is this number
  real?" before it shows it.
- **On every metric.** `recordMetric` takes a source, and `traced` tags the duration it records
  with one — `'hardware'` unless the call passes `'derived'`.
- **Per module.** `getSourceSummary()` reports which sources each module is currently producing,
  which is how the template's Dashboard shows provenance module by module.

## The rendering rule

A value that could not be read is shown as "—", never as a plausible number. A blank is honest; a
substitute is not, and it is worse than nothing because it looks like a reading.

## System telemetry

Kernel scheduling, CPU and GPU clock changes and app markers come from
[`usePerfetto`](../guides/perfetto-profiling.md), written to a system trace file by the Android
tracing service. That runs below this layer and is not tagged with a `TelemetrySource`.

## Limits

Telemetry never leaves the device: there is no exporter to a backend. That, and what it would take,
is on the [Observability overview](./README.md#where-the-stack-stops).
