# useSpeechAI

**Source:** [packages/sdk/src/ai/useSpeechAI.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useSpeechAI.ts)

Speech recognition in two modes. **On-device** uses Android System Intelligence through `SpeechRecognizer` in the native module: partial results stream in as you speak, and nothing leaves the phone. **Cloud** records through `useAudio` (16 kHz mono via the `voice_recognition` source) and transcribes with Gemini audio understanding.

Without an API key in cloud mode the recording is kept (`lastRecordingUri`) and `error` is set to `NO_API_KEY_MESSAGE`. There is no simulated transcript in either mode. It probes on-device recognition availability on mount and subscribes to the speech events. Mode is chosen with `setRecognitionMode`, defaulting to `'on-device'`.

## Signature
```typescript
function useSpeechAI(): {
 isListening: boolean;
 isTranscribing: boolean;
 recognitionMode: 'on-device' | 'cloud';
 setRecognitionMode: (mode: 'on-device' | 'cloud') => void;
 isOfflineAvailable: boolean;
 streamingPartial: string;
 voiceDecibels: number;
 lastTranscript: SpeechTranscriptionResult | null;
 lastRecordingUri: string | null;
 error: string | null;
 source: TelemetrySource;
 model: string;
 startListening: () => Promise<boolean>;
 stopListeningAndTranscribe: () => Promise<SpeechTranscriptionResult | null>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isListening` | `boolean` | Whether the microphone is open, in either mode. |
| `isTranscribing` | `boolean` | Cloud mode only: `true` while audio is being sent and transcribed. |
| `recognitionMode` | `'on-device' \| 'cloud'` | Which engine will be used for the next take. |
| `isOfflineAvailable` | `boolean` | Whether on-device recognition is installed. When `false`, use cloud mode. |
| `streamingPartial` | `string` | Interim text from the on-device recognizer while the user is still speaking. Empty in cloud mode. |
| `voiceDecibels` | `number` | Live microphone level in dBFS: the recognizer's RMS on-device, the recorder's metering in cloud mode. |
| `lastTranscript` | `SpeechTranscriptionResult \| null` | `{ transcript, confidence, durationSeconds, latencyMs, language }`. `confidence` is `null` for cloud transcripts because Gemini does not report one. |
| `lastRecordingUri` | `string \| null` | Cloud mode: the audio file, kept even when transcription failed so nothing is lost. |
| `error` | `string \| null` | Why recognition failed, or the "no API key" message in cloud mode. |
| `source` | `TelemetrySource` | Provenance of the transcript: on-device or cloud; `'unavailable'` before either is ready. |
| `model` | `string` | Which engine produced the last transcript: `'Android System Intelligence (On-Device)'` or the cloud model id. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startListening()` | none | `Promise<boolean>` — `true` when the microphone opened, `false` with `error` set on permission denial or a recognizer failure | On-device: starts `SpeechRecognizer` and streams partials. Cloud: starts recording through `useAudio`. |
| `stopListeningAndTranscribe()` | none | `Promise<SpeechTranscriptionResult \| null>` — the transcript, or `null` when nothing was captured or transcription failed | On-device: stops the recognizer and returns the last result. Cloud: stops recording, uploads the audio and returns the Gemini transcript. |

## Example
```tsx
const speech = useSpeechAI();
const gemini = useGemini();

const handleVoice = async () => {
 if (speech.isListening) {
 const res = await speech.stopListeningAndTranscribe();
 if (res?.transcript) gemini.sendMessage(res.transcript);
 } else {
 await speech.startListening();
 }
};

<HapticButton
 title={speech.isListening ? `Listening (${speech.voiceDecibels} dB) — tap to finish` : 'Start voice'}
 onPress={handleVoice}
 variant={speech.isListening ? 'danger' : 'primary'}
/>
```
