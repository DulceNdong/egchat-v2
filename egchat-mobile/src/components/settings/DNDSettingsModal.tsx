// ══════════════════════════════════════════════════════════════════
// DNDSettingsModal — configuración de Do Not Disturb programado
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Switch, ScrollView, Pressable,
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDNDSettings, saveDNDSettings, isDNDActive, formatTime,
  DAY_NAMES, type DNDSettings,
} from '../../services/doNotDisturb';
import { toast } from '../Toast';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

// Selector de hora simple en rueda
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINS = [0, 15, 30, 45];

interface TimePickerProps {
  hour: number; min: number;
  onChange: (h: number, m: number) => void;
  label: string;
  C: typeof Colors;
}

function TimePicker({ hour, min, onChange, label, C }: TimePickerProps) {
  return (
    <View style={tp.wrap}>
      <Text style={[tp.label, { color: C.textTertiary }]}>{label}</Text>
      <View style={tp.row}>
        {/* Hora */}
        <View style={[tp.selector, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          <TouchableOpacity onPress={() => onChange(hour > 0 ? hour - 1 : 23, min)} style={tp.arrow}>
            <Text style={{ color: '#07a472', fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <Text style={[tp.value, { color: C.textPrimary }]}>{String(hour).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => onChange(hour < 23 ? hour + 1 : 0, min)} style={tp.arrow}>
            <Text style={{ color: '#07a472', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={[tp.colon, { color: C.textPrimary }]}>:</Text>
        {/* Minutos */}
        <View style={[tp.selector, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          <TouchableOpacity onPress={() => { const i = MINS.indexOf(min); onChange(hour, MINS[i > 0 ? i - 1 : MINS.length - 1]); }} style={tp.arrow}>
            <Text style={{ color: '#07a472', fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <Text style={[tp.value, { color: C.textPrimary }]}>{String(min).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => { const i = MINS.indexOf(min); onChange(hour, MINS[i < MINS.length - 1 ? i + 1 : 0]); }} style={tp.arrow}>
            <Text style={{ color: '#07a472', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 11, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selector: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 6, gap: 4 },
  arrow: { paddingHorizontal: 6 },
  value: { fontSize: 20, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  colon: { fontSize: 22, fontWeight: '700' },
});

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DNDSettingsModal({ visible, onClose }: Props) {
  const [settings, setSettings] = useState<DNDSettings>({
    enabled: false, startHour: 22, startMin: 0, endHour: 8, endMin: 0, allowCalls: true, days: [0,1,2,3,4,5,6],
  });
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => { if (visible) getDNDSettings().then(setSettings); }, [visible]);

  const handleSave = async () => {
    await saveDNDSettings(settings);
    const active = isDNDActive(settings);
    // No molestar guardado silenciosamente
    onClose();
  };

  const toggleDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>
        <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12"/><Path d="M12 19l-7-7 7-7"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>No molestar</Text>
          <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
            <Text style={s.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
          {/* Toggle principal */}
          <View style={[s.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: C.textPrimary }]}>No molestar</Text>
              <Text style={[s.cardSub, { color: C.textTertiary }]}>
                {settings.enabled
                  ? isDNDActive(settings) ? '🔇 Activo ahora' : `Activo de ${formatTime(settings.startHour, settings.startMin)} a ${formatTime(settings.endHour, settings.endMin)}`
                  : 'Desactivado'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={v => setSettings(p => ({ ...p, enabled: v }))}
              trackColor={{ false: '#d1d5db', true: '#07a472' }}
              thumbColor="#fff"
            />
          </View>

          {settings.enabled && (
            <>
              {/* Horario */}
              <Text style={[s.sectionLabel, { color: C.textTertiary }]}>HORARIO</Text>
              <View style={[s.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={{ flexDirection: 'row', gap: 16, paddingVertical: 8 }}>
                  <TimePicker
                    label="DESDE" hour={settings.startHour} min={settings.startMin} C={C}
                    onChange={(h, m) => setSettings(p => ({ ...p, startHour: h, startMin: m }))}
                  />
                  <View style={{ width: 1, backgroundColor: C.borderLight }} />
                  <TimePicker
                    label="HASTA" hour={settings.endHour} min={settings.endMin} C={C}
                    onChange={(h, m) => setSettings(p => ({ ...p, endHour: h, endMin: m }))}
                  />
                </View>
              </View>

              {/* Días */}
              <Text style={[s.sectionLabel, { color: C.textTertiary }]}>DÍAS</Text>
              <View style={[s.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={s.daysRow}>
                  {DAY_NAMES.map((name, i) => {
                    const active = settings.days.includes(i);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[s.dayBtn, active && s.dayBtnActive]}
                        onPress={() => toggleDay(i)}
                      >
                        <Text style={[s.dayText, active && s.dayTextActive]}>{name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Permitir llamadas */}
              <Text style={[s.sectionLabel, { color: C.textTertiary }]}>EXCEPCIONES</Text>
              <View style={[s.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={s.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: C.textPrimary }]}>Permitir llamadas</Text>
                    <Text style={[s.cardSub, { color: C.textTertiary }]}>Las llamadas entrantes no se silencian</Text>
                  </View>
                  <Switch
                    value={settings.allowCalls}
                    onValueChange={v => setSettings(p => ({ ...p, allowCalls: v }))}
                    trackColor={{ false: '#d1d5db', true: '#07a472' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10, gap: 6 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  dayBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dayBtnActive: { backgroundColor: '#07a472' },
  dayText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  dayTextActive: { color: '#fff' },
});
