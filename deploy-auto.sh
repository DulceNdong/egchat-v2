#!/bin/bash

# EGCHAT v2.5.0 - Despliegue Automático para Todos los Usuarios
# Este script se ejecuta automáticamente después de cada cambio

echo "=== EGCHAT v2.5.0 - DESPLIEGUE AUTOMÁTICO ==="
echo "Iniciando proceso de actualización global..."

# 1. Limpiar cache y build anterior
echo "1. Limpiando cache y build anterior..."
npm run clean
rm -rf dist
rm -rf node_modules/.cache

# 2. Instalar dependencias
echo "2. Instalando dependencias..."
npm install

# 3. Build de producción
echo "3. Generando build de producción..."
npm run build

# 4. Desplegar a Vercel automáticamente
echo "4. Desplegando a Vercel para todos los usuarios..."
npm run deploy

# 5. Verificar despliegue
echo "5. Verificando despliegue..."
curl -s https://egchat-app.vercel.app | grep -o "EGCHAT v2.5.0" && echo "¡Despliegue exitoso!" || echo "Error en despliegue"

# 6. Notificar estado
echo "=== DESPLIEGUE COMPLETADO ==="
echo "Todos los usuarios ahora tienen la última versión en:"
echo "https://egchat-app.vercel.app"
echo "Backend: https://egchat-api.onrender.com"
echo ""
