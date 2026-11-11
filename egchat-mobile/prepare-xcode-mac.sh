#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Preparing EGCHAT for Xcode on macOS..."

if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: Node.js/npm are required on the Mac."
  exit 1
fi

npm install
npx expo prebuild --platform ios

if [ -d ios ]; then
  cd ios
  if command -v pod >/dev/null 2>&1; then
    pod install
  else
    echo "CocoaPods is not installed. Install with: sudo gem install cocoapods"
  fi

  workspace="$(find . -maxdepth 1 -name '*.xcworkspace' | head -n 1)"
  project="$(find . -maxdepth 1 -name '*.xcodeproj' | head -n 1)"

  if [ -n "$workspace" ]; then
    open "$workspace"
  elif [ -n "$project" ]; then
    open "$project"
  else
    echo "iOS project generated, but no Xcode workspace/project was found."
  fi
fi
