# useBLE

**Source:** [packages/sdk/src/hardware/useBLE.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useBLE.ts)

Reads the physical Bluetooth adapter state, whether the device declares BLE Channel Sounding, and bonded devices from `BluetoothAdapter` (through [`useRadios`](./useradios.md), refreshed every 5 s), and discovers nearby peripherals with Android `BluetoothLeScanner`. Each peripheral has its address (results without one are skipped), `name` (`null` when neither `BluetoothDevice.getName()` nor the advertised local name is available), RSSI, `lastSeenTimestamp` (wall-clock ms from `ScanResult.getTimestampNanos()` against `SystemClock.elapsedRealtimeNanos()`) and `estimatedDistanceMeters`. The distance is derived, not measured: log-distance path loss with an assumed -59 dBm at 1 m and exponent 2, so it drifts with obstacles and transmit power. A failed scan (`ScanCallback.onScanFailed`) ends the scan and is reported in `scanError` with its code. Discovery is polled every 500 ms while a scan is running.

## Signature
```typescript
function useBLE(): {
 isSupported: boolean;
 isEnabled: boolean;
 state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
 channelSounding: boolean;
 bondedDevices: BondedDevice[];
 error: string | null;
 source: TelemetrySource;
 isScanning: boolean;
 peripherals: BLEPeripheral[];
 scanError: string | null;
 startScan: (timeoutMs?: number) => Promise<boolean>;
 stopScan: () => void;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device has Bluetooth Low Energy hardware. |
| `isEnabled` | `boolean` | Whether Bluetooth is switched on in system settings. Scanning fails when it is not. |
| `state` | `'ON' \| 'OFF' \| 'TURNING_ON' \| 'TURNING_OFF'` | Adapter state, including the transitional values, so a toggle does not look like a failure. |
| `channelSounding` | `boolean` | Whether the device declares `android.hardware.bluetooth_le.channel_sounding`. Ranging a peer is [`useChannelSounding`](./usechannelsounding.md). |
| `bondedDevices` | `BondedDevice[]` — `{ name, address, type, bondState }` | Devices already paired with this phone, from `BluetoothAdapter.getBondedDevices`; `name` is `null` when unnamed or `BLUETOOTH_CONNECT` is not granted. |
| `error` | `string \| null` | Latest adapter-level failure message. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` after the first successful adapter read, `'unavailable'` before it or without the native module. |
| `isScanning` | `boolean` | Whether a discovery scan is running. Cleared when the timeout fires. |
| `peripherals` | `BLEPeripheral[]` — `{ id, name, rssi, estimatedDistanceMeters, lastSeenTimestamp }` | Devices seen in the current scan. `id` is the Bluetooth address, `name` is `string \| null`, `rssi` is in dBm, `lastSeenTimestamp` is wall-clock ms, and `estimatedDistanceMeters` is a derived estimate. |
| `scanError` | `string \| null` | Why the scan could not start or failed, including the `ScanCallback.onScanFailed` error code. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startScan(timeoutMs?)` | `timeoutMs?: number` — how long to scan before stopping automatically, default `10000` | `Promise<boolean>` — `true` when the scan started, `false` with `scanError` set when it did not | Starts `BluetoothLeScanner` discovery and polls results into `peripherals` every 500 ms. |
| `stopScan()` | none | `void` | Stops the scan, clears the timers and takes one final results sync so nothing already discovered is lost. |
