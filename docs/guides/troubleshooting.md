# Troubleshooting & Diagnostics Guide
> **Common Issues, Expo SDK 57 Nuances, Permissions, and Hardware Diagnostics**

This guide outlines common errors, hardware lifecycle caveats, and resolution steps for PixelKit developers.

---

## Issue Index

1. [KeepAwake Tag Error in Expo SDK 57](#1-keepawake-tag-error-in-expo-sdk-57)
2. [StatusBar BackgroundColor Deprecation](#2-statusbar-backgroundcolor-deprecation)
3. [Camera Permission & Simulator Fallback](#3-camera-permission--simulator-fallback)
4. [ADPF Thermal Throttling Mitigation](#4-adpf-thermal-throttling-mitigation)
5. [Hermes Bytecode Metro Bundling Verification](#5-hermes-bytecode-metro-bundling-verification)
6. [Keystore and SecureStore access modes](#6-keystore-and-securestore-access-modes)
7. [A hook returns null and its source says unavailable](#7-a-hook-returns-null-and-its-source-says-unavailable)

---

## 1. KeepAwake Tag Error in Expo SDK 57

### Symptom
`Unhandled promise rejection: activateKeepAwake requires a tag parameter in Expo SDK 57`.

### Cause
In Expo SDK 57 (`~57.0.20`), `activateKeepAwakeAsync()` requires passing a string tag to identify the wake-lock owner.

### Resolution
Always pass a unique tag when activating or deactivating:
```typescript
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'pixelkit_display_lock';

// CORRECT
await activateKeepAwakeAsync(TAG);
deactivateKeepAwake(TAG);

// WRONG (Omitted tag throws in Expo 57)
await activateKeepAwakeAsync();
```

---

## 2. StatusBar BackgroundColor Deprecation

### Symptom
TypeScript warning or runtime error: `Property 'backgroundColor' does not exist on type 'IntrinsicAttributes & StatusBarProps'`.

### Cause
In Expo SDK 57, `<StatusBar />` from `expo-status-bar` dropped the `backgroundColor` prop in favor of root View background styling.

### Resolution
Style the parent `<SafeAreaView>` or root `<View>` with `Colors.dark.background` (`#0E1119`) and use `<StatusBar style="light" />`:
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#0E1119' }}>
 <StatusBar style="light" />
 {/* Content */}
</SafeAreaView>
```

---

## 3. Camera Permission & Simulator Fallback

### Symptom
Camera screen throws `Camera permission not granted` on Android emulator or initial launch.

### Resolution
`useCamera()` includes an asynchronous permission check with a graceful fallback. Ensure `app.json` includes the camera permission:
```json
"android": {
 "permissions": [
 "android.permission.CAMERA",
 "android.permission.RECORD_AUDIO"
 ]
}
```
If running in an emulator without camera hardware, `useVisionAI()` provides gallery photo picking via `captureAndAnalyze(false)`.

---

## 4. ADPF Thermal Throttling Mitigation

### Symptom
Frame drops or stutter when rendering complex graphics or processing sustained neural workloads.

### Resolution
Check `useADPF().thermalStatus`:
```typescript
const { thermalStatus } = useADPF();

if (thermalStatus === 'severe' || thermalStatus === 'critical') {
 // 1. Back off sensor polling to 500ms
 // 2. Pause non-essential background tensor passes
 // 3. Extinguish flashlight / HiLight ring
}
```

---

## 5. Hermes Bytecode Metro Bundling Verification

To ensure all TypeScript modules compile and package cleanly without syntax or bundling errors:

```bash
# 1. Typecheck
npm run typecheck

# 2. Bundle Hermes bytecode for Android
npx expo export -p android
```

If bundling reports an error, clean the Metro cache:
```bash
npx expo start -c
```

---

## 6. Keystore and SecureStore access modes

On Android, `expo-secure-store` encrypts values with a key held in the Android Keystore, StrongBox-backed on this device.

* `useSecurity().saveSecureItem(key, value)` uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so a value is readable only while the device is unlocked and never leaves this phone.
* On web there is no Keystore: the hook falls back to `localStorage`, which is **not** encrypted. `isHardwareBacked` is `false` there, so gate anything sensitive on it.
* `isPostQuantumProtected` is always `false`. Android 17 defines post-quantum key types; SecureStore does not use them.

---

## 7. A hook returns null and its source says unavailable

### Symptom
A metric renders as "—" and `source` is `'unavailable'`.

### Cause
This is the SDK working as designed, not a bug. There is no `simulated` provenance value: when a reading cannot be taken, the value is `null` rather than a plausible substitute. Common reasons:

| Cause | Check | Fix |
| :--- | :--- | :--- |
| Running in Expo Go or on web | `PixelNative` and `PixelNano` resolve to `null` there | Use a development build on the device |
| Permission not granted | `hasPermission`, `permissionGranted`, `hasHardware` on the hook | Request it, then re-read |
| The device lacks the hardware | `useCapabilities()` — `hasUWB`, `hasHiLight`, `hasStrongBox`, `hasNFC` | Hide the control rather than showing one that fails |
| The daemon is not running (HiLight only) | `availability === 'unavailable'` | `npm run hilight:daemon` |
| First sample has not arrived | `hasMotionSample`, `hasFix`, `hasRead`, `isReady` | Wait; render "—" meanwhile |

### Resolution
Render `null` as "—", pass `source` to `MetricCard` so the tag is visible, and read the hook's `error` field for the reason. Never substitute a default.
