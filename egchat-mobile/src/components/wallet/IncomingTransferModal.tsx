/**
 * IncomingTransferModal — aparece cuando el receptor recibe un SSE `transfer_pending`.
 * Diseño profesional fintech con escudo BEAC como símbolo de la moneda XAF.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G, Rect, Line, Polyline } from 'react-native-svg';
import { walletAPI } from '../../api';
import { BeacShield } from '../ui/BeacShield';

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

// ── Iconos SVG profesionales ────────────────────────────────────────────────

function IconArrowDown() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconUser() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.75)" strokeWidth={2} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.75)" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function IconClock() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#92400e" strokeWidth={2} />
      <Path d="M12 7v5l3 3" stroke="#92400e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCheck() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Polyline points="20,6 9,17 4,12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconX() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconInfo() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#6b7280" strokeWidth={2} />
      <Line x1="12" y1="11" x2="12" y2="17" stroke="#6b7280" strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1.2" fill="#6b7280" />
    </Svg>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export function IncomingTransferModal({ transfer, onAccepted, onCancelled, onDismiss }: Props) {
  const [loading, setLoading]       = useState<'accept' | 'cancel' | null>(null);
  const [error, setError]           = useState('');
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

  // Formatear monto con separadores de miles
  const formattedAmount = transfer.amount.toLocaleString('fr-FR');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={st.overlay}>
        <View style={st.card}>

          {/* ── Cabecera ─────────────────────────────── */}
          <LinearGradient
            colors={['#1B5E20', '#2E7D32', '#388E3C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.header}
          >
            {/* Badge de tipo */}
            <View style={st.badge}>
              <IconArrowDown />
              <Text style={st.badgeText}>Transferencia entrante</Text>
            </View>

            {/* Remitente */}
            <View style={st.senderRow}>
              <IconUser />
              <Text style={st.senderText} numberOfLines={1}>
                {transfer.senderName}
              </Text>
            </View>

            {/* Divider decorativo */}
            <View style={st.headerDivider} />
          </LinearGradient>

          {/* ── Cuerpo ───────────────────────────────── */}
          <View style={st.body}>

            {/* Monto con escudo BEAC */}
            <View style={st.amountSection}>
              <View style={st.shieldWrapper}>
                <BeacShield size={40} />
              </View>
              <View style={st.amountTexts}>
                <Text style={st.amountLabel}>MONTO A RECIBIR</Text>
                <View style={st.amountRow}>
                  <Text style={st.amountValue}>{formattedAmount}</Text>
                  <Text style={st.amountCurrency}> XAF</Text>
                </View>
              </View>
            </View>

            {/* Concepto */}
            {!!transfer.concept && (
              <View style={st.conceptRow}>
                <Text style={st.conceptText} numberOfLines={2}>
                  {transfer.concept}
                </Text>
              </View>
            )}

            {/* Expiración */}
            {secondsLeft !== null && (
              <View style={[st.expiryRow, isExpired && st.expiryExpiredRow]}>
                <IconClock />
                <Text style={[st.expiryText, isExpired && st.expiryTextExpired]}>
                  {isExpired
                    ? 'Esta transferencia ha expirado'
                    : `Expira en ${formatCountdown(secondsLeft)}`}
                </Text>
              </View>
            )}

            {/* Error */}
            {!!error && (
              <View style={st.errorBox}>
                <Text style={st.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Botones ── */}
            {isExpired ? (
              <TouchableOpacity style={st.dismissBtn} onPress={onDismiss}>
                <Text style={st.dismissText}>Cerrar</Text>
              </TouchableOpacity>
            ) : (
              <View style={st.actions}>
                {/* Cancelar */}
                <TouchableOpacity
                  style={[st.cancelBtn, loading !== null && st.btnDisabled]}
                  onPress={handleCancel}
                  disabled={loading !== null}
                  accessibilityLabel="Cancelar transferencia"
                  accessibilityRole="button"
                >
                  {loading === 'cancel' ? (
                    <ActivityIndicator color="#dc2626" size="small" />
                  ) : (
                    <View style={st.btnInner}>
                      <IconX />
                      <Text style={st.cancelBtnText}>Cancelar</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Recibir */}
                <TouchableOpacity
                  style={[st.btnDisabledWrapper, loading !== null && st.btnDisabled]}
                  onPress={handleAccept}
                  disabled={loading !== null}
                  accessibilityLabel="Aceptar y recibir dinero"
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={['#2E7D32', '#388E3C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={st.acceptBtn}
                  >
                    {loading === 'accept' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={st.btnInner}>
                        <IconCheck />
                        <Text style={st.acceptBtnText}>Recibir</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Nota de pie */}
            <View style={st.footerRow}>
              <IconInfo />
              <Text style={st.footerNote}>
                Si cancelas, el dinero se devuelve al remitente.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },

  // Header
  header: {
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  senderText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    flexShrink: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 6,
  },

  // Body
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },

  // Monto
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fdf8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  shieldWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9952A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  amountTexts: {
    flex: 1,
    gap: 2,
  },
  amountLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  amountCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4b5563',
  },

  // Concepto
  conceptRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
  },
  conceptText: {
    fontSize: 13,
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Expiración
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  expiryExpiredRow: {
    backgroundColor: '#fef2f2',
  },
  expiryText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  expiryTextExpired: {
    color: '#dc2626',
  },

  // Error
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fca5a5',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },

  // Botones
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnDisabledWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
  acceptBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Expirado
  dismissBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  dismissText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  footerNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    flexShrink: 1,
  },
});
