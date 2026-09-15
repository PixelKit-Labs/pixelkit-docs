# pixelkit agent

> **Autonomous on-device hardware telemetry triage, diagnostic matrix analysis, and cloud agent reasoning with Google Gen AI.**

```bash
pixelkit agent [--diagnose] [--query <prompt>] [--model <model>] [--serial <serial>]
```

| Option | Default | Meaning |
| :--- | :--- | :--- |
| `--diagnose` | `false` | Executes comprehensive hardware health triage (Silicon, Battery, Thermals, AICore). |
| `--query <prompt>`, `-q` | — | Queries the autonomous hardware agent with a specific diagnostic question. |
| `--model <model>`, `-m` | `gemini-2.5-flash` | Gemini model for cloud multi-turn reasoning and telemetry analysis. |
| `--serial <id>` | — | Target ADB device serial when multiple physical devices are connected. |
| `-h`, `--help` | — | Show command usage and options. |

---

## What `pixelkit agent` Does

`pixelkit agent` extracts low-overhead hardware telemetry directly from the target Google Pixel device over `adb`:
1. **Device Identity & Platform**: Manufacturer, model name, Android release, SDK API level, and SoC platform (`ro.soc.model` / `ro.board.platform` — Tensor G4/G5/G6).
2. **Battery & Power State**: Battery level percentage, temperature in tenths of a degree Celsius ($^\circ\text{C}$), voltage ($V$), charging state, and battery health.
3. **Thermal Headroom & Throttling**: Queries `dumpsys thermalservice` to extract exact thermal throttling status levels (0 = None, 1 = Light, 2 = Moderate, 3 = Severe, 4 = Critical, 5 = Emergency, 6 = Shutdown).
4. **Memory Footprint**: Reads `/proc/meminfo` to report real available and total RAM with percent available.
5. **AICore & Edge AI Readiness**: Verifies package installation and version status of `com.google.android.aicore` on the device.

---

## Example Usage

### 1. Autonomous Hardware Triage
```bash
npx @pixelkit-labs/cli agent --diagnose
```

Sample output:
```
PixelKit Hardware Diagnostics Agent

Collecting hardware telemetry from 1A2B3C4D...

Hardware Telemetry Snapshot:
  Device:       Google Pixel 11 Pro (Android 17, API 37)
  Silicon:      Tensor G6
  Battery:      84% · 31.2°C · 4.15V · Discharging (Good)
  Thermals:     None (0)
  Memory:       11240 MB / 16384 MB (69% available)
  AICore:       Active

Autonomous Diagnostic Assessment (Local Heuristics):
  ✔ System hardware health nominal. All silicon, battery, and thermal parameters within optimal operational thresholds.
```

### 2. Cloud Agent Deep Reasoning (Google Gen AI)
When `GEMINI_API_KEY` or `GOOGLE_GENAI_API_KEY` is exported, `pixelkit agent` prompts Gemini to perform senior embedded systems engineering triage:

```bash
export GEMINI_API_KEY="AIzaSy..."
npx @pixelkit-labs/cli agent --query "Evaluate thermal headroom for high-frame-rate gaming and battery wear"
```

Sample output:
```
Cloud Hardware Agent (gemini-2.5-flash):
Reasoning over hardware telemetry with Google Gen AI...

### Hardware Engineering Assessment:
1. Thermal Headroom: The device is currently at thermal status 0 (None) with die surface temperatures at 31.2°C. There is substantial thermal headroom (~12°C margin) before thermal throttling level 1 engage. High-frame-rate 120 FPS workloads via ADPF will maintain stable frame pacing.
2. Battery Health & Power: Voltage is stable at 4.15V with nominal internal resistance and 'Good' health status reported by kernel power supply drivers.
3. AICore Readiness: AICore is installed and active; Gemini Nano edge acceleration is ready for on-device inference without cloud round-trip latency.

✔ Hardware diagnostic triage complete.
```

---

## Exit Codes

| Code | When |
| :--- | :--- |
| `0` | Telemetry collected successfully and diagnostic evaluation completed. Also for `--help`. |
| `1` | No device connected, command failure, or API network error. |

Source: [`PixelKit-Labs/pixelkit-cli`](https://github.com/PixelKit-Labs/pixelkit-cli).
