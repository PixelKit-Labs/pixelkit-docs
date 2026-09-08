# Pixel Pro Exclusives API Reference
> **HiLight Camera Bar LED Ring and Ultra-Wideband (UWB) Ranging**

This document covers hardware exclusive to Google's flagship Pro models. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

---

## Module Index

* [`useHiLight`](#usehilight) - Rear Camera Bar Multi-Colour Notification & Status Ring
* [`useUWB`](#useuwb) - Ultra-Wideband Ranging & Angle-of-Arrival (AoA)

---

## `useHiLight`

Hardware driver and state machine for the eight-LED **HiLight** array around the Pixel 11 Pro flash. Android restricts `CONTROL_DEVICE_LIGHTS` to signature|privileged permissions, which only Google system apps and `android.uid.shell` (UID 2000) hold.

PixelKit includes a native, zero-dependency Java daemon (`scripts/hilight-daemon/`, started via `npm run hilight:daemon`) that runs as UID 2000 over ADB on `127.0.0.1:11080`. When it is running, `useHiLight` drives the physical LEDs directly (~3 ms latency). Without it the LEDs cannot be driven: `availability` is `'unavailable'` and the control functions refuse rather than pretending a colour was shown.

| `availability` | Condition | Effect of the colour methods | `source` |
| :--- | :--- | :--- | :--- |
| `'hardware'` | Native ADB daemon active (`npm run hilight:daemon`) | Drives real physical LEDs via `ILightsManager` | `'hardware'` |
| `'unavailable'` | Pixel 11 Pro without the daemon running | The LEDs cannot be driven; state is tracked but nothing lights | `'unavailable'` |
| `'unsupported'` | No HiLight array on this device | Nothing | `'unavailable'` | It probes the daemon on mount and every 5,000 ms, and clears any pending auto-off timer on unmount.

### Signature
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
 isFaceDownMode: boolean;
 error: string | null;
 refreshDaemonStatus: () => Promise<boolean>;
 setColor: (hexColor: string) => void;
 setMode: (mode: HiLightMode) => void;
 setBrightness: (level: number) => void;
 triggerGeminiPulse: (durationMs?: number) => void;
 triggerContactAlert: (hexColor: string, durationMs?: number) => void;
 turnOff: () => void;
 toggle: () => void;
};

type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `availability` | `'hardware' \| 'unavailable' \| 'unsupported'` | Whether calls reach real LEDs, cannot reach them right now, or the device has no array at all. Read this before offering a control. |
| `isHardwareSupported` | `boolean` | Whether this device physically has the LED array, independent of whether the daemon is up. |
| `source` | `TelemetrySource` | `'hardware'` only when the array exists **and** the daemon answered; `'unavailable'` otherwise. |
| `isDaemonConnected` | `boolean` | Whether the local daemon answered its last status probe, polled every 5 s. |
| `isActive` | `boolean` | Whether the ring is currently meant to be lit. |
| `currentColor` | `string` | Active colour as a hex string, e.g. `'#00E5FF'`. |
| `mode` | `HiLightMode` | Active pattern: `off`, `glow`, `breathing`, `pulse`, `gemini_thinking`, `incoming_call` or `notification`. |
| `brightness` | `number` | 0.0 to 1.0. The hardware has no brightness channel, so this scales the RGB values sent to the daemon. |
| `isFaceDownMode` | `boolean` | Whether glanceable face-down behaviour is engaged. |
| `error` | `string \| null` | Latest failure message, or `null`. Failures are also logged and counted. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshDaemonStatus()` | none | `Promise<boolean>` — whether the daemon answered | Probes `GET /status` immediately instead of waiting for the next 5 s poll. |
| `setColor(hexColor)` | `hexColor: string` — RGB hex, e.g. `'#81C995'` | `void` | Sets a solid colour and turns the ring on, switching mode from `off` to `glow` if needed. |
| `setMode(mode)` | `mode: HiLightMode` | `void` | Switches the pattern. Passing `'off'` extinguishes the ring. |
| `setBrightness(level)` | `level: number` — 0.0 to 1.0, clamped | `void` | Scales the output. Applied immediately when the ring is lit. |
| `triggerGeminiPulse(durationMs?)` | `durationMs?: number` — how long to hold before clearing, default `4000` | `void` | Cyan `gemini_thinking` hold that clears itself. Pair it with a model call. |
| `triggerContactAlert(hexColor, durationMs?)` | `hexColor: string` — the alert colour. `durationMs?: number` — hold time, default `5000`. | `void` | Coloured `incoming_call` hold for a caller or event, then clears itself. |
| `turnOff()` | none | `void` | Clears the ring and cancels any pending auto-off timer. |
| `toggle()` | none | `void` | Switches between off and a default blue glow. |

### Example
```tsx
import { useHiLight, HapticButton } from 'pixelkit';

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

---

## `useUWB`

Ultra-Wideband transceiver state and ranging sessions. Chip presence, enabled state, chip id and ranging-service readiness are read from Android `UwbManager` and `PackageManager` through the native module (`source: 'hardware'`). Sessions are created through `UwbManager` / `RangingManager` with `startRanging(sessionId)`.

`activeTargets` is populated only by a live session that reports peers; it is empty rather than filled with placeholder anchors. Radio state is read from the native module per render; sessions are started explicitly.

### Signature
```typescript
function useUWB(): {
 isSupported: boolean;
 isEnabled: boolean;
 chipId: string | null;
 rangingApiSupported: boolean;
 error: string | null;
 source: TelemetrySource;
 isRanging: boolean;
 activeTargets: UWBSpatialTarget[];
 sessionInfo: UwbRangingResult | null;
 sessionError: string | null;
 startRanging: (sessionId?: number) => Promise<boolean>;
 stopRanging: () => void;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the UWB chip is present on this device. |
| `isEnabled` | `boolean` | Whether the UWB radio is switched on in system settings. |
| `chipId` | `string \| null` | Chip identifier from `UwbManager`, `'default'` on Pixel Pro. `null` when there is no chip. |
| `rangingApiSupported` | `boolean` | Whether the platform ranging service is available to apps. |
| `error` | `string \| null` | Latest failure message, or `null`. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present and the chip exists, `'unavailable'` otherwise. |
| `isRanging` | `boolean` | Whether a ranging session is currently open. |
| `activeTargets` | `UWBSpatialTarget[]` | Peers the session reports: `deviceId`, `distanceMeters`, `azimuthDegrees` (−180 to +180), `elevationDegrees` (−90 to +90), `signalQuality` (0–1 line-of-sight score). Empty when nothing is being tracked. |
| `sessionInfo` | `UwbRangingResult \| null` | Session diagnostics: `{ success, sessionId, technology, serviceAvailable, serviceName, rangingFeature, status, timestampMs }`. `null` before the first attempt. |
| `sessionError` | `string \| null` | Why the last session failed to start, e.g. no native ranging service or unsupported hardware. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(sessionId?)` | `sessionId?: number` — identifier for the session, default `1001`. Use distinct ids for concurrent sessions. | `Promise<boolean>` — `true` when the session opened; `false` with `sessionError` set when the service is missing or the hardware refused | Opens a hardware ranging session and stores the diagnostics in `sessionInfo`. |
| `stopRanging()` | none | `void` | Closes the session and clears `isRanging`. Safe to call when nothing is running. |

### Target structure
```typescript
interface UWBSpatialTarget {
 deviceId: string; // Identifier of the peer or anchor
 distanceMeters: number; // Range in metres
 azimuthDegrees: number; // Horizontal angle, -180 to +180
 elevationDegrees: number; // Vertical angle, -90 to +90
 signalQuality: number; // 0.0 to 1.0 line-of-sight score
}
```

### Example
```tsx
import { useUWB, HapticButton } from 'pixelkit';

export function RadarHUD() {
 const { activeTargets, isRanging, startRanging, stopRanging, sessionError } = useUWB();
 return (
 <View>
 {activeTargets.map(t => (
 <Text key={t.deviceId}>{t.deviceId}: {t.distanceMeters.toFixed(2)} m @ {t.azimuthDegrees}°</Text>
 ))}
 {sessionError ? <Text>{sessionError}</Text> : null}
 <HapticButton
 title={isRanging ? 'Stop ranging' : 'Start UWB ranging'}
 onPress={() => (isRanging ? stopRanging() : startRanging())}
 />
 </View>
 );
}
```
