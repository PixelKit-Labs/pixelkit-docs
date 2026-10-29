# useEmbeddings

Runs the MediaPipe Tasks TextEmbedder (TFLite) on the device CPU (XNNPACK; no TPU/NPU delegate is configured). The model is read from `filesDir/models/text_embedder.tflite` and must be a `.tflite` embedder with TFLite metadata; the library neither bundles nor downloads it. Vectors are L2-normalised floats whose length is the model's real output size, reported through `vectorDimension`. When the file is missing or fails to load the hook reports `isAvailable` false, `source` `'unavailable'` and the native reason in `unavailableReason`; `embed()` rejects instead of returning an empty vector. Includes an in-memory cosine similarity helper.

## Signature
```typescript
useEmbeddings(): EmbeddingsTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | True only when the model file exists, loaded, and produced a vector for a probe input. |
| `isLoading` | `boolean` | Whether an embedding inference is currently running. |
| `vectorDimension` | `number \| null` | Real output length of the model's embedding vector; null until the native side or an `embed()` call has reported it. |
| `unavailableReason` | `string \| null` | Why the embedder is unavailable (missing model file, load failure); null when available. |
| `error` | `string \| null` | Error message if embedding inference failed. |
| `source` | `TelemetrySource` | `'hardware'` when the model is available and the last `embed()` did not fail; otherwise `'unavailable'`. |
| `embed` | `(text: string) => Promise<number[]>` | Computes an L2-normalised float vector for the text. Rejects if the model is unavailable, the text is empty, or the model returns no vector. |
| `cosineSimilarity` | `(vecA: number[], vecB: number[]) => number` | Computes cosine similarity between two float vectors (-1.0 to 1.0); returns 0 for empty or different-length vectors. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `embed(text)` | `text: string` | `Promise<number[]>` | Generates an embedding vector from input text; rejects rather than returning an empty vector. |
| `cosineSimilarity(vecA, vecB)` | `vecA, vecB: number[]` | `number` | Scores cosine similarity between two embedding vectors. |

## Example
```tsx
import { useEmbeddings } from '@pixelkit-labs/sdk/mlkit';

function SimilarityDemo() {
  const { isAvailable, unavailableReason, embed, cosineSimilarity } = useEmbeddings();
  const compare = async () => {
    try {
      const vecA = await embed('Google Pixel 11 Pro');
      const vecB = await embed('Android Smartphone');
      console.log('Similarity score:', cosineSimilarity(vecA, vecB));
    } catch (e) {
      console.warn('Embedding failed:', e);
    }
  };
  if (!isAvailable) return <Text>{unavailableReason}</Text>;
  return <Button title="Compare Texts" onPress={compare} />;
}
```

:::note
Exported from '@pixelkit-labs/sdk/mlkit'. Android only. Requires a text embedder .tflite with TFLite metadata at <app filesDir>/models/text_embedder.tflite (the library neither bundles nor downloads it). Inference runs on CPU via MediaPipe TextEmbedder (XNNPACK), not on the Tensor TPU. Check isAvailable/unavailableReason before calling embed(); embed() rejects on failure, never returns []. vectorDimension is null until a real vector length is known. Vectors from different models are not comparable.
:::
