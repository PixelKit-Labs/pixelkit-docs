# useGenAITasks

**Source:** [packages/sdk/src/ai/useGenAITasks.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useGenAITasks.ts)

Dedicated on-device GenAI task clients on ML Kit and AICore, separate from the chat surface: summarize, proofread, rewrite and describe an image. Every call is measured and reported with hardware provenance. Unlike `useGeminiNano`'s equivalents, these resolve to `null` on failure instead of throwing, and keep the last result in state. Each task takes its own text or image input; nothing is read on mount.

## Signature
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

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRunning` | `boolean` | `true` while any of the four tasks is in flight. They share one flag, so run them one at a time. |
| `error` | `string \| null` | Why the last task failed, including "PixelNano module is unavailable in this environment" on web. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |
| `summaryResult` | `SummarizeResult \| null` | Last summary: `{ summary, latencyMs, engine, source }`. |
| `proofreadResult` | `ProofreadResult \| null` | Last proofread: `{ correctedText, suggestions, latencyMs, engine, source }`. |
| `rewriteResult` | `RewriteResult \| null` | Last rewrite: `{ rewrittenText, suggestions, latencyMs, engine, source }`. |
| `imageDescriptionResult` | `ImageDescriptionResult \| null` | Last description: `{ description, finishReason, latencyMs, engine, source }`. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `summarize(text, options?)` | `text: string` — article or conversation transcript. `options.inputType?: 'article' \| 'conversation'` — how to read the input. `options.outputType?: 'one_bullet' \| 'two_bullets' \| 'three_bullets'` — how long the summary should be. | `Promise<SummarizeResult \| null>` — `null` on failure, with `error` set | Runs on-device; no text leaves the phone. |
| `proofread(text)` | `text: string` — the text to correct | `Promise<ProofreadResult \| null>` | Returns corrected text plus the individual suggestions. |
| `rewrite(text, tone?)` | `text: string`. `tone?: TaskTone` — `'elaborate' \| 'emojify' \| 'shorten' \| 'friendly' \| 'professional' \| 'rephrase'`, default `'professional'`. | `Promise<RewriteResult \| null>` | Transforms tone or length while keeping the meaning. |
| `describeImage(imageInput, style?)` | `imageInput: string` — a file URI or base64 image. `style?: 'detailed' \| 'caption' \| 'labels' \| 'concise'`, default `'concise'`. | `Promise<ImageDescriptionResult \| null>` | On-device multimodal description, for alt text or a caption. |
