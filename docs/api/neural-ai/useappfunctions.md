# useAppFunctions

**Source:** [packages/sdk/src/hardware/useAppFunctions.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useAppFunctions.ts)

Android 16+ (API 36) AppFunctions state and an in-process function registry. `isSupported`, `serviceFound` and `serviceName` describe the Android `app_function` system service. The functions listed and executed through this hook live in the hook's memory; they are not registered with that service and are not visible to Gemini. Nothing is simulated: `source` is `'hardware'` only when the system service was found.

## Built-in Hardware Functions
These schemas are listed in `functions` and handled by `executeFunction` in this hook:
1. **`check_phone_thermals`**: Reads PowerManager thermal status and headroom and this app's CPU percentage and core count (`{ thermalStatus, thermalHeadroom, appCpuPercent, coreCount }`).
2. **`purge_memory_cache`**: Requests a garbage collection pass in this app and returns the `MemoryInfo` snapshot taken afterwards; it does not report how much was freed.
3. **`get_device_silicon_info`**: Returns SoC identifiers from `android.os.Build` and the GPU renderer and vendor strings (`{ soc, socManufacturer, hardware, gpuRenderer, gpuVendor }`).

## Native registry functions
An id that is neither a custom handler nor a built-in is run through `PixelNative.executeAppFunction`, which performs only the functions `PixelNative.getAppFunctions()` lists: `triggerHapticEffect` (a `VibrationEffect` composition primitive, refused with an error when the vibrator does not support it), `setTorchLevel`, `getSiliconStatus` and `scanNearbyRadios`. `executeFunction` resolves `success: false` with the native message when the effect did not happen, and with an unknown-id error for any other id. The HiLight ring is not an AppFunction; use `useHiLight`.

## Custom AppFunctions
Developers can declare custom schemas and handlers with `registerFunction(schema, handler)`. They are kept in this hook's memory: `executeFunction(id)` dispatches to your handler and measures execution latency in milliseconds, but nothing is registered with the Android `app_function` system service, so Gemini or another assistant cannot see or call them. Exposing a function to the system needs a native `AppFunctionService` in your app.

## Signature
```typescript
function useAppFunctions(): {
  isSupported: boolean;
  serviceFound: boolean;
  apiLevel: number | null;
  serviceName: string | null;
  functions: AppFunctionSchema[];
  error: string | null;
  source: TelemetrySource;
  refresh: () => void;
  executeFunction: (functionId: string, params?: Record<string, any>) => Promise<AppFunctionExecutionResult>;
  registerFunction: (schema: AppFunctionSchema, handler: (params: Record<string, any>) => Promise<any> | any) => void;
  unregisterFunction: (functionId: string) => boolean;
};
```

## Outputs
| Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `isSupported` | `boolean` | flag | `true` if the device runs Android 16 (API 36) or later; an API-level check, not a service probe. |
| `serviceFound` | `boolean` | flag | `true` if `android.app.appfunctions.IAppFunctionManager` system service was discovered. |
| `apiLevel` | `number \| null` | int | Device Android API level as reported by the platform. |
| `serviceName` | `string \| null` | name | System service name (`'app_function'`); `null` when the service was not found. |
| `functions` | `AppFunctionSchema[]` | array | The hook's built-in schemas plus custom ones registered through this hook. An in-process list, not the system registry. |
| `error` | `string \| null` | text | Latest execution or query error message. |
| `source` | `TelemetrySource` | enum | `'hardware'` when backed by real system service, `'unavailable'` on older OS or emulators. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `executeFunction(functionId, params?)` | `functionId: string`. `params?: Record<string, any>`. | `Promise<AppFunctionExecutionResult>` | Executes a function by ID and measures execution time in ms. |
| `registerFunction(schema, handler)` | `schema: AppFunctionSchema`. `handler: (params) => any`. | `void` | Registers a custom function handler in this hook's in-process registry, callable through `executeFunction`. It is not registered with the Android system service. |
| `unregisterFunction(functionId)` | `functionId: string` | `boolean` | Removes a registered custom function handler. |
| `refresh()` | none | `void` | Re-queries the Android `app_function` system service. |

## Example
```tsx
import { View, Text, Button } from 'react-native';
import { useAppFunctions } from '@pixelkit-labs/sdk';

export function GeminiAppFunctionsCard() {
  const { isSupported, serviceFound, functions, executeFunction } = useAppFunctions();

  const runThermals = async () => {
    const result = await executeFunction('check_phone_thermals');
    console.log('Thermal result:', result.data);
  };

  return (
    <View>
      <Text>AppFunctions: {serviceFound ? 'Active (API 37)' : 'Unavailable'}</Text>
      <Text>Registered Tools: {functions.length}</Text>
      <Button title="Check Thermals via Assistant" onPress={runThermals} />
    </View>
  );
}
```
