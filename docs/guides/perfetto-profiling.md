# System Profiling with Perfetto & Kernel Ftrace

> **Zero-overhead kernel tracing, DVFS cluster frequencies, and custom app markers on Tensor G6 with `usePerfetto`.**

---

## Overview

Diagnosing performance bottlenecks, stutter, or frame drops in production React Native applications often requires deep visibility into kernel scheduling, thread states, and hardware DVFS (Dynamic Voltage and Frequency Scaling).

The [`usePerfetto`](/api/silicon-compute/#useperfetto) hook connects directly to the Android 17 Perfetto tracing service (`traced`, v54.0+) and the low-overhead `android.os.Trace` kernel ftrace ring buffer.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePerfetto } from '@pixelkit-labs/sdk';

export function TraceRecorder() {
  const {
    isSupported,
    isTracing,
    perfettoVersion,
    availableCategories,
    activeCategories,
    lastTraceUri,
    startTrace,
    stopTrace,
    addTraceMarker,
  } = usePerfetto();

  const handleBenchmark = async () => {
    await startTrace(['sched', 'freq', 'am'], 16384);
    addTraceMarker('BenchmarkStart');

    // Run heavy compute or UI animation
    for (let i = 0; i < 10000; i++) {
      Math.sqrt(i);
    }

    addTraceMarker('BenchmarkEnd');
    const result = await stopTrace();
    console.log('Trace saved to:', result?.traceUri);
  };

  return (
    <View>
      <Text>Perfetto Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>Perfetto Daemon: v{perfettoVersion}</Text>
      <Text>Tracing Active: {isTracing ? 'Recording...' : 'Idle'}</Text>
      <Text>Categories: {activeCategories.join(', ')}</Text>

      <TouchableOpacity onPress={handleBenchmark}>
        <Text>Run Profile Benchmark</Text>
      </TouchableOpacity>

      {lastTraceUri && <Text>Last Trace: {lastTraceUri}</Text>}
    </View>
  );
}
```

---

## Hardware Trace Architecture

<!-- diagram: perfetto-trace -->

---

## Trace Categories

| Category | Description | Performance Overhead |
| :--- | :--- | :--- |
| `sched` | CPU thread scheduling slices, runnable states, migrations. | < 0.5% |
| `freq` | Tensor G6 CPU and GPU clock frequency transitions. | < 0.1% |
| `am` | Activity Manager transitions and app lifecycle events. | Minimal |
| `binder` | Inter-Process Communication (IPC) Binder transactions. | ~1.0% |
| `camera` | Google Camera HAL frame capture timestamps and ISP stages. | Low |
| `hal` | Hardware Abstraction Layer events and sensor triggers. | Low |

---

## Inspecting Traces in Perfetto UI

1. Stop the active trace session using `stopTrace()`.
2. Extract the trace file from the device:
   ```bash
   adb pull /data/local/tmp/pixelkit_trace_*.perfetto-trace ./trace.pftrace
   ```
3. Open [ui.perfetto.dev](https://ui.perfetto.dev) in Google Chrome and load the file.
4. Visualize thread slices alongside Tensor G6 CPU cluster frequencies and your app's custom trace markers.
