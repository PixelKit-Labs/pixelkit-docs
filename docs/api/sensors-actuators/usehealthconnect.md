# useHealthConnect

**Source:** [packages/sdk/src/hardware/useHealthConnect.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useHealthConnect.ts)

Platform health records, steps, and sensor vitals telemetry through the Android Health Connect framework and hardware sensor HAL.

Backed by the `android.health.connect` system service on Android 14+, PackageManager provider detection, and hardware `Sensor.TYPE_STEP_COUNTER` / `Sensor.TYPE_HEART_RATE` drivers. Reports real device health framework availability and hardware sensor presence. Nothing is simulated: reads directly from the platform.

## Signature
```typescript
function useHealthConnect(): HealthConnectState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | Whether Health Connect is available on the device. |
| `sdkStatus` | `'SDK_AVAILABLE' \| 'SDK_UNAVAILABLE' \| 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED'` | Platform SDK availability status. |
| `hasStepCounter` | `boolean` | Whether physical hardware step counter sensor is present. |
| `hasHeartRateSensor` | `boolean` | Whether hardware heart rate sensor is present. |
| `stepSensorName` | `string \| null` | Hardware sensor name (e.g. Google Step Counter). |
| `heartRateSensorName` | `string \| null` | Hardware heart rate sensor name. |
| `isFrameworkIntegrated` | `boolean` | Whether Health Connect is built into the OS (Android 14+). |
| `error` | `string \| null` | Error message if unavailable. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `HealthConnectInfo \| null` | Re-probes Health Connect framework and hardware sensors. |

## Example
```tsx
import { useHealthConnect } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function HealthStatusCard() {
  const { isAvailable, sdkStatus, hasStepCounter, stepSensorName } = useHealthConnect();

  return (
    <View>
      <Text>Health Connect: {isAvailable ? "Available" : "Unavailable"} ({sdkStatus})</Text>
      <Text>Hardware Step Sensor: {hasStepCounter ? (stepSensorName ?? "Active") : "None"}</Text>
    </View>
  );
}
```
