# Tareas: Formulario KYC Móvil EGCHAT

## Fase 1 — Infraestructura base

- [ ] **T-01** Crear carpeta `egchat-mobile/app/kyc/` con `_layout.tsx` (Stack sin tab bar)
- [ ] **T-02** Crear `kycStore.ts` (Zustand) con el estado completo de los 5 pasos y acciones
- [ ] **T-03** Crear `kycStorage.ts` — guardar/cargar/borrar draft en AsyncStorage con clave `egchat_kyc_draft`
- [ ] **T-04** Crear `kycService.ts` — funciones: `createApplication`, `updateStep`, `submitApplication`, `getStatus`
- [ ] **T-05** Crear `kycEncryption.ts` — cifrado AES-256 de imágenes con `expo-crypto`
- [ ] **T-06** Crear `useKycSession.ts` — hook que detecta draft activo y redirige al paso correcto
- [ ] **T-07** Crear `KycStepLayout.tsx` — layout base con header, barra de progreso, ScrollView y botones Atrás/Continuar
- [ ] **T-08** Crear `KycProgressBar.tsx` — barra visual con pasos 1-5, iconos y porcentaje

## Fase 2 — Pantalla de entrada

- [ ] **T-09** Crear `app/kyc/index.tsx` — pantalla de entrada con beneficios y botones Comenzar / Continuar
- [ ] **T-10** Integrar `useKycSession` para mostrar "Continuar" solo si hay draft guardado
- [ ] **T-11** Añadir acceso desde la pantalla de monedero (`app/(tabs)/monedero.tsx`) si `wallet_kyc_status === 'none'`

## Fase 3 — Paso 1: Datos Personales

- [ ] **T-12** Crear `app/kyc/step-1.tsx` con todos los campos del formulario
- [ ] **T-13** Implementar date picker nativo (usar `@react-native-community/datetimepicker`)
- [ ] **T-14** Implementar dropdowns para nacionalidad, estado civil, ciudad y provincia con datos de GE
- [ ] **T-15** Pre-rellenar teléfono desde sesión del usuario
- [ ] **T-16** Validación en tiempo real al perder foco — mensajes en español
- [ ] **T-17** Guardado automático en `kycStorage` al cambiar cualquier campo
- [ ] **T-18** POST a `kyc_verifications` y `kyc_personal_data` al avanzar al paso 2

## Fase 4 — Paso 2: Documento de Identidad

- [ ] **T-19** Crear `app/kyc/step-2.tsx` con radio de tipo de documento
- [ ] **T-20** Crear `DocumentCapture.tsx` — cámara en vivo con `expo-camera`, solo modo cámara (no galería)
- [ ] **T-21** Implementar marco guía SVG que se adapta al tipo de documento (DNI, pasaporte)
- [ ] **T-22** Validación de calidad de imagen: detectar brillo, nitidez y reflejos; mostrar mensajes específicos
- [ ] **T-23** Comprimir imagen con `expo-image-manipulator` a máx 2MB
- [ ] **T-24** Cifrar imagen con `kycEncryption.ts` antes de subir
- [ ] **T-25** Upload a Supabase Storage y actualizar `kyc_documents` con `front_image_url` / `back_image_url`
- [ ] **T-26** Crear `OcrConfirmation.tsx` — mostrar datos OCR del backend para confirmación del usuario
- [ ] **T-27** Mostrar foto trasera solo para DNI y Permiso de residencia (ocultar para Pasaporte)

## Fase 5 — Paso 3: Verificación Biométrica

- [ ] **T-28** Crear `app/kyc/step-3.tsx`
- [ ] **T-29** Crear `LivenessCapture.tsx` — cámara frontal con instrucciones animadas secuenciales
- [ ] **T-30** Implementar detección de movimiento de cabeza (MediaPipe o Vision Camera)
- [ ] **T-31** Implementar detección de sonrisa y parpadeo
- [ ] **T-32** Contador de intentos (máx 3) con mensaje de error y opción de reintentar más tarde
- [ ] **T-33** Comprimir + cifrar selfie
- [ ] **T-34** POST a endpoint biométrico del backend con selfie URL + front_image_url
- [ ] **T-35** Mostrar resultado: ✅ Verificado / ❌ Reintentar con mensaje descriptivo
- [ ] **T-36** Guardar `liveness_passed` y `face_match_score` en `kyc_documents`

## Fase 6 — Paso 4: Información Financiera

- [ ] **T-37** Crear `app/kyc/step-4.tsx` con campos de profesión, empleador, ingreso y origen de fondos
- [ ] **T-38** Implementar checkboxes múltiples para origen de fondos (mínimo 1 requerido)
- [ ] **T-39** Mapear valores del formulario a enums de `kyc_personal_data` (`monthly_income_range`, `source_of_funds`)
- [ ] **T-40** Validación: profesión requerida, al menos un origen de fondos seleccionado
- [ ] **T-41** PATCH a `kyc_personal_data` con datos financieros al avanzar al paso 5

## Fase 7 — Paso 5: Declaración y Consentimiento

- [ ] **T-42** Crear `app/kyc/step-5.tsx` con resumen colapsable de datos
- [ ] **T-43** Implementar resumen en acordeón: Datos Personales, Documento, Biometría, Financiero
- [ ] **T-44** Tres checkboxes de consentimiento — botón Enviar activo solo cuando los 3 están marcados
- [ ] **T-45** Al enviar: PATCH `kyc_verifications` con `status: 'submitted'`, insertar en `kyc_audit_log`
- [ ] **T-46** Navegar a `processing.tsx` al hacer submit

## Fase 8 — Pantallas de estado

- [ ] **T-47** Crear `app/kyc/processing.tsx` con animación de carga y polling de estado cada 3 segundos
- [ ] **T-48** Crear `app/kyc/result.tsx` con `KycResultCard.tsx` para los 4 estados: aprobado, revisión, rechazado subsanable, rechazado definitivo
- [ ] **T-49** Flujo aprobado: redirigir al monedero con modal de bienvenida
- [ ] **T-50** Flujo revisión manual: mostrar tiempo estimado y registrar para notificación push
- [ ] **T-51** Flujo rechazado subsanable: mostrar motivo, botón "Corregir y reenviar", retomar en el paso específico
- [ ] **T-52** Flujo rechazado definitivo: mensaje claro y botón de soporte

## Fase 9 — Modo offline y sincronización

- [ ] **T-53** Detectar estado de red con `useNetworkStatus` (ya existe en el proyecto)
- [ ] **T-54** Si offline: guardar cada paso en AsyncStorage, mostrar banner "Sin conexión — datos guardados localmente"
- [ ] **T-55** Al reconectar: sincronizar automáticamente los pasos pendientes con el backend
- [ ] **T-56** Gestionar errores de upload de imágenes con reintentos automáticos (máx 3)

## Fase 10 — Accesibilidad y pulido

- [ ] **T-57** Añadir `accessibilityLabel` y `accessibilityHint` a todos los campos e interactivos
- [ ] **T-58** Verificar contraste de colores WCAG AA (4.5:1 mínimo)
- [ ] **T-59** Asegurar que todos los modales tienen `accessibilityViewIsModal={true}`
- [ ] **T-60** Revisar navegación por teclado (tabbable) en Android

## Fase 11 — Verificación con kluster

- [ ] **T-61** Ejecutar `kluster_code_review_auto` sobre todos los archivos nuevos del módulo KYC
- [ ] **T-62** Corregir todos los issues encontrados por kluster antes de marcar la spec como completada
