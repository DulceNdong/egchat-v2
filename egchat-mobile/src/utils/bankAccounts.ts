import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BankAccount {
  id: string;
  bank: string;
  type: string;
  balance: number;
}

const KEY = 'egchat_bank_accounts_v1';

// Cuentas bancarias declaradas por el usuario. EGChat no se conecta a ningún
// banco: estas filas son informativas y nunca se descuentan ni se suman al
// monedero, así que no se sembrarían con saldos inventados.
export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

export async function loadBankAccounts(): Promise<BankAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveBankAccounts(accounts: BankAccount[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(accounts));
}
