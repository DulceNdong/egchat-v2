@echo off
echo === Starting Debug Version ===
cd /d "c:\Users\User\Desktop\EGCHAT_BACKUP_20260320"
echo Current directory: %CD%
echo.
echo Checking Node.js...
node --version
echo.
echo Checking Electron...
npx electron --version
echo.
echo Starting Electron with debug...
npx electron debug-electron.js
echo.
echo === Process finished ===
pause
