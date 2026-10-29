# usePerfetto

**Source:** [packages/sdk/src/hardware/usePerfetto.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/usePerfetto.ts)

Real Android system traces (Perfetto format) of this app, plus `android.os.Trace` markers.

`startTrace` asks the platform for a Perfetto system trace. On Android 15+ it uses `android.os.ProfilingManager`: the platform records a trace of this app and delivers the file. The platform chooses the data sources, so the categories passed to `startTrace` are not applied there (`activeCategories` and `availableCategories` stay empty). Where `ProfilingManager` is absent the hook runs `/system/bin/perfetto` with the requested atrace categories, which many devices do not let an app execute. When no backend can start, `startTrace` resolves `false` and `error` states the reason. `stopTrace` returns the file path only after checking that the file exists with a non-zero size. Traces can be opened in [ui.perfetto.dev](https://ui.perfetto.dev).

`perfettoVersion` is parsed from `perfetto --version` when the app can execute the binary; otherwise it is `null` and `perfettoVersionReason` says why.

## Signature
```typescript
function usePerfetto(): PerfettoState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether a trace backend can be started: `ProfilingManager` (Android 15+) or an executable perfetto binary. |
| `isTracing` | `boolean` | Whether a trace session is currently recording. |
| `perfettoVersion` | `string \| null` | Version parsed from `perfetto --version`. `null` when the app cannot execute the binary. |
| `perfettoVersionReason` | `string \| null` | Why `perfettoVersion` is `null`; `null` when the version was read. |
| `backend` | `'profiling_manager' \| 'perfetto_binary' \| null` | Which backend records traces on this device; `null` when none is available. |
| `availableCategories` | `string[]` | atrace categories the perfetto binary accepts. Empty with the `ProfilingManager` backend. |
| `activeCategories` | `string[]` | Categories the running trace was configured with. Empty when the backend ignores the request. |
| `lastTraceUri` | `string \| null` | Absolute path of the last saved `.perfetto-trace` file. Set only when the file exists and is not empty. |
| `lastTraceSizeBytes` | `number \| null` | Size in bytes of the last saved trace file. |
| `traceDurationMs` | `number \| null` | Time between `startTrace` and `stopTrace` for the last saved trace, in milliseconds. |
| `error` | `string \| null` | Why the last start or stop produced no trace, or why no backend is available. |
| `source` | `TelemetrySource` | `'hardware'` when a trace backend exists, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startTrace(categories?, bufferSizeKb?)` | `categories?: string[]`, `bufferSizeKb?: number` | `Promise<boolean>` | Starts a system trace. `false` with the reason in `error` when no backend could start one (including a platform rate limit or a trace already running). |
| `stopTrace()` | none | `Promise<string \| null>` | Stops the active trace and verifies the file. Resolves the path, or `null` with `error` set when no trace file exists. |
| `beginSection(name)` | `name: string` | `void` | Emits an `android.os.Trace.beginSection` marker. |
| `endSection()` | none | `void` | Emits an `android.os.Trace.endSection` marker. |
| `setCounter(name, value)` | `name: string`, `value: number` | `void` | Emits an `android.os.Trace.setCounter` metric (Android 10+). |
| `refresh()` | none | `PerfettoInfo \| null` | Re-probes the trace backends. |

## Example
```tsx
import { usePerfetto } from '@pixelkit-labs/sdk';
import { View, Text, Button } from 'react-native';

export function SiliconProfiler() {
  const { isTracing, startTrace, stopTrace, lastTraceUri, lastTraceSizeBytes, error } = usePerfetto();

  return (
    <View>
      <Text>Perfetto Tracing: {isTracing ? "Recording..." : "Idle"}</Text>
      {error && <Text>{error}</Text>}
      {lastTraceUri && <Text>Saved Trace: {lastTraceUri} ({lastTraceSizeBytes} bytes)</Text>}
      <Button
        title={isTracing ? "Stop & Save Trace" : "Record Trace"}
        onPress={() => isTracing ? stopTrace() : startTrace()}
      />
    </View>
  );
}
```
