#!/bin/bash

cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --delete-prefix v20.20.2

echo "🔧 Arreglando problema de ip.txt..."

# 1. Modificar react-native-xcode.sh
SCRIPT_PATH="node_modules/react-native/scripts/react-native-xcode.sh"
if [ -f "$SCRIPT_PATH" ]; then
    # Hacer backup
    cp "$SCRIPT_PATH" "$SCRIPT_PATH.backup"
    # Comentar la línea que escribe ip.txt
    sed -i '' 's/echo "$IP" > "$DEST\/ip.txt"/# echo "$IP" > "$DEST\/ip.txt"/g' "$SCRIPT_PATH"
    echo "✅ Script react-native-xcode.sh modificado"
fi

# 2. Crear directorio con permisos
mkdir -p ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app
chmod 777 ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app

# 3. Crear ip.txt dummy
echo "127.0.0.1" > ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt
chmod 666 ~/Library/Developer/Xcode/DerivedData/EGCHAT-apuegndnhmhdabcudwdcdswkdgwt/Build/Products/Debug-iphoneos/EGCHAT.app/ip.txt

# 4. Limpiar DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/EGCHAT-*

# 5. Compilar
echo "🏗️ Compilando..."
xcodebuild \
  -workspace ios/EGCHAT.xcworkspace \
  -scheme EGCHAT \
  -configuration Debug \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=5ZG8BB38KU \
  GCC_PREPROCESSOR_DEFINITIONS='$(inherited) DISABLE_SANDBOX=1' \
  2>&1 | tee build.log

# 6. Verificar resultado
if grep -q "BUILD SUCCEEDED" build.log; then
    echo "✅ BUILD EXITOSO!"
    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "*.app" -type d | head -1)
    if [ -n "$APP_PATH" ]; then
        echo "📱 App en: $APP_PATH"
        echo "💡 Instala con: npx ios-deploy --bundle '$APP_PATH' --justlaunch"
    fi
else
    echo "❌ Build falló. Errores:"
    grep -E "error:" build.log | head -5
fi
