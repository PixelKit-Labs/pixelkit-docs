# useSpatialAudio

**Source:** [packages/sdk/src/hardware/useSpatialAudio.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useSpatialAudio.ts)

Queries Android's Spatializer audio subsystem and dynamic head tracking sensors (API 32+). Detects whether spatial audio processing is active for the current audio routing path, whether binaural / transaural spatialization is enabled, and whether dynamic head tracking sensors (such as Pixel Buds Pro) are actively tracking.

Verified on Pixel 11 Pro (`grizzly`): `dumpsys audio` confirms `mHasSpatializerEffect: true`, `mIsHeadTrackingSupported: true`, and `supports binaural: true / transaural: true`. Nothing is simulated: reads directly from the audio HAL and reports `source: 'hardware'` on genuine hardware.

## Signature
```typescript
function useSpatialAudio(): {
  isSupported: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  hasHeadTracker: boolean;
  headTrackingMode: HeadTrackingMode;
  immersiveAudioLevel: number;
  hasDynamicHeadTrackerFeature: boolean;
  error: string | null;
  source: TelemetrySource;
  refresh: () => SpatialAudioInfo | null;
};
```

## Outputs
| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `isSupported` | `boolean` | flag | `true` if device platform supports the Android Spatializer API (API 32+). |
| `isAvailable` | `boolean` | flag | `true` if spatial audio processing is available for the current audio routing path (e.g. A2DP headphones vs earpiece). |
| `isEnabled` | `boolean` | flag | `true` if spatial audio is enabled in user system sound settings. |
| `hasHeadTracker` | `boolean` | flag | `true` if a dynamic head tracker sensor (e.g. Pixel Buds Pro) is currently paired and reporting orientation. |
| `headTrackingMode` | `HeadTrackingMode` | enum | `'unsupported'`, `'disabled'`, `'relative_world'`, or `'relative_device'`. |
| `immersiveAudioLevel` | `number` | int | Level of immersive spatialization applied by audio DSP (0: none, 1: multichannel, 2: other). |
| `hasDynamicHeadTrackerFeature` | `boolean` | flag | `true` if device declares `feature:android.hardware.sensor.dynamic.head_tracker`. |
| `error` | `string \| null` | text | Latest error message if the Spatializer query failed, or `null`. |
| `source` | `TelemetrySource` | enum | `'hardware'` when read from genuine device HAL, `'unavailable'` on older OS or emulators. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `SpatialAudioInfo \| null` | Manually re-reads spatial audio status from the system AudioManager. |

## Example
```tsx
import { View, Text, Button } from 'react-native';
import { useSpatialAudio } from '@pixelkit-labs/sdk';

export function SpatialAudioCard() {
  const { isAvailable, isEnabled, hasHeadTracker, headTrackingMode, refresh } = useSpatialAudio();

  return (
    <View>
      <Text>Spatializer: {isAvailable ? 'Available' : 'Unavailable'}</Text>
      <Text>Spatial Audio: {isEnabled ? 'Enabled' : 'Disabled'}</Text>
      <Text>Head Tracker: {hasHeadTracker ? `Active (${headTrackingMode})` : 'None connected'}</Text>
      <Button title="Refresh Audio Status" onPress={() => refresh()} />
    </View>
  );
}
```
