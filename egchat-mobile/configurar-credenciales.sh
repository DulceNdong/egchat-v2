#!/bin/bash

# 🔐 Script para configurar credenciales de iOS en EAS

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear

echo "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🔐 CONFIGURAR CREDENCIALES iOS - EGCHAT              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo "${NC}"
echo ""

echo "${BLUE}📋 Información del proyecto:${NC}"
echo ""
echo "   Project ID: 0ebb7958-d09b-4590-a7b7-80977a62b642"
echo "   Owner: reddington120"
echo "   Bundle ID: com.jallzstores.egchat"
echo "   Apple Team: XU6YD7ZJ2K (JALLZ STORES PTY LTD)"
echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar archivos necesarios
echo "${BLUE}🔍 Verificando archivos necesarios...${NC}"
echo ""

if [ -f ".secrets/AuthKey_RCYN4AG5PM.p8" ]; then
    echo "${GREEN}✅ Push Key encontrado: .secrets/AuthKey_RCYN4AG5PM.p8${NC}"
else
    echo "${RED}❌ Push Key NO encontrado: .secrets/AuthKey_RCYN4AG5PM.p8${NC}"
    echo ""
    echo "Por favor, asegúrate de que el archivo existe."
    exit 1
fi

if [ -f "google-services.json" ]; then
    echo "${GREEN}✅ google-services.json encontrado${NC}"
else
    echo "${YELLOW}⚠️  google-services.json no encontrado (solo para Android)${NC}"
fi

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Instrucciones
echo "${YELLOW}📝 INSTRUCCIONES:${NC}"
echo ""
echo "Voy a abrir el menú de credenciales de EAS."
echo "Sigue estos pasos:"
echo ""
echo "${BLUE}1.${NC} Selecciona: ${GREEN}iOS${NC}"
echo ""
echo "${BLUE}2.${NC} Selecciona: ${GREEN}Push Notifications: Manage your Apple Push Notifications Key${NC}"
echo ""
echo "${BLUE}3.${NC} Selecciona: ${GREEN}Upload a new push key${NC}"
echo ""
echo "${BLUE}4.${NC} Ingresa estos datos cuando te los pida:"
echo ""
echo "   ${YELLOW}Key ID:${NC}       RCYN4AG5PM"
echo "   ${YELLOW}Team ID:${NC}      XU6YD7ZJ2K"
echo "   ${YELLOW}Archivo .p8:${NC}  .secrets/AuthKey_RCYN4AG5PM.p8"
echo ""
echo "${BLUE}5.${NC} Después, vuelve al menú y selecciona: ${GREEN}Build Credentials${NC}"
echo "   Para verificar que todo esté OK"
echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "¿Estás listo para abrir el menú? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "${YELLOW}OK, puedes ejecutarlo manualmente cuando quieras:${NC}"
    echo "${BLUE}   eas credentials${NC}"
    exit 0
fi

echo ""
echo "${BLUE}🚀 Abriendo menú de credenciales...${NC}"
echo ""

eas credentials

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ Configuración completada${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo "${BLUE}1.${NC} Verificar configuración:"
echo "   ${BLUE}./verify-apns-config.sh${NC}"
echo ""
echo "${BLUE}2.${NC} Hacer un build de prueba:"
echo "   ${BLUE}eas build --platform ios --profile testflight${NC}"
echo ""
echo "${BLUE}3.${NC} Ver lista de builds:"
echo "   ${BLUE}eas build:list${NC}"
echo ""
