@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\npx.cmd" expo start --web --port 8082 --localhost
pause
