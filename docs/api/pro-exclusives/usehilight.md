# useHiLight

**Source:** [packages/sdk/src/hardware/useHiLight.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useHiLight.ts)

Hardware driver and state machine for the eight-LED **HiLight** array around the Pixel 11 Pro flash. Android restricts `CONTROL_DEVICE_LIGHTS` to signature|privileged permissions, which only Google system apps and `android.uid.shell` (UID 2000) hold.

PixelKit includes a native, zero-dependency Java daemon (`scripts/hilight-daemon/`, started via `npm run hilight:daemon`) that runs as UID 2000 over ADB on `127.0.0.1:11080`. When it is running, `useHiLight` drives the physical LEDs directly. Without it the LEDs cannot be driven: `availability` is `'unavailable'` and every control function refuses (resolves `false` and sets `error`) rather than pretending a colour was shown. `isActive`, `mode` and `currentColor` change only after the daemon accepted the command.

| `availability` | Condition | Effect of the colour methods | `source` |
| :--- | :--- | :--- | :--- |
| `'hardware'` | Native ADB daemon active (`npm run hilight:daemon`) | Drives real physical LEDs via `ILightsManager` | `'hardware'` |
| `'unavailable'` | Pixel 11 Pro without the daemon running | The LEDs cannot be driven; control functions resolve `false` and set `error` | `'unavailable'` |
| `'unsupported'` | No HiLight array on this device | Control functions resolve `false` and set `error` | `'unavailable'` |

It probes the daemon on mount and every 5,000 ms, and clears any pending auto-off timer on unmount.

## Signature
```typescript
function useHiLight(): {
 availability: 'hardware' | 'unavailable' | 'unsupported';
 isHardwareSupported: boolean;
 source: TelemetrySource;
 isDaemonConnected: boolean;
 isActive: boolean;
 currentColor: string;
 mode: HiLightMode;
 brightness: number;
 error: string | null;
 refreshDaemonStatus: () => Promise<boolean>;
 setColor: (hexColor: string) => Promise<boolean>;
 setMode: (mode: HiLightMode, hexColor?: string) => Promise<boolean>;
 setBrightness: (level: number) => Promise<boolean>;
 triggerGeminiPulse: (durationMs?: number) => Promise<boolean>;
 triggerContactAlert: (hexColor: string, durationMs?: number) => Promise<boolean>;
 turnOff: () => Promise<boolean>;
 toggle: () => Promise<boolean>;
};

type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `availability` | `'hardware' \| 'unavailable' \| 'unsupported'` | Whether calls reach real LEDs, cannot reach them right now, or the device has no array at all. Read this before offering a control. |
| `isHardwareSupported` | `boolean` | Whether this device physically has the LED array, independent of whether the daemon is up. |
| `source` | `TelemetrySource` | `'hardware'` only when the array exists **and** the daemon answered; `'unavailable'` otherwise. |
| `isDaemonConnected` | `boolean` | Whether the local daemon answered its last status probe, polled every 5 s. |
| `isActive` | `boolean` | Whether the ring is lit, as of the last command the daemon accepted. |
| `currentColor` | `string` | Active colour as a hex string, e.g. `'#00E5FF'`. |
| `mode` | `HiLightMode` | Active pattern: `off`, `glow`, `breathing`, `pulse`, `gemini_thinking`, `incoming_call` or `notification`. |
| `brightness` | `number` | 0.0 to 1.0, sent to the daemon with the next lit command. The initial `0.85` is the hook's default request, not a reading. |
| `error` | `string \| null` | Latest failure message from a refused or failed control call, or `null` after the next accepted command. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshDaemonStatus()` | none | `Promise<boolean>` — whether the daemon answered | Probes `GET /status` immediately instead of waiting for the next 5 s poll. |
| `setColor(hexColor)` | `hexColor: string` — RGB hex, e.g. `'#81C995'` | `Promise<boolean>` — `true` when the daemon accepted the command | Sets a solid colour and turns the ring on, switching mode from `off` to `glow` if needed. State updates only on success. |
| `setMode(mode, hexColor?)` | `mode: HiLightMode`; `hexColor?: string` — colour for the same command, default `currentColor` | `Promise<boolean>` — `true` when the daemon accepted the command | Switches the pattern. Passing `'off'` extinguishes the ring. |
| `setBrightness(level)` | `level: number` — 0.0 to 1.0, clamped | `Promise<boolean>` — daemon result while lit; `true` while off (the level is kept for the next lit command) | Sets the brightness sent to the daemon. |
| `triggerGeminiPulse(durationMs?)` | `durationMs?: number` — how long to hold before clearing, default `4000` | `Promise<boolean>` — `true` when the daemon accepted the command | Cyan `gemini_thinking` hold that clears itself. Pair it with a model call. |
| `triggerContactAlert(hexColor, durationMs?)` | `hexColor: string` — the alert colour. `durationMs?: number` — hold time, default `5000`. | `Promise<boolean>` — `true` when the daemon accepted the command | Coloured `incoming_call` hold for a caller or event, then clears itself. |
| `turnOff()` | none | `Promise<boolean>` — `true` when the daemon accepted the command | Sends the off command and cancels any pending auto-off timer. |
| `toggle()` | none | `Promise<boolean>` — `true` when the daemon accepted the command | Switches between off and a default blue glow. |

## Example
```tsx
import { useHiLight, HapticButton } from '@pixelkit-labs/sdk';

export function HiLightHUD() {
 const hilight = useHiLight();
 return (
 <View>
 <Text>{hilight.availability} · {hilight.mode}</Text>
 <HapticButton
 title="Thinking pulse (4 s)"
 onPress={() => hilight.triggerGeminiPulse(4000)}
 disabled={hilight.availability !== 'hardware'}
 />
 </View>
 );
}
```
