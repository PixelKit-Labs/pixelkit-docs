# useSatelliteNTN

Reads the `android.hardware.telephony.satellite` system feature through PackageManager. Android 36's public `SatelliteManager` only offers `registerStateChangeListener` / `unregisterStateChangeListener` with an enabled-state callback, so there is no public read for connection state, carrier, signal bars, pointing data or emergency readiness. Those fields (`connectionState`, `carrier`, `signalQualityBars`, `pointingGuidance`, `emergencyServicesReady`) are always `null` and `unreadReason` states the reason.

## Signature
```typescript
useSatelliteNTN(): SatelliteNTNTechTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | True when the device declares the `android.hardware.telephony.satellite` system feature. |
| `connectionState` | `'disconnected' \| 'searching' \| 'connected' \| 'pointing_assist' \| null` | Always `null`: Android's public API exposes no satellite connection state. |
| `carrier` | `string \| null` | Always `null`: Android's public API exposes no satellite carrier. |
| `signalQualityBars` | `number \| null` | Always `null`: Android's public API exposes no satellite signal strength. |
| `pointingGuidance` | `SatelliteGuidance \| null` | Always `null`: Android's public API exposes no satellite pointing data. |
| `emergencyServicesReady` | `boolean \| null` | Always `null`: Android's public API exposes no satellite emergency readiness. |
| `unreadReason` | `string \| null` | Why the null fields are null; `null` before the first read. |
| `error` | `string \| null` | Error message if the query failed. |
| `source` | `TelemetrySource` | `'hardware'` when the feature flag says satellite is supported, `'unavailable'` otherwise. |
| `refresh` | `() => void` | Re-reads the system feature. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Re-reads the satellite system feature. |

## Example
```tsx
import { useSatelliteNTN } from '@pixelkit-labs/sdk';

function SatelliteSupportCard() {
  const { isSupported, unreadReason } = useSatelliteNTN();
  return <Text>Satellite messaging feature: {isSupported ? 'declared' : 'not declared'}{unreadReason ? ` · ${unreadReason}` : ''}</Text>;
}
```

:::note
Only `isSupported` carries information. Do not branch on `connectionState`, `carrier`, `signalQualityBars` or `emergencyServicesReady`: they are always `null`. Do not claim a satellite link or SOS readiness from this hook.
:::
