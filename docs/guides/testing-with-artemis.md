# Autonomous E2E Hardware Testing with ARTEMIS

> **Automated end-to-end verification of real silicon telemetry, physical actuators, sensors, and on-device AI using Google's ARTEMIS agent framework on Google Pixel devices.**

---

## The Hardware Verification Contract

PixelKit guarantees **hardware provenance**:
```typescript
// Every hook explicitly declares its hardware origin:
const cpu = useCPU();
// cpu.source is 'hardware' on physical Pixel hardware, never simulated
```

PixelKit strictly enforces two rules that fail builds and pull requests:
1. **Nothing is simulated**: Fabricated readings are unrepresentable in the type system. A value that cannot be read for real returns `null` and sets `source: 'unavailable'`.
2. **Every hook must work on real hardware**: A hook must drive native platform APIs in `@pixelkit-labs/native` or `@pixelkit-labs/mlkit` without throwing unhandled exceptions or leaking native handles.

Synthetic UI mocks cannot verify genuine silicon registers, camera sensors, or AICore on-device models. To bridge this gap, PixelKit integrates **[Google ARTEMIS](https://github.com/google/artemis)** — an autonomous, agentic mobile UI testing framework that inspects and drives the real [`pixelkit-template`](https://github.com/PixelKit-Labs/pixelkit-template) app running on a physical Pixel phone or Android emulator.

---

## How ARTEMIS Works

ARTEMIS operates on real Android devices via ADB, combining multimodal vision, accessibility hierarchy parsing, and autonomous test execution:

```text
 ┌──────────────────────────────────────────────────────────────┐
 │                      ARTEMIS Agent Loop                      │
 │                                                              │
 │   ┌───────────────┐     Screenshot & UI Tree    ┌────────┐   │
 │   │ Physical Pixel│ ──────────────────────────► │ Vision │   │
 │   │ (or Emulator) │                             │ & LLM  │   │
 │   │               │ ◄────────────────────────── │ Model  │   │
 │   └───────────────┘       ADB Action Bursts     └────────┘   │
 │           │                                                  │
 │           ▼                                                  │
 │   adb logcat monitoring                                      │
 │   (assert zero FATAL crashes in @pixelkit-labs/*)            │
 └──────────────────────────────────────────────────────────────┘
```

ARTEMIS supports two execution engines depending on the verification goal:

| Engine | Characteristics | Best Used For |
| :--- | :--- | :--- |
| **ARTEMIS Flash** | Fast reactive loop (3–5s per step), chains rapid action bursts without planner overhead. | Rapid regression smoke tests, CI verification, button and tab checks. |
| **ARTEMIS Pro** | Multi-agent graph orchestrator with Planner, Operator, and Checker nodes; full Logcat diagnostics and checkpoint audit. | Complex multi-branch flows, on-device AI latency profiling, crash investigation. |

---

## The 5 Hardware Test Recipes

The test recipes live in [`test/artemis/recipes/`](https://github.com/PixelKit-Labs/pixelkit-sdk/tree/master/test/artemis/recipes) within the `pixelkit-sdk` repository:

| Recipe | File | Hardware Verified | Checkpoint Criteria |
| :--- | :--- | :--- | :--- |
| **Silicon Telemetry** | `01-silicon-telemetry.md` | `useCPU`, `useGPU`, `useMemory`, `useADPF` | Values report `source === 'hardware'`, CPU load and frequency are non-null, thermal headroom is within valid range. |
| **Actuators & Haptics** | `02-actuators-and-haptics.md` | `useHaptics`, `useTorch`, `useHiLight` | Flashlight toggle responds, haptic presets fire without native errors, HiLight status is reported correctly. |
| **Sensors & Capture** | `03-sensors-and-capture.md` | `useSensors`, `useLocation`, `useCamera` | Accelerometer / Gyroscope / Magnetometer update live streams; camera viewfinder renders without frame drops. |
| **On-Device AI** | `04-ai-gemini-nano.md` | `useGeminiNano` via `@pixelkit-labs/mlkit` | AICore loads Gemini Nano model, inference streams tokens to UI without exceeding context limit or throwing memory warnings. |
| **Full Sanity Suite** | `05-full-sanity-suite.md` | All 39 hooks across all 4 template tabs | Traverses Silicon, Sensors, Actuators, and AI tabs; continuously audits Logcat for native `FATAL` exceptions. |
| **Pixel 11 Pro Extensions** | `06-pixel-11-pro-hardware.md` | `usePerfetto`, `useCameraExtensions`, `useSpatialAudio`, `useChannelSounding`, `usePlayIntegrity`, `useHealthConnect`, `useAppFunctions` | Verifies CameraX Extensions, Spatial Audio, BLE 6.0 Channel Sounding, Titan M2 Attestation, Perfetto, and Health Connect. |

---

## Quick Start & Running Tests

### 1. Prerequisites
- **Connected Device**: A physical Google Pixel phone (e.g. Pixel 9, 10, or 11 Pro) connected via USB with **USB Debugging** enabled, or a running Android emulator.
- **Install ARTEMIS CLI**:
  ```bash
  # Install ARTEMIS globally via Astral uv
  uv tool install -e /path/to/artemis
  ```
- **Install the Template App**:
  ```bash
  cd ../pixelkit-template
  npx expo run:android
  ```

### 2. Run Test Recipes
From the root of `pixelkit-sdk`:

```bash
# Run the default silicon hardware test (Flash mode)
npm run test:e2e

# Run with deep multi-agent verification & Logcat diagnostics (Pro mode)
npm run test:e2e:pro

# Run specific hardware test recipes
node scripts/run-artemis-e2e.js silicon
node scripts/run-artemis-e2e.js actuators
node scripts/run-artemis-e2e.js sensors
node scripts/run-artemis-e2e.js ai
node scripts/run-artemis-e2e.js full
```

---

## Logcat & Native Crash Auditing

A critical responsibility of the Artemis runner is ensuring that native Kotlin code in `@pixelkit-labs/native` and `@pixelkit-labs/mlkit` does not crash silently or trigger Android fatal exceptions.

During test execution, the runner monitors Logcat for:
- `FATAL EXCEPTION: main`
- `AndroidRuntime: FATAL`
- `com.pixelkit.labs.*` stack traces
- JNI memory leaks or detached thread calls

Any encountered native exception immediately halts the test and outputs the exact device log slice for instant debugging.

---

## MCP Integration for AI Assistants

`pixelkit-sdk` includes an MCP (Model Context Protocol) configuration in `.mcp.json` that exposes ARTEMIS testing tools directly to coding assistants:

- **Google Antigravity**: Uses `.mcp.json` automatically to inspect device state and run test recipes.
- **Claude Code**: Connected via `claude mcp add artemis -- artemis mcp`.
- **Codex / IDE Agents**: Registered in `config.toml`.

When an AI coding assistant modifies a native hook or UI screen in PixelKit, it can invoke `mobile_run_task` to autonomously test its own code on the attached phone before completing the task.
