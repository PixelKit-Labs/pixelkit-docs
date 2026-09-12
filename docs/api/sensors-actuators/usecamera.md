# useCamera

**Source:** [packages/sdk/src/hardware/useCamera.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useCamera.ts)

Camera control and capture on `expo-camera`: lens selection, zoom, flash, torch, stills and video. The hook owns a ref to a `CameraView` and drives it, so a screen renders the view and attaches `cameraRef` and `handleCameraReady`.

Two device facts the API does not make obvious. `zoom` is a **0 to 1 fraction of the lens range**, not an optical multiplier, so a "5x" figure from the Pixel Camera app does not map onto it. And Camera Looks, Super Res Zoom and the low-light video mode belong to the Pixel Camera app and cannot be driven from a third-party app; `selectedLook` is a label for your own interface. It requests camera permission on mount. Capture requires `cameraRef` to be attached to a mounted `<CameraView>`; without it every capture call returns `null` and sets `error`.

## Signature
```typescript
function useCamera(): CameraTelemetry & {
 cameraRef: RefObject<CameraView | null>;
 viewProps: { facing; zoom; flash; enableTorch; mode };
 mode: 'picture' | 'video';
 isReady: boolean;
 isTorchOn: boolean;
 availableLenses: string[];
 availablePictureSizes: string[];
 isCapturing: boolean;
 lastPhoto: CapturedPhoto | null;
 isRecording: boolean;
 recordingSeconds: number;
 lastVideoUri: string | null;
 error: string | null;
 source: TelemetrySource;
 handleCameraReady: () => Promise<void>;
 takePicture: (options?: TakePictureOptions) => Promise<CapturedPhoto | null>;
 startRecording: (options?: StartRecordingOptions) => Promise<string | null>;
 stopRecording: () => void;
 toggleFacing: () => void;
 setZoom: (fraction: number) => void;
 setZoomStep: (step: number, totalSteps?: number) => void;
 setFlash: (mode: 'auto' | 'on' | 'off') => void;
 toggleTorch: () => void;
 setMode: (mode: 'picture' | 'video') => void;
 setLook: (look: CameraLook) => void;
 toggleUltraLowLightVideo: () => void;
 pausePreview: () => Promise<void>;
 resumePreview: () => Promise<void>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `cameraRef` | `RefObject<CameraView \| null>` | Attach to `<CameraView ref={...} />`. Capture fails without it. |
| `viewProps` | `{ facing; zoom; flash; enableTorch; mode }` | Spread onto the view so it reflects this hook's state in one place. |
| `facing` | `'back' \| 'front'` | Which camera is active. |
| `zoomFactor` | `number` | Current zoom as a 0–1 fraction of the lens range, three decimals. Not an optical multiplier. |
| `maxZoomFactor` | `number` | App-side ceiling for that fraction; `1`. |
| `flashMode` | `'auto' \| 'on' \| 'off'` | Whether the flash fires at capture. |
| `isTorchOn` | `boolean` | Continuous light, as distinct from the capture-time flash. |
| `mode` | `'picture' \| 'video'` | View configuration. Recording requires `'video'`; `startRecording` switches it. |
| `isReady` | `boolean` | Whether the preview is running and capture is possible. Set by `handleCameraReady`. |
| `hasPermission` | `boolean` | Whether camera permission was granted. |
| `isCapturing` | `boolean` | `true` while a still is being taken. |
| `lastPhoto` | `CapturedPhoto \| null` | Most recent still: `{ uri, width, height, base64?, exif? }`. `null` until one is taken. |
| `isRecording` | `boolean` | `true` while video is recording. |
| `recordingSeconds` | `number` | Elapsed seconds of the current recording, one decimal, updated every 100 ms. |
| `lastVideoUri` | `string \| null` | File URI of the most recent clip. Hand it to `useVideo().load()` to play it back. |
| `availableLenses` | `string[]` | Lens identifiers the device reports. Empty until the preview is running. |
| `availablePictureSizes` | `string[]` | Picture sizes the device supports. Empty until the preview is running. |
| `selectedLook` | `CameraLook` | Label only. Looks are a Pixel Camera app feature and are not applied to captures. |
| `isUltraLowLightVideoActive` | `boolean` | UI flag only, for the same reason. |
| `error` | `string \| null` | Why the last capture, recording or capability read failed. |
| `source` | `TelemetrySource` | `'hardware'` once permission is granted, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `handleCameraReady()` | none | `Promise<void>` | Pass to the view's `onCameraReady`. Sets `isReady` and reads the lens and picture-size lists, which only resolve once the preview is running. |
| `takePicture(options?)` | `options.quality?: number` — JPEG quality 0–1, default `0.85`. `options.base64?: boolean` — also return the image as base64, which is what the AI hooks consume; default `false`. `options.exif?: boolean` — include EXIF metadata; default `false`. `options.shutterSound?: boolean` — play the shutter sound where the platform allows suppressing it; default `true`. | `Promise<CapturedPhoto \| null>` — `{ uri, width, height, base64?, exif? }`, or `null` when the view is not mounted or the capture failed (see `error`) | Takes a still into the app cache. Use `useMediaLibrary().save()` to keep it. |
| `startRecording(options?)` | `options.maxDurationSeconds?: number` — stop automatically after this long. `options.maxFileSizeBytes?: number` — stop automatically at this size. `options.mirror?: boolean` — mirror the recording, matching a front-facing preview. | `Promise<string \| null>` — the video file URI, resolved **when recording ends**, or `null` on failure | Switches the view to `'video'` mode and records. The promise resolves when `stopRecording()` is called or a limit is reached. |
| `stopRecording()` | none | `void` — the pending `startRecording` promise resolves with the file | Ends the recording. No-op when not recording. |
| `toggleFacing()` | none | `void` | Switches between the rear and front camera. |
| `setZoom(fraction)` | `fraction: number` — 0 to 1 across the lens range; values outside are clamped | `void` | Sets zoom. Do not pass `5` for "5x". |
| `setZoomStep(step, totalSteps?)` | `step: number` — which stop to select, clamped to `0..totalSteps`. `totalSteps?: number` — how many evenly spaced stops, default `4`. | `void` | Convenience for a control with discrete zoom stops. |
| `setFlash(mode)` | `mode: 'auto' \| 'on' \| 'off'` | `void` | Chooses flash behaviour for the next capture. |
| `toggleTorch()` | none | `void` | Turns the continuous light on or off through the preview. For torch without a preview, use `useTorch`. |
| `setMode(mode)` | `mode: 'picture' \| 'video'` | `void` | Switches the view between stills and video. |
| `setLook(look)` | `look: CameraLook` — one of `Original`, `Natural`, `Shadows`, `Vanilla`, `Editorial`, `Velvet`, `Classic`, `Digi`, `Black Tie`, `Minimal` | `void` | Records a label in state. It does not change the image; Looks are not reachable from third-party apps. |
| `toggleUltraLowLightVideo()` | none | `void` | Flips the UI flag only, for the same reason. |
| `pausePreview()` / `resumePreview()` | none | `Promise<void>` | Freezes or restarts the preview without tearing the camera down. |

## Example
```tsx
import { CameraView } from 'expo-camera';
import { useCamera, HapticButton } from '@pixelkit-labs/sdk';

export function Capture() {
 const cam = useCamera();
 if (!cam.hasPermission) return <Text>Camera permission needed</Text>;
 return (
 <View>
 <CameraView ref={cam.cameraRef} onCameraReady={cam.handleCameraReady} {...cam.viewProps} style={{ flex: 1 }} />
 <HapticButton title="Photo" onPress={() => cam.takePicture({ base64: true })} />
 <HapticButton
 title={cam.isRecording ? `Stop (${cam.recordingSeconds}s)` : 'Record'}
 onPress={() => (cam.isRecording ? cam.stopRecording() : cam.startRecording({ maxDurationSeconds: 60 }))}
 />
 </View>
 );
}
```
