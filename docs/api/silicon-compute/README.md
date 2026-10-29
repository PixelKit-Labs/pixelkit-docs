# Silicon & Compute API Reference
> **Tensor G6 CPU, PowerVR GPU, on-device AI stack, memory, and ADPF thermals, all read from the device**

Every hook in this section reads real Android platform state through the local **PixelNative** Expo Module (`packages/native`). Nothing is fabricated: when a value cannot be read it is `null` and the hook's `source` reports `'unavailable'`. See [Observability](./observability-provenance.md) for the provenance model.

Each entry documents its **Inputs** (what you pass in, with defaults and units), its **Outputs** (every field it returns, with type and meaning) and its **Functions** (what each callable takes and what it resolves to).

## Reference
<!-- hooks:start -->
| Hook | What it reads |
| :--- | :--- |
| [`useADPF`](./useadpf.md) | How much thermal room is left before the phone slows itself down. |
| [`useADPFHintSession`](./useadpfhintsession.md) | Active frame workload negotiation with Android Dynamic Performance Framework and Tensor EAS. |
| [`useBatteryShare`](./usebatteryshare.md) | Google Pixel Battery Share (Reverse Wireless Qi Charging) telemetry and actuator. |
| [`useChargingIntelligence`](./usechargingintelligence.md) | Deep battery health, cycle count, manufacturing dates, and charging wattage tiers. |
| [`useCPU`](./usecpu.md) | What the CPU is and how hard it is working right now. |
| [`useGPU`](./usegpu.md) | Which GPU this is, and whether your frames are arriving on time. |
| [`useMemory`](./usememory.md) | System RAM, this app's heaps, and how close the system is to killing you. |
| [`usePerfetto`](./useperfetto.md) | Real Android system traces (Perfetto format) of this app, plus os.Trace markers. |
| [`useSystemLoad`](./usesystemload.md) | Whole-system CPU, GPU and TPU load, from kernel counters an app cannot read itself. |
| [`useTPU`](./usetpu.md) | Whether on-device AI host packages are visible and what the hook actually executed. |
<!-- hooks:end -->
