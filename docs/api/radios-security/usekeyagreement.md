# useKeyAgreement

Uses AndroidKeyStore and the Java Cryptography Architecture. Generates an EC keypair with `PURPOSE_AGREE_KEY` (the Keystore default curve) and derives an ECDH shared secret against an external peer public key. When `preferStrongBox` is `true` and the device declares `android.hardware.strongbox_keystore`, StrongBox is requested; the achieved level is read with `KeyInfo.getSecurityLevel()` (API 31+) and returned as `securityLevel` (`STRONGBOX`, `TRUSTED_ENVIRONMENT`, `SOFTWARE`, `UNKNOWN_SECURE`), or `null` with `securityLevelReason` when it cannot be read or generation failed.

## Signature
```typescript
useKeyAgreement(): KeyAgreementTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isStrongBoxSupported` | `boolean` | Whether the device declares the `android.hardware.strongbox_keystore` feature. |
| `error` | `string \| null` | Latest error message if keypair generation or secret derivation failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `generateKeyPair` | `(alias: string, preferStrongBox?: boolean) => Promise<KeyAgreementKeyPairResult>` | Generates an EC keypair in the Android Keystore with `PURPOSE_AGREE_KEY`; `securityLevel` is read from `KeyInfo`. |
| `deriveSharedSecret` | `(alias: string, peerPublicKeyBase64: string) => Promise<SharedSecretResult>` | Computes an ECDH shared secret using the Keystore private key and the peer's public key. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `generateKeyPair(alias, preferStrongBox)` | `alias: string`, `preferStrongBox?: boolean` | `Promise<KeyAgreementKeyPairResult>` | Generates an EC keypair in the Android Keystore. Resolves with `publicKeyBase64` and `securityLevel` (`null` when unreadable or when generation failed, with the reason in `error`). |
| `deriveSharedSecret(alias, peerPublicKeyBase64)` | `alias: string`, `peerPublicKeyBase64: string` | `Promise<SharedSecretResult>` | Derives a shared secret via ECDH with a peer's public key. Resolves with `sharedSecretBase64` (`null` on failure, with the reason in `error`). |

## Example
```tsx
import { useKeyAgreement } from '@pixelkit-labs/sdk';

function KeyExchange() {
  const { isStrongBoxSupported, generateKeyPair } = useKeyAgreement();
  const handleExchange = async () => {
    const pair = await generateKeyPair('session_key_1', true);
    console.log('Public Key:', pair.publicKeyBase64, 'Level:', pair.securityLevel ?? 'unknown');
  };
  return <Button title="Generate key" onPress={handleExchange} />;
}
```

:::note
`securityLevel` is what the platform reported for the generated key, not what was requested: a request for StrongBox on a device without the feature yields a different level or `null`. The private key is not exported by this API.
:::
