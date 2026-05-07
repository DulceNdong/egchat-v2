# 🔍 EGCHAT — Guía de Resolución de Errores: Doze Mode, Notificaciones y Llamadas

## Requisitos previos
- Android SDK instalado con `adb` en el PATH
- Dispositivo Android conectado por USB con **Depuración USB activada**
- Verificar conexión: `adb devices` → debe mostrar tu dispositivo

---

## ✅ CHECKLIST 1 — Plugin de notificaciones correctamente registrado

### 1.1 Verificar que el plugin aparece en capacitor.plugins.json
```bash
# Debe mostrar @capacitor/push-notifications y call-screen
cat android/app/src/main/assets/capacitor.plugins.json
```
**Resultado esperado:**
```json
[
  { "pkg": "@capacitor/push-notifications", "classpath": "com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin" },
  { "pkg": "call-screen", "classpath": "..." }
]
```
**Si está vacío:** ejecuta `npx cap sync android`

### 1.2 Verificar que el plugin está en node_modules
```bash
ls node_modules/@capacitor/push-notifications/package.json
# Windows: dir node_modules\@capacitor\push-notifications\package.json
```

### 1.3 Verificar registro en MainActivity via adb logcat
```bash
adb logcat -s "Capacitor" | grep -i "plugin\|register\|push"
```
**Busca:** `Registering plugin: PushNotificationsPlugin`

### 1.4 Verificar que FCM se inicializa correctamente
```bash
adb logcat -s "FirebaseApp" -s "FirebaseInstanceId" -s "FirebaseMessaging"
```
**Busca:** `FirebaseApp initialization successful`

---

## ✅ CHECKLIST 2 — google-services.json en la ubicación correcta

### 2.1 Verificar que el archivo existe
```bash
# Debe existir en android/app/ (NO en la raíz del proyecto)
ls android/app/google-services.json
# Windows: dir android\app\google-services.json
```

### 2.2 Verificar el package_name dentro del archivo
```bash
# El package_name debe coincidir con applicationId en build.gradle
grep -o '"package_name":"[^"]*"' android/app/google-services.json
# Debe mostrar: "package_name":"com.egchat.app"
```

### 2.3 Verificar que Gradle aplica el plugin google-services
```bash
grep "google-services" android/app/build.gradle
# Debe mostrar: apply plugin: 'com.google.gms.google-services'
```

### 2.4 Verificar via adb que FCM tiene token
```bash
adb logcat | grep -i "fcm\|token\|registration"
# Busca: "Token FCM obtenido:" o "FCM registration token:"
```

### 2.5 Obtener el token FCM directamente del dispositivo
```bash
adb logcat -s "EGChat" | grep "fcm_token\|FCM"
```

---

## ✅ CHECKLIST 3 — Probar notificaciones desde Firebase Console

### 3.1 Envío de prueba desde Firebase Console
1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → **EgChat-nativa**
2. Menú izquierdo → **Engage** → **Messaging**
3. Clic en **"Crear tu primera campaña"** → **Notificaciones de Firebase**
4. Rellena:
   - **Título:** `Test EGCHAT`
   - **Texto:** `Prueba de notificación`
5. Clic en **"Enviar mensaje de prueba"**
6. Pega el **token FCM** del dispositivo (obtenido en el paso 2.5)
7. Clic en **"Probar"**

### 3.2 Envío de prueba via curl (desde terminal)
```bash
# Reemplaza TOKEN_FCM con el token real del dispositivo
# Reemplaza FIREBASE_SERVICE_ACCOUNT_TOKEN con el access token

curl -X POST \
  "https://fcm.googleapis.com/v1/projects/egchat-nativa/messages:send" \
  -H "Authorization: Bearer FIREBASE_SERVICE_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "TOKEN_FCM_DEL_DISPOSITIVO",
      "notification": {
        "title": "Test EGCHAT",
        "body": "Prueba desde terminal"
      },
      "data": {
        "type": "message",
        "chat_id": "test-123"
      }
    }
  }'
```

### 3.3 Probar notificación VoIP específicamente
```bash
curl -X POST \
  "https://fcm.googleapis.com/v1/projects/egchat-nativa/messages:send" \
  -H "Authorization: Bearer FIREBASE_SERVICE_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "TOKEN_FCM_DEL_DISPOSITIVO",
      "data": {
        "type": "VOIP_CALL",
        "call_id": "test-call-001",
        "caller_name": "Test Caller",
        "room_name": "test-room",
        "call_type": "audio"
      },
      "android": {
        "priority": "high"
      }
    }
  }'
```

### 3.4 Verificar que la notificación llegó
```bash
adb logcat | grep -E "EGChat|CallScreen|PushNotif|FCM" | tail -20
```

---

## ✅ CHECKLIST 4 — Permisos de la app en el dispositivo

### 4.1 Ver todos los permisos concedidos/denegados
```bash
adb shell dumpsys package com.egchat.app | grep -A2 "permission"
```

### 4.2 Verificar permiso de notificaciones (Android 13+)
```bash
adb shell dumpsys package com.egchat.app | grep "POST_NOTIFICATIONS"
# Debe mostrar: granted=true
```

### 4.3 Verificar permiso de alarmas exactas (Android 12+)
```bash
adb shell dumpsys alarm | grep "com.egchat.app"
# Debe mostrar las alarmas programadas por la app
```

### 4.4 Verificar si la app está en la lista blanca de batería (excluida de Doze)
```bash
adb shell dumpsys deviceidle whitelist | grep "com.egchat.app"
# Si no aparece, la app ESTÁ sujeta a Doze
```

### 4.5 Añadir la app a la lista blanca de batería manualmente (para pruebas)
```bash
adb shell dumpsys deviceidle whitelist +com.egchat.app
# Verificar:
adb shell dumpsys deviceidle whitelist | grep egchat
```

### 4.6 Verificar optimización de batería
```bash
adb shell dumpsys battery | grep "level\|status"
adb shell settings get global app_standby_enabled
# 0 = desactivado (mejor para pruebas), 1 = activado
```

### 4.7 Conceder permiso de alarmas exactas via adb (Android 12+)
```bash
adb shell appops set com.egchat.app SCHEDULE_EXACT_ALARM allow
```

### 4.8 Abrir configuración de permisos de la app directamente
```bash
adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS \
  -d "package:com.egchat.app"
```

---

## ✅ CHECKLIST 5 — Logcat: AlarmManager, Firebase y Doze

### 5.1 Filtro completo para debugging de EGCHAT
```bash
adb logcat -s \
  "EGChat" \
  "AlarmManager" \
  "AlarmReceiver" \
  "VoipForegroundService" \
  "CallScreen" \
  "FirebaseMessaging" \
  "FCM" \
  "Capacitor" \
  "PushNotifications"
```

### 5.2 Solo errores y warnings
```bash
adb logcat *:W | grep -E "egchat|capacitor|firebase|alarm|voip" -i
```

### 5.3 Monitorear el modo Doze en tiempo real
```bash
# Ver el estado actual de Doze
adb shell dumpsys deviceidle

# Forzar entrada en modo Doze (para pruebas)
adb shell dumpsys deviceidle force-idle

# Salir del modo Doze
adb shell dumpsys deviceidle unforce

# Ver si la alarma se disparó durante Doze
adb logcat | grep -i "AlarmManager\|setExactAndAllowWhileIdle\|AlarmReceiver"
```

### 5.4 Simular ciclo completo de Doze para pruebas
```bash
# 1. Desconectar de la red (simular teléfono inactivo)
adb shell svc wifi disable
adb shell svc data disable

# 2. Forzar Doze
adb shell dumpsys deviceidle force-idle

# 3. Enviar notificación push desde Firebase Console o curl

# 4. Monitorear logcat
adb logcat | grep -E "AlarmReceiver|FCM|EGChat|CallScreen"

# 5. Restaurar
adb shell dumpsys deviceidle unforce
adb shell svc wifi enable
adb shell svc data enable
```

### 5.5 Verificar que el Foreground Service está activo
```bash
adb shell dumpsys activity services com.egchat.app | grep -i "voip\|foreground"
# Debe mostrar VoipForegroundService si está activo
```

### 5.6 Ver notificaciones activas en el dispositivo
```bash
adb shell dumpsys notification | grep -A5 "com.egchat.app"
```

### 5.7 Guardar logcat completo a archivo para análisis
```bash
adb logcat -d > egchat-debug-$(date +%Y%m%d-%H%M%S).log
# Luego buscar en el archivo:
grep -E "EGChat|Firebase|Alarm|Doze|Capacitor" egchat-debug-*.log
```

---

## 🚨 Errores comunes y soluciones

| Error en logcat | Causa | Solución |
|----------------|-------|----------|
| `google-services.json not found` | Archivo en ubicación incorrecta | Mover a `android/app/google-services.json` |
| `FirebaseApp initialization failed` | package_name no coincide | Verificar que `com.egchat.app` está en google-services.json |
| `Token not registered` | Token FCM expirado | El servidor limpia tokens inválidos automáticamente |
| `SCHEDULE_EXACT_ALARM denied` | Permiso denegado en Android 12+ | Conceder en Ajustes → Apps → EGCHAT → Permisos |
| `Service not found: VoipForegroundService` | No registrado en Manifest | Verificar `<service android:name=".VoipForegroundService">` |
| `Doze: ignoring alarm` | Alarma no usa `setExactAndAllowWhileIdle` | Ya implementado en AlarmPlugin.java |
| `PushNotifications not registered` | `npx cap sync` no ejecutado | Ejecutar `npx cap sync android` |
| `Call screen not showing` | App en background sin permiso | Verificar `USE_FULL_SCREEN_INTENT` en Manifest |

---

## 🔧 Script de diagnóstico rápido (ejecutar en terminal)

```bash
# Ejecutar este bloque completo para diagnóstico en 30 segundos
echo "=== DISPOSITIVO ===" && adb devices
echo "=== PERMISOS EGCHAT ===" && adb shell dumpsys package com.egchat.app | grep -E "granted|denied" | grep -i "notif\|alarm\|wake\|foreground"
echo "=== DOZE WHITELIST ===" && adb shell dumpsys deviceidle whitelist | grep egchat || echo "NO está en whitelist"
echo "=== SERVICIOS ACTIVOS ===" && adb shell dumpsys activity services com.egchat.app 2>/dev/null | grep -i "service\|running" | head -5
echo "=== ALARMAS PROGRAMADAS ===" && adb shell dumpsys alarm | grep egchat | head -10
echo "=== ÚLTIMOS LOGS FCM ===" && adb logcat -d | grep -i "fcm\|firebase\|egchat" | tail -10
```

---

## 📱 Configuración recomendada del dispositivo para producción

1. **Ajustes → Batería → Optimización de batería** → Buscar EGCHAT → **No optimizar**
2. **Ajustes → Apps → EGCHAT → Notificaciones** → Activar todos los canales
3. **Ajustes → Apps → EGCHAT → Permisos** → Conceder todos los permisos
4. En Xiaomi/MIUI: **Ajustes → Apps → EGCHAT → Ahorro de energía** → Sin restricciones
5. En Samsung: **Ajustes → Batería → Batería adaptable** → Desactivar para EGCHAT
6. En Huawei: **Gestor del teléfono → Inicio protegido** → Activar para EGCHAT
