#!/bin/bash

# 🔐 Script para solucionar problema de permisos en EAS

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${RED}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║        🔐 SOLUCION: Problema de Permisos EAS            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo "${NC}"
echo ""

# Mostrar el problema
echo "${RED}❌ PROBLEMA DETECTADO:${NC}"
echo ""
echo "Estabas logueado como:"
echo "  - ${RED}reddington120${NC} (patron.bernardo111@gmail.com)"
echo ""
echo "Pero el proyecto pertenece a:"
echo "  - ${GREEN}dutti98${NC}"
echo "  - Project ID: 8fde846d-979b-468a-933d-2768cc5cd39f"
echo ""
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Solución 1: Login como dutti98
echo "${BLUE}SOLUCIÓN 1: Login con el usuario correcto${NC}"
echo ""
echo "Necesitas hacer login con la cuenta ${GREEN}dutti98${NC}"
echo ""
echo "Ejecuta:"
echo "${BLUE}   eas login${NC}"
echo ""
echo "Y usa las credenciales de la cuenta ${GREEN}dutti98${NC}"
echo ""
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Solución 2: Cambiar el owner del proyecto
echo "${BLUE}SOLUCIÓN 2: Cambiar el owner del proyecto (Alternativa)${NC}"
echo ""
echo "Si NO tienes acceso a ${GREEN}dutti98${NC}, puedes:"
echo ""
echo "1. Cambiar el owner en ${BLUE}app.json${NC}:"
echo "   ${YELLOW}\"owner\": \"reddington120\"${NC}"
echo ""
echo "2. Crear un nuevo proyecto en tu cuenta:"
echo "   ${BLUE}eas init${NC}"
echo ""
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Solución 3: Agregar colaboradores
echo "${BLUE}SOLUCIÓN 3: Agregar tu cuenta como colaborador${NC}"
echo ""
echo "Si ${GREEN}dutti98${NC} puede agregarte como colaborador:"
echo ""
echo "1. ${GREEN}dutti98${NC} debe ir a: https://expo.dev/accounts/dutti98/projects/egchat-mobile/settings"
echo "2. En 'Members', agregar a ${BLUE}reddington120${NC}"
echo "3. Darle rol de ${GREEN}Admin${NC}"
echo ""
echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Preguntar qué hacer
echo "${BLUE}¿Qué solución prefieres?${NC}"
echo ""
echo "1. Hacer login como ${GREEN}dutti98${NC} (Tengo acceso a esa cuenta)"
echo "2. Cambiar el owner a ${BLUE}reddington120${NC} (Usar mi cuenta)"
echo "3. Salir y hacerlo manualmente"
echo ""
read -p "Selecciona una opción (1/2/3): " -n 1 -r
echo ""
echo ""

case $REPLY in
    1)
        echo "${BLUE}🔐 Iniciando login con dutti98...${NC}"
        echo ""
        eas login
        echo ""
        echo "${GREEN}✅ Ahora ejecuta:${NC}"
        echo "${BLUE}   ./complete-eas-setup.sh${NC}"
        ;;
    2)
        echo "${BLUE}🔧 Cambiando owner en app.json...${NC}"
        
        # Backup
        cp app.json app.json.backup
        echo "${GREEN}✅ Backup creado: app.json.backup${NC}"
        
        # Cambiar owner
        sed -i '' 's/"owner": "dutti98"/"owner": "reddington120"/g' app.json
        echo "${GREEN}✅ Owner cambiado a: reddington120${NC}"
        
        # Login
        echo ""
        echo "${BLUE}Ahora haz login con tu cuenta...${NC}"
        eas login
        
        echo ""
        echo "${YELLOW}⚠️  Ahora necesitas re-crear el proyecto:${NC}"
        echo "${BLUE}   eas init${NC}"
        echo ""
        echo "Esto creará un nuevo proyecto en tu cuenta."
        ;;
    3)
        echo "${YELLOW}OK, sal y elige una solución manualmente.${NC}"
        exit 0
        ;;
    *)
        echo "${RED}Opción inválida.${NC}"
        exit 1
        ;;
esac

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ PROCESO COMPLETADO${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
