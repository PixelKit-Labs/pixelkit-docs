# useRadios

**Source:** [packages/sdk/src/hardware/useRadios.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useRadios.ts)

Radio state read from Android system services and PackageManager features (`NfcAdapter`, `BluetoothAdapter`, `UwbManager` by reflection, `WifiRttManager`, system feature flags) and refreshed every 5 s. Values Android does not let the app read are `null` rather than guessed. Use it to decide which radio features to show at all; use the per-radio hooks to drive them. It reads on mount and every 5,000 ms thereafter; before the first read the values are all-false defaults and `source` is `'unavailable'`.

## Signature
```typescript
function useRadios(): {
  nfc: { supported: boolean; enabled: boolean; observeModeSupported: boolean; antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE' };
  bluetooth: { supported: boolean; bleSupported: boolean; enabled: boolean; state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF'; channelSounding: boolean; bondedDevices: BondedDevice[] };
  uwb: { supported: boolean; enabled: boolean | null; rangingApiSupported: boolean };
  wifiRtt: { supported: boolean; available: boolean };
  thread: { supported: boolean; serviceFound: boolean | null };
  satellite: { supported: boolean; sosSupported?: boolean };
  source: TelemetrySource;
  refresh: () => void;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `nfc.supported` / `nfc.enabled` | `boolean` | Whether the radio exists, and whether the user has it switched on. |
| `nfc.observeModeSupported` | `boolean` | Android 15 Observe Mode availability. |
| `nfc.antennaState` | `'ENABLED' \| 'DISABLED' \| 'UNAVAILABLE'` | Antenna state from the adapter. |
| `bluetooth.supported` / `bluetooth.bleSupported` | `boolean` | Classic Bluetooth and Low Energy support, which are separate features. |
| `bluetooth.enabled` / `bluetooth.state` | `boolean` / `'ON' \| 'OFF' \| 'TURNING_ON' \| 'TURNING_OFF'` | Adapter power, including transitional states. |
| `bluetooth.channelSounding` | `boolean` | Whether the device declares `android.hardware.bluetooth_le.channel_sounding`. |
| `bluetooth.bondedDevices` | `BondedDevice[]` | Paired devices: `{ name, address, type, bondState }`; `name` is `null` when unnamed or `BLUETOOTH_CONNECT` is not granted. |
| `uwb.supported` | `boolean` | Whether the device declares `android.hardware.uwb`. |
| `uwb.enabled` | `boolean \| null` | `UwbManager.isUwbEnabled()` read by reflection; `null` when that call is not reachable by apps. |
| `uwb.rangingApiSupported` | `boolean` | Whether the Android 16 `android.ranging.RangingManager` service exists. |
| `wifiRtt.supported` / `wifiRtt.available` | `boolean` | Whether Wi-Fi RTT (802.11mc) exists, and whether it is available right now. |
| `thread.supported` | `boolean` | Whether hardware 802.15.4 Thread radio is present (`android.hardware.thread_network`). |
| `thread.serviceFound` | `boolean \| null` | Whether a `ServiceManager` lookup finds the Thread network service; `null` when that hidden lookup is not possible. |
| `satellite.supported` | `boolean` | Whether the device declares satellite messaging support. |
| `satellite.sosSupported` | `boolean` | Whether the device declares the Google Satellite SOS provider feature. |
| `source` | `TelemetrySource` | `'hardware'` after the first successful read; `'unavailable'` before it or without the native module. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` — the new reading lands in the returned fields | Re-reads every radio immediately instead of waiting for the next 5 s poll. Call it after sending the user to Settings. |
