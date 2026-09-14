# OpenAPI 3.1 Specification

> **Full OpenAPI 3.1.0 schema for the PixelKit SDK hardware & AI surface, automatically synchronized from `data/hooks`.**

PixelKit exports an **OpenAPI 3.1.0 specification** defining every sensor, radio, compute, and AI capability across all 51 typed React hooks and hardware actuators. It provides a standard REST/RPC interface for developer tooling, the `<PixelKitDevTools />` HUD, local Metro bridges, and AI tool-calling agents.

---

## Downloads

| Format | Link | Description |
| :--- | :--- | :--- |
| **JSON** | [`openapi.json`](../openapi.json) | Complete OpenAPI 3.1.0 specification in JSON format. |
| **YAML** | [`openapi.yaml`](../openapi.yaml) | Complete OpenAPI 3.1.0 specification in YAML format. |

---

## Automated Parity & Zero Drift

The OpenAPI specification **automatically stays up to date**:

1. **SDK Build Pipeline**: In `PixelKit-Labs/pixelkit-sdk`, `npm run build` runs `export:openapi` on every compilation.
2. **Version Synchronization**: Bumping the SDK version via `node scripts/sync-versions.js <version>` automatically regenerates the specification with the updated version number.
3. **CI Verification Gate**: `npm run verify` runs `scripts/check-openapi.js`, which verifies that the OpenAPI specification strictly matches the hook contracts in `data/hooks/*.json` with zero drift.
4. **Docs Pipeline**: Every docs build (`npm run build` in `pixelkit-docs`) executes `scripts/build-openapi.mjs` to refresh the hosted `openapi.json` and `openapi.yaml` files.

---

## Core API Structure

### 1. Zero-Simulation Principle
Every telemetry schema references `TelemetrySource`:
```json
{
  "type": "string",
  "enum": ["hardware", "derived", "unavailable"]
}
```
Fabricated readings cannot be represented in the schema. Unreadable sensor readings return `null`.

### 2. Endpoints

- **`GET /api/state`**: Returns an instantaneous atomic snapshot of all 51 hardware telemetry states simultaneously.
- **`GET /api/hooks`**: Returns the catalog of all 51 hooks, category metadata, and hardware badges.
- **`GET /api/hooks/{hookName}`**: Queries the telemetry state of an individual hook (e.g., `GET /api/hooks/useThermometer`, `GET /api/hooks/useCPU`, `GET /api/hooks/useWifi7MLO`).
- **`POST /api/hooks/{hookName}/actions/{actionName}`**: Invokes physical hardware actuators and AI routines:
  - `POST /api/hooks/useTorch/actions/setTorch`: Sets rear LED flashlight level or toggles strobe.
  - `POST /api/hooks/useHaptics/actions/playEnvelope`: Drives custom Android 16 LRA vibration waveforms.
  - `POST /api/hooks/useBatteryShare/actions/setBatteryShare`: Toggles reverse wireless Qi charging.
  - `POST /api/hooks/useMicrophoneArray/actions/setDirection`: Steers acoustic beamforming.
  - `POST /api/hooks/useWifiRTT/actions/startRanging`: Triggers 802.11mc/az indoor positioning.
  - `POST /api/hooks/useKeyAgreement/actions/deriveSharedSecret`: Derives hardware-isolated ECDH secrets on Titan M2.

---

## Usage with AI Agents & Tool Calling

Because OpenAPI 3.1.0 is based on JSON Schema 2020-12, this specification can be loaded directly into Gemini, Claude, or OpenAI as a tool/function catalog:

```bash
# Fetch the spec directly
curl -s https://pixelkit-labs.github.io/pixelkit-docs/openapi.json
```
