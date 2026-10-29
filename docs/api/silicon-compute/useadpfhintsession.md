# useADPFHintSession

Uses `android.os.PerformanceHintManager` (Android 12+, API 31+). On mount the native module closes any previous session, then calls `createHintSession` for the app's main thread (its tid equals the process id), or for the thread ids passed as `threadIds`, with the initial target duration. `isSupported` is `true` only when `createHintSession` returned a session; otherwise it is `false` and `error` says so. `reportWorkDuration` and `updateTargetWorkDuration` forward to `Session.reportActualWorkDuration` and `Session.updateTargetWorkDuration` and return `true` when the platform accepted the call. The session covers the main thread by default, so report durations of work done on that thread (or pass the tids of the threads that do the work); durations measured on the JS thread describe a thread that is not in the session. The native module keeps one session per app.

## Signature
```typescript
useADPFHintSession(initialTargetDurationMs?: number, threadIds?: number[]): ADPFHintSessionTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `initialTargetDurationMs` | `number` | Initial target work duration in milliseconds, defaulting to 16.67ms (a 60 FPS budget). |
| `threadIds` | `number[]` | Thread ids (Linux tids) the session covers. Defaults to the app's main thread. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether `createHintSession` returned a session (Android 12+). |
| `targetFrameDurationMs` | `number` | Current target work duration in milliseconds, as last set by this hook. |
| `error` | `string \| null` | Error message if hint session creation or reporting failed. |
| `source` | `TelemetrySource` | `'hardware'` when a session exists, `'unavailable'` otherwise. |
| `reportWorkDuration` | `(actualDurationNanos: number) => boolean` | Reports the time the session's threads took for one unit of work, in nanoseconds. `true` when the platform accepted the call. |
| `updateTargetWorkDuration` | `(targetNanos: number) => boolean` | Updates the target work duration in nanoseconds (for example when the refresh rate changes). `true` when the platform accepted the call. |
| `closeSession` | `() => boolean` | Closes the active ADPF hint session. `true` when the platform closed it; `isSupported` is unchanged. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `reportWorkDuration(actualDurationNanos)` | `actualDurationNanos: number` | `boolean` | Reports one unit of work duration for the session's threads. `false` when there is no session or the platform rejected the call. |
| `updateTargetWorkDuration(targetNanos)` | `targetNanos: number` | `boolean` | Updates the target work duration in nanoseconds. `false` when there is no session or the platform rejected the call. |
| `closeSession()` | none | `boolean` | Closes the active ADPF hint session. `false` when there is none. |

## Example
```tsx
import { useADPFHintSession } from '@pixelkit-labs/sdk';

function HeavyCompute() {
  const { isSupported, reportWorkDuration } = useADPFHintSession(16.67);
  const onFrameDone = (durationMs: number) => {
    // durationMs: time the session's thread (the main thread by default) spent on the frame
    reportWorkDuration(Math.round(durationMs * 1_000_000));
  };
  return <Text>ADPF session: {isSupported ? 'active' : 'none'}</Text>;
}
```

:::note
Available on Android 12+ (API 31+). The hook reports durations to the platform; it does not observe or guarantee any change in CPU frequency.
:::
