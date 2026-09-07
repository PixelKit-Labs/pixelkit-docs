# PixelKit Quickstart Guide
> **Developer Setup, Workstation Prerequisites, and Pixel 11 Pro Deployment**

This guide walks you through setting up your development workstation and launching PixelKit on your Google Pixel 11 Pro.

---

## Workstation Prerequisites

### 1. Node.js
* **Required**: Node.js `20.x` or higher (tested on Node `24.x`).
* **Verify**:
 ```bash
 node -v
 npm -v
 ```

### 2. Official Google Android CLI (`android.exe`)
The official Google Android CLI provides tools for SDK management, UI inspection (`android layout`), screenshots (`android screen`), and descriptive project metadata (`android describe`).

#### Installation:
* **Windows (PowerShell / CMD)**:
 ```cmd
 curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"
 ```
* **macOS (Apple Silicon)**:
 ```bash
 curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash
 ```
* **Linux (x86_64)**:
 ```bash
 curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
 ```
* **Verify Installation**:
 ```bash
 android --version
 ```

### 3. Claude Code Expo plugin (for agents)
This repo is written to be worked on by coding agents, and `.claude/settings.json` enables the official Expo plugin — the Expo skills and slash commands that the SDK 57 workflow here depends on. Enabling it in the repo does not install it on your machine; install it once per workstation:

```bash
claude plugin install expo@claude-plugins-official
```

It installs at user scope, so it applies to every project you open. Skip it if you are not driving this repo with Claude Code.

---

## Installation & Setup

1. **Clone or open the project repository**:
 ```bash
 cd "C:\Users\trave\Documents\Projects\Pixel delta"
 ```

2. **Install project dependencies**:
 ```bash
 npm install
 ```

3. **Verify strict TypeScript compilation**:
 ```bash
 npm run typecheck
 ```
 *Should exit with 0 errors.*

4. **Verify Metro Hermes bundling**:
 ```bash
 npx expo export -p android
 ```
 *Verifies that all 696 modules package cleanly into Hermes bytecode (`.hbc`).*

5. **Install / Sync Official Expo Agent Skills**:
 ```bash
 npx skills add expo/skills
 ```
 *Installs and locks 26 official Expo agent skills into `.agents/skills/` tracked via `skills-lock.json`.*

---

## Running on Google Pixel 11 Pro

### Method A: Over-the-Air via Expo Go (Fastest, JS-only hooks)
> Expo Go cannot load the project's native AI modules (Gemini Nano via ML Kit, Ranging, haptic envelopes). For those, use Method B (development build). `app.json` already includes `expo-dev-client`, `expo-audio`, and `expo-build-properties` (compileSdk/targetSdk 36, minSdk 26). Android 17's SDK is published as `platforms/android-37.0`; the AGP 8.12 in Expo 57 looks for `android-37` and fails, so stay on 36 until Expo ships an AGP with minor-SDK support.

> **Windows toolchain notes**: the project path contains a space ("Pixel delta"). Native builds are more reliable through a space-free junction, e.g. `cmd /c mklink /J C:\dev\pixel-delta "C:\Users\<you>\Documents\Projects\Pixel delta"`, then build from `C:\dev\pixel-delta\android`. Write `android/local.properties` with forward slashes (`sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`); backslashes are escape characters in Java properties files. Required SDK packages via the Android CLI: `android sdk install platform-tools "platforms/android-36" "build-tools/36.0.0" "ndk/27.1.12297006" "cmake/3.31.6"`, plus a JDK 17 (`winget install Microsoft.OpenJDK.17`).
1. Install **Expo Go** from the Google Play Store on your Pixel 11 Pro.
2. Start the local Metro development bundler:
 ```bash
 npm start
 ```
3. Point your Pixel 11 Pro camera at the QR code displayed in the terminal.
4. The app will bundle and stream over Wi-Fi with instant hot module reloading (Fast Refresh).

### Method B: Native Development Build (`android run`)
1. Enable **Developer Options** and **USB Debugging** on your Pixel 11 Pro.
2. Connect your phone via USB-C.
3. Verify connection:
 ```bash
 adb devices
 ```
4. Build and install directly to the device:
 ```bash
 npm run android
 ```

### Method C: Web Browser Preview & React Grab (Instant UI & Agent Prototyping)
To edit and preview UI components and layout immediately in your PC browser without connecting a phone:
1. Start the Metro web dev server:
 ```bash
 npm run web
 ```
2. Open `http://localhost:8081` in Chrome or Edge.
3. **React Grab (`react-grab`)**:
 - Hold **`Ctrl+C`** (Windows) or **`Cmd+C`** (macOS) and click any visual element on screen to copy its exact component name, file path, line number, and props directly to your clipboard.
 - Paste the snippet into your AI coding agent (Antigravity, Claude, Cursor) for instant targeted edits.
4. Use browser DevTools (F12) to inspect component layouts. On web, native-backed hooks report `source: 'unavailable'` and render `—`; nothing is substituted.

### Method D: With Local MCP Server for AI Agent Testing
To enable AI agent visual verification, automated screenshotting, and `testID` element inspection:
1. Start Metro with the local MCP server enabled:
 ```bash
 npm run start:mcp
 ```
2. Connected AI agents (Claude, Cursor, Antigravity) can now autonomously run `automation_take_screenshot`, `automation_tap`, `open_devtools`, and `collect_app_logs`.

---

## Environment Variables & API Keys

To use gemini-3.8-flash chat, vision and voice transcription:
1. Copy `.env.example` to `.env`:
 ```bash
 cp .env.example .env
 ```
2. Insert your Google Gemini API key:
 ```env
 EXPO_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
 ```
3. Alternatively, enter your key inside the app in the **AI Lab** tab. It is written through `useSecurity().saveSecureItem()`, which encrypts it with a key held in the StrongBox-backed Android Keystore, readable only while the device is unlocked and only on this phone.
