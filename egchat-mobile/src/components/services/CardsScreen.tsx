// Pantalla Mis Tarjetas — tarjetas que el usuario declara.
//
// EGChat no recibe el listado de tarjetas de ningún banco, así que antes de
// esta pantalla no había ninguna tarjeta que enseñar. Ahora solo se guardan
// las que el usuario declara, con los 4 últimos dígitos y sin CVV: el número
// completo y el código de seguridad no se envían ni se almacenan en ningún lado.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { GQBank } from '../../data/serviciosFinancieros';
import { serviciosAPI } from '../../api';
import { toast } from '../Toast';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { useTranslation } from '../../context/LanguageContext';

type Card = { id: string; bank: string; type: string; number: string; holder: string; expiry: string; color: string };

export const CardsScreen = ({ bank, onCambios }: { bank: GQBank; onCambios?: () => void }) => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<Card[]>([]);
  const [addMode, setAddMode] = useState<'none' | 'manual'>('none');
  const [form, setForm] = useState({ number: '', holder: '', expiry: '', type: 'debit', ref: '' });
  const [sending, setSending] = useState(false);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const cargar = async () => {
    try {
      const all = await serviciosAPI.solicitudes('bancos');
      setCards(all.filter(o => o.service_type === 'tarjeta').map(o => ({
        id: o.order_ref,
        bank: o.payload?.banco || bank.name,
        type: o.payload?.tipo_tarjeta || 'debit',
        number: o.payload?.ultimos4 || '••••',
        holder: o.payload?.titular || '',
        expiry: o.payload?.vencimiento || '',
        color: bank.color,
      })));
    } catch {
      setCards([]);
    }
  };

  useEffect(() => { cargar(); }, [bank.id]);

  const scanCard = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('svcPermissionRequired'), t('svcCameraPermissionBody'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setAddMode('manual');
    Alert.alert(
      t('svcCardCaptured'),
      t('svcCardNoPhotoBody'),
    );
  };

  const addCard = async () => {
    if (sending) return;
    setSending(true);
    try {
      await serviciosAPI.solicitud({
        provider: 'bancos',
        tipo: 'tarjeta',
        referencia: bank.id,
        datos: {
          banco: bank.name,
          tipo_tarjeta: form.type,
          ultimos4: form.number.replace(/\D/g, '').slice(-4),
          vencimiento: form.expiry,
          titular: form.holder.toUpperCase(),
        },
        external_id: form.ref || `BAN-${bank.id}-tarjeta-${Date.now()}`,
      });
      setForm({ number: '', holder: '', expiry: '', type: 'debit', ref: `BAN-${bank.id}-tarjeta-${Date.now()}` });
      setAddMode('none');
      await cargar();
      onCambios?.();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar la tarjeta.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <Text style={s.intro}>
        Aquí solo aparecen las tarjetas que tú has declarado. EGChat no se conecta a los bancos
        para listarlas ni para comprobar que existan.
      </Text>
      {cards.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>No has declarado ninguna tarjeta.</Text>
        </View>
      )}
      {cards.map(c => (
        <LinearGradient key={c.id} colors={[c.color, c.color + 'bb']} style={s.cardVisual}>
          <View style={s.cardTop}>
            <Text style={s.cardBank}>{c.bank}</Text>
            <View style={s.cardTypeBadge}>
              <Text style={s.cardTypeText}>{c.type === 'credit' ? 'CRÉDITO' : 'DÉBITO'}</Text>
            </View>
          </View>
          <Text style={s.cardNumber}>•••• •••• •••• {c.number}</Text>
          <View style={s.cardBottom}>
            <View>
              <Text style={s.cardLbl}>{t('svcHolderUpper')}</Text>
              <Text style={s.cardVal}>{c.holder || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.cardLbl}>{t('svcExpiresUpper')}</Text>
              <Text style={s.cardVal}>{c.expiry || '—'}</Text>
            </View>
          </View>
        </LinearGradient>
      ))}

      {addMode === 'none' ? (
        <View style={s.addCard}>
          <Text style={s.addTitle}>{t('svcAddNewCard')}</Text>
          <View style={s.addRow}>
            <TouchableOpacity style={s.scanBtn} onPress={scanCard}>
              <View style={s.iconWrap}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="7" width="20" height="14" rx="3" stroke="#3B7DD8" strokeWidth="1.8" fill="#EFF5FD"/>
                  <Circle cx="12" cy="14" r="3.5" stroke="#3B7DD8" strokeWidth="1.8"/>
                  <Path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round"/>
                  <Line x1="9" y1="14" x2="10.5" y2="14" stroke="#3B7DD8" strokeWidth="1.6" strokeLinecap="round"/>
                  <Line x1="13.5" y1="14" x2="15" y2="14" stroke="#3B7DD8" strokeWidth="1.6" strokeLinecap="round"/>
                </Svg>
              </View>
              <Text style={s.scanLabel}>{t('svcScanCard')}</Text>
              <Text style={s.scanSub}>{t('svcCameraAutoFill')}</Text>
            </TouchableOpacity>

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
              <Text style={s.manualLabel}>{t('svcManual')}</Text>
              <Text style={s.scanSub}>{t('svcEnterData')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.addCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={s.addTitle}>{t('svcCardData')}</Text>
            <TouchableOpacity onPress={() => setAddMode('none')}><Text style={{ color: '#9CA3AF', fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>
          <LinearGradient colors={[bank.color, bank.color + 'bb']} style={s.preview}>
            <Text style={s.previewSub}>{bank.name} — {form.type === 'credit' ? 'CRÉDITO' : 'DÉBITO'}</Text>
            <Text style={s.previewNum}>
              {form.number ? `•••• •••• •••• ${form.number.replace(/\D/g, '').slice(-4)}` : '•••• •••• •••• ••••'}
            </Text>
            <View style={s.cardBottom}>
              <View>
                <Text style={s.cardLbl}>{t('svcHolderUpper')}</Text>
                <Text style={s.cardVal}>{form.holder ? form.holder.toUpperCase() : t('svcFullNameUpper')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.cardLbl}>{t('svcExpiresUpper')}</Text>
                <Text style={s.cardVal}>{form.expiry || t('svcMmYyUpper')}</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={s.typeRow}>
            {([['debit', 'Débito'], ['credit', 'Crédito']] as const).map(([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[s.typeChip, form.type === id && { borderColor: bank.color, backgroundColor: '#EFF5FD' }]}
                onPress={() => setF('type', id)}
              >
                <Text style={[s.typeChipText, form.type === id && { color: bank.color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField placeholder={t('svcCardNumberPh')} value={form.number} onChangeText={v => setF('number', v)} keyboardType="numeric" />
          <FormField placeholder={t('svcHolderNamePh')} value={form.holder} onChangeText={v => setF('holder', v)} />
          <FormField placeholder={t('svcExpiryDatePh')} value={form.expiry} onChangeText={v => setF('expiry', v)} />
          <Text style={s.privacyNote}>
            No pedimos el CVV y no guardamos el número completo: solo conservamos los 4 últimos
            dígitos para que reconozcas la tarjeta.
          </Text>
          <PrimaryButton
            label={sending ? 'Guardando…' : t('svcAddCard')}
            color={bank.color}
            disabled={form.number.replace(/\D/g, '').length < 4 || !form.holder || !form.expiry || sending}
            onPress={addCard}
          />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  intro: { fontSize: 11.5, color: '#8A9BB5', lineHeight: 16, marginBottom: 12 },
  empty: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB', padding: 18, marginBottom: 10 },
  emptyText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: '#F9FAFB' },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  privacyNote: { fontSize: 11, color: '#8A9BB5', lineHeight: 16, marginBottom: 12 },
});
