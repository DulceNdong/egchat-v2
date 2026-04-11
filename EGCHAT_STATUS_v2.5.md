# EGCHAT v2.5.0 — Estado del Sistema
**Fecha:** Abril 2026

---

## INFRAESTRUCTURA

| Servicio | URL | Estado |
|---|---|---|
| Frontend Web | https://egchat-app.vercel.app | ACTIVO |
| Backend API | https://egchat-api.onrender.com | ACTIVO v2.5.0 |
| Base de datos | https://fjtoxjcuyfapeprniink.supabase.co | ACTIVO |
| Repositorio Backend | https://github.com/DulceNdong/egchat-api | ACTIVO |
| App Desktop | Electron (local) | ACTIVO |

---

## BASE DE DATOS — SUPABASE

### Tablas activas:
| Tabla | Descripcion |
|---|---|
| users | Usuarios registrados (id, phone, full_name, password_hash, avatar_url) |
| wallets | Monedero de cada usuario (balance, currency XAF) |
| transactions | Historial de transacciones (deposit, withdraw, transfer, payment) |
| recharge_codes | Codigos de recarga prepago |
| lia_conversations | Historial de conversaciones con Lia-25 |
| contacts | Contactos entre usuarios |
| chats | Chats privados y grupales |
| chat_participants | Participantes de cada chat |
| messages | Mensajes de cada chat |

### Usuarios registrados:
- Admin EGCHAT | +240000000001
- Usuario Prueba | +240111222333
- Usuario EGCHAT | +240555123456
- REDDINGTON | +240555570323
- Francisco javier abaga | +240222988227

---

## BACKEND — RENDER (Node.js + Express + Supabase)

### Rutas activas:
**Autenticacion:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

**Monedero:**
- GET /api/wallet/balance
- GET /api/wallet/transactions
- POST /api/wallet/deposit
- POST /api/wallet/withdraw
- POST /api/wallet/transfer
- POST /api/wallet/recharge-code

**Mensajeria:**
- GET /api/chats
- GET /api/chats/:id/messages
- POST /api/chats/:id/messages
- POST /api/chats/private
- POST /api/chats/group
- POST /api/chats/:id/participants
- POST /api/chats/:id/read

**Contactos:**
- GET /api/contacts
- POST /api/contacts
- GET /api/contacts/search
- DELETE /api/contacts/:id

**Notificaciones:**
- GET /api/notifications

**Usuarios:**
- GET /api/user/profile
- PUT /api/user/profile (incluye avatar_url)
- POST /api/user/change-password
- GET /api/users/:userId

**Lia-25 IA:**
- POST /api/lia/chat

**Servicios publicos:**
- POST /api/servicios/segesa/consultar
- POST /api/servicios/segesa/pagar
- POST /api/servicios/snge/consultar
- POST /api/servicios/snge/pagar
- POST /api/servicios/dgi/consultar
- POST /api/servicios/dgi/pagar
- POST /api/servicios/correos/enviar

**Supermercados:**
- GET /api/supermarkets
- GET /api/supermarkets/:id/products
- POST /api/supermarkets/orders

**Salud:**
- GET /api/salud/hospitales
- GET /api/salud/farmacias
- POST /api/salud/citas
- GET /api/salud/medicamentos

**Taxi:**
- POST /api/taxi/request
- GET /api/taxi/:id/status
- POST /api/taxi/:id/cancel
- POST /api/taxi/:id/rate

**Seguros:**
- GET /api/seguros/companias
- GET /api/seguros/companias/:id/productos
- POST /api/seguros/solicitar

**Noticias:**
- GET /api/noticias
- GET /api/noticias/:id

---

## FRONTEND — VERCEL (React + Vite + TypeScript)

### Pantallas activas:
| Pantalla | Estado |
|---|---|
| Bienvenida (logo EgChat + nombre) | ACTIVO |
| Login (telefono + contrasena) | ACTIVO |
| Registro 3 pasos (datos + foto + confirmar) | ACTIVO |
| Home (inicio con noticias, accesos rapidos) | ACTIVO |
| Mensajeria (chats reales + polling 3s) | ACTIVO |
| Monedero (saldo, deposito, retiro, transferencia) | ACTIVO |
| Servicios (electricidad, agua, taxi, salud, etc.) | ACTIVO |
| Ajustes (perfil, seguridad, actividad) | ACTIVO |
| Lia-25 (asistente IA con voz) | ACTIVO |
| Estados | ACTIVO |
| Apuestas | ACTIVO |
| CEMAC | ACTIVO |
| MiTaxi | ACTIVO |

### Funciones activas:
- Sesion persistente (token JWT 30 dias en localStorage)
- Foto de perfil subida en registro y visible en la app
- Mensajeria real con Supabase (polling cada 3s)
- Boton + para nuevo chat por numero de telefono
- Carga de contactos reales del backend
- Polling de notificaciones cada 10s
- Monedero sincronizado con Supabase
- Lia-25 conectada al backend
- Servicios publicos con datos reales
- Noticias cargadas del backend
- Fotos de contactos editables (localStorage)
- Avatar del perfil sincronizado con backend

### Funciones pendientes / parciales:
- Llamadas de audio/video (UI lista, WebRTC no implementado)
- Notificaciones push (polling activo, push nativo pendiente)
- Subida de archivos en chat (UI lista, storage pendiente)
- Grupos — crear desde UI (backend listo, UI pendiente)
- QR de perfil para compartir contacto
- Busqueda global de mensajes

---

## APP MOVIL — EXPO (React Native)

- Carpeta: egchat-mobile/
- Estado: instalada, no desplegada en stores
- Para probar: npx expo start (requiere Expo Go)
- Conectada a: https://egchat-api.onrender.com

---

## CREDENCIALES DE PRUEBA

| Campo | Valor |
|---|---|
| Telefono | +240111222333 |
| Contrasena | test123 |
| Supabase URL | https://fjtoxjcuyfapeprniink.supabase.co |
| Supabase ID | fjtoxjcuyfapeprniink |
| JWT Secret | egchat_secret_2026 |

---

## ACCESOS RAPIDOS

- Web: https://egchat-app.vercel.app
- API: https://egchat-api.onrender.com
- API Health: https://egchat-api.onrender.com/health
- Supabase Dashboard: https://supabase.com/dashboard/project/fjtoxjcuyfapeprniink
- GitHub Backend: https://github.com/DulceNdong/egchat-api
