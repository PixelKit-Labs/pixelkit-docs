# useAudio

**Source:** [packages/sdk/src/hardware/useAudio.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useAudio.ts)

Microphone capture, level metering and playback on `expo-audio`. Two capture profiles: `speech` (16 kHz mono through the Pixel `voice_recognition` path, which applies the platform's noise suppression) and `studio` (48 kHz stereo through `unprocessed`, the raw microphone signal). Nothing is simulated: before the first sample `meteringDecibels` sits at the silence floor and `source` is `'unavailable'`.

Verified on Pixel 11 Pro: `dumpsys audio` shows `src:VOICE_RECOGNITION pack:com.pixelkit.sdk` while the speech profile is recording. It requests microphone permission on mount and clears every timer on unmount. Per-take options go to `startRecording`.

## Signature
```typescript
function useAudio(): {
 isRecording: boolean; isPaused: boolean; canRecord: boolean; permissionGranted: boolean;
 durationSeconds: number; quality: 'speech' | 'studio';
 meteringDecibels: number; peakDecibels: number; level: number;
 isSilent: boolean; silenceThresholdDbfs: number; setSilenceThresholdDbfs: (dbfs: number) => void;
 inputs: RecordingInput[]; currentInputUid: string | null; route: 'speaker' | 'earpiece';
 lastRecordingUri: string | null; isPlaying: boolean;
 playbackPositionSeconds: number; playbackDurationSeconds: number;
 source: TelemetrySource; error: string | null;
 startRecording: (options?: { maxDurationSeconds?: number; quality?: 'speech' | 'studio' }) => Promise<boolean>;
 pauseRecording: () => boolean; resumeRecording: () => boolean;
 stopRecording: () => Promise<string | null>;
 setQuality: (quality: 'speech' | 'studio') => void;
 refreshInputs: () => RecordingInput[]; selectInput: (uid: string) => boolean;
 setRoute: (route: 'speaker' | 'earpiece') => Promise<void>;
 playLastRecording: (uri?: string) => Promise<boolean>;
 pausePlayback: () => void; stopPlayback: () => Promise<void>; seekPlayback: (seconds: number) => Promise<void>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRecording` | `boolean` | Whether the microphone is open. Stays `true` while paused. |
| `isPaused` | `boolean` | Whether the open take is paused rather than stopped. |
| `canRecord` | `boolean` | The recorder's own readiness flag, from `RecorderState.canRecord`. |
| `permissionGranted` | `boolean` | Whether microphone permission has been granted. |
| `durationSeconds` | `number` | Elapsed seconds of the current take, one decimal, updated every 100 ms. |
| `quality` | `'speech' \| 'studio'` | Active capture profile. `speech` = 16 kHz mono, noise-suppressed; `studio` = 48 kHz stereo, unprocessed. |
| `meteringDecibels` | `number` | Live level in dBFS: −160 is digital silence, 0 is clipping. |
| `peakDecibels` | `number` | Loudest dBFS seen during this take, reset at each start. |
| `level` | `number` | The level mapped to 0–1 for a meter, floored at −60 dBFS. |
| `isSilent` | `boolean` | `true` until the level rises above `silenceThresholdDbfs`, and always `true` before the first sample. |
| `silenceThresholdDbfs` | `number` | Speech/silence boundary in dBFS, default `-45`. Quiet rooms sit near −50. |
| `inputs` | `RecordingInput[]` | Microphones the platform offers, each with a `uid`, `name` and `type`. Only populated once a recording has been prepared. |
| `currentInputUid` | `string \| null` | Which microphone is selected, or `null` when the platform is choosing. |
| `route` | `'speaker' \| 'earpiece'` | Where playback is routed. |
| `lastRecordingUri` | `string \| null` | File URI of the last completed recording. Feed it to `useSpeechAI`, `useVideo` or `useMediaLibrary().save()`. |
| `isPlaying` | `boolean` | Whether playback is running. |
| `playbackPositionSeconds` | `number` | Position in the playing file, polled 5× a second. |
| `playbackDurationSeconds` | `number` | Length of the playing file, `0` until it loads. |
| `source` | `TelemetrySource` | `'hardware'` once a real level sample has arrived, `'unavailable'` before that. |
| `error` | `string \| null` | Why the last capture, routing or playback call failed. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRecording(options?)` | `options.maxDurationSeconds?: number` — stop automatically after this long; the native recorder stops itself and the hook finalises the file. `options.quality?: 'speech' \| 'studio'` — profile for this take, which also becomes the active profile. | `Promise<boolean>` — `true` when recording started, `false` when permission was denied or the recorder refused (see `error`) | Requests permission if needed, prepares the profile, starts metering at 10 Hz and reads the input list. |
| `pauseRecording()` | none | `boolean` — `true` when the take was paused | Pauses without finalising the file. |
| `resumeRecording()` | none | `boolean` — `true` when the take resumed | Continues the same take. |
| `stopRecording()` | none | `Promise<string \| null>` — the recorded file URI, or `null` when nothing was recording or the stop failed | Finalises the file, stops metering and sets `lastRecordingUri`. |
| `setQuality(quality)` | `quality: 'speech' \| 'studio'` | `void` | Switches the capture profile. Takes effect on the next recording, not the current one. |
| `refreshInputs()` | none | `RecordingInput[]` — the list, also written to `inputs` | Re-reads available microphones. Only valid once the recorder has been prepared. |
| `selectInput(uid)` | `uid: string` — a `uid` from `inputs` | `boolean` — `true` when the platform accepted it | Chooses between the built-in array and an attached USB or Bluetooth microphone. |
| `setRoute(route)` | `route: 'speaker' \| 'earpiece'` | `Promise<void>` | Routes playback to the loudspeaker or the call earpiece, at the audio-mode level. |
| `playLastRecording(uri?)` | `uri?: string` — a specific file; defaults to `lastRecordingUri` | `Promise<boolean>` — `true` when playback started, `false` when there is nothing to play | Plays a recording and starts position polling. |
| `pausePlayback()` | none | `void` | Pauses where it is. |
| `stopPlayback()` | none | `Promise<void>` | Pauses and seeks back to the start. |
| `seekPlayback(seconds)` | `seconds: number` — absolute position, negatives clamped to 0 | `Promise<void>` | Jumps within the playing file. |
| `setSilenceThresholdDbfs(dbfs)` | `dbfs: number` — Threshold in dBFS, -45 by default. A quiet room sits near -50, so raising it makes isSilent stricter. | Returns nothing; isSilent re-evaluates on the next metering sample. | Moves the boundary between silence and speech that isSilent reports against. |

## Example
```tsx
const audio = useAudio();
await audio.startRecording({ quality: 'speech', maxDurationSeconds: 30 });
// audio.level drives a meter; audio.isSilent gates a "say something" hint
const uri = await audio.stopRecording();
await audio.playLastRecording();
```
