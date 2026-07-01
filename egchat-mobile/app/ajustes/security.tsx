// ════════════════════════════════════════════════════════════════
// Pantalla de Seguridad — Gestión de Límites Diarios de Transacciones
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { getLimitSettings, saveLimitSettings, resetAllLimits, LimitSettings } from '../../src/services/limits';

const { width } = Dimensions.get('window');

export default function SecurityScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const [settings, setSettings] = useState<LimitSettings | null>(null);
  const [editingType, setEditingType] = useState<'withdrawal' | 'transfer' | 'payment' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getLimitSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading limits:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (type: 'withdrawal' | 'transfer' | 'payment') => {
    if (!settings) return;
    setEditingType(type);
    setTempValue(settings.limits[type].dailyLimit.toString());
  };

  const saveEdit = async () => {
    if (!settings || !editingType) return;
    const newLimit = parseInt(tempValue, 10);

    if (isNaN(newLimit) || newLimit <= 0) {
      Alert.alert('Error', 'Ingresa un valor válido');
      return;
    }

    const updated = { ...settings };
    updated.limits[editingType].dailyLimit = newLimit;
    await saveLimitSettings(updated);
    setSettings(updated);
    setEditingType(null);
    Alert.alert('Éxito', 'Límite actualizado');
  };

  const cancelEdit = () => {
    setEditingType(null);
    setTempValue('');
  };

  const handleResetLimits = () => {
    Alert.alert(
      'Confirmar',
      '¿Resetear todos los límites? Esto restablecerá los contadores diarios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            await resetAllLimits();
            await loadSettings();
            Alert.alert('Éxito', 'Límites reseteados');
          },
        },
      ],
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]}>
        <Text style={[styles.loadingText, { color: C.textSecondary }]}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  const LimitCard = ({ type, title, icon }: { type: 'withdrawal' | 'transfer' | 'payment'; title: string; icon: string }) => {
    const limit = settings.limits[type];
    const percentUsed = (limit.currentDay / limit.dailyLimit) * 100;
    const isEditing = editingType === type;

    return (
      <View
        key={type}
        style={[
          styles.card,
          {
            backgroundColor: C.bgSecondary,
            borderColor: C.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>{title}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editorContainer}>
            <TextInput
              style={[
                styles.limitInput,
                {
                  color: C.textPrimary,
                  borderColor: C.accent,
                  backgroundColor: C.bgTertiary,
                },
              ]}
              placeholder="Límite diario"
              placeholderTextColor={C.textTertiary}
              keyboardType="number-pad"
              value={tempValue}
              onChangeText={setTempValue}
            />
            <View style={styles.editorBtns}>
              <TouchableOpacity
                style={[styles.editorBtn, { backgroundColor: C.error }]}
                onPress={cancelEdit}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editorBtn, { backgroundColor: C.success }]}
                onPress={saveEdit}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.limitRow}>
              <Text style={[styles.limitLabel, { color: C.textSecondary }]}>Límite diario:</Text>
              <Text style={[styles.limitValue, { color: C.textPrimary }]}>
                {(limit.dailyLimit / 1000).toFixed(0)}K XAF
              </Text>
            </View>

            <View style={styles.limitRow}>
              <Text style={[styles.limitLabel, { color: C.textSecondary }]}>Usado hoy:</Text>
              <Text style={[styles.usedValue, { color: percentUsed > 80 ? C.error : C.success }]}>
                {(limit.currentDay / 1000).toFixed(0)}K XAF
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: C.bgTertiary,
                    overflow: 'hidden',
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percentUsed, 100)}%`,
                      backgroundColor: percentUsed > 80 ? C.error : C.success,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: C.textSecondary }]}>
                {percentUsed.toFixed(1)}% usado
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.editBtn,
                { backgroundColor: C.brand, borderColor: C.brand },
              ]}
              onPress={() => startEdit(type)}
            >
              <Text style={styles.editBtnText}>Editar Límite</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.headerBack, { color: C.textLink }]}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Seguridad</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
          <Text style={[styles.infoLabel, { color: C.textPrimary }]}>🔒 Límites Diarios</Text>
          <Text style={[styles.infoText, { color: C.textSecondary }]}>
            Protege tu cuenta limitando las transacciones diarias. Los contadores se resetean cada 24h.
          </Text>
        </View>

        {/* Límites */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Mis Límites</Text>

          <LimitCard type="withdrawal" title="Retiros" icon="💸" />
          <LimitCard type="transfer" title="Transferencias" icon="🔄" />
          <LimitCard type="payment" title="Pagos" icon="💳" />
        </View>

        {/* Configuración */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Configuración</Text>

          <View style={[styles.settingRow, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
            <View>
              <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Requerir PIN</Text>
              <Text style={[styles.settingHint, { color: C.textTertiary }]}>
                Para transacciones &gt;50% del límite
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: settings.requirePINAboveLimit ? C.success : C.border,
                },
              ]}
              onPress={() => {
                const updated = { ...settings };
                updated.requirePINAboveLimit = !updated.requirePINAboveLimit;
                saveLimitSettings(updated);
                setSettings(updated);
              }}
            >
              <View
                style={[
                  styles.toggleDot,
                  {
                    backgroundColor: 'white',
                    alignSelf: settings.requirePINAboveLimit ? 'flex-end' : 'flex-start',
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
            <View>
              <Text style={[styles.settingLabel, { color: C.textPrimary }]}>Notificar en</Text>
              <Text style={[styles.settingHint, { color: C.textTertiary }]}>
                {settings.alertThreshold}% del límite
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: C.textSecondary }]}>{settings.alertThreshold}%</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: C.errorBg, borderColor: C.error }]}
            onPress={handleResetLimits}
          >
            <Text style={[styles.resetBtnText, { color: C.error }]}>🔄 Resetear Contadores</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerBack: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  infoBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  limitLabel: {
    fontSize: FontSize.sm,
  },
  limitValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  usedValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  progressContainer: {
    marginVertical: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  editBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  editBtnText: {
    color: 'white',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  editorContainer: {
    marginTop: Spacing.sm,
  },
  limitInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: FontSize.md,
  },
  editorBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editorBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  settingHint: {
    fontSize: FontSize.xs,
  },
  settingValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  resetBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetBtnText: {
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  loadingText: {
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 50,
  },
});
