/**
 * Mi Djangue — Agregar integrante
 * Solo responsable o secretario pueden agregar miembros.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { apiFetch } from '../src/api';

const initials = (name: string) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

export default function DjangueAddMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ full_name: string; phone: string; avatar_url: string | null } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkUser = async () => {
    if (!phone.trim()) return;
    setChecking(true);
    setPreview(null);
    try {
      // Verificar si el usuario existe
      const res = await apiFetch('/api/auth/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (!res.exists) {
        Alert.alert('No encontrado', 'No hay ningún usuario con ese teléfono en EGChat.');
        return;
      }
      // Obtener info del usuario (si existe)
      const contacts = await apiFetch(`/api/contacts/search?q=${encodeURIComponent(phone.trim())}`);
      if (contacts && contacts.length > 0) {
        setPreview(contacts[0]);
      } else {
        setPreview({ full_name: 'Usuario EGChat', phone: phone.trim(), avatar_url: null });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleAdd = async () => {
    if (!phone.trim()) return Alert.alert('Teléfono requerido', 'Ingresa el teléfono del integrante.');
    setLoading(true);
    try {
      const result = await apiFetch(`/api/djangue/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      Alert.alert(
        '✅ Integrante agregado',
        `${result.user?.full_name || 'Usuario'} se unió al djangue.`,
        [{ text: 'Continuar', onPress: () => { setPhone(''); setPreview(null); } },
         { text: 'Volver', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo agregar el integrante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#1e1b4b', '#312e81']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12" />
              <Path d="M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Agregar Integrante</Text>
            <Text style={s.headerSub}>Busca por número de teléfono</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.content}>
          {/* Campo de búsqueda */}
          <View style={s.searchRow}>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+240 ..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={checkUser}
            />
            <TouchableOpacity
              onPress={checkUser}
              style={s.searchBtn}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                  <Circle cx="11" cy="11" r="8" />
                  <Line x1="21" y1="21" x2="16.65" y2="16.65" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>

          {/* Preview del usuario */}
          {preview && (
            <View style={s.previewCard}>
              {preview.avatar_url ? (
                <Image source={{ uri: preview.avatar_url }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, { backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{initials(preview.full_name)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{preview.full_name}</Text>
                <Text style={s.previewPhone}>{preview.phone}</Text>
              </View>
              <View style={s.foundBadge}>
                <Text style={s.foundTxt}>✓ Encontrado</Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>ℹ️ Cómo funciona</Text>
            <Text style={s.infoTxt}>
              • El integrante debe tener cuenta en EGChat{'\n'}
              • Se le asignará el siguiente número de turno{'\n'}
              • Recibirá el fondo del grupo cuando sea su turno{'\n'}
              • El responsable puede agregar hasta el máximo configurado
            </Text>
          </View>

          {/* Botón agregar */}
          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading || !phone.trim()}
            activeOpacity={0.85}
            style={{ borderRadius: 14, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={loading || !phone.trim() ? ['#374151', '#374151'] : ['#6366f1', '#4f46e5']}
              style={s.addBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.addBtnTxt}>Agregar al Djangue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  content: { flex: 1, padding: 16, gap: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#1e1b4b', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  searchBtn: { width: 52, backgroundColor: '#6366f1', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e1b4b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  previewName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  previewPhone: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  foundBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  foundTxt: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  infoBox: { backgroundColor: '#1e1b4b', borderRadius: 14, padding: 16, gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  infoTxt: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 22 },
  addBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  addBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
