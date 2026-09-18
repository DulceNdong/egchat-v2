// useKycCases.ts — Hook para la lista de casos KYC con paginación y filtros
import { useState, useEffect, useCallback } from 'react';
import { kycApi, type KycCase } from '../api/kycApi';

export type StatusFilter = 'all' | 'submitted' | 'PENDING_REVIEW' | 'MANUAL_REVIEW' | 'approved' | 'rejected';
export type RiskFilter   = 'all' | 'high' | 'medium' | 'low';

export function useKycCases() {
  const [cases,   setCases]   = useState<KycCase[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState<StatusFilter>('all');
  const [risk,       setRisk]       = useState<RiskFilter>('all');
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState<'submitted_at' | 'risk_score'>('submitted_at');
  const [sortDir,    setSortDir]    = useState<'asc' | 'desc'>('desc');

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page:     String(page),
        pageSize: String(PAGE_SIZE),
        sortBy,
        sortDir,
      };
      if (search)         params.search = search;
      if (status !== 'all') params.status = status;
      if (risk   !== 'all') params.riskLevel = risk;

      const data = await kycApi.list(params);
      setCases(data.cases);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, risk, page, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  // Reset página al cambiar filtros
  useEffect(() => { setPage(1); }, [search, status, risk]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    cases, total, loading, error,
    search, setSearch,
    status, setStatus,
    risk,   setRisk,
    page,   setPage, totalPages,
    sortBy, setSortBy,
    sortDir, setSortDir,
    reload: load,
  };
}
