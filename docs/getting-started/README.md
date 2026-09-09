# Getting started

```bash
npx expo install @pixelkit-labs/sdk @pixelkit-labs/native
```

On-device ML — Gemini Nano, vision, translation — is a separate install, because it adds 19 ML Kit
artifacts to your APK:

```bash
npx expo install @pixelkit-labs/mlkit
```

| Page | What it covers |
| :--- | :--- |
| [Quickstart](./quickstart.md) | Install, development build, first hook on a real device |
| [Architecture](./architecture.md) | How the hooks reach the silicon: the native bridge and the HAL layer |

## Before you start

**You need a development build.** `npx expo run:android`, or an EAS development profile. PixelKit
cannot run in Expo Go: reading a thermal sensor takes native code compiled into the app, and Expo Go
only contains the native code Expo shipped.

**Android only.** Both Kotlin modules declare `platforms: ["android"]`.

**It degrades rather than fails on other hardware.** 13 of the 39 hooks are pure Expo and
JavaScript — camera, audio, sensors, location, biometrics, the keystore, cloud Gemini — and work on
any Android device. The other 26 report `unsupported` where the silicon is not there.

If readings come back empty and you are not sure why, `npx @pixelkit-labs/cli doctor` checks adb,
the device, the development build, the installed packages and AICore, and tells you which case you
are in.
