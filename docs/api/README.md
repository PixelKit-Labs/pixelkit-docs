# API reference

Every hook, with its inputs, its outputs, and a contract for each function it exposes: what each
argument does, what the call resolves to, and what failure looks like.

These pages are the contract, not a description of it. `pixelkit-sdk` runs `npm run check-docs` in
CI, which clones this repository and fails the build if a hook it exports has no entry here, if an
entry describes a hook it no longer exports, or if an entry documents a returned field that is not
on the hook's declared type.

| Page | Hooks |
| :--- | :--- |
| [Silicon and compute](./silicon-compute.md) | `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF` |
| [Neural and AI](./neural-ai.md) | `useGemini`, `useGeminiNano`, `useGenAITasks`, `useVisionAI`, `useNaturalLanguageAI`, `useSpeechAI`, `useSpeech` |
| [Sensors and actuators](./sensors-actuators.md) | `useSensors`, `useCamera`, `useVideo`, `useMediaLibrary`, `useTorch`, `useHaptics` |
| [Radios and security](./radios-security.md) | `useBLE`, `useNFC`, `useUWB`, `useRadios`, `useBiometrics`, `useSecurity` |
| [System and media](./system-media.md) | `useAudio`, `useDisplay`, `useDevice`, `useNetwork`, `useCellular` |
| [Pixel Pro exclusives](./pro-exclusives.md) | `useHiLight`, `useUWB` |
| [Complete hardware API](./hardware-api.md) | All 32 in one page |

## Reading a hook's `source`

Every hook returns `source: 'hardware' | 'derived' | 'unavailable'`. There is deliberately no
`simulated` member, so a fabricated reading cannot be represented. A value that cannot be read is
`null`, and the control that depends on it refuses rather than showing a number nobody measured.

Capability-gated hooks go further, reporting `unsupported` when the device physically lacks the
hardware — which is a different answer from `unavailable`, meaning it is there but not reachable
right now.
