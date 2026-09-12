# PixelKit SDK Documentation
> **The Official Developer & AI Agent Documentation Portal for Google Pixel 11 Pro**

Documentation for the **PixelKit SDK**: the silicon, sensors, radios and on-device models of the **Google Pixel 11 Pro** (Android 17, **Google Tensor G6**) exposed as React hooks.

**Every function in this documentation states its inputs and its outputs.** Each hook page lists the arguments it takes with their defaults and units, every field it returns with what that field means, and for each callable what each parameter does and what the call resolves to — including what a failure looks like. Nothing that cannot be read is invented: it is `null`, it renders as "—", and `source` says `unavailable`.

---

## Documentation Sitemap

### [Getting Started](./getting-started/)
* **[Quickstart Guide](./getting-started/quickstart.md)**: Workstation prerequisites (Node 20+, Google Android CLI), installing dependencies, running on Pixel 11 Pro via Expo Go or development builds.
* **[Using this template](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/docs/using-this-template.md)**: what to rename, what to keep, what to delete, and how to add a hook the parity check accepts.
* **[Architecture & Silicon Overview](./getting-started/architecture.md)**: The Tensor G6 7-core cluster, the PowerVR GPU, the StrongBox-backed keystore, wireless charging and the Hermes runtime — with device-verified figures separated from Google's published specification.

### [API Reference](./api/)
* **[Silicon & Compute](./api/silicon-compute/README.md)**: `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF`.
* **[Pixel Pro Exclusives](./api/pro-exclusives/README.md)**: `useHiLight` (camera bar notification ring), `useUWB` (spatial radar AoA).
* **[Neural & AI](./api/neural-ai/README.md)**: `useGemini`, `useGeminiNano`, `useGenAITasks`, `useNaturalLanguageAI`, `useSpeechAI`, `useSpeech`, `useVisionAI`, `geminiClient`.
* **[Sensors & Actuators](./api/sensors-actuators/README.md)**: `useSensors` (6-axis IMU, barometer, light), `useCamera` (capture, zoom, flash, torch), `useTorch`, `useHaptics` (LRA patterns, envelopes, primitives).
* **[Radios & Security](./api/radios-security/README.md)**: `useBiometrics`, `useSecurity` (SecureStore on the Android Keystore; no post-quantum algorithms are used), `useBLE`, `useNFC`, `useRadios`, `useLocation` (dual-band GNSS).
* **[System & Media](./api/system-media/README.md)**: `useAudio`, `useCapabilities`, `useDisplay` (1-120 Hz LTPO, HDR, ARR), `useDevice`, `useNetwork`, `useVideo`, `useMediaLibrary`, `useCellular`.

### [AI Agent Guidance](./ai-guidance/)
* **[Agent Primer](./AI_PRIMER.md)**: the rules an agent follows here, the hook table with inputs, outputs and functions, worked recipes, and a copy-paste system prompt.
* **[Production Recipes](./ai-guidance/recipes.md)**: Copy-pasteable recipes for voice agent loops, multimodal scene reasoning, face-down HiLight visual signaling, and spatial tracking.
* **Agent Skills & Tooling**: 26 official Expo agent skills (`.agents/skills/` tracked via `skills-lock.json`) covering navigation, UI, modules, animations, and deployment alongside Google `android-cli`.

### [Guides & Diagnostics](./guides/)
* **[Built-in AI, Function Calling & Voice (hub)](./guides/README.md)**: Where inference runs (Gemini Nano 4 on-device vs Gemini cloud), capability matrix, and shared dev-build prerequisites.
* **[On-Device AI with Gemini Nano](./guides/on-device-ai-gemini-nano.md)**: `@pixelkit-labs/mlkit` Expo Module over the ML Kit GenAI Prompt API, `useGeminiNano`, structured output, thinking mode, hybrid routing.
* **[Function Calling & Hardware Tools](./guides/function-calling.md)**: One tool registry executed by cloud Gemini function calling, Gemini Nano structured output, and Android AppFunctions.
* **[Voice: Speech In, Speech Out, Live Agents](./guides/voice.md)**: On-device streaming STT (Pixel 10/11 Advanced mode), Gemini Live API voice agents with ephemeral tokens, TTS, HiLight/haptic status.
* **[Troubleshooting & Diagnostics](./guides/troubleshooting.md)**: Expo SDK 57 specifics, camera permissions, keep-awake tags, Hermes bytecode compilation, and thermal throttling mitigations.

### Release
* **[RELEASING.md](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/RELEASING.md)**: the gates, versioning, the on-device walk, signing, EAS profiles, and the GitHub and Play steps.
* **[Privacy policy](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/docs/PRIVACY.md)**: what stays on the device, what leaves only with your own API key, and what each permission is for.
* **[Store listing](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/docs/store-listing.md)**: listing copy, data-safety answers and a declared purpose for every sensitive permission.


### Consolidated Single-File Manuals
* **[API reference](./api/README.md)**: One page per hook, each with its inputs, outputs and function contracts.
* **[AI_PRIMER.md](./AI_PRIMER.md)**: Complete AI agent operational manual in a single document.

---

## Silicon Architecture Diagram

<!-- diagram: sdk-surface -->

---

## The Single Import Rule

All hardware hooks and UI primitives are centralized:

```typescript
import {
 useCPU,
 useGPU,
 useTPU,
 useHiLight,
 useSensors,
 useCamera,
 useGemini,
 useSpeechAI,
 useHaptics,
 HapticButton,
 MetricCard
} from '@pixelkit-labs/sdk';
```
