# useChannelSounding

**Source:** [packages/sdk/src/hardware/useChannelSounding.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useChannelSounding.ts)

Bluetooth LE Channel Sounding availability, and real ranging sessions against a Bluetooth peer whose address you supply.

`isSupported` is the `android.hardware.bluetooth_le.channel_sounding` feature flag, `serviceFound` is a lookup of the ranging HAL service (`IBluetoothChannelSounding`), and `rangingAvailability` and `supportedSecurityLevels` are what `android.ranging.RangingManager` reports for BLE Channel Sounding (null when the platform did not deliver them). `startRanging(config)` opens a real `android.ranging.RangingSession` (Android 16, API 36+, RAW session with `BleCsRangingParams`) with the peer at `config.peerAddress` and resolves `true` only when the platform reports the session open. Every measurement is an `android.ranging.RangingData` sample: a distance in metres, a confidence, an RSSI when supplied and a timestamp, each null when omitted. The platform does not report whether phase-based ranging or round-trip time produced a sample, so the hook reports no method, channel count or accuracy figure. Nothing is simulated: with no peer answering, `measurements` stays empty.

The app must declare `android.permission.RANGING` in its manifest and request it at runtime; without it the start status is `permission_denied`.

## Signature
```typescript
function useChannelSounding(): ChannelSoundingState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device declares `android.hardware.bluetooth_le.channel_sounding`. |
| `isEnabled` | `boolean` | Whether the feature is declared and the Bluetooth adapter is on. |
| `serviceFound` | `boolean` | Whether the lookup of the ranging HAL service found a service. |
| `rangingAvailability` | `ChannelSoundingAvailability \| null` | `RangingManager` availability for BLE Channel Sounding: `'enabled'`, `'not_supported'`, `'disabled_user'`, `'disabled_regulatory'` or `'disabled_user_restrictions'`. Null until read, below Android 16, or when the platform did not report it. |
| `supportedSecurityLevels` | `number[] \| null` | Channel Sounding security levels (1 and/or 4) from `BleCsRangingCapabilities`. Null when the platform did not report them. |
| `isRanging` | `boolean` | Whether the platform holds an open ranging session. Follows the platform's session events, not the last call. |
| `measurements` | `ChannelSoundingMeasurementEvent[]` | Latest platform sample per peer: `deviceAddress`, `distanceMeters`, `confidence` (`'low'`, `'medium'`, `'high'` or null), `rssi`, `sessionId`, `timestampMs`. Empty until the peer answers. |
| `sessionInfo` | `ChannelSoundingRangingResult \| null` | Result of the last start request: `status`, `error`, `sessionId`, `peerAddress`, `serviceName`, `serviceAvailable`, `channelSoundingFeature`, `timestampMs`. |
| `sessionError` | `string \| null` | Status code and reason when the last start or stop did not succeed, for example `needs_peer_address: peerAddress is required`. |
| `error` | `string \| null` | Latest failure message. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` when the device declares Channel Sounding, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(config)` | `config: ChannelSoundingRangingConfig` — `{ peerAddress, role?, securityLevel?, sightType?, locationType?, updateRate? }`; `peerAddress` is required (`"AA:BB:CC:DD:EE:FF"`) | `Promise<boolean>` — `true` only when the platform reported the session open | Opens a Channel Sounding ranging session with the peer. On `false`, `sessionError` carries a status such as `needs_peer_address`, `invalid_parameters`, `channel_sounding_unsupported`, `channel_sounding_disabled`, `ranging_api_unavailable`, `bluetooth_disabled`, `permission_denied`, `session_active` or `open_failed`. |
| `stopRanging()` | none | `ChannelSoundingStopResult \| null` — `{ wasActive, closed, sessionId, error, timestampMs }` | Closes the running session. `wasActive` is false when nothing was running. Null when the native module is absent. |
| `refresh()` | none | `ChannelSoundingInfo \| null` | Re-probes the feature flag, HAL service and adapter state. |

## Example
```tsx
import { useChannelSounding } from '@pixelkit-labs/sdk';
import { View, Text, Button } from 'react-native';

export function AccessoryFinder({ address }: { address: string }) {
  const cs = useChannelSounding();
  const latest = cs.measurements.find((m) => m.deviceAddress === address.toUpperCase());

  return (
    <View>
      <Text>Channel Sounding declared: {cs.isSupported ? 'yes' : 'no'}</Text>
      <Text>RangingManager: {cs.rangingAvailability ?? '—'}</Text>
      {cs.sessionError && <Text>{cs.sessionError}</Text>}
      <Text>
        {latest?.distanceMeters != null
          ? `${latest.distanceMeters.toFixed(2)} m (${latest.confidence ?? 'confidence unknown'})`
          : '—'}
      </Text>
      <Button
        title={cs.isRanging ? 'Stop ranging' : 'Start ranging'}
        onPress={() => (cs.isRanging ? cs.stopRanging() : cs.startRanging({ peerAddress: address }))}
      />
    </View>
  );
}
```
