// WalletModals.tsx — Modales del monedero para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import { useTranslation } from '../context/LanguageContext';

// ── Tipos ─────────────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'transferencia' | 'codigo' | 'efectivo' | 'confirm' | 'success';
type WStep = 'menu' | 'tarjeta' | 'banco' | 'agente' | 'confirm' | 'success';

// ── Componentes auxiliares ────────────────────────────────────────
const SectionHead = ({ title, sub, color }: { title: string; sub: string; color: string }) => (
  <View style={[styles.sectionHead, { backgroundColor: color }]}>
    <Text style={styles.sectionHeadTitle}>{title}</Text>
    <Text style={styles.sectionHeadSub}>{sub}</Text>
  </View>
);

const Field = ({
  label, value, onChangeText, keyboardType = 'default', placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; placeholder?: string;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
    />
  </View>
);

// ══════════════════════════════════════════════════════════════════
// MODAL RECARGA
// ══════════════════════════════════════════════════════════════════
interface RecargaProps {
  visible: boolean;
  onClose: () => void;
  userBalance: number;
  onCredit: (n: number) => void;
}

export const RecargaMonederoModal: React.FC<RecargaProps> = ({ visible, onClose, userBalance, onCredit }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<RStep>('menu');
  const [amount, setAmount] = useState('');
  const [banco, setBanco] = useState('');
  const [codigo, setCodigo] = useState('');

  const amountNum = parseInt(amount || '0');
  const isValid = amountNum >= 1000;

  const METODOS = [
    { id: 'banco', label: t('walFromBankEmoji'), sub: t('walFromBankSub') },
    { id: 'transferencia', label: t('walTransferEgchatEmoji'), sub: t('walBankTransferEgchatSub') },
    { id: 'codigo', label: t('walRechargeCodeEmoji'), sub: t('walRechargeCodeSub') },
    { id: 'efectivo', label: t('walCashDepositEmoji'), sub: t('walCashDepositSub') },
  ];

  const TITLES: Record<RStep, string> = {
    menu: t('walRechargeWallet'), banco: t('walFromBank'), transferencia: t('walBankTransferEgchat'),
    codigo: t('walRechargeCode'), efectivo: t('walCashDeposit'),
    confirm: t('walConfirmRecharge'), success: t('walRechargeDone'),
  };

  const reset = () => { setStep('menu'); setAmount(''); setBanco(''); setCodigo(''); };
  const close = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === 'menu' ? close : () => setStep('menu')}>
            <Text style={styles.backBtn}>{step === 'menu' ? '✕' : t('walBackArrow')}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.modalTitle}>{TITLES[step]}</Text>
            <Text style={styles.modalSub}>{t('walBalancePrefix')} {userBalance.toLocaleString()} XAF</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {step === 'menu' && (
            <>
              <SectionHead title={t('walEgchatWallet')} sub={`${userBalance.toLocaleString()} XAF ${t('walAvailableSuffix')}`} color="#1A3A6B" />
              {METODOS.map(m => (
                <TouchableOpacity key={m.id} style={styles.menuItem} onPress={() => setStep(m.id as RStep)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemLabel}>{m.label}</Text>
                    <Text style={styles.menuItemSub}>{m.sub}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'banco' && (
            <>
              <SectionHead title={t('walBankTransfer')} sub={t('walBankTransferData')} color="#1B3A6B" />
              <View style={styles.infoBox}>
                {[[t('walBeneficiary'), 'EGCHAT S.A.'], [t('walBankLabel'), 'BANGE / CCEI / BGFI'], [t('walAccount'), 'GQ-EGCHAT-001-2026'], [t('walConcept'), t('walConceptRechargeFull')]].map(([l, v]) => (
                  <View key={l} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{l}</Text>
                    <Text style={styles.infoValue}>{v}</Text>
                  </View>
                ))}
              </View>
              <Field label={t('walAmountMin1k')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !banco) && styles.btnDisabled]}
                onPress={() => { if (isValid && banco) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>{t('confirm')} {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'codigo' && (
            <>
              <SectionHead title={t('walRechargeCode')} sub={t('walRedeemVoucher')} color="#92400E" />
              <Field label={t('walCode16')} value={codigo} onChangeText={setCodigo} placeholder="XXXX-XXXX-XXXX-XXXX" />
              <View style={styles.denominaciones}>
                {[1000, 2000, 5000, 10000, 25000, 50000].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.denom, amount === String(v) && styles.denomSelected]}
                    onPress={() => setAmount(String(v))}
                  >
                    <Text style={[styles.denomText, amount === String(v) && styles.denomTextSelected]}>
                      {v.toLocaleString()}
                    </Text>
                    <Text style={styles.denomXAF}>XAF</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, codigo.replace(/-/g, '').length < 16 && styles.btnDisabled]}
                onPress={() => {
                  if (codigo.replace(/-/g, '').length >= 16) {
                    onCredit(parseInt(amount || '5000'));
                    setStep('success');
                  }
                }}
              >
                <Text style={styles.btnPrimaryText}>{t('walRedeemCode')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'efectivo' && (
            <>
              <SectionHead title={t('walCashDeposit')} sub={t('walAuthorizedAgents')} color="#4C1D95" />
              {[
                { nombre: 'Agente EGCHAT Centro', dir: 'Av. de la Independencia, Malabo', tel: '+240222300001' },
                { nombre: 'Agente EGCHAT Caracolas', dir: 'Barrio Caracolas, Malabo', tel: '+240222300002' },
                { nombre: 'Agente EGCHAT Ela Nguema', dir: 'Ela Nguema, Malabo', tel: '+240222300003' },
                { nombre: 'Agente EGCHAT Bata', dir: 'Centro de Bata', tel: '+240222300004' },
              ].map(a => (
                <View key={a.nombre} style={styles.agentItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{a.nombre}</Text>
                    <Text style={styles.agentDir}>📍 {a.dir}</Text>
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${a.tel}`)}>
                    <Text style={styles.callBtnText}>{t('walCallPhone')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {step === 'confirm' && (
            <>
              <SectionHead title={t('walConfirmRecharge')} sub={t('walReviewBeforeContinue')} color="#1B3A6B" />
              <View style={styles.confirmBox}>
                {[[t('walMethod'), t('walBankTransfer')], [t('walAmount'), `${amountNum.toLocaleString()} XAF`]].map(([l, v]) => (
                  <View key={l} style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>{l}</Text>
                    <Text style={styles.confirmValue}>{v}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep('success')}>
                <Text style={styles.btnPrimaryText}>{t('walIDidTransfer')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>{t('walOperationDone')}</Text>
              <Text style={styles.successSub}>{t('walWillCreditSoon')}</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={close}>
                <Text style={styles.btnPrimaryText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════
// MODAL RETIRO
// ══════════════════════════════════════════════════════════════════
interface RetiroProps {
  visible: boolean;
  onClose: () => void;
  userBalance: number;
  onDebit: (n: number) => void;
}

export const RetiroMonederoModal: React.FC<RetiroProps> = ({ visible, onClose, userBalance, onDebit }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<WStep>('menu');
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [banco, setBanco] = useState('');
  const [cuenta, setCuenta] = useState('');

  const amountNum = parseInt(amount || '0');
  const isValid = amountNum >= 1000 && amountNum <= userBalance;

  const METODOS = [
    { id: 'tarjeta', label: t('walWithdrawToCardEmoji'), sub: t('walWithdrawToCardSub2') },
    { id: 'banco', label: t('walBankTransferEmoji'), sub: t('walWithdrawBankSub2') },
    { id: 'agente', label: t('walWithdrawAgentEmoji'), sub: t('walWithdrawAgentSub') },
  ];

  const TITLES: Record<WStep, string> = {
    menu: t('walWithdrawMoney'), tarjeta: t('walWithdrawToCard'), banco: t('walBankTransfer'),
    agente: t('walWithdrawAgent'), confirm: t('walConfirmWithdraw'), success: t('walWithdrawDone'),
  };

  const reset = () => { setStep('menu'); setAmount(''); setCardNumber(''); setPin(''); setBanco(''); setCuenta(''); };
  const close = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === 'menu' ? close : () => setStep('menu')}>
            <Text style={styles.backBtn}>{step === 'menu' ? '✕' : t('walBackArrow')}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.modalTitle}>{TITLES[step]}</Text>
            <Text style={styles.modalSub}>{t('walAvailablePrefix')} {userBalance.toLocaleString()} XAF</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {step === 'menu' && (
            <>
              <SectionHead title={t('walWithdrawMoney')} sub={`${userBalance.toLocaleString()} XAF ${t('walAvailableSuffix')}`} color="#4C1D95" />
              {METODOS.map(m => (
                <TouchableOpacity key={m.id} style={styles.menuItem} onPress={() => setStep(m.id as WStep)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemLabel}>{m.label}</Text>
                    <Text style={styles.menuItemSub}>{m.sub}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'tarjeta' && (
            <>
              <SectionHead title={t('walWithdrawToCard')} sub={t('walTransferToCard')} color="#1B3A6B" />
              <Field label={t('walAmountToWithdrawMin')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Field label={t('walCardLast4')} value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" />
              <Field label={t('walConfirmPinLabel')} value={pin} onChangeText={setPin} keyboardType="numeric" />
              {amountNum > userBalance && amountNum > 0 && (
                <Text style={styles.errorText}>{t('walInsufficientWarn')}</Text>
              )}
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !cardNumber || !pin) && styles.btnDisabled]}
                onPress={() => { if (isValid && cardNumber && pin) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>{t('continue')} {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'banco' && (
            <>
              <SectionHead title={t('walBankTransfer')} sub={t('walToYourGqAccount')} color="#065F46" />
              <Field label={t('walAmountToWithdrawMin')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Field label={t('walDestBank')} value={banco} onChangeText={setBanco} />
              <Field label={t('walBankAccountNumber')} value={cuenta} onChangeText={setCuenta} />
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !banco || !cuenta) && styles.btnDisabled]}
                onPress={() => { if (isValid && banco && cuenta) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>{t('continue')} {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'agente' && (
            <>
              <SectionHead title={t('walWithdrawAgent')} sub={t('walImmediateCash')} color="#4C1D95" />
              <Field label={t('walAmountToWithdrawMin')} value={amount} onChangeText={setAmount} keyboardType="numeric" />
              {[
                { nombre: 'Agente EGCHAT Centro', dir: 'Av. de la Independencia, Malabo', tel: '+240222300001' },
                { nombre: 'Agente EGCHAT Caracolas', dir: 'Barrio Caracolas, Malabo', tel: '+240222300002' },
              ].map(a => (
                <View key={a.nombre} style={styles.agentItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{a.nombre}</Text>
                    <Text style={styles.agentDir}>📍 {a.dir}</Text>
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${a.tel}`)}>
                    <Text style={styles.callBtnText}>{t('walCallPhone')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.btnPrimary, !isValid && styles.btnDisabled]}
                onPress={() => { if (isValid) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>{t('walGenerateWithdrawCode')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'confirm' && (
            <>
              <SectionHead title={t('walConfirmWithdraw')} sub={t('walReviewBeforeContinue')} color="#4C1D95" />
              <View style={styles.confirmBox}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{t('walAmount')}</Text>
                  <Text style={styles.confirmValue}>{amountNum.toLocaleString()} XAF</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>{t('walRemainingBalance')}</Text>
                  <Text style={styles.confirmValue}>{(userBalance - amountNum).toLocaleString()} XAF</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => { onDebit(amountNum); setStep('success'); }}>
                <Text style={styles.btnPrimaryText}>{t('walConfirmWithdraw')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>{t('walWithdrawDone')}</Text>
              <Text style={styles.successSub}>{t('walMoneyOnWay')}</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={close}>
                <Text style={styles.btnPrimaryText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  backBtn: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  sectionHead: {
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  sectionHeadTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  sectionHeadSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5',
  },
  menuItemLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuItemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 20, color: '#D1D5DB' },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  fieldInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  infoBox: {
    backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
  },
  infoLabel: { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize: 11, fontWeight: '700', color: '#1B3A6B' },
  denominaciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  denom: {
    width: '30%', backgroundColor: '#fff', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F2F5',
  },
  denomSelected: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  denomText: { fontSize: 12, fontWeight: '800', color: '#111827' },
  denomTextSelected: { color: '#92400E' },
  denomXAF: { fontSize: 9, color: '#9CA3AF' },
  agentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 13,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5',
  },
  agentName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  agentDir: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  callBtn: { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 8 },
  callBtnText: { fontSize: 11, fontWeight: '700', color: '#4C1D95' },
  confirmBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#F0F2F5',
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  confirmLabel: { fontSize: 12, color: '#6B7280' },
  confirmValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
  successWrap: { alignItems: 'center', padding: 30, gap: 12 },
  successIcon: { fontSize: 60 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  btnPrimary: {
    backgroundColor: '#00c8a0', borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
});
