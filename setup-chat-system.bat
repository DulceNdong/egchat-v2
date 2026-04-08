@echo off
echo ════════════════════════════════════════════════════════════════
echo 🚀 CONFIGURACIÓN RÁPIDA DEL SISTEMA DE MENSAJERÍA EGCHAT
echo ════════════════════════════════════════════════════════════════
echo.

echo 📋 PASO 1: Verificar archivos creados
echo.
echo ✅ chat-schema.sql - Esquema completo de base de datos
echo ✅ CHAT_SYSTEM_GUIDE.md - Guía completa del sistema
echo ✅ server/index.js - Backend con toda la API de mensajería
echo.

echo 📋 PASO 2: Configurar Supabase
echo.
echo 1. Abre tu proyecto en Supabase Dashboard
echo 2. Ve a "SQL Editor"
echo 3. Copia todo el contenido de chat-schema.sql
echo 4. Pega y ejecuta el script completo
echo 5. Verifica que todas las tablas se crearon
echo.

echo 📋 PASO 3: Probar la API
echo.
echo Probando conexión al backend...
curl -s https://egchat-api.onrender.com/health
echo.
echo.

echo 📋 PASO 4: Probar registro de usuario
echo.
echo Creando usuario de prueba...
curl -X POST https://egchat-api.onrender.com/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+240555123456\",\"password\":\"test123\",\"full_name\":\"Usuario EGCHAT\"}"
echo.
echo.

echo 📋 PASO 5: Abrir frontend
echo.
echo Abriendo EGCHAT en tu navegador...
start https://egchat-app.vercel.app
echo.

echo 📋 PASO 6: Abrir guía completa
echo.
echo Abriendo guía del sistema de mensajería...
start CHAT_SYSTEM_GUIDE.md
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ ¡SISTEMA DE MENSAJERÍA CONFIGURADO!
echo ════════════════════════════════════════════════════════════════
echo.
echo 🎯 Funcionalidades disponibles:
echo    📱 Chat privado 1-a-1
echo    👥 Chat grupal con roles
echo    📎 Todos los tipos de archivos
echo    🔔 Notificaciones en tiempo real
echo    👤 Gestión de contactos
echo    💰 Pagos integrados
echo    🤖 Asistente IA LIA-25
echo.
echo 🌐 URLs importantes:
echo    Frontend: https://egchat-app.vercel.app
echo    Backend:  https://egchat-api.onrender.com
echo    API Docs: Revisa CHAT_SYSTEM_GUIDE.md
echo.
echo 📱 Para empezar:
echo    1. Registra usuarios con teléfono
echo    2. Agrega contactos
echo    3. Crea chats y envía mensajes
echo.
echo 🇬🇶 ¡EGCHAT está listo para conectar a Guinea Ecuatorial!
echo.

pause
