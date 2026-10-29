# useSystemLoad

Android denies apps /proc/stat, /proc/pressure and the GPU and Edge TPU trace events, so whole-system load cannot be measured from inside an app. The PixelKit system-metrics daemon runs as the adb shell user (uid 2000), reads those kernel counters over a rolling one to two second window and serves them as JSON on 127.0.0.1:11081. The hook polls /metrics every two seconds with an 800 ms timeout and validates the response with parseSystemMetrics, which throws naming the offending field when the shape is wrong. CPU utilisation is the non-idle share of /proc/stat jiffies over the window, with iowait counted as idle, overall and per core. GPU utilisation is the summed total_active_duration_ns of the power/gpu_work_period tracepoint over every uid divided by the window, so it is derived from raw trace events; the GPU clock comes from power/gpu_frequency and memory from dumpsys gpu, with the busiest uids listed. TPU utilisation is reported only when the daemon decodes real edgetpu command_start and command_end events; the shell user cannot enable those trace events directly, so on a device where none are observed tpuSource is 'unavailable' and tpuError says why. A section the daemon cannot read, a daemon that is not running, and a sample older than ten seconds all give null values with a stated reason, never a default. useGPU and useCPU are unchanged: they keep reporting what an app can measure about itself.

## Signature
```typescript
useSystemLoad(): SystemLoadState
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isDaemonConnected` | `boolean` | True when the daemon answered the last poll with a response that parsed. False means every value below is null and error says why. |
| `windowMs` | `number \| null` | Length of the measurement window the percentages refer to, in milliseconds. Null without a current sample. |
| `sampledAtMs` | `number \| null` | Daemon wall-clock time, in epoch milliseconds, when the current window completed. |
| `daemonVersion` | `string \| null` | Version string the daemon reported. Null until it has answered. |
| `cpuUtilizationPercent` | `number \| null` | Whole-system CPU use, 0 to 100, from /proc/stat jiffies over windowMs (iowait counts as idle). Null when unavailable. |
| `cpuPerCorePercent` | `(number \| null)[]` | Use of each core, 0 to 100, in cpuN order. An entry is null when that core accumulated no jiffies in the window. Empty when unavailable. |
| `cpuSource` | `'hardware' \| 'derived' \| 'unavailable'` | 'hardware' when /proc/stat was read, 'unavailable' otherwise. |
| `cpuError` | `string \| null` | Why the CPU values are null, or null when they were read. |
| `gpuUtilizationPercent` | `number \| null` | GPU active time over windowMs, 0 to 100, summed from the power/gpu_work_period tracepoint across all uids. Null when unavailable. |
| `gpuFrequencyHz` | `number \| null` | Current GPU clock in hertz. Null when it could not be read. |
| `gpuMemoryUsedMB` | `number \| null` | System-wide GPU memory in MiB, from the Global total line of dumpsys gpu. Null when it could not be read. |
| `gpuTopProcesses` | `{ uid: number, activePercent: number }[]` | The uids that kept the GPU busiest in the window, highest first. Uids, not package names; resolve them with the package manager if you need a label. Empty when unavailable. |
| `gpuSource` | `'hardware' \| 'derived' \| 'unavailable'` | 'derived' when utilisation is summed from raw trace events, 'hardware' for a directly read value, 'unavailable' otherwise. |
| `gpuError` | `string \| null` | Why some or all GPU values are null, or null when everything was read. |
| `tpuUtilizationPercent` | `number \| null` | Edge TPU busy share over windowMs, 0 to 100. Null unless real edgetpu command_start/command_end events were decoded. |
| `tpuPowerState` | `string \| null` | Edge TPU power state from edgetpu_power_state events. Null when none were observed. |
| `tpuSource` | `'hardware' \| 'derived' \| 'unavailable'` | 'hardware' only when real edgetpu events were observed, otherwise 'unavailable'. |
| `tpuError` | `string \| null` | Why the TPU values are null, or null when real events were observed. |
| `error` | `string \| null` | Latest failure or the reason no current data is returned (daemon not running, unusable response, stale sample, every section unavailable). Failures are also logged and counted. |
| `source` | `'hardware' \| 'derived' \| 'unavailable'` | Where the numbers came from. 'hardware' or 'derived' while the daemon supplies at least one section, 'unavailable' otherwise. There is no 'simulated' value. |

## Example
```tsx
import { useSystemLoad } from '@pixelkit-labs/sdk';

function SystemLoadHUD() {
  const { cpuUtilizationPercent, gpuUtilizationPercent, gpuFrequencyHz, tpuSource, error } = useSystemLoad();
  if (error) return <Text>{error}</Text>;
  return (
    <View>
      <Text>CPU {cpuUtilizationPercent?.toFixed(0) ?? '—'}%</Text>
      <Text>GPU {gpuUtilizationPercent?.toFixed(0) ?? '—'}% @ {gpuFrequencyHz ? gpuFrequencyHz / 1e6 : '—'} MHz</Text>
      <Text>TPU {tpuSource === 'unavailable' ? 'not observable' : 'active'}</Text>
    </View>
  );
}
```

:::note
The daemon must be running on the phone: build and start the daemon from the SDK repository with powershell -File scripts/system-metrics-daemon/build.ps1 then powershell -File scripts/system-metrics-daemon/run.ps1 (it is pushed with adb, runs through app_process as the shell user like the HiLight daemon, and run.ps1 forwards tcp:11081), and the app must allow cleartext traffic to 127.0.0.1. Without it isDaemonConnected is false, every number is null and error explains; show an em dash and the reason, never a placeholder. CPU and GPU numbers are real kernel counters measured over windowMs, not estimates; GPU utilisation is derived from summed trace events. TPU values are unavailable unless the daemon decodes real edgetpu command events, so branch on tpuSource and do not assume a TPU reading exists. Use this hook for whole-system load; useCPU and useGPU describe frequency and the app's own frame pacing.
:::
