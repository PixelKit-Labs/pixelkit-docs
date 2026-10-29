# usePrivateSpace

A process outside any user profile (`UserManager.isProfile()` is `false`) is reported as not inside Private Space. Inside a profile, the user type is read through `LauncherApps.getLauncherUserInfo(Process.myUserHandle())` and compared with `UserManager.USER_TYPE_PROFILE_PRIVATE` (API 35+); when that read is refused `isInsidePrivateSpace` is `null`. Android does not list the Private Space profile to third-party apps, so `isPrivateSpaceConfigured` is `true` only when the app itself runs inside it and `null` otherwise. No public API exposes the auto-lock setting, so it is not reported.

## Signature
```typescript
usePrivateSpace(): PrivateSpaceTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isInsidePrivateSpace` | `boolean \| null` | Whether the current application process runs inside the Private Space profile. `false` below Android 15 and outside any profile; `null` when it runs in a profile whose type cannot be read. |
| `isPrivateSpaceConfigured` | `boolean \| null` | `true` when the app runs inside the Private Space; `null` otherwise because Android hides the profile from apps (`false` below Android 15). |
| `reason` | `string \| null` | Why unreadable values are `null`; `null` before the first read. |
| `error` | `string \| null` | Error message if private profile querying failed. |
| `source` | `TelemetrySource` | `'hardware'` once a read returned `isInsidePrivateSpace`, `'unavailable'` otherwise. |
| `refresh` | `() => void` | Re-reads the user profile type. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Re-reads the user profile type. |

## Example
```tsx
import { usePrivateSpace } from '@pixelkit-labs/sdk';

function VaultStatus() {
  const { isInsidePrivateSpace, reason } = usePrivateSpace();
  const label = isInsidePrivateSpace === null ? 'Unknown' : isInsidePrivateSpace ? 'Inside Private Space' : 'Main profile';
  return <Text>{label}{reason ? ` · ${reason}` : ''}</Text>;
}
```

:::note
Introduced in Android 15 (API 35); below it `isInsidePrivateSpace` is `false` and `isPrivateSpaceConfigured` is `false`. Do not use `isPrivateSpaceConfigured === null` to mean "no Private Space": it means "not readable". The auto-lock policy cannot be read and is not part of this hook.
:::
