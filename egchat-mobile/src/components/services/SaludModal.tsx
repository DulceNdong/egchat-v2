// Módulo Salud — paridad ServiciosModules.tsx web
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Linking, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saludAPI } from '../../api';
import {
  HOSPITALS, PHARMACIES, MEDICAMENTOS, CITA_SPECIALTIES,
  Hospital, Pharmacy, Medicamento,
} from '../../data/serviciosPublicos';
import { FinancialModuleShell, FilterChips, SegmentTabs } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { SearchField } from './PublicModuleUI';

type SaludTab = 'hospitales' | 'farmacias' | 'cita' | 'urgencias';
type MedScreen = 'search' | 'cart' | 'delivery' | 'ok';

interface Props { visible: boolean; onClose: () => void; userBalance?: number; }

const TAB_OPTS = [
  { id: 'hospitales', label: 'Hospitales' },
  { id: 'farmacias', label: 'Farmacias' },
  { id: 'cita', label: 'Cita' },
  { id: 'urgencias', label: 'Urgencias' },
];

const openRoute = (lat?: number, lng?: number, name?: string) => {
  if (lat != null && lng != null) {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name || '')}`);
  }
};

export const SaludModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [tab, setTab] = useState<SaludTab>('hospitales');
  const [cityFilter, setCityFilter] = useState('Malabo');
  const [search, setSearch] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>(HOSPITALS);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(PHARMACIES);
  const [loading, setLoading] = useState(false);
  const [citaOk, setCitaOk] = useState(false);
  const [citaForm, setCitaForm] = useState({ name: '', phone: '', date: '', specialty: '', hospital: '', notes: '' });
  const [balance, setBalance] = useState(userBalance);

  // Medicamentos sub-modal
  const [showMed, setShowMed] = useState(false);
  const [medScreen, setMedScreen] = useState<MedScreen>('search');
  const [medSearch, setMedSearch] = useState('');
  const [medCart, setMedCart] = useState<Array<{ id: string; name: string; qty: number; price: number }>>([]);
  const [deliveryForm, setDeliveryForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [pharmCity, setPharmCity] = useState('Malabo');
  const [pharmBarrio, setPharmBarrio] = useState('Todos');
  const [selectedPharm, setSelectedPharm] = useState<string | null>(null);

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => {
    if (!visible) {
      setTab('hospitales'); setCityFilter('Malabo'); setSearch('');
      setCitaOk(false); setCitaForm({ name: '', phone: '', date: '', specialty: '', hospital: '', notes: '' });
      setShowMed(false); setMedScreen('search'); setMedSearch(''); setMedCart([]);
      setDeliveryForm({ name: '', phone: '', address: '', notes: '' });
      setPharmCity('Malabo'); setPharmBarrio('Todos'); setSelectedPharm(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const h = await saludAPI.getHospitals();
        if (h?.length) setHospitals(h);
      } catch { /* local data */ }
      try {
        const f = await saludAPI.getPharmacies();
        if (f?.length) setPharmacies(f);
      } catch { /* local data */ }
    })();
  }, [visible]);

  const filteredHospitals = hospitals.filter(h =>
    (cityFilter === 'Todos' || h.city === cityFilter) &&
    (!search || h.name.toLowerCase().includes(search.toLowerCase()) || h.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase())))
  );

  const filteredPharmacies = pharmacies.filter(f =>
    (pharmCity === 'Todos' || f.city === pharmCity) &&
    (pharmBarrio === 'Todos' || f.barrio === pharmBarrio) &&
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.barrio.toLowerCase().includes(search.toLowerCase()))
  );

  const pharmBarrios = ['Todos', ...Array.from(new Set(
    pharmacies.filter(f => pharmCity === 'Todos' || f.city === pharmCity).map(f => f.barrio)
  ))];

  const pharmByBarrio = filteredPharmacies.reduce<Record<string, Pharmacy[]>>((acc, f) => {
    (acc[f.barrio] = acc[f.barrio] || []).push(f);
    return acc;
  }, {});

  const medResults = medSearch.length >= 2
    ? MEDICAMENTOS.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()) || m.cat.toLowerCase().includes(medSearch.toLowerCase()))
    : [];

  const cartTotal = medCart.reduce((s, i) => s + i.price * i.qty, 0);
  const setCF = (k: string, v: string) => setCitaForm(p => ({ ...p, [k]: v }));
  const setDF = (k: string, v: string) => setDeliveryForm(p => ({ ...p, [k]: v }));

  const addToCart = (m: Medicamento) => {
    setMedCart(p => {
      const ex = p.find(i => i.id === m.id);
      return ex ? p.map(i => i.id === m.id ? { ...i, qty: i.qty + 1 } : i) : [...p, { id: m.id, name: m.name, qty: 1, price: m.price }];
    });
  };

  const refresh = () => {
    setSearch(''); setCityFilter('Malabo'); setPharmCity('Malabo'); setPharmBarrio('Todos'); setSelectedPharm(null); setTab('hospitales');
    setHospitals(HOSPITALS); setPharmacies(PHARMACIES);
  };

  const fixedTop = (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SegmentTabs options={TAB_OPTS} value={tab} onChange={id => setTab(id as SaludTab)} activeColor="#C0392B" />
      {(tab === 'hospitales' || tab === 'farmacias') && (
        <SearchField placeholder={tab === 'hospitales' ? 'Buscar hospital o especialidad...' : 'Buscar farmacia...'} value={search} onChangeText={setSearch} />
      )}
      {tab === 'hospitales' && (
        <FilterChips
          options={[{ id: 'Malabo', label: 'Malabo' }, { id: 'Bata', label: 'Bata' }, { id: 'Todos', label: 'Todos' }]}
          value={cityFilter}
          onChange={setCityFilter}
          activeColor="#C0392B"
        />
      )}
      {tab === 'farmacias' && (
        <>
          <FilterChips
            options={[{ id: 'Malabo', label: 'Malabo' }, { id: 'Bata', label: 'Bata' }, { id: 'Todos', label: 'Todos' }]}
            value={pharmCity}
            onChange={v => { setPharmCity(v); setPharmBarrio('Todos'); setSelectedPharm(null); }}
            activeColor="#2E9E6B"
          />
          <FilterChips
            options={pharmBarrios.map(b => ({ id: b, label: b }))}
            value={pharmBarrio}
            onChange={v => { setPharmBarrio(v); setSelectedPharm(null); }}
            activeColor="#2E9E6B"
          />
        </>
      )}
    </View>
  );

  return (
    <>
      <FinancialModuleShell
        visible={visible}
        title="Salud"
        subtitle={`Guinea Ecuatorial — ${hospitals.length} centros — ${pharmacies.length} farmacias`}
        onBack={onClose}
        onClose={onClose}
        fixedTop={fixedTop}
        onRefresh={refresh}
      >
        {loading && <ActivityIndicator color="#C0392B" style={{ marginVertical: 12 }} />}

        {tab === 'hospitales' && filteredHospitals.map(h => (
          <View key={h.id} style={s.card}>
            <View style={s.cardBody}>
              <Text style={s.cardIcon}>🏥</Text>
              <View style={{ flex: 1 }}>
                <View style={s.cardTop}>
                  <Text style={s.cardName}>{h.name}</Text>
                  <View style={s.ratingRow}>
                    <Text style={s.ratingStar}>★</Text>
                    <Text style={s.rating}>{h.rating}</Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>📍 {h.address} — {h.city}</Text>
                <View style={s.tagRow}>
                  {h.emergency && <Text style={s.tagUrg}>🚨 Urgencias 24h</Text>}
                  <Text style={s.tagGray}>{h.beds} camas</Text>
                  <Text style={s.tagGray}>{h.doctors} médicos</Text>
                </View>
                <View style={s.tagRow}>
                  {h.specialties?.slice(0, 3).map(sp => <Text key={sp} style={s.tagRed}>{sp}</Text>)}
                </View>
              </View>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => openRoute(h.lat, h.lng, h.name)}>
                <Text style={[s.actionText, { color: '#C0392B' }]}>🗺️ Ver ruta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#F0FAF5' }]} onPress={() => { setCF('hospital', h.name); setTab('cita'); }}>
                <Text style={[s.actionText, { color: '#2E9E6B' }]}>📅 Pedir cita</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EFF5FD' }]} onPress={() => Linking.openURL(`tel:${h.phone}`)}>
                <Text style={[s.actionText, { color: '#1485EE' }]}>📞 Llamar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {tab === 'farmacias' && (
          <View>
            <TouchableOpacity style={s.medBanner} onPress={() => { setShowMed(true); setMedScreen('search'); }}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.medBannerTitle}>Buscar medicamentos</Text>
                <Text style={s.medBannerSub}>Busca, pide y recibe en casa — {MEDICAMENTOS.length} medicamentos</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
            {Object.keys(pharmByBarrio).length === 0 && (
              <Text style={s.medHint}>Sin farmacias en esta zona</Text>
            )}
            {Object.entries(pharmByBarrio).map(([barrio, list]) => (
              <View key={barrio} style={{ marginBottom: 14 }}>
                <Text style={s.barrioHeader}>📍 {barrio.toUpperCase()} — {list.length} FARMACIA{list.length > 1 ? 'S' : ''}</Text>
                <View style={s.pharmGrid}>
                  {list.map(f => {
                    const expanded = selectedPharm === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[s.pharmGridCard, expanded && s.pharmGridCardActive]}
                        onPress={() => setSelectedPharm(expanded ? null : f.id)}
                        activeOpacity={0.85}
                      >
                        <View style={s.pharmTop}>
                          <Text style={{ fontSize: 16 }}>💊</Text>
                          {f.emergency && <Text style={s.tagUrg}>24h</Text>}
                        </View>
                        <Text style={s.pharmName} numberOfLines={2}>{f.name}</Text>
                        <Text style={s.pharmSchedule}>{f.schedule}</Text>
                        <View style={s.serviceTags}>
                          {f.services.slice(0, 2).map(sv => (
                            <Text key={sv} style={s.serviceTag}>{sv}</Text>
                          ))}
                        </View>
                        {expanded && (
                          <View style={s.pharmExpand}>
                            <Text style={s.cardMeta}>📍 {f.address}</Text>
                            <Text style={s.cardMeta}>🕐 {f.schedule}</Text>
                            <View style={s.pharmExpandActions}>
                              <TouchableOpacity style={[s.pharmMiniBtn, { backgroundColor: '#EFF5FD' }]} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.address + ', ' + f.city)}`)}>
                                <Text style={[s.actionText, { color: '#1485EE' }]}>🗺️ Ruta</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[s.pharmMiniBtn, { backgroundColor: '#F0FAF5' }]} onPress={() => Linking.openURL(`tel:${f.phone}`)}>
                                <Text style={[s.actionText, { color: '#2E9E6B' }]}>📞 Llamar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'cita' && !citaOk && (
          <View>
            <View style={s.citaInfo}>
              <Text style={s.citaInfoTitle}>📅 Solicitar cita médica</Text>
              <Text style={s.citaInfoSub}>Recibirás confirmación por teléfono en 24h</Text>
            </View>
            <Text style={s.lbl}>Hospital / Clínica</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {hospitals.map(h => (
                <TouchableOpacity key={h.id} style={[s.hospChip, citaForm.hospital === h.name && s.hospChipActive]} onPress={() => setCF('hospital', h.name)}>
                  <Text style={[s.hospChipText, citaForm.hospital === h.name && { color: '#fff' }]} numberOfLines={1}>{h.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.lbl}>Especialidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {CITA_SPECIALTIES.map(sp => (
                <TouchableOpacity key={sp} style={[s.hospChip, citaForm.specialty === sp && s.hospChipActive]} onPress={() => setCF('specialty', sp)}>
                  <Text style={[s.hospChipText, citaForm.specialty === sp && { color: '#fff' }]}>{sp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FormField placeholder="Nombre completo" value={citaForm.name} onChangeText={v => setCF('name', v)} />
            <FormField placeholder="Teléfono de contacto" value={citaForm.phone} onChangeText={v => setCF('phone', v)} keyboardType="phone-pad" />
            <FormField placeholder="Fecha preferida (DD/MM/AAAA)" value={citaForm.date} onChangeText={v => setCF('date', v)} />
            <FormField placeholder="Síntomas o notas (opcional)" value={citaForm.notes} onChangeText={v => setCF('notes', v)} />
            <PrimaryButton
              label="Solicitar cita"
              onPress={async () => {
                if (!citaForm.name || !citaForm.phone || !citaForm.hospital || !citaForm.specialty) return;
                setLoading(true);
                try { await saludAPI.requestCita({ hospitalId: citaForm.hospital, especialidad: citaForm.specialty, fecha: citaForm.date, motivo: citaForm.notes }); } catch { /* demo */ }
                setLoading(false);
                setCitaOk(true);
              }}
              disabled={!citaForm.name || !citaForm.phone || !citaForm.hospital || !citaForm.specialty || loading}
              color="#C0392B"
            />
          </View>
        )}

        {tab === 'cita' && citaOk && (
          <View style={s.success}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={s.successTitle}>¡Cita solicitada!</Text>
            <Text style={s.successSub}>{citaForm.hospital} — {citaForm.specialty}</Text>
            <View style={s.summaryBox}>
              {([['Paciente', citaForm.name], ['Teléfono', citaForm.phone], ['Fecha', citaForm.date || 'A confirmar']] as const).map(([l, v]) => (
                <View key={l} style={s.summaryRow}><Text style={s.summaryLbl}>{l}</Text><Text style={s.summaryVal}>{v}</Text></View>
              ))}
            </View>
            <PrimaryButton label="Nueva cita" onPress={() => { setCitaOk(false); setCitaForm({ name: '', phone: '', date: '', specialty: '', hospital: '', notes: '' }); }} color="#C0392B" />
          </View>
        )}

        {tab === 'urgencias' && (
          <View>
            <LinearGradient colors={['#C0392B', '#E74C3C']} style={s.urgBanner}>
              <Text style={s.urgTitle}>🚨 Urgencias</Text>
              <Text style={s.urgSub}>Centros con urgencias 24h en Guinea Ecuatorial</Text>
              <TouchableOpacity style={s.urgCall} onPress={() => Linking.openURL('tel:112')}>
                <Text style={s.urgCallText}>📞 Llamar al 112 — Emergencias</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.urgCall2} onPress={() => Linking.openURL('tel:+240333097000')}>
                <Text style={s.urgCallText2}>🏥 Hospital General Malabo: +240 333 09 70 00</Text>
              </TouchableOpacity>
            </LinearGradient>
            {hospitals.filter(h => h.emergency).map(h => (
              <View key={h.id} style={s.urgRow}>
                <Text style={{ fontSize: 20 }}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{h.name}</Text>
                  <Text style={s.cardMeta}>{h.city} — {h.schedule}</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${h.phone}`)}>
                  <Text style={{ fontSize: 18 }}>📞</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </FinancialModuleShell>

      {/* Sub-modal medicamentos */}
      <Modal visible={showMed} transparent animationType="slide" onRequestClose={() => setShowMed(false)}>
        <Pressable style={s.medOverlay} onPress={() => setShowMed(false)}>
          <Pressable style={s.medSheet} onPress={() => {}}>
            <View style={s.medHeader}>
              <TouchableOpacity onPress={() => medScreen === 'search' ? setShowMed(false) : setMedScreen('search')}>
                <Text style={s.medBack}>←</Text>
              </TouchableOpacity>
              <Text style={s.medTitle}>
                {medScreen === 'search' ? 'Buscar medicamentos' : medScreen === 'cart' ? `Carrito (${medCart.length})` : medScreen === 'delivery' ? 'Datos de entrega' : 'Pedido confirmado'}
              </Text>
              {medScreen === 'search' && medCart.length > 0 && (
                <TouchableOpacity style={s.cartBtn} onPress={() => setMedScreen('cart')}>
                  <Text style={s.cartBtnText}>🛒 {medCart.length}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowMed(false)}><Text style={s.medBack}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {medScreen === 'search' && (
                <View>
                  <FormField placeholder="Nombre del medicamento..." value={medSearch} onChangeText={setMedSearch} />
                  {medSearch.length < 2 && <Text style={s.medHint}>Escribe al menos 2 letras para buscar</Text>}
                  {medResults.map(m => (
                    <View key={m.id} style={s.medRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardName}>{m.name}</Text>
                        <Text style={s.cardMeta}>{m.cat} — {m.price.toLocaleString()} XAF</Text>
                        {m.requiereReceta && <Text style={s.receta}>📋 Receta</Text>}
                      </View>
                      {m.stock ? (
                        <TouchableOpacity style={s.addBtn} onPress={() => addToCart(m)}>
                          <Text style={s.addBtnText}>{medCart.find(i => i.id === m.id) ? `✓ (${medCart.find(i => i.id === m.id)?.qty})` : '+ Añadir'}</Text>
                        </TouchableOpacity>
                      ) : <Text style={s.sinStock}>Sin stock</Text>}
                    </View>
                  ))}
                </View>
              )}
              {medScreen === 'cart' && (
                <View>
                  {medCart.map(item => (
                    <View key={item.id} style={s.cartRow}>
                      <Text style={{ flex: 1 }}>{item.name} x{item.qty}</Text>
                      <Text style={s.cartPrice}>{(item.price * item.qty).toLocaleString()} XAF</Text>
                    </View>
                  ))}
                  <Text style={s.cartTotal}>Total: {cartTotal.toLocaleString()} XAF</Text>
                  <PrimaryButton label="Continuar → Datos de entrega" onPress={() => setMedScreen('delivery')} color="#2E9E6B" />
                </View>
              )}
              {medScreen === 'delivery' && (
                <View>
                  <FormField placeholder="Nombre completo" value={deliveryForm.name} onChangeText={v => setDF('name', v)} />
                  <FormField placeholder="Teléfono" value={deliveryForm.phone} onChangeText={v => setDF('phone', v)} keyboardType="phone-pad" />
                  <FormField placeholder="Dirección de entrega" value={deliveryForm.address} onChangeText={v => setDF('address', v)} />
                  <PrimaryButton
                    label={`Confirmar pedido — ${cartTotal.toLocaleString()} XAF`}
                    onPress={async () => {
                      if (!deliveryForm.name || !deliveryForm.phone || !deliveryForm.address) return;
                      try { await saludAPI.orderMeds({ farmaciaId: '1', direccion: deliveryForm.address, items: medCart }); } catch { /* demo */ }
                      setBalance(b => b - cartTotal);
                      setMedScreen('ok');
                    }}
                    disabled={!deliveryForm.name || !deliveryForm.phone || !deliveryForm.address || cartTotal > balance}
                    color="#2E9E6B"
                  />
                </View>
              )}
              {medScreen === 'ok' && (
                <View style={s.success}>
                  <Text style={{ fontSize: 48 }}>✅</Text>
                  <Text style={s.successTitle}>¡Pedido confirmado!</Text>
                  <Text style={s.successSub}>Entrega estimada: 2-4 horas</Text>
                  <PrimaryButton label="Cerrar" onPress={() => { setShowMed(false); setMedCart([]); setMedSearch(''); setMedScreen('search'); }} color="#2E9E6B" />
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingStar: { fontSize: 11, color: '#F59E0B' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5' },
  cardBody: { flexDirection: 'row', padding: 14, gap: 12 },
  cardIcon: { fontSize: 24 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
  rating: { fontSize: 11, fontWeight: '700', color: '#374151' },
  cardMeta: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tagUrg: { backgroundColor: '#FEF2F2', color: '#C0392B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: '700' },
  tagGray: { backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: '600' },
  tagRed: { backgroundColor: '#FEF2F2', color: '#C0392B', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  actionBtn: { flex: 1, borderRadius: 8, padding: 7, alignItems: 'center' },
  actionText: { fontSize: 10, fontWeight: '700' },
  medBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2E9E6B', borderRadius: 14, padding: 14, marginBottom: 12 },
  medBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  medBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  arrow: { fontSize: 20, color: 'rgba(255,255,255,0.7)' },
  pharmCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  pharmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pharmGridCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#F0F2F5' },
  pharmGridCardActive: { borderColor: '#2E9E6B', borderWidth: 1.5 },
  pharmName: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 3 },
  pharmSchedule: { fontSize: 10, color: '#9CA3AF', marginBottom: 6 },
  serviceTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  serviceTag: { backgroundColor: '#F0FAF5', color: '#2E9E6B', fontSize: 8, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  barrioHeader: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 8 },
  pharmExpand: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  pharmExpandActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  pharmMiniBtn: { flex: 1, borderRadius: 8, padding: 6, alignItems: 'center' },
  pharmTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  citaInfo: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 14 },
  citaInfoTitle: { fontSize: 13, fontWeight: '700', color: '#C0392B' },
  citaInfoSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  lbl: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 6 },
  hospChip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  hospChipActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  hospChipText: { fontSize: 11, fontWeight: '700', color: '#6B7280', maxWidth: 140 },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  summaryBox: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16, width: '100%', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  summaryLbl: { fontSize: 12, color: '#6B7280' },
  summaryVal: { fontSize: 12, fontWeight: '700', color: '#111827' },
  urgBanner: { borderRadius: 14, padding: 16, marginBottom: 14 },
  urgTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  urgSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  urgCall: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  urgCallText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  urgCall2: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, alignItems: 'center' },
  urgCallText2: { color: '#fff', fontSize: 13, fontWeight: '700' },
  urgRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  medOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  medSheet: { backgroundColor: '#F7F8FA', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  medBack: { fontSize: 16, color: '#6B7280', padding: 4 },
  medTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  cartBtn: { backgroundColor: '#2E9E6B', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  cartBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  medHint: { textAlign: 'center', color: '#9CA3AF', padding: 20, fontSize: 13 },
  medRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, gap: 10 },
  receta: { fontSize: 9, color: '#92400E', backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 4 },
  sinStock: { fontSize: 10, color: '#DC2626', fontWeight: '700' },
  addBtn: { backgroundColor: '#2E9E6B', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cartRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cartPrice: { fontWeight: '800', color: '#2E9E6B' },
  cartTotal: { fontSize: 18, fontWeight: '900', color: '#2E9E6B', textAlign: 'right', marginVertical: 12 },
});
