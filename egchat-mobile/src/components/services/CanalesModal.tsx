// Módulo Canales TV — paridad ServiciosModules.tsx web
//
// La suscripción y el aviso de pago se registran como solicitudes (importe 0).
// Antes el pedido vivía en un array local que se borraba al cerrar y el pago se
// anunciaba como confirmado sin cobrar nada.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CHANNEL_COMPANIES, CHANNEL_PACKAGES, ChannelPackage } from '../../data/serviciosBasicos';
import { serviciosAPI, Solicitud } from '../../api';
import { toast } from '../Toast';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico, LogoThumb,
} from './ServiceModuleUI';
import { useTranslation } from '../../context/LanguageContext';

type CScreen = 'home' | 'companies' | 'packages' | 'detail' | 'subscribe' | 'paySubscription' | 'orders' | 'myChannels' | 'support';

const TIPO_LABEL: Record<string, string> = {
  suscripcion: 'Suscripcion',
  aviso_pago: 'Aviso de pago',
};

interface Props { visible: boolean; onClose: () => void; }

export const CanalesModal: React.FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<CScreen>('home');
  const [company, setCompany] = useState('');
  const [pkg, setPkg] = useState<ChannelPackage | null>(null);
  const [orders, setOrders] = useState<Solicitud[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [payRef, setPayRef] = useState('');
  const [payAmt, setPayAmt] = useState('');
  const [recibo, setRecibo] = useState('');
  const [ref, setRef] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (visible) { cargarSolicitudes(); return; }
    setScreen('home'); setCompany(''); setPkg(null); setRecibo(''); setSending(false);
  }, [visible]);

  const cargarSolicitudes = async () => {
    try { setOrders(await serviciosAPI.solicitudes('canales')); } catch { setOrders([]); }
  };

  const suscribir = async () => {
    if (sending) return;
    setSending(true);
    try {
      await serviciosAPI.solicitud({
        provider: 'canales',
        tipo: 'suscripcion',
        referencia: company || undefined,
        datos: {
          ...form,
          compania: selCo?.name || company || null,
          paquete: pkg?.name || null,
          precio_catalogo: pkg?.price || null,
        },
        external_id: ref || `CAN-${company || 'sucursal'}-${Date.now()}`,
      });
      setForm({ name: '', phone: '', address: '', city: '', notes: '' });
      setRef('');
      await cargarSolicitudes();
      setScreen('orders');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar la suscripción.');
    } finally {
      setSending(false);
    }
  };

  const avisarPago = async () => {
    if (sending) return;
    const amt = parseInt(payAmt, 10);
    setSending(true);
    try {
      const res = await serviciosAPI.solicitud({
        provider: 'canales',
        tipo: 'aviso_pago',
        referencia: payRef,
        datos: { contrato: payRef, importe_declarado: amt, compania: selCo?.name || company },
        external_id: `CANPAGO-${payRef}-${Date.now()}`,
      });
      setRecibo(res.solicitudId);
      await cargarSolicitudes();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar el aviso de pago.');
    } finally {
      setSending(false);
    }
  };

  const selCo = CHANNEL_COMPANIES.find(c => c.id === company);
  const coPkgs = company ? (CHANNEL_PACKAGES[company] || []) : [];
  const color = selCo?.color || '#8B5CF6';

  const titles: Record<CScreen, string> = {
    home: t('channels'), companies: t('svcCompanies'),
    packages: `${selCo?.name || ''} — ${t('svcPackagesWord')}`, detail: pkg?.name || t('svcDetail'),
    subscribe: t('svcSubscribe'), paySubscription: t('svcPaySubscription'),
    orders: t('svcMyOrders'), myChannels: t('svcMyChannels'), support: t('svcSupport'),
  };

  const goBack = () => {
    if (screen === 'home') onClose();
    else if (screen === 'packages') setScreen(company ? 'companies' : 'home');
    else if (screen === 'detail') setScreen('packages');
    else if (screen === 'subscribe') setScreen('detail');
    else setScreen('home');
  };

  const homeItems = [
    { id: 'companies', label: t('svcSeeCompanies'), desc: `${CHANNEL_COMPANIES.length} ${t('svcAvailableWord')}`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.tv('#6B5BD6') },
    { id: 'packages', label: t('svcSeePackages'), desc: t('svcAllPackages'), color: '#3B7DD8', bg: '#EFF5FD', icon: Ico.box('#3B7DD8') },
    { id: 'subscribe', label: t('svcSubscribe'), desc: t('svcHireService'), color: '#2E9E6B', bg: '#F0FAF5', icon: Ico.check('#2E9E6B') },
    { id: 'paySubscription', label: t('svcPaySubscription'), desc: t('svcRenewOrPay'), color: '#C47D2A', bg: '#FDF6EE', icon: Ico.card('#C47D2A') },
    { id: 'orders', label: t('svcMyOrders'), desc: `${orders.length} ${t('svcOrdersWord')}`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.clipboard('#6B5BD6') },
    { id: 'myChannels', label: t('svcMyChannels'), desc: t('svcActiveServices'), color: '#0E7FA8', bg: '#EDF7FB', icon: Ico.wifi('#0E7FA8') },
    { id: 'support', label: t('svcSupport'), desc: t('svcHelpTickets'), color: '#C0392B', bg: '#FDF2F2', icon: Ico.headset('#C0392B') },
  ];

  const formFields = [
    { k: 'name', l: t('name') }, { k: 'phone', l: t('phone') },
    { k: 'address', l: t('setAddress') }, { k: 'city', l: t('svcCityAreaZone') },
    { k: 'notes', l: t('svcNotesOptional') },
  ] as const;

  return (
    <ServiceModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? t('svcTvStreamingEntertainment') : undefined}
      onBack={goBack}
      onClose={onClose}
    >
      {screen === 'home' && (
        <View>
          <ServiceHomeGrid items={homeItems} onPress={id => setScreen(id as CScreen)} />
          <ServiceBanner
            key={refreshKey}
            label={t('svcCompaniesAvailable')}
            count={CHANNEL_COMPANIES.length}
            suffix={t('svcTvSportsLocal')}
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
            <Text style={st.hint}>{t('svcSelectCompanyHint')}</Text>
            {CHANNEL_COMPANIES.map(c => (
              <TouchableOpacity key={c.id} style={st.companyRow} onPress={() => setCompany(c.id)} activeOpacity={0.7}>
                <LogoThumb name={c.name} color={c.color} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={st.companyName}>{c.name}</Text>
                  <Text style={st.companySub}>{(CHANNEL_PACKAGES[c.id] || []).length} {t('svcPackagesWord')}</Text>
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
            <Text style={st.payNote}>
              {pkg.price} es el precio del catalogo. Al enviar se registra la solicitud: la compania
              confirma la tarifa y el cobro se hace despues. Desde EGChat no se debita nada.
            </Text>
            <Text style={st.channelsTitle}>{t('svcIncludedChannels')}:</Text>
            <View style={st.channelsWrap}>
              {pkg.channels.map((ch, i) => (
                <View key={i} style={[st.channelTag, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                  <Text style={[st.channelText, { color }]}>{ch}</Text>
                </View>
              ))}
            </View>
          </View>
          <PrimaryButton
            label={t('svcSubscribeNow')}
            onPress={() => { setRef(`CAN-${company || 'sucursal'}-${Date.now()}`); setScreen('subscribe'); }}
            color={color}
          />
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
            label={sending ? 'Enviando…' : t('svcConfirmSubscription')}
            onPress={suscribir}
            disabled={!form.name || !form.phone || sending}
            color="#10B981"
          />
          <Text style={st.payNote}>
            Queda registrada como solicitud con tu referencia {ref || '—'}. La compania confirma el alta y
            el primer cobro se hace despues desde el monedero. No se ha debitado nada.
          </Text>
        </View>
      )}

      {screen === 'paySubscription' && (
        !recibo ? (
          <View>
            <View style={st.confirmCard}>
              <Text style={st.payTitle}>{t('svcPaySubscriptionTitle')}</Text>
              <Text style={st.payNote}>
                Este es un aviso, no un cobro. La compania revisa el contrato y confirma la deuda real;
                el monedero no se debita hasta esa confirmacion.
              </Text>
              <FormField placeholder={t('svcRefContractPh')} value={payRef} onChangeText={setPayRef} />
              <FormField placeholder={t('svcAmountToPayXaf')} value={payAmt} onChangeText={setPayAmt} keyboardType="numeric" />
              <Text style={st.payHint}>{t('svcSelectPackageToPay')}:</Text>
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
              label={sending ? 'Registrando…' : t('svcConfirmPayment')}
              onPress={avisarPago}
              disabled={!payRef || !company || !payAmt || sending}
              color="#F59E0B"
            />
          </View>
        ) : (
          <View style={st.success}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>📨</Text>
            <Text style={st.successTitle}>Aviso registrado</Text>
            <Text style={st.successSub}>
              Referencia: {recibo} — {parseInt(payAmt, 10).toLocaleString()} XAF declarados
            </Text>
            <Text style={st.payNote}>No se ha cobrado nada. La compania confirmara la factura y el importe real.</Text>
            <TouchableOpacity
              style={[st.doneBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => { setRecibo(''); setPayRef(''); setPayAmt(''); setScreen('home'); }}
            >
              <Text style={st.doneBtnText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {screen === 'orders' && (
        orders.length === 0 ? (
          <EmptyState emoji="📋" title={t('svcNoOrdersYet')} desc={t('svcSubscribeToSeeOrders')} />
        ) : orders.map(o => (
          <View key={o.order_ref} style={st.orderCard}>
            <View style={st.orderTop}>
              <View>
                <Text style={st.orderTitle}>{TIPO_LABEL[o.service_type] || o.service_type}</Text>
                <Text style={st.orderSub}>
                  {o.payload?.compania || CHANNEL_COMPANIES.find(c => c.id === o.contract_ref)?.name || o.contract_ref || 'Canales'}
                </Text>
              </View>
              <StatusBadge status={o.status === 'pending' ? 'pendiente' : o.status} />
            </View>
            <View style={st.orderBottom}>
              <Text style={st.orderDate}>📅 {new Date(o.created_at).toLocaleDateString('es')}</Text>
              <Text style={st.orderPrice}>{Number(o.amount) > 0 ? `${Number(o.amount).toLocaleString()} XAF` : 'Sin cobro'}</Text>
            </View>
          </View>
        ))
      )}

      {screen === 'myChannels' && (
        <EmptyState
          emoji="📡" title={t('svcNoActiveChannels')} desc={t('svcActiveSubsHere')}
          actionLabel={t('svcSeeCompanies')} onAction={() => setScreen('companies')}
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
  payNote: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 10 },
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
