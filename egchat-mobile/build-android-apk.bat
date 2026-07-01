@echo off
setlocal
cd /d "%~dp0"

echo Building EGCHAT Android APK...
echo.

if not exist "android\gradlew.bat" (
  echo ERROR: android\gradlew.bat not found.
  echo Run: npx expo prebuild --platform android
  pause
  exit /b 1
)

call android\gradlew.bat -p android assembleRelease
if errorlevel 1 (
  echo.
  echo APK build failed.
  pause
  exit /b 1
)

echo.
echo APK ready:
echo %CD%\android\app\build\outputs\apk\release\app-release.apk
pause
