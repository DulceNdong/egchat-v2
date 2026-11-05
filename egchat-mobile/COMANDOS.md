# 📝 Comandos Rápidos EGCHAT

## 🚀 Configuración Inicial

```bash
# 1. Ir al directorio del proyecto
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# 2. Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# 3. Login en EAS
eas login

# 4. Ejecutar configuración automática
./complete-eas-setup.sh
```

---

## 🔐 Gestión de Credenciales

```bash
# Ver todas las credenciales
eas credentials

# Ver solo iOS
eas credentials --platform ios

# Ver solo Android
eas credentials --platform android

# Ver información del proyecto
eas config

# Ver quien está logueado
eas whoami
```

---

## 🏗️ Builds

```bash
# Build para desarrollo (APK Android)
eas build --platform android --profile development

# Build para TestFlight (iOS)
eas build --platform ios --profile testflight

# Build para producción (ambas plataformas)
eas build --platform all --profile production

# Build solo Android para Google Play
eas build --platform android --profile production

# Build solo iOS para App Store
eas build --platform ios --profile production

# Ver lista de builds
eas build:list

# Ver detalles de un build
eas build:view [BUILD_ID]

# Cancelar un build
eas build:cancel [BUILD_ID]
```

---

## 📤 Subir a Stores

```bash
# Subir a TestFlight (después de un build exitoso)
eas submit --platform ios --latest

# Subir a Google Play
eas submit --platform android --latest

# Subir un build específico
eas submit --platform ios --id [BUILD_ID]
```

---

## 🔍 Verificación

```bash
# Verificar configuración APNS
./verify-apns-config.sh

# Ver configuración del proyecto
cat app.json | grep -A 10 "ios"
cat eas.json | jq

# Verificar que todo compile
npx expo prebuild --clean

# Verificar TypeScript
npm run typecheck  # (si lo tienes configurado)
```

---

## 🧹 Limpieza y Reset

```bash
# Limpiar cache de Expo
npx expo start --clear

# Limpiar node_modules
rm -rf node_modules && npm install

# Limpiar todo y reinstalar
rm -rf node_modules ios android .expo
npm install
npx expo prebuild --clean

# Limpiar credenciales (CUIDADO!)
eas credentials --clear
```

---

## 📱 Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npx expo start

# Iniciar con cache limpio
npx expo start --clear

# Iniciar solo para iOS
npx expo start --ios

# Iniciar solo para Android
npx expo start --android

# Iniciar en modo web
npx expo start --web

# Generar código nativo (prebuild)
npx expo prebuild

# Limpiar y regenerar código nativo
npx expo prebuild --clean
```

---

## 🔔 Push Notifications Testing

```bash
# Enviar notificación de prueba (necesitas Expo token)
npx expo push:test

# Ver logs de notificaciones
eas device:list

# Registrar un dispositivo para testing
eas device:create
```

---

## 📊 Logs y Debugging

```bash
# Ver logs de un build
eas build:view [BUILD_ID]

# Ver logs en tiempo real durante desarrollo
npx expo start

# Ver logs de dispositivo iOS conectado
xcrun simctl spawn booted log stream --level debug

# Ver logs de Android
adb logcat | grep -i egchat
```

---

## 🎯 Comandos más usados (Tu workflow diario)

```bash
# 1. Desarrollo normal
cd egchat-mobile
npx expo start

# 2. Hacer un build de prueba para TestFlight
eas build --platform ios --profile testflight

# 3. Verificar el build
eas build:list

# 4. Si el build es exitoso, subir a TestFlight
eas submit --platform ios --latest
```

---

## 🔧 Scripts útiles del proyecto

```bash
# Configurar todo automáticamente
./complete-eas-setup.sh

# Configurar solo push notifications
./setup-push.sh

# Verificar configuración APNS
./verify-apns-config.sh
```

---

## 💡 Tips

1. **Siempre verifica credenciales antes de un build:**
   ```bash
   eas credentials --platform ios
   ```

2. **Usa profiles específicos para cada ambiente:**
   - `development` - Para pruebas rápidas
   - `preview` - Para testing interno
   - `testflight` - Para TestFlight
   - `production` - Para producción

3. **Guarda los BUILD_ID importantes:**
   ```bash
   eas build:list | grep FINISHED
   ```

4. **Verifica siempre antes de producción:**
   ```bash
   ./verify-apns-config.sh
   eas config
   ```

---

## 🆘 Comandos de emergencia

```bash
# Si algo se rompe completamente
rm -rf node_modules ios android .expo
npm install
npx expo prebuild --clean
eas build --platform ios --profile development --clear-cache

# Si las credenciales están mal
eas credentials --clear
eas credentials

# Si el build falla por cache
eas build --platform ios --profile testflight --clear-cache
```

---

## 📞 Contacto

Si necesitas ayuda:
1. Revisa los logs: `eas build:view [BUILD_ID]`
2. Verifica la configuración: `./verify-apns-config.sh`
3. Consulta la documentación: https://docs.expo.dev/eas/

---

**Última actualización:** Ahora mismo 🚀
