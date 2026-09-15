# Requisitos: Formulario KYC Móvil EGCHAT

## Contexto
Formulario de onboarding KYC (Know Your Customer) multi-paso para la app nativa EGCHAT (React Native + Expo 54). Cumple normativa COBAC R-2023/01, CEMAC N°02/24 y Ley N°2/2008 de Guinea Ecuatorial. El backend ya tiene la migración `008_kyc_aml_complete.sql` ejecutada en Supabase.

---

## Requisitos Funcionales

### RF-01 — Flujo multi-paso (5 pasos)
- El formulario se divide en 5 pasos secuenciales con barra de progreso visible (1/5 … 5/5).
- El usuario puede retroceder a pasos anteriores para editar sin perder datos.
- No puede avanzar al siguiente paso si el paso actual tiene errores de validación.

### RF-02 — Guardado automático
- Cada paso se guarda automáticamente en AsyncStorage al cambiar de campo.
- Al completar y avanzar un paso, se hace POST al backend (`kyc_verifications` + `kyc_personal_data`).
- Si la app se cierra y se reabre, se detecta sesión KYC en progreso y se retoma desde el último paso guardado.

### RF-03 — Paso 1: Datos Personales
- Campos requeridos: nombre completo, fecha de nacimiento (date picker nativo), lugar de nacimiento, nacionalidad (dropdown países, default GQ), sexo (radio M/F), estado civil (dropdown).
- Campos opcionales: dirección, ciudad (dropdown ciudades GE), provincia (dropdown), teléfono (pre-rellenado del registro), email.
- Validación en tiempo real al perder foco. Mensajes de error en español.

### RF-04 — Paso 2: Documento de Identidad
- Selección de tipo: DNI, Pasaporte, Permiso de residencia (radio buttons).
- Captura foto frontal: solo cámara en vivo, NO galería. Marco guía visual del documento. Validación de calidad (luz, nitidez, sin reflejos). Mensajes específicos de error.
- Captura foto trasera: solo para DNI y Permiso de residencia.
- OCR automático tras captura: muestra datos extraídos para confirmación del usuario.
- Imágenes comprimidas a máx 2MB y cifradas AES-256 antes de subir.

### RF-05 — Paso 3: Verificación Biométrica
- Selfie con prueba de vida: instrucciones animadas ("Gira la cabeza a la derecha", "Sonríe", "Parpadea").
- Detección de liveness en tiempo real (no deepfakes).
- Máximo 3 intentos. Si falla los 3, muestra mensaje de error y opción de reintentar más tarde.
- El backend compara biométricamente la selfie con la foto del documento.
- Resultado mostrado en pantalla: ✅ Verificado / ❌ Reintentar.

### RF-06 — Paso 4: Información Financiera
- Campos: profesión/ocupación (texto), empleador (texto, opcional), ingreso mensual estimado (dropdown: <200k, 200k-500k, 500k-1M, >1M XAF), origen de fondos (checkbox múltiple: salario, negocio propio, remesas, inversiones, otro).
- Mapeado a los valores del enum `monthly_income_range` y `source_of_funds` de `kyc_personal_data`.

### RF-07 — Paso 5: Declaración y Consentimiento
- Resumen visual de todos los datos ingresados (solo lectura, colapsable por sección).
- Tres checkboxes obligatorios: veracidad, autorización BANGE, términos y privacidad.
- Botón "Enviar para verificación" activo solo cuando los 3 checkboxes están marcados.
- Al enviar: cambia `status` a `submitted` en backend y muestra pantalla de carga.

### RF-08 — Flujos especiales
- **KYC en progreso**: al abrir la app, detectar `session_id` activo. Modal: "Tienes una verificación en progreso. ¿Continuar?". Retomar desde el último paso guardado.
- **Rechazado subsanable**: mostrar motivo, botón "Corregir y reenviar", permite editar solo los campos del motivo.
- **Rechazado definitivo**: mensaje claro, sin opción de reintentar.
- **En revisión manual** (`MANUAL_REVIEW`): pantalla "Tu verificación está siendo revisada por BANGE. Tiempo estimado: 24-48 horas." Notificación push cuando haya decisión.
- **Aprobado**: redirigir al monedero. Modal "¡Bienvenido! Tu cuenta está activa." Tutorial breve de primeras acciones.

### RF-09 — Modo offline
- Si no hay conexión, guardar progreso en AsyncStorage.
- Al reconectar, sincronizar automáticamente con el backend.
- Indicador visual de estado offline en la barra de progreso.

---

## Requisitos No Funcionales

### RNF-01 — Seguridad
- Imágenes cifradas AES-256 antes de subir (usando `expo-crypto` o `react-native-aes-crypto`).
- Campos sensibles (teléfono, email) cifrados en tránsito y en reposo.
- No almacenar imágenes en claro en AsyncStorage — solo rutas temporales cifradas.

### RNF-02 — Rendimiento
- Comprimir imágenes a máx 2MB con `expo-image-manipulator` antes de cifrar y subir.
- Carga de cada paso en menos de 300ms.
- Upload de imágenes en background con indicador de progreso.

### RNF-03 — Accesibilidad
- Todos los campos tienen `accessibilityLabel` y `accessibilityHint`.
- Contraste mínimo WCAG AA (4.5:1).
- Compatible con VoiceOver (iOS) y TalkBack (Android).

### RNF-04 — Compatibilidad
- iOS 15+ y Android 10+.
- Solo orientación portrait.
- Funciona sin cámara trasera (muestra error y opción de subir desde la plataforma si aplica).

---

## Tablas Supabase involucradas
| Tabla | Uso |
|-------|-----|
| `kyc_verifications` | Registro principal, estado, `session_id`, `risk_score` |
| `kyc_personal_data` | Datos personales (paso 1 + paso 4) |
| `kyc_documents` | Fotos documento + selfie, OCR, liveness |
| `kyc_audit_log` | Log inmutable de cada acción del usuario |
| `users` | Leer teléfono pre-rellenado, actualizar `wallet_kyc_status` |
