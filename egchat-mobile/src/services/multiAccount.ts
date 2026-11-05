/**
 * EGChat — Sistema de múltiples cuentas
 * Permite tener hasta 3 cuentas y cambiar entre ellas sin cerrar sesión.
 * Cada cuenta tiene su token, perfil y badge de no leídos.
 *
 * Uso:
 *   const { accounts, activeAccount, switchAccount, addAccount } = useMultiAccount();
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const MAX_ACCOUNTS = 3;
const ACCOUNTS_KEY  = 'egchat_accounts';
const ACTIVE_KEY    = 'egchat_active_account';

export interface Account {
  id: string;           // userId
  phone: string;
  name: string;
  avatar?: string;
  tokenKey: string;     // clave en SecureStore donde se guarda el JWT
  unreadCount: number;
}

// ── Leer/Guardar lista de cuentas ─────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function getActiveAccountId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_KEY);
}

export async function setActiveAccountId(accountId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, accountId);
}

// ── Gestión de tokens por cuenta ──────────────────────────────────

function tokenKey(accountId: string) { return `egchat_token_${accountId}`; }

export async function saveAccountToken(accountId: string, token: string): Promise<void> {
  await SecureStore.setItemAsync(tokenKey(accountId), token);
}

export async function getAccountToken(accountId: string): Promise<string | null> {
  try { return await SecureStore.getItemAsync(tokenKey(accountId)); }
  catch { return null; }
}

export async function deleteAccountToken(accountId: string): Promise<void> {
  try { await SecureStore.deleteItemAsync(tokenKey(accountId)); } catch {}
}

// ── Operaciones principales ───────────────────────────────────────

/** Añadir nueva cuenta al gestor */
export async function addAccount(account: Omit<Account, 'tokenKey'>, token: string): Promise<boolean> {
  const accounts = await getAccounts();
  if (accounts.length >= MAX_ACCOUNTS) return false;
  if (accounts.find(a => a.id === account.id)) return false; // ya existe

  const key = tokenKey(account.id);
  await SecureStore.setItemAsync(key, token);
  const newAccount: Account = { ...account, tokenKey: key };
  await saveAccounts([...accounts, newAccount]);
  return true;
}

/** Cambiar a otra cuenta — devuelve el token de la cuenta destino */
export async function switchToAccount(accountId: string): Promise<string | null> {
  const token = await getAccountToken(accountId);
  if (!token) return null;
  await setActiveAccountId(accountId);
  return token;
}

/** Eliminar una cuenta del gestor */
export async function removeAccount(accountId: string): Promise<void> {
  await deleteAccountToken(accountId);
  const accounts = await getAccounts();
  await saveAccounts(accounts.filter(a => a.id !== accountId));
  const active = await getActiveAccountId();
  if (active === accountId) {
    const remaining = accounts.filter(a => a.id !== accountId);
    if (remaining.length > 0) await setActiveAccountId(remaining[0].id);
    else await AsyncStorage.removeItem(ACTIVE_KEY);
  }
}

/** Actualizar badge de no leídos de una cuenta */
export async function updateAccountUnread(accountId: string, count: number): Promise<void> {
  const accounts = await getAccounts();
  await saveAccounts(accounts.map(a => a.id === accountId ? { ...a, unreadCount: count } : a));
}
