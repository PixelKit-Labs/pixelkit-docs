# useCellular

**Source:** [packages/sdk/src/hardware/useCellular.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useCellular.ts)

Mobile network telemetry on `expo-cellular`: carrier, radio generation and network codes. `useNetwork` can tell you the connection is cellular; it cannot tell you whether that is 5G or 2G, or who is serving it.

Two caveats. `generation` reflects the current data connection, so it changes as the phone moves and reads `unknown` with no cellular data attached, including on Wi-Fi. And carrier and network codes need the phone-state permission on Android; without it they stay `null` rather than being guessed at. It checks the existing permission and reads everything the platform will answer without prompting, on mount.

## Signature
```typescript
function useCellular(): {
 generation: 'unknown' | '2G' | '3G' | '4G' | '5G';
 is5G: boolean;
 carrierName: string | null;
 isoCountryCode: string | null;
 mobileCountryCode: string | null;
 mobileNetworkCode: string | null;
 allowsVoip: boolean | null;
 permissionGranted: boolean;
 error: string | null;
 source: TelemetrySource;
 refresh: () => Promise<void>;
 requestPermission: () => Promise<boolean>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `generation` | `'unknown' \| '2G' \| '3G' \| '4G' \| '5G'` | Radio generation of the current data connection. `'unknown'` with no cellular data attached. |
| `is5G` | `boolean` | Convenience for `generation === '5G'`. |
| `carrierName` | `string \| null` | Carrier name. `null` without the phone-state permission. |
| `isoCountryCode` | `string \| null` | ISO country of the SIM, e.g. `"gb"`. |
| `mobileCountryCode` | `string \| null` | MCC, the first half of the network identifier. |
| `mobileNetworkCode` | `string \| null` | MNC, the second half. Together MCC+MNC identify a carrier globally. |
| `allowsVoip` | `boolean \| null` | Whether the carrier permits voice over IP. `null` when it cannot be determined. |
| `permissionGranted` | `boolean` | Whether the phone-state permission has been granted. |
| `error` | `string \| null` | Why the last read or permission request failed. |
| `source` | `TelemetrySource` | `'hardware'` once a read has completed, `'unavailable'` before that. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `Promise<void>` — the new values land in the returned fields | Re-reads everything the platform will answer without prompting. |
| `requestPermission()` | none | `Promise<boolean>` — whether it was granted | Asks for the phone-state permission, which unlocks carrier and network codes on Android, then refreshes. Generation is readable without it. |

## Example
```tsx
const cell = useCellular();
<Text>{cell.carrierName ?? 'Carrier hidden'} · {cell.generation}</Text>
{!cell.permissionGranted && <HapticButton title="Allow carrier details" onPress={cell.requestPermission} />}
```
