// Pantalla Mis Tarjetas — paridad CardsScreen web
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { GQBank } from '../../data/serviciosFinancieros';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type Card = { id: string; bank: string; type: string; number: string; holder: string; expiry: string; color: string };

export const CardsScreen = ({ bank }: { bank: GQBank }) => {
  const [cards, setCards] = useState<Card[]>([
    { id: 'c1', bank: bank.name, type: 'Débito', number: '4521', holder: 'USUARIO EGCHAT', expiry: '12/28', color: bank.color },
  ]);
  const [addMode, setAddMode] = useState<'none' | 'manual'>('none');
  const [form, setForm] = useState({ number: '', holder: '', expiry: '', cvv: '', type: 'Débito', bankName: bank.name });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const scanCard = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa la cámara para escanear tarjetas.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setAddMode('manual');
    Alert.alert(
      'Tarjeta capturada',
      'Por seguridad no guardamos la foto. Revisa e introduce los datos manualmente.',
    );
  };

  const addCard = () => {
    if (form.number.length >= 4 && form.holder && form.expiry) {
      setCards(p => [...p, {
        id: `c${Date.now()}`, bank: form.bankName || bank.name, type: form.type,
        number: form.number.slice(-4), holder: form.holder.toUpperCase(), expiry: form.expiry, color: bank.color,
      }]);
      setForm({ number: '', holder: '', expiry: '', cvv: '', type: 'Débito', bankName: bank.name });
      setAddMode('none');
    }
  };

  return (
    <View>
      {cards.map(c => (
        <LinearGradient key={c.id} colors={[c.color, c.color + 'bb']} style={s.cardVisual}>
          <View style={s.cardTop}>
            <Text style={s.cardBank}>{c.bank}</Text>
            <View style={s.cardTypeBadge}><Text style={s.cardTypeText}>{c.type}</Text></View>
          </View>
          <Text style={s.cardNumber}>•••• •••• •••• {c.number}</Text>
          <View style={s.cardBottom}>
            <View>
              <Text style={s.cardLbl}>TITULAR</Text>
              <Text style={s.cardVal}>{c.holder}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.cardLbl}>VENCE</Text>
              <Text style={s.cardVal}>{c.expiry}</Text>
            </View>
          </View>
        </LinearGradient>
      ))}

      {addMode === 'none' ? (
        <View style={s.addCard}>
          <Text style={s.addTitle}>Añadir nueva tarjeta</Text>
          <View style={s.addRow}>
            <TouchableOpacity style={s.scanBtn} onPress={scanCard}>
              <Text style={{ fontSize: 24 }}>📷</Text>
              <Text style={s.scanLabel}>Escanear tarjeta</Text>
              <Text style={s.scanSub}>Cámara → datos automáticos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.manualBtn} onPress={() => setAddMode('manual')}>
              <Text style={{ fontSize: 24 }}>✏️</Text>
              <Text style={s.manualLabel}>Manual</Text>
              <Text style={s.scanSub}>Introduce los datos</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.addCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={s.addTitle}>Datos de la tarjeta</Text>
            <TouchableOpacity onPress={() => setAddMode('none')}><Text style={{ color: '#9CA3AF', fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>
          <LinearGradient colors={[bank.color, bank.color + 'bb']} style={s.preview}>
            <Text style={s.previewSub}>{form.bankName || bank.name} — {form.type}</Text>
            <Text style={s.previewNum}>
              {form.number ? `•••• •••• •••• ${form.number.slice(-4)}` : '•••• •••• •••• ••••'}
            </Text>
            <View style={s.cardBottom}>
              <View>
                <Text style={s.cardLbl}>TITULAR</Text>
                <Text style={s.cardVal}>{form.holder || 'NOMBRE APELLIDO'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.cardLbl}>VENCE</Text>
                <Text style={s.cardVal}>{form.expiry || 'MM/AA'}</Text>
              </View>
            </View>
          </LinearGradient>
          <FormField placeholder="Número de tarjeta (16 dígitos)" value={form.number} onChangeText={v => setF('number', v)} keyboardType="numeric" />
          <FormField placeholder="Nombre del titular" value={form.holder} onChangeText={v => setF('holder', v)} />
          <FormField placeholder="Fecha de vencimiento (MM/AA)" value={form.expiry} onChangeText={v => setF('expiry', v)} />
          <FormField placeholder="CVV (3 dígitos)" value={form.cvv} onChangeText={v => setF('cvv', v)} keyboardType="numeric" />
          <PrimaryButton label="Añadir tarjeta" color={bank.color} disabled={!form.number || !form.holder || !form.expiry} onPress={addCard} />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  cardVisual: { borderRadius: 16, padding: 20, marginBottom: 10, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardBank: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  cardTypeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  cardTypeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardNumber: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 3, marginBottom: 16, fontFamily: 'monospace' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLbl: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  cardVal: { fontSize: 12, fontWeight: '700', color: '#fff' },
  addCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 6 },
  addTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12 },
  addRow: { flexDirection: 'row', gap: 10 },
  scanBtn: { flex: 1, borderWidth: 1.5, borderColor: '#3B7DD8', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#EFF5FD' },
  manualBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2E9E6B', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#F0FAF5' },
  scanLabel: { fontSize: 11, fontWeight: '700', color: '#3B7DD8', marginTop: 6 },
  manualLabel: { fontSize: 11, fontWeight: '700', color: '#2E9E6B', marginTop: 6 },
  scanSub: { fontSize: 9, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  preview: { borderRadius: 12, padding: 16, marginBottom: 14 },
  previewSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  previewNum: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2, marginBottom: 10, fontFamily: 'monospace' },
});
