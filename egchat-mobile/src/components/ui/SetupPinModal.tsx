import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Pressable, ActivityIndicator, Vibration, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MIcon } from './MIcon';
import { authAPI } from '../../api';
import { t as tr } from '../../translations';

interface SetupPinModalProps {
  visible: boolean;
  onClose: () => void;
  /** Devuelve el PIN recién guardado para usarlo en la operación pendiente. */
  onSuccess: (pin?: string) => void;
  title?: string;
}

export const SetupPinModal: React.FC<SetupPinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = tr('xtConfigurarPINDeSeguridad'),
}) => {
  const [step, setStep] = useState<'checking' | 'current' | 'create' | 'confirm'>('checking');
  const [hasPin, setHasPin] = useState(false);
  const [verifiedCurrent, setVerifiedCurrent] = useState('');
  const [currentPinArr, setCurrentPinArr] = useState(['', '', '', '', '', '']);
  const [firstPin, setFirstPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Cada apertura invalida la comprobación de la anterior.
  const runRef = useRef(0);

  const currentRefs = [
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
  ];
  const createRefs = [
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
  ];
  const confirmRefs = [
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
    useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (!visible) return;
    const run = ++runRef.current;
    setStep('checking');
    setHasPin(false);
    setVerifiedCurrent('');
    setCurrentPinArr(['', '', '', '', '', '']);
    setFirstPin(['', '', '', '', '', '']);
    setConfirmPin(['', '', '', '', '', '']);
    setCurrentIndex(0);
    setError('');
    setLoading(false);
    // Si la consulta se cuelga no bloqueamos: el 403 del guardado nos devuelve
    // al paso del PIN actual.
    const timer = setTimeout(() => {
      if (runRef.current !== run) return;
      runRef.current = -1;
      setStep('create');
      setTimeout(() => createRefs[0].current?.focus(), 300);
    }, 8000);
    authAPI.hasPinConfigured()
      .then(r => {
        if (runRef.current !== run) return;
        clearTimeout(timer);
        if (r?.hasPin) {
          setHasPin(true);
          setStep('current');
          setTimeout(() => currentRefs[0].current?.focus(), 300);
        } else {
          setStep('create');
          setTimeout(() => createRefs[0].current?.focus(), 300);
        }
      })
      .catch(() => {
        if (runRef.current !== run) return;
        clearTimeout(timer);
        setStep('create');
        setTimeout(() => createRefs[0].current?.focus(), 300);
      });
    return () => clearTimeout(timer);
  }, [visible]);

  const currentPin = step === 'current' ? currentPinArr : step === 'create' ? firstPin : confirmPin;
  const activeRefs = step === 'current' ? currentRefs : step === 'create' ? createRefs : confirmRefs;

  const clearActive = () => {
    const empty = ['', '', '', '', '', ''];
    if (step === 'current') setCurrentPinArr(empty);
    else if (step === 'create') setFirstPin(empty);
    else setConfirmPin(empty);
    setCurrentIndex(0);
    setTimeout(() => activeRefs[0].current?.focus(), 150);
  };

  const verifyCurrentPin = async () => {
    const pin = currentPinArr.join('');
    setLoading(true);
    setError('');
    try {
      const r = await authAPI.verifyPin(pin);
      if (r?.valid) {
        setVerifiedCurrent(pin);
        setCurrentPinArr(['', '', '', '', '', '']);
        setStep('create');
        setCurrentIndex(0);
        setTimeout(() => createRefs[0].current?.focus(), 200);
      } else {
        setError(r?.message || tr('chtPinIncorrect'));
        Vibration.vibrate([100, 50, 100]);
        clearActive();
      }
    } catch (e: any) {
      setError(e?.message || tr('chtPinIncorrect'));
      clearActive();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pinString = currentPin.join('');
    if (pinString.length === 6 && !loading && step !== 'checking') {
      if (step === 'current') {
        setTimeout(() => verifyCurrentPin(), 250);
      } else if (step === 'create') {
        // Pasar a confirmación
        setTimeout(() => {
          setStep('confirm');
          setCurrentIndex(0);
          setTimeout(() => confirmRefs[0].current?.focus(), 100);
        }, 300);
      } else {
        // Verificar y guardar PIN
        handleSavePin();
      }
    }
  }, [currentPin, loading, step]);

  const handlePinChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newPin = [...currentPin];
    newPin[index] = digit;

    if (step === 'current') setCurrentPinArr(newPin);
    else if (step === 'create') setFirstPin(newPin);
    else setConfirmPin(newPin);

    if (digit && index < 5) {
      setCurrentIndex(index + 1);
      activeRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (currentPin[index] === '' && index > 0) {
        setCurrentIndex(index - 1);
        activeRefs[index - 1].current?.focus();
      } else {
        const newPin = [...currentPin];
        newPin[index] = '';
        if (step === 'current') setCurrentPinArr(newPin);
        else if (step === 'create') setFirstPin(newPin);
        else setConfirmPin(newPin);
      }
    }
  };

  const handleSavePin = async () => {
    const firstPinString = firstPin.join('');
    const confirmPinString = confirmPin.join('');
    
    if (firstPinString !== confirmPinString) {
      setError(tr('xtLosPINNoCoinciden'));
      Vibration.vibrate([100, 50, 100]);
      setStep('create');
      setFirstPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setCurrentIndex(0);
      setTimeout(() => createRefs[0].current?.focus(), 300);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sin `currentPin` el servidor rechaza el cambio si ya había un PIN.
      await authAPI.setupPin(firstPinString, hasPin ? verifiedCurrent : undefined);
      Alert.alert(
        '✅ PIN Configurado',
        tr('xtTuPINDeSeguridadHaSidoConfiguradoCorrectamenteAhor'),
        [{ text: 'Continuar', onPress: () => onSuccess(firstPinString) }],
        { cancelable: false }
      );
    } catch (e: any) {
      setFirstPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setCurrentIndex(0);
      if (e?.status === 403) {
        // Había un PIN que este dispositivo no conocía: pedirlo y reintentar.
        setHasPin(true);
        setVerifiedCurrent('');
        setCurrentPinArr(['', '', '', '', '', '']);
        setStep('current');
        setError(e?.message || tr('chtPinIncorrect'));
        setTimeout(() => currentRefs[0].current?.focus(), 300);
      } else {
        setError(e?.message || tr('xtErrorAlConfigurarPIN'));
        setStep('create');
        setTimeout(() => createRefs[0].current?.focus(), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) return;
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin(['', '', '', '', '', '']);
      setCurrentIndex(0);
      setError('');
      setTimeout(() => createRefs[0].current?.focus(), 300);
    } else if (step === 'create' && hasPin) {
      setStep('current');
      setFirstPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setCurrentIndex(0);
      setError('');
      setTimeout(() => currentRefs[0].current?.focus(), 300);
    } else {
      runRef.current = -1;
      onClose();
    }
  };

  const handleClear = () => {
    const newPin = ['', '', '', '', '', ''];
    if (step === 'current') setCurrentPinArr(newPin);
    else if (step === 'create') setFirstPin(newPin);
    else setConfirmPin(newPin);
    setCurrentIndex(0);
    activeRefs[0].current?.focus();
    Vibration.vibrate(50);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleBack}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <MIcon name={(step === 'create' && !hasPin) || step === 'checking' ? 'close' : 'chevron-left'} size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.title}>{step === 'current' ? tr('xtCambiarPINDePago') : title}</Text>
            <Text style={s.subtitle}>
              {step === 'current'
                ? tr('xtIntroduceTuPIN')
                : step === 'confirm'
                  ? tr('xtConfirmaTuPINIngresandoloNuevamente')
                  : tr('xtCreaUnPINDe6DigitosParaProtegerTusTransferencias')
              }
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={s.content}>
            <View style={s.stepIndicator}>
              {(hasPin ? ['current', 'create', 'confirm'] : ['create', 'confirm']).map((st, i, arr) => (
                <React.Fragment key={st}>
                  {i > 0 && <View style={[s.stepLine, arr.indexOf(step) >= i && s.stepLineActive]} />}
                  <View style={[s.stepDot, (arr.indexOf(step) >= i || step === 'checking') && s.stepDotActive]} />
                </React.Fragment>
              ))}
            </View>

            <Text style={s.stepLabel}>
              {step === 'current'
                ? tr('xtIntroduceTuPIN')
                : step === 'confirm'
                  ? tr('xtIntroduceElPINDeNuevoParaConfirmar')
                  : hasPin
                    ? tr('xtCambiarPINDePago')
                    : tr('xtConfigurarPINDePagos')}
            </Text>

            {/* PIN Input */}
            <View style={s.pinContainer}>
              {step === 'checking' ? (
                <View style={s.loadingContainer}>
                  <ActivityIndicator color="#6366F1" size="small" />
                </View>
              ) : (
              <View style={s.pinRow}>
                {currentPin.map((digit, index) => (
                  <View key={index} style={s.pinFieldWrapper}>
                    <TextInput
                      ref={activeRefs[index]}
                      style={[
                        s.pinField,
                        currentIndex === index && s.pinFieldActive,
                        error && s.pinFieldError,
                      ]}
                      value={digit}
                      onChangeText={(value) => handlePinChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setCurrentIndex(index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      secureTextEntry
                      selectTextOnFocus
                    />
                    {digit && !loading && (
                      <View style={s.pinDot}>
                        <Text style={s.pinDotText}>●</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              )}

              {/* Error Message */}
              {error && (
                <View style={s.errorContainer}>
                  <MIcon name="warning" size={16} color="#EF4444" />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Loading */}
              {loading && (
                <View style={s.loadingContainer}>
                  <ActivityIndicator color="#6366F1" size="small" />
                  <Text style={s.loadingText}>Configurando PIN...</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity onPress={handleClear} style={s.clearBtn}>
                <MIcon name="backspace" size={20} color="#64748B" />
                <Text style={s.clearText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#6366F1',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#6366F1',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
  },
  pinContainer: {
    marginBottom: 24,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pinFieldWrapper: {
    position: 'relative',
  },
  pinField: {
    width: 42,
    height: 56,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
  },
  pinFieldActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
  },
  pinFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  pinDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotText: {
    fontSize: 28,
    color: '#6366F1',
    fontWeight: '900',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default SetupPinModal;