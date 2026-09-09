# PixelKit Hardware API Reference
> **Hook-by-hook reference for the Google Pixel 11 Pro build**

This document is the consolidated reference for every hook in the PixelKit SDK (React Native, Expo SDK 57) on the **Google Pixel 11 Pro** (Android 17, Google Tensor G6). Figures described as verified were read from the device with `adb` and `dumpsys`.

**How to read an entry.** Each hook lists where it lives, what hardware or platform API it sits on, what it does, its **Inputs** where it takes any, its **Outputs** (the returned object, with a link to the field-by-field table in the matching `docs/api/*` page) and its **Functions** (every callable, with what each parameter means and what the call returns). No hook fabricates a reading: a value that cannot be read is `null` and `source` reports `'unavailable'`.

---

## Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Silicon & Compute Hooks](#-silicon--compute-hooks) — [useCPU](#usecpu) · [useGPU](#usegpu) · [useTPU](#usetpu) · [useMemory](#usememory) · [useADPF](#useadpf)
3. [Pixel Pro Exclusive Silicon](#-pixel-pro-exclusive-silicon) — [useHiLight](#usehilight) · [useUWB](#useuwb)
4. [Neural & Intelligence Hooks](#-neural--intelligence-hooks) — [useGemini](#usegemini) · [useGeminiNano](#usegemininano) · [useGenAITasks](#usegenaitasks) · [useNaturalLanguageAI](#usenaturallanguageai) · [useSpeechAI](#usespeechai) · [useSpeech](#usespeech) · [useVisionAI](#usevisionai)
5. [Sensors & Physical Actuators](#-sensors--physical-actuators) — [useSensors](#usesensors) · [useCamera](#usecamera) · [useCameraExtensions](#usecameraextensions) · [useTorch](#usetorch) · [useHaptics](#usehaptics)
6. [Radios & Hardware Security](#-radios--hardware-security) — [useBiometrics](#usebiometrics) · [useSecurity](#usesecurity) · [useBLE](#useble) · [useNFC](#usenfc) · [useRadios](#useradios) · [useLocation](#uselocation)
7. [System & Media Hooks](#-system--media-hooks) — [useAudio](#useaudio) · [useVideo](#usevideo) · [useMediaLibrary](#usemedialibrary) · [useCellular](#usecellular) · [useCapabilities](#usecapabilities) · [useDisplay](#usedisplay) · [useDevice](#usedevice) · [useNetwork](#usenetwork)

---

## Architectural Overview

PixelKit exposes Pixel 11 Pro hardware to React Native through Expo modules and two local Kotlin Expo Modules.

<!-- diagram: sdk-surface -->

Every hook is exported from `./src`:
```typescript
import {
 useCPU, useGPU, useTPU, useMemory, useADPF,
 useHiLight, useUWB,
 useGemini, useGeminiNano, useGenAITasks, useNaturalLanguageAI, useSpeechAI, useSpeech, useVisionAI,
 useSensors, useCamera, useCameraExtensions, useTorch, useHaptics,
 useBiometrics, useSecurity, useBLE, useNFC, useRadios, useLocation,
 useAudio, useVideo, useMediaLibrary, useCellular, useCapabilities, useDisplay, useDevice, useNetwork,
} from '@pixelkit-labs/sdk';
```

---

## Silicon & Compute Hooks

> All silicon hooks read real device state through `PixelNative` (`packages/native`). Full field-by-field output tables live in [`docs/api/silicon-compute.md`](api/silicon-compute.md).

### `useCPU`
* **File Path**: `packages/sdk/src/hardware/useCPU.ts`
* **Target Hardware**: Google Tensor G6 7-core cluster. Verified from `/proc/cpuinfo` + cpufreq: **1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz**, governor `sched_pixel`. (Process node is not exposed by the device and is not claimed.)
* **Description**: Real topology, per-core current/max MHz, kernel governor, cluster frequency utilisation (hardware) and this app's CPU share (derived). Topology is read on mount; load polls every 1,000 ms.
* **Outputs**: [field table →](api/silicon-compute.md#usecpu)

```typescript
coreTopology: string; coreCount: number;
cpuLoadPercent: number | null; // cluster frequency utilisation, %
appCpuPercent: number | null; // this process's share of all cores, %
cores: { index; part; name; curMHz; maxMHz; minMHz }[];
clusters: { part; name; maxMHz; count }[];
governorMode: string; // read-only without root
lastBenchmarkDurationMs: number | null; isBenchmarking: boolean;
source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkCPU()` | none | `Promise<number>` — duration in ms, also stored in `lastBenchmarkDurationMs` | Real single-thread prime sieve on the JS thread. Blocks the UI while it runs. |

---

### `useGPU`
* **File Path**: `packages/sdk/src/hardware/useGPU.ts`
* **Target Hardware**: Verified via EGL: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`, OpenGL ES 3.2.
* **Description**: Renderer, vendor and GL version from an offscreen EGL context, Vulkan version from the system feature, and **Choreographer** frame pacing (presented FPS, average and max frame interval, jank frames above 1.5× expected). GPU memory is not exposed by Android → `null`. Identity is read on mount; frame stats arrive once per second as a native event.
* **Outputs**: [field table →](api/silicon-compute.md#usegpu)

```typescript
gpuRenderer: string | null; gpuVendor: string | null; graphicsApi: string | null;
frameRenderTimeMs: number | null; maxFrameMs: number | null; measuredFps: number | null;
droppedFrameCount: number; jankFramesLastSecond: number;
targetBudgetMs: number; // 8.33 @120 Hz
isStuttering: boolean; gpuMemoryUsageMB: null; source: TelemetrySource;
```

**Functions**: none — read-only telemetry.

---

### `useTPU`
* **File Path**: `packages/sdk/src/ai/useTPU.ts`
* **Target Hardware**: Tensor TPU via **AICore** (the Gemini Nano host). Verified: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`.
* **Description**: Detects the on-device AI stack (needs `<queries>` for package visibility). Real inference metrics live in `useGeminiNano()`; `benchmarkTPU()` runs a JS matmul labelled **CPU Fallback**. Detection runs once on mount.
* **Outputs**: [field table →](api/silicon-compute.md#usetpu)

```typescript
aicoreInstalled: boolean; aicoreVersion: string | null;
privateComputeServicesVersion: string | null; hasNpuFeature: boolean | null;
activeDelegate: 'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback';
isHardwareAccelerated: false;
lastInferenceLatencyMs: null; throughputTokensPerSec: null; memoryFootprintMB: null;
cpuFallbackLatencyMs: number | null; isBenchmarking: boolean; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkTPU()` | none | `Promise<TPUAcceleration>` — `{ activeDelegate: 'CPU Fallback', isHardwareAccelerated: false, lastInferenceLatencyMs, throughputTokensPerSec: null, memoryFootprintMB: null }` | Real 256×256 float matmul on the JS thread, reported honestly as a CPU number. |

---

### `useMemory`
* **File Path**: `packages/sdk/src/hardware/useMemory.ts`
* **Target Hardware**: 12 GB LPDDR5X (reports 11,647 MB total).
* **Description**: `ActivityManager.getMemoryInfo` (total, available, threshold, low-memory flag), plus this process's Java and native heaps, polled every 2 s.
* **Outputs**: [field table →](api/silicon-compute.md#usememory)

```typescript
totalRAMMB: number; freeRAMMB: number; usedRAMMB: number;
isLowMemory: boolean; lowMemoryThresholdMB: number;
appJavaHeapMB: number; appJavaHeapMaxMB: number; appNativeHeapMB: number;
source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `purgeCaches()` | none | `void` — the refreshed reading lands in the fields above | Requests a GC and re-reads. Frees this app's garbage only; it cannot free system RAM. |

---

### `useADPF`
* **File Path**: `packages/sdk/src/hardware/useADPF.ts`
* **Target Hardware**: Android Dynamic Performance Framework. Verified: headroom 0.55 at status NONE; thresholds `{1: 0.8, 2: 0.933, 3: 1.0, 4: 1.05, 5: 1.233, 6: 1.667}`.
* **Description**: `PowerManager.getThermalHeadroom` on a 10 s poll (Google's minimum) — **how close the phone is to throttling itself: 0.0 cold, 1.0 the point where clocks get cut, above 1.0 already throttling** ([what that means](api/silicon-compute.md#what-thermal-headroom-actually-means)) — a live thermal-status listener, headroom thresholds, Android 16+ `SystemHealthManager` CPU/GPU headroom, display-mode `targetFps` and Choreographer `currentFps`.
* **Outputs**: [field table →](api/silicon-compute.md#useadpf)

```typescript
thermalHeadroom: number | null; thermalThresholds: Record<string, number> | null;
thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical';
thermalStatusCode: number; cpuHeadroom: number | null; gpuHeadroom: number | null;
targetFps: number | null; currentFps: number | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `reportWorkDuration(actualWorkDurationMs, targetDurationMs?)` | `actualWorkDurationMs: number` — measured work time in ms. `targetDurationMs?: number` — budget, default `1000 / targetFps` (8.33 ms before the rate is known). | `'WITHIN_BUDGET'` or `'BOOST_REQUESTED'` | Pure helper comparing work against the frame budget; it does not call `PerformanceHintManager`. |

---

## Pixel Pro Exclusive Silicon

> Full field tables: [`docs/api/pro-exclusives.md`](api/pro-exclusives.md).

### `useHiLight`
* **File Path**: `packages/sdk/src/hardware/useHiLight.ts`
* **Target Hardware**: Eight `Light.LIGHT_TYPE_APPLICATION` RGB LEDs around the flash (ids 1-8, 33 ms update period) on Pixel 11 Pro-class devices.
* **Description**: Android restricts `CONTROL_DEVICE_LIGHTS` to signature|privileged permissions, so there is no public third-party API. `useHiLight` drives the real LEDs when the native PixelKit ADB daemon is running (`npm run hilight:daemon`; `availability: 'hardware'`). Without it the LEDs cannot be driven: `availability` is `'unavailable'` and the controls refuse rather than pretending. The daemon is probed on mount and every 5,000 ms.
* **Outputs**: [field table →](api/pro-exclusives.md#usehilight)

```typescript
availability: 'hardware' | 'unavailable' | 'unsupported';
isHardwareSupported: boolean; isDaemonConnected: boolean;
isActive: boolean; currentColor: string; mode: HiLightMode;
brightness: number; // 0.0 to 1.0, scales RGB
isFaceDownMode: boolean; error: string | null; source: TelemetrySource;
partial: string; // text streamed so far for the in-flight reply
lastFirstChunkMs: number | null; lastPromptTokens: number | null;
lastGrounding: { queries: string[]; sources: string[] } | null;
safetyThreshold: 'default' | HarmBlockThreshold; searchGrounding: boolean;

type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshDaemonStatus()` | none | `Promise<boolean>` — whether the daemon answered | Probes the daemon immediately instead of waiting for the poll. |
| `setColor(hexColor)` | `hexColor: string` — RGB hex, e.g. `'#81C995'` | `void` | Sets a solid colour and lights the ring. |
| `setMode(mode)` | `mode: HiLightMode` | `void` | Switches pattern; `'off'` extinguishes the ring. |
| `setBrightness(level)` | `level: number` — 0.0 to 1.0, clamped | `void` | Scales the RGB values sent to the daemon. |
| `triggerGeminiPulse(durationMs?)` | `durationMs?: number` — hold time, default `4000` | `void` | Cyan thinking hold that clears itself. |
| `triggerContactAlert(hexColor, durationMs?)` | `hexColor: string` — alert colour. `durationMs?: number` — hold time, default `5000`. | `void` | Coloured caller/event hold that clears itself. |
| `turnOff()` | none | `void` | Clears the ring and cancels the pending timer. |
| `toggle()` | none | `void` | Switches between off and a default blue glow. |

#### Example
```tsx
const hilight = useHiLight();
<HapticButton title="Pulse cyan" onPress={() => hilight.triggerGeminiPulse(4000)} disabled={hilight.availability !== 'hardware'} />
```

---

### `useUWB`
* **File Path**: `packages/sdk/src/hardware/useUWB.ts`
* **Target Hardware**: Ultra-Wideband transceiver (`UwbManager`, chip id `default`).
* **Description**: Chip state, enabled status and ranging-session management through Android `UwbManager`/`RangingManager`. `activeTargets` stays empty until paired UWB responders report. Radio state is read from the native module per render.
* **Outputs**: [field table →](api/pro-exclusives.md#useuwb)

```typescript
isSupported: boolean; isEnabled: boolean; chipId: string | null;
rangingApiSupported: boolean; isRanging: boolean;
activeTargets: UWBSpatialTarget[]; // { deviceId, distanceMeters, azimuthDegrees, elevationDegrees, signalQuality }
sessionInfo: UwbRangingResult | null; sessionError: string | null;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(sessionId?)` | `sessionId?: number` — session identifier, default `1001` | `Promise<boolean>` — `true` when the session opened; `false` with `sessionError` set | Opens a hardware ranging session and stores diagnostics in `sessionInfo`. |
| `stopRanging()` | none | `void` | Closes the session. Safe when nothing is running. |

---

## Neural & Intelligence Hooks

> Full field tables: [`docs/api/neural-ai.md`](api/neural-ai.md).

### `useGemini`
* **File Path**: `packages/sdk/src/ai/useGemini.ts`
* **Backing Service**: Google Gen AI SDK (`@google/genai`) on `gemini-3.8-flash`.
* **Description**: Multi-turn chat over `ai.chats` with a system instruction, API token counts and measured latency. Replies stream through `sendMessageStream`, and the session can carry safety thresholds and the Google Search grounding tool. There is no simulated fallback: without a key, `sendMessage` appends a `system`-role error. Changing the key, model or any generation parameter resets the session. As arguments; the setters below are the hook's inputs.
* **Outputs**: [field table →](api/neural-ai.md#usegemini)

```typescript
messages: AIMessage[]; // 'system' entries are local errors, not model output
isLoading: boolean; hasApiKey: boolean;
model: string; availableModels: string[];
temperature: number; topP: number; topK: number; maxOutputTokens: number;
systemInstruction: string; thinkingBudget: number;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `sendMessage(userPrompt)` | `userPrompt: string` — the user's turn; blank input is ignored | `Promise<void>` — reply appended to `messages` with `latencyMs` and `tokenCount` | Creates the session on first use, then sends. Errors arrive as `system` messages. |
| `clearMessages()` | none | `void` | Empties the history and resets the chat session. |
| `setApiKey(key)` | `key: string \| null` — the API key, or `null` to clear | `void` | Swaps the key, resets the session, refreshes `availableModels`. Persisting is `saveApiKey()`'s job. |
| `setSelectedModel(model)` | `model: string` — an id from `availableModels` | `void` | Switches model and resets the session. |
| `setTemperature(n)` / `setTopP(n)` / `setTopK(n)` | `n: number` — sampling controls; temperature typically 0–2, topP 0–1, topK a positive integer | `void` | Applied when the next session is created. |
| `setMaxOutputTokens(n)` | `n: number` — reply length ceiling | `void` | Longer replies cost more and take longer. |
| `setSystemInstruction(text)` | `text: string` — standing instruction; blank falls back to the default | `void` | Sets model behaviour for new sessions. |
| `setThinkingBudget(tokens)` | `tokens: number` — thinking tokens; `0` disables | `void` | Only sent when above zero. |
| `setSafety(threshold)` | `threshold: 'default' | HarmBlockThreshold` | `void` | One blocking threshold across all four harm categories; resets the session. |
| `setSearchGroundingEnabled(enabled)` | `enabled: boolean` | `void` | Attaches the `googleSearch` tool so the model can search before answering; resets the session. |
| `countTokens(text)` | `text: string` — prompt to measure | `Promise<number | null>` | Token cost of a prompt on the selected model, before sending. Writes `lastPromptTokens`. |

---

### `useGeminiNano`
* **File Path**: `packages/sdk/src/ai/useGeminiNano.ts` + `packages/mlkit` (Kotlin)
* **Target Hardware**: Gemini Nano on the Tensor G6 through **AICore**, reached with `com.google.mlkit:genai-prompt`. Verified with AICore `0.release.prod_aicore_20260723.00_RC11`.
* **Description**: Status, base model name, token limit and feature flags from `GenerativeModel`; download with progress events; streaming generation; latency and first-token time measured natively; output tokens from the on-device tokenizer. No cloud fallback, no simulated reply. As arguments. Generation parameters are held as state; per-call overrides go in `NanoOptions` (`systemInstruction`, `temperature`, `topK`, `candidateCount`, `maxOutputTokens`, `seed`, `thinking`, `imageBase64`).
* **Outputs**: [field table →](api/neural-ai.md#usegemininano)

```typescript
status: 'available' | 'downloadable' | 'downloading' | 'unavailable'; isAvailable: boolean;
info: NanoModelInfo | null; // baseModelName, tokenLimit, feature flags
messages: AIMessage[]; partial: string; thoughts: string[];
lastLatencyMs: number | null; lastFirstTokenMs: number | null;
lastOutputTokens: number | null; lastDecodeTokensPerSec: number | null;
downloadedBytes: number | null; isDownloading: boolean;
isWarmingUp: boolean; warmupMs: number | null;
isGenerating: boolean; error: string | null; source: TelemetrySource;
temperature: number; topK: number; candidateCount: number; maxOutputTokens: number;
thinkingMode: boolean; systemInstruction: string;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `Promise<void>` | Re-reads status and model facts from AICore. |
| `download()` | none | `Promise<NanoStatus>` | Fetches the model; progress lands in `downloadedBytes`. |
| `warmup()` | none | `Promise<number \| null>` — ms taken | Loads the model ahead of the first prompt. |
| `countTokens(prompt, options?)` | `prompt: string`. `options?: NanoOptions`. | `Promise<number \| null>` | Checks a prompt against `info.tokenLimit` before sending. |
| `generate(prompt, options?)` | `prompt: string` — the full prompt. `options?: NanoOptions` — including `imageBase64` for multimodal. | `Promise<NanoResult>` — `{ text, finishReason, thoughts, latencyMs, firstTokenMs }`; **throws** on failure | Single-shot generation, no history, no fallback. |
| `sendMessage(userPrompt)` | `userPrompt: string` — blank ignored | `Promise<void>` — reply appended to `messages` | Streaming chat turn; tokens accumulate in `partial`. |
| `clearMessages()` | none | `void` | Empties `messages` and `thoughts`. |
| `setModelConfig(stage, preference)` | `stage: 'stable' \| 'preview'`. `preference: 'full' \| 'fast'`. | `Promise<void>` | Switches the AICore track and refreshes. |
| `summarize(text, options?)` | `text: string`. `options.inputType?: 'article' \| 'conversation'`, `options.outputType?: 'one_bullet' \| 'two_bullets' \| 'three_bullets'`. | `Promise<SummarizeResult>` — `{ summary, latencyMs, engine, source }` | On-device summarization. |
| `proofread(text, options?)` | `text: string`. `options?: Record<string, any>`. | `Promise<ProofreadResult>` — `{ correctedText, suggestions, latencyMs, engine, source }` | On-device correction. |
| `rewrite(text, tone?)` | `text: string`. `tone?: 'elaborate' \| 'emojify' \| 'shorten' \| 'friendly' \| 'professional' \| 'rephrase'`. | `Promise<RewriteResult>` — `{ rewrittenText, suggestions, latencyMs, engine, source }` | On-device tone transformation. |
| `buildNanoTurn(history, user)` *(module export)* | `history: AIMessage[]` — `system` entries skipped. `user: string`. | `string` — transcript capped at 6,000 characters | Builds the prompt AICore actually receives. |

---

### `useGenAITasks`
* **File Path**: `packages/sdk/src/ai/useGenAITasks.ts` + `packages/mlkit` (Kotlin)
* **Target Hardware**: Tensor G6 via ML Kit GenAI task APIs on AICore.
* **Description**: Dedicated on-device task clients — summarize, proofread, rewrite, describe an image — each measured and reported with hardware provenance. Unlike the `useGeminiNano` equivalents these resolve to `null` on failure instead of throwing, and keep the last result in state. As arguments; each task takes its own text or image.
* **Outputs**: [field table →](api/neural-ai.md#usegenaitasks)

```typescript
isRunning: boolean; error: string | null; source: TelemetrySource;
summaryResult: SummarizeResult | null; proofreadResult: ProofreadResult | null;
rewriteResult: RewriteResult | null; imageDescriptionResult: ImageDescriptionResult | null;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `summarize(text, options?)` | `text: string` — article or transcript. `options.inputType?: 'article' \| 'conversation'`, `options.outputType?: 'one_bullet' \| 'two_bullets' \| 'three_bullets'`. | `Promise<SummarizeResult \| null>` | Nothing leaves the phone. |
| `proofread(text)` | `text: string` | `Promise<ProofreadResult \| null>` | Corrected text plus individual suggestions. |
| `rewrite(text, tone?)` | `text: string`. `tone?: TaskTone` — default `'professional'`. | `Promise<RewriteResult \| null>` | Changes tone or length, keeps meaning. |
| `describeImage(imageInput, style?)` | `imageInput: string` — file URI or base64. `style?: 'detailed' \| 'caption' \| 'labels' \| 'concise'` — default `'concise'`. | `Promise<ImageDescriptionResult \| null>` | On-device description, for alt text or a caption. |

---

### `useNaturalLanguageAI`
* **File Path**: `packages/sdk/src/ai/useNaturalLanguageAI.ts` + `packages/mlkit` (Kotlin)
* **Target Hardware**: ML Kit natural language models, entirely offline.
* **Description**: 58-language translation, language identification across 50+ languages with confidences, context-aware smart replies, and structured entity extraction (dates, addresses, flight numbers, money, phone numbers, tracking codes). As arguments. The first translation for a language pair downloads that model, so it is slower than the ones after it.
* **Outputs**: [field table →](api/neural-ai.md#usenaturallanguageai)

```typescript
isProcessing: boolean; error: string | null; source: TelemetrySource;
languageResult: LanguageIdResult | null; // { languageCode, possibleLanguages, latencyMs }
translationResult: TranslationResult | null; // { translatedText, sourceLanguage, targetLanguage, latencyMs }
smartReplyResult: SmartReplyResult | null; // { suggestions, status, latencyMs }
entityResult: EntityExtractionResult | null; // { entities: [{ type, text, start, end }], latencyMs }
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `identifyLanguage(text)` | `text: string` — a sample; a few words is usually enough | `Promise<LanguageIdResult \| null>` | Language plus runners-up with confidences. |
| `translate(text, sourceLang?, targetLang?)` | `text: string`. `sourceLang?: string` — BCP-47, default `'en'`. `targetLang?: string` — default `'es'`. | `Promise<TranslationResult \| null>` | Offline neural translation. |
| `suggestReplies(history)` | `history: Array<{ text; timestamp?; isLocalUser?; sender? }>` — conversation in order; `isLocalUser` marks this user's own messages | `Promise<SmartReplyResult \| null>` | Short contextual replies; empty when the model is not confident. |
| `extractEntities(text)` | `text: string` | `Promise<EntityExtractionResult \| null>` | Entities with their positions in the input. |

---

### `useSpeechAI`
* **File Path**: `packages/sdk/src/ai/useSpeechAI.ts`
* **Target Hardware**: Microphone (`VOICE_RECOGNITION` source, 16 kHz mono) plus Android System Intelligence on-device recognizer, or Gemini audio understanding in the cloud.
* **Description**: Dual-mode recognition. On-device streams partial text with dBFS metering and sends nothing off the phone; cloud records through `useAudio` and transcribes with Gemini. No simulated transcript in either mode. As arguments; choose the engine with `setRecognitionMode`, default `'on-device'`.
* **Outputs**: [field table →](api/neural-ai.md#usespeechai)

```typescript
isListening: boolean; isTranscribing: boolean;
recognitionMode: 'on-device' | 'cloud'; isOfflineAvailable: boolean;
streamingPartial: string; voiceDecibels: number; // dBFS
lastTranscript: SpeechTranscriptionResult | null; // confidence is null for cloud
lastRecordingUri: string | null; error: string | null;
source: TelemetrySource; model: string;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setRecognitionMode(mode)` | `mode: 'on-device' \| 'cloud'` | `void` | Chooses the engine for the next take. |
| `startListening()` | none | `Promise<boolean>` — `false` with `error` set when permission or the recognizer refused | Opens the microphone in the current mode. |
| `stopListeningAndTranscribe()` | none | `Promise<SpeechTranscriptionResult \| null>` — `{ transcript, confidence, durationSeconds, latencyMs, language }` | On-device returns the final result; cloud stops recording, uploads and transcribes. |

---

### `useSpeech`
* **File Path**: `packages/sdk/src/ai/useSpeech.ts`
* **Backing Module**: `expo-speech` on the platform speech service.
* **Description**: The output half of voice. `speak` resolves when the engine finishes, so utterances can be sequenced rather than overlapping. Text longer than `maxInputLength` is rejected rather than silently truncated. Voice coverage depends on what the user has installed, so read `voices` instead of assuming a language. The engine is stopped on unmount. As arguments. Per-utterance options are `{ language?, voice?, rate?, pitch?, volume? }`; `setVoice`, `setRate` and `setPitch` set the fallbacks.
* **Outputs**: [field table →](api/neural-ai.md#usespeech)

```typescript
isSpeaking: boolean; isPaused: boolean;
voices: Voice[]; // { identifier, name, language, quality }
voice: string | null; rate: number; pitch: number;
maxInputLength: number; lastSpokenText: string | null;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `speak(text, options?)` | `text: string` — trimmed; blank resolves immediately. `options.language?: string` — BCP-47 tag. `options.voice?: string` — identifier from `voices`, overrides `language`. `options.rate?: number` — 1 is normal. `options.pitch?: number` — 1 is normal. `options.volume?: number` — 0 to 1. | `Promise<void>` — resolves when the engine finishes or is stopped; **rejects** when the text exceeds `maxInputLength` or the engine errors | Await it to sequence utterances. |
| `stop()` | none | `Promise<void>` | Stops immediately. |
| `pause()` / `resume()` | none | `Promise<void>` — `pause` sets `error` where the engine does not support it | Pauses or continues an utterance. |
| `checkSpeaking()` | none | `Promise<boolean>` | Asks the engine directly rather than trusting the local flag. |
| `refreshVoices()` | none | `Promise<Voice[]>` | Re-reads installed voices, e.g. after a download in Settings. |
| `voicesForLanguage(languageTag)` | `languageTag: string` — `'en'` or `'en-GB'`, matched case-insensitively | `Voice[]` | Filters `voices` so you can offer a real choice. |
| `setVoice(id)` | `id: string \| null` — identifier, or `null` for the system default | `void` | Sets the default voice. |
| `setRate(n)` / `setPitch(n)` | `n: number` — 1 is normal | `void` | Set the fallbacks `speak` uses. |

---

### `useVisionAI`
* **File Path**: `packages/sdk/src/ai/useVisionAI.ts` + `packages/mlkit` (Kotlin)
* **Target Hardware**: Camera stack plus the ML Kit on-device vision suite, and Gemini multimodal in the cloud.
* **Description**: OCR v2, 1D/2D barcode and QR scanning, image labelling, face detection and 468-point 3D mesh, object detection and tracking, pose landmarks, selfie and subject segmentation, digital ink recognition — all on-device — plus cloud Gemini scene analysis with a JSON schema. As arguments. Every on-device function takes `imageInput: string`, **a file URI or a base64 image**; the cloud path needs base64, which is why `pickImage` requests it.
* **Outputs**: [field table →](api/neural-ai.md#usevisionai)

```typescript
isAnalyzing: boolean; analysis: VisionAnalysisResult | null;
selectedImageUri: string | null; selectedImageBase64: string | null; model: string;
isOnDeviceProcessing: boolean;
barcodeResult; ocrResult; facesResult; faceMeshResult; labelsResult;
objectsResult; poseResult; selfieResult; subjectResult; digitalInkResult;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `pickImage(useCamera?)` | `useCamera?: boolean` — `true` camera, `false` library; default `true` | `Promise<{ uri, base64? } \| null>` — `null` when cancelled or refused | Picks at 0.8 quality with base64. |
| `captureAndAnalyze(useCamera?)` | `useCamera?: boolean` — default `true` | `Promise<VisionAnalysisResult \| null>` — `{ description, labels, latencyMs, timestamp }` | Picks an image then asks Gemini for a description and 3–5 labels. |
| `scanBarcodes(imageInput)` | `imageInput: string` | `Promise<BarcodeScanResult \| null>` | 1D and 2D barcodes including QR. |
| `recognizeText(imageInput)` | `imageInput: string` | `Promise<TextRecognitionResult \| null>` | OCR with block and line structure. |
| `detectFaces(imageInput)` | `imageInput: string` | `Promise<FaceDetectionResult \| null>` | Tracking ids, head angles, smile and eye probabilities. |
| `detectFaceMesh(imageInput)` | `imageInput: string` | `Promise<FaceMeshResult \| null>` | 468-point mesh; needs a close-range face. |
| `labelImage(imageInput)` | `imageInput: string` | `Promise<ImageLabelResult \| null>` | Entity and scene labels with confidences. |
| `detectObjects(imageInput)` | `imageInput: string` | `Promise<ObjectDetectionResult \| null>` | Bounding boxes with tracking ids. |
| `detectPose(imageInput)` | `imageInput: string` | `Promise<PoseDetectionResult \| null>` | 33 skeletal landmarks. |
| `segmentSelfie(imageInput)` / `segmentSubject(imageInput)` | `imageInput: string` | `Promise<SelfieSegmentationResult \| null>` / `Promise<SubjectSegmentationResult \| null>` | Foreground and subject masks. |
| `recognizeDigitalInk(strokes, languageTag?)` | `strokes: Array<Array<{ x, y, t? }>>` — one array per stroke. `languageTag?: string` — e.g. `'en-US'`. | `Promise<DigitalInkResult \| null>` | Handwriting recognition, best candidate first. |

---

## Sensors & Physical Actuators

> Full field tables: [`docs/api/sensors-actuators.md`](api/sensors-actuators.md).

### `useSensors`
* **File Path**: `packages/sdk/src/hardware/useSensors.ts`
* **Target Hardware**: 6-axis IMU (accelerometer + gyroscope), magnetometer, barometer and ambient light sensor.
* **Description**: Continuous multi-sensor telemetry with a configurable rate. Relative altitude is derived from pressure with the international hypsometric formula, so it drifts with the weather and is not a GNSS altitude.
* **Outputs**: [field table →](api/sensors-actuators.md#usesensors)

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `updateIntervalMs` | `number` | `100` | Sampling period in ms for the IMU, magnetometer and barometer; the light sensor samples at twice this. Changing it re-subscribes every sensor. |

```typescript
accelerometer: Vector3D; // g
gyroscope: Vector3D; // rad/s
magnetometer: Vector3D; // μT
barometer: { pressure: number | null; relativeAltitude?: number | null };
lightLux?: number; isAvailable: boolean; hasMotionSample: boolean;
barometerAvailable: boolean | null; lightAvailable: boolean | null;
error: string | null; source: TelemetrySource;
```

**Functions**: none — change the rate by passing a different `updateIntervalMs`.

---

### `useCamera`
* **File Path**: `packages/sdk/src/hardware/useCamera.ts`
* **Backing Module**: `expo-camera`.
* **Description**: Lens selection, zoom, flash, torch and capture. The hook owns a ref to a `CameraView`, so a screen renders the view and attaches `cameraRef` and `handleCameraReady`. **`zoom` is a 0..1 fraction of the lens range, not an optical multiplier.** Camera Looks, Super Res Zoom and the low-light video mode belong to the Pixel Camera app and are interface state only. As arguments. Capture requires `cameraRef` on a mounted `<CameraView>`.
* **Outputs**: [field table →](api/sensors-actuators.md#usecamera)

```typescript
cameraRef: RefObject<CameraView | null>; // attach to your CameraView
viewProps: { facing, zoom, flash, enableTorch, mode };
facing: 'back' | 'front'; zoomFactor: number; // 0..1
flashMode: 'auto' | 'on' | 'off'; isTorchOn: boolean;
mode: 'picture' | 'video'; isReady: boolean; hasPermission: boolean;
isCapturing: boolean; lastPhoto: CapturedPhoto | null;
isRecording: boolean; recordingSeconds: number; lastVideoUri: string | null;
availableLenses: string[]; availablePictureSizes: string[];
selectedLook: CameraLook; // label only
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `handleCameraReady()` | none | `Promise<void>` | Pass to `onCameraReady`; sets `isReady` and reads lens and size lists. |
| `takePicture(options?)` | `quality?: number` — 0–1, default `0.85`. `base64?: boolean` — default `false`; needed by the AI hooks. `exif?: boolean` — default `false`. `shutterSound?: boolean` — default `true`. | `Promise<CapturedPhoto \| null>` — `{ uri, width, height, base64?, exif? }` | Writes to the app cache; use `useMediaLibrary().save()` to keep it. |
| `startRecording(options?)` | `maxDurationSeconds?: number`. `maxFileSizeBytes?: number`. `mirror?: boolean`. | `Promise<string \| null>` — the file URI, resolved **when recording ends** | Switches the view to video mode and records. |
| `stopRecording()` | none | `void` — resolves the pending `startRecording` promise | Ends the recording. |
| `toggleFacing()` | none | `void` | Front/rear camera. |
| `setZoom(fraction)` | `fraction: number` — 0 to 1, clamped | `void` | Do not pass `5` for "5x". |
| `setZoomStep(step, totalSteps?)` | `step: number`. `totalSteps?: number` — default `4`. | `void` | Evenly spaced zoom stops. |
| `setFlash(mode)` | `mode: 'auto' \| 'on' \| 'off'` | `void` | Flash behaviour for the next capture. |
| `toggleTorch()` | none | `void` | Continuous light through the preview. |
| `setMode(mode)` | `mode: 'picture' \| 'video'` | `void` | Recording requires `'video'`. |
| `setLook(look)` / `toggleUltraLowLightVideo()` | `look: CameraLook` / none | `void` | Interface labels only; they do not change the image. |
| `pausePreview()` / `resumePreview()` | none | `Promise<void>` | Freeze or restart the preview. |

---

### `useCameraExtensions`
* **File Path**: `packages/sdk/src/hardware/useCameraExtensions.ts`
* **Target Hardware**: Android Camera2 / CameraX `CameraExtensionCharacteristics` (API 31+). Verified on Pixel 11 Pro (`grizzly`): queries vendor extensions (Night Sight `EXTENSION_NIGHT`, Ultra HDR `EXTENSION_HDR`, Portrait Bokeh `EXTENSION_BOKEH`, Face Retouch `EXTENSION_FACE_RETOUCH`, Auto `EXTENSION_AUTOMATIC`).
* **Description**: Queries real camera HAL computational photography extension modes across all physical front and back camera sensors. Reports whether low-light Night Sight, HDR+ exposure stacking, and portrait blur are physically supported by the camera hardware.
* **Outputs**: [field table →](api/sensors-actuators.md#usecameraextensions)

```typescript
available: boolean; cameras: CameraExtensionInfo[];
hasNightSight: boolean; hasUltraHdr: boolean; hasPortraitBokeh: boolean;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `CameraExtensionsResult \| null` | Re-reads extension capabilities directly from the camera HAL. |

---

### `useTorch`
* **File Path**: `packages/sdk/src/hardware/useTorch.ts`
* **Target Hardware**: Rear camera flash LED via `CameraManager.setTorchMode` and Android 13+ `turnOnTorchWithStrengthLevel`. Verified: camera id 0, **21 brightness levels**; the camera HAL logs "Torch for camera id 0 turned on".
* **Description**: Real torch control; `isTorchOn` follows the system torch callback, so Quick Settings toggles are reflected. Strobe toggles the hardware at ≥120 ms. As arguments. Capabilities are read on mount; the LED is switched off on unmount.
* **Outputs**: [field table →](api/sensors-actuators.md#usetorch)

```typescript
isAvailable: boolean; isTorchOn: boolean; isStrobing: boolean;
maxStrengthLevel: number | null; error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setTorch(on, strengthLevel?)` | `on: boolean`. `strengthLevel?: number` — 1..`maxStrengthLevel`, Android 13+ only; omit for the device default. | `Promise<boolean>` — `false` when unavailable or the call threw | Drives the physical LED. |
| `toggleTorch()` | none | `Promise<boolean>` — the resulting state | Inverts state, stopping any strobe first. |
| `startStrobe(intervalMs?)` | `intervalMs?: number` — half-period, default `150`, clamped to ≥ `120` because the HAL needs ~50-100 ms per switch | `void` | Toggles the torch on a timer. |
| `stopStrobe()` | none | `void` | Cancels the timer and switches the LED off. |

---

### `useHaptics`
* **File Path**: `packages/sdk/src/hardware/useHaptics.ts`
* **Target Hardware**: LRA via `expo-haptics` plus `PixelNative` vibrator access. Verified: resonant **134.4 Hz**, Q 14.5, amplitude control, `CAP_COMPOSE_PWLE_EFFECTS_V2`, primitives CLICK/TICK/QUICK_RISE/SLOW_RISE/QUICK_FALL/THUD/SPIN/LOW_TICK.
* **Description**: Standard patterns, Android 16 envelope effects with presets (`HapticEnvelopes.thinkingRamp | doublePulse | spring`), and primitive compositions. Capabilities are read once per app process. As arguments.
* **Outputs**: [field table →](api/sensors-actuators.md#usehaptics)

```typescript
hasAmplitudeControl: boolean | null; envelopeSupported: boolean;
resonantFrequencyHz: number | null; supportedPrimitives: string[]; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `triggerHaptic(type?)` | `type?: HapticType` — `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error'`, default `'light'` | `Promise<void>` | Standard platform pattern; no-op on web. |
| `selection()` … `error()` | none | `Promise<void>` | Named shorthands for each type. |
| `playEnvelope(points, initialSharpness?)` | `points: { intensity: number; sharpness: number; durationMs: number }[]` — 0..1 values; the envelope must end at intensity 0, which the module appends. `initialSharpness?: number` — 0..1 starting sharpness. | `boolean` — `false` when unsupported or the call threw | Android 16+ amplitude/sharpness curve. Check `envelopeSupported`. |
| `playPrimitives(steps)` | `steps: { primitive: string; scale?: number; delayMs?: number }[]` — `scale` sets strength 0..1, `delayMs` the gap before that step | `boolean` | Android 11+ hardware primitive composition. |
| `cancel()` | none | `void` | Stops any vibration in progress. |

---

## Radios & Hardware Security

> Full field tables: [`docs/api/radios-security.md`](api/radios-security.md).

### `useBiometrics`
* **File Path**: `packages/sdk/src/hardware/useBiometrics.ts`
* **Target Hardware**: Under-display ultrasonic fingerprint and Class 3 face unlock, through the platform `BiometricPrompt`.
* **Description**: Sensor presence and enrolment are reported separately, because a device can have the sensor with nothing enrolled. A cancel or a mismatch resolves `false` without setting `error`; only a failed call does. As arguments. Capabilities are read on mount.
* **Outputs**: [field table →](api/radios-security.md#usebiometrics)

```typescript
hasHardware: boolean; isEnrolled: boolean; supportedTypes: string[];
hasChecked: boolean; lastResult: 'success' | 'failed' | 'cancelled' | null;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `authenticate(promptMessage?)` | `promptMessage?: string` — the line in the system sheet, default `'Verify identity with Pixel Biometrics'` | `Promise<boolean>` — `true` only on success | Shows the prompt with a passcode fallback; refuses up front when there is no hardware or enrolment. |
| `refresh()` | none | `Promise<void>` | Re-reads presence and enrolment, e.g. after the user returns from Settings. |

---

### `useSecurity`
* **File Path**: `packages/sdk/src/hardware/useSecurity.ts`
* **Target Hardware**: Android Keystore; StrongBox present on Pixel 11 Pro (`android.hardware.strongbox_keystore`, verified by `useCapabilities`).
* **Description**: Secret storage through `expo-secure-store` (AES keys in the Keystore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Secret values are never logged. No post-quantum algorithms are used; `isPostQuantumProtected` is always `false`. As arguments. On web it falls back to `localStorage`, which is not encrypted.
* **Outputs**: [field table →](api/radios-security.md#usesecurity)

```typescript
isHardwareBacked: boolean;
securityModule: 'Android Keystore' | 'none';
isPostQuantumProtected: false;
error: string | null; lastOperation: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `saveSecureItem(key, value)` | `key: string` — storage key. `value: string` — the secret; never logged. | `Promise<boolean>` — `false` with `error` set on failure | Encrypts and stores it. |
| `getSecureItem(key)` | `key: string` | `Promise<string \| null>` — `null` when absent or the read failed | Decrypts and returns the value. |
| `deleteSecureItem(key)` | `key: string` | `Promise<boolean>` | Removes the value. |

---

### `useBLE`
* **File Path**: `packages/sdk/src/hardware/useBLE.ts`
* **Target Hardware**: Bluetooth 5.4 Low Energy radio (`BluetoothAdapter`, `BluetoothManager`, `BluetoothLeScanner`).
* **Description**: Adapter state, Channel Sounding silicon support, real bonded devices, and live discovery with RSSI in dBm and a log-distance path-loss distance estimate (`n = 2.0`). As arguments. Discovery results are polled every 500 ms while scanning.
* **Outputs**: [field table →](api/radios-security.md#useble)

```typescript
isSupported: boolean; isEnabled: boolean;
state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
channelSounding: boolean; bondedDevices: BondedDevice[];
isScanning: boolean; peripherals: BLEPeripheral[];
scanError: string | null; error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startScan(timeoutMs?)` | `timeoutMs?: number` — auto-stop after this long, default `10000` | `Promise<boolean>` — `false` with `scanError` set when it could not start | Starts `BluetoothLeScanner` discovery. |
| `stopScan()` | none | `void` | Stops the scan and takes a final results sync. |

---

### `useNFC`
* **File Path**: `packages/sdk/src/hardware/useNFC.ts`
* **Target Hardware**: NFC controller (`NfcAdapter`), reader mode on the foreground Activity.
* **Description**: Adapter power and antenna state, Android 15+ Observe Mode capability, and real NDEF tag reading and writing. Reader mode needs a foreground Activity, so it stops when the app is backgrounded and must be restarted on resume. As arguments. Tag and error events are subscribed on mount; reader mode is released on unmount.
* **Outputs**: [field table →](api/radios-security.md#usenfc)

```typescript
isSupported: boolean; isEnabled: boolean; observeModeSupported: boolean;
antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE';
isReading: boolean;
lastScannedTag: ScannedTag | null; // id, payload, techs, records, maxSize, writable
tagCount: number; pendingWrite: string | null; lastWriteOk: boolean | null;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startReader()` | none | `Promise<boolean>` — `false` with a reason in `error` when there is no radio, NFC is off, or the build has no reader | Enables reader mode; tags then arrive as events. |
| `stopReader()` | none | `Promise<void>` | Disables reader mode and clears any pending write. |
| `writeText(text)` | `text: string` — the NDEF text record to write | `Promise<boolean>` — `true` when **queued**, not when written; the outcome arrives as `lastWriteOk` | Queues a write for the next tag. Requires the reader to be running. |
| `clearTag()` | none | `void` | Clears `lastScannedTag` and `lastWriteOk`. |

---

### `useRadios`
* **File Path**: `packages/sdk/src/hardware/useRadios.ts`
* **Target Hardware**: Unified radio subsystem (NFC, Bluetooth LE, UWB, Wi-Fi RTT, satellite).
* **Description**: One read across every radio, from `NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager` and `PackageManager`, refreshed every 5 s. Use it to decide which features to show at all. As arguments.
* **Outputs**: [field table →](api/radios-security.md#useradios)

```typescript
nfc: { supported; enabled; observeModeSupported; antennaState };
bluetooth: { supported; bleSupported; enabled; state; channelSounding; bondedDevices };
uwb: { supported; enabled; chipId; rangingApiSupported };
wifiRtt: { supported; available };
satellite: { supported };
source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` — the new reading lands in the fields above | Re-reads every radio immediately. Call it after sending the user to Settings. |

---

### `useLocation`
* **File Path**: `packages/sdk/src/hardware/useLocation.ts`
* **Target Hardware**: Dual-band multi-constellation GNSS (GPS L1/L5, Galileo, GLONASS, BeiDou).
* **Description**: One high-accuracy fix on mount, with position, altitude, heading and speed. Coordinates are never logged; events record accuracy and timing only. There is no continuous watch. As arguments.
* **Outputs**: [field table →](api/radios-security.md#uselocation)

```typescript
latitude: number; longitude: number; // 0 until hasFix
altitude: number | null; accuracy: number | null; // metres
heading: number | null; speed: number | null; // degrees, m/s
hasPermission: boolean; isLocating: boolean; hasFix: boolean;
lastFixAt: number | null; error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshLocation()` | none | `Promise<boolean>` — `true` when a fix arrived, `false` when permission was denied or the fix failed | Requests permission if needed and takes a fresh `Accuracy.Highest` fix. |

---

## System & Media Hooks

> Full field tables: [`docs/api/system-media.md`](api/system-media.md).

### `useAudio`
* **File Path**: `packages/sdk/src/hardware/useAudio.ts`
* **Target Hardware**: Multi-microphone array. `speech` uses the `VOICE_RECOGNITION` source (platform noise suppression), `studio` uses `unprocessed`.
* **Backing Module**: `expo-audio` (SDK 57). The legacy `expo-av` dependency has been removed.
* **Description**: Capture with pause and resume and an optional fixed duration; two profiles (16 kHz mono or 48 kHz stereo); dBFS metering every 100 ms with a running peak, a 0..1 `level` and a silence flag; microphone enumeration and selection; speaker/earpiece routing; and playback with seek. As arguments; per-take options go to `startRecording`.
* **Outputs**: [field table →](api/system-media.md#useaudio)

```typescript
isRecording: boolean; isPaused: boolean; canRecord: boolean;
permissionGranted: boolean; durationSeconds: number; quality: 'speech' | 'studio';
meteringDecibels: number; // dBFS, -160..0
peakDecibels: number; level: number; // level is 0..1, floored at -60 dBFS
isSilent: boolean; silenceThresholdDbfs: number;
inputs: RecordingInput[]; currentInputUid: string | null; route: 'speaker' | 'earpiece';
lastRecordingUri: string | null; isPlaying: boolean;
playbackPositionSeconds: number; playbackDurationSeconds: number;
source: TelemetrySource; error: string | null;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRecording(options?)` | `maxDurationSeconds?: number` — stop automatically. `quality?: 'speech' \| 'studio'` — profile for this take, which also becomes the active one. | `Promise<boolean>` — `false` when permission was denied or the recorder refused | Prepares the profile, starts metering and reads the input list. |
| `pauseRecording()` / `resumeRecording()` | none | `boolean` — whether the state changed | Pause without finalising the file, then continue the same take. |
| `stopRecording()` | none | `Promise<string \| null>` — the file URI | Finalises the file and sets `lastRecordingUri`. |
| `setQuality(quality)` | `quality: 'speech' \| 'studio'` | `void` | Applies to the next recording. |
| `refreshInputs()` | none | `RecordingInput[]` | Re-reads microphones; valid only once prepared. |
| `selectInput(uid)` | `uid: string` — a `uid` from `inputs` | `boolean` | Chooses the built-in array or an attached USB/Bluetooth mic. |
| `setRoute(route)` | `route: 'speaker' \| 'earpiece'` | `Promise<void>` | Routes playback at the audio-mode level. |
| `playLastRecording(uri?)` | `uri?: string` — defaults to `lastRecordingUri` | `Promise<boolean>` — `false` when there is nothing to play | Plays a recording and starts position polling. |
| `pausePlayback()` | none | `void` | Pauses where it is. |
| `stopPlayback()` | none | `Promise<void>` | Pauses and seeks to 0. |
| `seekPlayback(seconds)` | `seconds: number` — absolute, negatives clamped to 0 | `Promise<void>` | Jumps within the file. |
| `setSilenceThresholdDbfs(dbfs)` | `dbfs: number` — speech/silence boundary, default `-45` | `void` | Tunes what counts as silence. |

---

### `useVideo`
* **File Path**: `packages/sdk/src/hardware/useVideo.ts`
* **Backing Module**: `expo-video` (SDK 57 replacement for the removed `expo-av`).
* **Description**: Plays a local file or remote stream. The hook owns the player; a screen renders `<VideoView player={player} />`. Position, duration, buffered position and status are polled four times a second. Pairs with `useCamera().lastVideoUri`.
* **Outputs**: [field table →](api/system-media.md#usevideo)

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialSource` | `VideoSource` | `null` | Source to create the player with: a file URI, a remote URL, a required asset, or `null` to start empty and call `load()` later. |

```typescript
player: VideoPlayer; // pass to <VideoView player={player} />
hasSource: boolean; isPlaying: boolean; status: string;
positionSeconds: number; durationSeconds: number; bufferedSeconds: number;
isMuted: boolean; isLooping: boolean; playbackRate: number; volume: number;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `load(next, options?)` | `next: VideoSource`. `options.autoplay?: boolean`, `options.loop?: boolean`, `options.muted?: boolean`. | `Promise<boolean>` — `false` with `error` set on failure | Swaps the source, e.g. the clip just recorded. |
| `play()` / `pause()` / `togglePlay()` / `replay()` | none | `void` | Transport controls. |
| `seekTo(seconds)` | `seconds: number` — absolute, clamped to the duration | `void` | Jumps to a position. |
| `seekBy(seconds)` | `seconds: number` — relative; negative rewinds | `void` | Moves from the current position. |
| `setMuted(muted)` / `setLoop(loop)` | `boolean` | `void` | Mute and loop. |
| `setPlaybackRate(rate)` | `rate: number` — clamped 0.25–4; `1` is normal | `void` | Speed with pitch preserved. |
| `setVolume(value)` | `value: number` — 0 to 1, clamped | `void` | Player volume. |
| `setKeepScreenOn(keep)` | `keep: boolean` | `void` | Stops the screen dimming mid-clip. |
| `generateThumbnails(times)` | `times: number \| number[]` — seconds to extract | `Promise<VideoThumbnail[]>` — `[]` on failure | Frames for a filmstrip or poster. |

---

### `useMediaLibrary`
* **File Path**: `packages/sdk/src/hardware/useMediaLibrary.ts`
* **Backing Module**: `expo-media-library` (SDK 57 class API: `Asset.create`, `Album.create`, `Query`; the `createAssetAsync` helpers now throw).
* **Description**: Promotes a capture out of the app cache, where the system will eventually reclaim it, into the user's media store. Also lists recent items and deletes them. Android 13+ grants read access per media type and the user may share only selected items, reported as `hasLimitedAccess`. As arguments. Permission is checked on mount without prompting.
* **Outputs**: [field table →](api/system-media.md#usemedialibrary)

```typescript
permissionGranted: boolean; hasLimitedAccess: boolean;
isSaving: boolean; isLoading: boolean;
recent: SavedMedia[]; // { id, uri, filename, width, height, durationSeconds, creationTime }
lastSaved: SavedMedia | null;
error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestPermission(writeOnly?)` | `writeOnly?: boolean` — ask only for write access, default `false` | `Promise<boolean>` | Prompts and updates `permissionGranted` and `hasLimitedAccess`. |
| `save(localUri, albumName?)` | `localUri: string` — the file `useCamera` or `useAudio` returned. `albumName?: string` — album to file it under; created if missing. | `Promise<SavedMedia \| null>` | Copies the file into the user's media store. |
| `loadRecent(limit?)` | `limit?: number` — how many items, default `20` | `Promise<SavedMedia[]>` — newest first | Reads the newest items into `recent`. |
| `remove(media)` | `media: SavedMedia` — an item from `recent` or `lastSaved` | `Promise<boolean>` | Deletes it; the system may confirm. |

---

### `useCellular`
* **File Path**: `packages/sdk/src/hardware/useCellular.ts`
* **Backing Module**: `expo-cellular`. Carrier and network codes need `READ_PHONE_STATE`; generation does not.
* **Description**: Answers what `useNetwork` cannot: whether a cellular connection is 5G or something slower, and which carrier is serving it. `generation` follows the live data connection, so it changes as the device moves and reads `unknown` with no cellular data attached, including on Wi-Fi. Match carriers on the MCC/MNC pair rather than the display name. As arguments.
* **Outputs**: [field table →](api/system-media.md#usecellular)

```typescript
generation: 'unknown' | '2G' | '3G' | '4G' | '5G'; is5G: boolean;
carrierName: string | null; // null without READ_PHONE_STATE
isoCountryCode: string | null;
mobileCountryCode: string | null; mobileNetworkCode: string | null;
allowsVoip: boolean | null;
permissionGranted: boolean; error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `Promise<void>` | Re-reads everything the platform answers without prompting. |
| `requestPermission()` | none | `Promise<boolean>` — whether it was granted | Asks for `READ_PHONE_STATE`, which unlocks carrier and network codes, then refreshes. |

---

### `useCapabilities`
* **File Path**: `packages/sdk/src/hardware/useCapabilities.ts` (pure resolver in `packages/sdk/src/core/capabilities.ts`)
* **Target Hardware**: Device identity via `expo-device`, upgraded with `PackageManager.hasSystemFeature` through PixelNative.
* **Description**: Single source of truth for what this Pixel physically has and which platform APIs exist. Every Pro-exclusive hook and every Android 16/17-gated feature reads from it. Memoised for the app lifetime. As arguments.
* **Outputs**: [field table →](api/system-media.md#usecapabilities)

```typescript
modelName: string; isPhysicalDevice: boolean; isPixel: boolean;
pixelGeneration: number | null; isProModel: boolean; isFoldable: boolean;
androidApiLevel: number | null;
hasHiLight: boolean; // Pixel 11 Pro / Pro XL / Pro Fold
hasUWB: boolean; // Pro since Pixel 6 Pro, all Folds
hasTitanM3: boolean; // Pixel 11 family, per Google; not readable from the device
geminiNanoTier: 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none';
supportsRangingApi: boolean; // API 36+
supportsHapticEnvelopes: boolean; // API 36+
supportsAppFunctions: boolean; // API 36+
supportsAndroid17Apis: boolean; // API 37+
verification: 'device' | 'model-table';
hasNFC | hasBleChannelSounding | hasWifiRtt | hasSatelliteTelephony | hasStrongBox | hasNpuFeature: boolean | null;
aicoreVersion: string | null;
```

**Functions**: none — it is a resolved fact set.

---

### `useDisplay`
* **File Path**: `packages/sdk/src/hardware/useDisplay.ts`
* **Target Hardware**: 1-120 Hz LTPO OLED. Verified: active mode 120 Hz, `hasArrSupport = true`, rates 120/60/40/30/24/20/15/10/5/2/1 Hz, HDR10 · HLG · HDR10+, render mode 1080×2410 (panel native 1280×2856), 420 dpi.
* **Description**: Real `Display` mode telemetry polled every 2 s, `setPreferredRefreshRate(hz)` (confirmed as `frameRateOverride` in `dumpsys display`), brightness via expo-brightness and a tagged wake lock via expo-keep-awake. As arguments.
* **Outputs**: [field table →](api/system-media.md#usedisplay)

```typescript
refreshRateHz: number; hasArrSupport: boolean | null; supportedRefreshRates: number[];
resolution: { width; height; densityDpi } | null;
hdrTypes: number[]; isHdr: boolean; maxLuminance: number | null;
isKeepAwake: boolean; brightness: number; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `toggleKeepAwake()` | none | `Promise<void>` — new state in `isKeepAwake` | Acquires or releases a tagged screen wake lock. |
| `setScreenBrightness(value)` | `value: number` — 0 to 1, clamped | `Promise<void>` | Sets app-window brightness; no-op on web. |
| `setPreferredRefreshRate(rateHz)` | `rateHz: number` — the rate to request for this window | `Promise<boolean>` — `true` when applied | A request, not a guarantee: the system may pick another mode. |

---

### `useDevice`
* **File Path**: `packages/sdk/src/hardware/useDevice.ts`
* **Target Hardware**: Android HAL, PMIC, fuel gauge NTC thermistor, and Qi2 magnetic wireless charging.
* **Description**: Model identity, battery percentage, real-time NTC thermistor pack temperature (°C), cell terminal voltage (mV), current flow (mA), wattage rate (W), Battery Saver, battery health, and lifetime charge cycles. As arguments.
* **Outputs**: [field table →](api/system-media.md#usedevice)

```typescript
modelName: string; brand: string; osVersion: string;
batteryPercent: number | null; // null until read, never a filled-in 0
isCharging: boolean; lowPowerMode: boolean;
networkType: string; isConnected: boolean; totalMemoryMB?: number;
batteryTemperatureC: number | null; // Real NTC thermistor °C
batteryVoltageMv: number | null; // Cell terminal voltage (mV)
batteryCurrentMa: number | null; // Instantaneous mA (- discharging, + charging)
batteryPowerWatts: number | null; // Real-time power draw / charge speed (W)
batteryHealth: string | null; // GOOD, OVERHEAT, DEAD, etc.
batteryCycleCount: number | null; // Lifetime EEPROM charge cycles
batteryChargeCounterMah: number | null; // Remaining mAh
pluggedSource: string | null; // AC, USB, WIRELESS, DOCK, NONE
```

| Function | Inputs | Output | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | None | `Promise<void>` | Re-reads power, PMIC fuel gauge, and connectivity state. |

---

### `useNetwork`
* **File Path**: `packages/sdk/src/hardware/useNetwork.ts`
* **Target Hardware**: Modem and Wi-Fi radio, through `expo-network`.
* **Description**: Interface type, IP address, reachability, metering and airplane mode. Attached is not the same as reachable, so `isConnected` requires both. Each sub-read fails independently, so one missing value does not blank the rest. As arguments.
* **Outputs**: [field table →](api/system-media.md#usenetwork)

```typescript
ipAddress: string | null; networkType: string;
isConnected: boolean; isMetered: boolean; isAirplaneMode: boolean;
hasRead: boolean; isChecking: boolean; error: string | null; source: TelemetrySource;
```

| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshNetwork()` | none | `Promise<void>` — the new state lands in the fields above | Re-runs the connectivity check, e.g. when the app returns to the foreground. |

---

## Observability

Every hook reports provenance through `source: TelemetrySource` (`'hardware' | 'derived' | 'unavailable'`) and routes failures through `logError`, so nothing is swallowed. Timing helpers (`traced`, `tracedSafe`), event and metric recorders, and the diagnostics hook are documented with their own inputs and outputs in [`docs/api/silicon-compute.md#observability--provenance`](api/silicon-compute.md#observability--provenance).
