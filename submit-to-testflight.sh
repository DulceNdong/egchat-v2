#!/bin/bash
set -e

echo "=== 📱 Subir Build 131 a TestFlight ==="
echo ""
echo "Este script subirá el build a App Store Connect y lo hará disponible para testers."
echo ""
echo "IMPORTANTE: Necesitarás proporcionar:"
echo "  1. Apple ID: reddington120@icloud.com"
echo "  2. App-specific password (si tienes 2FA habilitado)"
echo ""
echo "Para generar un app-specific password:"
echo "  https://appleid.apple.com/account/manage → Sign-In and Security → App-Specific Passwords"
echo ""
read -p "Presiona ENTER para continuar..."

cd /Users/raymonreddintone/egchat-mobile-work/egchat-mobile

echo ""
echo "Iniciando submit a TestFlight..."
echo ""

npx eas submit --platform ios --latest

echo ""
echo "✅ ¡Build subido a TestFlight!"
echo ""
echo "El build estará disponible para testers en unos minutos."
echo "Monitorea el estado en: https://appstoreconnect.apple.com/"
