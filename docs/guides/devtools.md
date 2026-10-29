# In-App Hardware Telemetry & DevTools HUD

> **Real-time on-screen inspection of display FPS, ADPF thermal headroom, Tensor CPU clusters, and memory usage on Google Pixel devices.**

---

## Overview

When testing applications on physical Google Pixel hardware, developers and QA engineers often need to observe hardware performance without tethering to Android Studio, running `adb logcat`, or attaching a desktop profiler.

PixelKit provides `<PixelKitDevTools />` — a lightweight, draggable, floating Heads-Up Display (HUD) that renders directly within your application during development (`__DEV__`).

```tsx
import React from 'react';
import { PixelKitDevTools } from '@pixelkit-labs/sdk';

export default function Layout() {
  return (
    <>
      <AppScreens />
      <PixelKitDevTools />
    </>
  );
}
```

---

## Features & Telemetry

### 1. Collapsed Floating Badge (Pill)
In its default collapsed state, the HUD occupies minimal screen area and can be dragged anywhere across the display:
- **FPS Indicator**: Live frames-per-second sampled directly from the Android `Choreographer`.
- **ADPF Thermal Badge**: Color-coded thermal throttling status:
  - `🟢 NOM` (Nominal): Device is operating normally at full performance.
  - `🟡 LGT` (Light): Early thermal throttling starting.
  - `🟠 MOD` (Moderate): Moderate CPU/GPU pacing active.
  - `🔴 SVR` (Severe): Aggressive thermal throttling in effect.
  - `🚨 CRIT` (Critical): Near-emergency thermal state.
- **CPU share**: Cluster frequency utilization (`cpuLoadPercent`); when that is unreadable the pill shows the app's own CPU share prefixed with `app`.
- **Missing values**: Any value that has not been read yet, or cannot be read, renders as `—`. The HUD never substitutes a default frame rate, refresh rate, percentage or thermal colour; the thermal dot is grey until a thermal sample exists.

### 2. Expanded Inspection Tray
Tapping the floating pill opens a full-featured diagnostics panel:

```text
 ┌──────────────────────────────────────────────┐
 │ ⚡ PixelKit HUD                 [ HARDWARE ] ✕│
 ├──────────────────────────────────────────────┤
 │ Display FPS:                    120 / 120 Hz │
 │ Thermal Headroom:              18% (NOMINAL) │
 ├──────────────────────────────────────────────┤
 │ CPU Utilization:                       14.2% │
 │ 1x Arm C1-Ultra @ 4.11 GHz + 3x ...          │
 ├──────────────────────────────────────────────┤
 │ Memory (RAM):                6,420 / 15,120MB│
 │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] │
 ├──────────────────────────────────────────────┤
 │ [ Purge GC ]               [ Pulse HiLight ] │
 └──────────────────────────────────────────────┘
```

- **Display & Refresh Rate**: Displays measured FPS (Choreographer) against the active display mode's refresh rate; each side shows `—` until it has been read.
- **Source badge**: The badge in the header prints the `source` reported by `useCPU` (`HARDWARE` or `UNAVAILABLE`), which says whether the native module is present, not whether the device is physical or an emulator.
- **ADPF Thermal Headroom**: Exact headroom percentage before throttling begins (`PowerManager.getThermalHeadroom()`).
- **Tensor CPU Topology**: Cluster frequency load across Cortex-X big cores, mid cores, and efficiency cores.
- **Memory Consumption**: System RAM used / total from `useMemory`; `—` until the first read.
- **Quick Action Controls**:
  - **Purge GC**: Invokes `PixelNative.requestGc()` to clean app garbage and measure reclaimed memory.
  - **Pulse HiLight**: Sends a 2 s `gemini_thinking` pulse to the HiLight daemon. The button is shown only when `useHiLight().availability` is `'hardware'`.

---

## Configuration Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `__DEV__` | Whether the HUD is rendered. Set to `false` in production builds. |
| `initialPosition` | `{ x?: number, y?: number }` | `{ x: 16, y: 64 }` | Initial screen coordinates on launch. |

---

## Production Safety

`<PixelKitDevTools />` checks `enabled` on every render. In production production bundles where `__DEV__ === false`, the component returns `null` immediately and incurs zero runtime layout overhead.
