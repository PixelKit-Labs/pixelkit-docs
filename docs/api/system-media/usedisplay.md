# useDisplay

**Source:** [packages/sdk/src/hardware/useDisplay.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useDisplay.ts)

Display telemetry and control: the live refresh-rate mode, adaptive refresh rate (ARR) support, HDR capabilities and resolution from Android `Display`, plus brightness (`expo-brightness`) and the screen wake lock (`expo-keep-awake`). Refresh rate is re-read every 2 s because ARR changes it while you watch. It reads brightness once on mount and display information every 2,000 ms.

## Signature
```typescript
function useDisplay(): {
 isKeepAwake: boolean;
 brightness: number;
 refreshRateHz: number;
 hasArrSupport: boolean | null;
 supportedRefreshRates: number[];
 resolution: { width: number; height: number; densityDpi: number } | null;
 hdrTypes: number[];
 isHdr: boolean;
 maxLuminance: number | null;
 source: TelemetrySource;
 toggleKeepAwake: () => Promise<void>;
 setScreenBrightness: (value: number) => Promise<void>;
 setPreferredRefreshRate: (rateHz: number) => Promise<boolean>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isKeepAwake` | `boolean` | Whether this hook currently holds the wake lock. |
| `brightness` | `number` | Screen brightness 0–1, two decimals. `0` until read or when the permission has not been granted. |
| `refreshRateHz` | `number` | Refresh rate of the active mode, rounded. Changes live with ARR. `0` before the first read. |
| `hasArrSupport` | `boolean \| null` | Android 16+ adaptive refresh rate support. `null` when unknown. |
| `supportedRefreshRates` | `number[]` | Every rate the panel can drive, e.g. `[120, 60, 40, 30, 24, 20, 15, 10, 5, 2, 1]`. Empty before the read. |
| `resolution` | `{ width, height, densityDpi } \| null` | Physical resolution of the active mode and its density. `null` before the read. |
| `hdrTypes` | `number[]` | HDR types the panel reports: 1 Dolby Vision, 2 HDR10, 3 HLG, 4 HDR10+. |
| `isHdr` | `boolean` | Whether the display is in an HDR mode. |
| `maxLuminance` | `number \| null` | Peak luminance the platform reports, in nits. `null` when not reported — do not substitute a spec-sheet figure. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `toggleKeepAwake()` | none | `Promise<void>` — the new state lands in `isKeepAwake` | Acquires or releases a tagged screen wake lock, so the display does not dim during a long read or a capture. |
| `setScreenBrightness(value)` | `value: number` — 0 to 1, clamped | `Promise<void>` | Sets app-window brightness. No-op on web. Failures are logged and leave `brightness` unchanged. |
| `setPreferredRefreshRate(rateHz)` | `rateHz: number` — the rate to request for this window, e.g. 120 during an animation and 60 otherwise | `Promise<boolean>` — `true` when the request was applied | A request, not a guarantee: the system may pick a different mode. |
