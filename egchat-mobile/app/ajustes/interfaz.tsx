import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme';
import { DarkColors } from '../../src/theme/darkMode';

const FONT_SIZE_KEY = 'egchat_fontsize';
const FONT_FAMILY_KEY = 'egchat_fontfamily';
const CHAT_BG_COLORS = ['#e5ddd5', '#d6eaf8', '#d5f5e3', '#f9ebea', '#f4ecf7', '#ffffff', '#111827'];
const FONT_FAMILIES = [
  { id: 'default', name: 'Sistema' },
  { id: 'rounded', name: 'Redondeada' },
  { id: 'modern', name: 'Moderna' },
  { id: 'classic', name: 'Clásica' },
  { id: 'mono', name: 'Mono' },
];
const FONT_PRESETS = [
  { label: 'Pequeña', v: 0.85 },
  { label: 'Normal', v: 1 },
  { label: 'Grande', v: 1.15 },
  { label: 'Muy grande', v: 1.35 },
];

export default function InterfazScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const [appFontSize, setAppFontSize] = useState(1);
  const [appFontFamily, setAppFontFamily] = useState('default');
  const [chatBg, setChatBg] = useState('#e5ddd5');

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then(v => { if (v) setAppFontSize(parseFloat(v) || 1); });
    AsyncStorage.getItem(FONT_FAMILY_KEY).then(v => { if (v) setAppFontFamily(v); });
    getCfgString(CFG.chatBg, '#e5ddd5').then(setChatBg);
  }, []);

  return (
    <SettingsLayout title="Interfaz y pantalla">
      <SettingsSection label="Tamaño de letra" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={[styles.preview, { borderColor: C.borderLight }]}>
          <Text style={{ fontSize: 14 * appFontSize, color: C.textSecondary }}>
            Vista previa del texto en EGCHAT
          </Text>
        </View>
        <View style={styles.presetRow}>
          {FONT_PRESETS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              style={[styles.presetChip, Math.abs(appFontSize - opt.v) < 0.03 && styles.presetActive]}
              onPress={() => {
                setAppFontSize(opt.v);
                AsyncStorage.setItem(FONT_SIZE_KEY, String(opt.v));
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: Math.abs(appFontSize - opt.v) < 0.03 ? Colors.accent : C.textSecondary }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SettingsSection label="Estilo de letra" />
      <SettingsCard>
        {FONT_FAMILIES.map((f, i) => (
          <React.Fragment key={f.id}>
            <TouchableOpacity
              style={styles.fontRow}
              onPress={() => {
                setAppFontFamily(f.id);
                AsyncStorage.setItem(FONT_FAMILY_KEY, f.id);
              }}
            >
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: appFontFamily === f.id ? Colors.accent : C.textTertiary }}>{f.name}</Text>
                <Text style={{ fontSize: 14, color: C.textPrimary, marginTop: 2 }}>Hola, ¿cómo estás?</Text>
              </View>
              {appFontFamily === f.id && <Text style={{ color: Colors.accent }}>✓</Text>}
            </TouchableOpacity>
            {i < FONT_FAMILIES.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

      <SettingsSection label="Fondo del chat" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={styles.colorRow}>
          {CHAT_BG_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, chatBg === c && styles.colorActive]}
              onPress={() => { setChatBg(c); setCfg(CFG.chatBg, c); }}
            />
          ))}
        </View>
      </View>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16 },
  preview: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  presetActive: { borderColor: Colors.accent, backgroundColor: 'rgba(7,193,96,0.12)' },
  fontRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 44, height: 44, borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  colorActive: { borderWidth: 3, borderColor: Colors.accent },
});
