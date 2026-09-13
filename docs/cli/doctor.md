# pixelkit doctor

> **Usage, options, output and exit codes for the CLI's one command.**

```
pixelkit doctor [--package <id>] [--serial <serial>]
```

| Option | Default | Meaning |
| :--- | :--- | :--- |
| `--package <id>` | `com.pixelkit.sdk` | Application id of your installed development build. The default is the template's own id, so a build of the unmodified template needs no flag. Also accepted as `--package=<id>`. |
| `--serial <id>` | — | The adb serial to target when more than one device is connected. Also accepted as `--serial=<id>`. |
| `-h`, `--help` | — | Print usage and exit. |

## Reading the output

Each check prints one line with one of four results:

| Result | Means |
| :--- | :--- |
| `PASS` | Checked, and fine. |
| `FAIL` | Checked, and wrong. A `fix:` line follows with what to run. |
| `N/A` | Does not apply — AICore on a phone that is not a Pixel, or the opt-in ML Kit package not installed. |
| `UNKN` | Could not be determined, because the check itself could not run. |

`UNKN` is deliberate. When a check cannot run — adb is missing, the device went offline, a command
timed out — `doctor` says so instead of guessing, the same discipline as a hook reporting
`unavailable` rather than inventing a reading.

Run with no phone connected, from a project with both native packages installed (paths shortened):

```
PixelKit doctor

[FAIL] adb device - no device connected.
         fix: Connect the Pixel over USB (accept the RSA prompt) or `adb connect <ip>:<port>` for wireless adb, then re-run.
[UNKN] Device identity - skipped: no single adb device selected (see "adb device" above).
[UNKN] PixelKit development build - skipped: no single adb device selected.
[PASS] @pixelkit-labs/native resolvable - resolved from …/@pixelkit-labs/native/build/index.js. Silicon (SoC, CPU, memory, thermal, GPU), display, torch and haptics hooks are available.
[PASS] @pixelkit-labs/mlkit resolvable - resolved from …/@pixelkit-labs/mlkit/build/index.js. Gemini Nano / on-device ML Kit hooks are available.
[UNKN] AICore - skipped: no single adb device selected.
[UNKN] adb reverse tcp:8081 - skipped: no single adb device selected.

2 passed, 1 failed, 4 could not be determined, 0 not applicable.
```

Four checks need a device, so without one they are skipped and reported as `UNKN` rather than
passed. What each check does is on [What doctor checks](./checks.md).

## Exit codes

| Code | When |
| :--- | :--- |
| `0` | Every check passed or did not apply. Also for `--help`. |
| `1` | Any check failed or could not be determined. Also when no command is given, or an unknown one. |

A check that could not run counts against the result. An inconclusive run is not a clean one.

## In a script

Because the exit code is honest, `doctor` works as a gate before anything that needs a working
phone — for example before a hardware verification run:

```bash
npx @pixelkit-labs/cli doctor && npm run test:e2e
```

That is stricter than the ARTEMIS runner's own device check, which accepts a phone listed as
`unauthorized` or `offline`. `doctor` fails on both.
