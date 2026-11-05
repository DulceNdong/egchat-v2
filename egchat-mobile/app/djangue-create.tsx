/**
 * Mi Djangue — Crear nuevo grupo de ahorro
 * Diseño moderno: fondo claro, iconos SVG profesionales
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import { apiFetch } from '../src/api';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'annual';

const FREQUENCIES: { key: Frequency; label: string; desc: string; color: string }[] = [
  { key: 'daily',   label: 'Diario',   desc: 'Cada día',    color: '#f59e0b' },
  { key: 'weekly',  label: 'Semanal',  desc: 'Cada semana', color: '#10b981' },
  { key: 'monthly', label: 'Mensual',  desc: 'Cada mes',    color: '#6366f1' },
  { key: 'annual',  label: 'Anual',    desc: 'Cada año',    color: '#ec4899' },
];

// ── Iconos ────────────────────────────────────────────────────────
const I = (props: any) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props} />;

function FreqIcon({ type, color }: { type: Frequency; color: string }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'daily') return (
    <Svg {...p}>
      <Circle cx="12" cy="12" r="4"/><Line x1="12" y1="2" x2="12" y2="4"/><Line x1="12" y1="20" x2="12" y2="22"/>
      <Line x1="2" y1="12" x2="4" y2="12"/><Line x1="20" y1="12" x2="22" y2="12"/>
      <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><Line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
      <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><Line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
    </Svg>
  );
  if (type === 'weekly') return (
    <Svg {...p}>
      <Rect x="3" y="4" width="18" height="18" rx="2"/><Line x1="3" y1="10" x2="21" y2="10"/>
      <Line x1="8" y1="2" x2="8" y2="6"/><Line x1="16" y1="2" x2="16" y2="6"/><Path d="M9 16l2 2 4-4"/>
    </Svg>
  );
  if (type === 'monthly') return (
    <Svg {...p}>
      <Rect x="3" y="4" width="18" height="18" rx="2"/><Line x1="3" y1="10" x2="21" y2="10"/>
      <Line x1="8" y1="2" x2="8" y2="6"/><Line x1="16" y1="2" x2="16" y2="6"/>
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </Svg>
  );
  return (
    <Svg {...p}>
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <Path d="M4 22h16"/><Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </Svg>
  );
}

export default function DjangueCreateScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [quotaRaw, setQuotaRaw] = useState('');
  const [maxMembers, setMaxMembers] = useState('12');
  const [secretaryPhone, setSecPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const quota = Number(quotaRaw.replace(/\D/g, ''));

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Ponle un nombre al djangue.');
    if (!quota || quota < 100) return Alert.alert('Cuota inválida', 'La cuota mínima es 100 XAF.');
    if (Number(maxMembers) < 2) return Alert.alert('Mínimo 2 miembros', 'Un djangue necesita al menos 2 integrantes.');
    setLoading(true);
    try {
      const group = await apiFetch('/api/djangue', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          frequency,
          quota_amount: quota,
          max_members: Number(maxMembers),
          secretary_phone: secretaryPhone.trim() || undefined,
        }),
      });
      Alert.alert('✅ Djangue creado', `"${group.name}" está listo.`, [{
        text: 'Ver Djangue',
        onPress: () => router.replace({ pathname: '/djangue-detail', params: { id: group.id } } as any),
      }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el djangue');
    } finally {
      setLoading(false);
    }
  };

  const selFreq = FREQUENCIES.find(f => f.key === frequency)!;

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/>
            <Path d="M12 19l-7-7 7-7"/>
          </Svg>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Crear Djangue</Text>
          <Text style={s.headerSub}>Nuevo grupo de ahorro</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Nombre */}
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}>
              <I stroke="#6366f1"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></I>
            </View>
            <View style={s.fieldBody}>
              <Text style={s.label}>Nombre *</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Djangue del barrio"
                placeholderTextColor="#cbd5e1"
                maxLength={50}
              />
            </View>
          </View>

          {/* Descripción */}
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}>
              <I stroke="#6366f1">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <Polyline points="14 2 14 8 20 8"/>
                <Line x1="16" y1="13" x2="8" y2="13"/>
                <Line x1="16" y1="17" x2="8" y2="17"/>
              </I>
            </View>
            <View style={s.fieldBody}>
              <Text style={s.label}>Descripción</Text>
              <TextInput
                style={[s.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
                value={description}
                onChangeText={setDesc}
                placeholder="Describe el propósito del grupo..."
                placeholderTextColor="#cbd5e1"
                multiline
                maxLength={200}
              />
            </View>
          </View>

          {/* Frecuencia */}
          <View style={s.sectionCard}>
            <Text style={s.sectionLabel}>Frecuencia de aportes</Text>
            <View style={s.freqGrid}>
              {FREQUENCIES.map(f => {
                const active = frequency === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[s.freqBtn, active && { borderColor: f.color, backgroundColor: f.color + '0f' }]}
                    onPress={() => setFrequency(f.key)}
                    activeOpacity={0.75}
                  >
                    <FreqIcon type={f.key} color={active ? f.color : '#94a3b8'} />
                    <Text style={[s.freqLabel, active && { color: f.color }]}>{f.label}</Text>
                    <Text style={s.freqDesc}>{f.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Cuota */}
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}>
              <I stroke="#10b981">
                <Line x1="12" y1="1" x2="12" y2="23"/>
                <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </I>
            </View>
            <View style={s.fieldBody}>
              <Text style={s.label}>Cuota por turno (XAF) *</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={quotaRaw}
                  onChangeText={v => setQuotaRaw(v.replace(/\D/g, ''))}
                  placeholder="Ej: 5 000"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                />
                <View style={s.currencyTag}>
                  <Text style={s.currencyTxt}>XAF</Text>
                </View>
              </View>
              {quota >= 100 && (
                <Text style={s.hint}>Con {maxMembers} miembros = {(quota * (Number(maxMembers) - 1)).toLocaleString('fr-FR')} XAF por turno</Text>
              )}
            </View>
          </View>

          {/* Máx. miembros */}
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}>
              <I stroke="#f59e0b">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <Circle cx="9" cy="7" r="4"/>
                <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </I>
            </View>
            <View style={s.fieldBody}>
              <Text style={s.label}>Máximo de integrantes</Text>
              <View style={s.counter}>
                <TouchableOpacity
                  style={s.counterBtn}
                  onPress={() => setMaxMembers(v => String(Math.max(2, Number(v) - 1)))}
                  hitSlop={8}
                >
                  <Text style={s.counterBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{maxMembers}</Text>
                <TouchableOpacity
                  style={s.counterBtn}
                  onPress={() => setMaxMembers(v => String(Math.min(50, Number(v) + 1)))}
                  hitSlop={8}
                >
                  <Text style={s.counterBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Secretario */}
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}>
              <I stroke="#ec4899">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.8 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z"/>
              </I>
            </View>
            <View style={s.fieldBody}>
              <Text style={s.label}>Teléfono del Secretario <Text style={s.optional}>(opcional)</Text></Text>
              <TextInput
                style={s.input}
                value={secretaryPhone}
                onChangeText={setSecPhone}
                placeholder="+240 222..."
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
              />
              <Text style={s.hint}>Puede gestionar pagos y agregar integrantes.</Text>
            </View>
          </View>

          {/* Resumen */}
          {name.trim() && quota >= 100 && (
            <View style={s.summaryCard}>
              <Text style={s.summaryTitle}>Resumen</Text>
              {[
                { l: 'Nombre', v: name },
                { l: 'Frecuencia', v: selFreq.label },
                { l: 'Cuota', v: `${quota.toLocaleString('fr-FR')} XAF` },
                { l: 'Máx. integrantes', v: maxMembers },
              ].map(row => (
                <View key={row.l} style={s.summaryRow}>
                  <Text style={s.summaryLbl}>{row.l}</Text>
                  <Text style={[s.summaryVal, row.l === 'Frecuencia' && { color: selFreq.color }]}>{row.v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón crear */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            style={[s.createBtn, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.createBtnTxt}>Crear Djangue</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  form: { padding: 16, gap: 12 },

  // Field con icono lateral
  fieldWrap: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  fieldIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f0f1fe',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  fieldBody: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: '#94a3b8' },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1e293b', fontWeight: '500',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  currencyTag: {
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 12, justifyContent: 'center',
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  currencyTxt: { fontSize: 13, fontWeight: '800', color: '#10b981' },
  hint: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },

  // Frecuencia
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: {
    width: '47%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  freqLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  freqDesc: { fontSize: 10, color: '#cbd5e1' },

  // Counter
  counter: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: '#f8fafc', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0', alignSelf: 'flex-start',
  },
  counterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  counterBtnTxt: { fontSize: 20, fontWeight: '700', color: '#6366f1' },
  counterVal: { fontSize: 17, fontWeight: '800', color: '#1e293b', minWidth: 44, textAlign: 'center' },

  // Resumen
  summaryCard: {
    backgroundColor: '#fafafa', borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl: { fontSize: 13, color: '#94a3b8' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

  // Botón crear
  createBtn: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  createBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
