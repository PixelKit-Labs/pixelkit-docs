# CameraX Extensions & Computational Photography

> **Direct hardware access to Pixel Night Sight, Ultra HDR, Portrait Bokeh, and Face Retouch via `useCameraExtensions`.**

---

## Overview

Google Pixel phones are renowned for computational photography algorithms that run directly on the Tensor ISP and TPU. While third-party camera apps historically had to build their own software pipelines or settle for standard Camera2 output, Android's CameraX Extensions library provides vendor-level hooks into Google's proprietary camera processing pipeline.

The [`useCameraExtensions`](/api/sensors-actuators/#usecameraextensions) hook exposes these hardware extensions on Pixel 11 Pro.

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useCameraExtensions } from '@pixelkit-labs/sdk';

export function NightSightCapture() {
  const {
    isSupported,
    availableExtensions,
    activeExtension,
    setExtension,
    isCapturing,
    capturePhoto,
    lastCaptureUri,
  } = useCameraExtensions();

  return (
    <View>
      <Text>CameraX Extensions: {isSupported ? 'Available' : 'Unavailable'}</Text>
      <Text>Current Mode: {activeExtension ?? 'Standard'}</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {availableExtensions.map((ext) => (
          <TouchableOpacity
            key={ext}
            onPress={() => setExtension(ext)}
            style={{ backgroundColor: activeExtension === ext ? '#1a73e8' : '#e0e0e0' }}
          >
            <Text>{ext}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={async () => {
          const photo = await capturePhoto({ flashMode: 'off' });
          console.log('Captured photo:', photo.uri);
        }}
        disabled={isCapturing}
      >
        <Text>{isCapturing ? 'Processing...' : 'Capture Photo'}</Text>
      </TouchableOpacity>

      {lastCaptureUri && <Text>Saved: {lastCaptureUri}</Text>}
    </View>
  );
}
```

---

## Supported Camera Extensions

| Extension | Key | Hardware Pipeline on Pixel 11 Pro |
| :--- | :--- | :--- |
| **Night Sight** | `night` | Multi-frame exposure alignment, motion deblur, and low-light semantic tone mapping on Tensor G6 ISP. |
| **Ultra HDR** | `hdr` | 10-bit gainmap generation embedded inside JPEG/HEIC containers for high-dynamic-range display reproduction. |
| **Portrait Bokeh** | `bokeh` | Dual-pixel phase detection depth map generation combined with optical circle-of-confusion simulation. |
| **Face Retouch** | `face_retouch` | Real-time skin texture preservation and subtle blemish reduction. |
| **Auto** | `auto` | Scene analysis triggers the optimal extension automatically based on ambient lux and subject distance. |

---

## Best Practices

1. **Vendor Library Initialization**: CameraX extensions require vendor library initialization on launch. The hook automatically validates availability via `ExtensionManager.getInstanceAsync()`.
2. **Capture Latency**: Night Sight multi-frame burst capture may take 1 to 3 seconds depending on scene illuminance. Keep UI spinners active until `isCapturing` transitions back to `false`.
