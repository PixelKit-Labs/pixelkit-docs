# Radios & Hardware Security API Reference
> **Android Keystore secure storage, Biometrics, Bluetooth LE, NFC, and Dual-Band GNSS**

This document covers wireless radios, near-field interactions, satellite positioning and hardware-backed secret storage on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

## Reference
<!-- hooks:start -->
| Hook | What it reads |
| :--- | :--- |
| [`useBiometrics`](./usebiometrics.md) | Fingerprint and face authentication. |
| [`useBLE`](./useble.md) | Bluetooth adapter state, Channel Sounding, bonded devices, and active BLE peripheral discovery. |
| [`useChannelSounding`](./usechannelsounding.md) | Bluetooth Core 6.0 high-accuracy centimeter-precision Phase-Based Ranging (PBR). |
| [`useKeyAgreement`](./usekeyagreement.md) | Hardware-isolated Elliptic Curve Diffie-Hellman session key derivation via Titan M2. |
| [`useLocation`](./uselocation.md) | Position, altitude, heading and speed from the satellite receiver. |
| [`useNFC`](./usenfc.md) | Reading and writing real NFC tags through reader mode. |
| [`usePlayIntegrity`](./useplayintegrity.md) | Hardware Key Attestation and Google Play Integrity verdicts via Titan M2. |
| [`usePrivateSpace`](./useprivatespace.md) | Android 15+ Private Space profile isolation detection and vault policy. |
| [`useRadios`](./useradios.md) | Every radio subsystem in one read. |
| [`useSatelliteNTN`](./usesatellitentn.md) | 3GPP Release-17 Non-Terrestrial Network (satellite SOS) status and alignment telemetry. |
| [`useSecurity`](./usesecurity.md) | Encrypted storage for secrets, backed by hardware. |
| [`useWifi7MLO`](./usewifi7mlo.md) | Wi-Fi 7 (802.11be) Multi-Link Operation and 320 MHz channel telemetry. |
| [`useWifiRTT`](./usewifirtt.md) | Fine Timing Measurement (FTM / 802.11az) indoor centimeter-level positioning. |
<!-- hooks:end -->
