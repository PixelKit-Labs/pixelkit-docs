# useDevice

**Source:** [packages/sdk/src/hardware/useDevice.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useDevice.ts)

Model identity, battery level, fuel gauge thermistor temperature, real-time voltage/current/wattage, and connectivity in one object, with live listeners for battery state and native PMIC telemetry via `PixelNative`. It reads once on mount and updates battery percentage and external-power attachment from native `EXTRA_PLUGGED` when readable, with `expo-battery` listeners as a fallback. A full or paused battery can still be plugged in; unknown attachment remains null.

## Signature
```typescript
function useDevice(): DeviceTelemetry & {
 batteryPercent: number | null;
 isCharging: boolean | null;
 batteryTemperatureC: number | null;
 batteryVoltageMv: number | null;
 batteryCurrentMa: number | null;
 batteryCurrentAvgMa: number | null;
 batteryPowerWatts: number | null;
 batteryHealth: 'GOOD' | 'OVERHEAT' | 'DEAD' | 'OVER_VOLTAGE' | 'UNSPECIFIED_FAILURE' | 'COLD' | 'UNKNOWN' | null;
 batteryCycleCount: number | null;
 batteryChargeCounterMah: number | null;
 batteryEnergyCounterMwh: number | null;
 batteryTechnology: string | null;
 pluggedSource: 'AC' | 'USB' | 'WIRELESS' | 'DOCK' | 'NONE' | null;
 batteryTelemetry: BatteryTelemetry | null;
 hasRead: boolean;
 error: string | null;
 source: TelemetrySource;
 refresh: () => Promise<void>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string \| null` | Marketing model name from `expo-device`; `null` when the platform does not report it. |
| `brand` | `string \| null` | Manufacturer brand, e.g. `"Google"`; `null` when not reported. |
| `osVersion` | `string \| null` | Android version string; `null` when not reported. |
| `batteryPercent` | `number \| null` | Charge as a percentage, 0–100; null until read rather than an invented 0. |
| `isCharging` | `boolean \| null` | Whether external power (AC, USB, wireless or dock) is attached, including full or paused charging. `false` only when observed unplugged; `null` until determined. |
| `lowPowerMode` | `boolean \| null` | Whether Android Battery Saver is active; `null` until read or when the read failed. Back off from heavy work when it is `true`. |
| `networkType` | `string` | Active interface type: `'WIFI'`, `'CELLULAR'`, `'UNKNOWN'`. For carrier detail use `useCellular`. |
| `isConnected` | `boolean` | Whether the device has an active, reachable network route. |
| `totalMemoryMB` | `number \| undefined` | Total system RAM in MB from `expo-device`. For live memory use `useMemory`. |
| `batteryTemperatureC` | `number \| null` | Real physical battery pack temperature in °C from the fuel gauge NTC thermistor. |
| `batteryVoltageMv` | `number \| null` | Instantaneous cell terminal voltage in mV (e.g. `4120 mV`). |
| `batteryCurrentMa` | `number \| null` | Instantaneous current flow in mA (negative discharging, positive charging). |
| `batteryCurrentAvgMa` | `number \| null` | Rolling average current flow in mA. |
| `batteryPowerWatts` | `number \| null` | Real-time system power consumption or fast-charging rate in Watts (V × \|I\|). |
| `batteryHealth` | `enum \| null` | Hardware health: `'GOOD'`, `'OVERHEAT'`, `'DEAD'`, `'OVER_VOLTAGE'`, `'COLD'`, `'UNKNOWN'`. |
| `batteryCycleCount` | `number \| null` | Lifetime charge cycle count from the fuel gauge EEPROM (Android 14+). |
| `batteryChargeCounterMah` | `number \| null` | Remaining charge capacity in mAh. |
| `batteryEnergyCounterMwh` | `number \| null` | Remaining energy stored in mWh. |
| `batteryTechnology` | `string \| null` | Battery chemistry string (e.g. `"Li-ion"`). |
| `pluggedSource` | `enum \| null` | Dedicated power supply source (`'AC'`, `'USB'`, `'WIRELESS'`, `'DOCK'`, `'NONE'`). |
| `batteryTelemetry` | `BatteryTelemetry \| null` | Full native battery telemetry structure including probed thermal zones. |
| `hasRead` | `boolean` | Whether any power or network value has been successfully read. |
| `error` | `string \| null` | Why the last read failed, or null. |
| `source` | `TelemetrySource` | `'hardware'`, `'derived'`, or `'unavailable'`. |

## Functions
| Function | Inputs | Output | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | None | `Promise<void>` | Re-reads power, PMIC fuel gauge, and connectivity state. |
