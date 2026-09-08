# AI Agent Production Recipes
> **Field-tested code for autonomous agents on the Pixel 11 Pro**

Complete, production-grade recipes for common agentic tasks. Each one states what it takes in and what it gives back, so an agent can wire it up without reading the hook source first. Every hook contract behind these recipes is documented field by field in [`docs/HARDWARE_API.md`](../HARDWARE_API.md).

---

## Recipe Index

1. [Voice-to-Action AI Loop with HiLight Visual Pulse](#recipe-1-voice-to-action-ai-loop-with-hilight-visual-pulse)
2. [Adaptive Sensor Telemetry with ADPF Thermal Pacing](#recipe-2-adaptive-sensor-telemetry-with-adpf-thermal-pacing)
3. [Camera Capture & Zoom Inspector](#recipe-3-camera-capture--zoom-inspector)
4. [Encrypted Credential Vault](#recipe-4-encrypted-credential-vault)
5. [UWB Spatial Target Tracker](#recipe-5-uwb-spatial-target-tracker)

---

## Recipe 1: Voice-to-Action AI Loop with HiLight Visual Pulse

Records from the microphone, transcribes it, lights the camera-bar ring while the model thinks, and sends the transcript to `gemini-3.8-flash`.

| | |
| :--- | :--- |
| **Takes** | The user's speech. Nothing is passed as an argument; `useSpeechAI` opens the microphone itself. |
| **Gives back** | A transcript in `speech.lastTranscript` and a reply appended to `gemini.messages`. Both can fail: a failed transcription resolves `null` and sets `speech.error`; a missing API key appends a `system`-role message rather than throwing. |
| **Needs** | Microphone permission. A Gemini API key for the cloud reply. The HiLight daemon for the light; without it `availability` is `unavailable` and the pulse is skipped. |

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useSpeechAI, useGemini, useHiLight, useHaptics, HapticButton } from '@pixelkit-labs/sdk';

export function VoiceCommander() {
 const speech = useSpeechAI();
 const gemini = useGemini();
 const hilight = useHiLight();
 const { light, success, error } = useHaptics();

 const handleVoiceToggle = async () => {
 if (speech.isListening) {
 const result = await speech.stopListeningAndTranscribe();
 if (result?.transcript) {
 await success();
 // Cyan ring while the model reasons — only when the daemon can drive the LEDs.
 if (hilight.availability === 'hardware') hilight.triggerGeminiPulse(5000);
 await gemini.sendMessage(result.transcript);
 } else {
 await error();
 }
 } else {
 await light();
 await speech.startListening();
 }
 };

 return (
 <View style={{ padding: 16 }}>
 <HapticButton
 title={speech.isListening ? `Listening (${speech.voiceDecibels} dB) — tap to send` : 'Speak to assistant'}
 onPress={handleVoiceToggle}
 variant={speech.isListening ? 'danger' : 'primary'}
 />
 {speech.streamingPartial ? <Text>{speech.streamingPartial}</Text> : null}
 {gemini.isLoading && <Text style={{ color: '#00E5FF', marginTop: 10 }}>Waiting on the cloud model…</Text>}
 {speech.error ? <Text style={{ color: '#F28B82' }}>{speech.error}</Text> : null}
 </View>
 );
}
```

---

## Recipe 2: Adaptive Sensor Telemetry with ADPF Thermal Pacing

Slows the sensor stream down as the phone warms up, instead of waiting for the system to throttle everything.

| | |
| :--- | :--- |
| **Takes** | Nothing from you. `useSensors(intervalMs)` takes its sampling period as an argument, so pacing means re-rendering with a different number. |
| **Gives back** | Live `barometer`, `accelerometer` and the thermal state driving the pacing. `barometer.pressure` and `relativeAltitude` are `null` until a sample arrives, and stay `null` on a device with no barometer — render "—", never 0. |
| **Watch** | `thermalHeadroom` is `null` when the platform will not answer, so guard the arithmetic. It means "how close the phone is to throttling": 0 cold, 1 the point where clocks get cut. |

```tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSensors, useADPF, MetricCard } from '@pixelkit-labs/sdk';

export function AdaptiveTelemetryHUD() {
 const [intervalMs, setIntervalMs] = useState(100);
 const { barometer, barometerAvailable, source } = useSensors(intervalMs);
 const { thermalStatus, thermalHeadroom } = useADPF();

 // Back the sampling rate off as the device warms, rather than being throttled into it.
 useEffect(() => {
 if (thermalStatus === 'severe' || thermalStatus === 'critical') setIntervalMs(500); // 2 Hz
 else if (thermalStatus === 'moderate') setIntervalMs(250); // 4 Hz
 else setIntervalMs(100); // 10 Hz
 }, [thermalStatus]);

 const headroomLabel = thermalHeadroom == null ? '—' : `${Math.round(thermalHeadroom * 100)}%`;

 return (
 <View style={{ padding: 16 }}>
 <MetricCard
 title="Barometric altitude"
 value={barometerAvailable === false ? null : barometer.relativeAltitude}
 unit="m"
 badge={barometer.pressure == null ? '—' : `${barometer.pressure} hPa`}
 badgeColor="#8AB4F8"
 subtitle={`Thermal ${thermalStatus} · headroom ${headroomLabel} · ${intervalMs} ms`}
 source={source}
 />
 </View>
 );
}
```

---

## Recipe 3: Camera Capture & Zoom Inspector

Drives the camera and takes a still. **Zoom is a 0 to 1 fraction of the lens range, not an optical multiplier** — a "5x" figure from the Pixel Camera app does not map onto it.

| | |
| :--- | :--- |
| **Takes** | A mounted `<CameraView>` with `cameraRef` attached. `takePicture({ base64: true })` when the image is going to a model. |
| **Gives back** | `{ uri, width, height, base64?, exif? }`, or `null` when the view is not mounted or the capture failed, with the reason in `camera.error`. The file lives in the app cache until `useMediaLibrary().save()` promotes it. |
| **Note** | `selectedLook` is a label for your own interface. Camera Looks belong to the Pixel Camera app and are not applied to the capture. |

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera, useMediaLibrary, useHaptics, HapticButton } from '@pixelkit-labs/sdk';

export function ProPhotoSuite() {
 const camera = useCamera();
 const library = useMediaLibrary();
 const { selection, success, error } = useHaptics();

 const capture = async () => {
 const photo = await camera.takePicture({ base64: false });
 if (!photo) { await error(); return; }
 await library.save(photo.uri, 'PixelKit'); // otherwise the system reclaims it
 await success();
 };

 if (!camera.hasPermission) return <Text>Camera permission needed</Text>;

 return (
 <View style={{ flex: 1, padding: 16 }}>
 <CameraView ref={camera.cameraRef} onCameraReady={camera.handleCameraReady} {...camera.viewProps} style={{ flex: 1 }} />
 <Text>Zoom {Math.round(camera.zoomFactor * 100)}% of the lens range · {camera.availableLenses.length} lenses</Text>
 {[0, 0.25, 0.5, 0.75, 1].map(f => (
 <HapticButton key={f} title={`${f * 100}%`} onPress={() => { selection(); camera.setZoom(f); }} variant={camera.zoomFactor === f ? 'primary' : 'outline'} />
 ))}
 <HapticButton title="Capture" onPress={capture} variant="primary" />
 {camera.error ? <Text style={{ color: '#F28B82' }}>{camera.error}</Text> : null}
 </View>
 );
}
```

---

## Recipe 4: Encrypted Credential Vault

Persists secrets through SecureStore (Android Keystore, StrongBox-backed on this device) behind a biometric check.

| | |
| :--- | :--- |
| **Takes** | A key name and the secret string. The value never reaches the log — events record the key, the operation and whether it succeeded. |
| **Gives back** | `saveSecureItem` resolves `true` or `false`; `getSecureItem` resolves the value or `null` when nothing is stored under that key. `authenticate` resolves `true` only on success — a cancel and a mismatch both resolve `false` without setting `error`. |
| **Guard** | Check `biometrics.hasHardware` **and** `isEnrolled` before offering the control; with nothing enrolled the prompt can never succeed. |

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useSecurity, useBiometrics, HapticButton } from '@pixelkit-labs/sdk';

export function CredentialVault() {
 const security = useSecurity();
 const biometrics = useBiometrics();
 const [status, setStatus] = useState('Locked');

 const handleUnlock = async () => {
 const verified = await biometrics.authenticate('Unlock credential vault');
 if (!verified) {
 setStatus(biometrics.lastResult === 'cancelled' ? 'Cancelled' : 'Not recognised');
 return;
 }
 const secret = await security.getSecureItem('USER_AGENT_TOKEN');
 setStatus(secret ? 'Unlocked · token retrieved' : 'Unlocked · nothing stored');
 };

 const canPrompt = biometrics.hasHardware && biometrics.isEnrolled;

 return (
 <View style={{ padding: 16 }}>
 <Text style={{ marginBottom: 10 }}>Vault: {status}</Text>
 <HapticButton title="Biometric unlock" onPress={handleUnlock} variant="primary" disabled={!canPrompt} />
 {!canPrompt && <Text>{biometrics.hasHardware ? 'No biometric enrolled' : 'No biometric hardware'}</Text>}
 </View>
 );
}
```

---

## Recipe 5: UWB Spatial Target Tracker

Opens a ranging session and renders distance and angle to each peer.

| | |
| :--- | :--- |
| **Takes** | An optional `sessionId` (default `1001`). Note the arrow function on `onPress`: passing `startRanging` directly would hand it the press event as the session id. |
| **Gives back** | `startRanging` resolves `true` when the session opened, `false` with the reason in `sessionError`. `activeTargets` fills only when paired responders report; it stays empty rather than showing placeholder anchors. |
| **Guard** | `isSupported` and `isEnabled` come from `UwbManager`. Hide the control when there is no chip. |

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useUWB, HapticButton } from '@pixelkit-labs/sdk';

export function SpatialRadarView() {
 const { activeTargets, isRanging, isSupported, startRanging, stopRanging, sessionError } = useUWB();

 if (!isSupported) return <Text>This device has no ultra-wideband radio.</Text>;

 return (
 <View style={{ padding: 16 }}>
 <HapticButton
 title={isRanging ? 'Stop ranging' : 'Start UWB ranging'}
 onPress={() => (isRanging ? stopRanging() : startRanging())}
 variant={isRanging ? 'danger' : 'primary'}
 />
 {sessionError ? <Text style={{ color: '#F28B82' }}>{sessionError}</Text> : null}
 {activeTargets.map(t => (
 <View key={t.deviceId} style={{ marginTop: 8 }}>
 <Text style={{ color: '#8AB4F8', fontWeight: '700' }}>{t.deviceId}</Text>
 <Text style={{ color: '#9398A8' }}>
 {t.distanceMeters.toFixed(2)} m · azimuth {t.azimuthDegrees}° · quality {Math.round(t.signalQuality * 100)}%
 </Text>
 </View>
 ))}
 {isRanging && activeTargets.length === 0 && <Text>Session open, no responders in range.</Text>}
 </View>
 );
}
```
