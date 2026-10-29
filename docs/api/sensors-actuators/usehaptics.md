# useHaptics

**Source:** [packages/sdk/src/hardware/useHaptics.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useHaptics.ts)

Standard Pixel patterns through `expo-haptics`, plus the vibrator's reported capabilities and **Android 16 envelope effects** (`VibrationEffect.BasicEnvelopeBuilder`) and primitive compositions through the PixelNative module. Capabilities are read once per app, not once per button.

Vibrator capabilities (amplitude control, resonant frequency, envelope support, primitives) are whatever `Vibrator` reports on the running device; they are read once per app process and cached.

## Signature
```typescript
function useHaptics(): {
 triggerHaptic: (type?: HapticType) => Promise<boolean>;
 selection: () => Promise<boolean>;
 light: () => Promise<boolean>;
 medium: () => Promise<boolean>;
 heavy: () => Promise<boolean>;
 success: () => Promise<boolean>;
 warning: () => Promise<boolean>;
 error: () => Promise<boolean>;
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
| `resonantFrequencyHz` | `number \| null` | The actuator's resonant frequency in Hz as the vibrator reports it. Effects near it feel strongest. `null` when not reported. |
| `supportedPrimitives` | `string[]` | Primitive names `playPrimitives` accepts on this device. Empty when none are reported. |
| `source` | `TelemetrySource` | `'hardware'` once the vibrator capability read succeeded; `'unavailable'` before it, on web, or without the native module. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `triggerHaptic(type?)` | `type?: HapticType` — `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error'`, default `'light'` | `Promise<boolean>` — `true` when the platform call completed without throwing (the platform does not confirm the actuator moved); `false` on web or when the call threw (failures are logged, not thrown) | Plays a standard platform pattern through expo-haptics. |
| `selection()` `light()` `medium()` `heavy()` `success()` `warning()` `error()` | none | `Promise<boolean>` | Named shorthands for `triggerHaptic` with that type. |
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
