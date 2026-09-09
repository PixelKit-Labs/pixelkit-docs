# Bluetooth 6.0 Channel Sounding & High-Accuracy Ranging

> **Millimeter and centimeter-accurate Phase-Based Ranging (PBR) and Round-Trip Time (RTT) on Google Pixel 11 Pro with `useChannelSounding`.**

---

## Overview

Traditional Bluetooth proximity detection relies on Received Signal Strength Indication (RSSI). However, RSSI is notoriously susceptible to environmental attenuation, radio reflections, multipath fading, and human body obstruction—often producing distance errors of several meters.

Starting with Bluetooth Core Specification 6.0 and Android 17 (API 37), Google introduced native platform support for **Bluetooth Channel Sounding (CS)**. Google Pixel 11 Pro (`grizzly`) pairs Tensor G6 with an advanced dual-antenna BLE 6.0 radio controller, enabling hardware-accelerated **Phase-Based Ranging (PBR)** and **Round-Trip Time (RTT)** ranging.

PixelKit exposes this physical radio capability via the [`useChannelSounding`](/api/radios-security/#usechannelsounding) hook.

```tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useChannelSounding } from '@pixelkit-labs/sdk';

export function ProximityLocator({ beaconMac }: { beaconMac: string }) {
  const { isSupported, channelCount, supportsPbr, isRanging, targets, startRanging, stopRanging } = useChannelSounding();

  const target = targets[beaconMac];

  return (
    <View>
      <Text>BLE 6.0 CS Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>Sounding Channels: {channelCount}</Text>
      <Text>PBR Accurate: {supportsPbr ? 'Active' : 'Fallback RTT'}</Text>

      {target && (
        <View>
          <Text>Distance: {target.distanceMeters.toFixed(2)} m (±{(target.confidence * 100).toFixed(0)}%)</Text>
          <Text>Azimuth: {target.azimuthDegrees?.toFixed(1) ?? '—'}°</Text>
          <Text>Security Level: {target.securityLevel}</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => isRanging ? stopRanging(beaconMac) : startRanging(beaconMac)}>
        <Text>{isRanging ? 'Stop CS Ranging' : 'Start CS Ranging'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Channel Sounding Architecture

Bluetooth Channel Sounding operates by coordinating tone exchanges between two BLE devices across multiple radio frequency channels (typically up to 72 channels across the 2.4 GHz ISM band).

<!-- diagram: channel-sounding -->

### 1. Phase-Based Ranging (PBR)
In PBR mode, the initiator and reflector transmit unmodulated carrier tones across scheduled frequencies. By measuring the phase rotation across different carrier frequencies, the Tensor G6 baseband resolves distance using the phase-slope relationship:
```text
Δθ = (4π * Δf * d) / c
```
This allows distance resolution down to **±1 to 3 centimeters** under line-of-sight conditions.

### 2. Round-Trip Time (RTT) Sounding
When multipath interference obscures the carrier phase, or across longer non-line-of-sight distances, the radio automatically supplements PBR with high-precision time-of-flight measurements (sub-nanosecond timestamping of CS-SYNC packets).

### 3. Anti-Spoofing & Relay Attack Protection
Traditional BLE keyless entry is vulnerable to relay amplification attacks. Bluetooth 6.0 Channel Sounding incorporates cryptographic nonce sequencing in every CS subevent, ensuring that signals cannot be intercepted, predicted, or re-transmitted without altering the phase-path integrity.

---

## API & State Reference

The `useChannelSounding()` hook exposes the following state contract:

```ts
interface ChannelSoundingTarget {
  macAddress: string;
  distanceMeters: number;
  confidence: number; // 0.0 to 1.0
  azimuthDegrees?: number; // Estimated angle when multi-antenna array is active
  elevationDegrees?: number;
  lastUpdatedMs: number;
  rangingMode: 'pbr' | 'rtt' | 'hybrid';
  securityLevel: 'standard' | 'high_security';
}

interface ChannelSoundingState {
  isSupported: boolean;
  channelCount: number;
  supportsPbr: boolean;
  supportsRtt: boolean;
  isRanging: boolean;
  targets: Record<string, ChannelSoundingTarget>;
  source: 'hardware' | 'unavailable';
  startRanging: (targetMacAddress: string, options?: CSRangingOptions) => Promise<boolean>;
  stopRanging: (targetMacAddress?: string) => Promise<boolean>;
}
```

---

## Practical Applications

1. **Smart Locks & Keyless Entry**: Unlock doors strictly when the authenticated phone is within 1 meter and moving *toward* the threshold, eliminating false unlocks from across the room.
2. **Device Finding & Asset Tracking**: Guide users to lost trackers or accessories with cm-level distance countdowns and directional guidance.
3. **Touchless Point-of-Sale**: Secure high-value transactions with cryptographic physical proximity validation.
