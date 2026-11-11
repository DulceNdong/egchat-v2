#!/bin/sh

# ci_pre_xcodebuild.sh
# Este script se ejecuta ANTES de que Xcode Cloud compile el proyecto.
# Instala Node.js, dependencias npm y genera el bundle JS.

set -e

echo "=== EGCHAT - Pre-Build Script ==="
echo "CI_WORKSPACE: $CI_WORKSPACE"
echo "CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"

# --- Instalar Homebrew (si no está disponible) ---
if ! command -v brew &> /dev/null; then
  echo "Instalando Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# --- Instalar Node.js via Homebrew ---
echo "Instalando Node.js..."
brew install node@20 || true
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

node --version
npm --version

# --- Instalar dependencias del proyecto React Native ---
echo "Instalando dependencias npm..."
cd "$CI_PRIMARY_REPOSITORY_PATH/egchat-mobile"
npm ci --legacy-peer-deps

# --- Generar el bundle JS para iOS ---
echo "Generando bundle JS..."
npx expo export:embed \
  --platform ios \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/assets \
  --dev false || \
npx react-native bundle \
  --platform ios \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/assets \
  --dev false

echo "=== Pre-Build Script completado ==="
