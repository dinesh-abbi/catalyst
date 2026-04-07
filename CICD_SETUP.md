# CI/CD and Deployment Guide (Future Setup)

This document provides a step-by-step guide for setting up an automated CI/CD pipeline for the **Catalyst** project using **Expo Application Services (EAS)** and **GitHub Actions**.

## 1. Initial Local Setup

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```
2.  **Login to Expo**:
    ```bash
    eas login
    ```
3.  **Configure Project**:
    ```bash
    eas build:configure
    ```
    This will create an `eas.json` file in your root directory.

## 2. Recommended `eas.json` Configuration

Add these build profiles to your generated `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

*   **`development`**: Creates a custom Development Client to test native changes.
*   **`preview`**: Generates a downloadable **APK** for direct testing.
*   **`production`**: Generates a Google Play Store-ready **AAB** file.

## 3. Handling Sensitive Files (Secrets)

The `google-services.json` file should **not** be committed to public repositories. 

1.  Add to `.gitignore`:
    ```text
    android/app/google-services.json
    ```
2.  Upload as an **EAS Secret**:
    ```bash
    eas secret:create --name GOOGLE_SERVICES_JSON_BASE64 --value $(base64 -i ./android/app/google-services.json)
    ```

## 4. GitHub Actions Automation

Create a file at `.github/workflows/preview.yml` to automate builds on every push to `main`:

```yaml
name: Preview Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm install

      - name: Build Preview APK
        run: eas build --profile preview --platform android --non-interactive
```

## 5. Deployment Commands

*   **Build an APK for Testing**:
    ```bash
    eas build --profile preview --platform android
    ```
*   **Build & Submit to Google Play Store**:
    ```bash
    eas build --profile production --platform android --auto-submit
    ```

---

> [!TIP]
> **Keystore Backup**: When you run your first build, Expo will manage your Android Keystore. You can back it up later with `eas credentials`.

> [!WARNING]
> **New Architecture**: Ensure your CI environment uses **Java 17 or higher** and matching SDK versions to compile the New Architecture (`newArchEnabled: true`).
