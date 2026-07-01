// Alerta de Límites de Transacciones
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../theme';
import { useThemeContext } from '../theme/ThemeContext';
import { DarkColors } from '../theme/darkMode';

interface LimitAlertProps {
  visible: boolean;
  type: 'warning' | 'blocked';
  transactionType: string;
  amount: number;
  limit: number;
  remaining: number;
  reason?: string;
  onProceed?: () => void;
  onCancel: () => void;
}

export function LimitAlert({
  visible,
  type,
  transactionType,
  amount,
  limit,
  remaining,
  reason,
  onProceed,
  onCancel,
}: LimitAlertProps) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const isBlocked = type === 'blocked';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
        <View style={[styles.alertBox, { backgroundColor: C.bgSecondary }]}>
          <Text style={[styles.alertIcon, { fontSize: 40 }]}>
            {isBlocked ? '⚠️' : '⚡'}
          </Text>

          <Text style={[styles.alertTitle, { color: C.textPrimary }]}>
            {isBlocked ? 'Transacción Bloqueada' : 'Alerta de Límite'}
          </Text>

          <View style={[styles.alertContent, { borderColor: C.border }]}>
            <Text style={[styles.alertText, { color: C.textSecondary }]}>
              {reason || `Tu límite diario de ${transactionType} es de ${(limit / 1000).toFixed(0)}K XAF`}
            </Text>

            {!isBlocked && (
              <View style={styles.limits}>
                <View style={styles.limitItem}>
                  <Text style={[styles.limitLabel, { color: C.textTertiary }]}>Intentas enviar:</Text>
                  <Text style={[styles.limitValue, { color: C.textPrimary }]}>
                    {(amount / 1000).toFixed(0)}K XAF
                  </Text>
                </View>
                <View style={styles.limitItem}>
                  <Text style={[styles.limitLabel, { color: C.textTertiary }]}>Te quedan:</Text>
                  <Text style={[styles.limitValue, { color: remaining >= 0 ? C.success : C.error }]}>
                    {(remaining / 1000).toFixed(0)}K XAF
                  </Text>
                </View>
              </View>
            )}

            {isBlocked && (
              <View style={[styles.blockedInfo, { backgroundColor: C.errorBg }]}>
                <Text style={[styles.blockedText, { color: C.errorText }]}>
                  ❌ Quedan disponibles: {(remaining / 1000).toFixed(0)}K XAF
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.bgTertiary }]}
              onPress={onCancel}
            >
              <Text style={[styles.btnText, { color: C.textPrimary }]}>
                {isBlocked ? 'Entendido' : 'Cancelar'}
              </Text>
            </TouchableOpacity>

            {!isBlocked && onProceed && (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: C.brand }]}
                onPress={onProceed}
              >
                <Text style={[styles.btnText, { color: 'white' }]}>Continuar</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.hint, { color: C.textTertiary }]}>
            {isBlocked
              ? 'Para transacciones mayores, vuelve mañana.'
              : 'Los límites se resetean cada 24 horas.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: Dimensions.get('window').width - 40,
    alignItems: 'center',
  },
  alertIcon: {
    marginBottom: Spacing.md,
  },
  alertTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  alertContent: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  alertText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  limits: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  limitLabel: {
    fontSize: FontSize.xs,
  },
  limitValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  blockedInfo: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  blockedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  btnText: {
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  hint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
