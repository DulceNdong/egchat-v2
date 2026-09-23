/**
 * IncomingTransferModal — aparece cuando el receptor recibe un SSE `transfer_pending`.
 * Muestra quién envía, cuánto, y dos botones: Recibir ✅ o Cancelar ❌.
 * Expira automáticamente a las 24h (el servidor también lo controla).
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { walletAPI } from '../../api';

export interface IncomingTransfer {
  transferId: string;
  amount: number;
  senderName: string;
  concept?: string | null;
  expiresAt?: string;
}

interface Props {
  transfer: IncomingTransfer | null;
  onAccepted: (newBalance: number) => void;
  onCancelled: () => void;
  onDismiss: () => void;
}

export function IncomingTransferModal({ transfer, onAccepted, onCancelled, onDismiss }: Props) {
  const [loading, setLoading] = useState<'accept' | 'cancel' | null>(null);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Countdown hasta expiración
  useEffect(() => {
    if (!transfer?.expiresAt) return;
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(transfer.expiresAt!).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [transfer?.expiresAt]);

  if (!transfer) return null;

  const formatCountdown = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const handleAccept = async () => {
    setLoading('accept');
    setError('');
    try {
      const res = await walletAPI.acceptTransfer(transfer.transferId);
      onAccepted(res.balance);
    } catch (e: any) {
      setError(e?.message || 'Error al aceptar. Inténtalo de nuevo.');
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setLoading('cancel');
    setError('');
    try {
      await walletAPI.cancelTransfer(transfer.transferId);
      onCancelled();
    } catch (e: any) {
      setError(e?.message || 'Error al cancelar. Inténtalo de nuevo.');
      setLoading(null);
    }
  };

  const isExpired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={st.overlay} onPress={() => { /* no cerrar al tocar fuera */ }}>
        <View style={st.card}>
          {/* Encabezado */}
          <LinearGradient colors={['#16a34a', '#15803d']} style={st.header}>
            <Text style={st.headerEmoji}>💸</Text>
            <Text style={st.headerTitle}>Transferencia entrante</Text>
            <Text style={st.headerSub}>De: {transfer.senderName}</Text>
          </LinearGradient>

          {/* Monto */}
          <View style={st.amountBox}>
            <Text style={st.amountLabel}>MONTO</Text>
            <Text style={st.amountValue}>{transfer.amount.toLocaleString()} XAF</Text>
            {!!transfer.concept && (
              <Text style={st.conceptText}>"{transfer.concept}"</Text>
            )}
          </View>

          {/* Expiración */}
          {secondsLeft !== null && (
            <View style={[st.expiryRow, isExpired && st.expiryExpired]}>
              <Text style={[st.expiryText, isExpired && st.expiryTextExpired]}>
                {isExpired
                  ? '⛔ Esta transferencia ha expirado'
                  : `⏳ Expira en ${formatCountdown(secondsLeft)}`}
              </Text>
            </View>
          )}

          {!!error && (
            <View style={st.errorBox}>
              <Text style={st.errorText}>{error}</Text>
            </View>
          )}

          {/* Botones */}
          {isExpired ? (
            <TouchableOpacity style={st.dismissBtn} onPress={onDismiss}>
              <Text style={st.dismissText}>Cerrar</Text>
            </TouchableOpacity>
          ) : (
            <View style={st.actions}>
              {/* Cancelar */}
              <TouchableOpacity
                style={[st.actionBtn, st.cancelBtn, loading !== null && st.actionDisabled]}
                onPress={handleCancel}
                disabled={loading !== null}
                accessibilityLabel="Cancelar transferencia"
                accessibilityRole="button"
              >
                {loading === 'cancel'
                  ? <ActivityIndicator color="#dc2626" size="small" />
                  : (
                    <>
                      <Text style={st.cancelBtnIcon}>❌</Text>
                      <Text style={st.cancelBtnText}>Cancelar</Text>
                    </>
                  )}
              </TouchableOpacity>

              {/* Recibir */}
              <TouchableOpacity
                style={[st.actionBtn, st.acceptBtn, loading !== null && st.actionDisabled]}
                onPress={handleAccept}
                disabled={loading !== null}
                accessibilityLabel="Aceptar y recibir dinero"
                accessibilityRole="button"
              >
                {loading === 'accept'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <>
                      <Text style={st.acceptBtnIcon}>✅</Text>
                      <Text style={st.acceptBtnText}>Recibir</Text>
                    </>
                  )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={st.footerNote}>
            Si cancelas, el dinero se devuelve al remitente.
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerEmoji:  { fontSize: 40, marginBottom: 6 },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
  amountBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  amountLabel:  { fontSize: 11, color: '#9ca3af', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  amountValue:  { fontSize: 42, fontWeight: '900', color: '#111827' },
  conceptText:  { fontSize: 13, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },
  expiryRow: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  expiryExpired: { backgroundColor: '#fee2e2' },
  expiryText:    { fontSize: 12, color: '#92400e', fontWeight: '600' },
  expiryTextExpired: { color: '#dc2626' },
  errorBox: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
  },
  errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionDisabled: { opacity: 0.55 },
  cancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  cancelBtnIcon: { fontSize: 16 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  acceptBtn:     { backgroundColor: '#16a34a' },
  acceptBtnIcon: { fontSize: 16 },
  acceptBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  dismissBtn: {
    margin: 20,
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  footerNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
});
