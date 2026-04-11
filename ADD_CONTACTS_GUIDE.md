# 💬 Cómo Agregar Contactos y Enviar Mensajes en EGCHAT v2.5.0

## 🎯 Paso 1: Agregar un Contacto Existente

### Opción A: Buscar por Teléfono (Recomendado)

1. **Abre EGCHAT** en tu navegador: `http://localhost:3002`
2. Una vez logueado, ve al tab **"Chats"**
3. Busca el botón de **"+"** (Nuevo chat) o **"Buscar contacto"**
4. Escribe el número de teléfono del otro usuario
   - Ejemplo: `+240123456789`
   - O solo: `123456789`
5. El sistema mostrará el usuario si existe
6. Presiona su nombre para abrir el chat

### Opción B: Desde la Lista de Contactos

1. Ve al tab **"Contactos"**
2. Presiona **"Agregar contacto"**
3. Puedes:
   - Escribir el teléfono
   - Buscar por nombre
   - Escanear código QR del otro usuario

---

## 📱 Paso 2: Enviar el Primer Mensaje

Una vez opening el chat con el otro usuario:

1. **Campo de texto** en la parte inferior
2. Escribe tu mensaje
3. Presiona **"Enviar"** (icono de flecha o Enter)
4. El mensaje se marca como:
   - ✓ Enviado (1 check)
   - ✓✓ Entregado (2 checks)
   - ✓✓ Leído (2 checks azules)

---

## 🔍 Ejemplo: Agregar Usuario Específico

**Tu teléfono:** +240111111111
**Otro usuario:** +240222222222

### Proceso:

```
1. Abre EGCHAT
2. Login con +240111111111
3. Tab "Chats" → Botón "+"
4. Escribe: +240222222222
5. Usuario aparece
6. Presiona para iniciar chat
7. Escribe mensaje y envía
```

El otro usuario recibirá notificación de tu primer mensaje.

---

## 💡 Datos que Necesitas de Otros Usuarios

Para agregar a alguien como contacto, necesitas:

✅ Su **número de teléfono** (con país)
- Ejemplo: `+240 123 456 789`

✅ O el **nombre exacto** si ya está en tu lista

Optativo: **Código QR** del usuario (escaneable)

---

## 📊 Estado del Mensaje

Los mensajes tienen estos estados:

| Estado | Ícono | Significado |
|--------|-------|------------|
| Enviado | ✓ | Llegó al servidor |
| Entregado | ✓✓ | El otro usuario recibió |
| Leído | ✓✓ (azul) | El usuario abrió el chat |
| Fallido | ✗ | No se envió |

---

## 🚀 Características Disponibles en Chats

Dentro de un chat puedes:

✅ **Enviar mensajes de texto**
✅ **Compartir fotos** (botón 📷)
✅ **Enviar videos** (si tu teléfono los soporta)
✅ **Mensajes de voz** (grabación de audio)
✅ **Ubicación en vivo** (GPS)
✅ **Archivos** (documentos, PDF, etc)
✅ **Reacciones** a mensajes (emojis)
✅ **Responder** a un mensaje específico
✅ **Buscar** mensajes en el chat
✅ **Mensajes desaparecen** (opcional)
✅ **Mutetar chat** (sin notificaciones)
✅ **Bloquear usuario**
✅ **Respaldar chat**

---

## 🔐 Seguridad

- Todos los mensajes se cifran
- Solo tú y el otro usuario pueden verlos
- El servidor no guarda contenido descifrado
- Puedes eliminar mensajes en cualquier momento

---

## 🆘 Problemas Comunes

### "No encuentra al usuario"
```
Soluciones:
1. Verifica que el número incluya código de país (+240)
2. Asegúrate de que está registrado en EGCHAT
3. El usuario debe tener la app abierta o haber iniciado sesión alguna vez
```

### "El mensaje no se envía"
```
Soluciones:
1. Verifica conexión a internet
2. Intenta reloguear
3. Revisa que el backend esté funcionando
4. Prueba el botón "Probar conexión" en login
```

### "No recibo notificaciones"
```
Soluciones:
1. Activa notificaciones en navegador
2. No tengas el chat abierto (se marcan como leídos automáticamente)
3. Revisa que no esté muteado el chat
```

---

## 📞 Para Agregar Múltiples Contactos Rápidamente

Los números de teléfono de tus contactos existentes son:

```bash
# Obtenlos de Supabase:
# Ve a: https://supabase.com/dashboard
# Proyecto: dpkfwlzikmdvhqxhyfmz
# Tabla: users
# Columna: phone
```

Luego simplemente introduces cada número en EGCHAT.

---

## 🎯 Flujo Completo: De 0 a Mensajes

```
1. Usuario A se registra en EGCHAT (v2.5.0)
   └─ Teléfono: +240111111111
   └─ Nombre: Usuario A
   
2. Usuario B se registra en EGCHAT
   └─ Teléfono: +240222222222
   └─ Nombre: Usuario B

3. Usuario A abre EGCHAT
   └─ Login con +240111111111

4. Usuario A busca a Usuario B
   └─ Escribe +240222222222
   └─ Aparece "Usuario B"

5. Usuario A presiona Usuario B
   └─ Se abre el chat

6. Usuario A escribe primer mensaje
   └─ "¡Hola! Este es mi primer mensaje"
   
7. Usuario A presiona Enviar
   └─ Mensaje aparece con ✓
   
8. Usuario B recibe notificación
   └─ Puede leer el mensaje
   └─ Responder automáticamente

9. ¡Conversación iniciada! 💬
```

---

## 🚀 Próxios Pasos

1. ✅ Agrega todos los usuarios existentes como contactos
2. ✅ Envía tu primer mensaje
3. ✅ Verifica que recibas notificaciones
4. ✅ Comparte tu número QR con otros para que te agreguen
5. ✅ Personaliza tu perfil de EGCHAT