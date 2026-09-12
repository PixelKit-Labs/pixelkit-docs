# useThermometer

Interfaces with the Melexis MLX90632 non-contact FIR temperature sensor integrated into Google Pixel Pro camera visors. Surfaces calibrated surface temperatures in both Celsius and Fahrenheit along with ambient die temperature. Supports configurable emissivity correction factors (0.10 to 1.00) and measurement modes (object, body, ambient). Reports unavailable on non-Pro models.

## Signature
```typescript
useThermometer(initialEmissivity?: number): ThermometerTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `initialEmissivity` | `number` | Surface emissivity factor from 0.1 to 1.0, defaulting to 0.95 (organic/skin/water). |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device hardware features the FIR non-contact temperature sensor. |
| `surfaceTemperatureC` | `number \| null` | Calibrated surface temperature in degrees Celsius (°C), or null if absent/unmeasured. |
| `surfaceTemperatureF` | `number \| null` | Calibrated surface temperature in degrees Fahrenheit (°F), or null. |
| `ambientTemperatureC` | `number \| null` | Sensor die / internal ambient temperature in degrees Celsius (°C), or null. |
| `emissivity` | `number` | Current material surface emissivity coefficient (0.1 to 1.0). |
| `mode` | `'object' \| 'body' \| 'ambient'` | Target measurement mode: 'object', 'body', or 'ambient'. |
| `error` | `string \| null` | Error message if sensor probing failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `setEmissivity` | `(value: number) => void` | Updates the material emissivity factor. |
| `setMode` | `(mode: 'object' \| 'body' \| 'ambient') => void` | Sets the measurement mode to 'object', 'body', or 'ambient'. |
| `refresh` | `() => void` | Probes the hardware sensor for a fresh reading. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setEmissivity(value)` | none | `void` | Updates the material surface emissivity coefficient. |
| `setMode(mode)` | none | `void` | Switches the calculation mode between 'object', 'body', and 'ambient'. |
| `refresh()` | none | `void` | Requests an updated temperature reading from hardware. |

## Example
```tsx
import { useThermometer } from '@pixelkit-labs/sdk';

function TemperatureBadge() {
  const { isSupported, surfaceTemperatureC, surfaceTemperatureF } = useThermometer();
  if (!isSupported) return <Text>Thermometer unavailable</Text>;
  return <Text>Temp: {surfaceTemperatureC?.toFixed(1) ?? '—'} °C ({surfaceTemperatureF?.toFixed(1) ?? '—'} °F)</Text>;
}
```

:::note
Available exclusively on Pixel Pro devices (8 Pro, 9 Pro, 10 Pro, 11 Pro). Non-Pro devices return isSupported: false with null readings.
:::
