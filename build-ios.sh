#!/bin/bash
# ============================================================
# build-ios.sh — Prepara el proyecto iOS de EGCHAT para Xcode
# Ejecutar en Mac: bash build-ios.sh
# ============================================================

set -e  # Parar si hay error

echo ""
echo "🍎 EGCHAT — Preparando proyecto iOS para Xcode"
echo "================================================"

# 1. Instalar dependencias
echo ""
echo "📦 [1/5] Instalando dependencias npm..."
npm install

# 2. Build del frontend
echo ""
echo "🔨 [2/5] Compilando frontend (vite build)..."
npm run build

# 3. Añadir plataforma iOS si no existe
echo ""
echo "📱 [3/5] Configurando plataforma iOS..."
if [ ! -d "ios/App/App.xcworkspace" ]; then
  npx cap add ios
  echo "✅ Plataforma iOS añadida"
else
  echo "✅ Plataforma iOS ya existe"
fi

# 4. Sincronizar assets web con iOS
echo ""
echo "🔄 [4/5] Sincronizando assets con iOS..."
npx cap sync ios

# 5. Instalar pods de CocoaPods
echo ""
echo "🍫 [5/5] Instalando CocoaPods..."
cd ios/App
pod install --repo-update
cd ../..

echo ""
echo "✅ ¡Proyecto iOS listo!"
echo ""
echo "📂 Abre Xcode con:"
echo "   open ios/App/App.xcworkspace"
echo ""
echo "📋 Pasos en Xcode:"
echo "   1. Selecciona el target 'App'"
echo "   2. En 'Signing & Capabilities' → pon tu Apple ID / Team"
echo "   3. Cambia Bundle ID si es necesario: com.egchat.app"
echo "   4. Product → Archive → Distribute App → App Store Connect"
echo ""
