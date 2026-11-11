#!/bin/bash
set -e

echo "=== Configuración Build 131 con cuenta reddington120 ==="
echo ""
echo "Este script hará lo siguiente:"
echo "1. Login a la cuenta reddington120 (patron.bernardo111@gmail.com)"
echo "2. Actualizar app.json con el projectId de reddington120"
echo "3. Configurar credenciales iOS automáticamente"
echo "4. Iniciar Build 131 para TestFlight"
echo ""
echo "IMPORTANTE: Cuando se te pida login, usa:"
echo "  Email: patron.bernardo111@gmail.com"
echo "  Password: [tu contraseña de reddington120]"
echo ""
read -p "Presiona ENTER para continuar..."

cd /Users/raymonreddintone/egchat-mobile-work/egchat-mobile

# Login
echo ""
echo "=== Paso 1: Login a reddington120 ==="
npx expo login

# Verificar que estamos logueados
CURRENT_USER=$(npx expo whoami 2>&1 | grep -v "⠙" | grep -v "⠹" | tail -1)
echo "Usuario actual: $CURRENT_USER"

if [[ "$CURRENT_USER" != *"reddington120"* ]]; then
  echo "❌ Error: No estás logueado como reddington120"
  echo "Por favor ejecuta: npx expo login"
  exit 1
fi

# Actualizar app.json
echo ""
echo "=== Paso 2: Actualizar app.json ==="
cat app.json | \
  sed 's/"owner": "dutti98"/"owner": "reddington120"/' | \
  sed 's/"projectId": "1cf45e7c-dc1f-47e7-88bd-72b70fa4c1c5"/"projectId": "fbed710e-d18c-417b-ab31-0dc18bc13338"/' \
  > app.json.tmp && mv app.json.tmp app.json

echo "✅ app.json actualizado con:"
echo "   - owner: reddington120"
echo "   - projectId: fbed710e-d18c-417b-ab31-0dc18bc13338"

# Iniciar build (EAS configurará credenciales automáticamente)
echo ""
echo "=== Paso 3: Iniciar Build 131 ==="
echo ""
echo "EAS Build configurará las credenciales automáticamente."
echo "Responde las siguientes preguntas:"
echo "  - Generate a new Apple Distribution Certificate? → YES"
echo "  - Generate a new Apple Provisioning Profile? → YES"
echo ""
read -p "Presiona ENTER para iniciar el build..."

npx eas build --profile testflight --platform ios

echo ""
echo "✅ Build iniciado!"
echo "Monitorea el progreso en: https://expo.dev/accounts/reddington120/projects/egchat-frontend/builds"
