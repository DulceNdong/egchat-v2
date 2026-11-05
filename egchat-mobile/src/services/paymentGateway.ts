/**
 * EGChat — Servicio de pasarela de pagos
 *
 * Pasarelas soportadas:
 *  - Stripe          → tarjetas Visa/Mastercard internacionales
 *  - Orange Money GQ → móvil local Guinea Ecuatorial
 *  - MTN Mobile Money→ móvil local (Camerún/GQ)
 *  - Efectivo/Agente → registro manual, sin integración API
 *
 * Flujo Stripe (cliente):
 *  1. Cliente llama createPaymentIntent(amount, gateway)
 *  2. Servidor crea PaymentIntent y devuelve clientSecret
 *  3. Cliente usa @stripe/stripe-react-native para confirmar
 *  4. Servidor recibe webhook → actualiza wallet
 *
 * Flujo Orange Money / MTN (USSD Push):
 *  1. Cliente envía número de teléfono + importe
 *  2. Servidor inicia pago USSD Push via API del operador
 *  3. Usuario confirma en su teléfono el código USSD
 *  4. Servidor recibe callback → actualiza wallet
 */

import { getToken, getApiBase } from '../api';

export type PaymentGateway =
  | 'stripe'
  | 'orange_money'
  | 'mtn_mobile'
  | 'bank_transfer'
  | 'cash_agent'
  | 'recharge_code'
  | 'egchat_transfer';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentIntent {
  id: string;
  clientSecret?: string;     // Solo Stripe
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  redirectUrl?: string;      // Orange Money / MTN
  ussdCode?: string;         // USSD para confirmar en teléfono
  transactionId?: string;    // ID de la transacción en la pasarela
  expiresAt?: string;
}

export interface PaymentResult {
  ok: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
  requiresAction?: boolean;  // Stripe 3DS
  clientSecret?: string;     // Para 3DS en cliente
}

// ── HTTP helper ───────────────────────────────────────────────────

async function payFetch<T = any>(method: string, path: string, body?: object): Promise<T> {
  const token = await getToken();
  const BASE  = getApiBase();
  const res   = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Crear intento de pago (depósito) ──────────────────────────────

/**
 * Crea un PaymentIntent en el servidor para la pasarela seleccionada.
 * Para Stripe: devuelve clientSecret para confirmar con el SDK.
 * Para Orange/MTN: devuelve ussdCode o redirectUrl.
 */
export async function createDepositIntent(
  amount: number,
  gateway: PaymentGateway,
  options?: {
    phone?: string;       // Orange Money / MTN
    currency?: string;    // default: XAF
    description?: string;
  },
): Promise<PaymentIntent> {
  return payFetch<PaymentIntent>('POST', '/api/payments/deposit/intent', {
    amount,
    gateway,
    currency: options?.currency || 'XAF',
    phone: options?.phone,
    description: options?.description || 'Recarga EGChat',
  });
}

/**
 * Confirma un pago después de que el usuario complete la acción
 * (Stripe: el SDK confirma con clientSecret; Orange/MTN: polling del estado).
 */
export async function confirmDeposit(
  intentId: string,
  gateway: PaymentGateway,
  stripePaymentMethodId?: string,
): Promise<PaymentResult> {
  return payFetch<PaymentResult>('POST', '/api/payments/deposit/confirm', {
    intentId,
    gateway,
    paymentMethodId: stripePaymentMethodId,
  });
}

/**
 * Polling del estado de un pago (Orange Money / MTN que requieren USSD).
 * Llama cada 3s hasta que completa o falla.
 */
export async function pollPaymentStatus(
  intentId: string,
  maxAttempts = 20,
  intervalMs = 3000,
): Promise<PaymentResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await payFetch<{ status: PaymentStatus; balance?: number; transactionId?: string }>(
      'GET', `/api/payments/status/${intentId}`,
    );
    if (result.status === 'completed') {
      return { ok: true, newBalance: result.balance, transactionId: result.transactionId };
    }
    if (result.status === 'failed' || result.status === 'cancelled') {
      return { ok: false, error: 'Pago cancelado o fallido' };
    }
    // Aún pendiente — esperar
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { ok: false, error: 'Tiempo de espera agotado' };
}

// ── Retiro ────────────────────────────────────────────────────────

export interface WithdrawIntent {
  id: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  estimatedTime?: string;   // 'Inmediato', '1-2 días', etc.
  fee?: number;             // Comisión aplicada
  netAmount?: number;       // Importe neto recibido
}

export async function createWithdrawIntent(
  amount: number,
  gateway: PaymentGateway,
  destination: {
    phone?: string;         // Orange / MTN
    iban?: string;          // Transferencia bancaria
    bankName?: string;
    accountHolder?: string;
    agentId?: string;       // Retiro en agente
  },
): Promise<WithdrawIntent> {
  return payFetch<WithdrawIntent>('POST', '/api/payments/withdraw/intent', {
    amount,
    gateway,
    destination,
    currency: 'XAF',
  });
}

export async function confirmWithdraw(intentId: string): Promise<PaymentResult> {
  return payFetch<PaymentResult>('POST', `/api/payments/withdraw/confirm/${intentId}`);
}

// ── Historial de transacciones externas ──────────────────────────

export interface ExternalTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  fee?: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayTxnId?: string;
  status: PaymentStatus;
  description?: string;
  createdAt: string;
}

export async function getPaymentHistory(page = 1, limit = 20): Promise<ExternalTransaction[]> {
  try {
    return await payFetch<ExternalTransaction[]>(
      'GET', `/api/payments/history?page=${page}&limit=${limit}`,
    );
  } catch { return []; }
}

// ── Helpers de presentación ───────────────────────────────────────

export const GATEWAY_INFO: Record<PaymentGateway, {
  label: string;
  icon: string;
  color: string;
  fee: string;
  time: string;
  available: boolean;
}> = {
  stripe: {
    label: 'Tarjeta Visa / Mastercard',
    icon: '💳',
    color: '#635BFF',
    fee: '2.9% + 30 XAF',
    time: 'Inmediato',
    available: true,
  },
  orange_money: {
    label: 'Orange Money',
    icon: '🟠',
    color: '#FF6600',
    fee: '1%',
    time: 'Inmediato (USSD)',
    available: true,
  },
  mtn_mobile: {
    label: 'MTN Mobile Money',
    icon: '🟡',
    color: '#FFCC00',
    fee: '1%',
    time: 'Inmediato (USSD)',
    available: true,
  },
  bank_transfer: {
    label: 'Transferencia bancaria',
    icon: '🏦',
    color: '#1B3A6B',
    fee: 'Sin comisión',
    time: '1-2 días hábiles',
    available: true,
  },
  cash_agent: {
    label: 'Efectivo en agente',
    icon: '🏪',
    color: '#4C1D95',
    fee: 'Sin comisión',
    time: 'Inmediato',
    available: true,
  },
  recharge_code: {
    label: 'Código de recarga',
    icon: '🎟️',
    color: '#92400E',
    fee: 'Sin comisión',
    time: 'Inmediato',
    available: true,
  },
  egchat_transfer: {
    label: 'Transferencia EGChat',
    icon: '⚡',
    color: '#00c8a0',
    fee: 'Sin comisión',
    time: 'Inmediato',
    available: true,
  },
};

export function formatGatewayFee(gateway: PaymentGateway, amount: number): string {
  if (gateway === 'stripe') {
    const fee = Math.round(amount * 0.029) + 30;
    return `${fee.toLocaleString('es-ES')} XAF`;
  }
  if (gateway === 'orange_money' || gateway === 'mtn_mobile') {
    const fee = Math.round(amount * 0.01);
    return `${fee.toLocaleString('es-ES')} XAF`;
  }
  return 'Sin comisión';
}

export function getNetAmount(gateway: PaymentGateway, amount: number): number {
  if (gateway === 'stripe') return amount - Math.round(amount * 0.029) - 30;
  if (gateway === 'orange_money' || gateway === 'mtn_mobile') return amount - Math.round(amount * 0.01);
  return amount;
}
