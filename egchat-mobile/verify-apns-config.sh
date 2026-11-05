#!/bin/bash

# Script de verificación de configuración APNS para EGCHAT
# Ejecutar: bash verify-apns-config.sh

echo "🔍 Verificando configuración APNS..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar archivo .p8
echo "📁 1. Archivo AuthKey .p8"
if [ -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    echo -e "   ${GREEN}✅ Encontrado:${NC} .secrets/AuthKey_RCYN4AG5PM.p8"
    KEY_ID="RCYN4AG5PM"
else
    echo -e "   ${RED}❌ No encontrado${NC}"
    KEY_ID=""
fi
echo ""

# 2. Verificar app.json
echo "📱 2. Bundle Identifier"
BUNDLE_ID=$(grep "bundleIdentifier" app.json | grep -o "com\.[^\"]*" | head -1)
if [ -n "$BUNDLE_ID" ]; then
    echo -e "   ${GREEN}✅ Bundle ID:${NC} $BUNDLE_ID"
else
    echo -e "   ${RED}❌ No encontrado en app.json${NC}"
fi
echo ""

# 3. Verificar Team ID
echo "🏢 3. Apple Team ID"
TEAM_ID=$(grep "appleTeamId" app.json | grep -o "[A-Z0-9]\{10\}" | head -1)
if [ -n "$TEAM_ID" ]; then
    echo -e "   ${GREEN}✅ Team ID:${NC} $TEAM_ID"
else
    echo -e "   ${YELLOW}⚠️  No encontrado en app.json, usando:${NC} XU6YD7ZJ2K"
    TEAM_ID="XU6YD7ZJ2K"
fi
echo ""

# 4. Mostrar resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 VARIABLES PARA RENDER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "APNS_KEY_ID=$KEY_ID"
echo "APNS_TEAM_ID=$TEAM_ID"
echo "APNS_BUNDLE_ID=$BUNDLE_ID"
echo "APNS_ENV=production"
echo ""
echo "APNS_KEY_P8="
if [ -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    cat .secrets/AuthKey_RCYN4AG5PM.p8
else
    echo "(archivo no encontrado)"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5. Verificar módulos nativos
echo "🔧 4. Módulos nativos iOS"
if [ -f "ios/EGCHAT/EGChatPushKitModule.swift" ]; then
    echo -e "   ${GREEN}✅ EGChatPushKitModule.swift${NC}"
else
    echo -e "   ${RED}❌ EGChatPushKitModule.swift no encontrado${NC}"
fi

if [ -f "ios/EGCHAT/EGChatCallModule.swift" ]; then
    echo -e "   ${GREEN}✅ EGChatCallModule.swift${NC}"
else
    echo -e "   ${RED}❌ EGChatCallModule.swift no encontrado${NC}"
fi
echo ""

# 6. Verificar notifications.ts
echo "📲 5. Código JavaScript"
if grep -q "EGChatPushKitModule" src/notifications.ts 2>/dev/null; then
    echo -e "   ${GREEN}✅ notifications.ts usa módulo VoIP${NC}"
else
    echo -e "   ${RED}❌ notifications.ts NO usa módulo VoIP${NC}"
fi
echo ""

# 7. Estado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 ESTADO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

all_ok=true

if [ ! -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    all_ok=false
fi

if [ -z "$BUNDLE_ID" ]; then
    all_ok=false
fi

if [ ! -f "ios/EGCHAT/EGChatPushKitModule.swift" ]; then
    all_ok=false
fi

if ! grep -q "EGChatPushKitModule" src/notifications.ts 2>/dev/null; then
    all_ok=false
fi

if [ "$all_ok" = true ]; then
    echo -e "${GREEN}✅ TODO LISTO${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Configurar variables en Render (copia el bloque de arriba)"
    echo "2. Mañana: eas build --profile production --platform ios"
    echo "3. VoIP funcionará en Build 123 🚀"
else
    echo -e "${RED}❌ FALTAN COSAS${NC}"
    echo ""
    echo "Revisa los errores arriba y corrige lo que falta."
fi

echo ""
