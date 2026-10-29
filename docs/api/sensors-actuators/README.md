# Sensors & Physical Actuators API Reference
> **6-Axis IMU & Barometer, Camera capture, Torch, and Linear Resonant Actuator Haptics**

This document covers physical sensors and mechanical actuation on the Pixel 11 Pro. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field, with type and meaning) and its **Functions** (what each callable takes and returns).

## Reference
<!-- hooks:start -->
| Hook | What it reads |
| :--- | :--- |
| [`useAltimeter`](./usealtimeter.md) | Precision barometric altimetry, vertical climb/descent velocity, and weather trends. |
| [`useCamera`](./usecamera.md) | Lens, zoom, flash and torch, plus taking photos and recording video. |
| [`useCameraExtensions`](./usecameraextensions.md) | Google computational photography vendor extensions (Night Sight, Ultra HDR, Portrait Bokeh). |
| [`useHaptics`](./usehaptics.md) | Vibration, from simple taps to custom-shaped waveforms. |
| [`useHealthConnect`](./usehealthconnect.md) | Health Connect availability and the device's step counter and heart rate sensors. Does not read health records. |
| [`useMicrophoneArray`](./usemicrophonearray.md) | Microphone inventory: position, orientation, directionality and location of each microphone the platform lists. |
| [`useSensors`](./usesensors.md) | Motion, orientation, air pressure and ambient light, streaming live. |
| [`useThermometer`](./usethermometer.md) | Discovery of the non-contact infrared temperature sensor on Google Pixel Pro hardware; temperatures stay null until a verified decoder exists. |
| [`useTorch`](./usetorch.md) | The rear flashlight, including variable brightness and an SOS strobe. |
<!-- hooks:end -->
