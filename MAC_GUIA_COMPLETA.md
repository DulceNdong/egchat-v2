# 📱 Guía Completa para Compilar EGCHAT en Mac

## ⚡ OPCIÓN RÁPIDA — Un solo comando

Copia el proyecto al Mac y ejecuta:

```bash
bash build-ios.sh
```

El script hace todo automáticamente: `npm install` → `npm run build` → `cap sync ios` → `pod install` → abre Xcode.

---

## 🛠️ PREREQUISITOS DEL MAC

### 1. Xcode (obligatorio)
```bash
# Instalar desde App Store o:
xcode-select --install

# Verificar versión (requiere Xcode 15+)
xcodebuild -version
```

### 2. CocoaPods (obligatorio)
```bash
sudo gem install cocoapods
pod --version   # debe mostrar 1.14+
```

### 3. Node.js 20+ (obligatorio)
```bash
# Con Homebrew (recomendado):
brew install node@20

# Verificar
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 4. Homebrew (recomendado)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## 📋 PASOS PASO A PASO

### Paso 1 — Copiar el proyecto al Mac

**Opción A: GitHub (recomendado)**
```bash
git clone https://github.com/DulceNdong/egchat-v2.git
cd egchat-v2
```

**Opción B: USB/AirDrop**
```bash
# Copiar EGCHAT_BACKUP_20260320/ al Mac
cd /ruta/a/EGCHAT_BACKUP_20260320
```

### Paso 2 — Instalar dependencias Node
```bash
npm install --legacy-peer-deps
```

### Paso 3 — Build del frontend
```bash
npm run build
```
Resultado esperado: `✔ built in X.Xs`

### Paso 4 — Sincronizar con Capacitor
```bash
npx cap sync ios
```
Resultado esperado: `Sync finished in X.XXs`

### Paso 5 — Instalar CocoaPods
```bash
cd ios/App
pod install --repo-update
cd ../..
```
⚠️ La primera vez tarda 3-10 minutos — descarga repositorio de specs de CocoaPods.

**Pods que se instalan:**
```
Capacitor                      6.x  — core del webview nativo
CapacitorCordova               6.x  — compatibilidad plugins
CapacitorApp                   6.x  — lifecycle (background/foreground)
CapacitorFilesystem            6.x  — FileCache (avatares, imágenes)
CapacitorHaptics               6.x  — vibración
CapacitorKeyboard              6.x  — ajuste teclado
CapacitorPreferences           6.x  — SecureStorage (Keychain)
CapacitorPushNotifications     6.x  — push notifications FCM
CapacitorSplashScreen          6.x  — pantalla de carga
CapacitorCommunitySQLite       6.x  — SQLite con SQLCipher (AES-256)
```

### Paso 6 — Abrir en Xcode
```bash
open ios/App/App.xcworkspace
```
⚠️ **IMPORTANTE:** Abrir `.xcworkspace`, NO `.xcodeproj`

---

## ⚙️ CONFIGURACIÓN EN XCODE

### 6.1 Signing & Capabilities

1. Click en **App** en el árbol de la izquierda
2. Seleccionar target **App**
3. Tab **Signing & Capabilities**
4. **Team:** selecciona tu Apple Developer Team
5. **Bundle Identifier:** `com.egchat.app`
6. Marcar **Automatically manage signing** ✓

### 6.2 Capabilities (añadir si no aparecen)

Click en **+ Capability** y añadir:
- ✅ **Push Notifications**
- ✅ **Background Modes**
  - ✅ Background fetch
  - ✅ Remote notifications
- ✅ **Keychain Sharing** (para SecureStorage — tokens en Keychain)

### 6.3 Info.plist — Permisos

Verificar que existan estas claves (ya deberían estar, si no añadir):

```xml
<key>NSCameraUsageDescription</key>
<string>EGCHAT necesita la cámara para fotos y videollamadas</string>

<key>NSMicrophoneUsageDescription</key>
<string>EGCHAT necesita el micrófono para notas de voz y llamadas</string>

<key>NSContactsUsageDescription</key>
<string>EGCHAT puede importar tus contactos para facilitar el chat</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>EGCHAT usa tu ubicación para MiTaxi y servicios locales</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>EGCHAT necesita acceso a tus fotos para compartirlas</string>
```

### 6.4 Build Settings

En **Build Settings** → buscar:
- **iOS Deployment Target:** `14.0`
- **Swift Language Version:** `Swift 5`

---

## 📦 GENERAR IPA

### Para App Store (producción)
```
Product → Archive
```
Esperar que compile (2-5 min). Luego:
```
Window → Organizer → Archives
→ Seleccionar el archive más reciente
→ Distribute App
→ App Store Connect
→ Upload
```

### Para Ad Hoc / TestFlight (beta)
```
Product → Archive
→ Distribute App
→ Ad Hoc
→ Seleccionar dispositivos
→ Export
```

### Para dispositivo directo (testing)
```
Conectar iPhone por USB
Product → Run (⌘R)
```

---

## ✅ VERIFICACIONES ANTES DE ARCHIVE

```bash
# En terminal, desde raíz del proyecto:

# 1. Verificar que el build está actualizado
npm run build && echo "✅ Build OK"

# 2. Verificar que cap sync está al día
npx cap sync ios && echo "✅ Cap sync OK"

# 3. Verificar que los pods están instalados
ls ios/App/Pods/ && echo "✅ Pods OK"

# 4. Verificar que el workspace existe
ls ios/App/App.xcworkspace && echo "✅ Workspace OK"
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "No such module 'Capacitor'"
```bash
cd ios/App && pod deintegrate && pod install
```

### Error: "Sandbox not in sync"
```bash
npx cap sync ios
cd ios/App && pod install
```

### Error: Signing Certificate
```
Xcode → Preferences → Accounts → Add Apple ID
Luego en Signing & Capabilities seleccionar tu Team
```

### Error: "Multiple commands produce..."
```
Product → Clean Build Folder (⇧⌘K)
Luego Archive de nuevo
```

### Pod install muy lento
```bash
# Actualizar repo de specs manualmente:
pod repo update
```

### Error SQLCipher / CapacitorCommunitySQLite
```bash
# Si hay error compilando el pod de SQLite:
cd ios/App
pod update CapacitorCommunitySQLite
```

---

## 📊 INFO DEL PROYECTO

| Campo | Valor |
|---|---|
| Bundle ID | com.egchat.app |
| Version | 2.5.4 |
| Build Number | 7 |
| iOS Mínimo | 14.0 |
| Capacitor | 6.x |
| Node requerido | 18+ |
| Xcode requerido | 15+ |
| CocoaPods | 1.14+ |

---

## 🔑 URLS DE PRODUCCIÓN

```
Frontend:  https://egchat-v2.vercel.app
API:       https://egchat-api.onrender.com
WebSocket: wss://egchat-api.onrender.com/ws
Repo:      https://github.com/DulceNdong/egchat-v2.git
```

---

## 📝 VERSIÓN ESTABLE CONOCIDA

El proyecto funciona correctamente en iPhone PWA en:
- Git: master branch, commit **3b59aa0**
- Bundle: 835 kB (con code splitting + minificación)
- Configuración iOS: safe-area + WebSocket + SQLCipher

**⛔ NO MODIFICAR sin verificar:**
- `viewPadding.top/bottom` en App.tsx
- `env(safe-area-inset-top)` en headers
- `height: 44px` del header
- `height: 64px` del tab bar
