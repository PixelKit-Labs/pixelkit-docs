# useHaptics

**Source:** [packages/sdk/src/hardware/useHaptics.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useHaptics.ts)

Drives the Linear Resonant Actuator: standard Pixel patterns through `expo-haptics`, plus the vibrator's real capabilities and **Android 16 envelope effects** (`VibrationEffect.BasicEnvelopeBuilder`) and primitive compositions through the PixelNative module. Capabilities are read once per app, not once per button.

Verified on Pixel 11 Pro: resonant **134.4 Hz**, Q 14.5, amplitude control, `CAP_COMPOSE_PWLE_EFFECTS_V2` (envelopes supported), primitives `CLICK, TICK, QUICK_RISE, SLOW_RISE, QUICK_FALL, THUD, SPIN, LOW_TICK`. Vibrator capabilities are read once per app process and cached.

## Signature
```typescript
function useHaptics(): {
 triggerHaptic: (type?: HapticType) => Promise<void>;
 selection: () => Promise<void>;
 light: () => Promise<void>;
 medium: () => Promise<void>;
 heavy: () => Promise<void>;
 success: () => Promise<void>;
 warning: () => Promise<void>;
 error: () => Promise<void>;
 playEnvelope: (points: EnvelopePoint[], initialSharpness?: number) => boolean;
 playPrimitives: (steps: PrimitiveStep[]) => boolean;
 cancel: () => void;
 hasAmplitudeControl: boolean | null;
 envelopeSupported: boolean;
 resonantFrequencyHz: number | null;
 supportedPrimitives: string[];
 source: TelemetrySource;
};

type EnvelopePoint = { intensity: number; sharpness: number; durationMs: number };
type PrimitiveStep = { primitive: 'CLICK' | 'TICK' | 'THUD' | 'SPIN' | 'QUICK_RISE' | 'SLOW_RISE' | 'QUICK_FALL' | 'LOW_TICK'; scale?: number; delayMs?: number };
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `hasAmplitudeControl` | `boolean \| null` | Whether the actuator can vary intensity rather than only on/off. `null` before the capability read or when the native module is absent. |
| `envelopeSupported` | `boolean` | Whether `playEnvelope` will do anything: Android 16+ with PWLE v2 support. `false` when unknown. |
| `resonantFrequencyHz` | `number \| null` | The actuator's resonant frequency, 134.4 Hz here. Effects near it feel strongest. `null` when not reported. |
| `supportedPrimitives` | `string[]` | Primitive names `playPrimitives` accepts on this device. Empty when none are reported. |
| `source` | `TelemetrySource` | `'hardware'` on device, `'unavailable'` on web. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `triggerHaptic(type?)` | `type?: HapticType` — `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error'`, default `'light'` | `Promise<void>` — resolves when dispatched; failures are logged, not thrown | Plays a standard platform pattern. No-op on web. |
| `selection()` `light()` `medium()` `heavy()` `success()` `warning()` `error()` | none | `Promise<void>` | Named shorthands for `triggerHaptic` with that type. |
| `playEnvelope(points, initialSharpness?)` | `points: EnvelopePoint[]` — each `{ intensity 0..1, sharpness 0..1, durationMs }`; the envelope must end at intensity 0, which the module appends. `initialSharpness?: number` — sharpness to start from, 0..1. | `boolean` — `false` when envelopes are unsupported or the call threw, `true` when dispatched | Android 16+ amplitude/sharpness curve. Check `envelopeSupported` first. |
| `playPrimitives(steps)` | `steps: PrimitiveStep[]` — each `{ primitive, scale?: number 0..1, delayMs?: number }`; `scale` sets strength, `delayMs` the gap before that step | `boolean` — `false` when the native module is absent or the call threw | Android 11+ composition of hardware primitives. |
| `cancel()` | none | `void` | Stops any vibration in progress, including an envelope or composition. |

## Presets
`HapticEnvelopes.thinkingRamp` (a slow swell and release, for "the model is thinking"), `HapticEnvelopes.doublePulse` (two crisp pulses, "response ready"), `HapticEnvelopes.spring` (the bouncing spring from the Android haptics guide).

```tsx
const haptics = useHaptics();
if (haptics.envelopeSupported) haptics.playEnvelope(HapticEnvelopes.thinkingRamp);
haptics.playPrimitives([{ primitive: 'QUICK_RISE', scale: 0.8 }, { primitive: 'THUD', delayMs: 40 }]);
```

## Tactile Pattern Mapping
* `selection()`: subtle tick for sliders, wheel pickers and tab transitions.
* `light()`: soft mechanical tap for button presses.
* `medium()`: solid click for modal reveals and drawers.
* `heavy()`: firm thud for destructive actions.
* `success()`: double-pulse positive confirmation.
* `warning()`: pulsed alert.
* `error()`: triple-pulse validation failure.
