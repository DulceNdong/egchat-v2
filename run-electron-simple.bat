@echo off
title Simple Electron App
cd /d "c:\Users\User\Desktop\EGCHAT_BACKUP_20260320"
echo Starting Simple Electron App...
echo.
npx electron simple-electron.js
if errorlevel 1 (
    echo.
    echo Error occurred. Press any key to exit.
    pause
)
