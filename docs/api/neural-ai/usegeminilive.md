# useGeminiLive

Establishes a persistent full-duplex WebSocket connection to the Gemini Multimodal Live API. Streams base64-encoded PCM audio chunks and camera image/video frames from device sensors, receives low-latency synthesized speech responses, exposes live extended thinking thought streams, and intercepts model tool calls to execute device hardware actuators and sensors with zero round-trip delay.

## Signature
```typescript
useGeminiLive(config?: GeminiLiveConfig): GeminiLiveTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `config` | `GeminiLiveConfig` | Configuration options for model name, voice profile ('Aoede', 'Puck', etc.), system instruction, thinking budget, and hardware tool binding. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isConnected` | `boolean` | Whether the WebSocket session to Gemini Live is active and ready. |
| `isStreaming` | `boolean` | Whether the model is actively streaming an audio or text response. |
| `isSpeaking` | `boolean` | Whether synthesized speech audio is currently playing. |
| `isListening` | `boolean` | Whether the client is streaming microphone audio chunks to the server. |
| `isStreamingMedia` | `boolean` | Whether the client is actively streaming media (camera video frames or images) to the server. |
| `transcript` | `LiveMessage[]` | Real-time transcript of conversational dialogue. |
| `currentThinking` | `string \| null` | Latest reasoning thoughts emitted by the model during extended thinking. |
| `activeToolCalls` | `LiveToolCall[]` | Real-time hardware tool invocations executed during the session. |
| `error` | `string \| null` | Error message if connection or streaming protocol encountered a failure. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' when connected with valid key, or 'unavailable'. |
| `connect` | `(customApiKey?: string) => Promise<boolean>` | Establishes the bidirectional WebSocket session to the Gemini Live endpoint. |
| `disconnect` | `() => void` | Closes the active live streaming session. |
| `sendText` | `(text: string) => void` | Sends a text prompt through the live duplex session. |
| `sendAudioChunk` | `(pcmBase64: string) => void` | Streams a base64 PCM audio chunk from the microphone array. |
| `sendImageChunk` | `(base64Data: string, mimeType?: string) => void` | Streams a base64 camera image or video frame into the real-time multimodal live session. |
| `sendVideoFrame` | `(base64Jpeg: string) => void` | Streams a continuous camera video frame (JPEG base64) into the real-time live session. |
| `sendMultimodalTurn` | `(text: string, images?: Array<{ data: string; mimeType?: string }>) => void` | Sends a multimodal user turn containing both text and image attachments. |
| `interrupt` | `() => void` | Signals the model to interrupt speech immediately. |
| `clearTranscript` | `() => void` | Clears the transcript and active tool calls. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `connect(customApiKey)` | `customApiKey?: string` | `Promise<boolean>` | Opens the duplex WebSocket connection to Gemini Live. |
| `disconnect()` | none | `void` | Terminates the streaming session. |
| `sendText(text)` | `text: string` | `void` | Sends a text message to the live session. |
| `sendAudioChunk(pcmBase64)` | `pcmBase64: string` | `void` | Sends a PCM audio packet to the live session. |
| `sendImageChunk(base64Data, mimeType)` | `base64Data: string, mimeType?: string` | `void` | Streams a base64 camera frame into the live multimodal session. |
| `sendVideoFrame(base64Jpeg)` | `base64Jpeg: string` | `void` | Streams a continuous camera video frame into the live session. |
| `sendMultimodalTurn(text, images)` | `text: string, images?: Array` | `void` | Sends a user turn with both text and image attachments. |
| `interrupt()` | none | `void` | Interrupts model speech playback. |
| `clearTranscript()` | none | `void` | Clears conversation history and active tool calls. |

## Example
```tsx
import { useGeminiLive } from '@pixelkit-labs/sdk';

function VisionVoiceTriage() {
  const { isConnected, isStreaming, connect, disconnect, sendText, sendVideoFrame } = useGeminiLive();
  return (
    <View>
      <Button title={isConnected ? "Disconnect" : "Connect Live"} onPress={isConnected ? disconnect : () => connect()} />
      <Button title="Stream Camera Frame" onPress={() => sendVideoFrame(base64Jpeg)} disabled={!isConnected} />
      <Button title="Ask Status" onPress={() => sendText("Check battery and thermals")} disabled={!isConnected} />
    </View>
  );
}
```

:::note
Supports bidirectional audio duplex streaming, live camera frame ingestion, and real-time hardware tool calling over WebSockets.
:::
