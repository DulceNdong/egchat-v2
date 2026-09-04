# Requirements Document

## Introduction

Este documento define los requisitos para cerrar 9 brechas de paridad funcional en la app nativa EGChat (`egchat-mobile/`), alineándola con la versión web de referencia. Las brechas se abordarán en orden prioritario: LIA-25, Stories, ImageViewer, Video Calls, Ocio, CEMAC, Apuestas, MiTaxi y ServiciosDiarios. Todos los cambios se realizan exclusivamente dentro de `egchat-mobile/`. El backend se consume en `https://egchat-api-xlxj.onrender.com` usando el cliente HTTP existente en `src/api.ts`.

## Glossary

- **App**: La aplicación React Native / Expo ubicada en `egchat-mobile/`.
- **LIA-25**: Asistente de IA integrado en el chat, que llama al endpoint `/api/lia/chat` del backend sin exponer claves en el cliente.
- **LIAScreen**: Pantalla o modal de conversación con LIA-25.
- **Stories**: Funcionalidad de estados efímeros tipo Instagram (Estados / Stories) gestionada en `app/stories.tsx`.
- **StoryViewer**: Componente de reproducción de historias a pantalla completa con barra de progreso y navegación táctil.
- **ImageViewer**: Componente/modal de visualización de imágenes a pantalla completa con zoom y swipe en el chat.
- **VideoCallScreen**: Pantalla `app/call/[callId].tsx` para llamadas de audio y videollamadas.
- **WebRTC**: Biblioteca `react-native-webrtc` ya instalada, usada por `src/hooks/useWebRTC.ts` para media nativo.
- **OcioScreen**: Pantalla `app/ocio.tsx` con categorías de entretenimiento (hoteles, cine, restaurantes, playas).
- **CEMACScreen**: Pantalla `app/cemac.tsx` con servicios financieros de la zona CEMAC.
- **ApuestasScreen**: Pantalla `app/apuestas.tsx` con apuestas deportivas, casino y lotería.
- **MiTaxiScreen**: Pantalla `app/mitaxi.tsx` con solicitud de taxis con mapa en tiempo real.
- **ServiciosDiariosScreen**: Pantalla `app/servicios-diarios.tsx` con restaurantes, vuelos y gasolineras.
- **Backend**: API REST en `https://egchat-api-xlxj.onrender.com`.
- **ChatMessageBubble**: Componente `src/components/chat/ChatMessageBubble.tsx` que renderiza mensajes individuales.
- **IncomingCallModal**: Modal de llamada entrante mostrado sobre cualquier pantalla activa.
- **RTCView**: Componente de `react-native-webrtc` que renderiza streams de video en pantalla.
- **XAF**: Franco CFA, moneda de Guinea Ecuatorial y la zona CEMAC.

---

## Requirements

### Requirement 1: LIA-25 Asistente de IA en el Chat

**User Story:** Como usuario de EGChat, quiero acceder a LIA-25 desde el chat para hacer preguntas y obtener respuestas de IA sin que se exponga ninguna clave en el cliente.

#### Acceptance Criteria

1. THE App SHALL proveer una entrada de acceso a LIA-25 (botón o tab) visible desde la pantalla principal de chats.
2. WHEN el usuario envía un mensaje a LIA-25, THE App SHALL llamar al endpoint `/api/lia/chat` del Backend con el texto del mensaje y el historial de conversación como cuerpo de la petición, sin incluir ninguna API key en el cliente.
3. WHEN el Backend responde con `{ reply: string }`, THE LIAScreen SHALL mostrar la respuesta de LIA-25 en la interfaz de conversación en menos de 30 segundos.
4. WHILE se espera respuesta del Backend, THE LIAScreen SHALL mostrar un indicador de carga visible al usuario.
5. IF el Backend responde con un error HTTP o la petición excede el tiempo de espera, THEN THE LIAScreen SHALL mostrar un mensaje de error descriptivo y permitir al usuario reenviar el mensaje.
6. THE LIAScreen SHALL mantener el historial de la conversación activa en memoria durante la sesión del usuario y enviarlo en cada petición a `/api/lia/chat`.
7. WHEN el usuario cierra LIAScreen y la vuelve a abrir en la misma sesión, THE App SHALL mostrar el historial de conversación previo de esa sesión.

---

### Requirement 2: Stories Subida de historias y visor funcional

**User Story:** Como usuario de EGChat, quiero publicar fotos/vídeos como estados efímeros y ver los estados de mis contactos con barra de progreso y navegación fluida.

#### Acceptance Criteria

1. WHEN el usuario pulsa "Añadir estado" y selecciona una imagen o vídeo, THE Stories SHALL subir el media al Backend vía `storiesAPI.create` y actualizar el listado de estados sin requerir recarga manual.
2. WHEN la subida está en curso, THE Stories SHALL mostrar un `ActivityIndicator` en el avatar del estado propio.
3. IF la subida falla, THEN THE Stories SHALL mostrar una alerta con el mensaje de error del Backend y dejar el estado sin publicar.
4. WHEN el usuario pulsa el avatar de un contacto con estado no visto, THE StoryViewer SHALL abrirse a pantalla completa mostrando la primera historia no vista de ese contacto.
5. WHILE StoryViewer está activo, THE StoryViewer SHALL avanzar automáticamente a la siguiente historia tras 5000 ms y mostrar una barra de progreso animada para la historia actual.
6. WHEN el usuario pulsa la zona izquierda de StoryViewer, THE StoryViewer SHALL retroceder a la historia anterior del mismo grupo o al grupo anterior.
7. WHEN el usuario pulsa la zona derecha de StoryViewer, THE StoryViewer SHALL avanzar a la siguiente historia del mismo grupo o al siguiente grupo.
8. WHEN se visualiza una historia, THE App SHALL llamar a `storiesAPI.registerView` con el `storyId` correspondiente para registrar la vista.
9. WHEN el usuario selecciona "Eliminar todo" en el menú de su estado, THE Stories SHALL llamar a `storiesAPI.delete` y actualizar la interfaz sin el estado eliminado.
10. THE Stories SHALL clasificar los estados en dos pestañas: "Recientes" (no vistos) y "Vistos", actualizando la clasificación al cerrar StoryViewer.

---

### Requirement 3: ImageViewer Visualización de imágenes del chat

**User Story:** Como usuario del chat, quiero ver las imágenes recibidas a pantalla completa con zoom y swipe para cerrar, como en las apps de mensajería modernas.

#### Acceptance Criteria

1. WHEN el usuario pulsa una imagen en ChatMessageBubble, THE App SHALL abrir ImageViewer a pantalla completa con la imagen seleccionada.
2. WHILE ImageViewer está abierto, THE ImageViewer SHALL permitir al usuario hacer zoom con gestos de pellizco (pinch-to-zoom) hasta un factor máximo de 4×.
3. WHEN el usuario realiza un gesto de swipe vertical (desplazamiento mayor de 80 px), THE ImageViewer SHALL cerrarse con una animación de desvanecimiento.
4. WHILE ImageViewer está abierto, THE ImageViewer SHALL mostrar un botón de cierre accesible en la esquina superior derecha de la pantalla.
5. IF la imagen no puede cargarse, THEN THE ImageViewer SHALL mostrar un mensaje de error y un botón para reintentar la carga.
6. WHERE hay múltiples imágenes en el mismo mensaje, THE ImageViewer SHALL permitir navegar entre ellas con swipe horizontal.
7. THE ImageViewer SHALL mostrarse sobre cualquier contenido de pantalla usando un Modal nativo con `statusBarTranslucent`.

---

### Requirement 4: Video Calls WebRTC nativo completo

**User Story:** Como usuario de EGChat, quiero realizar y recibir llamadas de audio y videollamadas con audio y vídeo reales usando la instalación existente de react-native-webrtc.

#### Acceptance Criteria

1. WHEN `react-native-webrtc` está disponible en el entorno de ejecución, THE App SHALL usar WebRTC nativo para audio y vídeo, no el modo de solo señalización.
2. WHEN el usuario inicia una videollamada, THE VideoCallScreen SHALL solicitar permisos de cámara y micrófono al sistema operativo antes de acceder a los dispositivos.
3. IF el usuario deniega el permiso de cámara o micrófono, THEN THE VideoCallScreen SHALL mostrar un mensaje explicando que el permiso es necesario y ofrecer abrir los ajustes del sistema.
4. WHEN la videollamada se establece entre dos usuarios, THE VideoCallScreen SHALL mostrar el stream remoto a pantalla completa y el stream local en una ventana PiP (Picture-in-Picture) de 90×120 px en la esquina superior derecha.
5. WHEN el stream remoto no está disponible todavía, THE VideoCallScreen SHALL mostrar el avatar e iniciales del contacto como placeholder.
6. WHEN el usuario pulsa el botón de silenciar, THE VideoCallScreen SHALL desactivar la pista de audio local y reflejar el estado mudo en la UI (icono con tachado).
7. WHEN el usuario pulsa el botón de cámara (en videollamada), THE VideoCallScreen SHALL desactivar la pista de vídeo local y reflejar el estado con cámara desactivada en la UI.
8. WHEN una llamada entrante llega mientras la app está en uso, THE IncomingCallModal SHALL mostrarse sobre la pantalla activa con botones de aceptar y rechazar.
9. WHEN el usuario acepta una llamada entrante, THE App SHALL ejecutar `answerCall` con el `offer` y tipo de llamada recibidos, estableciendo el PeerConnection nativo.
10. WHEN la conexión WebRTC pasa al estado `connected`, THE VideoCallScreen SHALL iniciar el contador de duración de la llamada.
11. WHEN la conexión WebRTC pasa a estado `failed` o `closed` de forma inesperada, THE App SHALL finalizar la llamada, liberar los streams y navegar de regreso a la pantalla anterior.
12. WHEN el usuario pulsa el botón de colgar, THE VideoCallScreen SHALL llamar a `callAPI.end`, liberar todos los streams y MediaTracks, y navegar de regreso a la pantalla anterior.
13. THE VideoCallScreen SHALL enviar candidatos ICE al Backend vía `callAPI.ice` a medida que el PeerConnection los genere, sin bloquear la UI.

---

### Requirement 5: Ocio Datos reales y acceso a llamadas

**User Story:** Como usuario de EGChat, quiero explorar hoteles, restaurantes, cines y playas con información real y poder llamar directamente desde la app.

#### Acceptance Criteria

1. THE OcioScreen SHALL mostrar al menos cuatro categorías de ocio: Hoteles, Cine, Restaurantes y Playas, cada una con su icono y la cantidad de establecimientos disponibles.
2. WHEN el usuario selecciona una categoría, THE OcioScreen SHALL navegar a la lista de establecimientos de esa categoría sin recargar la pantalla completa.
3. THE OcioScreen SHALL mostrar para cada establecimiento: nombre, valoración en estrellas (si aplica), precio orientativo y botón de llamada telefónica.
4. WHEN el usuario pulsa el botón de llamada de un establecimiento, THE App SHALL invocar `Linking.openURL` con el número de teléfono del establecimiento en formato `tel:`.
5. IF el establecimiento no tiene número de teléfono registrado, THEN THE OcioScreen SHALL ocultar el botón de llamada para ese establecimiento.
6. THE OcioScreen SHALL respetar el tema visual activo (claro/oscuro) usando los colores definidos en `src/theme` y `DarkColors`.

---

### Requirement 6: CEMAC Transferencias y tipos de cambio

**User Story:** Como usuario de EGChat, quiero realizar transferencias entre países CEMAC y consultar tipos de cambio desde la app nativa con la misma funcionalidad que la versión web.

#### Acceptance Criteria

1. THE CEMACScreen SHALL mostrar los 6 países de la zona CEMAC y permitir seleccionar uno para acceder a sus servicios regionales.
2. WHEN el usuario selecciona un país, THE CEMACScreen SHALL mostrar pestañas: Servicios, Ocio, Cajeros, Cuenta, Noticias y Cambio.
3. WHEN el usuario abre la pestaña Cuenta, THE CEMACScreen SHALL llamar a `walletAPI.getBalance` y mostrar el saldo actual en XAF.
4. WHEN el usuario completa el formulario de transferencia (país origen, país destino, beneficiario, cuenta y monto) y pulsa enviar, THE CEMACScreen SHALL llamar a `cemacAPI.createTransfer` con los datos del formulario.
5. IF `cemacAPI.createTransfer` responde con éxito, THEN THE CEMACScreen SHALL mostrar una notificación de éxito, cerrar el modal y actualizar el saldo mostrado.
6. IF el monto de la transferencia supera el saldo disponible o el formulario está incompleto, THEN THE CEMACScreen SHALL mostrar un mensaje de error mediante `toast.error` y no enviar la petición al Backend.
7. WHEN el usuario introduce un importe en la pestaña Cambio y selecciona monedas de origen y destino, THE CEMACScreen SHALL calcular y mostrar el resultado de la conversión usando las tasas locales de `RATES` sin necesidad de llamada al Backend.
8. THE CEMACScreen SHALL respetar el idioma seleccionado por el usuario (ES, FR o PT) para todos los textos de la interfaz usando el objeto `T` de `cemacData`.

---

### Requirement 7: Apuestas Cupón de apuestas y walletAPI integrado

**User Story:** Como usuario mayor de 18 años, quiero gestionar un cupón de apuestas deportivas y jugar en el casino o lotería usando mi saldo del monedero integrado en EGChat.

#### Acceptance Criteria

1. WHEN el usuario abre ApuestasScreen, THE App SHALL llamar a `walletAPI.getBalance` y mostrar el saldo disponible en XAF en la cabecera.
2. THE ApuestasScreen SHALL mostrar el aviso legal de juego responsable en todas las vistas de la pantalla.
3. WHEN el usuario selecciona una cuota de un partido, THE ApuestasScreen SHALL añadir esa selección al cupón y mostrar el FAB del cupón con el número de selecciones y el total apostado.
4. WHEN el usuario abre el cupón y configura los importes individuales de cada apuesta, THE ApuestasScreen SHALL calcular y mostrar la ganancia potencial total en tiempo real.
5. WHEN el usuario pulsa "Apostar" y el importe total es menor o igual al saldo disponible, THE ApuestasScreen SHALL simular el resultado, actualizar el saldo en UI y mostrar una notificación de resultado via `toast`.
6. IF el importe total de las apuestas supera el saldo disponible o no hay importes introducidos, THEN THE ApuestasScreen SHALL mostrar una alerta de error y no procesar la apuesta.
7. WHEN el usuario selecciona un operador de casino e introduce un importe válido, THE ApuestasScreen SHALL ejecutar el juego, actualizar el saldo y mostrar el resultado.
8. WHEN el usuario pulsa un ticket de lotería disponible, THE ApuestasScreen SHALL verificar que el precio del ticket no supera el saldo, ejecutar el sorteo y mostrar el resultado al usuario.
9. THE ApuestasScreen SHALL permitir navegar hacia atrás desde cualquier operador al hub de operadores sin pérdida del saldo actualizado.

---

### Requirement 8: MiTaxi Solicitud de viaje con GPS y mapa en tiempo real

**User Story:** Como usuario de EGChat, quiero pedir un taxi indicando origen y destino, ver el conductor en el mapa y valorarlo al finalizar el viaje.

#### Acceptance Criteria

1. WHEN MiTaxiScreen se inicia, THE App SHALL solicitar permiso de ubicación en primer plano al sistema operativo.
2. WHEN el permiso de ubicación es concedido, THE MiTaxiScreen SHALL obtener la posición GPS actual del usuario y centrar el mapa en esa posición.
3. IF el permiso de ubicación es denegado, THEN THE MiTaxiScreen SHALL usar `MALABO_CENTER` como coordenadas por defecto y mostrar el mapa centrado en Malabo.
4. WHEN el usuario escribe en el campo de origen o destino, THE MiTaxiScreen SHALL mostrar sugerencias de lugares filtradas de `MITAXI_PLACE_NAMES` en tiempo real con un retraso máximo de 350 ms.
5. WHEN el usuario selecciona un lugar sugerido, THE MiTaxiScreen SHALL resolver sus coordenadas usando `findPlaceCoords` o geocodificación con Expo Location y actualizar el marcador en el mapa.
6. WHEN origen y destino están definidos y el usuario pulsa el botón de pedir viaje, THE MiTaxiScreen SHALL llamar a `taxiAPI.requestRide` con el tipo de vehículo seleccionado.
7. WHEN `taxiAPI.requestRide` responde con éxito, THE MiTaxiScreen SHALL mostrar los datos del conductor asignado (nombre, valoración, matrícula) y animar el marcador del conductor aproximándose al origen en el mapa.
8. IF el saldo del usuario es inferior al precio del tipo de vehículo seleccionado, THEN THE MiTaxiScreen SHALL mostrar una alerta indicando saldo insuficiente y no enviar la petición al Backend.
9. WHEN el usuario pulsa "Iniciar viaje" tras la asignación del conductor, THE MiTaxiScreen SHALL avanzar al estado `riding` y actualizar la UI con el estado del trayecto.
10. WHEN el viaje finaliza, THE MiTaxiScreen SHALL mostrar la pantalla de valoración con 5 estrellas y enviar la puntuación al Backend vía `taxiAPI.rateDriver` al confirmar.
11. WHEN el usuario pulsa cancelar durante la búsqueda o trayecto, THE MiTaxiScreen SHALL llamar a `taxiAPI.cancelRide` si hay `rideId` activo y volver al formulario de solicitud.
12. THE MiTaxiScreen SHALL actualizar la posición GPS del usuario en tiempo real mientras la pantalla está activa, usando `Location.watchPositionAsync` con un intervalo mínimo de 25 metros.

---

### Requirement 9: ServiciosDiarios Servicios de utilidad con contacto directo

**User Story:** Como usuario de EGChat, quiero consultar restaurantes, vuelos y gasolineras disponibles en Guinea Ecuatorial y contactarlos directamente por teléfono desde la app.

#### Acceptance Criteria

1. THE ServiciosDiariosScreen SHALL mostrar tres pestañas de servicios: Restaurantes, Vuelos y Gasolineras.
2. WHEN el usuario selecciona una pestaña, THE ServiciosDiariosScreen SHALL mostrar la lista de establecimientos de esa categoría sin recargar la pantalla.
3. THE ServiciosDiariosScreen SHALL mostrar para cada establecimiento: nombre, descripción, precio orientativo y botón de llamada telefónica.
4. WHEN el usuario pulsa el botón de llamada de un establecimiento, THE App SHALL invocar `Linking.openURL` con el número de teléfono en formato `tel:`.
5. THE ServiciosDiariosScreen SHALL respetar el tema visual activo (claro/oscuro) usando los colores de `src/theme` y `DarkColors`.
6. THE ServiciosDiariosScreen SHALL resaltar visualmente la pestaña activa con el color de acento definido en `Colors.accent`.

---

### Requirement 10: Restricciones transversales

**User Story:** Como equipo de desarrollo, quiero garantizar que todas las implementaciones respeten las restricciones técnicas del proyecto nativo.

#### Acceptance Criteria

1. THE App SHALL modificar únicamente archivos dentro de `egchat-mobile/` para implementar las 9 brechas de paridad.
2. THE App SHALL usar el cliente HTTP de `src/api.ts` para todas las llamadas al Backend, sin crear clientes HTTP alternativos.
3. WHEN se añaden dependencias nuevas, THE App SHALL hacerlo en `egchat-mobile/package.json` y no en otros `package.json` del workspace.
4. THE App SHALL usar `StyleSheet` nativo de React Native para todos los estilos, pudiendo complementar con NativeWind donde ya esté en uso.
5. THE App SHALL usar Expo Router para toda navegación entre pantallas, manteniendo la estructura de rutas existente en `egchat-mobile/app/`.
6. THE App SHALL incluir una llamada a `kluster_code_review_auto` sobre cada archivo modificado o creado como último paso antes de cerrar cada brecha.
