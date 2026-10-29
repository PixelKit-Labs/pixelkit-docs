# useChargingIntelligence

Reads Android 14+ battery health metrics and Google Pixel power supply sysfs telemetry. Provides lifetime charge cycles (`BatteryManager.EXTRA_CYCLE_COUNT`), state of health percentage (`/sys/class/power_supply/battery/soh`), manufacture date, first-use date, charging wattage (`BATTERY_PROPERTY_CURRENT_NOW` times the battery voltage, only while the current is positive), and a tier classified from that wattage (`slow`, `standard`, `rapid`, `ultra_rapid` at 30 W and above). Values the app cannot read are null.

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
| `chargingWattage` | `number \| null` | Charging power in watts (W) delivered to the battery. |
| `chargingTier` | `'slow' \| 'standard' \| 'rapid' \| 'ultra_rapid' \| null` | Classification of `chargingWattage` (under 5 W slow, 5 W up to 18 W standard, 18 W up to 30 W rapid, 30 W and above ultra_rapid). Null when no wattage was read. |
| `chargeLimitAvailable` | `boolean \| null` | Whether the `charge_limit_available` sysfs node reads `"1"`; null when it cannot be read. The node says the limit is offered, not that it is switched on. |
| `error` | `string \| null` | Error message if battery telemetry query failed. |
| `source` | `TelemetrySource` | Data provenance: `'hardware'` or `'unavailable'`. |
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
  return <Text>Health: {stateOfHealthPercent ?? '—'}% · Cycles: {cycleCount ?? '—'} · Tier: {chargingTier ?? '—'}</Text>;
}
```

:::note
Battery cycle counts require Android 14+ (API 34+). State of health % and manufacture dates are read from Pixel battery sysfs nodes and are null where the app cannot read them. `chargingTier` is null when no wattage was read, so never show a default tier.
:::
