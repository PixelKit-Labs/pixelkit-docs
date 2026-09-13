# What doctor checks

> **The six checks, the command behind each, and what to do when one fails.**

They run in order, and four of them need the single device the first one selects. If the first
check does not end with exactly one usable device, those four are skipped and reported as `UNKN`.
Every adb call has an eight-second timeout.

## 1. adb and a device

**Runs** `adb version`, then `adb devices`.

| Result | When |
| :--- | :--- |
| `PASS` | Exactly one device is in the `device` state, or the one named by `--serial` is. |
| `FAIL` | adb is not on `PATH`; no device is connected; devices are listed but none is ready — `unauthorized` means accept the USB debugging prompt on the phone, `offline` means reconnect; more than one is ready and no `--serial` was given; or the `--serial` device is not connected. |
| `UNKN` | adb is present but `adb devices` itself failed. |

## 2. Device identity

**Runs** `adb shell getprop` for the manufacturer, model, Android release and SDK level.

| Result | When |
| :--- | :--- |
| `PASS` | The manufacturer is Google. The line gives the model and Android version. |
| `FAIL` | It is not a Pixel. Most hooks are written against Pixel-only APIs and will report `unavailable` on it — this check exists so that is stated plainly rather than inferred from a screen of em dashes. |
| `UNKN` | A property could not be read. |

## 3. The development build

**Runs** `adb shell pm path <package>`, for the id given by `--package`.

| Result | When |
| :--- | :--- |
| `PASS` | The build is installed. |
| `FAIL` | It is not. Build it with `npx expo run:android`, or `eas build --profile development`, and install it. Pass `--package` if your app's id is not `com.pixelkit.sdk`. |

Expo Go can never pass this check, and the line says so either way: the two Kotlin modules have to
be compiled into the app, and Expo Go only contains the native code Expo shipped.

One exception to the never-guess rule lives here. If the `pm path` call itself fails — the device
dropped partway through the run, say — the check reports `FAIL` ("not installed") rather than
`UNKN`. Re-run before reinstalling anything.

## 4. The native packages

**Runs** no adb command. It resolves `@pixelkit-labs/native` and `@pixelkit-labs/mlkit` from the
current directory, following the real `node_modules` chain the way your app would, and reports each
on its own line.

| Package | Resolves | Does not resolve |
| :--- | :--- | :--- |
| `@pixelkit-labs/native` | `PASS` — silicon, display, torch and haptics hooks are available. | `FAIL` — those hooks will report `unavailable`. Install `@pixelkit-labs/sdk`, which depends on it. |
| `@pixelkit-labs/mlkit` | `PASS` — the on-device ML Kit and Gemini Nano hooks are available. | `N/A` — it is opt-in, so this is information, not a failure. Install it to enable those hooks. |

Run `doctor` from your app's root. From anywhere else this check is answering a question about a
different project.

## 5. AICore

**Runs** `adb shell pm list packages`, looking for a package whose name contains `aicore`. Gemini
Nano runs through it.

| Result | When |
| :--- | :--- |
| `PASS` | AICore is installed. |
| `FAIL` | It is not; `useGeminiNano` and the other on-device Gemini hooks will report `unavailable`. AICore arrives through Google Play services on supported Pixels: update Play services and the Play Store, then reboot. |
| `N/A` | The phone is not a Pixel. |
| `UNKN` | The package list could not be read. |

## 6. The Metro port forward

**Runs** `adb reverse --list`, looking for `tcp:8081 tcp:8081`.

| Result | When |
| :--- | :--- |
| `PASS` | The forward is set, so a development build can reach Metro on `localhost:8081`. |
| `FAIL` | It is not. Fix it with `adb -s <serial> reverse tcp:8081 tcp:8081`. |
| `UNKN` | The forward list could not be read. |
