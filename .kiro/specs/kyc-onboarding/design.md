# Diseño: Formulario KYC Móvil EGCHAT

## Arquitectura de pantallas

```
egchat-mobile/app/kyc/
├── _layout.tsx          ← Stack KYC (sin tab bar, con KycProgressBar)
├── index.tsx            ← Detector sesión activa / entrada
├── step-1.tsx           ← Datos Personales
├── step-2.tsx           ← Documento de Identidad
├── step-3.tsx           ← Verificación Biométrica
├── step-4.tsx           ← Información Financiera
├── step-5.tsx           ← Declaración y Consentimiento
├── processing.tsx       ← Pantalla carga (verificación automática)
└── result.tsx           ← Resultado (aprobado / rechazado / revisión)

egchat-mobile/src/
├── services/
│   ├── kycService.ts        ← API: create, update, submit, getStatus
│   ├── kycStorage.ts        ← AsyncStorage: save/load/clear draft
│   └── kycEncryption.ts     ← AES-256 cifrado de imágenes
├── hooks/
│   └── useKycSession.ts     ← Detectar sesión activa, retomar paso
└── components/kyc/
    ├── KycProgressBar.tsx   ← Barra 1/5…5/5 con iconos de paso
    ├── KycStepLayout.tsx    ← Layout común (header, scroll, footer buttons)
    ├── DocumentCapture.tsx  ← Cámara + marco guía + validación calidad
    ├── LivenessCapture.tsx  ← Selfie + prueba de vida + instrucciones
    ├── OcrConfirmation.tsx  ← Datos OCR para confirmación del usuario
    └── KycResultCard.tsx    ← Tarjeta aprobado/rechazado/revisión
```

---

## Estado global (kycStore.ts — Zustand)

```ts
interface KycStore {
  sessionId: string | null;
  currentStep: 1 | 2 | 3 | 4 | 5;
  completedSteps: number[];

  // Paso 1
  personalData: {
    fullName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;       // default 'GQ'
    sex: 'M' | 'F' | null;
    maritalStatus: string;
    address: string;
    city: string;
    province: string;
    phone: string;
    email: string;
  };

  // Paso 2
  documentData: {
    documentType: 'DNI' | 'PASSPORT' | 'RESIDENCE_PERMIT' | null;
    frontImageUri: string | null;     // ruta local cifrada
    backImageUri: string | null;
    ocrConfirmed: boolean;
    ocrData: Record<string, string>;  // datos extraídos por OCR
  };

  // Paso 3
  biometricData: {
    selfieUri: string | null;
    livenessResult: 'pending' | 'passed' | 'failed';
    attempts: number;
  };

  // Paso 4
  financialData: {
    profession: string;
    employer: string;
    monthlyIncomeRange: string;
    sourceOfFunds: string[];
  };

  // Paso 5
  consents: {
    declareTruth: boolean;
    authorizeBank: boolean;
    acceptTerms: boolean;
  };

  // Acciones
  setStep: (step: number) => void;
  setPersonalData: (data: Partial<KycStore['personalData']>) => void;
  setDocumentData: (data: Partial<KycStore['documentData']>) => void;
  setBiometricData: (data: Partial<KycStore['biometricData']>) => void;
  setFinancialData: (data: Partial<KycStore['financialData']>) => void;
  setConsents: (data: Partial<KycStore['consents']>) => void;
  reset: () => void;
}
```

---

## Wireframes

### index.tsx — Entrada / Detector de sesión

```
┌─────────────────────────────────┐
│                                 │
│         [Logo EGCHAT]           │
│                                 │
│    Activa tu monedero           │
│    Verifica tu identidad        │
│    en pocos minutos             │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔒 Cifrado AES-256        │  │
│  │ 📋 5 pasos · ~10 min      │  │
│  │ 💾 Guardado automático    │  │
│  └───────────────────────────┘  │
│                                 │
│    [ Comenzar verificación ]    │
│                                 │
│    ¿Tienes una en progreso?     │
│    [ Continuar donde lo dejé ]  │  ← solo si hay draft
│                                 │
└─────────────────────────────────┘
```

### KycProgressBar (en todos los pasos)

```
┌─────────────────────────────────┐
│  ← Salir           Paso 2 de 5  │
│  ●────●────○────○────○          │
│  Per  Doc  Bio  Fin  Dec        │
│  [██████████░░░░░░░░░░░] 40%    │
└─────────────────────────────────┘
```

### step-1.tsx — Datos Personales

```
┌─────────────────────────────────┐
│  ← Salir           Paso 1 de 5  │
│  [████░░░░░░░░░░░░░░░░░] 20%    │
├─────────────────────────────────┤
│  Datos Personales               │
│                                 │
│  Nombre completo *              │
│  ┌─────────────────────────┐   │
│  │ Juan Carlos Nguema      │   │
│  └─────────────────────────┘   │
│                                 │
│  Fecha de nacimiento *          │
│  ┌─────────────────────────┐   │
│  │ 📅  15 / 06 / 1990      │   │
│  └─────────────────────────┘   │
│                                 │
│  Lugar de nacimiento *          │
│  ┌─────────────────────────┐   │
│  │ Malabo                  │   │
│  └─────────────────────────┘   │
│                                 │
│  Nacionalidad                   │
│  ┌─────────────────────────┐   │
│  │ 🇬🇶 Guinea Ecuatorial ▼  │   │
│  └─────────────────────────┘   │
│                                 │
│  Sexo *                         │
│  ● Masculino    ○ Femenino      │
│                                 │
│  Estado civil                   │
│  ┌─────────────────────────┐   │
│  │ Soltero               ▼ │   │
│  └─────────────────────────┘   │
│                                 │
│  Ciudad                         │
│  ┌─────────────────────────┐   │
│  │ Malabo                ▼ │   │
│  └─────────────────────────┘   │
│                                 │
│  Teléfono                       │
│  ┌─────────────────────────┐   │
│  │ +240 222 123 456        │   │  ← pre-rellenado, editable
│  └─────────────────────────┘   │
│                                 │
│  Email (opcional)               │
│  ┌─────────────────────────┐   │
│  │ correo@ejemplo.com      │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│        [ Continuar → ]          │
└─────────────────────────────────┘
```

### step-2.tsx — Documento de Identidad

```
┌─────────────────────────────────┐
│  ← Atrás           Paso 2 de 5  │
│  [████████░░░░░░░░░░░░░] 40%    │
├─────────────────────────────────┤
│  Documento de Identidad         │
│                                 │
│  Tipo de documento *            │
│  ● DNI  ○ Pasaporte  ○ Permiso │
│                                 │
│  ─────── Foto frontal ──────── │
│  ┌─────────────────────────┐   │
│  │  [Vista cámara en vivo] │   │
│  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │   │
│  │  │   Marco guía DNI   │  │   │
│  │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │   │
│  │  💡 Acerca el documento │   │
│  └─────────────────────────┘   │
│  [ 📷 Capturar foto frontal ]  │
│                                 │
│  ─────── Foto trasera ─────── │
│  [ 📷 Capturar foto trasera ]  │
│  (no aplica para Pasaporte)     │
│                                 │
│  ─────── Datos detectados ──── │
│  ┌─────────────────────────┐   │
│  │ ✅ OCR completado       │   │
│  │ Nombre: JUAN C. NGUEMA  │   │
│  │ Nº:     12345678A       │   │
│  │ Vence:  12/2028         │   │
│  │                         │   │
│  │ ¿Los datos son correctos?│  │
│  │ [ ✓ Sí, confirmar ]     │   │
│  │ [ ✗ No, repetir ]       │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  [ ← Atrás ]  [ Continuar → ]  │
└─────────────────────────────────┘
```

### step-3.tsx — Verificación Biométrica

```
┌─────────────────────────────────┐
│  ← Atrás           Paso 3 de 5  │
│  [████████████░░░░░░░░░] 60%    │
├─────────────────────────────────┤
│  Verificación Biométrica        │
│                                 │
│  ┌─────────────────────────┐   │
│  │   [Vista cámara live]   │   │
│  │      ┌─────────┐        │   │
│  │      │  Cara   │        │   │
│  │      │ oval    │        │   │
│  │      └─────────┘        │   │
│  │   😊 Ahora SONRÍE       │   │  ← animado
│  └─────────────────────────┘   │
│                                 │
│  Intento 1 de 3                 │
│  ✅ Gira cabeza a la derecha    │
│  🔄 Sonríe       ← actual       │
│  ⏳ Parpadea                    │
│                                 │
│  ⚠️ Asegúrate de tener          │
│     buena iluminación           │
│                                 │
│  [Si falla 3 veces:]            │
│  ┌─────────────────────────┐   │
│  │ ❌ No pudimos verificar  │   │
│  │ tu identidad.           │   │
│  │ [ Intentar más tarde ]  │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  [ ← Atrás ]  [ Continuar → ]  │
└─────────────────────────────────┘
```

### step-4.tsx — Información Financiera

```
┌─────────────────────────────────┐
│  ← Atrás           Paso 4 de 5  │
│  [████████████████░░░░░] 80%    │
├─────────────────────────────────┤
│  Información Financiera         │
│                                 │
│  Profesión / Ocupación *        │
│  ┌─────────────────────────┐   │
│  │ Comerciante             │   │
│  └─────────────────────────┘   │
│                                 │
│  Empleador (opcional)           │
│  ┌─────────────────────────┐   │
│  │ Empresa XYZ             │   │
│  └─────────────────────────┘   │
│                                 │
│  Ingreso mensual estimado *     │
│  ┌─────────────────────────┐   │
│  │ 200.000 - 500.000 XAF ▼ │   │
│  └─────────────────────────┘   │
│                                 │
│  Origen de los fondos *         │
│  ☑ Salario                      │
│  ☑ Negocio propio               │
│  ☐ Remesas                      │
│  ☐ Inversiones                  │
│  ☐ Otro                         │
│                                 │
├─────────────────────────────────┤
│  [ ← Atrás ]  [ Continuar → ]  │
└─────────────────────────────────┘
```

### step-5.tsx — Declaración y Consentimiento

```
┌─────────────────────────────────┐
│  ← Atrás           Paso 5 de 5  │
│  [████████████████████░] 100%   │
├─────────────────────────────────┤
│  Declaración y Consentimiento   │
│                                 │
│  ▼ Datos Personales             │  ← colapsable
│  ▼ Documento                    │
│  ▼ Información Financiera       │
│                                 │
│  ─────── Consentimientos ──────│
│  ☑ Declaro que la información   │
│    es veraz y completa          │
│                                 │
│  ☑ Autorizo a EGCHAT y BANGE   │
│    a verificar mi información   │
│                                 │
│  ☑ Acepto los Términos y la    │
│    Política de Privacidad       │
│    [Ver términos →]             │
│                                 │
├─────────────────────────────────┤
│  [ ← Atrás ]                   │
│  [ 🔒 Enviar para verificación ]│  ← activo solo si 3 checks ✓
└─────────────────────────────────┘
```

### processing.tsx — Carga durante verificación

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│      [Animación spinner         │
│       con logo EGCHAT]          │
│                                 │
│   Verificando tu identidad...   │
│                                 │
│   ✅ Documentos recibidos       │
│   🔄 Comparando biometría...    │
│   ⏳ Revisando historial        │
│                                 │
│   Esto puede tardar             │
│   unos segundos                 │
│                                 │
└─────────────────────────────────┘
```

### result.tsx — Resultado

```
── APROBADO ─────────────────────
┌─────────────────────────────────┐
│                                 │
│         ✅                      │
│   ¡Verificación completada!     │
│   Tu cuenta está activa         │
│                                 │
│   Ya puedes usar tu monedero    │
│   EGCHAT Pay                    │
│                                 │
│   [ Ir a mi monedero → ]        │
└─────────────────────────────────┘

── EN REVISIÓN ──────────────────
┌─────────────────────────────────┐
│                                 │
│         🕐                      │
│   En revisión manual            │
│                                 │
│   Tu verificación está siendo   │
│   revisada por BANGE.           │
│   Tiempo estimado: 24-48 horas  │
│                                 │
│   Te avisaremos por             │
│   notificación push             │
│                                 │
│   [ Volver al inicio ]          │
└─────────────────────────────────┘

── RECHAZADO SUBSANABLE ─────────
┌─────────────────────────────────┐
│                                 │
│         ⚠️                      │
│   Verificación no aprobada      │
│                                 │
│   Motivo:                       │
│   "La foto del documento        │
│    no es legible"               │
│                                 │
│   [ Corregir y reenviar ]       │
│   [ Ver detalles ]              │
└─────────────────────────────────┘

── RECHAZADO DEFINITIVO ─────────
┌─────────────────────────────────┐
│                                 │
│         ❌                      │
│   Verificación rechazada        │
│                                 │
│   No podemos completar tu       │
│   verificación en este momento. │
│   Contacta con soporte para     │
│   más información.              │
│                                 │
│   [ Contactar soporte ]         │
└─────────────────────────────────┘
```

---

## Flujo de datos: Captura de documento

```
Usuario apunta cámara
        ↓
DocumentCapture detecta bordes
        ↓
¿Calidad OK? ──No──→ Mensaje específico
        ↓ Sí
Captura frame
        ↓
expo-image-manipulator comprime a ≤2MB
        ↓
kycEncryption.ts cifra AES-256
        ↓
Upload a Supabase Storage (cifrado)
        ↓
POST /api/kyc/ocr con URL imagen
        ↓
Backend extrae datos OCR
        ↓
OcrConfirmation muestra datos al usuario
        ↓
Usuario confirma → guarda en kycStore
```

## Flujo de datos: Liveness

```
LivenessCapture activa cámara frontal
        ↓
Instrucción 1: "Gira cabeza derecha"
        ↓ detección movimiento
Instrucción 2: "Sonríe"
        ↓ detección expresión
Instrucción 3: "Parpadea"
        ↓ detección parpadeo
¿3 pasos OK? ──No──→ intento+1 (máx 3)
        ↓ Sí
Captura selfie
        ↓
Comprimir + cifrar AES-256
        ↓
POST /api/kyc/biometric con selfie URL + doc URL
        ↓
Backend: face_match_score + liveness_passed
        ↓
Resultado → pantalla
```

## Datos de ciudades y provincias GE

```ts
export const GE_PROVINCES = [
  'Bioko Norte', 'Bioko Sur', 'Annobón',
  'Centro Sur', 'Djibloho', 'Kié-Ntem',
  'Litoral', 'Wele-Nzas',
];

export const GE_CITIES: Record<string, string[]> = {
  'Bioko Norte':  ['Malabo', 'Baney', 'Rebola', 'Sampaca'],
  'Bioko Sur':    ['Luba', 'Moka', 'Riaba'],
  'Litoral':      ['Bata', 'Mbini', 'Cogo', 'Niefang'],
  'Centro Sur':   ['Evinayong', 'Akurenam'],
  'Kié-Ntem':     ['Ebebiyin', 'Mikomeseng', 'Mongomo'],
  'Wele-Nzas':    ['Mongomo', 'Añisok', 'Nsok'],
  'Djibloho':     ['Oyala / Djibloho'],
  'Annobón':      ['San Antonio de Palé'],
};
```
