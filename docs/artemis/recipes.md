# Recipes

> **Seven verification plans, written in plain language, that tell the agent what to open, what to press, and what counts as a pass.**

A recipe is a Markdown file in
[`test/artemis/recipes/`](https://github.com/PixelKit-Labs/pixelkit-sdk/tree/master/test/artemis/recipes).
The runner sends its whole text to ARTEMIS as the task, so the recipe is the test: there is no
separate script behind it.

## The seven

| # | Recipe | Run with | Hooks | Passes when | Logcat audit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | Silicon telemetry | `silicon` | `useCPU`, `useGPU`, `useMemory`, `useADPF` | Each reports `source === 'hardware'`, CPU load and frequency are not `null`, thermal headroom is in range. | Yes |
| 02 | Actuators and haptics | `actuators` | `useHaptics`, `useTorch`, `useHiLight` | The torch toggles, haptic presets fire without a native error, HiLight reports its status correctly. | Yes |
| 03 | Sensors and capture | `sensors` | `useSensors`, `useLocation`, `useCamera` | Motion sensors stream live, the camera viewfinder renders without dropping frames. | No |
| 04 | On-device AI | `ai` | `useGeminiNano` | AICore loads Gemini Nano and streams tokens to the screen without exceeding the context limit or raising memory warnings. | Yes |
| 05 | Full sanity suite | `full` | Every hook the template exercises | Traverses all four tabs without a native `FATAL`. | Yes |
| 06 | Pixel 11 Pro extensions | `hardware` | `usePerfetto`, `useCameraExtensions`, `useSpatialAudio`, `useChannelSounding`, `usePlayIntegrity`, `useHealthConnect`, `useAppFunctions` | Each feature responds on the device. | Yes |
| 07 | Next-generation hardware | `nextgen` | `useAltimeter`, `useMicrophoneArray`, `useThermometer`, `useBatteryShare`, `useChargingIntelligence`, `useADPFHintSession`, `useWifi7MLO`, `useWifiRTT`, `useSatelliteNTN`, `usePrivateSpace`, `useKeyAgreement`, `useEmbeddings` | Each reports `hardware` or `derived` where the silicon exists, and `unavailable` with `null` readings where it does not. | Yes |

**Recipe 07 cannot pass yet.** It drives screens for its twelve hooks, and the template has not built
them. It will start meaning something when those screens exist.

The Logcat audit is a step the agent performs because the recipe asks for it — the runner does not
watch the log. Recipe 05's version is typical:

```bash
adb logcat -d *:E | grep -i "pixelkit"
```

## Writing a recipe

1. **Add a Markdown file** to `test/artemis/recipes/`, numbered after the last one.
2. **Say what to open and what to press** in the order a person would, naming screens and controls
   exactly as the template labels them.
3. **Write every checkpoint as something observable** — "`source` reads `hardware`", "the value is
   not `null`" — never "works correctly". A checkpoint the agent cannot see, it cannot verify.
4. **Treat `unavailable` as a pass where the hardware is absent**, and a plausible-looking number
   where it is absent as a failure. That is the contract being tested.
5. **End with a Logcat audit**, unless the recipe genuinely cannot crash native code.
6. **Give it a name** in the `RECIPES` table in `scripts/run-artemis-e2e.js`, or run it by path.

A recipe can only reach screens the template has. If it needs one that does not exist, build the
screen first — otherwise it fails for a reason that has nothing to do with the hook.
