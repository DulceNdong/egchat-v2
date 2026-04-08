@echo off
title EGCHAT Launcher
echo Iniciando EGCHAT...

:: Matar procesos anteriores
taskkill /f /im electron.exe >nul 2>&1

:: Arrancar Vite en background
start /b "" node_modules\.bin\vite.cmd --port=3001

:: Esperar que Vite arranque
timeout /t 4 /nobreak >nul

:: Arrancar Electron del proyecto
set NODE_ENV=development
start "" "node_modules\electron\dist\electron.exe" "electron.js"

echo EGCHAT abierto.
