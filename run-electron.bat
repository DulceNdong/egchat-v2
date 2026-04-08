@echo off
title Electron Debug Window
mode con: cols=80 lines=30
color 0A

echo ================================
echo    ELECTRON DEBUG LAUNCHER
echo ================================
echo.
cd /d "c:\Users\User\Desktop\EGCHAT_BACKUP_20260320"
echo Current directory: %CD%
echo.
echo [1/3] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)
echo.
echo [2/3] Checking Electron...
npx electron --version
if errorlevel 1 (
    echo ERROR: Electron not found!
    pause
    exit /b 1
)
echo.
echo [3/3] Starting Electron...
echo This window will stay open to show debug messages.
echo.
npx electron debug-electron.js
echo.
echo ================================
echo Electron process finished.
echo ================================
pause
