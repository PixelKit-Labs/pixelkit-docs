# useBatteryShare

Reads the Google Pixel reverse charging sysfs node (`/sys/class/power_supply/wireless/reverse_chg_mode`, or `/sys/devices/platform/google,battery/reverse_chg_mode`): a non-zero mode means the coil is on. `setBatteryShare` writes that node when the app is permitted to and reports whether the write succeeded. Receiver presence, delivered watts and a charge cutoff are not exposed by any node PixelKit can read, so the hook reports none of them (`transmittedWatts` is always null) and offers no threshold setting.

## Signature
```typescript
useBatteryShare(): BatteryShareTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether a readable reverse charging sysfs node exists on this device. |
| `isActive` | `boolean` | Whether the node reports the reverse charging coil as on (non-zero mode). |
| `transmittedWatts` | `number \| null` | Power transmitted in watts (W); null because no readable node reports it. |
| `error` | `string \| null` | Error message if reading or toggling the coil failed. |
| `source` | `TelemetrySource` | Data provenance: `'hardware'` or `'unavailable'`. |
| `setBatteryShare` | `(enabled: boolean) => Promise<boolean>` | Writes the reverse charging node on or off and re-reads it; false when the app may not write it. |
| `refresh` | `() => BatteryShareStatus \| null` | Re-reads the reverse charging node and returns what was read, or `null` when the read failed or the native module is absent. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setBatteryShare(enabled)` | `enabled: boolean` | `Promise<boolean>` | Writes the node, then re-reads it. Resolves true when the write succeeded, false when the app may not write the node. `isActive` afterwards is the re-read value, not the request. |
| `refresh()` | none | `BatteryShareStatus \| null` | Re-reads the reverse charging node and returns what was read, or `null` on failure. |

## Example
```tsx
import { useBatteryShare } from '@pixelkit-labs/sdk';

function PowerShareToggle() {
  const { isSupported, isActive, setBatteryShare, error } = useBatteryShare();
  if (!isSupported) return <Text>Battery Share not readable here</Text>;
  return (
    <View>
      <Button title={isActive ? 'Stop Sharing' : 'Share Battery'} onPress={() => setBatteryShare(!isActive)} />
      {error && <Text>{error}</Text>}
    </View>
  );
}
```

:::note
Works only on Pixel devices that expose a `reverse_chg_mode` node the app can read. Never show a receiver, wattage or cutoff value: the hook reports none. Apps usually cannot write the node, and then `setBatteryShare` resolves false.
:::
