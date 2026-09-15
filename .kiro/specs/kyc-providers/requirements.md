# Requisitos: Capa de Abstracción de Proveedores KYC

## Contexto
El servidor EGCHAT (Node.js/Express en Render) necesita una capa de abstracción para integrar múltiples proveedores de verificación KYC. La capa permite cambiar de proveedor sin modificar el resto del sistema, y activa automáticamente un proveedor de respaldo si el principal falla.

El backend actual usa JavaScript/Node.js. La interfaz abstracta se implementa en TypeScript del servidor, no en Python.

---

## Requisitos Funcionales

### RF-01 — Interfaz abstracta KYCProvider
Cada proveedor implementa 4 métodos:
- `extractDocument(imageBytes)` → datos del documento via OCR
- `verifyFace(selfieBytes, docImageBytes)` → comparación biométrica + liveness
- `screenSanctions(fullName, dateOfBirth)` → lista OFAC/UE/ONU
- `screenPep(fullName, dateOfBirth)` → Politically Exposed Person

### RF-02 — Proveedores soportados
| Proveedor | Función | Nivel |
|-----------|---------|-------|
| **Smile ID** | OCR + Face Match (África) | Principal |
| **Sumsub** | OCR + Face + AML completo | Alternativo |
| **Acuant** | OCR avanzado | Alternativo |
| **Complyadvantage** | Sanctions + PEP screening | Principal AML |
| **WorldCheck (Refinitiv)** | Sanctions + PEP | Alternativo AML |
| **Mock** | Simulado para desarrollo/tests | Dev/Test |

### RF-03 — Selección de proveedor
- Configurado via variable de entorno `KYC_PROVIDER=smile_id|sumsub|mock`
- Configurado via variable de entorno `AML_PROVIDER=complyadvantage|worldcheck|mock`
- El `KYCProviderFactory` instancia el proveedor correcto al arrancar

### RF-04 — Fallback automático
- Si el proveedor principal falla (timeout, error 5xx, rate limit), activar proveedor secundario automáticamente
- Máximo 2 intentos por proveedor, timeout de 30 segundos
- Loguear el fallback en `kyc_audit_log` con `action: 'PROVIDER_FALLBACK'`

### RF-05 — Reintentos con backoff exponencial
- 1er reintento: 1 segundo
- 2do reintento: 2 segundos
- Si ambos fallan → `ProviderUnavailableError`

### RF-06 — Mock Provider para desarrollo
- Simula respuestas realistas con datos ficticios
- Configurable: `MOCK_OCR_CONFIDENCE=0.95`, `MOCK_FACE_MATCH=0.92`, `MOCK_LIVENESS=true`
- Añade delay artificial de 800ms para simular latencia real
- No hace llamadas HTTP reales

### RF-07 — Endpoints del servidor
```
POST /api/kyc/application/:id/document   → llama extractDocument()
POST /api/kyc/application/:id/biometric  → llama verifyFace()
POST /api/kyc/application/:id/screening  → llama screenSanctions() + screenPep()
GET  /api/kyc/application/:id/status     → estado actual
POST /api/kyc/application              → crear aplicación
PUT  /api/kyc/application/:id/personal  → guardar datos personales
PUT  /api/kyc/application/:id/financial → guardar datos financieros
POST /api/kyc/application/:id/submit    → enviar para revisión
GET  /api/kyc/application/active        → aplicación activa del usuario
```

### RF-08 — Motor de scoring automático
- Tras OCR + Face + Screening → calcular `risk_score` (0–100)
- Si score < 30: `AUTO_APPROVED`
- Si score 30–70: `MANUAL_REVIEW`
- Si score > 70: `REJECTED`
- Factores: ocr_confidence, face_match_score, liveness, screening_hits, pep_flag

---

## Requisitos No Funcionales

### RNF-01 — Seguridad
- Las imágenes nunca se almacenan en disco del servidor — solo en Supabase Storage
- Las claves API de proveedores en variables de entorno, nunca en código
- Logs sin datos PII (solo IDs, scores, estados)

### RNF-02 — Rendimiento
- Timeout por proveedor: 30 segundos
- Procesar OCR y screening en paralelo cuando sea posible
- Caché de resultados de screening por 24h (mismo nombre+DOB)

### RNF-03 — Observabilidad
- Cada llamada a proveedor loguea: proveedor, duración_ms, éxito/error
- Métricas: tasa de éxito, latencia p95, fallbacks por día
