# Spec: Orquestador KYC — EGChat Monedero Digital

**Versión:** 1.0  
**Cumplimiento:** COBAC R-2023/01 · CEMAC N°02/24 · Ley N°2/2008 GQ  
**Base:** Extiende `kyc-aml-backend.md` — rellena los 10 GAPs identificados

---

## 1. Diagnóstico — GAPs identificados en el backend existente

| # | Gap | Archivo afectado | Acción |
|---|-----|-----------------|--------|
| 1 | No existe `POST /kyc/init` | routers/kyc.py | CREAR |
| 2 | No existen pasos separados `/personal`, `/document`, `/selfie`, `/financial`, `/consent` | routers/kyc.py | CREAR |
| 3 | No existe `KYCProvider(ABC)` con OCR/biometría/liveness | services/ | CREAR |
| 4 | `POST /kyc/submit` no ejecuta OCR/biometría en tiempo real | services/kyc_service.py | EXTENDER |
| 5 | Motor de decisión no tiene factores de volumen, frecuencia ni canal | services/decision_engine.py | EXTENDER |
| 6 | Rate limiting solo por IP, no por `user_id` con límite diario | routers/kyc.py | CREAR |
| 7 | No existe `idempotency_key` en endpoints de usuario | routers/kyc.py | AÑADIR |
| 8 | No existen `/admin/kyc/{id}/request-info` ni `/admin/kyc/{id}/block` | routers/admin_kyc.py | CREAR |
| 9 | Flags AML no alimentan `RiskFactors` del motor KYC | services/kyc_service.py | CONECTAR |
| 10 | No hay tests unitarios | tests/ | CREAR |

---

## 2. Diagrama de flujo — Orquestador KYC

```
Usuario (App Móvil)                  Orquestador FastAPI               Servicios externos
─────────────────────                ─────────────────────             ──────────────────
                                                                        
POST /kyc/init                                                          
  ── user_id ──────────────────────► Validar token JWT
                                     Verificar rate-limit 5/día
                                     Crear KycApplication (IN_PROGRESS)
                                     ◄─── { session_id } ──────────────
                                                                        
POST /kyc/{session_id}/personal                                         
  ── datos personales ─────────────► Upsert KycPersonalData
  ── Idempotency-Key ───────────────  Guardar progreso
                                     ◄─── { step: "personal", ok } ───
                                                                        
POST /kyc/{session_id}/document                                         
  ── multipart (DNI foto) ─────────► Upload Supabase Storage
                                     Crear KycDocument (urls cifradas)
                                     ◄─── { doc_id, step: "document" }
                                                                        
POST /kyc/{session_id}/selfie
  ── multipart (foto cara) ────────► Upload Supabase Storage
                                     ◄─── { selfie_id, step: "selfie" }
                                                                        
POST /kyc/{session_id}/financial                                        
  ── datos financieros ────────────► Upsert KycPersonalData (parte 2)
                                     ◄─── { step: "financial", ok } ──
                                                                        
POST /kyc/{session_id}/consent                                          
  ── firma digital + timestamp ────► Guardar consentimiento en audit_log
                                     Cambiar status → PENDING_SUBMIT
                                     ◄─── { step: "consent", ok } ────
                                                                        
POST /kyc/{session_id}/submit                                           
  ── (sin body) ───────────────────► ─────────────────────────────────
                                     │                                  
                                     ▼                                  
                                  a) KYCProvider.extract_document()   ──► SmileID / PaddleOCR
                                     → ocr_confidence, doc_data           ◄── DocumentData
                                     
                                  b) KYCProvider.verify_face()        ──► SmileID
                                     → face_match_score (0.0–1.0)         ◄── float
                                     
                                  c) KYCProvider.check_liveness()     ──► SmileID
                                     → liveness_passed (bool)             ◄── bool
                                     
                                  d) ScreeningProvider.sanctions()    ──► OFAC/UE/ONU
                                     → match_found, details               ◄── ScreeningMatch
                                     
                                  e) ScreeningProvider.pep()          ──► Lista PEP
                                     → match_found                        ◄── ScreeningMatch
                                     
                                  f) Consultar historial AML           ──► BD local
                                     → volumen, frecuencia flags          ◄── AMLContext
                                     
                                  g) calculate_risk_score_v2()
                                     → risk_score (0–18), risk_level
                                     
                                  h) Motor de decisión:
                                     sanctions   → REJECTED
                                     doc vencido → REJECTED
                                     ocr < 0.70  → MANUAL_REVIEW
                                     face < 0.80 → MANUAL_REVIEW
                                     pep = true  → MANUAL_REVIEW
                                     HIGH risk   → MANUAL_REVIEW
                                     MEDIUM risk → MANUAL_REVIEW
                                     LOW risk + todo OK → AUTO_APPROVED
                                     
                                  i) Notificar BANGE vía webhook
                                     
                                     ◄─── { decision, kyc_status } ───
                                                                        
BANGE Dashboard                                                         
  POST /webhooks/bank-decision ────► Validar HMAC-SHA256
                                     Aplicar decisión (APPROVED/REJECTED/REQUEST_INFO)
                                     Actualizar users.status
                                     ◄─── { received: true } ─────────
```

---

## 3. Requisitos funcionales

### RF-01 — Inicialización de sesión KYC
- `POST /api/v1/kyc/init` requiere JWT de usuario
- Genera `session_id` UUID único
- Crea `kyc_applications` con `status = IN_PROGRESS`
- Verifica rate-limit: máx 5 intentos por `user_id` en 24h (tabla `kyc_attempts`)
- Si ya existe aplicación activa, devuelve el `session_id` existente (idempotente)
- Registra en `kyc_audit_log`

### RF-02 — Guardado multi-paso
- Cada paso guarda solo su porción de datos — el usuario puede cerrar y retomar
- Todos los POST de paso son idempotentes via header `Idempotency-Key`
- Orden recomendado: personal → document → selfie → financial → consent
- No se valida el orden estricto — se puede retomar cualquier paso
- `POST /consent` cambia status a `PENDING_SUBMIT`

### RF-03 — Verificación automática (submit)
- `POST /api/v1/kyc/{session_id}/submit` es el único punto de entrada al pipeline
- Ejecuta en secuencia: OCR → Biometría → Liveness → Screening → Decisión
- Todos los resultados se persisten en `kyc_documents` + `kyc_screening_results`
- Tiempo máximo total: 30 segundos (timeout por paso)
- Si un proveedor falla: registrar error, usar score conservador (peor caso)

### RF-04 — Motor de decisión v2 (matriz COBAC 6 factores)
```
Factor           Bajo (1)            Medio (2)            Alto (3)
─────────────────────────────────────────────────────────────────
Nacionalidad     GQ/CEMAC            Otra                 Lista FATF
Volumen mensual  < 500k XAF          500k–2M XAF          > 2M XAF
Frecuencia/mes   < 10 ops            10–50 ops            > 50 ops
Origen fondos    Salario             Negocio              No verificable
PEP              No                  —                    Sí
Canal            Presencial          Digital e-KYC        Digital incompleto

Total < 8  → LOW    → AUTO_APPROVED (si checks de doc/biometría pasan)
Total 8–12 → MEDIUM → MANUAL_REVIEW
Total > 12 → HIGH   → MANUAL_REVIEW
```

### RF-05 — Reglas de decisión (independientes del score)
```python
if sanctions_match:          → REJECTED (no reversible)
if doc_expired:              → REJECTED
if ocr_confidence < 0.70:    → MANUAL_REVIEW
if face_match < 0.80:        → MANUAL_REVIEW
if liveness_failed:          → MANUAL_REVIEW
if pep:                      → MANUAL_REVIEW (obligatorio COBAC)
if risk_level == HIGH:       → MANUAL_REVIEW
if risk_level == MEDIUM:     → MANUAL_REVIEW
if risk_level == LOW and all_checks_pass:  → AUTO_APPROVED
```

### RF-06 — Notificación BANGE
- AUTO_APPROVED: webhook informativo a BANGE (no requiere acción)
- MANUAL_REVIEW: enviar a cola de revisión BANGE via API
- REJECTED: notificar usuario + registrar motivo

### RF-07 — Endpoints admin adicionales
- `POST /admin/kyc/{id}/request-info` → status `PENDING_INFO`, notifica usuario
- `POST /admin/kyc/{id}/block` → status `BLOCKED`, users.status = `BLOCKED`

---

## 4. Requisitos no funcionales

- Idempotencia: header `Idempotency-Key` en todos los POST de paso
- Rate limiting: 5 intentos KYC/día por `user_id` (tabla BD, no por IP)
- Logs estructurados JSON: cada acción logea `{timestamp, user_id, session_id, action, details}`
- Timeout por paso externo: 15s (OCR), 15s (biometría), 10s (liveness), 15s (screening)
- Cifrado: URLs de documentos AES-256-GCM antes de persistir
- Tests: coverage mínimo 80% en decision_engine y kyc_service

---

## 5. Interfaz KYCProvider

```python
class KYCProvider(ABC):
    async def extract_document(self, image_bytes, mime_type) -> DocumentData
    async def verify_face(self, selfie_bytes, doc_image_bytes) -> float        # 0.0–1.0
    async def check_liveness(self, selfie_bytes) -> tuple[bool, float]         # (passed, score)
    async def screen_sanctions(self, name, dob, nationality) -> ScreeningMatch
    async def screen_pep(self, name, dob, nationality) -> ScreeningMatch

@dataclass
class DocumentData:
    full_name: str | None
    doc_number: str | None
    birth_date: str | None
    expiry_date: str | None
    nationality: str | None
    doc_type: str | None
    confidence: float         # 0.0–1.0
    expired: bool
    raw: dict                 # datos brutos del proveedor

Implementaciones:
  - StubKYCProvider    → desarrollo/tests, resultados configurables
  - SmileIDProvider    → SmileID API (Africa-focused, disponible en GQ)
  - PaddleOCRProvider  → OCR local con PaddleOCR (fallback offline)
```

---

## 6. Tabla kyc_attempts (nueva)

```sql
CREATE TABLE kyc_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  session_id  UUID,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  INET,
  success     BOOLEAN
);
CREATE INDEX idx_kyc_attempts_user_day ON kyc_attempts(user_id, attempted_at);
```

---

## 7. Tareas de implementación

- [x] T0: Spec doc (este archivo)
- [ ] T1: Tabla `kyc_attempts` en SQL + migración
- [ ] T2: `POST /kyc/init` con rate-limit por user_id
- [ ] T3: Endpoints de pasos multi-paso + idempotency_key
- [ ] T4: `KYCProvider(ABC)` + `StubKYCProvider` + `SmileIDProvider`
- [ ] T5: `POST /kyc/{session_id}/submit` con pipeline completo
- [ ] T6: Motor de decisión v2 con matriz 6-factores COBAC
- [ ] T7: Endpoints admin: request-info + block dedicado
- [ ] T8: Conectar AML flags → RiskFactors
- [ ] T9: Tests pytest
- [ ] T10: Verificación sintaxis

---

## 8. Variables de entorno nuevas

```
# SmileID
SMILE_ID_PARTNER_ID=
SMILE_ID_API_KEY=
SMILE_ID_ENV=sandbox     # sandbox | production

# PaddleOCR (fallback local)
PADDLE_OCR_LANG=es
PADDLE_OCR_USE_GPU=false

# Rate limiting KYC
KYC_MAX_ATTEMPTS_PER_DAY=5
KYC_ATTEMPT_WINDOW_HOURS=24

# Timeouts (segundos)
KYC_OCR_TIMEOUT=15
KYC_BIOMETRY_TIMEOUT=15
KYC_LIVENESS_TIMEOUT=10
KYC_SCREENING_TIMEOUT=15
```
