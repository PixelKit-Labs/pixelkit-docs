# useGeminiLive

Opens a WebSocket to the Gemini Live API (`BidiGenerateContent`). You supply the session's trace context and capability adapter to `connect()`; the API key comes from `run.apiKey` or the stored key. `sendAudioChunk`, `sendImageChunk` and `sendVideoFrame` forward base64 PCM audio and JPEG frames as realtime input; `sendText` and `sendMultimodalTurn` send client turns. The hook does not capture audio and does not play the model's audio: `isSpeaking` means audio parts from the model are arriving. `isListening` and `isStreamingMedia` are set when a chunk is sent and clear 2 s after the last one. Model tool calls are validated and run through `runTool` against the adapter you passed; each call is a network round trip plus the tool's own execution time. The default model is the `DEFAULT_LIVE_MODEL` constant (currently `'models/gemini-2.0-flash-exp'`).

## Signature
```typescript
useGeminiLive(config?: GeminiLiveConfig): GeminiLiveTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `config` | `GeminiLiveConfig` | Optional. `model` (default `DEFAULT_LIVE_MODEL`), `voiceName` (`'Puck'`, `'Charon'`, `'Kore'`, `'Fenrir'` or `'Aoede'`, default `'Aoede'`), `systemInstruction`, `thinkingBudget` (tokens; only sent when non-zero). Capabilities are passed to `connect()`, not here. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isConnected` | `boolean` | Whether the WebSocket session to Gemini Live is active and ready. |
| `isStreaming` | `boolean` | Whether the model is actively streaming an audio or text response. |
| `isSpeaking` | `boolean` | Whether audio parts from the model are arriving. The hook does not play audio, so this does not mean sound is coming out of the device. |
| `isListening` | `boolean` | `true` after an audio chunk was sent; clears 2 s after the last chunk or on disconnect. |
| `isStreamingMedia` | `boolean` | `true` after an image or video frame was sent; clears 2 s after the last one or on disconnect. |
| `transcript` | `LiveMessage[]` | Real-time transcript of conversational dialogue. |
| `currentThinking` | `string \| null` | Latest reasoning thoughts emitted by the model during extended thinking. |
| `activeToolCalls` | `LiveToolCall[]` | Real-time hardware tool invocations executed during the session. |
| `error` | `string \| null` | Error message if connection or streaming protocol encountered a failure. |
| `source` | `TelemetrySource` | `'hardware'` while the WebSocket session is connected, `'unavailable'` otherwise. It records that the cloud session is open, not that device hardware is involved. |
| `context` | `TraceContext \| null` | Trace context of the current session, or `null` before `connect()`. |
| `connect` | `(run: GeminiLiveRunOptions) => Promise<GeminiLiveConnectResult>` | Opens the Live session. See Functions. |
| `disconnect` | `() => void` | Closes the active live streaming session. |
| `sendText` | `(text: string) => void` | Sends a text prompt through the live duplex session. |
| `sendAudioChunk` | `(pcmBase64: string) => void` | Streams a base64 PCM audio chunk from the microphone array. |
| `sendImageChunk` | `(base64Data: string, mimeType?: string) => void` | Streams a base64 camera image or video frame into the real-time multimodal live session. |
| `sendVideoFrame` | `(base64Jpeg: string) => void` | Streams a continuous camera video frame (JPEG base64) into the real-time live session. |
| `sendMultimodalTurn` | `(text: string, images?: Array<{ data: string; mimeType?: string }>) => void` | Sends a multimodal user turn containing both text and image attachments. |
| `clearTranscript` | `() => void` | Clears the transcript and active tool calls. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `connect(run)` | `run: GeminiLiveRunOptions` — `{ context: TraceContext; capabilityAdapter: CapabilityAdapter; apiKey?: string; sink?: ObservabilitySink; redaction?: RedactionPolicy }`. Tools the adapter does not list are not offered to the model. | `Promise<GeminiLiveConnectResult>` — `{ status: 'connected' \| 'unavailable' \| 'error' \| 'cancelled', context, reason? }` | Opens the duplex WebSocket. Without an API key it resolves `status: 'unavailable'` with reason `gemini_api_key_unavailable`. |
| `disconnect()` | none | `void` | Terminates the streaming session. |
| `sendText(text)` | `text: string` | `void` | Sends a text message to the live session. |
| `sendAudioChunk(pcmBase64)` | `pcmBase64: string` | `void` | Sends a PCM audio packet to the live session. |
| `sendImageChunk(base64Data, mimeType)` | `base64Data: string, mimeType?: string` | `void` | Streams a base64 camera frame into the live multimodal session. |
| `sendVideoFrame(base64Jpeg)` | `base64Jpeg: string` | `void` | Streams a continuous camera video frame into the live session. |
| `sendMultimodalTurn(text, images)` | `text: string, images?: Array` | `void` | Sends a user turn with both text and image attachments. |
| `clearTranscript()` | none | `void` | Clears conversation history and active tool calls. |

## Example
```tsx
import { useGeminiLive, createHardwareCapabilityAdapter, createTraceContext } from '@pixelkit-labs/sdk';

function VisionVoiceTriage() {
  const { isConnected, connect, disconnect, sendText, sendVideoFrame } = useGeminiLive();
  const start = async () => {
    const result = await connect({
      context: createTraceContext(),
      capabilityAdapter: createHardwareCapabilityAdapter({}),
    });
    if (result.status !== 'connected') console.warn(result.reason);
  };
  return (
    <View>
      <Button title={isConnected ? "Disconnect" : "Connect Live"} onPress={isConnected ? disconnect : start} />
      <Button title="Stream Camera Frame" onPress={() => sendVideoFrame(base64Jpeg)} disabled={!isConnected} />
      <Button title="Ask Status" onPress={() => sendText("Check battery and thermals")} disabled={!isConnected} />
    </View>
  );
}
```

:::note
`connect()` needs a trace context and a capability adapter; an adapter with no tools is valid. Check the returned `status`. The hook has no `interrupt` action and does not play audio; end a session with `disconnect()`.
:::
