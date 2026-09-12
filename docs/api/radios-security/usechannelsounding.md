# useChannelSounding

**Source:** [packages/sdk/src/hardware/useChannelSounding.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useChannelSounding.ts)

Bluetooth Core 6.0 high-accuracy centimeter-precision Phase-Based Ranging (PBR) and Round-Trip Time (RTT).

Backed by `android.hardware.bluetooth_le.channel_sounding` and the Android 16/17 Ranging HAL service (`IBluetoothChannelSounding`). Measures distance with sub-decimeter accuracy across 79 BLE channels, complementing Ultra-Wideband (UWB) for non-line-of-sight spatial positioning. Nothing is simulated: queries actual device hardware capabilities.

## Signature
```typescript
function useChannelSounding(): ChannelSoundingState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the hardware physically supports BLE 6.0 Channel Sounding. |
| `isEnabled` | `boolean` | Whether Channel Sounding is enabled (requires Bluetooth enabled and hardware support). |
| `serviceFound` | `boolean` | Whether the underlying Android Ranging HAL service (`IBluetoothChannelSounding`) is active on device. |
| `supportsPbr` | `boolean` | Whether Phase-Based Ranging (PBR) is supported. |
| `supportsRtt` | `boolean` | Whether Round-Trip Time (RTT) ranging is supported. |
| `channelCount` | `number` | Number of BLE channels utilized (79 on Bluetooth 6.0). |
| `precision` | `'centimeter' \| 'decimeter' \| 'unsupported'` | Distance measurement precision level. |
| `isRanging` | `boolean` | Whether an active ranging session is currently underway. |
| `targets` | `ChannelSoundingTarget[]` | List of tracked ranging targets (`{ address, distanceMeters, azimuthDegrees, elevationDegrees, pbrConfidence, lastUpdateMs }`). |
| `error` | `string \| null` | Latest error message if operation failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(targetAddress?)` | `targetAddress?: string` — optional BLE MAC address | `Promise<boolean>` — `true` if ranging started successfully | Starts a Channel Sounding ranging session against paired or discovered BLE devices. |
| `stopRanging()` | none | `boolean` — `true` if session stopped | Stops an active ranging session. |
| `refresh()` | none | `ChannelSoundingInfo \| null` | Re-probes hardware channel sounding status. |

## Example
```tsx
import { useChannelSounding, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function PrecisionFinder() {
  const cs = useChannelSounding();

  return (
    <View>
      <Text>BLE 6.0 Channel Sounding: {cs.isSupported ? 'Supported' : 'Unsupported'}</Text>
      <Text>Precision: {cs.precision} ({cs.channelCount} channels)</Text>
      <Text>Phase-Based Ranging (PBR): {cs.supportsPbr ? 'Active' : 'No'}</Text>
      {cs.targets.map(t => (
        <Text key={t.address}>Target {t.address}: {t.distanceMeters.toFixed(2)}m (conf: {(t.pbrConfidence * 100).toFixed(0)}%)</Text>
      ))}
      <HapticButton
        title={cs.isRanging ? "Stop Ranging" : "Start Precision Ranging"}
        onPress={() => cs.isRanging ? cs.stopRanging() : cs.startRanging()}
      />
    </View>
  );
}
```
