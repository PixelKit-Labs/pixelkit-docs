# Keystore Key Attestation with usePlayIntegrity

> **Hardware security feature flags and Android Keystore key attestation via `usePlayIntegrity`. The hook does not call the Play Integrity API and returns no integrity verdict.**

---

## Overview

The [`usePlayIntegrity`](/api/radios-security/useplayintegrity/) hook reports which hardware keystore features the device declares and whether Google Play Services is installed, and can generate an attested EC key and return its real certificate chain.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePlayIntegrity } from '@pixelkit-labs/sdk';

export function KeyAttestationAuditor() {
  const { isSupported, isAttesting, lastAttestation, requestAttestation } = usePlayIntegrity();

  const handleAttest = async () => {
    const nonce = 'session_' + Date.now();
    const result = await requestAttestation(nonce);
    console.log('Attestation Result:', result?.securityLevel, result?.certificateChainBase64.length);
  };

  return (
    <View>
      <Text>Keystore features declared: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>Status: {isAttesting ? 'Generating key & attesting...' : 'Ready'}</Text>

      {lastAttestation && (
        <View>
          <Text>Security level: {lastAttestation.securityLevel ?? 'unknown'}</Text>
          <Text>Key Alias: {lastAttestation.keyAlias}</Text>
          <Text>Cert Chain Length: {lastAttestation.certificateChainLength}</Text>
        </View>
      )}

      <TouchableOpacity onPress={handleAttest} disabled={isAttesting}>
        <Text>Request key attestation</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## What the attestation contains

When `requestAttestation()` is invoked:
1. PixelKit generates an EC P-256 keypair in the Android Keystore with the supplied challenge (a nonce is generated and returned in `challenge` when you pass none). If the device declares the StrongBox feature, a StrongBox-backed key is requested first and the default keystore is used when that fails.
2. `KeyInfo.getSecurityLevel()` (API 31+) is read from the generated key and returned as `securityLevel` (`STRONGBOX`, `TRUSTED_ENVIRONMENT`, `SOFTWARE`, `UNKNOWN_SECURE`, or `null` when it cannot be read).
3. The certificate chain the Keystore produced is returned as `certificateChainBase64` (DER, base64, leaf first) together with the leaf certificate's subject and issuer. The key is deleted afterwards.

The hook does **not** verify the chain. To establish that the key lives in secure hardware, send the chain and the challenge to your server and verify the chain against Google's attestation roots and the Key Attestation extension in the leaf certificate.

## What is not provided

Play Integrity verdicts (`MEETS_BASIC_INTEGRITY`, `MEETS_DEVICE_INTEGRITY`, `MEETS_STRONG_INTEGRITY`) come from the Google Play Integrity API, which this SDK does not call. Use the Play Integrity API directly if you need them.
