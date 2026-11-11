# 🍎 EGCHAT — Guía Completa Apple Developer

> **Cuenta**: reddington120 | **Bundle ID**: `com.reddington120.egchat`  
> **EAS Project**: `6200ec00-54d7-4ef4-a348-56e80a1452f6`

---

## ÍNDICE

1. [Firebase — Completar configuración](#1-firebase--completar-configuración)
2. [APNs — Clave de notificaciones push](#2-apns--clave-de-notificaciones-push)
3. [Certificado VoIP para PushKit](#3-certificado-voip-para-pushkit)
4. [Provisioning Profiles](#4-provisioning-profiles)
5. [Expo prebuild + módulos nativos](#5-expo-prebuild--módulos-nativos)
6. [Xcode — Capabilities](#6-xcode--capabilities)
7. [App Groups (Widget + Share Extension)](#7-app-groups-widget--share-extension)
8. [Extensiones: Notification Service + Widget](#8-extensiones-notification-service--widget)
9. [Build y distribución EAS](#9-build-y-distribución-eas)
10. [Submit a App Store](#10-submit-a-app-store)
11. [Checklist final](#11-checklist-final)

---

## 1. Firebase — Completar configuración

### 1a. Obtener las claves del proyecto `egchat-4efe7`

1. Ir a [Firebase Console](https://console.firebase.google.com/project/egchat-4efe7)
2. **Configuración del proyecto** (rueda dentada) → **Tus aplicaciones**
3. Si no existe la app iOS con bundle `com.reddington120.egchat`, crearla:
   - Click **Añadir app** → iOS → Bundle ID: `com.reddington120.egchat`
   - Descargar `GoogleService-Info.plist` → colocarlo en `egchat-mobile/`
4. Para obtener las claves web (usadas en `.env`):
   - Click en la app **Web** → **Configuración del SDK**
   - Copiar cada valor al archivo `egchat-mobile/.env`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=egchat-4efe7.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://egchat-4efe7-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=egchat-4efe7
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=egchat-4efe7.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abc123
```

### 1b. Activar Realtime Database

1. Firebase Console → **Realtime Database** → Crear base de datos
2. Elegir región: `us-central1`
3. Reglas de inicio: **Modo bloqueado** (las actualizaremos)
4. Reglas de seguridad en la pestaña **Reglas**:

```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "$userId === auth.uid"
      }
    }
  }
}
```

---

## 2. APNs — Clave de notificaciones push

> Una sola clave APNs sirve para todas tus apps. Si ya tienes una, sáltate al paso 2c.

### 2a. Crear la clave APNs

1. Ir a [Apple Developer → Certificates, IDs & Profiles → Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Click **+** (Nueva clave)
3. Nombre: `EGChat APNs Key`
4. Marcar ✓ **Apple Push Notifications service (APNs)**
5. Click **Continue** → **Register** → **Download**
6. Guardar el archivo `.p8` — **solo se puede descargar una vez**

### 2b. Anotar los datos necesarios

| Dato | Dónde encontrarlo |
|------|-------------------|
| **Key ID** | Developer Portal → Keys → nombre de la clave |
| **Team ID** | Developer Portal → Account → Membership → Team ID |
| **Bundle ID** | `com.reddington120.egchat` |

### 2c. Subir la clave APNs al servidor Render

El servidor necesita la clave para enviar push. Añadir estas variables de entorno en [Render Dashboard](https://dashboard.render.com) → tu servicio → **Environment**:

```
APNS_KEY_ID=TU_KEY_ID
APNS_TEAM_ID=TU_TEAM_ID
APNS_BUNDLE_ID=com.reddington120.egchat
APNS_KEY_P8=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APNS_PRODUCTION=true
```

Para `APNS_KEY_P8`: abrir el archivo `.p8` y copiar todo el contenido incluyendo las cabeceras, reemplazando saltos de línea con `\n`.

### 2d. Subir la clave a EAS (para builds automáticos)

```bash
cd egchat-mobile
eas credentials --platform ios
# Seleccionar: Push Notifications → Upload APNs Key
# Proporcionar: archivo .p8, Key ID, Team ID
```

---

## 3. Certificado VoIP para PushKit

Las llamadas entrantes cuando la app está cerrada requieren un certificado VoIP **separado** del APNs normal.

### 3a. Crear App ID con VoIP

1. [Developer Portal → Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Buscar `com.reddington120.egchat` → click en él
3. Bajar hasta **Capabilities** → activar ✓ **Push Notifications**
4. Activar también ✓ **Associated Domains**

### 3b. Crear el certificado VoIP

1. [Developer Portal → Certificates → +](https://developer.apple.com/account/resources/certificates/add)
2. Tipo: **VoIP Services Certificate**
3. App ID: `com.reddington120.egchat`
4. Generar CSR desde Keychain Access en tu Mac:
   - Keychain Access → Asistente de Certificados → Solicitar un certificado
   - Guardar en disco como `egchat_voip_csr.certSigningRequest`
5. Subir el CSR → Download → doble click para instalar en Keychain
6. Exportar como `.p12`:
   - Keychain Access → Mis certificados → VoIP Services: EGCHAT
   - Click derecho → Exportar → formato `.p12` → poner contraseña

### 3c. Subir certificado VoIP al servidor

Añadir en Render:

```
VOIP_CERT_P12_BASE64=base64_del_archivo_p12
VOIP_CERT_PASSWORD=tu_contraseña
```

Para convertir a base64:
```bash
base64 -i egchat_voip.p12 | tr -d '\n'
```

---

## 4. Provisioning Profiles

### 4a. Crear App ID (si no existe)

1. [Developer Portal → Identifiers → +](https://developer.apple.com/account/resources/identifiers/add/bundleId)
2. Type: **App IDs** → App
3. Bundle ID: `com.reddington120.egchat` (Explicit)
4. Capabilities a marcar:
   - ✓ Associated Domains
   - ✓ Push Notifications
   - ✓ Sign In with Apple *(opcional)*
   - ✓ App Groups
   - ✓ Background Modes

### 4b. Crear Provisioning Profile de distribución

1. [Developer Portal → Profiles → +](https://developer.apple.com/account/resources/profiles/add)
2. Tipo: **App Store Connect** (para producción) o **Ad Hoc** (para pruebas internas)
3. App ID: `com.reddington120.egchat`
4. Certificado: tu certificado de distribución
5. Nombre: `EGChat AppStore Distribution`
6. Download → doble click para instalar

### 4c. EAS gestiona esto automáticamente

Con `autoCredentials: true` en `eas.json`, EAS crea y renueva profiles automáticamente. Solo necesitas:

```bash
eas credentials --platform ios
# Verificar que todo está en verde
```

---

## 5. Expo prebuild + módulos nativos

```bash
cd egchat-mobile

# 1. Generar carpeta ios/ nativa
npx expo prebuild --platform ios --clean

# 2. Copiar módulos Swift
chmod +x scripts/setup-ios-modules.sh
./scripts/setup-ios-modules.sh

# 3. Instalar pods
cd ios && pod install && cd ..
```

---

## 6. Xcode — Capabilities

```bash
open ios/EGChat.xcworkspace
```

### Target: EGChat → Signing & Capabilities

| Capability | Configuración |
|---|---|
| **Signing** | Team: tu equipo Developer |
| **Push Notifications** | Añadir capability |
| **Background Modes** | ✓ Audio, AirPlay<br>✓ Background fetch<br>✓ Remote notifications<br>✓ Voice over IP<br>✓ Background processing |
| **Associated Domains** | `applinks:egchat-app.vercel.app` |
| **App Groups** | `group.com.reddington120.egchat` |

### Añadir archivos Swift al proyecto

1. En Project Navigator → click derecho sobre el grupo `EGChat`
2. **Add Files to "EGChat"...**
3. Seleccionar todos los `.swift` y `.m` copiados por `setup-ios-modules.sh`
4. Verificar: **Target Membership: EGChat ✓**
5. Si aparece el diálogo de Bridging Header, click **Create Bridging Header**

### Verificar Bridging Header

Asegurarse de que `ios/EGChat/EGChat-Bridging-Header.h` contiene:

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTViewManager.h>
```

---

## 7. App Groups (Widget + Share Extension)

El widget y la Share Extension comparten datos con la app principal via App Group.

### 7a. Crear App Group en Developer Portal

1. [Developer Portal → Identifiers → App Groups → +](https://developer.apple.com/account/resources/identifiers/add/applicationGroup)
2. Description: `EGChat Shared`
3. Identifier: `group.com.reddington120.egchat`
4. Register

### 7b. Asociar al App ID

1. Developer Portal → Identifiers → `com.reddington120.egchat`
2. App Groups → Edit → seleccionar `group.com.reddington120.egchat`
3. Save

### 7c. En Xcode

Para **cada target** (EGChat, EGChatWidget, EGChatNotifService):
- Signing & Capabilities → **+ App Groups**
- Seleccionar `group.com.reddington120.egchat`

---

## 8. Extensiones: Notification Service + Widget

### 8a. Notification Service Extension

Permite enriquecer push con imágenes antes de mostrarlos.

1. Xcode → **File → New → Target**
2. Tipo: **Notification Service Extension**
3. Nombre: `EGChatNotifService`
4. Bundle ID se auto-genera: `com.reddington120.egchat.EGChatNotifService`
5. Reemplazar `NotificationService.swift` generado con el de `ios/EGChatNotifService/`
6. Target → Signing & Capabilities:
   - Team: tu equipo
   - App Groups: `group.com.reddington120.egchat`

### 8b. Widget Extension

1. Xcode → **File → New → Target**
2. Tipo: **Widget Extension**
3. Nombre: `EGChatWidget`
4. ✓ **Include Live Activity**
5. Bundle ID: `com.reddington120.egchat.EGChatWidget`
6. Reemplazar `EGChatWidgetBundle.swift` con el contenido de `ios-native-modules/EGChatWidgetModule.swift`
7. Target → Signing & Capabilities:
   - Team: tu equipo
   - App Groups: `group.com.reddington120.egchat`

### 8c. Verificar Info.plist del Widget target

```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.widgetkit-extension</string>
</dict>
```

---

## 9. Build y distribución EAS

### Build preview (APK Android + IPA interno iOS)

```bash
cd egchat-mobile

# Android APK
eas build --profile preview --platform android

# iOS IPA (distribución interna)
eas build --profile preview --platform ios
```

### Build producción

```bash
# Ambas plataformas
eas build --profile production --platform all
```

EAS pedirá tus credenciales Apple la primera vez. Con `autoCredentials: true` en `eas.json` se gestionan automáticamente.

### Actualizar eas.json con tu Team ID real

Una vez tengas el Team ID de tu cuenta Developer, actualizar:

```json
// eas.json → submit → production → ios
"appleId": "tu@email.com",
"ascAppId": "ID_DE_APP_EN_APP_STORE_CONNECT",
"appleTeamId": "TU_TEAM_ID"
```

---

## 10. Submit a App Store

### 10a. Crear la app en App Store Connect

1. Ir a [App Store Connect](https://appstoreconnect.apple.com)
2. **Mis apps → +**
3. Plataformas: iOS
4. Nombre: `EGCHAT`
5. Bundle ID: `com.reddington120.egchat`
6. SKU: `egchat-001`

### 10b. Submit desde EAS

```bash
eas submit --platform ios --latest
# Usa el último build de producción
```

O especificando un build:
```bash
eas submit --platform ios --id BUILD_ID
```

### 10c. Información requerida para revisión

Preparar antes de enviar:

- **Capturas de pantalla**: iPhone 6.7" (1290×2796) y 6.1" (1179×2556) — mínimo 3 por tamaño
- **Descripción**: en español (mercado principal Guinea Ecuatorial)
- **Política de privacidad**: URL pública (puedes usar `egchat-app.vercel.app/privacy`)
- **Categoría**: Social Networking
- **Rating**: 4+ (ajustar según contenido)
- **URL de soporte**: `egchat-app.vercel.app/support`

---

## 11. Checklist final

### Firebase
- [ ] `GoogleService-Info.plist` descargado y en `egchat-mobile/`
- [ ] Variables `EXPO_PUBLIC_FIREBASE_*` completadas en `.env`
- [ ] Realtime Database creada y reglas configuradas

### Apple Developer Portal
- [ ] App ID `com.reddington120.egchat` creado con capabilities
- [ ] APNs Key descargada (archivo `.p8` guardado en lugar seguro)
- [ ] Certificado VoIP creado y exportado como `.p12`
- [ ] App Group `group.com.reddington120.egchat` creado
- [ ] Provisioning Profile creado

### Servidor Render
- [ ] `APNS_KEY_ID` configurado
- [ ] `APNS_TEAM_ID` configurado
- [ ] `APNS_KEY_P8` configurado
- [ ] `APNS_BUNDLE_ID=com.reddington120.egchat` configurado
- [ ] `VOIP_CERT_P12_BASE64` configurado
- [ ] `VOIP_CERT_PASSWORD` configurado

### Xcode
- [ ] `expo prebuild` ejecutado
- [ ] `setup-ios-modules.sh` ejecutado
- [ ] `pod install` ejecutado
- [ ] Módulos Swift añadidos al proyecto
- [ ] Capability: Push Notifications
- [ ] Capability: Background Modes (remote-notification + voip)
- [ ] Capability: App Groups
- [ ] Capability: Associated Domains
- [ ] Extensión EGChatNotifService creada
- [ ] Extensión EGChatWidget creada
- [ ] Build sin errores (Cmd+B)

### EAS
- [ ] `eas credentials` verificado (todo en verde)
- [ ] `eas.json` actualizado con Team ID y ASC App ID reales
- [ ] Build preview exitoso (Android + iOS)
- [ ] Build production exitoso

### App Store Connect
- [ ] App creada
- [ ] Capturas de pantalla preparadas
- [ ] Descripción y metadatos completos
- [ ] Política de privacidad URL configurada
- [ ] Submit enviado para revisión

---

## Comandos de referencia rápida

```bash
# Desde egchat-mobile/

# Verificar configuración EAS
eas whoami
eas credentials --platform ios

# Build
eas build --profile preview --platform android    # APK pruebas Android
eas build --profile preview --platform ios        # IPA pruebas iOS
eas build --profile production --platform all     # Producción ambas

# Submit
eas submit --platform ios --latest

# Diagnóstico push (desde la app)
# Ajustes → Diagnóstico Push

# Actualizar OTA (sin nuevo build)
eas update --channel production --message "Fix bug X"

# Prebuild iOS
npx expo prebuild --platform ios --clean
./scripts/setup-ios-modules.sh
cd ios && pod install && cd ..
open ios/EGChat.xcworkspace
```

---

*Última actualización: configuración completa para cuenta Apple Developer activa.*
*Bundle ID: `com.reddington120.egchat` | EAS Owner: `reddington120`*
