# Guía de despliegue EGCHAT

## 1) Repositorio Git

Repo remoto actual:
- origin: https://github.com/DulceNdong/egchat-v2.git

### Pasos
1. Asegúrate de que todos los cambios estén commitados.
2. Haz push a GitHub.
3. Conecta el repositorio en Vercel.

## 2) Vercel (frontend)

Proyecto: frontend Vite

### Variables de entorno en Vercel
- VITE_API_URL = https://egchat-api.onrender.com
- VITE_APP_URL = https://egchat-v2.vercel.app
- VITE_APP_VERSION = 2.5.3
- VITE_ENV = production
- VITE_GOOGLE_MAPS_API_KEY = AIzaSyDemoKeyForTestingPurposes
- VITE_MAPTILER_KEY = bg3FUa7es7Qn1TITIWjO

### Build settings
- Build Command: npm run build
- Output Directory: dist

## 3) Render (backend)

Servicio web Node.js apuntando a la carpeta egchat-api

### Build Command
- cd egchat-api && npm install

### Start Command
- cd egchat-api && npm start

### Variables de entorno en Render
- PORT = 5000
- NODE_ENV = production
- JWT_SECRET = egchat_super_secret_key_2026_production
- APP_VERSION = 2.5.1
- CORS_ALLOWED_ORIGINS = https://egchat-app.vercel.app,https://egchat-v2.vercel.app,http://localhost:3001,http://localhost:5173,http://localhost:3000,http://127.0.0.1:3001
- SUPABASE_URL = TU_URL_DE_SUPABASE
- SUPABASE_SERVICE_KEY = TU_SERVICE_ROLE_KEY
- LOCAL_AUTH_FALLBACK = true

## 4) Supabase

Crea o usa un proyecto de Supabase y ejecuta el SQL de:
- egchat-api/supabase_schema.sql

### Importante
- La tabla stories debe existir con las columnas:
  - id
  - user_id
  - media
  - type
  - views
  - reactions
  - replies
  - expires_at
  - created_at

## 5) Validación final

- Frontend en Vercel
- Backend en Render
- Base de datos en Supabase

Prueba:
- login/register
- crear estado
- ver estados
- responder estado
- chat
- wallet
