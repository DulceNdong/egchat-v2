# Implementation Plan: EGChat Mobile — Paridad Funcional

## Overview

Plan de implementación incremental para cerrar las 9 brechas de paridad funcional de la app nativa EGChat (`egchat-mobile/`) respecto a la versión web de referencia. Las tareas están ordenadas por prioridad: LIA-25, Stories, ImageViewer, Video Calls, Ocio, CEMAC, Apuestas, MiTaxi y ServiciosDiarios. Cada brecha finaliza con la verificación de código mediante kluster_code_review_auto. Todo el trabajo se limita a `egchat-mobile/`.

---

## Tasks

- [ ] 1. LIA-25 — Asistente de IA en el Chat
  - [ ] 1.1 Crear `src/hooks/useLIA.ts` con lógica de conversación
    - Implementar interfaz `LIAMessage { role, content, timestamp }`
    - Crear store de sesión a nivel de módulo (`liaSessionHistory`) para persistir entre montajes
    - Implementar función `send(text)`: añadir mensaje usuario → llamar `liaAPI.chat(text, history)` → añadir respuesta → manejar error con `setError`
    - Gestionar estados `isLoading` y `error`
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7_
  - [ ]* 1.2 Escribir property test — Property 1: ningún mensaje expone API key
    - **Property 1: LIA — ningún mensaje expone clave de API**
    - Verificar que la petición construida por `liaAPI.chat` no incluye `api_key`, `apiKey` ni `Authorization` con clave en texto plano
    - **Validates: Requirements 1.2**
  - [ ]* 1.3 Escribir property test — Property 2: historial crece monotónicamente
    - **Property 2: LIA — el historial crece monotónicamente**
    - Para N mensajes enviados, `history.length === 2 * N` (pares user/assistant)
    - **Validates: Requirements 1.6**
  - [ ]* 1.4 Escribir property test — Property 3: errores producen mensaje no vacío y acción de reintento
    - **Property 3: LIA — errores siempre producen mensaje no vacío y acción de reintento**
    - Para cualquier error HTTP 4xx/5xx o AbortError, `error` es string no vacío y el componente renderiza elemento de reintento
    - **Validates: Requirements 1.5**
  - [ ] 1.5 Crear `src/components/LIAScreen.tsx` — Modal fullscreen de conversación
    - Header con título "LIA-25" y botón cerrar
    - FlatList con historial de mensajes usando burbujas user/assistant
    - `ActivityIndicator` visible mientras `isLoading === true`
    - `ErrorBanner` con botón "Reintentar" cuando `error !== null`
    - `InputBar` con `TextInput` y botón enviar; deshabilitar durante carga
    - Aplicar patrón `useThemeContext` / `DarkColors` y `LinearGradient` en header
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7_
  - [ ] 1.6 Añadir punto de entrada LIA-25 en `app/(tabs)/index.tsx`
    - Añadir botón o tab visible desde la pantalla principal de chats que setea `showLIA(true)`
    - Renderizar `<LIAScreen visible={showLIA} onClose={() => setShowLIA(false)} />`
    - _Requirements: 1.1_
  - [ ]* 1.7 Escribir tests de ejemplo para LIAScreen
    - Test: indicador de carga aparece al enviar mensaje
    - Test: respuesta del backend se muestra en la lista
    - Test: error del backend muestra banner con botón reintentar
    - Test: historial persiste al cerrar y reabrir en la misma sesión
    - _Requirements: 1.3, 1.4, 1.5, 1.7_
  - [ ] 1.8 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos LIA-25
    - Archivos: `src/hooks/useLIA.ts`, `src/components/LIAScreen.tsx`, `app/(tabs)/index.tsx`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 2. Stories — Subida de historias y visor funcional
  - [ ] 2.1 Completar lógica de subida en `app/stories.tsx`
    - Implementar `uploadStory(uri)`: llamar `storiesAPI.create()` → `loadStories()` al completar
    - Mostrar `ActivityIndicator` en avatar propio mientras `uploading === true`
    - Si la subida falla, mostrar `Alert.alert` con mensaje del backend y no añadir al listado
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 2.2 Escribir property test — Property 4: subida exitosa actualiza el listado
    - **Property 4: Stories — subida exitosa actualiza el listado**
    - Después de `storiesAPI.create` exitoso y `loadStories()`, `stories.length > prevLength`
    - **Validates: Requirements 2.1**
  - [ ]* 2.3 Escribir property test — Property 5: error de subida no modifica el listado
    - **Property 5: Stories — error de subida no modifica el listado**
    - Para cualquier error de `storiesAPI.create`, `stories.length === prevLength`
    - **Validates: Requirements 2.3**
  - [ ] 2.4 Implementar `StoryViewer` dentro de `app/stories.tsx`
    - Modal fullscreen con `Animated.Value` para barra de progreso de 5000 ms
    - `startProgress()` → `Animated.timing(5000ms)` → `goNext()`
    - Zonas táctiles: izquierdo 1/3 = `goPrev()`, derecho 2/3 = `goNext()`
    - `goNext()` avanza historia o grupo; si es la última, cierra el visor
    - `goPrev()` retrocede historia o grupo anterior
    - Llamar `storiesAPI.registerView(storyId)` al abrir cada grupo
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8_
  - [ ]* 2.5 Escribir property test — Property 6: avance automático tras 5000 ms
    - **Property 6: StoryViewer — avance automático tras 5000 ms**
    - Para cualquier grupo con ≥1 historia, `storyIdx` avanza en 1 tras `STORY_DURATION` sin interacción
    - **Validates: Requirements 2.5**
  - [ ]* 2.6 Escribir property test — Property 7: navegación táctil mantiene índice en rango válido
    - **Property 7: StoryViewer — navegación táctil mantiene índice en rango válido**
    - Toque izquierdo: `storyIdx' >= 0`; toque derecho: `storyIdx' <= group.stories.length - 1`
    - **Validates: Requirements 2.6, 2.7**
  - [ ]* 2.7 Escribir property test — Property 8: registerView se llama para cada historia visualizada
    - **Property 8: StoryViewer — registerView se invoca exactamente una vez al abrir cada grupo**
    - Para cualquier historia con `storyId` no nulo, `storiesAPI.registerView(storyId)` se llama exactamente 1 vez
    - **Validates: Requirements 2.8**
  - [ ] 2.8 Implementar clasificación de tabs Recientes/Vistos y acción Eliminar
    - Filtrar `recentGroups = groups.filter(g => !g.seen)` y `seenGroups = groups.filter(g => g.seen)`
    - Actualizar clasificación al cerrar `StoryViewer` mediante `markViewed`
    - Implementar `deleteStory(id)`: llamar `storiesAPI.delete()` → `loadStories()`
    - _Requirements: 2.9, 2.10_
  - [ ]* 2.9 Escribir property test — Property 9: clasificación Recientes/Vistos exhaustiva y mutuamente excluyente
    - **Property 9: Stories — clasificación es exhaustiva y mutuamente excluyente**
    - `recentGroups ∪ seenGroups === allGroups` e `recentGroups ∩ seenGroups === ∅`
    - **Validates: Requirements 2.10**
  - [ ]* 2.10 Escribir tests de ejemplo para Stories
    - Test: subida muestra ActivityIndicator
    - Test: eliminar estado actualiza listado
    - Test: tabs Recientes y Vistos se actualizan al cerrar StoryViewer
    - _Requirements: 2.2, 2.9, 2.10_
  - [ ] 2.11 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos Stories
    - Archivos: `app/stories.tsx`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 3. ImageViewer — Visualización de imágenes del chat
  - [ ] 3.1 Crear `src/components/ImageViewer.tsx`
    - Props: `{ visible, images: string[], initialIndex?, onClose }`
    - Modal nativo con `statusBarTranslucent`
    - `FlatList` horizontal con `pagingEnabled` — una imagen por página
    - `PinchGestureHandler` de `react-native-gesture-handler` con escala en `[1, 4]`
    - `PanResponder` overlay: si `dy > 80`, cerrar con `Animated.timing` de opacidad → `onClose()`
    - Botón de cierre accesible en esquina superior derecha (posición absoluta)
    - Estado `hasError` por imagen con mensaje de error y botón "Reintentar"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [ ]* 3.2 Escribir property test — Property 10: escala siempre en [1, 4]
    - **Property 10: ImageViewer — escala siempre en [1, 4]**
    - Para cualquier gesto pinch con factor S, escala aplicada = `clamp(S, 1, 4)`
    - **Validates: Requirements 3.2**
  - [ ]* 3.3 Escribir property test — Property 11: swipe vertical > 80 px siempre cierra
    - **Property 11: ImageViewer — swipe vertical > 80 px siempre cierra el visor**
    - Para cualquier `dy > 80`, `visible` pasa a `false`
    - **Validates: Requirements 3.3**
  - [ ]* 3.4 Escribir property test — Property 12: navegación horizontal mantiene índice en rango
    - **Property 12: ImageViewer — índice activo siempre en [0, N-1]**
    - Para array de N imágenes, tras swipe horizontal el índice permanece en `[0, N-1]`
    - **Validates: Requirements 3.6**
  - [ ] 3.5 Conectar `ImageViewer` en `src/components/chat/ChatMessageBubble.tsx`
    - Añadir handler `onOpenImage(images, index)` al pulsar una imagen del mensaje
    - Renderizar `<ImageViewer>` con estado local `imageViewerState`
    - _Requirements: 3.1_
  - [ ]* 3.6 Escribir tests de ejemplo para ImageViewer
    - Test: modal visible al pulsar imagen en ChatMessageBubble
    - Test: botón cerrar llama a onClose
    - Test: error de carga muestra mensaje y botón retry
    - _Requirements: 3.1, 3.4, 3.5_
  - [ ] 3.7 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos ImageViewer
    - Archivos: `src/components/ImageViewer.tsx`, `src/components/chat/ChatMessageBubble.tsx`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 4. Video Calls — WebRTC nativo completo
  - [ ] 4.1 Implementar solicitud de permisos de cámara/micrófono en `app/call/[callId].tsx`
    - Usar `PermissionsAndroid` (Android) y `expo-camera`/`expo-av` (iOS) — sin nuevas dependencias
    - Si permiso denegado: `Alert.alert` con opción de abrir ajustes del sistema
    - Solicitar permisos antes de acceder a `getUserMedia`
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 4.2 Verificar y completar layout PiP y streams en `app/call/[callId].tsx`
    - Stream remoto a pantalla completa con `RTCView`
    - Stream local PiP: `position: 'absolute', right: 16, top: insets.top + 80, width: 90, height: 120`
    - Placeholder (avatar + iniciales) mientras stream remoto no disponible
    - Verificar que `HAS_NATIVE_MEDIA` activa WebRTC nativo, no solo señalización
    - _Requirements: 4.1, 4.4, 4.5_
  - [ ]* 4.3 Escribir property test — Property 13: mute toggle es idempotente en track de audio
    - **Property 13: VideoCall — mute toggle es idempotente en el track de audio**
    - Tras `toggleMute()`, `isMuted === !isMuted₀` y `audioTrack.enabled === !isMuted₀`
    - **Validates: Requirements 4.6**
  - [ ]* 4.4 Escribir property test — Property 14: camera toggle es idempotente en track de video
    - **Property 14: VideoCall — camera toggle es idempotente en el track de video**
    - Tras `toggleCamera()`, `isCamOff === !isCamOff₀` y `videoTrack.enabled === !isCamOff₀`
    - **Validates: Requirements 4.7**
  - [ ]* 4.5 Escribir property test — Property 15: colgar libera todos los tracks
    - **Property 15: VideoCall — colgar libera todos los tracks**
    - Tras `endCall()`, todos los `MediaStreamTrack` de `localStream` tienen `enabled = false` y `callState === 'ended'`
    - **Validates: Requirements 4.12**
  - [ ] 4.6 Completar controles de UI (silenciar, cámara, colgar) y contador de duración
    - Botón silenciar: toggle `audioTrack.enabled` + icono con tachado
    - Botón cámara: toggle `videoTrack.enabled` + icono con cámara desactivada
    - Botón colgar: llamar `callAPI.end` → liberar streams → `router.back()`
    - Iniciar contador de duración cuando `connectionState === 'connected'`
    - _Requirements: 4.6, 4.7, 4.10, 4.12_
  - [ ] 4.7 Completar envío de candidatos ICE y manejo de estado `failed`/`closed`
    - En `onicecandidate`: llamar `callAPI.ice(candidate)` de forma no bloqueante
    - En `connectionState === 'failed' | 'closed'`: `endCallInternal()` → `router.back()`
    - _Requirements: 4.11, 4.13_
  - [ ] 4.8 Verificar `IncomingCallModal` en `app/_layout.tsx`
    - Confirmar que polling detecta llamada entrante y muestra botones aceptar/rechazar
    - Aceptar: `router.push('/call/[callId]')` + ejecutar `answerCall(offer, type)`
    - _Requirements: 4.8, 4.9_
  - [ ]* 4.9 Escribir tests de ejemplo para VideoCallScreen
    - Test: permisos denegados muestran alerta con enlace a ajustes
    - Test: PiP en dimensiones 90×120 en esquina superior derecha
    - Test: IncomingCallModal aparece sobre pantalla activa
    - _Requirements: 4.2, 4.3, 4.4, 4.8_
  - [ ] 4.10 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos Video Calls
    - Archivos: `app/call/[callId].tsx`, `src/hooks/useWebRTC.ts`, `app/_layout.tsx`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 5. Ocio — Datos reales y acceso a llamadas
  - [ ] 5.1 Verificar y completar `app/ocio.tsx`
    - Confirmar 4 categorías con icono y conteo `cat.items.length`
    - Verificar navegación interna por estado `selected` sin recargar pantalla
    - Verificar que botón de llamada se muestra solo si `item.phone !== ''`
    - Verificar que `Linking.openURL('tel:' + item.phone)` se invoca correctamente
    - Aplicar `useThemeContext` / `DarkColors` en todas las vistas
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.2 Escribir property test — Property 16: llamada telefónica invoca Linking con formato tel:
    - **Property 16: Ocio — llamada telefónica invoca Linking con formato tel:**
    - Para cualquier establecimiento con `phone !== ''`, pulsar llamada invoca `Linking.openURL('tel:' + phone)`
    - **Validates: Requirements 5.4**
  - [ ]* 5.3 Escribir tests de ejemplo para OcioScreen
    - Test: 4 categorías visibles con conteo correcto
    - Test: botón de llamada oculto cuando `phone === ''`
    - _Requirements: 5.1, 5.5_
  - [ ] 5.4 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos Ocio
    - Archivos: `app/ocio.tsx`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 6. CEMAC — Transferencias y tipos de cambio
  - [ ] 6.1 Verificar y completar pestañas de país en `app/cemac.tsx`
    - Confirmar 6 países CEMAC con pestañas: Servicios, Ocio, Cajeros, Cuenta, Noticias, Cambio
    - Implementar pestaña Cuenta: llamar `walletAPI.getBalance()` → mostrar saldo en XAF
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 6.2 Implementar formulario de transferencia CEMAC
    - Validar: `name.trim() && account.trim() && amount > 0 && amount <= balance`
    - Si inválido: `toast.error` + no enviar petición
    - Si válido: `cemacAPI.createTransfer(data)` → éxito: `toast.success` + cerrar modal + recargar balance
    - Si error del backend: `toast.error` sin cerrar modal
    - _Requirements: 6.4, 6.5, 6.6_
  - [ ]* 6.3 Escribir property test — Property 17: conversión de divisas es matemáticamente correcta
    - **Property 17: CEMAC — conversión de divisas es matemáticamente correcta**
    - Para `n > 0` y par `(fromCur, toCur)` distintos, resultado = `n * RATES[toCur] / RATES[fromCur]`
    - **Validates: Requirements 6.7**
  - [ ]* 6.4 Escribir property test — Property 18: transferencia con saldo insuficiente no llama al backend
    - **Property 18: CEMAC — transferencia con saldo insuficiente o formulario incompleto no llama al backend**
    - Si `amount > balance` o campos vacíos, `cemacAPI.createTransfer` no se invoca
    - **Validates: Requirements 6.6**
  - [ ] 6.5 Verificar pestaña Cambio: cálculo local con `RATES` sin llamada backend
    - Confirmar cálculo: `convertResult = useMemo(() => n * RATES[toCur] / RATES[fromCur], [amt, fromCur, toCur])`
    - _Requirements: 6.7_
  - [ ] 6.6 Verificar multi-idioma con objeto `T[lang]` de `cemacData.ts`
    - Confirmar que todos los textos de UI usan `t.fieldName`, no literales
    - _Requirements: 6.8_
  - [ ]* 6.7 Escribir tests de ejemplo para CEMACScreen
    - Test: saldo se carga al abrir pestaña Cuenta
    - Test: transferencia con `amount > balance` muestra toast.error
    - Test: conversión de divisas muestra resultado correcto sin backend
    - _Requirements: 6.3, 6.6, 6.7_
  - [ ] 6.8 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos CEMAC
    - Archivos: `app/cemac.tsx`, `src/data/cemacData.ts`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 7. Apuestas — Cupón de apuestas y walletAPI integrado
  - [ ] 7.1 Verificar y completar cabecera con saldo en `app/apuestas.tsx`
    - Al abrir: llamar `walletAPI.getBalance()` → mostrar saldo en XAF en header
    - Mostrar aviso legal de juego responsable en todas las vistas
    - _Requirements: 7.1, 7.2_
  - [ ] 7.2 Implementar cupón de apuestas con cálculo en tiempo real
    - Al seleccionar cuota: añadir selección al cupón + mostrar FAB con conteo y total
    - `totalPayout = betSlip.reduce((s, b) => s + Math.floor((parseInt(b.stake) || 0) * b.odds), 0)`
    - Mostrar ganancia potencial actualizada en cada keystroke de stake
    - _Requirements: 7.3, 7.4_
  - [ ]* 7.3 Escribir property test — Property 19: ganancia potencial es suma de productos importe×cuota
    - **Property 19: Apuestas — ganancia potencial total es ∑ floor(stake_i × odds_i)**
    - Para cualquier cupón con N selecciones, `totalPayout === ∑ Math.floor(stake_i * odds_i)`
    - **Validates: Requirements 7.4**
  - [ ] 7.4 Implementar validación de saldo y procesamiento de apuesta
    - Si `totalStake <= 0 || totalStake > balance`: `Alert.alert` + no ejecutar simulación
    - Si válido: simular resultado → `setBalance` → `toast.success/error`
    - _Requirements: 7.5, 7.6_
  - [ ]* 7.5 Escribir property test — Property 20: apuesta con totalStake > saldo no modifica el saldo
    - **Property 20: Apuestas — apuesta con totalStake > saldo no modifica el saldo**
    - Si `totalStake > balance || totalStake <= 0`, `balance` no cambia y simulación no se ejecuta
    - **Validates: Requirements 7.6**
  - [ ] 7.6 Implementar flujos Casino y Lotería
    - Casino: validar `amount >= minBet && amount <= balance` → random multiplier → `setBalance` + resultado
    - Lotería: verificar `price <= balance` → random prize → `setBalance` + `toast`
    - Navegación hacia atrás al hub de operadores sin pérdida de saldo
    - _Requirements: 7.7, 7.8, 7.9_
  - [ ]* 7.7 Escribir tests de ejemplo para ApuestasScreen
    - Test: FAB aparece al seleccionar primera cuota
    - Test: casino con importe > saldo muestra Alert
    - Test: lotería muestra resultado tras ejecutar sorteo
    - _Requirements: 7.3, 7.7, 7.8_
  - [ ] 7.8 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos Apuestas
    - Archivos: `app/apuestas.tsx`, `src/data/apuestasData.ts`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 8. MiTaxi — Solicitud de viaje con GPS y mapa en tiempo real
  - [ ] 8.1 Implementar solicitud de permisos GPS y posición inicial en `app/mitaxi.tsx`
    - `Location.requestForegroundPermissionsAsync()` al montar la pantalla
    - Si concedido: `Location.getCurrentPositionAsync()` → centrar mapa en posición usuario
    - Si denegado: usar `MALABO_CENTER` como coordenadas por defecto
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 8.2 Implementar autocomplete de lugares con debounce de 350 ms
    - `useEffect` con `setTimeout(350)` filtrando `MITAXI_PLACE_NAMES` (case-insensitive, máx 6)
    - Al seleccionar: `findPlaceCoords(name)` o geocodificación con Expo Location → actualizar marcador
    - _Requirements: 8.4, 8.5_
  - [ ]* 8.3 Escribir property test — Property 21: sugerencias son subconjunto filtrado de MITAXI_PLACE_NAMES
    - **Property 21: MiTaxi — sugerencias son subconjunto filtrado de MITAXI_PLACE_NAMES**
    - Para cualquier query `q`, `suggestions ⊆ MITAXI_PLACE_NAMES` donde cada elemento contiene `q` (case-insensitive), `suggestions.length <= 6`
    - **Validates: Requirements 8.4**
  - [ ] 8.4 Implementar solicitud de viaje y validación de saldo
    - Si `balance < selected.price`: `Alert.alert('Saldo insuficiente')` + no llamar `taxiAPI.requestRide`
    - Si saldo suficiente: `taxiAPI.requestRide(vehicleType)` → mostrar datos del conductor + animar marcador
    - _Requirements: 8.6, 8.7, 8.8_
  - [ ]* 8.4b Escribir property test — Property 22: precio > saldo impide solicitar viaje
    - **Property 22: MiTaxi — precio de vehículo > saldo impide solicitar viaje**
    - Para cualquier vehículo con `v.price > balance`, no se invoca `taxiAPI.requestRide`
    - **Validates: Requirements 8.8**
  - [ ] 8.5 Implementar estados de viaje, valoración y cancelación
    - "Iniciar viaje" → estado `riding` + actualizar UI
    - Al finalizar: pantalla de valoración (5 estrellas) → `taxiAPI.rateDriver(score)`
    - Cancelar: si `rideId` activo → `taxiAPI.cancelRide()` → volver al formulario
    - _Requirements: 8.9, 8.10, 8.11_
  - [ ] 8.6 Implementar watch GPS en tiempo real con distanceInterval=25m
    - `Location.watchPositionAsync({ distanceInterval: 25 }, update => applyUserCoords(...))`
    - Guardar referencia en `gpsWatchRef` para limpiar al desmontar
    - _Requirements: 8.12_
  - [ ]* 8.7 Escribir tests de ejemplo para MiTaxiScreen
    - Test: permiso denegado → mapa centrado en MALABO_CENTER
    - Test: datos del conductor aparecen tras requestRide exitoso
    - Test: cancelar con rideId llama taxiAPI.cancelRide
    - _Requirements: 8.3, 8.7, 8.11_
  - [ ] 8.8 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos MiTaxi
    - Archivos: `app/mitaxi.tsx`, `src/components/mitaxi/MiTaxiMap.tsx`, `src/data/mitaxiPlaces.ts`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 9. ServiciosDiarios — Servicios de utilidad con contacto directo
  - [ ] 9.1 Verificar y completar `app/servicios-diarios.tsx`
    - Confirmar 3 pestañas: Restaurantes, Vuelos, Gasolineras — cambio sin recargar pantalla
    - Confirmar que cada establecimiento muestra: nombre, descripción, precio orientativo, botón llamada
    - Verificar `Linking.openURL('tel:' + item.phone)` al pulsar botón de llamada
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ] 9.2 Verificar resaltado de tab activa con Colors.accent
    - Confirmar `tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent }`
    - Confirmar `tabTextActive: { color: Colors.accent }`
    - Aplicar `useThemeContext` / `DarkColors`
    - _Requirements: 9.5, 9.6_
  - [ ]* 9.3 Escribir property test — Property 16 (ServiciosDiarios): llamada invoca Linking con formato tel:
    - **Property 16: ServiciosDiarios — llamada telefónica invoca Linking con formato tel:**
    - Para cualquier establecimiento con `phone !== ''`, pulsar llamada invoca `Linking.openURL('tel:' + phone)`
    - **Validates: Requirements 9.4**
  - [ ]* 9.4 Escribir property test — Property 23: tab activa siempre resaltada con Colors.accent
    - **Property 23: ServiciosDiarios — tab activa siempre resaltada con Colors.accent**
    - Para cualquier tab seleccionada, su indicador usa `Colors.accent`; ninguna otra tab usa ese color en su indicador
    - **Validates: Requirements 9.6**
  - [ ]* 9.5 Escribir tests de ejemplo para ServiciosDiariosScreen
    - Test: las 3 pestañas renderizan su lista correctamente
    - Test: botón llamada invoca Linking con número correcto
    - _Requirements: 9.1, 9.4_
  - [ ] 9.6 Checkpoint — Ejecutar kluster_code_review_auto sobre archivos ServiciosDiarios
    - Archivos: `app/servicios-diarios.tsx`, `src/data/serviciosDiarios.ts`
    - Asegurarse de que todos los tests pasan. Preguntar al usuario si surgen dudas.

- [ ] 10. Revisión final de código con kluster
  - [ ] 10.1 Ejecutar kluster_code_review_auto sobre todos los archivos nuevos y modificados
    - Archivos nuevos: `src/hooks/useLIA.ts`, `src/components/LIAScreen.tsx`, `src/components/ImageViewer.tsx`
    - Archivos modificados: `app/(tabs)/index.tsx`, `src/components/chat/ChatMessageBubble.tsx`, `app/stories.tsx`, `app/call/[callId].tsx`, `src/hooks/useWebRTC.ts`, `app/_layout.tsx`, `app/ocio.tsx`, `app/cemac.tsx`, `app/apuestas.tsx`, `app/mitaxi.tsx`, `app/servicios-diarios.tsx`
    - Todos los archivos dentro de `egchat-mobile/` — no modificar nada fuera de esta carpeta
    - Resolver todos los `agent_todo_list` devueltos por kluster antes de cerrar esta tarea
    - _Requirements: 10.1, 10.6_
  - [ ] 10.2 Verificar restricciones transversales finales
    - Confirmar que no se han creado clientes HTTP alternativos (todo usa `src/api.ts`)
    - Confirmar que toda navegación usa Expo Router
    - Confirmar que todos los estilos usan `StyleSheet` nativo
    - Confirmar que no se han modificado archivos fuera de `egchat-mobile/`
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints de kluster al final de cada brecha son obligatorios según `Requirements 10.6`
- Los property tests usan **fast-check** con mínimo 100 iteraciones; los tests de ejemplo usan **Jest** + `@testing-library/react-native`
- Todo el trabajo se realiza exclusivamente en `egchat-mobile/`; nunca modificar la raíz del workspace ni `EGCHAT NATIVA/`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6", "1.7", "2.1", "3.1"] },
    { "id": 3, "tasks": ["1.8", "2.2", "2.3", "2.4", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "2.8", "3.5", "4.1"] },
    { "id": 5, "tasks": ["2.9", "2.10", "3.6", "4.2"] },
    { "id": 6, "tasks": ["2.11", "3.7", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 7, "tasks": ["4.7", "4.8", "5.1"] },
    { "id": 8, "tasks": ["4.9", "5.2", "5.3", "6.1"] },
    { "id": 9, "tasks": ["4.10", "5.4", "6.2"] },
    { "id": 10, "tasks": ["6.3", "6.4", "6.5", "6.6", "7.1"] },
    { "id": 11, "tasks": ["6.7", "7.2", "8.1"] },
    { "id": 12, "tasks": ["6.8", "7.3", "7.4", "8.2"] },
    { "id": 13, "tasks": ["7.5", "7.6", "8.3"] },
    { "id": 14, "tasks": ["7.7", "8.4", "8.4b"] },
    { "id": 15, "tasks": ["7.8", "8.5", "8.6", "9.1"] },
    { "id": 16, "tasks": ["8.7", "9.2"] },
    { "id": 17, "tasks": ["8.8", "9.3", "9.4", "9.5"] },
    { "id": 18, "tasks": ["9.6"] },
    { "id": 19, "tasks": ["10.1", "10.2"] }
  ]
}
```
