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
| `startUwbRanging(config)` | `config: UwbRangingConfig` — `{ sessionId, role: 'initiator' \| 'responder', localAddress, peerAddress, configId?, channel?, preambleIndex?, sessionKeyInfo?, updateRate?, slotDurationMs?, angleOfArrival? }`, all agreed with the peer out of band | `Promise<UwbRangingResult>` — `{ success, status, error, sessionId, technology, serviceAvailable, serviceName, rangingFeature, timestampMs }`; `status` is `'opened'` only after `RangingSession.Callback.onOpened`, otherwise `needs_peer_configuration`, `uwb_unsupported`, `ranging_api_unavailable`, `uwb_disabled`, `permission_denied`, `session_active`, `invalid_parameters` or `open_failed` | `android.ranging.RangingManager` (Android 16+, `android.permission.RANGING`) |
| `stopUwbRanging()` | none | `UwbStopResult` — `{ wasActive, closed, sessionId, error, timestampMs }`; `wasActive: false` when nothing was running | `RangingSession.stop` / `close` |
| `getUwbRangingState()` | none | `{ active, opened, sessionId }` | Session state held by the module |
| `isOfflineSpeechAvailable()` | none | `boolean` | `SpeechRecognizer.isOnDeviceRecognitionAvailable` |
| `startSpeechRecognition(requestId, onDevice)` | `requestId: string` — correlates the `onSpeech*` events. `onDevice: boolean` — require the on-device recognizer. | `Promise<boolean>` | `SpeechRecognizer` |
| `stopSpeechRecognition()` / `cancelSpeechRecognition()` | none | `boolean` | `SpeechRecognizer` |
| `getAppFunctions()` | none | `AppFunctionInfo[]` — `{ id, name, description, category, target, enabled }`; lists only functions `executeAppFunction` performs (`triggerHapticEffect`, `setTorchLevel`, `getSiliconStatus`, `scanNearbyRadios`) | App Functions registry |
| `executeAppFunction(functionId, params?)` | `functionId: string` — id from `getAppFunctions()`. `params?: Record<string, any>` — function-specific arguments. | `Promise<AppFunctionExecution>` — `{ status: 'success' \| 'error', message?, ...function fields }`; `status: 'error'` when the effect did not happen. Rejects with `E_APP_FUNCTION_UNKNOWN` for any other id. | App Functions dispatch |
| `getPerfettoInfo()` | none | `PerfettoInfo` — `{ isSupported, perfettoVersion, perfettoVersionReason, availableCategories, isTracing, backend, error? }` | `ProfilingManager` (Android 15+), `/system/bin/perfetto --version` |
| `startPerfettoTrace(categories?, bufferSizeKb?)` | `categories?: string[]` — atrace categories, applied only by the `perfetto_binary` backend. `bufferSizeKb?: number` | `Promise<PerfettoStartResult>` — `{ started, backend, activeCategories, categoriesApplied, error }`; `started: false` with the reason when no backend can start | `ProfilingManager.requestProfiling` (system trace) or `/system/bin/perfetto` |
| `stopPerfettoTrace()` | none | `Promise<PerfettoStopResult>` — `{ stopped, path, sizeBytes, error }`; `path` only when the file exists with a non-zero length | `CancellationSignal` / process stop, then `File.exists()` and `length()` |
| `startWifiRttRanging(bssids)` | `bssids: string[]` — BSSIDs of 802.11mc access points present in the latest scan results | `Promise<WifiRttStatusResult>` — `rangingResults` per AP (`distanceMm`, `distanceStdDevMm`, `rssi` null unless `status` is 0), `unresolvedBssids` with reasons, `failureCode`, `error` | `WifiRttManager.startRanging`, `WifiManager.getScanResults` |

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
| `onUwbRangingResult` | `UwbMeasurementEvent` — `{ sessionId, deviceId, distanceMeters, distanceConfidence, azimuthDegrees, azimuthConfidence, elevationDegrees, elevationConfidence, rssi, technology, timestampMs }`; nulls where the platform omitted a value | One `android.ranging.RangingData` sample from the peer |
| `onUwbRangingState` | `UwbSessionEvent` — `{ sessionId, state: 'opened' \| 'started' \| 'stopped' \| 'closed' \| 'open_failed', deviceId, reason, timestampMs }` | The ranging session changed state |
