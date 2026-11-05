#!/bin/bash

# 🚀 Script de configuración automática de Push Notifications para EGCHAT
# Este script configura las credenciales de Apple Push Notifications en EAS

set -e

echo "🔧 Configurando Push Notifications para EGCHAT..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio egchat-mobile"
    exit 1
fi

echo "${BLUE}📋 Información del proyecto:${NC}"
echo "   Team ID: XU6YD7ZJ2K (JALLZ STORES PTY LTD)"
echo "   Bundle ID: com.jallzstores.egchat"
echo "   Push Key ID: RCYN4AG5PM"
echo ""

# Verificar que existe el archivo .p8
if [ ! -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    echo "❌ Error: No se encuentra el archivo .secrets/AuthKey_RCYN4AG5PM.p8"
    exit 1
fi

echo "${GREEN}✅ Archivo .p8 encontrado${NC}"
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "${YELLOW}⚠️  EAS CLI no está instalado. Instalando...${NC}"
    npm install -g eas-cli
fi

echo "${GREEN}✅ EAS CLI disponible${NC}"
echo ""

# Login en EAS (si no está logueado)
echo "${BLUE}🔐 Verificando autenticación...${NC}"
if ! eas whoami &> /dev/null; then
    echo "Por favor, inicia sesión en tu cuenta de Expo:"
    eas login
fi

echo "${GREEN}✅ Autenticado en EAS${NC}"
echo ""

# Mostrar información de credenciales actuales
echo "${BLUE}📊 Estado actual de credenciales iOS:${NC}"
eas credentials --platform ios --non-interactive || true
echo ""

# Instrucciones para el usuario
echo "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo "${YELLOW}   CONFIGURACIÓN MANUAL REQUERIDA${NC}"
echo "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Ahora debes ejecutar el siguiente comando y seguir las instrucciones:"
echo ""
echo "${BLUE}eas credentials${NC}"
echo ""
echo "Luego selecciona:"
echo "  1. ${GREEN}iOS${NC}"
echo "  2. ${GREEN}Push Notifications: Manage your Apple Push Notifications Key${NC}"
echo "  3. ${GREEN}Upload a new push key${NC}"
echo ""
echo "Ingresa estos datos cuando te los pida:"
echo "  - ${BLUE}Key ID:${NC} RCYN4AG5PM"
echo "  - ${BLUE}Team ID:${NC} XU6YD7ZJ2K"
echo "  - ${BLUE}Archivo:${NC} .secrets/AuthKey_RCYN4AG5PM.p8"
echo ""
echo "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Preguntar si quiere abrir el comando interactivo
read -p "¿Quieres abrir el menú de credenciales ahora? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    eas credentials
fi

echo ""
echo "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Siguientes pasos:"
echo "  1. Verifica la configuración: ${BLUE}./verify-apns-config.sh${NC}"
echo "  2. Haz un build de prueba: ${BLUE}eas build --platform ios --profile testflight${NC}"
echo ""
