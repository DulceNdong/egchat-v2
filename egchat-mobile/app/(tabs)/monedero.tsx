import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabErrorBoundary } from '../../src/components/TabErrorBoundary';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, Pressable, RefreshControl,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Polyline, Rect, Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { router } from 'expo-router';
import { walletAPI, authAPI } from '../../src/api';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
import { markAllRead } from '../../src/store/appStore';
import { CardsScreen } from '../../src/components/services/CardsScreen';
import { buildReceiveQr, buildPayQr } from '../../src/utils/walletQr';
import { loadBankAccounts, saveBankAccounts, DEFAULT_BANK_ACCOUNTS } from '../../src/utils/bankAccounts';
import { checkLimitForTransaction, updateLimitForTransaction } from '../../src/services/limits';
import { mergePersistentAvatar, onProfileUpdated } from '../../src/utils/profileEvents';
import {
  createDepositIntent, confirmDeposit, pollPaymentStatus,
  getPaymentHistory, createWithdrawIntent, confirmWithdraw,
  GATEWAY_INFO, formatGatewayFee, getNetAmount,
  type PaymentGateway, type ExternalTransaction,
} from '../../src/services/paymentGateway';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0 });
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const isCredit = (type: string) =>
  ['deposit', 'recharge', 'transfer_received', 'received', 'salary'].includes(type);

const getTxLabel = (tx: any) => {
  if (tx.method) return tx.method;
  const map: Record<string, string> = {
    deposit: 'Depósito recibido', withdraw: 'Pago enviado',
    transfer_sent: 'Transferencia enviada', transfer_received: 'Transferencia recibida',
    recharge: 'Código de recarga', sent: 'Enviado', received: 'Recibido',
  };
  return map[tx.type] || tx.type;
};

const getTxDesc = (tx: any) => {
  if (tx.description) return tx.description;
  const map: Record<string, string> = {
    deposit: 'Depósito en monedero', withdraw: 'Pago de servicios',
    transfer_sent: 'Transferencia enviada', transfer_received: 'Transferencia recibida',
    recharge: 'Código de recarga', sent: 'Enviado a contacto', received: 'Recibido de contacto',
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
  visible, type, balance, userId, userName, userPhone, onClose,
}: {
  visible: boolean; type: 'receive' | 'pay'; balance: number;
  userId: string; userName: string; userPhone: string; onClose: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const isReceive = type === 'receive';
  const gradient: [string, string] = isReceive ? ['#00c8a0', '#059669'] : ['#00b4e6', '#2563eb'];
  const title = isReceive ? 'Recibir dinero' : 'Realizar pago';
  const sub = isReceive ? 'Muestra este QR para recibir' : 'Genera tu QR de cobro';
  const qrValue = userId
    ? (isReceive ? buildReceiveQr(userId) : buildPayQr(userId, amount, concept))
    : 'egchat://pay/pending';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={s.qrOverlay} onPress={onClose}>
        <Pressable style={s.qrCard} onPress={() => {}}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.qrHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.qrHeaderTitle}>{title}</Text>
              <Text style={s.qrHeaderSub}>{sub}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.qrCloseBtn}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={s.qrBody}>
            <View style={s.qrCodeWrap}>
              {userId ? (
                <QRCode value={qrValue} size={200} backgroundColor="#fff" color="#0d0d0d" />
              ) : (
                <ActivityIndicator color="#00c8a0" />
              )}
            </View>

            <Text style={s.qrName}>{userName || 'Mi Monedero EGCHAT'}</Text>
            {!!userPhone && <Text style={s.qrPhone}>{userPhone}</Text>}
            <Text style={s.qrBalance}>{fmt(balance)} XAF disponibles</Text>

            {!isReceive && (
              <View style={{ width: '100%', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={s.qrInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Monto (XAF)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <TextInput
                  style={s.qrInput}
                  value={concept}
                  onChangeText={setConcept}
                  placeholder="Concepto (opcional)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <TouchableOpacity
              style={s.qrScanBtn}
              onPress={() => { onClose(); router.push('/_qr-scanner' as any); }}
              activeOpacity={0.85}
            >
              <Text style={s.qrScanBtnText}>Escanear QR de pago</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
              <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.qrCloseFullBtn}>
                <Text style={s.qrCloseBtnText}>Cerrar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
        </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Modal Recarga ─────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'transferencia' | 'codigo' | 'agente' | 'confirm' | 'success'
           | 'stripe' | 'orange_money' | 'mtn_mobile' | 'polling';

const RecargaModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
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
    if (clean.length < 12) { Alert.alert('Error', 'Código inválido'); return; }
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
    { id: 'stripe',        label: 'Tarjeta Visa / Mastercard', sub: 'Pago inmediato con tarjeta internacional', gradient: ['#635BFF', '#4F46E5'] as [string,string], icon: <IcoTarjeta color="#fff" /> },
    { id: 'orange_money',  label: 'Orange Money',              sub: 'Pago USSD — inmediato en GQ',              gradient: ['#FF6600', '#EA580C'] as [string,string], icon: <IcoEfectivo color="#fff" /> },
    { id: 'mtn_mobile',    label: 'MTN Mobile Money',          sub: 'Pago USSD — inmediato',                    gradient: ['#FFCC00', '#D97706'] as [string,string], icon: <IcoEfectivo color="#fff" /> },
    { id: 'banco',         label: 'Desde banco',               sub: 'Transferencia bancaria desde tu cuenta',   gradient: ['#1B3A6B', '#2A5298'] as [string,string], icon: <IcoBanco color="#fff" /> },
    { id: 'transferencia', label: 'Transferencia EGCHAT',       sub: 'Recibe de otro usuario EGCHAT',            gradient: ['#065F46', '#00c8a0'] as [string,string], icon: <IcoTransfer color="#fff" /> },
    { id: 'codigo',        label: 'Código de recarga',          sub: 'Introduce un código de recarga prepago',   gradient: ['#92400E', '#D97706'] as [string,string], icon: <IcoCodigo color="#fff" /> },
    { id: 'agente',        label: 'Depósito en efectivo',       sub: 'En agentes autorizados EGCHAT',            gradient: ['#4C1D95', '#6B5BD6'] as [string,string], icon: <IcoAgente color="#fff" /> },
  ];

  const TITLES: Record<string, string> = {
    menu: 'Recargar monedero', banco: 'Desde banco', transferencia: 'Transferencia EGCHAT',
    codigo: 'Código de recarga', agente: 'Depósito en efectivo',
    confirm: 'Confirmar recarga', success: '¡Recarga completada!',
    stripe: 'Pagar con tarjeta', orange_money: 'Orange Money', mtn_mobile: 'MTN Mobile Money',
    polling: 'Esperando pago…',
  };

  return (
    <Sheet visible={visible} title={TITLES[step]} subtitle={`Saldo: ${fmt(balance)} XAF`} onClose={close}>
      <View style={s.sheetBody}>

        {/* MENÚ */}
        {step === 'menu' && (
          <>
            <SectionHead title="Monedero EGCHAT" sub={`${fmt(balance)} XAF disponibles`}
              gradient={['#1A3A6B', '#0E5F8A']} icon={<IcoTarjeta color="#fff" />} />
            <Text style={s.methodsLabel}>MÉTODO DE RECARGA</Text>
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
            <SectionHead title="Transferencia bancaria" sub="Datos para realizar el ingreso"
              gradient={['#1B3A6B', '#2A5298']} icon={<IcoBanco color="#fff" />} />
            <View style={s.infoBox}>
              {[['Beneficiario','EGCHAT S.A.'],['Bancos','BANGE / CCEI / BGFI'],
                ['Cuenta','GQ-EGCHAT-001-2026'],['Concepto','Recarga + tu teléfono']].map(([l,v]) => (
                <View key={l} style={s.infoRow}>
                  <Text style={s.infoLabel}>{l}</Text>
                  <Text style={s.infoValue}>{v}</Text>
                </View>
              ))}
            </View>
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe (mín. 1,000 XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label="Tu banco" value={data.banco||''} onChangeText={v=>set('banco',v)} placeholder="BANGE, BGFI, CCEI..." />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#1B3A6B' }, (!isValid||!data.banco) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.banco) setStep('confirm'); }}
              disabled={!isValid || !data.banco} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Confirmar — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* TRANSFERENCIA EGCHAT */}
        {step === 'transferencia' && (
          <>
            <SectionHead title="Transferencia EGCHAT" sub="Solicita dinero a otro usuario"
              gradient={['#065F46', '#00c8a0']} icon={<IcoTransfer color="#fff" />} />
            <View style={[s.infoBox, { alignItems: 'center', paddingVertical: 20 }]}>
              <View style={s.qrMiniBox}>
                <Text style={{ fontSize: 40 }}>📲</Text>
              </View>
              <Text style={s.infoValue}>Comparte tu número para recibir</Text>
              <Text style={s.infoLabel}>Sin comisión entre usuarios EGCHAT</Text>
            </View>
            <QuickAmounts amounts={[1000,5000,10000,25000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe a solicitar (XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#065F46' }, !isValid && s.primaryBtnDisabled]}
              onPress={() => {
                if (!isValid) {
                  Alert.alert('Monto inválido', 'Introduce al menos 1.000 XAF para generar la solicitud.');
                  return;
                }
                doDeposit('Transferencia EGCHAT', `EGCHAT-${Date.now()}`);
              }}
              disabled={!isValid || loading}
              activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>Generar solicitud de pago</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* CÓDIGO */}
        {step === 'codigo' && (
          <>
            <SectionHead title="Código de recarga" sub="Canjea tu voucher prepago"
              gradient={['#92400E', '#D97706']} icon={<IcoCodigo color="#fff" />} />
            <Text style={s.codeHint}>Código de 16 dígitos</Text>
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Canjear código</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* AGENTE */}
        {step === 'agente' && (
          <>
            <SectionHead title="Depósito en efectivo" sub="Agentes autorizados EGCHAT"
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
            <Field label="Importe a depositar (XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#4C1D95' }, !isValid && s.primaryBtnDisabled]}
              onPress={() => { if (isValid) doDeposit('Depósito en efectivo (Agente)', 'Agente presencial'); }}
              disabled={!isValid} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Confirmar depósito — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <>
            <SectionHead title="Confirmar recarga" sub="Revisa los datos antes de continuar"
              gradient={['#1B3A6B', '#2A5298']} icon={<IcoBanco color="#fff" />} />
            <View style={s.confirmCard}>
              {[['Método','Transferencia bancaria'],['Banco',data.banco||''],
                ['Importe',`${fmt(amountNum)} XAF`],['Cuenta destino','GQ-EGCHAT-001-2026']].map(([l,v]) => (
                <View key={l} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{l}</Text>
                  <Text style={s.confirmValue}>{v}</Text>
                </View>
              ))}
              <View style={[s.confirmRow, { paddingTop: 10, borderTopWidth: 0 }]}>
                <Text style={[s.confirmLabel, { fontSize: 14, fontWeight: '700' }]}>Total</Text>
                <Text style={[s.confirmValue, { fontSize: 20, fontWeight: '900', color: '#1B3A6B' }]}>{fmt(amountNum)} XAF</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#1B3A6B' }]}
              onPress={() => doDeposit('Transferencia bancaria', `Banco: ${data.banco}`)}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>He realizado la transferencia</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <View style={s.successWrap}>
            <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.successCircle}>
              <IcoCheck />
            </LinearGradient>
            <Text style={s.successTitle}>{data.codigo ? '¡Código canjeado!' : '¡Recarga completada!'}</Text>
            <Text style={s.successSub}>
              {data.codigo
                ? `+${fmt(parseInt(data.amount||'5000'))} XAF añadidos`
                : `${fmt(amountNum)} XAF añadidos a tu monedero`}
            </Text>
            <View style={s.refCard}>
              <Text style={s.refLabel}>REFERENCIA</Text>
              <Text style={s.refCode}>EGC-REC-{Date.now().toString().slice(-8)}</Text>
            </View>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#00c8a0' }]} onPress={close} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STRIPE — tarjeta internacional ── */}
        {step === 'stripe' && (
          <>
            <SectionHead title="Pagar con tarjeta" sub="Visa, Mastercard, Amex — procesado por Stripe"
              gradient={['#635BFF', '#4F46E5']} icon={<IcoTarjeta color="#fff" />} />
            <View style={s.infoBox}>
              <Text style={[s.infoValue, { textAlign: 'center', paddingVertical: 4 }]}>
                💳  Pago 100% seguro · Cifrado SSL
              </Text>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Comisión</Text>
                <Text style={s.infoValue}>2.9% + 30 XAF</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Disponibilidad</Text>
                <Text style={s.infoValue}>Inmediato</Text>
              </View>
            </View>
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe (mín. 500 XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="10000" keyboardType="numeric" />
            {amountNum >= 500 && (
              <View style={[s.infoBox, { marginBottom: 8 }]}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Recibirás</Text>
                  <Text style={[s.infoValue, { color: '#00c8a0', fontWeight: '700' }]}>
                    {fmt(getNetAmount('stripe', amountNum))} XAF
                  </Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Comisión Stripe</Text>
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
                      'Pago con Stripe',
                      `PaymentIntent creado.\n\nEn producción: integra @stripe/stripe-react-native para confirmar con la tarjeta.\n\nClientSecret: ${intent.clientSecret?.slice(0, 30)}...`,
                      [
                        { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
                        { text: 'Simular pago ✓', onPress: async () => {
                          const result = await confirmDeposit(intent.id, 'stripe');
                          onSuccess();
                          set('ref', intent.id);
                          setStep('success');
                          setLoading(false);
                        }},
                      ],
                    );
                  } else {
                    Alert.alert('Stripe no configurado', 'Añade STRIPE_SECRET_KEY al servidor para activar pagos reales.');
                    setLoading(false);
                  }
                } catch (e: any) {
                  Alert.alert('Error', e.message || 'No se pudo crear el pago');
                  setLoading(false);
                }
              }}
              disabled={amountNum < 500 || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>Pagar {amountNum >= 500 ? fmt(amountNum) : '…'} XAF con tarjeta</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* ── ORANGE MONEY ── */}
        {(step === 'orange_money' || step === 'mtn_mobile') && (
          <>
            <SectionHead
              title={step === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'}
              sub="Pago USSD — confirma en tu teléfono"
              gradient={step === 'orange_money' ? ['#FF6600', '#EA580C'] : ['#FFCC00', '#D97706']}
              icon={<IcoEfectivo color="#fff" />}
            />
            <View style={s.infoBox}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Comisión</Text>
                <Text style={s.infoValue}>1%</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Tiempo</Text>
                <Text style={s.infoValue}>Inmediato tras confirmar USSD</Text>
              </View>
            </View>
            <QuickAmounts amounts={[1000,5000,10000,25000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe (XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label="Tu número de teléfono" value={data.phone||''} onChangeText={v=>set('phone',v)} placeholder="+240 222 000 000" keyboardType="phone-pad" />
            {amountNum >= 1000 && (
              <View style={[s.infoBox, { marginBottom: 8 }]}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Recibirás</Text>
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
                  Alert.alert('Error', e.message);
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
                    Iniciar pago USSD — {amountNum >= 1000 ? fmt(amountNum) : '…'} XAF
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* ── POLLING — esperando confirmación USSD ── */}
        {step === 'polling' && (
          <View style={s.successWrap}>
            <View style={[s.successCircle, { backgroundColor: '#FF6600' }]}>
              <Text style={{ fontSize: 28 }}>📱</Text>
            </View>
            <Text style={s.successTitle}>Confirma en tu teléfono</Text>
            {data.ussdCode ? (
              <View style={s.refCard}>
                <Text style={s.refLabel}>CÓDIGO USSD</Text>
                <Text style={[s.refCode, { fontSize: 22, letterSpacing: 2 }]}>{data.ussdCode}</Text>
              </View>
            ) : null}
            <Text style={[s.successSub, { marginTop: 8 }]}>
              Marca el código en tu teléfono {data.phone ? `(${data.phone})` : ''} y confirma con tu PIN.
            </Text>
            <ActivityIndicator color="#00c8a0" style={{ marginVertical: 12 }} />
            <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
              Esperando confirmación del operador…
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Ya confirmé el pago ✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
              <Text style={s.backBtnText}>Cancelar</Text>
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
        Alert.alert('Límite excedido', checkResult.reason || 'No puedes realizar esta operación.');
        setLoading(false);
        return;
      }
      if (checkResult.requiresPin && !data.pin) {
        Alert.alert('PIN requerido', 'Para esta operación necesitas ingresar tu PIN de seguridad.');
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
    { id: 'tarjeta', label: 'Retirar a tarjeta',     sub: 'Tarjeta bancaria vinculada — 1-3 días',    gradient: ['#1B3A6B','#2A5298'] as [string,string], icon: <IcoTarjeta color="#fff" /> },
    { id: 'banco',   label: 'Transferencia bancaria', sub: 'A tu cuenta bancaria en GQ — 1-2 días',   gradient: ['#065F46','#00c8a0'] as [string,string], icon: <IcoBanco color="#fff" /> },
    { id: 'agente',  label: 'Retirar en agente',      sub: 'Efectivo inmediato en agentes EGCHAT',    gradient: ['#4C1D95','#6B5BD6'] as [string,string], icon: <IcoAgente color="#fff" /> },
  ];

  const TITLES: Record<WStep, string> = {
    menu: 'Retirar dinero', tarjeta: 'Retirar a tarjeta',
    banco: 'Transferencia bancaria', agente: 'Retirar en agente',
    confirm: 'Confirmar retiro', success: '¡Retiro procesado!',
  };

  const InsufficientAlert = () => amountNum > balance && amountNum > 0 ? (
    <View style={s.alertBox}>
      <Text style={s.alertText}>⚠️ Saldo insuficiente</Text>
    </View>
  ) : null;

  return (
    <Sheet visible={visible} title={TITLES[step]} subtitle={`Disponible: ${fmt(balance)} XAF`} onClose={close}>
      <View style={s.sheetBody}>

        {/* MENÚ */}
        {step === 'menu' && (
          <>
            <SectionHead title="Retirar dinero" sub={`${fmt(balance)} XAF disponibles`}
              gradient={['#4C1D95','#6B5BD6']} icon={<IcoEfectivo color="#fff" />} />
            <Text style={s.methodsLabel}>MÉTODO DE RETIRO</Text>
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
            <SectionHead title="Retirar a tarjeta" sub="Transferencia a tarjeta bancaria"
              gradient={['#1B3A6B','#2A5298']} icon={<IcoTarjeta color="#fff" />} />
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe (mín. 1,000 XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label="Últimos 4 dígitos de la tarjeta" value={data.card||''} onChangeText={v=>set('card',v)} placeholder="1234" keyboardType="numeric" />
            <Field label="PIN de confirmación" value={data.pin||''} onChangeText={v=>set('pin',v)} placeholder="••••" secureTextEntry />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, (!isValid||!data.card||!data.pin) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.card && data.pin) setStep('confirm'); }}
              disabled={!isValid || !data.card || !data.pin} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Continuar — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* BANCO */}
        {step === 'banco' && (
          <>
            <SectionHead title="Transferencia bancaria" sub="A tu cuenta bancaria en GQ"
              gradient={['#065F46','#00c8a0']} icon={<IcoBanco color="#fff" />} />
            <QuickAmounts amounts={[5000,10000,25000,50000]} selected={data.amount||''} onSelect={v=>set('amount',v)} />
            <Field label="Importe (mín. 1,000 XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <Field label="Banco destino" value={data.banco||''} onChangeText={v=>set('banco',v)} placeholder="BANGE, BGFI, CCEI..." />
            <Field label="Número de cuenta" value={data.cuenta||''} onChangeText={v=>set('cuenta',v)} placeholder="GQ-XXXX-XXXX" />
            <Field label="Titular de la cuenta" value={data.titular||''} onChangeText={v=>set('titular',v)} placeholder="Nombre completo" />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, (!isValid||!data.banco||!data.cuenta||!data.titular) && s.primaryBtnDisabled]}
              onPress={() => { if (isValid && data.banco && data.cuenta && data.titular) setStep('confirm'); }}
              disabled={!isValid || !data.banco || !data.cuenta || !data.titular} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Continuar — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* AGENTE */}
        {step === 'agente' && (
          <>
            <SectionHead title="Retirar en agente" sub="Efectivo inmediato en agentes EGCHAT"
              gradient={['#4C1D95','#6B5BD6']} icon={<IcoAgente color="#fff" />} />
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>Presenta tu código en cualquier agente EGCHAT autorizado para retirar en efectivo de forma inmediata.</Text>
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
            <Field label="Importe (mín. 1,000 XAF)" value={data.amount||''} onChangeText={v=>set('amount',v)} placeholder="5000" keyboardType="numeric" />
            <InsufficientAlert />
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn, !isValid && s.primaryBtnDisabled]}
              onPress={() => { if (isValid) setStep('confirm'); }}
              disabled={!isValid} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Generar código de retiro — {isValid ? fmt(amountNum) : '0'} XAF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnText}>← Volver</Text></TouchableOpacity>
          </>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <>
            <SectionHead title="Confirmar retiro" sub="Revisa antes de confirmar"
              gradient={['#C0392B','#E74C3C']} icon={<IcoEfectivo color="#fff" />} />
            <View style={s.confirmCard}>
              {[
                ['Importe', `${fmt(amountNum)} XAF`],
                ['Método', data.card ? 'Tarjeta bancaria' : data.cuenta ? 'Transferencia bancaria' : 'Agente EGCHAT'],
                ['Saldo tras retiro', `${fmt(balance - amountNum)} XAF`],
              ].map(([l,v]) => (
                <View key={l} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{l}</Text>
                  <Text style={s.confirmValue}>{v}</Text>
                </View>
              ))}
              <View style={[s.confirmRow, { paddingTop: 10 }]}>
                <Text style={[s.confirmLabel, { fontSize: 14, fontWeight: '700' }]}>Total a retirar</Text>
                <Text style={[s.confirmValue, { fontSize: 20, fontWeight: '900', color: '#C0392B' }]}>{fmt(amountNum)} XAF</Text>
              </View>
            </View>
            <View style={s.alertBox}>
              <Text style={s.alertText}>⚠️ Esta operación debitará {fmt(amountNum)} XAF. No se puede deshacer.</Text>
            </View>
            <TouchableOpacity
              style={[s.primaryBtn, s.withdrawBtn]}
              onPress={() => {
                const method = data.card ? 'Tarjeta bancaria' : data.cuenta ? 'Transferencia bancaria' : 'Retiro en agente';
                const dest = data.card || `${data.banco}-${data.cuenta}` || 'Código agente';
                doWithdraw(method, dest);
              }}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Confirmar retiro — {fmt(amountNum)} XAF</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}><Text style={s.backBtnText}>Cancelar</Text></TouchableOpacity>
          </>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <View style={s.successWrap}>
            <LinearGradient colors={['#4C1D95','#6B5BD6']} style={s.successCircle}>
              <IcoCheck />
            </LinearGradient>
            <Text style={s.successTitle}>¡Retiro procesado!</Text>
            <Text style={s.successSub}>
              {data.card ? 'Llegará a tu tarjeta en 1-3 días hábiles.' :
               data.cuenta ? 'Llegará a tu cuenta en 1-2 días hábiles.' :
               'Acude al agente con tu código.'}
            </Text>
            <View style={[s.refCard, { borderColor: '#DDD6FE' }]}>
              <Text style={[s.refLabel, { color: '#4C1D95' }]}>REFERENCIA</Text>
              <Text style={s.refCode}>EGC-RET-{Date.now().toString().slice(-8)}</Text>
              <View style={s.refBalanceRow}>
                <Text style={s.refBalanceLabel}>Nuevo saldo</Text>
                <Text style={[s.refBalanceValue, { color: '#4C1D95' }]}>{fmt(balance - amountNum)} XAF</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#4C1D95' }]} onPress={close} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </Sheet>
  );
};

// ── Modal Agregar Cuenta Bancaria ─────────────────────────────────
const AddBankModal = ({
  visible, onClose, onAdd,
}: { visible: boolean; onClose: () => void; onAdd: (acc: any) => void }) => {
  const [bank, setBank] = useState('');
  const [type, setType] = useState('Corriente');
  const [balance, setBalance] = useState('');
  const TYPES = ['Corriente', 'Ahorros', 'Nómina', 'Inversión'];

  const save = () => {
    if (!bank || !balance) { Alert.alert('Error', 'Rellena todos los campos'); return; }
    onAdd({ id: Date.now().toString(), bank, type, balance: parseInt(balance) });
    setBank(''); setType('Corriente'); setBalance('');
    onClose();
  };

  return (
    <Sheet visible={visible} title="Agregar Cuenta" onClose={onClose}>
      <View style={s.sheetBody}>
        <Field label="Banco" value={bank} onChangeText={setBank} placeholder="Ej: BANGE, CCEI Bank..." />
        <Text style={s.fieldLabel}>Tipo de cuenta</Text>
        <View style={s.quickRow}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} style={[s.quickBtn, type===t && s.quickBtnActive]}
              onPress={() => setType(t)} activeOpacity={0.7}>
              <Text style={[s.quickBtnText, type===t && s.quickBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field label="Saldo inicial (XAF)" value={balance} onChangeText={setBalance} placeholder="0" keyboardType="numeric" />
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#00c8a0' }]} onPress={save} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Guardar cuenta</Text>
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
  const FILTERS = [
    { id: 'all',      label: 'Todas' },
    { id: 'received', label: 'Recibidas' },
    { id: 'sent',     label: 'Enviadas' },
    { id: 'deposit',  label: 'Depósitos' },
    { id: 'withdraw', label: 'Retiros' },
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
            <Text style={s.histTitle}>Historial Completo</Text>
            <TouchableOpacity onPress={onClose} style={s.histCloseBtn}>
              <Text style={{ fontSize: 18, color: '#374151' }}>✕</Text>
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
                <Text style={s.emptyIcon}>📭</Text>
                <Text style={s.emptyText}>Sin transacciones</Text>
                <Text style={s.emptySub}>No hay movimientos en esta categoría</Text>
              </View>
            ) : filtered.map((tx, i) => (
              <View key={tx.id || i} style={s.txCard}>
                <View style={[s.txIconWrap, { backgroundColor: isCredit(tx.type) ? '#E8F8EE' : '#FEF2F2' }]}>
                  {isCredit(tx.type) ? <IcoArrowDown /> : <IcoArrowUp />}
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txLabel}>{getTxLabel(tx)}</Text>
                  <Text style={s.txDesc}>{getTxDesc(tx)}</Text>
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
  const zipAnim = useRef(new Animated.Value(0)).current;

  const [showQR, setShowQR] = useState(false);
  const [qrType, setQrType] = useState<'receive'|'pay'>('receive');
  const [showRecarga, setShowRecarga] = useState(false);
  const [showRetiro, setShowRetiro] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState<Array<{
    id: string; from: string; to: string; amount: number;
    status: 'pending' | 'cancelled'; expiresAt: number;
  }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadData = useCallback(async () => {
    try {
      const [bal, txs] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(1),
      ]);
      setBalance(bal.balance || 0);
      setTransactions(txs.transactions || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadData();
    loadBankAccounts().then(setBankAccounts);
    authAPI.me().then(async me => {
      const profile = await mergePersistentAvatar(me);
      setUser(profile);
      setUserId(profile?.id || '');
      setUserName(profile?.full_name || 'Usuario');
      setUserPhone(profile?.phone || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    return onProfileUpdated(patch => {
      setUser((prev: any) => prev ? { ...prev, ...patch } : prev);
      if (patch.full_name) setUserName(patch.full_name);
      if (patch.phone) setUserPhone(patch.phone);
    });
  }, []);

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

  const recentTx = transactions.slice(0, 8);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#EEF2F7' }]} edges={['left', 'right']}>

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
              <Text style={s.balanceCardLabel}>MONEDERO EGCHAT</Text>

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
                        {balanceRevealing ? 'Abriendo…' : '🔒  Toca para revelar'}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {balanceRevealed && (
                  <TouchableOpacity onPress={hideBalance} style={s.balanceHideBtn} hitSlop={12}>
                    <Text style={s.balanceHideText}>Ocultar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={s.balanceSubLabel}>Saldo disponible</Text>

              {/* 4 botones de acción */}
              <View style={s.actionsRow}>
                {[
                  { label: 'Recibir', icon: <IcoRecibir />, onPress: () => { setQrType('receive'); setShowQR(true); } },
                  { label: 'Pagar',   icon: <IcoPagar />,   onPress: () => { setQrType('pay');     setShowQR(true); } },
                  { label: 'Recarga', icon: <IcoRecarga />, onPress: () => setShowRecarga(true) },
                  { label: 'Retiro',  icon: <IcoRetiro />,  onPress: () => setShowRetiro(true) },
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
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>MIS CUENTAS</Text>
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
                      <Text style={[s.bankType, { color: C.textSecondary }]}>{acc.type}</Text>
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
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>MIS TARJETAS</Text>
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
                <Text style={s.cardPreviewIcon}>💳</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.bankName, { color: C.textPrimary }]}>Tarjetas vinculadas</Text>
                <Text style={[s.bankType, { color: C.textSecondary }]}>Gestiona tus tarjetas bancarias</Text>
              </View>
              <Text style={{ color: C.textTertiary, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Transferencias pendientes ── */}
          {pendingTransfers.filter(t => t.status === 'pending').length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: '#b45309' }]}>TRANSFERENCIAS PENDIENTES</Text>
              </View>
              <View style={[s.card, { backgroundColor: C.bgSecondary }]}> 
                {pendingTransfers.filter(t => t.status === 'pending').map((transfer, i, arr) => (
                  <View key={transfer.id}>
                    <View style={s.pendingRow}>
                      <View style={s.pendingIcon}>
                        <Text>⏱</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.bankName, { color: C.textPrimary }]}> 
                          {transfer.from} → {transfer.to}
                        </Text>
                        <Text style={[s.bankType, { color: C.textSecondary }]}> 
                          Expira en {Math.max(0, Math.ceil((transfer.expiresAt - Date.now()) / 60000))} min
                        </Text>
                      </View>
                      <Text style={[s.pendingAmount, { color: '#b45309' }]}> 
                        {fmt(transfer.amount)} XAF
                      </Text>
                      <TouchableOpacity
                        style={s.cancelPendingBtn}
                        onPress={() => setPendingTransfers(prev =>
                          prev.map(t => t.id === transfer.id ? { ...t, status: 'cancelled' as const } : t),
                        )}
                      >
                        <Text style={s.cancelPendingText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                    {i < arr.length - 1 && <View style={[s.divider, { backgroundColor: C.borderLight }]} />}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Historial de Transferencias ── */}
          <View style={s.sectionBlock}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: C.textPrimary }]}>HISTORIAL DE TRANSFERENCIAS</Text>
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
                <Text style={[s.bankName, { color: C.textPrimary }]}>Ver mis transferencias</Text>
                <Text style={[s.bankType, { color: C.textSecondary }]}>Consulta tu historial completo</Text>
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
          if (n.chatId) router.push(`/chat/${n.chatId}` as any);
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
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A2B4A', flex: 1 }}>Mis Tarjetas</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <CardsScreen bank={{ id: 'egchat', name: 'EGCHAT Pay', color: '#1B3A6B', color2: '#2A5298', initials: 'EG', full: 'EGCHAT Wallet', founded: 2024, desc: '', address: '', phone: '', web: '', swift: '', branches: 0, atms: 0, services: [], accounts: [] }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: 'rgba(180,83,9,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  pendingAmount: { fontSize: 13, fontWeight: '600' },
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
  qrScanBtnText: { fontSize: 13, fontWeight: '700', color: '#00b4e6' },
  qrInput:       { width: '100%', backgroundColor: '#F7F8FA', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  qrCloseFullBtn:{ borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 4 },
  qrCloseBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default function MonederoScreen() {
  return (
    <TabErrorBoundary tabName="Cartera">
      <MonederoScreenInner />
    </TabErrorBoundary>
  );
}
