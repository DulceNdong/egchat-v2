#!/bin/bash

echo "🔧 FORZANDO CAMBIO A LOCALHOST..."
echo ""

cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# 1. Crear .env con localhost
echo "📝 Escribiendo .env..."
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_URL_MOBILE=http://localhost:5000
EXPO_PUBLIC_SUPABASE_URL=https://fqfxtjnfhvpggssbymdn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZnh0am5maHZwZ2dzc2J5bWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDM4MjAsImV4cCI6MjEwMTQxOTgyMH0.jc8uCndFdhKDlJB8_CfBqqeXAzZYTCpWEUf9W0v8fIw
EXPO_PUBLIC_ENABLE_PUSH=1
EXPO_PUBLIC_ENABLE_VOIP=1
EXPO_PUBLIC_ENABLE_WEBRTC=1
EOF

echo "✅ .env actualizado"
echo ""
cat .env | grep API_URL
echo ""

# 2. Matar todos los procesos node
echo "🔪 Matando procesos node..."
killall -9 node 2>/dev/null
sleep 2

# 3. Limpiar TODO
echo "🧹 Limpiando cachés..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf web-build
rm -rf .expo-shared
rm -rf /tmp/metro-* 2>/dev/null
rm -rf /tmp/haste-map-* 2>/dev/null
rm -rf /tmp/react-* 2>/dev/null

echo "✅ Cachés limpiados"
echo ""

# 4. Iniciar Expo
echo "🚀 Iniciando Expo con caché limpia..."
echo ""
npx expo start --web --clear --reset-cache

echo ""
echo "✅ Expo iniciado"
echo "📱 Abre: http://localhost:8081"
