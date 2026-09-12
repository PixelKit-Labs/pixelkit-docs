# useADPFHintSession

Interfaces directly with android.os.PerformanceHintManager (Android 12+ API 31+). Manages an active thread hint session allowing apps to report exact frame computation times in nanoseconds. This informs the kernel scheduler in real-time whether the workload is meeting its deadline (e.g. 16.67ms for 60Hz or 8.33ms for 120Hz), scaling frequencies up only when needed.

## Signature
```typescript
useADPFHintSession(initialTargetDurationMs?: number): ADPFHintSessionTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `initialTargetDurationMs` | `number` | Initial target frame duration budget in milliseconds, defaulting to 16.67ms (60 FPS). |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether ADPF PerformanceHintManager sessions are supported on this device. |
| `targetFrameDurationMs` | `number` | Current target frame render budget in milliseconds. |
| `error` | `string \| null` | Error message if hint session creation or reporting failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `reportWorkDuration` | `(actualDurationNanos: number) => boolean` | Reports actual computation duration taken by the render thread in nanoseconds. |
| `updateTargetWorkDuration` | `(targetNanos: number) => boolean` | Updates target frame deadline in nanoseconds (e.g. dynamically switching refresh rates). |
| `closeSession` | `() => boolean` | Closes the active ADPF hint session. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `reportWorkDuration(actualDurationNanos)` | none | `void` | Reports frame workload duration to the Energy-Aware Scheduler. |
| `updateTargetWorkDuration(targetNanos)` | none | `void` | Updates the target frame deadline in nanoseconds. |
| `closeSession()` | none | `void` | Terminates the active ADPF hint session. |

## Example
```tsx
import { useADPFHintSession } from '@pixelkit-labs/sdk';

function HeavyCompute() {
  const { isSupported, reportWorkDuration } = useADPFHintSession(16.67);
  const runFrame = () => {
    const t0 = performance.now();
    // ... expensive work ...
    const durationNanos = Math.round((performance.now() - t0) * 1_000_000);
    reportWorkDuration(durationNanos);
  };
  return <Button title="Execute Workload" onPress={runFrame} />;
}
```

:::note
Available on Android 12+ (API 31+). Directly drives Tensor DVFS (dynamic voltage and frequency scaling).
:::
