# ✅ Checklist iOS — Xcode & Generación IPA

## Pre-requisitos

- [ ] Mac con macOS 14+ (Sonoma) o superior
- [ ] Xcode 15+ instalado desde App Store
- [ ] Apple Developer Account activa (99€/año)
- [ ] Node.js 20+ instalado
- [ ] CocoaPods instalado (`sudo gem install cocoapods`)

---

## Paso 1 — Build del Frontend

```bash
cd c:\Users\User\Desktop\EGCHAT_BACKUP_20260320  # (en Mac: ruta equivalente)
npm run build
```

✅ Verificar que el build termina sin errores  
✅ Verificar que `dist/` contiene `index.html`

---

## Paso 2 — Sync Capacitor

```bash
npx cap sync ios
```

✅ Verificar output: "Sync finished in Xs"  
✅ Verificar que no hay errores de plugins

---

## Paso 3 — Instalar Pods (solo la primera vez o si cambian plugins)

```bash
cd ios/App
pod install
cd ../..
```

✅ Verificar: "Pod installation complete!"

---

## Paso 4 — Abrir Xcode

```bash
npx cap open ios
```

O manualmente: abrir `ios/App/App.xcworkspace` (**NO** `.xcodeproj`)

---

## Paso 5 — Configuración en Xcode

### Signing & Capabilities
- [ ] Team: seleccionar tu Apple Developer Team
- [ ] Bundle Identifier: `com.egchat.app`
- [ ] Signing Certificate: seleccionar "iOS Distribution" para producción
- [ ] Provisioning Profile: "Automatic" o perfil manual

### General
- [ ] Version: `2.5.4`
- [ ] Build: `7` (incrementar en cada release)
- [ ] Deployment Target: iOS 14.0+
- [ ] Device Orientation: Portrait only

### Info.plist — Permisos Requeridos
```xml
<!-- Cámara -->
<key>NSCameraUsageDescription</key>
<string>EGCHAT necesita acceso a la cámara para fotos y videollamadas</string>

<!-- Micrófono -->
<key>NSMicrophoneUsageDescription</key>
<string>EGCHAT necesita el micrófono para notas de voz y llamadas</string>

<!-- Notificaciones Push -->
<!-- Se añaden automáticamente con @capacitor/push-notifications -->

<!-- Contactos (opcional) -->
<key>NSContactsUsageDescription</key>
<string>EGCHAT puede importar tus contactos para facilitar el chat</string>

<!-- Localización (opcional) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>EGCHAT usa tu ubicación para MiTaxi y servicios locales</string>
```

### Capabilities
- [ ] Push Notifications: ON
- [ ] Background Modes: ON
  - [ ] Background fetch
  - [ ] Remote notifications
- [ ] Keychain Sharing: ON (para SecureStorage)

---

## Paso 6 — Build para Simulador (verificación)

1. Seleccionar simulador "iPhone 15 Pro" (o similar)
2. `Cmd + R` para compilar y ejecutar
3. ✅ App arranca sin errores en consola
4. ✅ SyncIndicator no muestra errores
5. ✅ Login funciona
6. ✅ Chat carga desde caché local

---

## Paso 7 — Build para Dispositivo Real

1. Conectar iPhone por USB
2. Confiar en el Mac si aparece diálogo
3. Seleccionar el iPhone en el selector de dispositivos
4. `Cmd + R`
5. ✅ App se instala y arranca
6. ✅ Notificaciones push funcionan

---

## Paso 8 — Generar IPA (Archive)

```
Product → Archive
```

1. Esperar que termine el proceso de archive
2. En Organizer (Window → Organizer):
   - Seleccionar el archive más reciente
   - Click "Distribute App"
3. Seleccionar método:
   - **App Store Connect**: para publicar en App Store
   - **Ad Hoc**: para distribución directa (TestFlight beta)
   - **Development**: para testing interno
4. Seguir el wizard:
   - [ ] Seleccionar Distribution Certificate
   - [ ] Seleccionar Provisioning Profile
   - [ ] Export location
5. ✅ IPA generada en la carpeta seleccionada

---

## Paso 9 — Subir a App Store Connect

```bash
# Via Xcode Organizer (recomendado):
Distribute App → App Store Connect → Upload

# O via terminal:
xcrun altool --upload-app -f EGCHAT.ipa -u APPLE_ID -p APP_SPECIFIC_PASSWORD
```

---

## Verificaciones Post-Build iOS

- [ ] App arranca sin pantalla blanca
- [ ] Safe area correcta (top y bottom)
- [ ] Header height 44px respetado
- [ ] Tab bar 64px respetado
- [ ] Teclado no sube la barra de chat
- [ ] Push notifications funcionan
- [ ] SQLite persiste entre sesiones (cerrar/abrir app)
- [ ] Modo offline funciona (activar Airplane Mode)
- [ ] Reconexión sincroniza automáticamente
- [ ] FileCache descarga y sirve avatares
- [ ] SecureStorage guarda token en Keychain
