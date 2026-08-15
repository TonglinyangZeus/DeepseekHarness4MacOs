#!/bin/bash
# Assemble a distributable "DeepSeek Harness.app" from the current checkout.
#   node_modules/electron must be installed first (npm install).
# Output: ../DeepSeek Harness.app  (ad-hoc signed, arm64)
set -euo pipefail
cd "$(dirname "$0")/.."

APP="DeepSeek Harness.app"
ELECTRON="node_modules/electron/dist/Electron.app"
P=/usr/libexec/PlistBuddy

[ -x "$ELECTRON/Contents/MacOS/Electron" ] || { echo "missing electron binary — run: npm install" >&2; exit 1; }

rm -rf "$APP"
cp -R "$ELECTRON" "$APP"

mkdir -p "$APP/Contents/Resources/app"
cp main.js preload.js package.json "$APP/Contents/Resources/app/"
cp icon/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"

PL="$APP/Contents/Info.plist"
$P -c "Set :CFBundleName DeepSeek Harness" "$PL"
$P -c "Set :CFBundleDisplayName DeepSeek Harness" "$PL"
$P -c "Set :CFBundleIdentifier com.dsh.harness" "$PL"
$P -c "Set :CFBundleShortVersionString 1.0.0" "$PL"
$P -c "Set :CFBundleVersion 1.0.0" "$PL"
$P -c "Set :CFBundleIconFile AppIcon" "$PL"

codesign --force --deep --sign - "$APP"
echo "built: $APP"
