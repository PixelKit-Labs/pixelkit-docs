# Play Integrity & Titan M2 Hardware Key Attestation

> **Hardware-backed security verdicts and StrongBox Keystore 400 EC keypair attestation via `usePlayIntegrity`.**

---

## Overview

Securing mobile applications against malicious tampering, app cloning, reverse engineering, and rooted environments requires verifiable hardware roots of trust.

Google Pixel 11 Pro includes Google's custom **Titan M2** security chip, providing a dedicated **StrongBox KeyStore** (KeyMint 400). The [`usePlayIntegrity`](/api/radios-security/useplayintegrity/) hook pairs Google Play Integrity API verdicts with on-chip StrongBox asymmetric keypair attestation.

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePlayIntegrity } from '@pixelkit-labs/sdk';

export function SecurityAuditor() {
  const {
    isSupported,
    isAttesting,
    lastAttestation,
    requestAttestation,
    verifyIntegrityToken,
  } = usePlayIntegrity();

  const handleAttest = async () => {
    const nonce = 'session_' + Date.now();
    const result = await requestAttestation(nonce);
    console.log('Attestation Result:', result);
  };

  return (
    <View>
      <Text>Play Integrity Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>Status: {isAttesting ? 'Generating Key & Attesting...' : 'Ready'}</Text>

      {lastAttestation && (
        <View>
          <Text>StrongBox Backed: {lastAttestation.isStrongBoxBacked ? 'Titan M2 Active' : 'Software Fallback'}</Text>
          <Text>Key Alias: {lastAttestation.keyAlias}</Text>
          <Text>Cert Chain Length: {lastAttestation.certificateChainLength}</Text>
          <Text>Verdict: {lastAttestation.verdict}</Text>
        </View>
      )}

      <TouchableOpacity onPress={handleAttest} disabled={isAttesting}>
        <Text>Request Titan M2 Attestation</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Play Integrity Verdicts

| Verdict | Significance |
| :--- | :--- |
| `MEETS_BASIC_INTEGRITY` | App runs on an Android device that passes basic system integrity checks (no obvious rooting or hooks). |
| `MEETS_DEVICE_INTEGRITY` | Device is certified by Google Play Services and passes CTS (Compatibility Test Suite). |
| `MEETS_STRONG_INTEGRITY` | Hardware-backed guarantees: locked bootloader, factory OS keys, and hardware keystore proofs. |
| `MEETS_VIRTUAL_INTEGRITY` | Detected inside an emulator or virtual container. |

---

## Titan M2 StrongBox Integration

When `requestAttestation()` is invoked:
1. PixelKit requests an isolated EC P-256 keypair from Android KeyStore with `setIsStrongBoxBacked(true)`.
2. The key generation occurs inside Titan M2 physical silicon with independent RAM, flash, and crypto accelerators.
3. Titan M2 produces an X.509 certificate chain signed by the Google Root CA, proving that the private key has never left the hardware security module.
