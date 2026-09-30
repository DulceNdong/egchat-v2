/**
 * Funciones de acceso a la API — una función por endpoint.
 * Usadas directamente en los hooks de React Query.
 */
import { apiClient } from './client';
import type {
  LoginResponse, AdminUser,
  KycListResponse, KycDetail, KycStats, AuditEntry,
  FlaggedTransactionsResponse,
  SAR, SarListResponse,
} from '@/types';

// ══════════════════════════════════════════════════════════════════
// AUTH — usa /auth/admin/* del Render API de EGChat
// ══════════════════════════════════════════════════════════════════
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/admin/login', { email, password })
      .then(r => r.data),

  me: () =>
    apiClient.get<AdminUser>('/auth/admin/me').then(r => r.data),

  logout: () =>
    apiClient.post('/auth/admin/logout').then(() => undefined),
};

// ══════════════════════════════════════════════════════════════════
// KYC — Admin (v0 + v1)
// ══════════════════════════════════════════════════════════════════
export const kycAdminApi = {
  getStats: () =>
    apiClient.get<KycStats>('/admin/kyc/stats').then(r => r.data),

  getPending: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    risk_level?: string;
  }) =>
    apiClient.get<KycListResponse>('/admin/kyc/pending', { params }).then(r => r.data),

  getDetail: (id: string) =>
    apiClient.get<KycDetail>(`/api/v1/admin/kyc/${id}`).then(r => r.data),

  getAudit: (id: string) =>
    apiClient.get<{ application_id: string; total_entries: number; audit_trail: AuditEntry[] }>(
      `/api/v1/admin/kyc/${id}/audit`
    ).then(r => r.data),

  approve: (id: string, notes?: string) =>
    apiClient.post(`/api/v1/admin/kyc/${id}/approve`, { notes }).then(r => r.data),

  reject: (id: string, reason: string, notes?: string) =>
    apiClient.post(`/api/v1/admin/kyc/${id}/reject`, { reason, notes }).then(r => r.data),

  requestInfo: (id: string, message: string, info_requested: string[], deadline_days: number) =>
    apiClient.post(`/api/v1/admin/kyc/${id}/request-info`, {
      message, info_requested, deadline_days,
    }).then(r => r.data),

  block: (id: string, reason: string, notify_user = true) =>
    apiClient.post(`/api/v1/admin/kyc/${id}/block`, { reason, notify_user }).then(r => r.data),

  bankDecision: (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) =>
    apiClient.post(`/admin/kyc/${id}/bank-decision`, { decision, notes }).then(r => r.data),

  /** URL firmada para visualizar documento (expira en 5 min) */
  getSignedDocUrl: (applicationId: string, docType: 'front' | 'back' | 'selfie') =>
    apiClient.get<{ url: string; expires_in: number }>(
      `/api/v1/kyc/docs/${applicationId}/signed-url`,
      { params: { doc_type: docType } }
    ).then(r => r.data),

  /** Subir documento manualmente desde el panel admin */
  uploadDocAdmin: (applicationId: string, docType: 'front' | 'back' | 'selfie', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    return apiClient.post<{ url: string }>(
      `/api/v1/admin/kyc/${applicationId}/upload-doc?doc_type=${docType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
  },
};

// ══════════════════════════════════════════════════════════════════
// AML — Transacciones y SAR
// ══════════════════════════════════════════════════════════════════
export const amlApi = {
  getFlagged: (params: {
    page?: number;
    page_size?: number;
    reviewed?: boolean;
    flag_type?: string;
  }) =>
    apiClient.get<FlaggedTransactionsResponse>('/aml/transactions/flagged', { params })
      .then(r => r.data),

  flagTransaction: (id: string, flag_type: string, flag_reason: string) =>
    apiClient.post(`/aml/transactions/${id}/flag`, { flag_type, flag_reason }).then(r => r.data),

  reviewTransaction: (id: string, notes?: string, clear_flag?: boolean) =>
    apiClient.post(`/aml/transactions/${id}/review`, { notes, clear_flag }).then(r => r.data),

  getSARs: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    overdue_only?: boolean;
  }) =>
    apiClient.get<SarListResponse>('/aml/sar', { params }).then(r => r.data),

  getSAR: (id: string) =>
    apiClient.get<SAR>(`/aml/sar/${id}`).then(r => r.data),

  createSAR: (data: {
    application_id?: string;
    transaction_ids?: string[];
    report_type: string;
    description: string;
    indicators: string[];
    subject_name?: string;
    amount_involved?: number;
    currency?: string;
  }) =>
    apiClient.post<SAR>('/aml/sar', data).then(r => r.data),

  updateSAR: (id: string, data: Partial<{
    description: string;
    indicators: string[];
    status: string;
    anif_reference: string;
  }>) =>
    apiClient.put<SAR>(`/aml/sar/${id}`, data).then(r => r.data),

  sendSAR: (id: string) =>
    apiClient.post<{ success: boolean; sar_id: string; anif_reference: string | null; message: string }>(
      `/aml/sar/${id}/send`
    ).then(r => r.data),
};

// ── Alertas de caducidad de documentos KYC ───────────────────────
export const expiryApi = {
  getAlerts: (days = 90) =>
    apiClient.get<{ alerts: ExpiryAlert[]; total: number }>(
      `/api/v1/kyc/expiry-alerts?days=${days}`
    ).then(r => r.data),

  notifyUser: (userId: string, days_left: number, document_type: string) =>
    apiClient.post(`/api/v1/kyc/expiry-alerts/${userId}/notify`, { days_left, document_type })
      .then(r => r.data),
};

export interface ExpiryAlert {
  application_id: string;
  user_id:        string | null;
  full_name:      string | null;
  kyc_status:     string | null;
  document_type:  string | null;
  expiry_date:    string;
  days_left:      number;
  urgency:        'critical' | 'high' | 'medium';
}

// Actualizar uploadDocAdmin si no existe
declare module '@/api/endpoints' {
  interface KycAdminApiExtension {
    uploadDocAdmin: (applicationId: string, docType: 'front' | 'back' | 'selfie', file: File) => Promise<{ url: string }>;
  }
}
