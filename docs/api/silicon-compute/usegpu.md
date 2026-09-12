# useGPU

**Source:** [packages/sdk/src/hardware/useGPU.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useGPU.ts)

GPU identity comes from an offscreen EGL context (`GL_RENDERER`, `GL_VENDOR`, `GL_VERSION`) plus the `android.hardware.vulkan.version` feature. Frame pacing is measured on the UI thread with `Choreographer` in 1 s windows: presented FPS, average and max frame interval, jank frames (interval > 1.5× the display's expected frame time). GPU memory is not exposed by Android and is always `null`.

Verified on Pixel 11 Pro: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`, 114 FPS presented in a 120 Hz mode. Identity is read once on mount; the hook then subscribes to the native `onFrameStats` event, which fires once per second while mounted.

## Signature
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

## Outputs
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

## Functions
`useGPU()` returns no callables; it is read-only telemetry.
