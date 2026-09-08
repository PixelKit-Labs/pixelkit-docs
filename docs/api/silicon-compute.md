# Silicon & Compute API Reference
> **Tensor G6 CPU, PowerVR GPU, on-device AI stack, memory, and ADPF thermals, all read from the device**

Every hook in this document reads real Android platform state through the local **PixelNative** Expo Module (`packages/native`). Nothing is fabricated: when a value cannot be read it is `null` and the hook's `source` reports `'unavailable'`. See [Observability](#observability--provenance) for the provenance model.

Each entry documents its **Inputs** (what you pass in, with defaults and units), its **Outputs** (every field it returns, with type and meaning) and its **Functions** (what each callable takes and what it resolves to).

---

## Module Index

* [`useCPU`](#usecpu) - Core topology, cpufreq, governor, app CPU share
* [`useGPU`](#usegpu) - GL/Vulkan identity and Choreographer frame pacing
* [`useTPU`](#usetpu) - AICore / Gemini Nano stack detection
* [`useMemory`](#usememory) - ActivityManager memory, heaps, low-memory flag
* [`useADPF`](#useadpf) - Thermal headroom, thermal status, SystemHealth CPU/GPU headroom
* [Observability & provenance](#observability--provenance)
* [PixelNative module](#pixelnative-module)

---

## `useCPU`

Reads the CPU topology from `/proc/cpuinfo` (per-core Arm part ids mapped to names such as `Arm C1-Ultra`, `Arm C1-Pro`) and cpufreq sysfs (`cpuinfo_max_freq`, `scaling_cur_freq`, `scaling_governor`). Android does not expose whole-system `/proc/stat` to apps, so the two load signals are (a) cluster frequency utilisation and (b) this app's own CPU share.

Verified on Pixel 11 Pro: `1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz`, governor `sched_pixel`. Topology is read once on mount; load polls every 1,000 ms until unmount.

### Signature
```typescript
function useCPU(): {
 coreTopology: string;
 coreCount: number;
 cpuLoadPercent: number | null;
 appCpuPercent: number | null;
 cores: CoreFrequency[];
 clusters: { part: string | null; name: string | null; maxMHz: number | null; count: number }[];
 governorMode: string;
 lastBenchmarkDurationMs: number | null;
 isBenchmarking: boolean;
 benchmarkCPU: () => Promise<number>;
 source: TelemetrySource;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `coreTopology` | `string` | Human-readable cluster summary built from real cluster data, e.g. `"1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz"`. `"unknown"` before the first read. |
| `coreCount` | `number` | Cores visible to this process. `0` until the native module answers; 7 on the Tensor G6. |
| `cpuLoadPercent` | `number \| null` | Cluster frequency utilisation in percent: current ÷ maximum clock averaged over cores. **Not** scheduler load. `null` when the cpufreq sysfs files are unreadable. |
| `appCpuPercent` | `number \| null` | This process's CPU time as a percentage of all cores, from `Process.getElapsedCpuTime` over wall time. `null` on the first sample because two readings are needed. Recorded with provenance `derived`. |
| `cores` | `{ index: number; part: string \| null; name: string \| null; curMHz: number \| null; maxMHz: number \| null; minMHz: number \| null }[]` | Per-core detail: kernel index, Arm part id, mapped name, and current/max/min clock in MHz. Empty before the first read. |
| `clusters` | `{ part: string \| null; name: string \| null; maxMHz: number \| null; count: number }[]` | Cores grouped by part id, which is how you tell prime, performance and efficiency cores apart. |
| `governorMode` | `string` | Kernel cpufreq governor for cpu0, `"sched_pixel"` on this device. `"unknown"` before the read; not settable without root. |
| `lastBenchmarkDurationMs` | `number \| null` | Duration in milliseconds of the last `benchmarkCPU()` run. `null` until one has run. |
| `isBenchmarking` | `boolean` | `true` while the benchmark occupies the JS thread. Use it to disable the trigger control. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNative module is present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkCPU()` | none | `Promise<number>` — run duration in milliseconds, also written to `lastBenchmarkDurationMs` | Runs a real single-threaded prime sieve (trial division to 60,000) on the JS thread. It measures Hermes single-thread throughput, not the system, and blocks the UI while it runs. |

### Example
```tsx
const { coreTopology, cpuLoadPercent, cores, benchmarkCPU } = useCPU();
<Text>{coreTopology}</Text>
<Text>{cpuLoadPercent ?? '—'}% · {cores.map(c => c.curMHz).join('/')} MHz</Text>
```

---

## `useGPU`

GPU identity comes from an offscreen EGL context (`GL_RENDERER`, `GL_VENDOR`, `GL_VERSION`) plus the `android.hardware.vulkan.version` feature. Frame pacing is measured on the UI thread with `Choreographer` in 1 s windows: presented FPS, average and max frame interval, jank frames (interval > 1.5× the display's expected frame time). GPU memory is not exposed by Android and is always `null`.

Verified on Pixel 11 Pro: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`, 114 FPS presented in a 120 Hz mode. Identity is read once on mount; the hook then subscribes to the native `onFrameStats` event, which fires once per second while mounted.

### Signature
```typescript
function useGPU(): {
 gpuRenderer: string | null;
 gpuVendor: string | null;
 graphicsApi: string | null;
 frameRenderTimeMs: number | null;
 maxFrameMs: number | null;
 measuredFps: number | null;
 droppedFrameCount: number;
 jankFramesLastSecond: number;
 targetBudgetMs: number;
 isStuttering: boolean;
 gpuMemoryUsageMB: null;
 source: TelemetrySource;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `gpuRenderer` | `string \| null` | `GL_RENDERER` from a real offscreen EGL context. `null` until the context exists, or when EGL failed. |
| `gpuVendor` | `string \| null` | `GL_VENDOR`, e.g. `"Imagination Technologies"`. |
| `graphicsApi` | `string \| null` | `GL_VERSION` joined with the Vulkan feature version, e.g. `"OpenGL ES 3.2 … / Vulkan 1.4"`. |
| `frameRenderTimeMs` | `number \| null` | Average UI-thread frame interval over the last 1 s window, in ms. `null` until the first window closes. |
| `maxFrameMs` | `number \| null` | Worst single frame interval in that window — the one the user actually felt. |
| `measuredFps` | `number \| null` | Frames presented in the last second, rounded. |
| `droppedFrameCount` | `number` | Cumulative jank frames since mount (interval > 1.5× expected). Starts at `0`. |
| `jankFramesLastSecond` | `number` | Jank frames in the most recent window only, for a live indicator. |
| `targetBudgetMs` | `number` | Frame budget of the current display mode: 8.33 ms at 120 Hz, 16.67 ms at 60 Hz. Defaults to 8.33 before the first window. |
| `isStuttering` | `boolean` | `true` when the average frame interval exceeds 1.5× the budget. `false` before any measurement. |
| `gpuMemoryUsageMB` | `null` | Android does not expose GPU memory to apps. Always `null`; never estimate it. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

### Functions
`useGPU()` returns no callables; it is read-only telemetry.

---

## `useTPU`

The Tensor TPU is reachable through AICore (Gemini Nano via ML Kit Prompt API in `@pixelkit-labs/mlkit`) or LiteRT. This hook reports what is verifiably installed; real on-device inference metrics (latency, token counts, TTFT) live in `useGeminiNano()`. `benchmarkTPU()` runs a real 256×256 JS matmul and reports it as **CPU fallback**, clearly labelled.

Verified on Pixel 11 Pro: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`. Requires the `<queries>` declaration in the module manifest (Android 11+ package visibility). Package and feature detection runs once on mount.

### Signature
```typescript
function useTPU(): {
 aicoreInstalled: boolean;
 aicoreVersion: string | null;
 privateComputeServicesVersion: string | null;
 hasNpuFeature: boolean | null;
 activeDelegate: 'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback';
 isHardwareAccelerated: false;
 lastInferenceLatencyMs: number | null;
 throughputTokensPerSec: number | null;
 memoryFootprintMB: number | null;
 cpuFallbackLatencyMs: number | null;
 isBenchmarking: boolean;
 benchmarkTPU: () => Promise<TPUAcceleration>;
 source: TelemetrySource;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `aicoreInstalled` | `boolean` | Whether `com.google.android.aicore` is installed. `false` when absent, or when package visibility is not declared. |
| `aicoreVersion` | `string \| null` | AICore `versionName`, the host process for Gemini Nano. `null` when not installed. |
| `privateComputeServicesVersion` | `string \| null` | Version of `com.google.android.as.oss`, which brokers private model downloads. `null` when not installed. |
| `hasNpuFeature` | `boolean \| null` | The `android.hardware.neural_processing_unit` feature flag as the device declares it. `null` before the read. |
| `activeDelegate` | `'Tensor TPU' \| 'NPU' \| 'GPU' \| 'CPU Fallback'` | Which executor the last measurement used. Becomes `'CPU Fallback'` once `benchmarkTPU()` has run, because that is what it actually measures. |
| `isHardwareAccelerated` | `false` | Always `false`: this hook runs nothing on the TPU. Accelerated inference is `useGeminiNano`. |
| `lastInferenceLatencyMs` | `number \| null` | Always `null` here. See `useGeminiNano().lastLatencyMs` for a measured on-device figure. |
| `throughputTokensPerSec` | `number \| null` | Always `null` here. See `useGeminiNano().lastDecodeTokensPerSec`. |
| `memoryFootprintMB` | `number \| null` | Always `null`: AICore does not report model memory to apps. |
| `cpuFallbackLatencyMs` | `number \| null` | Duration in ms of the last `benchmarkTPU()` matmul, explicitly labelled a CPU number. `null` until run. |
| `isBenchmarking` | `boolean` | `true` while the matmul occupies the JS thread. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkTPU()` | none | `Promise<TPUAcceleration>` — `{ activeDelegate: 'CPU Fallback', isHardwareAccelerated: false, lastInferenceLatencyMs: number, throughputTokensPerSec: null, memoryFootprintMB: null }` | Runs a real 256×256 float32 matrix multiply on the JS thread and returns its duration. Labelled CPU fallback because no part of it touches the TPU. |

---

## `useMemory`

`ActivityManager.getMemoryInfo` (total, available, low-memory threshold and flag), the Java heap (`Runtime`) and the native heap (`Debug.getNativeHeapAllocatedSize`), polled every 2 s. `purgeCaches()` requests a GC and re-reads; it does not pretend to free system RAM. It reads on mount and every 2,000 ms thereafter.

### Signature
```typescript
function useMemory(): {
 totalRAMMB: number;
 freeRAMMB: number;
 usedRAMMB: number;
 isLowMemory: boolean;
 lowMemoryThresholdMB: number;
 appJavaHeapMB: number;
 appJavaHeapMaxMB: number;
 appNativeHeapMB: number;
 purgeCaches: () => void;
 source: TelemetrySource;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `totalRAMMB` | `number` | Total physical RAM in MB from `ActivityManager.MemoryInfo.totalMem`. `0` before the first read; 11,647 MB on this device. |
| `freeRAMMB` | `number` | Available RAM in MB (`availMem`): what the kernel says it can hand out now. |
| `usedRAMMB` | `number` | `totalRAMMB − freeRAMMB`. Includes reclaimable page cache, so it reads higher than "app memory". |
| `isLowMemory` | `boolean` | Kernel low-memory flag: available RAM is below the threshold and the system is killing processes. |
| `lowMemoryThresholdMB` | `number` | The threshold in MB at which that flag flips. |
| `appJavaHeapMB` | `number` | This process's Java heap in use, to one decimal. |
| `appJavaHeapMaxMB` | `number` | Ceiling for that heap; exceeding it is an `OutOfMemoryError`. |
| `appNativeHeapMB` | `number` | This process's native heap (Hermes, decoded images, JSI buffers), to one decimal. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `purgeCaches()` | none | `void` — the refreshed reading lands in the returned fields | Requests a garbage collection and re-reads memory immediately. It frees this app's garbage only; it cannot free system RAM. The amount reclaimed is logged as `freedMB`. |

---

## `useADPF`

* `PowerManager.getThermalHeadroom(0)`: 0.0 cool → 1.0 severe throttling, polled every **10 s** (Google's minimum; faster polling returns NaN), plus `getThermalHeadroomThresholds()` on Android 15+.
* `PowerManager` thermal status via a live `OnThermalStatusChangedListener` (`nominal | light | moderate | severe | critical`).
* Android 16+ `SystemHealthManager.getCpuHeadroom / getGpuHeadroom` (reflection, `null` when the device does not report them).
* `targetFps` from the display mode, `currentFps` from Choreographer.

Verified on Pixel 11 Pro: headroom 0.55 at status NONE; thresholds `{1: 0.8, 2: 0.933, 3: 1.0, 4: 1.05, 5: 1.233, 6: 1.667}`. Thermal readings poll every 10,000 ms; status changes and frame stats arrive as native events.

### Signature
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

### What "thermal headroom" actually means

`PowerManager.getThermalHeadroom(forecastSeconds)` answers one question: **how close is this phone to the point where Android starts slowing the chip down to cool it?**

It is a ratio, not a temperature:

* `0.0` — cold, nothing is being held back.
* `0.5` — about halfway to the throttling point. Verified on this Pixel 11 Pro at idle: **0.55**.
* `1.0` — at the threshold; severe throttling begins here.
* `> 1.0` — already throttling. Clocks are being cut, and a heavy workload will get slower, not faster.

You never see the underlying temperature: Android deliberately does not expose one, because the threshold differs per device and per skin temperature sensor. The ratio is the portable form of "how much heat budget is left".

`thermalThresholds` is the same scale seen from the other side: the headroom value at which each `thermalStatus` begins on **this** device, e.g. `{1: 0.8, 2: 0.933, 3: 1.0, …}` — light throttling starts at 0.8, moderate at 0.933.

Practical use: read it before starting something expensive, not during. Above roughly 0.8, shed work — drop the frame rate target, stop a benchmark loop, defer a model download — because the alternative is the system doing it for you, less gracefully. Google's minimum polling interval is 10 seconds; asking faster returns `NaN`, which is why this hook polls at exactly that rate.

### Outputs
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

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `reportWorkDuration(actualWorkDurationMs, targetDurationMs?)` | `actualWorkDurationMs: number` — how long the work you just did actually took, in ms. `targetDurationMs?: number` — budget to judge it against; defaults to `1000 / targetFps`, or 8.33 ms before the refresh rate is known. | `'WITHIN_BUDGET'` when the ratio is ≤ 1, `'BOOST_REQUESTED'` when the work overran | Pure helper that classifies a measured work duration against the frame budget. It produces a verdict for your own scheduling; it does not call `PerformanceHintManager`. |

---

## Observability & provenance

`packages/sdk/src/core/observability.ts` gives every reading a **source**:

| `TelemetrySource` | Meaning |
| :--- | :--- |
| `hardware` | Read from an Android API or sensor |
| `derived` | Computed from hardware readings (e.g. app CPU share) |
| `unavailable` | The API/hardware is absent; the value is `null` |

There is deliberately no `simulated` member: the type makes a fabricated reading unrepresentable.

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `logEvent(module, event, data?, level?)` | `module: string` — hook the event belongs to. `event: string` — short description. `data?: Record<string, unknown>` — structured detail. `level?: 'info' \| 'warn' \| 'error'` — severity, default `'info'`. | `void` | Appends to the in-memory event ring and echoes to the console with the `[PixelKit]` prefix, so `adb logcat -s ReactNativeJS \| grep PixelKit` shows it. Carries the active trace id when inside a `traced` call. |
| `recordMetric(module, metric, value, source)` | `module: string`. `metric: string` — metric name. `value: unknown` — the reading. `source: TelemetrySource` — where it came from. | `void` | Stores the latest value per `module.metric` with its provenance. Not logged per sample; it feeds the debug panel and `getSourceSummary()`. |
| `normalizeError(e)` | `e: unknown` — anything thrown | `NormalizedError` — `{ message: string; code?: string; name?: string }` | Reduces native `CodedException`s, `Error`s, string rejections and plain objects to one shape. |
| `logError(module, event, e, data?)` | `module: string`. `event: string`. `e: unknown` — the thrown value. `data?: Record<string, unknown>`. | `NormalizedError` — ready to put straight into an `error` state field | Logs at error level and increments the module's error counter. A caught error is never discarded silently. |
| `traced(module, op, fn, data?, source?)` | `module: string`. `op: string` — operation name. `fn: () => Promise<T> \| T` — the work. `data?: Record<string, unknown>` — context to attach. `source?: TelemetrySource` — provenance for the duration metric, default `'hardware'`. | `Promise<T>` — whatever `fn` resolves to; rethrows on failure | Times the operation, gives it a correlation id (nested calls inherit the parent's), records `<op>Ms` as a metric and logs the outcome. Logs at warn when it runs longer than the slow-operation threshold. |
| `tracedSafe(module, op, fn, fallback, data?)` | Same as `traced`, plus `fallback: T` — the value to return if `fn` throws. | `Promise<T>` — the result, or `fallback` | For survivable failures: the error is still logged and counted, but control flow continues. |
| `useObservability()` | none | `{ events, metrics, traces, sources, errorCounts, health, slowest }` | React hook giving a live view for a diagnostics panel, throttled to ≤4 Hz. |
| `getRecentEvents()` / `getMetrics()` / `getTraces()` | none | `TelemetryEvent[]` / `MetricRecord[]` / `TraceRecord[]` | Non-React snapshots for tests and agents. |
| `getSourceSummary()` | none | `Record<string, TelemetrySource[]>` — the provenance values each module currently reports | Answers "is this module reading real hardware right now?". |
| `getSlowestTraces(limit?)` | `limit?: number` — how many to return, default 10 | `TraceRecord[]` sorted slowest first | Finds what is making the app feel heavy. |
| `getTrace(id)` | `id: string` — a correlation id | `{ trace?: TraceRecord; events: TelemetryEvent[] }` | Every event and the trace sharing one id, in order. |
| `getErrorCounts()` | none | `Record<string, number>` — failures per module | Cumulative since launch or the last reset. |
| `getHealthSummary()` | none | `{ module, errors, traces, slowestMs }[]`, worst first | One line per module for a health strip. |
| `resetObservability()` | none | `void` | Clears events, traces, metrics and error counts. For tests and a "reset diagnostics" control. |

`MetricCard` renders the `source` prop as a footer tag, which is how provenance reaches the user.

---

## PixelNative module

`packages/native` (Kotlin, Expo Modules API, autolinked from `./modules`). Requires a development build; on web and in Expo Go the TS bridge resolves to `null` and hooks report `unavailable`.

### Functions
| Function | Inputs | Returns | Android API |
| :--- | :--- | :--- | :--- |
| `getSocInfo()` | none | `SocInfo` — `socModel`, `socManufacturer`, `hardware`, `device`, `model`, `buildId`, `release`, `sdkInt`, `sdkIntFull`, `securityPatch`, `supportedAbis` | `Build.SOC_MODEL`, `SDK_INT_FULL`, security patch |
| `hasSystemFeature(name)` | `name: string` — feature id, e.g. `'android.hardware.uwb'` | `boolean` | `PackageManager.hasSystemFeature` |
| `getPackageVersion(pkg)` | `pkg: string` — application id | `PackageVersion` — `{ installed, versionName, versionCode }` | `PackageManager` (+ `<queries>` for AICore/PCS) |
| `getCpuInfo()` | none | `CpuInfo` — `{ coreCount, implementer, clusters, governor, cores }` | `/proc/cpuinfo`, cpufreq sysfs |
| `getCpuLoad()` | none | `CpuLoad` — `{ appCpuPercent, frequencyUtilizationPercent, cores }` | cpufreq sysfs, `Process.getElapsedCpuTime` |
| `getMemoryInfo()` | none | `MemoryInfo` — totals, heaps, low-memory flag and threshold, all in bytes | `ActivityManager.MemoryInfo`, `Runtime`, `Debug` |
| `requestGc()` | none | `MemoryInfo` — the reading taken after the collection | `Runtime.gc()` then a re-read |
| `getThermal()` | none | `ThermalInfo` — `{ thermalHeadroom, thermalStatus, thresholds, cpuHeadroom, gpuHeadroom }` | `PowerManager` thermal APIs, `SystemHealthManager` (16+) |
| `getDisplayInfo()` | none | `DisplayInfo` — active mode, all modes, HDR types, luminance, ARR support, suggested frame rates | `Display` modes/HDR/ARR |
| `setPreferredRefreshRate(rate)` | `rate: number` — requested Hz for this window | `Promise<boolean>` — whether the request was applied | `WindowManager.LayoutParams.preferredRefreshRate` |
| `getGpuInfo()` | none | `GpuInfo` — `{ renderer, vendor, glVersion, vulkanVersion, error? }` | EGL/GLES query plus the Vulkan feature version |
| `getTorchInfo()` | none | `TorchInfo` — `{ available, cameraId?, maxStrengthLevel?, defaultStrengthLevel?, currentStrengthLevel? }` | `CameraManager` characteristics |
| `setTorch(on, strengthLevel?)` | `on: boolean` — desired state. `strengthLevel?: number \| null` — 1..`maxStrengthLevel`, honoured on Android 13+. | `Promise<boolean>` | `setTorchMode`, `turnOnTorchWithStrengthLevel` |
| `getHapticsInfo()` | none | `HapticsInfo` — `{ hasVibrator, hasAmplitudeControl, envelopeEffectsSupported, resonantFrequencyHz, qFactor, supportedPrimitives }` | `Vibrator` capabilities |
| `playEnvelope(points, initialSharpness?)` | `points: EnvelopePoint[]` — `{ intensity 0..1, sharpness 0..1, durationMs }` steps. `initialSharpness?: number \| null` — starting sharpness. | `boolean` — whether the effect was dispatched | `VibrationEffect.BasicEnvelopeBuilder` (16+) |
| `playPrimitives(steps)` | `steps: PrimitiveStep[]` — `{ primitive, scale?, delayMs? }` | `boolean` | `VibrationEffect.Composition` (11+) |
| `cancelVibration()` | none | `boolean` | `Vibrator.cancel()` |
| `getRadioInfo()` | none | `RadioInfo` — `nfc`, `bluetooth`, `uwb`, `wifiRtt` and `satellite` blocks | `NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager`, `PackageManager` |
| `startBleScan(timeoutMs?)` | `timeoutMs?: number` — stop scanning after this many ms | `Promise<{ success: boolean; scanning: boolean; error?: string }>` | `BluetoothLeScanner.startScan` |
| `stopBleScan()` | none | `boolean` | `BluetoothLeScanner.stopScan` |
| `getDiscoveredBleDevices()` | none | `DiscoveredBleDevice[]` — `{ name, address, rssi, txPower?, timestampNanos, serviceUuids }` | Scan result cache |
| `startNfcReader(flags?)` | `flags?: number` — `NfcAdapter` reader-mode flags | `Promise<{ success: boolean; flags?: number; started?: boolean; error?: string }>` | `NfcAdapter.enableReaderMode` (needs a foreground Activity) |
| `stopNfcReader()` | none | `Promise<{ success: boolean }>` | `NfcAdapter.disableReaderMode` |
| `writeNdefText(text)` | `text: string` — record queued for the next tag presented | `Promise<{ success: boolean; queuedBytes?: number; error?: string }>` | `Ndef.writeNdefMessage` |
| `isNfcReaderActive()` | none | `boolean` | Reader-mode state |
| `startUwbRanging(sessionId?)` | `sessionId?: number` — session identifier, default 1001 | `Promise<UwbRangingResult>` — `{ success, sessionId, technology, serviceAvailable, serviceName, rangingFeature, status, timestampMs }` | `UwbManager` / `RangingManager` |
| `stopUwbRanging()` | none | `boolean` | `UwbManager` |
| `isOfflineSpeechAvailable()` | none | `boolean` | `SpeechRecognizer.isOnDeviceRecognitionAvailable` |
| `startSpeechRecognition(requestId, onDevice)` | `requestId: string` — correlates the `onSpeech*` events. `onDevice: boolean` — require the on-device recognizer. | `Promise<boolean>` | `SpeechRecognizer` |
| `stopSpeechRecognition()` / `cancelSpeechRecognition()` | none | `boolean` | `SpeechRecognizer` |
| `getAppFunctions()` | none | `AppFunctionInfo[]` — `{ id, name, description, category, target, enabled }` | App Functions registry |
| `executeAppFunction(functionId, params?)` | `functionId: string` — id from `getAppFunctions()`. `params?: Record<string, any>` — function-specific arguments. | `Promise<any>` — function-specific payload | App Functions dispatch |

### Events
| Event | Payload | Meaning |
| :--- | :--- | :--- |
| `onThermalStatus` | `{ status: number }` | `PowerManager` thermal status changed |
| `onFrameStats` | `FrameStats` — `{ fps, avgFrameMs, maxFrameMs, jankFrames, frames, expectedFrameMs }` | One second of Choreographer frame pacing |
| `onTorchState` | `{ cameraId: string; enabled: boolean; unavailable?: boolean }` | System torch state changed, including from Quick Settings |
| `onSpeechPartial` | `{ requestId: string; text: string }` | Interim recognition text |
| `onSpeechResult` | `{ requestId: string; text: string; isFinal: boolean }` | Final recognition text |
| `onSpeechRms` | `{ requestId: string; rmsdB: number }` | Microphone level during recognition |
| `onSpeechError` | `{ requestId: string; error: string; code?: number }` | Recognition failed |
| `onBleDeviceFound` | `DiscoveredBleDevice` | An advertisement was received |
| `onNfcTag` | `NfcTagEvent` — id, techs, type, capacity, writability, decoded records, write outcome | A tag entered the field |
| `onNfcError` | `{ id: string; message: string }` | A tag could not be read or written |
