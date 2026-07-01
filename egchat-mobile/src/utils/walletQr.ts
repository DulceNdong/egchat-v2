/** Payloads QR de monedero — paridad con App.tsx (web) */

export function buildReceiveQr(userId: string): string {
  return `egchat://pay/${userId}`;
}

export function buildPayQr(userId: string, amount?: string, concept?: string): string {
  const params = new URLSearchParams();
  if (amount?.trim()) params.set('amount', amount.trim());
  if (concept?.trim()) params.set('concept', concept.trim());
  const qs = params.toString();
  return qs ? `egchat://pay?to=${encodeURIComponent(userId)}&${qs}` : buildReceiveQr(userId);
}

export interface ParsedPayQr {
  userId?: string;
  amount?: string;
  concept?: string;
}

export function parseEgchatPayQr(raw: string): ParsedPayQr | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('egchat://pay') && !trimmed.includes('egchat_pay')) return null;
  try {
    const normalized = trimmed.replace(/^egchat:\/\//, 'https://egchat.app/');
    const url = new URL(normalized);
    const pathUser = url.pathname.replace(/^\/pay\/?/, '').split('/').filter(Boolean)[0];
    return {
      userId: url.searchParams.get('to') || pathUser || undefined,
      amount: url.searchParams.get('amount') || undefined,
      concept: url.searchParams.get('concept') || undefined,
    };
  } catch {
    const m = trimmed.match(/pay\/([^?&]+)/);
    return m ? { userId: m[1] } : null;
  }
}
