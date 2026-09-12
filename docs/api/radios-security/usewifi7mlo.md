# useWifi7MLO

Reads Multi-Link Operation (MLO) telemetry introduced in Android 14+ (API 34+) for 802.11be Wi-Fi 7 routers and modems. Surfaces the array of active affiliated links, their respective channel widths (including ultra-wide 320 MHz channels on 6 GHz), per-link transmit and receive speeds, and calculates combined aggregate throughput. Reports inactive on Wi-Fi 6 or earlier.

## Signature
```typescript
useWifi7MLO(): Wifi7MloTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device hardware and platform support Wi-Fi 7 MLO querying. |
| `isMloActive` | `boolean` | Whether multiple simultaneous radio links are currently bonded. |
| `links` | `MloLinkInfo[]` | Array of affiliated radio links with frequency band, channel width, RSSI, and link speeds. |
| `aggregateSpeedMbps` | `number \| null` | Combined theoretical PHY throughput across all bonded links in Mbps, or null. |
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
  return <Text>MLO: {isMloActive ? 'Active' : 'Single-link'} · Links: {links.length} · Speed: {aggregateSpeedMbps ?? '—'} Mbps</Text>;
}
```

:::note
Available on Android 14+ (API 34+) devices with Wi-Fi 7 hardware (Google Pixel 8/9/10/11).
:::
