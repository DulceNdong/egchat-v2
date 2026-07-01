# EGCHAT Mobile — Guía de Build

## Requisitos previos
```bash
npm install -g eas-cli
eas login   # cuenta: reddington120
```

## 1. Build de desarrollo (Expo Dev Client)
Para probar con react-native-webrtc (llamadas reales):
```bash
cd egchat-mobile
# Android dev client
eas build --profile development --platform android
# iOS dev client
eas build --profile development --platform ios
```
Instala el APK/IPA en el teléfono y luego usa `expo start --dev-client`.

## 2. Build de preview (Release, distribución interna)
APK o IPA listo para instalar directamente:
```bash
cd egchat-mobile
# Android preview
eas build --profile preview --platform android
# iOS preview
eas build --profile preview --platform ios
```
Descarga el artefacto desde expo.dev y compártelo por WhatsApp/Drive.

## 3. Build de producción
Bundle para subir a tiendas:
```bash
cd egchat-mobile
# Android App Bundle
eas build --profile production --platform android
# iOS archive
eas build --profile production --platform ios
```

## 4. Subir a Play Store (internal track)
```bash
eas submit --profile production --platform android
```
Requiere `google-play-key.json` (Service Account de Google Play Console).

## Comandos útiles
```bash
# Ver estado de builds
eas build:list

# Actualización OTA (sin rebuild)
eas update --channel preview --message "Fix cartera"

# Limpiar caché
expo start --clear
```

## Notas
- `react-native-webrtc` solo funciona en builds nativos (no Expo Go)
- Las llamadas de audio/video requieren perfil `development` o `preview`
- Tras instalar dependencias: `npm install` en `egchat-mobile/`
- Push notifications FCM funcionan en todos los perfiles

## Llamadas WebRTC (audio/video real)
1. `npm install` (incluye `react-native-webrtc`)
2. `eas build --profile development --platform android`
3. Instalar APK y ejecutar `npx expo start --dev-client`
4. En Expo Go seguirás viendo solo señalización (modo demostración)
