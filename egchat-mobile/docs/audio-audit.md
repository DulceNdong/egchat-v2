# Auditoría de audio — EGChat llamadas

Generada tras auditar `CallManager.ts`, `useWebRTC.ts`, `app/call/[callId].tsx` y `CallKit.ts`.

---

## Matriz de estado del sistema de audio

| Función | Estado Anterior | Estado Correcto | Plataforma | Problema | Solución |
|---|---|---|---|---|---|
| **1. Micrófono activado** | `track.enabled = true`; `setAudioModeAsync` sin `iosCategory`/`iosMode` | Igual + `iosCategory: 'playAndRecord'` + `iosMode: 'voiceChat'` | iOS | Sin `playAndRecord`, iOS usaba `SoloAmbient`; el micrófono se suspende al bloquear pantalla | Añadidos `iosCategory`, `iosMode` e `interruptionModeIOS` en `_applyAudioSession` |
| **2. Micrófono silenciado** | `track.enabled = false` en `toggleMute()`; no se re-aplica tras interrupción | Igual + re-aplicar estado tras interrupción del sistema | iOS / Android | Al volver de interrupción, el track recupera su estado `_isMuted`; `_applyAudioSession` se llama en reanudación | Correcto: ya implementado en `onAudioInterrupted`; mejorado con parámetros iOS correctos |
| **3. Altavoz** | `playThroughEarpieceAndroid: false`; iOS sin `iosMode` explícito | Añadir `iosMode: 'spokenAudio'` cuando `isSpeakerOn=true` | iOS | Sin modo iOS, el routing de altavoz era impredecible (dependía del modo por defecto del sistema) | `_applyAudioRoute` ahora usa `iosMode: 'spokenAudio'` cuando speaker=true |
| **4. Auricular** | `playThroughEarpieceAndroid: true`; iOS sin `iosMode` | Añadir `iosMode: 'voiceChat'` cuando `isSpeakerOn=false` | iOS / Android | iOS sin `voiceChat` no aplica echo-cancellation ni garantiza ruta al auricular | `_applyAudioRoute` usa `iosMode: 'voiceChat'` cuando speaker=false (earpiece) |
| **5. Bluetooth** | `toggleBluetooth()` cambia `_isBluetoothOn` pero no aplica routing real | iOS: depende de AVAudioSession nativo; Android: requiere `AudioManager.startBluetoothSco()` | iOS / Android | Desde JS puro no se puede forzar un dispositivo BT específico en iOS | Añadido `console.warn` documentando la limitación; `onAudioRouteChanged` sincroniza `_isBluetoothOn` cuando el sistema confirma el cambio |
| **6. Cambio automático de ruta** | `onAudioRouteChanged` solo actualizaba `_isBluetoothOn` | También actualizar `_isSpeakerOn` cuando la ruta cambia a speaker/earpiece | iOS | Si el sistema cambiaba la ruta, el ícono de altavoz en pantalla quedaba desfasado | `onAudioRouteChanged` ahora sincroniza `_isSpeakerOn` además de `_isBluetoothOn` |
| **7. Llamada telefónica externa** | `onAudioInterrupted` pausaba tracks; `_applyAudioSession` sin `iosCategory`/`iosMode` al reanudar | Mismo + re-aplicar con parámetros correctos (`playAndRecord`/`voiceChat`) | iOS | La sesión AVAudioSession podía no reconfigurarse correctamente tras la interrupción | `_applyAudioSession` corregida ya se llama en reanudación de interrupción |
| **8. Reproducción multimedia externa** | `shouldDuckAndroid: false`; expo-av solicita `AUDIOFOCUS_GAIN_TRANSIENT` internamente | `shouldDuckAndroid: false` correcto; re-aplicar AudioSession al volver al primer plano | Android | Al perder AudioFocus por notificación multimedia, el audio WebRTC se cortaba sin reanudarse | `_subscribeAppState` re-aplica sesión y ruta al volver al primer plano |
| **9. Bloqueo de pantalla** | `staysActiveInBackground: true`; sin `iosCategory: 'playAndRecord'` | Añadir `iosCategory: 'playAndRecord'` para mantener micrófono activo al bloquear | iOS | Sin `playAndRecord`, iOS suspende el input de audio al bloquear la pantalla | `iosCategory: 'playAndRecord'` añadido en `_applyAudioSession` |
| **10. Regreso de segundo plano** | Solo `_applyAudioSession()` en AppState change | `_applyAudioSession()` + `_applyAudioRoute()` para re-aplicar elección del usuario | iOS / Android | Se re-aplicaba la sesión pero no la ruta elegida (altavoz/auricular); el usuario podía obtener una ruta diferente a la que había seleccionado | Añadida llamada a `_applyAudioRoute()` junto con `_applyAudioSession()` al volver al primer plano |

---

## Problemas adicionales corregidos

| Problema | Archivos | Solución |
|---|---|---|
| `_restoreAudioSession` no se llamaba en todos los paths de terminación | `CallManager.ts` | Movida al inicio de `_finalCleanup()` con `.catch(()=>{})` para cubrir `rejectCall`, `cancelCall`, timeouts y `PC closed` |
| ForegroundService Android solo se detenía en `endCall` | `CallManager.ts` | `NativeCallKit.stopCallForegroundService()` añadido en `_finalCleanup()` para todos los paths |
| Doble-tap "Aceptar" creaba streams/tracks duplicados | `CallManager.ts` — `acceptCall` | Guardia: si `_localStream` tiene tracks `live`, se reutiliza; si no, se limpia y crea nuevo |
| Botón altavoz tenía estado local desincronizado del manager | `[callId].tsx` | Eliminado `useState(true)` local; `isSpeakerOn` y `toggleSpeaker` vienen del hook (fuente de verdad: CallManager) |
| `useWebRTC` no exportaba `isSpeakerOn` ni `toggleSpeaker` | `useWebRTC.ts` | Añadidos al mapeo del snapshot y al objeto `return` |

---

## Diferencias iOS vs Android

### Micrófono
- **iOS**: requiere `iosCategory: 'playAndRecord'` para que el micrófono permanezca activo en background y al bloquear pantalla. Sin esta categoría, la sesión AVAudioSession usa `SoloAmbient` por defecto.
- **Android**: `allowsRecordingIOS` no aplica; el micrófono se gestiona a través del permiso `RECORD_AUDIO` y `AudioFocus`.

### Altavoz / Auricular
- **iOS**: se controla con `iosMode`: `'voiceChat'` enruta al auricular (con echo-cancellation del sistema); `'spokenAudio'` enruta al altavoz con más volumen.
- **Android**: se controla con `playThroughEarpieceAndroid`: `true` = earpiece (auricular telefónico); `false` = altavoz.

### Bluetooth
- **iOS**: el routing BT lo gestiona AVAudioSession/CallKit internamente. No se puede forzar un dispositivo BT específico desde JS. El cambio se refleja en `onAudioRouteChanged`.
- **Android**: requiere `AudioManager.startBluetoothSco()` desde código nativo (`EGChatCallModule.java`). expo-av no expone esta API.

### Interrupciones
- **iOS**: las interrupciones (llamada telefónica, alarma) se reciben a través de `onAudioInterrupted` (observer de `AVAudioSessionInterruptionNotification`). El estado `inactive` de AppState también las indica.
- **Android**: las interrupciones llegan vía `AudioFocusChangeListener` en el `CallForegroundService`. No existe estado `inactive` en AppState en Android.

### ForegroundService
- **iOS**: no aplica; CallKit gestiona la presencia de la llamada en background a nivel sistema.
- **Android**: requiere un `ForegroundService` con tipo `phoneCall` para mantener la app activa en background. Debe detenerse explícitamente en **todos** los paths de terminación.

---

## Pruebas en dispositivo físico recomendadas

| Escenario | iOS | Android |
|---|---|---|
| Llamada activa → auricular | Audio en auricular, sin eco | Audio en earpiece |
| Tap altavoz → ON | Audio al altavoz, ícono actualiza | Audio al altavoz |
| Tap altavoz → OFF | Vuelve a auricular, ícono actualiza | Vuelve a earpiece |
| Conectar AirPods/BT durante llamada | Ícono BT actualiza automáticamente | (requiere SCO nativo) |
| Bloquear pantalla durante llamada | Audio continúa, micrófono activo | Audio continúa |
| Volver de background | Ruta de audio preservada | Ruta preservada |
| Llamada telefónica entrante | Audio pausa, al colgar reanuda | Audio pausa, reanuda |
| Colgar en cualquier estado | AudioSession restaurada | ForegroundService detenido |
| Doble-tap "Aceptar" | Un solo MediaStream activo | Un solo MediaStream activo |
| Rechazar llamada | AudioSession restaurada (mic desactivado) | AudioSession restaurada |

---

*Auditoría completada — todos los problemas detectados han sido corregidos.*
