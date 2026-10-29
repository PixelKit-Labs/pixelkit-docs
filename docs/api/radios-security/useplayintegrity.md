# usePlayIntegrity

**Source:** [packages/sdk/src/hardware/usePlayIntegrity.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/usePlayIntegrity.ts)

Hardware security feature flags and Android Keystore key attestation. No Play Integrity verdict is produced.

Reads the `android.hardware.strongbox_keystore`, `android.hardware.hardware_keystore` (`FeatureInfo.version`), `android.hardware.keystore.app_attest_key` and `android.hardware.security.model.compatible` system features, and whether `com.google.android.gms` is installed. `requestAttestation` generates an EC key with an attestation challenge (StrongBox when the device declares it, with a fallback to the default keystore), reads `KeyInfo.getSecurityLevel()` (API 31+), and returns the certificate chain (base64, leaf first), its length, the leaf subject and issuer, and the challenge actually used (generated when none is passed). The chain is returned as produced by the Keystore: this hook does not verify it. Verify it on a server against the challenge and Google's attestation roots. No Play Integrity API call is made.

## Signature
```typescript
function usePlayIntegrity(): PlayIntegrityState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | `true` when the device declares StrongBox or hardware keystore, or Google Play Services is installed. |
| `hasStrongBox` | `boolean` | Whether the device declares the StrongBox keystore feature. |
| `strongBoxVersion` | `number \| null` | StrongBox keystore feature version (`FeatureInfo.version`), or `null` when not declared. |
| `hardwareKeystoreVersion` | `number \| null` | Hardware keystore feature version (`FeatureInfo.version`), or `null` when not declared. |
| `hasAppAttestKey` | `boolean` | Whether the device declares `android.hardware.keystore.app_attest_key`. |
| `securityModelCompatible` | `boolean` | Whether the device declares `android.hardware.security.model.compatible`. |
| `playServicesAvailable` | `boolean` | Whether the Google Play Services package is installed. |
| `playServicesVersion` | `string \| null` | Google Play Services version string. |
| `isAttesting` | `boolean` | Whether a cryptographic attestation operation is running. |
| `lastAttestation` | `HardwareAttestationResult \| null` | Result of the last key attestation, including `certificateChainBase64` and the `challenge` used. |
| `error` | `string \| null` | Latest error if attestation failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from the physical device, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestAttestation(challenge?)` | `challenge?: string` — nonce string | `Promise<HardwareAttestationResult \| null>` | Generates an attested EC key, returns the certificate chain (base64), the key's security level from `KeyInfo` (`null` when unreadable) and the challenge used. Resolves `null` on failure with the reason in `error`. |
| `refresh()` | none | `PlayIntegrityInfo \| null` | Re-reads the device security features. |

## Example
```tsx
import { usePlayIntegrity, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function KeyAttestationCard() {
  const { hasStrongBox, strongBoxVersion, isAttesting, lastAttestation, requestAttestation } = usePlayIntegrity();

  return (
    <View>
      <Text>StrongBox feature: {hasStrongBox ? `declared (v${strongBoxVersion})` : 'not declared'}</Text>
      {lastAttestation && (
        <Text>Attested {lastAttestation.algorithm} key, level {lastAttestation.securityLevel ?? 'unknown'} (chain: {lastAttestation.certificateChainLength} certs)</Text>
      )}
      <HapticButton
        title={isAttesting ? "Attesting..." : "Generate key attestation"}
        onPress={() => requestAttestation("session_nonce_xyz")}
        disabled={isAttesting}
      />
    </View>
  );
}
```
