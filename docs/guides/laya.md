# Laya: Local Typed Decisions

> **A standalone PixelKit Labs TypeScript SDK for local choice, score, and yes/no decisions, adapted from Laya by Convai Innovations.**

[`@pixelkit-labs/laya`](https://github.com/PixelKit-Labs/Pixelkit-laya) is separate from
`@pixelkit-labs/sdk` and `@pixelkit-labs/mlkit`. It evaluates fixed typed questions over text with
an ONNX model on the user's own device. It is useful when an app needs a decision and probabilities
rather than generated prose. It does not call a hosted inference API.

**SDK version:** `0.1.8`

Laya CI and release check this guide's SDK version and example imports against the package.
SDK changes also require a version bump and matching README and changelog updates in the same
change set. Update this guide before pushing the corresponding SDK change.

**Status:** the public source repository and its TypeScript package are available. The package has
not yet been published to npm. A pinned public checkpoint has passed a local fused-graph smoke run,
and the Android verification app has built. CI now typechecks and builds its Android debug APK.
A local CPU smoke run has completed on a Pixel 11 Pro. General accuracy, memory
profiling, cross-provider answer parity, and hardware placement remain unverified.
Do not treat this page as a general device performance claim.

The Android example includes editable support routing, notification triage, and
assistant intent selection, plus 24 authored evaluation cases with expected
answers fixed in advance. It reports correct/wrong/error counts, per-case
predictions, and latency, and saves a local JSON report. Six challenge cases cover
negation, ambiguity, multiple intents, and misleading instructions. The examples
do not execute actions. Their correct-answer fraction is not a held-out accuracy
benchmark, and model probability is not measured accuracy. Choose **Run 24
examples** for the evaluation or **Classify message** for your own input.

## Package boundary

The host app installs model artifacts in local app storage and passes the absolute `model.onnx` path
plus the matching `tokenizer.json` and `rl_agent_config.json` contents to the SDK. Keep
`model.onnx.data` beside the graph when it has external weights. The package does not ship weights.
All artifacts must come from the same checkpoint revision.

```ts
import * as ort from 'onnxruntime-react-native';
import { loadMobileFusedAgent } from '@pixelkit-labs/laya/mobile';

const agent = await loadMobileFusedAgent(ort, {
  modelPath: localModelPath,
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
The [Pixel verification app](https://github.com/PixelKit-Labs/Pixelkit-laya/tree/main/examples/pixel-verify)
documents the pinned public checkpoint and Android build path. Split exports remain supported through
`loadMobileAgent` with `encoderPath` and `headPath`.

## Pixel 11 Pro verification path

1. Pin one licensed fused ONNX checkpoint and record its exact revision, artifact hashes, model
   size, and license. Keep model conversion tooling outside this TypeScript SDK.
2. Run the same questions through the reference and mobile runtimes. Record answers, probabilities,
   tolerances, and any mismatch before making performance claims.
3. Measure cold load, warm inference, peak memory, and sustained runs on the connected Pixel 11 Pro.
   Compare CPU, XNNPACK, and NNAPI with the same model and inputs; select from observed results.
4. Compare the fused graph with any split export using the same checkpoint. Keep the full encoder
   output in native memory for the fused path, then repeat parity and performance checks.
5. Explore the app's exact UI flow with ARTEMIS before authoring mobile automation tests.

The original [Laya project](https://github.com/NandhaKishorM/laya) and its published checkpoints
are Apache-2.0. The PixelKit Labs repository includes the license and a `NOTICE` crediting Convai
Innovations. Model files are distributed separately and retain their own license information.
