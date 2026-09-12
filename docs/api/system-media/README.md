# System & Media API Reference
> **Microphone capture and metering, display, power, media library, and the modem**

This document covers system telemetry, media capture and playback, power and the wireless modem. Each entry documents its **Inputs** (arguments, with defaults and units), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

## Reference

| | |
| :--- | :--- |
| [`useAudio`](./useaudio.md) | Microphone recording with levels and input choice, plus playback. |
| [`useSpatialAudio`](./usespatialaudio.md) | Android Spatializer status, binaural rendering, and dynamic head tracking telemetry. |
| [`useCapabilities`](./usecapabilities.md) | What this particular phone actually has. |
| [`useDisplay`](./usedisplay.md) | Refresh rate, HDR capability, brightness and the screen wake lock. |
| [`useDevice`](./usedevice.md) | Device identity, battery level, thermistor temperature, voltage, current, and wattage. |
| [`useNetwork`](./usenetwork.md) | Connection type, address and whether traffic actually goes anywhere. |
| [`useVideo`](./usevideo.md) | Playing video back, with position, seeking and thumbnails. |
| [`useMediaLibrary`](./usemedialibrary.md) | Saving captures to the gallery, and reading what is there. |
| [`useCellular`](./usecellular.md) | Carrier, radio generation and network codes from the modem. |
