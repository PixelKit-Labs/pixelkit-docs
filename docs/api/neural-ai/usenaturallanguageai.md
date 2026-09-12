# useNaturalLanguageAI

**Source:** [packages/sdk/src/ai/useNaturalLanguageAI.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useNaturalLanguageAI.ts)

On-device natural language intelligence through ML Kit, working entirely offline:

* **Language identification** across 50+ languages with a candidate distribution.
* **Machine translation** across 58 languages, no network required.
* **Smart reply** suggestions from a conversation history.
* **Entity extraction**: dates, addresses, flight numbers, money, phone numbers and tracking codes. Each function takes its own text; nothing runs on mount. The first translation between a new language pair downloads that model, so it is slower than the ones after it.

## Signature
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

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isProcessing` | `boolean` | `true` while any of the four functions is running. |
| `error` | `string \| null` | Why the last call failed. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |
| `languageResult` | `LanguageIdResult \| null` | `{ languageCode, possibleLanguages: [{ languageCode, confidence }], latencyMs, source }`. `languageCode` is `null` when nothing was confident enough. |
| `translationResult` | `TranslationResult \| null` | `{ translatedText, sourceLanguage, targetLanguage, latencyMs, source }`. |
| `smartReplyResult` | `SmartReplyResult \| null` | `{ suggestions: string[], status, latencyMs, source }`. `suggestions` is empty when the model has no confident reply. |
| `entityResult` | `EntityExtractionResult \| null` | `{ entities: [{ type, text, start, end }], latencyMs, source }`; `start` and `end` index into the input string. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `identifyLanguage(text)` | `text: string` — a sample; a few words is usually enough | `Promise<LanguageIdResult \| null>` — `null` on failure | Identifies the language and returns the runners-up with confidences. |
| `translate(text, sourceLang?, targetLang?)` | `text: string`. `sourceLang?: string` — BCP-47 language code, default `'en'`. `targetLang?: string` — default `'es'`. | `Promise<TranslationResult \| null>` | Offline neural translation. Pair it with `identifyLanguage` when the source is unknown. |
| `suggestReplies(history)` | `history: Array<{ text: string; timestamp?: number; isLocalUser?: boolean; sender?: string }>` — the conversation in order; `isLocalUser` marks this user's own messages so the model replies to the other party | `Promise<SmartReplyResult \| null>` | Generates short contextual replies. |
| `extractEntities(text)` | `text: string` — the text to scan | `Promise<EntityExtractionResult \| null>` | Finds dates, addresses, flight numbers, money, phone numbers and tracking codes with their positions. |
