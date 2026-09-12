# useRadios

**Source:** [packages/sdk/src/hardware/useRadios.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useRadios.ts)

Unified hardware radio telemetry, queried directly from Android system services (`NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager`, `PackageManager`) and refreshed every 5 s. Use it to decide which radio features to show at all; use the per-radio hooks to drive them. It reads on mount and every 5,000 ms thereafter.

## Signature
```typescript
function useRadios(): {
  nfc: { supported: boolean; enabled: boolean; observeModeSupported: boolean; antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE' };
  bluetooth: { supported: boolean; bleSupported: boolean; enabled: boolean; state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF'; channelSounding: boolean; bondedDevices: BondedDevice[] };
  uwb: { supported: boolean; enabled: boolean; chipId: string | null; rangingApiSupported: boolean };
  wifiRtt: { supported: boolean; available: boolean };
  thread: { supported: boolean; serviceFound: boolean; chipId: string | null };
  satellite: { supported: boolean; sosSupported?: boolean; provider?: string | null };
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
| `bluetooth.channelSounding` | `boolean` | Whether the silicon supports Channel Sounding fine ranging. |
| `bluetooth.bondedDevices` | `BondedDevice[]` | Paired devices: `{ name, address, type, bondState }`. |
| `uwb.supported` / `uwb.enabled` | `boolean` | Whether the UWB chip exists and is switched on. |
| `uwb.chipId` | `string \| null` | Chip identifier from `UwbManager`, `"default"` on Pixel Pro. `null` when absent. |
| `uwb.rangingApiSupported` | `boolean` | Whether the platform ranging service is present. |
| `wifiRtt.supported` / `wifiRtt.available` | `boolean` | Whether Wi-Fi RTT (802.11mc) exists, and whether it is available right now. |
| `thread.supported` | `boolean` | Whether hardware 802.15.4 Thread radio is present (`android.hardware.thread_network`). |
| `thread.serviceFound` | `boolean` | Whether `thread_network` / `IThreadChip` HAL is active on device. |
| `thread.chipId` | `string \| null` | Hardware Thread chip identifier (`"chip0"` on Pixel 11 Pro). |
| `satellite.supported` | `boolean` | Whether the device declares satellite messaging support. |
| `satellite.sosSupported` | `boolean` | Whether Google Satellite SOS hardware provider is active. |
| `satellite.provider` | `string \| null` | Name of satellite service provider (`"Google Satellite SOS"`). |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise (all blocks then read their conservative defaults). |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` — the new reading lands in the returned fields | Re-reads every radio immediately instead of waiting for the next 5 s poll. Call it after sending the user to Settings. |
