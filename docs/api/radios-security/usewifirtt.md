# useWifiRTT

Runs real `android.net.wifi.rtt.WifiRttManager.startRanging` rounds (802.11mc Fine Timing Measurement) against Wi-Fi access points and returns the platform's per-AP results: distance and its standard deviation in millimeters, RSSI, and the measurement counters.

Each BSSID passed to `startRanging` must match an 802.11mc responder in the latest Wi-Fi scan results. A BSSID that cannot be ranged is never given a result: it is listed in `unresolvedBssids` with the reason (`invalid_bssid`, `not_in_scan_results`, `not_80211mc_responder`, `exceeds_max_peers_N`, `permission_denied`, `rtt_unavailable`, `ranging_timeout`, `ranging_failed` or `no_result_returned`). In `rangingResults`, `distanceMm`, `distanceStdDevMm`, `rssi` and the counters are set only when the access point's `status` is `0` (success); they are `null` for `1` (fail) and `2` (responder without 802.11mc). When the whole request fails, `rangingResults` is empty and `error` carries the `onRangingFailure` code.

## Signature
```typescript
useWifiRTT(): WifiRTTTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device hardware features the Wi-Fi RTT ranging subsystem. |
| `isAvailable` | `boolean` | Whether the Wi-Fi RTT ranging service is currently available (Wi-Fi and location on). |
| `isRanging` | `boolean` | Whether a ranging round is in progress. |
| `rangingResults` | `WifiRttResult[]` | Per-AP results of the last round: `bssid`, `status`, `statusName`, `distanceMm`, `distanceStdDevMm`, `rssi`, `numAttemptedMeasurements`, `numSuccessfulMeasurements`, `timestampMs`. Distance, deviation, RSSI and counters are `null` unless `status` is `0`. |
| `unresolvedBssids` | `WifiRttUnresolvedBssid[]` | BSSIDs of the last request that produced no measurement, each as `{ bssid, reason }`. |
| `error` | `string \| null` | Why probing or the last ranging round failed (missing permission, RTT unavailable, timeout, `onRangingFailure` code), or `null`. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `startRanging` | `(bssids: string[]) => Promise<WifiRttResult[]>` | Runs one RTT ranging round against the given AP BSSIDs and resolves the per-AP results (empty on failure, with the reason in `error`). |
| `refresh` | `() => void` | Re-checks the availability status of the Wi-Fi RTT service. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(bssids)` | `bssids: string[]` — BSSIDs of access points from a Wi-Fi scan | `Promise<WifiRttResult[]>` | Performs one round-trip time ranging round to the target BSSIDs. |
| `refresh()` | none | `void` | Refreshes Wi-Fi RTT service status. |

## Example
```tsx
import { useWifiRTT } from '@pixelkit-labs/sdk';

function IndoorRadar({ bssids }: { bssids: string[] }) {
  const { isAvailable, rangingResults, unresolvedBssids, error, startRanging } = useWifiRTT();
  return (
    <View>
      <Text>RTT Service: {isAvailable ? 'Ready' : 'Offline'}</Text>
      <Button title="Range Access Points" onPress={() => startRanging(bssids)} />
      {error ? <Text>{error}</Text> : null}
      {rangingResults.map((r) => (
        <Text key={r.bssid}>{r.bssid}: {r.distanceMm == null ? r.statusName : `${r.distanceMm} mm`}</Text>
      ))}
      {unresolvedBssids.map((u) => (
        <Text key={u.bssid}>{u.bssid}: not ranged ({u.reason})</Text>
      ))}
    </View>
  );
}
```

:::note
Requires Android 9+ (API 28+) and `ACCESS_FINE_LOCATION` (plus `NEARBY_WIFI_DEVICES` on Android 13+) granted by the app. Access points must be 802.11mc responders present in the latest scan results.
:::
