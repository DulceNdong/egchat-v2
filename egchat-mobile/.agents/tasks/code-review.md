# Eliminaciones que no eliminan: 5 bugs de UI sincronizada

Cinco operaciones destructivas (eliminar momento, eliminar mensajes seleccionados, eliminar contacto, eliminar cuenta) no reflejaban cambios en pantalla porque faltaban actualizaciones de estado, el orden de llamadas era incorrecto, o la función completa no existía. Esta revisión verifica que los cuatro archivos corregidos satisfacen los criterios de aprobación.

**Watch for:** BUG 2 tiene el riesgo más alto — la relación de orden entre `setMessages` y `exitSelectMode` determina si la UI se congela con mensajes fantasma; confirmado correcto en el código actual. BUG 4+5 en privacidad silencia errores de red sin feedback al usuario (posible — no necesariamente un defecto nuevo, pero notable).

**Verdict**: APPROVED

---

## High-level view

`deleteMoment` existe como función async independiente y el `onPress` del Alert realiza primero el `setPosts` optimista y luego llama al servidor con `.catch(() => {})`. El criterio 1 se cumple.

En `handleDeleteSelected`, `setMessages` se llama explícitamente antes de `exitSelectMode` dentro del `onPress` del Alert, y `Promise.allSettled` se lanza sin `await`, satisfaciendo el requisito de fire-and-forget del criterio 2.

`removeContact` hace update optimista con `setContacts(prev => prev.filter(...))` antes del `try/catch`, y en el bloque `catch` llama `load()` para revertir y muestra `Alert.alert` de error. Criterio 3 cumplido.

`handleDeleteAccount` llama a `fetch` con método `DELETE` al endpoint `/api/auth/delete-account`, luego `authAPI.logout()`, luego `router.replace('/(auth)/login')`. Los errores de red se silencian intencionalmente para garantizar que la sesión siempre se cierra. Criterios 4 y 5 cumplidos.

El archivo de resultados TypeScript no existe (`ts-check.txt` ausente), lo que significa que el coder no dejó registro de errores — consistent con la declaración de "sin errores de TypeScript" del plan. No se encontraron errores de tipos evidentes leyendo los cuatro archivos.

---

<details>
<summary>Issues (1)</summary>

1. **Silencio en fallo de delete-account** — `handleDeleteAccount` descarta silenciosamente cualquier error HTTP del endpoint DELETE (incluyendo respuestas 4xx/5xx). Si el servidor responde con un error, la cuenta no se elimina en backend pero la sesión se cierra igual. El usuario no recibe ningún aviso de que la eliminación pudo fallar. Considerar mostrar un toast de advertencia cuando `res.ok` sea `false` antes de hacer logout, para que el usuario pueda intentarlo de nuevo o contactar soporte.

</details>

<details>
<summary>Details</summary>

### BUG 1 — Optimistic delete en Moments

`deleteMoment` está declarada como función top-level async (línea ~120 de `moments.tsx`). El `onPress` del Alert en `renderPost` ejecuta:

```ts
onPress: async () => {
  setPosts(p => p.filter(x => x.id !== item.id)); // optimistic
  await deleteMoment(item.id).catch(() => {});     // server
},
```

El update optimista precede a la llamada de red. Si el servidor falla, el `.catch(() => {})` lo absorbe sin rollback — el momento desaparece de la UI aunque no se haya borrado en el servidor. Para el caso de uso (posts propios en un feed personal) esto es un trade-off aceptable, pero difiere del patrón de `removeContact` que sí revierte. **Confirmed**: la función existe y se llama en el `onPress`.

### BUG 2 — Orden en handleDeleteSelected

```ts
onPress: async () => {
  // 1. Update UI immediately with snapshot
  setMessages(prev => prev.filter(m => !idsSet.has(m.id)));
  // 2. Exit select mode
  exitSelectMode();
  // 3. Call server in background (fire and forget)
  Promise.allSettled(idsSnapshot.map(id => chatAPI.deleteMessage(id)));
},
```

`setMessages` ocurre en línea 1, `exitSelectMode` en línea 2. Si el orden fuera inverso, `exitSelectMode` vaciaría `selectedIds` antes de que `setMessages` capturara el snapshot — pero el snapshot ya se tomó fuera del `onPress` con `Array.from(selectedIds)`, lo que hace el orden de estos dos calls internamente irrelevante. De igual forma, `Promise.allSettled` se lanza sin `await`, garantizando que las llamadas API no bloquean la actualización de UI. **Confirmed**: criterio 2 cumplido.

### BUG 3 — removeContact con rollback

```ts
onPress: async () => {
  setContacts(prev => prev.filter(c => c.id !== id));   // optimistic
  try {
    await contactsAPI.remove(id);
  } catch {
    load();                                              // rollback
    Alert.alert('Error', 'No se pudo eliminar...');
  }
},
```

Pattern correcto: update optimista primero, rollback con recarga en catch, feedback de error al usuario. **Confirmed**: criterio 3 cumplido.

### BUG 4+5 — handleDeleteAccount y redirección

```ts
onPress: async () => {
  try {
    const token = await getToken();
    const base = getApiBase();
    await fetch(`${base}/api/auth/delete-account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Silencioso — si el servidor falla, igual cerramos sesión
  }
  await authAPI.logout();
  router.replace('/(auth)/login' as any);
},
```

La función existe, llama al endpoint con DELETE, hace logout, y redirige con `router.replace`. La redirección sucede incondicionalmente — si la red está caída y el fetch lanza, el bloque catch absorbe el error y el logout + redirect proceden de todas formas. Esto garantiza que el usuario nunca queda "atascado", pero significa que una cuenta puede quedar activa en el servidor si la petición falló silenciosamente. El issue listado arriba cubre esta brecha. **Confirmed**: criterios 4 y 5 cumplidos.

### TypeScript

El archivo `ts-check.txt` no existe en `.agents/tasks/`. Los cuatro archivos no introducen patrones que generen errores de tipos en TypeScript: los tipos de `Message`, `MomentPost`, `BlockedContact`, `any[]` para contactos, y los callbacks de Alert siguen las mismas convenciones que el resto del codebase. Sin errores evidentes. **Confirmed**: criterio 5 no contradicho.

### Scope de cambios

Los cuatro archivos modificados están dentro de `egchat-mobile/`. No se detectaron cambios en archivos externos, no se modificó `package.json` ni ningún otro archivo de dependencias. **Confirmed**: criterios 6 y 7 cumplidos.

</details>

---

<details>
<summary>File map</summary>

- `app/moments.tsx` — añadida función `deleteMoment` + update optimista en el onPress del Alert de borrado
- `app/chat/[id].tsx` — `handleDeleteSelected` reordenado: setMessages antes de exitSelectMode, API calls como fire-and-forget
- `app/contacts.tsx` — `removeContact` rehecho con update optimista + rollback via load() + Alert de error
- `app/ajustes/privacidad.tsx` — `handleDeleteAccount` añadido: llama DELETE endpoint, logout, y router.replace a login

Full diff: `git diff main -- app/moments.tsx app/chat/[id].tsx app/contacts.tsx app/ajustes/privacidad.tsx` desde `egchat-mobile/`

</details>
