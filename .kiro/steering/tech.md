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

## Stack

- Mobile: React Native + Expo + TypeScript
- Backend: Supabase + Render API (https://egchat-api.onrender.com)
- Navegación: Expo Router
- Estilos: StyleSheet nativo (NativeWind disponible)
- Repo: `github.com/DulceNdong/egchat-v2` rama `mobile`

## Reglas

- **NUNCA modificar archivos fuera de `egchat-mobile/`**
- Todo código nativo va en `egchat-mobile/`
- Para deploy/push usar rama `mobile`, no `main`
- Para probar en navegador: `npx expo start --web` desde `egchat-mobile/`
