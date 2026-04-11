# 📊 Cómo Ver los Usuarios en EGCHAT

## Opción 1: Supabase Dashboard (Recomendado)

1. **Accede a Supabase:**
   - Abre: https://supabase.com/
   - Inicia sesión con tus credenciales

2. **Navega a tu proyecto:**
   - Project ID: `dpkfwlzikmdvhqxhyfmz`
   - O busca "EGCHAT" en proyectos

3. **Ve a la vista de datos:**
   - Lado izquierdo: "Database" → "Tables"
   - Busca la tabla "users"
   - Haz clic para ver todos los usuarios

4. **Información que verás:**
   - phone: Número de teléfono
   - full_name: Nombre completo
   - avatar_url: Enlace a la foto de perfil
   - created_at: Fecha de registro
   - is_active: Si la cuenta está activa

---

## Opción 2: Consulta SQL en Supabase

En Supabase, ve a **SQL Editor** y ejecuta:

```sql
-- Ver TODOS los usuarios
SELECT 
  phone, 
  full_name, 
  avatar_url, 
  created_at, 
  is_active,
  last_login
FROM users
ORDER BY created_at DESC;
```

---

## Opción 3: Consultar desde el Backend

Usar la API del backend:

```bash
curl -X GET "https://egchat-api.onrender.com/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Nota: Verifica que exista este endpoint en el backend.

---

## 📋 Estructura de la Tabla Users

```
id              → UUID único (ej: 550e8400-e29b-41d4-a716-446655440000)
phone           → Número teléfono (ej: +240123456789)
full_name       → Nombre completo (ej: Juan Pérez)
password        → Hash de contraseña (NO se muestra)
avatar_url      → URL de foto de perfil (ej: data:image/jpeg;...)
created_at      → Fecha de registro (ej: 2026-04-09T10:30:00Z)
last_login      → Último acceso (ej: 2026-04-09T15:45:00Z)
is_active       → ¿Cuenta activa? (true/false)
```

---

## 🔍 Acciones que puedes hacer

En Supabase Dashboard puedes:
- ✅ Ver todos los usuarios
- ✅ Editar información de usuarios
- ✅ Eliminar usuarios (cuidado)
- ✅ Buscar por teléfono o nombre
- ✅ Ver estadísticas
- ✅ Exportar datos a CSV

---

## 💡 Para ver usuarios que se registraron en tu app:

1. Los usuarios aparecen cuando hacen **sign up** en la app
2. Se guarda su teléfono, nombre y contraseña (hasheada)
3. Si subieron foto, se almacena como enlace
4. Pueden hacer **login** luego con phone + password

---

## 📞 Problemas comunes

**Pregunta:** "No veo usuarios, ¿está vacía la base de datos?"
**Respuesta:** Los usuarios solo aparecen cuando se registran en la app. 
- Prueba registrando un usuario en: http://localhost:3002
- Luego verifica en Supabase

**Pregunta:** "¿Cómo accedo a Supabase sin saber mi contraseña?"
**Respuesta:** Usa tu email de GitHub o Google para recuperar acceso.