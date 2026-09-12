# useCPU

**Source:** [packages/sdk/src/hardware/useCPU.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useCPU.ts)

Reads the CPU topology from `/proc/cpuinfo` (per-core Arm part ids mapped to names such as `Arm C1-Ultra`, `Arm C1-Pro`) and cpufreq sysfs (`cpuinfo_max_freq`, `scaling_cur_freq`, `scaling_governor`). Android does not expose whole-system `/proc/stat` to apps, so the two load signals are (a) cluster frequency utilisation and (b) this app's own CPU share.

Verified on Pixel 11 Pro: `1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz`, governor `sched_pixel`. Topology is read once on mount; load polls every 1,000 ms until unmount.

## Signature
```typescript
function useCPU(): {
 coreTopology: string;
 coreCount: number;
 cpuLoadPercent: number | null;
 appCpuPercent: number | null;
 cores: CoreFrequency[];
 clusters: { part: string | null; name: string | null; maxMHz: number | null; count: number }[];
 governorMode: string;
 lastBenchmarkDurationMs: number | null;
 isBenchmarking: boolean;
 benchmarkCPU: () => Promise<number>;
 source: TelemetrySource;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `coreTopology` | `string` | Human-readable cluster summary built from real cluster data, e.g. `"1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz"`. `"unknown"` before the first read. |
| `coreCount` | `number` | Cores visible to this process. `0` until the native module answers; 7 on the Tensor G6. |
| `cpuLoadPercent` | `number \| null` | Cluster frequency utilisation in percent: current ÷ maximum clock averaged over cores. **Not** scheduler load. `null` when the cpufreq sysfs files are unreadable. |
| `appCpuPercent` | `number \| null` | This process's CPU time as a percentage of all cores, from `Process.getElapsedCpuTime` over wall time. `null` on the first sample because two readings are needed. Recorded with provenance `derived`. |
| `cores` | `{ index: number; part: string \| null; name: string \| null; curMHz: number \| null; maxMHz: number \| null; minMHz: number \| null }[]` | Per-core detail: kernel index, Arm part id, mapped name, and current/max/min clock in MHz. Empty before the first read. |
| `clusters` | `{ part: string \| null; name: string \| null; maxMHz: number \| null; count: number }[]` | Cores grouped by part id, which is how you tell prime, performance and efficiency cores apart. |
| `governorMode` | `string` | Kernel cpufreq governor for cpu0, `"sched_pixel"` on this device. `"unknown"` before the read; not settable without root. |
| `lastBenchmarkDurationMs` | `number \| null` | Duration in milliseconds of the last `benchmarkCPU()` run. `null` until one has run. |
| `isBenchmarking` | `boolean` | `true` while the benchmark occupies the JS thread. Use it to disable the trigger control. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNative module is present, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `benchmarkCPU()` | none | `Promise<number>` — run duration in milliseconds, also written to `lastBenchmarkDurationMs` | Runs a real single-threaded prime sieve (trial division to 60,000) on the JS thread. It measures Hermes single-thread throughput, not the system, and blocks the UI while it runs. |

## Example
```tsx
const { coreTopology, cpuLoadPercent, cores, benchmarkCPU } = useCPU();
<Text>{coreTopology}</Text>
<Text>{cpuLoadPercent ?? '—'}% · {cores.map(c => c.curMHz).join('/')} MHz</Text>
```
