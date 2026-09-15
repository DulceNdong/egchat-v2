// useKycSession.ts — Detecta sesión KYC activa y retoma el paso correcto
import { useEffect, useState } from 'react';
import { useKycStore } from '../store/kycStore';
import { loadKycDraft, hasKycDraft } from '../services/kycStorage';
import { getActiveKycApplication } from '../services/kycService';

export interface KycSessionState {
  checking: boolean;
  hasDraft: boolean;
  resumeStep: number;
}

export function useKycSession(): KycSessionState {
  const [checking, setChecking] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const [resumeStep, setResumeStep] = useState(1);

  const store = useKycStore();

  useEffect(() => {
    async function detect() {
      try {
        // 1. Verificar draft local primero (más rápido)
        const draftExists = await hasKycDraft();
        if (draftExists) {
          const draft = await loadKycDraft();
          if (draft) {
            // Restaurar estado del store desde el draft
            store.setPersonalData(draft.personalData);
            store.setDocumentData(draft.documentData);
            store.setBiometricData(draft.biometricData);
            store.setFinancialData(draft.financialData);
            store.setConsentData(draft.consentData);
            if (draft.sessionId)    store.setSessionId(draft.sessionId);
            if (draft.applicationId) store.setApplicationId(draft.applicationId);
            if (draft.status)       store.setStatus(draft.status);

            setResumeStep(draft.currentStep ?? 1);
            setHasDraft(true);
            setChecking(false);
            return;
          }
        }

        // 2. Si no hay draft local, consultar al backend
        const active = await getActiveKycApplication();
        if (active) {
          store.setApplicationId(active.applicationId);
          store.setSessionId(active.sessionId);
          store.setStatus(active.status as any);
          setResumeStep(active.currentStep ?? 1);
          setHasDraft(true);
        }
      } catch {
        // Error de red — continuar sin draft
      } finally {
        setChecking(false);
      }
    }

    detect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checking, hasDraft, resumeStep };
}
