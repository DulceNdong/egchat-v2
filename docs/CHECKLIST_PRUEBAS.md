# 🧪 Checklist de Pruebas — Offline-First

## 1. Pruebas de Base de Datos SQLite

### Inicialización
- [ ] App abre sin errores en iOS simulador
- [ ] App abre sin errores en Android emulador
- [ ] App abre sin errores en Chrome (modo web)
- [ ] Consola muestra "[AppInit] ✅ SQLite lista"
- [ ] Consola muestra "[AppInit] ✅ SyncManager listo"

### Persistencia
- [ ] Cerrar app completamente → abrir → chats siguen ahí
- [ ] Cerrar app completamente → abrir → mensajes siguen ahí
- [ ] Cerrar app completamente → abrir → balance wallet visible
- [ ] Reiniciar dispositivo → datos siguen presentes

---

## 2. Pruebas de Modo Offline

### Preparación
1. Iniciar sesión y cargar chats
2. Activar Airplane Mode (sin Wi-Fi, sin datos)

### Verificaciones
- [ ] SyncIndicator muestra "Sin conexión — Modo offline" (barra roja)
- [ ] Lista de chats sigue visible
- [ ] Mensajes de conversaciones abiertas siguen visibles
- [ ] Balance de wallet muestra último valor sincronizado
- [ ] Historial de transacciones visible
- [ ] Botones de pago/transferencia están deshabilitados

### Envío Offline
- [ ] Escribir y enviar un mensaje sin conexión
- [ ] Mensaje aparece en la UI con estado "pendiente" (ícono de reloj)
- [ ] Al reconectar, el mensaje se envía automáticamente
- [ ] Estado cambia a "enviado" tras sincronizar

---

## 3. Pruebas de Reconexión

### Escenario: Perder y recuperar conexión
1. Activar Airplane Mode
2. Enviar 3 mensajes offline
3. Desactivar Airplane Mode
4. Esperar 5 segundos

### Verificaciones
- [ ] SyncIndicator muestra "Sincronizando…" (amarillo)
- [ ] Los 3 mensajes se envían al servidor
- [ ] SyncIndicator desaparece tras sincronizar
- [ ] Mensajes tienen estado "leído/enviado"

---

## 4. Pruebas de Rendimiento

### Arranque
- [ ] App arranca en < 2 segundos (iOS)
- [ ] App arranca en < 3 segundos (Android)
- [ ] Lista de chats visible en < 500ms (desde SQLite)
- [ ] Monitor registra `appStartMs < 2000`

### Lista de Mensajes
- [ ] Chat con 100 mensajes carga sin lag
- [ ] Chat con 500 mensajes carga sin lag
- [ ] Scroll es fluido (60fps)
- [ ] No hay congelamiento al navegar entre chats

### Caché de Archivos
- [ ] Primera carga: avatares tardan (descarga)
- [ ] Segunda carga: avatares son instantáneos (caché)
- [ ] Imágenes de mensajes se cachean correctamente

---

## 5. Pruebas de Seguridad

### Token Storage
- [ ] Token guardado en Keychain (iOS): verificar en Settings > Privacy
- [ ] Token guardado en EncryptedSharedPreferences (Android)
- [ ] Token NO visible en chrome://inspect deviceStorage

### Session
- [ ] Logout limpia todos los tokens
- [ ] Logout limpia datos sensibles de SQLite
- [ ] Token expirado fuerza re-login

---

## 6. Pruebas de Sincronización

### Sync Automático
- [ ] Abrir app con red → chats se actualizan en <5s
- [ ] Recibir mensaje mientras app está abierta → aparece sin recargar
- [ ] Polling cada 30s actualiza lista de chats

### Conflictos
- [ ] Enviar mensaje → perder red → reconectar → mensaje enviado una sola vez (no duplicado)
- [ ] Editar perfil offline → reconectar → cambios sincronizados

---

## 7. Pruebas Específicas iOS

- [ ] Safe area top correcta (iPhone con notch y sin notch)
- [ ] Safe area bottom correcta (iPhone con home indicator)
- [ ] PWA en iPhone funciona igual que app nativa
- [ ] Scroll bounce nativo funciona
- [ ] Teclado no desplaza la barra de chat

---

## 8. Pruebas Específicas Android

- [ ] Status bar overlay correcto (Android 10+)
- [ ] Edge-to-edge layout correcto
- [ ] Back button Android navega correctamente
- [ ] Notificaciones push recibidas en background
- [ ] App se restaura correctamente desde background

---

## 9. Pruebas de Wallet

- [ ] Balance visible offline (último sincronizado)
- [ ] Historial de transacciones visible offline
- [ ] Botón "Transferir" muestra aviso "Requiere conexión" en offline
- [ ] Botón "Pagar" muestra aviso "Requiere conexión" en offline
- [ ] Al reconectar, balance se actualiza automáticamente

---

## 10. Prueba de Regresión

Verificar que TODO lo anterior sigue funcionando:
- [ ] Chat en tiempo real
- [ ] Llamadas de voz y video
- [ ] Estados (Stories)
- [ ] QR Scanner
- [ ] Servicios (Electricidad, Agua, etc.)
- [ ] Módulos de terceros (Apuestas, CEMAC, MiTaxi)
- [ ] Configuración de perfil
- [ ] Cambio de fondo de chat
