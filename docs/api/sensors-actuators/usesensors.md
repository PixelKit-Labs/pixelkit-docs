# useSensors

**Source:** [packages/sdk/src/hardware/useSensors.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useSensors.ts)

Continuous multi-sensor telemetry from `expo-sensors`. Nothing is reported before the hardware has said it: pressure and light stay `null` until a first sample arrives, and `isAvailable` is false until subscriptions are attached. Per-sensor availability is reported separately, because a device can have an IMU and no barometer.

Altitude is derived from pressure with the international hypsometric formula, so it is **relative** and drifts with the weather. It is not a GNSS altitude and must not be presented as one.

## Signature
```typescript
function useSensors(updateIntervalMs?: number): SensorTelemetry & {
 hasMotionSample: boolean;
 barometerAvailable: boolean | null;
 lightAvailable: boolean | null;
 error: string | null;
 source: TelemetrySource;
};
```

## Inputs
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `updateIntervalMs` | `number` | `100` | Sampling period in milliseconds for the accelerometer, gyroscope, magnetometer and barometer. The light sensor is sampled at twice this interval because illuminance changes slowly. Changing it re-subscribes every sensor. Values below roughly 20 ms cost battery without adding usable resolution. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `accelerometer` | `Vector3D` — `{ x, y, z }` | Proper acceleration including gravity, in g. Three decimals. `{0,0,0}` until the first sample. |
| `gyroscope` | `Vector3D` | Angular velocity in radians per second about each axis. Three decimals. |
| `magnetometer` | `Vector3D` | Geomagnetic field strength in microteslas (μT), one decimal. This is what a compass heading is computed from. |
| `barometer` | `BarometerData` — `{ pressure: number \| null; relativeAltitude?: number \| null }` | Air pressure in hectopascals and the altitude derived from it in metres, relative to standard sea-level pressure (1013.25 hPa). Both `null` until a sample arrives or when the device has no barometer. |
| `lightLux` | `number \| undefined` | Ambient illuminance in lux from the front photodiode, one decimal so a dark room reads 0.4 rather than 0. `undefined` until the first sample. |
| `isAvailable` | `boolean` | Whether the sensor subscriptions were attached successfully. `false` before setup completes and after a failure. |
| `hasMotionSample` | `boolean` | `true` once a real accelerometer sample has arrived. Until then the vectors are zeroed, so use this to distinguish "still" from "not started". |
| `barometerAvailable` | `boolean \| null` | Whether this device has a barometer. `null` until probed. |
| `lightAvailable` | `boolean \| null` | Whether this device has an ambient light sensor. `null` until probed. |
| `error` | `string \| null` | Why subscribing failed, if it did. `null` when healthy. |
| `source` | `TelemetrySource` | `'hardware'` once a motion sample has arrived, `'unavailable'` before that. |

## Functions
`useSensors()` returns no callables. Change the sampling rate by passing a different `updateIntervalMs`; the hook re-subscribes when it changes.

## Example
```tsx
import { useSensors } from '@pixelkit-labs/sdk';

export function AltitudeHUD() {
 const { barometer, accelerometer, barometerAvailable } = useSensors(100);
 return (
 <View>
 <Text>Altitude: {barometerAvailable ? barometer.relativeAltitude ?? '—' : 'no barometer'} m</Text>
 <Text>Pressure: {barometer.pressure ?? '—'} hPa</Text>
 <Text>Accel Z: {accelerometer.z.toFixed(2)} g</Text>
 </View>
 );
}
```
