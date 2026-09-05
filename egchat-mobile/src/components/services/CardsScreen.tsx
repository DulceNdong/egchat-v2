// Pantalla Mis Tarjetas — paridad CardsScreen web
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
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
            {/* Escanear tarjeta */}
            <TouchableOpacity style={s.scanBtn} onPress={() => Alert.alert('Escanear tarjeta', 'Usa la cámara para capturar los datos de la tarjeta (próximamente).')}>
              <View style={s.iconWrap}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="7" width="20" height="14" rx="3" stroke="#3B7DD8" strokeWidth="1.8" fill="#EFF5FD"/>
                  <Circle cx="12" cy="14" r="3.5" stroke="#3B7DD8" strokeWidth="1.8"/>
                  <Path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round"/>
                  <Line x1="9" y1="14" x2="10.5" y2="14" stroke="#3B7DD8" strokeWidth="1.6" strokeLinecap="round"/>
                  <Line x1="13.5" y1="14" x2="15" y2="14" stroke="#3B7DD8" strokeWidth="1.6" strokeLinecap="round"/>
                </Svg>
              </View>
              <Text style={s.scanLabel}>Escanear tarjeta</Text>
              <Text style={s.scanSub}>Cámara → datos automáticos</Text>
            </TouchableOpacity>

            {/* Manual */}
            <TouchableOpacity style={s.manualBtn} onPress={() => setAddMode('manual')}>
              <View style={[s.iconWrap, { backgroundColor: '#E6F7F0' }]}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#2E9E6B" strokeWidth="1.8" fill="#F0FAF5"/>
                  <Rect x="2" y="9" width="20" height="3" fill="#2E9E6B" opacity="0.18"/>
                  <Rect x="4.5" y="13.5" width="5" height="3" rx="1" stroke="#2E9E6B" strokeWidth="1.4"/>
                  <Path d="M15.5 13.5 L19 10 L21 12 L17.5 15.5 Z" stroke="#2E9E6B" strokeWidth="1.4" strokeLinejoin="round"/>
                  <Line x1="15.5" y1="13.5" x2="14.5" y2="16.5" stroke="#2E9E6B" strokeWidth="1.4" strokeLinecap="round"/>
                </Svg>
              </View>
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
  scanBtn: { flex: 1, borderWidth: 1.5, borderColor: '#3B7DD8', borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#EFF5FD' },
  manualBtn: { flex: 1, borderWidth: 1.5, borderColor: '#2E9E6B', borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#F0FAF5' },
  iconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#DDEEFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  scanLabel: { fontSize: 12, fontWeight: '700', color: '#3B7DD8', marginTop: 2 },
  manualLabel: { fontSize: 12, fontWeight: '700', color: '#2E9E6B', marginTop: 2 },
  scanSub: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 3 },
  preview: { borderRadius: 12, padding: 16, marginBottom: 14 },
  previewSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  previewNum: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2, marginBottom: 10, fontFamily: 'monospace' },
});
