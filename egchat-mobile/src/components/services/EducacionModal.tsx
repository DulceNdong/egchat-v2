// Módulo Educación — directorio centros escolares (paridad captura web)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  EDU_SCHOOLS, EDU_CITIES, EDU_TYPE_FILTERS, School,
} from '../../data/serviciosPublicos';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { PayMethodPicker } from './PublicModuleUI';

interface Props { visible: boolean; onClose: () => void; userBalance?: number; }

type Screen = 'home' | 'detail' | 'pay' | 'success';

const TYPE_LABEL: Record<School['type'], string> = {
  publica: 'Pública', privada: 'Privada', profesional: 'Profesional',
};

export const EducacionModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [city, setCity] = useState<string>('Malabo');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [selected, setSelected] = useState<School | null>(null);
  const [form, setForm] = useState({ student: '', ref: '', amount: '25000', payMethod: '' });
  const [balance, setBalance] = useState(userBalance);

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => {
    if (!visible) {
      setScreen('home'); setCity('Malabo'); setTypeFilter('todos');
      setSelected(null); setForm({ student: '', ref: '', amount: '25000', payMethod: '' });
    }
  }, [visible]);

  const filtered = EDU_SCHOOLS.filter(s =>
    s.city === city && (typeFilter === 'todos' || s.type === typeFilter)
  );

  const back = () => {
    if (screen === 'home') onClose();
    else if (screen === 'detail') setScreen('home');
    else if (screen === 'pay') setScreen('detail');
    else onClose();
  };

  const amount = parseInt(form.amount, 10) || 0;

  const fixedTop = screen === 'home' ? (
    <LinearGradient colors={['#4C1D95', '#6B5BD6']} style={s.banner}>
      <View style={s.bannerRow}>
        <View style={s.bannerIcon}><Text style={{ fontSize: 26 }}>🎓</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Educación</Text>
          <Text style={s.bannerSub}>Centros educativos · Guinea Ecuatorial</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityScroll} contentContainerStyle={s.cityRow}>
        {EDU_CITIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.cityChip, city === c && s.cityChipActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[s.cityChipText, city === c && s.cityChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  ) : undefined;

  return (
    <FinancialModuleShell
      visible={visible}
      title={screen === 'home' ? 'Educación' : selected?.name || 'Educación'}
      onBack={back}
      onClose={onClose}
      fixedTop={fixedTop}
      hideBack={screen === 'home'}
      centerTitle={screen === 'home'}
      onRefresh={screen === 'home' ? () => { setCity('Malabo'); setTypeFilter('todos'); } : undefined}
    >
      {screen === 'home' && (
        <View>
          <View style={s.sectionHead}>
            <Text style={s.sectionIcon}>🏫</Text>
            <Text style={s.sectionTitle}>Centros Escolares</Text>
          </View>
          <FilterChips
            options={EDU_TYPE_FILTERS.map(f => ({ id: f.id, label: f.label }))}
            value={typeFilter}
            onChange={setTypeFilter}
            activeColor="#6B5BD6"
          />
          {filtered.length === 0 ? (
            <Text style={s.empty}>No hay centros en {city} para este filtro.</Text>
          ) : filtered.map(school => (
            <TouchableOpacity
              key={school.id}
              style={s.schoolRow}
              onPress={() => { setSelected(school); setScreen('detail'); }}
              activeOpacity={0.75}
            >
              <View style={s.schoolIcon}><Text style={{ fontSize: 22 }}>🎓</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.schoolName}>{school.name}</Text>
                <Text style={s.schoolLevel}>· {school.level}</Text>
                <View style={s.tagRow}>
                  <Text style={s.tagBlue}>{TYPE_LABEL[school.type]}</Text>
                  <Text style={s.tagGray}>{school.modality}</Text>
                </View>
              </View>
              <View style={s.schoolRight}>
                <Text style={s.plazas}>{school.plazas} plazas</Text>
                <Text style={s.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'detail' && selected && (
        <View>
          <LinearGradient colors={['#4C1D95', '#6B5BD6']} style={s.detailBanner}>
            <Text style={s.detailTitle}>{selected.name}</Text>
            <Text style={s.detailSub}>{selected.city} · {selected.level}</Text>
          </LinearGradient>
          <View style={s.infoCard}>
            {([['Tipo', TYPE_LABEL[selected.type]], ['Modalidad', selected.modality], ['Plazas', `${selected.plazas}`], ['Teléfono', selected.phone]] as const).map(([l, v]) => (
              <View key={l} style={s.infoRow}>
                <Text style={s.infoLbl}>{l}</Text>
                <Text style={s.infoVal}>{v}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
            <Text style={s.callBtnText}>📞 Llamar al centro</Text>
          </TouchableOpacity>
          <PrimaryButton label="Pagar matrícula" onPress={() => setScreen('pay')} color="#6B5BD6" />
        </View>
      )}

      {screen === 'pay' && selected && (
        <View>
          <LinearGradient colors={['#4C1D95', '#6B5BD6']} style={s.detailBanner}>
            <Text style={s.detailTitle}>Pago — {selected.name}</Text>
          </LinearGradient>
          <FormField placeholder="Nombre del estudiante" value={form.student} onChangeText={v => setForm(p => ({ ...p, student: v }))} />
          <FormField placeholder="Número de referencia / matrícula" value={form.ref} onChangeText={v => setForm(p => ({ ...p, ref: v }))} />
          <FormField placeholder="Importe a pagar (XAF)" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} keyboardType="numeric" />
          <PayMethodPicker value={form.payMethod} onChange={v => setForm(p => ({ ...p, payMethod: v }))} accent="#6B5BD6" />
          <PrimaryButton
            label={`Pagar ${amount > 0 ? amount.toLocaleString() + ' XAF' : ''}`}
            onPress={() => { setBalance(b => b - amount); setScreen('success'); }}
            disabled={!form.student || !form.payMethod || amount > balance}
            color="#6B5BD6"
          />
        </View>
      )}

      {screen === 'success' && selected && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>Pago registrado</Text>
          <Text style={s.successSub}>{selected.name} — {amount.toLocaleString()} XAF</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color="#6B5BD6" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  banner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  bannerIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cityScroll: { marginHorizontal: -4 },
  cityRow: { gap: 6, paddingRight: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cityChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  cityChipText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  cityChipTextActive: { color: '#4C1D95' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  schoolIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF5FD', alignItems: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 13, fontWeight: '700', color: '#1A2B4A' },
  schoolLevel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tagBlue: { fontSize: 9, fontWeight: '600', color: '#1485EE', backgroundColor: '#EFF5FD', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  tagGray: { fontSize: 9, fontWeight: '600', color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  schoolRight: { alignItems: 'flex-end', gap: 4 },
  plazas: { fontSize: 11, color: '#9CA3AF' },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  empty: { textAlign: 'center', color: '#9CA3AF', padding: 24, fontSize: 13 },
  detailBanner: { borderRadius: 12, padding: 14, marginBottom: 14 },
  detailTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  detailSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLbl: { fontSize: 12, color: '#6B7280' },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#111827' },
  callBtn: { backgroundColor: '#EFF5FD', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  callBtnText: { color: '#1485EE', fontWeight: '700', fontSize: 13 },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 16 },
});
