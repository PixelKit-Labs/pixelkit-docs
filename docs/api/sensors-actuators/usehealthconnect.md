# useHealthConnect

**Source:** [packages/sdk/src/hardware/useHealthConnect.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useHealthConnect.ts)

Health Connect availability and the device's step counter and heart rate sensors. It does not read steps, heart rate or any Health Connect record.

`isAvailable` and `sdkStatus` are inferred: the `healthconnect` system service (`Context.HEALTHCONNECT_SERVICE`, Android 14+) or the `com.google.android.apps.healthdata` package is present. They are not the result of `HealthConnectClient.getSdkStatus()`, which this SDK does not call, so no provider-update state is reported. Sensor fields come from the step counter system feature and `SensorManager.getDefaultSensor` (`TYPE_STEP_COUNTER`, `TYPE_HEART_RATE`).

## Signature
```typescript
function useHealthConnect(): HealthConnectState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAvailable` | `boolean` | Inferred: the `healthconnect` system service or the `com.google.android.apps.healthdata` package exists. |
| `sdkStatus` | `'SDK_AVAILABLE' \| 'SDK_UNAVAILABLE'` | `'SDK_AVAILABLE'` when `isAvailable`, otherwise `'SDK_UNAVAILABLE'`. Not read from `HealthConnectClient.getSdkStatus()`. |
| `hasStepCounter` | `boolean` | Whether physical hardware step counter sensor is present. |
| `hasHeartRateSensor` | `boolean` | Whether hardware heart rate sensor is present. |
| `stepSensorName` | `string \| null` | Hardware sensor name (e.g. Google Step Counter). |
| `heartRateSensorName` | `string \| null` | Hardware heart rate sensor name. |
| `isFrameworkIntegrated` | `boolean` | Whether the `healthconnect` system service exists (Android 14+). |
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
