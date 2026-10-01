# useMediaLibrary

**Source:** [packages/sdk/src/hardware/useMediaLibrary.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useMediaLibrary.ts)

Saving captures to the device gallery and reading them back, on `expo-media-library`. Without this, a photo from `useCamera().takePicture()` or a clip from `startRecording()` lives in the app cache and disappears when the system reclaims it. `save()` promotes a capture into the user's media store, where it survives and is visible to every other app.

SDK 57 uses the class API (`Asset.create`, `Album.create`, `Query`); deprecated `saveToLibraryAsync` and `createAssetAsync` throw at runtime. Read and write permissions are independent: `permissionGranted` and `hasLimitedAccess` describe browsing, while `save()` checks or requests **write-only** permission and does not require browsing access unless a named album is selected. Native permission and asset operations are traced, with failures reported in `error`.

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
| `permissionGranted` | `boolean` | Whether browsing the library is permitted; saving has a separate write grant. |
| `hasLimitedAccess` | `boolean` | Android 13+: `true` when the user shared only selected items, so the library you can see is a subset. |
| `isSaving` | `boolean` | `true` while a save is in flight. |
| `isLoading` | `boolean` | `true` while the recent list is being read. |
| `recent` | `SavedMedia[]` | Newest items from the last `loadRecent()` call, newest first. |
| `lastSaved` | `SavedMedia \| null` | The item most recently written by this app. `null` until one is saved. |
| `error` | `string \| null` | Why the last permission request, save, read or delete failed. |
| `source` | `TelemetrySource` | `'hardware'` when read or write access is granted, `'unavailable'` otherwise. |

`SavedMedia` is `{ id, uri, filename, width, height, durationSeconds: number \| null, creationTime: number \| null }`; `durationSeconds` is `null` for stills.

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `requestPermission(writeOnly?)` | `writeOnly?: boolean` — ask only for write access, default `false`. | `Promise<boolean>` — whether the requested access was granted | A write-only grant does **not** set `permissionGranted` or imply browsing rights. |
| `save(localUri, albumName?)` | `localUri: string` — a local `file://` URI. `albumName?: string` — a named album (requires read access). | `Promise<SavedMedia \| null>` — saved item, or `null` with `error` on grant/write failure | Automatically requests write-only access for unnamed saves. If the file was saved but creating its new album failed, returns the saved item and sets `error`. |
| `loadRecent(limit?)` | `limit?: number` — how many items to read, default `20` | `Promise<SavedMedia[]>` — newest first; `[]` when permission was denied | Reads the newest items and writes them to `recent`. |
| `remove(media)` | `media: SavedMedia` — an item from `recent` or `lastSaved` | `Promise<boolean>` — `true` when the item was deleted | Deletes an asset from the device. The system may show its own confirmation. |
