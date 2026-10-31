import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { ONLINE_STORES, STORE_CATEGORIES } from '../../data/serviciosDiarios';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { useTranslation } from '../../context/LanguageContext';

interface Props { visible: boolean; onClose: () => void; }

// Etiquetas de categorías de tiendas (valores de datos en español -> clave de traducción)
const STORE_CATEGORY_KEYS: Record<string, string> = {
  Todos: 'svcAll',
  Moda: 'svcCatFashion',
  'Electrónica': 'svcCatElectronics',
  Hogar: 'svcCatHome',
  Farmacia: 'svcCatPharmacy',
  'Librería': 'svcCatBookstore',
};

const STORE_CATEGORY_EMOJI: Record<string, string> = {
  'Electrónica': '📱',
  Moda: '👗',
  Hogar: '🏠',
  Farmacia: '💊',
};

export const TiendaModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [city, setCity] = useState('Malabo');
  const [category, setCategory] = useState<string>('Todos');

  useEffect(() => {
    if (!visible) { setCity('Malabo'); setCategory('Todos'); }
  }, [visible]);

  const filtered = ONLINE_STORES.filter(s =>
    (city === 'Todos' || s.ciudad === city) &&
    (category === 'Todos' || s.categoria === category)
  );

  const fixedTop = (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <FilterChips
        options={['Malabo', 'Bata', 'Ebebiyín', 'Mongomo', 'Todos'].map(c => ({ id: c, label: c === 'Todos' ? t('svcAll') : c }))}
        value={city} onChange={setCity} activeColor="#2E9E6B"
      />
      <FilterChips
        options={STORE_CATEGORIES.map(c => {
          const key = STORE_CATEGORY_KEYS[c] || '';
          const label = key ? `${STORE_CATEGORY_EMOJI[c] ? STORE_CATEGORY_EMOJI[c] + ' ' : ''}${t(key)}` : c;
          return { id: c, label };
        })}
        value={category} onChange={setCategory} activeColor="#065F46"
      />
    </View>
  );

  return (
    <FinancialModuleShell
      visible={visible}
      title={t('svcOnlineStore')}
      subtitle={`${ONLINE_STORES.length} ${t('svcStoresWord')} · ${t('svcEqGuinea')}`}
      onBack={onClose}
      onClose={onClose}
      centerTitle
      fixedTop={fixedTop}
      onRefresh={() => { setCity('Malabo'); setCategory('Todos'); }}
      headerGradient={['#065F46', '#00c8a0']}
    >
      <View style={st.grid}>
        {filtered.map(s => (
          <TouchableOpacity
            key={s.id}
            style={st.card}
            onPress={() => Alert.alert(s.nombre, `${s.categoria} · ${s.barrio}\n\n${t('svcBrandsLabel')}: ${s.marcas.join(', ')}`, [
              { text: t('close'), style: 'cancel' },
              { text: t('svcViewCatalog'), onPress: () => Alert.alert(t('svcCatalog'), `${t('svcExploringProducts')} ${s.nombre}...`) },
            ])}
            activeOpacity={0.85}
          >
            <View style={st.cardTop}>
              <View style={[st.iconBox, { backgroundColor: s.iconBg }]}><Text style={{ fontSize: 18 }}>{s.icon}</Text></View>
              <Text style={[st.catTag, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', color: s.catColor }]}>{s.categoria}</Text>
            </View>
            <Text style={st.name} numberOfLines={2}>{s.nombre}</Text>
            <Text style={st.meta}>📍 {s.barrio}</Text>
            <Text style={st.meta}>🕐 {s.horario}</Text>
            <View style={st.brands}>
              {s.marcas.slice(0, 3).map(b => (
                <Text key={b} style={st.brandTag}>{b}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catTag: { fontSize: 8, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  name: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 10, color: '#9CA3AF' },
  brands: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  brandTag: { backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: 8, fontWeight: '600', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
});
