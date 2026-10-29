# useCloudHardwareAgent

Wraps `runCloudAgent` (built on `@google/genai`): `ask()` sends the prompt and the conversation so far, executes each model tool call through `runTool` against `run.capabilityAdapter`, folds the results back into the next turn, and stops when the model answers, `maxSteps` (default 6) is reached, the run is cancelled, or no capability or API key is available. The default model is the `DEFAULT_AGENT_MODEL` constant. Intermediate tool steps are in `steps` and the final text in `lastResponse`. The hook does not request or surface model thoughts.

## Signature
```typescript
useCloudHardwareAgent(defaultOptions?: CloudAgentDefaults): CloudHardwareAgentTelemetry
```

## Inputs
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `defaultOptions` | `CloudAgentDefaults` (`Partial<Omit<CloudAgentOptions, 'capabilityAdapter' \| 'context' \| 'sink' \| 'redaction' \| 'signal'>>`) | Optional defaults merged under each `ask()` run: `model`, `systemInstruction`, `temperature`, `maxSteps`, `onStep`. Per-ask values win. The adapter and trace context are passed to `ask()`. |

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isRunning` | `boolean` | Whether the autonomous reasoning loop is actively executing multi-turn tool steps. |
| `steps` | `AgentStepInfo[]` | Ordered list of tool execution steps taken by the model during the latest execution. |
| `lastResponse` | `string \| null` | Latest response text returned by the cloud agent. |
| `lastResult` | `CloudAgentResult \| null` | Complete result payload of the last agent execution including stop reason. |
| `history` | `Content[]` | Full conversation turn history with model tool calls and function outputs. |
| `error` | `string \| null` | Error message if agent initialization, network, or execution failed. |
| `source` | `TelemetrySource` | `'hardware'` when an API key is present, otherwise `'unavailable'`. It records that a cloud call is possible, not that device hardware was read. |
| `ask` | `(prompt: string, run: CloudAgentOptions) => Promise<CloudAgentResult \| null>` | Runs the tool-calling loop. `run.capabilityAdapter` and `run.context` are required. |
| `reset` | `() => void` | Resets the agent memory, step history, and conversation state. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `ask(prompt, run)` | `prompt: string`. `run: CloudAgentOptions` — `{ capabilityAdapter, context, model?, systemInstruction?, maxSteps?, temperature?, signal?, onStep?, sink?, redaction? }`. | `Promise<CloudAgentResult \| null>` — `{ text, contents, steps, totalSteps, stoppedReason: 'completed' \| 'max_steps_exceeded' \| 'unavailable' \| 'cancelled', context, unavailableReason?, providerRequestId?, usage? }`; `null` for a blank prompt or when the loop threw (reason in `error`) | Runs the multi-turn loop. A missing API key or an adapter with no tools resolves with `stoppedReason: 'unavailable'`. |
| `reset()` | none | `void` | Clears agent memory, step history, and conversation turns. |

## Example
```tsx
import { useCloudHardwareAgent, createHardwareCapabilityAdapter, createTraceContext } from '@pixelkit-labs/sdk';

function DiagnosticsView({ adpf }) {
  const { isRunning, lastResponse, lastResult, ask } = useCloudHardwareAgent();
  const run = () => ask('Inspect current thermal status', {
    context: createTraceContext(),
    capabilityAdapter: createHardwareCapabilityAdapter({ adpf }),
  });
  return (
    <View>
      <Button title="Check Thermals" onPress={run} />
      {isRunning && <ActivityIndicator />}
      <Text>{lastResponse ?? lastResult?.unavailableReason ?? ''}</Text>
    </View>
  );
}
```

:::note
Requires a Gemini API key and a capability adapter with at least one tool; otherwise `ask()` resolves with `stoppedReason: 'unavailable'`. The model only sees the tools in the adapter you pass, and a failed effect comes back to it as an error.
:::
