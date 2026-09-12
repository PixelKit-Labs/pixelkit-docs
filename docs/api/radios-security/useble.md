# useBLE

**Source:** [packages/sdk/src/hardware/useBLE.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useBLE.ts)

Reads the physical Bluetooth adapter state, Bluetooth 5.4 Channel Sounding silicon support and real bonded devices from `BluetoothAdapter`, and discovers nearby peripherals with Android `BluetoothLeScanner`. Distance is estimated from RSSI with the log-distance path-loss model (`n = 2.0`, free space), so it is an estimate and drifts with obstacles. Adapter state is read per render from the native module; discovery is polled every 500 ms while a scan is running.

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
| `channelSounding` | `boolean` | Whether the silicon supports Bluetooth Channel Sounding (fine ranging). |
| `bondedDevices` | `BondedDevice[]` — `{ name, address, type, bondState }` | Devices already paired with this phone, from `BluetoothAdapter.getBondedDevices`. |
| `error` | `string \| null` | Latest adapter-level failure message. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present, `'unavailable'` otherwise. |
| `isScanning` | `boolean` | Whether a discovery scan is running. Cleared when the timeout fires. |
| `peripherals` | `BLEPeripheral[]` — `{ id, name, rssi, estimatedDistanceMeters, lastSeenTimestamp }` | Devices seen in the current scan. `id` is the MAC address, `rssi` is in dBm, distance is estimated in metres. |
| `scanError` | `string \| null` | Why the scan could not start or run, e.g. no native scanner or a permission refusal. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startScan(timeoutMs?)` | `timeoutMs?: number` — how long to scan before stopping automatically, default `10000` | `Promise<boolean>` — `true` when the scan started, `false` with `scanError` set when it did not | Starts `BluetoothLeScanner` discovery and polls results into `peripherals` every 500 ms. |
| `stopScan()` | none | `void` | Stops the scan, clears the timers and takes one final results sync so nothing already discovered is lost. |
