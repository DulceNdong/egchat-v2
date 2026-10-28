# 🚀 Deploy a TestFlight - EGCHAT

Guía completa para deployar EGCHAT a TestFlight (iOS) y distribuir APKs a testers Android.

---

## 📋 Prerrequisitos

### 1. Cuenta de Apple Developer
- ✅ Apple ID: `reddington120@icloud.com`
- ✅ Team ID: `XU6YD7ZJ2K`
- ✅ App Store Connect App ID: `6810877584`

### 2. Herramientas instaladas
```bash
# Verificar que tienes EAS CLI
npm install -g eas-cli

# Login en EAS
eas login
# Usar cuenta: dutti98 (owner del proyecto EAS)
```

### 3. Verificar configuración
```bash
cd egchat-mobile
cat eas.json | grep -A 20 "testflight"
```

---

## 🎯 Opción 1: Script Automatizado (RECOMENDADO)

### Usar el script de deploy

```bash
cd egchat-mobile
./deploy-testflight.sh
```

El script te preguntará:
1. **Plataforma**: iOS, Android, o ambas
2. **Auto-submit**: Si quieres subir a TestFlight automáticamente

### Lo que hace el script automáticamente:
- ✅ Verifica que estés en la rama `mobile`
- ✅ Verifica que no haya cambios sin commitear
- ✅ Muestra versión actual
- ✅ Buildea iOS/Android según tu elección
- ✅ Auto-incrementa el build number (iOS)
- ✅ Opcionalmente sube a TestFlight

---

## 🛠️ Opción 2: Comandos Manuales

### iOS - Build para TestFlight

```bash
cd egchat-mobile

# Build con perfil testflight
npx eas-cli build --profile testflight --platform ios

# Espera a que termine (~15-20 minutos)
# Luego sube a TestFlight automáticamente:
npx eas-cli submit --profile testflight --platform ios --latest
```

### Android - Build APK para testers

```bash
cd egchat-mobile

# Build APK arm64 (dispositivos modernos)
npx eas-cli build --profile testflight --platform android

# Descarga el APK desde:
# https://expo.dev/accounts/dutti98/projects/egchat-frontend/builds
```

---

## 📱 Configuración del perfil "testflight"

### eas.json - Profile testflight
```json
{
  "testflight": {
    "distribution": "internal",
    "channel": "testflight",
    "ios": {
      "autoIncrement": true,        // ✅ Auto-incrementa buildNumber
      "resourceClass": "m-medium",  // Build rápido
      "buildConfiguration": "Release"
    },
    "android": {
      "buildType": "apk",          // APK directo (no AAB)
      "gradleCommand": ":app:assembleRelease -PreactNativeArchitectures=arm64-v8a"
    }
  }
}
```

### Variables de entorno incluidas
- ✅ API producción: `https://egchat-api-xlxj.onrender.com`
- ✅ Supabase producción
- ✅ Firebase FCM configurado
- ✅ TURN servers para WebRTC
- ✅ Push notifications habilitadas
- ✅ VoIP habilitado

---

## 🎯 Después del Build iOS

### 1. Monitorear el build
```bash
# Ver builds en progreso
eas build:list --platform ios

# O visita el dashboard:
# https://expo.dev/accounts/dutti98/projects/egchat-frontend/builds
```

### 2. App Store Connect
Una vez que EAS suba el build a TestFlight:

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Login con `reddington120@icloud.com`
3. **My Apps** → **EGCHAT**
4. **TestFlight** tab
5. Espera a que el build sea procesado (~10-15 min)

### 3. Agregar testers
En TestFlight dentro de App Store Connect:

**Opción A: Testers internos**
- App Store Connect Users (tu equipo)
- Reciben notificación automáticamente
- No necesitan revisión de Apple

**Opción B: Testers externos**
- Hasta 10,000 testers
- Necesita revisión de Apple (Beta App Review)
- Agrega emails manualmente o por link público

### 4. Enviar a testers
```
TestFlight → Builds → [Tu build] → Groups
→ Selecciona grupo de testers
→ "Start Testing"
```

Los testers recibirán un email con:
- Link para instalar TestFlight app
- Código de invitación
- Instrucciones

---

## 🤖 Después del Build Android

### 1. Descargar el APK

```bash
# Desde CLI
eas build:download --platform android --latest

# O visita:
# https://expo.dev/accounts/dutti98/projects/egchat-frontend/builds
```

### 2. Distribuir a testers

**Opción A: Link directo**
- Sube el APK a Google Drive / Dropbox
- Comparte el link con testers
- Los testers deben habilitar "Unknown sources"

**Opción B: Firebase App Distribution**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Distribuir
firebase appdistribution:distribute \
  build-xxx.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers"
```

**Opción C: Play Console - Internal Testing**
- Sube a Google Play Console
- Track: Internal Testing
- Agrega emails de testers

---

## 🔄 Actualizar una build existente

### Incrementar versión

Edita `egchat-mobile/app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // ← Incrementa versión
    "ios": {
      "buildNumber": "120"  // ← Se auto-incrementa con testflight profile
    }
  }
}
```

Luego repite el proceso de build.

---

## 📊 Monitoreo y Logs

### Ver builds en EAS
```bash
eas build:list --platform all
```

### Ver logs de un build específico
```bash
eas build:view [BUILD_ID]
```

### TestFlight Crashes
En App Store Connect:
```
TestFlight → Crashes
```

### Android Crashes
En Firebase Console:
```
Crashlytics → Dashboard
```

---

## ⚠️ Troubleshooting

### Error: "Build number already exists"
```bash
# El buildNumber en app.json ya existe en App Store Connect
# Solución: EAS auto-incrementa con profile testflight, pero si falla:
eas build --profile testflight --platform ios --clear-cache
```

### Error: "Provisioning profile expired"
```bash
# Tu certificado expiró
eas credentials --platform ios
# Selecciona "Manage credentials" → "Remove and regenerate"
```

### Error: "Android build failed - out of memory"
```bash
# Gradle se quedó sin memoria
# Ya configurado en eas.json:
# GRADLE_OPTS: "-Dorg.gradle.jvmargs=-Xmx4096m"
```

### Build muy lento
```bash
# Usa resourceClass mayor (cuesta más):
"ios": {
  "resourceClass": "m-large"  // En lugar de m-medium
}
```

---

## 🎉 Checklist de Deploy

Antes de deployar a TestFlight:

- [ ] Backend actualizado en Render con últimos cambios
- [ ] Commit y push a rama `mobile`
- [ ] `git status` limpio (no cambios sin commitear)
- [ ] Version incrementada en `app.json` (si es update)
- [ ] Testeado localmente con `expo start`
- [ ] EAS login activo (`eas whoami`)
- [ ] Certificados iOS válidos
- [ ] Firebase google-services.json actualizado

Durante el deploy:

- [ ] Build completado exitosamente
- [ ] Submit a TestFlight exitoso
- [ ] Build visible en App Store Connect
- [ ] Build procesado (status: Ready to Submit)
- [ ] Testers agregados en TestFlight
- [ ] Notificación enviada a testers

Después del deploy:

- [ ] Testers confirman recepción del email
- [ ] App se instala correctamente vía TestFlight
- [ ] Features críticos funcionan (login, llamadas, chat)
- [ ] Bug del ringtone RESUELTO ✅

---

## 📞 Soporte

**Documentación EAS:**
- https://docs.expo.dev/build/introduction/
- https://docs.expo.dev/submit/introduction/

**App Store Connect:**
- https://developer.apple.com/testflight/

**Issues comunes:**
- https://docs.expo.dev/build-reference/troubleshooting/

---

## 🔗 Links Útiles

- **EAS Dashboard**: https://expo.dev/accounts/dutti98/projects/egchat-frontend
- **App Store Connect**: https://appstoreconnect.apple.com
- **Firebase Console**: https://console.firebase.google.com
- **Render Backend**: https://dashboard.render.com
- **Supabase**: https://supabase.com/dashboard

---

*Última actualización: 28 Oct 2026 - v1.0.0 (build 120)*
