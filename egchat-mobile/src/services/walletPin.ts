import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'egchat_wallet_pin_hash';
const PIN_SET_KEY = 'egchat_wallet_pin_set';
const PIN_SALT = 'egchat_pin_salt_v1';

async function hashPIN(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, PIN_SALT + pin);
}

export const walletPIN = {
  isSet: async (): Promise<boolean> => (await AsyncStorage.getItem(PIN_SET_KEY)) === '1',
  verify: async (pin: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) return false;
    return (await hashPIN(pin)) === stored;
  },
  save: async (pin: string): Promise<void> => {
    const hash = await hashPIN(pin);
    await AsyncStorage.setItem(PIN_KEY, hash);
    await AsyncStorage.setItem(PIN_SET_KEY, '1');
    await AsyncStorage.removeItem('egchat_wallet_pin');
  },
  clear: async (): Promise<void> => {
    await AsyncStorage.multiRemove([PIN_KEY, PIN_SET_KEY, 'egchat_wallet_pin']);
  },
};
