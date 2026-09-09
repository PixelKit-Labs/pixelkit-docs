# Android 17 AppFunctions & System Gemini Assistant

> **Exposing structured app capabilities to the system Gemini assistant via `useAppFunctions`.**

---

## Overview

Starting with Android 17 (API 37), Google introduced the **AppFunctions** architecture (`android.app.appsearch.AppFunctionManager`). AppFunctions replaces legacy App Actions and static Shortcuts with a dynamic, schema-driven framework that lets AI agents (such as the system-level Gemini Assistant) discover, invoke, and inspect app functionalities at runtime.

The [`useAppFunctions`](/api/for-coding-agents/#useappfunctions) hook provides full lifecycle management for registering and executing on-device functions.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppFunctions } from '@pixelkit-labs/sdk';

export function AssistantFunctionsList() {
  const { isSupported, isAvailable, functions, executeFunction } = useAppFunctions();

  return (
    <View>
      <Text>AppFunctions Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>System Service Available: {isAvailable ? 'Yes' : 'No'}</Text>

      {functions.map((fn) => (
        <View key={fn.id}>
          <Text style={{ fontWeight: 'bold' }}>{fn.name} ({fn.category})</Text>
          <Text>{fn.description}</Text>
          <TouchableOpacity
            onPress={async () => {
              const result = await executeFunction(fn.id, {});
              console.log('Execution result:', result);
            }}
          >
            <Text>Test Execute</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
```

---

## AppFunctions Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │           System Gemini Assistant / AI Agent           │
 └──────────────────────────┬─────────────────────────────┘
                            │ (Query capabilities via IAppFunctionManager)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           Android 17 AppSearch / AppFunctionManager     │
 │            Capability Registry & Permissions            │
 └──────────────────────────┬─────────────────────────────┘
                            │ (AppFunctionService IPC)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               PixelKit useAppFunctions                 │
 │            Registered Schemas & Handlers               │
 └────────────────────────────────────────────────────────┘
```

---

## Security & Permission Model

1. **System Assistant Verification**: Only authorized system assistant packages holding the `EXECUTE_APP_FUNCTIONS` signature permission can invoke registered AppFunctions.
2. **Parameter Validation**: Input and output arguments are strictly validated against the declared JSON Schema before execution begins.
3. **Execution Timeouts**: Invocations enforce a default 5-second deadline to ensure assistant responsiveness.
