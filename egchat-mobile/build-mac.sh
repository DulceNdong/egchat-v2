#!/bin/bash
# ══════════════════════════════════════════════════════════════
# EGCHAT — Script de build para Mac (APK + IPA)
# Ejecutar en el Mac desde la carpeta egchat-mobile/
# Uso: bash build-mac.sh
# ══════════════════════════════════════════════════════════════

set -e

echo "🚀 EGCHAT Build Script"
echo "======================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instala desde https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Verificar EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 Instalando EAS CLI..."
    npm install -g eas-cli
fi
echo "✅ EAS CLI instalado"

# Instalar dependencias del proyecto
echo "📦 Instalando dependencias..."
npm install

# Login EAS
echo ""
echo "🔐 Login en Expo (usuario: reddington120)"
npx eas login

echo ""
echo "¿Qué quieres compilar?"
echo "  1) APK (Android)"
echo "  2) IPA (iOS - requiere cuenta Apple Developer)"
echo "  3) Ambos"
read -p "Elige (1/2/3): " choice

case $choice in
    1)
        echo "🔨 Compilando APK..."
        npx eas build --profile preview --platform android --non-interactive
        ;;
    2)
        echo "🍎 Compilando IPA..."
        npx eas build --profile preview --platform ios --non-interactive
        ;;
    3)
        echo "🔨 Compilando APK + IPA..."
        npx eas build --profile preview --platform all --non-interactive
        ;;
    *)
        echo "Opción no válida"
        exit 1
        ;;
esac

echo ""
echo "✅ Build completado. Revisa https://expo.dev para descargar."
