#!/bin/bash

# 🚀 Script de configuración completa de EAS para EGCHAT
# Este script automatiza toda la configuración necesaria

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║        🚀 CONFIGURACIÓN COMPLETA EAS - EGCHAT            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo "${NC}"
echo ""

# Verificar directorio
if [ ! -f "app.json" ]; then
    echo "${RED}❌ Error: Ejecuta este script desde egchat-mobile/${NC}"
    exit 1
fi

# Paso 1: Verificar credenciales locales
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📋 PASO 1: Verificar archivos locales${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    echo "${GREEN}✅ Push Key (.p8) encontrado${NC}"
else
    echo "${RED}❌ Push Key NO encontrado en .secrets/${NC}"
    exit 1
fi

if [ -f "google-services.json" ]; then
    echo "${GREEN}✅ google-services.json encontrado${NC}"
else
    echo "${YELLOW}⚠️  google-services.json no encontrado (solo necesario para Android)${NC}"
fi

echo ""

# Paso 2: Verificar configuración en archivos
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔧 PASO 2: Verificar archivos de configuración${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar app.json
if grep -q "XU6YD7ZJ2K" app.json; then
    echo "${GREEN}✅ app.json: Team ID correcto${NC}"
else
    echo "${YELLOW}⚠️  app.json: Team ID incorrecto o faltante${NC}"
fi

if grep -q "com.jallzstores.egchat" app.json; then
    echo "${GREEN}✅ app.json: Bundle ID correcto${NC}"
else
    echo "${RED}❌ app.json: Bundle ID incorrecto${NC}"
fi

# Verificar eas.json
if grep -q "XU6YD7ZJ2K" eas.json; then
    echo "${GREEN}✅ eas.json: Team ID correcto${NC}"
else
    echo "${YELLOW}⚠️  eas.json: Team ID incorrecto o faltante${NC}"
fi

echo ""

# Paso 3: Login en EAS
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔐 PASO 3: Verificar autenticación EAS${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar si EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "${YELLOW}⚠️  Instalando EAS CLI...${NC}"
    npm install -g eas-cli
    echo "${GREEN}✅ EAS CLI instalado${NC}"
else
    echo "${GREEN}✅ EAS CLI disponible${NC}"
fi

# Verificar autenticación
if eas whoami &> /dev/null; then
    EAS_USER=$(eas whoami)
    echo "${GREEN}✅ Autenticado como: ${EAS_USER}${NC}"
else
    echo "${YELLOW}⚠️  No autenticado. Iniciando sesión...${NC}"
    eas login
fi

echo ""

# Paso 4: Mostrar estado actual de credenciales
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📊 PASO 4: Estado actual de credenciales${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

eas credentials --platform ios --non-interactive || true

echo ""

# Paso 5: Guía de configuración manual
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}⚠️  CONFIGURACIÓN MANUAL REQUERIDA${NC}"
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Ahora debes ejecutar:"
echo ""
echo "${BLUE}   eas credentials${NC}"
echo ""
echo "Y seguir estos pasos:"
echo ""
echo "1️⃣  Selecciona: ${GREEN}iOS${NC}"
echo ""
echo "2️⃣  Selecciona: ${GREEN}Push Notifications: Manage your Apple Push Notifications Key${NC}"
echo ""
echo "3️⃣  Selecciona: ${GREEN}Upload a new push key${NC}"
echo "    (o ${GREEN}Use an existing push key${NC} si ya la subiste antes)"
echo ""
echo "4️⃣  Ingresa estos datos:"
echo "    ${BLUE}Key ID:${NC}       RCYN4AG5PM"
echo "    ${BLUE}Team ID:${NC}      XU6YD7ZJ2K"
echo "    ${BLUE}Archivo .p8:${NC}  .secrets/AuthKey_RCYN4AG5PM.p8"
echo ""
echo "5️⃣  Vuelve al menú y selecciona: ${GREEN}Build Credentials${NC}"
echo "    Verifica que todo esté OK (certificados y profiles)"
echo ""
echo "6️⃣  (Opcional) Configura ${GREEN}App Store Connect API Key${NC}"
echo "    Esto permite subidas automáticas a TestFlight"
echo ""
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Paso 6: Siguiente acción
read -p "¿Quieres abrir el menú de credenciales ahora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "${BLUE}Abriendo menú de credenciales...${NC}"
    echo ""
    eas credentials
fi

# Paso 7: Verificación final
echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔍 PASO FINAL: Verificación${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Ejecuta este comando para verificar que todo está OK:"
echo ""
echo "${BLUE}   ./verify-apns-config.sh${NC}"
echo ""
echo "Luego, prueba un build:"
echo ""
echo "${BLUE}   eas build --platform ios --profile testflight${NC}"
echo ""
echo "${GREEN}✅ Configuración completa${NC}"
echo ""
