# Diseño: Capa de Abstracción de Proveedores KYC

## Estructura de archivos

```
server/
├── src/
│   └── kyc/
│       ├── providers/
│       │   ├── KYCProvider.ts          ← Interfaz abstracta + tipos
│       │   ├── SmileIdProvider.ts      ← Implementación Smile ID
│       │   ├── SumsubProvider.ts       ← Implementación Sumsub
│       │   ├── ComplyAdvantageProvider.ts ← AML screening
│       │   ├── WorldCheckProvider.ts   ← AML alternativo
│       │   └── MockProvider.ts         ← Simulado para dev/tests
│       ├── KYCProviderFactory.ts       ← Selección y fallback
│       ├── KYCScoringEngine.ts         ← Motor de scoring
│       └── kycRoutes.ts               ← Endpoints Express
```

---

## Tipos e Interfaz abstracta (TypeScript)

```typescript
// KYCProvider.ts

export interface DocumentData {
  documentType:   string;
  documentNumber: string;
  fullName:       string;
  dateOfBirth:    Date;
  expiryDate:     Date | null;
  nationality:    string | null;
  ocrConfidence:  number;          // 0.0 – 1.0
}

export interface FaceVerificationResult {
  matchScore:       number;        // 0 – 100
  livenessPassed:   boolean;
  deepfakeDetected: boolean;
  livenessScore:    number;        // 0.0 – 1.0
}

export interface ScreeningResult {
  matchFound:        boolean;
  matchDetails:      Record<string, unknown> | null;
  providerReference: string;
  screeningType:     'SANCTIONS' | 'PEP' | 'ADVERSE_MEDIA';
}

export interface ProviderCallMeta {
  provider:    string;
  durationMs:  number;
  success:     boolean;
  fallback:    boolean;
}

export abstract class KYCProvider {
  abstract readonly name: string;

  abstract extractDocument(
    imageBytes: Buffer,
    documentType: string,
  ): Promise<DocumentData>;

  abstract verifyFace(
    selfieBytes:    Buffer,
    docImageBytes:  Buffer,
  ): Promise<FaceVerificationResult>;

  abstract screenSanctions(
    fullName:    string,
    dateOfBirth: Date,
  ): Promise<ScreeningResult>;

  abstract screenPep(
    fullName:    string,
    dateOfBirth: Date,
  ): Promise<ScreeningResult>;
}
```

---

## KYCProviderFactory — Selección y fallback

```typescript
// KYCProviderFactory.ts

export class KYCProviderFactory {
  private primary:   KYCProvider;
  private secondary: KYCProvider | null;
  private amlPrimary:   KYCProvider;
  private amlSecondary: KYCProvider | null;

  constructor() {
    this.primary   = this.build(process.env.KYC_PROVIDER   ?? 'mock');
    this.secondary = this.build(process.env.KYC_PROVIDER_2 ?? 'mock');
    this.amlPrimary   = this.build(process.env.AML_PROVIDER   ?? 'mock');
    this.amlSecondary = this.build(process.env.AML_PROVIDER_2 ?? 'mock');
  }

  private build(name: string): KYCProvider {
    switch (name) {
      case 'smile_id':       return new SmileIdProvider();
      case 'sumsub':         return new SumsubProvider();
      case 'complyadvantage':return new ComplyAdvantageProvider();
      case 'worldcheck':     return new WorldCheckProvider();
      default:               return new MockProvider();
    }
  }

  // Ejecuta con fallback automático y backoff exponencial
  async callWithFallback<T>(
    fn: (p: KYCProvider) => Promise<T>,
    type: 'kyc' | 'aml' = 'kyc',
  ): Promise<{ result: T; meta: ProviderCallMeta }> {
    const primary   = type === 'kyc' ? this.primary   : this.amlPrimary;
    const secondary = type === 'kyc' ? this.secondary : this.amlSecondary;

    for (const [provider, isFallback] of [[primary, false], [secondary, true]] as const) {
      if (!provider) continue;
      for (let attempt = 0; attempt < 2; attempt++) {
        const t0 = Date.now();
        try {
          const result = await withTimeout(fn(provider), 30_000);
          return { result, meta: { provider: provider.name, durationMs: Date.now() - t0, success: true, fallback: isFallback } };
        } catch (err) {
          if (attempt === 0) await sleep(1000 * Math.pow(2, attempt));
        }
      }
    }
    throw new ProviderUnavailableError('Todos los proveedores KYC no disponibles');
  }
}
```

---

## MockProvider — Desarrollo y tests

```typescript
// MockProvider.ts

export class MockProvider extends KYCProvider {
  readonly name = 'mock';

  async extractDocument(_imageBytes: Buffer, documentType: string): Promise<DocumentData> {
    await sleep(800);
    return {
      documentType,
      documentNumber: 'GQ12345678',
      fullName:       'JUAN CARLOS NGUEMA MBA',
      dateOfBirth:    new Date('1990-06-15'),
      expiryDate:     new Date('2028-12-31'),
      nationality:    'GQ',
      ocrConfidence:  parseFloat(process.env.MOCK_OCR_CONFIDENCE ?? '0.95'),
    };
  }

  async verifyFace(_s: Buffer, _d: Buffer): Promise<FaceVerificationResult> {
    await sleep(800);
    return {
      matchScore:       parseFloat(process.env.MOCK_FACE_MATCH ?? '92'),
      livenessPassed:   process.env.MOCK_LIVENESS !== 'false',
      deepfakeDetected: false,
      livenessScore:    0.97,
    };
  }

  async screenSanctions(fullName: string, _dob: Date): Promise<ScreeningResult> {
    await sleep(400);
    return { matchFound: false, matchDetails: null, providerReference: `mock_sanc_${Date.now()}`, screeningType: 'SANCTIONS' };
  }

  async screenPep(fullName: string, _dob: Date): Promise<ScreeningResult> {
    await sleep(400);
    return { matchFound: false, matchDetails: null, providerReference: `mock_pep_${Date.now()}`, screeningType: 'PEP' };
  }
}
```

---

## Motor de Scoring

```typescript
// KYCScoringEngine.ts

interface ScoringInput {
  ocrConfidence:  number;   // 0–1
  faceMatchScore: number;   // 0–100
  livenessPassed: boolean;
  deepfake:       boolean;
  sanctionsHits:  number;
  pepHit:         boolean;
}

type ScoringDecision = 'AUTO_APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';

export function calculateRiskScore(input: ScoringInput): { score: number; decision: ScoringDecision } {
  let score = 0;

  // OCR confidence (peso: 20)
  if (input.ocrConfidence < 0.70) score += 20;
  else if (input.ocrConfidence < 0.85) score += 10;

  // Face match (peso: 30)
  if (input.faceMatchScore < 60) score += 30;
  else if (input.faceMatchScore < 80) score += 15;

  // Liveness (peso: 25)
  if (!input.livenessPassed) score += 25;

  // Deepfake (peso: 40 — rechazo automático)
  if (input.deepfake) score += 40;

  // Sanctions (peso: 50 — rechazo automático)
  score += input.sanctionsHits * 50;

  // PEP (peso: 20 — revisión manual)
  if (input.pepHit) score += 20;

  score = Math.min(score, 100);

  const decision: ScoringDecision =
    score < 30  ? 'AUTO_APPROVED' :
    score <= 70 ? 'MANUAL_REVIEW' :
                  'REJECTED';

  return { score, decision };
}
```

---

## Variables de entorno requeridas

```bash
# .env.example (añadir al servidor)

# Proveedor KYC principal
KYC_PROVIDER=smile_id          # smile_id | sumsub | mock
KYC_PROVIDER_2=sumsub          # fallback

# Proveedor AML
AML_PROVIDER=complyadvantage   # complyadvantage | worldcheck | mock
AML_PROVIDER_2=worldcheck

# Smile ID
SMILE_ID_PARTNER_ID=
SMILE_ID_API_KEY=
SMILE_ID_BASE_URL=https://testapi.smileidentity.com/v1

# Sumsub
SUMSUB_APP_TOKEN=
SUMSUB_SECRET_KEY=
SUMSUB_BASE_URL=https://api.sumsub.com

# ComplyAdvantage
COMPLY_API_KEY=
COMPLY_BASE_URL=https://api.complyadvantage.com

# WorldCheck
WORLDCHECK_API_KEY=
WORLDCHECK_API_SECRET=
WORLDCHECK_BASE_URL=https://rms-world-check-one-api.thomsonreuters.com

# Mock (dev)
MOCK_OCR_CONFIDENCE=0.95
MOCK_FACE_MATCH=92
MOCK_LIVENESS=true
```
