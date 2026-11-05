# 🔐 Solución: Error de Permisos en EAS

## ❌ El Problema

```
Entity Not Authorized: Entity not authorized
```

**Causa:** Estás logueado como `reddington120` pero el proyecto pertenece a `dutti98`

---

## ✅ Soluciones (Elige una)

### Solución 1: Login con dutti98 (Recomendado) ⭐

**Si tienes acceso a la cuenta dutti98:**

```bash
cd egchat-mobile

# 1. Logout de la cuenta actual
eas logout

# 2. Login con dutti98
eas login
# Usa las credenciales de dutti98

# 3. Verificar que funcionó
eas whoami
# Debe mostrar: dutti98

# 4. Continuar con la configuración
./complete-eas-setup.sh
```

---

### Solución 2: Cambiar owner a tu cuenta

**Si NO tienes acceso a dutti98:**

```bash
cd egchat-mobile

# 1. Hacer backup
cp app.json app.json.backup

# 2. Editar app.json
# Cambia la línea:
"owner": "dutti98"
# Por:
"owner": "reddington120"

# 3. Crear nuevo proyecto en tu cuenta
eas init

# 4. Continuar normalmente
./complete-eas-setup.sh
```

**⚠️ NOTA:** Esto creará un NUEVO proyecto en tu cuenta. Perderás acceso al proyecto original de dutti98.

---

### Solución 3: Agregar colaborador

**Si dutti98 puede agregarte:**

1. **dutti98** debe:
   - Ir a: https://expo.dev/accounts/dutti98/projects/egchat-mobile/settings
   - Click en "Members"
   - Agregar: `reddington120` (patron.bernardo111@gmail.com)
   - Darle rol: **Admin**

2. **Tú** debes:
   ```bash
   # Esperar confirmación por email
   # Luego ejecutar:
   eas whoami
   ./complete-eas-setup.sh
   ```

---

## 🚀 Solución Rápida (Script Automático)

Ejecuta este script que te guiará:

```bash
cd egchat-mobile
./fix-login.sh
```

El script te preguntará qué solución prefieres y la aplicará automáticamente.

---

## 🔍 Verificar que funcionó

Después de aplicar cualquier solución:

```bash
# 1. Verificar usuario actual
eas whoami

# 2. Debe mostrar uno de estos:
#    - dutti98 (Solución 1)
#    - reddington120 (Solución 2)
#    - reddington120 con acceso a dutti98/egchat-mobile (Solución 3)

# 3. Probar acceso al proyecto
eas credentials --platform ios

# 4. Si funciona, continúa
./complete-eas-setup.sh
```

---

## 📋 Información del Proyecto

- **Owner actual:** dutti98
- **Project ID:** 8fde846d-979b-468a-933d-2768cc5cd39f
- **Tu usuario:** reddington120 (patron.bernardo111@gmail.com)

---

## 🆘 ¿Cuál solución usar?

| Situación | Solución recomendada |
|-----------|---------------------|
| Tienes acceso a dutti98 | ✅ Solución 1 (Login como dutti98) |
| NO tienes acceso a dutti98 y es tu proyecto | ✅ Solución 2 (Cambiar owner) |
| Es proyecto de equipo | ✅ Solución 3 (Agregar colaborador) |
| No estás seguro | 🔧 Ejecuta `./fix-login.sh` |

---

## 📝 Comandos útiles

```bash
# Ver usuario actual
eas whoami

# Cambiar de cuenta
eas logout
eas login

# Ver proyectos de tu cuenta
eas project:list

# Ver información del proyecto actual
cat app.json | grep owner
cat app.json | grep projectId
```

---

## ✅ Próximos pasos

Una vez solucionado el problema de permisos:

1. ✅ Verifica el login: `eas whoami`
2. ✅ Ejecuta: `./complete-eas-setup.sh`
3. ✅ Configura Push Notifications
4. ✅ Haz tu primer build

---

## 💡 Recomendación

**Si este es TU proyecto:**
- Usa Solución 2 (cambiar owner a tu cuenta)

**Si trabajas en equipo:**
- Usa Solución 3 (agregar colaborador)
- O Solución 1 (compartir cuenta dutti98)

---

**¿Listo?** Ejecuta:

```bash
./fix-login.sh
```

🚀 ¡Vamos!
