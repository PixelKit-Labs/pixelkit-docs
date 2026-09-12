# useUWB

**Source:** [packages/sdk/src/hardware/useUWB.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useUWB.ts)

Ultra-Wideband transceiver state and ranging sessions. Chip presence, enabled state, chip id and ranging-service readiness are read from Android `UwbManager` and `PackageManager` through the native module (`source: 'hardware'`). Sessions are created through `UwbManager` / `RangingManager` with `startRanging(sessionId)`.

`activeTargets` is populated only by a live session that reports peers; it is empty rather than filled with placeholder anchors. Radio state is read from the native module per render; sessions are started explicitly.

## Signature
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

## Outputs
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

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(sessionId?)` | `sessionId?: number` — identifier for the session, default `1001`. Use distinct ids for concurrent sessions. | `Promise<boolean>` — `true` when the session opened; `false` with `sessionError` set when the service is missing or the hardware refused | Opens a hardware ranging session and stores the diagnostics in `sessionInfo`. |
| `stopRanging()` | none | `void` | Closes the session and clears `isRanging`. Safe to call when nothing is running. |

## Target structure
```typescript
interface UWBSpatialTarget {
 deviceId: string; // Identifier of the peer or anchor
 distanceMeters: number; // Range in metres
 azimuthDegrees: number; // Horizontal angle, -180 to +180
 elevationDegrees: number; // Vertical angle, -90 to +90
 signalQuality: number; // 0.0 to 1.0 line-of-sight score
}
```

## Example
```tsx
import { useUWB, HapticButton } from '@pixelkit-labs/sdk';

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
