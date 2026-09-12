# useCameraExtensions

**Source:** [packages/sdk/src/hardware/useCameraExtensions.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useCameraExtensions.ts)

Queries vendor computational photography extensions directly from the Android `Camera2` HAL using `CameraExtensionCharacteristics` (Android 12 / API 31+). Pixel devices implement proprietary computational image pipelines in their camera HAL and Tensor ISP. This hook queries real hardware support for:
- **Night Sight** (`EXTENSION_NIGHT`): Multi-frame low-light alignment and noise reduction.
- **Ultra HDR / HDR+** (`EXTENSION_HDR`): Exposure stacking and wide dynamic range gainmap encoding.
- **Portrait Bokeh** (`EXTENSION_BOKEH`): Depth map segmentation and synthetic aperture blur.
- **Face Retouch** (`EXTENSION_FACE_RETOUCH`): Skin tone rendering and facial detail preservation.
- **Automatic Extension** (`EXTENSION_AUTOMATIC`): Scene-aware computational photography triggering.

Nothing is simulated: on genuine Pixel hardware, this queries each camera sensor (`back`, `front`, `external`) and returns `source: 'hardware'`.

## Signature
```typescript
function useCameraExtensions(): {
  available: boolean;
  cameras: CameraExtensionInfo[];
  hasNightSight: boolean;
  hasUltraHdr: boolean;
  hasPortraitBokeh: boolean;
  error: string | null;
  source: TelemetrySource;
  refresh: () => CameraExtensionsResult | null;
};
```

## Outputs
| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `available` | `boolean` | flag | `true` if `CameraExtensionCharacteristics` is supported and accessible via `PixelNative`. |
| `cameras` | `CameraExtensionInfo[]` | array | List of detected camera sensors with their lens facing and supported extension flags (`night`, `hdr`, `bokeh`, `faceRetouch`, `auto`). |
| `hasNightSight` | `boolean` | flag | `true` if at least one camera sensor on the device supports Google Night Sight low-light processing. |
| `hasUltraHdr` | `boolean` | flag | `true` if at least one camera sensor supports Ultra HDR multi-frame exposure stacking. |
| `hasPortraitBokeh` | `boolean` | flag | `true` if at least one camera sensor supports hardware-assisted depth segmentation and bokeh blur. |
| `error` | `string \| null` | text | Error message if the Camera2 HAL query failed, or `null` on success. |
| `source` | `TelemetrySource` | enum | `'hardware'` when read from genuine device HAL, `'unavailable'` if native module is absent or unsupported. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `CameraExtensionsResult \| null` | Manually re-queries camera HAL extension characteristics. |

## Example
```tsx
import { View, Text } from 'react-native';
import { useCameraExtensions } from '@pixelkit-labs/sdk';

export function CameraCapabilities() {
  const { available, hasNightSight, hasUltraHdr, hasPortraitBokeh, cameras } = useCameraExtensions();

  if (!available) {
    return <Text>Vendor extensions unavailable on this device</Text>;
  }

  return (
    <View>
      <Text>Night Sight: {hasNightSight ? 'Supported' : 'Not supported'}</Text>
      <Text>Ultra HDR: {hasUltraHdr ? 'Supported' : 'Not supported'}</Text>
      <Text>Portrait Bokeh: {hasPortraitBokeh ? 'Supported' : 'Not supported'}</Text>
      {cameras.map((cam) => (
        <Text key={cam.cameraId}>
          Camera {cam.cameraId} ({cam.facing}): Night={cam.supportedExtensions.night ? 'yes' : 'no'}
        </Text>
      ))}
    </View>
  );
}
```
