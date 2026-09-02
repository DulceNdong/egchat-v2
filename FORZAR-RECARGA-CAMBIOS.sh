#!/bin/bash

echo "🧹 Limpiando caché de Expo..."

cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# Limpiar cachés
rm -rf .expo
rm -rf node_modules/.cache
rm -rf .expo-shared
rm -rf web-build

echo "✅ Caché limpiada"
echo ""
echo "🚀 Iniciando Expo con caché limpia..."
echo ""

npx expo start --web --clear

echo ""
echo "✅ Expo iniciado"
echo "📱 Abre: http://localhost:8081"
echo ""
echo "⚠️ IMPORTANTE: Presiona Ctrl+R en el navegador para forzar recarga"
