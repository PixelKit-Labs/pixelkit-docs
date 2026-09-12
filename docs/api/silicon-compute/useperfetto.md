# usePerfetto

**Source:** [packages/sdk/src/hardware/usePerfetto.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/usePerfetto.ts)

System-level Linux kernel `ftrace` and Android `atrace` performance capture directly from React Native via Perfetto v54.

Backed by `android.os.Trace`, the system Perfetto binary, and Android kernel trace categories (`sched`, `freq`, `idle`, `gfx`, `view`, `am`, `wm`, `camera`, `hal`, `power`, `thermal`, `aidl`). Emits zero-overhead hardware trace markers and captures system trace buffers without requiring root privileges. Traces can be opened directly in [ui.perfetto.dev](https://ui.perfetto.dev) to inspect Tensor G6 CPU frequency switches, TPU inference dispatch events, and Choreographer frame rendering spikes.

## Signature
```typescript
function usePerfetto(): PerfettoState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether Perfetto and system tracing are available on device. |
| `isTracing` | `boolean` | Whether an active system trace session is currently recording. |
| `perfettoVersion` | `string \| null` | Perfetto daemon version (`'v54.0'` on Android 17 / Pixel 11 Pro). |
| `availableCategories` | `string[]` | Supported trace categories. |
| `activeCategories` | `string[]` | Categories currently being captured in active trace. |
| `lastTraceUri` | `string \| null` | Local file URI of the last saved `.perfetto-trace` file. |
| `traceDurationMs` | `number \| null` | Duration of the last completed trace session in milliseconds. |
| `error` | `string \| null` | Error message if tracing failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startTrace(categories?, bufferSizeKb?)` | `categories?: string[]`, `bufferSizeKb?: number` | `Promise<boolean>` | Starts a system trace session with specified categories and buffer size. |
| `stopTrace()` | none | `Promise<string \| null>` | Stops the active trace session and writes the `.perfetto-trace` file. |
| `beginSection(name)` | `name: string` | `void` | Emits an `android.os.Trace.beginSection` hardware marker. |
| `endSection()` | none | `void` | Emits an `android.os.Trace.endSection` hardware marker. |
| `setCounter(name, value)` | `name: string`, `value: number` | `void` | Emits an `android.os.Trace.setCounter` metric. |
| `refresh()` | none | `PerfettoInfo \| null` | Re-probes Perfetto daemon and tracing subsystem. |

## Example
```tsx
import { usePerfetto, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function SiliconProfiler() {
  const { isTracing, startTrace, stopTrace, lastTraceUri } = usePerfetto();

  return (
    <View>
      <Text>Perfetto Tracing: {isTracing ? "Recording..." : "Idle"}</Text>
      {lastTraceUri && <Text>Saved Trace: {lastTraceUri}</Text>}
      <HapticButton
        title={isTracing ? "Stop & Save Trace" : "Record Kernel Trace"}
        onPress={() => isTracing ? stopTrace() : startTrace(['sched', 'freq', 'gfx'])}
      />
    </View>
  );
}
```
