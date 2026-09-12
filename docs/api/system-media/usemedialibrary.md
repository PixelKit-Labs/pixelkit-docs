# useMediaLibrary

**Source:** [packages/sdk/src/hardware/useMediaLibrary.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useMediaLibrary.ts)

Saving captures to the device gallery and reading them back, on `expo-media-library`. Without this, a photo from `useCamera().takePicture()` or a clip from `startRecording()` lives in the app cache and disappears when the system reclaims it. `save()` promotes a capture into the user's media store, where it survives and is visible to every other app.

SDK 57 uses the class API (`Asset.create`, `Album.create`, `Query`) rather than the deprecated `createAssetAsync` helpers, which now throw at runtime. Android 13+ grants read access per media type, and the user may share only selected items, so a granted permission does not mean access to everything. It checks existing permission on mount without prompting; `save()` and `loadRecent()` prompt if needed.

## Signature
```typescript
function useMediaLibrary(): {
 permissionGranted: boolean;
 hasLimitedAccess: boolean;
 isSaving: boolean;
 isLoading: boolean;
 recent: SavedMedia[];
 lastSaved: SavedMedia | null;
 error: string | null;
 source: TelemetrySource;
 requestPermission: (writeOnly?: boolean) => Promise<boolean>;
 save: (localUri: string, albumName?: string) => Promise<SavedMedia | null>;
 loadRecent: (limit?: number) => Promise<SavedMedia[]>;
 remove: (media: SavedMedia) => Promise<boolean>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `permissionGranted` | `boolean` | Whether library access has been granted. |
| `hasLimitedAccess` | `boolean` | Android 13+: `true` when the user shared only selected items, so the library you can see is a subset. |
| `isSaving` | `boolean` | `true` while a save is in flight. |
| `isLoading` | `boolean` | `true` while the recent list is being read. |
| `recent` | `SavedMedia[]` | Newest items from the last `loadRecent()` call, newest first. |
| `lastSaved` | `SavedMedia \| null` | The item most recently written by this app. `null` until one is saved. |
| `error` | `string \| null` | Why the last permission request, save, read or delete failed. |
| `source` | `TelemetrySource` | `'hardware'` once permission is granted, `'unavailable'` otherwise. |

`SavedMedia` is `{ id, uri, filename, width, height, durationSeconds: number \| null, creationTime: number \| null }`; `durationSeconds` is `null` for stills.

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestPermission(writeOnly?)` | `writeOnly?: boolean` — ask only for write access, default `false`. Pass `true` when the app saves but never browses. | `Promise<boolean>` — whether access was granted | Prompts for library access and updates `permissionGranted` and `hasLimitedAccess`. |
| `save(localUri, albumName?)` | `localUri: string` — the file `useCamera` or `useAudio` returned. `albumName?: string` — album to file it under; it is created if it does not exist. | `Promise<SavedMedia \| null>` — the saved item, or `null` when permission was denied or the write failed | Copies a local file into the user's media store. |
| `loadRecent(limit?)` | `limit?: number` — how many items to read, default `20` | `Promise<SavedMedia[]>` — newest first; `[]` when permission was denied | Reads the newest items and writes them to `recent`. |
| `remove(media)` | `media: SavedMedia` — an item from `recent` or `lastSaved` | `Promise<boolean>` — `true` when the item was deleted | Deletes an asset from the device. The system may show its own confirmation. |
