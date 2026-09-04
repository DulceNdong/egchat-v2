/**
 * Mi Djangue — Panel del Administrador General
 * Crear y configurar nuevo djangue
 * VERSION: 2.0 - Con navegación automática y upload mejorado
 */
import React, { useState } from 'react';

console.log('🔄 [DJANGUE-CREATE] Versión 2.0 cargada - Con fixes de navegación y logo');
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { apiFetch, getToken, getApiBase } from '../src/api';

const FREQUENCIES = [
  { value: 'daily', label: 'Diario', icon: '📅' },
  { value: 'weekly', label: 'Semanal', icon: '📆' },
  { value: 'monthly', label: 'Mensual', icon: '🗓️' },
  { value: 'annual', label: 'Anual', icon: '📊' },
];

export default function DjangueAdminCreateScreen() {
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [frequency, setFrequency] = useState('monthly');
  const [quotaAmount, setQuotaAmount] = useState('500');
  const [maxMembers, setMaxMembers] = useState('12');
  const [penaltyPercent, setPenaltyPercent] = useState('10');
  const [notificationDaysBefore, setNotificationDaysBefore] = useState('10');
  const [notificationFinalDays, setNotificationFinalDays] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    console.log('📸 [PICK-IMAGE] Función llamada');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ [PICK-IMAGE] Permiso denegado');
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir el logo.');
      return;
    }

    console.log('✅ [PICK-IMAGE] Permiso concedido, abriendo selector...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('📷 [PICK-IMAGE] Resultado:', result);
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
      console.log('✅ [PICK-IMAGE] Logo seleccionado:', result.assets[0].uri);
    } else {
      console.log('❌ [PICK-IMAGE] Selección cancelada');
    }
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      setError('El nombre del djangue es obligatorio');
      return false;
    }
    if (Number(quotaAmount) <= 0) {
      setError('La cuota debe ser mayor a 0');
      return false;
    }
    if (Number(maxMembers) < 2) {
      setError('Debe haber al menos 2 miembros');
      return false;
    }
    if (Number(penaltyPercent) < 0 || Number(penaltyPercent) > 100) {
      setError('El porcentaje de mora debe estar entre 0 y 100');
      return false;
    }
    setError('');
    return true;
  };

  const createDjangue = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      // Subir logo si existe
      let logoUrl = null;
      if (logoUri) {
        console.log('📤 Subiendo logo:', logoUri);
        
        try {
          const formData = new FormData();
          const filename = logoUri.split('/').pop() || 'logo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('file', {
            uri: logoUri,
            name: filename,
            type,
          } as any);

          const token = await getToken();
          const baseUrl = getApiBase();
          
          const response = await fetch(`${baseUrl}/api/upload/djangue-logo`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const uploadRes = await response.json();
            logoUrl = uploadRes.url;
            console.log('✅ Logo subido:', logoUrl);
          } else {
            const errorText = await response.text();
            console.error('⚠️ Error subiendo logo:', errorText);
          }
        } catch (uploadError: any) {
          console.error('⚠️ Error subiendo logo:', uploadError);
          // Continuar sin logo si falla
        }
      }

      // Crear djangue
      const djangueData = {
        name: name.trim(),
        slogan: slogan.trim() || null,
        description: description.trim() || null,
        logo_url: logoUrl,
        frequency,
        quota_amount: Number(quotaAmount),
        max_members: Number(maxMembers),
        penalty_percent: Number(penaltyPercent),
        notification_days_before: Number(notificationDaysBefore),
        notification_final_days: Number(notificationFinalDays),
      };

      console.log('📝 Creando djangue:', djangueData);
      const response = await apiFetch('/api/djangue', {
        method: 'POST',
        body: JSON.stringify(djangueData),
      });

      console.log('✅ Djangue creado:', response);

      // Navegar inmediatamente sin Alert
      setLoading(false);
      
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        router.replace({ pathname: '/djangue-detail', params: { id: response.id } } as any);
      }, 100);

    } catch (e: any) {
      console.error('❌ Error creando djangue:', e);
      Alert.alert('Error', e.message || 'Error al crear el djangue');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient colors={['#C9A227', '#A8790F']} style={s.header}>
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
            <Text style={s.headerSub}>Panel del Administrador General</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Logo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Logo del Djangue</Text>
          <TouchableOpacity style={s.logoUpload} onPress={pickImage} activeOpacity={0.8}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={s.logoPreview} contentFit="cover" />
            ) : (
              <View style={s.logoPlaceholder}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none"
                  stroke="rgba(16,32,43,0.3)" strokeWidth={2} strokeLinecap="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx="12" cy="13" r="4" />
                </Svg>
                <Text style={s.logoPlaceholderText}>Toca para elegir</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Información básica */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Información Básica</Text>
          
          <View style={s.inputGroup}>
            <Text style={s.label}>Nombre del Djangue *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Djangue Familiar"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Eslogan</Text>
            <TextInput
              style={s.input}
              value={slogan}
              onChangeText={setSlogan}
              placeholder="Ej. Ahorrando juntos, cada quien en su turno"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Descripción</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el propósito de este djangue..."
              placeholderTextColor="rgba(16,32,43,0.3)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Configuración financiera */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Configuración Financiera</Text>

          <View style={s.inputGroup}>
            <Text style={s.label}>Periodicidad *</Text>
            <View style={s.frequencyGrid}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[s.frequencyBtn, frequency === f.value && s.frequencyBtnActive]}
                  onPress={() => setFrequency(f.value)}
                  activeOpacity={0.7}
                >
                  <Text style={s.frequencyEmoji}>{f.icon}</Text>
                  <Text style={[s.frequencyLabel, frequency === f.value && s.frequencyLabelActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.row}>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Cuota (XAF) *</Text>
              <TextInput
                style={s.input}
                value={quotaAmount}
                onChangeText={setQuotaAmount}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor="rgba(16,32,43,0.3)"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Max. Miembros *</Text>
              <TextInput
                style={s.input}
                value={maxMembers}
                onChangeText={setMaxMembers}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor="rgba(16,32,43,0.3)"
              />
            </View>
          </View>
        </View>

        {/* Configuración de sanciones y notificaciones */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Sanciones y Notificaciones</Text>

          <View style={s.inputGroup}>
            <Text style={s.label}>% de Mora para morosos *</Text>
            <TextInput
              style={s.input}
              value={penaltyPercent}
              onChangeText={setPenaltyPercent}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="rgba(16,32,43,0.3)"
            />
            <Text style={s.helpText}>
              Se aplicará este porcentaje sobre la cuota a quienes no paguen a tiempo
            </Text>
          </View>

          <View style={s.row}>
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>1ra notificación (días antes) *</Text>
              <TextInput
                style={s.input}
                value={notificationDaysBefore}
                onChangeText={setNotificationDaysBefore}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="rgba(16,32,43,0.3)"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[s.inputGroup, { flex: 1 }]}>
              <Text style={s.label}>Notifs diarias (últimos días) *</Text>
              <TextInput
                style={s.input}
                value={notificationFinalDays}
                onChangeText={setNotificationFinalDays}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor="rgba(16,32,43,0.3)"
              />
            </View>
          </View>

          <View style={s.infoBox}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
              stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M12 16v-4M12 8h.01" />
            </Svg>
            <Text style={s.infoText}>
              El secretario recibirá recordatorios automáticos para notificar a los integrantes
            </Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Botón crear */}
        <TouchableOpacity
          style={[s.createBtn, loading && s.createBtnDisabled]}
          onPress={createDjangue}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#6b7280'] : ['#C9A227', '#A8790F']}
            style={s.createBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.createBtnText}>Crear Djangue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#C9A227' },
  header: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 16, borderWidth: 1, borderColor: 'rgba(16,32,43,0.08)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#10202B', marginBottom: 4 },
  logoUpload: { alignItems: 'center', justifyContent: 'center', height: 140 },
  logoPreview: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E7DCC3' },
  logoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E7DCC3', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: 'rgba(16,32,43,0.12)', borderStyle: 'dashed' },
  logoPlaceholderText: { fontSize: 12, color: 'rgba(16,32,43,0.4)', fontWeight: '600' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#10202B' },
  input: { borderWidth: 1, borderColor: 'rgba(16,32,43,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#10202B', backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  helpText: { fontSize: 12, color: 'rgba(16,32,43,0.5)', marginTop: 4 },
  row: { flexDirection: 'row' },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  frequencyBtn: { flex: 1, minWidth: '45%', backgroundColor: '#E7DCC3', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent' },
  frequencyBtnActive: { backgroundColor: '#E7C766', borderColor: '#C9A227' },
  frequencyEmoji: { fontSize: 24 },
  frequencyLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(16,32,43,0.6)' },
  frequencyLabelActive: { color: '#10202B' },
  infoBox: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  infoText: { flex: 1, fontSize: 12, color: '#4f46e5', lineHeight: 18 },
  errorBox: { backgroundColor: '#F2DDD6', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(168,67,46,0.3)' },
  errorText: { fontSize: 13, color: '#A8432E', fontWeight: '600' },
  createBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
