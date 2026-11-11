#!/bin/bash

cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --delete-prefix v20.20.2

echo "🔧 SOLUCIONANDO ERROR DE IP.TXT"

# 1. Limpiar DerivedData
echo "🧹 Limpiando DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/EGCHAT-*
rm -rf ./build

# 2. Crear directorio y archivo dummy
echo "📝 Creando archivo ip.txt dummy..."
mkdir -p ./build/DerivedData/Build/Products/Debug-iphoneos/EGCHAT.app
mkdir -p ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app

echo "127.0.0.1" > ./build/DerivedData/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt
echo "127.0.0.1" > ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt

chmod 777 ./build/DerivedData/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt
chmod 777 ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt

# 3. Intentar compilar
echo "🏗️ Compilando..."
xcodebuild \
  -workspace ios/EGCHAT.xcworkspace \
  -scheme EGCHAT \
  -configuration Debug \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  -derivedDataPath ./build/DerivedData \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=5ZG8BB38KU \
  GCC_PREPROCESSOR_DEFINITIONS='$(inherited) DISABLE_SANDBOX=1' \
  2>&1 | tee build.log

# 4. Verificar resultado
if grep -q "BUILD SUCCEEDED" build.log; then
    echo "✅ BUILD EXITOSO!"
    APP_PATH=$(find ./build -name "*.app" -type d | head -1)
    if [ -n "$APP_PATH" ]; then
        echo "📱 App en: $APP_PATH"
        echo "💡 Instalando en dispositivo..."
        npx ios-deploy --bundle "$APP_PATH" --justlaunch 2>/dev/null || echo "Usa Xcode para instalar: open ios/EGCHAT.xcworkspace"
    fi
else
    echo "❌ BUILD FALLÓ"
    grep "error:" build.log | head -10
fi
