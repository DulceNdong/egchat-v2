#!/bin/bash

# 🚀 EGCHAT - Script de Despliegue Rápido
# Uso: ./QUICK_DEPLOY.sh [frontend|backend|both]

echo "🌟 EGCHAT - Despliegue Automático"
echo "=================================="

# Verificar argumento
if [ -z "$1" ]; then
    echo "Uso: ./QUICK_DEPLOY.sh [frontend|backend|both]"
    exit 1
fi

DEPLOY_TYPE=$1

# Funciones de color
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar estado del proyecto
echo -e "${BLUE}📋 Verificando estado del proyecto...${NC}"

if [ ! -f "api.ts" ]; then
    echo -e "${RED}❌ Error: api.ts no encontrado${NC}"
    exit 1
fi

if [ ! -d "server" ]; then
    echo -e "${RED}❌ Error: carpeta server/ no encontrada${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Estructura del proyecto correcta${NC}"

# 2. Backend Deploy
if [ "$DEPLOY_TYPE" = "backend" ] || [ "$DEPLOY_TYPE" = "both" ]; then
    echo -e "${BLUE}🔧 Configurando Backend...${NC}"
    
    cd server
    
    # Verificar .env
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env no encontrado. Creando desde .env.example...${NC}"
        cp .env.example .env
        echo -e "${RED}❗ EDITA server/.env con tus credenciales de Supabase${NC}"
        echo -e "${YELLOW}   SUPABASE_URL=https://tu-proyecto.supabase.co${NC}"
        echo -e "${YELLOW}   SUPABASE_SERVICE_KEY=tu-service-key${NC}"
        read -p "Presiona Enter cuando hayas configurado .env..."
    fi
    
    # Instalar dependencias
    echo -e "${BLUE}📦 Instalando dependencias del backend...${NC}"
    npm install
    
    # Verificar variables
    if grep -q "TU_PROYECTO" .env; then
        echo -e "${RED}❌ Aún necesitas configurar las credenciales en .env${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend listo para deploy${NC}"
    
    # Opción de deploy
    echo -e "${YELLOW}🚀 Opciones de deploy:${NC}"
    echo "1) Railway (recomendado)"
    echo "2) Render"
    echo "3) Local test"
    
    read -p "Elige opción [1-3]: " choice
    
    case $choice in
        1)
            echo -e "${BLUE}🚂 Deploy a Railway...${NC}"
            if command -v railway &> /dev/null; then
                railway up
            else
                echo -e "${RED}❌ Railway CLI no instalada. Instala: npm install -g @railway/cli${NC}"
            fi
            ;;
        2)
            echo -e "${BLUE}🌐 Deploy a Render...${NC}"
            echo "1. Sube código a GitHub"
            echo "2. Conecta repo en render.com"
            echo "3. Configura variables de entorno"
            echo "4. Deploy automático"
            ;;
        3)
            echo -e "${BLUE}🧪 Iniciando servidor local...${NC}"
            npm start
            ;;
    esac
    
    cd ..
fi

# 3. Frontend Deploy
if [ "$DEPLOY_TYPE" = "frontend" ] || [ "$DEPLOY_TYPE" = "both" ]; then
    echo -e "${BLUE}🎨 Configurando Frontend PWA...${NC}"
    
    # Verificar dependencias
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Instalando dependencias del frontend...${NC}"
        npm install
    fi
    
    # Build PWA
    echo -e "${BLUE}🏗️ Building PWA para producción...${NC}"
    npm run build:pwa
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build exitoso${NC}"
    else
        echo -e "${RED}❌ Error en el build${NC}"
        exit 1
    fi
    
    # Copiar archivos PWA
    echo -e "${BLUE}📋 Copiando archivos PWA...${NC}"
    cp manifest.json dist/
    cp sw.js dist/
    
    # Opciones de deploy
    echo -e "${YELLOW}🚀 Opciones de deploy frontend:${NC}"
    echo "1) Vercel (recomendado para PWA)"
    echo "2) Netlify"
    echo "3) Firebase Hosting"
    echo "4) Preview local"
    
    read -p "Elige opción [1-4]: " choice
    
    case $choice in
        1)
            echo -e "${BLUE}🌐 Deploy a Vercel...${NC}"
            if command -v vercel &> /dev/null; then
                vercel --prod dist/
            else
                echo -e "${RED}❌ Vercel CLI no instalada. Instala: npm install -g vercel${NC}"
            fi
            ;;
        2)
            echo -e "${BLUE}📁 Deploy a Netlify...${NC}"
            echo "1. Ve a netlify.com"
            echo "2. Arrastra la carpeta dist/"
            echo "3. Deploy automático"
            ;;
        3)
            echo -e "${BLUE}🔥 Deploy a Firebase...${NC}"
            if command -v firebase &> /dev/null; then
                firebase deploy
            else
                echo -e "${RED}❌ Firebase CLI no instalada. Instala: npm install -g firebase-tools${NC}"
            fi
            ;;
        4)
            echo -e "${BLUE}🧪 Iniciando preview local...${NC}"
            npm run preview:pwa
            ;;
    esac
fi

# 4. Verificación final
echo -e "${GREEN}🎉 Despliegue completado!${NC}"
echo ""
echo -e "${BLUE}📱 Para probar en móvil:${NC}"
echo "1. Android: Chrome → Menu → Add to Home screen"
echo "2. iOS: Safari → Share → Add to Home Screen"
echo ""
echo -e "${BLUE}🔗 URLs de producción:${NC}"
echo "Frontend: https://egchat-gq.com"
echo "Backend:  https://api.egchat-gq.com"
echo ""
echo -e "${GREEN}✨ EGCHAT listo para producción!${NC}"
