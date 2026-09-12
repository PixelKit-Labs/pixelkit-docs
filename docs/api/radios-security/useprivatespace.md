# usePrivateSpace

Utilizes android.os.UserManager.isPrivateProfile() introduced in Android 15 (API 35). Identifies whether the current application process has been launched within the isolated user profile partition (Private Space), detects whether Private Space has been set up on the device, and reports the active lock policy (immediate, screen_off, device_reboot).

## Signature
```typescript
usePrivateSpace(): PrivateSpaceTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isInsidePrivateSpace` | `boolean` | Whether the current application process is executing inside the isolated Private Space profile. |
| `isPrivateSpaceConfigured` | `boolean` | Whether the device currently has a Private Space secure profile configured. |
| `autoLockPolicy` | `'immediate' \| 'screen_off' \| 'device_reboot' \| 'unknown'` | Configured auto-lock timeout policy for the private space vault. |
| `error` | `string \| null` | Error message if private profile querying failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `refresh` | `() => void` | Re-reads user profile isolation state. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Requests an updated check of Private Space status. |

## Example
```tsx
import { usePrivateSpace } from '@pixelkit-labs/sdk';

function VaultStatus() {
  const { isInsidePrivateSpace, isPrivateSpaceConfigured } = usePrivateSpace();
  return <Text>Vault: {isInsidePrivateSpace ? 'Inside Private Space' : 'Main Profile'} (Configured: {String(isPrivateSpaceConfigured)})</Text>;
}
```

:::note
Introduced in Android 15 (API 35). Earlier Android versions return isInsidePrivateSpace: false and autoLockPolicy: 'unknown'.
:::
