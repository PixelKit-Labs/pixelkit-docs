# useThermometer

The native module asks Android `SensorManager` for a sensor whose type string contains `object_temperature` or `mlx90632`, or whose name contains `Thermometer` or `MLX90632`, and reports its name in `sensorName`. PixelKit has no verified decoder for that sensor's samples (unit and channel layout), so `surfaceTemperatureC`, `surfaceTemperatureF` and `ambientTemperatureC` are null and `error` states which sensor was found and why nothing is read. There is no emissivity or measurement-mode setting: nothing downstream of the sensor would apply it. Nothing is estimated or simulated.

## Signature
```typescript
useThermometer(): ThermometerTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether SensorManager lists a far-infrared temperature sensor on this device. |
| `surfaceTemperatureC` | `number \| null` | Surface temperature in degrees Celsius (°C); null because no decoder exists. |
| `surfaceTemperatureF` | `number \| null` | Surface temperature in degrees Fahrenheit (°F); null because no decoder exists. |
| `ambientTemperatureC` | `number \| null` | Sensor die / ambient temperature in degrees Celsius (°C); null because no decoder exists. |
| `sensorName` | `string \| null` | Name SensorManager gives the sensor, or null when none was found. |
| `error` | `string \| null` | Why temperatures are null: the sensor was found but is not decoded, no sensor is listed, or the probe failed. |
| `source` | `TelemetrySource` | `'hardware'` when a temperature was read, otherwise `'unavailable'`. |
| `refresh` | `() => void` | Probes the sensor list again. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Probes the sensor list again. |

## Example
```tsx
import { useThermometer } from '@pixelkit-labs/sdk';

function TemperatureBadge() {
  const { isSupported, sensorName, surfaceTemperatureC, error } = useThermometer();
  if (!isSupported) return <Text>No infrared sensor listed</Text>;
  return <Text>{surfaceTemperatureC != null ? `${surfaceTemperatureC.toFixed(1)} °C` : `— (${sensorName}: ${error})`}</Text>;
}
```

:::note
Never show a temperature from this hook unless `surfaceTemperatureC` is a number; today it is null on every device, with the reason in `error`. Do not offer emissivity or mode controls: the hook has none.
:::
