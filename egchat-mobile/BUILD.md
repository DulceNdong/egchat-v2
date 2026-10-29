# EGCHAT Mobile — Guía de Build

## Requisitos previos
```bash
npm install -g eas-cli
eas login   # cuenta: reddington120
```

---

## 📱 ANDROID

### 1. APK de desarrollo (Expo Dev Client)
Para probar con react-native-webrtc (llamadas reales):
```bash
cd egchat-mobile
eas build --profile development --platform android
```
Instala el APK en el teléfono y luego usa `expo start --dev-client`.

### 2. APK de preview (Release, distribución interna)
APK firmado listo para instalar directamente:
```bash
eas build --profile preview --platform android
```
Descarga el APK desde expo.dev y compártelo por WhatsApp/Drive.

### 3. AAB de producción (Google Play)
Bundle para subir a Play Store:
```bash
eas build --profile production --platform android
```

### 4. Subir a Play Store (internal track)
```bash
eas submit --profile production --platform android
```
Requiere `google-play-key.json` (Service Account de Google Play Console).

---

## 🍎 iOS

### 1. IPA de desarrollo (Expo Dev Client)
Para probar con react-native-webrtc (llamadas reales):
```bash
cd egchat-mobile
eas build --profile development --platform ios
```
**Primera vez:** EAS te pedirá configurar certificados y perfiles. Acepta generar automáticamente.

Instala el IPA descargándolo desde expo.dev en Safari (iPhone) o usando Apple Configurator.

### 2. IPA de preview (Release, distribución interna)
IPA firmado para instalar directamente (Ad-Hoc):
```bash
eas build --profile preview --platform ios
```
**Requisitos:**
- Cuenta de Apple Developer ($99/año)
- Registra los UDIDs de los dispositivos iOS en: https://developer.apple.com/account/resources/devices

EAS te preguntará los UDIDs la primera vez. Descarga el IPA y compártelo.

### 3. TestFlight (RECOMENDADO para distribución a testers)
Build de producción + subida a App Store Connect:
```bash
# 1. Compilar
eas build --profile production --platform ios

# 2. Subir a App Store Connect
eas submit --platform ios
```

Luego en App Store Connect → TestFlight:
- Agrega testers internos/externos
- Ellos instalan desde la app TestFlight (no necesitas UDIDs)

### 4. App Store (Producción final)
Después de `eas submit`, ve a App Store Connect y envía la app para revisión.

---

## 🔧 Comandos útiles

```bash
# Ver estado de builds
eas build:list

# Actualización OTA (sin rebuild) - solo código JS
eas update --channel preview --message "Fix cartera"

# Limpiar caché
expo start --clear

# Build para ambas plataformas
eas build --profile preview --platform all
```

---

## 📝 Notas importantes

### General
- `react-native-webrtc` solo funciona en builds nativos (no Expo Go)
- Las llamadas de audio/video requieren perfil `development` o `preview`
- Push notifications funcionan en todos los perfiles

### iOS específico
- **Primera compilación:** EAS configurará certificados automáticamente (acepta todo)
- **Distribución Ad-Hoc (preview):** Máximo 100 dispositivos registrados por año
- **TestFlight:** Sin límite de dispositivos, pero requiere revisión de Apple (1-2 días)
- **UDIDs:** Para obtener el UDID de un iPhone:
  1. Conecta el iPhone a Mac
  2. Abre Finder → iPhone → Info
  3. Copia el número de serie
  O usa https://expo.dev/accounts/[tu-cuenta]/devices

### Solución de problemas iOS
Si el build falla con errores de firma:
```bash
# Limpia credenciales y vuelve a generar
eas credentials
# Selecciona iOS → Remove all credentials → Rebuild
```
