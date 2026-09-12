# useSatelliteNTN

Interfaces with Android 15+ (API 35+) satellite telephony services and 3GPP Rel-17 NTN modems. Monitors real-time satellite connection states (disconnected, searching, connected, pointing_assist), provider network names, signal quality bars (0 to 4), emergency SOS packet readiness, and surfaces azimuth and elevation vectors to assist pointing the phone at the horizon satellite constellation.

## Signature
```typescript
useSatelliteNTN(): SatelliteNTNTechTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether this device hardware and modem support Non-Terrestrial Network satellite links. |
| `connectionState` | `'disconnected' \| 'searching' \| 'connected' \| 'pointing_assist'` | Current lifecycle connection state with the satellite constellation. |
| `carrier` | `string \| null` | Satellite network provider name (e.g. Skylo, T-Mobile Starlink, Iridium), or null. |
| `signalQualityBars` | `number \| null` | Signal quality indicator bars (0 to 4), or null if disconnected. |
| `pointingGuidance` | `SatelliteGuidance \| null` | Antenna pointing guidance with azimuth, elevation, and alignment flag, or null. |
| `emergencyServicesReady` | `boolean` | Whether the satellite link is ready for emergency SOS packet transmission. |
| `error` | `string \| null` | Error message if satellite modem querying failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `refresh` | `() => void` | Re-reads satellite modem connectivity and pointing status. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Queries the satellite subsystem for updated connectivity and antenna guidance. |

## Example
```tsx
import { useSatelliteNTN } from '@pixelkit-labs/sdk';

function SatelliteStatusCard() {
  const { isSupported, connectionState, carrier, emergencyServicesReady } = useSatelliteNTN();
  return <Text>Satellite: {isSupported ? connectionState : 'Unsupported'} · {carrier ?? 'No carrier'} · SOS: {emergencyServicesReady ? 'Ready' : 'Standby'}</Text>;
}
```

:::note
Requires Android 15+ (API 35+) and device hardware equipped with a 3GPP Rel-17 NTN satellite modem (Google Pixel 9 and later).
:::
