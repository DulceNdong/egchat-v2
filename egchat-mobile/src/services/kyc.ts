// ══════════════════════════════════════════════════════════════════
// EGCHAT — Servicio KYC
// Capa de lógica entre las pantallas y kycAPI
// Persiste progreso localmente con AsyncStorage para que el usuario
// no pierda los datos si cierra la app a mitad del formulario
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kycAPI, KycStatus, KycDraftPayload, KycSubmitPayload, KycStatusResponse } from '../api';

const DRAFT_KEY   = 'egchat_kyc_draft_v1';
const STATUS_KEY  = 'egchat_kyc_status_v1';
const STATUS_TTL  = 5 * 60 * 1000; // 5 min — refresco mínimo de caché

// ── Tipos internos ────────────────────────────────────────────────
export interface KycFormData {
  // Paso 1 — datos personales
  full_name:   string;
  birth_date:  string;   // 'YYYY-MM-DD'
  nationality: string;
  gender:      'M' | 'F' | 'O' | '';
  address:     string;
  city:        string;
  occupation:  string;
  // Paso 2 — documento
  doc_type:    'dni' | 'passport' | 'resident_card';
  doc_number:  string;
  doc_expiry:  string;
  doc_front_uri: string;  // URI local antes de subir
  doc_back_uri:  string;
  doc_front_url: string;  // URL remota tras subir
  doc_back_url:  string;
  // Paso 3 — selfie
  selfie_uri:  string;
  selfie_url:  string;
}

export const EMPTY_FORM: KycFormData = {
  full_name: '', birth_date: '', nationality: 'GQ', gender: '',
  address: '', city: '', occupation: '',
  doc_type: 'dni', doc_number: '', doc_expiry: '',
  doc_front_uri: '', doc_back_uri: '',
  doc_front_url: '', doc_back_url: '',
  selfie_uri: '', selfie_url: '',
};

// ── Caché local de estado ─────────────────────────────────────────
interface CachedStatus {
  data: KycStatusResponse;
  ts:   number;
}

// ── Guardar borrador localmente ───────────────────────────────────
export async function saveKycDraftLocal(form: Partial<KycFormData>): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {}
}

// ── Leer borrador local ───────────────────────────────────────────
export async function loadKycDraftLocal(): Promise<Partial<KycFormData>> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Borrar borrador local ─────────────────────────────────────────
export async function clearKycDraftLocal(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([DRAFT_KEY]);
  } catch {}
}

// ── Obtener estado KYC (con caché) ────────────────────────────────
export async function getKycStatus(forceRefresh = false): Promise<KycStatusResponse> {
  // Leer caché
  if (!forceRefresh) {
    try {
      const raw = await AsyncStorage.getItem(STATUS_KEY);
      if (raw) {
        const cached: CachedStatus = JSON.parse(raw);
        if (Date.now() - cached.ts < STATUS_TTL) return cached.data;
      }
    } catch {}
  }

  // Llamar a la API
  try {
    const data = await kycAPI.getStatus();
    await AsyncStorage.setItem(STATUS_KEY, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch {
    // Si no hay red, devolver caché aunque esté caducada
    try {
      const raw = await AsyncStorage.getItem(STATUS_KEY);
      if (raw) return (JSON.parse(raw) as CachedStatus).data;
    } catch {}
    return { kyc_status: 'none', kyc_record: null, rejection_reason: null, wallet_enabled: false };
  }
}

// ── Invalidar caché de estado ─────────────────────────────────────
export async function invalidateKycStatusCache(): Promise<void> {
  try { await AsyncStorage.removeItem(STATUS_KEY); } catch {}
}

// ── Guardar borrador en servidor (sin enviar) ─────────────────────
export async function saveKycDraftRemote(form: KycFormData): Promise<boolean> {
  try {
    const payload: KycDraftPayload = {
      full_name:   form.full_name,
      birth_date:  form.birth_date,
      nationality: form.nationality,
      gender:      form.gender || undefined,
      address:     form.address || undefined,
      city:        form.city    || undefined,
      occupation:  form.occupation || undefined,
      doc_type:    form.doc_type,
      doc_number:  form.doc_number,
      doc_expiry:  form.doc_expiry || undefined,
    };
    await kycAPI.saveDraft(payload);
    return true;
  } catch {
    return false;
  }
}

// ── Subir un documento y actualizar form ─────────────────────────
export async function uploadKycDocument(
  uri: string,
  docType: 'doc_front' | 'doc_back' | 'selfie',
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(10);
  const res = await kycAPI.uploadDocument(uri, docType);
  onProgress?.(100);
  return res.url;
}

// ── Envío final completo ──────────────────────────────────────────
export async function submitKyc(
  form: KycFormData,
  onProgress?: (step: string) => void,
): Promise<{ success: boolean; message: string; kyc_status?: KycStatus }> {
  try {
    // 1. Subir documentos que todavía no tienen URL remota
    let frontUrl  = form.doc_front_url;
    let backUrl   = form.doc_back_url;
    let selfieUrl = form.selfie_url;

    if (!frontUrl && form.doc_front_uri) {
      onProgress?.('Subiendo documento (frontal)…');
      frontUrl = await uploadKycDocument(form.doc_front_uri, 'doc_front');
    }
    if (!backUrl && form.doc_back_uri) {
      onProgress?.('Subiendo documento (reverso)…');
      backUrl = await uploadKycDocument(form.doc_back_uri, 'doc_back');
    }
    if (!selfieUrl && form.selfie_uri) {
      onProgress?.('Subiendo selfie…');
      selfieUrl = await uploadKycDocument(form.selfie_uri, 'selfie');
    }

    // 2. Enviar solicitud final
    onProgress?.('Enviando solicitud…');
    const payload: KycSubmitPayload = {
      full_name:     form.full_name,
      birth_date:    form.birth_date,
      nationality:   form.nationality,
      gender:        form.gender || undefined,
      address:       form.address || undefined,
      city:          form.city    || undefined,
      occupation:    form.occupation || undefined,
      doc_type:      form.doc_type,
      doc_number:    form.doc_number,
      doc_expiry:    form.doc_expiry || undefined,
      doc_front_url: frontUrl,
      doc_back_url:  backUrl || undefined,
      selfie_url:    selfieUrl,
    };

    const res = await kycAPI.submit(payload);

    // 3. Limpiar borrador local y refrescar caché de estado
    await clearKycDraftLocal();
    await invalidateKycStatusCache();

    return { success: true, message: res.message, kyc_status: res.kyc_status };
  } catch (e: any) {
    return { success: false, message: e.message || 'Error al enviar la solicitud KYC' };
  }
}

// ── Validadores de pasos ──────────────────────────────────────────
export function validateStep1(form: KycFormData): string | null {
  if (!form.full_name.trim())  return 'Escribe tu nombre completo';
  if (!form.birth_date)        return 'Indica tu fecha de nacimiento';
  // Debe ser mayor de 18 años
  const age = (Date.now() - new Date(form.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 18)                return 'Debes ser mayor de 18 años para activar el monedero';
  if (!form.nationality)       return 'Selecciona tu nacionalidad';
  return null;
}

export function validateStep2(form: KycFormData): string | null {
  if (!form.doc_number.trim()) return 'Introduce el número de documento';
  if (!form.doc_front_uri && !form.doc_front_url)
    return 'Adjunta una foto del frente de tu documento';
  return null;
}

export function validateStep3(form: KycFormData): string | null {
  if (!form.selfie_uri && !form.selfie_url)
    return 'Tómate una selfie de verificación';
  return null;
}

// ── Etiquetas legibles ────────────────────────────────────────────
export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  none:      'Sin verificar',
  pending:   'En revisión',
  approved:  'Verificado',
  rejected:  'Rechazado',
  suspended: 'Suspendido',
};

export const KYC_STATUS_COLORS: Record<KycStatus, string> = {
  none:      '#9CA3AF',
  pending:   '#F59E0B',
  approved:  '#10B981',
  rejected:  '#EF4444',
  suspended: '#6B7280',
};

export const DOC_TYPE_LABELS = {
  dni:           'DNI / Cédula Nacional',
  passport:      'Pasaporte',
  resident_card: 'Tarjeta de Residencia',
};

export const NATIONALITY_OPTIONS = [
  { code: 'GQ', label: '🇬🇶 Guinea Ecuatorial' },
  { code: 'CM', label: '🇨🇲 Camerún' },
  { code: 'GA', label: '🇬🇦 Gabón' },
  { code: 'CG', label: '🇨🇬 Congo' },
  { code: 'CF', label: '🇨🇫 Rep. Centroafricana' },
  { code: 'TD', label: '🇹🇩 Chad' },
  { code: 'NG', label: '🇳🇬 Nigeria' },
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'FR', label: '🇫🇷 Francia' },
  { code: 'OTHER', label: '🌍 Otra' },
];
