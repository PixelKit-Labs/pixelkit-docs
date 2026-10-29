# System Profiling with Perfetto & Kernel Ftrace

> **System traces and custom app markers from React Native with `usePerfetto`.**

---

## Overview

Diagnosing performance bottlenecks, stutter, or frame drops in production React Native applications often requires deep visibility into kernel scheduling, thread states, and hardware DVFS (Dynamic Voltage and Frequency Scaling).

The [`usePerfetto`](/api/silicon-compute/useperfetto/) hook starts a real Android system trace and emits `android.os.Trace` markers. On Android 15+ the trace comes from `android.os.ProfilingManager`: the platform records a trace of your app and delivers the file. Where ProfilingManager is absent the hook runs `/system/bin/perfetto`, which many devices do not allow an app to execute. When no backend can start, `startTrace` resolves `false` and `error` states the reason. `perfettoVersion` is read from `perfetto --version` and is `null` (with `perfettoVersionReason`) when the app cannot run the binary.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePerfetto } from '@pixelkit-labs/sdk';

export function TraceRecorder() {
  const {
    isSupported,
    isTracing,
    backend,
    perfettoVersion,
    perfettoVersionReason,
    lastTraceUri,
    lastTraceSizeBytes,
    error,
    startTrace,
    stopTrace,
    beginSection,
    endSection,
  } = usePerfetto();

  const handleBenchmark = async () => {
    if (!(await startTrace(['sched', 'freq', 'am'], 16384))) return; // `error` says why
    beginSection('BenchmarkStart');

    // Run heavy compute or UI animation
    for (let i = 0; i < 10000; i++) {
      Math.sqrt(i);
    }

    endSection();
    const path = await stopTrace(); // null unless a non-empty file exists
    console.log('Trace saved to:', path);
  };

  return (
    <View>
      <Text>Trace backend: {isSupported ? backend : 'none available'}</Text>
      <Text>Perfetto binary: {perfettoVersion ?? `unavailable (${perfettoVersionReason})`}</Text>
      <Text>Tracing Active: {isTracing ? 'Recording...' : 'Idle'}</Text>

      <TouchableOpacity onPress={handleBenchmark}>
        <Text>Run Profile Benchmark</Text>
      </TouchableOpacity>

      {error && <Text>{error}</Text>}
      {lastTraceUri && <Text>Last Trace: {lastTraceUri} ({lastTraceSizeBytes} bytes)</Text>}
    </View>
  );
}
```

---

## Trace Architecture

<!-- diagram: perfetto-trace -->

---

## Trace Categories

Categories apply only when the backend is `perfetto_binary` (`backend` in the hook). With the `profiling_manager` backend the platform chooses the data sources: `availableCategories` and `activeCategories` stay empty and the categories passed to `startTrace` are not applied. The atrace categories the perfetto command line accepts include:

| Category | Description |
| :--- | :--- |
| `sched` | CPU thread scheduling slices, runnable states, migrations. |
| `freq` | CPU and GPU clock frequency transitions. |
| `am` | Activity Manager transitions and app lifecycle events. |
| `camera` | Camera HAL frame capture timestamps. |
| `hal` | Hardware Abstraction Layer events. |

---

## Inspecting Traces in Perfetto UI

1. Stop the active trace session using `stopTrace()`. It resolves a path only when the trace file exists with a non-zero size; otherwise it resolves `null` and `error` says why.
2. Copy the file off the device. The path is inside the app's private storage, so use `run-as` (debuggable builds) or share the file from the app:
   ```bash
   adb exec-out run-as <your.package> cat <path from lastTraceUri> > trace.perfetto-trace
   ```
3. Open [ui.perfetto.dev](https://ui.perfetto.dev) in Google Chrome and load the file.
4. Inspect the thread slices of your app alongside the custom sections you emitted with `beginSection`/`endSection`.
