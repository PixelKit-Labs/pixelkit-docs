# useADPF

**Source:** [packages/sdk/src/hardware/useADPF.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useADPF.ts)

* `PowerManager.getThermalHeadroom(0)`: 0.0 cool → 1.0 severe throttling, polled every **10 s** (Google's minimum; faster polling returns NaN), plus `getThermalHeadroomThresholds()` on Android 15+.
* `PowerManager` thermal status via a live `OnThermalStatusChangedListener` (`nominal | light | moderate | severe | critical`).
* Android 16+ `SystemHealthManager.getCpuHeadroom / getGpuHeadroom` (reflection, `null` when the device does not report them).
* `targetFps` from the display mode, `currentFps` from Choreographer.

Verified on Pixel 11 Pro: headroom 0.55 at status NONE; thresholds `{1: 0.8, 2: 0.933, 3: 1.0, 4: 1.05, 5: 1.233, 6: 1.667}`. Thermal readings poll every 10,000 ms; status changes and frame stats arrive as native events.

## Signature
```typescript
function useADPF(): {
 thermalHeadroom: number | null;
 thermalThresholds: Record<string, number> | null;
 thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical';
 thermalStatusCode: number;
 cpuHeadroom: number | null;
 gpuHeadroom: number | null;
 targetFps: number | null;
 currentFps: number | null;
 reportWorkDuration: (actualWorkDurationMs: number, targetDurationMs?: number) => 'WITHIN_BUDGET' | 'BOOST_REQUESTED';
 source: TelemetrySource;
};
```

## What "thermal headroom" actually means

`PowerManager.getThermalHeadroom(forecastSeconds)` answers one question: **how close is this phone to the point where Android starts slowing the chip down to cool it?**

It is a ratio, not a temperature:

* `0.0` — cold, nothing is being held back.
* `0.5` — about halfway to the throttling point. Verified on this Pixel 11 Pro at idle: **0.55**.
* `1.0` — at the threshold; severe throttling begins here.
* `> 1.0` — already throttling. Clocks are being cut, and a heavy workload will get slower, not faster.

You never see the underlying temperature: Android deliberately does not expose one, because the threshold differs per device and per skin temperature sensor. The ratio is the portable form of "how much heat budget is left".

`thermalThresholds` is the same scale seen from the other side: the headroom value at which each `thermalStatus` begins on **this** device, e.g. `{1: 0.8, 2: 0.933, 3: 1.0, …}` — light throttling starts at 0.8, moderate at 0.933.

Practical use: read it before starting something expensive, not during. Above roughly 0.8, shed work — drop the frame rate target, stop a benchmark loop, defer a model download — because the alternative is the system doing it for you, less gracefully. Google's minimum polling interval is 10 seconds; asking faster returns `NaN`, which is why this hook polls at exactly that rate.

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `thermalHeadroom` | `number \| null` | `PowerManager.getThermalHeadroom(0)`: 0.0 cool, 1.0 at severe throttling, above 1.0 when already throttling. `null` when the device does not answer. |
| `thermalThresholds` | `Record<string, number> \| null` | Device-specific headroom value at which each thermal status begins, keyed by status code. `null` below Android 15. |
| `thermalStatus` | `'nominal' \| 'light' \| 'moderate' \| 'severe' \| 'critical'` | Live thermal state from the status listener. `'critical'` covers `CRITICAL`, `EMERGENCY` and `SHUTDOWN`. |
| `thermalStatusCode` | `number` | The raw `PowerManager.THERMAL_STATUS_*` integer, 0–6, for when the label is too coarse. |
| `cpuHeadroom` | `number \| null` | Android 16+ `SystemHealthManager.getCpuHeadroom`: remaining CPU capacity, 0–1. `null` when unsupported. |
| `gpuHeadroom` | `number \| null` | The same for the GPU. `null` when unsupported. |
| `targetFps` | `number \| null` | Refresh rate of the active display mode, in Hz. `null` until read. |
| `currentFps` | `number \| null` | Choreographer-measured frames presented per second. `null` until the first 1 s window. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `reportWorkDuration(actualWorkDurationMs, targetDurationMs?)` | `actualWorkDurationMs: number` — how long the work you just did actually took, in ms. `targetDurationMs?: number` — budget to judge it against; defaults to `1000 / targetFps`, or 8.33 ms before the refresh rate is known. | `'WITHIN_BUDGET'` when the ratio is ≤ 1, `'BOOST_REQUESTED'` when the work overran | Pure helper that classifies a measured work duration against the frame budget. It produces a verdict for your own scheduling; it does not call `PerformanceHintManager`. |
