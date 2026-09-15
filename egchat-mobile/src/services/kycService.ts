// kycService.ts — API calls para el módulo KYC
import { getToken } from '../api';
import type { PersonalData, FinancialData, DocumentType } from '../store/kycStore';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://egchat-api-xlxj.onrender.com';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Crear aplicación KYC (primer POST) ───────────────────────────
export async function createKycApplication(): Promise<{ applicationId: string; sessionId: string }> {
  const res = await fetch(`${BASE}/api/kyc/application`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ status: 'draft' }),
  });
  if (!res.ok) throw new Error(`createKycApplication: ${res.status}`);
  return res.json();
}

// ── Guardar paso 1 — datos personales ────────────────────────────
export async function savePersonalData(
  applicationId: string,
  data: PersonalData,
): Promise<void> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/personal`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify({
      full_name:             data.fullName,
      date_of_birth:         data.dateOfBirth,
      place_of_birth:        data.placeOfBirth,
      nationality:           data.nationality,
      sex:                   data.sex,
      marital_status:        data.maritalStatus,
      address:               data.address,
      city:                  data.city,
      province:              data.province,
      phone:                 data.phone,
      email:                 data.email || null,
    }),
  });
  if (!res.ok) throw new Error(`savePersonalData: ${res.status}`);
}

// ── Guardar paso 4 — datos financieros ───────────────────────────
export async function saveFinancialData(
  applicationId: string,
  data: FinancialData,
): Promise<void> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/financial`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify({
      profession:              data.profession,
      employer:                data.employer || null,
      monthly_income_range:    data.monthlyIncomeRange,
      source_of_funds:         data.sourceOfFunds[0] ?? 'OTHER',
    }),
  });
  if (!res.ok) throw new Error(`saveFinancialData: ${res.status}`);
}

// ── Subir documento (front/back/selfie) ──────────────────────────
export async function uploadDocumentImage(
  applicationId: string,
  side: 'front' | 'back' | 'selfie',
  encryptedBase64: string,
  documentType: DocumentType,
): Promise<{ imageUrl: string; ocrData?: Record<string, string> }> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/document`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      side,
      image_data:     encryptedBase64,
      document_type:  documentType,
    }),
  });
  if (!res.ok) throw new Error(`uploadDocumentImage: ${res.status}`);
  return res.json();
}

// ── Verificar biometría ───────────────────────────────────────────
export async function verifyBiometric(
  applicationId: string,
  selfieEncrypted: string,
): Promise<{ livenessPassesd: boolean; faceMatchScore: number }> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/biometric`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ selfie_data: selfieEncrypted }),
  });
  if (!res.ok) throw new Error(`verifyBiometric: ${res.status}`);
  return res.json();
}

// ── Enviar aplicación completa ────────────────────────────────────
export async function submitKycApplication(applicationId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/submit`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`submitKycApplication: ${res.status}`);
}

// ── Obtener estado actual ─────────────────────────────────────────
export async function getKycStatus(applicationId: string): Promise<{
  status: string;
  rejectReason: string | null;
  isFinal: boolean;
}> {
  const res = await fetch(`${BASE}/api/kyc/application/${applicationId}/status`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`getKycStatus: ${res.status}`);
  return res.json();
}

// ── Obtener aplicación activa del usuario ─────────────────────────
export async function getActiveKycApplication(): Promise<{
  applicationId: string;
  sessionId: string;
  currentStep: number;
  status: string;
} | null> {
  const res = await fetch(`${BASE}/api/kyc/application/active`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getActiveKycApplication: ${res.status}`);
  return res.json();
}
