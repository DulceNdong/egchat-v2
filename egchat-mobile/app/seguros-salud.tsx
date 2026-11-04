import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import { useTranslation } from '../src/context/LanguageContext';
import { segurosAPI, serviciosAPI, walletAPI, BillFactura, Tarifa } from '../src/api';
import { toast } from '../src/components/Toast';
import { SegurosModal } from '../src/components/services/SegurosModal';
import { SaludModal } from '../src/components/services/SaludModal';
import { CorreosModal } from '../src/components/services/CorreosModal';

const TABS = [
  { id: 'salud', icon: '🏥', labelKey: 'svcTabSalud' },
  { id: 'seguros', icon: '🛡️', labelKey: 'svcTabSeguros' },
  { id: 'impuestos', icon: '📋', labelKey: 'svcTabImpuestos' },
  { id: 'correos', icon: '📮', labelKey: 'svcTabCorreos' },
];

// Directorio informativo: telefonos de contacto. Las citas, farmacias y
// medicamentos se piden en su modulo, que es donde hay cargo real.
const HEALTH = [
  { name: 'Hospital General de Malabo', typeKey: 'svcPublicHospital', phone: '+240 333 09 50 00', serviceKeys: ['svcUrgencies24', 'svcSurgery', 'svcMaternity', 'svcPediatrics', 'svcLaboratory'] },
  { name: 'Clínica La Paz', typeKey: 'svcPrivateClinic', phone: '+240 333 09 51 00', serviceKeys: ['svcGeneralConsultations', 'svcSpecialists', 'svcRadiology', 'svcPharmacy'] },
  { name: 'Hospital de Bata', typeKey: 'svcPublicHospital', phone: '+240 333 09 52 00', serviceKeys: ['svcUrgencies', 'svcSurgery', 'svcMaternity', 'svcPediatrics'] },
  { name: 'Centro de Salud Ela Nguema', typeKey: 'svcHealthCenter', phone: '+240 333 09 53 00', serviceKeys: ['svcConsultations', 'svcVaccination', 'svcFamilyPlanning'] },
  { name: 'INSESO', typeKey: 'svcSocialSecurity', phone: '+240 333 09 54 00', serviceKeys: ['svcSocialBenefits', 'svcPensions', 'svcWorkAccidents'] },
];

interface Prima {
  company: string;
  variant: string;
  name: string;
  price: number;
  currency: string;
}

export default function SegurosSaludScreen() {
  const [active, setActive] = useState('salud');
  const [selectedHealth, setSelectedHealth] = useState<typeof HEALTH[0] | null>(null);
  const [nif, setNif] = useState('');
  const [deuda, setDeuda] = useState<BillFactura[] | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [payingId, setPayingId] = useState('');
  const [primas, setPrimas] = useState<Prima[]>([]);
  const [primasError, setPrimasError] = useState('');
  const [correos, setCorreos] = useState<Tarifa[]>([]);
  const [correosError, setCorreosError] = useState('');
  const [balance, setBalance] = useState(0);
  const [modal, setModal] = useState<null | 'seguros' | 'salud' | 'correos'>(null);
  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    walletAPI.getBalance().then(r => setBalance(Number(r?.balance) || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (active === 'seguros' && !primas.length && !primasError) loadPrimas();
    if (active === 'correos' && !correos.length && !correosError) loadCorreos();
  }, [active, primas.length, primasError, correos.length, correosError]);

  // La prima la publica la aseguradora en service_tariffs; aqui solo se lee.
  const loadPrimas = async () => {
    setPrimasError('');
    try {
      const companias = await segurosAPI.companias();
      const listas = await Promise.all((companias || []).map(async c => {
        try {
          const rows = await segurosAPI.productos(c.id);
          return (rows || []).map(p => ({
            company: c.name,
            variant: String(p.id),
            name: String(p.name ?? p.id),
            price: Number(p.price),
            currency: p.currency || 'XAF',
          }));
        } catch {
          return [] as Prima[];
        }
      }));
      const plana = listas.flat();
      setPrimas(plana);
      if (!plana.length) setPrimasError('Ninguna aseguradora tiene primas publicadas ahora mismo.');
    } catch (e: any) {
      setPrimas([]);
      setPrimasError(e?.message || 'No se pudieron cargar las primas de las aseguradoras.');
    }
  };

  const loadCorreos = async () => {
    setCorreosError('');
    try {
      const res = await serviciosAPI.tarifas();
      const lista = (res.tarifas || []).filter(x => x.service === 'correos');
      setCorreos(lista);
      if (!lista.length) setCorreosError('Las tarifas de Correos no estan disponibles ahora mismo.');
    } catch (e: any) {
      setCorreos([]);
      setCorreosError(e?.message || 'No se pudieron cargar las tarifas de Correos.');
    }
  };

  // La deuda la fija la base de datos: se consulta el NIF y se paga por el id de
  // la factura. Antes esta pantalla simulaba la respuesta con un setTimeout.
  const consultarDGI = async () => {
    if (!nif.trim()) { Alert.alert(t('error'), t('svcEnterNif')); return; }
    setTaxLoading(true);
    setDeuda(null);
    try {
      const res = await serviciosAPI.consultarDGI(nif.trim());
      setDeuda(res.facturas || []);
    } catch (e: any) {
      setDeuda([]);
      toast.error(e?.message || 'No se pudo consultar la deuda con la DGI.');
    } finally {
      setTaxLoading(false);
    }
  };

  const pagarFactura = (factura: BillFactura) => {
    Alert.alert(
      t('svcTaxRowDebt'),
      `${Number(factura.amount).toLocaleString()} ${factura.currency || 'XAF'}\n${t('walletBalance')}: ${balance.toLocaleString()} XAF`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('pay'),
          onPress: async () => {
            setPayingId(factura.id);
            try {
              const res = await serviciosAPI.pagarDGI(factura.id);
              if (res.balance != null) setBalance(Number(res.balance));
              toast.success(res.message || 'Impuesto pagado.');
              await consultarDGI();
            } catch (e: any) {
              toast.error(e?.message || 'No se pudo pagar la factura.');
            } finally {
              setPayingId('');
            }
          },
        },
      ]
    );
  };

  const totalDeuda = (deuda || []).filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0);
  const activeTab = TABS.find(tab => tab.id === active);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => { if (selectedHealth) { setSelectedHealth(null); } else { router.back(); } }} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>
          {selectedHealth ? selectedHealth.name : `${activeTab?.icon ?? ''} ${activeTab ? t(activeTab.labelKey) : ''}`}
        </Text>
      </View>
      {!selectedHealth && (
        <View style={[styles.tabs, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.id} style={[styles.tab, active === tab.id && styles.tabActive]} onPress={() => { setActive(tab.id); setSelectedHealth(null); }} activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, { color: active === tab.id ? Colors.accent : C.textTertiary }, active === tab.id && styles.tabTextActive]}>{t(tab.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {active === 'salud' && !selectedHealth && (
          <>
            <TouchableOpacity style={[styles.card, { backgroundColor: C.accentLight, borderColor: C.borderLight }]} onPress={() => setModal('salud')} activeOpacity={0.7}>
              <Text style={styles.cardEmoji}>📅</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: Colors.accent }]}>Citas, farmacias y medicamentos</Text>
                <Text style={[styles.cardSub, { color: C.textTertiary }]}>Se cobran con el precio de la base de datos</Text>
              </View>
              <Text style={[styles.arrow, { color: C.border }]}>›</Text>
            </TouchableOpacity>
            {HEALTH.map(h => (
              <TouchableOpacity key={h.name} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => setSelectedHealth(h)} activeOpacity={0.7}>
                <Text style={styles.cardEmoji}>🏥</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: C.textPrimary }]}>{h.name}</Text>
                  <Text style={[styles.cardSub, { color: C.textTertiary }]}>{t(h.typeKey)}</Text>
                </View>
                <Text style={[styles.arrow, { color: C.border }]}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {active === 'salud' && selectedHealth && (
          <View>
            <View style={[styles.detailHeader, { backgroundColor: C.accentLight }]}>
              <Text style={styles.detailType}>{t(selectedHealth.typeKey)}</Text>
            </View>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t('svcServicesSection')}</Text>
            {selectedHealth.serviceKeys.map(sk => (
              <View key={sk} style={styles.serviceRow}>
                <Text style={styles.dot}>●</Text>
                <Text style={[styles.serviceText, { color: C.textPrimary }]}>{t(sk)}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selectedHealth.phone}`)}>
              <Text style={styles.callBtnText}>📞 {selectedHealth.phone}</Text>
            </TouchableOpacity>
          </View>
        )}

        {active === 'seguros' && (
          <>
            <TouchableOpacity style={[styles.card, { backgroundColor: C.accentLight, borderColor: C.borderLight }]} onPress={() => setModal('seguros')} activeOpacity={0.7}>
              <Text style={styles.cardEmoji}>🛡️</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: Colors.accent }]}>Contratar seguro</Text>
                <Text style={[styles.cardSub, { color: C.textTertiary }]}>La prima se debita del monedero al emitir la póliza</Text>
              </View>
              <Text style={[styles.arrow, { color: C.border }]}>›</Text>
            </TouchableOpacity>
            {!!primasError && <Text style={[styles.errorTxt, { color: '#DC2626' }]}>{primasError}</Text>}
            {!primas.length && !primasError && (
              <View style={styles.centerBox}><ActivityIndicator size="large" color={Colors.accent} /><Text style={[styles.cardSub, { color: C.textTertiary }]}>Cargando primas…</Text></View>
            )}
            {primas.map(p => (
              <View key={`${p.company}-${p.variant}`} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <Text style={styles.cardEmoji}>{p.variant === 'auto' ? '🚗' : p.variant === 'hogar' ? '🏠' : p.variant === 'viaje' ? '✈️' : p.variant === 'salud' ? '🏥' : '❤️'}</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: C.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.cardSub, { color: C.textTertiary }]}>{p.company}</Text>
                  <Text style={styles.cardPrice}>{p.price.toLocaleString()} {p.currency}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {active === 'impuestos' && (
          <View style={styles.taxSection}>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t('svcTaxQueryTitle')}</Text>
            <View style={[styles.inputWrap, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
              <TextInput style={[styles.input, { color: C.textPrimary }]} value={nif} onChangeText={setNif} placeholder={t('svcNifPlaceholder')} placeholderTextColor={C.textTertiary} />
            </View>
            <TouchableOpacity style={[styles.callBtn, !nif.trim() && { opacity: 0.5 }]} onPress={consultarDGI} disabled={!nif.trim() || taxLoading}>
              {taxLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.callBtnText}>{t('svcQueryDgi')}</Text>}
            </TouchableOpacity>
            {deuda && !deuda.length && (
              <Text style={[styles.okTxt, { color: '#16A34A' }]}>No hay deudas registradas a nombre de ese NIF.</Text>
            )}
            {deuda && !!deuda.length && (
              <View style={[styles.resultCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: C.textSecondary }]}>{t('svcTaxRowDebt')}</Text>
                  <Text style={[styles.resultValue, { color: Colors.accent }]}>{totalDeuda.toLocaleString()} XAF</Text>
                </View>
                <Text style={[styles.resultLabel, { color: C.textSecondary, marginBottom: Spacing.sm }]}>{t('walletBalance')}: {balance.toLocaleString()} XAF</Text>
                {deuda.filter(f => f.status === 'pending').map(f => (
                  <View key={f.id} style={[styles.billRow, { borderTopColor: C.borderLight }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.serviceText, { color: C.textPrimary }]}>{f.concept || f.period || 'Impuesto'}</Text>
                      <Text style={[styles.cardSub, { color: C.textTertiary }]}>{Number(f.amount).toLocaleString()} {f.currency || 'XAF'}{f.due_date ? ` · ${String(f.due_date).slice(0, 10)}` : ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.payBtn} onPress={() => pagarFactura(f)} disabled={payingId === f.id}>
                      {payingId === f.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.payBtnText}>{t('pay')}</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {active === 'correos' && (
          <View>
            <TouchableOpacity style={[styles.card, { backgroundColor: C.accentLight, borderColor: C.borderLight }]} onPress={() => setModal('correos')} activeOpacity={0.7}>
              <Text style={styles.cardEmoji}>📦</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: Colors.accent }]}>Enviar un paquete</Text>
                <Text style={[styles.cardSub, { color: C.textTertiary }]}>El seguimiento y la tarifa los da Correos</Text>
              </View>
              <Text style={[styles.arrow, { color: C.border }]}>›</Text>
            </TouchableOpacity>
            {!!correosError && <Text style={[styles.errorTxt, { color: '#DC2626' }]}>{correosError}</Text>}
            {correos.map(c => (
              <View key={c.variant} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <Text style={styles.cardEmoji}>📮</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: C.textPrimary }]}>{c.concept || c.variant}</Text>
                  <Text style={styles.cardPrice}>{Number(c.amount).toLocaleString()} {c.currency || 'XAF'}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095600')}>
              <Text style={styles.callBtnText}>{t('svcCallCorreosGq')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SegurosModal visible={modal === 'seguros'} onClose={() => { setModal(null); loadPrimas(); }} />
      <SaludModal visible={modal === 'salud'} onClose={() => setModal(null)} />
      <CorreosModal visible={modal === 'correos'} onClose={() => { setModal(null); loadCorreos(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary, flex: 1 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 18 },
  tabText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  tabTextActive: { color: Colors.accent },
  content: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  cardEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  cardPrice: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  detailHeader: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginBottom: Spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot: { fontSize: 8, color: Colors.accent },
  serviceText: { fontSize: FontSize.base, color: Colors.textPrimary },
  callBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  callBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
  taxSection: { gap: Spacing.md },
  inputWrap: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  input: { fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.md },
  resultCard: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, marginTop: Spacing.md,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  resultLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  resultValue: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  payBtn: { backgroundColor: Colors.accent, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  payBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  centerBox: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  errorTxt: { fontSize: FontSize.sm },
  okTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  detailType: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },
});
