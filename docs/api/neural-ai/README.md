# Neural & AI API Reference
> **Gemini in the cloud, Gemini Nano on-device, ML Kit vision and language, speech in and out**

This document covers conversational reasoning, on-device generative tasks, speech recognition and synthesis, multimodal vision, and hardware-secured API key storage. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

## Reference
<!-- hooks:start -->
| Hook | What it reads |
| :--- | :--- |
| [`useAppFunctions`](./useappfunctions.md) | In-process registry and runner for device actions, plus a probe of the Android AppFunctions service. |
| [`useCloudHardwareAgent`](./usecloudhardwareagent.md) | Multi-turn Gemini tool-calling loop over the capability adapter you pass to each ask(). |
| [`useEmbeddings`](./useembeddings.md) | On-device text embeddings from a user-supplied TFLite model (MediaPipe TextEmbedder) and cosine similarity scoring. |
| [`useGemini`](./usegemini.md) | Cloud Gemini chat with real multi-turn history. |
| [`useGeminiLive`](./usegeminilive.md) | Bidirectional streaming of text, microphone audio chunks and camera frames with the Gemini Live API over a WebSocket, with tool calls routed through a capability adapter you supply. |
| [`useGeminiNano`](./usegemininano.md) | Gemini Nano running on the phone, with no network and no API key. |
| [`useGenAITasks`](./usegenaitasks.md) | Four focused text tasks that run locally: summarise, proofread, rewrite, describe. |
| [`useNaturalLanguageAI`](./usenaturallanguageai.md) | Translation, language detection, smart replies and entity extraction, running on the device. |
| [`useSpeech`](./usespeech.md) | Speaking text aloud with the voices the phone has installed. |
| [`useSpeechAI`](./usespeechai.md) | Turning speech into text, on the device or in the cloud. |
| [`useVisionAI`](./usevisionai.md) | Nine on-device vision capabilities, plus cloud scene understanding. |
<!-- hooks:end -->
