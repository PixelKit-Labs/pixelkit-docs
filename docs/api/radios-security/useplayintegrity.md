# usePlayIntegrity

**Source:** [packages/sdk/src/hardware/usePlayIntegrity.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/usePlayIntegrity.ts)

Hardware-backed Key Attestation and Google Play Integrity verdicts via the Titan M2 security coprocessor.

Backed by `android.hardware.strongbox_keystore` (Titan M2 KeyMint 400), `android.hardware.hardware_keystore` (500), and `android.hardware.keystore.app_attest_key`. Generates EC keypairs within the isolated Titan M2 security enclave with user-provided cryptographic challenge nonces, verifying the resulting certificate chain and confirming that the runtime environment satisfies `MEETS_STRONG_INTEGRITY`. Nothing is simulated: reads directly from the Android KeyStore and system security services.

## Signature
```typescript
function usePlayIntegrity(): PlayIntegrityState;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether hardware attestation and Play Integrity are supported on device. |
| `hasStrongBox` | `boolean` | Whether Titan M2 hardware StrongBox security chip is present. |
| `strongBoxVersion` | `number \| null` | StrongBox KeyMint version (400 on Pixel 11 Pro). |
| `hardwareKeystoreVersion` | `number \| null` | Hardware KeyStore version (500 on Android 17 / Pixel 11 Pro). |
| `hasAppAttestKey` | `boolean` | Whether device supports individual key attestation (`android.hardware.keystore.app_attest_key`). |
| `securityModelCompatible` | `boolean` | Whether device satisfies Android hardware security model. |
| `playServicesAvailable` | `boolean` | Whether Google Play Services is available and active. |
| `playServicesVersion` | `string \| null` | Google Play Services version string. |
| `deviceIntegrity` | `'MEETS_STRONG_INTEGRITY' \| 'MEETS_DEVICE_INTEGRITY' \| 'MEETS_BASIC_INTEGRITY' \| 'UNVERIFIED'` | Hardware integrity tier verdict. |
| `isAttesting` | `boolean` | Whether a cryptographic attestation operation is running. |
| `lastAttestation` | `HardwareAttestationResult \| null` | Result of last hardware key attestation. |
| `error` | `string \| null` | Latest error if attestation failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestAttestation(challenge?)` | `challenge?: string` — cryptographic nonce string | `Promise<HardwareAttestationResult \| null>` | Generates an EC keypair inside Titan M2 StrongBox, extracts signed X.509 cert chain, and returns attestation details. |
| `refresh()` | none | `PlayIntegrityInfo \| null` | Re-queries system security features and Play Services state. |

## Example
```tsx
import { usePlayIntegrity, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function TitanM2AttestationCard() {
  const { hasStrongBox, deviceIntegrity, strongBoxVersion, isAttesting, lastAttestation, requestAttestation } = usePlayIntegrity();

  return (
    <View>
      <Text>Titan M2 HSM: {hasStrongBox ? `Active (KeyMint v${strongBoxVersion})` : 'Unavailable'}</Text>
      <Text>Integrity Tier: {deviceIntegrity}</Text>
      {lastAttestation && (
        <Text>Attested {lastAttestation.algorithm} key via {lastAttestation.securityLevel} (chain: {lastAttestation.certificateChainLength} certs)</Text>
      )}
      <HapticButton
        title={isAttesting ? "Attesting with Titan M2..." : "Generate Hardware Attestation"}
        onPress={() => requestAttestation("session_nonce_xyz")}
        disabled={isAttesting}
      />
    </View>
  );
}
```
