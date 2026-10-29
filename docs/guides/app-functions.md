# Android AppFunctions

> **Probe the Android AppFunctions service and run an in-process function registry with `useAppFunctions`.**

---

## Overview

Starting with Android 16 (API 36), Google introduced the **AppFunctions** architecture. AppFunctions replaces legacy App Actions and static Shortcuts with a schema-driven framework that lets AI agents (such as the system-level Gemini Assistant) discover and invoke functions an app exposes through a native `AppFunctionService`.

The [`useAppFunctions`](/api/neural-ai/useappfunctions/) hook does two separate things: it probes the `app_function` system service (`isSupported`, `serviceFound`, `serviceName`), and it keeps an in-process registry of functions that your own code can list and run with `executeFunction`. Functions added with `registerFunction` live in that registry only; Gemini and other assistants cannot see them.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppFunctions } from '@pixelkit-labs/sdk';

export function AssistantFunctionsList() {
  const { isSupported, serviceFound, functions, executeFunction } = useAppFunctions();

  return (
    <View>
      <Text>AppFunctions Supported: {isSupported ? 'Yes' : 'No'}</Text>
      <Text>app_function service found: {serviceFound ? 'Yes' : 'No'}</Text>

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

<!-- diagram: app-functions -->

---

## Security & Permission Model (platform mechanism)

This section describes the Android AppFunctions mechanism, which a native `AppFunctionService` in your app takes part in. `useAppFunctions` does not register your functions with it.

1. **System assistant verification**: Android lets only authorized system assistant packages holding the `EXECUTE_APP_FUNCTIONS` signature permission invoke an app's registered AppFunctions.
2. **Parameter validation**: the platform validates arguments against the schema the app declared.
3. **Execution timeouts**: the platform applies a deadline to invocations.
