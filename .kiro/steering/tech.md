---
inclusion: always
---

# Steering: Stack Nativo

## Versiones del proyecto

Hay 3 versiones. **Solo trabajamos en la nativa:**

| Versión | Carpeta | Repo/Rama | Estado |
|---|---|---|---|
| 📱 **App Nativa** ← ESTA | `egchat-mobile/` | `egchat-v2` rama `mobile` | ✅ Activa |
| 🌐 Web/PWA | raíz del workspace | `egchat-v2` rama `main` | No tocar |
| 🔄 Copia duplicada | `EGCHAT NATIVA/` | mismo repo | Ignorar |

## Versión estable

- **Tag**: `v1.0.0-stable` en rama `mobile`
- **Estado**: Paridad 100% con la web, lista para build APK/IPA
- **Para recuperar**: `git checkout v1.0.0-stable`

## Stack

- Mobile: React Native + Expo ~54 + TypeScript
- Backend: Supabase + Render API (https://egchat-api.onrender.com)
- Navegación: Expo Router
- Estilos: StyleSheet nativo
- Repo: `github.com/DulceNdong/egchat-v2` rama `mobile`
- EAS Project ID: `6200ec00-54d7-4ef4-a348-56e80a1452f6`
- EAS Owner: `reddington120`

## Reglas

- **NUNCA modificar archivos fuera de `egchat-mobile/`**
- Todo código nativo va en `egchat-mobile/`
- Para push usar: `git push origin mobile`
- Para probar: `npx expo start --web` desde `egchat-mobile/`
- Para build APK: `npx eas build --profile preview --platform android`
- Para build IPA: `npx eas build --profile preview --platform ios`

## Prerrequisitos build (ya completados)

- ✅ `expo_push_tokens` tabla en Supabase
- ✅ Google Maps API key en `app.json` + `AndroidManifest.xml`
- ✅ TURN servers en `useWebRTC.ts`
- ✅ `google-services.json` (Firebase FCM)
- ✅ SQL producción ejecutado en Supabase
