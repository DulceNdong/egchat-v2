// kycStorage.ts — Guardado local de progreso KYC en AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KycState } from '../store/kycStore';

const DRAFT_KEY = 'egchat_kyc_draft';

type KycDraft = Omit<KycState,
  | 'setSessionId' | 'setApplicationId' | 'setCurrentStep' | 'markStepComplete'
  | 'setStatus' | 'setRejectReason' | 'setPersonalData' | 'setDocumentData'
  | 'setBiometricData' | 'setFinancialData' | 'setConsentData' | 'reset'
>;

// Guardar el draft completo
export async function saveKycDraft(state: KycDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[kycStorage] Error guardando draft:', e);
  }
}

// Cargar el draft guardado
export async function loadKycDraft(): Promise<(KycDraft & { savedAt: string }) | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[kycStorage] Error cargando draft:', e);
    return null;
  }
}

// Borrar el draft (al completar o cancelar)
export async function clearKycDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.warn('[kycStorage] Error borrando draft:', e);
  }
}

// Verificar si existe un draft activo
export async function hasKycDraft(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    // Solo válido si no está completado/aprobado
    return !['approved', 'APPROVED', 'rejected', 'REJECTED', 'BLOCKED'].includes(draft.status);
  } catch {
    return false;
  }
}
