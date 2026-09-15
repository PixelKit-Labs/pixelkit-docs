# useGeminiLive

Establishes a persistent full-duplex WebSocket connection to the Gemini Multimodal Live API. Streams base64-encoded PCM audio chunks from device microphones, receives low-latency synthesized speech responses, exposes live extended thinking thought streams, and intercepts model tool calls to execute device hardware actuators and sensors with zero round-trip delay.

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
| `transcript` | `LiveMessage[]` | Real-time transcript of conversational dialogue. |
| `currentThinking` | `string \| null` | Latest reasoning thoughts emitted by the model during extended thinking. |
| `activeToolCalls` | `LiveToolCall[]` | Real-time hardware tool invocations executed during the session. |
| `error` | `string \| null` | Error message if connection or streaming protocol encountered a failure. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' when connected with valid key, or 'unavailable'. |
| `connect` | `(customApiKey?: string) => Promise<boolean>` | Establishes the bidirectional WebSocket session to the Gemini Live endpoint. |
| `disconnect` | `() => void` | Closes the active live streaming session. |
| `sendText` | `(text: string) => void` | Sends a text prompt through the live duplex session. |
| `sendAudioChunk` | `(pcmBase64: string) => void` | Streams a base64 PCM audio chunk from the microphone array. |
| `interrupt` | `() => void` | Signals the model to interrupt speech immediately. |
| `clearTranscript` | `() => void` | Clears the transcript and active tool calls. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `connect(customApiKey)` | none | `void` | Opens the duplex WebSocket connection to Gemini Live. |
| `disconnect()` | none | `void` | Terminates the streaming session. |
| `sendText(text)` | none | `void` | Sends a text message to the live session. |
| `sendAudioChunk(pcmBase64)` | none | `void` | Sends a PCM audio packet to the live session. |
| `interrupt()` | none | `void` | Interrupts model speech playback. |
| `clearTranscript()` | none | `void` | Clears conversation history and active tool calls. |

## Example
```tsx
import { useGeminiLive } from '@pixelkit-labs/sdk';

function VoiceTriage() {
  const { isConnected, isStreaming, connect, disconnect, sendText } = useGeminiLive();
  return (
    <View>
      <Button title={isConnected ? "Disconnect" : "Connect Live"} onPress={isConnected ? disconnect : () => connect()} />
      <Button title="Ask Status" onPress={() => sendText("Check battery and thermals")} disabled={!isConnected} />
    </View>
  );
}
```

:::note
Supports bidirectional audio duplex streaming and real-time hardware tool calling over WebSockets.
:::
