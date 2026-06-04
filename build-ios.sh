#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# build-ios.sh — Script completo para compilar EGCHAT en Mac
# Ejecutar desde la raíz del proyecto: bash build-ios.sh
# ═══════════════════════════════════════════════════════════════════

set -e  # salir en cualquier error

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          EGCHAT iOS Build Script v3.1                   ║"
echo "║          Offline-First + SQLCipher + WebSocket           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Verificar herramientas requeridas ───────────────────────────

echo "▶ Verificando herramientas..."

check_tool() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ '$1' no encontrado. Instalar con: $2"
    exit 1
  else
    echo "  ✅ $1 $(${1} --version 2>&1 | head -1)"
  fi
}

check_tool "node"    "https://nodejs.org"
check_tool "npm"     "viene con Node.js"
check_tool "pod"     "sudo gem install cocoapods"
check_tool "xcodebuild" "instalar Xcode desde App Store"

NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null || true)
if [ $? -eq 1 ]; then
  echo "❌ Node.js 18+ requerido. Versión actual: $(node --version)"
  exit 1
fi

echo ""
echo "▶ Versiones detectadas:"
echo "  Node:       $(node --version)"
echo "  npm:        $(npm --version)"
echo "  CocoaPods:  $(pod --version)"
echo "  Xcode:      $(xcodebuild -version | head -1)"
echo ""

# ── 2. Instalar dependencias npm ───────────────────────────────────

echo "▶ Instalando dependencias npm..."
npm install --legacy-peer-deps
echo "  ✅ npm install completado"
echo ""

# ── 3. Build del frontend ──────────────────────────────────────────

echo "▶ Compilando frontend (Vite build)..."
npm run build
echo "  ✅ Build completado (dist/)"
echo ""

# ── 4. Sync Capacitor ─────────────────────────────────────────────

echo "▶ Sincronizando con Capacitor iOS..."
npx cap sync ios
echo "  ✅ Cap sync completado"
echo ""

# ── 5. Instalar Pods ──────────────────────────────────────────────

echo "▶ Instalando CocoaPods (puede tardar 3-5 min la primera vez)..."
cd ios/App
pod install --repo-update
cd ../..
echo "  ✅ Pod install completado"
echo ""

# ── 6. Verificar workspace ────────────────────────────────────────

WORKSPACE="ios/App/App.xcworkspace"
if [ ! -d "$WORKSPACE" ]; then
  echo "❌ No se encontró $WORKSPACE"
  echo "   Verifica que pod install terminó correctamente"
  exit 1
fi

echo "  ✅ Workspace encontrado: $WORKSPACE"
echo ""

# ── 7. Abrir en Xcode ────────────────────────────────────────────

echo "▶ Abriendo en Xcode..."
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  PASOS MANUALES EN XCODE:                               ║"
echo "║                                                          ║"
echo "║  1. Signing & Capabilities:                             ║"
echo "║     → Team: tu Apple Developer Team                    ║"
echo "║     → Bundle ID: com.egchat.app                        ║"
echo "║     → Signing Certificate: iOS Distribution            ║"
echo "║                                                          ║"
echo "║  2. Capabilities (añadir si no están):                 ║"
echo "║     → Push Notifications ✓                             ║"
echo "║     → Background Modes ✓                               ║"
echo "║       - Background fetch ✓                             ║"
echo "║       - Remote notifications ✓                         ║"
echo "║     → Keychain Sharing ✓ (para SecureStorage)          ║"
echo "║                                                          ║"
echo "║  3. Build Settings:                                     ║"
echo "║     → Deployment Target: iOS 14.0                      ║"
echo "║     → Version: 2.5.4                                    ║"
echo "║     → Build: 7                                          ║"
echo "║                                                          ║"
echo "║  4. Para IPA de producción:                             ║"
echo "║     → Product → Archive                                 ║"
echo "║     → Organizer → Distribute App                       ║"
echo "║       - App Store Connect (para App Store)              ║"
echo "║       - Ad Hoc (para distribución directa)             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

open "$WORKSPACE"
echo "  ✅ Xcode abierto con App.xcworkspace"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Script completado. Sigue los pasos manuales en Xcode."
echo "═══════════════════════════════════════════════════════════"
echo ""
