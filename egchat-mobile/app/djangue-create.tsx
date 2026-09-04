/**
 * Mi Djangue — Crear nuevo grupo
 * Solo el responsable general puede crear. Puede designar un secretario.
 */
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';
import { apiFetch } from '../src/api';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'annual';

// ── Iconos de frecuencia ──────────────────────────────────────────
function FrequencyIcon({ type, size = 24, color = '#fff' }: { type: Frequency; size?: number; color?: string }) {
  switch (type) {
    case 'daily':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Circle cx="12" cy="12" r="4" />
          <Line x1="12" y1="1" x2="12" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="23" />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <Line x1="1" y1="12" x2="3" y2="12" />
          <Line x1="21" y1="12" x2="23" y2="12" />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </Svg>
      );
    case 'weekly':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Line x1="3" y1="10" x2="21" y2="10" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Path d="M9 16l2 2 4-4" />
        </Svg>
      );
    case 'monthly':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Rect x="3" y="4" width="18" height="18" rx="2" />
          <Line x1="3" y1="10" x2="21" y2="10" />
          <Line x1="8" y1="2" x2="8" y2="6" />
          <Line x1="16" y1="2" x2="16" y2="6" />
          <Line x1="8" y1="14" x2="8" y2="14.01" />
          <Line x1="12" y1="14" x2="12" y2="14.01" />
          <Line x1="16" y1="14" x2="16" y2="14.01" />
          <Line x1="8" y1="18" x2="8" y2="18.01" />
          <Line x1="12" y1="18" x2="12" y2="18.01" />
        </Svg>
      );
    case 'annual':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <Path d="M4 22h16" />
          <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </Svg>
      );
  }
}

const FREQUENCIES: { key: Frequency; label: string; desc: string }[] = [
  { key: 'daily',   label: 'Diario',   desc: 'Cada día' },
  { key: 'weekly',  label: 'Semanal',  desc: 'Cada semana' },
  { key: 'monthly', label: 'Mensual',  desc: 'Cada mes' },
  { key: 'annual',  label: 'Anual',    desc: 'Cada año' },
];

const fmtAmount = (n: string) => {
  const num = Number(n.replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('fr-FR');
};

// NOTA: Esta pantalla ha sido reemplazada por djangue-admin-create.tsx
// que incluye todas las funcionalidades de Administrador General
export default function DjangueCreateScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [frequency, setFrequency]   = useState<Frequency>('monthly');
  const [quotaRaw, setQuotaRaw]     = useState('');
  const [maxMembers, setMaxMembers] = useState('12');
  const [secretaryPhone, setSecPhone] = useState('');
  const [loading, setLoading]       = useState(false);

  const quota = Number(quotaRaw.replace(/[^0-9]/g, ''));

  const handleCreate = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return Alert.alert('No autenticado', 'Debes iniciar sesión para crear un djangue.');
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Ponle un nombre al djangue.');
    if (!quota || quota < 100) return Alert.alert('Cuota inválida', 'La cuota mínima es 100 XAF.');
    if (Number(maxMembers) < 2) return Alert.alert('Mínimo 2 miembros', 'Un djangue necesita al menos 2 integrantes.');

    setLoading(true);
    try {
      console.log('🔍 Intentando crear djangue con datos:', {
        name: name.trim(),
        description: description.trim(),
        frequency,
        quota_amount: quota,
        max_members: Number(maxMembers),
      });
      
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
      
      console.log('✅ Djangue creado exitosamente:', group);
      
      Alert.alert(
        '✅ Djangue creado',
        `"${group.name}" está listo. Ahora puedes agregar integrantes.`,
        [{ text: 'Ver Djangue', onPress: () => {
          router.replace({ pathname: '/djangue-detail', params: { id: group.id } } as any);
        }}],
      );
    } catch (e: any) {
      console.error('❌ Error creando djangue:', e);
      Alert.alert('Error', e.message || 'No se pudo crear el djangue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#00C8A0', '#00B4E6']} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Crear Djangue</Text>
            <Text style={s.headerSub}>Nuevo grupo de ahorro</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {/* Nombre */}
          <View style={s.field}>
            <Text style={s.label}>Nombre del Djangue *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Djangue del barrio"
              placeholderTextColor="rgba(255,255,255,0.25)"
              maxLength={50}
            />
          </View>

          {/* Descripción */}
          <View style={s.field}>
            <Text style={s.label}>Descripción (opcional)</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDesc}
              placeholder="Descripción del grupo..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
              maxLength={200}
            />
          </View>

          {/* Frecuencia */}
          <View style={s.field}>
            <Text style={s.label}>Frecuencia *</Text>
            <View style={s.freqGrid}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.freqBtn, frequency === f.key && s.freqBtnActive]}
                  onPress={() => setFrequency(f.key)}
                  activeOpacity={0.8}
                >
                  <FrequencyIcon 
                    type={f.key} 
                    size={28} 
                    color={frequency === f.key ? '#00C8A0' : 'rgba(255,255,255,0.4)'} 
                  />
                  <Text style={[s.freqLabel, frequency === f.key && s.freqLabelActive]}>{f.label}</Text>
                  <Text style={s.freqDesc}>{f.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cuota */}
          <View style={s.field}>
            <Text style={s.label}>Cuota por turno (XAF) *</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={quotaRaw}
                onChangeText={v => setQuotaRaw(v.replace(/[^0-9]/g, ''))}
                placeholder="Ej: 5000"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="numeric"
              />
              <View style={s.currencyBadge}>
                <Text style={s.currencyTxt}>XAF</Text>
              </View>
            </View>
            {quota >= 100 && (
              <Text style={s.hint}>
                Con 10 miembros = {(quota * 9).toLocaleString('fr-FR')} XAF por turno
              </Text>
            )}
          </View>

          {/* Max miembros */}
          <View style={s.field}>
            <Text style={s.label}>Máximo de integrantes</Text>
            <View style={s.counterRow}>
              <TouchableOpacity
                style={s.counterBtn}
                onPress={() => setMaxMembers(v => String(Math.max(2, Number(v) - 1)))}
              >
                <Text style={s.counterBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterVal}>{maxMembers}</Text>
              <TouchableOpacity
                style={s.counterBtn}
                onPress={() => setMaxMembers(v => String(Math.min(50, Number(v) + 1)))}
              >
                <Text style={s.counterBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secretario */}
          <View style={s.field}>
            <Text style={s.label}>Teléfono del Secretario (opcional)</Text>
            <TextInput
              style={s.input}
              value={secretaryPhone}
              onChangeText={setSecPhone}
              placeholder="+240 ..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="phone-pad"
            />
            <Text style={s.hint}>
              El secretario puede agregar miembros y ver el estado del grupo.
            </Text>
          </View>

          {/* Resumen */}
          {name.trim() && quota >= 100 && (
            <LinearGradient colors={['#312e81', '#4c1d95']} style={s.summary}>
              <Text style={s.summaryTitle}>📋 Resumen</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Nombre</Text>
                <Text style={s.summaryVal}>{name}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Frecuencia</Text>
                <Text style={s.summaryVal}>{FREQUENCIES.find(f => f.key === frequency)?.label}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Cuota</Text>
                <Text style={s.summaryVal}>{quota.toLocaleString('fr-FR')} XAF</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Máx. miembros</Text>
                <Text style={s.summaryVal}>{maxMembers}</Text>
              </View>
            </LinearGradient>
          )}

          {/* Botón crear */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.85}
            style={s.createBtnWrap}
          >
            <LinearGradient
              colors={loading ? ['#374151', '#374151'] : ['#6366f1', '#4f46e5']}
              style={s.createBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.createBtnTxt}>Crear Djangue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00C8A0' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  form: { padding: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#2d3561', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  inputRow: { flexDirection: 'row', gap: 8 },
  currencyBadge: { backgroundColor: '#312e81', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  currencyTxt: { fontSize: 14, fontWeight: '700', color: '#a5b4fc' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: -4 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: { flex: 1, minWidth: '45%', backgroundColor: '#2d3561', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' },
  freqBtnActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)' },
  freqEmoji: { fontSize: 22 },
  freqLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  freqLabelActive: { color: '#a5b4fc' },
  freqDesc: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#2d3561', borderRadius: 12, padding: 8, alignSelf: 'flex-start' },
  counterBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  counterBtnTxt: { fontSize: 20, fontWeight: '700', color: '#a5b4fc' },
  counterVal: { fontSize: 22, fontWeight: '800', color: '#fff', minWidth: 40, textAlign: 'center' },
  summary: { borderRadius: 16, padding: 16, gap: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#a5b4fc', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLbl: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#fff' },
  createBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  createBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  createBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
