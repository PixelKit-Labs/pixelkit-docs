# useMicrophoneArray

Directly queries the Android AudioManager for connected hardware microphones and their geometric coordinates, group mappings, and directivity patterns (omnidirectional, cardioid, hypercardioid). On supported Pixel devices, provides controls to steer acoustic beamforming (towards user, away from user, external) and adjust acoustic zoom field dimension.

## Signature
```typescript
useMicrophoneArray(): MicrophoneArrayTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `microphones` | `MicrophoneInfo[]` | Array of physical microphones detected on the device chassis with 3D positions and polar patterns. |
| `direction` | `'user' \| 'away' \| 'external' \| 'omni'` | Current beam direction configured for the microphone array. |
| `fieldZoom` | `number` | Acoustic field zoom dimension ratio from 0.0 (wide) to 1.0 (narrow focus). |
| `isSupported` | `boolean` | Whether the hardware and platform support acoustic array inspection and beamforming. |
| `error` | `string \| null` | Error message if microphone array query or direction setting failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' or 'unavailable'. |
| `setDirection` | `(direction: 'user' \| 'away' \| 'external' \| 'omni') => Promise<boolean>` | Steers acoustic beamforming towards the user, away, external, or omnidirectional. |
| `setFieldZoom` | `(zoom: number) => Promise<boolean>` | Adjusts acoustic zoom field dimension (0.0 to 1.0). |
| `refresh` | `() => void` | Re-queries the hardware microphone array. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `setDirection(direction)` | none | `void` | Directs acoustic beamforming towards 'user', 'away', 'external', or 'omni'. |
| `setFieldZoom(zoom)` | none | `void` | Sets the acoustic zoom field dimension (0.0 to 1.0). |
| `refresh()` | none | `void` | Re-queries hardware microphone state. |

## Example
```tsx
import { useMicrophoneArray } from '@pixelkit-labs/sdk';

function MicDirectivity() {
  const { microphones, direction, setDirection } = useMicrophoneArray();
  return (
    <View>
      <Text>Mics: {microphones.length} · Beam: {direction}</Text>
      <Button title="Focus User" onPress={() => setDirection('user')} />
    </View>
  );
}
```

:::note
Requires Android 9+ (API 28+) for microphone querying and Android 11+ (API 30+) for direction steering.
:::
