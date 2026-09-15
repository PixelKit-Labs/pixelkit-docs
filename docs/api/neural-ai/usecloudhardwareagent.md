# useCloudHardwareAgent

Orchestrates multi-turn agentic hardware problem solving using Google Gen AI SDK (`@google/genai`). Evaluates prompts, plans hardware tool invocations, executes local sensors and actuators, and reflects on results across consecutive turns until the goal is achieved. Surfaces live reasoning thought chains, intermediate tool execution steps, and final diagnostics.

## Signature
```typescript
useCloudHardwareAgent(defaultOptions?: CloudAgentOptions): CloudHardwareAgentTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `defaultOptions` | `CloudAgentOptions` | Default configuration for model selection, temperature, system instruction, thinking budget, and max steps. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRunning` | `boolean` | Whether the autonomous reasoning loop is actively executing multi-turn tool steps. |
| `steps` | `AgentStepInfo[]` | Ordered list of tool execution steps taken by the model during the latest execution. |
| `lastResponse` | `string \| null` | Latest response text returned by the cloud agent. |
| `lastResult` | `CloudAgentResult \| null` | Complete result payload of the last agent execution including stop reason. |
| `history` | `Content[]` | Full conversation turn history with model tool calls and function outputs. |
| `error` | `string \| null` | Error message if agent initialization, network, or execution failed. |
| `source` | `TelemetrySource` | Data provenance: 'hardware' when an API key is present, or 'unavailable'. |
| `ask` | `(prompt: string, customOptions?: CloudAgentOptions) => Promise<CloudAgentResult \| null>` | Dispatches an autonomous reasoning prompt with multi-turn tool execution. |
| `reset` | `() => void` | Resets the agent memory, step history, and conversation state. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `ask(prompt, customOptions)` | none | `void` | Dispatches an autonomous multi-turn reasoning prompt. |
| `reset()` | none | `void` | Clears agent memory, step history, and conversation turns. |

## Example
```tsx
import { useCloudHardwareAgent } from '@pixelkit-labs/sdk';

function DiagnosticsView() {
  const { isRunning, steps, lastResponse, ask } = useCloudHardwareAgent();
  return (
    <View>
      <Button title="Check Thermals" onPress={() => ask('Inspect current thermal status and optimize')} />
      {isRunning && <ActivityIndicator />}
      <Text>{lastResponse}</Text>
    </View>
  );
}
```

:::note
Requires a Gemini API key. Dispatches real hardware tool calls against registered PixelKit actuators and telemetry sensors.
:::
