#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  build.sh  —  Catalyst Production APK Builder  (Deluxe Edition)
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

# ── Colours & styles ─────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BLUE='\033[0;34m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
GREEN_BG='\033[42m'

# ── Global timers ───────────────────────────────────────────
SCRIPT_START=$(date +%s)
STEP_START=0
TOTAL_STEPS=6
CURRENT_STEP=0

# ── Helpers: time formatting ───────────────────────────────
fmt_elapsed() {
  local secs=$1
  local m=$((secs / 60))
  local s=$((secs % 60))
  if [ "$m" -gt 0 ]; then
    printf "%dm %ds" "$m" "$s"
  else
    printf "%ds" "$s"
  fi
}

# ── Helpers: spinner ────────────────────────────────────────
# Runs a command in the background and shows a spinner + elapsed time
# until it finishes. Captures output to a temp log file.
SPINNER_FRAMES=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

run_with_spinner() {
  local label="$1"; shift
  local logfile
  logfile="$(mktemp)"
  local start
  start=$(date +%s)

  ("$@") >"$logfile" 2>&1 &
  local pid=$!

  local i=0
  tput civis 2>/dev/null || true
  while kill -0 "$pid" 2>/dev/null; do
    local frame="${SPINNER_FRAMES[$((i % ${#SPINNER_FRAMES[@]}))]}"
    local now elapsed
    now=$(date +%s)
    elapsed=$(fmt_elapsed $((now - start)))
    printf "\r   ${CYAN}%s${RESET}  %s  ${DIM}[%s]${RESET}   " "$frame" "$label" "$elapsed"
    i=$((i + 1))
    sleep 0.08
  done
  tput cnorm 2>/dev/null || true

  wait "$pid"
  local exit_code=$?
  local now elapsed
  now=$(date +%s)
  elapsed=$(fmt_elapsed $((now - start)))

  if [ $exit_code -eq 0 ]; then
    printf "\r   ${GREEN}✔${RESET}  %s  ${DIM}[%s]${RESET}%-10s\n" "$label" "$elapsed" ""
  else
    printf "\r   ${RED}✘${RESET}  %s  ${DIM}[%s]${RESET}%-10s\n" "$label" "$elapsed" ""
    echo ""
    echo -e "   ${RED}${BOLD}— output —${RESET}"
    sed 's/^/   /' "$logfile" | tail -40
    rm -f "$logfile"
    exit 1
  fi

  LAST_LOG="$logfile"
  return 0
}

# ── Helpers: progress bar for steps ──────────────────────────
progress_bar() {
  local step=$1
  local total=$2
  local width=30
  local filled=$(( step * width / total ))
  local empty=$(( width - filled ))
  local bar=""
  local k
  for ((k=0; k<filled; k++)); do bar+="█"; done
  for ((k=0; k<empty; k++)); do bar+="░"; done
  local pct=$(( step * 100 / total ))
  printf "${DIM}[${RESET}${MAGENTA}%s${RESET}${DIM}]${RESET} ${BOLD}%3d%%${RESET}" "$bar" "$pct"
}

header() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  STEP_START=$(date +%s)
  echo ""
  echo -e "${DIM}┌──────────────────────────────────────────────────────────┐${RESET}"
  printf "${DIM}│${RESET} ${BOLD}${CYAN}▶ Step %d/%d${RESET}  %-38s ${DIM}│${RESET}\n" "$CURRENT_STEP" "$TOTAL_STEPS" "$1"
  printf "${DIM}│${RESET} %s ${DIM}│${RESET}\n" "$(progress_bar $CURRENT_STEP $TOTAL_STEPS)"
  echo -e "${DIM}└──────────────────────────────────────────────────────────┘${RESET}"
}

step_done() {
  local now elapsed
  now=$(date +%s)
  elapsed=$(fmt_elapsed $((now - STEP_START)))
  echo -e "   ${DIM}↳ step completed in ${elapsed}${RESET}"
}

ok()      { echo -e "   ${GREEN}✔${RESET}  $1"; }
warn()    { echo -e "   ${YELLOW}⚠${RESET}  $1"; }
fail()    {
  echo -e "   ${RED}✘  $1${RESET}"
  echo ""
  echo -e "${RED}${BOLD}  ╔══════════════════════════════════════╗${RESET}"
  echo -e "${RED}${BOLD}  ║          BUILD ABORTED  ✘             ║${RESET}"
  echo -e "${RED}${BOLD}  ╚══════════════════════════════════════╝${RESET}"
  exit 1
}
info()    { echo -e "   ${BLUE}ℹ${RESET}  $1"; }

# ── Animated banner ─────────────────────────────────────────
clear 2>/dev/null || true
echo -e "${BOLD}${CYAN}"
echo "  ╔════════════════════════════════════════════════════════╗"
echo "  ║                                                        ║"
echo "  ║     ⚡  C A T A L Y S T   B U I L D   S Y S T E M  ⚡     ║"
echo "  ║                                                        ║"
echo "  ║              Production APK Builder                  ║"
echo "  ║                                                        ║"
echo "  ╚════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo -e "   ${DIM}started at $(date '+%Y-%m-%d %H:%M:%S')${RESET}"

cd "$PROJECT_ROOT"

# ── 1. Check required tools ───────────────────────────────────
header "Checking environment"

command -v node   >/dev/null 2>&1 || fail "node is not installed"
command -v npm    >/dev/null 2>&1 || fail "npm is not installed"
command -v java   >/dev/null 2>&1 || fail "java is not installed (need JDK 17+)"
command -v npx    >/dev/null 2>&1 || fail "npx is not installed"

# Auto-detect and set JAVA_HOME if default java is version 25 (unsupported by Kotlin DSL parsing in Gradle)
# or if JAVA_HOME is not set but compatible JDKs are available.
DEFAULT_JAVA_VER=$(java -version 2>&1 | head -1)
if [ -z "$JAVA_HOME" ] || [[ "$DEFAULT_JAVA_VER" == *"25."* ]]; then
  for jdk_path in "/usr/lib/jvm/java-1.21.0-openjdk-amd64" "/usr/lib/jvm/java-21-openjdk-amd64" "/usr/lib/jvm/java-1.17.0-openjdk-amd64" "/usr/lib/jvm/java-17-openjdk-amd64"; do
    if [ -d "$jdk_path" ]; then
      export JAVA_HOME="$jdk_path"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
fi

# Auto-detect Android SDK if not set
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  for sdk_path in "/usr/lib/android-sdk" "$HOME/Android/Sdk" "$HOME/android-sdk"; do
    if [ -d "$sdk_path" ]; then
      export ANDROID_HOME="$sdk_path"
      export ANDROID_SDK_ROOT="$sdk_path"
      break
    fi
  done
fi

ok "Node  $(node --version)"
ok "NPM   $(npm --version)"

if [ -n "$JAVA_HOME" ]; then
  ok "Java  $("$JAVA_HOME/bin/java" -version 2>&1 | head -1) ${DIM}(forced via JAVA_HOME)${RESET}"
else
  ok "Java  $(java -version 2>&1 | head -1)"
fi

if [ -z "$ANDROID_HOME" ]; then
  warn "ANDROID_HOME not set — Gradle will attempt to find SDK automatically"
else
  ok "Android SDK: $ANDROID_HOME"
fi
step_done

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
  MASKED_KEY="${KEY_VAL:0:4}••••••••${KEY_VAL: -4}"
  ok "EXPO_PUBLIC_GEMINI_API_KEY is set  ${DIM}(${MASKED_KEY})${RESET}"
else
  fail "EXPO_PUBLIC_GEMINI_API_KEY missing from .env"
fi
step_done

# ── 3. Install JS dependencies ────────────────────────────────
header "Installing dependencies"

run_with_spinner "Running npm install" npm install --silent
ok "node_modules up to date"
step_done

# ── 4. Expo prebuild ─────────────────────────────────────────
header "Running Expo prebuild (generates native Android code)"

run_with_spinner "Generating native Android project" npx expo prebuild --platform android --clean
grep -E "(✔|✗|Cleared|Created|Running|Finished|error|warning)" "$LAST_LOG" | sed 's/^/   /' || true
rm -f "$LAST_LOG"
ok "Prebuild complete"
step_done

# ── 5. Clear stale Gradle asset cache ────────────────────────
header "Clearing stale asset cache"

STALE_RES="$PROJECT_ROOT/android/app/build/generated/res/createBundleReleaseJsAndAssets"
STALE_ASSETS="$PROJECT_ROOT/android/app/build/generated/assets/createBundleReleaseJsAndAssets"

[ -d "$STALE_RES" ]    && rm -rf "$STALE_RES"    && ok "Cleared res cache"    || info "No stale res cache found"
[ -d "$STALE_ASSETS" ] && rm -rf "$STALE_ASSETS" && ok "Cleared assets cache" || info "No stale assets cache found"
step_done

# ── 6. Gradle release build ───────────────────────────────────
header "Building release APK (this takes 2-5 minutes)"

cd "$PROJECT_ROOT/android"

GRADLE_LOG="$(mktemp)"
(
  ./gradlew assembleRelease --no-daemon --console=plain
) >"$GRADLE_LOG" 2>&1 &
GRADLE_PID=$!

i=0
GRADLE_START=$(date +%s)
tput civis 2>/dev/null || true
LAST_TASK=""
while kill -0 "$GRADLE_PID" 2>/dev/null; do
  frame="${SPINNER_FRAMES[$((i % ${#SPINNER_FRAMES[@]}))]}"
  now=$(date +%s)
  elapsed=$(fmt_elapsed $((now - GRADLE_START)))
  CUR_TASK=$(grep -E "^> Task" "$GRADLE_LOG" 2>/dev/null | tail -1 | sed 's/> Task //')
  if [ -n "$CUR_TASK" ]; then LAST_TASK="$CUR_TASK"; fi
  printf "\r   ${CYAN}%s${RESET}  Gradle building...  ${DIM}[%s]${RESET}  %-45s" "$frame" "$elapsed" "${LAST_TASK:0:45}"
  i=$((i + 1))
  sleep 0.08
done
tput cnorm 2>/dev/null || true

wait "$GRADLE_PID"
GRADLE_EXIT=$?
now=$(date +%s)
elapsed=$(fmt_elapsed $((now - GRADLE_START)))

if [ $GRADLE_EXIT -eq 0 ]; then
  printf "\r   ${GREEN}✔${RESET}  Gradle build finished  ${DIM}[%s]${RESET}%-50s\n" "$elapsed" ""
else
  printf "\r   ${RED}✘${RESET}  Gradle build failed  ${DIM}[%s]${RESET}%-50s\n" "$elapsed" ""
fi

echo ""
echo -e "   ${DIM}— relevant Gradle output —${RESET}"
grep -E "^(>|BUILD|FAILURE|Task|Deprecated|w:|e:)" "$GRADLE_LOG" | \
  grep -v "^w: file://" | \
  sed 's/^/   /' | \
  head -60
rm -f "$GRADLE_LOG"

if [ $GRADLE_EXIT -ne 0 ]; then
  fail "Gradle build failed — check the output above for errors"
fi
step_done

# ── 7. Verify output ─────────────────────────────────────────
echo ""
TOTAL_NOW=$(date +%s)
TOTAL_ELAPSED=$(fmt_elapsed $((TOTAL_NOW - SCRIPT_START)))

if [ -f "$APK_OUT" ]; then
  SIZE=$(du -sh "$APK_OUT" | cut -f1)
  echo -e "${GREEN}${BOLD}"
  echo "  ╔════════════════════════════════════════════════════════╗"
  echo "  ║                                                        ║"
  echo "  ║              BUILD SUCCESSFUL  ✅                     ║"
  echo "  ║                                                        ║"
  echo "  ╚════════════════════════════════════════════════════════╝"
  echo -e "${RESET}"
  echo -e "  ${BOLD}APK path${RESET}"
  echo "  $APK_OUT"
  echo ""
  echo -e "  ${BOLD}File size${RESET}      ${MAGENTA}$SIZE${RESET}"
  echo -e "  ${BOLD}Total time${RESET}     ${MAGENTA}$TOTAL_ELAPSED${RESET}"
  echo ""
  echo -e "  ${CYAN}To install on a connected device:${RESET}"
  echo "  adb install -r \"$APK_OUT\""
  echo ""
else
  fail "APK not found — check the Gradle output above for errors"
fi