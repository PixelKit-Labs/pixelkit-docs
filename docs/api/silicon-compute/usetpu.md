# useTPU

**Source:** [packages/sdk/src/ai/useTPU.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useTPU.ts)

The Tensor TPU is reachable through AICore (Gemini Nano via ML Kit Prompt API in `@pixelkit-labs/mlkit`) or LiteRT. This hook reports what is verifiably installed; real on-device inference metrics (latency, token counts, TTFT) live in `useGeminiNano()`. `benchmarkTPU()` runs a real 256×256 JS matmul and reports it as **CPU fallback**, clearly labelled.

Verified on Pixel 11 Pro: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`. Requires the `<queries>` declaration in the module manifest (Android 11+ package visibility). Package and feature detection runs once on mount.

## Signature
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

## Outputs
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

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkTPU()` | none | `Promise<TPUAcceleration>` — `{ activeDelegate: 'CPU Fallback', isHardwareAccelerated: false, lastInferenceLatencyMs: number, throughputTokensPerSec: null, memoryFootprintMB: null }` | Runs a real 256×256 float32 matrix multiply on the JS thread and returns its duration. Labelled CPU fallback because no part of it touches the TPU. |
