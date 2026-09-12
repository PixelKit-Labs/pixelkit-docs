# geminiClient

Key storage, model listing and the client factory. The key is written to SecureStore (Android Keystore-backed) and falls back to `EXPO_PUBLIC_GEMINI_API_KEY` when nothing is stored.

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `getStoredApiKey()` | none | `Promise<string \| null>` — the key, or `null` when none is configured | Reads SecureStore (current and legacy keys), then the environment variable. On web it reads `localStorage`, which is not encrypted. |
| `saveApiKey(key)` | `key: string` — the Gemini API key | `Promise<boolean>` — `true` when the write succeeded | Persists the key to SecureStore. |
| `listAvailableModels(apiKey?)` | `apiKey?: string \| null` — a key to list with; falls back to the stored one | `Promise<string[]>` — Gemini text model ids, or `DEFAULT_MODELS` when offline or unconfigured | Calls `client.models.list()` and filters out embedding and AQA models. |
| `createGeminiClient(apiKey)` | `apiKey: string` — a valid key | `GoogleGenAI` — the official SDK client | Instantiates the client every cloud hook uses. |

## Constants
| Constant | Type | Description |
| :--- | :--- | :--- |
| `GEMINI_MODEL` | `string` | Default cloud model id, `'gemini-3.8-flash'`. |
| `DEFAULT_MODELS` | `string[]` | Curated fallback list used until the live list loads. |
| `NO_API_KEY_MESSAGE` | `string` | The message every cloud AI hook surfaces when no key is configured. There is no simulated fallback. |
