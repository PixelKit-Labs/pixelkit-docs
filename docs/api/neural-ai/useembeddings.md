# useEmbeddings

Executes on-device text embedding generation on the Google Tensor EdgeTPU / NPU through ML Kit GenAI. Produces normalized 512-dimensional floating point vectors from input text in milliseconds. Includes an in-memory cosine similarity calculation helper to compare semantic proximity between vectors entirely offline.

## Signature
```typescript
useEmbeddings(): EmbeddingsTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | Whether the on-device text embedding model is installed and ready for inference. |
| `isLoading` | `boolean` | Whether an embedding inference operation is actively computing on the NPU/TPU. |
| `vectorDimension` | `number` | Dimension size of the output embedding vector (512). |
| `error` | `string \| null` | Error message if embedding inference failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `embed` | `(text: string) => Promise<number[]>` | Computes a normalized float vector embedding for the provided text. |
| `cosineSimilarity` | `(vecA: number[], vecB: number[]) => number` | Computes cosine similarity between two float vectors (-1.0 to 1.0). |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `embed(text)` | none | `void` | Generates a 512-dimensional embedding vector from input text. |
| `cosineSimilarity(vecA, vecB)` | none | `void` | Scores cosine similarity between two embedding vectors. |

## Example
```tsx
import { useEmbeddings } from '@pixelkit-labs/sdk/mlkit';

function SimilarityDemo() {
  const { isAvailable, embed, cosineSimilarity } = useEmbeddings();
  const compare = async () => {
    const vecA = await embed('Google Pixel 11 Pro');
    const vecB = await embed('Android Smartphone');
    const score = cosineSimilarity(vecA, vecB);
    console.log('Similarity score:', score);
  };
  return <Button title="Compare Texts" onPress={compare} />;
}
```

:::note
Exported from '@pixelkit-labs/sdk/mlkit'. Operates entirely on-device with zero network latency.
:::
