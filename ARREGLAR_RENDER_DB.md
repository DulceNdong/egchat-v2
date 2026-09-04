# 🔧 ARREGLAR BASE DE DATOS EN RENDER

## Problema actual
Render está usando Neon (PostgreSQL) que superó la cuota gratuita.  
Por eso `/api/chats` devuelve lista vacía — no puede leer la base de datos.

## Solución
Cambiar de Neon → Supabase (que ya tiene todos los datos y funciona perfectamente).

---

## Pasos en Render.com

1. **Ir a tu servicio:**
   - https://dashboard.render.com
   - Selecciona el servicio `egchat-api` (o como se llame)

2. **Ir a Environment:**
   - Click en **Environment** en el menú izquierdo

3. **ELIMINAR la variable `DATABASE_URL`:**
   - Busca la variable `DATABASE_URL`
   - Click en el botón **Delete** o **Remove** a la derecha
   - **NO cambies su valor — elimínala completamente**

4. **Verificar que estas variables EXISTEN:**
   ```
   SUPABASE_URL=https://dptpdifjqgzccjauhodq.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdHBkaWZqcWd6Y2NqYXVob2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgyMTU4MSwiZXhwIjoyMDkyMzk3NTgxfQ.Qy5D7X-VmWS4j1X9_8aJ3L1zPZQmKvNwR0YtE8xF2D4
   ```
   
   **Si NO existen, añádelas:**
   - Click en **Add Environment Variable**
   - Key: `SUPABASE_URL`
   - Value: `https://dptpdifjqgzccjauhodq.supabase.co`
   - Repetir para `SUPABASE_SERVICE_KEY`

5. **Guardar y redeploy:**
   - Click en **Save Changes**
   - Render automáticamente hará redeploy

6. **Esperar 2-3 minutos** y probar:
   ```
   https://egchat-api.onrender.com/health
   ```
   
   Debe devolver:
   ```json
   {
     "status": "ok",
     "db": "ok",
     "db_provider": "supabase"
   }
   ```

---

## ¿Cómo funciona?

El código del backend tiene esta lógica:

```javascript
if (process.env.DATABASE_URL) {
  // Usar Neon (PostgreSQL directo) ❌ ROTO
  supabase = require('./pg-client.cjs');
} else {
  // Usar Supabase client ✅ FUNCIONA
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}
```

Al eliminar `DATABASE_URL`, el backend automáticamente cambia a Supabase.

---

## Verificar que funcionó

1. Abre en el navegador:
   ```
   https://egchat-api.onrender.com/health
   ```

2. Debes ver:
   ```json
   {
     "status": "ok",
     "db": "ok",
     "db_provider": "supabase"
   }
   ```

3. Recarga la app nativa:
   - http://localhost:8081
   - Ve a Mensajería
   - Los chats deberían aparecer

---

## Si necesitas la SERVICE_KEY de Supabase

Ve a: https://supabase.com/dashboard/project/dptpdifjqgzccjauhodq/settings/api

**API Settings** → **Project API keys** → Copia el **service_role** key (no la anon key).

---

**Esto no requiere cambios en el código — solo configuración en Render.**
