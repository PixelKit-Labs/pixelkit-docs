# useSecurity

**Source:** [packages/sdk/src/hardware/useSecurity.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useSecurity.ts)

Secret storage through `expo-secure-store`, which encrypts values with a key held in the **Android Keystore** (StrongBox-backed on devices that have it, including the Pixel 11 Pro). Secret values are never logged: events record the key name, the operation and whether it succeeded, which is enough to debug a storage problem without putting the secret in logcat.

No post-quantum algorithms are involved; `isPostQuantumProtected` is always `false`. On web it falls back to `localStorage`, which is **not** encrypted; `isHardwareBacked` is `false` there and should gate anything sensitive.

## Signature
```typescript
function useSecurity(): {
 saveSecureItem: (key: string, value: string) => Promise<boolean>;
 getSecureItem: (key: string) => Promise<string | null>;
 deleteSecureItem: (key: string) => Promise<boolean>;
 isHardwareBacked: boolean;
 securityModule: 'Android Keystore' | 'none';
 isPostQuantumProtected: false;
 error: string | null;
 lastOperation: string | null;
 source: TelemetrySource;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isHardwareBacked` | `boolean` | `true` on Android, where the encryption key lives in the Keystore rather than in app storage. |
| `securityModule` | `'Android Keystore' \| 'none'` | Which backend is in use. StrongBox presence is a separate question, answered by `useCapabilities().hasStrongBox`. |
| `isPostQuantumProtected` | `false` | Android 17 has post-quantum key types, but SecureStore does not use them. Always `false`; do not claim otherwise. |
| `error` | `string \| null` | Message from the last failed operation. |
| `lastOperation` | `string \| null` | Description of the last operation for a diagnostics panel, e.g. `"saved PIXELKIT_GEMINI_API_KEY"`. Never contains the value. |
| `source` | `TelemetrySource` | `'hardware'` on Android, `'unavailable'` elsewhere. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `saveSecureItem(key, value)` | `key: string` — storage key; alphanumerics, `.`, `-` and `_`. `value: string` — the secret; it is never logged. | `Promise<boolean>` — `true` on success, `false` with `error` set on failure | Encrypts and stores the value, accessible only while the device is unlocked and only on this device. |
| `getSecureItem(key)` | `key: string` — the key used when saving | `Promise<string \| null>` — the decrypted value, or `null` when nothing is stored under that key or the read failed | Decrypts and returns a stored value. |
| `deleteSecureItem(key)` | `key: string` | `Promise<boolean>` — `true` when the delete completed | Removes the stored value. |

## Example
```tsx
import { useSecurity, HapticButton } from '@pixelkit-labs/sdk';

export function VaultManager() {
 const { saveSecureItem, getSecureItem, error } = useSecurity();
 const handleSave = async () => {
 const ok = await saveSecureItem('USER_VAULT_KEY', 'secret_token');
 if (!ok) console.warn(error);
 };
 return <HapticButton title="Save to the Keystore vault" onPress={handleSave} />;
}
```
