# 🚀 DEPLOY URGENTE - Backend EGCHAT

## ⚡ ACCIÓN INMEDIATA REQUERIDA

El código está listo pero necesita deployarse a Render.

---

## 🎯 OPCIÓN 1: Push desde Terminal (60 segundos)

**Abre tu Terminal y ejecuta esto:**

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/server
git push origin main
```

Si pide usuario/token:
- Usuario: `DulceNdong`  
- Password: Tu GitHub Personal Access Token (créalo aquí si no tienes: https://github.com/settings/tokens)

---

## 🎯 OPCIÓN 2: Deploy Manual desde Render (2 minutos)

### Pasos exactos:

1. **Abre en Safari/Chrome**: https://dashboard.render.com/
2. **Inicia sesión** con tu cuenta
3. **Busca** en la lista: `egchat-api`
4. **Click** en el servicio
5. En la esquina superior derecha, click: **"Manual Deploy"**
6. Selecciona: **"Clear build cache & deploy"**
7. **Espera 3-5 minutos** (verás los logs en tiempo real)

### ✅ Sabrás que funcionó cuando veas en los logs:
```
Server running on port 10000
```

---

## 🎯 OPCIÓN 3: Script Automático (30 segundos)

Abre Terminal y ejecuta:

```bash
/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/verificar-deploy.sh
```

Esto verifica si el deploy es necesario y te da instrucciones.

---

## 📊 ESTADO ACTUAL

✅ **Código actualizado localmente**:  
   - Archivo: `server/index.js`  
   - Línea: 2445  
   - Función: `app.post('/api/wallet/transfer')`

✅ **Commits listos** (4 pendientes):
   ```
   3433f44 fix: mejorar /api/wallet/transfer con validaciones completas
   c5c3b37 auto: update backend
   de1ed93 auto: update backend
   2442c81 auto: update backend
   ```

❌ **Deploy pendiente**:  
   - Render tiene código antiguo  
   - Error 404 persistirá hasta el deploy

---

## 🔍 CÓMO VERIFICAR QUE FUNCIONÓ

Después del deploy, abre Terminal y ejecuta:

```bash
curl -X POST https://egchat-api.onrender.com/api/wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{"to":"","amount":0}'
```

**Respuesta esperada** (código nuevo):
```json
{"message":"Token requerido"}  ← Si sale esto, aún es código viejo
{"message":"Destinatario y monto requeridos"}  ← Si sale esto, ¡FUNCIONÓ!
```

---

## 🆘 SI NADA FUNCIONA

### Plan B: Editar directamente en GitHub

1. Ve a: https://github.com/DulceNdong/egchat-api
2. Click en el archivo: `index.js`
3. Click en el ícono de lápiz (Edit)
4. Ve a la línea 2445
5. Busca: `app.post('/api/wallet/transfer'`
6. **Copia y pega** el contenido del archivo:  
   `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/CAMBIO_WALLET_TRANSFER.js`
7. Scroll hasta abajo
8. Commit message: `fix: mejorar wallet transfer con validaciones`
9. Click: **"Commit changes"**
10. Render hará auto-deploy en 2-3 minutos

---

## 📱 PRUEBA DESDE LA APP

Después del deploy exitoso:

1. Abre EGCHAT mobile
2. Ve a un contacto
3. Click en "Enviar" (💸)
4. Introduce monto: `1000`
5. Click "Enviar a [Contacto]"

**Resultado esperado**:
- ✅ Si funciona: Mensaje de éxito + saldo actualizado
- ❌ Si falla con 404: Deploy no completado (intenta Opción 2)

---

## 🎯 ¿QUÉ OPCÓN ELIJO?

| Situación | Opción recomendada |
|---|---|
| Tienes acceso a Terminal | **Opción 1** (más rápido) |
| No funciona push | **Opción 2** (100% confiable) |
| Todo falla | **Plan B** (editar en GitHub) |

---

## ⏰ TIEMPO ESTIMADO

- **Opción 1**: 1-2 minutos (push + auto-deploy)
- **Opción 2**: 3-5 minutos (deploy manual)
- **Plan B**: 4-6 minutos (editar + commit + auto-deploy)

---

**¿Necesitas ayuda?** Los archivos de referencia están en:

- `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/INSTRUCCIONES_DEPLOY.md`
- `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/CAMBIO_WALLET_TRANSFER.js`
- `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/verificar-deploy.sh`

---

**Última verificación**: La API de Render responde pero con código antiguo.  
**Acción requerida**: Deploy manual o push para activar el código nuevo.

---

## ✅ CHECKLIST

- [ ] Ejecuté una de las 3 opciones
- [ ] Vi "Clear build cache & deploy" en Render (si usé Opción 2)
- [ ] Esperé 3-5 minutos para el deploy
- [ ] Verifiqué con el comando curl
- [ ] Probé desde la app móvil

