# useUWB

**Source:** [packages/sdk/src/hardware/useUWB.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useUWB.ts)

Ultra-Wideband transceiver state and ranging sessions. Chip presence (the `android.hardware.uwb` feature), the enabled state (`UwbManager.isUwbEnabled()` by reflection, `null` when apps cannot read it) and ranging-service readiness (whether the Android 16 `RangingManager` service exists) are read through the native module (`source: 'hardware'`).

`startRanging(config)` opens a real `android.ranging.RangingSession` (Android 16, API 36+, RAW UWB session). Ranging needs a second device, so the call takes the peer's configuration: its UWB address, the session id, and optionally the channel, preamble index and key info, all agreed with the peer out of band (BLE, NFC, QR). It resolves `true` only when the platform reports the session open. Otherwise it resolves `false` and `sessionError` carries the status and reason. `measurements` holds the latest `android.ranging.RangingData` sample per peer and stays empty until the peer answers; it is never filled with placeholder anchors.

## Signature
```typescript
function useUWB(): {
 isSupported: boolean;
 isEnabled: boolean | null;
 rangingApiSupported: boolean;
 error: string | null;
 source: TelemetrySource;
 isRanging: boolean;
 measurements: UwbMeasurementEvent[];
 sessionInfo: UwbRangingResult | null;
 sessionError: string | null;
 startRanging: (config: UwbRangingConfig) => Promise<boolean>;
 stopRanging: () => UwbStopResult | null;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the UWB chip is present on this device. |
| `isEnabled` | `boolean \| null` | Whether the UWB radio is switched on in system settings; `null` when Android does not let apps read it. |
| `rangingApiSupported` | `boolean` | Whether the Android 16 `android.ranging.RangingManager` service exists. |
| `error` | `string \| null` | Latest failure message, or `null`. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present and the chip exists, `'unavailable'` otherwise. |
| `isRanging` | `boolean` | Whether the platform holds an open ranging session. Follows the platform's session events. |
| `measurements` | `UwbMeasurementEvent[]` | Latest sample per peer: `deviceId`, `distanceMeters`, `azimuthDegrees`, `elevationDegrees` (`null` when the platform omitted them), a `*Confidence` of `'low' \| 'medium' \| 'high'` for each, `rssi`, `timestampMs`. Empty until the peer answers. |
| `sessionInfo` | `UwbRangingResult \| null` | Result of the last start request: `{ success, status, error, sessionId, technology, serviceAvailable, serviceName, rangingFeature, timestampMs }`. `null` before the first attempt. |
| `sessionError` | `string \| null` | Status code and reason when the last start or stop failed, e.g. `needs_peer_configuration: peerAddress must be hex address bytes`. |

`status` is `'opened'` only after the platform's `onOpened`; the refusals are `needs_peer_configuration`, `uwb_unsupported`, `ranging_api_unavailable` (below Android 16), `uwb_disabled`, `permission_denied`, `session_active`, `invalid_parameters` and `open_failed`.

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(config)` | `config: UwbRangingConfig` — `{ sessionId, role: 'initiator' \| 'responder', localAddress, peerAddress, configId?, channel?, preambleIndex?, sessionKeyInfo?, updateRate?, slotDurationMs?, angleOfArrival? }`. Addresses and keys are hex bytes (2-byte short or 8-byte extended addresses); `channel` and `preambleIndex` go together. | `Promise<boolean>` — `true` when the platform reported the session open; `false` with `sessionError` set otherwise | Opens a ranging session with the peer and stores the result in `sessionInfo`. |
| `stopRanging()` | none | `UwbStopResult \| null` — `{ wasActive, closed, sessionId, error, timestampMs }` | Closes the session. `wasActive` is `false` when nothing was running; `error` carries a failure from the platform's stop or close. |

Ranging needs `android.permission.RANGING`, which the app must declare in its manifest and request at runtime; without it the status is `permission_denied`.

## Measurement structure
```typescript
interface UwbMeasurementEvent {
 sessionId: number;
 deviceId: string; // Platform identifier of the peer
 distanceMeters: number | null;
 distanceConfidence: 'low' | 'medium' | 'high' | null;
 azimuthDegrees: number | null; // Needs angleOfArrival and hardware support
 azimuthConfidence: 'low' | 'medium' | 'high' | null;
 elevationDegrees: number | null;
 elevationConfidence: 'low' | 'medium' | 'high' | null;
 rssi: number | null;
 technology: 'UWB';
 timestampMs: number;
}
```

## Example
```tsx
import { useUWB } from '@pixelkit-labs/sdk';

type UwbPeer = Parameters<ReturnType<typeof useUWB>['startRanging']>[0];

export function RadarHUD({ peer }: { peer: UwbPeer }) {
 const { measurements, isRanging, startRanging, stopRanging, sessionError } = useUWB();
 return (
 <View>
 {measurements.map(m => (
 <Text key={m.deviceId}>
 {m.deviceId}: {m.distanceMeters == null ? '—' : `${m.distanceMeters.toFixed(2)} m`}
 </Text>
 ))}
 {sessionError ? <Text>{sessionError}</Text> : null}
 <Button
 title={isRanging ? 'Stop ranging' : 'Start UWB ranging'}
 onPress={() => (isRanging ? stopRanging() : startRanging(peer))}
 />
 </View>
 );
}
```
