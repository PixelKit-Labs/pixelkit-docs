# Spatial Audio & Dynamic Head Tracking

> **Low-latency 3D binaural sound rendering and 6-DOF dynamic head tracking with Pixel Buds via `useSpatialAudio`.**

---

## Overview

Spatial Audio transforms stereo and multichannel audio into an immersive three-dimensional soundscape that remains anchored in physical space as the listener turns their head.

Starting with Android 13 and expanded in Android 17 (API 37), the Android audio framework exposes the `android.media.Spatializer` API. On Google Pixel 11 Pro, spatial rendering is hardware-accelerated directly inside the Tensor G6 low-power Audio DSP, minimizing CPU utilization and battery drain during extended listening sessions.

PixelKit exposes this capability via the [`useSpatialAudio`](/api/system-media/#usespatialaudio) hook.

```tsx
import React from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { useSpatialAudio } from '@pixelkit-labs/sdk';

export function SpatialAudioController() {
  const {
    isSupported,
    isAvailable,
    isEnabled,
    hasHeadTracker,
    headTrackingMode,
    immersiveAudioLevel,
    setSpatialAudioEnabled,
    setHeadTrackingEnabled,
    getHeadPose,
  } = useSpatialAudio();

  return (
    <View>
      <Text>Spatial Audio Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>Output Available: {isAvailable ? 'Yes' : 'No'}</Text>
      <Text>Head Tracker Connected: {hasHeadTracker ? 'Pixel Buds Detected' : 'None'}</Text>
      <Text>Tracking Mode: {headTrackingMode}</Text>
      <Text>Spatial Level: {immersiveAudioLevel}</Text>

      <Switch
        value={isEnabled}
        onValueChange={(val) => setSpatialAudioEnabled(val)}
      />

      {hasHeadTracker && (
        <Button
          title="Log Current Head Pose"
          onPress={async () => {
            const pose = await getHeadPose();
            console.log('Head Pose:', pose);
          }}
        />
      )}
    </View>
  );
}
```

---

## Spatial Audio Pipeline

```text
 ┌─────────────────────────┐
 │   Multichannel Audio    │ (5.1, 7.1, or Virtualized Stereo)
 └────────────┬────────────┘
              │
              ▼
 ┌─────────────────────────┐       ┌────────────────────────┐
 │ Android Spatializer HAL │ <──── │ Pixel Buds Pro 2 IMU   │
 │ (Tensor G6 Audio DSP)   │       │ Dynamic Head Tracking  │
 └────────────┬────────────┘       └────────────────────────┘
              │ (HRTF Filters + Reverb Convolution)
              ▼
 ┌─────────────────────────┐
 │ Binaural Stereo Stream  │
 └─────────────────────────┘
```

### 1. Head-Related Transfer Function (HRTF)
The Tensor G6 Audio DSP convolves spatialized audio streams with customized Head-Related Transfer Functions. Sound sources positioned behind or above the listener are shaped with pinna reflections and interaural time differences (ITD) and interaural level differences (ILD).

### 2. Dynamic Head Tracking with Pixel Buds
When Pixel Buds Pro or Pixel Buds Pro 2 are connected via Bluetooth LE Audio or AAC, the earbud IMU streams rotational quaternions (pitch, yaw, roll) to the phone at 100 Hz. The Spatializer shifts the virtual speaker array in the opposite direction, creating the illusion of stationary virtual speakers in the room.

---

## Head Tracking Modes

| Mode | Description |
| :--- | :--- |
| `disabled` | Standard stereo or fixed binaural downmix without head tracking. |
| `relative_world` | Sounds remain anchored in physical space relative to the room. |
| `relative_device` | Sounds remain anchored relative to the orientation of the phone screen. |

---

## Best Practices

1. **Check Output Availability**: `isAvailable` evaluates whether the currently connected audio sink supports spatialization. Built-in phone speakers may support fixed spatial audio, whereas head tracking requires supported headphones.
2. **Audio Track Attributes**: Ensure sound playback instances specify `USAGE_MEDIA` or `USAGE_GAME` and content type `CONTENT_TYPE_MUSIC` or `CONTENT_TYPE_MOVIE` for the Android system to route through the Spatializer.
