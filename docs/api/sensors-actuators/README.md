# Sensors & Physical Actuators API Reference
> **6-Axis IMU & Barometer, Camera capture, Torch, and Linear Resonant Actuator Haptics**

This document covers physical sensors and mechanical actuation on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

## Reference

| | |
| :--- | :--- |
| [`useSensors`](./usesensors.md) | Motion, orientation, air pressure and ambient light, streaming live. |
| [`useHealthConnect`](./usehealthconnect.md) | Platform health records, steps, and sensor vitals telemetry. |
| [`useCamera`](./usecamera.md) | Lens, zoom, flash and torch, plus taking photos and recording video. |
| [`useCameraExtensions`](./usecameraextensions.md) | Google computational photography vendor extensions (Night Sight, Ultra HDR, Portrait Bokeh). |
| [`useTorch`](./usetorch.md) | The rear flashlight, including variable brightness and an SOS strobe. |
| [`useHaptics`](./usehaptics.md) | Vibration, from simple taps to custom-shaped waveforms. |
