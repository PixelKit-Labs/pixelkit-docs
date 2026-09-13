# Logs

> **Every lifecycle moment and every failure, kept in memory and echoed to the device log under a prefix you can filter on.**

## Recording

| Call | What it does |
| :--- | :--- |
| `logEvent(module, event, data?, level?)` | Records an event at `info` (the default), `warn` or `error`, stamps it with the current trace id if one is active, and prints it to the console as `[PixelKit] <module> <traceId>: <event> <data>`. |
| `logError(module, event, error, data?)` | Normalises whatever was thrown, adds one to that module's error count, and logs it at `error` with the message and any native error code. Returns the normalised error, so a hook can put it straight into its `error` state. |
| `noteExpected(module, reason)` | For a failure that is expected and harmless, such as calling a native object that was released during teardown. It is counted, so it stays visible, but it is not logged and not counted as an error, because a teardown path would otherwise flood the log. |

`traced` and `tracedSafe` log for you: `info` when a call succeeds, `warn` when it took longer than
1,500 ms, and `error` when it fails. See [Traces](./traces.md).

## Reading

- **Inside the app:** `getRecentEvents()`, or `events` from `useObservability()`.
- **On the device log:**

  ```bash
  adb logcat -s ReactNativeJS | grep PixelKit
  ```

  The prefix is stable, so this is a usable transcript of a session with no extra tooling.

## The rule behind it

A caught error is never discarded silently. A hook that continues after a failure still says so,
by one of three routes: `logError`, `tracedSafe`, or `noteExpected`. An empty `catch` is not one of
them.

## Limits

- **400 events.** A ring buffer: past that, the oldest go first.
- **Memory only.** Cleared by `resetObservability()` or an app restart; nothing is written to disk
  or sent anywhere.
- **No level threshold.** Every `info` event reaches the console.
- **JavaScript only.** The Kotlin modules do not write here. A native failure appears when the
  JavaScript call wrapping it fails, and not before.

These are listed with what closing them takes on the [Observability overview](./README.md#where-the-stack-stops).
