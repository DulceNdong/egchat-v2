# ✅ Checklist Android — Generación APK/AAB

## Pre-requisitos

- [ ] Android Studio Hedgehog (2023.1+) o superior
- [ ] JDK 17 instalado
- [ ] Android SDK con API 34
- [ ] `egchat-release.keystore` en `android/app/`

---

## Paso 1 — Build Frontend

```powershell
cd c:\Users\User\Desktop\EGCHAT_BACKUP_20260320
npm run build
```

## Paso 2 — Sync Capacitor

```powershell
npx cap sync android
```

✅ Verificar: "Sync finished"

## Paso 3 — Generar APK Debug (testing)

```powershell
cd android
.\gradlew.bat assembleDebug
```

APK en: `android\app\build\outputs\apk\debug\app-debug.apk`

## Paso 4 — Generar APK Release (producción)

```powershell
cd android
.\gradlew.bat assembleRelease
```

APK en: `android\app\build\outputs\apk\release\app-release.apk`

## Paso 5 — Generar AAB (para Google Play)

```powershell
cd android
.\gradlew.bat bundleRelease
```

AAB en: `android\app\build\outputs\bundle\release\app-release.aab`

---

## Configuración de Firma

```gradle
# android/app/build.gradle
signingConfigs {
  release {
    storeFile     file('egchat-release.keystore')
    storePassword 'egchat2025prod'   ⚠️ mover a env vars
    keyAlias      'egchat'
    keyPassword   'egchat2025prod'   ⚠️ mover a env vars
  }
}
```

**Antes de producción:** mover credenciales a variables de entorno:

```powershell
# En local.properties (NO commitear)
KEYSTORE_PASSWORD=egchat2025prod
KEY_ALIAS=egchat
KEY_PASSWORD=egchat2025prod
```

---

## Verificaciones Post-Build Android

- [ ] App arranca sin crash (logcat limpio)
- [ ] Status bar overlay correcto
- [ ] `--app-statusbar-top` CSS variable se lee correctamente
- [ ] Header no tiene doble barra
- [ ] SQLite persiste entre sesiones
- [ ] Modo offline funciona (Airplane Mode)
- [ ] Push notifications (Firebase)
- [ ] `google-services.json` incluido en build
- [ ] Teclado ajusta correctamente (resize: body)
- [ ] FileCache descarga archivos
- [ ] SecureStorage usa EncryptedSharedPreferences

---

## Plugins Instalados — Verificar en android/

```bash
npx cap ls android
```

Deben aparecer:
- `@capacitor/app`
- `@capacitor/haptics`
- `@capacitor/keyboard`
- `@capacitor/push-notifications`
- `@capacitor/splash-screen`
- `@capacitor/filesystem`
- `@capacitor/preferences`
- `@capacitor-community/sqlite`
