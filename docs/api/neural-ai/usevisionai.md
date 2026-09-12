# useVisionAI

**Source:** [packages/sdk/src/ai/useVisionAI.ts](https://github.com/PixelKit-Labs/pixelkit-sdk/blob/master/packages/sdk/src/ai/useVisionAI.ts)

Google ML Kit on-device computer vision plus Gemini multimodal scene understanding in one hook.

* **Text Recognition v2 (OCR)** — structured text blocks and lines, on-device.
* **Barcode & QR scanning** — 1D and 2D formats, on-device.
* **Image labelling** — visual entity and scene classification, on-device.
* **Face detection & 3D mesh** — landmarks, smile and eye-open probabilities, 468-point meshes, on-device.
* **Object detection & tracking** — bounding boxes with tracking ids, on-device.
* **Pose detection** — 33 skeletal landmarks, on-device.
* **Selfie & subject segmentation** — foreground and background masks, on-device.
* **Digital ink recognition** — handwriting from stroke data, on-device.
* **Gemini scene analysis** — a two-sentence description and 3–5 labels, via the cloud with a JSON schema. Every on-device function takes the same `imageInput`: **a file URI or a base64 image string**. The cloud path needs base64, which is why `pickImage` requests it.

## Signature
```typescript
function useVisionAI(): {
 isAnalyzing: boolean;
 analysis: VisionAnalysisResult | null;
 selectedImageUri: string | null;
 selectedImageBase64: string | null;
 model: string;
 isOnDeviceProcessing: boolean;
 barcodeResult: BarcodeScanResult | null; ocrResult: TextRecognitionResult | null;
 facesResult: FaceDetectionResult | null; faceMeshResult: FaceMeshResult | null;
 labelsResult: ImageLabelResult | null; objectsResult: ObjectDetectionResult | null;
 poseResult: PoseDetectionResult | null; selfieResult: SelfieSegmentationResult | null;
 subjectResult: SubjectSegmentationResult | null; digitalInkResult: DigitalInkResult | null;
 error: string | null; source: TelemetrySource;
 pickImage: (useCamera?: boolean) => Promise<{ uri: string; base64?: string } | null>;
 captureAndAnalyze: (useCamera?: boolean) => Promise<VisionAnalysisResult | null>;
 scanBarcodes: (imageInput: string) => Promise<BarcodeScanResult | null>;
 recognizeText: (imageInput: string) => Promise<TextRecognitionResult | null>;
 detectFaces: (imageInput: string) => Promise<FaceDetectionResult | null>;
 detectFaceMesh: (imageInput: string) => Promise<FaceMeshResult | null>;
 labelImage: (imageInput: string) => Promise<ImageLabelResult | null>;
 detectObjects: (imageInput: string) => Promise<ObjectDetectionResult | null>;
 detectPose: (imageInput: string) => Promise<PoseDetectionResult | null>;
 segmentSelfie: (imageInput: string) => Promise<SelfieSegmentationResult | null>;
 segmentSubject: (imageInput: string) => Promise<SubjectSegmentationResult | null>;
 recognizeDigitalInk: (strokes: Array<Array<{ x: number; y: number; t?: number }>>, languageTag?: string) => Promise<DigitalInkResult | null>;
};
```

## Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `isAnalyzing` | `boolean` | `true` while the cloud analysis is in flight. |
| `analysis` | `VisionAnalysisResult \| null` | Gemini's answer: `{ description, labels, latencyMs, timestamp }`. |
| `selectedImageUri` | `string \| null` | File URI of the image last picked or captured. |
| `selectedImageBase64` | `string \| null` | The same image as base64, which is what the model calls consume. |
| `model` | `string` | Cloud model used for scene analysis. |
| `isOnDeviceProcessing` | `boolean` | `true` while any ML Kit call is running. They share one flag. |
| `barcodeResult` | `BarcodeScanResult \| null` | `{ barcodes: [{ rawValue, displayValue, format, valueType, boundingBox }], latencyMs, source }`. |
| `ocrResult` | `TextRecognitionResult \| null` | `{ text, blocks: [{ text, lines, boundingBox }], latencyMs, source }`. |
| `facesResult` | `FaceDetectionResult \| null` | `{ faces: [{ trackingId, smilingProbability, leftEyeOpenProbability, rightEyeOpenProbability, headEulerAngleX/Y/Z, boundingBox }], latencyMs, source }`; probabilities are `null` when classification is off. |
| `faceMeshResult` | `FaceMeshResult \| null` | `{ meshes, latencyMs, source }` — 468 3D contour points per close-range face. |
| `labelsResult` | `ImageLabelResult \| null` | `{ labels: [{ text, confidence, index }], latencyMs, source }`. |
| `objectsResult` | `ObjectDetectionResult \| null` | `{ objects: [{ trackingId, boundingBox, labels }], latencyMs, source }`. |
| `poseResult` | `PoseDetectionResult \| null` | `{ landmarks: [{ type, x, y, inFrameLikelihood }], latencyMs, source }` — 33 landmarks. |
| `selfieResult` | `SelfieSegmentationResult \| null` | `{ width, height, latencyMs, source }` — mask dimensions. |
| `subjectResult` | `SubjectSegmentationResult \| null` | `{ subjectsCount, foregroundConfidence, latencyMs, source }`. |
| `digitalInkResult` | `DigitalInkResult \| null` | `{ candidates: [{ text, score }], latencyMs, source }`, best candidate first. |
| `error` | `string \| null` | Why the last call failed, including the "no API key" message for the cloud path. |
| `source` | `TelemetrySource` | `'hardware'` when the PixelNano module is present, `'unavailable'` otherwise. |

## Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `pickImage(useCamera?)` | `useCamera?: boolean` — `true` opens the camera (requesting permission), `false` opens the library; default `true` | `Promise<{ uri, base64? } \| null>` — `null` when the user cancelled or permission was refused | Picks an image at 0.8 quality with base64 included, storing it in `selectedImageUri` and `selectedImageBase64`. |
| `captureAndAnalyze(useCamera?)` | `useCamera?: boolean` — as above, default `true` | `Promise<VisionAnalysisResult \| null>` — `{ description, labels, latencyMs, timestamp }`, or `null` when cancelled, unconfigured or failed | Picks an image, then asks Gemini for a two-sentence description and 3–5 labels using a JSON schema so the reply parses reliably. |
| `scanBarcodes(imageInput)` | `imageInput: string` — file URI or base64 | `Promise<BarcodeScanResult \| null>` — `null` on failure with `error` set | Decodes 1D and 2D barcodes including QR, on-device. |
| `recognizeText(imageInput)` | `imageInput: string` | `Promise<TextRecognitionResult \| null>` | OCR with block and line structure preserved. |
| `detectFaces(imageInput)` | `imageInput: string` | `Promise<FaceDetectionResult \| null>` | Faces with tracking ids, head angles and smile/eye probabilities. |
| `detectFaceMesh(imageInput)` | `imageInput: string` | `Promise<FaceMeshResult \| null>` | 468-point 3D mesh; needs a close-range face. |
| `labelImage(imageInput)` | `imageInput: string` | `Promise<ImageLabelResult \| null>` | Classifies entities and scenes with confidences. |
| `detectObjects(imageInput)` | `imageInput: string` | `Promise<ObjectDetectionResult \| null>` | Bounding boxes with tracking ids and labels. |
| `detectPose(imageInput)` | `imageInput: string` | `Promise<PoseDetectionResult \| null>` | 33 skeletal landmarks with in-frame likelihoods. |
| `segmentSelfie(imageInput)` | `imageInput: string` | `Promise<SelfieSegmentationResult \| null>` | Foreground portrait mask. |
| `segmentSubject(imageInput)` | `imageInput: string` | `Promise<SubjectSegmentationResult \| null>` | Separates subjects from the background. |
| `recognizeDigitalInk(strokes, languageTag?)` | `strokes: Array<Array<{ x: number; y: number; t?: number }>>` — one array per stroke, points in order, `t` an optional timestamp in ms. `languageTag?: string` — recogniser language, e.g. `'en-US'`. | `Promise<DigitalInkResult \| null>` | Recognises handwriting from stroke data, best candidate first. |
