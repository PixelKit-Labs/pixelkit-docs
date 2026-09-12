# useCapabilities

**Source:** [packages/sdk/src/hardware/useCapabilities.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useCapabilities.ts)

The first hook to call: it answers "does this device have that?" so an interface can hide what the phone cannot do instead of showing a control that will fail. Capabilities resolve from the model table, then upgrade to device-verified `PackageManager` feature flags when the PixelNative module is present. Memoised for the app lifetime. It reads `expo-device` and, when available, the native module; the result is computed once and reused.

## Signature
```typescript
function useCapabilities(): DeviceCapabilities;
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string` | Marketing model name, e.g. `"Pixel 11 Pro"`. |
| `isPhysicalDevice` | `boolean` | `false` on an emulator or on web, where hardware claims cannot be trusted. |
| `isPixel` | `boolean` | Whether this is any Google Pixel. |
| `pixelGeneration` | `number \| null` | Generation number, `11` for the Pixel 11 Pro. `null` when unknown. |
| `isProModel` | `boolean` | Pro, Pro XL or Pro Fold — the models with the Pro-exclusive hardware. |
| `isFoldable` | `boolean` | Any foldable Pixel. |
| `androidApiLevel` | `number \| null` | API level: 36 = Android 16, 37 = Android 17. `null` on web. |
| `hasHiLight` | `boolean` | Whether the HiLight LED array exists (Pixel 11 Pro family). |
| `hasUWB` | `boolean` | Whether a UWB radio exists. |
| `hasTitanM3` | `boolean` | Whether the Titan M3 security chip is expected, per Google's specification. It is not readable from the device. |
| `geminiNanoTier` | `GeminiNanoTier` | Which Nano tier AICore is expected to serve. `useGeminiNano().status` remains the runtime truth. |
| `supportsRangingApi` | `boolean` | Android 16+ unified `RangingManager` (UWB, BLE Channel Sounding, Wi-Fi RTT). |
| `supportsHapticEnvelopes` | `boolean` | Android 16+ `VibrationEffect.BasicEnvelopeBuilder`. |
| `supportsAppFunctions` | `boolean` | Android 16+ App Functions, which expose app capabilities to agents. |
| `supportsAndroid17Apis` | `boolean` | Android 17+ `AdvancedProtectionManager`, ML-DSA keys, Handoff, contacts picker. |
| `verification` | `'device' \| 'model-table'` | Whether the flags below were confirmed with `PackageManager.hasSystemFeature`, or inferred from the model name alone. Treat `'model-table'` as a hint. |
| `hasNFC` | `boolean \| null` | Device-verified NFC feature flag. `null` when not verified. |
| `hasBleChannelSounding` | `boolean \| null` | Device-verified BLE Channel Sounding support. |
| `hasWifiRtt` | `boolean \| null` | Device-verified Wi-Fi RTT (802.11mc) support. |
| `hasSatelliteTelephony` | `boolean \| null` | Device-verified satellite messaging support. |
| `hasStrongBox` | `boolean \| null` | Device-verified StrongBox Keymaster, which is what makes `useSecurity` hardware-backed. |
| `hasNpuFeature` | `boolean \| null` | Device-verified `android.hardware.neural_processing_unit` flag. |
| `aicoreVersion` | `string \| null` | AICore version name when installed. |

## Functions
`useCapabilities()` returns no callables; it is a resolved fact set.

## Example
```tsx
const caps = useCapabilities();
if (!caps.hasHiLight) return null; // do not offer the control at all
if (caps.verification === 'device' && caps.hasUWB) enableRanging();
```
