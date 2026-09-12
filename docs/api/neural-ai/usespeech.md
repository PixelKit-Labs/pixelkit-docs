# useSpeech

**Source:** [packages/sdk/src/ai/useSpeech.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useSpeech.ts)

Text to speech on `expo-speech`, the output half of the voice story: `useSpeechAI` listens, this one talks back.

Voices come from the platform speech service, so language coverage and quality depend on what the user has downloaded in system settings rather than on this app. Read `voices` instead of assuming a language exists. `speak` resolves when the engine finishes, so utterances can be awaited in sequence instead of overlapping. Text longer than `maxInputLength` is rejected rather than silently truncated, and the engine is stopped on unmount so speech does not continue after the screen is gone. It reads the installed voices on mount. Per-utterance settings go in the `speak` options; `setVoice`, `setRate` and `setPitch` set the defaults those options fall back to.

## Signature
```typescript
function useSpeech(): {
 isSpeaking: boolean;
 isPaused: boolean;
 voices: Voice[];
 voice: string | null;
 rate: number;
 pitch: number;
 maxInputLength: number;
 lastSpokenText: string | null;
 error: string | null;
 source: TelemetrySource;
 speak: (text: string, options?: SpeakOptions) => Promise<void>;
 stop: () => Promise<void>;
 pause: () => Promise<void>;
 resume: () => Promise<void>;
 checkSpeaking: () => Promise<boolean>;
 refreshVoices: () => Promise<Voice[]>;
 voicesForLanguage: (languageTag: string) => Voice[];
 setVoice: (id: string | null) => void;
 setRate: (n: number) => void;
 setPitch: (n: number) => void;
};
```

| `SpeakOptions` field | Type | Description |
| :--- | :--- | :--- |
| `language` | `string` | BCP-47 tag, e.g. `'en-GB'`. Defaults to the system language. |
| `voice` | `string` | Identifier from `voices`. Overrides `language` when both are given. |
| `rate` | `number` | Speaking speed; `1` is normal, lower is slower. Falls back to the hook's `rate`. |
| `pitch` | `number` | Voice pitch; `1` is normal. Falls back to the hook's `pitch`. |
| `volume` | `number` | 0 to 1 for this utterance. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSpeaking` | `boolean` | Whether the engine is currently speaking. |
| `isPaused` | `boolean` | Whether speech is paused rather than stopped. |
| `voices` | `Voice[]` | Installed voices: `{ identifier, name, language, quality }`. Empty when none are installed or the read failed. |
| `voice` | `string \| null` | Selected voice identifier, or `null` for the system default. |
| `rate` | `number` | Default speaking speed; `1` is normal. |
| `pitch` | `number` | Default pitch; `1` is normal. |
| `maxInputLength` | `number` | Longest string the engine accepts in one call. Longer text is rejected, not truncated. |
| `lastSpokenText` | `string \| null` | Text of the most recent utterance. |
| `error` | `string \| null` | Why the last call failed, including the length rejection message. |
| `source` | `TelemetrySource` | `'hardware'` once voices have been read, `'unavailable'` before that. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `speak(text, options?)` | `text: string` — trimmed before use; blank input resolves immediately. `options?: SpeakOptions` — see the table above. | `Promise<void>` — resolves when the engine finishes or is stopped; **rejects** when the text exceeds `maxInputLength` or the engine errors | Await it to sequence utterances instead of overlapping them. |
| `stop()` | none | `Promise<void>` | Stops immediately and clears the speaking and paused flags. |
| `pause()` | none | `Promise<void>` — sets `error` where the engine does not support pausing | Pauses mid-utterance. |
| `resume()` | none | `Promise<void>` | Continues a paused utterance. |
| `checkSpeaking()` | none | `Promise<boolean>` — the engine's own answer, also written to `isSpeaking` | Asks the engine directly rather than trusting the local flag. |
| `refreshVoices()` | none | `Promise<Voice[]>` — the list, also written to `voices` | Re-reads installed voices, e.g. after the user downloads one in Settings. |
| `voicesForLanguage(languageTag)` | `languageTag: string` — a prefix such as `'en'` or a full tag such as `'en-GB'`, matched case-insensitively | `Voice[]` — matching voices; empty when none are installed | Filters `voices` so you can offer a real choice. |
| `setVoice(id)` | `id: string \| null` — an identifier from `voices`, or `null` for the system default | `void` | Sets the default voice for later `speak` calls. |
| `setRate(n)` / `setPitch(n)` | `n: number` — `1` is normal | `void` | Set the defaults `speak` falls back to. |

## Example
```tsx
import { useSpeech, HapticButton } from '@pixelkit-labs/sdk';
import { useGeminiNano } from '@pixelkit-labs/sdk/mlkit';

export function TalkBack() {
 const speech = useSpeech();
 const nano = useGeminiNano();

 const answer = async () => {
 const reply = await nano.generate('Describe the thermal state in one sentence.');
 await speech.speak(reply.text, { rate: 0.95 });
 };

 return <HapticButton title="Ask and speak" onPress={answer} disabled={speech.isSpeaking} />;
}
```

> Await `speak` rather than firing several in a row, and check `voices` before promising a language.
