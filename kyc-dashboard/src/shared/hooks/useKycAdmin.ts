/**
 * Hooks React Query para el admin KYC — reutilizados en BANGE y Empresa.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycAdminApi, amlApi } from '@/api/endpoints';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/client';
import type { KycStats } from '@/types';

// ── Query keys ────────────────────────────────────────────────────
export const QK = {
  stats:      ['kyc', 'stats'] as const,
  pending:    (p: object) => ['kyc', 'pending', p] as const,
  detail:     (id: string) => ['kyc', 'detail', id] as const,
  audit:      (id: string) => ['kyc', 'audit', id] as const,
  flagged:    (p: object) => ['aml', 'flagged', p] as const,
  sars:       (p: object) => ['aml', 'sars', p] as const,
  sar:        (id: string) => ['aml', 'sar', id] as const,
};

// ── Stats (con polling 30s) ───────────────────────────────────────
export function useKycStats(enabled = true) {
  return useQuery<KycStats>({
    queryKey: QK.stats,
    queryFn:  kycAdminApi.getStats,
    refetchInterval: 30_000,
    enabled,
  });
}

// ── Lista pendientes ──────────────────────────────────────────────
export function useKycPending(params: {
  page: number;
  page_size: number;
  status?: string;
  risk_level?: string;
}) {
  return useQuery({
    queryKey: QK.pending(params),
    queryFn:  () => kycAdminApi.getPending(params),
    placeholderData: (prev) => prev,
  });
}

// ── Detalle ───────────────────────────────────────────────────────
export function useKycDetail(id: string) {
  return useQuery({
    queryKey: QK.detail(id),
    queryFn:  () => kycAdminApi.getDetail(id),
    enabled:  !!id,
  });
}

// ── Audit trail ───────────────────────────────────────────────────
export function useKycAudit(id: string) {
  return useQuery({
    queryKey: QK.audit(id),
    queryFn:  () => kycAdminApi.getAudit(id),
    enabled:  !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────
export function useKycApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      kycAdminApi.approve(id, notes),
    onSuccess: (_, { id }) => {
      toast.success('Solicitud aprobada correctamente');
      qc.invalidateQueries({ queryKey: QK.detail(id) });
      qc.invalidateQueries({ queryKey: ['kyc', 'pending'] });
      qc.invalidateQueries({ queryKey: QK.stats });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useKycReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
      kycAdminApi.reject(id, reason, notes),
    onSuccess: (_, { id }) => {
      toast.success('Solicitud rechazada');
      qc.invalidateQueries({ queryKey: QK.detail(id) });
      qc.invalidateQueries({ queryKey: ['kyc', 'pending'] });
      qc.invalidateQueries({ queryKey: QK.stats });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useKycRequestInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string; message: string; info_requested: string[]; deadline_days: number;
    }) => kycAdminApi.requestInfo(args.id, args.message, args.info_requested, args.deadline_days),
    onSuccess: (_, { id }) => {
      toast.success('Información solicitada al usuario');
      qc.invalidateQueries({ queryKey: QK.detail(id) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useKycBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kycAdminApi.block(id, reason),
    onSuccess: (_, { id }) => {
      toast.success('Solicitud bloqueada');
      qc.invalidateQueries({ queryKey: QK.detail(id) });
      qc.invalidateQueries({ queryKey: ['kyc', 'pending'] });
      qc.invalidateQueries({ queryKey: QK.stats });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useBankDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, notes }: {
      id: string; decision: 'APPROVED' | 'REJECTED'; notes?: string;
    }) => kycAdminApi.bankDecision(id, decision, notes),
    onSuccess: (_, { id }) => {
      toast.success('Decisión BANGE registrada');
      qc.invalidateQueries({ queryKey: QK.detail(id) });
      qc.invalidateQueries({ queryKey: ['kyc', 'pending'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── AML Hooks ─────────────────────────────────────────────────────
export function useFlaggedTransactions(params: {
  page: number;
  page_size: number;
  reviewed?: boolean;
  flag_type?: string;
}) {
  return useQuery({
    queryKey: QK.flagged(params),
    queryFn:  () => amlApi.getFlagged(params),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });
}

export function useSARs(params: {
  page: number;
  page_size: number;
  status?: string;
  overdue_only?: boolean;
}) {
  return useQuery({
    queryKey: QK.sars(params),
    queryFn:  () => amlApi.getSARs(params),
    placeholderData: (prev) => prev,
  });
}

export function useSAR(id: string) {
  return useQuery({
    queryKey: QK.sar(id),
    queryFn:  () => amlApi.getSAR(id),
    enabled:  !!id && id !== 'new',
  });
}

export function useCreateSAR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: amlApi.createSAR,
    onSuccess: () => {
      toast.success('SAR creado correctamente');
      qc.invalidateQueries({ queryKey: ['aml', 'sars'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSendSAR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => amlApi.sendSAR(id),
    onSuccess: (data) => {
      toast.success(`SAR enviado a ANIF. Ref: ${data.anif_reference ?? 'N/A'}`);
      qc.invalidateQueries({ queryKey: ['aml', 'sars'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
