# Laya: Local Typed Decisions

> **A standalone PixelKit Labs TypeScript SDK for local choice, score, and yes/no decisions, adapted from Laya by Convai Innovations.**

[`@pixelkit-labs/laya`](https://github.com/PixelKit-Labs/Pixelkit-laya) is separate from
`@pixelkit-labs/sdk` and `@pixelkit-labs/mlkit`. It evaluates fixed typed questions over text with
an ONNX model on the user's own device. It is useful when an app needs a decision and probabilities
rather than generated prose. It does not call a hosted inference API.

**Status:** the public source repository and its TypeScript package are available. The package has
not yet been published to npm, and a real Laya checkpoint has not yet been benchmarked on the Pixel
11 Pro. The mobile adapter exists, but its latency, memory use, answer parity, and Android execution
provider choice remain unverified. Do not treat this page as a device performance claim.

## Package boundary

The host app installs model artifacts in local app storage and passes absolute file paths plus the
matching `tokenizer.json` and `rl_agent_config.json` contents to the SDK. The package does not ship
weights. All four artifacts must come from the same checkpoint revision.

```ts
import * as ort from 'onnxruntime-react-native';
import { loadMobileAgent } from '@pixelkit-labs/laya/mobile';

const agent = await loadMobileAgent(ort, {
  encoderPath: localEncoderPath,
  headPath: localHeadPath,
  config: parsedAgentConfig,
  tokenizerJson: parsedTokenizerJson,
});

const result = await agent.predict('Please refund the duplicate charge', {
  department: {
    type: 'choice',
    instructions: 'Which department should handle this?',
    criteria: { billing: 'payments and refunds', other: 'everything else' },
  },
});
console.log(result.answers.department);
await agent.dispose();
```

The example shows the implemented TypeScript API. The host app must supply real local model files;
there is no model included in the npm package. A React Native development build is required for
`onnxruntime-react-native`; Expo Go does not contain its native module.

## Pixel 11 Pro verification path

1. Export one licensed Laya checkpoint to the split ONNX format and record its exact source revision,
   artifact hashes, model size, and license. Keep the export tooling outside this TypeScript SDK.
2. Run the same questions through the reference and mobile runtimes. Record answers, probabilities,
   tolerances, and any mismatch before making performance claims.
3. Measure cold load, warm inference, peak memory, and sustained runs on the connected Pixel 11 Pro.
   Compare CPU, XNNPACK, and NNAPI with the same model and inputs; select from observed results.
4. If moving the encoder output through JavaScript costs too much, move both graph executions into
   one native Android path or produce a combined graph, then repeat the parity and performance checks.
5. Explore the app's exact UI flow with ARTEMIS before authoring mobile automation tests.

The original [Laya project](https://github.com/NandhaKishorM/laya) and its published checkpoints
are Apache-2.0. The PixelKit Labs repository includes the license and a `NOTICE` crediting Convai
Innovations. Model files are distributed separately and retain their own license information.
