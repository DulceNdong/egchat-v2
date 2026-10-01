// ══════════════════════════════════════════════════════════════════
// Tipos compartidos — Dashboard KYC/AML Admin
// ══════════════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────────────
export type AdminRole   = 'SUPER_ADMIN' | 'COMPLIANCE_OFFICER' | 'ANALYST' | 'BANK_VIEWER';
export type AdminEntity = 'OUR_COMPANY' | 'BANGE';

export interface AdminUser {
  id:         string;
  email:      string;
  role:       AdminRole;
  entity:     AdminEntity;
  is_active:  boolean;
  last_login: string | null;
}

export interface AuthState {
  admin:     AdminUser | null;
  token:     string | null;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type:   string;
  expires_in:   number;
  admin_id:     string;
  role:         AdminRole;
  entity:       AdminEntity;
}

// ── KYC Application ───────────────────────────────────────────────
export type KycStatus =
  | 'draft' | 'IN_PROGRESS' | 'PENDING_SUBMIT'
  | 'submitted' | 'PENDING_REVIEW' | 'under_review'
  | 'MANUAL_REVIEW' | 'AUTO_APPROVED'
  | 'APPROVED' | 'approved'
  | 'REJECTED' | 'rejected'
  | 'BLOCKED' | 'PENDING_INFO';

export type RiskLevel = 'low' | 'medium' | 'high' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface KycListItem {
  application_id:  string;
  session_id:      string | null;
  status:          KycStatus;
  risk_level:      RiskLevel;
  risk_score:      number;
  bank_decision:   string | null;
  submitted_at:    string | null;
  created_at:      string;
  user_phone:      string | null;
  user_status:     string | null;
  full_name:       string | null;
  nationality:     string | null;
  document_type:   string | null;
  ocr_confidence:  number | null;
  face_match_score:number | null;
  liveness_passed: boolean | null;
  screening_hits:  number;
}

export interface KycListResponse {
  items:     KycListItem[];
  total:     number;
  page:      number;
  page_size: number;
  pages:     number;
}

export interface ScreeningResult {
  id:             string;
  screening_type: string;
  provider:       string;
  match_found:    boolean;
  match_score:    number | null;
  match_details:  Record<string, unknown>;
  reviewed:       boolean;
  false_positive: boolean | null;
}

export interface KycDetail {
  id:               string;
  application_id:   string;
  session_id:       string | null;
  status:           KycStatus;
  risk_level:       RiskLevel;
  risk_score:       number;
  bank_decision:    string | null;
  bank_notes:       string | null;
  bank_decision_at: string | null;
  rejection_reason: string | null;
  reviewer_notes:   string | null;
  reviewed_at:      string | null;
  submitted_at:     string | null;
  created_at:       string;
  user_id:          string;
  user_phone:       string | null;
  wallet_kyc_status: string | null;
  full_name:        string | null;
  nationality:      string | null;
  birth_date:       string | null;
  profession:       string | null;
  employer:         string | null;
  monthly_income_range: string | null;
  source_of_funds:  string | null;
  politically_exposed: boolean | null;
  doc_type:         string | null;
  doc_number:       string | null;
  doc_expiry_date:  string | null;
  days_to_expiry:   number | null;
  doc_expiry_warning: boolean;
  has_front_doc:    boolean;
  has_back_doc:     boolean;
  has_selfie:       boolean;
  ocr_confidence:   number | null;
  face_match_score: number | null;
  liveness_passed:  boolean | null;
  // Foto de perfil del usuario
  avatar_url:       string | null;
  // URLs reales de documentos (cuando existen en Storage)
  doc_front_url:    string | null;
  doc_back_url:     string | null;
  selfie_url:       string | null;
  screening_results: ScreeningResult[];
}

export interface KycStats {
  total_applications:       number;
  pending_review:           number;
  approved_today:           number;
  rejected_today:           number;
  avg_risk_score:           number;
  high_risk_count:          number;
  screening_hits_unreviewed: number;
  sars_overdue:             number;
}

export interface AuditEntry {
  id:            number;
  action:        string;
  performed_by:  string | null;
  performed_role:string | null;
  details:       Record<string, unknown>;
  ip_address:    string | null;
  created_at:    string;
}

// ── Transactions / AML ────────────────────────────────────────────
export type FlagType =
  | 'STRUCTURING' | 'UNUSUAL_PATTERN' | 'HIGH_RISK_COUNTRY'
  | 'PEP_INVOLVED' | 'SANCTIONS_HIT' | 'VELOCITY'
  | 'THRESHOLD_BREACH' | 'MANUAL';

export interface FlaggedTransaction {
  id:          string;
  user_id:     string;
  type:        string;
  amount:      string;
  currency:    string;
  flag_type:   FlagType | null;
  flag_reason: string | null;
  flagged_at:  string | null;
  aml_reviewed:boolean;
  created_at:  string;
}

export interface FlaggedTransactionsResponse {
  items:     FlaggedTransaction[];
  total:     number;
  page:      number;
  page_size: number;
}

// ── SAR ───────────────────────────────────────────────────────────
export type SarStatus =
  | 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED'
  | 'SENT_TO_ANIF' | 'ACKNOWLEDGED' | 'CLOSED';

export type ReportType = 'SAR' | 'CTR' | 'STR';

export interface SAR {
  id:              string;
  application_id:  string | null;
  transaction_ids: string[];
  report_type:     ReportType;
  description:     string;
  indicators:      string[];
  status:          SarStatus;
  amount_involved: string | null;
  currency:        string;
  anif_reference:  string | null;
  detected_at:     string;
  deadline_at:     string | null;
  sent_at:         string | null;
  created_at:      string;
  reported_by_email: string | null;
  overdue:         boolean;
}

export interface SarListResponse {
  items:     SAR[];
  total:     number;
  page:      number;
  page_size: number;
}

// ── Pagination ────────────────────────────────────────────────────
export interface PaginationParams {
  page:      number;
  page_size: number;
}

// ── API Error ─────────────────────────────────────────────────────
export interface ApiError {
  error:   string;
  message: string;
  details?: Record<string, unknown>;
}
