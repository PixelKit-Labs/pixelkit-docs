# API reference

One page per hook: its inputs, its outputs, and a contract for each function it exposes — what each
argument does, what the call resolves to, and what failure looks like.

These pages are the contract, not a description of it. `pixelkit-sdk` runs `npm run check-docs` in
CI, which clones this repository and fails the build if a hook it exports has no entry here, if an
entry describes a hook it no longer exports, or if an entry documents a returned field that is not
on the hook's declared type.

39 hooks across 6 sections. The index below is generated from `data/hooks`, so a hook
cannot be listed in the wrong section or listed twice.

## Hooks by section

### [Silicon and compute](./silicon-compute/)

| Hook | What it reads |
| :--- | :--- |
| [`useADPF`](./silicon-compute/useadpf.md) | How much thermal room is left before the phone slows itself down. |
| [`useCPU`](./silicon-compute/usecpu.md) | What the CPU is and how hard it is working right now. |
| [`useGPU`](./silicon-compute/usegpu.md) | Which GPU this is, and whether your frames are arriving on time. |
| [`useMemory`](./silicon-compute/usememory.md) | System RAM, this app's heaps, and how close the system is to killing you. |
| [`usePerfetto`](./silicon-compute/useperfetto.md) | System-level kernel and app performance profiling via Perfetto v54. |
| [`useTPU`](./silicon-compute/usetpu.md) | Whether the on-device AI stack is installed and usable. |

### [Neural and AI](./neural-ai/)

| Hook | What it reads |
| :--- | :--- |
| [`useAppFunctions`](./neural-ai/useappfunctions.md) | Exposes on-device actions and hardware capabilities to system AI and Gemini Assistant. |
| [`useGemini`](./neural-ai/usegemini.md) | Cloud Gemini chat with real multi-turn history. |
| [`useGeminiNano`](./neural-ai/usegemininano.md) | Gemini Nano running on the phone, with no network and no API key. |
| [`useGenAITasks`](./neural-ai/usegenaitasks.md) | Four focused text tasks that run locally: summarise, proofread, rewrite, describe. |
| [`useNaturalLanguageAI`](./neural-ai/usenaturallanguageai.md) | Translation, language detection, smart replies and entity extraction, all offline. |
| [`useSpeech`](./neural-ai/usespeech.md) | Speaking text aloud with the voices the phone has installed. |
| [`useSpeechAI`](./neural-ai/usespeechai.md) | Turning speech into text, on the device or in the cloud. |
| [`useVisionAI`](./neural-ai/usevisionai.md) | Nine on-device vision capabilities, plus cloud scene understanding. |

### [Sensors and actuators](./sensors-actuators/)

| Hook | What it reads |
| :--- | :--- |
| [`useCamera`](./sensors-actuators/usecamera.md) | Lens, zoom, flash and torch, plus taking photos and recording video. |
| [`useCameraExtensions`](./sensors-actuators/usecameraextensions.md) | Google computational photography vendor extensions (Night Sight, Ultra HDR, Portrait Bokeh). |
| [`useHaptics`](./sensors-actuators/usehaptics.md) | Vibration, from simple taps to custom-shaped waveforms. |
| [`useHealthConnect`](./sensors-actuators/usehealthconnect.md) | Platform health records, steps, and sensor vitals telemetry. |
| [`useSensors`](./sensors-actuators/usesensors.md) | Motion, orientation, air pressure and ambient light, streaming live. |
| [`useTorch`](./sensors-actuators/usetorch.md) | The rear flashlight, including variable brightness and an SOS strobe. |

### [Radios and security](./radios-security/)

| Hook | What it reads |
| :--- | :--- |
| [`useBiometrics`](./radios-security/usebiometrics.md) | Fingerprint and face authentication. |
| [`useBLE`](./radios-security/useble.md) | Bluetooth adapter state, Channel Sounding, bonded devices, and active BLE peripheral discovery. |
| [`useChannelSounding`](./radios-security/usechannelsounding.md) | Bluetooth Core 6.0 high-accuracy centimeter-precision Phase-Based Ranging (PBR). |
| [`useLocation`](./radios-security/uselocation.md) | Position, altitude, heading and speed from the satellite receiver. |
| [`useNFC`](./radios-security/usenfc.md) | Reading and writing real NFC tags through reader mode. |
| [`usePlayIntegrity`](./radios-security/useplayintegrity.md) | Hardware Key Attestation and Google Play Integrity verdicts via Titan M2. |
| [`useRadios`](./radios-security/useradios.md) | Every radio subsystem in one read. |
| [`useSecurity`](./radios-security/usesecurity.md) | Encrypted storage for secrets, backed by hardware. |

### [System and media](./system-media/)

| Hook | What it reads |
| :--- | :--- |
| [`useAudio`](./system-media/useaudio.md) | Microphone recording with levels and input choice, plus playback. |
| [`useCapabilities`](./system-media/usecapabilities.md) | What this particular phone actually has. |
| [`useCellular`](./system-media/usecellular.md) | Carrier, radio generation and network codes from the modem. |
| [`useDevice`](./system-media/usedevice.md) | Device identity, battery level, thermistor temperature, voltage, current, and wattage. |
| [`useDisplay`](./system-media/usedisplay.md) | Refresh rate, HDR capability, brightness and the screen wake lock. |
| [`useMediaLibrary`](./system-media/usemedialibrary.md) | Saving captures to the gallery, and reading what is there. |
| [`useNetwork`](./system-media/usenetwork.md) | Connection type, address and whether traffic actually goes anywhere. |
| [`useSpatialAudio`](./system-media/usespatialaudio.md) | Android Spatializer status, binaural rendering, and dynamic head tracking telemetry. |
| [`useVideo`](./system-media/usevideo.md) | Playing video back, with position, seeking and thumbnails. |

### [Pixel Pro exclusives](./pro-exclusives/)

| Hook | What it reads |
| :--- | :--- |
| [`useHiLight`](./pro-exclusives/usehilight.md) | The eight-LED ring around the rear camera flash. Real LEDs or nothing. |
| [`useUWB`](./pro-exclusives/useuwb.md) | Ultra-wideband radio state, hardware ranging sessions, and spatial diagnostics. |

## Reading a hook's `source`

Every hook returns `source: 'hardware' | 'derived' | 'unavailable'`. There is deliberately no
`simulated` member, so a fabricated reading cannot be represented. A value that cannot be read is
`null`, and the control that depends on it refuses rather than showing a number nobody measured.

Capability-gated hooks go further, reporting `unsupported` when the device physically lacks the
hardware — which is a different answer from `unavailable`, meaning it is there but not reachable
right now.

## Not a hook

| | |
| :--- | :--- |
| [`geminiClient`](./neural-ai/geminiclient.md) | The cloud Gemini client the AI hooks call, and its constants. |
| [Observability and provenance](./silicon-compute/observability-provenance.md) | How a reading reports where it came from, and what `null` means. |
| [PixelNative module](./silicon-compute/pixelnative-module.md) | The Kotlin module the hooks read through, and the events it emits. |
