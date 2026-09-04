// Módulo Internet — paridad ServiciosModules.tsx web
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { INTERNET_PROVIDERS, INTERNET_SERVICES, InternetService } from '../../data/serviciosBasicos';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico, LogoThumb,
} from './ServiceModuleUI';

type IScreen = 'home' | 'providers' | 'services' | 'detail' | 'form' | 'orders' | 'myServices' | 'support' | 'payBill';

interface Props { visible: boolean; onClose: () => void; userBalance?: number; }

export const InternetModal: React.FC<Props> = ({ visible, onClose, userBalance = 100000 }) => {
  const [screen, setScreen] = useState<IScreen>('home');
  const [provider, setProvider] = useState('');
  const [service, setService] = useState<InternetService | null>(null);
  const [orders, setOrders] = useState<Array<{ id: string; provider: string; service: string; status: string; date: string; price: string }>>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '', type: '' });
  const [billRef, setBillRef] = useState('');
  const [billAmt, setBillAmt] = useState('');
  const [billOk, setBillOk] = useState(false);
  const [balance, setBalance] = useState(userBalance);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (visible) setBalance(userBalance); }, [visible, userBalance]);
  useEffect(() => { if (!visible) { setScreen('home'); setProvider(''); setService(null); setBillOk(false); } }, [visible]);

  const selProv = INTERNET_PROVIDERS.find(p => p.id === provider);
  const provServices = provider ? (INTERNET_SERVICES[provider] || []) : [];
  const color = selProv?.color || '#1485EE';

  const titles: Record<IScreen, string> = {
    home: 'Internet', providers: 'Proveedores',
    services: `${selProv?.name || ''} — Servicios`, detail: service?.name || 'Detalle',
    form: 'Solicitar Instalación', orders: 'Mis Pedidos', myServices: 'Mis Servicios',
    support: 'Soporte', payBill: 'Pagar Factura',
  };

  const goBack = () => {
    if (screen === 'home') onClose();
    else if (screen === 'services') setScreen('providers');
    else if (screen === 'detail') setScreen('services');
    else if (screen === 'form') setScreen(service ? 'detail' : 'home');
    else setScreen('home');
  };

  const homeItems = [
    { id: 'providers', label: 'Ver Proveedores', desc: `${INTERNET_PROVIDERS.length} disponibles`, color: '#1485EE', bg: '#EFF5FD', icon: Ico.home('#1485EE') },
    { id: 'form', label: 'Solicitar Instalación', desc: 'Contratar servicio', color: '#10B981', bg: '#F0FAF5', icon: Ico.wrench('#10B981') },
    { id: 'payBill', label: 'Pagar Factura', desc: 'Pago de servicios', color: '#C47D2A', bg: '#FDF6EE', icon: Ico.card('#C47D2A') },
    { id: 'orders', label: 'Mis Pedidos', desc: `${orders.length} pedidos`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.clipboard('#6B5BD6') },
    { id: 'myServices', label: 'Mis Servicios', desc: 'Servicios activos', color: '#0E7FA8', bg: '#EDF7FB', icon: Ico.wifi('#0E7FA8') },
    { id: 'support', label: 'Soporte', desc: 'Ayuda técnica', color: '#C0392B', bg: '#FDF2F2', icon: Ico.headset('#C0392B') },
  ];

  const formFields = [
    { k: 'name', l: 'Nombre completo' }, { k: 'phone', l: 'Teléfono' },
    { k: 'address', l: 'Dirección' }, { k: 'city', l: 'Ciudad / Barrio / Zona' },
    { k: 'type', l: 'Tipo de instalación' }, { k: 'notes', l: 'Observaciones (opcional)' },
  ] as const;

  return (
    <ServiceModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? 'Conectividad — Guinea Ecuatorial' : undefined}
      onBack={goBack}
      onClose={onClose}
    >
      {screen === 'home' && (
        <View>
          <ServiceHomeGrid items={homeItems} onPress={id => setScreen(id as IScreen)} />
          <ServiceBanner
            key={refreshKey}
            label="Proveedores en Guinea Ecuatorial"
            count={INTERNET_PROVIDERS.length}
            suffix="Hogar — Empresa — Fibra — Móvil — Satélite"
            colors={['#1485EE', '#0066CC']}
            onRefresh={() => setRefreshKey(k => k + 1)}
          />
        </View>
      )}

      {screen === 'providers' && (
        <OperatorGrid
          items={INTERNET_PROVIDERS.map(p => ({ id: p.id, name: p.name, color: p.color, cov: p.cov }))}
          onSelect={id => { setProvider(id); setScreen('services'); }}
        />
      )}

      {screen === 'services' && (
        provServices.length === 0 ? (
          <EmptyState emoji="📡" title="Sin servicios disponibles" desc="" />
        ) : (
          <View style={st.pkgCard}>
            <View style={st.pkgGrid}>
              {provServices.map(svc => (
                <TouchableOpacity key={svc.id} style={st.pkgCell} onPress={() => { setService(svc); setScreen('detail'); }} activeOpacity={0.7}>
                  <View style={[st.pkgIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>{Ico.wifi(color)}</View>
                  <Text style={st.pkgName} numberOfLines={2}>{svc.name}</Text>
                  <Text style={[st.pkgPrice, { color }]}>{svc.price}</Text>
                  {svc.speed !== '—' && <Text style={st.pkgValid}>⚡ {svc.speed}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      )}

      {screen === 'detail' && service && (
        <View>
          <View style={st.detailCard}>
            <View style={st.detailTop}>
              <LogoThumb name={selProv?.name || ''} color={color} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={st.detailName}>{service.name}</Text>
                <Text style={st.detailSub}>{selProv?.name} — {service.type}</Text>
              </View>
            </View>
            <Text style={[st.detailPrice, { color }]}>{service.price}</Text>
            <Text style={st.detailDesc}>{service.desc}</Text>
            {service.speed !== '—' && (
              <View style={[st.speedBox, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                <Text style={[st.speedText, { color }]}>⚡ Velocidad: {service.speed}</Text>
              </View>
            )}
          </View>
          <PrimaryButton label="🔧 Solicitar ahora" onPress={() => setScreen('form')} color={color} />
        </View>
      )}

      {screen === 'form' && (
        <View>
          {service && (
            <View style={st.formSummary}>
              <LogoThumb name={selProv?.name || ''} color={color} size={36} />
              <View>
                <Text style={st.formSummaryTitle}>{service.name}</Text>
                <Text style={st.formSummarySub}>{selProv?.name} — {service.price}</Text>
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
            label="Confirmar solicitud"
            onPress={() => {
              if (form.name && form.phone) {
                setOrders(p => [...p, {
                  id: `io${Date.now()}`, provider: selProv?.name || '',
                  service: service?.name || 'Instalación', status: 'pendiente',
                  date: new Date().toLocaleDateString('es'), price: service?.price || '—',
                }]);
                setForm({ name: '', phone: '', address: '', city: '', notes: '', type: '' });
                setScreen('orders');
              }
            }}
            disabled={!form.name || !form.phone}
            color="#10B981"
          />
        </View>
      )}

      {screen === 'payBill' && (
        !billOk ? (
          <View>
            <View style={st.confirmCard}>
              <Text style={st.payTitle}>💳 Pagar Factura de Internet</Text>
              <FormField placeholder="Referencia / Número de contrato" value={billRef} onChangeText={setBillRef} />
              <FormField placeholder="Importe a pagar (XAF)" value={billAmt} onChangeText={setBillAmt} keyboardType="numeric" />
            </View>
            <PrimaryButton
              label={`Pagar ${billAmt ? `${parseInt(billAmt, 10).toLocaleString()} XAF` : ''}`}
              onPress={() => {
                const amt = parseInt(billAmt, 10);
                if (billRef && amt && amt <= balance) { setBalance(b => b - amt); setBillOk(true); }
              }}
              disabled={!billRef || !billAmt}
              color="#F59E0B"
            />
          </View>
        ) : (
          <View style={st.success}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>✅</Text>
            <Text style={st.successTitle}>Pago realizado</Text>
            <Text style={st.successSub}>Ref: {billRef} — {parseInt(billAmt, 10).toLocaleString()} XAF</Text>
            <TouchableOpacity style={[st.doneBtn, { backgroundColor: '#1485EE' }]} onPress={() => { setBillOk(false); setBillRef(''); setBillAmt(''); setScreen('home'); }}>
              <Text style={st.doneBtnText}>Listo</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {screen === 'orders' && (
        orders.length === 0 ? (
          <EmptyState emoji="📋" title="Sin pedidos aún" desc="Solicita un servicio para ver tus pedidos aquí" />
        ) : orders.map(o => (
          <View key={o.id} style={st.orderCard}>
            <View style={st.orderTop}>
              <View>
                <Text style={st.orderTitle}>{o.service}</Text>
                <Text style={st.orderSub}>{o.provider}</Text>
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

      {screen === 'myServices' && (
        <EmptyState
          emoji="📡" title="Sin servicios activos" desc="Tus servicios activos aparecerán aquí"
          actionLabel="Ver proveedores" onAction={() => setScreen('providers')}
        />
      )}

      {screen === 'support' && <SupportScreen />}
    </ServiceModuleShell>
  );
};

const st = StyleSheet.create({
  pkgCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5' },
  pkgCell: { width: '33.333%', backgroundColor: '#fff', alignItems: 'center', padding: 14, marginBottom: 1 },
  pkgIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pkgName: { fontSize: 11, fontWeight: '600', color: '#111827', textAlign: 'center' },
  pkgPrice: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pkgValid: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailName: { fontSize: 18, fontWeight: '800', color: '#111' },
  detailSub: { fontSize: 12, color: '#888' },
  detailPrice: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  detailDesc: { fontSize: 13, color: '#555', marginBottom: 12 },
  speedBox: { borderRadius: 10, padding: 10 },
  speedText: { fontSize: 13, fontWeight: '700' },
  formSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 14 },
  formSummaryTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  formSummarySub: { fontSize: 11, color: '#888' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  payTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12 },
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
