# 📋 Lista de Usuarios EGCHAT - Pasos para Agregar Contactos

## ✅ Usuarios Registrados en EGCHAT

Para ver todos los usuarios registrados y sus números de teléfono:

### Opción 1: Supabase Dashboard (Recomendado)

```
1. Ve a: https://supabase.com/dashboard
2. Busca proyecto: dpkfwlzikmdvhqxhyfmz
3. Ve a: Database → Tables → users
4. Verás columnas:
   - phone: Número de teléfono
   - full_name: Nombre del usuario
   - created_at: Cuándo se registró
   - avatar_url: Si tiene foto
```

### Opción 2: Desde tu App EGCHAT

```
1. Abre EGCHAT: http://localhost:3002
2. Haz login con tu cuenta
3. Ve a tab "Contactos"
4. Busca el botón "Ver todos"
5. Se mostrará lista de usuarios disponibles
```

---

## 🎯 Cómo Agregar Cada Usuario

### Paso 1: Obtén el Número de Teléfono

De la lista en Supabase, copia el número (ej: +240123456789)

### Paso 2: Abre EGCHAT

```
http://localhost:3002
```

### Paso 3: Busca el Contacto

1. Ve a tab **"Chats"**
2. Presiona el botón **"+"** (Nuevo chat)
3. Pega el número: `+240123456789`
4. Presiona "Buscar" o presiona el nombre cuando aparezca

### Paso 4: Envía tu Primer Mensaje

```
1. El chat se abre
2. Escribe: "¡Hola! Soy [tu nombre]"
3. Presiona Enviar
4. ¡El contacto ya está agregado!
```

---

## 📊 Tabla de Referencia Rápida

| Acción | Pasos | Resultado |
|--------|-------|-----------|
| **Buscar usuario** | Chats → + → Teléfono | Se abre chat |
| **Agregar contacto** | Primer mensaje enviado | Ya está en contactos |
| **Ver mensaje** | Abrir chat | Notificación desaparece |
| **Responder** | Escribir + Enviar | Conversación iniciada |
| **Mutetar chat** | Contacto → Silenciar | No recibes notificaciones |
| **Bloquear** | Contacto → Bloquear | No recibes mensajes |

---

## 💡 Tips Importantes

✅ **Todos deben estar registrados primero**
- Solo usuarios ya en EGCHAT aparecen en búsqueda

✅ **Número debe incluir código de país**
- Ej: +240 (Guinea Ecuatorial)
- O +34 (España)

✅ **El primer mensaje es importante**
- Sin mensajes, el chat se considera "vacio"
- Después de primer mensaje, aparece en tu lista de chats

✅ **Notificaciones en tiempo real**
- Si ambos tienen la app abierta, ves números en vivo
- Los "typing..." aparecen mientras escriben

✅ **Privacidad**
- Tus mensajes solo los ve el receptor
- El servidor no accede al contenido
- Puedes eliminar mensajes en cualquier momento

---

## 🔄 Flujo Rápido (5 minutos)

```bash
# 1. Abre EGCHAT
http://localhost:3002

# 2. Haz login
Teléfono: +240[tu-numero]
Contraseña: tu-password

# 3. Ve a Chats
Presiona tab "Chats"

# 4. Busca primer usuario desde Supabase
Presiona +
Escribe: +240[otro-numero]
Selecciona usuario

# 5. Envía mensaje
Escribir: "¡Hola! ¿Cómo estás?"
Presionar Enviar

# 6. ¡Listo! 🎉
El usuario recibe tu mensaje
```

---

## 🚀 Agrega Múltiples Contactos

Para automatizar, aquí está la lista de formato:

```
Usuario 1: +240[XXXX]
Usuario 2: +240[YYYY]
Usuario 3: +240[ZZZZ]
```

Reemplaza con los números de tu tabla `users` en Supabase.

---

## 🆘 Si Algo No Funciona

**P: "El usuario no aparece en búsqueda"**
R: El usuario debe estar registrado en Supabase. Verifica en la tabla `users`.

**P: "El mensaje no envía"**
R: El backend podría estar durmiendo. Presiona "Probar conexión" en login.

**P: "No veo notificaciones"**
R: Activa notificaciones del navegador (permite en popup).

---

## 📞 Soporte

Para más información:
- Ver [HOW_TO_VIEW_USERS.md](HOW_TO_VIEW_USERS.md) - Ver lista de usuarios
- Ver [ADD_CONTACTS_GUIDE.md](ADD_CONTACTS_GUIDE.md) - Guía completa de agregar contactos
- Ver [DEPLOYMENT_GUIDE_v2.5.md](DEPLOYMENT_GUIDE_v2.5.md) - Despliegue a todos los usuarios