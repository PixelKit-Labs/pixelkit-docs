# useMicrophoneArray

Queries Android `AudioManager.getMicrophones()` through the native module and returns, for each microphone, its id, description, type, directionality (omnidirectional, bidirectional, cardioid, hypercardioid, supercardioid), location, group and the position and orientation the platform reports, null when it reports none. The hook does not steer or focus the array: `MediaRecorder` and `AudioRecord` accept a preferred microphone direction per recorder instance, and this hook owns no recorder, so it exposes no direction or zoom control.

## Signature
```typescript
useMicrophoneArray(): MicrophoneArrayTelemetry
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `microphones` | `MicrophoneInfo[]` | Microphones the platform lists, with position and orientation (null when the platform reports none) and directionality. |
| `isSupported` | `boolean` | Whether the platform can list microphones (Android 9+). |
| `error` | `string \| null` | Error message if the microphone query failed. |
| `source` | `TelemetrySource` | Data provenance: `'hardware'` or `'unavailable'`. |
| `refresh` | `() => void` | Re-queries the platform microphone list. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refresh()` | none | `void` | Re-queries the platform microphone list. |

## Example
```tsx
import { useMicrophoneArray } from '@pixelkit-labs/sdk';

function MicList() {
  const { microphones, isSupported } = useMicrophoneArray();
  if (!isSupported) return <Text>Microphone list unavailable</Text>;
  return (
    <View>
      {microphones.map((m) => (
        <Text key={m.id}>{m.description} · {m.directionality} · {m.location}</Text>
      ))}
    </View>
  );
}
```

:::note
Requires Android 9+ (API 28+). The hook only lists microphones; it cannot steer or focus them, so do not present a beam or zoom control.
:::
