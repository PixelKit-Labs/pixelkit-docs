# System & Media API Reference
> **Microphone capture and metering, display, power, media library, and the modem**

This document covers system telemetry, media capture and playback, power and the wireless modem. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

---

## Module Index

* [`useAudio`](#useaudio) - Microphone capture, dBFS metering, input selection, playback
* [`useSpatialAudio`](#usespatialaudio) - Android Spatializer, binaural audio, and dynamic head tracking
* [`useCapabilities`](#usecapabilities) - What this device actually has
* [`useDisplay`](#usedisplay) - Refresh rate, ARR, HDR, brightness and wake lock
* [`useDevice`](#usedevice) - Model, battery and charging telemetry
* [`useNetwork`](#usenetwork) - Connectivity, address and metering
* [`useVideo`](#usevideo) - expo-video playback, seeking and frame thumbnails
* [`useMediaLibrary`](#usemedialibrary) - Saving captures to the device gallery
* [`useCellular`](#usecellular) - Carrier, radio generation and network codes

---

## `useAudio`

Microphone capture, level metering and playback on `expo-audio`. Two capture profiles: `speech` (16 kHz mono through the Pixel `voice_recognition` path, which applies the platform's noise suppression) and `studio` (48 kHz stereo through `unprocessed`, the raw microphone signal). Nothing is simulated: before the first sample `meteringDecibels` sits at the silence floor and `source` is `'unavailable'`.

Verified on Pixel 11 Pro: `dumpsys audio` shows `src:VOICE_RECOGNITION pack:com.pixelkit.sdk` while the speech profile is recording. It requests microphone permission on mount and clears every timer on unmount. Per-take options go to `startRecording`.

### Signature
```typescript
function useAudio(): {
 isRecording: boolean; isPaused: boolean; canRecord: boolean; permissionGranted: boolean;
 durationSeconds: number; quality: 'speech' | 'studio';
 meteringDecibels: number; peakDecibels: number; level: number;
 isSilent: boolean; silenceThresholdDbfs: number; setSilenceThresholdDbfs: (dbfs: number) => void;
 inputs: RecordingInput[]; currentInputUid: string | null; route: 'speaker' | 'earpiece';
 lastRecordingUri: string | null; isPlaying: boolean;
 playbackPositionSeconds: number; playbackDurationSeconds: number;
 source: TelemetrySource; error: string | null;
 startRecording: (options?: { maxDurationSeconds?: number; quality?: 'speech' | 'studio' }) => Promise<boolean>;
 pauseRecording: () => boolean; resumeRecording: () => boolean;
 stopRecording: () => Promise<string | null>;
 setQuality: (quality: 'speech' | 'studio') => void;
 refreshInputs: () => RecordingInput[]; selectInput: (uid: string) => boolean;
 setRoute: (route: 'speaker' | 'earpiece') => Promise<void>;
 playLastRecording: (uri?: string) => Promise<boolean>;
 pausePlayback: () => void; stopPlayback: () => Promise<void>; seekPlayback: (seconds: number) => Promise<void>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRecording` | `boolean` | Whether the microphone is open. Stays `true` while paused. |
| `isPaused` | `boolean` | Whether the open take is paused rather than stopped. |
| `canRecord` | `boolean` | The recorder's own readiness flag, from `RecorderState.canRecord`. |
| `permissionGranted` | `boolean` | Whether microphone permission has been granted. |
| `durationSeconds` | `number` | Elapsed seconds of the current take, one decimal, updated every 100 ms. |
| `quality` | `'speech' \| 'studio'` | Active capture profile. `speech` = 16 kHz mono, noise-suppressed; `studio` = 48 kHz stereo, unprocessed. |
| `meteringDecibels` | `number` | Live level in dBFS: −160 is digital silence, 0 is clipping. |
| `peakDecibels` | `number` | Loudest dBFS seen during this take, reset at each start. |
| `level` | `number` | The level mapped to 0–1 for a meter, floored at −60 dBFS. |
| `isSilent` | `boolean` | `true` until the level rises above `silenceThresholdDbfs`, and always `true` before the first sample. |
| `silenceThresholdDbfs` | `number` | Speech/silence boundary in dBFS, default `-45`. Quiet rooms sit near −50. |
| `inputs` | `RecordingInput[]` | Microphones the platform offers, each with a `uid`, `name` and `type`. Only populated once a recording has been prepared. |
| `currentInputUid` | `string \| null` | Which microphone is selected, or `null` when the platform is choosing. |
| `route` | `'speaker' \| 'earpiece'` | Where playback is routed. |
| `lastRecordingUri` | `string \| null` | File URI of the last completed recording. Feed it to `useSpeechAI`, `useVideo` or `useMediaLibrary().save()`. |
| `isPlaying` | `boolean` | Whether playback is running. |
| `playbackPositionSeconds` | `number` | Position in the playing file, polled 5× a second. |
| `playbackDurationSeconds` | `number` | Length of the playing file, `0` until it loads. |
| `source` | `TelemetrySource` | `'hardware'` once a real level sample has arrived, `'unavailable'` before that. |
| `error` | `string \| null` | Why the last capture, routing or playback call failed. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRecording(options?)` | `options.maxDurationSeconds?: number` — stop automatically after this long; the native recorder stops itself and the hook finalises the file. `options.quality?: 'speech' \| 'studio'` — profile for this take, which also becomes the active profile. | `Promise<boolean>` — `true` when recording started, `false` when permission was denied or the recorder refused (see `error`) | Requests permission if needed, prepares the profile, starts metering at 10 Hz and reads the input list. |
| `pauseRecording()` | none | `boolean` — `true` when the take was paused | Pauses without finalising the file. |
| `resumeRecording()` | none | `boolean` — `true` when the take resumed | Continues the same take. |
| `stopRecording()` | none | `Promise<string \| null>` — the recorded file URI, or `null` when nothing was recording or the stop failed | Finalises the file, stops metering and sets `lastRecordingUri`. |
| `setQuality(quality)` | `quality: 'speech' \| 'studio'` | `void` | Switches the capture profile. Takes effect on the next recording, not the current one. |
| `refreshInputs()` | none | `RecordingInput[]` — the list, also written to `inputs` | Re-reads available microphones. Only valid once the recorder has been prepared. |
| `selectInput(uid)` | `uid: string` — a `uid` from `inputs` | `boolean` — `true` when the platform accepted it | Chooses between the built-in array and an attached USB or Bluetooth microphone. |
| `setRoute(route)` | `route: 'speaker' \| 'earpiece'` | `Promise<void>` | Routes playback to the loudspeaker or the call earpiece, at the audio-mode level. |
| `playLastRecording(uri?)` | `uri?: string` — a specific file; defaults to `lastRecordingUri` | `Promise<boolean>` — `true` when playback started, `false` when there is nothing to play | Plays a recording and starts position polling. |
| `pausePlayback()` | none | `void` | Pauses where it is. |
| `stopPlayback()` | none | `Promise<void>` | Pauses and seeks back to the start. |
| `seekPlayback(seconds)` | `seconds: number` — absolute position, negatives clamped to 0 | `Promise<void>` | Jumps within the playing file. |

### Example
```tsx
const audio = useAudio();
await audio.startRecording({ quality: 'speech', maxDurationSeconds: 30 });
// audio.level drives a meter; audio.isSilent gates a "say something" hint
const uri = await audio.stopRecording();
await audio.playLastRecording();
```

---

## `useSpatialAudio`

Queries Android's Spatializer audio subsystem and dynamic head tracking sensors (API 32+). Detects whether spatial audio processing is active for the current audio routing path, whether binaural / transaural spatialization is enabled, and whether dynamic head tracking sensors (such as Pixel Buds Pro) are actively tracking.

Verified on Pixel 11 Pro (`grizzly`): `dumpsys audio` confirms `mHasSpatializerEffect: true`, `mIsHeadTrackingSupported: true`, and `supports binaural: true / transaural: true`. Nothing is simulated: reads directly from the audio HAL and reports `source: 'hardware'` on genuine hardware.

### Signature
```typescript
function useSpatialAudio(): {
  isSupported: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  hasHeadTracker: boolean;
  headTrackingMode: HeadTrackingMode;
  immersiveAudioLevel: number;
  hasDynamicHeadTrackerFeature: boolean;
  error: string | null;
  source: TelemetrySource;
  refresh: () => SpatialAudioInfo | null;
};
```

### Outputs
| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `isSupported` | `boolean` | flag | `true` if device platform supports the Android Spatializer API (API 32+). |
| `isAvailable` | `boolean` | flag | `true` if spatial audio processing is available for the current audio routing path (e.g. A2DP headphones vs earpiece). |
| `isEnabled` | `boolean` | flag | `true` if spatial audio is enabled in user system sound settings. |
| `hasHeadTracker` | `boolean` | flag | `true` if a dynamic head tracker sensor (e.g. Pixel Buds Pro) is currently paired and reporting orientation. |
| `headTrackingMode` | `HeadTrackingMode` | enum | `'unsupported'`, `'disabled'`, `'relative_world'`, or `'relative_device'`. |
| `immersiveAudioLevel` | `number` | int | Level of immersive spatialization applied by audio DSP (0: none, 1: multichannel, 2: other). |
| `hasDynamicHeadTrackerFeature` | `boolean` | flag | `true` if device declares `feature:android.hardware.sensor.dynamic.head_tracker`. |
| `error` | `string \| null` | text | Latest error message if the Spatializer query failed, or `null`. |
| `source` | `TelemetrySource` | enum | `'hardware'` when read from genuine device HAL, `'unavailable'` on older OS or emulators. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `SpatialAudioInfo \| null` | Manually re-reads spatial audio status from the system AudioManager. |

### Example
```tsx
import { View, Text, Button } from 'react-native';
import { useSpatialAudio } from '@pixelkit-labs/sdk';

export function SpatialAudioCard() {
  const { isAvailable, isEnabled, hasHeadTracker, headTrackingMode, refresh } = useSpatialAudio();

  return (
    <View>
      <Text>Spatializer: {isAvailable ? 'Available' : 'Unavailable'}</Text>
      <Text>Spatial Audio: {isEnabled ? 'Enabled' : 'Disabled'}</Text>
      <Text>Head Tracker: {hasHeadTracker ? `Active (${headTrackingMode})` : 'None connected'}</Text>
      <Button title="Refresh Audio Status" onPress={() => refresh()} />
    </View>
  );
}
```

---

## `useCapabilities`

The first hook to call: it answers "does this device have that?" so an interface can hide what the phone cannot do instead of showing a control that will fail. Capabilities resolve from the model table, then upgrade to device-verified `PackageManager` feature flags when the PixelNative module is present. Memoised for the app lifetime. It reads `expo-device` and, when available, the native module; the result is computed once and reused.

### Signature
```typescript
function useCapabilities(): DeviceCapabilities;
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string` | Marketing model name, e.g. `"Pixel 11 Pro"`. |
| `isPhysicalDevice` | `boolean` | `false` on an emulator or on web, where hardware claims cannot be trusted. |
| `isPixel` | `boolean` | Whether this is any Google Pixel. |
| `pixelGeneration` | `number \| null` | Generation number, `11` for the Pixel 11 Pro. `null` when unknown. |
| `isProModel` | `boolean` | Pro, Pro XL or Pro Fold — the models with the Pro-exclusive hardware. |
| `isFoldable` | `boolean` | Any foldable Pixel. |
| `androidApiLevel` | `number \| null` | API level: 36 = Android 16, 37 = Android 17. `null` on web. |
| `hasHiLight` | `boolean` | Whether the HiLight LED array exists (Pixel 11 Pro family). |
| `hasUWB` | `boolean` | Whether a UWB radio exists. |
| `hasTitanM3` | `boolean` | Whether the Titan M3 security chip is expected, per Google's specification. It is not readable from the device. |
| `geminiNanoTier` | `GeminiNanoTier` | Which Nano tier AICore is expected to serve. `useGeminiNano().status` remains the runtime truth. |
| `supportsRangingApi` | `boolean` | Android 16+ unified `RangingManager` (UWB, BLE Channel Sounding, Wi-Fi RTT). |
| `supportsHapticEnvelopes` | `boolean` | Android 16+ `VibrationEffect.BasicEnvelopeBuilder`. |
| `supportsAppFunctions` | `boolean` | Android 16+ App Functions, which expose app capabilities to agents. |
| `supportsAndroid17Apis` | `boolean` | Android 17+ `AdvancedProtectionManager`, ML-DSA keys, Handoff, contacts picker. |
| `verification` | `'device' \| 'model-table'` | Whether the flags below were confirmed with `PackageManager.hasSystemFeature`, or inferred from the model name alone. Treat `'model-table'` as a hint. |
| `hasNFC` | `boolean \| null` | Device-verified NFC feature flag. `null` when not verified. |
| `hasBleChannelSounding` | `boolean \| null` | Device-verified BLE Channel Sounding support. |
| `hasWifiRtt` | `boolean \| null` | Device-verified Wi-Fi RTT (802.11mc) support. |
| `hasSatelliteTelephony` | `boolean \| null` | Device-verified satellite messaging support. |
| `hasStrongBox` | `boolean \| null` | Device-verified StrongBox Keymaster, which is what makes `useSecurity` hardware-backed. |
| `hasNpuFeature` | `boolean \| null` | Device-verified `android.hardware.neural_processing_unit` flag. |
| `aicoreVersion` | `string \| null` | AICore version name when installed. |

### Functions
`useCapabilities()` returns no callables; it is a resolved fact set.

### Example
```tsx
const caps = useCapabilities();
if (!caps.hasHiLight) return null; // do not offer the control at all
if (caps.verification === 'device' && caps.hasUWB) enableRanging();
```

---

## `useDisplay`

Display telemetry and control: the live refresh-rate mode, adaptive refresh rate (ARR) support, HDR capabilities and resolution from Android `Display`, plus brightness (`expo-brightness`) and the screen wake lock (`expo-keep-awake`). Refresh rate is re-read every 2 s because ARR changes it while you watch. It reads brightness once on mount and display information every 2,000 ms.

### Signature
```typescript
function useDisplay(): {
 isKeepAwake: boolean;
 brightness: number;
 refreshRateHz: number;
 hasArrSupport: boolean | null;
 supportedRefreshRates: number[];
 resolution: { width: number; height: number; densityDpi: number } | null;
 hdrTypes: number[];
 isHdr: boolean;
 maxLuminance: number | null;
 source: TelemetrySource;
 toggleKeepAwake: () => Promise<void>;
 setScreenBrightness: (value: number) => Promise<void>;
 setPreferredRefreshRate: (rateHz: number) => Promise<boolean>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isKeepAwake` | `boolean` | Whether this hook currently holds the wake lock. |
| `brightness` | `number` | Screen brightness 0–1, two decimals. `0` until read or when the permission has not been granted. |
| `refreshRateHz` | `number` | Refresh rate of the active mode, rounded. Changes live with ARR. `0` before the first read. |
| `hasArrSupport` | `boolean \| null` | Android 16+ adaptive refresh rate support. `null` when unknown. |
| `supportedRefreshRates` | `number[]` | Every rate the panel can drive, e.g. `[120, 60, 40, 30, 24, 20, 15, 10, 5, 2, 1]`. Empty before the read. |
| `resolution` | `{ width, height, densityDpi } \| null` | Physical resolution of the active mode and its density. `null` before the read. |
| `hdrTypes` | `number[]` | HDR types the panel reports: 1 Dolby Vision, 2 HDR10, 3 HLG, 4 HDR10+. |
| `isHdr` | `boolean` | Whether the display is in an HDR mode. |
| `maxLuminance` | `number \| null` | Peak luminance the platform reports, in nits. `null` when not reported — do not substitute a spec-sheet figure. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `toggleKeepAwake()` | none | `Promise<void>` — the new state lands in `isKeepAwake` | Acquires or releases a tagged screen wake lock, so the display does not dim during a long read or a capture. |
| `setScreenBrightness(value)` | `value: number` — 0 to 1, clamped | `Promise<void>` | Sets app-window brightness. No-op on web. Failures are logged and leave `brightness` unchanged. |
| `setPreferredRefreshRate(rateHz)` | `rateHz: number` — the rate to request for this window, e.g. 120 during an animation and 60 otherwise | `Promise<boolean>` — `true` when the request was applied | A request, not a guarantee: the system may pick a different mode. |

---

## `useDevice`

Model identity, battery level, fuel gauge thermistor temperature, real-time voltage/current/wattage, and connectivity in one object, with live listeners for battery state and native PMIC telemetry via `PixelNative`. It reads once on mount and then keeps `batteryPercent` and `isCharging` current through `expo-battery` listeners and `PixelNative.getBatteryTelemetry()`.

### Signature
```typescript
function useDevice(): DeviceTelemetry & {
 batteryPercent: number | null;
 batteryTemperatureC: number | null;
 batteryVoltageMv: number | null;
 batteryCurrentMa: number | null;
 batteryCurrentAvgMa: number | null;
 batteryPowerWatts: number | null;
 batteryHealth: 'GOOD' | 'OVERHEAT' | 'DEAD' | 'OVER_VOLTAGE' | 'UNSPECIFIED_FAILURE' | 'COLD' | 'UNKNOWN' | null;
 batteryCycleCount: number | null;
 batteryChargeCounterMah: number | null;
 batteryEnergyCounterMwh: number | null;
 batteryTechnology: string | null;
 pluggedSource: 'AC' | 'USB' | 'WIRELESS' | 'DOCK' | 'NONE' | null;
 batteryTelemetry: BatteryTelemetry | null;
 hasRead: boolean;
 error: string | null;
 source: TelemetrySource;
 refresh: () => Promise<void>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string` | Marketing model name from `expo-device`. |
| `brand` | `string` | Manufacturer brand, e.g. `"Google"`. |
| `osVersion` | `string` | Android version string. |
| `batteryPercent` | `number | null` | Charge as a percentage, 0–100, updated live. `null` until the first read — it is never reported as 0 to fill the gap. |
| `batteryPercent` | `number \| null` | Honest charge percentage, null until read. |
| `isCharging` | `boolean` | `true` while charging or full, on AC, USB, wireless or dock. |
| `lowPowerMode` | `boolean` | Whether Android Battery Saver is active. Back off from heavy work when it is. |
| `networkType` | `string` | Active interface type: `'WIFI'`, `'CELLULAR'`, `'UNKNOWN'`. For carrier detail use `useCellular`. |
| `isConnected` | `boolean` | Whether the device has an active, reachable network route. |
| `totalMemoryMB` | `number \| undefined` | Total system RAM in MB from `expo-device`. For live memory use `useMemory`. |
| `batteryTemperatureC` | `number \| null` | Real physical battery pack temperature in °C from the fuel gauge NTC thermistor. |
| `batteryVoltageMv` | `number \| null` | Instantaneous cell terminal voltage in mV (e.g. `4120 mV`). |
| `batteryCurrentMa` | `number \| null` | Instantaneous current flow in mA (negative discharging, positive charging). |
| `batteryCurrentAvgMa` | `number \| null` | Rolling average current flow in mA. |
| `batteryPowerWatts` | `number \| null` | Real-time system power consumption or fast-charging rate in Watts (V × \|I\|). |
| `batteryHealth` | `enum \| null` | Hardware health: `'GOOD'`, `'OVERHEAT'`, `'DEAD'`, `'OVER_VOLTAGE'`, `'COLD'`, `'UNKNOWN'`. |
| `batteryCycleCount` | `number \| null` | Lifetime charge cycle count from the fuel gauge EEPROM (Android 14+). |
| `batteryChargeCounterMah` | `number \| null` | Remaining charge capacity in mAh. |
| `batteryEnergyCounterMwh` | `number \| null` | Remaining energy stored in mWh. |
| `batteryTechnology` | `string \| null` | Battery chemistry string (e.g. `"Li-ion"`). |
| `pluggedSource` | `enum \| null` | Dedicated power supply source (`'AC'`, `'USB'`, `'WIRELESS'`, `'DOCK'`, `'NONE'`). |
| `batteryTelemetry` | `BatteryTelemetry \| null` | Full native battery telemetry structure including probed thermal zones. |
| `hasRead` | `boolean` | Whether any power or network value has been successfully read. |
| `error` | `string \| null` | Why the last read failed, or null. |
| `source` | `TelemetrySource` | `'hardware'`, `'derived'`, or `'unavailable'`. |

### Functions
| Function | Inputs | Output | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | None | `Promise<void>` | Re-reads power, PMIC fuel gauge, and connectivity state. |

---

## `useNetwork`

Connectivity, address and metering from `expo-network`. Being attached to Wi-Fi is not the same as having internet, so `isConnected` requires both a connection and a reachable route. Nothing is assumed before the first read: the type is `UNKNOWN` and `isConnected` is `false` until the platform answers.

For what kind of cellular connection this is, and which carrier, see [`useCellular`](#usecellular). It reads once on mount; each sub-read (address, state, airplane mode) fails independently so one missing value does not blank the rest.

### Signature
```typescript
function useNetwork(): NetworkTelemetry & {
 hasRead: boolean;
 isChecking: boolean;
 error: string | null;
 source: TelemetrySource;
 refreshNetwork: () => Promise<void>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `ipAddress` | `string \| null` | Address on the current interface. `null` when it could not be read. |
| `networkType` | `string` | `'WIFI'`, `'CELLULAR'`, `'NONE'` or `'UNKNOWN'`. `'UNKNOWN'` before the first read. |
| `isConnected` | `boolean` | Whether a usable internet route exists, not merely an attached interface. |
| `isMetered` | `boolean` | `true` on cellular, where the user pays per byte. Gate large downloads on it. |
| `isAirplaneMode` | `boolean` | Whether airplane mode is on. |
| `hasRead` | `boolean` | Whether a read has completed. Before it, the values above are defaults. |
| `isChecking` | `boolean` | `true` while a check is running. |
| `error` | `string \| null` | Why the last read failed. |
| `source` | `TelemetrySource` | `'hardware'` once a read has completed, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshNetwork()` | none | `Promise<void>` — the new state lands in the returned fields | Re-runs the connectivity check. Call it after the app returns to the foreground. |

---

## `useVideo`

Video playback on `expo-video`, the SDK 57 replacement for the removed `expo-av`. Pairs with `useCamera().startRecording()`: record a clip, then hand `lastVideoUri` to `load()`. The hook owns the player; a screen renders `<VideoView player={player} />`. Position and duration are polled four times a second, which is enough for a scrubber without waking the JS thread every frame.

### Signature
```typescript
function useVideo(initialSource?: VideoSource): {
 player: VideoPlayer;
 hasSource: boolean; isPlaying: boolean;
 positionSeconds: number; durationSeconds: number; bufferedSeconds: number;
 status: string; isMuted: boolean; isLooping: boolean; playbackRate: number; volume: number;
 error: string | null; source: TelemetrySource;
 load: (next: VideoSource, options?: { autoplay?: boolean; loop?: boolean; muted?: boolean }) => Promise<boolean>;
 play: () => void; pause: () => void; togglePlay: () => void;
 seekTo: (seconds: number) => void; seekBy: (seconds: number) => void; replay: () => void;
 setMuted: (muted: boolean) => void; setLoop: (loop: boolean) => void;
 setPlaybackRate: (rate: number) => void; setVolume: (value: number) => void;
 setKeepScreenOn: (keep: boolean) => void;
 generateThumbnails: (times: number | number[]) => Promise<VideoThumbnail[]>;
};
```

### Inputs
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialSource` | `VideoSource` | `null` | Source to create the player with: a file URI, a remote URL, a require'd asset, or `null` to start empty and call `load()` later. It also seeds `hasSource`. |

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `player` | `VideoPlayer` | Pass to `<VideoView player={player} />`. The hook owns its lifecycle. |
| `hasSource` | `boolean` | Whether a source has been loaded. |
| `isPlaying` | `boolean` | Whether playback is running, polled from the player. |
| `positionSeconds` | `number` | Seconds into the clip, two decimals. |
| `durationSeconds` | `number` | Total length in seconds. `0` until the source reports it. |
| `bufferedSeconds` | `number` | How far ahead the player has buffered — useful for a remote source. |
| `status` | `string` | Player status, e.g. `idle`, `loading`, `readyToPlay`, `error`. |
| `isMuted` / `isLooping` | `boolean` | Current mute and loop settings. |
| `playbackRate` | `number` | Speed multiplier; `1` is normal. Pitch is preserved by the player. |
| `volume` | `number` | Player volume 0–1. |
| `error` | `string \| null` | Why the last load, seek or playback call failed. |
| `source` | `TelemetrySource` | `'hardware'` once a source is loaded, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `load(next, options?)` | `next: VideoSource` — file URI, remote URL, asset or `null`. `options.autoplay?: boolean` — start playing as soon as it is ready. `options.loop?: boolean` — restart at the end. `options.muted?: boolean` — start muted. | `Promise<boolean>` — `true` when the source was replaced, `false` with `error` set on failure | Swaps the source, for example the clip `useCamera` just recorded. |
| `play()` / `pause()` / `togglePlay()` | none | `void` | Transport controls. |
| `seekTo(seconds)` | `seconds: number` — absolute position, clamped to `0..duration` | `void` | Jumps to a position. |
| `seekBy(seconds)` | `seconds: number` — relative offset; negative rewinds | `void` | Moves relative to the current position. |
| `replay()` | none | `void` | Restarts from the beginning and plays. |
| `setMuted(muted)` | `muted: boolean` | `void` | Mutes or unmutes without changing `volume`. |
| `setLoop(loop)` | `loop: boolean` | `void` | Turns looping on or off. |
| `setPlaybackRate(rate)` | `rate: number` — clamped to 0.25–4; `1` is normal | `void` | Changes speed with pitch preserved. |
| `setVolume(value)` | `value: number` — 0 to 1, clamped | `void` | Sets player volume. |
| `setKeepScreenOn(keep)` | `keep: boolean` | `void` | Keeps the screen awake while a video plays, so it does not dim mid-clip. |
| `generateThumbnails(times)` | `times: number \| number[]` — position(s) in seconds to extract | `Promise<VideoThumbnail[]>` — the frames as images; `[]` on failure with `error` set | Extracts frames for a filmstrip or a poster image. |

---

## `useMediaLibrary`

Saving captures to the device gallery and reading them back, on `expo-media-library`. Without this, a photo from `useCamera().takePicture()` or a clip from `startRecording()` lives in the app cache and disappears when the system reclaims it. `save()` promotes a capture into the user's media store, where it survives and is visible to every other app.

SDK 57 uses the class API (`Asset.create`, `Album.create`, `Query`) rather than the deprecated `createAssetAsync` helpers, which now throw at runtime. Android 13+ grants read access per media type, and the user may share only selected items, so a granted permission does not mean access to everything. It checks existing permission on mount without prompting; `save()` and `loadRecent()` prompt if needed.

### Signature
```typescript
function useMediaLibrary(): {
 permissionGranted: boolean;
 hasLimitedAccess: boolean;
 isSaving: boolean;
 isLoading: boolean;
 recent: SavedMedia[];
 lastSaved: SavedMedia | null;
 error: string | null;
 source: TelemetrySource;
 requestPermission: (writeOnly?: boolean) => Promise<boolean>;
 save: (localUri: string, albumName?: string) => Promise<SavedMedia | null>;
 loadRecent: (limit?: number) => Promise<SavedMedia[]>;
 remove: (media: SavedMedia) => Promise<boolean>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `permissionGranted` | `boolean` | Whether library access has been granted. |
| `hasLimitedAccess` | `boolean` | Android 13+: `true` when the user shared only selected items, so the library you can see is a subset. |
| `isSaving` | `boolean` | `true` while a save is in flight. |
| `isLoading` | `boolean` | `true` while the recent list is being read. |
| `recent` | `SavedMedia[]` | Newest items from the last `loadRecent()` call, newest first. |
| `lastSaved` | `SavedMedia \| null` | The item most recently written by this app. `null` until one is saved. |
| `error` | `string \| null` | Why the last permission request, save, read or delete failed. |
| `source` | `TelemetrySource` | `'hardware'` once permission is granted, `'unavailable'` otherwise. |

`SavedMedia` is `{ id, uri, filename, width, height, durationSeconds: number \| null, creationTime: number \| null }`; `durationSeconds` is `null` for stills.

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestPermission(writeOnly?)` | `writeOnly?: boolean` — ask only for write access, default `false`. Pass `true` when the app saves but never browses. | `Promise<boolean>` — whether access was granted | Prompts for library access and updates `permissionGranted` and `hasLimitedAccess`. |
| `save(localUri, albumName?)` | `localUri: string` — the file `useCamera` or `useAudio` returned. `albumName?: string` — album to file it under; it is created if it does not exist. | `Promise<SavedMedia \| null>` — the saved item, or `null` when permission was denied or the write failed | Copies a local file into the user's media store. |
| `loadRecent(limit?)` | `limit?: number` — how many items to read, default `20` | `Promise<SavedMedia[]>` — newest first; `[]` when permission was denied | Reads the newest items and writes them to `recent`. |
| `remove(media)` | `media: SavedMedia` — an item from `recent` or `lastSaved` | `Promise<boolean>` — `true` when the item was deleted | Deletes an asset from the device. The system may show its own confirmation. |

---

## `useCellular`

Mobile network telemetry on `expo-cellular`: carrier, radio generation and network codes. `useNetwork` can tell you the connection is cellular; it cannot tell you whether that is 5G or 2G, or who is serving it.

Two caveats. `generation` reflects the current data connection, so it changes as the phone moves and reads `unknown` with no cellular data attached, including on Wi-Fi. And carrier and network codes need the phone-state permission on Android; without it they stay `null` rather than being guessed at. It checks the existing permission and reads everything the platform will answer without prompting, on mount.

### Signature
```typescript
function useCellular(): {
 generation: 'unknown' | '2G' | '3G' | '4G' | '5G';
 is5G: boolean;
 carrierName: string | null;
 isoCountryCode: string | null;
 mobileCountryCode: string | null;
 mobileNetworkCode: string | null;
 allowsVoip: boolean | null;
 permissionGranted: boolean;
 error: string | null;
 source: TelemetrySource;
 refresh: () => Promise<void>;
 requestPermission: () => Promise<boolean>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `generation` | `'unknown' \| '2G' \| '3G' \| '4G' \| '5G'` | Radio generation of the current data connection. `'unknown'` with no cellular data attached. |
| `is5G` | `boolean` | Convenience for `generation === '5G'`. |
| `carrierName` | `string \| null` | Carrier name. `null` without the phone-state permission. |
| `isoCountryCode` | `string \| null` | ISO country of the SIM, e.g. `"gb"`. |
| `mobileCountryCode` | `string \| null` | MCC, the first half of the network identifier. |
| `mobileNetworkCode` | `string \| null` | MNC, the second half. Together MCC+MNC identify a carrier globally. |
| `allowsVoip` | `boolean \| null` | Whether the carrier permits voice over IP. `null` when it cannot be determined. |
| `permissionGranted` | `boolean` | Whether the phone-state permission has been granted. |
| `error` | `string \| null` | Why the last read or permission request failed. |
| `source` | `TelemetrySource` | `'hardware'` once a read has completed, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `Promise<void>` — the new values land in the returned fields | Re-reads everything the platform will answer without prompting. |
| `requestPermission()` | none | `Promise<boolean>` — whether it was granted | Asks for the phone-state permission, which unlocks carrier and network codes on Android, then refreshes. Generation is readable without it. |

### Example
```tsx
const cell = useCellular();
<Text>{cell.carrierName ?? 'Carrier hidden'} · {cell.generation}</Text>
{!cell.permissionGranted && <HapticButton title="Allow carrier details" onPress={cell.requestPermission} />}
```
