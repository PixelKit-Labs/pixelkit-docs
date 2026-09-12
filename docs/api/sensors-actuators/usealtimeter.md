# useAltimeter

Derived from the physical air pressure sensor via expo-sensors. Computes altitude above calibrated sea level using the standard barometric formula: h = 44330 * (1 - (P / P0)^0.1903). Automatically computes vertical velocity (rate of climb/descent in m/s) with exponential smoothing, categorizes atmospheric pressure trends (rising, steady, falling, rapid_fall), and supports local QNH calibration.

## Signature
```typescript
useAltimeter(updateIntervalMs?: number): AltimeterTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `updateIntervalMs` | `number` | Sampling period in milliseconds for the barometer, defaulting to 100ms. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `altitudeM` | `number \| null` | Current barometric altitude in meters above calibrated sea level. Null until first sample. |
| `altitudeFt` | `number \| null` | Current barometric altitude in feet above calibrated sea level. Null until first sample. |
| `verticalVelocityMs` | `number \| null` | Rate of climb or descent in meters per second (m/s), smoothed over recent samples. Null until moving. |
| `pressureHpa` | `number \| null` | Raw atmospheric pressure in hectopascals (hPa / mbar). |
| `seaLevelPressureHpa` | `number` | Calibrated reference sea-level pressure in hPa. Defaults to standard 1013.25. |
| `pressureTrend` | `'rising' \| 'steady' \| 'falling' \| 'rapid_fall' \| null` | Short-term pressure change trend indicating weather changes (rapid_fall indicates storm front). |
| `isAvailable` | `boolean` | Whether the hardware barometer is present and streaming. |
| `error` | `string \| null` | Error message if sensor access or subscription failed. |
| `source` | `TelemetrySource` | Data provenance: 'derived' from hardware barometer, or 'unavailable'. |
| `calibrateSeaLevel` | `(hPa: number) => void` | Calibrates reference sea-level pressure (QNH) to zero out local elevation. |
| `resetCalibration` | `() => void` | Resets sea-level reference pressure back to standard 1013.25 hPa. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `calibrateSeaLevel(hPa)` | none | `void` | Sets the baseline sea-level pressure (QNH) in hPa. |
| `resetCalibration()` | none | `void` | Resets sea-level pressure back to standard atmosphere (1013.25 hPa). |

## Example
```tsx
import { useAltimeter } from '@pixelkit-labs/sdk';

function AltimeterHUD() {
  const { altitudeM, verticalVelocityMs, pressureTrend } = useAltimeter(100);
  return <Text>Alt: {altitudeM?.toFixed(1) ?? '—'} m · VSI: {verticalVelocityMs ?? '—'} m/s · Trend: {pressureTrend ?? '—'}</Text>;
}
```

:::note
Barometric altimetry reflects atmospheric pressure and drifts with weather fronts; use calibrateSeaLevel with local METAR/QNH for absolute altitude.
:::
