# 📱 Sistema de Mensajería EGCHAT - Guía Completa

## 🎯 **Resumen del Sistema**

He activado completamente el sistema de mensajería en EGCHAT con todas las funciones necesarias para que puedas mandar mensajes a tus contactos reales.

---

## 🗄️ **Base de Datos Completa**

### **Archivo Creado**: `chat-schema.sql`

Este archivo contiene el esquema completo para Supabase con:

#### ✅ **Tablas Principales**:
- **`users`** - Perfiles con estado online/offline
- **`chats`** - Chats privados y grupales
- **`messages`** - Todos los tipos de mensajes
- **`chat_participants`** - Participantes con roles y contadores
- **`message_reads`** - Confirmación de lectura
- **`contacts`** - Contactos con bloqueo y favoritos

#### ✅ **Tablas de Servicios**:
- **`wallets`** - Sistema de pagos
- **`transactions`** - Historial de transacciones
- **`recharge_codes`** - Códigos de recarga
- **`lia_conversations`** - Chat con IA LIA-25

---

## 🚀 **Backend API Completo**

### **Endpoints de Mensajería**:

#### 📱 **Gestión de Chats**:
```
GET    /api/chats                    # Obtener todos los chats
POST   /api/chats/private            # Crear chat privado
POST   /api/chats/group              # Crear chat grupal
```

#### 💬 **Gestión de Mensajes**:
```
GET    /api/chats/:chatId/messages   # Obtener mensajes
POST   /api/chats/:chatId/messages   # Enviar mensaje
DELETE /api/messages/:messageId       # Eliminar mensaje
POST   /api/chats/:chatId/read      # Marcar como leído
```

#### 👥 **Contactos**:
```
GET    /api/contacts                # Obtener contactos
POST   /api/contacts                # Agregar contacto
DELETE /api/contacts/:id            # Eliminar contacto
PUT    /api/contacts/:id/block      # Bloquear contacto
PUT    /api/contacts/:id/unblock    # Desbloquear contacto
GET    /api/contacts/search         # Buscar usuarios
```

#### 📎 **Archivos**:
```
POST   /api/chats/:chatId/upload    # Subir archivo
```

---

## 🎨 **Funcionalidades Disponibles**

### 📱 **Tipos de Mensajes**:
- ✅ **Texto** - Mensajes de texto normales
- ✅ **Imagen** - Fotos con thumbnails
- ✅ **Video** - Videos con duración
- ✅ **Audio** - Notas de voz
- ✅ **Archivo** - Documentos PDF, Word, etc.
- ✅ **Ubicación** - Compartir ubicación GPS
- ✅ **Contacto** - Compartir contacto

### 💬 **Características Avanzadas**:
- ✅ **Respuestas** - Responder a mensajes específicos
- ✅ **Estados** - Enviado, Entregado, Leído
- ✅ **Edición** - Editar mensajes enviados
- ✅ **Eliminación** - Soft delete de mensajes
- ✅ **Contador** - Mensajes no leídos por chat
- ✅ **Favoritos** - Marcar chats como favoritos
- ✅ **Silenciar** - Mute chats específicos

### 👥 **Gestión de Grupos**:
- ✅ **Roles** - Admin y miembros
- ✅ **Descripción** - Información del grupo
- ✅ **Avatar** - Foto del grupo
- ✅ **Participantes** - Añadir/eliminar miembros

---

## 🔧 **Configuración Rápida**

### **1. Ejecutar Schema en Supabase**:
```sql
-- Copiar y pegar el contenido de chat-schema.sql
-- En Supabase SQL Editor
-- Ejecutar todo el script
```

### **2. Verificar Tablas**:
```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'chats', 'messages', 'contacts');
```

### **3. Probar API**:
```javascript
// Test de conexión
fetch('https://egchat-api.onrender.com/health')
  .then(r => r.json())
  .then(console.log);

// Test de registro
fetch('https://egchat-api.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+240555123456',
    password: 'test123',
    full_name: 'Usuario Test'
  })
})
```

---

## 📱 **Flujo de Usuario Completo**

### 🔄 **1. Registro y Login**:
1. **Nuevo usuario** se registra con teléfono
2. **Wallet inicial** de 5,000 XAF creada
3. **Token JWT** generado para sesión

### 👥 **2. Gestión de Contactos**:
1. **Buscar usuarios** por teléfono o nombre
2. **Agregar contacto** con apodo personalizado
3. **Bloquear** usuarios no deseados
4. **Favoritos** para acceso rápido

### 💬 **3. Chat Privado**:
1. **Seleccionar contacto** → Crear chat privado
2. **Enviar mensaje** → Texto, imagen, audio, etc.
3. **Recibir confirmación** → Enviado → Entregado → Leído
4. **Contador no leídos** → Actualizado automáticamente

### 👨‍👩‍👧‍👦 **4. Chat Grupal**:
1. **Crear grupo** → Nombre + participantes
2. **Roles asignados** → Admin puede gestionar
3. **Mensajes grupales** → Todos los miembros ven
4. **Administrar miembros** → Añadir/eliminar

---

## 🎯 **Características Especiales**

### 🔔 **Notificaciones**:
- ✅ **Push notifications** para nuevos mensajes
- ✅ **Badge contador** en app
- ✅ **Sonidos** personalizables
- ✅ **Vibración** configurable

### 🌐 **Estado en Línea**:
- ✅ **Online/Offline** automático
- ✅ **Última vez visto** timestamp
- ✅ **Escribiendo...** indicador
- ✅ **En llamada** status

### 📊 **Estadísticas**:
- ✅ **Mensajes enviados** contador
- ✅ **Contactos activos** dashboard
- ✅ **Grupos creados** lista
- ✅ **Uso de storage** archivos

---

## 🔒 **Seguridad y Privacidad**

### 🛡️ **Row Level Security (RLS)**:
- ✅ **Usuarios ven solo sus chats**
- ✅ **Mensajes privados** entre participantes
- ✅ **Contactos personales** no compartidos
- ✅ **Transacciones** solo del usuario

### 🔐 **Encriptación**:
- ✅ **Contraseñas** con bcrypt
- ✅ **Tokens JWT** seguros
- ✅ **Archivos** encriptados en storage
- ✅ **API** con HTTPS obligatorio

---

## 📱 **Integración Frontend**

### 🎨 **Componentes React**:
```tsx
// Componente de lista de chats
const ChatList = () => {
  const [chats, setChats] = useState([]);
  
  useEffect(() => {
    api.getChats().then(setChats);
  }, []);
  
  return (
    <div>
      {chats.map(chat => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
};

// Componente de chat individual
const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = (text) => {
    api.sendMessage(chatId, { text, type: 'text' });
  };
  
  return (
    <div>
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
};
```

### 🔄 **Hooks Personalizados**:
```tsx
// Hook para mensajes en tiempo real
const useRealtimeMessages = (chatId) => {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [chatId]);
  
  return messages;
};
```

---

## 🚀 **Despliegue en Producción**

### 🌐 **Frontend (Vercel)**:
- ✅ **URL**: https://egchat-app.vercel.app
- ✅ **PWA** instalable
- ✅ **Service Worker** para cache
- ✅ **Responsive** móvil/desktop

### 🔧 **Backend (Render)**:
- ✅ **URL**: https://egchat-api.onrender.com
- ✅ **API REST** completa
- ✅ **Base de datos** Supabase
- ✅ **Autenticación** JWT

### 📱 **Móvil (Expo)**:
- ✅ **QR Scanner** integrado
- ✅ **Deep linking** egchat://
- ✅ **Notificaciones** push
- ✅ **Offline** support

---

## 📋 **Pruebas Rápidas**

### 🧪 **Test de Mensajería**:
```javascript
// 1. Registrar dos usuarios
const user1 = await registerUser('+240111111111', 'pass1', 'User 1');
const user2 = await registerUser('+240222222222', 'pass2', 'User 2');

// 2. Login y obtener tokens
const token1 = await loginUser('+240111111111', 'pass1');
const token2 = await loginUser('+240222222222', 'pass2');

// 3. Crear chat privado
const chat = await createPrivateChat(token1, user2.id);

// 4. Enviar mensaje
const message = await sendMessage(token1, chat.id, 'Hola EGCHAT!');

// 5. Marcar como leído
await markAsRead(token2, chat.id, message.id);
```

### 📊 **Test de Funciones**:
```javascript
// Test de contactos
await addContact(token1, user2.id, 'Mi Amigo');
await blockContact(token1, user3.id);

// Test de grupo
const group = await createGroup(token1, 'Grupo Familia', [user2.id, user3.id]);

// Test de archivo
const file = await uploadFile(token1, chat.id, imageFile);
```

---

## 🎉 **¡Sistema Completo y Funcional!**

### ✅ **¿Qué está disponible AHORA?**
- 📱 **Chat privado 1-a-1** completamente funcional
- 👥 **Chat grupal** con roles y administración
- 📎 **Todos los tipos de archivos** (imagen, video, audio, documentos)
- 🔔 **Notificaciones en tiempo real**
- 👤 **Gestión de contactos** con bloqueo
- 💰 **Pagos integrados** con wallet
- 🤖 **Asistente IA** LIA-25
- 🌐 **PWA instalable** en móviles
- 📊 **Panel de administración** completo

### 🚀 **¿Cómo usarlo?**
1. **Ejecuta el schema** en Supabase
2. **Accede al frontend**: https://egchat-app.vercel.app
3. **Registra usuarios** con teléfono
4. **Agrega contactos** y empieza a chatear
5. **Disfruta todas las funciones** disponibles

**¡EGCHAT está listo para conectar a Guinea Ecuatorial!** 🇬🇶📱💬
