# useSpeech

**Source:** [packages/sdk/src/ai/useSpeech.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useSpeech.ts)

Text to speech through the system engine or an explicitly selected installed Android TTS service. `useSpeechAI` listens; this hook talks back.

Platform TTS, explicit Android TTS and Gemini Live audio use distinct output identities. For an explicit `enginePackage`, PixelKit inventories and rechecks the installed package/version, resolves the exact active engine and selected voice/locale, and rejects missing, changed, mismatched or unobservable identity before synthesis. `resolveSpeechEngineIdentity` performs preflight; `verifySpeechEngine` returns the pre-submission identity and correlated terminal synthesis record for a caller-supplied phrase. External apps own installation and model downloads, their execution provider remains unknown, and binding/playback callbacks do not prove audible voice identity. All speech operations take explicit application-owned trace context.

## Signature
```typescript
function useSpeech(): {
  isSpeaking: boolean;
  isPaused: boolean;
  voices: Voice[];
  speechEngines: SpeechEngineInfo[];
  lastSpeechIdentity: SpeechOutputIdentity | null;
  lastSynthesis: SpeechSynthesisResult | null;
  voice: string | null;
  rate: number;
  pitch: number;
  maxInputLength: number;
  lastSpokenText: string | null;
  error: string | null;
  source: TelemetrySource;
  speak: (text: string, run: SpeechRunOptions, options?: SpeakOptions) => Promise<void>;
  resolveSpeechEngineIdentity: (
    packageName: string,
    run: SpeechRunOptions,
    options?: { language?: string; voice?: string },
  ) => Promise<AndroidTtsIdentity>;
  verifySpeechEngine: (
    phrase: string,
    run: SpeechRunOptions,
    options: SpeechVerificationOptions,
  ) => Promise<SpeechVerificationResult>;
  getSpeechEngineStatus: () => SpeechEngineStatus | null;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  checkSpeaking: () => Promise<boolean>;
  refreshVoices: () => Promise<Voice[]>;
  refreshSpeechEngines: () => Promise<SpeechEngineInfo[]>;
  voicesForLanguage: (languageTag: string) => Voice[];
  setVoice: (id: string | null) => void;
  setRate: (n: number) => void;
  setPitch: (n: number) => void;
};
```

| `SpeakOptions` field | Type | Description |
| :--- | :--- | :--- |
| `language` | `string` | BCP-47 tag, e.g. `'en-GB'`. Explicit identity reports the locale Android selected. |
| `voice` | `string` | Identifier from `voices` or an explicit engine's `Voice.name`. |
| `rate` | `number` | Speaking speed; `1` is normal, lower is slower. Falls back to the hook's `rate`. |
| `pitch` | `number` | Voice pitch; `1` is normal. Falls back to the hook's `pitch`. |
| `volume` | `number` | 0 to 1 for this utterance. |
| `enginePackage` | `string` | Installed Android TTS package. Missing, changed, mismatched or unobservable active identity is rejected before synthesis. |
| `onIdentityResolved` | `(identity: AndroidTtsIdentity) => void` | Runs after exact identity preflight and before explicit text submission. |
| `onStart` / `onDone` / `onError` | `(event: SpeechPlaybackEvent) => void` | Utterance-correlated local callbacks. Duplicate, stale and post-terminal native callbacks are ignored. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSpeaking` | `boolean` | Whether the engine is currently speaking. |
| `isPaused` | `boolean` | Whether platform speech is paused rather than stopped. |
| `voices` | `Voice[]` | Installed platform voices: `{ identifier, name, language, quality }`. |
| `speechEngines` | `SpeechEngineInfo[]` | Installed Android TTS services with package, label, version and external installation ownership. |
| `lastSpeechIdentity` | `SpeechOutputIdentity \| null` | Latest discriminated platform, explicit Android or Gemini Live output identity. |
| `lastSynthesis` | `SpeechSynthesisResult \| null` | Latest explicit-engine terminal status, utterance ID, callbacks, timestamps and trace correlation. Phrase content is excluded. |
| `voice` | `string \| null` | Selected platform voice identifier, or `null` for the system default. |
| `rate` | `number` | Default speaking speed; `1` is normal. |
| `pitch` | `number` | Default pitch; `1` is normal. |
| `maxInputLength` | `number` | Longest string the engine accepts in one call. Longer text is rejected, not truncated. |
| `lastSpokenText` | `string \| null` | Text of the most recent utterance. This is caller-visible hook state, not native status/trace metadata. |
| `error` | `string \| null` | Why the last call failed. |
| `source` | `TelemetrySource` | `'hardware'` once voices have been read, otherwise `'unavailable'`. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `speak(text, run, options?)` | text, explicit `SpeechRunOptions`, optional controls/callbacks | `Promise<void>` | Speaks with platform TTS or one fail-closed explicit Android engine. Resolves on completion/stop; rejects invalid text, unavailable identity, initialization/configuration failure or synthesis error. |
| `resolveSpeechEngineIdentity(packageName, run, options?)` | package, trace context, optional language/voice | `Promise<AndroidTtsIdentity>` | Initializes and inspects the requested package without speaking. |
| `verifySpeechEngine(phrase, run, options)` | phrase, trace context, required explicit package | `Promise<SpeechVerificationResult>` | Resolves identity before submitting the phrase and returns the correlated terminal synthesis result. Audible identity still needs independent evidence. |
| `getSpeechEngineStatus()` | none | `SpeechEngineStatus \| null` | Reads current/latest native status without inferring provider identity. |
| `stop()` | none | `Promise<void>` | Stops speaking immediately and closes the owning local trace scope. |
| `pause()` / `resume()` | none | `Promise<void>` | Platform TTS only; explicit Android engines report pause/resume unavailable. |
| `checkSpeaking()` | none | `Promise<boolean>` | Asks the active engine directly and updates `isSpeaking`. |
| `refreshVoices()` | none | `Promise<Voice[]>` | Re-reads installed platform voices. |
| `refreshSpeechEngines()` | none | `Promise<SpeechEngineInfo[]>` | Re-reads installed Android TTS packages and versions. |
| `voicesForLanguage(languageTag)` | language prefix/full BCP-47 tag | `Voice[]` | Filters installed platform voices. |
| `setVoice(id)` / `setRate(n)` / `setPitch(n)` | default value | `void` | Sets defaults used by later `speak` calls. |

## Example
```tsx
import { createTraceContext, HapticButton, useSpeech } from '@pixelkit-labs/sdk';

export function TalkBack() {
  const speech = useSpeech();

  const answer = async () => {
    const run = {
      context: createTraceContext({ runId: `speech-${Date.now()}` }),
    };
    await speech.speak('The device is ready.', run, { rate: 0.95 });
  };

  return <HapticButton title="Speak" onPress={answer} disabled={speech.isSpeaking} />;
}
```

> Pass explicit trace context and await `speak`. Preflight an explicit package with `resolveSpeechEngineIdentity` or run a visible verification phrase with `verifySpeechEngine`; never infer the external app's execution provider or audible voice from binding/callback success.
