# Módulos nativos iOS — EGChat

## Instrucciones para instalar en Mac

Estos archivos deben copiarse a la carpeta `ios/EGChat/` después de ejecutar `expo prebuild`.

### Pasos:

1. En Mac, desde `egchat-mobile/`:
```bash
npx expo prebuild --platform ios
```

2. Copiar los archivos Swift/ObjC:
```bash
cp ios-native-modules/EGChatCallModule.swift ios/EGChat/
cp ios-native-modules/EGChatCallModule.m ios/EGChat/
```

3. Abrir Xcode:
```bash
open ios/EGChat.xcworkspace
```

4. En Xcode → Project Navigator → EGChat group:
   - Click derecho → "Add Files to EGChat"
   - Seleccionar `EGChatCallModule.swift` y `EGChatCallModule.m`
   - Asegurarse de que "Target Membership: EGChat" esté marcado

5. Añadir capability en Xcode:
   - Target EGChat → Signing & Capabilities → + Capability → "Voice over IP"
   - También añadir: "Background Modes" → marcar "Voice over IP" y "Audio, AirPlay..."

6. En `Info.plist` añadir:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>EGChat necesita el micrófono para llamadas de voz</string>
<key>NSCameraUsageDescription</key>  
<string>EGChat necesita la cámara para videollamadas</string>
```

7. Build y test:
```bash
npx expo run:ios
```

## Permisos Android (ya aplicados en AndroidManifest.xml)
- FOREGROUND_SERVICE
- FOREGROUND_SERVICE_PHONE_CALL
- MANAGE_OWN_CALLS
- USE_FULL_SCREEN_INTENT

## API (misma en iOS y Android)

```typescript
import { NativeCallKit } from '../native/CallKit';

// Mostrar llamada entrante
NativeCallKit.showIncomingCall('Reddington', '', 'call_123', false);

// Escuchar respuestas
const unsub = NativeCallKit.onAnswer(callId => {
  router.push(`/call/${callId}`);
});

// Limpiar
NativeCallKit.endCall('call_123');
```
