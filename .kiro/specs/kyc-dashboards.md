# Spec: Dashboards Admin KYC/AML — EGChat

**Versión:** 1.0  
**Stack:** React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + React Query v5 + React Router v6  
**Cumplimiento:** COBAC R-2023/01 · WCAG 2.1 AA · i18n ES/FR

---

## 1. Dos dashboards, una base de código

```
kyc-dashboard/
├── src/
│   ├── apps/
│   │   ├── bange/        ← Dashboard BANGE (validación)
│   │   └── company/      ← Dashboard empresa (monitorización)
│   ├── shared/           ← Componentes, hooks y utils comunes
│   ├── api/              ← Cliente HTTP + tipos
│   └── core/             ← Auth, i18n, tema, sesión
```

Selector de app en `/` según `admin.entity`:
- `BANGE`       → redirige a `/bange/queue`
- `OUR_COMPANY` → redirige a `/company/home`

---

## 2. Mapa de rutas

### Dashboard BANGE (`/bange/*`)

| Ruta | Vista | Roles |
|------|-------|-------|
| `/bange/login` | Login + 2FA TOTP | público |
| `/bange/queue` | Cola de casos pendientes | todos BANGE |
| `/bange/case/:id` | Detalle del caso | todos BANGE |
| `/bange/case/:id/action` | Modal de acción (inline) | COMPLIANCE_OFFICER |
| `/bange/reports` | Reportes (PDF/Excel) | todos BANGE |

### Dashboard Empresa (`/company/*`)

| Ruta | Vista | Roles |
|------|-------|-------|
| `/company/login` | Login + 2FA TOTP | público |
| `/company/home` | Resumen (cards + gráficos) | todos OUR_COMPANY |
| `/company/users` | Lista de usuarios | todos OUR_COMPANY |
| `/company/users/:id` | Detalle usuario (solo lectura) | todos OUR_COMPANY |
| `/company/aml` | Transacciones flaggeadas | todos OUR_COMPANY |
| `/company/sar` | Lista SAR | SUPER_ADMIN, COMPLIANCE_OFFICER |
| `/company/sar/new` | Crear SAR | SUPER_ADMIN, COMPLIANCE_OFFICER |
| `/company/sar/:id` | Detalle/editar SAR | SUPER_ADMIN, COMPLIANCE_OFFICER |
| `/company/reports` | Informes mensuales | SUPER_ADMIN |

---

## 3. Endpoints por vista

### BANGE Queue → `/admin/kyc/pending?page=1&page_size=20`
### BANGE Case Detail → `/api/v1/admin/kyc/:id` + `/api/v1/admin/kyc/:id/audit`
### BANGE Actions → `/api/v1/admin/kyc/:id/approve|reject|request-info|block`
### BANGE Stats → `/admin/kyc/stats`
### Company Home → `/admin/kyc/stats` + `/aml/transactions/flagged?reviewed=false`
### Company Users → `/admin/kyc/pending` (todos los estados)
### Company AML → `/aml/transactions/flagged` + `/aml/transactions/:id/flag|review`
### Company SAR → `/aml/sar` + `/aml/sar/:id` + `/aml/sar/:id/send`
### Auth → `/auth/login` + `/auth/me` + `/auth/logout`

---

## 4. Wireframes en texto

### 4.1 Login (ambos dashboards)
```
┌────────────────────────────────────────┐
│  🏦 EGChat KYC Admin                   │
│  ─────────────────────────────────     │
│  [Email                           ]    │
│  [Contraseña                 👁   ]    │
│                                        │
│  [         Entrar →              ]    │
│                                        │
│  ── 2FA TOTP (aparece tras login) ──  │
│  Código de 6 dígitos de tu app        │
│  [_ _ _ _ _ _]                        │
│  [      Verificar      ]              │
└────────────────────────────────────────┘
```

### 4.2 BANGE Queue (vista principal)
```
┌─ BANGE KYC ─────── [🔔 3] [ES|FR] [👤 Ana García] ─┐
│ Cola de Verificación          [Filtros ▼] [↻ 30s]   │
│                                                      │
│ ┌──┬──────────┬──────────┬────────┬───────┬───────┐ │
│ │# │ Usuario  │ Enviado  │ Riesgo │ Estado│Acciones│ │
│ ├──┼──────────┼──────────┼────────┼───────┼───────┤ │
│ │1 │ +240 222 │ 2h ago   │🔴 HIGH │⏳ Pdte│[Ver →]│ │
│ │2 │ +240 333 │ 5h ago   │🟡 MED  │⏳ Pdte│[Ver →]│ │
│ │3 │ +240 444 │ 1d ago   │🟢 LOW  │⏳ Pdte│[Ver →]│ │
│ └──┴──────────┴──────────┴────────┴───────┴───────┘ │
│ Mostrando 1-20 de 47  [< Anterior] [1][2][3] [Sig >]│
└──────────────────────────────────────────────────────┘
```

### 4.3 BANGE Case Detail
```
┌─ Caso #abc-123 ──── [← Volver] ─────────────────────┐
│                                                      │
│ ┌── Datos Personales ──────────────────────────────┐ │
│ │ Nombre: María López N.    Nac: 🇬🇶 Guinea Ec.    │ │
│ │ F.Nac:  12/03/1988        Prof: Comerciante       │ │
│ │ Dir:    Barrio Ela Nguema, Malabo                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Documentos ────────────────────────────────────┐ │
│ │  [📄 DNI Frontal]  [📄 DNI Reverso]  [🤳 Selfie]│ │
│ │  (click = zoom, no descarga)                      │ │
│ │  Similitud facial: ████████░░ 82%  ✅ Liveness   │ │
│ │  OCR confidence:   ██████████ 94%                │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Screening ──────────────────────────────────────┐│
│ │  Sanciones: ✅ Sin match    PEP: ✅ Sin match     ││
│ │  Riesgo: 🟢 LOW  Score: 7/18                      ││
│ │  Factores: Nac=1 Vol=1 Frec=1 SOF=1 PEP=1 Canal=2││
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌── Timeline ──────────────────────────────────────┐ │
│ │ ● 14/09/2026 10:23 — KYC enviado                 │ │
│ │ ● 14/09/2026 10:24 — OCR completado (94%)        │ │
│ │ ● 14/09/2026 10:24 — Screening OK                │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│  [✅ Aprobar]  [❌ Rechazar]  [⚠️ Info]  [🚫 Bloquear]│
└──────────────────────────────────────────────────────┘
```

### 4.4 Company Home
```
┌─ EGChat KYC Admin ─────────────────────────────────┐
│                                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │1,247 │ │ 89%  │ │  23  │ │ 1,103│ │  41  │      │
│ │Users │ │Aprob.│ │Pdte. │ │OK    │ │Rechaz│      │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │
│                                                     │
│ Nuevos usuarios (30d)    │  Transacciones por tipo  │
│ ▁▂▃▄▅▆▇█ ───────────    │  ██ P2P  ██ TOPUP        │
│                          │  ██ P2M  ██ WITHDRAW     │
│                                                     │
│ ⚠️ Alertas activas                                  │
│  · 3 transacciones STRUCTURING sin revisar          │
│  · 1 usuario PEP pendiente de revisión manual       │
└─────────────────────────────────────────────────────┘
```

### 4.5 Company AML
```
┌─ Transacciones Sospechosas ─────────── [+ Crear SAR]┐
│  [Filtro tipo ▼] [Filtro revisada ▼] [Buscar...  ] │
│                                                     │
│ ┌────┬──────┬────────┬──────────────┬──────┬──────┐│
│ │ TX │Usuario│ Monto  │ Tipo flag    │Rev.  │Acción││
│ ├────┼───────┼────────┼──────────────┼──────┼──────┤│
│ │001 │+240…  │500k XAF│STRUCTURING   │ ❌   │[Ver] ││
│ │002 │+240…  │2.1M XAF│THRESHOLD     │ ❌   │[Ver] ││
│ └────┴───────┴────────┴──────────────┴──────┴──────┘│
└─────────────────────────────────────────────────────┘
```

---

## 5. Seguridad de documentos

- Las imágenes KYC **nunca se sirven directamente**
- Backend genera URL firmada con TTL 5 minutos: `GET /api/v1/kyc/docs/:id/signed-url`
- Frontend carga la imagen en `<img src={signedUrl}>` con `crossOrigin="anonymous"`
- CSS: `user-select: none; pointer-events: none` + listener que previene contextmenu
- No se incluye botón de descarga ni el atributo `download`

---

## 6. Sesión y seguridad

- JWT Admin: 8h máximo, pero dashboard invalida a los **15 min de inactividad**
- Inactividad detectada con `mousemove`, `keydown`, `click`, `scroll`
- Al expirar: modal "Sesión expirada" → redirige a login
- 2FA TOTP: generado con `otpauth://totp/...` en setup inicial
- Verificación de TOTP en `POST /auth/login/verify-totp` (endpoint a añadir)

---

## 7. i18n

Idiomas: `es` (defecto) y `fr` (para BANGE Camerún/Chad)

Archivos:
- `src/core/i18n/es.json`
- `src/core/i18n/fr.json`

---

## 8. Notificaciones en tiempo real

Polling cada 30s:
- `GET /admin/kyc/stats` → actualizar contador cola
- `GET /aml/transactions/flagged?reviewed=false&page_size=5` → alertas AML

Indicador visual: punto verde parpadeante en el header mientras el polling está activo.

---

## 9. Accesibilidad WCAG 2.1 AA

- Contraste mínimo 4.5:1 en todos los textos
- Todos los elementos interactivos con `aria-label` o `aria-describedby`
- Navegación completa por teclado (Tab/Enter/Escape)
- Focus visible con outline azul 2px
- Roles ARIA correctos: `role="table"`, `role="dialog"`, `role="alert"`
- Mensajes de estado con `aria-live="polite"`

---

## 10. Tareas de implementación

- [x] T1: Spec doc
- [x] T2: Estructura Vite + configuración base
- [x] T3: Core (auth, API client, guards, tipos, hooks)
- [x] T4: Dashboard BANGE — login, cola, detalle, acciones
- [x] T5: Dashboard BANGE — reportes
- [x] T6: Dashboard Empresa — home, usuarios
- [x] T7: Dashboard Empresa — AML, SAR, informes
- [x] T8: Componentes compartidos
- [x] T9: Theme, i18n, polling, sesión
- [x] T10: Verificación TypeScript
