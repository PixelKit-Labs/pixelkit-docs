# useWifi7MLO

Reads `WifiInfo.getAffiliatedMloLinks()` (all links of the access point multi-link device) and `getAssociatedMloLinks()` (the links this station is associated to), Android 14+ (API 34+). Each link carries `band` (`MloLink.getBand()`: `2.4GHz`, `5GHz`, `6GHz`, `60GHz` or `null`), `channel`, `rssi`, `txLinkSpeedMbps` and `rxLinkSpeedMbps` (`null` when the platform reports an unknown value) and `state` (`MloLink.getState()`: `unassociated`, `idle`, `active`, or `invalid`). The platform exposes no per-link channel width. `isMloActive` is `true` when the station is associated to more than one link. `aggregateSpeedMbps` is the sum of `txLinkSpeedMbps` (transmit direction only) over the associated links, not a PHY capacity figure; it is `null` when not multi-link or when no link reported a speed. Reports inactive with an empty `links` array when the connected access point is not a multi-link device.

## Signature
```typescript
useWifi7MLO(): Wifi7MloTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether this app could query MLO links (Android 14+ and the query did not throw). Not a hardware capability flag. |
| `isMloActive` | `boolean` | Whether the station is associated to more than one link. |
| `links` | `MloLinkInfo[]` | Links of the access point multi-link device with band, channel, RSSI and link speeds; each link's `state` says whether this station is associated to it. |
| `aggregateSpeedMbps` | `number \| null` | Sum of `txLinkSpeedMbps` over the associated links (transmit direction only), or `null` when not multi-link or no link reported a speed. |
| `error` | `string \| null` | Error message if Wi-Fi link inspection failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `refresh` | `() => void` | Queries the Wi-Fi subsystem for updated link state. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Requests an updated reading of affiliated Wi-Fi 7 links. |

## Example
```tsx
import { useWifi7MLO } from '@pixelkit-labs/sdk';

function Wifi7Status() {
  const { isMloActive, links, aggregateSpeedMbps } = useWifi7MLO();
  return <Text>MLO: {isMloActive ? 'Active' : 'Single-link'} · Links: {links.length} · Tx: {aggregateSpeedMbps ?? '—'} Mbps</Text>;
}
```

:::note
Available on Android 14+ (API 34+). Links appear only while connected to a Wi-Fi 7 multi-link access point. `rssi` and link speeds are `null` when the platform reports them as unknown.
:::
