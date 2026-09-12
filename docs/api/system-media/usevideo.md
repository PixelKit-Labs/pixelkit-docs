# useVideo

**Source:** [packages/sdk/src/hardware/useVideo.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useVideo.ts)

Video playback on `expo-video`, the SDK 57 replacement for the removed `expo-av`. Pairs with `useCamera().startRecording()`: record a clip, then hand `lastVideoUri` to `load()`. The hook owns the player; a screen renders `<VideoView player={player} />`. Position and duration are polled four times a second, which is enough for a scrubber without waking the JS thread every frame.

## Signature
```typescript
function useVideo(initialSource?: VideoSource): {
 player: VideoPlayer;
 hasSource: boolean; isPlaying: boolean;
 positionSeconds: number; durationSeconds: number; bufferedSeconds: number;
 status: string; isMuted: boolean; isLooping: boolean; playbackRate: number; volume: number;
 error: string | null; source: TelemetrySource;
 load: (next: VideoSource, options?: { autoplay?: boolean; loop?: boolean; muted?: boolean }) => Promise<boolean>;
 play: () => void; pause: () => void; togglePlay: () => void;
 seekTo: (seconds: number) => void; seekBy: (seconds: number) => void; replay: () => void;
 setMuted: (muted: boolean) => void; setLoop: (loop: boolean) => void;
 setPlaybackRate: (rate: number) => void; setVolume: (value: number) => void;
 setKeepScreenOn: (keep: boolean) => void;
 generateThumbnails: (times: number | number[]) => Promise<VideoThumbnail[]>;
};
```

## Inputs
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialSource` | `VideoSource` | `null` | Source to create the player with: a file URI, a remote URL, a require'd asset, or `null` to start empty and call `load()` later. It also seeds `hasSource`. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `player` | `VideoPlayer` | Pass to `<VideoView player={player} />`. The hook owns its lifecycle. |
| `hasSource` | `boolean` | Whether a source has been loaded. |
| `isPlaying` | `boolean` | Whether playback is running, polled from the player. |
| `positionSeconds` | `number` | Seconds into the clip, two decimals. |
| `durationSeconds` | `number` | Total length in seconds. `0` until the source reports it. |
| `bufferedSeconds` | `number` | How far ahead the player has buffered — useful for a remote source. |
| `status` | `string` | Player status, e.g. `idle`, `loading`, `readyToPlay`, `error`. |
| `isMuted` / `isLooping` | `boolean` | Current mute and loop settings. |
| `playbackRate` | `number` | Speed multiplier; `1` is normal. Pitch is preserved by the player. |
| `volume` | `number` | Player volume 0–1. |
| `error` | `string \| null` | Why the last load, seek or playback call failed. |
| `source` | `TelemetrySource` | `'hardware'` once a source is loaded, `'unavailable'` before that. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `load(next, options?)` | `next: VideoSource` — file URI, remote URL, asset or `null`. `options.autoplay?: boolean` — start playing as soon as it is ready. `options.loop?: boolean` — restart at the end. `options.muted?: boolean` — start muted. | `Promise<boolean>` — `true` when the source was replaced, `false` with `error` set on failure | Swaps the source, for example the clip `useCamera` just recorded. |
| `play()` / `pause()` / `togglePlay()` | none | `void` | Transport controls. |
| `seekTo(seconds)` | `seconds: number` — absolute position, clamped to `0..duration` | `void` | Jumps to a position. |
| `seekBy(seconds)` | `seconds: number` — relative offset; negative rewinds | `void` | Moves relative to the current position. |
| `replay()` | none | `void` | Restarts from the beginning and plays. |
| `setMuted(muted)` | `muted: boolean` | `void` | Mutes or unmutes without changing `volume`. |
| `setLoop(loop)` | `loop: boolean` | `void` | Turns looping on or off. |
| `setPlaybackRate(rate)` | `rate: number` — clamped to 0.25–4; `1` is normal | `void` | Changes speed with pitch preserved. |
| `setVolume(value)` | `value: number` — 0 to 1, clamped | `void` | Sets player volume. |
| `setKeepScreenOn(keep)` | `keep: boolean` | `void` | Keeps the screen awake while a video plays, so it does not dim mid-clip. |
| `generateThumbnails(times)` | `times: number \| number[]` — position(s) in seconds to extract | `Promise<VideoThumbnail[]>` — the frames as images; `[]` on failure with `error` set | Extracts frames for a filmstrip or a poster image. |
