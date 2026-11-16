import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BankAccount {
  id: string;
  bank: string;
  type: string;
  balance: number;
}

const LEGACY_KEY = 'egchat_bank_accounts_v1';
const keyFor = (userId?: string) =>
  userId ? `${LEGACY_KEY}_${userId}` : LEGACY_KEY;

// Cuentas bancarias declaradas por el usuario. EGChat no se conecta a ningún
// banco: estas filas son informativas y nunca se descuentan ni se suman al
// monedero, así que no se sembrarían con saldos inventados.
export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

export async function loadBankAccounts(userId?: string): Promise<BankAccount[]> {
  try {
    const key = keyFor(userId);
    let raw = await AsyncStorage.getItem(key);
    // Migración: la clave global antigua se adopta una sola vez para el
    // usuario que la encuentra y se borra, para que no se filtre a otra
    // cuenta que use el mismo dispositivo.
    if (!raw && userId) {
      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy) {
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveBankAccounts(userId: string | undefined, accounts: BankAccount[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(accounts));
}
