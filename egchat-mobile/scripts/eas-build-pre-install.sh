#!/bin/bash
# EAS Build Pre-Install Script
# This script runs BEFORE npm install and prebuild

set -e

echo "🔧 EAS Build Pre-Install: Preparing iOS directory..."

# Check if ios/ directory exists (it should be uploaded via .easignore)
if [ -d "ios" ]; then
  echo "✅ ios/ directory found"
  echo "📁 Contents:"
  ls -la ios/
  
  # Mark that we have a custom ios/ so prebuild should be skipped
  touch .expo-prebuild-skip
  echo "✅ Created .expo-prebuild-skip marker"
else
  echo "⚠️  ios/ directory not found - prebuild will run normally"
fi

echo "✅ Pre-install complete"
