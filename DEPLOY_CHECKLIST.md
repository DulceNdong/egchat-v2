# ✅ Checklist de Despliegue - EGCHAT

## 🔍 Verificación Actual

### Backend Status
- [x] **Código backend encontrado**: `server/index.js`
- [x] **Supabase integrado**: Cliente configurado
- [x] **Endpoints funcionales**: Auth, Wallet, LIA-25, User
- [x] **Variables de entorno**: `.env.example` disponible
- [x] **CORS configurado**: Origenes permitidos

### Frontend Status  
- [x] **PWA configurada**: `manifest.json` creado
- [x] **Service Worker**: `sw.js` implementado
- [x] **API Client**: `api.ts` conectando al backend
- [x] **Build optimizado**: `vite.config.pwa.ts` listo
- [x] **Mobile responsive**: Diseño adaptado

### Conexión Backend ↔ Frontend
- [x] **API URL**: Configurada en `api.ts`
- [x] **JWT Authentication**: Token management implementado
- [x] **Error handling**: Try/catch en peticiones
- [x] **Environment variables**: `.env` para producción

## 🚀 Pasos para Despliegue Completo

### 1. Configurar Supabase (5 min)
```bash
# 1. Crear proyecto en supabase.com
# 2. Ejecutar SQL del archivo: supabase_schema.sql
# 3. Copiar URL y Service Key
# 4. Crear .env en server/ con las credenciales
```

### 2. Desplegar Backend (10 min)
```bash
# Opción A: Render (recomendado)
git add .
git commit -m "Backend ready for production"
git push origin main
# Conectar repo en render.com + configurar variables

# Opción B: Railway
cd server
railway up
```

### 3. Build Frontend PWA (2 min)
```bash
npm run build:pwa
# Se genera carpeta dist/ con todo optimizado
```

### 4. Desplegar Frontend (5 min)
```bash
# Opción A: Vercel (recomendado)
vercel --prod dist/

# Opción B: Netlify
# Subir carpeta dist/ a Netlify
```

### 5. Configurar Dominios (5 min)
```bash
# Frontend: egchat-gq.com (Vercel)
# Backend: api.egchat-gq.com (Render)
# Actualizar URL en api.ts
```

## 📱 Test de Funcionalidad Móvil

### Android Test
1. Abrir Chrome móvil: `https://egchat-gq.com`
2. Menú ⋯ → "Add to Home screen"
3. Verificar icono en launcher
4. Probar offline functionality

### iOS Test  
1. Abrir Safari: `https://egchat-gq.com`
2. Share → "Add to Home Screen"
3. Verificar icono en Home Screen
4. Probar como app nativa

## 🔗 Verificación de Conexión

### API Health Check
```bash
# Test backend
curl https://api.egchat-gq.com/health
# Esperado: {"status":"ok","timestamp":"..."}

# Test frontend
# Abrir https://egchat-gq.com
# Console → Network → Ver llamadas a API
```

### Autenticación Test
```javascript
// En browser console
localStorage.setItem('token', 'test');
// Verificar que las llamadas incluyan Authorization header
```

## 📊 Monitoreo Post-Despliegue

### Dashboard URLs
- **Supabase**: `https://app.supabase.com/project/...`
- **Render**: `https://dashboard.render.com/...`
- **Vercel**: `https://vercel.com/dashboard`

### Logs a Monitorear
```bash
# Backend logs (Render)
# Dashboard → Logs → Ver errores 500, auth, database

# Frontend logs (Vercel)  
# Dashboard → Functions → Ver errores de red

# Supabase logs
# Dashboard → Logs → Database errors
```

## 🆘 Troubleshooting Rápido

### Error: "CORS policy"
```javascript
// Solución: En server/index.js
app.use(cors({ 
  origin: ['https://egchat-gq.com', 'https://www.egchat-gq.com'],
  credentials: true 
}));
```

### Error: "Token inválido"
```bash
# Verificar JWT_SECRET coincide
# Limpiar localStorage en frontend
```

### Error: "Supabase connection failed"
```bash
# Verificar SUPABASE_URL y SUPABASE_SERVICE_KEY
# Probar conexión directa en Supabase dashboard
```

### PWA no instala
```html
<!-- Verificar en index.html -->
<link rel="manifest" href="/manifest.json">
<meta name="mobile-web-app-capable" content="yes">
```

## 🎯 Estado Actual del Proyecto

### ✅ Completado
- Backend API con Supabase
- Frontend PWA con React
- Sistema de autenticación JWT
- Wallet y transacciones
- LIA-25 assistant
- Configuración móvil
- Service Worker offline

### 🔄 Por Configurar
- [ ] Credenciales Supabase producción
- [ ] Dominios personalizados
- [ ] Deploy en hosting
- [ ] Tests móviles reales

### 📈 Próximos Pasos
1. **Configurar Supabase producción**
2. **Desplegar backend en Render**
3. **Build y deploy frontend PWA**
4. **Test en dispositivos reales**
5. **Monitoreo y mantenimiento**

---

## 🚀 Comandos de Deploy

```bash
# 1. Preparar todo
git add .
git commit -m "Production ready - EGCHAT v1.0"
git push origin main

# 2. Backend (Render)
# Conectar repo y configurar variables en dashboard.render.com

# 3. Frontend (Vercel)  
npm run build:pwa
vercel --prod dist/

# 4. Verificar
curl https://api.egchat-gq.com/health
# Abrir https://egchat-gq.com en móvil
```

🎉 **Con estos pasos, EGCHAT estará 100% funcional y accesible globalmente!**
