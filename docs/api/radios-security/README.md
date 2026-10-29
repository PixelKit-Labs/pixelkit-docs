# Radios & Hardware Security API Reference
> **Android Keystore secure storage, Biometrics, Bluetooth LE, NFC, and Dual-Band GNSS**

This document covers wireless radios, near-field interactions, satellite positioning and hardware-backed secret storage on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

## Reference
<!-- hooks:start -->
| Hook | What it reads |
| :--- | :--- |
| [`useBiometrics`](./usebiometrics.md) | Fingerprint and face authentication. |
| [`useBLE`](./useble.md) | Bluetooth adapter state, Channel Sounding, bonded devices, and active BLE peripheral discovery. |
| [`useChannelSounding`](./usechannelsounding.md) | Bluetooth LE Channel Sounding availability and real ranging sessions against a Bluetooth peer. |
| [`useKeyAgreement`](./usekeyagreement.md) | ECDH session key derivation with a private key generated in the Android Keystore; the achieved security level is read from KeyInfo. |
| [`useLocation`](./uselocation.md) | Position, altitude, heading and speed from expo-location. |
| [`useNFC`](./usenfc.md) | Reading and writing real NFC tags through reader mode. |
| [`usePlayIntegrity`](./useplayintegrity.md) | Hardware security feature flags and Android Keystore key attestation. No Play Integrity verdict is produced. |
| [`usePrivateSpace`](./useprivatespace.md) | Whether the app process runs inside Android 15+'s Private Space profile. Existence of the profile is not readable from outside it. |
| [`useRadios`](./useradios.md) | Every radio subsystem in one read. |
| [`useSatelliteNTN`](./usesatellitentn.md) | Whether the device declares satellite messaging support. Connection state, carrier, signal and SOS readiness are not readable through Android's public API and are null. |
| [`useSecurity`](./usesecurity.md) | Encrypted storage for secrets, backed by hardware. |
| [`useWifi7MLO`](./usewifi7mlo.md) | Wi-Fi 7 (802.11be) Multi-Link Operation links: band, channel, RSSI, link speeds and state. |
| [`useWifiRTT`](./usewifirtt.md) | Fine Timing Measurement (FTM / 802.11mc) distance to Wi-Fi access points. |
<!-- hooks:end -->
