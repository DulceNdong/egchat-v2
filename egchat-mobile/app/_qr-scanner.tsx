// ══════════════════════════════════════════════════════════════════
// Escáner QR de Pago — EGChat
// Solo escanea QR de pago EGCHAT
// Flujo: Escanear → Modal cantidad → Modal PIN validación → Éxito
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, StatusBar, Modal,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Vibration, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle, Polyline, Rect } from 'react-native-svg';
import { walletAPI, authAPI } from '../src/api';
import { parseEgchatPayQr } from '../src/utils/walletQr';
import { Colors } from '../src/theme';

const { width: W } = Dimensions.get('window');
const FRAME = W * 0.68;

// ── Iconos SVG ─────────────────────────────────────────────────────
const IcClose = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);
const IcCheck = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Polyline points="20 6 9 17 4 12"/>
  </Svg>
);
const IcSend = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="22" y1="2" x2="11" y2="13"/><Polyline points="22 2 15 22 11 13 2 9 22 2"/>
  </Svg>
);
const IcShield = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth={1.5} strokeLinecap="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <Polyline points="9 12 11 14 15 10"/>
  </Svg>
);
const IcWallet = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.8} strokeLinecap="round">
    <Path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
    <Path d="M3 10h17"/><Circle cx="17" cy="14" r="1.5" fill="rgba(255,255,255,0.5)" stroke="none"/>
  </Svg>
);

// ── Línea de escaneo animada ───────────────────────────────────────
const ScanLine = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[st.scanLine, {
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME - 3] }) }],
    }]} />
  );
};

// ── Esquinas del frame ─────────────────────────────────────────────
const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const t = pos.startsWith('t');
  const l = pos.endsWith('l');
  return (
    <View style={[
      st.corner,
      t ? { top: -1 } : { bottom: -1 },
      l ? { left: -1 } : { right: -1 },
      t &&  l && { borderTopWidth: 3, borderLeftWidth: 3 },
      t && !l && { borderTopWidth: 3, borderRightWidth: 3 },
      !t &&  l && { borderBottomWidth: 3, borderLeftWidth: 3 },
      !t && !l && { borderBottomWidth: 3, borderRightWidth: 3 },
    ]} />
  );
};

// ══════════════════════════════════════════════════════════════════
// MODAL CANTIDAD
// ══════════════════════════════════════════════════════════════════
interface PayData { userId: string; name?: string; concept?: string; fixedAmount?: number; }

function AmountModal({ visible, payData, onConfirm, onCancel }: {
  visible: boolean;
  payData: PayData | null;
  onConfirm: (amount: number, concept: string) => void;
  onCancel: () => void;
}) {
  const [amount,  setAmount]  = useState(payData?.fixedAmount ? String(payData.fixedAmount) : '');
  const [concept, setConcept] = useState(payData?.concept || '');
  const insets = useSafeAreaInsets();
  const amountNum = parseInt(amount || '0', 10);
  const isFixed = !!payData?.fixedAmount;

  useEffect(() => {
    if (visible) {
      setAmount(payData?.fixedAmount ? String(payData.fixedAmount) : '');
      setConcept(payData?.concept || '');
    }
  }, [visible, payData]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={am.overlay}>
          <View style={[am.sheet, { paddingBottom: insets.bottom + 20 }]}>
            {/* Handle */}
            <View style={am.handle} />

            {/* Header */}
            <View style={am.header}>
              <View>
                <Text style={am.title}>Confirmar pago</Text>
                {payData?.name && <Text style={am.subtitle}>A: {payData.name}</Text>}
              </View>
              <TouchableOpacity style={am.closeBtn} onPress={onCancel}>
                <IcClose />
              </TouchableOpacity>
            </View>

            {/* Monto */}
            <View style={am.amountWrap}>
              <Text style={am.currency}>XAF</Text>
              <TextInput
                style={am.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                editable={!isFixed}
                autoFocus={!isFixed}
                selectionColor="#00C8A0"
              />
            </View>
            {isFixed && (
              <Text style={am.fixedNote}>Monto fijado por el receptor</Text>
            )}

            {/* Concepto */}
            <View style={am.inputWrap}>
              <TextInput
                style={am.conceptInput}
                value={concept}
                onChangeText={setConcept}
                placeholder="Concepto (opcional)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                editable={!payData?.concept}
                selectionColor="#00C8A0"
              />
            </View>

            {/* Botón pagar */}
            <TouchableOpacity
              style={[am.payBtn, (!amountNum || amountNum < 1) && am.payBtnDisabled]}
              onPress={() => amountNum >= 1 && onConfirm(amountNum, concept)}
              activeOpacity={0.85}
              disabled={!amountNum || amountNum < 1}
            >
              <IcSend />
              <Text style={am.payBtnTxt}>Pagar {amountNum > 0 ? `${amountNum.toLocaleString()} XAF` : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onCancel} style={am.cancelBtn}>
              <Text style={am.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL PIN / CÓDIGO DE VALIDACIÓN
// ══════════════════════════════════════════════════════════════════
function PinModal({ visible, onConfirm, onCancel, loading }: {
  visible: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [pin, setPin] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) { setPin(''); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [visible]);

  const digits = pin.split('').slice(0, 4);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={pm.overlay}>
          <View style={[pm.card, { paddingBottom: insets.bottom + 24 }]}>
            {/* Icono */}
            <View style={pm.iconWrap}>
              <IcShield />
            </View>

            <Text style={pm.title}>Introduce tu PIN</Text>
            <Text style={pm.sub}>Introduce tu código de 4 dígitos para validar el pago</Text>

            {/* Puntos del PIN */}
            <TouchableOpacity style={pm.dotsRow} onPress={() => inputRef.current?.focus()} activeOpacity={1}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[pm.dot, digits[i] !== undefined && pm.dotFilled]}>
                  {digits[i] !== undefined && <View style={pm.dotInner} />}
                </View>
              ))}
            </TouchableOpacity>

            {/* Input oculto */}
            <TextInput
              ref={inputRef}
              style={pm.hiddenInput}
              value={pin}
              onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              caretHidden
              onSubmitEditing={() => pin.length === 4 && onConfirm(pin)}
            />

            {/* Teclado numérico */}
            <View style={pm.numPad}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <TouchableOpacity
                  key={i}
                  style={[pm.numKey, !k && pm.numKeyEmpty]}
                  onPress={() => {
                    if (!k) return;
                    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
                    if (pin.length < 4) setPin(p => p + k);
                  }}
                  activeOpacity={k ? 0.7 : 1}
                  disabled={!k && k !== '⌫'}
                >
                  <Text style={pm.numKeyTxt}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirmar */}
            <TouchableOpacity
              style={[pm.confirmBtn, (pin.length < 4 || loading) && pm.confirmBtnDisabled]}
              onPress={() => pin.length === 4 && onConfirm(pin)}
              disabled={pin.length < 4 || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={pm.confirmBtnTxt}>Confirmar pago</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={onCancel} style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL ÉXITO
// ══════════════════════════════════════════════════════════════════
function SuccessModal({ visible, amount, recipientName, onDone }: {
  visible: boolean; amount: number; recipientName: string; onDone: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={sc.overlay}>
        <View style={sc.card}>
          <Animated.View style={[sc.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#00C8A0" strokeWidth={2} strokeLinecap="round">
              <Polyline points="20 6 9 17 4 12"/>
            </Svg>
          </Animated.View>
          <Text style={sc.title}>¡Pago realizado!</Text>
          <Text style={sc.amount}>{amount.toLocaleString()} XAF</Text>
          {!!recipientName && <Text style={sc.recipient}>enviados a {recipientName}</Text>}
          <TouchableOpacity style={sc.doneBtn} onPress={onDone}>
            <Text style={sc.doneBtnTxt}>Listo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — Solo escáner QR de pago
// ══════════════════════════════════════════════════════════════════
export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  const [scanned,    setScanned]    = useState(false);
  const [payData,    setPayData]    = useState<PayData | null>(null);
  const [showAmount, setShowAmount] = useState(false);
  const [showPin,    setShowPin]    = useState(false);
  const [showSuccess,setShowSuccess]= useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [pendingAmt, setPendingAmt] = useState(0);
  const [pendingCon, setPendingCon] = useState('');

  const handleScan = useCallback(async ({ data }: { data: string }) => {
    if (scanned) return;
    const payQr = parseEgchatPayQr(data);
    if (!payQr?.userId) return; // ignora QR que no son de pago EGCHAT

    try {
      const me = await authAPI.me();
      if (me?.id === payQr.userId) { Alert.alert('Error', 'No puedes pagarte a ti mismo'); return; }
    } catch {}

    setScanned(true);
    Vibration.vibrate(80);
    setPayData({
      userId: payQr.userId,
      name: payQr.name,
      concept: payQr.concept,
      fixedAmount: payQr.amount ? parseInt(payQr.amount, 10) : undefined,
    });
    setShowAmount(true);
  }, [scanned]);

  const handleAmountConfirm = (amount: number, concept: string) => {
    setPendingAmt(amount);
    setPendingCon(concept);
    setShowAmount(false);
    setShowPin(true);
  };

  const handlePinConfirm = async (pin: string) => {
    if (!payData) return;
    setPinLoading(true);
    try {
      // Validar PIN y ejecutar transferencia
      await walletAPI.transfer(payData.userId, pendingAmt, pendingCon || 'Pago QR', pin);
      setPaidAmount(pendingAmt);
      setShowPin(false);
      setShowSuccess(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'PIN incorrecto o saldo insuficiente');
      setPinLoading(false);
    } finally {
      setPinLoading(false);
    }
  };

  const reset = () => {
    setScanned(false); setPayData(null);
    setShowAmount(false); setShowPin(false); setShowSuccess(false);
    setPendingAmt(0); setPendingCon('');
  };

  // ── Sin permiso ──────────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View style={st.center}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={st.permIconWrap}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round">
            <Rect x="3" y="3" width="18" height="18" rx="2"/>
            <Path d="M3 9h18M9 21V9"/>
          </Svg>
        </View>
        <Text style={st.permTitle}>Acceso a la cámara</Text>
        <Text style={st.permSub}>Necesitamos la cámara para escanear el QR de pago</Text>
        <TouchableOpacity style={st.permBtn} onPress={requestPermission}>
          <Text style={st.permBtnTxt}>Permitir acceso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Cámara */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay oscuro con recorte */}
      <View style={st.overlay}>
        <View style={st.overlayTop} />
        <View style={st.overlayRow}>
          <View style={st.overlaySide} />
          <View style={st.frameBox}>
            <Corner pos="tl" /><Corner pos="tr" />
            <Corner pos="bl" /><Corner pos="br" />
            {!scanned && <ScanLine />}
            {scanned && (
              <View style={st.scannedOverlay}>
                <View style={st.scannedCircle}>
                  <IcCheck />
                </View>
              </View>
            )}
          </View>
          <View style={st.overlaySide} />
        </View>
        <View style={st.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView edges={['top']} style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
          <IcClose />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Escanear QR de pago</Text>
        <View style={{ width: 42 }} />
      </SafeAreaView>

      {/* Instrucción debajo del frame */}
      <View style={st.hintWrap}>
        <View style={st.hintBadge}>
          <IcWallet />
          <Text style={st.hintTxt}>
            {scanned ? 'QR detectado...' : 'Apunta al QR de pago EGChat'}
          </Text>
        </View>
        {scanned && !showAmount && !showPin && !showSuccess && (
          <TouchableOpacity onPress={reset} style={st.rescanBtn}>
            <Text style={st.rescanTxt}>Volver a escanear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modales */}
      <AmountModal
        visible={showAmount}
        payData={payData}
        onConfirm={handleAmountConfirm}
        onCancel={reset}
      />
      <PinModal
        visible={showPin}
        onConfirm={handlePinConfirm}
        onCancel={() => { setShowPin(false); setShowAmount(true); }}
        loading={pinLoading}
      />
      <SuccessModal
        visible={showSuccess}
        amount={paidAmount}
        recipientName={payData?.name || ''}
        onDone={() => { reset(); router.back(); }}
      />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
const DARK      = '#0a0a0f';
const DIM       = 'rgba(255,255,255,0.08)';
const OVERLAY   = 'rgba(0,0,0,0.65)';
const ACCENT    = '#00C8A0';

const st = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#000' },
  center:        { flex: 1, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', padding: 32 },

  // Overlay
  overlay:       { ...StyleSheet.absoluteFillObject },
  overlayTop:    { flex: 1, backgroundColor: OVERLAY },
  overlayRow:    { flexDirection: 'row', height: FRAME },
  overlaySide:   { flex: 1, backgroundColor: OVERLAY },
  overlayBottom: { flex: 1.5, backgroundColor: OVERLAY },

  // Frame
  frameBox:      { width: FRAME, height: FRAME, position: 'relative' },
  corner:        { position: 'absolute', width: 22, height: 22, borderColor: ACCENT },
  scanLine:      { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: ACCENT, opacity: 0.9 },
  scannedOverlay:{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,200,160,0.12)' },
  scannedCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:        { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Hint
  hintWrap:      { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', gap: 12 },
  hintBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  hintTxt:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  rescanBtn:     { backgroundColor: DIM, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rescanTxt:     { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Permisos
  permIconWrap:  { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permTitle:     { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  permSub:       { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 32 },
  permBtn:       { backgroundColor: ACCENT, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, width: '100%', alignItems: 'center' },
  permBtnTxt:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── AmountModal styles ────────────────────────────────────────────
const am = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:         { backgroundColor: '#111118', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  title:         { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle:      { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 3 },
  closeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  amountWrap:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 8, gap: 8 },
  currency:      { color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  amountInput:   { color: '#fff', fontSize: 52, fontWeight: '800', textAlign: 'center', minWidth: 100, letterSpacing: -1 },
  fixedNote:     { color: ACCENT, fontSize: 12, textAlign: 'center', marginBottom: 20 },

  inputWrap:     { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, marginBottom: 20, paddingHorizontal: 16 },
  conceptInput:  { color: '#fff', fontSize: 15, paddingVertical: 14 },

  payBtn:        { backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, marginBottom: 10 },
  payBtnDisabled:{ opacity: 0.35 },
  payBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn:     { alignItems: 'center', paddingVertical: 10 },
  cancelTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});

// ── PinModal styles ───────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'flex-end' },
  card:          { width: '100%', backgroundColor: '#111118', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 32, alignItems: 'center' },

  iconWrap:      { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(0,200,160,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:         { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub:           { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 28, lineHeight: 19 },

  dotsRow:       { flexDirection: 'row', gap: 16, marginBottom: 28 },
  dot:           { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  dotFilled:     { borderColor: ACCENT, backgroundColor: 'rgba(0,200,160,0.15)' },
  dotInner:      { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },

  hiddenInput:   { position: 'absolute', opacity: 0, width: 1, height: 1 },

  numPad:        { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginBottom: 24, gap: 0 },
  numKey:        { width: '33.33%', height: 64, alignItems: 'center', justifyContent: 'center' },
  numKeyEmpty:   { opacity: 0 },
  numKeyTxt:     { color: '#fff', fontSize: 24, fontWeight: '300' },

  confirmBtn:    { width: '100%', backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.3 },
  confirmBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ── SuccessModal styles ───────────────────────────────────────────
const sc = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:       { backgroundColor: '#111118', borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  iconWrap:   { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: 'rgba(0,200,160,0.1)' },
  title:      { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  amount:     { color: ACCENT, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginBottom: 4 },
  recipient:  { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 },
  doneBtn:    { width: '100%', backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  doneBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
