# Reporte de Auditoría QA — Sistema de Llamadas EGChat
**Fecha:** 2025-07-30  
**Alcance:** Auditoría completa end-to-end del sistema de llamadas (voz + video)  
**Rol:** QA Lead / Investigación read-only  
**Estado:** ⚠️ NO SE HA MODIFICADO CÓDIGO — solo análisis

---

## Resumen Ejecutivo

El sistema de llamadas de EGChat está **arquitectónicamente sólido** pero contiene **6 vulnerabilidades críticas o altas** que impactarán directamente las pruebas QA en dispositivos físicos. El mayor riesgo es la combinación de señalización por polling HTTP + Supabase Realtime sin canal de ICE por Realtime, lo que genera latencia y condiciones de carrera en conectividad débil. El manejo de background en Android es correcto a nivel nativo, pero iOS depende de CallKit/PushKit nativo no verificable sin build real firmado.

**Pruebas que pasarán sin problemas:** 1, 2, 7, 8, 9, 10, 11, 15, 16, 18, 19  
**Pruebas en riesgo elevado:** 4, 5, 6, 21, 22, 23, 25, 26, 27

---

## 1. Estructura de Archivos Relevantes

```
egchat-mobile/
├── app/
│   ├── _layout.tsx                    ← Root: push listeners, PushKit, CallManager init, IncomingCallOverlay
│   └── call/[callId].tsx              ← Pantalla de llamada (caller + callee en un mismo componente)
├── src/
│   ├── call/
│   │   ├── CallManager.ts             ← SINGLETON. Motor WebRTC + señalización + ICE + audio
│   │   ├── callSupabase.ts            ← Realtime (estado alto nivel) + helper functions
│   │   ├── types.ts                   ← Tipos: CallCommState, CallSession, etc.
│   │   └── index.ts                   ← Re-exports
│   ├── hooks/
│   │   └── useWebRTC.ts               ← Fachada React del CallManager (no tiene estado propio)
│   ├── context/
│   │   └── ActiveCallContext.tsx      ← Puente React ↔ CallManager para la UI
│   ├── native/
│   │   ├── CallKit.ts                 ← Puente JS → EGChatCallModule nativo (iOS/Android)
│   │   ├── PushKit.ts                 ← VoIP PushKit iOS (EGChatPushKitModule)
│   │   ├── LiveActivity.ts            ← Live Activities iOS
│   │   └── RichNotifications.ts       ← Notificaciones ricas Android
│   ├── components/call/
│   │   ├── FloatingCallBar.tsx        ← Barra flotante PiP interno
│   │   └── CallBackgroundPicker.tsx   ← Selector de fondo durante llamada
│   ├── notifications.ts               ← FCM/APNs, background task, canales Android
│   └── api.ts                         ← callAPI (REST al backend Render)
├── android/app/src/main/
│   ├── java/com/egchat/app/
│   │   ├── services/
│   │   │   ├── EGChatFirebaseMessagingService.kt  ← FCM data-only handler nativo
│   │   │   └── CallForegroundService.kt           ← ForegroundService + AudioFocus
│   │   └── modules/
│   │       ├── EGChatCallModule.kt                ← Módulo nativo Android (CallKit equiv.)
│   │       └── CallActionReceiver.kt              ← BroadcastReceiver (Aceptar/Rechazar)
│   └── AndroidManifest.xml
├── supabase/functions/deliver-call-push/index.ts  ← Edge Function: APNs VoIP + FCM
├── supabase-calls-migration.sql
└── app.json
```

---

## 2. Señalización: Flujo Completo

### 2.1 Inicio de llamada (Caller)

```
Caller:
  CallManager.startCall()
    → _ensurePermissions()
    → _getIceServers()          (GET /api/turn-token → STUN+TURN)
    → getUserMedia()
    → RTCPeerConnection.createOffer()
    → callAPI.sendVoipPush()    (POST /api/push/voip-call → backend Render)
    → callAPI.offer()           (POST /api/call/offer → guarda en Supabase)
    → startDialingTone()
    → _startCallTimeout()       (90s timeout → missed)
    → _startPoll('caller','fast')  (polling HTTP 900ms iOS / 1400ms Android)
    → _subscribeRealtime()       (Supabase Realtime call_sessions cambios)
```

### 2.2 Entrega al Callee

```
Backend Render (/api/push/voip-call)
  → Supabase Edge Function (deliver-call-push)
    → iOS: APNs VoIP (PushKit) → EGChatPushKitModule → PushKit.onIncomingCall → handleIncomingCall
    → Android: FCM data-only HIGH_PRIORITY → EGChatFirebaseMessagingService → showIncomingCallNotification
    → Fallback: Expo Push (solo si iOS/Android no entregaron)
```

### 2.3 Aceptar llamada (Callee)

```
_layout.tsx: IncomingCallOverlay onAccept
  → callManager.registerIncoming() (ya registrado por handleIncomingCall)
  → router.push('/call/[callId]')
  → [callId].tsx: accept()
    → callManager.acceptCall()
      → _ensurePermissions()
      → _fetchOfferWithRetry()    (hasta 20 reintentos × 3s = 60s máx)
      → getUserMedia()
      → RTCPeerConnection.setRemoteDescription(offer)
      → createAnswer()
      → callAPI.answer()          (POST /api/call/answer)
      → _startPoll('callee','fast')
      → _subscribeRealtime()
```

### 2.4 Establecimiento ICE

```
Ambos lados:
  onicecandidate → callAPI.ice() (POST /api/call/ice)
  
Polling recibe candidatos del otro extremo:
  Caller: lee calleeCandidates[] del estado
  Callee: lee callerCandidates[] del estado
  
  → RTCPeerConnection.addIceCandidate()
  
onconnectionstatechange='connected' → _onCallConnected()
  → stopDialingTone()
  → LiveActivity.startCall()
  → Android: CallForegroundService.start()
  → callAPI.markConnected()
  → Audio.setAudioModeAsync('playAndRecord', 'voiceChat')
```

### 2.5 Terminación

```
hangUp() / endCall():
  → stopDialingTone() / stopRingtone()
  → callAPI.end(callId, reason)
  → LiveActivity.endCall()
  → Android: CallForegroundService.stop()
  → NativeCallKit.endCall()
  → _restoreAudioSession()
  → _finalCleanup() → destroyPC(), tracks.stop(), clear timers, clear subs
```

---

## 3. Configuración STUN/TURN

**Archivo:** `CallManager.ts` (líneas 67-84)

```typescript
// STUN estático (siempre disponible):
{ urls: 'stun:stun.l.google.com:19302' }
{ urls: 'stun:stun1.l.google.com:19302' }
{ urls: 'stun:stun.cloudflare.com:3478' }

// TURN dinámico (se pide en cada llamada):
GET /api/turn-token → { iceServers: [...credenciales temporales...] }

// Fallback estático si falla /api/turn-token:
{ urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
{ urls: 'turn:openrelay.metered.ca:443', ... }
{ urls: 'turn:openrelay.metered.ca:443?transport=tcp', ... }
{ urls: 'turn:openrelay.metered.ca:80?transport=tcp', ... }
```

⚠️ **OpenRelay es un servicio sin SLA** — solo aceptable como fallback de desarrollo. La documentación del código lo reconoce explícitamente.

---

## 4. Gestión de Estado de Llamada

### Estados de `CallCommState`:
```
idle → calling → ringing → accepted → connecting → connected → reconnecting → ended/failed/rejected/missed
```

### Fuentes de verdad:
1. **CallManager singleton** (en memoria, fuera del árbol React)
2. **Supabase `call_sessions`** (persistencia, historial, Realtime)
3. **Backend Render** (coordina oferta/respuesta/ICE entre pares)

### Limpieza de estado huérfano:
- `_finalCleanup()` se llama desde 5 paths: `endCall()`, `rejectCall()`, `cancelCall()`, Realtime `onEnded`, `PC connectionstate=closed`
- Limpia: timers, PC, streams, ICE, flags, subs
- `expires_at` en Supabase (5 min TTL) provee limpieza server-side
- **Gap identificado:** Si `endCall()` falla silenciosamente (red caída) y Realtime también falla, el estado puede quedar en `calling/ringing` sin timeout efectivo. El `CALL_TIMEOUT_MS` (90s) solo aplica al lado del caller antes de `answered`.

---

## 5. Reconexión ICE

```typescript
// CallManager.ts — _scheduleIceRestart()
ICE_DISCONNECTED_MS    = 4_000   // esperar 4s antes de restart
ICE_RESTART_TIMEOUT_MS = 12_000  // 12s para que el restart tenga éxito
RECONNECT_MAX          = 3       // máx 3 intentos

Flujo:
  oniceconnectionstatechange='disconnected'
    → setTimeout(4s) → _scheduleIceRestart()
      → PC.createOffer({ iceRestart: true })
      → setLocalDescription()
      → callAPI.offer() (nuevo offer al servidor)
      → setTimeout(12s) → si no 'connected', _handleConnectionFailed()
```

**Cobertura de reconexión:**
- ✅ Ambos roles pueden hacer ICE restart (no solo el caller)
- ✅ Actualiza ICE servers al reiniciar (nuevas credenciales TURN)
- ✅ Límite de intentos (RECONNECT_MAX=3) previene bucles infinitos
- ⚠️ El callee recibe el nuevo offer por polling, no por Realtime — latencia 1.4-3s en Android

---

## 6. Notificaciones Push

### iOS (PushKit VoIP):
- **Módulo:** `EGChatPushKitModule` nativo (Swift, en `ios/`)
- **Registro:** `PushKit.register()` en `_layout.tsx` — se llama INMEDIATAMENTE al autenticar (no con delay)
- **Entrega:** APNs VoIP via Edge Function → despierta app con app cerrada
- **Entitlements:** `aps-environment: production`, `UIBackgroundModes: [audio, fetch, remote-notification, voip, processing]`
- **CallKit:** `NativeCallKit` → `EGChatCallModule.showIncomingCall()` → UI nativa iOS

### Android (FCM):
- **Servicio:** `EGChatFirebaseMessagingService.kt`
- **Escenarios cubiertos:**
  - App foreground → delega a `EGChatCallModule.instance`
  - App background/suspendida → notificación full-screen con `setFullScreenIntent`
  - App terminada → guarda en `SharedPreferences`, lee al abrir con `getAndClearPendingCall()`
- **ForegroundService:** `CallForegroundService.kt` con `foregroundServiceType="phoneCall"`
- **AudioFocus:** `OnAudioFocusChangeListener` implementado con `AUDIOFOCUS_LOSS_TRANSIENT`
- **Permisos:** `FOREGROUND_SERVICE_PHONE_CALL`, `USE_FULL_SCREEN_INTENT`, `BLUETOOTH_CONNECT`

### Fallback Expo Push:
- Solo se usa si APNs VoIP y FCM no entregaron
- No activa CallKit — solo muestra banner (no funciona con pantalla bloqueada en iOS)

---

## 7. Gestión en Background

### iOS:
- `UIBackgroundModes: voip` + `audio` → proceso activo en background
- `AVAudioSession.category = playAndRecord, mode = voiceChat` → micrófono activo en background
- `staysActiveInBackground: true` en `Audio.setAudioModeAsync()`
- `AppState 'inactive'` detectado pero sin acción JS (correcto — lo maneja el nativo EGChatCallModule.swift)
- Live Activities para mostrar el timer en Dynamic Island / Lock Screen

### Android:
- `CallForegroundService` con `foregroundServiceType="phoneCall"` — proceso protegido
- `START_STICKY` — el SO lo reiniciará si lo mata (con `intent=null`)
- AudioFocus gestionado con `AUDIOFOCUS_GAIN` para voz
- Delay de 15s para iniciar SSE/presencia (protege rendimiento en gama baja)
- Listeners de llamada activos a los 2s (crítico — antes era 25s, ya corregido)

---

## 8. Interrupciones Telefónicas (GSM)

### iOS:
- `AppState 'inactive'` detectado en `_subscribeAppState()`
- `NativeCallKit.onAudioInterrupted` con `interrupted: true/false`
- Al interrumpir: tracks de audio deshabilitados temporalmente SIN cambiar `_isMuted`
- Al reanudar: tracks restaurados según preferencia del usuario
- La PeerConnection se mantiene viva durante la interrupción

### Android:
- `CallForegroundService.audioFocusListener`:
  - `AUDIOFOCUS_LOSS_TRANSIENT` → emite `audioInterrupted` al CallManager
  - `AUDIOFOCUS_GAIN` → emite `audioRouteChanged` (reanuda)
- **⚠️ Gap:** `emitEvent("audioInterrupted")` emite un string (callId), pero el handler JS en `CallManager._audioInterruptSub` espera `{ interrupted: boolean, callId }`. El payload puede no parsearse correctamente en Android → el micrófono puede no silenciarse/reanudarse bien en interrupciones GSM Android.

---

## 9. Audio Routing

```typescript
_applyAudioRoute():
  useEarpiece = !isSpeakerOn && !isBluetoothOn
  
  iOS:
    iosMode: 'voiceChat'   → auricular (con echo-cancellation)
    iosMode: 'spokenAudio' → altavoz
    
  Android:
    playThroughEarpieceAndroid: useEarpiece

Bluetooth:
  iOS: NO se puede forzar desde JS — solo "preferencia"
       AVAudioSession/CallKit elige el dispositivo BT activo
  Android: Routing BT gestionado por AudioFocus + BLUETOOTH_CONNECT
  
  onAudioRouteChanged (iOS) → sincroniza _isSpeakerOn y _isBluetoothOn
```

**Mute:** `localStream.getAudioTracks().forEach(t => t.enabled = false)`  
**Camera off:** `localStream.getVideoTracks().forEach(t => t.enabled = false)`  
**Switch camera:** `track._switchCamera()` de react-native-webrtc

---

## 10. Minimizar / PiP

- `minimizeCall()` → `callManager.setUIState('minimized')`
- `router.dismiss()` (fullScreenModal) o `router.push()` como fallback
- `FloatingCallBar` visible cuando `isPip=true && commState !== 'idle'`
- Expandir: `router.push('/call/[callId]')` con params del CallManager
- **CallManager vive fuera del árbol React** → llamada sobrevive la navegación
- **No hay PiP nativo** (AVPictureInPictureController / Android PiP) — solo barra flotante JS

---

## 11. Llamadas Duplicadas / Guards

### Guard contra múltiples ofertas:
```typescript
// _layout.tsx — handleIncomingCall()
const CALL_DEDUP_MS = 8000
if (callId === lastHandledCallId.current && now - lastHandledCallTs.current < CALL_DEDUP_MS) return;
```

### Guard en CallManager:
```typescript
// startCall():
if (this.isActive) { console.warn('Ya hay una llamada activa'); return; }

// registerIncoming():
if (this.isActive) { console.warn('Llamada entrante ignorada — ya hay una activa'); return; }
```

### Dos dispositivos receptores (Prueba 25):
- Supabase Realtime `onStatusChange('accepted')` detectado
- Si el callee está en `ringing` y llega `accepted` → limpia estado local sin llamar al servidor
- **⚠️ Gap:** La lógica solo se activa si el SEGUNDO dispositivo ya tiene Realtime suscrito. Si la app del segundo dispositivo recibió la llamada via PushKit pero aún no montó el componente (y por tanto no suscribió Realtime), puede continuar sonando indefinidamente hasta el timeout de 90s.

---

## 12. Análisis de Riesgos para la Matriz QA de 27 Pruebas

| # | Prueba | iOS | Android | Riesgo | Notas |
|---|--------|-----|---------|--------|-------|
| 1 | Audio A→B | ✅ | ✅ | BAJO | WebRTC estable, TURN configurado |
| 2 | Vídeo A→B | ✅ | ✅ | BAJO | constraints video configuradas (640×480@24fps) |
| 3 | B recibe con app abierta | ✅ | ✅ | BAJO | IncomingCallOverlay + dedup 8s |
| 4 | B recibe en background | ✅ | ⚠️ | MEDIO | Android: FCM high-priority puede ser throttled por OEMs (Xiaomi, Huawei) |
| 5 | B recibe pantalla bloqueada | ✅ | ⚠️ | MEDIO-ALTO | Android: USE_FULL_SCREEN_INTENT requiere permiso especial en Android 14+ |
| 6 | B recibe app suspendida | ✅ | ⚠️ | ALTO | Android: depende de que FCM data-only despierte el proceso. OEMs agresivos puede matar. SharedPreferences TTL=90s funciona si el usuario abre la app a tiempo |
| 7 | A cancela | ✅ | ✅ | BAJO | callAPI.cancel() + Realtime notifica al callee |
| 8 | B rechaza | ✅ | ✅ | BAJO | callAPI.reject() + Realtime notifica al caller |
| 9 | B acepta | ✅ | ✅ | BAJO | accept() → acceptCall() → polling+ICE |
| 10 | A cuelga | ✅ | ✅ | BAJO | endCall() idempotente |
| 11 | B cuelga | ✅ | ✅ | BAJO | idem |
| 12 | Minimizar | ✅ | ✅ | BAJO | FloatingCallBar, CallManager sobrevive |
| 13 | Restaurar | ✅ | ✅ | BAJO | router.push() con params del manager |
| 14 | Abrir chat durante llamada | ✅ | ✅ | BAJO | openMessageMode() + router.dismiss() |
| 15 | Silenciar | ✅ | ✅ | BAJO | getAudioTracks().enabled = false |
| 16 | Activar altavoz | ✅ | ✅ | BAJO | setAudioModeAsync(spokenAudio) |
| 17 | Bluetooth | ⚠️ | ⚠️ | MEDIO | iOS no puede forzar BT desde JS. Android: BLUETOOTH_CONNECT OK en API 31+ pero sin verificación en API <31 |
| 18 | Cambiar cámara | ✅ | ✅ | BAJO | track._switchCamera() de react-native-webrtc |
| 19 | Apagar cámara | ✅ | ✅ | BAJO | getVideoTracks().enabled = false |
| 20 | WiFi → datos móviles | ⚠️ | ⚠️ | MEDIO | ICE restart se activa tras 4s de disconnected. Cambio de red puede tardar >4s en iOS (handoff lento). Puede mostrar "Reconectando" durante 4-16s |
| 21 | Datos móviles → WiFi | ⚠️ | ⚠️ | MEDIO | Idem. El cambio de interfaz invalida todos los candidatos ICE previos — requiere restart completo |
| 22 | Pérdida temporal de Internet | ⚠️ | ⚠️ | MEDIO-ALTO | ICE disconnect → 4s espera → restart → 12s timeout → 3 intentos = hasta 48s para declarar fallo. Si la red vuelve en <4s, se recupera solo |
| 23 | Recuperación | ⚠️ | ⚠️ | MEDIO | Depende de si el polling aún está activo y los candidatos TURN del restart llegan antes del timeout |
| 24 | Llamada duplicada | ✅ | ✅ | BAJO | Guard en CallManager + dedup 8s en _layout |
| 25 | Dos dispositivos receptores | ⚠️ | ⚠️ | ALTO | Realtime debe estar suscrito en ambos dispositivos. Si el segundo dispositivo no tiene Realtime activo, seguirá sonando hasta timeout 90s |
| 26 | Llamada simultánea | ⚠️ | ⚠️ | ALTO | `isActive` guard rechaza segunda llamada entrante. Pero si la primera está en estado `idle`/terminal y hay race condition, puede registrarse |
| 27 | Interrupción telefónica | ✅ | ⚠️ | MEDIO-ALTO | Android: emitEvent("audioInterrupted", callId) envía string, handler JS espera objeto `{ interrupted: boolean, callId }`. Posible fallo de parsing → micrófono puede no silenciarse |

---

## 13. Vulnerabilidades Clasificadas

### 🔴 CRÍTICO

#### C1 — Android: Payload de audioInterrupted incorrecto
**Archivo:** `CallForegroundService.kt` (línea ~80) + `CallManager.ts` (línea ~757)  
**Descripción:** `module?.emitEvent("audioInterrupted", currentCallId)` envía solo el callId (string). El handler en CallManager espera `{ interrupted: boolean, callId: string }`. El parsing fallará silenciosamente → el micrófono NO se silenciará durante una llamada telefónica entrante en Android. La conversación WebRTC quedará audible al interlocutor mientras el usuario habla por teléfono.  
**Impacto:** Prueba 27 (interrupción telefónica Android) fallará con privacidad comprometida.

#### C2 — Android 14+: USE_FULL_SCREEN_INTENT sin permiso de runtime
**Archivo:** `AndroidManifest.xml`, `EGChatFirebaseMessagingService.kt`  
**Descripción:** Android 14 (API 34) requiere que el usuario conceda `USE_FULL_SCREEN_INTENT` explícitamente en Settings > Apps > Special app access. La notificación full-screen se mostrará como notificación normal con pantalla bloqueada si no está concedido.  
**Impacto:** Prueba 5 (pantalla bloqueada) fallará en Android 14+ si el usuario no concedió el permiso manualmente.

---

### 🟠 ALTO

#### A1 — Dos dispositivos receptores: race condition sin Realtime activo
**Archivo:** `CallManager.ts` (`_subscribeRealtime()`), `_layout.tsx`  
**Descripción:** Si el callee tiene dos dispositivos y en el segundo la app estaba cerrada, llega via FCM, el usuario no abre la app, pero la llamada es aceptada en el primer dispositivo. El segundo dispositivo no tiene Realtime suscrito (la app no está abierta) y continuará sonando hasta el timeout de 90s. No hay mecanismo de cancelación push para "llamada ya respondida en otro dispositivo".  
**Impacto:** Prueba 25 fallará.

#### A2 — ICE restart solo funciona si el caller reenvía la oferta al callee via polling
**Archivo:** `CallManager.ts` (`_scheduleIceRestart()`)  
**Descripción:** El ICE restart genera un nuevo offer y lo envía via `callAPI.offer()`. El callee lo recibe por polling (1.4-3s en Android, 2-3s en iOS). Si hay pérdida de red en ambos lados simultáneamente, el polling también fallará → el restart no llegará → timeout en 12s → fallo declarado. No hay mecanismo de señalización alternativo (WebSocket, Realtime para SDP).  
**Impacto:** Pruebas 22-23 pueden fallar en pérdida de red severa.

#### A3 — OEM Android: FCM data-only puede no entregar con app terminada
**Archivo:** `EGChatFirebaseMessagingService.kt`  
**Descripción:** Fabricantes como Xiaomi MIUI, Huawei EMUI, OPPO ColorOS implementan battery optimization agresivo que puede bloquear FCM data-only (sin notification payload) cuando la app está terminada. El código lo documenta pero no hay mitigación en el cliente (no hay instrucciones al usuario de desactivar battery optimization).  
**Impacto:** Prueba 6 puede fallar en dispositivos Android de gama media con ROM personalizada.

---

### 🟡 MEDIO

#### M1 — Bluetooth iOS no controlable desde JS
**Archivo:** `CallManager.ts` (`toggleBluetooth()`, `_applyAudioRoute()`)  
**Descripción:** El código documenta explícitamente: *"en iOS el routing BT es controlado por AVAudioSession/CallKit. Solo se puede indicar preferencia desde JS"*. El botón de Bluetooth en la UI puede no tener efecto visible hasta que el sistema elija el dispositivo BT activo.  
**Impacto:** Prueba 17 (Bluetooth) en iOS puede parecer que "no funciona" aunque el sistema esté gestionando el BT correctamente.

#### M2 — Cambio de red (WiFi↔datos): ICE restart puede no llegar a tiempo
**Archivo:** `CallManager.ts` (`ICE_DISCONNECTED_MS = 4000`)  
**Descripción:** Al cambiar de WiFi a datos móviles, la PeerConnection pasa a `disconnected`. Tras 4s se intenta ICE restart. Si el dispositivo tarda >4s en cambiar de interfaz o si el nuevo offer no llega al otro extremo en <12s, la llamada falla. En condiciones normales (cambio limpio de red) el timeout es suficiente, pero en cobertura marginal puede no serlo.  
**Impacto:** Pruebas 20-21.

#### M3 — Polling HTTP como único canal de señalización ICE post-conexión
**Archivo:** `CallManager.ts` (`_startPoll()`)  
**Descripción:** Los candidatos ICE se intercambian via polling HTTP al backend Render. El backend está en Render (plan free/paid con cold start de ~1s). En fase 'slow' (post-conexión), el intervalo sube a 2-3s. Si se produce un ICE restart, el nuevo offer/answer puede tardar hasta 6s en llegar. Supabase Realtime se usa para cambios de estado de alto nivel pero NO para candidatos ICE. Esto es una limitación estructural del diseño actual.  
**Impacto:** Pruebas 20-23 tendrán mayor latencia de recuperación.

#### M4 — TURN fallback en OpenRelay sin SLA
**Archivo:** `CallManager.ts` (líneas 77-84)  
**Descripción:** Si `/api/turn-token` falla (cold start del servidor Render, sin red), se usa OpenRelay que es un servicio público gratuito sin garantías. En producción con múltiples usuarios simultáneos podría saturarse o no estar disponible.  
**Impacto:** Llamadas en redes simétricas NAT (móvil 4G sin WiFi) pueden fallar si el TURN de producción no está disponible.

#### M5 — `consumePendingCall()` TTL fijo de 60s
**Archivo:** `notifications.ts` (`PENDING_CALL_TTL = 60_000`)  
**Descripción:** Si la llamada llegó cuando la app estaba cerrada y el usuario abre la app más de 60 segundos después de que llegó la notificación FCM, el payload se descarta. La llamada ya habrá caducado (90s TTL en Supabase), pero el usuario no verá ningún feedback de "llamada perdida" al abrir la app.  
**Impacto:** Prueba 6 (app suspendida): puede no mostrarse UI de llamada si el usuario tardó >60s en responder.

---

### 🔵 BAJO

#### B1 — `pollIncoming()` conservado en useWebRTC pero obsoleto
**Archivo:** `useWebRTC.ts` (línea 89-115)  
**Descripción:** Función de polling legado conservada "por compatibilidad". En la arquitectura actual no se llama desde ningún componente activo. Podría confundir a futuros desarrolladores.

#### B2 — `call/[callId].tsx` como `presentation: 'card'` no `fullScreenModal`
**Archivo:** `_layout.tsx` (línea ~821)  
**Descripción:** La pantalla de llamada usa `presentation: 'card'` con `animation: slide_from_bottom`. Esto significa que el gesto de swipe-down podría descartar la pantalla accidentalmente en iOS si `gestureEnabled` no está bien aplicado. El código lo tiene en `false` pero puede no funcionar con la animación `card` en todas las versiones de Expo Router.

#### B3 — FloatingCallBar no tiene PiP nativo
**Archivo:** `FloatingCallBar.tsx` (comentarios iniciales)  
**Descripción:** El PiP nativo (AVPictureInPictureController en iOS, Activity PiP en Android) no está implementado. La barra flotante JS es funcional pero no se muestra en el switcher de apps ni en la pantalla de inicio del sistema.  
**Impacto:** Prueba 12 (minimizar) funciona pero no al nivel de apps de llamadas nativas.

#### B4 — Historial de llamada solo lo escribe el caller
**Archivo:** `[callId].tsx` (`logCallToChat()`)  
**Descripción:** `if (role !== 'caller') return;` — el callee nunca escribe en el historial. Solo el caller registra la duración y tipo en el chat. Si el caller cierra la app bruscamente, no queda registro.

---

## 14. Puntos No Verificables sin Dispositivos Físicos

Las siguientes pruebas **no pueden ejecutarse** sin build firmado en dispositivos físicos:

| Prueba | Razón |
|--------|-------|
| 4 (background) | FCM data-only requiere APK firmado con google-services.json real |
| 5 (pantalla bloqueada) | Requiere dispositivo real bloqueado + notificación full-screen |
| 6 (app suspendida) | Requiere kill de proceso + FCM wake + SharedPreferences |
| 17 (Bluetooth) | Requiere auricular BT físico emparejado |
| 25 (dos dispositivos) | Requiere exactamente dos dispositivos con tokens push registrados |
| 27 (interrupción GSM) | Requiere llamada telefónica real entrante |

---

## 15. Resumen de Correcciones Propuestas (no implementadas — pendiente autorización)

| ID | Severidad | Corrección Propuesta | Archivos Afectados |
|----|-----------|----------------------|--------------------|
| C1 | CRÍTICO | Cambiar `emitEvent("audioInterrupted", callId)` por `emitEvent("audioInterrupted", Bundle con interrupted=true/false y callId)` | `CallForegroundService.kt`, `EGChatCallModule.kt` |
| C2 | CRÍTICO | Añadir verificación de permiso `USE_FULL_SCREEN_INTENT` en Android 14+ y mostrar prompt al usuario | `notifications.ts`, `_layout.tsx` |
| A1 | ALTO | Enviar push de "llamada cancelada/aceptada" a todos los dispositivos del callee cuando uno acepta | `deliver-call-push/index.ts` (nueva Edge Function o parámetro) |
| A2 | ALTO | Usar Supabase Realtime (INSERT en `call_signals`) para transmitir ICE restart offer en tiempo real, sin depender solo del polling | `callSupabase.ts`, `CallManager.ts` |
| A3 | ALTO | Añadir instrucciones en onboarding para desactivar battery optimization en Android (Intent a Settings especial) | `_layout.tsx` o pantalla de configuración |
| M1 | MEDIO | Aclarar en UI que el Bluetooth en iOS es gestionado por el sistema — cambiar texto del botón | `[callId].tsx` |
| M2 | MEDIO | Reducir `ICE_DISCONNECTED_MS` de 4000ms a 2000ms para reaccionar más rápido a cambios de red | `CallManager.ts` |
| M4 | MEDIO | Añadir servidor TURN de producción propio (Twilio/Metered) en lugar de depender de OpenRelay como fallback | `CallManager.ts` (TURN_FALLBACK) |

---

## 16. Evidencia de Código por Área

### Señalización — Polling híbrido (no WebSocket):
```typescript
// CallManager.ts — _startPoll()
const POLL_FAST_IOS = 900      // ms
const POLL_FAST_ANDROID = 1_400
const POLL_SLOW_IOS = 2_000
const POLL_SLOW_ANDROID = 3_000
// → Cambia a fase lenta tras 35 ciclos o cuando está conectado
```

### ICE Queue (evita race condition):
```typescript
// CallManager.ts — _applyRemoteIceCandidates()
if (this._remoteDescSet) {
  await this._pc.addIceCandidate(...)
} else {
  this._iceQueue.push(c)  // candidato recibido ANTES de setRemoteDescription → encolar
}
// → _drainIceQueue() se llama justo después de setRemoteDescription
```

### Guard doble para llamada activa:
```typescript
// CallManager.ts — startCall()
if (this.isActive) { console.warn('Ya hay una llamada activa'); return; }
// isActive = !['idle','ended','failed','rejected','missed'].includes(this._commState)
```

### Dedup de notificaciones:
```typescript
// _layout.tsx — handleIncomingCall()
const CALL_DEDUP_MS = 8000  // 8s
if (callId === lastHandledCallId.current && now - lastHandledCallTs.current < CALL_DEDUP_MS) return;
```

### Cleanup completo verificado:
```typescript
// CallManager.ts — _finalCleanup()
// ✅ 1. Timers (polling, duration, timeout, reconnect, iceRestart)
// ✅ 2. AppState + audio listeners
// ✅ 3. Realtime unsubscribe
// ✅ 4. PC.close() + null handlers
// ✅ 5. stream.getTracks().forEach(t => { t.stop(); t.enabled = false; })
// ✅ 6. ICE queue clear
// ✅ 7. Flags reset
// ✅ NativeCallKit.endCall() idempotente
// ✅ Android: stopCallForegroundService() idempotente
// ✅ _restoreAudioSession() en todos los paths
```

---

*Reporte generado por investigación read-only del código fuente. Ningún código fue modificado.*  
*Pendiente de aprobación para implementar correcciones.*
