# useAppFunctions

**Source:** [packages/sdk/src/hardware/useAppFunctions.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/hardware/useAppFunctions.ts)

Bridges Android 16/17 (API 36+) AppFunctions subsystem. AppFunctions allows system AI (Gemini Assistant) and local agentic frameworks to discover, inspect, and invoke on-device actions directly within your application.

Verified on Pixel 11 Pro (`grizzly`): bound directly to `android.app.appfunctions.IAppFunctionManager` (system service 133). Nothing is simulated: when the system service is active, `source` is `'hardware'`.

## Built-in Hardware Functions
Every installation pre-registers core silicon actions:
1. **`check_phone_thermals`**: Queries Tensor G6 silicon thermal headroom, thermal status, and CPU core cluster load via ADPF.
2. **`purge_memory_cache`**: Requests an explicit Android Runtime (ART) garbage collection pass and reports freed heap memory.
3. **`get_device_silicon_info`**: Returns SoC model, GPU renderer, and confirmed hardware feature flags.

## Custom AppFunctions
Developers can declare custom schemas and handlers dynamically with `registerFunction(schema, handler)`. When Gemini or a local workflow invokes that function ID, `executeFunction` dispatches to your handler and tracks execution latency in milliseconds.

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
| `isSupported` | `boolean` | flag | `true` if device runs Android 16 QPR / Android 17 (API 36+). |
| `serviceFound` | `boolean` | flag | `true` if `android.app.appfunctions.IAppFunctionManager` system service was discovered. |
| `apiLevel` | `number \| null` | int | Device Android API level (37 on Pixel 11 Pro). |
| `serviceName` | `string \| null` | name | System service name (`'app_function'`). |
| `functions` | `AppFunctionSchema[]` | array | All available AppFunction schemas (built-in hardware + custom registered). |
| `error` | `string \| null` | text | Latest execution or query error message. |
| `source` | `TelemetrySource` | enum | `'hardware'` when backed by real system service, `'unavailable'` on older OS or emulators. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `executeFunction(functionId, params?)` | `functionId: string`. `params?: Record<string, any>`. | `Promise<AppFunctionExecutionResult>` | Executes a function by ID and measures execution time in ms. |
| `registerFunction(schema, handler)` | `schema: AppFunctionSchema`. `handler: (params) => any`. | `void` | Registers a custom function handler callable by Gemini or local agents. |
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
