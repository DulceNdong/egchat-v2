import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput, StyleSheet,
  Pressable, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Path } from 'react-native-svg';
import { walletAPI, authAPI } from '../../api';
import { walletPIN } from '../../services/walletPin';
import { checkLimitForTransaction, updateLimitForTransaction } from '../../services/limits';
import { EGAvatar } from '../ui';
import { toast } from '../Toast';
import { PinInputModal } from '../ui/PinInputModal';
import { SetupPinModal } from '../ui/SetupPinModal';

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
}

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
}: Props) {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<{
    amount: number;
    to: string;
    description: string;
  } | null>(null);
  
  // Estados para configuración de PIN
  const [showSetupPin, setShowSetupPin] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setError('');
    setLoadingBalance(true);
    walletAPI.getBalance()
      .then(r => setBalance(r.balance || 0))
      .catch(() => setBalance(0))
      .finally(() => setLoadingBalance(false));
  }, [visible]);

  const handleSend = async () => {
    const raw = amount.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    if (!raw || num <= 0) {
      setError('Introduce un monto válido');
      return;
    }
    if (num > balance) {
      setError('Saldo insuficiente');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 1. Verificar si el usuario tiene PIN configurado (local O servidor)
      let hasPin = false;
      try {
        // Comprobar local primero (más rápido)
        const localPin = await walletPIN.isSet();
        if (localPin) {
          hasPin = true;
        } else {
          // Si no hay PIN local, preguntar al servidor
          const pinStatus = await authAPI.hasPinConfigured();
          hasPin = pinStatus.hasPin;
        }
      } catch {
        hasPin = false;
      }

      if (!hasPin) {
        // Preparar la transferencia pendiente ANTES de mostrar el setup de PIN
        // para que al completar el setup, ya esté lista
        const to = recipientPhone || recipientId || contactName;
        setPendingTransfer({
          amount: num,
          to,
          description: `Chat: ${contactName}`,
        });
        setLoading(false);
        setShowSetupPin(true);
        return;
      }

      // 2. Validar límites
      const limitCheck = await checkLimitForTransaction('transfer', num);
      if (!limitCheck.allowed) {
        setError(limitCheck.reason || 'Límite diario de transferencias excedido');
        setLoading(false);
        return;
      }
      
      // 3. Preparar transferencia y mostrar modal de PIN
      const to = recipientPhone || recipientId || contactName;
      setPendingTransfer({
        amount: num,
        to,
        description: `Chat: ${contactName}`,
      });
      setLoading(false);
      setShowPinModal(true);
    } catch (e: any) {
      setError(e?.message || 'Error al validar la transferencia');
      setLoading(false);
    }
  };

  const handlePinConfirm = async (pin: string) => {
    if (!pendingTransfer) return;
    
    setPinLoading(true);
    setPinError('');
    
    try {
      // Verificar PIN: local primero, luego servidor como respaldo
      const localValid = await walletPIN.verify(pin);
      if (!localValid) {
        // Si no hay PIN local, verificar con el servidor
        await authAPI.verifyPin(pin);
      }
      
      // Realizar la transferencia
      await walletAPI.transfer(pendingTransfer.to, pendingTransfer.amount, pendingTransfer.description);
      await updateLimitForTransaction('transfer', pendingTransfer.amount);
      
      // Generar código de referencia
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const msgText = [
        '💸 Transferencia enviada',
        `💰 ${pendingTransfer.amount.toLocaleString()} XAF`,
        `👤 Para: ${contactName}`,
        '🏦 Desde: Monedero EGCHAT',
        `🔑 Ref: ${code}`,
        '✅ Completado',
      ].join('\n');
      
      onTransferred(msgText);
      // Transferencia completada - el mensaje ya se muestra en el chat
      onClose();
    } catch (e: any) {
      setPinError(e?.message || 'PIN incorrecto o transferencia fallida');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setPendingTransfer(null);
    setPinError('');
  };

  const handlePinSetupSuccess = () => {
    setShowSetupPin(false);
    // Después de configurar el PIN, mostrar directamente el modal de verificación
    // NO llamar handleSend() de nuevo para evitar loops
    if (pendingTransfer) {
      // Ya tenemos una transferencia pendiente, solo mostrar el modal de PIN
      setShowPinModal(true);
    }
    // Si no hay transferencia pendiente, el usuario puede pulsar Enviar de nuevo
  };

  const handlePinSetupClose = () => {
    setShowSetupPin(false);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={s.overlay} onPress={onClose}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
            <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
              <LinearGradient colors={['#1a73e8', '#0d47a1']} style={s.header}>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                    <Line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                    <Line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
                <View style={s.avatarsRow}>
                  <View style={s.avatarCol}>
                    <EGAvatar src={myAvatar} name={myName} size={52} />
                    <Text style={s.avatarLabel}>Yo</Text>
                  </View>
                  <View style={s.arrowCol}>
                    <Svg width={28} height={16} viewBox="0 0 28 16" fill="none">
                      <Path d="M0 8h24M18 2l6 6-6 6" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={s.arrowLabel}>Enviar</Text>
                  </View>
                  <View style={s.avatarCol}>
                    <EGAvatar src={contactAvatar} name={contactName} size={52} />
                    <Text style={s.avatarLabel} numberOfLines={1}>{contactName}</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={s.body}>
                <View style={s.balanceRow}>
                  <Text style={s.balanceLabel}>💳 Saldo disponible</Text>
                  {loadingBalance
                    ? <ActivityIndicator size="small" color="#16a34a" />
                    : <Text style={s.balanceValue}>{balance.toLocaleString()} XAF</Text>}
                </View>

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

                {!!error && <Text style={s.errorText}>{error}</Text>}

                <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={loading}>
                  <LinearGradient colors={['#1a73e8', '#0d47a1']} style={s.sendGrad}>
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.sendText}>Enviar a {contactName}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Modal de PIN */}
      <PinInputModal
        visible={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinConfirm}
        title="🔒 Confirmar transferencia"
        subtitle={pendingTransfer ? `Ingresa tu PIN de 6 dígitos para enviar ${pendingTransfer.amount.toLocaleString()} XAF a ${contactName}` : ''}
        loading={pinLoading}
        error={pinError}
      />

      {/* Modal de configuración de PIN */}
      <SetupPinModal
        visible={showSetupPin}
        onClose={handlePinSetupClose}
        onSuccess={handlePinSetupSuccess}
        title="🔒 Configurar PIN de Pagos"
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatarCol: { alignItems: 'center', gap: 4, maxWidth: 80 },
  avatarLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  arrowCol: { alignItems: 'center', gap: 2 },
  arrowLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 12, color: '#374151', fontWeight: '500' },
  balanceValue: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  amountLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    marginHorizontal: 20,
    paddingBottom: 4,
    marginBottom: 16,
    gap: 4,
  },
  amountPrefix: { fontSize: 18, fontWeight: '600', color: '#9ca3af' },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 8,
  },
  sendBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  sendGrad: { paddingVertical: 15, alignItems: 'center' },
  sendText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 6 },
  cancelText: { fontSize: 14, color: '#9ca3af' },
});
