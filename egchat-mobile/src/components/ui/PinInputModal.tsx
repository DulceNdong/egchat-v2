import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Pressable, ActivityIndicator, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MIcon } from './MIcon';

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
}

export const PinInputModal: React.FC<PinInputModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = '🔒 Código de seguridad',
  subtitle = 'Introduce tu PIN de 6 dígitos para confirmar la operación',
  loading = false,
  error,
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (visible) {
      setPin(['', '', '', '', '', '']);
      setCurrentIndex(0);
      // Focus en el primer campo después de un pequeño delay
      setTimeout(() => inputRefs[0].current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    // Auto-submit cuando se complete el PIN
    const pinString = pin.join('');
    if (pinString.length === 6 && !loading) {
      onSuccess(pinString);
    }
  }, [pin, loading, onSuccess]);

  const handlePinChange = (value: string, index: number) => {
    // Solo permitir dígitos
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Mover al siguiente campo si se ingresó un dígito
    if (digit && index < 5) {
      setCurrentIndex(index + 1);
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Manejar backspace
    if (e.nativeEvent.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        // Si el campo actual está vacío, ir al anterior
        setCurrentIndex(index - 1);
        inputRefs[index - 1].current?.focus();
      } else {
        // Limpiar campo actual
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handleClear = () => {
    setPin(['', '', '', '', '', '']);
    setCurrentIndex(0);
    inputRefs[0].current?.focus();
    Vibration.vibrate(50);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <MIcon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>

          {/* PIN Input */}
          <View style={s.pinContainer}>
            <View style={s.pinRow}>
              {pin.map((digit, index) => (
                <View key={index} style={s.pinFieldWrapper}>
                  <TextInput
                    ref={inputRefs[index]}
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
                <Text style={s.loadingText}>Verificando...</Text>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 380,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  pinContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    paddingHorizontal: 24,
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

export default PinInputModal;