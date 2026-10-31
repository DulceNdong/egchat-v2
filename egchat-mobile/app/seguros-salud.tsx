import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import { useTranslation } from '../src/context/LanguageContext';

const TABS = [
  { id: 'salud', icon: '🏥', labelKey: 'svcTabSalud' },
  { id: 'seguros', icon: '🛡️', labelKey: 'svcTabSeguros' },
  { id: 'impuestos', icon: '📋', labelKey: 'svcTabImpuestos' },
  { id: 'correos', icon: '📮', labelKey: 'svcTabCorreos' },
];

const HEALTH = [
  { name: 'Hospital General de Malabo', typeKey: 'svcPublicHospital', phone: '+240 333 09 50 00', serviceKeys: ['svcUrgencies24', 'svcSurgery', 'svcMaternity', 'svcPediatrics', 'svcLaboratory'] },
  { name: 'Clínica La Paz', typeKey: 'svcPrivateClinic', phone: '+240 333 09 51 00', serviceKeys: ['svcGeneralConsultations', 'svcSpecialists', 'svcRadiology', 'svcPharmacy'] },
  { name: 'Hospital de Bata', typeKey: 'svcPublicHospital', phone: '+240 333 09 52 00', serviceKeys: ['svcUrgencies', 'svcSurgery', 'svcMaternity', 'svcPediatrics'] },
  { name: 'Centro de Salud Ela Nguema', typeKey: 'svcHealthCenter', phone: '+240 333 09 53 00', serviceKeys: ['svcConsultations', 'svcVaccination', 'svcFamilyPlanning'] },
  { name: 'INSESO', typeKey: 'svcSocialSecurity', phone: '+240 333 09 54 00', serviceKeys: ['svcSocialBenefits', 'svcPensions', 'svcWorkAccidents'] },
];

const INSURANCE = [
  { icon: '🚗', nameKey: 'svcCarInsurance', descKey: 'svcCarInsuranceDesc', amount: '25,000 XAF', fromKey: 'svcPriceFrom', perKey: 'svcPerYear' },
  { icon: '🏠', nameKey: 'svcHomeInsurance', descKey: 'svcHomeInsuranceDesc', amount: '15,000 XAF', fromKey: 'svcPriceFrom', perKey: 'svcPerYear' },
  { icon: '❤️', nameKey: 'svcLifeInsurance', descKey: 'svcLifeInsuranceDesc', amount: '10,000 XAF', fromKey: 'svcPriceFrom', perKey: 'svcPerMonth' },
  { icon: '🏥', nameKey: 'svcMedicalInsurance', descKey: 'svcMedicalInsuranceDesc', amount: '20,000 XAF', fromKey: 'svcPriceFrom', perKey: 'svcPerMonth' },
  { icon: '✈️', nameKey: 'svcTravelInsurance', descKey: 'svcTravelInsuranceDesc', amount: '5,000 XAF', fromKey: 'svcPriceFrom', perKey: 'svcPerTrip' },
  { icon: '💼', nameKey: 'svcBusinessInsurance', descKey: 'svcBusinessInsuranceDesc', priceKey: 'svcPriceConsult' },
];

const POSTAL = [
  { icon: '📦', nameKey: 'svcDomesticShipping', amount: '2,000 XAF', fromKey: 'svcPriceFrom' },
  { icon: '✈️', nameKey: 'svcInternationalShipping', amount: '15,000 XAF', fromKey: 'svcPriceFrom' },
  { icon: '📬', nameKey: 'svcPostalBox', amount: '5,000 XAF', perKey: 'svcPerYear' },
  { icon: '🔍', nameKey: 'svcShipmentTracking', priceKey: 'svcPriceFree' },
];

export default function SegurosSaludScreen() {
  const [active, setActive] = useState('salud');
  const [selectedHealth, setSelectedHealth] = useState<typeof HEALTH[0] | null>(null);
  const [nif, setNif] = useState('');
  const [taxResult, setTaxResult] = useState<any>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  const priceLabel = (item: { amount?: string; fromKey?: string; perKey?: string; priceKey?: string }) => {
    if (item.priceKey) return t(item.priceKey);
    const from = item.fromKey ? `${t(item.fromKey)} ` : '';
    const per = item.perKey ? t(item.perKey) : '';
    return `${from}${item.amount}${per}`;
  };

  const consultarDGI = () => {
    if (!nif.trim()) { Alert.alert(t('error'), t('svcEnterNif')); return; }
    setTaxLoading(true);
    setTimeout(() => {
      setTaxResult({ nif, estadoKey: 'svcTaxUpToDate', deuda: 0, periodo: '2025' });
      setTaxLoading(false);
    }, 1500);
  };

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
            <TouchableOpacity key={tab.id} style={[styles.tab, active === tab.id && styles.tabActive]} onPress={() => { setActive(tab.id); setTaxResult(null); setNif(''); }} activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabText, { color: active === tab.id ? Colors.accent : C.textTertiary }, active === tab.id && styles.tabTextActive]}>{t(tab.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {active === 'salud' && !selectedHealth && HEALTH.map(h => (
          <TouchableOpacity key={h.name} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => setSelectedHealth(h)} activeOpacity={0.7}>
            <Text style={styles.cardEmoji}>🏥</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: C.textPrimary }]}>{h.name}</Text>
              <Text style={[styles.cardSub, { color: C.textTertiary }]}>{t(h.typeKey)}</Text>
            </View>
            <Text style={[styles.arrow, { color: C.border }]}>›</Text>
          </TouchableOpacity>
        ))}
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
        {active === 'seguros' && INSURANCE.map(ins => (
          <TouchableOpacity key={ins.nameKey} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
            onPress={() => Alert.alert(
              t('svcRequestInsurance'),
              `${t('svcAgentWillContact')} "${t(ins.nameKey)}".\n\n${t('svcPriceWord')}: ${priceLabel(ins)}`,
            )} activeOpacity={0.7}>
            <Text style={styles.cardEmoji}>{ins.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: C.textPrimary }]}>{t(ins.nameKey)}</Text>
              <Text style={[styles.cardSub, { color: C.textTertiary }]}>{t(ins.descKey)}</Text>
              <Text style={styles.cardPrice}>{priceLabel(ins)}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {active === 'impuestos' && (
          <View style={styles.taxSection}>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{t('svcTaxQueryTitle')}</Text>
            <View style={[styles.inputWrap, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
              <TextInput style={[styles.input, { color: C.textPrimary }]} value={nif} onChangeText={setNif} placeholder={t('svcNifPlaceholder')} placeholderTextColor={C.textTertiary} />
            </View>
            <TouchableOpacity style={[styles.callBtn, !nif.trim() && { opacity: 0.5 }]} onPress={consultarDGI} disabled={!nif.trim() || taxLoading}>
              {taxLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.callBtnText}>{t('svcQueryDgi')}</Text>}
            </TouchableOpacity>
            {taxResult && (
              <View style={[styles.resultCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                {[
                  { label: 'NIF', value: taxResult.nif, highlight: false },
                  { label: t('svcTaxRowStatus'), value: t(taxResult.estadoKey), highlight: true },
                  { label: t('svcTaxRowPeriod'), value: taxResult.periodo, highlight: false },
                  { label: t('svcTaxRowDebt'), value: `${taxResult.deuda.toLocaleString()} XAF`, highlight: false },
                ].map(row => (
                  <View key={row.label} style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: C.textSecondary }]}>{row.label}</Text>
                    <Text style={[styles.resultValue, { color: C.textPrimary }, row.highlight && { color: Colors.accent }]}>{row.value}</Text>
                  </View>
                ))}
                <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095500')}>
                  <Text style={styles.callBtnText}>{t('svcCallDgi')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        {active === 'correos' && (
          <View>
            {POSTAL.map(p => (
              <View key={p.nameKey} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <Text style={styles.cardEmoji}>{p.icon}</Text>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: C.textPrimary }]}>{t(p.nameKey)}</Text>
                  <Text style={styles.cardPrice}>{priceLabel(p)}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095600')}>
              <Text style={styles.callBtnText}>{t('svcCallCorreosGq')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  detailType: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },
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
});
