// KYC Store — Zustand
// Estado global del formulario KYC en todos sus pasos
import { create } from 'zustand';

export type DocumentType = 'DNI' | 'PASSPORT' | 'RESIDENCE_PERMIT' | null;
export type LivenessResult = 'pending' | 'passed' | 'failed';
export type KycStatus =
  | 'draft' | 'IN_PROGRESS' | 'submitted' | 'PENDING_REVIEW'
  | 'under_review' | 'AUTO_APPROVED' | 'MANUAL_REVIEW'
  | 'approved' | 'APPROVED' | 'rejected' | 'REJECTED' | 'BLOCKED';

export interface PersonalData {
  fullName: string; dateOfBirth: string; placeOfBirth: string;
  nationality: string; sex: 'M' | 'F' | null; maritalStatus: string;
  address: string; city: string; province: string; phone: string; email: string;
}
export interface DocumentData {
  documentType: DocumentType;
  frontImageUri: string | null; backImageUri: string | null;
  frontImageEncrypted: string | null; backImageEncrypted: string | null;
  ocrConfirmed: boolean; ocrData: Record<string, string>;
}
export interface BiometricData {
  selfieUri: string | null; selfieEncrypted: string | null;
  livenessResult: LivenessResult; faceMatchScore: number | null; attempts: number;
}
export interface FinancialData {
  profession: string; employer: string; monthlyIncomeRange: string; sourceOfFunds: string[];
}
export interface ConsentData {
  declareTruth: boolean; authorizeBank: boolean; acceptTerms: boolean;
}

export interface KycState {
  sessionId: string | null; applicationId: string | null;
  currentStep: number; completedSteps: number[];
  status: KycStatus; rejectReason: string | null; isRejectionFinal: boolean;
  personalData: PersonalData; documentData: DocumentData;
  biometricData: BiometricData; financialData: FinancialData; consentData: ConsentData;
  setSessionId: (id: string) => void;
  setApplicationId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  setStatus: (status: KycStatus) => void;
  setRejectReason: (reason: string, isFinal: boolean) => void;
  setPersonalData: (data: Partial<PersonalData>) => void;
  setDocumentData: (data: Partial<DocumentData>) => void;
  setBiometricData: (data: Partial<BiometricData>) => void;
  setFinancialData: (data: Partial<FinancialData>) => void;
  setConsentData: (data: Partial<ConsentData>) => void;
  reset: () => void;
}

const initialPersonalData: PersonalData = {
  fullName: '', dateOfBirth: '', placeOfBirth: '', nationality: 'GQ',
  sex: null, maritalStatus: '', address: '', city: '', province: '', phone: '', email: '',
};
const initialDocumentData: DocumentData = {
  documentType: null, frontImageUri: null, backImageUri: null,
  frontImageEncrypted: null, backImageEncrypted: null, ocrConfirmed: false, ocrData: {},
};
const initialBiometricData: BiometricData = {
  selfieUri: null, selfieEncrypted: null, livenessResult: 'pending', faceMatchScore: null, attempts: 0,
};
const initialFinancialData: FinancialData = {
  profession: '', employer: '', monthlyIncomeRange: '', sourceOfFunds: [],
};
const initialConsentData: ConsentData = {
  declareTruth: false, authorizeBank: false, acceptTerms: false,
};

export const useKycStore = create<KycState>((set: (fn: (s: KycState) => Partial<KycState>) => void) => ({
  sessionId: null, applicationId: null, currentStep: 1, completedSteps: [],
  status: 'draft', rejectReason: null, isRejectionFinal: false,
  personalData: initialPersonalData, documentData: initialDocumentData,
  biometricData: initialBiometricData, financialData: initialFinancialData, consentData: initialConsentData,

  setSessionId:     (id: string) => set(() => ({ sessionId: id })),
  setApplicationId: (id: string) => set(() => ({ applicationId: id })),
  setCurrentStep:   (step: number) => set(() => ({ currentStep: step })),
  markStepComplete: (step: number) => set((s: KycState) => ({
    completedSteps: s.completedSteps.includes(step) ? s.completedSteps : [...s.completedSteps, step],
  })),
  setStatus: (status: KycStatus) => set(() => ({ status })),
  setRejectReason: (reason: string, isFinal: boolean) => set(() => ({ rejectReason: reason, isRejectionFinal: isFinal })),
  setPersonalData:  (data: Partial<PersonalData>)  => set((s: KycState) => ({ personalData:  { ...s.personalData,  ...data } })),
  setDocumentData:  (data: Partial<DocumentData>)  => set((s: KycState) => ({ documentData:  { ...s.documentData,  ...data } })),
  setBiometricData: (data: Partial<BiometricData>) => set((s: KycState) => ({ biometricData: { ...s.biometricData, ...data } })),
  setFinancialData: (data: Partial<FinancialData>) => set((s: KycState) => ({ financialData: { ...s.financialData, ...data } })),
  setConsentData:   (data: Partial<ConsentData>)   => set((s: KycState) => ({ consentData:   { ...s.consentData,   ...data } })),
  reset: () => set(() => ({
    sessionId: null, applicationId: null, currentStep: 1, completedSteps: [],
    status: 'draft', rejectReason: null, isRejectionFinal: false,
    personalData: initialPersonalData, documentData: initialDocumentData,
    biometricData: initialBiometricData, financialData: initialFinancialData, consentData: initialConsentData,
  })),
}));

// ── Tipos ─────────────────────────────────────────────────────────
export type DocumentType = 'DNI' | 'PASSPORT' | 'RESIDENCE_PERMIT' | null;
export type LivenessResult = 'pending' | 'passed' | 'failed';
export type KycStatus =
  | 'draft' | 'IN_PROGRESS' | 'submitted' | 'PENDING_REVIEW'
  | 'under_review' | 'AUTO_APPROVED' | 'MANUAL_REVIEW'
  | 'approved' | 'APPROVED' | 'rejected' | 'REJECTED' | 'BLOCKED';

export interface PersonalData {
  fullName: string;
  dateOfBirth: string;       // ISO: 'YYYY-MM-DD'
  placeOfBirth: string;
  nationality: string;       // default 'GQ'
  sex: 'M' | 'F' | null;
  maritalStatus: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
}

export interface DocumentData {
  documentType: DocumentType;
  frontImageUri: string | null;
  backImageUri: string | null;
  frontImageEncrypted: string | null;  // ruta cifrada lista para subir
  backImageEncrypted: string | null;
  ocrConfirmed: boolean;
  ocrData: Record<string, string>;
}

export interface BiometricData {
  selfieUri: string | null;
  selfieEncrypted: string | null;
  livenessResult: LivenessResult;
  faceMatchScore: number | null;
  attempts: number;
}

export interface FinancialData {
  profession: string;
  employer: string;
  monthlyIncomeRange: string;
  sourceOfFunds: string[];
}

export interface ConsentData {
  declareTruth: boolean;
  authorizeBank: boolean;
  acceptTerms: boolean;
}

export interface KycState {
  // Sesión
  sessionId: string | null;
  applicationId: string | null;
  currentStep: number;
  completedSteps: number[];
  status: KycStatus;
  rejectReason: string | null;
  isRejectionFinal: boolean;

  // Pasos
  personalData: PersonalData;
  documentData: DocumentData;
  biometricData: BiometricData;
  financialData: FinancialData;
  consentData: ConsentData;

  // Acciones
  setSessionId: (id: string) => void;
  setApplicationId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  setStatus: (status: KycStatus) => void;
  setRejectReason: (reason: string, isFinal: boolean) => void;

  setPersonalData: (data: Partial<PersonalData>) => void;
  setDocumentData: (data: Partial<DocumentData>) => void;
  setBiometricData: (data: Partial<BiometricData>) => void;
  setFinancialData: (data: Partial<FinancialData>) => void;
  setConsentData: (data: Partial<ConsentData>) => void;

  reset: () => void;
}

// ── Estado inicial ────────────────────────────────────────────────
const initialPersonalData: PersonalData = {
  fullName: '', dateOfBirth: '', placeOfBirth: '',
  nationality: 'GQ', sex: null, maritalStatus: '',
  address: '', city: '', province: '', phone: '', email: '',
};

const initialDocumentData: DocumentData = {
  documentType: null,
  frontImageUri: null, backImageUri: null,
  frontImageEncrypted: null, backImageEncrypted: null,
  ocrConfirmed: false, ocrData: {},
};

const initialBiometricData: BiometricData = {
  selfieUri: null, selfieEncrypted: null,
  livenessResult: 'pending', faceMatchScore: null, attempts: 0,
};

const initialFinancialData: FinancialData = {
  profession: '', employer: '', monthlyIncomeRange: '', sourceOfFunds: [],
};

const initialConsentData: ConsentData = {
  declareTruth: false, authorizeBank: false, acceptTerms: false,
};

// ── Store ─────────────────────────────────────────────────────────
export const useKycStore = create<KycState>((set) => ({
  sessionId: null,
  applicationId: null,
  currentStep: 1,
  completedSteps: [],
  status: 'draft',
  rejectReason: null,
  isRejectionFinal: false,

  personalData:  initialPersonalData,
  documentData:  initialDocumentData,
  biometricData: initialBiometricData,
  financialData: initialFinancialData,
  consentData:   initialConsentData,

  setSessionId:     (id) => set({ sessionId: id }),
  setApplicationId: (id) => set({ applicationId: id }),
  setCurrentStep:   (step) => set({ currentStep: step }),
  markStepComplete: (step) => set((s) => ({
    completedSteps: s.completedSteps.includes(step)
      ? s.completedSteps
      : [...s.completedSteps, step],
  })),
  setStatus: (status) => set({ status }),
  setRejectReason: (reason, isFinal) => set({
    rejectReason: reason, isRejectionFinal: isFinal,
  }),

  setPersonalData:  (data) => set((s) => ({ personalData:  { ...s.personalData,  ...data } })),
  setDocumentData:  (data) => set((s) => ({ documentData:  { ...s.documentData,  ...data } })),
  setBiometricData: (data) => set((s) => ({ biometricData: { ...s.biometricData, ...data } })),
  setFinancialData: (data) => set((s) => ({ financialData: { ...s.financialData, ...data } })),
  setConsentData:   (data) => set((s) => ({ consentData:   { ...s.consentData,   ...data } })),

  reset: () => set({
    sessionId: null, applicationId: null,
    currentStep: 1, completedSteps: [], status: 'draft',
    rejectReason: null, isRejectionFinal: false,
    personalData:  initialPersonalData,
    documentData:  initialDocumentData,
    biometricData: initialBiometricData,
    financialData: initialFinancialData,
    consentData:   initialConsentData,
  }),
}));
