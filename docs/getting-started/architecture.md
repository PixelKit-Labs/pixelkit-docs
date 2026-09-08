# Pixel 11 Pro Silicon & System Architecture
> **What this device is, separated into what was read from it and what Google states**

This document outlines the hardware of the **Google Pixel 11 Pro** and how PixelKit reaches each layer. Figures marked **verified** were read from the device itself with `adb` and `dumpsys`; the rest are Google's published specification and are labelled as such, because a marketing figure is not a reading.

---

## Silicon Subsystem Overview

| Component | Chipset / Hardware | Key Specifications |
| :--- | :--- | :--- |
| **SoC** | Google Tensor G6 | `Build.SOC_MODEL` reports the part; the process node is not exposed by the device and is not claimed here |
| **CPU** | Custom 7-Core Cluster | 1x ARM C1-Ultra @ 4.11 GHz, 4x C-1 Pro @ 3.38 GHz, 2x C-1 Pro @ 2.65 GHz |
| **GPU** | PowerVR C-Series CXTP-48-1536 MC1 (verified via EGL) | OpenGL ES 3.2, Vulkan 1.4.317; 8.33 ms frame budget at 120 Hz |
| **TPU / NPU**| Google Tensor TPU | Reachable only through AICore (ML Kit GenAI) or LiteRT; there is no direct TPU handle for apps |
| **RAM** | LPDDR5X Unified | 12 GB (256GB models) or 16 GB (512GB / 1TB models) |
| **Security**| Android Keystore, StrongBox-backed (verified) | `useSecurity` stores secrets with classical AES; no post-quantum algorithm is used, and `isPostQuantumProtected` is always `false` |
| **Modem** | MediaTek M90 | Wi-Fi 7 (802.11be), 5G Sub-6/mmWave, Direct-to-Cell Satellite SOS |
| **Display** | LTPO OLED | Verified: 120 Hz active mode, rates 120/60/40/30/24/20/15/10/5/2/1 Hz, HDR10 · HLG · HDR10+, 1080x2410 render mode at 420 dpi. Peak luminance is whatever `useDisplay().maxLuminance` reports, which may be `null` |
| **Actuators**| Linear Resonant Actuator (LRA) | Precision mechanical tactile click profiles |
| **Visual Bar**| HiLight LED Ring | Rear camera bar multi-color notification & Gemini AI status ring |
| **Camera** | Triple Optical System | 50MP Wide, 48MP Ultrawide, 48MP 5x Periscope |
| **Spatial** | Ultra-Wideband (UWB) | Ranging & Angle-of-Arrival through the platform ranging service |
| **Power** | Pixelsnap Qi2.2 | 25W magnetic wireless charging (MagSafe accessory compatible) |

---

## Tensor G6 "Malibu" Microarchitecture

The Tensor G6 was engineered by Google's gChips team to resolve thermal dissipation constraints:

### 1. Asymmetrical 7-Core Topology
Unlike typical 8-core chips, the G6 drops one power-hungry core in favor of an optimized 1+4+2 layout:
* **1x ARM C1-Ultra Prime Core** (up to 4.11 GHz): Reserved for single-threaded bursts, UI transitions, and urgent interrupt handling.
* **4x ARM C-1 Pro Performance Cores** (up to 3.38 GHz): Executes heavy sustained multi-threading, image signal processing (ISP), and physics engines.
* **2x ARM C-1 Pro Efficiency Cores** (up to 2.65 GHz): Handles sensor telemetry loops, background timers, audio decibel polling, and idle standby.

### 2. Process node
The fabrication node is not readable from the device, so PixelKit does not report one. Treat any figure you see quoted for it as marketing, not telemetry.

### 3. MediaTek M90 Modem
Replaces previous Samsung Exynos modems, eliminating thermal buildup and drain during cellular standby. Adds Direct-to-Cell Satellite SOS support.

---

## Hardware-backed keystore and biometrics

What is verifiable from the device: `android.hardware.strongbox_keystore` is present, which is what `useCapabilities().hasStrongBox` reports and what makes `useSecurity` hardware-backed.

* **Hardware keystore**: StrongBox-backed key storage behind `useSecurity().saveSecureItem()`. The key never leaves the secure element; the app only ever handles ciphertext.
* **Biometric prompt**: the under-display fingerprint sensor and face unlock are reached through the platform `BiometricPrompt` in `useBiometrics`; the templates themselves are never exposed to apps.
* **Post-quantum**: Android 17 defines post-quantum key types, but SecureStore does not use them. PixelKit reports `isPostQuantumProtected: false` rather than claiming otherwise.

---

## HiLight Camera Bar Glanceable Notification System

Integrated into the camera flash visor, **HiLight** replaces the legacy infrared thermopile on the Pixel 11 Pro:
* **Face-Down Glanceable Mode**: Delivers glanceable status when the phone is resting on a desk.
* **Gemini AI Breathing Glow**: Cycles cyan light pulses while Google Gemini generates reasoning tokens.
* **Contact Color Alerts**: Custom color-coded pulses for VIP contacts and urgent alerts.

---

## React Native & Hermes Runtime Bridge

<!-- diagram: runtime-stack -->
