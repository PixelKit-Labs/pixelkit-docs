# useGeminiNano

**Source:** [packages/sdk/src/ai/useGeminiNano.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useGeminiNano.ts)

Gemini Nano on-device through the local `packages/mlkit` Expo Module, which wraps `com.google.mlkit:genai-prompt` (the ML Kit GenAI Prompt API on AICore). Status, base model name, token limit and feature flags come from `GenerativeModel`; latency and time-to-first-token are measured around the native call; token counts come from the on-device tokenizer.

AICore keeps no conversation state, so `buildNanoTurn()` re-sends a capped transcript (6,000 characters, newest turns first) with the system instruction. **There is no cloud fallback and no simulated reply**: when the model is not `available`, `sendMessage` appends a `system`-role error.

Requires a dev client or release APK on a device with AICore (Pixel 9 and later; verified on Pixel 11 Pro). On web and in Expo Go the module resolves to `null` and `source` is `'unavailable'`. It reads model info on mount and subscribes to download progress. Generation parameters are held as state and applied to every call; per-call overrides go in the `NanoOptions` argument of `generate` and `countTokens`.

## Signature
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

## Outputs
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

## Functions
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

## Helper
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `buildNanoTurn(history, user)` | `history: AIMessage[]` — the conversation so far; `system` entries are skipped. `user: string` — the new turn. | `string` — a `User:` / `Assistant:` transcript ending in `Assistant:` | Builds the prompt AICore actually receives, capped at 6,000 characters with the newest turns kept. Exported so a caller can count its tokens first. |

## Native module (`packages/mlkit`)
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

## Example
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
