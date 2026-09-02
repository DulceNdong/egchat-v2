# Guía de Migración: Render + Supabase → Firebase + Railway

## Resumen

| Componente | Antes | Después |
|---|---|---|
| Backend | Render (con cold starts) | Railway (sin cold starts) |
| Base de datos | Supabase PostgreSQL | Firebase Firestore |
| Realtime | Supabase Realtime + SSE | Firebase Realtime DB + SSE |
| Storage | Supabase Storage | Firebase Storage |
| Push | Firebase FCM (sin cambio) | Firebase FCM (sin cambio) |
| Auth | JWT custom (sin cambio) | JWT custom (sin cambio) |

---

## FASE 1: Crear proyecto Firebase

### 1.1 Firebase Console

1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto o usar el existente (el de FCM)
3. Habilitar los siguientes servicios:
   - **Firestore Database** → Create database → Production mode → `europe-west1` (más cercano a GE)
   - **Realtime Database** → Create database → `europe-west1`
   - **Storage** → Get started → Production mode

### 1.2 Service Account (para el backend)

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Descargar el JSON → guardarlo como `server/firebase-service-account.json`
4. **NUNCA subir este archivo a Git** (ya está en .gitignore)

### 1.3 Config del cliente web/móvil

1. Firebase Console → Project Settings → General → Your apps
2. Click "Web app" o usar la app existente
3. Copiar la config del SDK:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "egchat-xxxxx.firebaseapp.com",
  databaseURL: "https://egchat-xxxxx-default-rtdb.firebaseio.com",
  projectId: "egchat-xxxxx",
  storageBucket: "egchat-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.4 Reglas de Firestore (pegar en Console → Firestore → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo el backend accede con service account (admin SDK)
    // El cliente accede solo via la API REST (no directamente)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 1.5 Reglas de Realtime DB (pegar en Console → Realtime DB → Rules)

```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": "auth == null || auth.uid != null",
        ".write": "auth == null || auth.uid != null"
      }
    }
  }
}
```

---

## FASE 2: Migrar datos de Supabase a Firestore

### 2.1 Prerrequisitos

```bash
cd server
npm install
```

### 2.2 Crear archivo .env de migración

Crea `server/.env` con:

```env
SUPABASE_URL=https://fjtoxjcuyfapeprniink.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...  # la que ya tienes

# Firebase (el JSON del service account como string o path al archivo)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

### 2.3 Ejecutar migración

```bash
cd server
node migrate-supabase-to-firebase.js
```

El script migra estas colecciones:
- `users` → usuarios y perfiles
- `wallets` → monederos
- `contacts` → contactos
- `chats` + `chat_participants` → chats
- `messages` + `message_deletions` + `message_reads` → mensajes
- `transactions` + `recharge_codes` → pagos
- `taxi_rides`, `cemac_transfers`, `service_orders` → servicios
- `lia_conversations` → historial Lia-25
- `expo_push_tokens` → tokens FCM

### 2.4 Migrar Storage (manual)

Los archivos de chat (imágenes, audio, documentos) deben migrarse manualmente:

```bash
# Instalar gsutil (parte de Google Cloud SDK)
# https://cloud.google.com/storage/docs/gsutil_install

# Autenticar
gcloud auth login

# Copiar archivos de Supabase Storage a Firebase Storage
gsutil -m cp -r "gs://[SUPABASE_STORAGE_ID]/chat-files/*" "gs://egchat-xxxxx.appspot.com/chats/"
```

Alternativamente, descargar desde el panel de Supabase Storage y subir manualmente en Firebase Storage Console.

---

## FASE 3: Deploy en Koyeb (100% GRATUITO)

Koyeb es la mejor opción gratuita: sin tarjeta, sin cold starts largos, HTTPS automático.

### 3.1 Crear cuenta en Koyeb

1. Ir a https://app.koyeb.com
2. Sign up con GitHub (sin tarjeta de crédito)
3. Verificar email

### 3.2 Crear nuevo servicio

1. Dashboard → **Create Service**
2. Elegir **GitHub** como fuente
3. Conectar el repo `egchat-v2`, rama `mobile`
4. En **Service type**: Web Service
5. En **Build & deployment**:
   - Root directory: `server`
   - Build command: `npm install --production`
   - Run command: `node index.firebase.js`
   - Port: `5000`

### 3.3 Configurar Variables de Entorno en Koyeb

En Koyeb → Tu servicio → Environment variables, añadir:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=EGchat2025!xK9mP3nQ7rL2vW8tY4uJ6hF1bN5cA0dE_prod_secret

# Firebase (pegar el JSON del service account en UNA sola línea)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"egchat-nativa",...}
FIREBASE_STORAGE_BUCKET=egchat-nativa.appspot.com
FIREBASE_DATABASE_URL=https://egchat-nativa-default-rtdb.firebaseio.com

# CORS (añadir URL de Koyeb cuando la tengas)
CORS_ALLOWED_ORIGINS=https://egchat-app.vercel.app,https://egchat-v2.vercel.app

# Opcionales
STRIPE_SECRET_KEY=sk_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...
```

> **Truco para el JSON del service account:** abre el archivo descargado, selecciona todo el contenido, y en la terminal ejecuta:
> `cat firebase-service-account.json | tr -d '\n'`
> Copia el resultado (una sola línea) y pégalo como valor de `FIREBASE_SERVICE_ACCOUNT`.

### 3.4 Obtener URL de Koyeb

Después del deploy exitoso, Koyeb te da una URL como:
```
https://egchat-[random].koyeb.app
```

Copia esa URL para el siguiente paso.

---

## FASE 4: Actualizar la App Móvil

### 4.1 Variables de entorno del cliente

Editar `egchat-mobile/.env` (crear si no existe):

```env
EXPO_PUBLIC_API_URL=https://egchat-production.up.railway.app

# Firebase cliente
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=egchat-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://egchat-xxxxx-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=egchat-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=egchat-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4.2 Instalar Firebase SDK en el cliente

```bash
cd egchat-mobile
npx expo install firebase
```

### 4.3 Actualizar supabase.ts

El archivo `egchat-mobile/src/supabase.ts` ya NO necesita conectarse a Supabase.
La presencia online ahora usa Firebase Realtime DB via `egchat-mobile/src/firebase.ts`.

En los componentes que usen `trackUserPresence` o `subscribeToOnlineUsers`, cambiar el import:

```ts
// ANTES
import { trackUserPresence, subscribeToOnlineUsers } from '../src/supabase';

// DESPUÉS
import { trackUserPresence, subscribeToOnlineUsers } from '../src/firebase';
```

Los demás imports de supabase.ts (subscribeToChat, typing, read receipts) ya son manejados
por el SSE desde el backend — no necesitan cambio.

### 4.4 Actualizar app.json

```json
"extra": {
  "apiUrl": "https://egchat-production.up.railway.app",
  ...
}
```

---

## FASE 5: Verificación

### 5.1 Checklist pre-lanzamiento

- [ ] Firebase Firestore: datos migrados visibles en Console
- [ ] Firebase Storage: archivos migrados
- [ ] Railway: backend desplegado sin errores
- [ ] Railway: variables de entorno configuradas
- [ ] App móvil: `EXPO_PUBLIC_API_URL` apunta a Railway
- [ ] Login funciona con usuarios migrados
- [ ] Mensajes funcionan (SSE activo)
- [ ] Presencia online funciona (Firebase Realtime DB)
- [ ] Upload de archivos funciona (Firebase Storage)
- [ ] Push notifications funcionan (FCM sin cambios)

### 5.2 Endpoints de diagnóstico (Koyeb)

```bash
# Estado del servidor
curl https://egchat-[random].koyeb.app/health

# Debug de configuración
curl https://egchat-[random].koyeb.app/debug
```

---

## Rollback

Si algo falla, para volver a Render + Supabase:

1. En `egchat-mobile/.env`: cambiar `EXPO_PUBLIC_API_URL` de vuelta a `https://egchat-api.onrender.com`
2. El `server/index.js` original no se modificó — está intacto
3. Supabase sigue activo hasta que lo desactives manualmente

---

## Costos estimados

| Servicio | Plan | Costo | Límites |
|---|---|---|---|
| **Koyeb** | Free | **$0/mes** | 512MB RAM, 2GB storage, 100GB bandwidth |
| **Firebase Firestore** | Spark (free) | **$0/mes** | 1GB storage, 50K lecturas/día |
| **Firebase Storage** | Spark (free) | **$0/mes** | 5GB storage, 1GB/día descarga |
| **Firebase Realtime DB** | Spark (free) | **$0/mes** | 1GB storage, 10GB/mes transfer |
| **Firebase FCM** | Siempre gratis | **$0/mes** | Sin límites |

**Total: $0/mes** ✅
