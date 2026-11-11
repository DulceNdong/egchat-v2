@echo off
title EGCHAT - Servidor Local
echo.
echo  ================================
echo   EGCHAT - Iniciando servidor...
echo  ================================
echo.
echo  La app estara disponible en:
echo  http://localhost:8081
echo.
echo  Cierra esta ventana para parar.
echo.
cd /d "%~dp0"
npx expo start --web --port 8081
pause
