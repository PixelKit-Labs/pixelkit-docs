# useBiometrics

**Source:** [packages/sdk/src/hardware/useBiometrics.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useBiometrics.ts)

Fingerprint and face authentication through the platform `BiometricPrompt` (`expo-local-authentication`). Sensor presence and enrolment are reported separately, because a device can have the sensor with nothing enrolled, in which case a prompt can never succeed and the caller should offer a passcode path instead of a button that always fails.

A failed prompt is not a broken one: `authenticate` resolves `false` for a cancel or a mismatch and sets `error` only when the call itself failed. Capabilities are read on mount.

## Signature
```typescript
function useBiometrics(): BiometricState & {
 hasChecked: boolean;
 lastResult: 'success' | 'failed' | 'cancelled' | null;
 error: string | null;
 source: TelemetrySource;
 authenticate: (promptMessage?: string) => Promise<boolean>;
 refresh: () => Promise<void>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `hasHardware` | `boolean` | Whether a biometric sensor exists. Stays `false` when the capability read failed, rather than claiming hardware that was not confirmed. |
| `isEnrolled` | `boolean` | Whether the user has enrolled a fingerprint or face. Without this a prompt cannot succeed. |
| `supportedTypes` | `string[]` | Modalities the platform reports, e.g. `['Fingerprint', 'Face Unlock']`. |
| `hasChecked` | `boolean` | Whether the capability read has completed. Before it, treat the other flags as unknown rather than false. |
| `lastResult` | `'success' \| 'failed' \| 'cancelled' \| null` | Outcome of the last prompt. `null` before the first attempt. Distinguishes a deliberate cancel from a rejected credential. |
| `error` | `string \| null` | Set only when a call itself failed — not when the user cancelled or was not recognised. |
| `source` | `TelemetrySource` | `'hardware'` once capabilities have been read, `'unavailable'` before that. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `authenticate(promptMessage?)` | `promptMessage?: string` — the line shown in the system sheet, default `'Verify identity with Pixel Biometrics'`. | `Promise<boolean>` — `true` only on success; `false` for a cancel, a mismatch, missing hardware or nothing enrolled | Shows the system prompt with a Cancel action and a device-passcode fallback. Refuses up front (setting `error`) when there is no hardware or no enrolment. |
| `refresh()` | none | `Promise<void>` — updates `hasHardware`, `isEnrolled`, `supportedTypes` | Re-reads sensor presence and enrolment. Call it when returning from Settings, where the user may have just enrolled a finger. |
