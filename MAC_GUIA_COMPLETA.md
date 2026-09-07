# 📱 Guía Completa — Compilar EGCHAT en Mac para IPA
### Estado: Junio 2026 — v2.5.4 (Build 7)

---

## 🧳 QUÉ LLEVAR AL MAC

### Opción A: USB / AirDrop (recomendado si no tienes git configurado en Mac)
Copia **toda la carpeta** `EGCHAT_BACKUP_20260320` al Mac.

> ⚠️ **Archivos que NO necesitas copiar** (son pesados y se regeneran):
> - `node_modules/` → se regenera con `npm install`
> - `dist/` → se regenera con `npm run build`
> - `ios/App/Pods/` → se regenera con `pod install`
> - `ios/App/App.xcworkspace` → se regenera con `pod install`
> - `.git/` → opcional, solo si quieres historial de commits

Carpeta limpia estimada: **~50 MB** sin esas carpetas

### Opción B: GitHub
```bash
git clone https://github.com/DulceNdong/egchat-v2.git
cd egchat-v2
```

---

## 📋 ARCHIVOS CLAVE DEL PROYECTO (verificar que están)

```
EGCHAT_BACKUP_20260320/
├── src/                          ← código fuente React
├── public/                       ← assets estáticos (iconos, splash)
├── ios/
│   └── App/
│       ├── App/
│       │   ├── AppDelegate.swift  ← push notifications + deep links
│       │   ├── Info.plist         ← permisos + bundle ID
│       │   ├── Assets.xcassets/   ← iconos de la app
│       │   └── public/            ← web assets copiados por cap sync
│       └── Podfile                ← dependencias CocoaPods
├── capacitor.config.ts            ← config Capacitor (bundle ID, plugins)
├── package.json                   ← v2.5.4, deps Node
├── vite.config.ts                 ← build config con code splitting
├── sw.js                          ← service worker (egchat-push-v20260602)
├── App.tsx                        ← layout principal (safe-area iPhone)
└── build-ios.sh                   ← script automático
```

---

## 🛠️ PREREQUISITOS DEL MAC

### 1. Xcode 15+ (obligatorio)
```bash
# Verificar:
xcodebuild -version
# Si no está: instalar desde App Store (Xcode, ~15 GB)
# Aceptar licencia:
sudo xcodebuild -license accept
```

### 2. CocoaPods (obligatorio)
```bash
sudo gem install cocoapods
pod --version   # debe mostrar 1.14+
```
> Si da error con Ruby en macOS Sonoma/Ventura:
> ```bash
> brew install cocoapods
> ```

### 3. Node.js 20+ (obligatorio)
```bash
brew install node@20
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 4. Homebrew (si no lo tienes)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## ⚡ OPCIÓN RÁPIDA — Un solo comando

Desde la raíz del proyecto:
```bash
bash build-ios.sh
```
El script hace: verificar herramientas → `npm install` → `npm run build` → `cap sync ios` → `pod install` → abre Xcode.

---

## 🔢 PASOS MANUALES (si prefieres hacerlo tú)

### Paso 1 — Instalar dependencias
```bash
npm install --legacy-peer-deps
```
> `--legacy-peer-deps` es necesario por conflicto entre React 19 y algunas deps

### Paso 2 — Build del frontend
```bash
npm run build
```
Resultado esperado: `✔ built in X.Xs`, carpeta `dist/` creada

### Paso 3 — Sincronizar Capacitor
```bash
npx cap sync ios
```
Copia `dist/` → `ios/App/App/public/` y actualiza plugins

### Paso 4 — Instalar CocoaPods
```bash
cd ios/App
pod install --repo-update
cd ../..
```
⚠️ La primera vez tarda 5-15 min (descarga specs de CocoaPods)

**Pods que se instalan:**
| Pod | Versión | Para qué |
|-----|---------|----------|
| Capacitor | 6.x | Core WebView nativo |
| CapacitorCordova | 6.x | Compatibilidad plugins |
| CapacitorApp | 6.x | Lifecycle app |
| CapacitorFilesystem | 6.x | Cache avatares/imágenes |
| CapacitorHaptics | 6.x | Vibración táctil |
| CapacitorKeyboard | 6.x | Ajuste teclado |
| CapacitorPreferences | 6.x | SecureStorage (Keychain) |
| CapacitorPushNotifications | 6.x | Push notifications FCM/APNs |
| CapacitorSplashScreen | 6.x | Pantalla de carga |
| CapacitorCommunitySQLite | 6.x | SQLite + SQLCipher AES-256 |

### Paso 5 — Abrir en Xcode
```bash
open ios/App/App.xcworkspace
```
> ⚠️ **SIEMPRE** abrir `.xcworkspace`, NUNCA `.xcodeproj`

---

## ⚙️ CONFIGURACIÓN EN XCODE

### A) Signing & Capabilities

1. En el árbol izquierdo → click en **App** (raíz del proyecto)
2. Target → **App**
3. Tab → **Signing & Capabilities**
4. **Team:** tu Apple Developer Team (necesitas cuenta pagada para distribuir)
5. **Bundle Identifier:** `com.egchat.app`
6. Marcar **Automatically manage signing** ✓

### B) Capabilities — verificar que están presentes

Click `+ Capability` y añadir si faltan:
- ✅ **Push Notifications**
- ✅ **Background Modes**
  - ✅ Background fetch
  - ✅ Remote notifications
  - ✅ Voice over IP (VoIP)
- ✅ **Keychain Sharing** (para SecureStorage — tokens en Keychain)

### C) Build Settings

Buscar en Build Settings:
| Campo | Valor |
|-------|-------|
| iOS Deployment Target | **14.0** |
| Swift Language Version | **Swift 5** |
| Version (CFBundleShortVersionString) | **2.5.4** |
| Build (CFBundleVersion) | **7** |

### D) Info.plist — ya configurado

El `Info.plist` ya tiene todos los permisos necesarios:
- Cámara, Micrófono, Fotos, Contactos, Ubicación, Face ID
- Background modes: fetch + remote-notification + voip
- Deep links: `egchat://`
- Bundle ID: `com.egchat.app`

> No hace falta tocar nada salvo que Apple rechace la build por un permiso que falta.

---

## 📦 GENERAR IPA

### Para App Store Connect (producción)
```
Product → Archive
```
Esperar compilación (2-5 min). Luego:
```
Window → Organizer → Archives
→ Seleccionar el archive más reciente
→ "Distribute App"
→ "App Store Connect"
→ "Upload"
```

### Para Ad Hoc / TestFlight (beta, enviar a testers)
```
Product → Archive
→ "Distribute App"
→ "Ad Hoc"
→ Seleccionar dispositivos registrados
→ Export IPA
```

### Para dispositivo directo (testing sin cuenta pagada)
```
Conectar iPhone por USB
Product → Run (⌘R)
```
> Requiere que el dispositivo esté registrado en tu Team de desarrollo

---

## ✅ CHECKLIST ANTES DE ARCHIVE

```bash
# 1. Build actualizado
npm run build && echo "✅ Build OK"

# 2. Cap sync al día
npx cap sync ios && echo "✅ Cap sync OK"

# 3. Pods instalados
ls ios/App/Pods/ && echo "✅ Pods OK"

# 4. Workspace existe
ls ios/App/App.xcworkspace && echo "✅ Workspace OK"
```

En Xcode antes de Archive:
- [ ] Team seleccionado en Signing
- [ ] Bundle ID: `com.egchat.app`
- [ ] Version: `2.5.4` / Build: `7`
- [ ] Deployment Target: iOS 14.0
- [ ] No hay errores rojos en el árbol del proyecto
- [ ] Product → Clean Build Folder (⇧⌘K) antes de archivar

---

## 🚨 PROBLEMAS COMUNES

### "No such module 'Capacitor'"
```bash
cd ios/App && pod deintegrate && pod install
```

### "Sandbox not in sync with the Podfile.lock"
```bash
npx cap sync ios
cd ios/App && pod install
```

### Error de Signing Certificate
```
Xcode → Settings → Accounts → Add Apple ID
Luego en Signing & Capabilities seleccionar tu Team
```

### "Multiple commands produce..."
```
Product → Clean Build Folder (⇧⌘K)
Luego Archive de nuevo
```

### pod install muy lento / falla
```bash
pod repo update   # actualiza specs manualmente
pod install
```

### Error compilando CapacitorCommunitySQLite
```bash
cd ios/App
pod update CapacitorCommunitySQLite
```

### Error en npm install con Node 20
```bash
npm install --legacy-peer-deps --force
```

### "xcrun: error: unable to find utility 'xcodebuild'"
```bash
sudo xcode-select --switch /Applications/Xcode.app
sudo xcodebuild -license accept
```

---

## 📊 DATOS DEL PROYECTO

| Campo | Valor |
|-------|-------|
| App Name | EGCHAT |
| Bundle ID | `com.egchat.app` |
| Versión | 2.5.4 |
| Build Number | 7 |
| iOS mínimo | 14.0 |
| Capacitor | 6.x |
| Node requerido | 18+ (recomendado 20+) |
| Xcode requerido | 15+ |
| CocoaPods | 1.14+ |
| SW versión | egchat-push-v20260602 |

---

## 🔑 URLS DE PRODUCCIÓN (para verificar que la app conecta)

```
Frontend:  https://egchat-v2.vercel.app
API:       https://egchat-api-xlxj.onrender.com
WebSocket: wss://egchat-api-xlxj.onrender.com/ws
```

---

## ⛔ REGLAS IPHONE — NO MODIFICAR

Estos valores están funcionando correctamente y **no deben tocarse**:

```
viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'
viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'
Header paddingTop: 'env(safe-area-inset-top, 44px)'
Header height: 44px
Tab bar height: 64px
```

Si hay problema de layout: buscar la causa en z-index, overflow o flex.
**Nunca tocar los valores de safe-area.**

---

## 📝 COMMIT ESTABLE DE REFERENCIA

- Git: master branch, commit `9bfef82`
- Bundle: 1,452 kB (con code splitting)
- SW: egchat-push-v20260602
- Fecha: 1 Junio 2026
