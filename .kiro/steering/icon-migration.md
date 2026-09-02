---
inclusion: manual
---

# Tarea Pendiente: Migración de Iconos a Material Icons

**Fecha de inicio de planificación:** 2026-08-27  
**Fecha sugerida para ejecutar:** ~2026-09-03 (una semana después)

## Objetivo

Migrar todos los iconos de la app nativa (`egchat-mobile/`) a **Google Material Icons**, disponibles en [fonts.google.com/icons](https://fonts.google.com/icons).

## Estado actual

- Librería disponible: `@expo/vector-icons` (ya instalada, viene con Expo)
- La sublibrería a usar es: `MaterialIcons` (incluida en `@expo/vector-icons`)
- **No hay que instalar nada nuevo**

## Archivos que actualmente usan Ionicons (a migrar)

1. `egchat-mobile/app/mitaxi.tsx`
2. `egchat-mobile/app/taxi-driver-register.tsx`
3. `egchat-mobile/app/stories.tsx`
4. `egchat-mobile/app/supermercados.tsx`
5. `egchat-mobile/src/components/ui/PinInputModal.tsx`
6. `egchat-mobile/src/components/ui/SetupPinModal.tsx`
7. `egchat-mobile/src/components/chat/TransferDetailsModal.tsx`

## Plan acordado (punto por punto)

### Paso 1 — Crear componente wrapper `MIcon`
- Ruta: `egchat-mobile/src/components/ui/MIcon.tsx`
- Apunta a `MaterialIcons` de `@expo/vector-icons`
- Centraliza el control: si se cambia de variante (Outlined, Rounded, Sharp) solo se toca este archivo

### Paso 2 — Migrar archivo por archivo
Para cada uno de los 7 archivos:
1. Ver qué icono de `Ionicons` usa actualmente
2. Proponer el equivalente en Material Icons (con previsualización del nombre)
3. Aprobar / ajustar
4. Aplicar el cambio

### Paso 3 — De aquí en adelante
Cualquier nuevo icono en la app va con `MaterialIcons` vía el componente `MIcon`.

## Notas técnicas

- `@expo/vector-icons` incluye: `MaterialIcons`, `MaterialCommunityIcons`, `Ionicons`, `FontAwesome`, `Feather`, etc.
- Para la búsqueda de nombres de iconos: https://fonts.google.com/icons
- Los nombres en `MaterialIcons` usan snake_case (ej: `arrow_back`, `send`, `person`)
- Los nombres en `MaterialCommunityIcons` son más ricos si Material base no tiene el icono exacto

## Cómo retomar

Cuando quieras continuar, di:  
**"Seguimos con la migración de iconos"** o usa `#icon-migration` en el chat.

Kiro abrirá este steering file y continuará desde el Paso 1.
