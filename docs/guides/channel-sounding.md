# Bluetooth Channel Sounding Ranging

> **Measure the distance to a Bluetooth peer through the Android 16 `android.ranging` session API with `useChannelSounding`.**

---

## Overview

Bluetooth Channel Sounding (CS) is the Bluetooth Core 6.0 feature for measuring the distance between two Bluetooth devices. Android exposes it through `android.ranging.RangingManager` as the BLE Channel Sounding technology, from Android 16 (API 36).

PixelKit exposes it through the [`useChannelSounding`](/api/radios-security/usechannelsounding/) hook, which does two separate things:

1. **Reports what the device says about itself.** `isSupported` is the `android.hardware.bluetooth_le.channel_sounding` feature flag, `serviceFound` is a lookup of the ranging HAL service, and `rangingAvailability` and `supportedSecurityLevels` are what `RangingManager` reports for the technology.
2. **Opens a real ranging session with a peer you name.** `startRanging({ peerAddress })` builds a RAW `BleCsRangingParams` session for that Bluetooth address and resolves `true` only when the platform reports the session open. Every measurement afterwards is an `android.ranging.RangingData` sample.

The platform delivers a distance in metres, a confidence of `low`, `medium` or `high`, an optional RSSI and a timestamp. It does not say whether phase-based ranging or round-trip time produced a sample, and it does not publish an accuracy figure, so PixelKit reports neither a method nor a precision.

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useChannelSounding } from '@pixelkit-labs/sdk';

export function ProximityLocator({ beaconAddress }: { beaconAddress: string }) {
  const { isSupported, rangingAvailability, isRanging, measurements, sessionError, startRanging, stopRanging } =
    useChannelSounding();

  const latest = measurements.find((m) => m.deviceAddress === beaconAddress.toUpperCase());

  return (
    <View>
      <Text>Channel Sounding declared: {isSupported ? 'yes' : 'no'}</Text>
      <Text>RangingManager: {rangingAvailability ?? '—'}</Text>

      <Button
        title={isRanging ? 'Stop ranging' : 'Start ranging'}
        onPress={() => (isRanging ? stopRanging() : startRanging({ peerAddress: beaconAddress }))}
      />

      {sessionError && <Text>{sessionError}</Text>}
      <Text>
        {latest?.distanceMeters != null
          ? `${latest.distanceMeters.toFixed(2)} m, confidence ${latest.confidence ?? 'unknown'}`
          : '—'}
      </Text>
    </View>
  );
}
```

---

## One ranging session

<!-- diagram: channel-sounding -->

The peer has to be a Bluetooth device that itself supports Channel Sounding, and its address is yours to supply, for example from a scan result or a bonded device. Without one there is nothing to measure.

### Start statuses

`startRanging` resolves `false` and puts the status and reason in `sessionError` when it does not open a session:

| Status | Meaning |
| :--- | :--- |
| `needs_peer_address` | No `peerAddress` was supplied. |
| `invalid_parameters` | The address is not six colon-separated hex bytes, an option has an unknown value, or the requested `securityLevel` is not in `supportedSecurityLevels`. |
| `channel_sounding_unsupported` | The device does not declare Channel Sounding, has no Bluetooth adapter, or `RangingManager` reports the technology as not supported. |
| `channel_sounding_disabled` | `RangingManager` reports the technology as disabled by the user, a regulatory restriction or user restrictions. |
| `ranging_api_unavailable` | Below Android 16, or `RangingManager` is not available. |
| `bluetooth_disabled` | The Bluetooth adapter is off. |
| `permission_denied` | `android.permission.RANGING` is not granted, or the platform threw a `SecurityException` while opening. |
| `session_active` | A session is already running; call `stopRanging()` first. |
| `open_failed` | The platform reported `onOpenFailed`, closed the session before it opened, or did not answer within 10 seconds. |

The app declares `android.permission.RANGING` in its manifest and requests it at runtime. The native module does not add it.

### Stopping

`stopRanging()` returns `{ wasActive, closed, sessionId, error, timestampMs }`: `wasActive` is `false` when nothing was running, and `error` carries a failure from the platform's stop or close.

---

## API & State Reference

```ts
interface ChannelSoundingRangingConfig {
  peerAddress: string;                      // required, "AA:BB:CC:DD:EE:FF"
  role?: 'initiator' | 'responder';         // default 'initiator'
  securityLevel?: 1 | 4;                    // omitted: platform default
  sightType?: 'unknown' | 'line_of_sight' | 'non_line_of_sight';
  locationType?: 'unknown' | 'indoor' | 'outdoor';
  updateRate?: 'normal' | 'infrequent' | 'frequent';
}

interface ChannelSoundingMeasurementEvent {
  sessionId: number;
  deviceAddress: string;
  distanceMeters: number | null;            // null when the platform omitted it
  confidence: 'low' | 'medium' | 'high' | null;
  rssi: number | null;
  timestampMs: number;
}

interface ChannelSoundingState {
  isSupported: boolean;
  isEnabled: boolean;
  serviceFound: boolean;
  rangingAvailability: ChannelSoundingAvailability | null;
  supportedSecurityLevels: number[] | null;
  isRanging: boolean;
  measurements: ChannelSoundingMeasurementEvent[];  // latest sample per peer
  sessionInfo: ChannelSoundingRangingResult | null;
  sessionError: string | null;
  error: string | null;
  source: 'hardware' | 'derived' | 'unavailable';
  startRanging: (config: ChannelSoundingRangingConfig) => Promise<boolean>;
  stopRanging: () => ChannelSoundingStopResult | null;
  refresh: () => ChannelSoundingInfo | null;
}
```

`sightType` and `locationType` are hints passed to `BleCsRangingParams`; they do not change what the hook reports.

---

## Practical Applications

1. **Device finding:** show the distance to a Channel Sounding accessory while the session is open, and show `—` until a sample arrives.
2. **Proximity gating:** compare `distanceMeters` with a threshold only when it is not `null`, and treat a `low` confidence as a reason to wait for another sample.
