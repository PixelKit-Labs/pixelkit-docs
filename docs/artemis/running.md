# Running ARTEMIS

> **What has to be in place before a run, the commands that start one, and exactly what the PixelKit runner does between your command and the agent.**

## Before a run

1. **A device.** A Pixel connected over USB with USB debugging enabled, or a running emulator. If
   you are not sure the phone is ready, [`pixelkit doctor`](../cli/README.md) checks adb, the
   device and the installed build in one go.
2. **ARTEMIS installed.**

   ```bash
   uv tool install -e /path/to/artemis
   ```

3. **The template on the device.** The recipes drive the template app, so build it onto the phone
   first:

   ```bash
   cd pixelkit-template
   npx expo run:android
   ```

## Starting a run

From the root of `pixelkit-sdk`:

| Command | Runs |
| :--- | :--- |
| `npm run test:e2e` | The silicon recipe on the Flash engine. |
| `npm run test:e2e:flash` | The same, with the engine stated explicitly. |
| `npm run test:e2e:pro` | The silicon recipe on the Pro engine. |
| `node scripts/run-artemis-e2e.js <recipe> [--profile flash\|pro]` | Any recipe, on either engine. `--pro` and `--flash` are shorthands. |

`<recipe>` is one of these names, or a path to any recipe file:

| Name | Recipe |
| :--- | :--- |
| `silicon` | 01 — Silicon telemetry |
| `actuators` | 02 — Actuators and haptics |
| `sensors` | 03 — Sensors and capture |
| `ai` | 04 — On-device AI |
| `full` | 05 — Full sanity suite |
| `hardware`, `pixel11` | 06 — Pixel 11 Pro extensions |
| `nextgen`, `expansion` | 07 — Next-generation hardware |

What each one checks is on the [Recipes](./recipes.md) page.

## What the runner does

[`scripts/run-artemis-e2e.js`](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/scripts/run-artemis-e2e.js)
is deliberately thin:

1. **Resolves the recipe.** An unknown name that is not a readable file exits with code `1` and
   lists the valid names.
2. **Checks for a device** with `adb devices`, and exits with code `1` if none is listed.
3. **Finds ARTEMIS**: `~/.local/bin/artemis` first, then an `artemis/.venv` checked out beside
   `pixelkit-sdk`, then whatever `artemis` is on `PATH`.
4. **Hands over the recipe.** The whole recipe file becomes the task:
   `artemis run "<recipe text>" --profile <engine>`.
5. **Exits with ARTEMIS's exit code**, so a failed verification fails the command.

## What it does not do

- **Watch Logcat itself.** The crash audit is done by the agent, because the recipe tells it to —
  six of the seven recipes end with a Logcat step. Nothing in the runner reads the log.
- **Check the device is usable.** The device check only confirms `adb devices` lists something. A
  phone shown as `unauthorized` or `offline` passes it, and the run then fails inside ARTEMIS.
  `pixelkit doctor` checks the state properly.
- **Choose between devices.** With several connected, the runner passes no serial and ARTEMIS picks
  one. Disconnect the others, or [run it from a coding agent](./mcp.md), where a device can be
  named.
- **Install the template.** A recipe run against an old build of the template tests the old build.
