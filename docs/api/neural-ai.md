# Neural & AI API Reference
> **Gemini in the cloud, Gemini Nano on-device, ML Kit vision and language, speech in and out**

This document covers conversational reasoning, on-device generative tasks, speech recognition and synthesis, multimodal vision, and hardware-secured API key storage. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

---

## Module Index

* [`useGemini`](#usegemini) - Multi-turn cloud chat with full generation parameters
* [`useGeminiNano`](#usegemininano) - Gemini Nano on-device (ML Kit GenAI Prompt API on AICore)
* [`useGenAITasks`](#usegenaitasks) - On-device summarize, proofread, rewrite, describe
* [`useNaturalLanguageAI`](#usenaturallanguageai) - Offline translation, language ID, smart reply, entities
* [`useSpeechAI`](#usespeechai) - On-device and cloud speech recognition
* [`useSpeech`](#usespeech) - Text to speech on the platform engine
* [`useVisionAI`](#usevisionai) - ML Kit on-device vision plus Gemini scene analysis
* [`geminiClient`](#geminiclient) - Key storage, model listing, client factory

---

## `useGemini`

Official Google Gen AI SDK (`@google/genai`) on **`gemini-3.8-flash`** with real multi-turn history via `ai.chats.create()` and a system instruction. **There is no simulated fallback**: without an API key, `sendMessage` appends a `system`-role message containing `NO_API_KEY_MESSAGE`. Token counts come from the API's `usageMetadata`.

Changing the model, the key, or any generation parameter resets the chat session, because those settings are fixed when the session is created. It loads the stored key on mount and, when one exists, fetches the live model list. Everything else is set through the setters below, which are the hook's real inputs.

### Signature
```typescript
function useGemini(): {
 messages: AIMessage[];
 isLoading: boolean;
 hasApiKey: boolean;
 model: string;
 availableModels: string[];
 temperature: number; topP: number; topK: number; maxOutputTokens: number;
 systemInstruction: string; thinkingBudget: number;
 error: string | null;
 source: TelemetrySource;
 sendMessage: (userPrompt: string) => Promise<void>;
 clearMessages: () => void;
 setApiKey: (key: string | null) => void;
 setSelectedModel: (model: string) => void;
 setTemperature: (n: number) => void; setTopP: (n: number) => void; setTopK: (n: number) => void;
 setMaxOutputTokens: (n: number) => void;
 setSystemInstruction: (text: string) => void;
 setThinkingBudget: (tokens: number) => void;
 partial: string;
 lastFirstChunkMs: number | null;
 lastPromptTokens: number | null;
 lastGrounding: GroundingSummary | null;
 safetyThreshold: 'default' | HarmBlockThreshold;
 searchGrounding: boolean;
 setSafety: (threshold: 'default' | HarmBlockThreshold) => void;
 setSearchGroundingEnabled: (enabled: boolean) => void;
 countTokens: (text: string) => Promise<number | null>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `messages` | `AIMessage[]` | The conversation: `{ id, role, content, timestamp, latencyMs?, tokenCount? }`. Model replies carry the measured round-trip latency and the API's total token count. **`role: 'system'` entries are local errors, not model output.** |
| `isLoading` | `boolean` | `true` while a request is in flight. |
| `hasApiKey` | `boolean` | Whether a key is loaded from SecureStore or the environment. Without it, sending appends the "no key" message. |
| `model` | `string` | Model id in use, `'gemini-3.8-flash'` by default. |
| `availableModels` | `string[]` | Models the API lists for this key, filtered to Gemini text models. Falls back to a curated default list when offline or unconfigured. |
| `temperature` | `number` | Sampling temperature sent with the session, default `0.4`. |
| `topP` | `number` | Nucleus sampling cutoff, default `0.95`. |
| `topK` | `number` | Top-k sampling cutoff, default `40`. |
| `maxOutputTokens` | `number` | Ceiling on reply length, default `2048`. |
| `systemInstruction` | `string` | The instruction the session was created with. Defaults to the PixelKit assistant instruction. |
| `thinkingBudget` | `number` | Thinking tokens requested, default `0` (off). Above zero, `thinkingConfig` is sent with the session. |
| `error` | `string \| null` | Latest failure message, or `null`. Failures are also logged and counted. |
| `source` | `TelemetrySource` | Cloud model: reachable only with a key and a network route. |
| `partial` | `string` | Text streamed so far for the in-flight reply, empty between turns. Replies arrive through `sendMessageStream`, so render this for a live typing effect. |
| `lastFirstChunkMs` | `number | null` | Time to the first streamed chunk of the last reply, in ms. `null` before the first reply. |
| `lastPromptTokens` | `number | null` | Token count from the last `countTokens()` call. `null` until you call it. |
| `lastGrounding` | `GroundingSummary | null` | `{ queries: string[]; sources: string[] }` from the last grounded reply: what the model searched for and the URIs it used. `null` when grounding was off or the model did not search. |
| `safetyThreshold` | `'default' | HarmBlockThreshold` | Blocking threshold applied to all four harm categories. `'default'` sends no `safetySettings` at all. |
| `searchGrounding` | `boolean` | Whether the `googleSearch` tool is attached to the session. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `sendMessage(userPrompt)` | `userPrompt: string` — the user's turn; empty or whitespace-only input is ignored | `Promise<void>` — the reply lands in `messages`; errors land there too, as a `system` entry | Appends the user turn, creates the chat session on first use, and sends. Records latency and token count on the reply. |
| `clearMessages()` | none | `void` | Empties `messages` **and** resets the chat session, so the next turn starts with no history. |
| `setApiKey(key)` | `key: string \| null` — the API key, or `null` to clear it | `void` | Swaps the key, resets the session and refreshes `availableModels`. Persisting the key is `saveApiKey()`'s job. |
| `setSelectedModel(model)` | `model: string` — an id from `availableModels` | `void` | Switches model and resets the session. |
| `setTemperature(n)` | `n: number` — typically 0–2; lower is more deterministic | `void` | Takes effect on the next session. |
| `setTopP(n)` | `n: number` — 0–1 | `void` | Nucleus sampling cutoff. |
| `setTopK(n)` | `n: number` — positive integer | `void` | Top-k sampling cutoff. |
| `setMaxOutputTokens(n)` | `n: number` — token ceiling for a reply | `void` | Longer replies cost more and take longer. |
| `setSystemInstruction(text)` | `text: string` — the standing instruction; empty falls back to the default | `void` | Sets the model's behaviour for new sessions. |
| `setThinkingBudget(tokens)` | `tokens: number` — thinking tokens; `0` disables thinking | `void` | Only sent when above zero. |
| `setSafety(threshold)` | `threshold: 'default' | HarmBlockThreshold` — `BLOCK_NONE`, `BLOCK_ONLY_HIGH`, `BLOCK_MEDIUM_AND_ABOVE` or `BLOCK_LOW_AND_ABOVE` from `@google/genai` | `void` | Applies one threshold to harassment, hate speech, sexually explicit and dangerous content, and resets the session. |
| `setSearchGroundingEnabled(enabled)` | `enabled: boolean` — attach the `googleSearch` tool | `void` | Lets the model search the web before answering; it decides per turn whether to. Resets the session. |
| `countTokens(text)` | `text: string` — the prompt to measure; blank input skips the call | `Promise<number | null>` — the count, or `null` without a key or on failure | Asks the API what a prompt costs on the selected model before you send it. Also writes `lastPromptTokens`. |

### Example
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useGemini, useHiLight, HapticButton } from '@pixelkit-labs/sdk';

export function AssistantChat() {
 const gemini = useGemini();
 const hilight = useHiLight();
 const [input, setInput] = useState('');

 const handleSend = async () => {
 if (!input.trim()) return;
 const text = input;
 setInput('');
 hilight.triggerGeminiPulse(4000); // cyan while the model is thinking
 await gemini.sendMessage(text);
 };

 return (
 <View>
 {gemini.messages.map(m => <Text key={m.id}>[{m.role}]: {m.content}</Text>)}
 <TextInput value={input} onChangeText={setInput} placeholder="Ask assistant…" />
 <HapticButton title="Send" onPress={handleSend} disabled={gemini.isLoading} />
 </View>
 );
}
```

---

## `useGeminiNano`

Gemini Nano on-device through the local `packages/mlkit` Expo Module, which wraps `com.google.mlkit:genai-prompt` (the ML Kit GenAI Prompt API on AICore). Status, base model name, token limit and feature flags come from `GenerativeModel`; latency and time-to-first-token are measured around the native call; token counts come from the on-device tokenizer.

AICore keeps no conversation state, so `buildNanoTurn()` re-sends a capped transcript (6,000 characters, newest turns first) with the system instruction. **There is no cloud fallback and no simulated reply**: when the model is not `available`, `sendMessage` appends a `system`-role error.

Requires a dev client or release APK on a device with AICore (Pixel 9 and later; verified on Pixel 11 Pro). On web and in Expo Go the module resolves to `null` and `source` is `'unavailable'`. It reads model info on mount and subscribes to download progress. Generation parameters are held as state and applied to every call; per-call overrides go in the `NanoOptions` argument of `generate` and `countTokens`.

### Signature
```typescript
function useGeminiNano(): {
 status: 'available' | 'downloadable' | 'downloading' | 'unavailable';
 isAvailable: boolean;
 info: NanoModelInfo | null;
 messages: AIMessage[]; partial: string; thoughts: string[];
 lastLatencyMs: number | null; lastFirstTokenMs: number | null;
 lastOutputTokens: number | null; lastDecodeTokensPerSec: number | null;
 downloadedBytes: number | null; isDownloading: boolean;
 isWarmingUp: boolean; warmupMs: number | null;
 isGenerating: boolean; error: string | null; source: TelemetrySource;
 temperature: number; topK: number; candidateCount: number; maxOutputTokens: number;
 thinkingMode: boolean; systemInstruction: string;
 setTemperature: (n: number) => void; setTopK: (n: number) => void;
 setCandidateCount: (n: number) => void; setMaxOutputTokens: (n: number) => void;
 setThinkingMode: (on: boolean) => void; setSystemInstruction: (text: string) => void;
 refresh: () => Promise<void>;
 download: () => Promise<NanoStatus>;
 warmup: () => Promise<number | null>;
 countTokens: (prompt: string, options?: NanoOptions) => Promise<number | null>;
 generate: (prompt: string, options?: NanoOptions) => Promise<NanoResult>;
 sendMessage: (userPrompt: string) => Promise<void>;
 clearMessages: () => void;
 setModelConfig: (stage: 'stable' | 'preview', preference: 'full' | 'fast') => Promise<void>;
 summarize: (text: string, options?: SummarizeOptions) => Promise<SummarizeResult>;
 proofread: (text: string, options?: Record<string, any>) => Promise<ProofreadResult>;
 rewrite: (text: string, tone?: TaskTone) => Promise<RewriteResult>;
};
```

| `NanoOptions` field | Type | Description |
| :--- | :--- | :--- |
| `systemInstruction` | `string` | Sent as a `SystemInstruction` part when AICore supports it. |
| `temperature` | `number` | Sampling temperature. |
| `topK` | `number` | Top-k sampling cutoff. |
| `candidateCount` | `number` | How many candidates to generate. |
| `maxOutputTokens` | `number` | Ceiling on the reply length. |
| `seed` | `number` | Fixes sampling for a reproducible result. |
| `thinking` | `boolean` | Enables thinking mode where the model supports it; thoughts arrive on `onThought`. |
| `imageBase64` | `string` | One image part, for a multimodal prompt. |

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `'available' \| 'downloadable' \| 'downloading' \| 'unavailable'` | AICore feature status for the Prompt API. Only `'available'` can generate. |
| `isAvailable` | `boolean` | Convenience for `status === 'available'`. |
| `info` | `NanoModelInfo \| null` | Model facts from AICore: `baseModelName`, `tokenLimit`, `thinkingModeAvailable`, `systemPromptAvailable`, `structuredOutputAvailable`, `cachingAvailable`, `aicoreVersion`, `releaseStage`, `preference`. Each field is `null` when AICore does not answer. |
| `messages` | `AIMessage[]` | The conversation. `system` entries are local errors, not model output. |
| `partial` | `string` | Text streamed so far for the in-flight reply. Emptied when the reply is appended to `messages`. |
| `thoughts` | `string[]` | Thinking-mode output, when enabled and supported. |
| `lastLatencyMs` | `number \| null` | Wall time of the last generation, measured around the native call. |
| `lastFirstTokenMs` | `number \| null` | Time to first token — what the user experiences as responsiveness. |
| `lastOutputTokens` | `number \| null` | Output tokens counted by the on-device tokenizer. `null` when the tokenizer was unavailable. |
| `lastDecodeTokensPerSec` | `number \| null` | Derived decode rate: output tokens ÷ time after the first token. |
| `downloadedBytes` | `number \| null` | Bytes fetched so far during a model download, from `onDownloadProgress`. |
| `isDownloading` | `boolean` | Whether a download is running. |
| `isWarmingUp` / `warmupMs` | `boolean` / `number \| null` | Whether a warm-up is running, and how long the last one took. |
| `isGenerating` | `boolean` | Whether any generation, task or chat turn is in flight. |
| `error` | `string \| null` | Last failure message. Native errors surface as `E_NANO_<ErrorCode>`. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` on web or in Expo Go. |
| `temperature` `topK` `candidateCount` `maxOutputTokens` | `number` | Current generation parameters, defaults `0.7`, `40`, `1`, `1024`. Applied to every chat turn. |
| `thinkingMode` | `boolean` | Whether thinking is requested. Only honoured when `info.thinkingModeAvailable` is true. |
| `systemInstruction` | `string` | Standing instruction, sent as a system part when supported and otherwise prefixed to the prompt. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `Promise<void>` — updates `status` and `info` | Re-reads status and model facts from AICore. |
| `download()` | none | `Promise<NanoStatus>` — the status after the attempt; `'unavailable'` on failure | Asks AICore to fetch the model. Progress arrives in `downloadedBytes`. |
| `warmup()` | none | `Promise<number \| null>` — milliseconds taken, or `null` on failure | Loads the model into AICore ahead of the first prompt, so the first reply is not slow. |
| `countTokens(prompt, options?)` | `prompt: string` — text as it would be sent. `options?: NanoOptions` — the same options the call would use. | `Promise<number \| null>` — token count, or `null` when the tokenizer is unavailable | Checks a prompt against `info.tokenLimit` before sending it. |
| `generate(prompt, options?)` | `prompt: string` — the full prompt. `options?: NanoOptions` — per-call overrides, including `imageBase64` for a multimodal turn. | `Promise<NanoResult>` — `{ text, finishReason: 'STOP' \| 'MAX_TOKENS' \| 'OTHER' \| 'UNKNOWN', thoughts, latencyMs, firstTokenMs }`; **throws** on failure | Single-shot generation with no history and no fallback. |
| `sendMessage(userPrompt)` | `userPrompt: string` — the user's turn; blank input is ignored | `Promise<void>` — the reply lands in `messages`; errors land there as a `system` entry | Streaming chat turn. Rebuilds the transcript, streams tokens into `partial`, then records latency, tokens and decode rate. |
| `clearMessages()` | none | `void` | Empties `messages` and `thoughts`. |
| `setModelConfig(stage, preference)` | `stage: 'stable' \| 'preview'` — the AICore model track. `preference: 'full' \| 'fast'` — quality against speed. | `Promise<void>` — refreshes status and info afterwards | Switches the AICore track; the next call creates a new client. |
| `summarize(text, options?)` | `text: string` — article or transcript. `options.inputType?: 'article' \| 'conversation'`. `options.outputType?: 'one_bullet' \| 'two_bullets' \| 'three_bullets'`. | `Promise<SummarizeResult>` — `{ summary, latencyMs, engine, source }`; **throws** on failure | On-device summarization through ML Kit GenAI. |
| `proofread(text, options?)` | `text: string` — the text to correct. `options?: Record<string, any>` — passed through to ML Kit. | `Promise<ProofreadResult>` — `{ correctedText, suggestions, latencyMs, engine, source }` | On-device grammar and wording correction. |
| `rewrite(text, tone?)` | `text: string`. `tone?: 'elaborate' \| 'emojify' \| 'shorten' \| 'friendly' \| 'professional' \| 'rephrase'`. | `Promise<RewriteResult>` — `{ rewrittenText, suggestions, latencyMs, engine, source }` | On-device tone and style transformation. |

### Helper
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `buildNanoTurn(history, user)` | `history: AIMessage[]` — the conversation so far; `system` entries are skipped. `user: string` — the new turn. | `string` — a `User:` / `Assistant:` transcript ending in `Assistant:` | Builds the prompt AICore actually receives, capped at 6,000 characters with the newest turns kept. Exported so a caller can count its tokens first. |

### Native module (`packages/mlkit`)
| Function | Inputs | Returns | ML Kit call |
| :--- | :--- | :--- | :--- |
| `checkStatus()` | none | `Promise<NanoStatus>` | `GenerativeModel.checkStatus()`, the `FeatureStatus` int mapped to a string |
| `getModelInfo()` | none | `Promise<NanoModelInfo>` | `getBaseModelName`, `getTokenLimit`, `isThinkingModeAvailable`, `isSystemPromptAvailable`, `isStructuredOutputFeatureAvailable`, `isCachingFeatureAvailable` |
| `setModelConfig(stage, preference)` | `stage: 'stable' \| 'preview'`, `preference: 'full' \| 'fast'` | `void` | `Generation.getClient(generationConfig { modelConfig { … } })` |
| `download()` | none | `Promise<NanoStatus>` | `download(): Flow<DownloadStatus>`, progress as `onDownloadProgress` events |
| `warmup()` | none | `Promise<number>` — wall time in ms | `warmup()` |
| `countTokens(prompt, options?)` | `prompt: string`, `options?: NanoOptions` | `Promise<number>` | `countTokens(request)` on the on-device tokenizer |
| `generate(prompt, options?)` | `prompt: string`, `options?: NanoOptions` | `Promise<NanoResult>` | `generateContent(request)` |
| `stream(requestId, prompt, options?)` | `requestId: string` — tags the `onToken`/`onThought` events. `prompt: string`, `options?: NanoOptions`. | `Promise<NanoResult>` | `generateContent(request, StreamingCallback)` |
| `close()` | none | `void` | Releases the client |

Options map onto `GenerateContentRequest.Builder`: `systemInstruction` (a `SystemInstruction` part), `temperature`, `topK`, `candidateCount`, `maxOutputTokens`, `seed`, `thinking` (`enableThinking`), `imageBase64` (one `ImagePart`). Errors surface as `E_NANO_<ErrorCode>` (`NOT_AVAILABLE`, `BUSY`, `REQUEST_TOO_LARGE`, `BACKGROUND_USE_BLOCKED`, …).

**Build note:** genai-prompt beta4 is compiled with Kotlin 2.3 while Expo 57 builds with Kotlin 2.1.20. The module passes `-Xskip-metadata-version-check` for its own compile and pins every `kotlin-stdlib` artifact to the project's Kotlin version (see `packages/mlkit/android/build.gradle`).

### Example
```tsx
import { HapticButton } from '@pixelkit-labs/sdk';
import { useGeminiNano } from '@pixelkit-labs/sdk/mlkit';

export function OnDeviceAssistant() {
 const nano = useGeminiNano();
 return (
 <View>
 <Text>Gemini Nano: {nano.status} · {nano.info?.baseModelName ?? '—'} · limit {nano.info?.tokenLimit ?? '—'} tokens</Text>
 {nano.status === 'downloadable' && <HapticButton title="Download model" onPress={() => nano.download()} />}
 <HapticButton title="Ask on-device" onPress={() => nano.sendMessage('Summarise the thermal state')} disabled={!nano.isAvailable} />
 {nano.partial ? <Text>{nano.partial}</Text> : null}
 <Text>{nano.lastLatencyMs ?? '—'} ms · first token {nano.lastFirstTokenMs ?? '—'} ms · {nano.lastDecodeTokensPerSec ?? '—'} tok/s</Text>
 </View>
 );
}
```

---

## `useGenAITasks`

Dedicated on-device GenAI task clients on ML Kit and AICore, separate from the chat surface: summarize, proofread, rewrite and describe an image. Every call is measured and reported with hardware provenance. Unlike `useGeminiNano`'s equivalents, these resolve to `null` on failure instead of throwing, and keep the last result in state. Each task takes its own text or image input; nothing is read on mount.

### Signature
```typescript
function useGenAITasks(): {
 isRunning: boolean;
 error: string | null;
 source: TelemetrySource;
 summaryResult: SummarizeResult | null;
 proofreadResult: ProofreadResult | null;
 rewriteResult: RewriteResult | null;
 imageDescriptionResult: ImageDescriptionResult | null;
 summarize: (text: string, options?: SummarizeOptions) => Promise<SummarizeResult | null>;
 proofread: (text: string) => Promise<ProofreadResult | null>;
 rewrite: (text: string, tone?: TaskTone) => Promise<RewriteResult | null>;
 describeImage: (imageInput: string, style?: 'detailed' | 'caption' | 'labels' | 'concise') => Promise<ImageDescriptionResult | null>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRunning` | `boolean` | `true` while any of the four tasks is in flight. They share one flag, so run them one at a time. |
| `error` | `string \| null` | Why the last task failed, including "PixelNano module is unavailable in this environment" on web. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |
| `summaryResult` | `SummarizeResult \| null` | Last summary: `{ summary, latencyMs, engine, source }`. |
| `proofreadResult` | `ProofreadResult \| null` | Last proofread: `{ correctedText, suggestions, latencyMs, engine, source }`. |
| `rewriteResult` | `RewriteResult \| null` | Last rewrite: `{ rewrittenText, suggestions, latencyMs, engine, source }`. |
| `imageDescriptionResult` | `ImageDescriptionResult \| null` | Last description: `{ description, finishReason, latencyMs, engine, source }`. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `summarize(text, options?)` | `text: string` — article or conversation transcript. `options.inputType?: 'article' \| 'conversation'` — how to read the input. `options.outputType?: 'one_bullet' \| 'two_bullets' \| 'three_bullets'` — how long the summary should be. | `Promise<SummarizeResult \| null>` — `null` on failure, with `error` set | Runs on-device; no text leaves the phone. |
| `proofread(text)` | `text: string` — the text to correct | `Promise<ProofreadResult \| null>` | Returns corrected text plus the individual suggestions. |
| `rewrite(text, tone?)` | `text: string`. `tone?: TaskTone` — `'elaborate' \| 'emojify' \| 'shorten' \| 'friendly' \| 'professional' \| 'rephrase'`, default `'professional'`. | `Promise<RewriteResult \| null>` | Transforms tone or length while keeping the meaning. |
| `describeImage(imageInput, style?)` | `imageInput: string` — a file URI or base64 image. `style?: 'detailed' \| 'caption' \| 'labels' \| 'concise'`, default `'concise'`. | `Promise<ImageDescriptionResult \| null>` | On-device multimodal description, for alt text or a caption. |

---

## `useNaturalLanguageAI`

On-device natural language intelligence through ML Kit, working entirely offline:

* **Language identification** across 50+ languages with a candidate distribution.
* **Machine translation** across 58 languages, no network required.
* **Smart reply** suggestions from a conversation history.
* **Entity extraction**: dates, addresses, flight numbers, money, phone numbers and tracking codes. Each function takes its own text; nothing runs on mount. The first translation between a new language pair downloads that model, so it is slower than the ones after it.

### Signature
```typescript
function useNaturalLanguageAI(): {
 isProcessing: boolean;
 error: string | null;
 source: TelemetrySource;
 languageResult: LanguageIdResult | null;
 translationResult: TranslationResult | null;
 smartReplyResult: SmartReplyResult | null;
 entityResult: EntityExtractionResult | null;
 identifyLanguage: (text: string) => Promise<LanguageIdResult | null>;
 translate: (text: string, sourceLang?: string, targetLang?: string) => Promise<TranslationResult | null>;
 suggestReplies: (history: Array<{ text: string; timestamp?: number; isLocalUser?: boolean; sender?: string }>) => Promise<SmartReplyResult | null>;
 extractEntities: (text: string) => Promise<EntityExtractionResult | null>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isProcessing` | `boolean` | `true` while any of the four functions is running. |
| `error` | `string \| null` | Why the last call failed. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |
| `languageResult` | `LanguageIdResult \| null` | `{ languageCode, possibleLanguages: [{ languageCode, confidence }], latencyMs, source }`. `languageCode` is `null` when nothing was confident enough. |
| `translationResult` | `TranslationResult \| null` | `{ translatedText, sourceLanguage, targetLanguage, latencyMs, source }`. |
| `smartReplyResult` | `SmartReplyResult \| null` | `{ suggestions: string[], status, latencyMs, source }`. `suggestions` is empty when the model has no confident reply. |
| `entityResult` | `EntityExtractionResult \| null` | `{ entities: [{ type, text, start, end }], latencyMs, source }`; `start` and `end` index into the input string. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `identifyLanguage(text)` | `text: string` — a sample; a few words is usually enough | `Promise<LanguageIdResult \| null>` — `null` on failure | Identifies the language and returns the runners-up with confidences. |
| `translate(text, sourceLang?, targetLang?)` | `text: string`. `sourceLang?: string` — BCP-47 language code, default `'en'`. `targetLang?: string` — default `'es'`. | `Promise<TranslationResult \| null>` | Offline neural translation. Pair it with `identifyLanguage` when the source is unknown. |
| `suggestReplies(history)` | `history: Array<{ text: string; timestamp?: number; isLocalUser?: boolean; sender?: string }>` — the conversation in order; `isLocalUser` marks this user's own messages so the model replies to the other party | `Promise<SmartReplyResult \| null>` | Generates short contextual replies. |
| `extractEntities(text)` | `text: string` — the text to scan | `Promise<EntityExtractionResult \| null>` | Finds dates, addresses, flight numbers, money, phone numbers and tracking codes with their positions. |

---

## `useSpeechAI`

Speech recognition in two modes. **On-device** uses Android System Intelligence through `SpeechRecognizer` in the native module: partial results stream in as you speak, and nothing leaves the phone. **Cloud** records through `useAudio` (16 kHz mono via the `voice_recognition` source) and transcribes with Gemini audio understanding.

Without an API key in cloud mode the recording is kept (`lastRecordingUri`) and `error` is set to `NO_API_KEY_MESSAGE`. There is no simulated transcript in either mode. It probes on-device recognition availability on mount and subscribes to the speech events. Mode is chosen with `setRecognitionMode`, defaulting to `'on-device'`.

### Signature
```typescript
function useSpeechAI(): {
 isListening: boolean;
 isTranscribing: boolean;
 recognitionMode: 'on-device' | 'cloud';
 setRecognitionMode: (mode: 'on-device' | 'cloud') => void;
 isOfflineAvailable: boolean;
 streamingPartial: string;
 voiceDecibels: number;
 lastTranscript: SpeechTranscriptionResult | null;
 lastRecordingUri: string | null;
 error: string | null;
 source: TelemetrySource;
 model: string;
 startListening: () => Promise<boolean>;
 stopListeningAndTranscribe: () => Promise<SpeechTranscriptionResult | null>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isListening` | `boolean` | Whether the microphone is open, in either mode. |
| `isTranscribing` | `boolean` | Cloud mode only: `true` while audio is being sent and transcribed. |
| `recognitionMode` | `'on-device' \| 'cloud'` | Which engine will be used for the next take. |
| `isOfflineAvailable` | `boolean` | Whether on-device recognition is installed. When `false`, use cloud mode. |
| `streamingPartial` | `string` | Interim text from the on-device recognizer while the user is still speaking. Empty in cloud mode. |
| `voiceDecibels` | `number` | Live microphone level in dBFS: the recognizer's RMS on-device, the recorder's metering in cloud mode. |
| `lastTranscript` | `SpeechTranscriptionResult \| null` | `{ transcript, confidence, durationSeconds, latencyMs, language }`. `confidence` is `null` for cloud transcripts because Gemini does not report one. |
| `lastRecordingUri` | `string \| null` | Cloud mode: the audio file, kept even when transcription failed so nothing is lost. |
| `error` | `string \| null` | Why recognition failed, or the "no API key" message in cloud mode. |
| `source` | `TelemetrySource` | Provenance of the transcript: on-device or cloud; `'unavailable'` before either is ready. |
| `model` | `string` | Which engine produced the last transcript: `'Android System Intelligence (On-Device)'` or the cloud model id. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startListening()` | none | `Promise<boolean>` — `true` when the microphone opened, `false` with `error` set on permission denial or a recognizer failure | On-device: starts `SpeechRecognizer` and streams partials. Cloud: starts recording through `useAudio`. |
| `stopListeningAndTranscribe()` | none | `Promise<SpeechTranscriptionResult \| null>` — the transcript, or `null` when nothing was captured or transcription failed | On-device: stops the recognizer and returns the last result. Cloud: stops recording, uploads the audio and returns the Gemini transcript. |

### Example
```tsx
const speech = useSpeechAI();
const gemini = useGemini();

const handleVoice = async () => {
 if (speech.isListening) {
 const res = await speech.stopListeningAndTranscribe();
 if (res?.transcript) gemini.sendMessage(res.transcript);
 } else {
 await speech.startListening();
 }
};

<HapticButton
 title={speech.isListening ? `Listening (${speech.voiceDecibels} dB) — tap to finish` : 'Start voice'}
 onPress={handleVoice}
 variant={speech.isListening ? 'danger' : 'primary'}
/>
```

---

## `useSpeech`

Text to speech on `expo-speech`, the output half of the voice story: `useSpeechAI` listens, this one talks back.

Voices come from the platform speech service, so language coverage and quality depend on what the user has downloaded in system settings rather than on this app. Read `voices` instead of assuming a language exists. `speak` resolves when the engine finishes, so utterances can be awaited in sequence instead of overlapping. Text longer than `maxInputLength` is rejected rather than silently truncated, and the engine is stopped on unmount so speech does not continue after the screen is gone. It reads the installed voices on mount. Per-utterance settings go in the `speak` options; `setVoice`, `setRate` and `setPitch` set the defaults those options fall back to.

### Signature
```typescript
function useSpeech(): {
 isSpeaking: boolean;
 isPaused: boolean;
 voices: Voice[];
 voice: string | null;
 rate: number;
 pitch: number;
 maxInputLength: number;
 lastSpokenText: string | null;
 error: string | null;
 source: TelemetrySource;
 speak: (text: string, options?: SpeakOptions) => Promise<void>;
 stop: () => Promise<void>;
 pause: () => Promise<void>;
 resume: () => Promise<void>;
 checkSpeaking: () => Promise<boolean>;
 refreshVoices: () => Promise<Voice[]>;
 voicesForLanguage: (languageTag: string) => Voice[];
 setVoice: (id: string | null) => void;
 setRate: (n: number) => void;
 setPitch: (n: number) => void;
};
```

| `SpeakOptions` field | Type | Description |
| :--- | :--- | :--- |
| `language` | `string` | BCP-47 tag, e.g. `'en-GB'`. Defaults to the system language. |
| `voice` | `string` | Identifier from `voices`. Overrides `language` when both are given. |
| `rate` | `number` | Speaking speed; `1` is normal, lower is slower. Falls back to the hook's `rate`. |
| `pitch` | `number` | Voice pitch; `1` is normal. Falls back to the hook's `pitch`. |
| `volume` | `number` | 0 to 1 for this utterance. |

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSpeaking` | `boolean` | Whether the engine is currently speaking. |
| `isPaused` | `boolean` | Whether speech is paused rather than stopped. |
| `voices` | `Voice[]` | Installed voices: `{ identifier, name, language, quality }`. Empty when none are installed or the read failed. |
| `voice` | `string \| null` | Selected voice identifier, or `null` for the system default. |
| `rate` | `number` | Default speaking speed; `1` is normal. |
| `pitch` | `number` | Default pitch; `1` is normal. |
| `maxInputLength` | `number` | Longest string the engine accepts in one call. Longer text is rejected, not truncated. |
| `lastSpokenText` | `string \| null` | Text of the most recent utterance. |
| `error` | `string \| null` | Why the last call failed, including the length rejection message. |
| `source` | `TelemetrySource` | `'hardware'` once voices have been read, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `speak(text, options?)` | `text: string` — trimmed before use; blank input resolves immediately. `options?: SpeakOptions` — see the table above. | `Promise<void>` — resolves when the engine finishes or is stopped; **rejects** when the text exceeds `maxInputLength` or the engine errors | Await it to sequence utterances instead of overlapping them. |
| `stop()` | none | `Promise<void>` | Stops immediately and clears the speaking and paused flags. |
| `pause()` | none | `Promise<void>` — sets `error` where the engine does not support pausing | Pauses mid-utterance. |
| `resume()` | none | `Promise<void>` | Continues a paused utterance. |
| `checkSpeaking()` | none | `Promise<boolean>` — the engine's own answer, also written to `isSpeaking` | Asks the engine directly rather than trusting the local flag. |
| `refreshVoices()` | none | `Promise<Voice[]>` — the list, also written to `voices` | Re-reads installed voices, e.g. after the user downloads one in Settings. |
| `voicesForLanguage(languageTag)` | `languageTag: string` — a prefix such as `'en'` or a full tag such as `'en-GB'`, matched case-insensitively | `Voice[]` — matching voices; empty when none are installed | Filters `voices` so you can offer a real choice. |
| `setVoice(id)` | `id: string \| null` — an identifier from `voices`, or `null` for the system default | `void` | Sets the default voice for later `speak` calls. |
| `setRate(n)` / `setPitch(n)` | `n: number` — `1` is normal | `void` | Set the defaults `speak` falls back to. |

### Example
```tsx
import { useSpeech, HapticButton } from '@pixelkit-labs/sdk';
import { useGeminiNano } from '@pixelkit-labs/sdk/mlkit';

export function TalkBack() {
 const speech = useSpeech();
 const nano = useGeminiNano();

 const answer = async () => {
 const reply = await nano.generate('Describe the thermal state in one sentence.');
 await speech.speak(reply.text, { rate: 0.95 });
 };

 return <HapticButton title="Ask and speak" onPress={answer} disabled={speech.isSpeaking} />;
}
```

> Await `speak` rather than firing several in a row, and check `voices` before promising a language.

---

## `useVisionAI`

Google ML Kit on-device computer vision plus Gemini multimodal scene understanding in one hook.

* **Text Recognition v2 (OCR)** — structured text blocks and lines, on-device.
* **Barcode & QR scanning** — 1D and 2D formats, on-device.
* **Image labelling** — visual entity and scene classification, on-device.
* **Face detection & 3D mesh** — landmarks, smile and eye-open probabilities, 468-point meshes, on-device.
* **Object detection & tracking** — bounding boxes with tracking ids, on-device.
* **Pose detection** — 33 skeletal landmarks, on-device.
* **Selfie & subject segmentation** — foreground and background masks, on-device.
* **Digital ink recognition** — handwriting from stroke data, on-device.
* **Gemini scene analysis** — a two-sentence description and 3–5 labels, via the cloud with a JSON schema. Every on-device function takes the same `imageInput`: **a file URI or a base64 image string**. The cloud path needs base64, which is why `pickImage` requests it.

### Signature
```typescript
function useVisionAI(): {
 isAnalyzing: boolean;
 analysis: VisionAnalysisResult | null;
 selectedImageUri: string | null;
 selectedImageBase64: string | null;
 model: string;
 isOnDeviceProcessing: boolean;
 barcodeResult: BarcodeScanResult | null; ocrResult: TextRecognitionResult | null;
 facesResult: FaceDetectionResult | null; faceMeshResult: FaceMeshResult | null;
 labelsResult: ImageLabelResult | null; objectsResult: ObjectDetectionResult | null;
 poseResult: PoseDetectionResult | null; selfieResult: SelfieSegmentationResult | null;
 subjectResult: SubjectSegmentationResult | null; digitalInkResult: DigitalInkResult | null;
 error: string | null; source: TelemetrySource;
 pickImage: (useCamera?: boolean) => Promise<{ uri: string; base64?: string } | null>;
 captureAndAnalyze: (useCamera?: boolean) => Promise<VisionAnalysisResult | null>;
 scanBarcodes: (imageInput: string) => Promise<BarcodeScanResult | null>;
 recognizeText: (imageInput: string) => Promise<TextRecognitionResult | null>;
 detectFaces: (imageInput: string) => Promise<FaceDetectionResult | null>;
 detectFaceMesh: (imageInput: string) => Promise<FaceMeshResult | null>;
 labelImage: (imageInput: string) => Promise<ImageLabelResult | null>;
 detectObjects: (imageInput: string) => Promise<ObjectDetectionResult | null>;
 detectPose: (imageInput: string) => Promise<PoseDetectionResult | null>;
 segmentSelfie: (imageInput: string) => Promise<SelfieSegmentationResult | null>;
 segmentSubject: (imageInput: string) => Promise<SubjectSegmentationResult | null>;
 recognizeDigitalInk: (strokes: Array<Array<{ x: number; y: number; t?: number }>>, languageTag?: string) => Promise<DigitalInkResult | null>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAnalyzing` | `boolean` | `true` while the cloud analysis is in flight. |
| `analysis` | `VisionAnalysisResult \| null` | Gemini's answer: `{ description, labels, latencyMs, timestamp }`. |
| `selectedImageUri` | `string \| null` | File URI of the image last picked or captured. |
| `selectedImageBase64` | `string \| null` | The same image as base64, which is what the model calls consume. |
| `model` | `string` | Cloud model used for scene analysis. |
| `isOnDeviceProcessing` | `boolean` | `true` while any ML Kit call is running. They share one flag. |
| `barcodeResult` | `BarcodeScanResult \| null` | `{ barcodes: [{ rawValue, displayValue, format, valueType, boundingBox }], latencyMs, source }`. |
| `ocrResult` | `TextRecognitionResult \| null` | `{ text, blocks: [{ text, lines, boundingBox }], latencyMs, source }`. |
| `facesResult` | `FaceDetectionResult \| null` | `{ faces: [{ trackingId, smilingProbability, leftEyeOpenProbability, rightEyeOpenProbability, headEulerAngleX/Y/Z, boundingBox }], latencyMs, source }`; probabilities are `null` when classification is off. |
| `faceMeshResult` | `FaceMeshResult \| null` | `{ meshes, latencyMs, source }` — 468 3D contour points per close-range face. |
| `labelsResult` | `ImageLabelResult \| null` | `{ labels: [{ text, confidence, index }], latencyMs, source }`. |
| `objectsResult` | `ObjectDetectionResult \| null` | `{ objects: [{ trackingId, boundingBox, labels }], latencyMs, source }`. |
| `poseResult` | `PoseDetectionResult \| null` | `{ landmarks: [{ type, x, y, inFrameLikelihood }], latencyMs, source }` — 33 landmarks. |
| `selfieResult` | `SelfieSegmentationResult \| null` | `{ width, height, latencyMs, source }` — mask dimensions. |
| `subjectResult` | `SubjectSegmentationResult \| null` | `{ subjectsCount, foregroundConfidence, latencyMs, source }`. |
| `digitalInkResult` | `DigitalInkResult \| null` | `{ candidates: [{ text, score }], latencyMs, source }`, best candidate first. |
| `error` | `string \| null` | Why the last call failed, including the "no API key" message for the cloud path. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `pickImage(useCamera?)` | `useCamera?: boolean` — `true` opens the camera (requesting permission), `false` opens the library; default `true` | `Promise<{ uri, base64? } \| null>` — `null` when the user cancelled or permission was refused | Picks an image at 0.8 quality with base64 included, storing it in `selectedImageUri` and `selectedImageBase64`. |
| `captureAndAnalyze(useCamera?)` | `useCamera?: boolean` — as above, default `true` | `Promise<VisionAnalysisResult \| null>` — `{ description, labels, latencyMs, timestamp }`, or `null` when cancelled, unconfigured or failed | Picks an image, then asks Gemini for a two-sentence description and 3–5 labels using a JSON schema so the reply parses reliably. |
| `scanBarcodes(imageInput)` | `imageInput: string` — file URI or base64 | `Promise<BarcodeScanResult \| null>` — `null` on failure with `error` set | Decodes 1D and 2D barcodes including QR, on-device. |
| `recognizeText(imageInput)` | `imageInput: string` | `Promise<TextRecognitionResult \| null>` | OCR with block and line structure preserved. |
| `detectFaces(imageInput)` | `imageInput: string` | `Promise<FaceDetectionResult \| null>` | Faces with tracking ids, head angles and smile/eye probabilities. |
| `detectFaceMesh(imageInput)` | `imageInput: string` | `Promise<FaceMeshResult \| null>` | 468-point 3D mesh; needs a close-range face. |
| `labelImage(imageInput)` | `imageInput: string` | `Promise<ImageLabelResult \| null>` | Classifies entities and scenes with confidences. |
| `detectObjects(imageInput)` | `imageInput: string` | `Promise<ObjectDetectionResult \| null>` | Bounding boxes with tracking ids and labels. |
| `detectPose(imageInput)` | `imageInput: string` | `Promise<PoseDetectionResult \| null>` | 33 skeletal landmarks with in-frame likelihoods. |
| `segmentSelfie(imageInput)` | `imageInput: string` | `Promise<SelfieSegmentationResult \| null>` | Foreground portrait mask. |
| `segmentSubject(imageInput)` | `imageInput: string` | `Promise<SubjectSegmentationResult \| null>` | Separates subjects from the background. |
| `recognizeDigitalInk(strokes, languageTag?)` | `strokes: Array<Array<{ x: number; y: number; t?: number }>>` — one array per stroke, points in order, `t` an optional timestamp in ms. `languageTag?: string` — recogniser language, e.g. `'en-US'`. | `Promise<DigitalInkResult \| null>` | Recognises handwriting from stroke data, best candidate first. |

---

## `geminiClient`

Key storage, model listing and the client factory. The key is written to SecureStore (Android Keystore-backed) and falls back to `EXPO_PUBLIC_GEMINI_API_KEY` when nothing is stored.

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `getStoredApiKey()` | none | `Promise<string \| null>` — the key, or `null` when none is configured | Reads SecureStore (current and legacy keys), then the environment variable. On web it reads `localStorage`, which is not encrypted. |
| `saveApiKey(key)` | `key: string` — the Gemini API key | `Promise<boolean>` — `true` when the write succeeded | Persists the key to SecureStore. |
| `listAvailableModels(apiKey?)` | `apiKey?: string \| null` — a key to list with; falls back to the stored one | `Promise<string[]>` — Gemini text model ids, or `DEFAULT_MODELS` when offline or unconfigured | Calls `client.models.list()` and filters out embedding and AQA models. |
| `createGeminiClient(apiKey)` | `apiKey: string` — a valid key | `GoogleGenAI` — the official SDK client | Instantiates the client every cloud hook uses. |

### Constants
| Constant | Type | Description |
| :--- | :--- | :--- |
| `GEMINI_MODEL` | `string` | Default cloud model id, `'gemini-3.8-flash'`. |
| `DEFAULT_MODELS` | `string[]` | Curated fallback list used until the live list loads. |
| `NO_API_KEY_MESSAGE` | `string` | The message every cloud AI hook surfaces when no key is configured. There is no simulated fallback. |
