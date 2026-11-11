# Implementation Plan — 4 Bug Fixes

> Archivos a modificar:
> - `egchat-mobile/app/moments.tsx`
> - `egchat-mobile/app/chat/[id].tsx`
> - `egchat-mobile/app/contacts.tsx`
> - `egchat-mobile/app/ajustes/privacidad.tsx`

---

## BUG 1 — moments.tsx: eliminar momento no llama al backend

### Diagnóstico confirmado

**Archivo:** `egchat-mobile/app/moments.tsx`

**Bloque afectado — línea 240–241** (dentro de `renderPost`, en el `TouchableOpacity` de los tres puntos del menú de opciones del post):

```tsx
// Línea 240-241 — ACTUAL (solo filtra estado local, no llama API):
onPress={() => Alert.alert('Post', 'Opciones', [
  { text: 'Eliminar', style: 'destructive', onPress: () => setPosts(p => p.filter(x => x.id !== item.id)) },
  { text: 'Cancelar', style: 'cancel' },
])}
```

**Imports existentes:** `getToken` y `getApiBase` ya están importados desde `'../src/api'` (línea 16). `useCallback` ya está importado (línea 5). No se necesita ningún import nuevo.

### Fix a aplicar

**Paso 1:** Añadir función `deleteMoment` junto a las otras funciones de API locales (después de `addComment`, aproximadamente antes de la línea 154 donde comienza `MomentsScreen`). Colocar justo después del cierre de `addComment`:

```ts
async function deleteMoment(postId: string): Promise<void> {
  const BASE = getApiBase();
  const token = await getToken();
  await fetch(`${BASE}/api/moments/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

**Paso 2:** Reemplazar el `onPress` del botón de tres puntos (líneas 240–242) con patrón optimistic + fire-and-forget:

```tsx
// NUEVO — optimistic update + llamada API en background:
onPress={() => Alert.alert('Post', 'Opciones', [
  {
    text: 'Eliminar', style: 'destructive',
    onPress: () => {
      // Optimistic: quitar de UI inmediatamente
      setPosts(p => p.filter(x => x.id !== item.id));
      // Llamar al backend en background, silenciar error
      deleteMoment(item.id).catch(() => {});
    },
  },
  { text: 'Cancelar', style: 'cancel' },
])}
```

**Consideración TypeScript:** `deleteMoment` devuelve `Promise<void>` — no hay tipos problemáticos. `renderPost` no es un `useCallback` (es función flecha inline en el componente), así que `deleteMoment` del scope del módulo es accesible directamente.

**Verificar:** Build TypeScript sin errores con `npx expo start --web` desde `egchat-mobile/`.

---

## BUG 2 — chat/[id].tsx: mensajes seleccionados no desaparecen tras eliminar

### Diagnóstico confirmado

**Archivo:** `egchat-mobile/app/chat/[id].tsx`

**Función:** `handleDeleteSelected` — **líneas 2045–2068**

**Código actual (líneas 2057–2064):**

```tsx
onPress: async () => {
  // Eliminar en servidor (para todos)
  await Promise.allSettled(idsSnapshot.map(id => chatAPI.deleteMessage(id)));
  // Eliminar del estado local usando el snapshot capturado
  setMessages(prev => prev.filter(m => !idsSet.has(m.id)));
  exitSelectMode();
},
```

**El problema real:** La llamada al servidor es `await` — si Render tarda (cold start, 30–50 s), el usuario espera toda esa latencia antes de que la UI refleje la eliminación y el modo de selección se cierre. El orden correcto es: (1) update de UI primero, (2) salir del modo selección, (3) llamada al servidor fire-and-forget.

**Nota sobre `handleDelete` (línea 1153):** Ya usa patrón optimistic correcto (`setMessages` primero, luego `await chatAPI.deleteMessage` con rollback en catch). No tocar.

### Fix a aplicar

Reemplazar el `onPress` del Alert dentro de `handleDeleteSelected` (líneas 2058–2064) con el orden reordenado:

```tsx
onPress: () => {
  // 1. Update optimista — UI responde inmediatamente
  setMessages(prev => prev.filter(m => !idsSet.has(m.id)));
  // 2. Salir del modo selección
  exitSelectMode();
  // 3. Sincronizar con servidor fire-and-forget
  Promise.allSettled(idsSnapshot.map(id => chatAPI.deleteMessage(id))).catch(() => {});
},
```

**Cambio clave:** `async () =>` → `() =>` (ya no necesita ser async). `await` eliminado de `Promise.allSettled`. `exitSelectMode()` se mueve después del filtro, antes del servidor.

**Consideración TypeScript:** Sin cambios de tipos. `idsSnapshot` y `idsSet` siguen siendo `string[]` y `Set<string>` capturados en el closure antes de que Alert abra — correcto.

**Verificar:** Build TypeScript sin errores. Test manual: seleccionar mensajes → eliminar → la UI debe limpiar instantáneamente sin esperar respuesta del servidor.

---

## BUG 3 — contacts.tsx: eliminar contacto silencia errores sin rollback

### Diagnóstico confirmado

**Archivo:** `egchat-mobile/app/contacts.tsx`

**Función:** `removeContact` — **líneas 154–163**

**Código actual (líneas 158–162):**

```tsx
onPress: async () => {
  await contactsAPI.remove(id).catch(() => {});
  setContacts(prev => prev.filter(c => c.id !== id));
},
```

**El problema real:** `.catch(() => {})` silencia el error del API. Si el servidor falla, el contacto desaparece visualmente pero sigue existiendo en la base de datos. Al hacer pull-to-refresh, reaparece, confundiendo al usuario.

**Imports existentes:** `load` ya está definida en el componente (línea 126, `useCallback`). `Alert` ya está importado (línea 4). No se necesita ningún import nuevo.

### Fix a aplicar

Reemplazar el `onPress` dentro de `removeContact` (líneas 158–162) con patrón optimistic + rollback:

```tsx
onPress: async () => {
  // Optimistic: quitar de UI inmediatamente
  setContacts(prev => prev.filter(c => c.id !== id));
  try {
    await contactsAPI.remove(id);
  } catch {
    // Rollback: recargar lista real desde servidor
    load();
    Alert.alert('Error', 'No se pudo eliminar el contacto. Verifica tu conexión.');
  }
},
```

**Consideración TypeScript:** `load` está tipada como `(isRefresh?: boolean) => Promise<void>` — llamarla sin argumentos es válido. Sin cambios de tipos.

**Verificar:** Build TypeScript sin errores. Test manual: eliminar contacto sin conexión → debe reaparecer + mostrar alert de error.

---

## BUG 4+5 — ajustes/privacidad.tsx: eliminar cuenta no funciona ni redirige al login

### Diagnóstico confirmado

**Archivo:** `egchat-mobile/app/ajustes/privacidad.tsx`

**Bloque afectado — líneas 251–261** (el `SettingsRow` de "Eliminar mi cuenta" al final del componente):

```tsx
// Líneas 251–261 — ACTUAL (solo muestra mensaje, no hace nada):
<SettingsRow
  label="Eliminar mi cuenta"
  danger
  onPress={() =>
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción eliminará permanentemente tu cuenta, mensajes y datos. Para proceder, contacta al soporte en support@egchat.gq',
      [{ text: 'Entendido', style: 'cancel' }],
    )
  }
/>
```

**Estado de imports existentes:**

| Import necesario | ¿Existe? | Línea |
|---|---|---|
| `useCallback` de 'react' | ✅ Sí | línea 1 |
| `getToken` de '../../src/api' | ✅ Sí | línea 9 |
| `getApiBase` de '../../src/api' | ✅ Sí | línea 9 |
| `router` de 'expo-router' | ❌ **NO** | — |
| `authAPI` de '../../src/api' | ❌ **NO** | — |

**Dos imports faltan** y deben añadirse.

### Fix a aplicar

**Paso 1:** Añadir los imports faltantes. Modificar línea 1 (import de react — no cambia) y añadir después de línea 9:

En la **línea 1**, ya existe:
```tsx
import React, { useEffect, useState, useCallback } from 'react';
```
No cambiar.

En la **línea 9**, cambiar de:
```tsx
import { getToken, getApiBase } from '../../src/api';
```
a:
```tsx
import { getToken, getApiBase, authAPI } from '../../src/api';
```

Añadir nueva línea después de los imports actuales (después de línea 11, antes del primer `//` de comentario):
```tsx
import { router } from 'expo-router';
```

**Paso 2:** Añadir función `handleDeleteAccount` dentro del componente `PrivacidadScreen`, justo antes del `return` (después de `createLocalDataExport`, aproximadamente línea 165). Usar `useCallback` con array de dependencias vacío ya que no depende de estado:

```tsx
const handleDeleteAccount = useCallback(() => {
  Alert.alert(
    'Eliminar cuenta',
    '¿Estás seguro? Esta acción es permanente. Se eliminarán todos tus mensajes, contactos y datos.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, eliminar', style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Confirmación final',
            'Esta es tu última oportunidad. ¿Confirmas que quieres eliminar permanentemente tu cuenta?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar definitivamente', style: 'destructive',
                onPress: async () => {
                  try {
                    const token = await getToken();
                    const base = getApiBase();
                    await fetch(`${base}/api/auth/delete-account`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                  } catch {
                    // Silenciar error de servidor — proceder siempre al logout
                  }
                  // Siempre hacer logout y redirigir al login
                  await authAPI.logout();
                  router.replace('/(auth)/login');
                },
              },
            ],
          );
        },
      },
    ],
  );
}, []);
```

**Paso 3:** Reemplazar el `onPress` del `SettingsRow` "Eliminar mi cuenta" (líneas 253–260) con la referencia a la nueva función:

```tsx
// NUEVO — reemplaza el bloque onPress={() => Alert.alert(...)} existente:
<SettingsRow
  label="Eliminar mi cuenta"
  danger
  onPress={handleDeleteAccount}
/>
```

**Consideración TypeScript:** `router.replace` acepta `'/(auth)/login'` como ruta estática — es la misma sintaxis usada en otros archivos del proyecto. `authAPI.logout()` devuelve `Promise<void>` — await es correcto. No hay cambios de tipos.

**Consideración UX:** El doble Alert (confirmación + confirmación final) protege contra toques accidentales. Si el endpoint `/api/auth/delete-account` no existe todavía en el backend, el `catch` silencioso garantiza que el logout ocurre igualmente y el usuario sale de la app — comportamiento correcto.

**Verificar:** Build TypeScript sin errores. Test manual: Ajustes → Privacidad → Eliminar mi cuenta → confirmar dos veces → debe redirigir a pantalla de login.

---

## Resumen de cambios por archivo

| Archivo | Líneas afectadas | Tipo de cambio |
|---|---|---|
| `app/moments.tsx` | ~135–145 (nueva fn) + 240–242 (onPress) | Añadir `deleteMoment` + fix optimistic |
| `app/chat/[id].tsx` | 2058–2064 (onPress del Alert) | Reordenar: UI → exitSelect → API fire-and-forget |
| `app/contacts.tsx` | 158–162 (onPress del Alert) | Optimistic + rollback con `load()` |
| `app/ajustes/privacidad.tsx` | 9 (import) + ~11 (import) + ~165 (fn) + 253–260 (onPress) | Añadir imports + función + conectar botón |

## Orden de implementación

1. `contacts.tsx` — cambio más pequeño, bajo riesgo
2. `moments.tsx` — añadir función nueva + fix onPress
3. `chat/[id].tsx` — reordenar tres líneas dentro del onPress
4. `ajustes/privacidad.tsx` — mayor superficie: imports + función + botón

## Verificación global

Después de todos los cambios, ejecutar desde `egchat-mobile/`:

```bash
npx expo start --web
```

Confirmar que no hay errores de compilación TypeScript en la consola de Metro.
