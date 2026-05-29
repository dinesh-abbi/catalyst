# CATALYST 🔋

Welcome to **Catalyst**—a high-performance, mobile fitness and fuel tracker constructed in a sleek, neo-technical brutalist aesthetic featuring pure OLED black (`#000000`) and high-contrast Acid Green (`#CCFF00`) visuals. 

This repository coordinates an Expo-based React Native mobile application utilizing React Native Reanimated, NativeWind, and Native Firebase services.

---

## ⚡ Quick Start & Development

To launch the development suite, follow these steps:

### 1. Synchronize Dependencies
Ensure packages are up to date:
```bash
npm install
```

### 2. Boot up Metro Bundler
Start the development bundler interface:
```bash
npm start
```

### 3. Mount on Device/Emulator
With a running Android Emulator or connected physical device in debug mode, compile and push the app:
```bash
npm run android
```

---

## 🛡️ Biometric Security Shield (FaceID / Fingerprint)

We have integrated a native **Biometric security shield** that wraps the application gateway, enforcing secure authorization.

### How it Works
1. **Enabling the Shield**: Navigate to your `USER_PROFILE` tab, scroll to the `// SECURITY_SHIELD` section, and toggle the `BIOMETRIC_LOCK` card. The app validates hardware capabilities and enrolled biometrics, prompting a secure validation check before locking state is activated.
2. **Cold App Locking**: The app requires a biometric scan immediately after the initial Cyberpunk launch screen completes.
3. **Background Minimization Lock**: Built using native `AppState` triggers. If the app is minimized (backgrounded) and returned to the foreground, it locks access instantly to guarantee absolute user privacy.

### How to Test in Development

#### A. On the Android Emulator:
1. Open the **Emulator's Extended Controls** (the three dots `...` on the emulator toolbar).
2. Navigate to **Fingerprint**.
3. Under Android settings inside the emulator, go to *Security & Location* -> *Fingerprint*, and set up a lock screen PIN and enroll a mock fingerprint.
4. Go to Catalyst Profile Settings -> toggle `BIOMETRIC_LOCK` on.
5. Simulating scans:
   - When the biometrics prompt appears, click **Touch Sensor** in the Emulator Fingerprint settings to simulate a successful match.
   - Click other fingerprint IDs to simulate validation failures and observe the Cyber Red (`#FF3300`) warning readouts.

#### B. On the iOS Simulator:
1. In the simulator window menu, navigate to **Features** -> **Face ID** or **Touch ID**.
2. Tick **Enrolled** to mimic device biometric enrollment.
3. Toggle the switch card in Catalyst.
4. When prompted for validation, go to simulator menu -> **Features** -> **Face ID** -> **Matching Face** to trigger a successful authentication.

---

## 🏗️ Production Android APK Builds

This project has been custom-configured for fast, offline, local release builds to bypass cloud constraints.

### Prerequisites (Local Compilation)
- **Java Home**: JDK 21 (OpenJDK `17`/`21`) must be defined.
- **Android SDK**: Correct environment variables defined inside `/android/local.properties`.
  ```properties
  sdk.dir=/usr/lib/android-sdk
  ```

---

### Method A: Direct Gradle Release (Offline APK)

The most robust way to build a standalone, offline installable `.apk` file that bypasses Expo cloud queues.

#### 1. Perform Prebuild Sync
If you modified native configurations (`app.json`, config plugins), clean and sync the Android folder first:
```bash
npx expo prebuild --platform android --clean
```

#### 2. Clean and Assemble
Move to the Android project folder, flush old split caches, and compile the final release assets:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

#### 3. Retrieve and Install APK
Your production-ready APK is compiled at:
```
android/app/build/outputs/apk/release/app-release.apk
```
Push the binary directly onto your connected device over ADB:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

### Method B: Standalone EAS Build (Cloud/Local)

To utilize Expo Application Services (EAS) for compiling:

* **Trigger EAS Cloud Compile (APK output)**:
  ```bash
  eas build -p android --profile production-apk
  ```
* **Trigger Local Machine EAS CLI Compile**:
  ```bash
  npx eas-cli build -p android --profile production --local
  ```

---

## 🛠️ Diagnostics & Cache Flush

If you encounter native Gradle MD5 hash or split memory exceptions (`IncrementalSplitterRunnable`) during builds, flush the local assembly cache and run fresh:

```bash
# Clean project
npx expo prebuild --clean
cd android
./gradlew cleanBuildCache
./gradlew assembleRelease
```

