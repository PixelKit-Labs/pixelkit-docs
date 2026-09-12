# Health Connect & Direct Hardware Sensor Bridges

> **Unified Android Health Connect encrypted data storage and real-time physical sensor streams via `useHealthConnect`.**

---

## Overview

Android 14 and later integrated **Health Connect** into the core operating system, replacing fragmented Google Fit APIs with an on-device, encrypted health and fitness storage architecture.

The [`useHealthConnect`](/api/sensors-actuators/usehealthconnect/) hook provides a unified bridge: it connects to the AndroidX Health Connect client for historical record management, while simultaneously exposing direct zero-latency hardware HAL feeds from physical step counters and photoplethysmography (PPG) heart rate sensors.

```tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useHealthConnect } from '@pixelkit-labs/sdk';

export function FitnessDashboard() {
  const {
    isAvailable,
    sdkStatus,
    hasStepCounter,
    hasHeartRateSensor,
    stepSensorName,
    heartRateSensorName,
    checkAvailability,
    queryDailySteps,
  } = useHealthConnect();

  useEffect(() => {
    checkAvailability();
  }, []);

  return (
    <View>
      <Text>Health Connect Status: {sdkStatus}</Text>
      <Text>Step Sensor: {hasStepCounter ? stepSensorName : 'Unavailable'}</Text>
      <Text>Heart Rate Sensor: {hasHeartRateSensor ? heartRateSensorName : 'Unavailable'}</Text>

      <TouchableOpacity
        onPress={async () => {
          const steps = await queryDailySteps();
          console.log('Daily Steps:', steps);
        }}
      >
        <Text>Query Daily Steps</Text>
      </TouchableOpacity>
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
