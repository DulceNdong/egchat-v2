# 🔐 Configuración KYC del Monedero — Estado Guardado

## Estado actual: MONEDERO ABIERTO (sin KYC obligatorio)
> Configurado para pruebas. Todos los usuarios (nuevos y antiguos) acceden al monedero sin verificación.

---

## Archivo de control
**Ruta:** `egchat-mobile/src/config/walletConfig.ts`

---

## Para DESACTIVAR los monederos (obligar KYC de nuevo)

Cambia la línea en `walletConfig.ts`:

```ts
// ANTES (modo pruebas — monedero abierto):
export const WALLET_KYC_REQUIRED = false;

// DESPUÉS (modo producción — KYC obligatorio):
export const WALLET_KYC_REQUIRED = true;
```

Con `true` se activan automáticamente:
- ✅ Pantalla de bloqueo en el tab Monedero para usuarios sin KYC aprobado
- ✅ Nuevos usuarios al registrarse van al prompt KYC (sin opción de saltárselo)
- ✅ Usuarios con KYC `pending`, `rejected` o `suspended` ven su estado específico

---

## Qué NO cambia (siempre activo)
- Todo el flujo KYC sigue funcionando (pasos 1–5, documentos, selfie, liveness)
- El usuario puede entrar a `/kyc` voluntariamente aunque `WALLET_KYC_REQUIRED = false`
- La pantalla de resultados KYC sigue mostrando aprobado/rechazado
- El polling y Supabase Realtime de estado KYC siguen funcionando

---

## Archivos modificados por esta configuración
| Archivo | Qué hace |
|---|---|
| `src/config/walletConfig.ts` | Constante maestra `WALLET_KYC_REQUIRED` |
| `app/(tabs)/monedero.tsx` | Guard de bloqueo en la tab del monedero |
| `src/hooks/useAuth.ts` | Redirección post-registro (tabs vs kyc-wallet-prompt) |

---

## Comando para hacer build tras el cambio
```bash
# Android
npx eas build --profile preview --platform android

# iOS
npx eas build --profile preview --platform ios
```
