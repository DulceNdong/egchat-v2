#!/bin/bash

# Script para deployar EGCHAT a TestFlight
# Uso: ./deploy-testflight.sh

set -e  # Salir si hay error

echo "🚀 EGCHAT - Deploy a TestFlight"
echo "================================"
echo ""

# Verificar que estamos en la rama mobile
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "mobile" ]; then
    echo "⚠️  ADVERTENCIA: No estás en la rama 'mobile'"
    echo "   Rama actual: $CURRENT_BRANCH"
    read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commitear. Por favor, commit primero."
    git status --short
    exit 1
fi

echo "✅ Git check pasado"
echo ""

# Mostrar versión actual
CURRENT_VERSION=$(grep '"version":' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
CURRENT_BUILD=$(grep '"buildNumber":' app.json | head -1 | sed 's/.*"buildNumber": "\(.*\)".*/\1/')
echo "📦 Versión actual: $CURRENT_VERSION (build $CURRENT_BUILD)"
echo ""

# Preguntar qué plataformas buildear
echo "¿Qué plataformas deseas buildear?"
echo "1) Solo iOS (TestFlight)"
echo "2) Solo Android (APK para testers)"
echo "3) Ambas (iOS + Android)"
read -p "Opción (1-3): " PLATFORM_CHOICE

BUILD_IOS=false
BUILD_ANDROID=false

case $PLATFORM_CHOICE in
    1)
        BUILD_IOS=true
        ;;
    2)
        BUILD_ANDROID=true
        ;;
    3)
        BUILD_IOS=true
        BUILD_ANDROID=true
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "🔨 Iniciando builds..."
echo ""

# Build iOS para TestFlight
if [ "$BUILD_IOS" = true ]; then
    echo "📱 Building iOS para TestFlight..."
    echo "   Profile: testflight"
    echo "   Auto-increment: ON"
    echo ""
    
    npx eas-cli build --profile testflight --platform ios --non-interactive
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ iOS build completado"
        echo ""
        
        # Preguntar si desea subir a TestFlight automáticamente
        read -p "¿Subir automáticamente a TestFlight? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "📤 Subiendo a TestFlight..."
            npx eas-cli submit --profile testflight --platform ios --latest
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Build subido a TestFlight exitosamente"
                echo "🔗 Revisa App Store Connect: https://appstoreconnect.apple.com"
            else
                echo ""
                echo "❌ Error al subir a TestFlight"
            fi
        else
            echo ""
            echo "ℹ️  Para subir manualmente más tarde, ejecuta:"
            echo "   npx eas-cli submit --profile testflight --platform ios --latest"
        fi
    else
        echo ""
        echo "❌ Error en iOS build"
    fi
fi

# Build Android APK para testers
if [ "$BUILD_ANDROID" = true ]; then
    echo ""
    echo "🤖 Building Android APK para testers..."
    echo "   Profile: testflight"
    echo "   Architecture: arm64-v8a"
    echo ""
    
    npx eas-cli build --profile testflight --platform android --non-interactive
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Android build completado"
        echo "📥 Descarga el APK desde: https://expo.dev/accounts/dutti98/projects/egchat-frontend/builds"
    else
        echo ""
        echo "❌ Error en Android build"
    fi
fi

echo ""
echo "================================"
echo "✅ Proceso de deploy finalizado"
echo ""
echo "📋 Próximos pasos:"
if [ "$BUILD_IOS" = true ]; then
    echo "   1. Abre App Store Connect: https://appstoreconnect.apple.com"
    echo "   2. Ve a TestFlight → EGCHAT"
    echo "   3. Espera a que el build esté procesado (~15 min)"
    echo "   4. Agrega testers y envía notificación"
fi
if [ "$BUILD_ANDROID" = true ]; then
    echo "   1. Descarga el APK desde Expo dashboard"
    echo "   2. Distribuye a testers vía link directo o Firebase App Distribution"
fi
echo ""
