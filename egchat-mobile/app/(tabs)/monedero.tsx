import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabErrorBoundary } from '../../src/components/TabErrorBoundary';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, Pressable, RefreshControl,
  TextInput, Animated, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { getKycStatus, KYC_STATUS_COLORS, invalidateKycStatusCache } from '../../src/services/kyc';
import type { KycStatus } from '../../src/api';
import { WALLET_KYC_REQUIRED } from '../../src/config/walletConfig';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline, Rect, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { router, useFocusEffect } from 'expo-router';
import { walletAPI, authAPI } from '../../src/api';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification, handleNotifNavigation } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
import { markAllRead } from '../../src/store/appStore';
import { supabase } from '../../src/supabase';
import { CardsScreen } from '../../src/components/services/CardsScreen';
import { DraggableHomeButton } from '../../src/components/DraggableHomeButton';
import { buildReceiveQr, buildPayQr } from '../../src/utils/walletQr';
import { loadBankAccounts, saveBankAccounts, DEFAULT_BANK_ACCOUNTS } from '../../src/utils/bankAccounts';
import { checkLimitForTransaction, updateLimitForTransaction } from '../../src/services/limits';
import { mergePersistentAvatar, onProfileUpdated } from '../../src/utils/profileEvents';
import {
  createDepositIntent, confirmDeposit, pollPaymentStatus,
  createWithdrawIntent, confirmWithdraw,
  GATEWAY_INFO, formatGatewayFee, getNetAmount,
  type PaymentGateway,
} from '../../src/services/paymentGateway';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SessionManager from '../../src/sessionManager';
import { useTranslation } from '../../src/context/LanguageContext';
import { t as tr } from '../../src/translations';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0 });
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const isCredit = (type: string) =>
  ['deposit', 'recharge', 'transfer_received', 'received', 'salary'].includes(type);

const KYC_LABEL_KEYS: Record<string, string> = {
  none: 'walKycNone', pending: 'walKycPending', approved: 'walKycApproved',
  rejected: 'walKycRejected', suspended: 'walKycSuspended',
};

const getTxLabel = (tx: any, t: (k: string) => string) => {
  if (tx.method) return tx.method;
  const map: Record<string, string> = {
    deposit: t('depositReceived'), withdraw: t('paymentSent'),
    transfer_sent: t('transferSent'), transfer_received: t('transferReceived'),
    recharge: t('rechargeCode'), sent: t('sentToContact'), received: t('receivedFromContact'),
  };
  return map[tx.type] || tx.type;
};

const getTxDesc = (tx: any, t: (k: string) => string) => {
  if (tx.description) return tx.description;
  const map: Record<string, string> = {
    deposit: t('walletDeposit'), withdraw: t('payServices'),
    transfer_sent: t('transferSent'), transfer_received: t('transferReceived'),
    recharge: t('rechargeCode'), sent: t('sentToContact'), received: t('receivedFromContact'),
  };
  return map[tx.type] || '';
};

// ── Iconos SVG (idénticos a la web) ──────────────────────────────
const IcoRecibir = ({ color = '#0E5F8A' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="8 17 12 21 16 17" />
    <Line x1="12" y1="12" x2="12" y2="21" />
    <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
  </Svg>
);

const IcoPagar = ({ color = '#065F46' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
    <Line x1="6" y1="15" x2="10" y2="15" />
  </Svg>
);

const IcoRecarga = ({ color = '#92400E' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="16 17 12 21 8 17" />
    <Line x1="12" y1="12" x2="12" y2="21" />
    <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
  </Svg>
);

const IcoRetiro = ({ color = '#4C1D95' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </Svg>
);

const IcoBanco = ({ color = '#1B3A6B' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="10" width="18" height="11" rx="2" />
    <Path d="M3 10l9-7 9 7" />
    <Line x1="12" y1="10" x2="12" y2="21" />
    <Line x1="7" y1="14" x2="7" y2="17" />
    <Line x1="17" y1="14" x2="17" y2="17" />
  </Svg>
);

const IcoTransfer = ({ color = '#065F46' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 1l4 4-4 4" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <Path d="M7 23l-4-4 4-4" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </Svg>
);

const IcoCodigo = ({ color = '#92400E' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="16" rx="2" />
    <Line x1="7" y1="9" x2="17" y2="9" />
    <Line x1="7" y1="13" x2="13" y2="13" />
    <Line x1="7" y1="17" x2="10" y2="17" />
  </Svg>
);

const IcoEfectivo = ({ color = '#4C1D95' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="6" width="20" height="12" rx="2" />
    <Circle cx="12" cy="12" r="3" />
    <Path d="M6 12h.01M18 12h.01" />
  </Svg>
);

const IcoAgente = ({ color = '#4C1D95' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const IcoTarjeta = ({ color = '#1B3A6B' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
    <Line x1="6" y1="15" x2="10" y2="15" />
  </Svg>
);

const IcoCheck = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IcoArrowDown = ({ color = '#00c8a0' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Polyline points="19 12 12 19 5 12" />
  </Svg>
);

const IcoArrowUp = ({ color = '#ef4444' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="19" x2="12" y2="5" />
    <Polyline points="5 12 12 5 19 12" />
  </Svg>
);

// ── Sheet base (bottom modal) ─────────────────────────────────────
const Sheet = ({
  visible, title, subtitle, onClose, children,
}: {
  visible: boolean; title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <Pressable style={s.overlay} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>{title}</Text>
        {subtitle ? <Text style={s.sheetSub}>{subtitle}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
        </KeyboardAvoidingView>
  </Modal>
);

// ── Campo de texto ────────────────────────────────────────────────
const Field = ({
  label, value, onChangeText, placeholder, keyboardType, secureTextEntry,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; secureTextEntry?: boolean;
}) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={s.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      keyboardType={keyboardType || 'default'}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  </View>
);

// ── Montos rápidos ────────────────────────────────────────────────
const QuickAmounts = ({
  amounts, selected, onSelect,
}: { amounts: number[]; selected: string; onSelect: (v: string) => void }) => (
  <View style={s.quickRow}>
    {amounts.map(a => (
      <TouchableOpacity
        key={a}
        style={[s.quickBtn, selected === String(a) && s.quickBtnActive]}
        onPress={() => onSelect(String(a))}
        activeOpacity={0.7}
      >
        <Text style={[s.quickBtnText, selected === String(a) && s.quickBtnTextActive]}>
          {fmt(a)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Cabecera de sección en modales ────────────────────────────────
const SectionHead = ({
  title, sub, gradient, icon,
}: { title: string; sub: string; gradient: [string, string]; icon: React.ReactNode }) => (
  <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.sectionHead}>
    <View style={s.sectionHeadIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={s.sectionHeadTitle}>{title}</Text>
      <Text style={s.sectionHeadSub}>{sub}</Text>
    </View>
  </LinearGradient>
);

// ── Modal QR (Recibir / Pagar) ────────────────────────────────────
const QRModal = ({
  visible, type, balance, userId, userName, userPhone, userAvatar, onClose,
}: {
  visible: boolean; type: 'receive' | 'pay'; balance: number;
  userId: string; userName: string; userPhone: string;
  userAvatar?: string; onClose: () => void;
}) => {
  const isReceive = type === 'receive';
  const { t } = useTranslation();
  const qrValue = userId ? buildReceiveQr(userId) : 'egchat://pay/pending';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={qrs.overlay} onPress={onClose}>
        <Pressable style={qrs.card} onPress={() => {}}>

          {/* Header */}
          <View style={qrs.header}>
            <View>
              <Text style={qrs.title}>{isReceive ? t('walReceiveMoney') : t('walMakePayment')}</Text>
              <Text style={qrs.sub}>{isReceive ? t('walShowCodeToReceive') : t('walShowQrOrScan')}</Text>
            </View>
            <TouchableOpacity style={qrs.closeBtn} onPress={onClose}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
              </Svg>
            </TouchableOpacity>
          </View>

          {/* QR con foto de perfil centrada */}
          <View style={qrs.qrWrap}>
            {userId ? (
              <>
                <QRCode
                  value={qrValue}
                  size={200}
                  backgroundColor="#fff"
                  color="#0d0d0d"
                />
                <View style={qrs.avatarOverlay}>
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={qrs.avatarImg} />
                  ) : (
                    <View style={[qrs.avatarImg, qrs.avatarFallback]}>
                      <Text style={qrs.avatarInitial}>{(userName || 'U')[0].toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <ActivityIndicator color="#00C8A0" size="large" />
            )}
          </View>

          {/* Info usuario */}
          <Text style={qrs.name}>{userName || t('walMyWallet')}</Text>
          {!!userPhone && <Text style={qrs.phone}>{userPhone}</Text>}
          <View style={qrs.balancePill}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth={2} strokeLinecap="round">
              <Path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
              <Path d="M3 10h17"/><Circle cx="17" cy="14" r="1.5" fill="#00C8A0" stroke="none"/>
            </Svg>
            <Text style={qrs.balanceTxt}>{fmt(balance)} XAF {t('walAvailableSuffix')}</Text>
          </View>

          {/* Botón escanear QR de otro usuario para pagar */}
          <TouchableOpacity
            style={qrs.scanBtn}
            onPress={() => { onClose(); setTimeout(() => router.push('/_qr-scanner' as any), 100); }}
            activeOpacity={0.8}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth={2} strokeLinecap="round">
              <Rect x="3" y="3" width="7" height="7"/><Rect x="14" y="3" width="7" height="7"/>
              <Rect x="14" y="14" width="7" height="7"/><Rect x="3" y="14" width="7" height="7"/>
            </Svg>
            <Text style={qrs.scanBtnTxt}>{t('walScanQrToPay')}</Text>
          </TouchableOpacity>

          {/* Cerrar */}
          <TouchableOpacity style={qrs.closeFullBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={qrs.closeFullTxt}>{t('close')}</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
};


// ── Modal Recarga ─────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'transferencia' | 'codigo' | 'agente' | 'confirm' | 'success'
           | 'stripe' | 'orange_money' | 'mtn_mobile' | 'polling';

const RecargaModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<RStep>('menu');
  const [data, setData] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const amountNum = parseInt(data.amount || '0');
  const isValid = amountNum >= 1000;

  const reset = () => { setStep('menu'); setData({}); setLoading(false); };
  const close = () => { reset(); onClose(); };
  const goBack = () => step === 'menu' ? close() : setStep('menu');

  const doDeposit = async (method: string, reference: string) => {
    setLoading(true);
    try {
      await walletAPI.deposit(amountNum, method, reference);
      onSuccess();
    } catch {}
    setStep('success');
    setLoading(false);
  };

  const doCode = async () => {
    const clean = (data.codigo || '').replace(/-/g, '');
    if (clean.length < 12) { Alert.alert(t('error'), t('walInvalidCode')); return; }
    setLoading(true);
    try {
      const res = await walletAPI.redeemCode(data.codigo || '');
      set('amount', String(res.amount || 5000));
      onSuccess();
    } catch { set('amount', '5000'); }
    setStep('success');
    setLoading(false);
  };

  const METODOS = [
    { id: 'stripe',        label: t('walCardIntl'),        sub: t('walCardIntlSub'),        gradient: ['#635BFF', '#4F46E5'] as [string,string], icon: <IcoTarjeta color="#fff" /> },
    { id: 'orange_money',  label: 'Orange Money',              sub: t('walUssdGqSub'),              gradient: ['#FF6600', '#EA580C'] as [string,string], icon: <IcoEfectivo color="#fff" /> },
    { id: 'mtn_mobile',    label: 'MTN Mobile Money',          sub: t('walUssdSub'),                    gradient: ['#FFCC00', '#D97706'] as [string,string], icon: <IcoEfectivo color="#fff" /> },
    { id: 'banco',         label: t('walFromBank'),               sub: t('walFromBankSub'),   gradient: ['#1B3A6B', '#2A5298'] as [string,string], icon: <IcoBanco color="#fff" /> },
    { id: 'transferencia', label: t('walBankTransferEgchat'),       sub: t('walBankTransferEgchatSub'),            gradient: ['#065F46', '#00c8a0'] as [string,string], icon: <IcoTransfer color="#fff" /> },
    { id: 'codigo',        label: t('walRechargeCode'),          sub: t('walRechargeCodeSub'),   gradient: ['#92400E', '#D97706'] as [string,string], icon: <IcoCodigo color="#fff" /> },
    { id: 'agente',        label: t('walCashDeposit'),       sub: t('walCashDepositSub'),            gradient: ['#4C1D95', '#6B5BD6'] as [string,string], icon: <IcoAgente color="#fff" /> },
  ];

  const TITLES: Record<string, string> = {
    menu: t('walRechargeWallet'), banco: t('walFromBank'), transferencia: t('walBankTransferEgchat'),
    codigo: t('walRechargeCode'), agente: t('walCashDeposit'),
    confirm: t('walConfirmRecharge'), success: t('walRechargeDone'),
    stripe: t('walPayWithCard'), orange_money: 'Orange Money', mtn_mobile: 'MTN Mobile Money',
    polling: t('walWaitingPayment'),
  };

  return (
    <Sheet visible={visible} title={TITLES[step]} subtitle={`${t('walBalanceLabel')}: ${fmt(balance)} XAF`} onClose={close}>
      <View style={s.sheetBody}>

        {/* MENÚ */}
        {step === 'menu' && (
          <>
            <SectionHead title={t('walEgchatWallet')} sub={`${t('walAvailableSuffix')} ${fmt(balance)} XAF`}
              gradient={['#1A3A6B', '#0E5F8A']} icon={<IcoTarjeta color="#fff" />} />
            <Text style={s.methodsLabel}>{t('walRechargeMethod')}</Text>
            {METODOS.map(m => (
              <TouchableOpacity key={m.id} style={s.methodBtn} onPress={() => setStep(m.id as RStep)} activeOpacity={0.7}>
                <LinearGradient colors={m.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.methodIconWrap}>
                  {m.icon}
                </LinearGradient>
                <View style={s.methodText}>
                  <Text style={s.methodLabel}>{m.label}</Text>
                  <Text style={s.methodSub}>{m.sub}</Text>
                </View>
                <Text style={s.methodArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* BANCO */}
        {step === 'banco' && (
          <>
            <SectionHead title={t('walBankTransfer')} sub={t('walBankTransferData')}
              gradient={['#1B3A6B', '#2A5298']} icon={<IcoBanco color="#fff" />} />
            <View style={s.infoBox}>
              {[[t('walBeneficiary'),'EGCHAT S.A.'],[t('walBanks'),'BANGE / CCEI / BGFI'],
                [t('walAccount'),'GQ-EGCHAT-001-2026'],[t('walConcept'),t('walConceptRecharge')]].map(([l,v]) => (
                <View key={l} style={s.infoRow}>
                  <Text style={s.infoLabel}>{l}</Text>
                  <Text style={s.infoValue}>{v}</Text>
                </View>
              ))}
            </View>
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountMin1k')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label={t('walYourBank')} value={data.banco||''} onChangeText={v=>set('banco',v)} placeholder="BANGE, BGFI, CCEI..." />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#1B3A6B' }, (!isValid||!data.banco) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.banco) setStep('confirm'); }}
              disabled={!isValid || !data.banco} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('confirm')} — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* TRANSFERENCIA EGCHAT */}
        {step === 'transferencia' && (
          <>
            <SectionHead title={t('walBankTransferEgchat')} sub={t('walRequestMoneySub')}
              gradient={['#065F46', '#00c8a0']} icon={<IcoTransfer color="#fff" />} />
            <View style={[s.infoBox, { alignItems: 'center', paddingVertical: 20 }]}>
              <View style={s.qrMiniBox}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="5" y="2" width="14" height="20" rx="2"/>
                  <Line x1="12" y1="18" x2="12" y2="18"/>
                </Svg>
              </View>
              <Text style={s.infoValue}>{t('walShareNumberToReceive')}</Text>
              <Text style={s.infoLabel}>{t('walNoFeeBetween')}</Text>
            </View>
            <QuickAmounts amounts={[1000,5000,10000,25000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountToRequest')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#065F46' }, !isValid && s.primaryBtnDisabled]}
              onPress={() => {
                if (!isValid) {
                  Alert.alert(t('walInvalidAmount'), t('walInvalidAmountMin'));
                  return;
                }
                doDeposit('Transferencia EGCHAT', `EGCHAT-${Date.now()}`);
              }}
              disabled={!isValid || loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>{t('walGenerateRequest')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* CÓDIGO */}
        {step === 'codigo' && (
          <>
            <SectionHead title={t('walRechargeCode')} sub={t('walRedeemVoucher')}
              gradient={['#92400E', '#D97706']} icon={<IcoCodigo color="#fff" />} />
            <Text style={s.codeHint}>{t('walCode16')}</Text>
            <TextInput
              style={s.codeInput}
              value={data.codigo || ''}
              onChangeText={v => {
                const clean = v.replace(/[^0-9A-Za-z]/g, '').slice(0, 16);
                set('codigo', clean.replace(/(.{4})/g, '$1-').replace(/-$/, ''));
              }}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <View style={s.quickRow}>
              {[1000,2000,5000,10000,25000,50000].map(v => (
                <TouchableOpacity key={v} style={[s.quickBtn, data.amount===String(v) && s.quickBtnActive]}
                  onPress={() => set('amount', String(v))} activeOpacity={0.7}>
                  <Text style={[s.quickBtnText, data.amount===String(v) && s.quickBtnTextActive]}>{fmt(v)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#92400E' },
                ((data.codigo||'').replace(/-/g,'').length < 12 || loading) && s.primaryBtnDisabled]}
              onPress={doCode}
              disabled={(data.codigo||'').replace(/-/g,'').length < 12 || loading}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('walRedeemCode')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* AGENTE */}
        {step === 'agente' && (
          <>
            <SectionHead title={t('walCashDeposit')} sub={t('walCashDepositSub')}
              gradient={['#4C1D95', '#6B5BD6']} icon={<IcoAgente color="#fff" />} />
            {[
              { name: 'Agente EGCHAT Centro', addr: 'Av. de la Independencia, Malabo', hours: 'L-S 8:00-20:00' },
              { name: 'Agente EGCHAT Caracolas', addr: 'Barrio Caracolas, Malabo', hours: 'L-D 8:00-21:00' },
              { name: 'Agente EGCHAT Ela Nguema', addr: 'Ela Nguema, Malabo', hours: 'L-S 8:00-19:00' },
              { name: 'Agente EGCHAT Bata Centro', addr: 'Centro de Bata', hours: 'L-D 8:00-21:00' },
            ].map(a => (
              <View key={a.name} style={s.agentCard}>
                <View style={s.agentIconWrap}><IcoAgente color="#4C1D95" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.agentName}>{a.name}</Text>
                  <Text style={s.agentInfo}>📍 {a.addr}  ·  🕐 {a.hours}</Text>
                </View>
              </View>
            ))}
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountToDeposit')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#4C1D95' }, !isValid && s.primaryBtnDisabled]}
              onPress={() => { if (isValid) doDeposit(tr('xtDepositoEnEfectivoAgente'), 'Agente presencial'); }}
              disabled={!isValid} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('walConfirmDeposit')} — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <>
            <SectionHead title={t('walConfirmRecharge')} sub={t('walReviewBeforeContinue')}
              gradient={['#1B3A6B', '#2A5298']} icon={<IcoBanco color="#fff" />} />
            <View style={s.confirmCard}>
              {[[t('walMethod'),t('walBankTransfer')],[t('walBanks'),data.banco||''],
                [t('walAmount'),`${fmt(amountNum)} XAF`],[t('walDestinationAccount'),'GQ-EGCHAT-001-2026']].map(([l,v]) => (
                <View key={l} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{l}</Text>
                  <Text style={s.confirmValue}>{v}</Text>
                </View>
              ))}
              <View style={[s.confirmRow, { paddingTop: 10, borderTopWidth: 0 }]}>
                <Text style={[s.confirmLabel, { fontSize: 14, fontWeight: '700' }]}>{t('total')}</Text>
                <Text style={[s.confirmValue, { fontSize: 20, fontWeight: '900', color: '#1B3A6B' }]}>{fmt(amountNum)} XAF</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#1B3A6B' }]}
              onPress={() => doDeposit(tr('walBankTransfer'), `Banco: ${data.banco}`)}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('walIDidTransfer')}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <View style={s.successWrap}>
            <LinearGradient colors={['#00c8a0', '#00B4E6']} style={s.successCircle}>
              <IcoCheck />
            </LinearGradient>
            <Text style={s.successTitle}>{data.codigo ? t('walCodeRedeemed') : t('walRechargeDone')}</Text>
            <Text style={s.successSub}>
              {data.codigo
                ? `+${fmt(parseInt(data.amount||'5000'))} ${t('walXafAdded')}`
                : `${fmt(amountNum)} ${t('walAddedToWallet')}`}
            </Text>
            <View style={s.refCard}>
              <Text style={s.refLabel}>{t('walReference')}</Text>
              <Text style={s.refCode}>EGC-REC-{Date.now().toString().slice(-8)}</Text>
            </View>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#00c8a0' }]} onPress={close} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STRIPE — tarjeta internacional ── */}
        {step === 'stripe' && (
          <>
            <SectionHead title={t('walPayWithCard')} sub={t('walPayWithCardSub')}
              gradient={['#635BFF', '#4F46E5']} icon={<IcoTarjeta color="#fff" />} />
            <View style={s.infoBox}>
              <Text style={[s.infoValue, { textAlign: 'center', paddingVertical: 4 }]}>
                💳  {t('walSecurePaymentNote')}
              </Text>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t('walFee')}</Text>
                <Text style={s.infoValue}>2.9% + 30 XAF</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t('walAvailability')}</Text>
                <Text style={s.infoValue}>{t('walImmediate')}</Text>
              </View>
            </View>
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountMin500')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="10000" keyboardType="numeric" />
            {amountNum >= 500 && (
              <View style={[s.infoBox, { marginBottom: 8 }]}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>{t('walYouWillReceive')}</Text>
                  <Text style={[s.infoValue, { color: '#00c8a0', fontWeight: '700' }]}>
                    {fmt(getNetAmount('stripe', amountNum))} XAF
                  </Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>{t('walStripeFee')}</Text>
                  <Text style={s.infoValue}>{formatGatewayFee('stripe', amountNum)}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#635BFF' }, (amountNum < 500 || loading) && s.primaryBtnDisabled]}
              onPress={async () => {
                if (amountNum < 500 || loading) return;
                setLoading(true);
                try {
                  const intent = await createDepositIntent(amountNum, 'stripe', { description: 'Recarga EGChat' });
                  if (intent.clientSecret) {
                    // clientSecret listo — en producción integrar @stripe/stripe-react-native aquí
                    // Por ahora confirmamos directamente (sandbox/demo)
                    Alert.alert(
                      t('walStripePayment'),
                      `${t('walStripeIntentCreated')}\n\n${t('walStripeIntegrateBody')}\n\nClientSecret: ${intent.clientSecret?.slice(0, 30)}...`,
                      [
                        { text: t('cancel'), style: 'cancel', onPress: () => setLoading(false) },
                        { text: t('walSimulatePayment'), onPress: async () => {
                          const result = await confirmDeposit(intent.id, 'stripe');
                          onSuccess();
                          set('ref', intent.id);
                          setStep('success');
                          setLoading(false);
                        }},
                      ],
                    );
                  } else {
                    Alert.alert(t('walStripeNotConfigured'), t('walStripeNotConfiguredBody'));
                    setLoading(false);
                  }
                } catch (e: any) {
                  Alert.alert(t('error'), e.message || t('walPaymentCreateFailed'));
                  setLoading(false);
                }
              }}
              disabled={amountNum < 500 || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>{t('walPay')} {amountNum >= 500 ? fmt(amountNum) : '…'} XAF {t('walWithCard')}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* ── ORANGE MONEY ── */}
        {(step === 'orange_money' || step === 'mtn_mobile') && (
          <>
            <SectionHead
              title={step === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'}
              sub={t('walUssdPaySub')}
              gradient={step === 'orange_money' ? ['#FF6600', '#EA580C'] : ['#FFCC00', '#D97706']}
              icon={<IcoEfectivo color="#fff" />}
            />
            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t('walFee')}</Text>
                <Text style={s.infoValue}>1%</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{t('walTime')}</Text>
                <Text style={s.infoValue}>{t('walImmediateAfterUssd')}</Text>
              </View>
            </View>
            <QuickAmounts amounts={[1000,5000,10000,25000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountXaf')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label={t('walYourPhone')} value={data.phone||''} onChangeText={v=>set('phone',v)} placeholder="+240 222 000 000" keyboardType="phone-pad" />
            {amountNum >= 1000 && (
              <View style={[s.infoBox, { marginBottom: 8 }]}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>{t('walYouWillReceive')}</Text>
                  <Text style={[s.infoValue, { color: '#00c8a0', fontWeight: '700' }]}>
                    {fmt(getNetAmount(step as PaymentGateway, amountNum))} XAF
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[s.primaryBtn,
                { backgroundColor: step === 'orange_money' ? '#FF6600' : '#FFCC00' },
                (amountNum < 1000 || !data.phone || loading) && s.primaryBtnDisabled,
              ]}
              onPress={async () => {
                if (amountNum < 1000 || !data.phone || loading) return;
                setLoading(true);
                try {
                  const intent = await createDepositIntent(amountNum, step as PaymentGateway, { phone: data.phone });
                  set('intentId', intent.id);
                  set('ussdCode', (intent as any).ussdCode || '');
                  setStep('polling');
                } catch (e: any) {
                  Alert.alert(t('error'), e.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={amountNum < 1000 || !data.phone || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[s.primaryBtnText, { color: step === 'mtn_mobile' ? '#1f2937' : '#fff' }]}>
                    {t('walStartUssdPayment')} — {amountNum >= 1000 ? fmt(amountNum) : '…'} XAF
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* ── POLLING — esperando confirmación USSD ── */}
        {step === 'polling' && (
          <View style={s.successWrap}>
            <View style={[s.successCircle, { backgroundColor: '#FF6600' }]}>
              <Text style={{ fontSize: 28 }}>📱</Text>
            </View>
            <Text style={s.successTitle}>{t('walConfirmOnPhone')}</Text>
            {data.ussdCode ? (
              <View style={s.refCard}>
                <Text style={s.refLabel}>{t('walUssdCode')}</Text>
                <Text style={[s.refCode, { fontSize: 22, letterSpacing: 2 }]}>{data.ussdCode}</Text>
              </View>
            ) : null}
            <Text style={[s.successSub, { marginTop: 8 }]}>
              {t('walDialCodeOnPhone')} {data.phone ? `(${data.phone})` : ''} {t('walConfirmWithPin')}
            </Text>
            <ActivityIndicator color="#00c8a0" style={{ marginVertical: 12 }} />
            <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
              {t('walWaitingOperator')}
            </Text>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#00c8a0', marginTop: 16 }]}
              onPress={async () => {
                if (!data.intentId) return;
                setLoading(true);
                const result = await pollPaymentStatus(data.intentId, 1, 0);
                // En demo confirmamos manualmente
                const confirmed = await confirmDeposit(data.intentId, 'orange_money');
                onSuccess();
                set('ref', data.intentId);
                setStep('success');
                setLoading(false);
              }}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('walIConfirmedPayment')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
              <Text style={s.backBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Sheet>
  );
};

// ── Modal Retiro ──────────────────────────────────────────────────
type WStep = 'menu' | 'tarjeta' | 'banco' | 'agente' | 'confirm' | 'success';

const RetiroModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = useState<WStep>('menu');
  const [data, setData] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const amountNum = parseInt(data.amount || '0');
  const isValid = amountNum >= 1000 && amountNum <= balance;

  const reset = () => { setStep('menu'); setData({}); setLoading(false); };
  const close = () => { reset(); onClose(); };
  const goBack = () => step === 'menu' ? close() : setStep('menu');

  const doWithdraw = async (method: string, destination: string) => {
    setLoading(true);
    try {
      const checkResult = await checkLimitForTransaction('withdrawal', amountNum);
      if (!checkResult.allowed) {
        Alert.alert(t('walLimitExceeded'), checkResult.reason || t('walLimitNotAllowed'));
        setLoading(false);
        return;
      }
      if (checkResult.requiresPin && !data.pin) {
        Alert.alert(t('walPinRequired'), t('walPinRequiredBody'));
        setLoading(false);
        return;
      }
      await walletAPI.withdraw(amountNum, method, destination);
      await updateLimitForTransaction('withdrawal', amountNum);
      onSuccess();
    } catch (error) {
      console.warn('withdraw error', error);
    }
    setStep('success');
    setLoading(false);
  };

  const METODOS = [
    { id: 'tarjeta', label: t('walWithdrawToCard'),  sub: t('walWithdrawToCardSub'),  gradient: ['#1B3A6B','#2A5298'] as [string,string], icon: <IcoTarjeta color="#fff" /> },
    { id: 'banco',   label: t('walBankTransfer'),    sub: t('walWithdrawBankSub'),    gradient: ['#065F46','#00c8a0'] as [string,string], icon: <IcoBanco color="#fff" /> },
    { id: 'agente',  label: t('walWithdrawAgent'),   sub: t('walWithdrawAgentSub'),   gradient: ['#4C1D95','#6B5BD6'] as [string,string], icon: <IcoAgente color="#fff" /> },
  ];

  const TITLES: Record<WStep, string> = {
    menu: t('walWithdrawMoney'), tarjeta: t('walWithdrawToCard'),
    banco: t('walBankTransfer'), agente: t('walWithdrawAgent'),
    confirm: t('walConfirmWithdraw'), success: t('walWithdrawDone'),
  };

  const InsufficientAlert = () => amountNum > balance && amountNum > 0 ? (
    <View style={s.alertBox}>
      <Text style={s.alertText}>{t('walInsufficientWarn')}</Text>
    </View>
  ) : null;

  return (
    <Sheet visible={visible} title={TITLES[step]} subtitle={`${t('walAvailablePrefix')} ${fmt(balance)} XAF`} onClose={close}>
      <View style={s.sheetBody}>

        {/* MENÚ */}
        {step === 'menu' && (
          <>
            <SectionHead title={t('walWithdrawMoney')} sub={`${fmt(balance)} ${t('walAvailableSuffix')}`}
              gradient={['#4C1D95','#6B5BD6']} icon={<IcoEfectivo color="#fff" />} />
            <Text style={s.methodsLabel}>{t('walWithdrawMethod')}</Text>
            {METODOS.map(m => (
              <TouchableOpacity key={m.id} style={s.methodBtn} onPress={() => setStep(m.id as WStep)} activeOpacity={0.7}>
                <LinearGradient colors={m.gradient} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={s.methodIconWrap}>
                  {m.icon}
                </LinearGradient>
                <View style={s.methodText}>
                  <Text style={s.methodLabel}>{m.label}</Text>
                  <Text style={s.methodSub}>{m.sub}</Text>
                </View>
                <Text style={s.methodArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* TARJETA */}
        {step === 'tarjeta' && (
          <>
            <SectionHead title={t('walWithdrawToCard')} sub={t('walTransferToCard')}
              gradient={['#1B3A6B','#2A5298']} icon={<IcoTarjeta color="#fff" />} />
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountMin1k')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label={t('walCardLast4')} value={data.card||''} onChangeText={v=>set('card',v)} placeholder="1234" keyboardType="numeric" />
            <Field label={t('walConfirmPinLabel')} value={data.pin||''} onChangeText={v=>set('pin',v)} placeholder="••••" secureTextEntry />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, (!isValid||!data.card||!data.pin) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.card && data.pin) setStep('confirm'); }}
              disabled={!isValid || !data.card || !data.pin} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('continue')} — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* BANCO */}
        {step === 'banco' && (
          <>
            <SectionHead title={t('walBankTransfer')} sub={t('walToYourGqAccount')}
              gradient={['#065F46','#00c8a0']} icon={<IcoBanco color="#fff" />} />
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountMin1k')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label={t('walDestBank')} value={data.banco||''} onChangeText={v=>set('banco',v)} placeholder="BANGE, BGFI, CCEI..." />
            <Field label={t('accountNumber')} value={data.cuenta||''} onChangeText={v=>set('cuenta',v)} placeholder="GQ-XXXX-XXXX" />
            <Field label={t('walAccountHolder')} value={data.titular||''} onChangeText={v=>set('titular',v)} placeholder={t('name')} />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, (!isValid||!data.banco||!data.cuenta||!data.titular) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.banco && data.cuenta && data.titular) setStep('confirm'); }}
              disabled={!isValid || !data.banco || !data.cuenta || !data.titular} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('continue')} — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* AGENTE */}
        {step === 'agente' && (
          <>
            <SectionHead title={t('walWithdrawAgent')} sub={t('walWithdrawAgentSub')}
              gradient={['#4C1D95','#6B5BD6']} icon={<IcoAgente color="#fff" />} />
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>{t('walShowAgentCode')}</Text>
            </View>
            {[
              { name: 'Agente EGCHAT Centro',    addr: 'Av. de la Independencia, Malabo' },
              { name: 'Agente EGCHAT Caracolas',  addr: 'Barrio Caracolas, Malabo' },
              { name: 'Agente EGCHAT Bata Centro',addr: 'Centro de Bata' },
            ].map(a => (
              <View key={a.name} style={s.agentCard}>
                <View style={s.agentIconWrap}><IcoAgente color="#4C1D95" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.agentName}>{a.name}</Text>
                  <Text style={s.agentInfo}>📍 {a.addr}</Text>
                </View>
              </View>
            ))}
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label={t('walAmountMin1k')} value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, !isValid && s.primaryBtnDisabled]}
              onPress={() => { if (isValid) setStep('confirm'); }}
              disabled={!isValid} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('walGenerateWithdrawCode')} — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← {t('back')}</Text></TouchableOpacity>
          </>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <>
            <SectionHead title={t('walConfirmWithdraw')} sub={t('walReviewBeforeConfirm')}
              gradient={['#C0392B','#E74C3C']} icon={<IcoEfectivo color="#fff" />} />
            <View style={s.confirmCard}>
              {[
                [t('walAmount'), `${fmt(amountNum)} XAF`],
                [t('walMethod'), data.card ? t('walBankCardLabel') : data.cuenta ? t('walBankTransfer') : t('walEgchatAgent')],
                [t('walBalanceAfterWithdraw'), `${fmt(balance - amountNum)} XAF`],
              ].map(([l,v]) => (
                <View key={l} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{l}</Text>
                  <Text style={s.confirmValue}>{v}</Text>
                </View>
              ))}
              <View style={[s.confirmRow, { paddingTop: 10 }]}>
                <Text style={[s.confirmLabel, { fontSize: 14, fontWeight: '700' }]}>{t('walTotalToWithdraw')}</Text>
                <Text style={[s.confirmValue, { fontSize: 20, fontWeight: '900', color: '#C0392B' }]}>{fmt(amountNum)} XAF</Text>
              </View>
            </View>
            <View style={s.alertBox}>
              <Text style={s.alertText}>{t('walDebitWarning')} {fmt(amountNum)} XAF. {t('walUndoWarning')}</Text>
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn]}
              onPress={() => {
                const method = data.card ? 'Tarjeta bancaria' : data.cuenta ? tr('walBankTransfer') : 'Retiro en agente';
                const dest = data.card || `${data.banco}-${data.cuenta}` || tr('xtCodigoAgente');
                doWithdraw(method, dest);
              }}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('walConfirmWithdraw')} — {fmt(amountNum)} XAF</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}><Text style={s.backBtnText}>{t('cancel')}</Text></TouchableOpacity>
          </>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <View style={s.successWrap}>
            <LinearGradient colors={['#4C1D95','#6B5BD6']} style={s.successCircle}>
              <IcoCheck />
            </LinearGradient>
            <Text style={s.successTitle}>{t('walWithdrawDone')}</Text>
            <Text style={s.successSub}>
              {data.card ? t('walArrivesCard') :
               data.cuenta ? t('walArrivesAccount') :
               t('walGoToAgent')}
            </Text>
            <View style={[s.refCard, { borderColor: '#DDD6FE' }]}>
              <Text style={[s.refLabel, { color: '#4C1D95' }]}>{t('walReference')}</Text>
              <Text style={s.refCode}>EGC-RET-{Date.now().toString().slice(-8)}</Text>
              <View style={s.refBalanceRow}>
                <Text style={s.refBalanceLabel}>{t('walNewBalance')}</Text>
                <Text style={[s.refBalanceValue, { color: '#4C1D95' }]}>{fmt(balance - amountNum)} XAF</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#4C1D95' }]} onPress={close} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Sheet>
  );
};

// ── Modal Agregar Cuenta Bancaria ─────────────────────────────────
const ACCOUNT_TYPE_KEYS: Record<string, string> = {
  current: 'walAccountTypeCurrent',
  savings: 'walAccountTypeSavings',
  payroll: 'walAccountTypePayroll',
  investment: 'walAccountTypeInvestment',
  Corriente: 'walAccountTypeCurrent',
  Ahorros: 'walAccountTypeSavings',
  'Nómina': 'walAccountTypePayroll',
  'Inversión': 'walAccountTypeInvestment',
};

const AddBankModal = ({
  visible, onClose, onAdd,
}: { visible: boolean; onClose: () => void; onAdd: (acc: any) => void }) => {
  const [bank, setBank] = useState('');
  const [type, setType] = useState('current');
  const [balance, setBalance] = useState('');
  const { t } = useTranslation();
  const TYPES = [
    { id: 'current', labelKey: 'walAccountTypeCurrent' },
    { id: 'savings', labelKey: 'walAccountTypeSavings' },
    { id: 'payroll', labelKey: 'walAccountTypePayroll' },
    { id: 'investment', labelKey: 'walAccountTypeInvestment' },
  ];

  const save = () => {
    if (!bank || !balance) { Alert.alert(t('error'), t('walFillAllFields')); return; }
    onAdd({ id: Date.now().toString(), bank, type, balance: parseInt(balance) });
    setBank(''); setType('current'); setBalance('');
    onClose();
  };

  return (
    <Sheet visible={visible} title={t('walAddAccountTitle')} onClose={onClose}>
      <View style={s.sheetBody}>
        <Field label={t('walBankLabel')} value={bank} onChangeText={setBank} placeholder={`${t('walExamplePrefix')} BANGE, CCEI Bank...`} />
        <Text style={s.fieldLabel}>{t('walAccountTypeLabel')}</Text>
        <View style={s.quickRow}>
          {TYPES.map(bt => (
            <TouchableOpacity key={bt.id} style={[s.quickBtn, type===bt.id && s.quickBtnActive]}
              onPress={() => setType(bt.id)} activeOpacity={0.7}>
              <Text style={[s.quickBtnText, type===bt.id && s.quickBtnTextActive]}>{t(bt.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field label={t('walInitialBalance')} value={balance} onChangeText={setBalance} placeholder="0" keyboardType="numeric" />
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#00c8a0' }]} onPress={save} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>{t('walSaveAccount')}</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};

// ── Modal Historial Completo ──────────────────────────────────────
const HistorialModal = ({
  visible, transactions, onClose,
}: { visible: boolean; transactions: any[]; onClose: () => void }) => {
  const [filter, setFilter] = useState<'all'|'sent'|'received'|'deposit'|'withdraw'>('all');
  const { t } = useTranslation();
  const FILTERS = [
    { id: 'all',      label: t('all') },
    { id: 'received', label: t('received') },
    { id: 'sent',     label: t('sent') },
    { id: 'deposit',  label: t('deposit') },
    { id: 'withdraw', label: t('withdraw') },
  ] as const;

  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'received') return isCredit(tx.type);
    if (filter === 'sent') return !isCredit(tx.type);
    return tx.type === filter;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.histOverlay}>
        <View style={s.histSheet}>
          <View style={s.histHeader}>
            <Text style={s.histTitle}>{t('fullHistory')}</Text>
            <TouchableOpacity onPress={onClose} style={s.histCloseBtn}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2.5} strokeLinecap="round">
                <Path d="M18 6L6 18"/><Path d="M6 6l12 12"/>
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)}
                style={[s.filterChip, filter === f.id && s.filterChipActive]} activeOpacity={0.7}>
                <Text style={[s.filterChipText, filter === f.id && s.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {filtered.length === 0 ? (
              <View style={s.emptyWrap}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="5" width="20" height="14" rx="2"/>
                  <Line x1="2" y1="10" x2="22" y2="10"/>
                  <Circle cx="7" cy="15" r="1" fill="#d1d5db"/>
                </Svg>
                <Text style={s.emptyText}>{t('noTransactions')}</Text>
                <Text style={s.emptySub}>{t('walNoMovements')}</Text>
              </View>
            ) : filtered.map((tx, i) => (
              <View key={tx.id || i} style={s.txCard}>
                <View style={[s.txIconWrap, { backgroundColor: isCredit(tx.type) ? '#E8F8EE' : '#FEF2F2' }]}>
                  {isCredit(tx.type) ? <IcoArrowDown /> : <IcoArrowUp />}
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txLabel}>{getTxLabel(tx, t)}</Text>
                  <Text style={s.txDesc}>{getTxDesc(tx, t)}</Text>
                  <Text style={s.txDate}>{formatDate(tx.created_at || tx.date || new Date().toISOString())}</Text>
                </View>
                <View style={s.txAmountWrap}>
                  <Text style={[s.txAmount, { color: isCredit(tx.type) ? '#00c8a0' : '#ef4444' }]}>
                    {isCredit(tx.type) ? '+' : '-'}{fmt(tx.amount)}
                  </Text>
                  <Text style={s.txCurrency}>XAF</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — Mi Cartera
// ══════════════════════════════════════════════════════════════════
function MonederoScreenInner() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState(DEFAULT_BANK_ACCOUNTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceRevealed, setBalanceRevealed] = useState(false);
  const [balanceRevealing, setBalanceRevealing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [user, setUser] = useState<any>(null);
  const { language, t } = useTranslation();
  const zipAnim = useRef(new Animated.Value(0)).current;
  const skipInitialFocusRefresh = useRef(true);
  const walletCacheKey = 'wallet_overview_v1';

  // ── KYC: estado de verificación del monedero ──────────────────
  const [kycStatus, setKycStatus] = useState<KycStatus>('none');
  const [kycLoading, setKycLoading] = useState(true);
  const kycPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getKycStatus(false).then(res => {
      setKycStatus(res.kyc_status);
      setKycLoading(false);
    }).catch(() => setKycLoading(false));
  }, []);

  // ── Refrescar estado KYC cada vez que el usuario vuelve a esta pestaña ──
  // Movido después de loadData y loadPendingTransfers para evitar uso antes de declaración

  // ── Supabase Realtime: detectar aprobación del monedero en tiempo real ──
  // Cuando el admin pulsa "Revisado", wallet_kyc_status cambia a 'approved'
  // en la tabla users. Esta suscripción lo detecta al instante sin esperar
  // los 5 minutos de caché de AsyncStorage.
  useEffect(() => {
    if (!userId) return; // Esperar a tener el userId
    const channelName = `wallet-status-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new?.wallet_kyc_status as KycStatus | undefined;
          if (newStatus) {
            // Invalidar caché para que el próximo fetch sea fresco
            invalidateKycStatusCache();
            setKycStatus(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [userId]); // userId se establece en el useEffect de authAPI.me()

  // ── Polling de respaldo: si hay KYC pendiente, refrescar cada 10s ─
  // Garantiza que el monedero se abra aunque Realtime no esté habilitado.
  useEffect(() => {
    if (kycStatus === 'approved' || kycLoading) return;
    const interval = setInterval(async () => {
      try {
        const res = await getKycStatus(/* forceRefresh */ true);
        setKycStatus(res.kyc_status);
      } catch {}
    }, 10_000);
    return () => clearInterval(interval);
  }, [kycStatus, kycLoading]);

  // Pulso en botón CTA de activación
  useEffect(() => {
    if (kycStatus !== 'none' && kycStatus !== 'rejected') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(kycPulse, { toValue: 1.04, duration: 850, useNativeDriver: true }),
        Animated.timing(kycPulse, { toValue: 1,    duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [kycStatus]);

  const [showQR, setShowQR] = useState(false);
  const [qrType, setQrType] = useState<'receive'|'pay'>('receive');
  const [showRecarga, setShowRecarga] = useState(false);
  const [showRetiro, setShowRetiro] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showCards, setShowCards] = useState(false);

  // ── Transferencias pendientes (del servidor) ──────────────────
  type PendingTransfer = {
    id: string; direction: 'incoming' | 'outgoing'; amount: number; concept?: string | null;
    status: string; expiresAt: string; createdAt: string; isExpired: boolean;
    senderName: string; senderAvatar?: string | null;
    recipientName: string; recipientAvatar?: string | null;
  };
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [pendingLoading, setPendingLoading] = useState<string | null>(null); // transferId en proceso

  const loadPendingTransfers = useCallback(async () => {
    try {
      const res = await walletAPI.getPendingTransfers();
      setPendingTransfers(res.transfers || []);
    } catch {}
  }, []);

  const handleAcceptTransfer = useCallback(async (transferId: string) => {
    setPendingLoading(transferId);
    try {
      const res = await walletAPI.acceptTransfer(transferId);
      setBalance(res.balance);
      setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || t('walAcceptFailed'));
    } finally {
      setPendingLoading(null);
    }
  }, [t]);

  const handleCancelTransfer = useCallback(async (transferId: string) => {
    Alert.alert(
      t('walCancelTransferTitle'),
      t('walCancelTransferBody'),
      [
        { text: t('no'), style: 'cancel' },
        {
          text: t('walYesCancel'), style: 'destructive',
          onPress: async () => {
            setPendingLoading(transferId);
            try {
              await walletAPI.cancelTransfer(transferId);
              setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
            } catch (e: any) {
              Alert.alert(t('error'), e?.message || t('walCancelFailed'));
            } finally {
              setPendingLoading(null);
            }
          },
        },
      ]
    );
  }, [t]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadData = useCallback(async () => {
    try {
      const bal = await walletAPI.getBalance();
      setBalance(bal.balance || 0);
      void AsyncStorage.mergeItem(walletCacheKey, JSON.stringify({
        balance: bal.balance || 0,
        updatedAt: Date.now(),
      }));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }

    void walletAPI.getTransactions(1).then(txs => {
      const nextTransactions = txs.transactions || [];
      setTransactions(nextTransactions);
      void AsyncStorage.mergeItem(walletCacheKey, JSON.stringify({
        transactions: nextTransactions,
        updatedAt: Date.now(),
      }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(walletCacheKey).then(value => {
      if (!value || !active) return;
      const cached = JSON.parse(value);
      if (typeof cached.balance === 'number') setBalance(cached.balance);
      if (Array.isArray(cached.transactions)) setTransactions(cached.transactions);
      setLoading(false);
    }).catch(() => {});
    void loadData();
    void loadPendingTransfers();
    void loadBankAccounts().then(setBankAccounts);
    void SessionManager.getInstance().getUser().then(async cachedUser => {
      if (!cachedUser || !active) return;
      const profile = await mergePersistentAvatar(cachedUser);
      if (!active) return;
      setUser(profile);
      setUserId(profile?.id || '');
      setUserName(profile?.full_name || t('walUserFallback'));
      setUserPhone(profile?.phone || '');
    }).catch(() => {});
    authAPI.me().then(async me => {
      const profile = await mergePersistentAvatar(me);
      setUser(profile);
      setUserId(profile?.id || '');
      setUserName(profile?.full_name || t('walUserFallback'));
      setUserPhone(profile?.phone || '');
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return onProfileUpdated(patch => {
      setUser((prev: any) => prev ? { ...prev, ...patch } : prev);
      if (patch.full_name) setUserName(patch.full_name);
      if (patch.phone) setUserPhone(patch.phone);
    });
  }, []);

  // ── Refrescar KYC, balance y transferencias pendientes al volver a la pestaña ──
  useFocusEffect(
    useCallback(() => {
      if (skipInitialFocusRefresh.current) {
        skipInitialFocusRefresh.current = false;
        return;
      }
      const refreshTimer = setTimeout(() => {
        void getKycStatus(true).then(res => {
          setKycStatus(res.kyc_status);
        }).catch(() => {});
        void loadData();
        void loadPendingTransfers();
      }, 250);
      return () => clearTimeout(refreshTimer);
    }, [loadData, loadPendingTransfers])
  );

  const revealBalance = useCallback(() => {
    if (balanceRevealed || balanceRevealing) return;
    setBalanceRevealing(true);
    Animated.timing(zipAnim, { toValue: 1, duration: 1100, useNativeDriver: true }).start(() => {
      setBalanceRevealed(true);
      setBalanceRevealing(false);
    });
  }, [balanceRevealed, balanceRevealing, zipAnim]);

  const hideBalance = useCallback(() => {
    zipAnim.setValue(0);
    setBalanceRevealed(false);
    setBalanceRevealing(false);
  }, [zipAnim]);

  const overlayOpacity = zipAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: C.bgPrimary }]}>
        <ActivityIndicator size="large" color="#00c8a0" />
      </View>
    );
  }

  // ── KYC: Pantalla de bloqueo si el monedero no está verificado ─
  // Muestra overlay distinto según el estado KYC del usuario.
  // Para REACTIVAR: cambiar WALLET_KYC_REQUIRED a true en src/config/walletConfig.ts
  if (WALLET_KYC_REQUIRED && !kycLoading && kycStatus !== 'approved') {
    const isNone     = kycStatus === 'none';
    const isPending  = kycStatus === 'pending';
    const isRejected = kycStatus === 'rejected';
    const isSuspended = kycStatus === 'suspended';

    const statusColor = KYC_STATUS_COLORS[kycStatus] || '#9CA3AF';
    const statusLabel = t(KYC_LABEL_KEYS[kycStatus] || 'walKycNone');

    return (
      <SafeAreaView style={[s.container, { backgroundColor: '#F5F7FA' }]} edges={['left','right','bottom']}>
        <EGChatHeader
          notificationsOpen={false}
          menuOpen={false}
          onWeatherPress={() => {}}
          onNotificationsPress={() => {}}
          onMenuPress={() => {}}
        />

        <ScrollView contentContainerStyle={kycS.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Hero card ── */}
          <LinearGradient
            colors={isPending ? ['#0f2027','#203a43','#2c5364'] : isRejected ? ['#1a0a0a','#3b0c0c','#7f1d1d'] : ['#0a0e1a','#0d1b33','#0f2744']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={kycS.heroCard}
          >
            {/* Icono estado — SVG sin fondo de color */}
            <View style={kycS.heroIconWrap}>
              {isPending ? (
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinecap="round">
                  <Circle cx="12" cy="12" r="10"/>
                  <Path d="M12 6v6l4 2"/>
                </Svg>
              ) : isRejected ? (
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinecap="round">
                  <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <Line x1="12" y1="9" x2="12" y2="13"/>
                  <Line x1="12" y1="17" x2="12.01" y2="17"/>
                </Svg>
              ) : isSuspended ? (
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinecap="round">
                  <Circle cx="12" cy="12" r="10"/>
                  <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </Svg>
              ) : (
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} strokeLinecap="round">
                  <Rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <Line x1="1" y1="10" x2="23" y2="10"/>
                </Svg>
              )}
            </View>

            {/* Badge estado */}
            <View style={[kycS.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
              <View style={[kycS.statusDot, { backgroundColor: statusColor }]}/>
              <Text style={[kycS.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            <Text style={kycS.heroTitle}>
              {isPending   ? t('walKycPendingTitle') :
               isRejected  ? t('walKycRejectedTitle') :
               isSuspended ? t('walKycSuspendedTitle') :
                             t('walKycNoneTitle')}
            </Text>
            <Text style={kycS.heroSub}>
              {isPending
                ? t('walKycPendingBody')
                : isRejected
                ? t('walKycRejectedBody')
                : isSuspended
                ? t('walKycSuspendedBody')
                : t('walKycNoneBody')}
            </Text>

            {!isSuspended && (
              <Animated.View style={[kycS.ctaWrapper, { transform: [{ scale: kycPulse }] }]}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push('/kyc' as any)}
                  style={kycS.ctaBtn}
                >
                  <LinearGradient
                    colors={['#00C8A0', '#00A8D4']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={kycS.ctaBtnGrad}
                  >
                    <Text style={kycS.ctaBtnText}>
                      {isPending   ? t('walKycViewStatus') :
                       isRejected  ? t('walKycRetry') :
                                     t('walKycActivate')}
                    </Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                      <Path d="M5 12h14M12 5l7 7-7 7"/>
                    </Svg>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </LinearGradient>

          {/* ── Funciones bloqueadas ── */}
          <View style={kycS.lockedSection}>
            <View style={kycS.lockedHeader}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2} strokeLinecap="round">
                <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <Path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </Svg>
              <Text style={kycS.lockedTitle}>{t('walKycLockedTitle')}</Text>
            </View>
            {[
              {
                text: t('walKycFeatBalance'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
                    <Path d="M3 10h17"/><Circle cx="17" cy="14" r="1.5" fill="#9CA3AF" stroke="none"/>
                  </Svg>
                ),
              },
              {
                text: t('walKycFeatTransfer'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Path d="M17 1l4 4-4 4"/><Path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <Path d="M7 23l-4-4 4-4"/><Path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </Svg>
                ),
              },
              {
                text: t('walKycFeatRecharge'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Polyline points="16 17 12 21 8 17"/>
                    <Line x1="12" y1="12" x2="12" y2="21"/>
                    <Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                  </Svg>
                ),
              },
              {
                text: t('walKycFeatPayBills'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </Svg>
                ),
              },
              {
                text: t('walKycFeatQr'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Rect x="3" y="3" width="7" height="7"/><Rect x="14" y="3" width="7" height="7"/>
                    <Rect x="14" y="14" width="7" height="7"/><Rect x="3" y="14" width="7" height="7"/>
                  </Svg>
                ),
              },
              {
                text: t('walKycFeatBankLink'),
                icon: (
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round">
                    <Rect x="3" y="10" width="18" height="11" rx="2"/>
                    <Path d="M3 10l9-7 9 7"/>
                    <Line x1="12" y1="10" x2="12" y2="21"/>
                    <Line x1="7" y1="14" x2="7" y2="17"/>
                    <Line x1="17" y1="14" x2="17" y2="17"/>
                  </Svg>
                ),
              },
            ].map((item, i, arr) => (
              <View key={i} style={[kycS.lockedRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={kycS.lockedIconWrap}>{item.icon}</View>
                <Text style={kycS.lockedRowText}>{item.text}</Text>
                <View style={kycS.lockedChip}>
                  <Text style={kycS.lockedChipText}>{t('walKycBlocked')}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Por qué verificarse ── */}
          <View style={kycS.whyBox}>
            <View style={kycS.whyHeaderRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" strokeWidth={2} strokeLinecap="round">
                <Circle cx="12" cy="12" r="10"/>
                <Line x1="12" y1="8" x2="12" y2="12"/>
                <Line x1="12" y1="16" x2="12.01" y2="16"/>
              </Svg>
              <Text style={kycS.whyTitle}>{t('walKycWhyTitle')}</Text>
            </View>
            <Text style={kycS.whyText}>
              {t('walKycWhyP1')}{' '}
              <Text style={kycS.whyBold}>{tr('xtBANGEBancoNacionalDeGuineaEcuatorial')}</Text>
              {t('walKycWhyP2')}{' '}
              <Text style={kycS.whyBold}>BEAC/COBAC</Text>.{'\n\n'}
              {t('walKycWhyP3')}{' '}
              <Text style={kycS.whyBold}>Reglamento COBAC R-2023/01</Text>{' '}
              {t('walKycWhyP4')} <Text style={kycS.whyBold}>Ley N°2/2008</Text>{t('walKycWhyP5')}
            </Text>
          </View>

          {isSuspended && (
            <View style={kycS.suspendedBox}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round">
                <Path d="M4 4l16 16M4 20L20 4"/>
              </Svg>
              <Text style={kycS.suspendedText}>{t('walKycContactSupport')} soporte@egchat.gq</Text>
            </View>
          )}

        </ScrollView>
        <DraggableHomeButton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#EEF2F7' }]} edges={['left', 'right', 'bottom']}>

      {/* ── Header ── */}
      <EGChatHeader
        notificationsOpen={showNotifications}
        menuOpen={showMenu}
        onWeatherPress={() => setShowWeather(true)}
        onNotificationsPress={() => {
          setShowNotifications(true);
          markAllRead();
        }}
        onMenuPress={() => setShowMenu(true)}
      />

<View style={s.pageContent}>
        <View style={s.stickyWalletSection}>
          {/* ── Tarjeta de balance ── */}
          <View style={s.balanceCardWrap}>
            <LinearGradient
              colors={['#1A3A6B', '#0E5F8A', '#0A7A8A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.balanceCard}
            >
              <Text style={s.balanceCardLabel}>{t('egpayWallet')}</Text>

              {/* Saldo con animación de revelado (paridad web) */}
              <View style={s.balanceRevealBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, opacity: balanceRevealed ? 1 : 0.15 }}>
                  <Text style={s.balanceAmount}>{fmt(balance)}</Text>
                  <Text style={s.balanceCurrency}>XAF</Text>
                </View>
                {!balanceRevealed && (
                  <Animated.View
                    style={[s.balanceOverlay, { opacity: balanceRevealing ? overlayOpacity : 1 }]}
                  >
                    <TouchableOpacity onPress={revealBalance} activeOpacity={0.9} style={s.balanceOverlayTouch}>
                      <Text style={s.balanceHiddenText}>
                        {balanceRevealing ? t('walOpening') : `🔒  ${t('tapToReveal')}`}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {balanceRevealed && (
                  <TouchableOpacity onPress={hideBalance} style={s.balanceHideBtn} hitSlop={12}>
                    <Text style={s.balanceHideText}>{t('walHide')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={s.balanceSubLabel}>{t('walletBalance')}</Text>

              {/* 4 botones de acción */}
              <View style={s.actionsRow}>
                {[
                  { label: t('receive'), icon: <IcoRecibir />, onPress: () => { setQrType('receive'); setShowQR(true); } },
                  { label: t('pay'),     icon: <IcoPagar />,   onPress: () => { setQrType('pay');     setShowQR(true); } },
                  { label: t('topUp'),   icon: <IcoRecarga />, onPress: () => setShowRecarga(true) },
                  { label: t('withdraw'),icon: <IcoRetiro />,  onPress: () => setShowRetiro(true) },
                ].map(a => (
                  <TouchableOpacity key={a.label} style={s.actionBtn} onPress={a.onPress} activeOpacity={0.75}>
                    <View style={s.actionIconWrap}>{a.icon}</View>
                    <Text style={s.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>

        <ScrollView
          style={s.sectionsScroll}
          contentContainerStyle={s.sectionsContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Mis Cuentas ── */}
          <View style={s.sectionBlock}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>{t('myAccounts')}</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => setShowAddBank(true)} activeOpacity={0.7}>
                <Text style={s.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={[s.card, { backgroundColor: C.bgSecondary }]}> 
              {bankAccounts.map((acc, i) => (
                <View key={acc.id}>
                  <View style={s.bankRow}>
                    <View style={s.bankIconWrap}>
                      <IcoBanco color="#1B3A6B" />
                    </View>
                    <View style={s.bankInfo}>
                      <Text style={[s.bankName, { color: C.textPrimary }]}>{acc.bank}</Text>
                      <Text style={[s.bankType, { color: C.textSecondary }]}>{ACCOUNT_TYPE_KEYS[acc.type] ? t(ACCOUNT_TYPE_KEYS[acc.type]) : acc.type}</Text>
                    </View>
                    <View style={s.bankBalanceWrap}>
                      <Text style={[s.bankBalance, { color: C.textPrimary }]}>{fmt(acc.balance)}</Text>
                      <Text style={[s.bankCurrency, { color: C.textSecondary }]}>XAF</Text>
                    </View>
                  </View>
                  {i < bankAccounts.length - 1 && <View style={[s.divider, { backgroundColor: C.borderLight }]} />}
                </View>
              ))}
            </View>
          </View>

          {/* ── Mis Tarjetas ── */}
          <View style={s.sectionBlock}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>{t('myCards')}</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => setShowCards(true)} activeOpacity={0.7}>
                <Text style={s.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.card, { backgroundColor: C.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}
              onPress={() => setShowCards(true)}
              activeOpacity={0.75}
            >
              <LinearGradient colors={['#1B3A6B', '#2A5298']} style={s.cardPreviewGrad}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="5" width="20" height="14" rx="2"/>
                  <Line x1="2" y1="10" x2="22" y2="10"/>
                  <Line x1="6" y1="15" x2="10" y2="15"/>
                </Svg>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.bankName, { color: C.textPrimary }]}>{t('linkedCards')}</Text>
                <Text style={[s.bankType, { color: C.textSecondary }]}>{t('manageCards')}</Text>
              </View>
              <Text style={{ color: C.textTertiary, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Transferencias pendientes ── */}
          {pendingTransfers.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: '#b45309' }]}>
                  {t('walPendingTransfersTitle')} ({pendingTransfers.length})
                </Text>
              </View>
              <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
                {pendingTransfers.map((transfer, i, arr) => {
                  const isIncoming  = transfer.direction === 'incoming';
                  const isProcessing = pendingLoading === transfer.id;
                  const expiresMs   = new Date(transfer.expiresAt).getTime();
                  const minsLeft    = Math.max(0, Math.ceil((expiresMs - Date.now()) / 60000));
                  const hoursLeft   = Math.floor(minsLeft / 60);
                  const timeLabel   = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft % 60}m` : `${minsLeft}m`;

                  return (
                    <View key={transfer.id}>
                      <View style={s.pendingRow}>
                        {/* Icono dirección */}
                        <View style={[s.pendingIcon, { backgroundColor: isIncoming ? '#dcfce7' : '#fef3c7' }]}>
                          {isIncoming
                            ? <Text style={{ fontSize: 18 }}>💸</Text>
                            : <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth={2} strokeLinecap="round">
                                <Circle cx="12" cy="12" r="10"/>
                                <Polyline points="12 6 12 12 16 14"/>
                              </Svg>
                          }
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={[s.bankName, { color: C.textPrimary }]} numberOfLines={1}>
                            {isIncoming
                              ? `${t('walFromPrefix')} ${transfer.senderName}`
                              : `${t('walToPrefix')} ${transfer.recipientName}`}
                          </Text>
                          {!!transfer.concept && (
                            <Text style={[s.bankType, { color: C.textSecondary, fontStyle: 'italic' }]} numberOfLines={1}>
                              "{transfer.concept}"
                            </Text>
                          )}
                          <Text style={[s.bankType, { color: transfer.isExpired ? '#ef4444' : '#b45309' }]}>
                            {transfer.isExpired ? t('walExpired') : `${t('walExpiresIn')} ${timeLabel}`}
                          </Text>
                        </View>

                        {/* Monto */}
                        <Text style={[s.pendingAmount, { color: isIncoming ? '#16a34a' : '#b45309' }]}>
                          {isIncoming ? '+' : '-'}{fmt(transfer.amount)} XAF
                        </Text>
                      </View>

                      {/* Botones aceptar/cancelar solo para incoming no expiradas */}
                      {isIncoming && !transfer.isExpired && (
                        <View style={s.pendingActions}>
                          <TouchableOpacity
                            style={[s.pendingBtn, s.pendingBtnCancel, isProcessing && s.pendingBtnDisabled]}
                            onPress={() => handleCancelTransfer(transfer.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing && pendingLoading === transfer.id
                              ? <ActivityIndicator size="small" color="#dc2626" />
                              : <Text style={s.pendingBtnCancelText}>{t('walReject')}</Text>
                            }
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.pendingBtn, s.pendingBtnAccept, isProcessing && s.pendingBtnDisabled]}
                            onPress={() => handleAcceptTransfer(transfer.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing && pendingLoading === transfer.id
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={s.pendingBtnAcceptText}>{t('walAcceptReceive')}</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Para outgoing: solo cancelar */}
                      {!isIncoming && !transfer.isExpired && (
                        <View style={[s.pendingActions, { justifyContent: 'flex-end' }]}>
                          <TouchableOpacity
                            style={[s.pendingBtn, s.pendingBtnCancel, isProcessing && s.pendingBtnDisabled]}
                            onPress={() => handleCancelTransfer(transfer.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing
                              ? <ActivityIndicator size="small" color="#dc2626" />
                              : <Text style={s.pendingBtnCancelText}>{t('walCancelSend')}</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      )}

                      {i < arr.length - 1 && <View style={[s.divider, { backgroundColor: C.borderLight }]} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Historial de Transferencias ── */}
          <View style={s.sectionBlock}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>{t('transferHistory')}</Text>
            </View>
            <TouchableOpacity
              style={[s.card, { backgroundColor: C.bgSecondary, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}
              onPress={() => router.push('/historial-completo' as any)}
              activeOpacity={0.75}
            >
              <View style={[s.txIconWrap, { backgroundColor: '#EEF2F7' }]}>
                <IcoTransfer color="#0E5F8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bankName, { color: C.textPrimary }]}>{t('viewMyTransfers')}</Text>
                <Text style={[s.bankType, { color: C.textSecondary }]}>{t('viewFullHistory')}</Text>
              </View>
              <Text style={{ color: C.textTertiary, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>


        </ScrollView>
      </View>

      {/* ── Modales ── */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onNotifPress={(n) => {
          setNotifications(prev => prev.filter(x => x.id !== n.id));
          setShowNotifications(false);
          handleNotifNavigation(n);
        }}
      />
      <HamburgerMenu visible={showMenu} onClose={() => setShowMenu(false)} user={user} />
      <WeatherModal visible={showWeather} onClose={() => setShowWeather(false)} temp="27°" city="Malabo" condition="cloudy" />

      <QRModal
        visible={showQR}
        type={qrType}
        balance={balance}
        userId={userId}
        userName={userName}
        userPhone={userPhone}
        userAvatar={user?.avatar_url || user?.avatarUrl}
        onClose={() => setShowQR(false)}
      />
      <RecargaModal visible={showRecarga} balance={balance} onClose={() => setShowRecarga(false)} onSuccess={loadData} />
      <RetiroModal  visible={showRetiro}  balance={balance} onClose={() => setShowRetiro(false)}  onSuccess={loadData} />
      <AddBankModal visible={showAddBank} onClose={() => setShowAddBank(false)}
        onAdd={acc => {
          const next = [...bankAccounts, acc];
          setBankAccounts(next);
          saveBankAccounts(next);
        }} />
      {/* Modal Mis Tarjetas */}
      <Modal visible={showCards} animationType="slide" onRequestClose={() => setShowCards(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <TouchableOpacity onPress={() => setShowCards(false)} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 24, color: '#374151' }}>‹</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A2B4A', flex: 1 }}>{t('walMyCardsTitle')}</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <CardsScreen bank={{ id: 'egchat', name: 'EGPAY', color: '#1B3A6B', color2: '#2A5298', initials: 'EG', full: 'EGPAY', founded: 2024, desc: '', address: '', phone: '', web: '', swift: '', branches: 0, atms: 0, services: [], accounts: [] }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <DraggableHomeButton />
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#EEF2F7' },
  pageContent: { flex: 1 },
  stickyWalletSection: { flexShrink: 0 },
  sectionsScroll: { flex: 1 },
  sectionsContainer: { paddingBottom: 120 },
  sectionBlock: { marginBottom: 10 },
  sectionScroll: { maxHeight: 210, marginHorizontal: 12 },
  historySectionScroll: { maxHeight: 320, marginHorizontal: 12 },
  sectionScrollContent: { paddingBottom: 2 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  pageHeader:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  pageTitle:   { fontSize: 17, fontWeight: '700', color: '#1A2B4A' },

  // Balance card
  balanceCardWrap: { padding: 14 },
  balanceCard:     { borderRadius: 20, padding: 20, shadowColor: '#0E5F8A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  balanceCardLabel:{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  balanceRevealBtn:{ marginBottom: 4, minHeight: 42, justifyContent: 'center' },
  balanceAmount:   { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  balanceCurrency: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  balanceOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,20,50,0.82)', borderRadius: 8, justifyContent: 'center' },
  balanceOverlayTouch: { paddingHorizontal: 14, paddingVertical: 10 },
  balanceHiddenText:{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  balanceHideBtn:  { position: 'absolute', top: 0, right: 0, padding: 4 },
  balanceHideText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  balanceSubLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 18 },

  // Action buttons
  actionsRow:    { flexDirection: 'row', gap: 8 },
  actionBtn:     { flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  actionIconWrap:{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  actionLabel:   { fontSize: 11, fontWeight: '700', color: '#1A2B4A' },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6, marginTop: 2 },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: '#0d0d0d', textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn:        { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', alignItems: 'center', justifyContent: 'center' },
  addBtnText:    { fontSize: 18, fontWeight: '700', color: '#00c8a0', lineHeight: 22 },
  cardPreviewGrad: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardPreviewIcon: { fontSize: 22 },
  verTodo:       { fontSize: 13, color: '#00c8a0', fontWeight: '600' },

  // Card container
  card:          { marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, marginBottom: 8 },
  divider:       { height: 1, marginHorizontal: 14 },

  // Bank accounts
  bankRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 10 },
  bankIconWrap:  { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.18)', alignItems: 'center', justifyContent: 'center' },
  bankInfo:      { flex: 1 },
  bankName:      { fontSize: 13, fontWeight: '700', color: '#0d0d0d' },
  bankType:      { fontSize: 12, color: '#6b7280', marginTop: 1 },
  bankBalanceWrap:{ alignItems: 'flex-end' },
  bankBalance:   { fontSize: 13, fontWeight: '800', color: '#0d0d0d' },
  bankCurrency:  { fontSize: 11, color: '#6b7280', fontWeight: '600' },

  pendingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    backgroundColor: 'rgba(180,83,9,0.04)',
  },
  pendingIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingAmount: { fontSize: 13, fontWeight: '700' },
  pendingActions: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4,
  },
  pendingBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingBtnAccept: {
    backgroundColor: '#16a34a',
  },
  pendingBtnAcceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pendingBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: '#dc2626',
  },
  pendingBtnCancelText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  pendingBtnDisabled: { opacity: 0.5 },
  // estilos legacy (mantenidos por compatibilidad)
  cancelPendingBtn: {
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
  },
  cancelPendingText: { fontSize: 11, fontWeight: '600', color: '#f87171' },

  // Transactions
  txCard:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 10, minHeight: 64 },
  txIconWrap:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  txInfo:        { flex: 1 },
  txLabel:       { fontSize: 12, fontWeight: '700', color: '#0d0d0d', marginBottom: 1 },
  txDesc:        { fontSize: 11, color: '#374151', marginBottom: 1 },
  txDate:        { fontSize: 10, color: '#9ca3af' },
  txAmountWrap:  { alignItems: 'flex-end' },
  txAmount:      { fontSize: 13, fontWeight: '800' },
  txCurrency:    { fontSize: 10, color: '#6b7280', fontWeight: '600' },

  // Empty state
  emptyWrap:     { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIcon:     { fontSize: 36 },
  emptyText:     { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySub:      { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  // Sheet modal
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#F7F8FA', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 40 },
  handle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetTitle:    { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center', paddingHorizontal: 16, paddingTop: 8 },
  // Section head in modals
  // Methods label
  methodsLabel:  { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  // Method buttons
  methodIconWrap:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Info box
  // Quick amounts
  // Field
  // Code input
  // Agent card
  agentIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  // Confirm card
  confirmCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F0F2F5' },
  // Alert
  alertBox:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  alertText:     { fontSize: 11, color: '#C0392B', fontWeight: '600' },

  // Primary button
  withdrawBtn:   { backgroundColor: '#C0392B' },
  // QR mini box
  qrMiniBox:     { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F0FDF9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  // Success
  refCard:       { width: '100%', backgroundColor: '#F0FDF9', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  refLabel:      { fontSize: 11, fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  refCode:       { fontSize: 14, fontWeight: '800', color: '#111827', fontVariant: ['tabular-nums'] },
  refBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#D1FAE5' },
  refBalanceLabel:{ fontSize: 12, color: '#6B7280' },
  refBalanceValue:{ fontSize: 16, fontWeight: '900', color: '#00c8a0' },

  // Historial modal
  histOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  histSheet:     { flex: 1, marginTop: 60, backgroundColor: '#F0F7FF', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  histHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  histTitle:     { fontSize: 18, fontWeight: '700', color: '#0f4c3a' },
  histCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(243,244,246,0.85)', alignItems: 'center', justifyContent: 'center' },
  filterScroll:  { flexShrink: 0, paddingVertical: 8 },
  filterChip:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)' },
  filterChipActive:{ backgroundColor: '#00c8a0', borderColor: 'rgba(0,180,140,0.6)' },
  filterChipText:{ fontSize: 13, fontWeight: '600', color: '#1f4e3d' },
  filterChipTextActive:{ color: '#fff' },

  sheetSub:      { fontSize: 12, color: '#6b7280', textAlign: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  sheetBody:     { paddingHorizontal: 16, paddingTop: 8 },

  // Method buttons
  methodBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  methodText:    { flex: 1 },
  methodLabel:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  methodSub:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  methodArrow:   { fontSize: 20, color: '#D1D5DB' },

  // Quick amounts
  quickRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F7F8FA', borderWidth: 1.5, borderColor: '#E5E7EB' },
  quickBtnActive:{ backgroundColor: '#E8F8EE', borderColor: '#00c8a0' },
  quickBtnText:  { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  quickBtnTextActive: { color: '#00c8a0' },

  // Field
  fieldWrap:     { marginBottom: 10 },
  fieldLabel:    { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  fieldInput:    { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },

  // Section head
  sectionHead:   { borderRadius: 14, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionHeadIcon:{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sectionHeadTitle:{ fontSize: 14, fontWeight: '800', color: '#fff' },
  sectionHeadSub:{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Info box
  infoBox:       { backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  infoLabel:     { fontSize: 11, color: '#6B7280' },
  infoValue:     { fontSize: 11, fontWeight: '700', color: '#1B3A6B' },

  // Agent card
  agentCard:     { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  agentName:     { fontSize: 13, fontWeight: '700', color: '#111827' },
  agentInfo:     { fontSize: 11, color: '#9CA3AF', marginTop: 3 },

  // Buttons
  primaryBtn:    { backgroundColor: '#00c8a0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled: { backgroundColor: '#E5E7EB' },
  primaryBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },
  dangerBtn:     { backgroundColor: '#EF4444' },
  backBtn:       { alignItems: 'center', marginTop: 12 },
  backBtnText:   { fontSize: 14, color: '#6B7280', fontWeight: '600' },

  // Code input
  codeHint:      { fontSize: 13, color: '#6B7280', marginBottom: 10, textAlign: 'center' },
  codeInput:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 18, fontWeight: '700', color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB', textAlign: 'center', letterSpacing: 2, marginBottom: 14 },

  // Confirm box
  confirmBox:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#F0F2F5' },
  confirmRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  confirmLabel:  { fontSize: 12, color: '#6B7280' },
  confirmValue:  { fontSize: 12, fontWeight: '700', color: '#111827' },

  // Success
  successWrap:   { alignItems: 'center', paddingVertical: 24, gap: 10 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center' },
  successTitle:  { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub:    { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // QR
  qrOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  qrCard:        { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  qrHeader:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  qrHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  qrHeaderSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  qrCloseBtn:    { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  qrBody:        { padding: 20, alignItems: 'center', gap: 12 },
  qrCodeWrap:    { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0,200,160,0.2)' },
  qrGrid:        { backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  qrCell:        { width: 10, height: 10 },
  qrName:        { fontSize: 14, fontWeight: '700', color: '#111827' },
  qrPhone:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  qrBalance:     { fontSize: 12, color: '#6B7280' },
  qrScanBtn:     { width: '100%', paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,180,230,0.35)', borderRadius: 10 },
  qrScanBtnText: { fontSize: 13, fontWeight: '700', color: '#00B4E6' },
  qrInput:       { width: '100%', backgroundColor: '#F7F8FA', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  qrCloseFullBtn:{ borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 4 },
  qrCloseBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default function MonederoScreen() {
  const { t } = useTranslation();
  return (
    <TabErrorBoundary tabName={t('wallet')}>
      <MonederoScreenInner />
    </TabErrorBoundary>
  );
}

// ── Estilos QRModal rediseñado ────────────────────────────────────
const qrs = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:           { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  title:          { fontSize: 17, fontWeight: '800', color: '#111827' },
  sub:            { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  closeBtn:       { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qrWrap:         { alignSelf: 'center', position: 'relative', marginVertical: 16 },
  avatarOverlay:  { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 10 },
  avatarImg:      { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, borderColor: '#fff' },
  avatarFallback: { backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  name:           { fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center' },
  phone:          { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 2 },
  balancePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8, marginBottom: 16 },
  balanceTxt:     { fontSize: 12, fontWeight: '600', color: '#059669' },
  scanBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10, paddingVertical: 12, borderWidth: 1.5, borderColor: 'rgba(0,200,160,0.3)', borderRadius: 12, justifyContent: 'center' },
  scanBtnTxt:     { fontSize: 13, fontWeight: '700', color: '#00C8A0' },
  closeFullBtn:   { marginHorizontal: 20, marginBottom: 20, paddingVertical: 13, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  closeFullTxt:   { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});

// ── Estilos del bloqueo KYC ───────────────────────────────────────
const kycS = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    gap: 10,
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  heroIconEmoji: { fontSize: 22 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  heroTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  ctaWrapper: {
    width: '100%',
    marginTop: 2,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#00C8A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaBtn: { width: '100%' },
  ctaBtnGrad: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Funciones bloqueadas
  lockedSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  lockedIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  lockedRowText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  lockedChip: {
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  lockedChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.2,
  },

  // Por qué
  whyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  whyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B3A6B',
  },
  whyText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 19,
  },
  whyBold: {
    fontWeight: '700',
    color: '#1B3A6B',
  },

  // Suspendido
  suspendedBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  suspendedText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
