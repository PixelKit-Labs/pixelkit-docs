# useKeyAgreement

Utilizes AndroidKeyStore and Java Cryptography Architecture (JCA) backed by the Google Titan M2 StrongBox hardware security module. Implements Elliptic Curve Diffie-Hellman (ECDH) on the NIST P-256 (secp256r1) curve with PURPOSE_AGREE_KEY. Generates hardware-isolated keypairs and derives symmetrical AES shared secrets against external peer public keys.

## Signature
```typescript
useKeyAgreement(): KeyAgreementTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isStrongBoxSupported` | `boolean` | Whether the device hardware includes a dedicated StrongBox Keymaster module (Titan M2). |
| `error` | `string \| null` | Latest error message if keypair generation or secret derivation failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `generateKeyPair` | `(alias: string, preferStrongBox?: boolean) => Promise<KeyAgreementKeyPairResult>` | Generates an EC keypair inside the hardware enclave with PURPOSE_AGREE_KEY. |
| `deriveSharedSecret` | `(alias: string, peerPublicKeyBase64: string) => Promise<SharedSecretResult>` | Computes an ECDH shared secret using the hardware private key and peer's public key. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `generateKeyPair(alias, preferStrongBox)` | none | `void` | Generates an EC keypair inside the hardware enclave. |
| `deriveSharedSecret(alias, peerPublicKeyBase64)` | none | `void` | Derives a shared secret via ECDH with a peer's public key. |

## Example
```tsx
import { useKeyAgreement } from '@pixelkit-labs/sdk';

function KeyExchange() {
  const { isStrongBoxSupported, generateKeyPair, deriveSharedSecret } = useKeyAgreement();
  const handleExchange = async () => {
    const pair = await generateKeyPair('session_key_1', true);
    console.log('Public Key:', pair.publicKeyBase64);
  };
  return <Button title="Generate StrongBox Key" onPress={handleExchange} />;
}
```

:::note
Titan M2 StrongBox backed on Google Pixel 3 and newer. Hardware isolation guarantees private keys cannot be extracted even by rooted or compromised kernels.
:::
