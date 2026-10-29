# Health Connect & Direct Hardware Sensor Bridges

> **Health Connect availability and the device's step counter and heart rate sensors via `useHealthConnect`. The hook does not read Health Connect records.**

---

## Overview

Android 14 and later integrated **Health Connect** into the core operating system, replacing fragmented Google Fit APIs with an on-device, encrypted health and fitness storage architecture.

The [`useHealthConnect`](/api/sensors-actuators/usehealthconnect/) hook reports whether Health Connect looks available (the `healthconnect` system service on Android 14+ or the Health Connect package; inferred, not `HealthConnectClient.getSdkStatus()`) and whether the device has a step counter and a heart rate sensor, with the sensor names `SensorManager` reports. It does not read steps, heart rate or any Health Connect record; use the AndroidX Health Connect client for that.

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useHealthConnect } from '@pixelkit-labs/sdk';

export function FitnessDashboard() {
  const {
    isAvailable,
    sdkStatus,
    hasStepCounter,
    hasHeartRateSensor,
    stepSensorName,
    heartRateSensorName,
    refresh,
  } = useHealthConnect();

  return (
    <View>
      <Text>Health Connect: {isAvailable ? 'available' : 'unavailable'} ({sdkStatus})</Text>
      <Text>Step Sensor: {hasStepCounter ? stepSensorName : 'Unavailable'}</Text>
      <Text>Heart Rate Sensor: {hasHeartRateSensor ? heartRateSensorName : 'Unavailable'}</Text>
      <Text onPress={() => refresh()}>Re-check</Text>
    </View>
  );
}
```

---

## Dual Architecture: Health Connect + Direct Hardware Sensors

<!-- diagram: health-connect -->

---

## Permissions & User Privacy

1. **Granular Permissions**: Health data is protected by individual permissions (e.g. `android.permission.health.READ_STEPS`, `android.permission.health.READ_HEART_RATE`).
2. **System Health Privacy Dashboard**: Users can audit, revoke, and manage which applications access Health Connect records directly through Android Settings.
