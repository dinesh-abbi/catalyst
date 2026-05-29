#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  build.sh  —  Catalyst Production APK Builder
#
#  Usage:
#    bash build.sh
#
#  What it does:
#    1. Validates environment (.env key, tools)
#    2. Installs / verifies JS dependencies
#    3. Runs Expo prebuild (generates native Android code)
#    4. Clears stale Gradle asset cache
#    5. Builds signed release APK via Gradle
#    6. Reports APK path and size
#
#  Output:
#    android/app/build/outputs/apk/release/app-release.apk
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
APK_OUT="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

header()  { echo -e "\n${BOLD}${CYAN}▶  $1${RESET}"; }
ok()      { echo -e "   ${GREEN}✔${RESET}  $1"; }
warn()    { echo -e "   ${YELLOW}⚠${RESET}  $1"; }
fail()    { echo -e "   ${RED}✘  $1${RESET}"; exit 1; }

echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   CATALYST  —  Production APK Build  ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"

cd "$PROJECT_ROOT"

# ── 1. Check required tools ───────────────────────────────────
header "Checking environment"

command -v node   >/dev/null 2>&1 || fail "node is not installed"
command -v npm    >/dev/null 2>&1 || fail "npm is not installed"
command -v java   >/dev/null 2>&1 || fail "java is not installed (need JDK 17+)"
command -v npx    >/dev/null 2>&1 || fail "npx is not installed"

ok "Node  $(node --version)"
ok "NPM   $(npm --version)"
ok "Java  $(java -version 2>&1 | head -1)"

# Check ANDROID_HOME
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  warn "ANDROID_HOME not set — Gradle will attempt to find SDK automatically"
else
  ok "Android SDK: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
fi

# ── 2. Validate .env ─────────────────────────────────────────
header "Checking API keys"

if [ ! -f ".env" ]; then
  fail ".env file not found. Create it with EXPO_PUBLIC_GEMINI_API_KEY=your_key"
fi

if grep -q "EXPO_PUBLIC_GEMINI_API_KEY=" .env; then
  KEY_VAL=$(grep "EXPO_PUBLIC_GEMINI_API_KEY=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
  if [ -z "$KEY_VAL" ] || [ "$KEY_VAL" = "your_key_here" ]; then
    fail "EXPO_PUBLIC_GEMINI_API_KEY is empty in .env"
  fi
  ok "EXPO_PUBLIC_GEMINI_API_KEY is set"
else
  fail "EXPO_PUBLIC_GEMINI_API_KEY missing from .env"
fi

# ── 3. Install JS dependencies ────────────────────────────────
header "Installing dependencies"

npm install --silent
ok "node_modules up to date"

# ── 4. Expo prebuild ─────────────────────────────────────────
header "Running Expo prebuild (generates native Android code)"
echo ""

npx expo prebuild --platform android --clean 2>&1 | \
  grep -E "(✔|✗|Cleared|Created|Running|Finished|error|warning)" || true

ok "Prebuild complete"

# ── 5. Clear stale Gradle asset cache ────────────────────────
header "Clearing stale asset cache"

STALE_RES="$PROJECT_ROOT/android/app/build/generated/res/createBundleReleaseJsAndAssets"
STALE_ASSETS="$PROJECT_ROOT/android/app/build/generated/assets/createBundleReleaseJsAndAssets"

[ -d "$STALE_RES" ]    && rm -rf "$STALE_RES"    && ok "Cleared res cache"    || true
[ -d "$STALE_ASSETS" ] && rm -rf "$STALE_ASSETS" && ok "Cleared assets cache" || true

# ── 6. Gradle release build ───────────────────────────────────
header "Building release APK (this takes 2-5 minutes)"
echo ""

cd "$PROJECT_ROOT/android"

./gradlew assembleRelease \
  --no-daemon \
  --console=plain \
  2>&1 | grep -E "^(>|BUILD|FAILURE|Task|Deprecated|w:|e:)" | \
  grep -v "^w: file://" | \
  head -60

# ── 7. Verify output ─────────────────────────────────────────
echo ""
header "Build result"

if [ -f "$APK_OUT" ]; then
  SIZE=$(du -sh "$APK_OUT" | cut -f1)
  echo ""
  echo -e "  ${GREEN}${BOLD}BUILD SUCCESSFUL ✅${RESET}"
  echo ""
  echo -e "  ${BOLD}APK path:${RESET}"
  echo "  $APK_OUT"
  echo ""
  echo -e "  ${BOLD}File size:${RESET} $SIZE"
  echo ""
  echo -e "  ${CYAN}To install on a connected device:${RESET}"
  echo "  adb install -r \"$APK_OUT\""
  echo ""
else
  fail "APK not found — check the Gradle output above for errors"
fi
