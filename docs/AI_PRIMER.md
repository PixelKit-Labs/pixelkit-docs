# PixelKit AI Primer & Agent Guidance Manual
> **The Official Operating Manual for AI Coding Assistants Building on PixelKit (Google Pixel 11 Pro)**

---

## Purpose of this Primer

This document is the **canonical system prompt extension and operational primer** for any AI agent (Antigravity, Claude, ChatGPT, Cursor, Gemini) tasked with writing, refactoring, or expanding applications on top of the **PixelKit SDK** for the **Google Pixel 11 Pro** powered by the **Google Tensor G6 ("Malibu")** processor.

When generating code or architecting features, AI models must adhere strictly to the rules, hardware constraints, architectural patterns, and code recipes outlined herein.

---

## The 7 Golden Rules for AI Agents

### 1. The Single Import Rule
**NEVER** re-implement hardware wrappers, camera pickers, or sensor listeners from raw third-party packages. Import from the package, not from its internals:

```typescript
// CORRECT (centralised, typed, hardware-accelerated)
import {
 useCPU,
 useGPU,
 useTPU,
 useMemory,
 useSensors,
 useHaptics,
 useCamera,
 useHiLight,
 useSpeechAI,
 useGemini,
 useUWB,
 useSecurity
} from '@pixelkit-labs/sdk';

// Five hooks live behind the ML Kit subpath, because @pixelkit-labs/mlkit is an opt-in install
// that adds 19 artifacts to the APK. Importing them from the main barrel does not resolve.
import {
 useGeminiNano,
 useGenAITasks,
 useNaturalLanguageAI,
 useVisionAI,
 useEmbeddings
} from '@pixelkit-labs/sdk/mlkit';

// WRONG (never import raw unmanaged sensor listeners)
import * as Accelerometer from 'expo-sensors';
```

`PixelKitDevTools` is the only component the SDK ships. `HapticButton`, `MetricCard` and the rest of
the interface belong to [the template](https://github.com/PixelKit-Labs/pixelkit-template), so
import those from your own `src/components/` — not from `@pixelkit-labs/sdk`.

### 2. The Physical Sensation Rule (Tactile Haptics)
Every touchable element or significant state change **MUST** provide physical feedback via the Pixel's Linear Resonant Actuator (LRA):
* Subtle navigation / sliders $\rightarrow$ `haptics.selection()`
* Button taps $\rightarrow$ `haptics.light()`
* Modal popups / drawer reveal $\rightarrow$ `haptics.medium()`
* Confirmation / success $\rightarrow$ `haptics.success()` (double pulse)
* Dangerous action / destructive confirm $\rightarrow$ `haptics.heavy()`
* Warning / caution $\rightarrow$ `haptics.warning()`
* Validation error $\rightarrow$ `haptics.error()` (triple pulse)

### 3. The Thermal & Frame Budget Rule (ADPF)
The Pixel 11 Pro runs a 1-120 Hz LTPO display; at 120 Hz that is an **8.33 ms frame budget**:
* If rendering animations or complex graphics, inspect `useGPU().isStuttering` and `useADPF().thermalStatus`.
* When `thermalStatus === 'severe'` or `'critical'`, dynamically downscale background AI batch sizes and reduce sensor update intervals to 200ms or higher.

### 4. The True OLED Black Rule
Pixels utilize self-emissive Super Actua OLED panels. Always style dark backgrounds with the signature OLED true-black `#0E1119`. True black turns individual OLED pixels completely off, saving battery. The SDK exports no palette — the template holds this as `Colors.dark.background`, and in your own app it is whatever constant you define.

### 5. The Secure Storage Rule
Never write sensitive user data or API keys into plaintext AsyncStorage or unencrypted files. Always persist credentials through `useSecurity().saveSecureItem()` or `saveApiKey()`, which encrypt with a key held in the StrongBox-backed Android Keystore. `useGemini().setApiKey()` only swaps the key in memory; it does not persist it. No post-quantum algorithm is used: `isPostQuantumProtected` is always `false`.

### 6. The Visual Context Rule (React Grab & Android Layout)
When iterating on UI components:
* In Web Browser mode (`npm run web`), use **React Grab**: hold `Ctrl+C` (Windows) / `Cmd+C` (macOS) and click any component to copy its exact source location and component hierarchy for AI agents.
* On Android hardware/emulators, use `android layout` (JSON UI tree) and `android screen` (visual coordinates) from the Google Android CLI.

---

### 7. The Telemetry Provenance Rule (Nothing Is Simulated)
Every hook exposes `source: 'hardware' | 'derived' | 'unavailable'` (see `packages/sdk/src/core/observability.ts`). There is deliberately no `simulated` value: the type makes a fabricated reading unrepresentable. Never substitute a plausible default for a value that could not be read — render `null` as "—" and surface `source` next to the reading so the tag is visible. Radio adapter state (NFC antenna, Bluetooth controller, UWB chip) and live scans both report `hardware`, because both are real reads. HiLight drives the physical LEDs when the native ADB daemon is running (`npm run hilight:daemon`, `source: 'hardware'`); without the daemon its `availability` is `'unavailable'` and the control functions refuse rather than pretending. Log lifecycle and errors with `logEvent(module, event, data)` and `logError(module, event, error)`; both surface in the Observability panel and in `adb logcat -s ReactNativeJS | grep PixelKit`.

---

## Master Silicon & Hook Mapping Table

Every hook's full contract — each input with its default and units, each output field with its meaning, and each function with what it takes and returns — is on that hook's own page under [`docs/api/`](api/README.md). This table is the index.

| Component | Hook | Inputs | Key outputs | Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | none | `coreTopology`, `coreCount` (7), `cpuLoadPercent` (frequency utilisation, not scheduler load), `appCpuPercent`, `cores[]`, `governorMode` | `benchmarkCPU() → Promise<number>` ms |
| **PowerVR GPU** | `useGPU()` | none | `gpuRenderer`, `graphicsApi`, `frameRenderTimeMs`, `measuredFps`, `droppedFrameCount`, `isStuttering`, `gpuMemoryUsageMB` (always `null`; use `useSystemLoad().gpuMemoryUsedMB`) | none |
| **Whole-system CPU/GPU/TPU load** | `useSystemLoad()` | none | `isDaemonConnected`, `windowMs`, `cpuUtilizationPercent`, `cpuPerCorePercent`, `gpuUtilizationPercent`, `gpuFrequencyHz`, `gpuMemoryUsedMB`, `gpuTopProcesses`, `tpuUtilizationPercent`, `tpuPowerState`, per-section `*Source` / `*Error`, `error`, `source` — all `null` with a reason unless the ADB system-metrics daemon is running; TPU is `unavailable` unless real edgetpu events are observed | none |
| **Tensor TPU** | `useTPU()` | none | `aicoreInstalled`, `aicoreVersion`, `hasNpuFeature`, `activeDelegate`, `source` (`hardware` only when AICore is installed); inference metrics are `null` here — see `useGeminiNano` | `benchmarkTPU() → Promise<TPUAcceleration>` (CPU fallback, labelled) |
| **LPDDR5X RAM** | `useMemory()` | none | `totalRAMMB`, `usedRAMMB`, `freeRAMMB`, `isLowMemory`, `appJavaHeapMB` | `purgeCaches() → void` |
| **ADPF thermals / compute capacity** | `useADPF()` | none | `thermalHeadroom` (0 = cool, 1 = severe-throttling threshold), `thermalStatus`, `cpuHeadroom` / `gpuHeadroom` (Android 16+ available capacity, **not** thermal headroom or utilization), `cpuHeadroomUnavailableReason`, `gpuHeadroomUnavailableReason`, `targetFps`, `currentFps` | `reportWorkDuration(actualMs, targetMs?) → 'WITHIN_BUDGET' \| 'BOOST_REQUESTED'` |
| **HiLight LED ring** | `useHiLight()` | none | `availability` (`hardware` with the ADB daemon, `unavailable` without it), `isDaemonConnected`, `mode`, `currentColor`, `brightness`, `error` | `setColor(hex)`, `setMode(mode, hex?)`, `setBrightness(0..1)`, `triggerGeminiPulse(ms?)`, `triggerContactAlert(hex, ms?)`, `turnOff()`, `toggle()` — each `→ Promise<boolean>`, true only when the daemon accepted the command; state changes only then, and they resolve false (setting `error`) without the daemon |
| **UWB radar** | `useUWB()` | none | `isSupported`, `isEnabled` (`null` when Android does not let apps read it), `isRanging`, `measurements[]` (latest platform sample per peer), `sessionInfo`, `sessionError` | `startRanging(config: UwbRangingConfig) → Promise<boolean>` (needs the peer's `sessionId`, `role`, `localAddress`, `peerAddress`; false with the status in `sessionError` otherwise), `stopRanging() → UwbStopResult \| null` |
| **Camera & capture** | `useCamera()` | none (attach `cameraRef`) | `cameraRef`, `viewProps`, `zoomFactor` (0..1 fraction, not a multiplier), `lastPhoto`, `lastVideoUri`, `isRecording` | `takePicture({quality?, base64?, exif?}) → Promise<CapturedPhoto \| null>`, `startRecording({maxDurationSeconds?}) → Promise<string \| null>`, `stopRecording()`, `setZoom(0..1)` |
| **Video playback** | `useVideo()` | `initialSource?: VideoSource` | `player`, `positionSeconds`, `durationSeconds`, `status` | `load(source, {autoplay?, loop?, muted?}) → Promise<boolean>`, `play()`, `seekTo(seconds)`, `generateThumbnails(times)` |
| **Media library** | `useMediaLibrary()` | none | `recent[]`, `lastSaved`, `permissionGranted` (read grant), `hasLimitedAccess` | `save(localUri, albumName?) → Promise<SavedMedia \| null>` (requests write-only; named album needs read), `loadRecent(limit?)`, `remove(media)` |
| **Cellular modem** | `useCellular()` | none | `generation`, `is5G`, `carrierName` (needs the phone-state permission), `mobileCountryCode`, `mobileNetworkCode` | `refresh()`, `requestPermission() → Promise<boolean>` |
| **Sensors** | `useSensors(updateIntervalMs?)` | `updateIntervalMs` default `100` | `accelerometer` (g), `gyroscope` (rad/s), `magnetometer` (μT), `barometer` (hPa + relative metres), `lightLux`, `hasMotionSample` | none |
| **Text to speech** | `useSpeech()` | none | `voices[]`, versioned `speechEngines[]`, `lastSpeechIdentity`, `lastSynthesis`, `isSpeaking`, `maxInputLength`, `rate`, `pitch` | `speak(text, run, options?) → Promise<void>`, `resolveSpeechEngineIdentity(package, run, options?)`, `verifySpeechEngine(phrase, run, options)`, `getSpeechEngineStatus()`, `stop()`, `refreshSpeechEngines()`, `voicesForLanguage(tag)` |
| **Speech recognition** | `useSpeechAI()` | none | `isListening`, `voiceDecibels` (dBFS), `streamingPartial`, `lastTranscript`, `recognitionMode` | `setRecognitionMode('on-device' \| 'cloud')`, `startListening() → Promise<boolean>`, `stopListeningAndTranscribe() → Promise<SpeechTranscriptionResult \| null>` |
| **On-device GenAI** | `useGenAITasks()` | none | `summaryResult`, `proofreadResult`, `rewriteResult`, `imageDescriptionResult`, `isRunning` — each result has `engine` (`mlkit-*` task model, or `gemini-nano-prompt` when it fell back) | `summarize(text, options?)`, `proofread(text)`, `rewrite(text, tone?)`, `describeImage(input, style?)` — each `→ Promise<Result \| null>` |
| **On-device NLP** | `useNaturalLanguageAI()` | none | `languageResult`, `translationResult`, `smartReplyResult`, `entityResult` | `identifyLanguage(text)`, `translate(text, from?, to?)` (unsupported language tags fail instead of being replaced), `suggestReplies(history)`, `extractEntities(text)` (English only) |
| **Vision & OCR** | `useVisionAI()` | none (every call takes a file URI or base64) | `ocrResult`, `barcodeResult`, `labelsResult`, `facesResult`, `objectsResult`, `analysis` | `recognizeText(input)`, `scanBarcodes(input)`, `labelImage(input)`, `detectFaces(input)`, `captureAndAnalyze(useCamera?)` |
| **Conversational** | `useGemini()` | none (setters configure it) | `messages` (`system` role = local errors), `isLoading`, `hasApiKey`, `model`, `availableModels` | `sendMessage(prompt) → Promise<void>`, `clearMessages()`, `setApiKey(key)`, `setTemperature(n)` |
| **On-device Nano** | `useGeminiNano()` | none (setters configure it) | `status`, `info` (token limit, feature flags), `messages`, `partial`, `lastLatencyMs`, `lastFirstTokenMs`, `lastDecodeTokensPerSec` | `sendMessage(prompt)`, `generate(prompt, options?)`, `download()`, `warmup()`, `countTokens(prompt)` |
| **Bluetooth LE** | `useBLE()` | none | `state`, `channelSounding`, `bondedDevices[]`, `peripherals[]` (RSSI, wall-clock `lastSeenTimestamp`, `name` or `null`, and a derived distance estimate in metres), `isScanning`, `scanError` | `startScan(timeoutMs?) → Promise<boolean>`, `stopScan()` |
| **NFC radio** | `useNFC()` | none | `antennaState`, `observeModeSupported`, `lastScannedTag` (decoded NDEF records), `tagCount`, `lastWriteOk` | `startReader() → Promise<boolean>`, `stopReader()`, `writeText(text) → Promise<boolean>` (queues), `clearTag()` |
| **Hardware radios** | `useRadios()` | none | `nfc`, `bluetooth`, `uwb` (`enabled` may be `null`), `wifiRtt`, `thread` (`serviceFound` may be `null`), `satellite` blocks; `source` is `unavailable` until the first read | `refresh() → void` |
| **Flashlight** | `useTorch()` | none | `isAvailable`, `isTorchOn`, `isStrobing`, `maxStrengthLevel` (21 here) | `setTorch(on, strengthLevel?) → Promise<boolean>`, `toggleTorch()`, `startStrobe(intervalMs?)`, `stopStrobe()` |
| **120 Hz display** | `useDisplay()` | none | `refreshRateHz`, `supportedRefreshRates`, `hdrTypes`, `brightness`, `isKeepAwake` | `setPreferredRefreshRate(hz) → Promise<boolean>`, `toggleKeepAwake()`, `setScreenBrightness(0..1)` |
| **Biometrics** | `useBiometrics()` | none | `hasHardware`, `isEnrolled`, `supportedTypes`, `lastResult` | `authenticate(promptMessage?) → Promise<boolean>`, `refresh()` |
| **Secret storage** | `useSecurity()` | none | `isHardwareBacked`, `securityModule`, `isPostQuantumProtected` (always `false`), `lastOperation` | `saveSecureItem(key, value) → Promise<boolean>`, `getSecureItem(key) → Promise<string \| null>`, `deleteSecureItem(key)` |
| **GNSS location** | `useLocation()` | none | `latitude` / `longitude` (`null` until a fix), `altitude`, `accuracy` (metres), `hasFix` | `refreshLocation() → Promise<boolean>` |
| **Device & power** | `useDevice()` | none | `modelName` / `brand` / `osVersion` (`null` when unreported), `batteryPercent`, `batteryTemperatureC` (pack thermistor °C), `batteryVoltageMv`, `batteryCurrentMa`, `batteryPowerWatts`, `batteryCycleCount`, `isCharging` (charger attached or `null`; NOT_CHARGING while plugged is **not** discharging), `pluggedSource`, `batteryTelemetry.status`, `lowPowerMode` (`null` until read) | `refresh() → Promise<void>` |
| **Network** | `useNetwork()` | none | `ipAddress`, `networkType`, `isConnected` (reachable, not merely attached), `isMetered` (active network lacks `NET_CAPABILITY_NOT_METERED`; `null` when unreadable), `isAirplaneMode` (`null` when unreadable) | `refreshNetwork() → Promise<void>` |
| **Capabilities** | `useCapabilities()` | none | `hasHiLight`, `hasUWB`, `hasStrongBox`, `supportsHapticEnvelopes`, `verification` (`device` or `model-table`), `provenance` (per field: `hardware`, `derived` or `unavailable`; `hasHiLight`, `hasTitanM3` and `geminiNanoTier` are always `derived` from the model table) | none |
| **Haptics** | `useHaptics()` | none | `envelopeSupported`, `resonantFrequencyHz` (as the vibrator reports it, `null` otherwise), `supportedPrimitives[]` | `triggerHaptic(type?)`, `playEnvelope(points, initialSharpness?) → boolean`, `playPrimitives(steps) → boolean`, `cancel()` |
| **Microphone** | `useAudio()` | none | `meteringDecibels` (dBFS), `level` (0..1), `isSilent`, `durationSeconds`, `lastRecordingUri` | `startRecording({quality?, maxDurationSeconds?}) → Promise<boolean>`, `stopRecording() → Promise<string \| null>`, `playLastRecording(uri?)` |
| **ADPF · frame hints** | `useADPFHintSession(initialTargetDurationMs?: number, threadIds?: number[])` | `initialTargetDurationMs`, `threadIds` (default: the app's main thread) | `isSupported` (true only when `createHintSession` returned a session), `targetFrameDurationMs`, `error`, `source` | `reportWorkDuration(actualDurationNanos) → boolean`, `updateTargetWorkDuration(targetNanos) → boolean`, `closeSession() → boolean` |
| **barometer · altimetry** | `useAltimeter(updateIntervalMs?: number)` | `updateIntervalMs` | `altitudeM`, `altitudeFt`, `verticalVelocityMs`, `pressureHpa`, `seaLevelPressureHpa`, `pressureTrend` (`null` until 5 samples spanning 10 s exist) | `calibrateSeaLevel(hPa)`, `resetCalibration()` |
| **Android 17 AppFunctions** | `useAppFunctions()` | none | `isSupported`, `serviceFound`, `apiLevel`, `serviceName` (`null` when the service was not found), `functions`, `error` | `executeFunction(functionId, params?)`, `registerFunction(schema, handler)`, `unregisterFunction(functionId)` |
| **Qi TX · reverse charging** | `useBatteryShare()` | none | `isSupported`, `isActive`, `transmittedWatts` (always null: no readable node), `error`, `source` | `setBatteryShare(enabled) → Promise<boolean>` (true only when the node write succeeded), `refresh()` |
| **Camera2 extensions** | `useCameraExtensions()` | none | `available`, `cameras`, `hasNightSight`, `hasUltraHdr`, `hasPortraitBokeh`, `error` | `refresh()` |
| **BLE Channel Sounding** | `useChannelSounding()` | none | `isSupported`, `isEnabled`, `serviceFound`, `rangingAvailability`, `supportedSecurityLevels`, `isRanging`, `measurements` (per peer `distanceMeters`, `confidence`, `rssi`, each null when the platform omitted it), `sessionInfo`, `sessionError`, `error`, `source` | `startRanging({ peerAddress, role?, securityLevel?, sightType?, locationType?, updateRate? }) → Promise<boolean>` (false with the status in `sessionError`; the peer address is required and must never be invented), `stopRanging() → ChannelSoundingStopResult \| null`, `refresh()` |
| **battery · health · SoH** | `useChargingIntelligence()` | none | `stateOfHealthPercent`, `cycleCount`, `manufactureDate`, `firstUsageDate`, `chargingWattage`, `chargingTier` (null when no wattage was read), `chargeLimitAvailable` (null when unreadable), `error`, `source` | `refresh()` |
| **MediaPipe · Embeddings · CPU** | `useEmbeddings()` | none | `isAvailable`, `isLoading`, `vectorDimension`, `unavailableReason`, `error`, `source` | `embed(text)`, `cosineSimilarity(vecA, vecB)` |
| **Health Connect & Sensor Vitals** | `useHealthConnect()` | none | `isAvailable` and `sdkStatus` (inferred from the `healthconnect` service or the Health Connect package, not `HealthConnectClient.getSdkStatus()`), `hasStepCounter`, `hasHeartRateSensor`, `stepSensorName`, `heartRateSensorName` | `refresh()` |
| **Keystore ECDH key agreement** | `useKeyAgreement()` | none | `isStrongBoxSupported` (feature flag), `error`, `source` | `generateKeyPair(alias, preferStrongBox)` (`securityLevel` is read from `KeyInfo`, `null` when unreadable), `deriveSharedSecret(alias, peerPublicKeyBase64)` |
| **audio · mics** | `useMicrophoneArray()` | none | `microphones` (id, description, directionality, location, position, orientation as the platform reports them), `isSupported`, `error`, `source` | `refresh()` |
| **Perfetto Silicon Tracing** | `usePerfetto()` | none | `isSupported`, `isTracing`, `backend`, `perfettoVersion` (null with `perfettoVersionReason` when the app cannot run the binary), `availableCategories`, `activeCategories`, `lastTraceUri` (only when the file exists and is not empty), `lastTraceSizeBytes`, `error` | `startTrace(categories?, bufferSizeKb?) → Promise<boolean>` (false with `error` when no backend can start), `stopTrace() → Promise<string \| null>`, `beginSection(name)`, `endSection()`, `setCounter(name, value)`, `refresh()` |
| **Keystore attestation & security features** | `usePlayIntegrity()` | none | `isSupported`, `hasStrongBox`, `strongBoxVersion`, `hardwareKeystoreVersion`, `hasAppAttestKey`, `securityModelCompatible`, `playServicesAvailable` (no Play Integrity verdict is returned) | `requestAttestation(challenge?)` (returns the real certificate chain, base64, and the challenge used), `refresh()` |
| **Android 15 · Private Space** | `usePrivateSpace()` | none | `isInsidePrivateSpace`, `isPrivateSpaceConfigured` (`true` only when the app runs inside it, else `null`), `reason`, `error`, `source` | `refresh()` |
| **Satellite feature** | `useSatelliteNTN()` | none | `isSupported` (system feature); `connectionState`, `carrier`, `signalQualityBars`, `pointingGuidance` and `emergencyServicesReady` are always `null`, `unreadReason` says why | `refresh()` |
| **Android Spatializer** | `useSpatialAudio()` | none | `isSupported`, `isAvailable`, `isEnabled`, `hasHeadTracker`, `headTrackingMode`, `immersiveAudioLevel` | `refresh()` |
| **FIR · MLX90632 · thermal** | `useThermometer()` | none | `isSupported`, `sensorName`, `surfaceTemperatureC` / `surfaceTemperatureF` / `ambientTemperatureC` (null today: no verified sample decoder, reason in `error`), `error`, `source` | `refresh()` |
| **Wi-Fi 7 · 802.11be · MLO** | `useWifi7MLO()` | none | `isSupported`, `isMloActive` (associated to more than one link), `links` (`band`, `channel`, `rssi`, `txLinkSpeedMbps`, `rxLinkSpeedMbps`, `state`; unknown values `null`), `aggregateSpeedMbps` (sum of tx speeds of associated links), `error`, `source` | `refresh()` |
| **Wi-Fi RTT · 802.11az · FTM** | `useWifiRTT()` | none | `isSupported`, `isAvailable`, `isRanging`, `rangingResults` (per-AP `status`; distance/deviation/RSSI null unless `status` is 0), `unresolvedBssids` (`{ bssid, reason }`), `error`, `source` | `startRanging(bssids) → Promise<WifiRttResult[]>`, `refresh()` |
| **Cloud Hardware Agent** | `useCloudHardwareAgent(defaultOptions?: CloudAgentDefaults)` | `defaultOptions` (`model`, `systemInstruction`, `temperature`, `maxSteps`, `onStep`) | `isRunning`, `steps`, `lastResponse`, `lastResult`, `history`, `error`, `source` | `ask(prompt, run: CloudAgentOptions)` (`run.capabilityAdapter` and `run.context` required), `reset()` |
| **Gemini Live Streaming** | `useGeminiLive(config?: GeminiLiveConfig)` | `config` | `isConnected`, `isStreaming`, `isSpeaking` (model audio parts arriving; the hook does not play audio), `isListening` / `isStreamingMedia` (clear 2 s after the last chunk), `transcript`, `currentThinking`, `activeToolCalls`, `error`, `source`, `context` | `connect(run: GeminiLiveRunOptions) → Promise<GeminiLiveConnectResult>` (`run.context` and `run.capabilityAdapter` required), `disconnect()`, `sendText(text)`, `sendAudioChunk(pcmBase64)`, `sendImageChunk(base64, mime?)`, `sendVideoFrame(base64Jpeg)`, `sendMultimodalTurn(text, images?)`, `clearTranscript()` |

---

## System Prompt Directive for AI Agents

When instructing another AI model or configuring an IDE prompt, copy and paste this system prompt:

```markdown
You are building an application using the PixelKit SDK on a Google Pixel 11 Pro (Android 17, Google Tensor G6).
Always adhere to these requirements:
1. Import hardware and AI hooks from '@pixelkit-labs/sdk' (e.g. useCPU, useHiLight, useSensors, useGemini, useHaptics, useCamera). Five ML Kit hooks come from '@pixelkit-labs/sdk/mlkit' instead: useGeminiNano, useGenAITasks, useNaturalLanguageAI, useVisionAI, useEmbeddings.
2. Attach tactile haptic feedback (useHaptics) to all user interactions: selection for navigation, light for taps, success for completed actions, error for failures.
3. When running Gemini AI, trigger the rear HiLight ring via useHiLight().triggerGeminiPulse() for face-down visual signaling.
4. Treat Camera Looks and Super Res Zoom as Pixel Camera app features. useCamera() does capture (takePicture, startRecording) and exposes zoom as a 0..1 fraction, never an optical multiplier. Save captures with useMediaLibrary() or the system reclaims them.
5. Respect the 8.33ms 120Hz frame budget. Use useADPF() to check thermal state before heavy workloads.
6. Use true OLED black (#0E1119) for backgrounds. The SDK exports no palette; define the constant in your own app.
7. Store sensitive keys exclusively through useSecurity().saveSecureItem() (SecureStore, Android Keystore).
8. For Expo SDK 57 compatibility: expo-keep-awake uses activateKeepAwakeAsync(tag) / deactivateKeepAwake(tag).
```

---

## Production Code Recipes

Both recipes state what they take and what they give back. Full contracts are in the [API reference](api/README.md); more recipes are in [`ai-guidance/recipes.md`](ai-guidance/recipes.md).

### Recipe 1: cloud reasoning with HiLight feedback

**Takes** a prompt string. **Gives back** a reply appended to `gemini.messages` with `latencyMs` and `tokenCount`; a missing API key appends a `system`-role message instead of throwing. The ring only lights when the HiLight daemon is running.

```tsx
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useGemini, useHiLight, useHaptics } from '@pixelkit-labs/sdk';

export function SmartAssistant() {
 const gemini = useGemini();
 const hilight = useHiLight();
 const { light, success } = useHaptics();

 const handleAskAI = async () => {
 await light();
 if (hilight.availability === 'hardware') hilight.triggerGeminiPulse(5000);
 await gemini.sendMessage('Summarise the current thermal state.');
 await success();
 };

 return (
 <View style={{ padding: 16 }}>
 <Pressable onPress={handleAskAI} disabled={gemini.isLoading}>
 <Text>{gemini.isLoading ? 'Waiting on the cloud model…' : 'Ask assistant'}</Text>
 </Pressable>
 </View>
 );
}
```

### Recipe 2: capture and zoom

**Takes** capture options (`{ base64: true }` when the image is going to a model) and a zoom **fraction between 0 and 1** — not an optical multiplier. **Gives back** `{ uri, width, height, base64?, exif? }`, or `null` with the reason in `camera.error`.

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { Pressable } from 'react-native';
import { useCamera, useHaptics } from '@pixelkit-labs/sdk';

export function ProPhotoView() {
 const camera = useCamera();
 const { selection, error } = useHaptics();

 const capture = async () => {
 const photo = await camera.takePicture({ base64: true });
 if (!photo) await error(); // camera.error says why
 };

 return (
 <View style={{ flex: 1, padding: 16 }}>
 <CameraView ref={camera.cameraRef} onCameraReady={camera.handleCameraReady} {...camera.viewProps} style={{ flex: 1 }} />
 <Text>Zoom {Math.round(camera.zoomFactor * 100)}% of the lens range</Text>
 <Pressable onPress={() => { selection(); camera.setZoom(0); }}><Text>Widest</Text></Pressable>
 <Pressable onPress={() => { selection(); camera.setZoom(1); }}><Text>Longest</Text></Pressable>
 <Pressable onPress={capture}><Text>Capture</Text></Pressable>
 </View>
 );
}
```

---

## Anti-Patterns to Avoid

1. **Do not use `Alert.alert` for routine errors.** Use an in-app banner and a haptic (`haptics.error()`); every hook already exposes an `error` field to render.
2. **Do not block the JS thread with long synchronous loops.** `benchmarkCPU()` and `benchmarkTPU()` do exactly that on purpose, and say so; nothing else should.
3. **Do not poll sensors faster than you can use.** 100 ms (10 Hz) suits a UI readout; 16-33 ms is for animation. Faster costs battery and heat without adding resolution.
4. **Never store API keys in plaintext.** Always persist through `useSecurity().saveSecureItem()`, which encrypts with a key held in the Android Keystore.
5. **Never omit the KeepAwake tag.** In Expo SDK 57, `activateKeepAwakeAsync(tag)` needs a string tag or you get an unhandled rejection.
6. **Never substitute a plausible default for a value you could not read.** Render `null` as "—" and show the `source` tag; a fabricated number is worse than a blank.
