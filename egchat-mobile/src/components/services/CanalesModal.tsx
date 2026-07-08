// Módulo Canales TV — paridad ServiciosModules.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CHANNEL_COMPANIES, CHANNEL_PACKAGES, ChannelPackage } from '../../data/serviciosBasicos';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico, LogoThumb,
} from './ServiceModuleUI';

type CScreen = 'home' | 'companies' | 'packages' | 'detail' | 'subscribe' | 'paySubscription' | 'orders' | 'myChannels' | 'support';

interface Props { visible: boolean; onClose: () => void; }

export const CanalesModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<CScreen>('home');
  const [company, setCompany] = useState('');
  const [pkg, setPkg] = useState<ChannelPackage | null>(null);
  const [orders, setOrders] = useState<Array<{ id: string; company: string; pkg: string; status: string; date: string; price: string }>>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [payRef, setPayRef] = useState('');
  const [payOk, setPayOk] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!visible) { setScreen('home'); setCompany(''); setPkg(null); setPayOk(false); }
  }, [visible]);

  const selCo = CHANNEL_COMPANIES.find(c => c.id === company);
  const coPkgs = company ? (CHANNEL_PACKAGES[company] || []) : [];
  const color = selCo?.color || '#8B5CF6';

  const titles: Record<CScreen, string> = {
    home: 'Canales', companies: 'Compañías',
    packages: `${selCo?.name || ''} — Paquetes`, detail: pkg?.name || 'Detalle',
    subscribe: 'Suscribirme', paySubscription: 'Pagar Suscripción',
    orders: 'Mis Pedidos', myChannels: 'Mis Canales', support: 'Soporte',
  };

  const goBack = () => {
    if (screen === 'home') onClose();
    else if (screen === 'packages') setScreen(company ? 'companies' : 'home');
    else if (screen === 'detail') setScreen('packages');
    else if (screen === 'subscribe') setScreen('detail');
    else setScreen('home');
  };

  const homeItems = [
    { id: 'companies', label: 'Ver Compañías', desc: `${CHANNEL_COMPANIES.length} disponibles`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.tv('#6B5BD6') },
    { id: 'packages', label: 'Ver Paquetes', desc: 'Todos los paquetes', color: '#3B7DD8', bg: '#EFF5FD', icon: Ico.box('#3B7DD8') },
    { id: 'subscribe', label: 'Suscribirme', desc: 'Contratar servicio', color: '#2E9E6B', bg: '#F0FAF5', icon: Ico.check('#2E9E6B') },
    { id: 'paySubscription', label: 'Pagar Suscripción', desc: 'Renovar o pagar', color: '#C47D2A', bg: '#FDF6EE', icon: Ico.card('#C47D2A') },
    { id: 'orders', label: 'Mis Pedidos', desc: `${orders.length} pedidos`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.clipboard('#6B5BD6') },
    { id: 'myChannels', label: 'Mis Canales', desc: 'Servicios activos', color: '#0E7FA8', bg: '#EDF7FB', icon: Ico.wifi('#0E7FA8') },
    { id: 'support', label: 'Soporte', desc: 'Ayuda y tickets', color: '#C0392B', bg: '#FDF2F2', icon: Ico.headset('#C0392B') },
  ];

  const formFields = [
    { k: 'name', l: 'Nombre completo' }, { k: 'phone', l: 'Teléfono' },
    { k: 'address', l: 'Dirección' }, { k: 'city', l: 'Ciudad / Barrio / Zona' },
    { k: 'notes', l: 'Observaciones (opcional)' },
  ] as const;

  return (
    <ServiceModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? 'TV — Streaming — Entretenimiento' : undefined}
      onBack={goBack}
      onClose={onClose}
    >
      {screen === 'home' && (
        <View>
          <ServiceHomeGrid items={homeItems} onPress={id => setScreen(id as CScreen)} />
          <ServiceBanner
            key={refreshKey}
            label="Compañías disponibles"
            count={CHANNEL_COMPANIES.length}
            suffix="TV — Streaming — Deportes — Local — Satélite"
            colors={['#8B5CF6', '#6D28D9']}
            onRefresh={() => setRefreshKey(k => k + 1)}
          />
        </View>
      )}

      {screen === 'companies' && (
        <OperatorGrid
          items={CHANNEL_COMPANIES.map(c => ({ id: c.id, name: c.name, color: c.color, cat: c.cat }))}
          onSelect={id => { setCompany(id); setScreen('packages'); }}
        />
      )}

      {screen === 'packages' && (
        !company ? (
          <View>
            <Text style={st.hint}>Selecciona una compañía para ver sus paquetes</Text>
            {CHANNEL_COMPANIES.map(c => (
              <TouchableOpacity key={c.id} style={st.companyRow} onPress={() => setCompany(c.id)} activeOpacity={0.7}>
                <LogoThumb name={c.name} color={c.color} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={st.companyName}>{c.name}</Text>
                  <Text style={st.companySub}>{(CHANNEL_PACKAGES[c.id] || []).length} paquetes</Text>
                </View>
                <Text style={st.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={st.pkgCard}>
            <View style={st.pkgGrid}>
              {coPkgs.map(p => (
                <TouchableOpacity key={p.id} style={st.pkgCell} onPress={() => { setPkg(p); setScreen('detail'); }} activeOpacity={0.7}>
                  <View style={[st.pkgIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>{Ico.tv(color)}</View>
                  <Text style={st.pkgName} numberOfLines={2}>{p.name}</Text>
                  <Text style={[st.pkgPrice, { color }]}>{p.price}</Text>
                  <Text style={st.pkgType}>{p.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      )}

      {screen === 'detail' && pkg && (
        <View>
          <View style={st.detailCard}>
            <View style={st.detailTop}>
              <LogoThumb name={selCo?.name || ''} color={color} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={st.detailName}>{pkg.name}</Text>
                <Text style={st.detailSub}>{selCo?.name} — {pkg.type} — {pkg.duration}</Text>
              </View>
            </View>
            <Text style={[st.detailPrice, { color }]}>{pkg.price}</Text>
            <Text style={st.detailDesc}>{pkg.desc}</Text>
            <Text style={st.channelsTitle}>Canales incluidos:</Text>
            <View style={st.channelsWrap}>
              {pkg.channels.map((ch, i) => (
                <View key={i} style={[st.channelTag, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                  <Text style={[st.channelText, { color }]}>{ch}</Text>
                </View>
              ))}
            </View>
          </View>
          <PrimaryButton label="✅ Suscribirme ahora" onPress={() => setScreen('subscribe')} color={color} />
        </View>
      )}

      {screen === 'subscribe' && (
        <View>
          {pkg && (
            <View style={st.formSummary}>
              <LogoThumb name={selCo?.name || ''} color={color} size={36} />
              <View>
                <Text style={st.formSummaryTitle}>{pkg.name}</Text>
                <Text style={st.formSummarySub}>{selCo?.name} — {pkg.price}</Text>
              </View>
            </View>
          )}
          {formFields.map(f => (
            <FormField
              key={f.k}
              placeholder={f.l}
              value={form[f.k]}
              onChangeText={v => setForm(p => ({ ...p, [f.k]: v }))}
              keyboardType={f.k === 'phone' ? 'phone-pad' : 'default'}
            />
          ))}
          <PrimaryButton
            label="Confirmar suscripción"
            onPress={() => {
              if (form.name && form.phone) {
                setOrders(p => [...p, {
                  id: `co${Date.now()}`, company: selCo?.name || '',
                  pkg: pkg?.name || '', status: 'pendiente',
                  date: new Date().toLocaleDateString('es'), price: pkg?.price || '—',
                }]);
                setForm({ name: '', phone: '', address: '', city: '', notes: '' });
                setScreen('orders');
              }
            }}
            disabled={!form.name || !form.phone}
            color="#10B981"
          />
        </View>
      )}

      {screen === 'paySubscription' && (
        !payOk ? (
          <View>
            <View style={st.confirmCard}>
              <Text style={st.payTitle}>💳 Pagar Suscripción</Text>
              <FormField placeholder="Referencia / Número de contrato" value={payRef} onChangeText={setPayRef} />
              <Text style={st.payHint}>Selecciona el paquete a pagar:</Text>
              {CHANNEL_COMPANIES.slice(0, 4).map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[st.payCompany, company === c.id && { backgroundColor: '#F3F0FF', borderColor: c.color }]}
                  onPress={() => setCompany(c.id)}
                >
                  <LogoThumb name={c.name} color={c.color} size={32} />
                  <Text style={st.payCompanyName}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              label="Confirmar pago"
              onPress={() => { if (payRef && company) setPayOk(true); }}
              disabled={!payRef || !company}
              color="#F59E0B"
            />
          </View>
        ) : (
          <View style={st.success}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>✅</Text>
            <Text style={st.successTitle}>Pago confirmado</Text>
            <Text style={st.successSub}>Ref: {payRef}</Text>
            <TouchableOpacity style={[st.doneBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => { setPayOk(false); setPayRef(''); setScreen('home'); }}>
              <Text style={st.doneBtnText}>Listo</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {screen === 'orders' && (
        orders.length === 0 ? (
          <EmptyState emoji="📋" title="Sin pedidos aún" desc="Suscríbete a un paquete para ver tus pedidos aquí" />
        ) : orders.map(o => (
          <View key={o.id} style={st.orderCard}>
            <View style={st.orderTop}>
              <View>
                <Text style={st.orderTitle}>{o.pkg}</Text>
                <Text style={st.orderSub}>{o.company}</Text>
              </View>
              <StatusBadge status={o.status} />
            </View>
            <View style={st.orderBottom}>
              <Text style={st.orderDate}>📅 {o.date}</Text>
              <Text style={st.orderPrice}>{o.price}</Text>
            </View>
          </View>
        ))
      )}

      {screen === 'myChannels' && (
        <EmptyState
          emoji="📡" title="Sin canales activos" desc="Tus suscripciones activas aparecerán aquí"
          actionLabel="Ver compañías" onAction={() => setScreen('companies')}
        />
      )}

      {screen === 'support' && <SupportScreen />}
    </ServiceModuleShell>
  );
};

const st = StyleSheet.create({
  hint: { fontSize: 12, color: '#888', marginBottom: 10 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  companyName: { fontSize: 13, fontWeight: '700', color: '#111' },
  companySub: { fontSize: 11, color: '#888' },
  arrow: { fontSize: 20, color: '#CBD5E1' },
  pkgCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5' },
  pkgCell: { width: '33.333%', backgroundColor: '#fff', alignItems: 'center', padding: 12, marginBottom: 1 },
  pkgIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pkgName: { fontSize: 10, fontWeight: '700', color: '#111827', textAlign: 'center' },
  pkgPrice: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pkgType: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailName: { fontSize: 18, fontWeight: '800', color: '#111' },
  detailSub: { fontSize: 12, color: '#888' },
  detailPrice: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  detailDesc: { fontSize: 13, color: '#555', marginBottom: 12 },
  channelsTitle: { fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 8 },
  channelsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  channelTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  channelText: { fontSize: 11, fontWeight: '600' },
  formSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 14 },
  formSummaryTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  formSummarySub: { fontSize: 11, color: '#888' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  payTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12 },
  payHint: { fontSize: 12, color: '#888', marginBottom: 8 },
  payCompany: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1.5, borderColor: 'transparent' },
  payCompanyName: { fontSize: 13, fontWeight: '600', color: '#111' },
  success: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#888', marginBottom: 20 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  orderSub: { fontSize: 11, color: '#888' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate: { fontSize: 12, color: '#888' },
  orderPrice: { fontSize: 12, fontWeight: '700', color: '#111' },
});
