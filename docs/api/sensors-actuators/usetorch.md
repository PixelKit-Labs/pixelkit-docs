# useTorch

**Source:** [packages/sdk/src/hardware/useTorch.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useTorch.ts)

Operates the rear camera flash LED through Android `CameraManager.setTorchMode` and, on Android 13+, `turnOnTorchWithStrengthLevel` for variable brightness. State follows the system torch callback, so a Quick Settings toggle is reflected here. Nothing is simulated: without the PixelNative module `isAvailable` is `false` and every action refuses.

Verified on Pixel 11 Pro: camera id `0`, **21 strength levels**; the camera HAL logs `Torch for camera id 0 turned on`. It reads torch capabilities on mount and subscribes to `onTorchState`. On unmount it clears any strobe timer and switches the LED off.

## Signature
```typescript
function useTorch(): {
 isAvailable: boolean;
 isTorchOn: boolean;
 isStrobing: boolean;
 maxStrengthLevel: number | null;
 error: string | null;
 source: TelemetrySource;
 setTorch: (on: boolean, strengthLevel?: number) => Promise<boolean>;
 toggleTorch: () => Promise<boolean>;
 startStrobe: (intervalMs?: number) => void;
 stopStrobe: () => void;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | `true` when a rear camera with a flash unit exists **and** the native module is present. Gate every control on this. |
| `isTorchOn` | `boolean` | Whether the LED is on, from `CameraManager.TorchCallback` — so it also tracks Quick Settings. |
| `isStrobing` | `boolean` | Whether the strobe timer is running. |
| `maxStrengthLevel` | `number \| null` | Highest value `setTorch` accepts as `strengthLevel` on Android 13+; 21 on this device. `null` when the platform does not report it. |
| `error` | `string \| null` | Why the last action failed, e.g. hardware unavailable. |
| `source` | `TelemetrySource` | `'hardware'` when the torch is usable, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setTorch(on, strengthLevel?)` | `on: boolean` — desired state. `strengthLevel?: number` — brightness from 1 to `maxStrengthLevel`, honoured on Android 13+ and ignored below it. Omit for the device default. | `Promise<boolean>` — `true` when the call was accepted, `false` when the hardware is unavailable or the call threw (see `error`) | Drives the physical LED. |
| `toggleTorch()` | none | `Promise<boolean>` — the state the torch is in afterwards | Inverts the current state, stopping any strobe first. |
| `startStrobe(intervalMs?)` | `intervalMs?: number` — half-period in milliseconds, default `150`, clamped to a minimum of `120` because the camera HAL needs roughly 50–100 ms per switch | `void` | Toggles the hardware torch on a timer. Replaces any strobe already running. |
| `stopStrobe()` | none | `void` | Cancels the timer and switches the LED off. |

## Example
```tsx
const torch = useTorch();
<HapticButton title={torch.isTorchOn ? 'Torch off' : 'Torch on'} onPress={() => torch.toggleTorch()} disabled={!torch.isAvailable} />
<HapticButton title="Dim" onPress={() => torch.setTorch(true, 1)} />
```
