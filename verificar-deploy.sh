#!/bin/bash
# Script para verificar que el deploy de /api/wallet/transfer funcionó

echo "🔍 Verificando deploy de EGCHAT API en Render..."
echo ""

# Verificar que el servidor está vivo
echo "1️⃣ Verificando que el servidor responde..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://egchat-api-xlxj.onrender.com/health)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Servidor en línea (HTTP $HTTP_CODE)"
else
    echo "❌ Servidor no responde correctamente (HTTP $HTTP_CODE)"
    echo "⏳ Render puede estar despertando... Esperando 30 segundos..."
    sleep 30
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://egchat-api-xlxj.onrender.com/health)
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "✅ Servidor ahora en línea (HTTP $HTTP_CODE)"
    else
        echo "❌ Servidor sigue sin responder"
        exit 1
    fi
fi

echo ""
echo "2️⃣ Verificando ruta /api/wallet/transfer..."

# Intentar llamar a la ruta sin autenticación (debe dar 401, no 404)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://egchat-api-xlxj.onrender.com/api/wallet/transfer \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"to":"+240222111111","amount":1000}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
echo ""

if [ "$HTTP_CODE" -eq 401 ]; then
    echo "✅ Ruta /api/wallet/transfer existe y funciona correctamente"
    echo "   (401 = No autorizado, es el comportamiento esperado sin token)"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "❌ Error 404: La ruta NO existe"
    echo "   El deploy NO se completó correctamente"
    echo ""
    echo "🔧 Soluciones:"
    echo "   1. Ve a https://dashboard.render.com/"
    echo "   2. Abre 'egchat-api'"
    echo "   3. Click 'Manual Deploy' → 'Clear build cache & deploy'"
    exit 1
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo "✅ Ruta existe y el código nuevo está funcionando"
    echo "   (400 = Validación de parámetros activa)"
else
    echo "⚠️  Respuesta inesperada: HTTP $HTTP_CODE"
    echo "   Puede que el servidor esté procesando el deploy"
fi

echo ""
echo "3️⃣ Verificando logs de Render..."
echo "   👉 Ve a: https://dashboard.render.com/"
echo "   👉 Abre 'egchat-api' → Logs"
echo "   👉 Busca: 'Server running on port 10000'"
echo ""
echo "✅ Verificación completa!"
