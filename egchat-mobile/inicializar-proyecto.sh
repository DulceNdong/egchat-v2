#!/bin/bash

# 🚀 Script para inicializar el proyecto en tu cuenta

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
echo "║     🔄 INICIALIZAR PROYECTO EN TU CUENTA                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo "${NC}"
echo ""

echo "${BLUE}📋 Lo que voy a hacer:${NC}"
echo ""
echo "1. Crear un NUEVO proyecto EAS en tu cuenta (reddington120)"
echo "2. Esto generará un nuevo Project ID"
echo "3. Tus credenciales Apple (certificados, keys) seguirán funcionando"
echo ""
echo "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "Esto NO afectará al proyecto original de dutti98"
echo "Simplemente creas tu propia copia en tu cuenta"
echo ""
read -p "¿Continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "${RED}Cancelado${NC}"
    exit 0
fi

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔄 Paso 1: Crear backup del app.json actual${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cp app.json app.json.backup-$(date +%Y%m%d-%H%M%S)
echo "${GREEN}✅ Backup creado${NC}"

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🆕 Paso 2: Inicializar proyecto en EAS${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "${YELLOW}Esto te preguntará:${NC}"
echo "- ${GREEN}Create a new project${NC} → Presiona Enter"
echo ""

eas init

echo ""
echo "${GREEN}✅ Proyecto inicializado en tu cuenta${NC}"

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔍 Paso 3: Verificar configuración${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "${GREEN}Owner actual:${NC}"
grep "owner" app.json || echo "No especificado (usará cuenta actual)"

echo ""
echo "${GREEN}Project ID:${NC}"
grep "projectId" app.json

echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ COMPLETADO${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Ahora puedes configurar las credenciales:"
echo ""
echo "${BLUE}   eas credentials${NC}"
echo ""
echo "Y luego hacer tu primer build:"
echo ""
echo "${BLUE}   eas build --platform ios --profile testflight${NC}"
echo ""
