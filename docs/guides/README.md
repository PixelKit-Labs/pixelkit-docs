# PixelKit Guides: Built-in AI, Function Calling & Voice

> Production guides for building on the Pixel 11 Pro's on-device intelligence (Gemini Nano 4 via AICore), Gemini cloud models, and the phone's voice pipeline. Written for Expo SDK 57 / React Native 0.86 / Android 17 (API 37).

| Guide | What you will build |
| :--- | :--- |
| **[On-Device AI with Gemini Nano](./on-device-ai-gemini-nano.md)** | A local Expo Module that bridges the ML Kit GenAI Prompt API to React Native, a `useGeminiNano` hook, structured output, thinking mode, multimodal prompts, and a hybrid on-device / cloud router. |
| **[Function Calling & Tools](./function-calling.md)** | A single hardware tool registry that PixelKit hooks register into, executed by cloud Gemini (native function calling), by Gemini Nano on device (structured output), and exposed to the system Gemini assistant through Android AppFunctions. |
| **[Voice: Speech In, Speech Out, Live Agents](./voice.md)** | On-device streaming speech recognition (ML Kit GenAI Speech Recognition, Advanced mode on Pixel 10/11), realtime bidirectional voice agents with the Gemini Live API and ephemeral tokens, text-to-speech, and HiLight / haptic status feedback. |
| **[Autonomous E2E Testing with ARTEMIS](./testing-with-artemis.md)** | Autonomous end-to-end hardware verification on real Pixel devices using Google's ARTEMIS agent framework, testing genuine source: 'hardware' provenance across all 32 hooks. |

---

## 1. Decide where inference runs

Every AI feature in PixelKit should be routed through **one decision**, made once per request:

<!-- diagram: nano-routing -->

| Capability | Gemini Nano 4 on device (ML Kit Prompt API) | Gemini cloud (`@google/genai` 2.21) |
| :--- | :--- | :--- |
| Text generation, streaming | | |
| Image input | multiple images since Prompt API beta3 (Jul 2026) | many |
| Audio / video / PDF input | | |
| System instructions | Beta, `SystemInstruction` part, Nano V3+ | `systemInstruction` |
| Multi-turn chat with server-side history | (AICore is single-turn; you re-send context) | `ai.chats` |
| Structured output | Alpha, Kotlin `@Generable` classes | `responseJsonSchema` |
| Thinking mode | Beta, Nano V4+ | `thinkingConfig` |
| Native function calling | (emulate with structured output, see guide) | `functionDeclarations` |
| Realtime voice (Live API) | | `gemini-3.1-flash-live-preview` |
| Speech-to-text | GenAI Speech Recognition (Advanced on Pixel 10/11) | `gemini-3.5-transcribe` |
| Context limit | ~4,000 tokens total per request | 1M+ |
| Runs offline / zero cost / private | | |
| Foreground only | (AICore refuses background inference) | |
| Emulator support | physical device with AICore only | |

**Rule of thumb:** classification, extraction, summarisation, rewriting, short Q&A, image description, on-device tool selection → **Nano**. Anything conversational with memory, anything with tools that need cloud data, anything with audio in or out → **cloud**.

---

## 2. Pixel 11 Pro AI hardware facts that shape these guides

- **Tensor G6 TPU**: +50% TPU compute over G5; Google quotes on-device AI "3.5x faster, 3.5x less energy". Only reachable from apps via **AICore** (ML Kit GenAI, Firebase AI Logic hybrid, or the AICore Developer Preview with Gemma 4). There is no direct TPU handle.
- **Gemini Nano 4** ships on Pixel 11 (tier `nano-v4`). Pixel 9/10 get `nano-v3`. Nano 4 adds 140+ languages, better multimodal understanding, structured output and thinking. Two variants: E2B (fast) and E4B (full, better reasoning).
- **Android 17**: apps that touch the NPU directly must declare `android.hardware.neural_processing_unit`. ML Kit does not need it, but declare it `required="false"` if you also ship LiteRT models.
- **HiLight** (rear LED array) is what Google's own Gemini uses to show listening / thinking / responding when the phone is face down. There is **no third-party API**; PixelKit drives the same LEDs through the ADB daemon via `useHiLight`, and reports `unavailable` when the daemon is not running.
- **Mics**: multi-mic array with `VOICE_RECOGNITION` audio source giving hardware noise suppression. Use it, not `MIC`, for speech.
- **Keystore**: store the Gemini API key and ephemeral token secrets only through `useSecurity().saveSecureItem()`.

---

## 3. Build prerequisites shared by all three guides

Native AI modules cannot run in Expo Go. You need a **development build**.

```jsonc
// app.json
{
 "expo": {
 "plugins": [
 "expo-secure-store",
 "expo-audio",
 ["expo-build-properties", {
 "android": {
 "compileSdkVersion": 36,
 "targetSdkVersion": 36,
 "minSdkVersion": 26
 }
 }]
 ],
 "android": {
 "permissions": ["android.permission.RECORD_AUDIO", "android.permission.INTERNET"]
 }
 }
}
```

```bash
npm i expo-audio expo-speech expo-build-properties expo-dev-client
npx create-expo-module@latest --local # name it: mlkit
npx expo prebuild --platform android --clean
npx expo run:android # physical Pixel over USB
```

Validation gates remain `npm run typecheck` and `npx expo export -p android`. Add `adb logcat -s AICore:* MLKit:*` while testing on-device inference.

> **compileSdk note (Sept 2026):** Android 17's SDK is published only as minor-versioned platforms (`android-37.0`, `37.1`, `37.2`). AGP 8.12, which Expo 57 bundles, resolves `compileSdk 37` to `android-37` and fails with "Failed to find target with hash string 'android-37'". Stay on 36 (Play's current requirement) and use Android 17 APIs through reflection or `Build.VERSION.SDK_INT >= 37` guards until Expo adopts an AGP with minor-SDK support.

---

## 4. Sources

- [ML Kit GenAI overview](https://developers.google.com/ml-kit/genai) · [Prompt API get started](https://developers.google.com/ml-kit/genai/prompt/android/get-started) · [Structured output](https://developers.google.com/ml-kit/genai/prompt/android/structured-output) · [Thinking mode](https://developers.google.com/ml-kit/genai/prompt/android/thinking-mode) · [Speech Recognition API](https://developers.google.com/ml-kit/genai/speech-recognition/android)
- [Gemini Nano on Android](https://developer.android.com/ai/gemini-nano) · [Hybrid inference](https://developer.android.com/ai/hybrid) · [Firebase AI Logic hybrid (Android)](https://firebase.google.com/docs/ai-logic/hybrid/android/get-started)
- [AppFunctions overview](https://developer.android.com/ai/appfunctions) · [Add AppFunctions](https://developer.android.com/ai/appfunctions/add-appfunctions)
- [Gemini API function calling](https://ai.google.dev/gemini-api/docs/function-calling) · [Live API](https://ai.google.dev/gemini-api/docs/live) · [Live API guide](https://ai.google.dev/gemini-api/docs/live-guide) · [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) · [Models](https://ai.google.dev/gemini-api/docs/models)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/) · [Local Expo Modules](https://docs.expo.dev/modules/get-started/) · [expo-audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/)
- [Android Developers: Enhance your app for the new Pixel lineup](https://android-developers.googleblog.com/2026/08/pixel-app-experience-made-by-google.html)
