import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BankAccount {
  id: string;
  bank: string;
  type: string;
  balance: number;
}

const KEY = 'egchat_bank_accounts_v1';

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  { id: '1', bank: 'BANGE', type: 'Corriente', balance: 45200 },
  { id: '2', bank: 'CCEI Bank', type: 'Ahorros', balance: 80000 },
];

export async function loadBankAccounts(): Promise<BankAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [...DEFAULT_BANK_ACCOUNTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_BANK_ACCOUNTS];
  } catch {
    return [...DEFAULT_BANK_ACCOUNTS];
  }
}

export async function saveBankAccounts(accounts: BankAccount[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(accounts));
}
