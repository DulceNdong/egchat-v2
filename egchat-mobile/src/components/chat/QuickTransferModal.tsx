import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Path, Circle, Polyline, Rect } from 'react-native-svg';
import { walletAPI, authAPI } from '../../api';
import { walletPIN } from '../../services/walletPin';
import { checkLimitForTransaction, updateLimitForTransaction } from '../../services/limits';
import { EGAvatar } from '../ui';
import { loadBankAccounts, BankAccount } from '../../utils/bankAccounts';

interface Props {
  visible: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar?: string;
  recipientId?: string;
  recipientPhone?: string;
  myAvatar?: string;
  myName?: string;
  onTransferred: (messageText: string) => void;
  onNeedPin: (executeTransferWithPin: (pin: string) => Promise<void>) => void;
  onNeedSetupPin: (onPinSetupDone: () => void) => void;
}

// ── Iconos SVG ───────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
      <Line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
    </Svg>
  );
}

function IconArrow() {
  return (
    <Svg width={28} height={16} viewBox="0 0 28 16" fill="none">
      <Path d="M0 8h24M18 2l6 6-6 6" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconBank() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v2H3V9z" stroke="#1a73e8" strokeWidth={1.8} strokeLinejoin="round" />
      <Rect x="5" y="11" width="3" height="7" rx="0.5" stroke="#1a73e8" strokeWidth={1.8} />
      <Rect x="10.5" y="11" width="3" height="7" rx="0.5" stroke="#1a73e8" strokeWidth={1.8} />
      <Rect x="16" y="11" width="3" height="7" rx="0.5" stroke="#1a73e8" strokeWidth={1.8} />
      <Line x1="3" y1="18" x2="21" y2="18" stroke="#1a73e8" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function IconCheck() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Polyline points="20,6 9,17 4,12" stroke="#1a73e8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconWallet() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M21 7H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" stroke="#16a34a" strokeWidth={1.8} />
      <Path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="#16a34a" />
      <Path d="M3 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" stroke="#16a34a" strokeWidth={1.8} />
    </Svg>
  );
}

// ── Errores del servidor que indican PIN no configurado ──────────────────────
const PIN_NOT_CONFIGURED_MSGS = ['pin no configurado', 'no pin', 'pin not set', 'pin not configured'];
function isPinNotConfiguredError(msg: string): boolean {
  return PIN_NOT_CONFIGURED_MSGS.some(s => msg.toLowerCase().includes(s));
}

// ── Fuente de fondos seleccionada ────────────────────────────────────────────
type FundSource =
  | { type: 'wallet' }
  | { type: 'bank'; account: BankAccount };

// ════════════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════════════

export function QuickTransferModal({
  visible,
  onClose,
  contactName,
  contactAvatar,
  recipientId,
  recipientPhone,
  myAvatar,
  myName = 'Yo',
  onTransferred,
  onNeedPin,
  onNeedSetupPin,
}: Props) {
  const [amount, setAmount]               = useState('');
  const [balance, setBalance]             = useState(0);
  const [loading, setLoading]             = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError]                 = useState('');

  // Cuentas bancarias vinculadas
  const [bankAccounts, setBankAccounts]   = useState<BankAccount[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [fundSource, setFundSource]       = useState<FundSource>({ type: 'wallet' });

  const transferExecuted = React.useRef(false);

  const refreshBalance = () => {
    walletAPI.getBalance()
      .then(r => setBalance(Number(r.balance) || 0))
      .catch(() => {});
  };

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setError('');
    setShowBankPicker(false);
    setFundSource({ type: 'wallet' });
    transferExecuted.current = false;
    setLoadingBalance(true);

    Promise.all([
      walletAPI.getBalance().then(r => setBalance(Number(r.balance) || 0)).catch(() => setBalance(0)),
      loadBankAccounts().then(setBankAccounts).catch(() => setBankAccounts([])),
    ]).finally(() => setLoadingBalance(false));
  }, [visible]);

  // Cuando cambia el monto, verificar si el monedero alcanza
  useEffect(() => {
    if (!amount) { setShowBankPicker(false); return; }
    const num = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0 && num > balance && bankAccounts.length > 0) {
      setShowBankPicker(true);
    } else {
      setShowBankPicker(false);
      setFundSource({ type: 'wallet' });
    }
  }, [amount, balance, bankAccounts]);

  const handleSend = async () => {
    const raw = amount.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    if (!raw || num <= 0) { setError('Introduce un monto válido'); return; }

    // Verificar fondos según la fuente seleccionada
    if (fundSource.type === 'wallet') {
      if (num > Number(balance)) { setError('Saldo insuficiente en el monedero'); return; }
    } else {
      if (num > fundSource.account.balance) {
        setError(`Saldo insuficiente en cuenta ${fundSource.account.bank}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const to = recipientPhone || recipientId || contactName;
      const transfer = { amount: num, to, description: `Chat: ${contactName}` };

      // Verificar límites
      const limitCheck = await checkLimitForTransaction('transfer', num);
      if (!limitCheck.allowed) {
        setError(limitCheck.reason || 'Límite diario de transferencias excedido');
        setLoading(false);
        return;
      }

      // Verificar si tiene PIN configurado — fuente de verdad = servidor
      let hasPin = false;
      try {
        const localPin = await walletPIN.isSet();
        if (localPin) {
          const pinStatus = await authAPI.hasPinConfigured();
          hasPin = pinStatus.hasPin;
          if (!hasPin) await walletPIN.clear();
        } else {
          const pinStatus = await authAPI.hasPinConfigured();
          hasPin = pinStatus.hasPin;
        }
      } catch {
        hasPin = await walletPIN.isSet().catch(() => false);
      }

      setLoading(false);

      const buildExecutor = (onPinNotConfigured: () => void) =>
        async (pin: string): Promise<void> => {
          if (transferExecuted.current) return;
          transferExecuted.current = true;

          try {
            let pinOk = false;
            try { pinOk = await walletPIN.verify(pin); } catch { pinOk = false; }

            if (!pinOk) {
              try {
                const res = await authAPI.verifyPin(pin);
                pinOk = res?.valid === true;
              } catch (serverErr: any) {
                const msg: string = serverErr?.message || '';
                if (isPinNotConfiguredError(msg)) {
                  transferExecuted.current = false;
                  await walletPIN.clear().catch(() => {});
                  onPinNotConfigured();
                  return;
                }
                throw serverErr;
              }
            }

            if (!pinOk) {
              transferExecuted.current = false;
              throw new Error('PIN incorrecto');
            }

            const result = await walletAPI.transferPending(
              transfer.to,
              transfer.amount,
              transfer.description,
            );
            await updateLimitForTransaction('transfer', transfer.amount);

            if (result?.balance != null) {
              setBalance(Number(result.balance));
            } else {
              refreshBalance();
            }

            const sourceLabel = fundSource.type === 'bank'
              ? `${fundSource.account.bank} (${fundSource.account.type})`
              : 'Monedero EGCHAT';
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const msgText = [
              '💸 Transferencia enviada',
              `💰 ${transfer.amount.toLocaleString()} XAF`,
              `👤 Para: ${contactName}`,
              `🏦 Desde: ${sourceLabel}`,
              `🔑 Ref: ${code}`,
              '⏳ Pendiente de aceptación',
              `🆔 ${result.transferId}`,
            ].join('\n');

            onTransferred(msgText);
            onClose();
          } catch (e: any) {
            transferExecuted.current = false;
            throw e;
          }
        };

      if (!hasPin) {
        onNeedSetupPin(() => {
          const executor = buildExecutor(() => {
            onNeedSetupPin(() => onNeedPin(buildExecutor(() => {})));
          });
          onNeedPin(executor);
        });
      } else {
        const executor = buildExecutor(() => {
          onNeedSetupPin(() => {
            const retryExecutor = buildExecutor(() => {});
            onNeedPin(retryExecutor);
          });
        });
        onNeedPin(executor);
      }
    } catch (e: any) {
      setError(e?.message || 'Error al preparar la transferencia. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const isSendDisabled = loading || loadingBalance || numAmount <= 0;

  // Fuente de fondos activa con saldo disponible
  const activeBalance = fundSource.type === 'wallet'
    ? balance
    : fundSource.account.balance;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
          <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>

            {/* ── Cabecera ── */}
            <LinearGradient colors={['#1a73e8', '#0d47a1']} style={s.header}>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <IconClose />
              </TouchableOpacity>
              <View style={s.avatarsRow}>
                <View style={s.avatarCol}>
                  <EGAvatar src={myAvatar} name={myName} size={52} />
                  <Text style={s.avatarLabel}>Yo</Text>
                </View>
                <View style={s.arrowCol}>
                  <IconArrow />
                  <Text style={s.arrowLabel}>Enviar</Text>
                </View>
                <View style={s.avatarCol}>
                  <EGAvatar src={contactAvatar} name={contactName} size={52} />
                  <Text style={s.avatarLabel} numberOfLines={1}>{contactName}</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.body}
            >
              {/* ── Saldo de la fuente activa ── */}
              <View style={s.balanceRow}>
                {fundSource.type === 'wallet'
                  ? <View style={s.balanceLeft}><IconWallet /><Text style={s.balanceLabel}>Saldo monedero</Text></View>
                  : <View style={s.balanceLeft}><IconBank /><Text style={s.balanceLabelBank}>{fundSource.account.bank}</Text></View>
                }
                {loadingBalance
                  ? <ActivityIndicator size="small" color="#16a34a" />
                  : <Text style={[s.balanceValue, fundSource.type === 'bank' && s.balanceValueBank]}>
                      {activeBalance.toLocaleString()} XAF
                    </Text>
                }
              </View>

              {/* ── Input de monto ── */}
              <Text style={s.amountLabel}>MONTO (XAF)</Text>
              <View style={s.amountRow}>
                <Text style={s.amountPrefix}>XAF</Text>
                <TextInput
                  style={s.amountInput}
                  value={amount}
                  onChangeText={t => { setAmount(t.replace(/[^0-9]/g, '')); setError(''); }}
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  keyboardType="number-pad"
                  maxLength={12}
                />
              </View>

              {/* ── Error ── */}
              {!!error && <Text style={s.errorText}>{error}</Text>}

              {/* ── Selector de cuenta bancaria (aparece cuando monedero es insuficiente) ── */}
              {showBankPicker && (
                <View style={s.bankPickerSection}>
                  <Text style={s.bankPickerTitle}>
                    Saldo insuficiente en monedero. Selecciona otra fuente:
                  </Text>

                  {/* Opción monedero (aunque sea insuficiente, mostrar para que el user elija) */}
                  <TouchableOpacity
                    style={[s.bankOption, fundSource.type === 'wallet' && s.bankOptionActive]}
                    onPress={() => setFundSource({ type: 'wallet' })}
                    activeOpacity={0.75}
                  >
                    <View style={s.bankOptionLeft}>
                      <View style={[s.bankIconCircle, { backgroundColor: '#f0fdf4' }]}>
                        <IconWallet />
                      </View>
                      <View>
                        <Text style={s.bankOptionName}>Monedero EGCHAT</Text>
                        <Text style={s.bankOptionType}>Saldo disponible</Text>
                      </View>
                    </View>
                    <View style={s.bankOptionRight}>
                      <Text style={[s.bankOptionBalance, balance < numAmount && s.bankOptionBalanceLow]}>
                        {balance.toLocaleString()} XAF
                      </Text>
                      {fundSource.type === 'wallet' && <IconCheck />}
                    </View>
                  </TouchableOpacity>

                  {/* Cuentas bancarias */}
                  {bankAccounts.map(acc => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[
                        s.bankOption,
                        fundSource.type === 'bank' && fundSource.account.id === acc.id && s.bankOptionActive,
                      ]}
                      onPress={() => setFundSource({ type: 'bank', account: acc })}
                      activeOpacity={0.75}
                    >
                      <View style={s.bankOptionLeft}>
                        <View style={[s.bankIconCircle, { backgroundColor: '#eff6ff' }]}>
                          <IconBank />
                        </View>
                        <View>
                          <Text style={s.bankOptionName}>{acc.bank}</Text>
                          <Text style={s.bankOptionType}>{acc.type}</Text>
                        </View>
                      </View>
                      <View style={s.bankOptionRight}>
                        <Text style={[s.bankOptionBalance, acc.balance < numAmount && s.bankOptionBalanceLow]}>
                          {acc.balance.toLocaleString()} XAF
                        </Text>
                        {fundSource.type === 'bank' && fundSource.account.id === acc.id && <IconCheck />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ── Botón enviar ── */}
              <TouchableOpacity
                style={[s.sendBtn, isSendDisabled && s.sendBtnDisabled]}
                onPress={handleSend}
                disabled={isSendDisabled}
              >
                <LinearGradient
                  colors={isSendDisabled ? ['#9ca3af', '#6b7280'] : ['#1a73e8', '#0d47a1']}
                  style={s.sendGrad}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.sendText}>Enviar a {contactName}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>

          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  kav:              { width: '100%' },
  sheet:            { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '90%' },
  header:           { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  closeBtn:         {
    position: 'absolute', top: 14, right: 14, width: 30, height: 30,
    borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  avatarsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatarCol:        { alignItems: 'center', gap: 4, maxWidth: 80 },
  avatarLabel:      { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  arrowCol:         { alignItems: 'center', gap: 2 },
  arrowLabel:       { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  body:             { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },

  // Saldo
  balanceRow:       {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 18,
  },
  balanceLeft:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceLabel:     { fontSize: 12, color: '#374151', fontWeight: '500' },
  balanceLabelBank: { fontSize: 12, color: '#1a73e8', fontWeight: '600' },
  balanceValue:     { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  balanceValueBank: { color: '#1a73e8' },

  // Monto
  amountLabel:      {
    fontSize: 11, color: '#9ca3af', fontWeight: '600', textAlign: 'center',
    letterSpacing: 1, marginBottom: 6,
  },
  amountRow:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 2, borderBottomColor: '#1a73e8',
    marginHorizontal: 20, paddingBottom: 4, marginBottom: 16, gap: 4,
  },
  amountPrefix:     { fontSize: 18, fontWeight: '600', color: '#9ca3af' },
  amountInput:      {
    fontSize: 40, fontWeight: '800', color: '#111827',
    minWidth: 120, textAlign: 'center', padding: 0,
  },

  // Error
  errorText:        {
    color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12,
    backgroundColor: '#fef2f2', padding: 8, borderRadius: 8,
  },

  // Selector de cuentas bancarias
  bankPickerSection: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    overflow: 'hidden',
  },
  bankPickerTitle: {
    fontSize: 11, color: '#6366f1', fontWeight: '600',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    backgroundColor: '#eef2ff',
    letterSpacing: 0.2,
  },
  bankOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  bankOptionActive: {
    backgroundColor: '#f0f9ff',
  },
  bankOptionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankIconCircle:   {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  bankOptionName:   { fontSize: 13, fontWeight: '700', color: '#111827' },
  bankOptionType:   { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  bankOptionRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bankOptionBalance: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  bankOptionBalanceLow: { color: '#ef4444' },

  // Botones
  sendBtn:          { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  sendBtnDisabled:  { opacity: 0.7 },
  sendGrad:         { paddingVertical: 15, alignItems: 'center' },
  sendText:         { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn:        { alignItems: 'center', paddingVertical: 6 },
  cancelText:       { fontSize: 14, color: '#9ca3af' },
});
