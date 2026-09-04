import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme';
import { DarkColors } from '../../src/theme/darkMode';

const FONT_SIZE_KEY = 'egchat_fontsize';
const FONT_FAMILY_KEY = 'egchat_fontfamily';

const CHAT_BG_COLORS = [
  { color: '#e5ddd5', label: 'Clásico' },
  { color: '#d6eaf8', label: 'Azul' },
  { color: '#d5f5e3', label: 'Verde' },
  { color: '#f9ebea', label: 'Rosa' },
  { color: '#f4ecf7', label: 'Violeta' },
  { color: '#fef9c3', label: 'Amarillo' },
  { color: '#ffffff', label: 'Blanco' },
  { color: '#111827', label: 'Oscuro' },
];

const ACCENT_COLORS = [
  { color: '#07c160', label: 'Verde EGCHAT' },
  { color: '#00b4e6', label: 'Azul EGCHAT' },
  { color: '#6b5bd6', label: 'Violeta' },
  { color: '#f59e0b', label: 'Dorado' },
  { color: '#ef4444', label: 'Rojo' },
  { color: '#ec4899', label: 'Rosa' },
  { color: '#0ea5e9', label: 'Celeste' },
  { color: '#10b981', label: 'Esmeralda' },
];

const FONT_FAMILIES = [
  { id: 'default', name: 'Sistema', preview: 'Hola, ¿cómo estás?' },
  { id: 'rounded', name: 'Redondeada', preview: 'Hola, ¿cómo estás?' },
  { id: 'modern', name: 'Moderna', preview: 'Hola, ¿cómo estás?' },
  { id: 'classic', name: 'Clásica', preview: 'Hola, ¿cómo estás?' },
];

const FONT_PRESETS = [
  { label: 'Pequeña', v: 0.85 },
  { label: 'Normal', v: 1 },
  { label: 'Grande', v: 1.15 },
  { label: 'Muy grande', v: 1.35 },
];

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Claro',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
        <Circle cx="12" cy="12" r="5"/>
        <Line x1="12" y1="1" x2="12" y2="3"/>
        <Line x1="12" y1="21" x2="12" y2="23"/>
        <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <Line x1="1" y1="12" x2="3" y2="12"/>
        <Line x1="21" y1="12" x2="23" y2="12"/>
        <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </Svg>
    ),
    bg: '#fff',
    text: '#111',
    border: '#e5e7eb',
  },
  {
    id: 'dark',
    label: 'Oscuro',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6b5bd6" strokeWidth={2} strokeLinecap="round">
        <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </Svg>
    ),
    bg: '#0d1117',
    text: '#f0f6fc',
    border: '#30363d',
  },
  {
    id: 'auto',
    label: 'Auto',
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={2} strokeLinecap="round">
        <Path d="M12 2v20M2 12h20"/>
        <Path d="M12 2a10 10 0 0 1 0 20"/>
      </Svg>
    ),
    bg: 'linear',
    text: '#374151',
    border: '#e5e7eb',
  },
];

export default function InterfazScreen() {
  const { isDark, setTheme } = useThemeContext() as any;
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const [appFontSize, setAppFontSize] = useState(1);
  const [appFontFamily, setAppFontFamily] = useState('default');
  const [chatBg, setChatBg] = useState('#e5ddd5');
  const [accentColor, setAccentColor] = useState('#07c160');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('light');

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then(v => { if (v) setAppFontSize(parseFloat(v) || 1); });
    AsyncStorage.getItem(FONT_FAMILY_KEY).then(v => { if (v) setAppFontFamily(v); });
    getCfgString(CFG.chatBg, '#e5ddd5').then(setChatBg);
    AsyncStorage.getItem('egchat_theme').then(v => {
      if (v === 'dark' || v === 'light' || v === 'auto') setCurrentTheme(v);
      else setCurrentTheme(isDark ? 'dark' : 'light');
    });
    AsyncStorage.getItem('egchat_accent').then(v => { if (v) setAccentColor(v); });
  }, []);

  const applyTheme = async (themeId: 'light' | 'dark' | 'auto') => {
    setCurrentTheme(themeId);
    await AsyncStorage.setItem('egchat_theme', themeId);
    if (typeof setTheme === 'function') {
      if (themeId === 'dark') setTheme('dark');
      else if (themeId === 'light') setTheme('light');
      else setTheme('auto');
    }
  };

  const applyAccent = async (color: string) => {
    setAccentColor(color);
    await AsyncStorage.setItem('egchat_accent', color);
    Alert.alert('Color aplicado', 'El color de acento se verá en tu próxima sesión.');
  };

  return (
    <SettingsLayout title="Interfaz y pantalla">

      {/* ── Tema ── */}
      <SettingsSection label="Tema de la app" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map(th => {
            const active = currentTheme === th.id;
            return (
              <TouchableOpacity
                key={th.id}
                style={[styles.themeCard, active && styles.themeCardActive, { borderColor: active ? '#00c8a0' : (isDark ? '#30363d' : '#e5e7eb') }]}
                onPress={() => applyTheme(th.id as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.themePreview, { backgroundColor: th.id === 'auto' ? (isDark ? '#1a1a2e' : '#f8fafc') : th.bg, borderColor: th.border }]}>
                  {th.icon}
                </View>
                <Text style={[styles.themeLabel, { color: active ? '#00c8a0' : C.textSecondary }]}>{th.label}</Text>
                {active && <View style={styles.themeCheck}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Color de acento ── */}
      <SettingsSection label="Color de acento" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={styles.accentRow}>
          {ACCENT_COLORS.map(ac => (
            <TouchableOpacity
              key={ac.color}
              style={styles.accentItem}
              onPress={() => applyAccent(ac.color)}
              activeOpacity={0.8}
            >
              <View style={[styles.accentCircle, { backgroundColor: ac.color }, accentColor === ac.color && styles.accentActive]}>
                {accentColor === ac.color && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
              </View>
              <Text style={[styles.accentLabel, { color: C.textTertiary }]} numberOfLines={1}>{ac.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tamaño de letra ── */}
      <SettingsSection label="Tamaño de letra" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={[styles.preview, { borderColor: C.borderLight, backgroundColor: isDark ? '#0d1117' : '#f9fafb' }]}>
          <Text style={{ fontSize: 14 * appFontSize, color: C.textSecondary }}>
            Vista previa: EGCHAT Guinea Ecuatorial 🇬🇶
          </Text>
        </View>
        <View style={styles.presetRow}>
          {FONT_PRESETS.map(opt => (
            <TouchableOpacity
              key={opt.v}
              style={[styles.presetChip, { borderColor: isDark ? '#30363d' : '#e5e7eb', backgroundColor: isDark ? '#0d1117' : '#f9fafb' },
                Math.abs(appFontSize - opt.v) < 0.03 && styles.presetActive]}
              onPress={() => { setAppFontSize(opt.v); AsyncStorage.setItem(FONT_SIZE_KEY, String(opt.v)); }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: Math.abs(appFontSize - opt.v) < 0.03 ? '#00c8a0' : C.textSecondary }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Estilo de letra ── */}
      <SettingsSection label="Estilo de letra" />
      <SettingsCard>
        {FONT_FAMILIES.map((f, i) => (
          <React.Fragment key={f.id}>
            <TouchableOpacity
              style={styles.fontRow}
              onPress={() => { setAppFontFamily(f.id); AsyncStorage.setItem(FONT_FAMILY_KEY, f.id); }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: appFontFamily === f.id ? '#00c8a0' : C.textTertiary, marginBottom: 2 }}>{f.name}</Text>
                <Text style={{ fontSize: 15, color: C.textPrimary }}>{f.preview}</Text>
              </View>
              {appFontFamily === f.id && <Text style={{ color: '#00c8a0', fontSize: 16 }}>✓</Text>}
            </TouchableOpacity>
            {i < FONT_FAMILIES.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>

      {/* ── Fondo del chat ── */}
      <SettingsSection label="Fondo del chat" />
      <View style={[styles.panel, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
        <View style={styles.colorRow}>
          {CHAT_BG_COLORS.map(bg => (
            <TouchableOpacity
              key={bg.color}
              style={styles.swatchItem}
              onPress={() => { setChatBg(bg.color); setCfg(CFG.chatBg, bg.color); }}
              activeOpacity={0.8}
            >
              <View style={[styles.colorSwatch, { backgroundColor: bg.color, borderWidth: chatBg === bg.color ? 3 : 1.5,
                borderColor: chatBg === bg.color ? '#00c8a0' : (isDark ? '#30363d' : '#e5e7eb') }]}>
                {chatBg === bg.color && <Text style={{ color: bg.color === '#ffffff' || bg.color === '#e5ddd5' ? '#00c8a0' : '#fff', fontSize: 14 }}>✓</Text>}
              </View>
              <Text style={[styles.swatchLabel, { color: C.textTertiary }]}>{bg.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16 },
  // Tema
  themeRow: { flexDirection: 'row', gap: 12 },
  themeCard: {
    flex: 1, alignItems: 'center', gap: 8,
    borderRadius: 14, padding: 12, borderWidth: 2,
    position: 'relative',
  },
  themeCardActive: {},
  themePreview: {
    width: 56, height: 56, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  themeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#00c8a0',
    alignItems: 'center', justifyContent: 'center',
  },
  // Acento
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  accentItem: { alignItems: 'center', gap: 4, width: 60 },
  accentCircle: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  accentActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  accentLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  // Fuente
  preview: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  presetActive: { borderColor: '#00c8a0', backgroundColor: 'rgba(0,200,160,0.1)' },
  fontRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  // Chat bg
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchItem: { alignItems: 'center', gap: 4 },
  colorSwatch: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 9, fontWeight: '500' },
});
