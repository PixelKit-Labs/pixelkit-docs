# PixelNative module

`packages/native` (Kotlin, Expo Modules API, autolinked from `./modules`). Requires a development build; on web and in Expo Go the TS bridge resolves to `null` and hooks report `unavailable`.

## Functions
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

## Events
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
