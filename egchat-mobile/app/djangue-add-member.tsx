/**
 * Mi Djangue — Agregar integrante
 * Solo responsable o secretario pueden agregar miembros.
 */
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { apiFetch } from '../src/api';

const initials = (name: string) =>
  name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

export default function DjangueAddMemberScreen() {
  const insets = useSafeAreaInsets();
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
    const token = await AsyncStorage.getItem('token');
    if (!token) return Alert.alert('No autenticado', 'Debes iniciar sesión.');
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
          <Text style={s.headerTitle}>Agregar Integrante</Text>
          <Text style={s.headerSub}>Busca por número de teléfono</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

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
              placeholder="+240 222..."
              placeholderTextColor="#94a3b8"
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
                <View style={[s.avatar, { backgroundColor: '#f0f1fe', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#6366f1' }}>{initials(preview.full_name)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{preview.full_name}</Text>
                <Text style={s.previewPhone}>{preview.phone}</Text>
              </View>
              <View style={s.foundBadge}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M20 6L9 17l-5-5"/>
                </Svg>
                <Text style={s.foundTxt}>Encontrado</Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={s.infoBox}>
            <View style={s.infoTitleRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round">
                <Circle cx="12" cy="12" r="10"/>
                <Path d="M12 16v-4M12 8h.01"/>
              </Svg>
              <Text style={s.infoTitle}>Cómo funciona</Text>
            </View>
            {[
              'El integrante debe tener cuenta en EGChat',
              'Se le asignará el siguiente número de turno',
              'Recibirá el fondo del grupo cuando sea su turno',
              'Solo el responsable puede agregar hasta el máximo',
            ].map((txt, i) => (
              <View key={i} style={s.infoItem}>
                <View style={s.infoDot} />
                <Text style={s.infoTxt}>{txt}</Text>
              </View>
            ))}
          </View>

          {/* Botón agregar */}
          <TouchableOpacity
            onPress={handleAdd}
            disabled={loading || !phone.trim()}
            activeOpacity={0.85}
            style={[s.addBtn, (!phone.trim() || loading) && { opacity: 0.5 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.addBtnTxt}>Agregar al Djangue</Text>
            )}
          </TouchableOpacity>
        </View>
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
  content: { flex: 1, padding: 16, gap: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#2d3561', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  searchBtn: { width: 52, backgroundColor: '#6366f1', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2d3561', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  previewName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  previewPhone: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  foundBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  foundTxt: { fontSize: 12, fontWeight: '700', color: '#10b981' },
  infoBox: { backgroundColor: '#2d3561', borderRadius: 14, padding: 16, gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  infoTxt: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 22 },
  addBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  addBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
