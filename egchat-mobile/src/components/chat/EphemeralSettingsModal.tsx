// ══════════════════════════════════════════════════════════════════
// EphemeralSettingsModal — Configurar mensajes temporales por chat
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { EPHEMERAL_DURATIONS, EphemeralDuration } from '../../services/ephemeralMessages';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Props {
  visible: boolean;
  current: EphemeralDuration;
  onSelect: (d: EphemeralDuration) => void;
  onClose: () => void;
}

export function EphemeralSettingsModal({ visible, current, onSelect, onClose }: Props) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.panel, { backgroundColor: C.bgPrimary }]}>
          {/* Icono reloj */}
          <View style={s.iconWrap}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={1.8} strokeLinecap="round">
              <Circle cx="12" cy="12" r="10"/>
              <Polyline points="12 6 12 12 16 14"/>
            </Svg>
          </View>
          <Text style={[s.title, { color: C.textPrimary }]}>Mensajes temporales</Text>
          <Text style={[s.subtitle, { color: C.textTertiary }]}>
            Los mensajes se eliminarán automáticamente después del tiempo elegido
          </Text>
          {EPHEMERAL_DURATIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.row, { borderBottomColor: C.borderLight }]}
              onPress={() => { onSelect(opt.value); onClose(); }}
            >
              <Text style={[s.rowText, { color: C.textPrimary }, opt.value === 0 && { color: '#ef4444' }]}>
                {opt.label}
              </Text>
              {current === opt.value && (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M20 6L9 17l-5-5"/>
                </Svg>
              )}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Componente limpio — sin imports duplicados

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  panel: {
    width: '100%', maxWidth: 340, borderRadius: 20,
    paddingHorizontal: 0, paddingBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
    overflow: 'hidden',
  },
  iconWrap: { alignItems: 'center', paddingTop: 24, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20, marginBottom: 16, lineHeight: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { fontSize: 15, fontWeight: '500' },
});
