# 🚀 Configuración Completa EAS para EGCHAT

## 📋 Estado Actual

✅ **Certificados y Profiles configurados:**
- Distribution Certificate: `3F8BB637607A483A0EA9B8EE53788872` (Expira: 22 Oct 2027)
- Apple Team: `XU6YD7ZJ2K` (JALLZ STORES PTY LTD)
- Bundle ID principal: `com.jallzstores.egchat`
- Extension Notificaciones: `com.jallzstores.egchat.EGChatNotifService`
- Extension Share: `com.jallzstores.egchat.EGChatShare`

✅ **Push Notifications Key encontrado:**
- Archivo: `.secrets/AuthKey_RCYN4AG5PM.p8`

## 🔧 Paso 1: Configurar Push Notifications en EAS

En el menú actual de EAS CLI:

1. **Selecciona:** `Push Notifications: Manage your Apple Push Notifications Key`
2. Cuando te pregunte, selecciona: `Upload a new push key`
3. Ingresa los datos de tu key:
   - **Key ID:** `RCYN4AG5PM` (del nombre del archivo .p8)
   - **Team ID:** `XU6YD7ZJ2K`
   - **Archivo .p8:** `.secrets/AuthKey_RCYN4AG5PM.p8`

### Comando alternativo (si prefieres CLI):
```bash
cd egchat-mobile
eas credentials
```

Luego:
- Selecciona: `iOS` > `Push Notifications Key`
- Upload your key

---

## 🔧 Paso 2: Verificar App Store Connect API Key

En el menú EAS CLI, después de configurar Push Notifications:

1. Vuelve al menú principal (Go back)
2. Selecciona: `App Store Connect: Manage your API Key`
3. Si no tienes una key configurada:
   - Ve a: https://appstoreconnect.apple.com/access/api
   - Crea un App Store Connect API Key con rol de "Developer"
   - Descarga el archivo `.p8`
   - Sube la key a EAS

---

## 🔧 Paso 3: Actualizar eas.json con Apple Team correcto

Tu `eas.json` tiene un Apple Team ID incorrecto. Voy a corregirlo:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu-apple-id@email.com",
        "ascAppId": "placeholder",
        "appleTeamId": "XU6YD7ZJ2K"  // ← Corregido
      }
    }
  }
}
```

---

## 🔧 Paso 4: Actualizar app.json con información correcta

Necesitas actualizar:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.jallzstores.egchat",
      "appleTeamId": "XU6YD7ZJ2K",  // ← Agregar esto
      "buildNumber": "143"
    }
  }
}
```

---

## 🔧 Paso 5: Configurar credenciales localmente

Ejecuta estos comandos:

```bash
cd egchat-mobile

# Verificar que EAS reconoce tus credenciales
eas credentials

# Ver configuración de iOS
eas credentials --platform ios

# Verificar push notifications
./verify-apns-config.sh
```

---

## 🔧 Paso 6: Test de notificaciones push

Una vez configurado todo:

```bash
# Instala la herramienta de testing
npm install -g apn

# O usa el servicio de Expo para testing
npx expo push:test
```

---

## 📦 Paso 7: Build de producción

Después de configurar todo:

```bash
# Build para TestFlight
eas build --platform ios --profile testflight

# Build para App Store
eas build --platform ios --profile production
```

---

## 🔍 Verificación de configuración

Ejecuta este comando para verificar que todo está correcto:

```bash
cd egchat-mobile
eas config
```

Deberías ver:
- ✅ Push Notifications Key configurado
- ✅ Distribution Certificate válido
- ✅ Provisioning Profiles activos
- ✅ App Store Connect API Key (opcional pero recomendado)

---

## 🚨 Problemas comunes

### Error: "No push key found"
```bash
eas credentials --platform ios
# Selecciona: Push Notifications Key > Upload
```

### Error: "Bundle identifier mismatch"
Verifica que `app.json` tenga:
```json
"bundleIdentifier": "com.jallzstores.egchat"
```

### Error: "Team ID not found"
Asegúrate de tener `appleTeamId: "XU6YD7ZJ2K"` en `app.json`

---

## 📝 Checklist final

- [ ] Push Notifications Key subido a EAS
- [ ] App Store Connect API Key configurado (opcional)
- [ ] `eas.json` con Team ID correcto: `XU6YD7ZJ2K`
- [ ] `app.json` con Team ID agregado
- [ ] Build credentials verificados con `eas credentials`
- [ ] Test de notificaciones exitoso
- [ ] Build de TestFlight exitoso

---

## 🆘 Comandos útiles

```bash
# Ver todas las credenciales
eas credentials

# Ver solo iOS
eas credentials --platform ios

# Limpiar credenciales (si algo falla)
eas credentials --clear

# Ver logs del último build
eas build:list

# Ver detalles de un build específico
eas build:view [BUILD_ID]
```

---

## 📞 Siguientes pasos

1. **Ahora mismo:** Configura Push Notifications en el menú EAS CLI
2. **Después:** Ejecuta los comandos de actualización de archivos
3. **Finalmente:** Haz un build de prueba con `eas build --platform ios --profile testflight`

¿Necesitas que te ayude con algún paso específico?
