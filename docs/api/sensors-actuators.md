# Sensors & Physical Actuators API Reference
> **6-Axis IMU & Barometer, Camera capture, Torch, and Linear Resonant Actuator Haptics**

This document covers physical sensors and mechanical actuation on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

---

## Module Index

* [`useSensors`](#usesensors) - 6-Axis IMU, Barometer, Compass, and Ambient Light
* [`useCamera`](#usecamera) - Photo capture, video recording, zoom, flash, torch
* [`useTorch`](#usetorch) - Hardware Dual-LED Torch & SOS Optical Strobe
* [`useHaptics`](#usehaptics) - Linear Resonant Actuator (LRA) Mechanical Tactile Feedback

---

## `useSensors`

Continuous multi-sensor telemetry from `expo-sensors`. Nothing is reported before the hardware has said it: pressure and light stay `null` until a first sample arrives, and `isAvailable` is false until subscriptions are attached. Per-sensor availability is reported separately, because a device can have an IMU and no barometer.

Altitude is derived from pressure with the international hypsometric formula, so it is **relative** and drifts with the weather. It is not a GNSS altitude and must not be presented as one.

### Signature
```typescript
function useSensors(updateIntervalMs?: number): SensorTelemetry & {
 hasMotionSample: boolean;
 barometerAvailable: boolean | null;
 lightAvailable: boolean | null;
 error: string | null;
 source: TelemetrySource;
};
```

### Inputs
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `updateIntervalMs` | `number` | `100` | Sampling period in milliseconds for the accelerometer, gyroscope, magnetometer and barometer. The light sensor is sampled at twice this interval because illuminance changes slowly. Changing it re-subscribes every sensor. Values below roughly 20 ms cost battery without adding usable resolution. |

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `accelerometer` | `Vector3D` — `{ x, y, z }` | Proper acceleration including gravity, in g. Three decimals. `{0,0,0}` until the first sample. |
| `gyroscope` | `Vector3D` | Angular velocity in radians per second about each axis. Three decimals. |
| `magnetometer` | `Vector3D` | Geomagnetic field strength in microteslas (μT), one decimal. This is what a compass heading is computed from. |
| `barometer` | `BarometerData` — `{ pressure: number \| null; relativeAltitude?: number \| null }` | Air pressure in hectopascals and the altitude derived from it in metres, relative to standard sea-level pressure (1013.25 hPa). Both `null` until a sample arrives or when the device has no barometer. |
| `lightLux` | `number \| undefined` | Ambient illuminance in lux from the front photodiode, one decimal so a dark room reads 0.4 rather than 0. `undefined` until the first sample. |
| `isAvailable` | `boolean` | Whether the sensor subscriptions were attached successfully. `false` before setup completes and after a failure. |
| `hasMotionSample` | `boolean` | `true` once a real accelerometer sample has arrived. Until then the vectors are zeroed, so use this to distinguish "still" from "not started". |
| `barometerAvailable` | `boolean \| null` | Whether this device has a barometer. `null` until probed. |
| `lightAvailable` | `boolean \| null` | Whether this device has an ambient light sensor. `null` until probed. |
| `error` | `string \| null` | Why subscribing failed, if it did. `null` when healthy. |
| `source` | `TelemetrySource` | `'hardware'` once a motion sample has arrived, `'unavailable'` before that. |

### Functions
`useSensors()` returns no callables. Change the sampling rate by passing a different `updateIntervalMs`; the hook re-subscribes when it changes.

### Example
```tsx
import { useSensors } from '@pixelkit-labs/sdk';

export function AltitudeHUD() {
 const { barometer, accelerometer, barometerAvailable } = useSensors(100);
 return (
 <View>
 <Text>Altitude: {barometerAvailable ? barometer.relativeAltitude ?? '—' : 'no barometer'} m</Text>
 <Text>Pressure: {barometer.pressure ?? '—'} hPa</Text>
 <Text>Accel Z: {accelerometer.z.toFixed(2)} g</Text>
 </View>
 );
}
```

---

## `useCamera`

Camera control and capture on `expo-camera`: lens selection, zoom, flash, torch, stills and video. The hook owns a ref to a `CameraView` and drives it, so a screen renders the view and attaches `cameraRef` and `handleCameraReady`.

Two device facts the API does not make obvious. `zoom` is a **0 to 1 fraction of the lens range**, not an optical multiplier, so a "5x" figure from the Pixel Camera app does not map onto it. And Camera Looks, Super Res Zoom and the low-light video mode belong to the Pixel Camera app and cannot be driven from a third-party app; `selectedLook` is a label for your own interface. It requests camera permission on mount. Capture requires `cameraRef` to be attached to a mounted `<CameraView>`; without it every capture call returns `null` and sets `error`.

### Signature
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

### Outputs
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

### Functions
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

### Example
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

---

## `useTorch`

Operates the rear camera flash LED through Android `CameraManager.setTorchMode` and, on Android 13+, `turnOnTorchWithStrengthLevel` for variable brightness. State follows the system torch callback, so a Quick Settings toggle is reflected here. Nothing is simulated: without the PixelNative module `isAvailable` is `false` and every action refuses.

Verified on Pixel 11 Pro: camera id `0`, **21 strength levels**; the camera HAL logs `Torch for camera id 0 turned on`. It reads torch capabilities on mount and subscribes to `onTorchState`. On unmount it clears any strobe timer and switches the LED off.

### Signature
```typescript
function useTorch(): {
 isAvailable: boolean;
 isTorchOn: boolean;
 isStrobing: boolean;
 maxStrengthLevel: number | null;
 error: string | null;
 source: TelemetrySource;
 setTorch: (on: boolean, strengthLevel?: number) => Promise<boolean>;
 toggleTorch: () => Promise<boolean>;
 startStrobe: (intervalMs?: number) => void;
 stopStrobe: () => void;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | `true` when a rear camera with a flash unit exists **and** the native module is present. Gate every control on this. |
| `isTorchOn` | `boolean` | Whether the LED is on, from `CameraManager.TorchCallback` — so it also tracks Quick Settings. |
| `isStrobing` | `boolean` | Whether the strobe timer is running. |
| `maxStrengthLevel` | `number \| null` | Highest value `setTorch` accepts as `strengthLevel` on Android 13+; 21 on this device. `null` when the platform does not report it. |
| `error` | `string \| null` | Why the last action failed, e.g. hardware unavailable. |
| `source` | `TelemetrySource` | `'hardware'` when the torch is usable, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setTorch(on, strengthLevel?)` | `on: boolean` — desired state. `strengthLevel?: number` — brightness from 1 to `maxStrengthLevel`, honoured on Android 13+ and ignored below it. Omit for the device default. | `Promise<boolean>` — `true` when the call was accepted, `false` when the hardware is unavailable or the call threw (see `error`) | Drives the physical LED. |
| `toggleTorch()` | none | `Promise<boolean>` — the state the torch is in afterwards | Inverts the current state, stopping any strobe first. |
| `startStrobe(intervalMs?)` | `intervalMs?: number` — half-period in milliseconds, default `150`, clamped to a minimum of `120` because the camera HAL needs roughly 50–100 ms per switch | `void` | Toggles the hardware torch on a timer. Replaces any strobe already running. |
| `stopStrobe()` | none | `void` | Cancels the timer and switches the LED off. |

### Example
```tsx
const torch = useTorch();
<HapticButton title={torch.isTorchOn ? 'Torch off' : 'Torch on'} onPress={() => torch.toggleTorch()} disabled={!torch.isAvailable} />
<HapticButton title="Dim" onPress={() => torch.setTorch(true, 1)} />
```

---

## `useHaptics`

Drives the Linear Resonant Actuator: standard Pixel patterns through `expo-haptics`, plus the vibrator's real capabilities and **Android 16 envelope effects** (`VibrationEffect.BasicEnvelopeBuilder`) and primitive compositions through the PixelNative module. Capabilities are read once per app, not once per button.

Verified on Pixel 11 Pro: resonant **134.4 Hz**, Q 14.5, amplitude control, `CAP_COMPOSE_PWLE_EFFECTS_V2` (envelopes supported), primitives `CLICK, TICK, QUICK_RISE, SLOW_RISE, QUICK_FALL, THUD, SPIN, LOW_TICK`. Vibrator capabilities are read once per app process and cached.

### Signature
```typescript
function useHaptics(): {
 triggerHaptic: (type?: HapticType) => Promise<void>;
 selection: () => Promise<void>;
 light: () => Promise<void>;
 medium: () => Promise<void>;
 heavy: () => Promise<void>;
 success: () => Promise<void>;
 warning: () => Promise<void>;
 error: () => Promise<void>;
 playEnvelope: (points: EnvelopePoint[], initialSharpness?: number) => boolean;
 playPrimitives: (steps: PrimitiveStep[]) => boolean;
 cancel: () => void;
 hasAmplitudeControl: boolean | null;
 envelopeSupported: boolean;
 resonantFrequencyHz: number | null;
 supportedPrimitives: string[];
 source: TelemetrySource;
};

type EnvelopePoint = { intensity: number; sharpness: number; durationMs: number };
type PrimitiveStep = { primitive: 'CLICK' | 'TICK' | 'THUD' | 'SPIN' | 'QUICK_RISE' | 'SLOW_RISE' | 'QUICK_FALL' | 'LOW_TICK'; scale?: number; delayMs?: number };
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `hasAmplitudeControl` | `boolean \| null` | Whether the actuator can vary intensity rather than only on/off. `null` before the capability read or when the native module is absent. |
| `envelopeSupported` | `boolean` | Whether `playEnvelope` will do anything: Android 16+ with PWLE v2 support. `false` when unknown. |
| `resonantFrequencyHz` | `number \| null` | The actuator's resonant frequency, 134.4 Hz here. Effects near it feel strongest. `null` when not reported. |
| `supportedPrimitives` | `string[]` | Primitive names `playPrimitives` accepts on this device. Empty when none are reported. |
| `source` | `TelemetrySource` | `'hardware'` on device, `'unavailable'` on web. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `triggerHaptic(type?)` | `type?: HapticType` — `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error'`, default `'light'` | `Promise<void>` — resolves when dispatched; failures are logged, not thrown | Plays a standard platform pattern. No-op on web. |
| `selection()` `light()` `medium()` `heavy()` `success()` `warning()` `error()` | none | `Promise<void>` | Named shorthands for `triggerHaptic` with that type. |
| `playEnvelope(points, initialSharpness?)` | `points: EnvelopePoint[]` — each `{ intensity 0..1, sharpness 0..1, durationMs }`; the envelope must end at intensity 0, which the module appends. `initialSharpness?: number` — sharpness to start from, 0..1. | `boolean` — `false` when envelopes are unsupported or the call threw, `true` when dispatched | Android 16+ amplitude/sharpness curve. Check `envelopeSupported` first. |
| `playPrimitives(steps)` | `steps: PrimitiveStep[]` — each `{ primitive, scale?: number 0..1, delayMs?: number }`; `scale` sets strength, `delayMs` the gap before that step | `boolean` — `false` when the native module is absent or the call threw | Android 11+ composition of hardware primitives. |
| `cancel()` | none | `void` | Stops any vibration in progress, including an envelope or composition. |

### Presets
`HapticEnvelopes.thinkingRamp` (a slow swell and release, for "the model is thinking"), `HapticEnvelopes.doublePulse` (two crisp pulses, "response ready"), `HapticEnvelopes.spring` (the bouncing spring from the Android haptics guide).

```tsx
const haptics = useHaptics();
if (haptics.envelopeSupported) haptics.playEnvelope(HapticEnvelopes.thinkingRamp);
haptics.playPrimitives([{ primitive: 'QUICK_RISE', scale: 0.8 }, { primitive: 'THUD', delayMs: 40 }]);
```

### Tactile Pattern Mapping
* `selection()`: subtle tick for sliders, wheel pickers and tab transitions.
* `light()`: soft mechanical tap for button presses.
* `medium()`: solid click for modal reveals and drawers.
* `heavy()`: firm thud for destructive actions.
* `success()`: double-pulse positive confirmation.
* `warning()`: pulsed alert.
* `error()`: triple-pulse validation failure.
