# useWifiRTT

Utilizes android.net.wifi.rtt.WifiRttManager for 802.11mc / 802.11az Fine Timing Measurement ranging. Discovers RTT-capable access points and measures exact flight time in picoseconds, returning calculated distances in millimeters with standard deviation accuracy metrics. Operates indoors where satellite GNSS signals are obstructed.

## Signature
```typescript
useWifiRTT(): WifiRTTTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device hardware features the Wi-Fi RTT ranging subsystem. |
| `isAvailable` | `boolean` | Whether the Wi-Fi RTT ranging service is currently active and available. |
| `isRanging` | `boolean` | Whether an active RTT ranging sweep is currently in progress. |
| `rangingResults` | `WifiRttResult[]` | Latest distance measurements to specified AP BSSIDs in millimeters. |
| `error` | `string \| null` | Error message if RTT service probing or ranging execution failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `startRanging` | `(bssids: string[]) => Promise<WifiRttResult[]>` | Initiates an active round-trip time ranging request against specified AP BSSIDs. |
| `refresh` | `() => void` | Re-checks the availability status of the Wi-Fi RTT service. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(bssids)` | none | `void` | Performs round-trip time distance ranging to target BSSIDs. |
| `refresh()` | none | `void` | Refreshes Wi-Fi RTT service status. |

## Example
```tsx
import { useWifiRTT } from '@pixelkit-labs/sdk';

function IndoorRadar() {
  const { isAvailable, rangingResults, startRanging } = useWifiRTT();
  return (
    <View>
      <Text>RTT Service: {isAvailable ? 'Ready' : 'Offline'}</Text>
      <Button title="Range Access Points" onPress={() => startRanging(['00:11:22:33:44:55'])} />
    </View>
  );
}
```

:::note
Requires Android 9+ (API 28+) and location permissions. Access points must support 802.11mc or 802.11az FTM responders.
:::
