# Metrics

> **The latest value of every reading a hook takes, with where that value came from.**

## Recording

```ts
recordMetric(module, metric, value, source);
```

Each call stores a `MetricRecord` — `module`, `metric`, `value`, `source` and a timestamp — under the
key `module.metric`, replacing whatever was there. 37 of the SDK's source files record metrics
directly.

Every `traced` call also records its own duration as `<op>Ms`, so how long `useCPU.benchmarkCPU`
took is a metric without anyone writing that line.

Metrics are deliberately not logged per sample. A sensor at 10 Hz would otherwise put ten lines a
second into the device log.

## Reading

- `getMetrics()` — every current metric.
- `metrics` from `useObservability()` — the same, re-rendering as they change.
- `getSourceSummary()` — which provenance each module is currently reporting, built from the
  metrics. See [Telemetry](./telemetry.md).

## Limits

- **Last value only.** A new reading replaces the old one, so there is no history, no rate, no
  histogram and no percentile. A trend cannot be charted from the SDK.
- **Untyped.** `value` is `unknown`: a metric can hold a number, a string or an object, and nothing
  distinguishes a counter from a gauge.
- **Memory only**, like the rest of the layer.

These are listed with what closing them takes on the [Observability overview](./README.md#where-the-stack-stops).
