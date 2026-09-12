# useLocation

**Source:** [packages/sdk/src/hardware/useLocation.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useLocation.ts)

Position, altitude, heading and speed from the multi-band GNSS receiver (`expo-location`, `Accuracy.Highest`). Coordinates are never written to the log: events record accuracy, whether a fix arrived and how long it took, which is what you need to debug positioning without recording where the user was.

`accuracy` is the radius in metres the platform believes the position lies within. Indoors it can be tens of metres, so it gates whether a coordinate is worth acting on. It requests foreground location permission and takes one fix on mount; there is no continuous watch, so call `refreshLocation()` when you need a newer position.

## Signature
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

## Outputs
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

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshLocation()` | none | `Promise<boolean>` — `true` when a fix was obtained, `false` when permission was denied or the fix failed (see `error`) | Requests permission if needed, then takes a fresh `Accuracy.Highest` fix and updates every field above. |

## Example
```tsx
const loc = useLocation();
<Text>{loc.hasFix ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} ±${loc.accuracy ?? '—'} m` : loc.error ?? 'Locating…'}</Text>
<HapticButton title="Refresh fix" onPress={() => loc.refreshLocation()} disabled={loc.isLocating} />
```
