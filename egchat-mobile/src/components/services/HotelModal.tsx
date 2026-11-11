import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOTELS, Hotel } from '../../data/serviciosDiarios';
import { serviciosAPI } from '../../api';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { useTranslation } from '../../context/LanguageContext';

type HotelScreen = 'list' | 'detail' | 'book' | 'ok';
interface Props { visible: boolean; onClose: () => void; }

const StarRow = ({ n }: { n: number }) => (
  <Text style={{ fontSize: 11, color: '#F59E0B' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</Text>
);

export const HotelModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [city, setCity] = useState('Malabo');
  const [view, setView] = useState<HotelScreen>('list');
  const [selected, setSelected] = useState<Hotel | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', checkin: '', checkout: '', guests: '1' });
  const [ref, setRef] = useState('');
  const [recibo, setRecibo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) { setView('list'); setCity('Malabo'); setSelected(null); setForm({ name: '', phone: '', checkin: '', checkout: '', guests: '1' }); }
  }, [visible]);

  const filtered = HOTELS.filter(h => city === 'Todos' || h.ciudad === city);
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // La reserva es una solicitud: el hotel confirma disponibilidad y total.
  // No multiplicamos el precio por un número de noches que no podemos validar.
  const enviar = async () => {
    if (!selected || sending) return;
    setSending(true);
    try {
      const res = await serviciosAPI.solicitud({
        provider: 'hoteles',
        tipo: 'reserva',
        referencia: selected.id,
        datos: {
          hotel: selected.nombre,
          cliente: form.name,
          telefono: form.phone,
          entrada: form.checkin,
          salida: form.checkout || null,
          huespedes: parseInt(form.guests, 10) || 1,
          precio_noche_referencia: selected.precio,
        },
        external_id: ref || `HOT-${selected.id}-${Date.now()}`,
      });
      setRecibo(res.solicitudId);
      setView('ok');
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || 'No se pudo registrar la reserva.');
    } finally {
      setSending(false);
    }
  };

  const fixedTop = (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <FilterChips
        options={['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Todos'].map(c => ({ id: c, label: c === 'Todos' ? t('svcAll') : c }))}
        value={city} onChange={setCity} activeColor="#1485EE"
      />
    </View>
  );

  return (
    <FinancialModuleShell
      visible={visible}
      title={t('hotel')}
      subtitle={`${HOTELS.length} ${t('svcHotelsWord')} · ${t('svcEqGuinea')}`}
      onBack={() => view === 'list' ? onClose() : setView('list')}
      onClose={onClose}
      centerTitle
      hideBack={view === 'ok'}
      fixedTop={view !== 'book' && view !== 'ok' ? fixedTop : undefined}
      onRefresh={() => { setView('list'); setCity('Malabo'); }}
      headerGradient={['#1B3A6B', '#00b4e6']}
    >
      {view === 'list' && (
        <View style={st.grid}>
          {filtered.map(h => (
            <TouchableOpacity key={h.id} style={st.card} onPress={() => { setSelected(h); setView('detail'); }} activeOpacity={0.85}>
              <View style={st.cardTop}>
                <View style={[st.iconBox, { backgroundColor: '#EFF5FD' }]}><Text>🏨</Text></View>
                <StarRow n={h.estrellas} />
              </View>
              <Text style={st.name}>{h.nombre}</Text>
              <Text style={st.meta}>📍 {h.barrio}</Text>
              <View style={st.priceRow}>
                <Text style={st.priceLbl}>{t('svcFromLabel')}</Text>
                <Text style={st.price}>{h.precio.toLocaleString()} XAF</Text>
                <Text style={st.priceLbl}>{t('svcPerNight')} · orientativo</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view === 'detail' && selected && (
        <View>
          <LinearGradient colors={['#1B3A6B', '#00b4e6']} style={st.banner}>
            <Text style={st.bannerTitle}>{selected.nombre}</Text>
            <StarRow n={selected.estrellas} />
            <Text style={st.bannerSub}>📍 {selected.barrio}, {selected.ciudad}</Text>
          </LinearGradient>
          <Text style={st.sectionLbl}>{t('svcIncludedServices')}</Text>
          {selected.amenities.map(a => (
            <View key={a} style={st.amenityRow}><Text style={st.amenityDot}>●</Text><Text style={st.meta}>{a}</Text></View>
          ))}
          <Text style={st.priceBig}>{selected.precio.toLocaleString()} XAF <Text style={st.priceLbl}>{t('svcPerNightSlash')}</Text></Text>
          <View style={st.rowBtns}>
            <TouchableOpacity style={[st.actBtn, { backgroundColor: '#EFF5FD', flex: 1 }]} onPress={() => Linking.openURL(`tel:${selected.telefono}`)}>
              <Text style={[st.actText, { color: '#1485EE' }]}>{t('svcCallPhone')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.actBtn, { backgroundColor: '#1485EE', flex: 1 }]} onPress={() => { setRef(`HOT-${selected.id}-${Date.now()}`); setView('book'); }}>
              <Text style={[st.actText, { color: '#fff' }]}>{t('svcBookNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {view === 'book' && selected && (
        <View>
          <FormField placeholder={t('name')} value={form.name} onChangeText={v => setF('name', v)} />
          <FormField placeholder={t('phone')} value={form.phone} onChangeText={v => setF('phone', v)} keyboardType="phone-pad" />
          <FormField placeholder={t('svcCheckInPh')} value={form.checkin} onChangeText={v => setF('checkin', v)} />
          <FormField placeholder={t('svcCheckOutPh')} value={form.checkout} onChangeText={v => setF('checkout', v)} />
          <FormField placeholder={t('svcGuests')} value={form.guests} onChangeText={v => setF('guests', v)} keyboardType="numeric" />
          <View style={st.summaryBox}>
            <Text style={st.meta}>{selected.nombre}</Text>
            <Text style={st.priceBig}>{selected.precio.toLocaleString()} XAF <Text style={st.priceLbl}>{t('svcPerNightSlash')}</Text></Text>
            <Text style={st.notice}>
              Precio de referencia del directorio. El hotel confirma la disponibilidad y el total
              de las noches; aquí no se reserva ni se cobra nada.
            </Text>
          </View>
          <PrimaryButton
            label={sending ? 'Enviando…' : t('svcConfirmBooking')}
            onPress={enviar}
            color="#1485EE"
            disabled={!form.name || !form.phone || !form.checkin || sending}
          />
        </View>
      )}

      {view === 'ok' && selected && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>📨</Text>
          <Text style={st.successTitle}>Solicitud de reserva</Text>
          <Text style={st.successSub}>{selected.nombre}</Text>
          <Text style={st.successSub}>{form.checkin} → {form.checkout || t('svcToConfirm')}</Text>
          <Text style={st.refText}>{recibo}</Text>
          <Text style={st.notice}>El hotel recibirá tu solicitud y confirmara la reserva y el importe.</Text>
          <PrimaryButton label={t('svcMoreHotels')} onPress={() => { setView('list'); setSelected(null); setRecibo(''); }} color="#1485EE" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 10, color: '#9CA3AF' },
  priceRow: { marginTop: 8 },
  priceLbl: { fontSize: 9, color: '#9CA3AF' },
  price: { fontSize: 14, fontWeight: '900', color: '#1B3A6B' },
  banner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  sectionLbl: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
  amenityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  amenityDot: { color: '#1485EE', fontSize: 8 },
  priceBig: { fontSize: 20, fontWeight: '900', color: '#1B3A6B', marginVertical: 12 },
  rowBtns: { flexDirection: 'row', gap: 8 },
  actBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  actText: { fontSize: 12, fontWeight: '700' },
  summaryBox: { backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14, marginBottom: 12 },
  notice: { fontSize: 11, color: '#5A7090', lineHeight: 16, marginTop: 6 },
  refText: { fontSize: 12, fontWeight: '800', color: '#1A2B4A', backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
