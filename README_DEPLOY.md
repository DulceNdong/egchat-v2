# 📱 EGCHAT - Guía de Instalación y Despliegue

## 🏗️ Arquitectura del Proyecto

```
EGCHAT/
├── 📱 Frontend (React + Vite + TypeScript)
│   ├── src/                 # Código fuente
│   ├── public/               # Assets estáticos
│   ├── dist/                 # Build para producción
│   └── manifest.json         # Configuración PWA
├── 🖥️ Backend (Node.js + Express + Supabase)
│   ├── server/               # Servidor API
│   │   ├── index.js         # Endpoints principales
│   │   ├── package.json     # Dependencias
│   │   └── .env.example    # Variables de entorno
│   └── supabase_schema.sql # Esquema de base de datos
└── 📦 Electron App           # Versión escritorio
    ├── electron.js           # Configuración principal
    ├── electron-debug.js     # Versión depuración
    └── simple-electron.js   # Versión simplificada
```

## 🔧 Configuración del Backend (Supabase)

### 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto: "EGCHAT-Production"
3. Espera a que se configure (2-3 minutos)

### 2. Configurar Base de Datos
```sql
-- Ejecuta este SQL en Supabase > SQL Editor
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 5000.00,
  currency VARCHAR(3) DEFAULT 'XAF',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'transfer_sent', 'transfer_received'
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50),
  reference TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Más tablas según el archivo supabase_schema.sql
```

### 3. Configurar Variables de Entorno
Crea `.env` en `server/`:
```env
# Copia de .env.example y rellena:
PORT=5000
JWT_SECRET=egchat_super_secret_key_2026_cambiar_esto
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...TU_KEY
```

## 🚀 Despliegue del Backend

### Opción 1: Render (Recomendado)
1. Sube el código a GitHub
2. Conecta tu repo en [Render.com](https://render.com)
3. Configura:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment Variables**: Agrega las variables del `.env`

### Opción 2: Railway
```bash
# Instalar CLI
npm install -g @railway/cli

# Login y desplegar
railway login
railway up
```

### Opción 3: Vercel
```bash
# Instalar CLI
npm install -g vercel

# Desplegar
vercel --prod server/
```

## 📱 Despliegue del Frontend

### 1. Build para Producción
```bash
# Instalar dependencias
npm install

# Build PWA
npm run build:pwa

# Archivos generados en dist/
```

### 2. Opciones de Hosting

#### Vercel (Recomendado para PWA)
```bash
# Instalar CLI
npm install -g vercel

# Desplegar
vercel --prod dist/
```

#### Netlify
```bash
# Build
npm run build:pwa

# Sube la carpeta dist/ a Netlify
```

#### Firebase Hosting
```bash
# Instalar CLI
npm install -g firebase-tools

# Login y deploy
firebase login
firebase init hosting
firebase deploy
```

## 🌐 Configuración de Dominios

### Frontend (PWA)
1. En tu hosting (Vercel/Netlify):
   - Dominio: `egchat-gq.com` (o tu dominio)
   - SSL: Automático
   - Redirect: `*.egchat-gq.com` → `egchat-gq.com`

### Backend API
1. En Render/Railway:
   - Custom domain: `api.egchat-gq.com`
   - CORS configurado para tu dominio

### Actualizar URLs
En `api.ts`:
```typescript
const BASE = 'https://api.egchat-gq.com'; // Tu API URL
```

## 📲 PWA - Instalación en Móviles

### Android
1. Abre `https://egchat-gq.com` en Chrome
2. Toca el ícono "Descargar" (⬇️)
3. Se instalará como app nativa
4. Funciona offline con Service Worker

### iOS
1. Abre `https://egchat-gq.com` en Safari
2. Toca "Compartir" → "Añadir a pantalla de inicio"
3. Se agregará al Home Screen
4. Abre como app nativa

## 🔗 Conexión Frontend ↔ Backend

### Verificar Conexión
```bash
# Backend debe responder:
curl https://api.egchat-gq.com/health

# Frontend debe conectar:
# En navegador: Console → Network → Ver llamadas a API
```

### Variables de Frontend
Crear `.env` en raíz:
```env
VITE_API_URL=https://api.egchat-gq.com
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_key
```

## 📱 App Móvil Nativa (Opcional)

### React Native
```bash
# Usar código existente en egchat-mobile/
cd egchat-mobile
npm install
npx expo start
```

### Capacitor
```bash
# Convertir PWA a nativa
npm install @capacitor/core @capacitor/cli
npx cap init EGCHAT
npx cap add android
npx cap add ios
npx cap run android
```

## 🔒 Seguridad

### JWT Tokens
- Duración: 30 días
- Secreto: Cambiar en producción
- Refresh: Implementar si es necesario

### CORS
```javascript
// En server/index.js
app.use(cors({ 
  origin: ['https://egchat-gq.com', 'https://www.egchat-gq.com'],
  credentials: true 
}));
```

### HTTPS
- Frontend: Automático en hosting
- Backend: Automático en Render/Railway

## 📊 Monitoreo

### Backend Health Check
```bash
# Endpoint de salud
curl https://api.egchat-gq.com/health
# Respuesta: {"status":"ok","timestamp":"..."}
```

### Logs
- **Render**: Dashboard → Logs
- **Vercel**: Dashboard → Functions → Logs
- **Supabase**: Dashboard → Logs

## 🚀 Comandos Útiles

```bash
# Desarrollo local
npm run dev                    # Frontend en :3001
cd server && npm start         # Backend en :5000

# Build
npm run build:pwa              # Build optimizado PWA
npm run preview:pwa             # Preview local del build

# Despliegue
vercel --prod dist/            # Frontend a Vercel
railway up                    # Backend a Railway
```

## 📞 Soporte y Mantenimiento

### Backup Automático
- **Supabase**: Settings → Database → Backups
- **Código**: GitHub con versiones
- **Assets**: CDN o hosting con redundancia

### Actualizaciones
1. **Backend**: Push a GitHub → Auto-deploy en Render
2. **Frontend**: Push a GitHub → Auto-deploy en Vercel
3. **PWA**: Service Worker actualiza automáticamente

## 🎯 Checklist de Producción

- [ ] Supabase configurado con tablas
- [ ] Variables de entorno seguras
- [ ] Backend desplegado y accesible
- [ ] Frontend build y desplegado
- [ ] PWA funcional en móviles
- [ ] HTTPS en ambos dominios
- [ ] CORS configurado correctamente
- [ ] Logs y monitoreo activos
- [ ] Backup automático configurado

---

## 🆘 Problemas Comunes

### CORS Error
```javascript
// En server/index.js, asegúrate:
app.use(cors({ 
  origin: 'https://TU_DOMINIO.com',
  credentials: true 
}));
```

### PWA No Instala
```html
<!-- En index.html, verifica manifest.json -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#00c8a0">
```

### API No Responde
```bash
# Verifica variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY
```

---

🎉 **¡Listo para producción!** 

Con esta configuración, EGCHAT estará completamente funcional y accesible desde cualquier dispositivo móvil como PWA nativa.
