# useTPU

**Source:** [packages/sdk/src/ai/useTPU.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useTPU.ts)

The Tensor TPU is reachable through AICore (Gemini Nano via ML Kit Prompt API in `@pixelkit-labs/mlkit`) or LiteRT. This hook reports observed package visibility, not model readiness or current TPU use; real on-device inference metrics (latency, token counts, TTFT) live in `useGeminiNano()`. `benchmarkTPU()` runs a real 256×256 JS matmul and reports it as **CPU fallback**, clearly labelled.

Verified on Pixel 11 Pro: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`. Requires the `<queries>` declaration in the module manifest (Android 11+ package visibility). Package and feature detection runs once on mount.

## Signature
```typescript
function useTPU(): {
 aicoreInstalled: boolean | null;
 aicoreVersion: string | null;
 privateComputeServicesVersion: string | null;
 hasNpuFeature: boolean | null;
 activeDelegate: 'CPU Fallback' | null;
 isHardwareAccelerated: false;
 lastInferenceLatencyMs: number | null;
 throughputTokensPerSec: number | null;
 memoryFootprintMB: number | null;
 cpuFallbackLatencyMs: number | null;
 isBenchmarking: boolean;
 benchmarkTPU: () => Promise<TPUAcceleration>;
 error: string | null;
 source: TelemetrySource;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `aicoreInstalled` | `boolean \| null` | Whether the AICore host package is visible: `false` when the package check found it absent, `null` before the check or if it failed. Visibility is not model readiness. |
| `aicoreVersion` | `string \| null` | AICore `versionName`, the host process for Gemini Nano. `null` when not installed. |
| `privateComputeServicesVersion` | `string \| null` | Version of `com.google.android.as.oss`, which brokers private model downloads. `null` when not installed. |
| `hasNpuFeature` | `boolean \| null` | The `android.hardware.neural_processing_unit` feature flag as the device declares it. `null` before the read. |
| `activeDelegate` | `'CPU Fallback' \| null` | Null before the hook runs its JS-only benchmark; `'CPU Fallback'` after a measured run. Never claims current TPU use. |
| `isHardwareAccelerated` | `false` | Always `false`: this hook runs nothing on the TPU. On-device inference is `useGeminiNano`; AICore decides where it runs. |
| `lastInferenceLatencyMs` | `number \| null` | Always `null` here. See `useGeminiNano().lastLatencyMs` for a measured on-device figure. |
| `throughputTokensPerSec` | `number \| null` | Always `null` here. See `useGeminiNano().lastDecodeTokensPerSec`. |
| `memoryFootprintMB` | `number \| null` | Always `null`: AICore does not report model memory to apps. |
| `cpuFallbackLatencyMs` | `number \| null` | Duration in ms of the last `benchmarkTPU()` matmul, explicitly labelled a CPU number. `null` until run. |
| `isBenchmarking` | `boolean` | `true` while the matmul occupies the JS thread. |
| `error` | `string \| null` | Latest package/feature detection failure, if any. |
| `source` | `TelemetrySource` | `'hardware'` when the AICore package is installed and visible, `'unavailable'` when it is not installed, not visible to this app, or the native module is absent. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkTPU()` | none | `Promise<TPUAcceleration>` — `{ activeDelegate: 'CPU Fallback', isHardwareAccelerated: false, lastInferenceLatencyMs: number, throughputTokensPerSec: null, memoryFootprintMB: null }` | Runs a real 256×256 float32 matrix multiply on the JS thread and returns its duration. Labelled CPU fallback because no part of it touches the TPU. |
