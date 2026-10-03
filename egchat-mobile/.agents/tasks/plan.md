# Plan de Implementación — Reconexión WebRTC Robusta

> Rama de trabajo: `mobile`  
> Directorio: `egchat-mobile/`  
> Archivos tocados: `CallManager.ts`, `callSupabase.ts`, `WEBRTC_RECONNECTION_TESTS.md`  
> `useWebRTC.ts`, `types.ts`, `api.ts` y `package.json` **no se modifican**.

---

## Hallazgos del código auditado

| # | Archivo | Problema concreto |
|---|---------|-------------------|
| 1 | `CallManager.ts` L872 | `_scheduleIceRestart()` solo actúa si `signalingState === 'have-local-offer'`. El callee tiene `signalingState === 'stable'` después de enviar el answer — por eso **nunca** relanza ICE. |
| 2 | `CallManager.ts` L830–L860 | Polling del callee: solo aplica candidatos ICE (`callerCandidates`). No detecta ni procesa un restart-offer del caller (`offer_version`). |
| 3 | `CallManager.ts` L339/L358 | `onconnectionstatechange` e `oniceconnectionstatechange` llaman ambos a `_scheduleIceRestart()`. El guard es `if (_reconnectTimer)`, pero entre el `if` y la asignación no hay atomicidad: si los dos eventos llegan dentro del mismo tick del event-loop se pueden crear dos timers. |
| 4 | `CallManager.ts` L829 | `callerIceOffset` y `calleeIceOffset` son variables locales del closure de `_startPoll`. Son inalcanzables desde `_scheduleIceRestart()`, impidiendo resetearlos cuando se hace ICE restart. |
| 5 | `callSupabase.ts` L130 | `CHANNEL_ERROR` se loguea pero no se reintenta la suscripción: `subscribeToCallState` pierde todos los eventos Realtime siguientes. |
| 6 | `CallManager.ts` L166 | `_getIceServers()` no reintenta si Render está en cold start: una sola excepción cae al fallback estático permanentemente. |
| 7 | `CallManager.ts` | Sin `NetInfo` listener: la transición de red no se detecta hasta que WebRTC mide el silencio (5–10 s adicionales). |
| 8 | `CallManager.ts` L89 | `ICE_RECONNECTED_MS = 4000` y `ICE_RESTART_TIMEOUT_MS = 12000` son demasiado cortos para 4G en algunos mercados. No hay backoff: todos los reintentos usan el mismo delay. |
| 9 | `package.json` | `@react-native-community/netinfo` ya está en `dependencies` (versión `11.4.1`). No es necesario añadirlo. |

---

## Orden de implementación

Los ítems están ordenados de forma que cada cambio sea independiente y compile por sí solo. Los ítems 1–7 van todos en `CallManager.ts`; el ítem 8 en `callSupabase.ts`; el ítem 9 crea el fichero de pruebas.

---

- [ ] 1. **Ajustar constantes de timeout y añadir propiedades de clase nuevas** en `CallManager.ts`

  Reemplazar las constantes de timeout actuales por los valores ajustados, y añadir las propiedades de clase que el resto de los ítems necesitan.

  **Constantes** (sección `// ── Timeouts ──`):
  ```typescript
  // Antes:
  const ICE_DISCONNECTED_MS    =  4_000;
  const ICE_RESTART_TIMEOUT_MS = 12_000;
  const RECONNECT_MAX          = 3;

  // Después:
  const ICE_DISCONNECTED_BASE_MS =  2_000;  // base del backoff exponencial
  const ICE_RESTART_TIMEOUT_MS   = 20_000;  // 20s para cubrir 4G lento
  const RECONNECT_MAX            = 4;
  ```
  Eliminar `ICE_DISCONNECTED_MS`; el resto del código usará `ICE_DISCONNECTED_BASE_MS`.

  **Propiedades de clase nuevas** (bloque `// ── WebRTC refs ──`):
  ```typescript
  // Guardia atómica para evitar múltiples ICE restarts simultáneos
  private _iceRestartPending = false;

  // Offsets de candidatos ICE como propiedades de clase
  // (permiten resetearlos desde _scheduleIceRestart sin romper el closure)
  private _iceOffsetCaller  = 0;
  private _iceOffsetCallee  = 0;

  // Control de versión de la offer para que el callee detecte restart-offers
  private _answerApplied    = false;
  private _offerVersion     = 0;

  // Suscripción a cambios de red (NetInfo)
  private _netInfoSub: (() => void) | null = null;
  ```

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `cd egchat-mobile && npx tsc --noEmit` sin errores de tipo.

---

- [ ] 2. **Migrar variables locales del closure de `_startPoll` a propiedades de clase** en `CallManager.ts`

  Dentro de `_startPoll`, las variables `callerIceOffset`, `calleeIceOffset`, `answerApplied` y `offerVersion` deben eliminarse como `let` locales y sustituirse por las propiedades `this._iceOffsetCaller`, `this._iceOffsetCallee`, `this._answerApplied` y `this._offerVersion` del ítem 1.

  Además, en `_createPC` (que llama `_reset → _finalCleanup`), y en `_reset`, se deben resetear estos valores a `0` / `false` al crear una nueva PC (ya se resetean en `_createPC` para `_remoteDescSet`, `_connectedOnce`, `_iceQueue` — añadir los cuatro nuevos aquí).

  **Zona exacta a modificar** (líneas ~820–860 de `_startPoll`):
  ```typescript
  // Eliminar:
  let callerIceOffset = 0;
  let calleeIceOffset = 0;
  let answerApplied   = false;
  let polls           = 0;

  // Sustituir usos:
  //   callerIceOffset  → this._iceOffsetCaller
  //   calleeIceOffset  → this._iceOffsetCallee
  //   answerApplied    → this._answerApplied
  // polls sigue siendo local (solo controla el ritmo del polling)
  ```

  En `_createPC` añadir al bloque de reset:
  ```typescript
  this._iceOffsetCaller  = 0;
  this._iceOffsetCallee  = 0;
  this._answerApplied    = false;
  this._offerVersion     = 0;
  this._iceRestartPending = false;
  ```

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit` sin errores; la lógica del polling sigue el mismo camino de datos que antes.

---

- [ ] 3. **ICE restart simétrico: el callee procesa restart-offers del caller** en `CallManager.ts`

  En la rama `if (role === 'callee')` del polling, añadir la detección y procesamiento de una nueva offer (ICE restart enviada por el caller):

  ```typescript
  // Callee: detectar restart-offer del caller (ICE restart simétrico)
  if (role === 'callee' && s.offer && this._pc && NativeRTC) {
    const incomingVersion: number = (s as any).offer_version ?? 0;
    const isNewOffer =
      incomingVersion > this._offerVersion ||
      this._pc.signalingState === 'have-remote-offer';

    if (isNewOffer && this._isValidSdp(s.offer)) {
      try {
        await this._pc.setRemoteDescription(
          new NativeRTC.RTCSessionDescription(s.offer)
        );
        this._remoteDescSet = true;
        this._offerVersion  = incomingVersion;
        await this._drainIceQueue();

        const newAnswer = await this._pc.createAnswer();
        await this._pc.setLocalDescription(newAnswer);
        await callAPI.answer({
          callId: this._session!.callId,
          answer: this._pc.localDescription,
        });
        // Reiniciar offsets de candidatos para que no se salten los nuevos
        this._iceOffsetCaller = 0;
        this._iceOffsetCallee = 0;
      } catch (e) {
        console.warn('[CallManager] Callee: error procesando restart-offer:', e);
      }
    }
  }

  // Callee: aplicar candidatos ICE del caller (lógica existente migrada)
  if (role === 'callee' && s.callerCandidates) {
    const newCands = s.callerCandidates.slice(this._iceOffsetCaller);
    this._iceOffsetCaller = s.callerCandidates.length;
    await this._applyRemoteIceCandidates(newCands);
  }
  ```

  La rama del caller ya aplica el answer; solo hay que migrar `answerApplied` → `this._answerApplied` y los offsets (ítem 2 ya lo hace), y añadir el reset de `offer_version` del lado caller cuando vuelve a recibir el nuevo answer.

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit`; la rama callee del polling compile sin errores.

---

- [ ] 4. **Flag `_iceRestartPending` y backoff exponencial en `_scheduleIceRestart()`** en `CallManager.ts`

  Reemplazar completamente el método `_scheduleIceRestart()`:

  ```typescript
  /**
   * Programa un ICE restart con backoff exponencial.
   *
   * Intento 1: 2s × 1 = 2s (± 20% jitter)
   * Intento 2: 2s × 2 = 4s (± 20% jitter)
   * Intento 3: 2s × 4 = 8s (± 20% jitter)
   * Intento 4: 2s × 8 = 16s (± 20% jitter)
   *
   * _iceRestartPending actúa como mutex: un solo restart en vuelo.
   */
  private _scheduleIceRestart(): void {
    if (this._isEnding || this._iceRestartPending) return;
    this._iceRestartPending = true;

    // Backoff: base × 2^(intento-1), con ± 20% de jitter
    const base    = ICE_DISCONNECTED_BASE_MS;
    const exp     = Math.pow(2, this._reconnectCount);       // 1, 2, 4, 8
    const jitter  = 1 + (Math.random() * 0.4 - 0.2);        // [0.8, 1.2]
    const delay   = Math.round(base * exp * jitter);

    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer  = null;
      this._iceRestartPending = false;

      if (this._isEnding || !this._pc) return;

      const ics = this._pc.iceConnectionState;
      if (ics === 'connected' || ics === 'completed') return; // recuperado solo

      if (this._reconnectCount >= RECONNECT_MAX) {
        this._handleConnectionFailed();
        return;
      }
      this._reconnectCount++;

      try {
        // Tanto caller como callee pueden crear el restart-offer
        const sigState: string = this._pc.signalingState || '';
        if (
          sigState === 'stable' ||
          sigState === 'have-local-offer' ||
          sigState === 'have-remote-offer'
        ) {
          const iceServers = await this._getIceServers();
          this._pc.setConfiguration?.({ iceServers });

          const restartOffer = await this._pc.createOffer({ iceRestart: true });
          await this._pc.setLocalDescription(restartOffer);

          await callAPI.offer({
            callId:       this._session!.callId,
            offer:        this._pc.localDescription,
            targetUserId: this._session!.targetUserId,
            type:         this._session!.callType,
          });

          // Resetear offsets para recibir candidatos frescos
          this._iceOffsetCaller = 0;
          this._iceOffsetCallee = 0;

          // Timeout de ICE restart: si no conecta en 20s → fallo
          this._iceRestartTimer = setTimeout(() => {
            this._iceRestartTimer = null;
            const state = this._pc?.iceConnectionState;
            if (state !== 'connected' && state !== 'completed' && !this._isEnding) {
              this._iceRestartPending = false;
              this._handleConnectionFailed();
            }
          }, ICE_RESTART_TIMEOUT_MS);
        }
      } catch {
        this._iceRestartPending = false;
        this._handleConnectionFailed();
      }
    }, delay);
  }
  ```

  También actualizar `_clearIceRestartTimer()` para resetear el flag:
  ```typescript
  private _clearIceRestartTimer(): void {
    if (this._iceRestartTimer) { clearTimeout(this._iceRestartTimer); this._iceRestartTimer = null; }
    if (this._reconnectTimer)  { clearTimeout(this._reconnectTimer);  this._reconnectTimer  = null; }
    this._iceRestartPending = false;   // liberar el mutex al limpiar
  }
  ```

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit`; confirmar que no existe `ICE_DISCONNECTED_MS` en el fichero (fue eliminada en ítem 1).

---

- [ ] 5. **TURN token con reintento** en `_getIceServers()` en `CallManager.ts`

  Reemplazar el bloque `try/catch` del primer intento en `_getIceServers()`:

  ```typescript
  private async _getIceServers(): Promise<object[]> {
    // Primer intento de obtener credenciales TURN temporales
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await callAPI.getTurnToken?.();
        if (data?.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          return [...STUN_SERVERS, ...data.iceServers];
        }
      } catch {
        if (attempt === 0) {
          // Render puede estar en cold start — esperar 3s y reintentar una vez
          await new Promise(r => setTimeout(r, 3_000));
        }
      }
    }

    // Fallback: variable de entorno o TURN público (sin SLA)
    const envTurn = process.env.EXPO_PUBLIC_TURN_SERVERS;
    if (envTurn) {
      try {
        const parsed = JSON.parse(envTurn);
        if (Array.isArray(parsed) && parsed.length > 0) return [...STUN_SERVERS, ...parsed];
      } catch { /* */ }
    }

    return [...STUN_SERVERS, ...TURN_FALLBACK];
  }
  ```

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit`; el método devuelve `Promise<object[]>` en todos los paths.

---

- [ ] 6. **Listener proactivo de NetInfo** en `CallManager.ts`

  Añadir el import y los métodos `_subscribeNetwork()` / `_unsubscribeNetwork()`, y llamarlos desde `startCall`, `acceptCall` y `_finalCleanup`.

  **Import** (junto a los existentes de React Native):
  ```typescript
  import NetInfo from '@react-native-community/netinfo';
  ```

  **Métodos nuevos** (junto a `_subscribeAppState`):
  ```typescript
  /**
   * Suscribe a cambios de conectividad de red.
   * Permite detectar transiciones Wi-Fi ↔ 4G/5G antes de que
   * WebRTC mida el silencio (ahorra 5–10 s de reconexión).
   */
  private _subscribeNetwork(): void {
    if (this._netInfoSub) return;
    this._netInfoSub = NetInfo.addEventListener(state => {
      if (!this.isActive || this._isEnding) return;

      // Red recuperada mientras estábamos en reconexión → lanzar ICE restart
      if (state.isConnected && this._commState === 'reconnecting') {
        this._scheduleIceRestart();
      }

      // Red perdida mientras estábamos conectados → pasar a reconexión
      if (!state.isConnected && this._commState === 'connected') {
        this._setCommState('reconnecting');
      }
    });
  }

  private _unsubscribeNetwork(): void {
    this._netInfoSub?.();
    this._netInfoSub = null;
  }
  ```

  **Llamadas desde `startCall`** (después de `this._subscribeRealtime()`):
  ```typescript
  this._subscribeNetwork();
  ```

  **Llamadas desde `acceptCall`** (después de `this._subscribeRealtime()`):
  ```typescript
  this._subscribeNetwork();
  ```

  **Llamadas desde `_finalCleanup`** (en la sección `// 2. AppState y listeners nativos`):
  ```typescript
  this._unsubscribeNetwork();
  ```

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit`; `NetInfo` resuelve sin error de tipo (el paquete ya está en `package.json`).

---

- [ ] 7. **Limpiar `_iceRestartPending` en `_finalCleanup`** en `CallManager.ts`

  En `_finalCleanup`, dentro de la sección `// 6. Flags`, añadir el reset del nuevo flag:
  ```typescript
  this._iceRestartPending = false;
  ```

  Y en el bloque `// 5. ICE state` (donde se limpian `_iceSentKeys`, `_iceQueue`, etc.) añadir:
  ```typescript
  this._iceOffsetCaller  = 0;
  this._iceOffsetCallee  = 0;
  this._answerApplied    = false;
  this._offerVersion     = 0;
  ```

  Esto garantiza que cada nueva llamada arranca con estado limpio.

  **Archivos**: `egchat-mobile/src/call/CallManager.ts`

  **Verificar**: `npx tsc --noEmit`; ninguna propiedad de clase queda sin limpiar tras una llamada.

---

- [ ] 8. **Reconexión de Supabase Realtime en `CHANNEL_ERROR`** en `callSupabase.ts`

  En la función `subscribeToCallState`, reemplazar el callback de `channel.subscribe`:

  ```typescript
  // Antes:
  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn(`[callSupabase] Error en canal call-state:${callId}`);
    }
  });

  // Después:
  let resubscribeTimer: ReturnType<typeof setTimeout> | null = null;

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.warn(`[callSupabase] Error en canal call-state:${callId} — reintentando en 3 s`);
      // Reintento único con backoff simple para no saturar Supabase
      if (!resubscribeTimer) {
        resubscribeTimer = setTimeout(() => {
          resubscribeTimer = null;
          channel.subscribe();
        }, 3_000);
      }
    }
    if (status === 'SUBSCRIBED') {
      // Limpiar el timer si el canal se reconectó solo antes del timeout
      if (resubscribeTimer) {
        clearTimeout(resubscribeTimer);
        resubscribeTimer = null;
      }
    }
  });
  ```

  Actualizar la función de cleanup para cancelar también el timer:
  ```typescript
  return () => {
    if (resubscribeTimer) clearTimeout(resubscribeTimer);
    supabase.removeChannel(channel);
  };
  ```

  **Archivos**: `egchat-mobile/src/call/callSupabase.ts`

  **Verificar**: `npx tsc --noEmit`; el tipo del cleanup sigue siendo `() => void`.

---

- [ ] 9. **Verificación TypeScript final** de todos los archivos modificados

  Ejecutar:
  ```bash
  cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile
  npx tsc --noEmit 2>&1
  ```

  Resultado esperado: **cero errores**. Si hay errores:
  - Tipos `any` inesperados: añadir cast explícito o `as any` con comentario.
  - `RTCSessionDescription` no reconocido: confirmar que el acceso es `NativeRTC!.RTCSessionDescription`.
  - Propiedad faltante en interfaz: no modificar `types.ts`; usar cast local.

  **Archivos**: `CallManager.ts`, `callSupabase.ts`

  **Verificar**: salida `npx tsc --noEmit` sin líneas que contengan `error TS`.

---

- [ ] 10. **Crear `WEBRTC_RECONNECTION_TESTS.md`** con los escenarios de prueba reales

  Crear el archivo en `egchat-mobile/WEBRTC_RECONNECTION_TESTS.md` con el contenido siguiente.

  **Archivos**: `egchat-mobile/WEBRTC_RECONNECTION_TESTS.md` (nuevo)

  **Verificar**: el archivo existe y tiene al menos los 6 escenarios documentados.

---

## Contenido de WEBRTC_RECONNECTION_TESTS.md

```markdown
# Pruebas de Reconexión WebRTC — EGChat Mobile

## Requisitos para ejecutar las pruebas
- 2 dispositivos físicos (iOS + Android, o 2 Android)
- Ambos con la build Preview (`eas build --profile preview`)
- Acceso a los logs nativos (`adb logcat` / Xcode console)
- Conexión Wi-Fi y datos móviles disponibles en ambos

## Escenarios

### E1: Wi-Fi → 4G/5G durante llamada activa

**Preparación**: Llamada de audio activa, ambos en Wi-Fi.

**Acción**: En el dispositivo A, desactivar Wi-Fi desde Ajustes rápidos.

**Comportamiento esperado**:
1. `commState` pasa de `connected` → `reconnecting` en ≤ 2 s (NetInfo detecta la transición).
2. `_scheduleIceRestart` se dispara con delay ~2 s (intento 1, backoff base).
3. El caller genera una nueva offer con `{ iceRestart: true }` y la sube a la API.
4. El callee detecta la nueva offer en el siguiente tick de polling y responde con un nuevo answer.
5. `commState` vuelve a `connected` en ≤ 25 s.
6. Audio restaurado sin corte perceptible (max 1–2 s de silencio).

**Criterio de fallo**: Si `commState` llega a `failed` o la llamada termina sola.

---

### E2: 4G/5G → Wi-Fi durante llamada activa

**Preparación**: Llamada de audio activa, ambos en datos móviles.

**Acción**: En el dispositivo A, activar Wi-Fi.

**Comportamiento esperado**:
1. NetInfo dispara el evento `isConnected: true` con el nuevo tipo de red.
2. Si `commState === 'reconnecting'`, se dispara `_scheduleIceRestart` inmediatamente.
3. Si `commState === 'connected'`, WebRTC detecta el cambio de candidato (nuevo IP local) y renegocia solo vía `onnegotiationneeded`.
4. Llamada se mantiene o se recupera en ≤ 20 s.

**Criterio de fallo**: Llamada termina sola o queda en `reconnecting` > 30 s.

---

### E3: Pérdida total de Internet (modo avión)

**Preparación**: Llamada activa.

**Acción**: Activar modo avión en el dispositivo A.

**Comportamiento esperado**:
1. NetInfo notifica `isConnected: false` → `commState = 'reconnecting'`.
2. `_scheduleIceRestart` programa intentos con backoff: 2 s, 4 s, 8 s, 16 s.
3. Tras 4 intentos fallidos (`RECONNECT_MAX = 4`), `commState = 'failed'`.
4. `endCall()` se llama automáticamente.
5. La llamada queda registrada en Supabase como `failed`.

**Log esperado** (filtrar por `[CallManager]`):
```
[CallManager] ICE restart intento 1 (delay ~2000ms)
[CallManager] ICE restart intento 2 (delay ~4000ms)
[CallManager] ICE restart intento 3 (delay ~8000ms)
[CallManager] ICE restart intento 4 (delay ~16000ms)
[CallManager] handleConnectionFailed — RECONNECT_MAX alcanzado
```

**Criterio de fallo**: La app se queda en `reconnecting` indefinidamente.

---

### E4: Recuperación tras pérdida breve de Internet

**Preparación**: Llamada activa.

**Acción**: Activar modo avión durante 8 s y luego desactivarlo.

**Comportamiento esperado**:
1. `commState = 'reconnecting'` al perder red.
2. Al recuperar red (antes de que se agoten los 4 intentos), NetInfo dispara `isConnected: true`.
3. `_scheduleIceRestart` se lanza (o el intento en curso se completa).
4. `commState` vuelve a `connected` en ≤ 25 s tras recuperar red.
5. Audio restaurado.

**Criterio de fallo**: La llamada termina en `failed` aunque la red se recuperó.

---

### E5: Cambio de red durante videollamada activa

**Preparación**: Llamada de vídeo activa, ambos en Wi-Fi.

**Acción**: En el dispositivo A, desactivar Wi-Fi.

**Comportamiento esperado**:
1. Igual que E1, pero con vídeo.
2. El track de vídeo se restaura automáticamente tras el ICE restart (no se necesita `replaceTrack` manual).
3. Si la cámara estaba en pausa (`_isCamOff = true`), permanece en pausa tras la reconexión.

**Criterio de fallo**: Vídeo no vuelve, o la app crasha al restaurar el track.

---

### E6: Supabase Realtime CHANNEL_ERROR durante llamada

**Preparación**: Llamada activa. Simular error de canal Realtime desconectando/reconectando la conexión de Supabase desde el servidor de prueba, o usando una red muy inestable.

**Comportamiento esperado**:
1. `[callSupabase] Error en canal call-state:XXX — reintentando en 3 s` aparece en logs.
2. Tras 3 s, el canal se reuscribe automáticamente (`channel.subscribe()`).
3. Los eventos de estado de llamada vuelven a llegar por Realtime.
4. El polling HTTP sigue funcionando como fallback durante esos 3 s.

**Criterio de fallo**: El canal no se reuscribe y los eventos de estado se pierden permanentemente.

---

## Registro de pruebas

| Fecha | Dispositivos | Escenario | Resultado | Notas |
|-------|-------------|-----------|-----------|-------|
| — | — | E1 | Pendiente | |
| — | — | E2 | Pendiente | |
| — | — | E3 | Pendiente | |
| — | — | E4 | Pendiente | |
| — | — | E5 | Pendiente | |
| — | — | E6 | Pendiente | |

## Cómo leer los logs

**Android** (filtrar por tag `[CallManager]`):
```bash
adb logcat | grep -E "\[CallManager\]|\[callSupabase\]"
```

**iOS** (Xcode → Console → filtrar por subsystem `EGChat`):
```
os_log filter: subsystem == "com.egchat.mobile"
```

O bien usar `npx expo start --dev-client` y observar la consola Metro.
```
