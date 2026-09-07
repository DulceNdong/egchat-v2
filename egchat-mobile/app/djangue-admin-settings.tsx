/**
 * Mi Djangue — Panel del Administrador General
 * Configurar djangue existente
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { apiFetch } from '../src/api';

const FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
];

export default function DjangueAdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [frequency, setFrequency] = useState('monthly');
  const [quotaAmount, setQuotaAmount] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [penaltyPercent, setPenaltyPercent] = useState('');
  const [notificationDaysBefore, setNotificationDaysBefore] = useState('');
  const [notificationFinalDays, setNotificationFinalDays] = useState('');
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [canModifyFinancial, setCanModifyFinancial] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDjangue();
  }, [id]);

  const loadDjangue = async () => {
    try {
      const data = await apiFetch(`/api/djangue/${id}`);
      setName(data.name);
      setSlogan(data.slogan || '');
      setDescription(data.description || '');
      setLogoUri(data.logo_url);
      setFrequency(data.frequency);
      setQuotaAmount(String(data.quota_amount));
      setMaxMembers(String(data.max_members));
      setPenaltyPercent(String(data.penalty_percent || 10));
      setNotificationDaysBefore(String(data.notification_days_before || 10));
      setNotificationFinalDays(String(data.notification_final_days || 5));
      setStatus(data.status);
      
      // No se puede modificar cuota/frecuencia si ya hay cotizaciones en curso
      setCanModifyFinancial(data.paid_count === 0);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el djangue');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const saveSettings = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Subir nuevo logo si cambió
      let logoUrl = logoUri;
      if (logoUri && logoUri.startsWith('file://')) {
        const formData = new FormData();
        const filename = logoUri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
          uri: logoUri,
          name: filename,
          type,
        } as any);

        const uploadRes = await apiFetch('/api/upload/djangue-logo', {
          method: 'POST',
          body: formData,
        });
        logoUrl = uploadRes.url;
      }

      const updates: any = {
        name: name.trim(),
        slogan: slogan.trim() || null,
        description: description.trim() || null,
        logo_url: logoUrl,
        penalty_percent: Number(penaltyPercent),
        notification_days_before: Number(notificationDaysBefore),
        notification_final_days: Number(notificationFinalDays),
        status,
      };

      // Solo permitir cambio de cuota/frecuencia si no hay cotizaciones activas
      if (canModifyFinancial) {
        updates.frequency = frequency;
        updates.quota_amount = Number(quotaAmount);
        updates.max_members = Number(maxMembers);
      }

      await apiFetch(`/api/djangue/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      Alert.alert('✅ Guardado', 'Los cambios se guardaron correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const pauseOrResume = () => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    Alert.alert(
      newStatus === 'paused' ? 'Pausar Djangue' : 'Reactivar Djangue',
      newStatus === 'paused'
        ? 'Al pausar, los integrantes no podrán realizar cotizaciones hasta que lo reactives.'
        : 'Al reactivar, el djangue continuará con el ciclo actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => setStatus(newStatus) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['left', 'right']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={s.loadingText}>Cargando configuración...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12" />
            <Path d="M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>Configuración</Text>
          <Text style={s.headerSub}>Administrador General</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Estado del djangue */}
        <View style={s.section}>
          <View style={s.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>Estado del Djangue</Text>
              <Text style={s.statusText}>
                {status === 'active' ? '✅ Activo' : '⏸️ Pausado'}
              </Text>
            </View>
            <Switch
              value={status === 'active'}
              onValueChange={pauseOrResume}
              trackColor={{ false: '#E7DCC3', true: '#C9A227' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Logo e identidad */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Identidad</Text>
          
          <TouchableOpacity style={s.logoUpload} onPress={pickImage} activeOpacity={0.8}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={s.logoPreview} contentFit="cover" />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>Toca para cambiar logo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={s.inputGroup}>
            <Text style={s.label}>Nombre *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Nombre del djangue"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Eslogan</Text>
            <TextInput
              style={s.input}
              value={slogan}
              onChangeText={setSlogan}
              placeholder="Eslogan del grupo"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Descripción</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción del djangue..."
              placeholderTextColor="rgba(16,32,43,0.3)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Configuración financiera */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Configuración Financiera</Text>

          {!canModifyFinancial && (
            <View style={s.warningBox}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
                <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <Line x1="12" y1="9" x2="12" y2="13" />
                <Line x1="12" y1="17" x2="12.01" y2="17" />
              </Svg>
              <Text style={s.warningText}>
                No puedes modificar cuota/frecuencia porque hay cotizaciones en curso
              </Text>
            </View>
          )}

          <View style={s.inputGroup}>
            <Text style={s.label}>Periodicidad</Text>
            <View style={s.frequencyGrid}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    s.frequencyBtn,
                    frequency === f.value && s.frequencyBtnActive,
                    !canModifyFinancial && s.frequencyBtnDisabled,
                  ]}
                  onPress={() => canModifyFinancial && setFrequency(f.value)}
                  activeOpacity={canModifyFinancial ? 0.7 : 1}
                  disabled={!canModifyFinancial}
                >
                  <Text style={[
                    s.frequencyLabel,
                    frequency === f.value && s.frequencyLabelActive,
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Cuota (XAF)</Text>
              <TextInput
                style={[s.input, !canModifyFinancial && s.inputDisabled]}
                value={quotaAmount}
                onChangeText={setQuotaAmount}
                keyboardType="numeric"
                editable={canModifyFinancial}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Max. Miembros</Text>
              <TextInput
                style={[s.input, !canModifyFinancial && s.inputDisabled]}
                value={maxMembers}
                onChangeText={setMaxMembers}
                keyboardType="numeric"
                editable={canModifyFinancial}
              />
            </View>
          </View>
        </View>

        {/* Sanciones y notificaciones */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sanciones y Notificaciones</Text>

          <View style={s.inputGroup}>
            <Text style={s.label}>% de Mora *</Text>
            <TextInput
              style={s.input}
              value={penaltyPercent}
              onChangeText={setPenaltyPercent}
              keyboardType="numeric"
            />
          </View>

          <View style={s.row}>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>1ra notif (días antes)</Text>
              <TextInput
                style={s.input}
                value={notificationDaysBefore}
                onChangeText={setNotificationDaysBefore}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Notifs diarias (últimos)</Text>
              <TextInput
                style={s.input}
                value={notificationFinalDays}
                onChangeText={setNotificationFinalDays}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={saveSettings}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={saving ? ['#9ca3af', '#6b7280'] : ['#C9A227', '#A8790F']}
            style={s.saveBtnGrad}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Guardar Cambios</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusText: { fontSize: 13, color: '#64748b', marginTop: 3 },
  logoUpload: { alignItems: 'center', justifyContent: 'center', height: 120 },
  logoPreview: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f1f5f9' },
  logoPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  logoPlaceholderText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'center', paddingHorizontal: 12 },
  inputGroup: { gap: 5 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  inputDisabled: { backgroundColor: '#f1f5f9', opacity: 0.6 },
  textArea: { height: 72, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row' },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyBtn: { flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#e2e8f0' },
  frequencyBtnActive: { backgroundColor: '#f0f1fe', borderColor: '#6366f1' },
  frequencyBtnDisabled: { opacity: 0.5 },
  frequencyLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  frequencyLabelActive: { color: '#6366f1', fontWeight: '700' },
  warningBox: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#fef9c3', borderRadius: 10, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 17 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGrad: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#6366f1', borderRadius: 14 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
