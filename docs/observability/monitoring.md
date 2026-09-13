# Monitoring

> **The per-module view: which hooks are failing, which are slow, and which are reporting real readings.**

## The summary calls

| Call | Returns |
| :--- | :--- |
| `getHealthSummary()` | One row per module — error count, trace count, slowest trace in milliseconds — with the module that has the most errors first, then the slowest. |
| `getErrorCounts()` | Errors per module. |
| `getExpectedCounts()` | Expected, harmless failures per `module:reason`, recorded by `noteExpected`. |
| `getSlowestTraces(limit)` | The slowest operations across every module. |
| `getSourceSummary()` | Which provenance each module is reporting. See [Telemetry](./telemetry.md). |
| `resetObservability()` | Clears events, traces, metrics and both counters. For tests, and for a "reset diagnostics" control. |

## The live view

```ts
const obs = useObservability();
// obs.events, obs.metrics, obs.traces, obs.sources,
// obs.errorCounts, obs.expected, obs.health, obs.slowest
```

`useObservability()` returns all of the above and re-renders as it changes, throttled to at most
four times a second, so a component bound to it cannot be driven into a render loop by a busy
sensor.

## Where it is shown

The template's Dashboard has an observability panel built from `useObservability()`:
**Provenance by module**, **Slowest operations** (the top five, coloured when past 1,500 ms or
failed), **Errors by module**, **Recent events** (the last fourteen, also in `adb logcat`) and a
**Reset diagnostics** control. It is the working example of what to build:
[`DashboardScreen.tsx`](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/src/screens/DashboardScreen.tsx).

The SDK's own UI, the [`PixelKitDevTools` HUD](../guides/devtools.md), shows frame rate, thermal
headroom, CPU and memory. It does not read the observability layer.

## Limits

- **No monitoring view in the SDK.** The panel is template code, so an app built from scratch has
  no view unless it builds one.
- **No alerting.** Nothing fires when a module's error count or slowest trace crosses a threshold.
- **On-device only.** There is no remote dashboard, because nothing leaves the device.

These are listed with what closing them takes on the [Observability overview](./README.md#where-the-stack-stops).
