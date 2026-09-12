# useGemini

**Source:** [packages/sdk/src/ai/useGemini.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useGemini.ts)

Official Google Gen AI SDK (`@google/genai`) on **`gemini-3.8-flash`** with real multi-turn history via `ai.chats.create()` and a system instruction. **There is no simulated fallback**: without an API key, `sendMessage` appends a `system`-role message containing `NO_API_KEY_MESSAGE`. Token counts come from the API's `usageMetadata`.

Changing the model, the key, or any generation parameter resets the chat session, because those settings are fixed when the session is created. It loads the stored key on mount and, when one exists, fetches the live model list. Everything else is set through the setters below, which are the hook's real inputs.

## Signature
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

## Outputs
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

## Functions
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

## Example
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
