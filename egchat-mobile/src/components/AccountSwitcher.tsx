/**
 * AccountSwitcher — Panel para cambiar entre cuentas
 * Muestra avatar + nombre + badge de no leídos de cada cuenta.
 * Botón "Añadir cuenta" si hay menos de 3.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EGAvatar } from './ui';
import {
  getAccounts, switchToAccount, removeAccount,
  type Account,
} from '../services/multiAccount';
import { setToken } from '../api';

interface Props {
  visible: boolean;
  currentAccountId: string;
  onClose: () => void;
  onSwitch: (accountId: string) => void;
  onAddAccount: () => void;
}

export function AccountSwitcher({
  visible, currentAccountId, onClose, onSwitch, onAddAccount,
}: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (visible) getAccounts().then(setAccounts);
  }, [visible]);

  const handleSwitch = async (account: Account) => {
    if (account.id === currentAccountId) { onClose(); return; }
    setSwitching(account.id);
    const token = await switchToAccount(account.id);
    if (token) {
      await setToken(token);
      onSwitch(account.id);
    }
    setSwitching(null);
    onClose();
  };

  const handleRemove = async (accountId: string) => {
    await removeAccount(accountId);
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>Cambiar cuenta</Text>

          {accounts.map(acc => {
            const isActive  = acc.id === currentAccountId;
            const isLoading = switching === acc.id;
            return (
              <TouchableOpacity
                key={acc.id}
                style={[s.row, isActive && s.rowActive]}
                onPress={() => handleSwitch(acc)}
                activeOpacity={0.7}
              >
                <View style={s.avatarWrap}>
                  <EGAvatar src={acc.avatar} name={acc.name} size={48} />
                  {acc.unreadCount > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{acc.unreadCount > 99 ? '99+' : acc.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{acc.name}</Text>
                  <Text style={s.phone}>{acc.phone}</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator color="#00c8a0" />
                ) : isActive ? (
                  <View style={s.activeDot} />
                ) : null}
                {!isActive && !isLoading && (
                  <TouchableOpacity onPress={() => handleRemove(acc.id)} style={s.removeBtn} hitSlop={8}>
                    <Text style={s.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}

          {accounts.length < 3 && (
            <TouchableOpacity style={s.addBtn} onPress={() => { onClose(); onAddAccount(); }} activeOpacity={0.8}>
              <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.addGrad}>
                <Text style={s.addIcon}>+</Text>
              </LinearGradient>
              <Text style={s.addText}>Añadir cuenta</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34, paddingHorizontal: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', alignSelf: 'center', marginVertical: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderRadius: 14, paddingHorizontal: 8,
    marginBottom: 4,
  },
  rowActive: { backgroundColor: 'rgba(0,200,160,0.08)' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  phone: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00c8a0' },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 14, color: '#d1d5db', fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 8, marginTop: 8 },
  addGrad: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff', fontWeight: '300' },
  addText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
