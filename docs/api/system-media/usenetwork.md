# useNetwork

**Source:** [packages/sdk/src/hardware/useNetwork.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useNetwork.ts)

Connectivity, address and metering from `expo-network`. Being attached to Wi-Fi is not the same as having internet, so `isConnected` requires both a connection and a reachable route. Nothing is assumed before the first read: the type is `UNKNOWN` and `isConnected` is `false` until the platform answers.

For what kind of cellular connection this is, and which carrier, see [`useCellular`](../system-media/usecellular.md). It reads once on mount; each sub-read (address, state, airplane mode) fails independently so one missing value does not blank the rest.

## Signature
```typescript
function useNetwork(): NetworkTelemetry & {
 hasRead: boolean;
 isChecking: boolean;
 error: string | null;
 source: TelemetrySource;
 refreshNetwork: () => Promise<void>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `ipAddress` | `string \| null` | Address on the current interface. `null` when it could not be read. |
| `networkType` | `string` | `'WIFI'`, `'CELLULAR'`, `'NONE'` or `'UNKNOWN'`. `'UNKNOWN'` before the first read. |
| `isConnected` | `boolean` | Whether a usable internet route exists, not merely an attached interface. |
| `isMetered` | `boolean` | `true` on cellular, where the user pays per byte. Gate large downloads on it. |
| `isAirplaneMode` | `boolean` | Whether airplane mode is on. |
| `hasRead` | `boolean` | Whether a read has completed. Before it, the values above are defaults. |
| `isChecking` | `boolean` | `true` while a check is running. |
| `error` | `string \| null` | Why the last read failed. |
| `source` | `TelemetrySource` | `'hardware'` once a read has completed, `'unavailable'` before that. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `refreshNetwork()` | none | `Promise<void>` — the new state lands in the returned fields | Re-runs the connectivity check. Call it after the app returns to the foreground. |
