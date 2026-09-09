# Radios & Hardware Security API Reference
> **Android Keystore secure storage, Biometrics, Bluetooth LE, NFC, and Dual-Band GNSS**

This document covers wireless radios, near-field interactions, satellite positioning and hardware-backed secret storage on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

---

## Module Index

* [`useBiometrics`](#usebiometrics) - Ultrasonic In-Screen Fingerprint & Class 3 Face Unlock
* [`useSecurity`](#usesecurity) - SecureStore on the Android Keystore
* [`usePlayIntegrity`](#useplayintegrity) - Titan M2 Hardware Key Attestation & Google Play Integrity
* [`useBLE`](#useble) - Bluetooth Low Energy adapter, bonded devices, live scanning
* [`useChannelSounding`](#usechannelsounding) - Bluetooth Core 6.0 Phase-Based Ranging (PBR)
* [`useNFC`](#usenfc) - NDEF reader mode, tag reading and writing
* [`useRadios`](#useradios) - Unified Hardware Radio Subsystem Telemetry
* [`useLocation`](#uselocation) - Dual-Frequency Multi-Band GNSS (GPS L1/L5)

---

## `useBiometrics`

Fingerprint and face authentication through the platform `BiometricPrompt` (`expo-local-authentication`). Sensor presence and enrolment are reported separately, because a device can have the sensor with nothing enrolled, in which case a prompt can never succeed and the caller should offer a passcode path instead of a button that always fails.

A failed prompt is not a broken one: `authenticate` resolves `false` for a cancel or a mismatch and sets `error` only when the call itself failed. Capabilities are read on mount.

### Signature
```typescript
function useBiometrics(): BiometricState & {
 hasChecked: boolean;
 lastResult: 'success' | 'failed' | 'cancelled' | null;
 error: string | null;
 source: TelemetrySource;
 authenticate: (promptMessage?: string) => Promise<boolean>;
 refresh: () => Promise<void>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `hasHardware` | `boolean` | Whether a biometric sensor exists. Stays `false` when the capability read failed, rather than claiming hardware that was not confirmed. |
| `isEnrolled` | `boolean` | Whether the user has enrolled a fingerprint or face. Without this a prompt cannot succeed. |
| `supportedTypes` | `string[]` | Modalities the platform reports, e.g. `['Fingerprint', 'Face Unlock']`. |
| `hasChecked` | `boolean` | Whether the capability read has completed. Before it, treat the other flags as unknown rather than false. |
| `lastResult` | `'success' \| 'failed' \| 'cancelled' \| null` | Outcome of the last prompt. `null` before the first attempt. Distinguishes a deliberate cancel from a rejected credential. |
| `error` | `string \| null` | Set only when a call itself failed — not when the user cancelled or was not recognised. |
| `source` | `TelemetrySource` | `'hardware'` once capabilities have been read, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `authenticate(promptMessage?)` | `promptMessage?: string` — the line shown in the system sheet, default `'Verify identity with Pixel Biometrics'`. | `Promise<boolean>` — `true` only on success; `false` for a cancel, a mismatch, missing hardware or nothing enrolled | Shows the system prompt with a Cancel action and a device-passcode fallback. Refuses up front (setting `error`) when there is no hardware or no enrolment. |
| `refresh()` | none | `Promise<void>` — updates `hasHardware`, `isEnrolled`, `supportedTypes` | Re-reads sensor presence and enrolment. Call it when returning from Settings, where the user may have just enrolled a finger. |

---

## `useSecurity`

Secret storage through `expo-secure-store`, which encrypts values with a key held in the **Android Keystore** (StrongBox-backed on devices that have it, including the Pixel 11 Pro). Secret values are never logged: events record the key name, the operation and whether it succeeded, which is enough to debug a storage problem without putting the secret in logcat.

No post-quantum algorithms are involved; `isPostQuantumProtected` is always `false`. On web it falls back to `localStorage`, which is **not** encrypted; `isHardwareBacked` is `false` there and should gate anything sensitive.

### Signature
```typescript
function useSecurity(): {
 saveSecureItem: (key: string, value: string) => Promise<boolean>;
 getSecureItem: (key: string) => Promise<string | null>;
 deleteSecureItem: (key: string) => Promise<boolean>;
 isHardwareBacked: boolean;
 securityModule: 'Android Keystore' | 'none';
 isPostQuantumProtected: false;
 error: string | null;
 lastOperation: string | null;
 source: TelemetrySource;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isHardwareBacked` | `boolean` | `true` on Android, where the encryption key lives in the Keystore rather than in app storage. |
| `securityModule` | `'Android Keystore' \| 'none'` | Which backend is in use. StrongBox presence is a separate question, answered by `useCapabilities().hasStrongBox`. |
| `isPostQuantumProtected` | `false` | Android 17 has post-quantum key types, but SecureStore does not use them. Always `false`; do not claim otherwise. |
| `error` | `string \| null` | Message from the last failed operation. |
| `lastOperation` | `string \| null` | Description of the last operation for a diagnostics panel, e.g. `"saved PIXELKIT_GEMINI_API_KEY"`. Never contains the value. |
| `source` | `TelemetrySource` | `'hardware'` on Android, `'unavailable'` elsewhere. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `saveSecureItem(key, value)` | `key: string` — storage key; alphanumerics, `.`, `-` and `_`. `value: string` — the secret; it is never logged. | `Promise<boolean>` — `true` on success, `false` with `error` set on failure | Encrypts and stores the value, accessible only while the device is unlocked and only on this device. |
| `getSecureItem(key)` | `key: string` — the key used when saving | `Promise<string \| null>` — the decrypted value, or `null` when nothing is stored under that key or the read failed | Decrypts and returns a stored value. |
| `deleteSecureItem(key)` | `key: string` | `Promise<boolean>` — `true` when the delete completed | Removes the stored value. |

### Example
```tsx
import { useSecurity, HapticButton } from '@pixelkit-labs/sdk';

export function VaultManager() {
 const { saveSecureItem, getSecureItem, error } = useSecurity();
 const handleSave = async () => {
 const ok = await saveSecureItem('USER_VAULT_KEY', 'secret_token');
 if (!ok) console.warn(error);
 };
 return <HapticButton title="Save to the Keystore vault" onPress={handleSave} />;
}
```

---

## `usePlayIntegrity`

Hardware-backed Key Attestation and Google Play Integrity verdicts via the Titan M2 security coprocessor.

Backed by `android.hardware.strongbox_keystore` (Titan M2 KeyMint 400), `android.hardware.hardware_keystore` (500), and `android.hardware.keystore.app_attest_key`. Generates EC keypairs within the isolated Titan M2 security enclave with user-provided cryptographic challenge nonces, verifying the resulting certificate chain and confirming that the runtime environment satisfies `MEETS_STRONG_INTEGRITY`. Nothing is simulated: reads directly from the Android KeyStore and system security services.

### Signature
```typescript
function usePlayIntegrity(): PlayIntegrityState;
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether hardware attestation and Play Integrity are supported on device. |
| `hasStrongBox` | `boolean` | Whether Titan M2 hardware StrongBox security chip is present. |
| `strongBoxVersion` | `number \| null` | StrongBox KeyMint version (400 on Pixel 11 Pro). |
| `hardwareKeystoreVersion` | `number \| null` | Hardware KeyStore version (500 on Android 17 / Pixel 11 Pro). |
| `hasAppAttestKey` | `boolean` | Whether device supports individual key attestation (`android.hardware.keystore.app_attest_key`). |
| `securityModelCompatible` | `boolean` | Whether device satisfies Android hardware security model. |
| `playServicesAvailable` | `boolean` | Whether Google Play Services is available and active. |
| `playServicesVersion` | `string \| null` | Google Play Services version string. |
| `deviceIntegrity` | `'MEETS_STRONG_INTEGRITY' \| 'MEETS_DEVICE_INTEGRITY' \| 'MEETS_BASIC_INTEGRITY' \| 'UNVERIFIED'` | Hardware integrity tier verdict. |
| `isAttesting` | `boolean` | Whether a cryptographic attestation operation is running. |
| `lastAttestation` | `HardwareAttestationResult \| null` | Result of last hardware key attestation. |
| `error` | `string \| null` | Latest error if attestation failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestAttestation(challenge?)` | `challenge?: string` — cryptographic nonce string | `Promise<HardwareAttestationResult \| null>` | Generates an EC keypair inside Titan M2 StrongBox, extracts signed X.509 cert chain, and returns attestation details. |
| `refresh()` | none | `PlayIntegrityInfo \| null` | Re-queries system security features and Play Services state. |

### Example
```tsx
import { usePlayIntegrity, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function TitanM2AttestationCard() {
  const { hasStrongBox, deviceIntegrity, strongBoxVersion, isAttesting, lastAttestation, requestAttestation } = usePlayIntegrity();

  return (
    <View>
      <Text>Titan M2 HSM: {hasStrongBox ? `Active (KeyMint v${strongBoxVersion})` : 'Unavailable'}</Text>
      <Text>Integrity Tier: {deviceIntegrity}</Text>
      {lastAttestation && (
        <Text>Attested {lastAttestation.algorithm} key via {lastAttestation.securityLevel} (chain: {lastAttestation.certificateChainLength} certs)</Text>
      )}
      <HapticButton
        title={isAttesting ? "Attesting with Titan M2..." : "Generate Hardware Attestation"}
        onPress={() => requestAttestation("session_nonce_xyz")}
        disabled={isAttesting}
      />
    </View>
  );
}
```

---

## `useBLE`

Reads the physical Bluetooth adapter state, Bluetooth 5.4 Channel Sounding silicon support and real bonded devices from `BluetoothAdapter`, and discovers nearby peripherals with Android `BluetoothLeScanner`. Distance is estimated from RSSI with the log-distance path-loss model (`n = 2.0`, free space), so it is an estimate and drifts with obstacles. Adapter state is read per render from the native module; discovery is polled every 500 ms while a scan is running.

### Signature
```typescript
function useBLE(): {
 isSupported: boolean;
 isEnabled: boolean;
 state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
 channelSounding: boolean;
 bondedDevices: BondedDevice[];
 error: string | null;
 source: TelemetrySource;
 isScanning: boolean;
 peripherals: BLEPeripheral[];
 scanError: string | null;
 startScan: (timeoutMs?: number) => Promise<boolean>;
 stopScan: () => void;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device has Bluetooth Low Energy hardware. |
| `isEnabled` | `boolean` | Whether Bluetooth is switched on in system settings. Scanning fails when it is not. |
| `state` | `'ON' \| 'OFF' \| 'TURNING_ON' \| 'TURNING_OFF'` | Adapter state, including the transitional values, so a toggle does not look like a failure. |
| `channelSounding` | `boolean` | Whether the silicon supports Bluetooth Channel Sounding (fine ranging). |
| `bondedDevices` | `BondedDevice[]` — `{ name, address, type, bondState }` | Devices already paired with this phone, from `BluetoothAdapter.getBondedDevices`. |
| `error` | `string \| null` | Latest adapter-level failure message. Failures are also logged and counted. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present, `'unavailable'` otherwise. |
| `isScanning` | `boolean` | Whether a discovery scan is running. Cleared when the timeout fires. |
| `peripherals` | `BLEPeripheral[]` — `{ id, name, rssi, estimatedDistanceMeters, lastSeenTimestamp }` | Devices seen in the current scan. `id` is the MAC address, `rssi` is in dBm, distance is estimated in metres. |
| `scanError` | `string \| null` | Why the scan could not start or run, e.g. no native scanner or a permission refusal. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startScan(timeoutMs?)` | `timeoutMs?: number` — how long to scan before stopping automatically, default `10000` | `Promise<boolean>` — `true` when the scan started, `false` with `scanError` set when it did not | Starts `BluetoothLeScanner` discovery and polls results into `peripherals` every 500 ms. |
| `stopScan()` | none | `void` | Stops the scan, clears the timers and takes one final results sync so nothing already discovered is lost. |

---

## `useChannelSounding`

Bluetooth Core 6.0 high-accuracy centimeter-precision Phase-Based Ranging (PBR) and Round-Trip Time (RTT).

Backed by `android.hardware.bluetooth_le.channel_sounding` and the Android 16/17 Ranging HAL service (`IBluetoothChannelSounding`). Measures distance with sub-decimeter accuracy across 79 BLE channels, complementing Ultra-Wideband (UWB) for non-line-of-sight spatial positioning. Nothing is simulated: queries actual device hardware capabilities.

### Signature
```typescript
function useChannelSounding(): ChannelSoundingState;
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the hardware physically supports BLE 6.0 Channel Sounding. |
| `isEnabled` | `boolean` | Whether Channel Sounding is enabled (requires Bluetooth enabled and hardware support). |
| `serviceFound` | `boolean` | Whether the underlying Android Ranging HAL service (`IBluetoothChannelSounding`) is active on device. |
| `supportsPbr` | `boolean` | Whether Phase-Based Ranging (PBR) is supported. |
| `supportsRtt` | `boolean` | Whether Round-Trip Time (RTT) ranging is supported. |
| `channelCount` | `number` | Number of BLE channels utilized (79 on Bluetooth 6.0). |
| `precision` | `'centimeter' \| 'decimeter' \| 'unsupported'` | Distance measurement precision level. |
| `isRanging` | `boolean` | Whether an active ranging session is currently underway. |
| `targets` | `ChannelSoundingTarget[]` | List of tracked ranging targets (`{ address, distanceMeters, azimuthDegrees, elevationDegrees, pbrConfidence, lastUpdateMs }`). |
| `error` | `string \| null` | Latest error message if operation failed. |
| `source` | `TelemetrySource` | `'hardware'` when read from physical device, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startRanging(targetAddress?)` | `targetAddress?: string` — optional BLE MAC address | `Promise<boolean>` — `true` if ranging started successfully | Starts a Channel Sounding ranging session against paired or discovered BLE devices. |
| `stopRanging()` | none | `boolean` — `true` if session stopped | Stops an active ranging session. |
| `refresh()` | none | `ChannelSoundingInfo \| null` | Re-probes hardware channel sounding status. |

### Example
```tsx
import { useChannelSounding, HapticButton } from '@pixelkit-labs/sdk';
import { View, Text } from 'react-native';

export function PrecisionFinder() {
  const cs = useChannelSounding();

  return (
    <View>
      <Text>BLE 6.0 Channel Sounding: {cs.isSupported ? 'Supported' : 'Unsupported'}</Text>
      <Text>Precision: {cs.precision} ({cs.channelCount} channels)</Text>
      <Text>Phase-Based Ranging (PBR): {cs.supportsPbr ? 'Active' : 'No'}</Text>
      {cs.targets.map(t => (
        <Text key={t.address}>Target {t.address}: {t.distanceMeters.toFixed(2)}m (conf: {(t.pbrConfidence * 100).toFixed(0)}%)</Text>
      ))}
      <HapticButton
        title={cs.isRanging ? "Stop Ranging" : "Start Precision Ranging"}
        onPress={() => cs.isRanging ? cs.stopRanging() : cs.startRanging()}
      />
    </View>
  );
}
```

---

## `useNFC`

Real NFC: adapter state, plus NDEF tag reading and writing through reader mode. `startReader` enables `NfcAdapter` reader mode on the foreground Activity; every tag entering the field arrives as an event carrying its identifier, technologies, capacity, writability and decoded NDEF records. `writeText` queues a text record for the next tag presented.

Two platform constraints are surfaced rather than hidden: reader mode needs a foreground Activity, so it stops when the app is backgrounded and must be restarted on resume; and a tag is only readable while it is physically in the field. It subscribes to `onNfcTag` and `onNfcError` on mount and releases reader mode on unmount.

### Signature
```typescript
function useNFC(): {
 isSupported: boolean;
 isEnabled: boolean;
 observeModeSupported: boolean;
 antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE';
 isReading: boolean;
 lastScannedTag: ScannedTag | null;
 tagCount: number;
 pendingWrite: string | null;
 lastWriteOk: boolean | null;
 error: string | null;
 source: TelemetrySource;
 startReader: () => Promise<boolean>;
 stopReader: () => Promise<void>;
 writeText: (text: string) => Promise<boolean>;
 clearTag: () => void;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isSupported` | `boolean` | Whether the device has an NFC radio. |
| `isEnabled` | `boolean` | Whether NFC is switched on in system settings. The reader refuses when it is not. |
| `observeModeSupported` | `boolean` | Whether Android 15 Observe Mode is available on this adapter. |
| `antennaState` | `'ENABLED' \| 'DISABLED' \| 'UNAVAILABLE'` | Antenna state as the adapter reports it. |
| `isReading` | `boolean` | Whether reader mode is running. It stops when the app leaves the foreground. |
| `lastScannedTag` | `ScannedTag \| null` | The last tag read: `id` (hex UID), `payload` (best single string: a URI if present, else the first text record), `tech`, `timestamp`, `techs[]`, `records[]` (`{ tnf, type, payload, bytes, uri }`), `maxSize` (capacity in bytes), `writable`, `ndefType`. `null` before the first tag. |
| `tagCount` | `number` | How many tags have been read since mount. |
| `pendingWrite` | `string \| null` | Text waiting to be written to the next tag presented, or `null` when nothing is queued. |
| `lastWriteOk` | `boolean \| null` | Whether the last queued write succeeded. `null` when none has been attempted. |
| `error` | `string \| null` | Why the last operation failed — refused reader, write failure, or a tag error. |
| `source` | `TelemetrySource` | `'hardware'` when the native module is present, `'unavailable'` otherwise. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startReader()` | none | `Promise<boolean>` — `true` when reader mode started; `false` with a reason in `error` when the build has no reader, the device has no radio, or NFC is off | Enables `NfcAdapter` reader mode on the foreground Activity. Tags then arrive as events. |
| `stopReader()` | none | `Promise<void>` | Disables reader mode, clears any pending write and logs how many tags were read. |
| `writeText(text)` | `text: string` — the text record to write | `Promise<boolean>` — `true` when the write was queued, not when it completed; the outcome arrives later as `lastWriteOk` | Queues an NDEF text record for the next tag presented. Requires the reader to be running. |
| `clearTag()` | none | `void` | Clears `lastScannedTag` and `lastWriteOk`, for a "scan another" control. |

---

## `useRadios`

Unified hardware radio telemetry, queried directly from Android system services (`NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager`, `PackageManager`) and refreshed every 5 s. Use it to decide which radio features to show at all; use the per-radio hooks to drive them. It reads on mount and every 5,000 ms thereafter.

### Signature
```typescript
function useRadios(): {
 nfc: { supported: boolean; enabled: boolean; observeModeSupported: boolean; antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE' };
 bluetooth: { supported: boolean; bleSupported: boolean; enabled: boolean; state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF'; channelSounding: boolean; bondedDevices: BondedDevice[] };
 uwb: { supported: boolean; enabled: boolean; chipId: string | null; rangingApiSupported: boolean };
 wifiRtt: { supported: boolean; available: boolean };
 satellite: { supported: boolean };
 source: TelemetrySource;
 refresh: () => void;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `nfc.supported` / `nfc.enabled` | `boolean` | Whether the radio exists, and whether the user has it switched on. |
| `nfc.observeModeSupported` | `boolean` | Android 15 Observe Mode availability. |
| `nfc.antennaState` | `'ENABLED' \| 'DISABLED' \| 'UNAVAILABLE'` | Antenna state from the adapter. |
| `bluetooth.supported` / `bluetooth.bleSupported` | `boolean` | Classic Bluetooth and Low Energy support, which are separate features. |
| `bluetooth.enabled` / `bluetooth.state` | `boolean` / `'ON' \| 'OFF' \| 'TURNING_ON' \| 'TURNING_OFF'` | Adapter power, including transitional states. |
| `bluetooth.channelSounding` | `boolean` | Whether the silicon supports Channel Sounding fine ranging. |
| `bluetooth.bondedDevices` | `BondedDevice[]` | Paired devices: `{ name, address, type, bondState }`. |
| `uwb.supported` / `uwb.enabled` | `boolean` | Whether the UWB chip exists and is switched on. |
| `uwb.chipId` | `string \| null` | Chip identifier from `UwbManager`, `"default"` on Pixel Pro. `null` when absent. |
| `uwb.rangingApiSupported` | `boolean` | Whether the platform ranging service is present. |
| `wifiRtt.supported` / `wifiRtt.available` | `boolean` | Whether Wi-Fi RTT (802.11mc) exists, and whether it is available right now. |
| `satellite.supported` | `boolean` | Whether the device declares satellite messaging support. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise (all blocks then read their conservative defaults). |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` — the new reading lands in the returned fields | Re-reads every radio immediately instead of waiting for the next 5 s poll. Call it after sending the user to Settings. |

---

## `useLocation`

Position, altitude, heading and speed from the multi-band GNSS receiver (`expo-location`, `Accuracy.Highest`). Coordinates are never written to the log: events record accuracy, whether a fix arrived and how long it took, which is what you need to debug positioning without recording where the user was.

`accuracy` is the radius in metres the platform believes the position lies within. Indoors it can be tens of metres, so it gates whether a coordinate is worth acting on. It requests foreground location permission and takes one fix on mount; there is no continuous watch, so call `refreshLocation()` when you need a newer position.

### Signature
```typescript
function useLocation(): LocationTelemetry & {
 isLocating: boolean;
 hasFix: boolean;
 lastFixAt: number | null;
 error: string | null;
 source: TelemetrySource;
 refreshLocation: () => Promise<boolean>;
};
```

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `latitude` | `number` | Latitude in decimal degrees. `0` until a fix arrives — check `hasFix` before using it. |
| `longitude` | `number` | Longitude in decimal degrees. Same caveat. |
| `altitude` | `number \| null` | Metres above mean sea level from GNSS, not the barometric altitude in `useSensors`. `null` when not reported. |
| `accuracy` | `number \| null` | Horizontal uncertainty radius in metres. Treat a large value as "roughly here", not as a position. |
| `heading` | `number \| null` | Direction of travel in degrees, 0 = north. `null` when stationary or unavailable. |
| `speed` | `number \| null` | Ground speed in metres per second. `null` when unavailable. |
| `hasPermission` | `boolean` | Whether foreground location permission was granted. |
| `isLocating` | `boolean` | `true` while a fix is being acquired, which can take seconds on a cold start. |
| `hasFix` | `boolean` | Whether a position has been obtained this session. This, not `latitude`, is the "do I have a location" flag. |
| `lastFixAt` | `number \| null` | Epoch milliseconds when the last fix arrived, for showing how stale it is. |
| `error` | `string \| null` | Why the last attempt failed, including `'Location permission denied'`. |
| `source` | `TelemetrySource` | `'hardware'` once a fix exists, `'unavailable'` before that. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshLocation()` | none | `Promise<boolean>` — `true` when a fix was obtained, `false` when permission was denied or the fix failed (see `error`) | Requests permission if needed, then takes a fresh `Accuracy.Highest` fix and updates every field above. |

### Example
```tsx
const loc = useLocation();
<Text>{loc.hasFix ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} ±${loc.accuracy ?? '—'} m` : loc.error ?? 'Locating…'}</Text>
<HapticButton title="Refresh fix" onPress={() => loc.refreshLocation()} disabled={loc.isLocating} />
```
