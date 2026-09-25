// kycApi.ts — Cliente API para el dashboard BANGE
import { createClient } from '@supabase/supabase-js';

const BASE = import.meta.env.VITE_API_URL ?? 'https://egchat-api-xlxj.onrender.com';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://fqfxtjnfhvpggssbymdn.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
);

let _token = '';
export const setToken = (t: string) => { _token = t; };

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_token}`,
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Tipos ─────────────────────────────────────────────────────────
export interface KycCase {
  application_id: string;
  session_id:     string;
  status:         string;
  risk_level:     string;
  risk_score:     number;
  bank_decision:  string | null;
  submitted_at:   string;
  reviewed_at:    string | null;
  full_name:      string;
  nationality:    string;
  date_of_birth:  string;
  document_type:  string;
  ocr_confidence: number;
  face_match_score: number;
  liveness_passed:  boolean;
  screening_hits:   number;
  reviewer_email:   string | null;
}

export interface KycDetail extends KycCase {
  user_phone:          string;
  profession:          string;
  monthly_income_range: string;
  source_of_funds:     string;
  politically_exposed: boolean;
  document_number:     string;
}

export interface AmlAlert {
  id:            string;
  user_id:       string;
  amount:        number;
  currency:      string;
  flag_type:     string;
  flag_reason:   string;
  flagged_at:    string;
  aml_reviewed:  boolean;
}

export interface AmlSar {
  id:           string;
  status:       string;
  description:  string;
  subject_name: string;
  amount_involved: number;
  detected_at:  string;
  deadline_at:  string;
  overdue:      boolean;
}

// ── KYC Cases ─────────────────────────────────────────────────────
export const kycApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req<{ cases: KycCase[]; total: number }>(`/api/kyc/dashboard?${qs}`);
  },
  detail: (id: string) => req<KycDetail>(`/api/kyc/application/${id}/detail`),
  approve: (id: string, notes?: string) =>
    req(`/api/kyc/application/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'APPROVED', notes }),
    }),
  reject: (id: string, reason: string, isFinal: boolean) =>
    req(`/api/kyc/application/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'REJECTED', reason, isFinal }),
    }),
  requestInfo: (id: string, message: string) =>
    req(`/api/kyc/application/${id}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  auditLog: (id: string) =>
    req<{ logs: any[] }>(`/api/kyc/application/${id}/audit`),
  exportCsv: (filters: Record<string, string>) => {
    const qs = new URLSearchParams(filters).toString();
    return `${BASE}/api/audit/export?${qs}&token=${_token}`;
  },
};

// ── AML ───────────────────────────────────────────────────────────
export const amlApi = {
  alerts: () => req<{ alerts: AmlAlert[]; total: number }>('/api/aml/alerts'),
  reviewAlert: (id: string, decision: 'confirm' | 'dismiss', notes: string) =>
    req(`/api/aml/alerts/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),
  sars: () => req<{ sars: AmlSar[] }>('/api/aml/sar'),
};

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, totpToken?: string) =>
    req<{ token: string; admin: any }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: totpToken ? { 'X-TOTP-Token': totpToken } : {},
    }),
  me: () => req<any>('/api/admin/me'),
};
