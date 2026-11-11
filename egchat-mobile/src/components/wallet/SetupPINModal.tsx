import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { walletPIN } from '../../services/walletPin';
import { authAPI } from '../../api';
import { t as tr } from '../../translations';

const PIN_LEN = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

function PinDots({ value }: { value: string }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <View
          key={i}
          style={[s.dot, i < value.length ? s.dotFilled : s.dotEmpty]}
        />
      ))}
    </View>
  );
}

function NumPad({ onPress, disabled }: { onPress: (k: string) => void; disabled?: boolean }) {
  return (
    <View style={s.pad}>
      {KEYS.map((k, i) => (
        <TouchableOpacity
          key={i}
          style={[s.padKey, k === '⌫' && s.padDel, !k && s.padBlank]}
          onPress={() => k && onPress(k)}
          disabled={!k || disabled}
          activeOpacity={0.7}
        >
          <Text style={[s.padKeyText, k === '⌫' && s.padDelText]}>{k}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface Props {
  visible: boolean;
  onDone: () => void;
  onCancel: () => void;
}

type Step = 'checking' | 'current' | 'create' | 'confirm';

export function SetupPINModal({ visible, onDone, onCancel }: Props) {
  const [step, setStep] = useState<Step>('checking');
  const [hasPin, setHasPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [typedCurrent, setTypedCurrent] = useState('');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Cada apertura invalida las respuestas de la comprobación anterior.
  const runRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    const run = ++runRef.current;
    setStep('checking');
    setHasPin(false);
    setCurrentPin('');
    setTypedCurrent('');
    setPin1('');
    setPin2('');
    setError('');
    setBusy(false);
    // Si la consulta se cuelga no bloqueamos la hoja: el servidor responde
    // 403 al guardar y entonces pedimos el PIN actual.
    const timer = setTimeout(() => {
      if (runRef.current === run) { runRef.current = -1; setStep('create'); }
    }, 8000);
    authAPI.hasPinConfigured()
      .then(r => {
        if (runRef.current !== run) return;
        clearTimeout(timer);
        if (r?.hasPin) { setHasPin(true); setStep('current'); }
        else setStep('create');
      })
      .catch(() => {
        if (runRef.current !== run) return;
        clearTimeout(timer);
        setStep('create');
      });
    return () => clearTimeout(timer);
  }, [visible]);

  const reset = () => {
    setStep('checking');
    setHasPin(false);
    setCurrentPin('');
    setTypedCurrent('');
    setPin1('');
    setPin2('');
    setError('');
    setBusy(false);
  };

  const handleClose = () => {
    if (busy) return;
    runRef.current = -1;
    reset();
    onCancel();
  };

  const verifyCurrent = async (pin: string) => {
    setBusy(true);
    setError('');
    try {
      const r = await authAPI.verifyPin(pin);
      if (r?.valid) {
        setCurrentPin(pin);
        setTypedCurrent('');
        setPin1('');
        setPin2('');
        setStep('create');
      } else {
        setTypedCurrent('');
        setError(r?.message || tr('chtPinIncorrect'));
      }
    } catch (e: any) {
      setTypedCurrent('');
      setError(e?.message || tr('chtPinIncorrect'));
    }
    setBusy(false);
  };

  const savePin = async (pin: string) => {
    setBusy(true);
    setError('');
    try {
      // Sin `currentPin` el servidor rechaza el cambio si ya había un PIN.
      await authAPI.setupPin(pin, hasPin ? currentPin : undefined);
      await walletPIN.save(pin);
      reset();
      onDone();
    } catch (e: any) {
      setPin1('');
      setPin2('');
      if (e?.status === 403) {
        // Había un PIN que este dispositivo no conocía: pedirlo y reintentar.
        setHasPin(true);
        setCurrentPin('');
        setTypedCurrent('');
        setStep('current');
        setError(e?.message || tr('chtPinIncorrect'));
      } else {
        setStep('create');
        setError(e?.message || tr('xtErrorAlConfigurarPIN'));
      }
    }
    setBusy(false);
  };

  const handlePress = (k: string) => {
    if (busy || step === 'checking') return;
    setError('');
    if (step === 'current') {
      if (k === '⌫') { setTypedCurrent(p => p.slice(0, -1)); return; }
      if (typedCurrent.length >= PIN_LEN) return;
      const next = typedCurrent + k;
      setTypedCurrent(next);
      if (next.length === PIN_LEN) setTimeout(() => verifyCurrent(next), 200);
      return;
    }
    if (step === 'create') {
      if (k === '⌫') { setPin1(p => p.slice(0, -1)); return; }
      if (pin1.length >= PIN_LEN) return;
      const next = pin1 + k;
      setPin1(next);
      if (next.length === PIN_LEN) setTimeout(() => setStep('confirm'), 200);
      return;
    }
    if (k === '⌫') { setPin2(p => p.slice(0, -1)); return; }
    if (pin2.length >= PIN_LEN) return;
    const next = pin2 + k;
    setPin2(next);
    if (next.length === PIN_LEN) {
      setTimeout(() => {
        if (next === pin1) savePin(next);
        else {
          setError(tr('xtLosPINsNoCoincidenIntentaloDeNuevo'));
          setPin1('');
          setPin2('');
          setStep('create');
        }
      }, 200);
    }
  };

  const title = step === 'current'
    ? tr('xtCambiarPINDePago')
    : step === 'confirm' ? 'Confirmar PIN' : 'Crear PIN de pago';
  const subtitle = step === 'current'
    ? tr('xtIntroduceTuPIN')
    : step === 'confirm'
      ? tr('xtIntroduceElPINDeNuevoParaConfirmar')
      : hasPin
        ? tr('xtCreaUnPINDe6DigitosParaProtegerTusTransferencias')
        : tr('xtEligeUnPINDe6DigitosParaProtegerTusPagos');
  const dotsValue = step === 'current' ? typedCurrent : step === 'create' ? pin1 : pin2;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient colors={['#1a73e8', '#0d47a1']} style={s.iconWrap}>
            <Text style={{ fontSize: 26 }}>🔒</Text>
          </LinearGradient>
          {step === 'checking' || busy ? (
            <View style={s.dots}>
              <ActivityIndicator color="#1a73e8" />
            </View>
          ) : (
            <PinDots value={dotsValue} />
          )}
          {error ? <Text style={s.error}>{error}</Text> : null}
          <NumPad onPress={handlePress} disabled={busy || step === 'checking'} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#6b7280' },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 16, marginVertical: 24, minHeight: 20,
  },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  dotFilled: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  dotEmpty: { backgroundColor: 'transparent', borderColor: '#d1d5db' },
  error: { textAlign: 'center', fontSize: 13, color: '#ef4444', fontWeight: '600', marginBottom: 8, paddingHorizontal: 20 },
  pad: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10,
    justifyContent: 'center',
  },
  padKey: {
    width: '30%', maxWidth: 120, height: 60, borderRadius: 14,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
  padBlank: { backgroundColor: 'transparent' },
  padDel: { backgroundColor: '#fee2e2' },
  padKeyText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  padDelText: { fontSize: 20, color: '#ef4444' },
});
