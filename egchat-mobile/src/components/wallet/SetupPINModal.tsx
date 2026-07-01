import React, { useState } from 'react';
import {
  View, Text, Modal, Pressable, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { walletPIN } from '../../services/walletPin';

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

function NumPad({ onPress }: { onPress: (k: string) => void }) {
  return (
    <View style={s.pad}>
      {KEYS.map((k, i) => (
        <TouchableOpacity
          key={i}
          style={[s.padKey, k === '⌫' && s.padDel, !k && s.padBlank]}
          onPress={() => k && onPress(k)}
          disabled={!k}
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

export function SetupPINModal({ visible, onDone, onCancel }: Props) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setStep('create');
    setPin1('');
    setPin2('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onCancel();
  };

  const handlePress = (k: string) => {
    setError('');
    if (step === 'create') {
      if (k === '⌫') { setPin1(p => p.slice(0, -1)); return; }
      if (pin1.length >= PIN_LEN) return;
      const next = pin1 + k;
      setPin1(next);
      if (next.length === PIN_LEN) setTimeout(() => setStep('confirm'), 200);
    } else {
      if (k === '⌫') { setPin2(p => p.slice(0, -1)); return; }
      if (pin2.length >= PIN_LEN) return;
      const next = pin2 + k;
      setPin2(next);
      if (next.length === PIN_LEN) {
        setTimeout(async () => {
          if (next === pin1) {
            await walletPIN.save(pin1);
            reset();
            onDone();
          } else {
            setError('Los PINs no coinciden. Inténtalo de nuevo.');
            setPin1('');
            setPin2('');
            setStep('create');
          }
        }, 200);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>
                {step === 'create' ? 'Crear PIN de pago' : 'Confirmar PIN'}
              </Text>
              <Text style={s.subtitle}>
                {step === 'create'
                  ? 'Elige un PIN de 6 dígitos para proteger tus pagos'
                  : 'Introduce el PIN de nuevo para confirmar'}
              </Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient colors={['#1a73e8', '#0d47a1']} style={s.iconWrap}>
            <Text style={{ fontSize: 26 }}>🔒</Text>
          </LinearGradient>
          <PinDots value={step === 'create' ? pin1 : pin2} />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <NumPad onPress={handlePress} />
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
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 24 },
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
