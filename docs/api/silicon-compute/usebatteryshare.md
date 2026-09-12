# useBatteryShare

Directly interfaces with the Google Pixel reverse wireless charging subsystem (/sys/class/power_supply/wireless/reverse_chg_mode). Reports whether wireless power transfer is active, whether a compatible Qi receiver is docked, real-time power transmission in watts, and allows programmatically enabling or disabling power transfer with safety cutoff thresholds.

## Signature
```typescript
useBatteryShare(): BatteryShareTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether this device hardware supports reverse wireless power transmission. |
| `isActive` | `boolean` | Whether the Qi TX reverse charging coil is currently energized. |
| `isReceiverDetected` | `boolean` | Whether a compatible Qi receiver device is docked on the reverse charging coil. |
| `transmittedWatts` | `number \| null` | Real-time power transmitted in watts (W), or null if inactive/unsupported. |
| `batteryThreshold` | `number` | Configured battery percentage cutoff threshold (stops sharing below this percentage). |
| `error` | `string \| null` | Error message if reading or toggling the coil failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `setBatteryShare` | `(enabled: boolean) => Promise<boolean>` | Toggles reverse wireless power transmission on or off. |
| `setBatteryThreshold` | `(pct: number) => void` | Sets the safety battery cutoff percentage (e.g. 15%). |
| `refresh` | `() => void` | Re-reads the reverse wireless charging subsystem status. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setBatteryShare(enabled)` | none | `void` | Turns reverse wireless charging on or off. |
| `setBatteryThreshold(pct)` | none | `void` | Sets minimum battery cutoff percentage. |
| `refresh()` | none | `void` | Refreshes reverse wireless charging state. |

## Example
```tsx
import { useBatteryShare } from '@pixelkit-labs/sdk';

function PowerShareToggle() {
  const { isSupported, isActive, setBatteryShare } = useBatteryShare();
  if (!isSupported) return <Text>Battery Share not supported</Text>;
  return <Button title={isActive ? 'Stop Sharing' : 'Share Battery'} onPress={() => setBatteryShare(!isActive)} />;
}
```

:::note
Supported on Google Pixel 5 and later flagship models with reverse wireless charging coils.
:::
