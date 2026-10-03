# Auditoría Completa — Sistema de Llamadas EGChat
> Fecha: Octubre 2026 | Solo lectura — sin modificaciones

---

## 1. Resumen Ejecutivo

El sistema de llamadas tiene una arquitectura **razonablemente sólida** para el tier técnico del proyecto. Existen módulos nativos reales para iOS (CallKit + PushKit) y Android (notificación full-screen + BroadcastReceiver). WebRTC funciona con `react-native-webrtc`. La señalización va por HTTP polling contra un backend Render.

Sin embargo, hay **5 problemas críticos** que explican todos los síntomas reportados:

1. **La señalización es 100% HTTP polling** — no hay WebSocket ni Supabase Realtime para señalización. Esto introduce latencia de 1–3s en cada paso y es la causa principal de los estados desincronizados.
2. **La pantalla `[callId].tsx` es el único lugar donde vive el WebRTC** — si se desmonta, la llamada muere. El PiP solo funciona si esta pantalla permanece en el stack de Expo Router.
3. **Android con app cerrada depende del Background Task de JS** — que no se ejecuta cuando la app está terminada. Android solo tiene la notificación FCM, no un ConnectionService real.
4. **iOS PushKit emite al JS pero el JS puede no estar listo** — hay un `setTimeout(300ms)` como workaround, insuficiente en cold starts reales.
5. **Doble mecanismo de llamada entrante** — `IncomingCallOverlay` (modal) + `router.push` al mismo tiempo, lo que puede causar doble pantalla o estados contradictorios.

---

## 2. Stack y Dependencias

| Paquete | Versión | Rol |
|---|---|---|
| expo | ~54.0.37 | Framework base |
| react-native | 0.81.5 | Runtime |
| react-native-webrtc | **124.0.8** | Media P2P |
| expo-notifications | ~0.32.17 | Push FCM/APNs |
| expo-task-manager | ~14.0.9 | Background Task Android |
| expo-av | ~16.0.8 | Audio session iOS |
| expo-router | ~6.0.23 | Navegación |
| @supabase/supabase-js | ^2.39.0 | Base de datos (NO se usa para señalización) |
| firebase | 10.14.1 | FCM (solo push, no señalización) |

**react-native-webrtc 124.0.8** es compatible con RN 0.81 y Expo 54. ✅

---

## 3. Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                        EGCHAT MOBILE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  app/_layout.tsx                                                │
│  ├── ActiveCallProvider (contexto global)                       │
│  ├── FloatingCallBar (PiP overlay)                              │
│  ├── IncomingCallOverlay (modal JS)                             │
│  ├── PushKit.onIncomingCall → router.push /call/[id]   (iOS)    │
│  ├── consumePendingCall → router.push /call/[id]       (Android)│
│  └── setupNotificationListeners → setIncomingCall + router.push │
│                                                                 │
│  app/call/[callId].tsx  ← ÚNICA pantalla de llamada             │
│  ├── useWebRTC() hook                                           │
│  │   ├── RTCPeerConnection (react-native-webrtc)                │
│  │   ├── HTTP Polling → backend Render /api/call/*              │
│  │   └── sendVoipPush → /api/push/voip-call                     │
│  ├── NativeCallKit.showIncomingCall / endCall                   │
│  ├── LiveActivity.startCall / endCall                           │
│  └── ActiveCallContext (setActiveCall, registerCallControls)    │
│                                                                 │
├─── NATIVO iOS ─────────────────────────────────────────────────┤
│  AppDelegate.swift (PKPushRegistryDelegate)                     │
│  ├── PKPushRegistry → recibe VoIP push con app cerrada          │
│  └── EGChatPushKitModule.emitIncomingCall → JS                  │
│                                                                 │
│  EGChatCallModule.swift (CXProvider / CallKit)                  │
│  ├── showIncomingCall → CXProvider.reportNewIncomingCall        │
│  ├── dismissIncomingCall                                        │
│  └── Eventos: callAnswered, callRejected, callEnded             │
│                                                                 │
├─── NATIVO Android ─────────────────────────────────────────────┤
│  EGChatCallModule.kt                                            │
│  ├── showIncomingCall → Notificación IMPORTANCE_HIGH            │
│  │   ├── fullScreenIntent (Android 10+)                         │
│  │   ├── "Aceptar" → CallActionReceiver                         │
│  │   └── "Rechazar" → CallActionReceiver                        │
│  └── Eventos: callAnswered, callRejected, callEnded             │
│                                                                 │
│  CallActionReceiver.kt (BroadcastReceiver)                      │
│  └── ACTION_ANSWER/REJECT/END → EGChatCallModule.emitEvent      │
│                                                                 │
├─── SEÑALIZACIÓN ───────────────────────────────────────────────┤
│  Backend Render (https://egchat-api-xlxj.onrender.com)          │
│  ├── POST /api/call/offer   (SDP offer + VoIP push trigger)     │
│  ├── POST /api/call/answer  (SDP answer)                        │
│  ├── POST /api/call/ice     (ICE candidates)                    │
│  ├── GET  /api/call/:id     (polling estado)                    │
│  ├── GET  /api/call/incoming/:userId                            │
│  ├── DELETE /api/call/:id   (finalizar)                         │
│  └── POST /api/push/voip-call (enviar push VoIP)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Archivos Principales

| Archivo | Rol |
|---|---|
| `app/call/[callId].tsx` | Pantalla única de llamada (caller + callee + incoming) |
| `app/_layout.tsx` | Root layout: inicializa PushKit, notificaciones, PiP, overlay incoming |
| `src/hooks/useWebRTC.ts` | Hook WebRTC: PC, offer/answer, ICE, polling, cleanup |
| `src/hooks/useGroupCall.ts` | Hook llamadas grupales mesh (hasta 4) |
| `src/hooks/useSFUGroupCall.ts` | Hook SFU (alternativa grupal) |
| `src/context/ActiveCallContext.tsx` | Estado global de llamada activa (PiP) |
| `src/native/CallKit.ts` | Bridge JS ↔ módulo nativo iOS/Android |
| `src/native/PushKit.ts` | Bridge JS ↔ PKPushRegistry (iOS VoIP) |
| `src/native/LiveActivity.ts` | Bridge Live Activity iOS |
| `src/notifications.ts` | Gestión expo-notifications, background task, tokens |
| `src/api.ts` | callAPI: offer, answer, ice, get, end, incoming, sendVoipPush |
| `src/components/call/FloatingCallBar.tsx` | Barra PiP floating |
| `src/components/call/CallBackgroundPicker.tsx` | Picker fondo de llamada |
| `ios/EGCHAT/EGChatCallModule.swift` | CallKit nativo iOS |
| `ios/EGCHAT/EGChatPushKitModule.swift` | PushKit bridge iOS |
| `ios/EGCHAT/AppDelegate.swift` | Registro PushKit, PKPushRegistryDelegate |
| `android/.../EGChatCallModule.kt` | Notificación full-screen Android |
| `android/.../CallActionReceiver.kt` | BroadcastReceiver botones llamada Android |

---

## 5. Flujo Completo — Paso a Paso

### Caller inicia llamada

1. **Usuario A pulsa "Llamar"** → navega a `/call/[callId]?role=caller&targetUserId=...`
2. **`[callId].tsx` monta** → `useEffect initiated.current` → `startDialingTone()` → `startCall(type, targetUserId, callId)`
3. **`useWebRTC.startCallNative()`**:
   - Pide permisos micrófono/cámara (expo-av + expo-camera)
   - `NativeRTC.mediaDevices.getUserMedia()` → stream local
   - `new RTCPeerConnection(ICE_SERVERS)` — **1 única instancia en pcRef**
   - Añade tracks locales
   - `pc.createOffer()` + `pc.setLocalDescription()`
   - `callAPI.sendVoipPush()` → `POST /api/push/voip-call` → backend envía VoIP push/FCM a usuario B **antes** del offer
   - `callAPI.offer()` → `POST /api/call/offer` — guarda offer en Render
   - `setCallState('calling')`
   - Inicia polling cada 1–1.5s buscando `answer`

### Usuario B recibe la llamada

4. **Si app abierta (foreground):**
   - FCM/APNs llega → `setupNotificationListeners` → `handleIncomingCall`
   - **Se disparan DOS cosas a la vez**: `setIncomingCall(...)` (overlay modal) + `router.push('/call/[id]')` con 100ms delay
   - ⚠️ Posible doble navegación / estado contradictorio

5. **Si app en background/pantalla bloqueada (iOS):**
   - PushKit despierta app → `AppDelegate.pushRegistry(_:didReceiveIncomingPushWith:)` → `EGChatPushKitModule.emitIncomingCall()`
   - JS listener `PushKit.onIncomingCall()` → `router.push('/call/[id]')` con **300ms delay**
   - `NativeCallKit.showIncomingCall()` → `CXProvider.reportNewIncomingCall()` — UI nativa CallKit

6. **Si app cerrada (Android):**
   - FCM high-priority llega → `BACKGROUND_TASK` de expo-task-manager guarda datos en AsyncStorage
   - ⚠️ **Este task NO se ejecuta con app terminada** — solo funciona con app suspendida
   - Usuario abre manualmente → `consumePendingCall()` en `_layout.tsx` → router.push

7. **Pantalla `[callId].tsx` como callee:**
   - `role === 'callee' && callState === 'idle'` → `NativeCallKit.showIncomingCall()`
   - Escucha `NativeCallKit.onAnswer()` → `accept()`
   - `startRingtone()`

### Usuario B acepta

8. **`accept()` en `[callId].tsx`**:
   - Si `offerParam` inválido: hasta 20 reintentos × 3s obteniendo offer de `callAPI.get()` — **60s posible espera**
   - `answerCall(callId, offer, type)` → `useWebRTC.answerCallNative()`
   - `getUserMedia()` → stream local
   - `new RTCPeerConnection()` — **nueva instancia**, la anterior se limpió con `cleanupResources()`
   - `setRemoteDescription(offer)` + `createAnswer()` + `setLocalDescription(answer)`
   - `callAPI.answer()` → `POST /api/call/answer`
   - `setCallState('ringing')`
   - Polling callee: cada 800ms (iOS) / 1500ms (Android) buscando ICE del caller

### Negociación WebRTC

9. **Caller polling detecta answer:**
   - `pc.setRemoteDescription(answer)`
   - Empieza a aplicar `calleeCandidates` del servidor

10. **Intercambio ICE:**
    - `pc.onicecandidate` → `sendIce()` → `POST /api/call/ice` — candidatos guardados en Render
    - Polling del otro lado los aplica con `pc.addIceCandidate()`
    - ⚠️ No hay `trickle ICE` real — los candidatos viajan en batch cada 800–1500ms

11. **`pc.connectionState === 'connected'`** → `setCallState('connected')`
    - `stopDialingTone()` + `stopRingOnce()`
    - Timer de duración iniciado
    - `setActiveCall(...)` → contexto global
    - `LiveActivity.startCall()`
    - `NativeCallKit.dismissIncomingCall()`

### En llamada

12. **Minimizar:** `openMessageMode()` → `setGlobalPip(true)` + `router.navigate('/(tabs)/mensajeria')`
    - ⚠️ Usa `navigate`, no `push`. Si la pantalla de llamada ya no está en el stack se desmonta → WebRTC muere
    - El WebRTC vive en el hook que vive en la pantalla → si la pantalla se desmonta, la llamada termina

13. **FloatingCallBar** visible cuando `isPip && activeCall`
    - Controles: mutear, colgar, expandir
    - **Expandir:** `router.back()` — solo funciona si la pantalla de llamada sigue en el stack

14. **Restaurar:** `router.back()` desde FloatingCallBar → `[callId].tsx` vuelve al frente

15. **Finalizar:** `hangUp()` o `endCall()` o estado `'ended'`
    - `stopDialingTone()` + `stopRingOnce()`
    - `callAPI.end()` → `DELETE /api/call/:id`
    - `NativeCallKit.endCall()`
    - `LiveActivity.endCall()`
    - `logCallToChat()` → mensaje tipo 'call' en el chat (solo caller)
    - `setActiveCall(null)` + `setGlobalPip(false)`
    - `router.back()` con 500ms delay

---

## 6. Escenarios de Background

| Escenario | iOS | Android | Estado |
|---|---|---|---|
| **App abierta** | FCM push → listener JS → Overlay + router.push | FCM push → listener JS → Overlay + router.push | ⚠️ Doble mecanismo simultáneo |
| **App minimizada** | PushKit despierta app → JS listener → CallKit UI | FCM high-priority → notificación full-screen | ✅ Funciona si JS está vivo |
| **Pantalla bloqueada** | PushKit → CallKit UI nativa (sin JS) | FCM → notificación en lock screen | ✅ iOS OK / Android parcial |
| **App suspendida** | PushKit despierta proceso → CallKit | BGTask puede ejecutarse → AsyncStorage | ⚠️ iOS OK / Android incierto |
| **App cerrada (killed por sistema)** | PushKit despierta app → 300ms delay → JS | FCM llega pero BGTask **NO se ejecuta** | ❌ Android roto |
| **App cerrada (manualmente)** | PushKit puede despertar app | FCM puede llegar pero BGTask NO se ejecuta | ❌ Android roto, iOS parcial |

**Nota crítica Android:** `expo-task-manager` con `Notifications.registerTaskAsync()` puede recibir notificaciones con app suspendida, pero cuando la app está completamente terminada (swipe out), el proceso JS no existe y el BGTask no se ejecuta. El único mecanismo sería un `FirebaseMessagingService` nativo en Kotlin, que no está implementado.

---

## 7. Análisis Supabase

**Supabase NO se usa para señalización de llamadas.** Toda la señalización va por el backend Render.

Supabase se usa para:
- Chat (mensajes, chats, usuarios)
- Presencia (`trackUserPresence`)
- SSE via `useChatStream` (mensajes en tiempo real)
- Tablas de monetización, djangue, etc.

**Tokens push:** Se registran en el backend Render (`/api/push/register-expo-token` y `/api/push/register-voip-token`), no directamente en Supabase.

**Tablas SQL relevantes** (del setup-production.sql): calls, chat_messages con tipo 'call'.

**Realtime para llamadas: NO implementado.** Podría eliminar el polling si se usara un canal Supabase para la señalización.

---

## 8. Análisis WebRTC

### Implementación

| Aspecto | Estado |
|---|---|
| RTCPeerConnection | ✅ 1 instancia por llamada, en `pcRef` |
| getUserMedia | ✅ Con permisos explícitos |
| Offer/Answer | ✅ Completo |
| ICE Candidates | ✅ Se envían y aplican via polling |
| STUN servers | ✅ 3 servidores Google + Cloudflare |
| TURN servers | ✅ OpenRelay público (sin cuenta) |
| Cleanup | ✅ `cleanupResources()` cierra PC y detiene tracks |
| Reconexión automática | ❌ No hay lógica de reconexión si ICE falla |
| Trickle ICE | ⚠️ Pseudotrickle — via polling cada 800–1500ms |

### TURN servers — Riesgo
OpenRelay es gratuito y sin garantías de SLA. En producción con usuarios reales puede fallar o ser lento. Los servidores en `useGroupCall` tienen credenciales hardcodeadas distintas (`egchat`/`egchat2025`).

### Modo Expo Go
Si `react-native-webrtc` no está disponible, el hook cae en modo señalización (MOCK_SDP). Esto significa que en Expo Go las llamadas son solo "simuladas" sin audio real.

---

## 9. Análisis Notificaciones / Push

### iOS
- **APNs** via expo-notifications → mensajes
- **PushKit VoIP** via AppDelegate → llamadas con app cerrada
- **CallKit** via EGChatCallModule.swift → UI nativa llamada entrante
- **Entitlements configurados:** `aps-environment: production`, `voip` en UIBackgroundModes ✅

### Android
- **FCM** via expo-notifications → mensajes y llamadas
- **Canal `egchat-calls`:** IMPORTANCE_MAX, bypassDnd, lockscreenVisibility PUBLIC ✅
- **Notificación full-screen** via EGChatCallModule.kt → simula CallKit
- **No hay ConnectionService/TelecomManager** — sin integración con el dialer nativo Android
- **Permisos AndroidManifest:** FOREGROUND_SERVICE, FOREGROUND_SERVICE_PHONE_CALL, USE_FULL_SCREEN_INTENT, MANAGE_OWN_CALLS ✅ declarados

### Flujo VoIP Push completo iOS
```
Render backend → APNs VoIP → PKPushRegistry (AppDelegate)
→ EGChatPushKitModule.emitIncomingCall()
→ PushKit.onIncomingCall listener (JS)
→ setTimeout(300ms) → router.push('/call/[id]')
→ [callId].tsx monta → NativeCallKit.showIncomingCall()
→ CXProvider.reportNewIncomingCall()
→ UI CallKit nativa
```

⚠️ **Problema:** `CXProvider.reportNewIncomingCall()` se llama desde JS (dentro de `[callId].tsx`), no desde el AppDelegate en respuesta directa al push. Apple requiere que la llamada a `reportNewIncomingCall` ocurra **dentro del callback de PushKit**, no varios segundos después. Esto puede causar que iOS rechace la llamada o muestre advertencias en producción.

---

## 10. Tabla de Funcionalidades

| Funcionalidad | Existe | Completa | Funciona | Archivos | Problema |
|---|---|---|---|---|---|
| Iniciar llamada audio | ✅ | ✅ | ✅ | `[callId].tsx`, `useWebRTC.ts` | — |
| Iniciar llamada video | ✅ | ✅ | ✅ | `[callId].tsx`, `useWebRTC.ts` | — |
| Pantalla llamada entrante (app abierta) | ✅ | ⚠️ | ⚠️ | `_layout.tsx`, `[callId].tsx` | IMPLEMENTADO PERO CON ERRORES — doble mecanismo |
| Pantalla llamada entrante (app fondo iOS) | ✅ | ⚠️ | ⚠️ | `AppDelegate.swift`, `PushKit.ts` | IMPLEMENTADO PERO INCOMPLETO — 300ms delay insuficiente en cold start |
| Pantalla llamada entrante (app fondo Android) | ✅ | ⚠️ | ⚠️ | `EGChatCallModule.kt`, `notifications.ts` | IMPLEMENTADO PERO INCOMPLETO — BGTask no funciona con app terminada |
| CallKit UI nativa iOS | ✅ | ⚠️ | ⚠️ | `EGChatCallModule.swift` | IMPLEMENTADO PERO CON ERRORES — reportNewIncomingCall llamado fuera del callback PushKit |
| Notificación full-screen Android | ✅ | ✅ | ✅ | `EGChatCallModule.kt` | IMPLEMENTADO Y VERIFICADO |
| ConnectionService Android (Telecom) | ❌ | ❌ | ❌ | — | NO IMPLEMENTADO |
| WebRTC audio P2P | ✅ | ✅ | ✅ | `useWebRTC.ts` | IMPLEMENTADO Y VERIFICADO |
| WebRTC video P2P | ✅ | ✅ | ✅ | `useWebRTC.ts` | IMPLEMENTADO Y VERIFICADO |
| Señalización SDP (offer/answer) | ✅ | ✅ | ⚠️ | `useWebRTC.ts`, `api.ts` | IMPLEMENTADO PERO INCOMPLETO — HTTP polling introduce latencia de 1-3s por paso |
| ICE candidates exchange | ✅ | ⚠️ | ⚠️ | `useWebRTC.ts`, `api.ts` | IMPLEMENTADO PERO INCOMPLETO — pseudotrickle via polling |
| STUN servers | ✅ | ✅ | ✅ | `useWebRTC.ts` | IMPLEMENTADO Y VERIFICADO |
| TURN servers | ✅ | ⚠️ | ⚠️ | `useWebRTC.ts` | IMPLEMENTADO PERO INCOMPLETO — OpenRelay gratuito sin SLA |
| Minimizar llamada (PiP) | ✅ | ⚠️ | ⚠️ | `ActiveCallContext.tsx`, `FloatingCallBar.tsx` | IMPLEMENTADO PERO CON ERRORES — depende de que la pantalla no se desmonte |
| FloatingCallBar PiP | ✅ | ✅ | ✅ | `FloatingCallBar.tsx` | IMPLEMENTADO Y VERIFICADO |
| Restaurar llamada desde PiP | ✅ | ⚠️ | ⚠️ | `FloatingCallBar.tsx` | IMPLEMENTADO PERO CON ERRORES — router.back() solo si la pantalla sigue en stack |
| Timer de duración | ✅ | ✅ | ✅ | `[callId].tsx` | IMPLEMENTADO Y VERIFICADO |
| Mutear micrófono | ✅ | ✅ | ✅ | `useWebRTC.ts`, `[callId].tsx` | IMPLEMENTADO Y VERIFICADO |
| Desactivar cámara | ✅ | ✅ | ✅ | `useWebRTC.ts`, `[callId].tsx` | IMPLEMENTADO Y VERIFICADO |
| Altavoz | ✅ | ✅ | ✅ | `[callId].tsx` | IMPLEMENTADO Y VERIFICADO |
| Registrar llamada en historial chat | ✅ | ✅ | ✅ | `[callId].tsx` → `chatAPI.sendMessage` | IMPLEMENTADO Y VERIFICADO |
| Historial de llamadas | ⚠️ | ❌ | ❌ | `app/call-history.tsx` | IMPLEMENTADO PERO INCOMPLETO — existe pantalla pero lógica no verificada |
| Llamadas grupales | ✅ | ⚠️ | ⚠️ | `useGroupCall.ts`, `app/group-call.tsx` | IMPLEMENTADO PERO INCOMPLETO — ICE credentials hardcodeadas, sin cleanup robusto |
| Fondo personalizable llamada | ✅ | ✅ | ✅ | `CallBackgroundPicker.tsx` | IMPLEMENTADO Y VERIFICADO |
| FaceFilter en video | ✅ | ⚠️ | NO VERIFICABLE | `FaceFilter.ts`, `[callId].tsx` | NO VERIFICABLE — módulo nativo sin confirmar |
| Screen share | ✅ | ⚠️ | NO VERIFICABLE | `[callId].tsx` | IMPLEMENTADO PERO INCOMPLETO — Android 10+ solo |
| Reconexión automática WebRTC | ❌ | ❌ | ❌ | — | NO IMPLEMENTADO |
| Foreground Service Android | ❌ | ❌ | ❌ | — | NO IMPLEMENTADO |
| AVAudioSession background iOS | ✅ | ⚠️ | ⚠️ | `_layout.tsx`, `[callId].tsx` | IMPLEMENTADO PERO INCOMPLETO — `staysActiveInBackground: true` solo en iOS init |
| VoIP Push iOS (PushKit) | ✅ | ⚠️ | ⚠️ | `AppDelegate.swift`, `EGChatPushKitModule.swift` | IMPLEMENTADO PERO CON ERRORES — reportNewIncomingCall no se llama desde AppDelegate |
| FCM Android llamadas | ✅ | ⚠️ | ⚠️ | `notifications.ts` | IMPLEMENTADO PERO INCOMPLETO — no funciona con app terminada |

---

## 11. Problemas Críticos (por severidad)

### 🔴 CRÍTICO 1 — CallKit mal integrado en iOS
**Archivo:** `[callId].tsx` líneas ~340-345, `EGChatCallModule.swift`

`NativeCallKit.showIncomingCall()` se llama desde `useEffect` en el componente JS, que se ejecuta DESPUÉS de que la pantalla monte. Apple exige que `CXProvider.reportNewIncomingCall()` se llame **dentro del callback `didReceiveIncomingPushWith`** del AppDelegate (máximo 1–2s). En la implementación actual: PushKit llega → AppDelegate emite evento JS → 300ms delay → router.push → React renderiza → useEffect → showIncomingCall. Esto supera el límite de Apple y puede hacer que iOS rechace la llamada silenciosamente o la marque como "failed".

**Solución:** Llamar directamente a `CXProvider.reportNewIncomingCall()` desde `AppDelegate.pushRegistry(_:didReceiveIncomingPushWith:)`, sin pasar por JS.

---

### 🔴 CRÍTICO 2 — WebRTC muere si la pantalla se desmonta
**Archivo:** `app/call/[callId].tsx`, `useWebRTC.ts`

El hook `useWebRTC` vive dentro de `[callId].tsx`. Cuando se usa `router.navigate()` para ir a otra tab, Expo Router puede desmontar la pantalla de llamada. Al desmontarse, el `useEffect cleanup` llama `cleanupResources()` y cierra el `RTCPeerConnection`. La llamada termina silenciosamente.

El PiP usa `router.navigate('/(tabs)/mensajeria')` — si la pantalla de llamada no estaba en el stack con `push`, se desmonta.

**Solución:** El WebRTC debe vivir en un contexto global (fuera del componente de pantalla) o la pantalla debe mantenerse siempre en el stack.

---

### 🔴 CRÍTICO 3 — Android app cerrada no recibe llamadas
**Archivo:** `notifications.ts`, `EGChatCallModule.kt`

`expo-task-manager` con `Notifications.registerTaskAsync()` no puede ejecutar código JS con la app terminada. En Android, cuando el usuario hace swipe-out, el proceso JS no existe. La notificación FCM puede llegar (Android la muestra), pero el `BACKGROUND_TASK` no se ejecuta para guardar los datos en AsyncStorage.

Resultado: el usuario ve la notificación de llamada, la toca, la app abre, pero `consumePendingCall()` devuelve null porque el BGTask nunca guardó los datos. La llamada ya expiró (TTL 60s).

**Solución:** Implementar `FirebaseMessagingService` nativo en Kotlin que procese el payload FCM directamente sin necesitar JS.

---

### 🔴 CRÍTICO 4 — Doble mecanismo de llamada entrante (app abierta)
**Archivo:** `_layout.tsx` líneas ~580-600

Cuando llega una llamada con la app abierta, `setupNotificationListeners` hace DOS cosas simultáneamente:
1. `setIncomingCall(...)` → muestra `IncomingCallOverlay` (modal)
2. `setTimeout(100ms)` → `router.push('/call/[id]')` → navega a la pantalla de llamada

El resultado es que el overlay modal aparece Y ADEMÁS se navega a la pantalla de llamada. Ambas muestran la UI de llamada entrante, ambas tienen botones "Aceptar" y "Rechazar". Si el usuario toca en el overlay, luego la pantalla de llamada sigue ahí con estado `idle`. Si el usuario acepta en la pantalla, el overlay no se cierra.

Además, la pantalla `[callId].tsx` como callee llama `NativeCallKit.showIncomingCall()` en un `useEffect`, que en iOS muestra la UI de CallKit encima de todo. Tres UIs posibles simultáneas.

---

### 🟠 ALTO 5 — Señalización HTTP polling con latencia acumulada
**Archivo:** `useWebRTC.ts`

Cada paso de la negociación depende del polling:
- Caller espera answer: polls cada 1–1.5s
- Callee espera ICE del caller: polls cada 800–1500ms
- Caller aplica ICE del callee: en el mismo poll

Un setup completo puede tardar 3–8s solo en latencia de polling antes de que ICE empiece. Con la latencia de Render (cold start 30–50s en plan gratuito), esto se hace mucho peor.

No hay WebSocket ni Supabase Realtime para señalización instantánea.

---

### 🟠 ALTO 6 — PiP dependiente del stack de navegación
**Archivo:** `FloatingCallBar.tsx`, `[callId].tsx`

`expandCall()` usa `router.back()`. Esto solo funciona si la pantalla `[callId].tsx` está en el historial de navegación. Si el usuario navega varias pantallas hacia adelante (chat → perfil → ajustes), `router.back()` no lleva de vuelta a la pantalla de llamada sino a la pantalla anterior.

---

### 🟠 ALTO 7 — No hay Foreground Service en Android
**Archivo:** Android

Sin un `ForegroundService`, Android puede matar el proceso JS en background cuando hay presión de memoria. Si el JS muere durante una llamada activa, el WebRTC se cierra pero la otra parte sigue con la llamada "conectada". Esto es especialmente grave en dispositivos con poca RAM o con agresivos kill processes (Xiaomi, Huawei, Samsung con battery saver).

---

### 🟡 MEDIO 8 — TURN servers sin SLA
OpenRelay gratuito puede estar caído o congestionado. Los servidores de `useGroupCall` tienen credenciales distintas (`egchat`/`egchat2025` vs `openrelayproject`/`openrelayproject`). Inconsistencia y riesgo de fallo en producción.

---

### 🟡 MEDIO 9 — EGChatPushKitModule.shared es weak
**Archivo:** `EGChatPushKitModule.swift` línea 9

`static weak var shared: EGChatPushKitModule?` — si el módulo es recolectado por el GC antes de recibir un push VoIP, `emitIncomingCall` no encontrará el módulo y el evento se perderá silenciosamente.

---

### 🟡 MEDIO 10 — Reintentos de offer: 20 × 3s = 60s
**Archivo:** `[callId].tsx` función `accept()`

Si el callee no obtiene el offer en el primer intento (por cold start de Render), espera hasta 60s reintentando. Durante ese tiempo la UI muestra "Conectando..." sin feedback al usuario. En la práctica, el caller puede haber colgado a los 90s (90 polls × 1s).

---

## 12. Qué Falta Implementar

1. **Señalización WebSocket / Supabase Realtime** — reemplazar polling por canal en tiempo real
2. **CallKit desde AppDelegate** — `reportNewIncomingCall` dentro del callback PushKit nativo
3. **FirebaseMessagingService nativo Android** — para recibir llamadas con app terminada
4. **Android ForegroundService** — mantener proceso vivo durante llamadas activas
5. **Android ConnectionService / TelecomManager** — integración con dialer nativo (como WhatsApp)
6. **WebRTC en contexto global** — desacoplar la conexión de la pantalla
7. **Mecanismo de reconexión WebRTC** — cuando ICE falla o cambia de red
8. **TURN servers propios o de pago** — Twilio, Metered, Xirsys
9. **Resolver doble mecanismo incoming call** — unificar overlay modal y router.push
10. **Android 13+ POST_NOTIFICATIONS runtime permission** — verificar que se solicita en el flujo

---

## 13. Riesgos

| Riesgo | Probabilidad | Impacto |
|---|---|---|
| Apple rechaza app por CallKit mal integrado | Alta | App store rejection |
| Android mata proceso en llamada activa | Alta en gama baja | Llamada cortada |
| Render cold start (30-50s) arruina experiencia | Alta (plan gratuito) | Llamadas fallidas |
| OpenRelay TURN caído | Media | Llamadas solo en LAN |
| iOS 17+ depreca APIs PushKit sin CallKit correcto | Alta | Bug en producción |
| Doble UI llamada entrante confunde usuario | Alta | UX rota |
| react-native-webrtc 124 + RN 0.81 bugs | Baja | Crashes |

---

## 14. Recomendaciones

1. **Prioridad máxima:** Mover `reportNewIncomingCall` al AppDelegate nativo. Sin esto CallKit no funciona correctamente en iOS con app cerrada.

2. **Prioridad alta:** Implementar `FirebaseMessagingService` en Kotlin para Android con app terminada.

3. **Prioridad alta:** Unificar el mecanismo de llamada entrante (app abierta). Elegir UNO: o el overlay modal o la navegación directa a la pantalla, no ambos.

4. **Prioridad media:** Mover el estado WebRTC a un contexto global para que sobreviva la navegación.

5. **Prioridad media:** Añadir señalización via Supabase Realtime o WebSocket para eliminar el polling y reducir la latencia de 3–8s.

6. **Prioridad media:** Implementar Android ForegroundService para mantener el proceso vivo.

7. **Prioridad baja:** Migrar a TURN servers de pago para producción.

---

## 15. Plan de Implementación por Fases

### Fase 1 — Correcciones críticas (1–2 semanas)
> Objetivo: llamadas funcionan de forma fiable en los escenarios más comunes

- **F1.1** Mover `CXProvider.reportNewIncomingCall` al AppDelegate iOS (nativo Swift) `[ALTO IMPACTO, BAJA COMPLEJIDAD]`
- **F1.2** Unificar mecanismo llamada entrante app abierta — eliminar el `router.push` redundante, dejar solo overlay + navigación desde el overlay `[MEDIO IMPACTO, BAJA COMPLEJIDAD]`
- **F1.3** Cambiar `router.navigate` por `router.push` en `openMessageMode()` para garantizar que la pantalla de llamada queda en el stack `[ALTO IMPACTO, MUY BAJA COMPLEJIDAD]`
- **F1.4** Fix `EGChatPushKitModule.shared` de `weak` a `strong` (o gestión explícita del ciclo de vida) `[MEDIO IMPACTO, BAJA COMPLEJIDAD]`

### Fase 2 — Android background (1–2 semanas)
> Objetivo: Android recibe llamadas con app cerrada

- **F2.1** Implementar `FirebaseMessagingService.kt` nativo que muestre notificación full-screen directamente sin JS `[ALTO IMPACTO, MEDIA COMPLEJIDAD]`
- **F2.2** Implementar `ForegroundService` en Kotlin para mantener proceso durante llamadas `[ALTO IMPACTO, MEDIA COMPLEJIDAD]`
- **F2.3** Registrar `FirebaseMessagingService` en AndroidManifest `[BAJA COMPLEJIDAD]`

### Fase 3 — WebRTC robusto (2–3 semanas)
> Objetivo: llamadas estables, con reconexión y sin dependencia de pantalla

- **F3.1** Mover `useWebRTC` (o `RTCPeerConnection`) a un singleton/contexto global `[ALTO IMPACTO, ALTA COMPLEJIDAD]`
- **F3.2** Implementar lógica de reconexión cuando `iceConnectionState === 'disconnected'` (restart ICE) `[MEDIO IMPACTO, MEDIA COMPLEJIDAD]`
- **F3.3** Reemplazar polling por Supabase Realtime channel para señalización SDP + ICE `[ALTO IMPACTO, ALTA COMPLEJIDAD]`

### Fase 4 — Producción (1 semana)
> Objetivo: estabilidad en producción real

- **F4.1** Migrar de Render gratuito a plan de pago (o Railway/Fly.io) para eliminar cold starts `[ALTO IMPACTO, BAJA COMPLEJIDAD]`
- **F4.2** Configurar TURN servers propios (Metered.ca paid tier o Twilio) `[MEDIO IMPACTO, BAJA COMPLEJIDAD]`
- **F4.3** Añadir Android ConnectionService/TelecomManager para integración con dialer nativo `[BAJO IMPACTO, ALTA COMPLEJIDAD]`

---

*Informe generado por auditoría estática — no se modificó ningún archivo del proyecto.*
