// Sistema de Límites Diarios de Transacciones
import * as SecureStore from 'expo-secure-store';

export interface TransactionLimit {
  type: 'withdrawal' | 'transfer' | 'payment' | 'all';
  dailyLimit: number;
  monthlyLimit: number;
  currentDay: number;
  currentMonth: number;
  lastReset: string;
}

export interface LimitSettings {
  withdrawalDaily: number;
  transferDaily: number;
  paymentDaily: number;
  requirePINAboveLimit: boolean;
  alertThreshold: number; // % del límite
  limits: Record<string, TransactionLimit>;
}

const DEFAULT_LIMITS: LimitSettings = {
  withdrawalDaily: 500000, // 500k XAF
  transferDaily: 1000000, // 1M XAF
  paymentDaily: 2000000, // 2M XAF
  requirePINAboveLimit: true,
  alertThreshold: 80, // Alertar al 80%
  limits: {
    withdrawal: {
      type: 'withdrawal',
      dailyLimit: 500000,
      monthlyLimit: 10000000,
      currentDay: 0,
      currentMonth: 0,
      lastReset: new Date().toISOString(),
    },
    transfer: {
      type: 'transfer',
      dailyLimit: 1000000,
      monthlyLimit: 15000000,
      currentDay: 0,
      currentMonth: 0,
      lastReset: new Date().toISOString(),
    },
    payment: {
      type: 'payment',
      dailyLimit: 2000000,
      monthlyLimit: 20000000,
      currentDay: 0,
      currentMonth: 0,
      lastReset: new Date().toISOString(),
    },
  },
};

const LIMITS_KEY = 'egchat_transaction_limits';

export async function getLimitSettings(): Promise<LimitSettings> {
  try {
    const stored = await SecureStore.getItemAsync(LIMITS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_LIMITS;
  } catch {
    return DEFAULT_LIMITS;
  }
}

export async function saveLimitSettings(settings: LimitSettings): Promise<void> {
  await SecureStore.setItemAsync(LIMITS_KEY, JSON.stringify(settings));
}

function normalizeTransactionLimit(limit: TransactionLimit) {
  const now = new Date();
  const lastReset = new Date(limit.lastReset);
  const sameDay = now.getDate() === lastReset.getDate()
    && now.getMonth() === lastReset.getMonth()
    && now.getFullYear() === lastReset.getFullYear();
  const sameMonth = now.getMonth() === lastReset.getMonth() && now.getFullYear() === lastReset.getFullYear();

  return {
    ...limit,
    currentDay: sameDay ? limit.currentDay : 0,
    currentMonth: sameMonth ? limit.currentMonth : 0,
    lastReset: sameDay ? limit.lastReset : now.toISOString(),
  };
}

export async function checkLimitForTransaction(
  type: 'withdrawal' | 'transfer' | 'payment',
  amount: number,
): Promise<{ allowed: boolean; remaining: number; requiresPin: boolean; reason?: string }> {
  const settings = await getLimitSettings();
  const limit = settings.limits[type];

  if (!limit) {
    return { allowed: true, remaining: 999999999, requiresPin: false };
  }

  const normalized = normalizeTransactionLimit(limit);
  const dailyAllowed = normalized.dailyLimit - normalized.currentDay;
  const monthlyAllowed = normalized.monthlyLimit - normalized.currentMonth;

  if (amount > dailyAllowed) {
    return {
      allowed: false,
      remaining: dailyAllowed,
      requiresPin: false,
      reason: `Límite diario de ${type} excedido. Máximo disponible: ${dailyAllowed} XAF`,
    };
  }

  if (amount > monthlyAllowed) {
    return {
      allowed: false,
      remaining: monthlyAllowed,
      requiresPin: false,
      reason: `Límite mensual de ${type} excedido. Máximo disponible: ${monthlyAllowed} XAF`,
    };
  }

  const requiresPin = settings.requirePINAboveLimit && (normalized.currentDay + amount) > (normalized.dailyLimit * 0.5);
  const remaining = Math.min(dailyAllowed, monthlyAllowed) - amount;

  return {
    allowed: true,
    remaining,
    requiresPin,
  };
}

export async function updateLimitForTransaction(
  type: 'withdrawal' | 'transfer' | 'payment',
  amount: number,
): Promise<{ allowed: boolean; remaining: number; requiresPin: boolean; reason?: string }> {
  const settings = await getLimitSettings();
  const limit = settings.limits[type];

  if (!limit) {
    return { allowed: true, remaining: 999999999, requiresPin: false };
  }

  const normalized = normalizeTransactionLimit(limit);
  const dailyAllowed = normalized.dailyLimit - normalized.currentDay;
  const monthlyAllowed = normalized.monthlyLimit - normalized.currentMonth;

  if (amount > dailyAllowed) {
    return {
      allowed: false,
      remaining: dailyAllowed,
      requiresPin: false,
      reason: `Límite diario de ${type} excedido. Máximo disponible: ${dailyAllowed} XAF`,
    };
  }

  if (amount > monthlyAllowed) {
    return {
      allowed: false,
      remaining: monthlyAllowed,
      requiresPin: false,
      reason: `Límite mensual de ${type} excedido. Máximo disponible: ${monthlyAllowed} XAF`,
    };
  }

  const requiresPin = settings.requirePINAboveLimit && (normalized.currentDay + amount) > (normalized.dailyLimit * 0.5);
  const remaining = Math.min(dailyAllowed, monthlyAllowed) - amount;

  settings.limits[type] = {
    ...normalized,
    currentDay: normalized.currentDay + amount,
    currentMonth: normalized.currentMonth + amount,
  };

  await saveLimitSettings(settings);

  return {
    allowed: true,
    remaining,
    requiresPin,
  };
}

export async function checkLimitAlert(
  type: 'withdrawal' | 'transfer' | 'payment',
): Promise<{ shouldAlert: boolean; percentUsed: number; remaining: number }> {
  const settings = await getLimitSettings();
  const limit = settings.limits[type];

  if (!limit) return { shouldAlert: false, percentUsed: 0, remaining: 0 };

  const percentUsed = (limit.currentDay / limit.dailyLimit) * 100;
  const shouldAlert = percentUsed >= settings.alertThreshold;

  return {
    shouldAlert,
    percentUsed,
    remaining: limit.dailyLimit - limit.currentDay,
  };
}

export async function resetAllLimits(): Promise<void> {
  const settings = DEFAULT_LIMITS;
  settings.limits = Object.entries(DEFAULT_LIMITS.limits).reduce(
    (acc, [key, val]) => ({
      ...acc,
      [key]: { ...val, currentDay: 0, currentMonth: 0, lastReset: new Date().toISOString() },
    }),
    {},
  );
  await saveLimitSettings(settings);
}

export async function getLimitProgress(type: 'withdrawal' | 'transfer' | 'payment' | 'all') {
  const settings = await getLimitSettings();

  if (type === 'all') {
    const allLimits = Object.values(settings.limits);
    const totalDaily = allLimits.reduce((sum, l) => sum + l.dailyLimit, 0);
    const totalUsed = allLimits.reduce((sum, l) => sum + l.currentDay, 0);
    return {
      daily: { used: totalUsed, limit: totalDaily, percent: (totalUsed / totalDaily) * 100 },
      limits: settings.limits,
    };
  }

  const limit = settings.limits[type];
  return {
    daily: {
      used: limit?.currentDay || 0,
      limit: limit?.dailyLimit || 0,
      percent: limit ? (limit.currentDay / limit.dailyLimit) * 100 : 0,
    },
  };
}
