# Getting started

> **Installing PixelKit, and the three constraints that catch people out.**

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

The separate [Laya decision SDK](../guides/laya.md) is being prepared for local typed decisions on
the Pixel. Its source is public; npm release and real-checkpoint device verification are pending.

## Before you start

**You need a development build.** `npx expo run:android`, or an EAS development profile. PixelKit
cannot run in Expo Go: reading a thermal sensor takes native code compiled into the app, and Expo Go
only contains the native code Expo shipped.

**Android only.** Both Kotlin modules declare `platforms: ["android"]`.

**It degrades rather than fails on other hardware.** 15 of the 53 hooks are pure Expo and
JavaScript — camera, audio, sensors, location, biometrics, the keystore, cloud Gemini, cloud hardware agent, Gemini Live duplex — and work on
any Android device. Another 37 call the Kotlin modules and report `unsupported` where the silicon is
not there. The last one is `useHiLight`: Android restricts the camera-bar LEDs to privileged apps,
so it drives them through a local ADB daemon and reports `unavailable` without one.

If readings come back empty and you are not sure why, [`npx @pixelkit-labs/cli doctor`](../cli/README.md) checks adb,
the device, the development build, the installed packages and AICore, and tells you which case you
are in.
