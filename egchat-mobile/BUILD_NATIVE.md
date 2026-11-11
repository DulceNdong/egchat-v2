# EGChat — Módulos Nativos Swift/Kotlin

## Estado: v1.2.0-native-modules ✅

Todos los módulos nativos han sido implementados y commiteados.
Tag de restauración: `v1.2.0-native-modules`

---

## Módulos implementados

| # | Módulo | Android Kotlin | iOS Swift | Puente TS |
|---|--------|---------------|-----------|-----------|
| 1 | CallKit — llamada nativa | ✅ CallModule.kt | ✅ EGChatCallModule.swift | ✅ CallKit.ts |
| 2 | Notificaciones ricas con imagen | ✅ RichNotificationModule.kt | ✅ EGChatRichNotification.swift | ✅ RichNotifications.ts |
| 3 | Compartir desde otras apps | ✅ ShareModule.kt | ✅ EGChatShareModule.swift | ✅ ShareExtension.ts |
| 4 | Widget pantalla de inicio | ✅ ChatWidgetProvider.kt | 🔧 Xcode requerido | ✅ HomeWidget.ts |
| 5 | Atajos de icono long-press | ✅ shortcuts.xml | ✅ EGChatShortcuts.swift | — |
| 6 | Grabación audio AAC 128kbps | ✅ AudioRecorderModule.kt | ✅ EGChatAudioRecorder.swift | ✅ NativeAudioRecorder.ts |
| 7 | Live Activity iOS 16.2+ | — | ✅ EGChatLiveActivity.swift | ✅ LiveActivity.ts |
| 8 | Face Filters AR | ✅ FaceFilterModule.kt | ✅ EGChatFaceFilter.swift | ✅ FaceFilter.ts |

---

## Para activar en Android (APK)

Los módulos 1-8 están registrados en `MainApplication.kt` y compilarán
automáticamente con el próximo `eas build --platform android`.

```bash
cd egchat-mobile
npx eas build --profile preview --platform android
```

---

## Para activar en iOS (requiere Mac con Xcode)

### 1. Prebuild
```bash
cd egchat-mobile
npx expo prebuild --platform ios
```

### 2. Copiar módulos nativos
```bash
cp ios-native-modules/*.swift ios/EGChat/
cp ios-native-modules/*.m     ios/EGChat/
```

### 3. Abrir Xcode
```bash
open ios/EGChat.xcworkspace
```

### 4. Añadir archivos en Xcode
- Project Navigator → EGChat group → click derecho → "Add Files to EGChat"
- Seleccionar todos los `.swift` y `.m` de `ios/EGChat/`
- Target Membership: ✅ EGChat

### 5. Capabilities requeridas
En Target EGChat → Signing & Capabilities → (+):
- Voice over IP
- Background Modes → Voice over IP + Audio
- Push Notifications
- App Groups (para ShareExtension)

### 6. Live Activity (Módulo 7)
- File → New → Target → Widget Extension → "EGChatLiveActivity"
- Info.plist del target principal añadir:
  - `NSSupportsLiveActivities = YES`
  - `NSSupportsLiveActivitiesFrequentUpdates = YES`

### 7. Notification Service Extension (Módulo 2)
- File → New → Target → Notification Service Extension → "EGChatNotifService"
- Reemplazar `NotificationService.swift` generado con `EGChatNotificationService.swift`

### 8. Build iOS
```bash
npx eas build --profile preview --platform ios
```

---

## Archivos por módulo

```
egchat-mobile/
├── android/app/src/main/java/com/egchat/app/
│   ├── CallModule.kt              # Módulo 1
│   ├── CallActionReceiver.kt      # Módulo 1
│   ├── CallPackage.kt             # Módulo 1
│   ├── RichNotificationModule.kt  # Módulo 2
│   ├── RichNotificationPackage.kt # Módulo 2
│   ├── ShareModule.kt             # Módulo 3
│   ├── SharePackage.kt            # Módulo 3
│   ├── ChatWidgetProvider.kt      # Módulo 4
│   ├── WidgetModule.kt            # Módulo 4
│   ├── WidgetPackage.kt           # Módulo 4
│   ├── AudioRecorderModule.kt     # Módulo 6
│   ├── AudioRecorderPackage.kt    # Módulo 6
│   ├── FaceFilterModule.kt        # Módulo 8
│   └── FaceFilterPackage.kt       # Módulo 8
│
├── ios-native-modules/            # → copiar a ios/EGChat/ después de prebuild
│   ├── EGChatCallModule.swift     # Módulo 1
│   ├── EGChatCallModule.m         # Módulo 1 (bridge ObjC)
│   ├── EGChatRichNotification.swift    # Módulo 2
│   ├── EGChatNotificationService.swift # Módulo 2 (extensión)
│   ├── EGChatShareModule.swift    # Módulo 3
│   ├── EGChatShortcuts.swift      # Módulo 5
│   ├── EGChatAudioRecorder.swift  # Módulo 6
│   ├── EGChatLiveActivity.swift   # Módulo 7
│   └── EGChatFaceFilter.swift     # Módulo 8
│
└── src/native/                    # Puentes TypeScript (ya integrados)
    ├── CallKit.ts                 # Módulo 1
    ├── RichNotifications.ts       # Módulo 2
    ├── ShareExtension.ts          # Módulo 3
    ├── HomeWidget.ts              # Módulo 4
    ├── NativeAudioRecorder.ts     # Módulo 6
    ├── LiveActivity.ts            # Módulo 7
    └── FaceFilter.ts              # Módulo 8
```
