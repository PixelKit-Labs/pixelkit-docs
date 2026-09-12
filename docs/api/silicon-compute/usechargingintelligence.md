# useChargingIntelligence

Reads Android 14+ battery health metrics and Google Pixel power supply sysfs telemetry. Provides lifetime charge cycles (BatteryManager.EXTRA_CYCLE_COUNT), state of health percentage (/sys/class/power_supply/battery/soh), factory manufacture date, first-use date, real-time charging wattage, and classifies charging speed into tiers (slow, standard, rapid, ultra_rapid > 30W).

## Signature
```typescript
useChargingIntelligence(): ChargingIntelligenceTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `stateOfHealthPercent` | `number \| null` | Current maximum battery capacity relative to factory design capacity (0-100%), or null if unreadable. |
| `cycleCount` | `number \| null` | Lifetime physical charge cycles completed by the battery pack. |
| `manufactureDate` | `string \| null` | Factory manufacture timestamp/date of the physical battery cell. |
| `firstUsageDate` | `string \| null` | Date the battery was first activated/used in service. |
| `chargingWattage` | `number \| null` | Real-time charging power in watts (W) delivered to the battery. |
| `chargingTier` | `'slow' \| 'standard' \| 'rapid' \| 'ultra_rapid'` | Classification of charging speed based on delivered wattage. |
| `chargeLimitActive` | `boolean` | Whether the Android battery protect 80% charge limit is currently engaged. |
| `error` | `string \| null` | Error message if battery telemetry query failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `refresh` | `() => void` | Re-reads battery health and charging state. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Requests an updated battery intelligence reading. |

## Example
```tsx
import { useChargingIntelligence } from '@pixelkit-labs/sdk';

function BatteryHealthCard() {
  const { stateOfHealthPercent, cycleCount, chargingTier } = useChargingIntelligence();
  return <Text>Health: {stateOfHealthPercent ?? '—'}% · Cycles: {cycleCount ?? '—'} · Tier: {chargingTier}</Text>;
}
```

:::note
Battery cycle counts require Android 14+ (API 34+). State of health % and manufacture dates are read from Pixel battery sysfs.
:::
