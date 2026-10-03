# Plan de implementación — Sistema de audio de llamadas

Elaborado tras leer el código real de los cuatro archivos:
- `src/call/CallManager.ts`
- `src/hooks/useWebRTC.ts`
- `app/call/[callId].tsx`
- `src/native/CallKit.ts`

---

## 1. Confirmación de problemas (código real leído)

### Problema 1 — `_applyAudioSession` no especifica `iosCategory` ni `iosMode` ✅ CONFIRMADO

`_applyAudioSession()` y `_applyAudioRoute()` llaman a `Audio.setAudioModeAsync` con solo cinco campos:
```
allowsRecordingIOS, playsInSilentModeIOS, shouldDuckAndroid,
playThroughEarpieceAndroid, staysActiveInBackground
```
Ninguno de los dos pasa `iosCategory` ni `iosMode`. expo-av usa `SoloAmbient` por defecto cuando no se especifica la categoría; eso enruta audio al altavoz en lugar del auricular y desactiva el micrófono cuando la pantalla se bloquea.

### Problema 2 — `_restoreAudioSession` no se llama en `_finalCleanup` ✅ CONFIRMADO

`endCall()` sí llama `_restoreAudioSession()` antes de `_finalCleanup()`.
Pero `_finalCleanup()` puede ser invocado directamente desde `rejectCall()`, `cancelCall()`, el handler de Realtime y el handler de `connectionstate === 'closed'` — ninguno de esos paths llama `_restoreAudioSession()`. La AudioSession queda en modo llamada.

`endCall()` también tiene una guarda `if (this._isEnding) return`, por lo que si `_finalCleanup` lo llama, la restauración de audio nunca ocurre en la segunda invocación.

Adicionalmente, en `_restoreAudioSession()` `staysActiveInBackground: false` no desactiva la sesión explícitamente; en iOS el micrófono puede quedar abierto.

### Problema 3 — Android: no hay AudioFocus `AUDIOFOCUS_GAIN` ✅ CONFIRMADO

`shouldDuckAndroid: false` está correcto, pero expo-av con esa sola flag solicita `AUDIOFOCUS_GAIN_TRANSIENT` internamente. No hay mecanismo para restaurar el foco si otra app lo toma. Cuando llega una notificación de audio o llamada externa, el audio WebRTC se corta y no se reanuda al volver.

### Problema 4 — `getUserMedia` puede crear tracks duplicados ✅ CONFIRMADO

En `acceptCall()`:
```ts
const stream = await this._getUserMedia(callType);
this._localStream = stream;
```
No existe la guarda `if (this._localStream && tracks activos) return`. Si `acceptCall()` se llama dos veces (doble-tap o re-mount de la pantalla), se crean dos MediaStreams y dos conjuntos de tracks abren el micrófono, sin que el primero se cierre.

### Problema 5 — Botón altavoz en `[callId].tsx` es solo visual ✅ CONFIRMADO

```ts
const [speakerOn, setSpeakerOn] = useState(true);

const toggleSpeaker = useCallback(async () => {
  const next = !speakerOn;
  setSpeakerOn(next);
  await callManager.toggleSpeaker();   // ← sí llama al manager
}, [speakerOn]);
```
La llamada al manager **sí existe**, pero `speakerOn` local **no se sincroniza** con `callManager.state.isSpeakerOn`. Si el manager cambia el estado internamente (p.ej. `onAudioRouteChanged` detecta Bluetooth → `_isBluetoothOn = true`), el estado local de la pantalla queda desfasado. El ícono muestra información incorrecta.

### Problema 6 — `useWebRTC` no exporta `isSpeakerOn` ni `toggleSpeaker` ✅ CONFIRMADO

El `return` del hook devuelve:
```ts
callState, callType, isMuted, isCamOff, isSignalingOnly,
hasNativeMedia, localStream, remoteStream,
startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
switchCamera, toggleBluetooth
```
`isSpeakerOn` (del snapshot `callManager.state.isSpeakerOn`) y `toggleSpeaker` **no están**. La pantalla accede a `callManager.toggleSpeaker()` directamente, saltándose la fachada.

### Problema 7 — Retorno de background no re-aplica ruta de audio ✅ CONFIRMADO

En `_subscribeAppState()`, cuando la app vuelve al primer plano:
```ts
if (prev !== 'active' && next === 'active') {
  if (this.isActive && this._pc) {
    // ...ICE check...
    this._applyAudioSession().catch(() => {});   // ← llama _applyAudioSession
  }
}
```
Llama `_applyAudioSession()` pero **no** `_applyAudioRoute()`. `_applyAudioSession` fija la sesión pero no re-aplica la elección del usuario (altavoz/auricular/BT). Si el usuario eligió auricular antes de poner la app en background, al volver puede obtener altavoz.

### Problema 8 — `NativeCallKit.stopCallForegroundService()` solo en `endCall` ✅ CONFIRMADO

El ForegroundService de Android solo se detiene en `endCall()`. Cuando la llamada termina por path alternativo (Realtime, timeout, PC closed), `_finalCleanup()` no llama `stopCallForegroundService()`. El servicio queda corriendo en background.

---

## 2. Matriz de auditoría

| Función | Actual | Correcta | Plataforma | Problema | Solución |
|---|---|---|---|---|---|
| 1. Micrófono activado | `track.enabled = true` en `toggleMute()` | Igual + `iosCategory: playAndRecord` + `iosMode: measurement` activo | iOS / Android | Sin categoría iOS, micrófono puede cortarse al bloquear pantalla | Añadir `iosCategory` y `iosMode` en `_applyAudioSession` |
| 2. Micrófono silenciado | `track.enabled = false` | Igual + restaurar estado tras interrupción del sistema | iOS / Android | Al volver de interrupción, `_isMuted` se respeta pero el AudioSession puede no estar activo | Re-aplicar AudioSession al reanudar; ya implementado para interrupción iOS |
| 3. Altavoz | `playThroughEarpieceAndroid: false`; iOS sin routing explícito | `iosCategory: playAndRecord` + `iosMode: spokenAudio` cuando speaker=true | iOS | Sin modo iOS correcto, el routing es impredecible | Usar `iosMode: 'spokenAudio'` para altavoz y `'voiceChat'` para auricular |
| 4. Auricular | `playThroughEarpieceAndroid: true` | Igual + `iosMode: voiceChat` | iOS / Android | iOS usa altavoz por defecto sin `voiceChat` | Pasar `iosMode: 'voiceChat'` cuando speaker=false en `_applyAudioRoute` |
| 5. Bluetooth | `_isBluetoothOn` flag + `_applyAudioRoute` no cambia nada más | iOS: deja que CallKit/AVAudioSession elija el input BT; Android: `allowBluetooth` en AudioManager | iOS / Android | `toggleBluetooth` solo cambia flag; el routing BT real no se aplica desde JS en iOS | Documentar límite; en Android añadir allowBluetooth via módulo nativo; en iOS confiar en `onAudioRouteChanged` |
| 6. Cambio automático de ruta | `onAudioRouteChanged` actualiza `_isBluetoothOn` | Igual + actualizar `_isSpeakerOn` si la ruta es speaker/earpiece | iOS | Solo actualiza BT flag; el flag speaker puede quedar desfasado | En handler de `onAudioRouteChanged`, actualizar también `_isSpeakerOn` |
| 7. Llamada telefónica externa | `onAudioInterrupted` pausa tracks | Mismo + re-aplicar AudioSession con `iosCategory`+`iosMode` correctos al reanudar | iOS | `_applyAudioSession` no incluye categoría/modo → sesión puede no reconfigurarse bien | Añadir parámetros completos a `_applyAudioSession`; ya se llama en reanudación |
| 8. Reproducción multimedia externa | `shouldDuckAndroid: false` | Correcto; + solicitar `AUDIOFOCUS_GAIN` explícito en Android | Android | expo-av solicita `GAIN_TRANSIENT`; al perder foco no se reanuda automáticamente | Re-aplicar AudioSession al volver al primer plano (ya hecho), asegurar también en reanudación de interrupción Android |
| 9. Bloqueo de pantalla | `staysActiveInBackground: true` | Igual + `iosCategory: playAndRecord` para mantener micrófono activo | iOS | Sin categoría `playAndRecord`, iOS suspende el micrófono al bloquear | Añadir `iosCategory: 'playAndRecord'` en `_applyAudioSession` |
| 10. Regreso de segundo plano | `_applyAudioSession()` en AppState change | `_applyAudioRoute()` adicional para re-aplicar elección usuario | iOS / Android | Se re-aplica la sesión pero no la ruta (altavoz/auricular) elegida por el usuario | Llamar también `_applyAudioRoute()` junto con `_applyAudioSession()` al volver al primer plano |

---

## 3. Lista ordenada de cambios por archivo

### Archivo A: `src/call/CallManager.ts`

#### A-1. Añadir `iosCategory` e `iosMode` en `_applyAudioSession()`

**Función:** `_applyAudioSession()` (líneas ~940-955 aprox.)

**Cambio:**
```ts
// ANTES
await Audio.setAudioModeAsync({
  allowsRecordingIOS:        true,
  playsInSilentModeIOS:      true,
  shouldDuckAndroid:         false,
  playThroughEarpieceAndroid: !this._isSpeakerOn && !this._isBluetoothOn,
  staysActiveInBackground:   true,
});

// DESPUÉS
await Audio.setAudioModeAsync({
  allowsRecordingIOS:        true,
  playsInSilentModeIOS:      true,
  staysActiveInBackground:   true,
  shouldDuckAndroid:         false,
  playThroughEarpieceAndroid: !this._isSpeakerOn && !this._isBluetoothOn,
  // iOS — categoría y modo para llamada activa:
  // playAndRecord: mantiene micrófono activo en background y al bloquear.
  // voiceChat: enruta al auricular y activa cancelación de eco del sistema.
  iosCategory:              'playAndRecord',
  iosMode:                  'voiceChat',
  interruptionModeIOS:       1,  // DO_NOT_MIX = 1
});
```

**Por qué:** Sin `iosCategory: 'playAndRecord'`, la sesión iOS usa `SoloAmbient` que no graba en background. Sin `iosMode: 'voiceChat'`, el sistema enruta al altavoz y no aplica echo-cancellation. `interruptionModeIOS: 1` (DO_NOT_MIX) evita que otra app silencia la llamada permanentemente.

#### A-2. Añadir `iosCategory` e `iosMode` en `_applyAudioRoute()`

**Función:** `_applyAudioRoute()` (líneas ~960-975 aprox.)

La ruta cambia solo `playThroughEarpieceAndroid`. Se debe diferenciar:
- Speaker ON → `iosMode: 'spokenAudio'` (audio sale al altavoz frontal con más volumen)
- Speaker OFF → `iosMode: 'voiceChat'` (audio al auricular con echo-cancellation)

**Cambio:**
```ts
// DESPUÉS
private async _applyAudioRoute(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const useEarpiece = !this._isSpeakerOn && !this._isBluetoothOn;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:        true,
      playsInSilentModeIOS:      true,
      staysActiveInBackground:   true,
      shouldDuckAndroid:         false,
      playThroughEarpieceAndroid: useEarpiece,
      iosCategory:               'playAndRecord',
      // voiceChat → auricular+EC, spokenAudio → altavoz
      iosMode:                   useEarpiece ? 'voiceChat' : 'spokenAudio',
      interruptionModeIOS:        1,
    });
  } catch { /* ignorar */ }
}
```

#### A-3. Llamar `_restoreAudioSession()` en `_finalCleanup()`

**Función:** `_finalCleanup()` — añadir al inicio, antes de los timers.

`_restoreAudioSession` es `async`; `_finalCleanup` es síncrono. Lanzarla con `.catch()` sin await es suficiente para no bloquear, igual que se hace en `endCall`.

**Cambio — añadir como primer paso en `_finalCleanup()`:**
```ts
private _finalCleanup(): void {
  // 0. Restaurar AudioSession ANTES de cerrar todo lo demás
  //    (cubre paths que no pasan por endCall: rejectCall, timeout, PC closed)
  this._restoreAudioSession().catch(() => {});

  // 1. Timers (código existente sin cambio)
  this._stopPolling();
  // ...resto sin cambio
```

**Adicionalmente — hacer que `_restoreAudioSession` desactive la sesión iOS:**
```ts
private async _restoreAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:        false,
      playsInSilentModeIOS:      false,   // ← cambiar a false para cerrar sesión
      shouldDuckAndroid:         true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground:   false,
      iosCategory:               'soloAmbient',  // ← categoría normal post-llamada
      iosMode:                   'default',
      interruptionModeIOS:        2,  // DUCK_OTHERS
    });
  } catch { /* ignorar */ }
}
```

#### A-4. Detener ForegroundService Android en `_finalCleanup()`

**Función:** `_finalCleanup()` — añadir junto al paso de restauración de audio.

**Cambio:**
```ts
// En _finalCleanup(), después de _restoreAudioSession()
if (Platform.OS === 'android') {
  try { NativeCallKit.stopCallForegroundService(); } catch { /* */ }
}
```

Esto cubre `rejectCall`, `cancelCall`, timeouts y PC closed.
En `endCall()` ya se llama antes de `_finalCleanup()`, así que la llamada doble es segura porque `stopCallForegroundService` es idempotente (igual que `endCall` y `reject`).

#### A-5. Guardia de track duplicado en `_getUserMedia`

**Función:** `acceptCall()` — antes de llamar `_getUserMedia`.

**Cambio — añadir guardia antes de crear el stream:**
```ts
// En acceptCall(), línea que dice:
//   const stream = await this._getUserMedia(callType);

// Reemplazar por:
let stream: any;
if (
  this._localStream &&
  this._localStream.getTracks?.().some((t: any) => t.readyState === 'live')
) {
  // Stream ya activo y con tracks vivos — reutilizar
  stream = this._localStream;
} else {
  // Limpiar el stream anterior si existe pero sus tracks ya están muertos
  if (this._localStream) {
    try {
      this._localStream.getTracks?.().forEach((t: any) => { t.stop(); t.enabled = false; });
    } catch { /* */ }
    this._localStream = null;
  }
  stream = await this._getUserMedia(callType);
}
this._localStream = stream;
```

La misma guardia aplica en `startCall()` aunque allí se llama `_reset()` antes, por lo que `_localStream` siempre es `null`. Es una protección defensiva.

#### A-6. Re-aplicar `_applyAudioRoute()` al volver de background

**Función:** `_subscribeAppState()` — en el bloque `prev !== 'active' && next === 'active'`.

**Cambio:**
```ts
if (prev !== 'active' && next === 'active') {
  if (this.isActive && this._pc) {
    const ics = this._pc.iceConnectionState;
    if (ics === 'disconnected' || ics === 'failed') {
      this._scheduleIceRestart();
    }
    // ANTES: solo _applyAudioSession
    // DESPUÉS: sesión + ruta para respetar elección del usuario
    this._applyAudioSession().catch(() => {});
    this._applyAudioRoute().catch(() => {});   // ← añadir
  }
}
```

#### A-7. Actualizar `_isSpeakerOn` en `onAudioRouteChanged`

**Función:** handler de `NativeCallKit.onAudioRouteChanged` dentro de `_subscribeAppState()`.

**Cambio — expandir la lógica de actualización:**
```ts
this._audioRouteSub = NativeCallKit.onAudioRouteChanged(
  ({ route, callId }) => {
    if (__DEV__) console.log(`[CallManager] Ruta audio → ${route}`);
    const routeLower = route.toLowerCase();
    const isBT       = routeLower.includes('bluetooth');
    const isSpeaker  = routeLower.includes('speaker');

    let changed = false;
    if (isBT !== this._isBluetoothOn)  { this._isBluetoothOn = isBT;     changed = true; }
    // Si el sistema cambió la ruta a speaker o a earpiece/headphones,
    // sincronizar el flag para que el ícono de la pantalla sea correcto.
    if (!isBT) {
      const shouldBeSpeaker = isSpeaker;
      if (shouldBeSpeaker !== this._isSpeakerOn) {
        this._isSpeakerOn = shouldBeSpeaker;
        changed = true;
      }
    }
    if (changed) this._notify();
  }
);
```

---

### Archivo B: `src/hooks/useWebRTC.ts`

#### B-1. Exportar `isSpeakerOn` y `toggleSpeaker`

**Sección:** mapeo del snapshot + objeto return.

**Cambio — añadir al mapeo:**
```ts
const isSpeakerOn = snapshot.isSpeakerOn;   // ← añadir (snapshot lo tiene)
```

**Cambio — añadir al return:**
```ts
return {
  callState, callType, isMuted, isCamOff, isSignalingOnly,
  isSpeakerOn,                              // ← añadir
  hasNativeMedia: HAS_NATIVE_MEDIA, localStream, remoteStream,
  startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
  switchCamera:    () => callManager.switchCamera(),
  toggleSpeaker:   () => callManager.toggleSpeaker(),   // ← añadir
  toggleBluetooth: () => callManager.toggleBluetooth(),
};
```

Nota: `isSpeakerOn` ya existe en `CallManagerState` (campo del snapshot) porque `_snapshot()` en `CallManager.ts` **no** lo incluye actualmente. Hay que añadirlo también allí.

---

### Archivo C: `src/call/CallManager.ts` — `_snapshot()`

#### C-1. Añadir `isSpeakerOn` al snapshot público

**Función:** `_snapshot()` (líneas ~140-155 aprox.)

**Cambio:**
```ts
private _snapshot(): CallManagerState {
  return {
    commState:       this._commState,
    uiState:         this._uiState,
    session:         this._session,
    localStream:     this._localStream,
    remoteStream:    this._remoteStream,
    isMuted:         this._isMuted,
    isCamOff:        this._isCamOff,
    isSpeakerOn:     this._isSpeakerOn,   // ← añadir (ya existe el campo privado)
    isSignalingOnly: this._isSignalingOnly,
  };
}
```

Y en `src/call/types.ts` (o donde esté `CallManagerState`), añadir el campo:
```ts
isSpeakerOn: boolean;
```

---

### Archivo D: `app/call/[callId].tsx`

#### D-1. Sincronizar `speakerOn` con el estado del manager vía `isSpeakerOn` del hook

El estado local `speakerOn` debe derivarse del hook, no ser independiente.

**Cambio — reemplazar `useState(true)` por derivación del hook:**
```ts
// ANTES
const [speakerOn, setSpeakerOn] = useState(true);

// DESPUÉS — consumir del hook (que a su vez viene del CallManager)
const {
  callState, isMuted, isCamOff, isSignalingOnly,
  isSpeakerOn,          // ← añadir al destructuring
  localStream, remoteStream,
  startCall, answerCall, endCall, toggleMute, toggleCamera,
  toggleSpeaker,        // ← añadir al destructuring
} = useWebRTC();

// Eliminar la línea: const [speakerOn, setSpeakerOn] = useState(true);
// Usar `isSpeakerOn` en lugar de `speakerOn` en todo el JSX.
```

#### D-2. Actualizar `toggleSpeaker` para usar la acción del hook

**Cambio — reemplazar la función local:**
```ts
// ANTES
const toggleSpeaker = useCallback(async () => {
  const next = !speakerOn;
  setSpeakerOn(next);
  await callManager.toggleSpeaker();
}, [speakerOn]);

// DESPUÉS — usar la acción exportada del hook (ya delega al manager)
// No hace falta useCallback extra; toggleSpeaker del hook ya es estable.
// Renombrar para no colisionar con la importación:
const handleToggleSpeaker = useCallback(() => {
  toggleSpeaker();          // viene del hook
}, [toggleSpeaker]);
```

Y en el JSX del botón:
```tsx
// ANTES
<GlassBtn onPress={toggleSpeaker} icon={IC.speaker(speakerOn)} label={speakerOn ? 'Altavoz' : 'Auricular'} active={speakerOn} />

// DESPUÉS
<GlassBtn onPress={handleToggleSpeaker} icon={IC.speaker(isSpeakerOn)} label={isSpeakerOn ? 'Altavoz' : 'Auricular'} active={isSpeakerOn} />
```

---

### Archivo E: `src/call/types.ts` (verificar existencia)

#### E-1. Añadir `isSpeakerOn` a `CallManagerState`

Localizar la interfaz `CallManagerState` y añadir:
```ts
isSpeakerOn: boolean;
```

---

## 4. Orden de implementación

Los cambios tienen estas dependencias:

```
C-1 (snapshot)  →  B-1 (hook export)  →  D-1/D-2 ([callId].tsx)
E-1 (types)     →  C-1
A-1, A-2        →  A-6 (background re-apply usa las nuevas funciones)
A-3             →  A-4 (ambos en _finalCleanup, A-3 va primero)
A-5             →  independiente (solo en acceptCall)
A-7             →  independiente (solo el handler de routeChanged)
```

**Secuencia recomendada:**
1. `E-1` — añadir campo a `CallManagerState` en `types.ts`
2. `C-1` — añadir `isSpeakerOn` al snapshot en `CallManager.ts`
3. `A-1` — añadir `iosCategory`/`iosMode` a `_applyAudioSession`
4. `A-2` — añadir `iosCategory`/`iosMode` a `_applyAudioRoute`
5. `A-3` — llamar `_restoreAudioSession` en `_finalCleanup` + mejorar restore
6. `A-4` — detener ForegroundService Android en `_finalCleanup`
7. `A-5` — guardia de tracks duplicados en `acceptCall`
8. `A-6` — re-aplicar ruta al volver de background
9. `A-7` — actualizar `_isSpeakerOn` en `onAudioRouteChanged`
10. `B-1` — exportar `isSpeakerOn` y `toggleSpeaker` en `useWebRTC`
11. `D-1` + `D-2` — sincronizar UI del altavoz con el hook en `[callId].tsx`

---

## 5. Archivos a modificar

| # | Archivo | Cambios |
|---|---|---|
| 1 | `src/call/types.ts` | Añadir `isSpeakerOn: boolean` a `CallManagerState` |
| 2 | `src/call/CallManager.ts` | `_snapshot`, `_applyAudioSession`, `_applyAudioRoute`, `_restoreAudioSession`, `_finalCleanup`, `_subscribeAppState` (background + routeChanged), `acceptCall` (guardia) |
| 3 | `src/hooks/useWebRTC.ts` | Añadir `isSpeakerOn` al mapeo y al return; añadir `toggleSpeaker` al return |
| 4 | `app/call/[callId].tsx` | Reemplazar `[speakerOn, setSpeakerOn]` por `isSpeakerOn` del hook; actualizar `toggleSpeaker`; actualizar ref en JSX |

**No se tocan:** `CallKit.ts`, `callSupabase.ts`, ni ningún archivo nativo iOS/Android (los cambios de `iosCategory`/`iosMode` se pasan a expo-av desde JS).

---

## 6. Notas de comportamiento por plataforma

**iOS:**
- `iosCategory: 'playAndRecord'` + `iosMode: 'voiceChat'` es la combinación probada para llamadas; equivale a `AVAudioSession.Category.playAndRecord` + `AVAudioSession.Mode.voiceChat`.
- Bluetooth en iOS no se puede forzar a un dispositivo específico desde JS (limitación de AVAudioSession); el sistema elige el input BT prioritario. `onAudioRouteChanged` refleja ese cambio.
- `interruptionModeIOS: 1` (DO_NOT_MIX) es apropiado para llamadas: no mezcla con música del sistema y toma foco completo.

**Android:**
- `playThroughEarpieceAndroid: true` enruta al auricular telefónico (earpiece). `false` enruta al altavoz principal.
- BT en Android requiere `AudioManager.startBluetoothSco()` desde código nativo; expo-av no lo expone. Si se necesita BT real en Android, se implementa en `EGChatCallModule.java`.
- `shouldDuckAndroid: false` es correcto para llamadas (no queremos duck, queremos prioridad total).
- El ForegroundService debe detenerse en **todos** los paths de terminación, no solo en `endCall()`.

---

## 7. Pruebas en dispositivo físico

Después de implementar, verificar manualmente:

| Escenario | iOS | Android |
|---|---|---|
| Llamada activa → auricular | Audio en auricular, sin eco | Audio en earpiece |
| Tap altavoz → ON | Audio sale al altavoz, ícono actualiza | Audio al altavoz |
| Tap altavoz → OFF | Vuelve a auricular, ícono actualiza | Vuelve a earpiece |
| Conectar AirPods/BT | Ícono BT actualiza automáticamente | (nativo) |
| Bloquear pantalla durante llamada | Audio continúa, micrófono activo | Audio continúa |
| Volver de background | Ruta de audio preservada | Ruta preservada |
| Llamada telefónica entra | Audio pausa, al colgar reanuda | Audio pausa, reanuda |
| Colgar en cualquier estado | ForegroundService detenido (Android) | ForegroundService detenido |
| Doble-tap "Aceptar" | Un solo MediaStream activo | Un solo MediaStream |
| Rechazar llamada | AudioSession restaurada (verificar mic desactivado) | AudioSession restaurada |
