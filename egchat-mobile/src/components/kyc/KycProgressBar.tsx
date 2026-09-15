import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = [
  { n: 1, label: 'Datos' },
  { n: 2, label: 'Doc.' },
  { n: 3, label: 'Bio' },
  { n: 4, label: 'Fin.' },
  { n: 5, label: 'Dec.' },
];

interface Props {
  current: number;
  completed: number[];
  onExit?: () => void;
}

export function KycProgressBar({ current, completed, onExit }: Props) {
  const insets = useSafeAreaInsets();
  const pct = Math.round(((current - 1) / 4) * 100);

  return (
    <View style={[st.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={st.row}>
        <TouchableOpacity
          onPress={onExit ?? (() => router.back())}
          accessibilityLabel="Salir del formulario KYC"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={st.exit}>✕ Salir</Text>
        </TouchableOpacity>
        <Text style={st.stepLabel}>Paso {current} de 5</Text>
      </View>

      {/* Puntos de pasos */}
      <View style={st.dots}>
        {STEPS.map((s, i) => {
          const done = completed.includes(s.n);
          const active = s.n === current;
          return (
            <React.Fragment key={s.n}>
              <View style={st.dotWrap}>
                <View style={[
                  st.dot,
                  done && st.dotDone,
                  active && st.dotActive,
                ]}>
                  <Text style={[st.dotText, (done || active) && st.dotTextActive]}>
                    {done ? '✓' : s.n}
                  </Text>
                </View>
                <Text style={[st.dotLabel, active && st.dotLabelActive]}>{s.label}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[st.line, done && st.lineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Barra de progreso */}
      <View style={st.barBg}>
        <View style={[st.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const BRAND = '#00C8A0';
const st = StyleSheet.create({
  wrap:       { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exit:       { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  stepLabel:  { fontSize: 13, color: '#374151', fontWeight: '700' },
  dots:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dotWrap:    { alignItems: 'center', gap: 4 },
  dot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  dotActive:  { backgroundColor: BRAND, borderColor: BRAND },
  dotDone:    { backgroundColor: BRAND, borderColor: BRAND },
  dotText:    { fontSize: 11, fontWeight: '700', color: '#9ca3af' },
  dotTextActive: { color: '#fff' },
  dotLabel:   { fontSize: 9, color: '#9ca3af', fontWeight: '600' },
  dotLabelActive: { color: BRAND },
  line:       { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginBottom: 14, marginHorizontal: 2 },
  lineDone:   { backgroundColor: BRAND },
  barBg:      { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  barFill:    { height: 4, backgroundColor: BRAND, borderRadius: 2 },
});
