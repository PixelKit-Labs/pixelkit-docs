# useMemory

**Source:** [packages/sdk/src/hardware/useMemory.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useMemory.ts)

`ActivityManager.getMemoryInfo` (total, available, low-memory threshold and flag), the Java heap (`Runtime`) and the native heap (`Debug.getNativeHeapAllocatedSize`), polled every 2 s. `purgeCaches()` requests a GC and re-reads; it does not pretend to free system RAM. It reads on mount and every 2,000 ms thereafter.

## Signature
```typescript
function useMemory(): {
 totalRAMMB: number;
 freeRAMMB: number;
 usedRAMMB: number;
 isLowMemory: boolean;
 lowMemoryThresholdMB: number;
 appJavaHeapMB: number;
 appJavaHeapMaxMB: number;
 appNativeHeapMB: number;
 purgeCaches: () => void;
 source: TelemetrySource;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `totalRAMMB` | `number` | Total physical RAM in MB from `ActivityManager.MemoryInfo.totalMem`. `0` before the first read; 11,647 MB on this device. |
| `freeRAMMB` | `number` | Available RAM in MB (`availMem`): what the kernel says it can hand out now. |
| `usedRAMMB` | `number` | `totalRAMMB − freeRAMMB`. Includes reclaimable page cache, so it reads higher than "app memory". |
| `isLowMemory` | `boolean` | Kernel low-memory flag: available RAM is below the threshold and the system is killing processes. |
| `lowMemoryThresholdMB` | `number` | The threshold in MB at which that flag flips. |
| `appJavaHeapMB` | `number` | This process's Java heap in use, to one decimal. |
| `appJavaHeapMaxMB` | `number` | Ceiling for that heap; exceeding it is an `OutOfMemoryError`. |
| `appNativeHeapMB` | `number` | This process's native heap (Hermes, decoded images, JSI buffers), to one decimal. |
| `source` | `TelemetrySource` | `'hardware'` with the native module present, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `purgeCaches()` | none | `void` — the refreshed reading lands in the returned fields | Requests a garbage collection and re-reads memory immediately. It frees this app's garbage only; it cannot free system RAM. The amount reclaimed is logged as `freedMB`. |
