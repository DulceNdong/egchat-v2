# 🚀 Instrucciones de Deploy - Backend EGCHAT

## ✅ Estado del Código

**Archivo actualizado**: `server/index.js` (línea 2445)  
**Cambio**: Ruta `/api/wallet/transfer` mejorada con validaciones completas  
**Commits pendientes**: 4 commits listos para push

---

## 🎯 MÉTODO 1: Push desde Terminal (Más Rápido)

Abre tu Terminal y ejecuta:

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/server
git push origin main
```

**Si pide usuario/contraseña:**
- Usuario: `DulceNdong`
- Contraseña: Tu GitHub Personal Access Token

**Si no tienes token**: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Selecciona scope: `repo` (acceso completo)
- Copia el token y úsalo como contraseña

---

## 🎯 MÉTODO 2: Deploy Manual desde Render (Sin Push)

1. Ve a: https://dashboard.render.com/
2. Inicia sesión
3. Busca el servicio: `egchat-api`
4. En la esquina superior derecha, click: **"Manual Deploy"**
5. Selecciona: **"Clear build cache & deploy"**
6. Espera 3-5 minutos

**Nota**: Render puede leer los commits locales si tienes el repo conectado.

---

## 🎯 MÉTODO 3: Aplicar Cambios Directamente en Render

Si ninguno funciona, edita directamente en Render:

1. Ve a: https://dashboard.render.com/
2. Abre `egchat-api` → **Environment** → **Shell**
3. Ejecuta:

```bash
nano index.js
```

4. Ve a la línea 2445 (busca `app.post('/api/wallet/transfer'`)
5. Reemplaza toda la función con el código del archivo: `CAMBIO_WALLET_TRANSFER.js`
6. Guarda: `Ctrl+O`, Enter, `Ctrl+X`
7. Reinicia el servicio desde el dashboard

---

## 📊 Verificación de Deploy

Después del deploy, verifica que funciona:

```bash
curl -X POST https://egchat-api.onrender.com/api/wallet/transfer \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"+240222111111","amount":1000,"concept":"test"}'
```

**Respuesta esperada** (si funciona):
```json
{
  "success": true,
  "balance": XXXX,
  "recipient": "Nombre Usuario",
  "message": "Transferencia completada exitosamente"
}
```

**Si ves error 404**: El deploy no se completó  
**Si ves error 401**: Normal, necesitas token válido  
**Si ves error 400**: El backend está funcionando correctamente

---

## 🔍 Logs de Render

Para ver si el deploy fue exitoso:

1. https://dashboard.render.com/
2. Abre `egchat-api`
3. Ve a la pestaña **"Logs"**
4. Busca: `Server running on port 10000`

---

## ⚡ MÉTODO RÁPIDO (Si tienes GitHub Desktop)

1. Abre GitHub Desktop
2. Selecciona el repositorio `egchat-api`
3. Verás 4 commits pendientes
4. Click en **"Push origin"**
5. Render detectará el push automáticamente

---

## 📝 Resumen de Cambios

La ruta `/api/wallet/transfer` ahora incluye:

✅ Validación de destinatario y monto (máximo 10M XAF)  
✅ Búsqueda inteligente por UUID, teléfono o nombre  
✅ Prevención de auto-transferencias  
✅ Actualización bidireccional de wallets (remitente + destinatario)  
✅ Registro completo de transacciones en ambos lados  
✅ Manejo robusto de errores con try-catch  
✅ Logs detallados en consola para debugging

---

## 🆘 Si Todo Falla

Contacta al soporte de Render o:

1. Descarga el archivo `CAMBIO_WALLET_TRANSFER.js`
2. Copia el código
3. Aplícalo manualmente en el archivo `index.js` en GitHub
4. Haz commit desde GitHub web interface
5. Render hará auto-deploy

---

**Última actualización**: $(date)
