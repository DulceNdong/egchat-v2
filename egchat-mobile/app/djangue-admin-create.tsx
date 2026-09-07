/**
 * Mi Djangue — Crear nuevo grupo (Admin)
 * Diseño moderno: fondo claro, iconos SVG, sin colores toscos
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle, Rect, Polyline } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { apiFetch, getToken, getApiBase } from '../src/api';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'annual';

const FREQUENCIES: { value: Frequency; label: string; desc: string; color: string }[] = [
  { value: 'daily',   label: 'Diario',   desc: 'Cada día',    color: '#f59e0b' },
  { value: 'weekly',  label: 'Semanal',  desc: 'Cada semana', color: '#10b981' },
  { value: 'monthly', label: 'Mensual',  desc: 'Cada mes',    color: '#6366f1' },
  { value: 'annual',  label: 'Anual',    desc: 'Cada año',    color: '#ec4899' },
];

// ── Iconos SVG ────────────────────────────────────────────────────
function FreqIcon({ type, color }: { type: Frequency; color: string }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'daily') return (
    <Svg {...p}>
      <Circle cx="12" cy="12" r="4"/>
      <Line x1="12" y1="2" x2="12" y2="4"/><Line x1="12" y1="20" x2="12" y2="22"/>
      <Line x1="2" y1="12" x2="4" y2="12"/><Line x1="20" y1="12" x2="22" y2="12"/>
      <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><Line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
      <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><Line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
    </Svg>
  );
  if (type === 'weekly') return (
    <Svg {...p}>
      <Rect x="3" y="4" width="18" height="18" rx="2"/>
      <Line x1="3" y1="10" x2="21" y2="10"/>
      <Line x1="8" y1="2" x2="8" y2="6"/><Line x1="16" y1="2" x2="16" y2="6"/>
      <Path d="M9 16l2 2 4-4"/>
    </Svg>
  );
  if (type === 'monthly') return (
    <Svg {...p}>
      <Rect x="3" y="4" width="18" height="18" rx="2"/>
      <Line x1="3" y1="10" x2="21" y2="10"/>
      <Line x1="8" y1="2" x2="8" y2="6"/><Line x1="16" y1="2" x2="16" y2="6"/>
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </Svg>
  );
  return (
    <Svg {...p}>
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <Path d="M4 22h16"/>
      <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </Svg>
  );
}

// ── Componente ────────────────────────────────────────────────────
export default function DjangueAdminCreateScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [quotaAmount, setQuotaAmount] = useState('500');
  const [maxMembers, setMaxMembers] = useState('12');
  const [penaltyPercent, setPenaltyPercent] = useState('10');
  const [notifDaysBefore, setNotifDaysBefore] = useState('10');
  const [notifFinalDays, setNotifFinalDays] = useState('5');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir el logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setLogoUri(result.assets[0].uri);
  };

  const createDjangue = async () => {
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Ponle un nombre al djangue.');
    if (Number(quotaAmount) <= 0) return Alert.alert('Cuota inválida', 'La cuota debe ser mayor a 0.');
    if (Number(maxMembers) < 2) return Alert.alert('Mínimo 2 miembros', 'Un djangue necesita al menos 2 integrantes.');

    setLoading(true);
    try {
      let logoUrl = null;
      if (logoUri) {
        try {
          const formData = new FormData();
          const filename = logoUri.split('/').pop() || 'logo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: logoUri, name: filename, type } as any);
          const token = await getToken();
          const baseUrl = getApiBase();
          const res = await fetch(`${baseUrl}/api/upload/djangue-logo`, {
            method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const r = await res.json();
            logoUrl = r.url;
          }
        } catch { /* continuar sin logo */ }
      }

      const response = await apiFetch('/api/djangue', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: (slogan.trim() ? `${slogan.trim()} — ` : '') + description.trim() || undefined,
          frequency,
          quota_amount: Number(quotaAmount),
          max_members: Number(maxMembers),
        }),
      });

      setTimeout(() => {
        router.replace({ pathname: '/djangue-detail', params: { id: response.id } } as any);
      }, 100);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el djangue');
    } finally {
      setLoading(false);
    }
  };

  const selFreq = FREQUENCIES.find(f => f.value === frequency)!;

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
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIconWrap, { backgroundColor: '#f0f1fe' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <Circle cx="12" cy="13" r="4"/>
                </Svg>
              </View>
              <Text style={s.cardTitle}>Logo <Text style={s.optional}>(opcional)</Text></Text>
            </View>
            <TouchableOpacity style={s.logoBtn} onPress={pickImage} activeOpacity={0.8}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={s.logoImg} contentFit="cover" />
              ) : (
                <View style={s.logoEmpty}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeLinecap="round">
                    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <Circle cx="12" cy="13" r="4"/>
                  </Svg>
                  <Text style={s.logoEmptyTxt}>Elegir imagen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Info básica */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIconWrap, { backgroundColor: '#f0f1fe' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <Circle cx="9" cy="7" r="4"/>
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </Svg>
              </View>
              <Text style={s.cardTitle}>Información básica</Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Nombre *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName}
                placeholder="Ej: Djangue Familiar" placeholderTextColor="#cbd5e1" maxLength={50} />
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Eslogan <Text style={s.optional}>(opcional)</Text></Text>
              <TextInput style={s.input} value={slogan} onChangeText={setSlogan}
                placeholder="Ahorrando juntos..." placeholderTextColor="#cbd5e1" maxLength={80} />
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Descripción <Text style={s.optional}>(opcional)</Text></Text>
              <TextInput style={[s.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
                value={description} onChangeText={setDescription}
                placeholder="Propósito del grupo..." placeholderTextColor="#cbd5e1"
                multiline maxLength={200} />
            </View>
          </View>

          {/* Periodicidad */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIconWrap, { backgroundColor: '#fef9c3' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="4" width="18" height="18" rx="2"/>
                  <Line x1="3" y1="10" x2="21" y2="10"/>
                  <Line x1="8" y1="2" x2="8" y2="6"/><Line x1="16" y1="2" x2="16" y2="6"/>
                </Svg>
              </View>
              <Text style={s.cardTitle}>Periodicidad</Text>
            </View>
            <View style={s.freqGrid}>
              {FREQUENCIES.map(f => {
                const active = frequency === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    style={[s.freqBtn, active && { borderColor: f.color, backgroundColor: f.color + '10' }]}
                    onPress={() => setFrequency(f.value)}
                    activeOpacity={0.75}
                  >
                    <FreqIcon type={f.value} color={active ? f.color : '#94a3b8'} />
                    <Text style={[s.freqLabel, active && { color: f.color }]}>{f.label}</Text>
                    <Text style={s.freqDesc}>{f.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Configuración financiera */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIconWrap, { backgroundColor: '#f0fdf4' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1="12" y1="1" x2="12" y2="23"/>
                  <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </Svg>
              </View>
              <Text style={s.cardTitle}>Configuración financiera</Text>
            </View>
            <View style={s.row}>
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>Cuota (XAF) *</Text>
                <View style={s.inputWithTag}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={quotaAmount}
                    onChangeText={setQuotaAmount} keyboardType="numeric"
                    placeholder="500" placeholderTextColor="#cbd5e1" />
                  <View style={s.currencyTag}><Text style={s.currencyTxt}>XAF</Text></View>
                </View>
              </View>
              <View style={{ width: 12 }} />
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>Máx. integrantes</Text>
                <View style={s.counter}>
                  <TouchableOpacity style={s.counterBtn} hitSlop={8}
                    onPress={() => setMaxMembers(v => String(Math.max(2, Number(v) - 1)))}>
                    <Text style={s.counterBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.counterVal}>{maxMembers}</Text>
                  <TouchableOpacity style={s.counterBtn} hitSlop={8}
                    onPress={() => setMaxMembers(v => String(Math.min(50, Number(v) + 1)))}>
                    <Text style={s.counterBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Sanciones */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIconWrap, { backgroundColor: '#fff1f2' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <Line x1="12" y1="9" x2="12" y2="13"/><Line x1="12" y1="17" x2="12.01" y2="17"/>
                </Svg>
              </View>
              <Text style={s.cardTitle}>Sanciones y notificaciones</Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>% de mora por retraso</Text>
              <View style={s.inputWithTag}>
                <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} value={penaltyPercent}
                  onChangeText={setPenaltyPercent} keyboardType="numeric"
                  placeholder="10" placeholderTextColor="#cbd5e1" />
                <View style={s.pctTag}><Text style={s.pctTxt}>%</Text></View>
              </View>
              <Text style={s.hint}>Se aplica sobre la cuota a quienes no paguen a tiempo</Text>
            </View>

            <View style={s.row}>
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>1ª notificación (días antes)</Text>
                <TextInput style={s.input} value={notifDaysBefore}
                  onChangeText={setNotifDaysBefore} keyboardType="numeric"
                  placeholder="10" placeholderTextColor="#cbd5e1" />
              </View>
              <View style={{ width: 12 }} />
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>Recordatorios diarios (días)</Text>
                <TextInput style={s.input} value={notifFinalDays}
                  onChangeText={setNotifFinalDays} keyboardType="numeric"
                  placeholder="5" placeholderTextColor="#cbd5e1" />
              </View>
            </View>

            <View style={s.infoBox}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
                <Circle cx="12" cy="12" r="10"/>
                <Path d="M12 16v-4M12 8h.01"/>
              </Svg>
              <Text style={s.infoTxt}>El secretario recibirá recordatorios automáticos para notificar a los integrantes</Text>
            </View>
          </View>

          {/* Resumen */}
          {name.trim() && Number(quotaAmount) > 0 && (
            <View style={s.summaryCard}>
              <Text style={s.summaryTitle}>Resumen del Djangue</Text>
              {[
                { l: 'Nombre', v: name },
                { l: 'Periodicidad', v: selFreq.label, color: selFreq.color },
                { l: 'Cuota', v: `${Number(quotaAmount).toLocaleString('fr-FR')} XAF` },
                { l: 'Máx. integrantes', v: maxMembers },
                { l: 'Mora por retraso', v: `${penaltyPercent}%` },
              ].map(r => (
                <View key={r.l} style={s.summaryRow}>
                  <Text style={s.summaryLbl}>{r.l}</Text>
                  <Text style={[s.summaryVal, r.color ? { color: r.color } : {}]}>{r.v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón crear */}
          <TouchableOpacity
            style={[s.createBtn, loading && { opacity: 0.6 }]}
            onPress={createDjangue}
            disabled={loading}
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
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  optional: { fontSize: 12, fontWeight: '400', color: '#94a3b8' },
  // Logo
  logoBtn: { alignSelf: 'center' },
  logoImg: { width: 100, height: 100, borderRadius: 50 },
  logoEmpty: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  logoEmptyTxt: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  // Fields
  fieldGroup: { gap: 5 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1e293b', fontWeight: '500',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 0,
  },
  hint: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },
  row: { flexDirection: 'row' },
  inputWithTag: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  currencyTag: {
    backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10,
    borderWidth: 1, borderColor: '#bbf7d0', justifyContent: 'center',
  },
  currencyTxt: { fontSize: 12, fontWeight: '800', color: '#10b981' },
  pctTag: {
    backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#fecaca', justifyContent: 'center',
  },
  pctTxt: { fontSize: 13, fontWeight: '800', color: '#f43f5e' },
  // Frecuencia
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0',
    height: 42,
  },
  counterBtn: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  counterBtnTxt: { fontSize: 20, fontWeight: '700', color: '#6366f1', lineHeight: 24 },
  counterVal: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  // Info box
  infoBox: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: '#f0f1fe', borderRadius: 10,
    borderWidth: 1, borderColor: '#c7d2fe',
  },
  infoTxt: { flex: 1, fontSize: 12, color: '#4f46e5', lineHeight: 17 },
  // Resumen
  summaryCard: {
    backgroundColor: '#fafafa', borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl: { fontSize: 13, color: '#94a3b8' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  // Botón
  createBtn: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  createBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
