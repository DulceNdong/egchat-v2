// Módulo Seguros — paridad ServiciosModules.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { INS_COMPANIES, INS_COLORS, InsCompany, InsProduct } from '../../data/serviciosFinancieros';
import { FinancialModuleShell } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type SgScreen = 'home' | 'company' | 'product' | 'docs' | 'apply' | 'success';

interface Props { visible: boolean; onClose: () => void; }

const FILTER_OPTS = [
  { id: 'all', label: 'Todos' }, { id: 'vida', label: 'Vida' }, { id: 'salud', label: 'Salud' },
  { id: 'auto', label: 'Vehículo' }, { id: 'hogar', label: 'Hogar' }, { id: 'viaje', label: 'Viaje' },
];

export const SegurosModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<SgScreen>('home');
  const [co, setCo] = useState<InsCompany | null>(null);
  const [prod, setProd] = useState<InsProduct | null>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ name: '', dni: '', phone: '', email: '', address: '', city: '' });
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (!visible) { setScreen('home'); setCo(null); setProd(null); setDocs({}); } }, [visible]);

  const allProds = INS_COMPANIES.flatMap(c => c.products.map(p => ({ ...p, co: c })));
  const filtered = filter === 'all' ? allProds : allProds.filter(p => p.type === filter);
  const reqDocs = prod?.docs || [];
  const doneCount = reqDocs.filter(d => docs[d]).length;
  const formOk = form.name && form.dni && form.phone && form.email;

  const back = () => {
    if (screen === 'home') onClose();
    else if (screen === 'company') setScreen('home');
    else if (screen === 'product') setScreen('company');
    else if (screen === 'docs') setScreen('product');
    else if (screen === 'apply') setScreen('docs');
    else setScreen('home');
  };

  const titles: Record<SgScreen, string> = {
    home: 'Seguros', company: co?.name || '', product: prod?.name || '',
    apply: 'Solicitar Seguro', docs: 'Documentos', success: 'Solicitud Enviada',
  };

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `${INS_COMPANIES.length} aseguradoras — Guinea Ecuatorial` : undefined}
      onBack={back}
      onClose={onClose}
      headerGradient={['#2E9E6B', '#1B7A52']}
      onRefresh={screen === 'home' ? () => setRefreshKey(k => k + 1) : undefined}
    >
      {screen === 'home' && (
        <View key={refreshKey}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
            {FILTER_OPTS.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[s.filterChip, filter === f.id && s.filterActive]}>
                <Text style={[s.filterText, filter === f.id && s.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtered.map((p, i) => (
            <TouchableOpacity key={i} style={s.prodCard} onPress={() => { setCo(p.co); setProd(p); setScreen('product'); }}>
              <View style={[s.prodIcon, { backgroundColor: (INS_COLORS[p.type] || '#2E9E6B') + '15' }]}>
                <Text>{p.type === 'viaje' ? '✈️' : p.type === 'auto' ? '🚗' : p.type === 'salud' ? '🏥' : '❤️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.prodName}>{p.name}</Text>
                <Text style={s.prodCo}>{p.co.name}</Text>
                <Text style={s.prodDesc} numberOfLines={2}>{p.desc}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.prodPrice}>{p.price}</Text>
                <Text style={s.prodCov}>{p.coverage}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <Text style={s.sectionLbl}>ASEGURADORAS</Text>
          <View style={s.insGrid}>
            {INS_COMPANIES.map(c => (
              <TouchableOpacity key={c.id} style={s.insCell} onPress={() => { setCo(c); setScreen('company'); }}>
                <LinearGradient colors={[c.color, c.color2]} style={s.insLogo}>
                  <Text style={s.insInit}>{c.initials}</Text>
                </LinearGradient>
                <Text style={s.insName} numberOfLines={2}>{c.name}</Text>
                <Text style={s.insCount}>{c.products.length} productos</Text>
                <View style={[s.insPill, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                  <Text style={[s.insPillText, { color: c.color }]}>{c.products.length} tipos</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {screen === 'company' && co && (
        <View>
          <View style={s.detailCard}>
            <LinearGradient colors={[co.color, co.color2]} style={s.coLogoBig}>
              <Text style={s.coInitBig}>{co.initials}</Text>
            </LinearGradient>
            <Text style={s.detailName}>{co.name}</Text>
            <Text style={s.detailDesc}>{co.desc}</Text>
          </View>
          {co.products.map(p => (
            <TouchableOpacity key={p.id} style={s.prodCard} onPress={() => { setProd(p); setScreen('product'); }}>
              <Text style={s.prodName}>{p.name}</Text>
              <Text style={s.prodPrice}>{p.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'product' && prod && co && (
        <View>
          <View style={s.detailCard}>
            <Text style={s.detailName}>{prod.name}</Text>
            <Text style={s.detailSub}>{co.name}</Text>
            <Text style={s.priceBig}>{prod.price}</Text>
            <Text style={s.detailDesc}>{prod.desc}</Text>
            <View style={[s.covBox, { backgroundColor: (INS_COLORS[prod.type] || '#2E9E6B') + '10' }]}>
              <Text style={s.covLbl}>Cobertura</Text>
              <Text style={[s.covVal, { color: INS_COLORS[prod.type] }]}>{prod.coverage}</Text>
            </View>
          </View>
          <PrimaryButton label="📋 Solicitar este seguro" onPress={() => setScreen('docs')} color="#2E9E6B" />
        </View>
      )}

      {screen === 'docs' && prod && (
        <View>
          <View style={s.docsBanner}>
            <Text style={s.docsTitle}>📎 Documentos requeridos</Text>
            <Text style={s.docsProg}>{doneCount}/{reqDocs.length} documentos</Text>
          </View>
          {reqDocs.map((doc, i) => (
            <View key={i} style={s.docRow}>
              <Text style={s.docName}>{doc}</Text>
              <TouchableOpacity
                style={[s.docBtn, docs[doc] && s.docBtnDone]}
                onPress={() => setDocs(p => ({ ...p, [doc]: !p[doc] }))}
              >
                <Text style={[s.docBtnText, docs[doc] && { color: '#2E9E6B' }]}>{docs[doc] ? '✓ Subido' : 'Subir'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <PrimaryButton
            label={doneCount === reqDocs.length ? 'Continuar → Datos personales' : 'Sube todos los documentos'}
            disabled={doneCount < reqDocs.length}
            onPress={() => setScreen('apply')}
            color="#2E9E6B"
          />
        </View>
      )}

      {screen === 'apply' && prod && (
        <View>
          {([['name', 'Nombre completo'], ['dni', 'DNI / Pasaporte'], ['phone', 'Teléfono'], ['email', 'Correo electrónico'], ['address', 'Dirección'], ['city', 'Ciudad / Barrio']] as const).map(([k, l]) => (
            <FormField key={k} placeholder={l} value={form[k]} onChangeText={v => setForm(p => ({ ...p, [k]: v }))} keyboardType={k === 'phone' ? 'phone-pad' : 'default'} />
          ))}
          <PrimaryButton label="✅ Enviar solicitud" disabled={!formOk} onPress={() => setScreen('success')} color="#2E9E6B" />
        </View>
      )}

      {screen === 'success' && (
        <View style={s.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={s.successTitle}>¡Solicitud enviada!</Text>
          <Text style={s.successSub}>{prod?.name} — {co?.name}</Text>
          <PrimaryButton label="Cerrar" onPress={onClose} color="#2E9E6B" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  filters: { marginBottom: 12, maxHeight: 36 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterActive: { backgroundColor: '#EEF2F7', borderColor: '#07C160' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#8A9BB5' },
  filterTextActive: { color: '#1A2B4A' },
  prodCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  prodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prodName: { fontSize: 14, fontWeight: '800', color: '#1A2B4A' },
  prodCo: { fontSize: 11, color: '#8A9BB5' },
  prodDesc: { fontSize: 12, color: '#5A7090', marginTop: 4 },
  prodPrice: { fontSize: 13, fontWeight: '800', color: '#07C160' },
  prodCov: { fontSize: 10, color: '#8A9BB5' },
  sectionLbl: { fontSize: 12, fontWeight: '700', color: '#8A9BB5', letterSpacing: 1, marginVertical: 12 },
  insGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insCell: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 4 },
  insLogo: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  insInit: { color: '#fff', fontSize: 14, fontWeight: '900' },
  insName: { fontSize: 13, fontWeight: '800', color: '#1A2B4A' },
  insCount: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  insPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  insPillText: { fontSize: 10, fontWeight: '700' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, alignItems: 'center' },
  coLogoBig: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  coInitBig: { color: '#fff', fontSize: 18, fontWeight: '900' },
  detailName: { fontSize: 18, fontWeight: '900', color: '#1A2B4A', textAlign: 'center' },
  detailSub: { fontSize: 11, color: '#8A9BB5', marginBottom: 8 },
  detailDesc: { fontSize: 12, color: '#5A7090', lineHeight: 18, textAlign: 'center' },
  priceBig: { fontSize: 28, fontWeight: '900', color: '#07C160', marginVertical: 8 },
  covBox: { borderRadius: 10, padding: 10, width: '100%', marginTop: 8 },
  covLbl: { fontSize: 11, color: '#8A9BB5' },
  covVal: { fontSize: 13, fontWeight: '700' },
  docsBanner: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 14 },
  docsTitle: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  docsProg: { fontSize: 11, color: '#3B82F6', marginTop: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  docName: { fontSize: 13, fontWeight: '600', color: '#1A2B4A', flex: 1 },
  docBtn: { backgroundColor: '#EFF5FD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  docBtnDone: { backgroundColor: '#F0FAF5' },
  docBtnText: { fontSize: 11, fontWeight: '700', color: '#3B7DD8' },
  success: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1A2B4A' },
  successSub: { fontSize: 13, color: '#8A9BB5', marginBottom: 16 },
});
