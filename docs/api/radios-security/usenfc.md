# useNFC

**Source:** [packages/sdk/src/hardware/useNFC.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useNFC.ts)

Real NFC: adapter state, plus NDEF tag reading and writing through reader mode. `startReader` enables `NfcAdapter` reader mode on the foreground Activity; every tag entering the field arrives as an event carrying its identifier, technologies, capacity, writability and decoded NDEF records. `writeText` queues a text record for the next tag presented.

Two platform constraints are surfaced rather than hidden: reader mode needs a foreground Activity, so it stops when the app is backgrounded and must be restarted on resume; and a tag is only readable while it is physically in the field. It subscribes to `onNfcTag` and `onNfcError` on mount and releases reader mode on unmount.

## Signature
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

## Outputs
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

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `startReader()` | none | `Promise<boolean>` — `true` when reader mode started; `false` with a reason in `error` when the build has no reader, the device has no radio, or NFC is off | Enables `NfcAdapter` reader mode on the foreground Activity. Tags then arrive as events. |
| `stopReader()` | none | `Promise<void>` | Disables reader mode, clears any pending write and logs how many tags were read. |
| `writeText(text)` | `text: string` — the text record to write | `Promise<boolean>` — `true` when the write was queued, not when it completed; the outcome arrives later as `lastWriteOk` | Queues an NDEF text record for the next tag presented. Requires the reader to be running. |
| `clearTag()` | none | `void` | Clears `lastScannedTag` and `lastWriteOk`, for a "scan another" control. |
