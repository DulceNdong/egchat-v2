// KYC — Paso 4: Información Financiera
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { saveFinancialData } from '../../src/services/kycService';
import { getNetworkStatus } from '../../src/store/offlineStore';
import { enqueueKycAction } from '../../src/hooks/useKycOfflineSync';
import { useTranslation } from '../../src/context/LanguageContext';

// `value` es el código técnico enviado al backend; `labelKey` es la etiqueta visible.
const INCOME_OPTIONS = [
  { labelKey: 'kyIncomeUnder100k', value: 'UNDER_100K' },
  { labelKey: 'kyIncome100k500k',  value: '100K_500K'  },
  { labelKey: 'kyIncome500k1m',    value: '500K_1M'    },
  { labelKey: 'kyIncome1m5m',      value: '1M_5M'      },
];

const FUND_SOURCES = [
  { labelKey: 'kyFundSalary',      value: 'SALARY'     },
  { labelKey: 'kyFundBusiness',    value: 'BUSINESS'   },
  { labelKey: 'kyFundRemittance',  value: 'REMITTANCE' },
  { labelKey: 'kyFundInvestment',  value: 'INVESTMENT' },
  { labelKey: 'kyFundPension',     value: 'PENSION'    },
  { labelKey: 'kyFundSavings',     value: 'SAVINGS'    },
  { labelKey: 'setOther',          value: 'OTHER'      },
];

export default function Step4() {
  const store = useKycStore();
  const fin   = store.financialData;
  const { t } = useTranslation();

  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [showIncome, setIncome] = useState(false);

  const update = (patch: Partial<typeof fin>) => {
    store.setFinancialData(patch);
    saveKycDraft({ ...store, financialData: { ...fin, ...patch } } as any).catch(() => {});
  };

  const toggleSource = (value: string) => {
    const current = fin.sourceOfFunds;
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update({ sourceOfFunds: next });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fin.profession.trim())        e.profession    = t('kyProfessionRequired');
    if (!fin.monthlyIncomeRange)       e.income        = t('kyIncomeRangeRequired');
    if (!fin.sourceOfFunds.length)     e.sources       = t('kySourcesRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const appId = store.applicationId;
      if (appId) {
        if (getNetworkStatus().isOnline) {
          await saveFinancialData(appId, fin);
        } else {
          await enqueueKycAction({ type: 'financial', applicationId: appId, data: fin });
        }
      }
      store.markStepComplete(4);
      store.setCurrentStep(5);
      await saveKycDraft({ ...store, currentStep: 5 } as any);
      router.push('/kyc/step-5');
    } catch {
      setErrors({ api: t('kySaveConnectionError') });
    } finally {
      setLoading(false);
    }
  };

  const incomeLabel = (() => {
    const found = INCOME_OPTIONS.find(o => o.value === fin.monthlyIncomeRange);
    return found ? t(found.labelKey) : '';
  })();

  return (
    <KycStepLayout
      step={4} completed={store.completedSteps}
      title={t('kyFinancialInfo')}
      onBack={() => router.push('/kyc/step-3')}
      onNext={handleNext}
      nextDisabled={loading}
      loading={loading}
      onExit={() => router.back()}
    >
      {/* Profesión */}
      <Text style={st.label}>{t('kyProfessionOccupation')} <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <TextInput
        style={[st.input, !!errors.profession && st.inputError]}
        value={fin.profession}
        onChangeText={v => update({ profession: v })}
        placeholder={t('kyProfessionPlaceholder')}
        placeholderTextColor="#9ca3af"
        accessibilityLabel={t('kyProfessionOccupation')}
      />
      {!!errors.profession && <Text style={st.errorText}>{errors.profession}</Text>}

      {/* Empleador */}
      <Text style={st.label}>{t('kyEmployer')} <Text style={st.optional}>({t('optional')})</Text></Text>
      <TextInput
        style={st.input}
        value={fin.employer}
        onChangeText={v => update({ employer: v })}
        placeholder={t('kyEmployerPlaceholder')}
        placeholderTextColor="#9ca3af"
        accessibilityLabel={t('kyEmployer')}
      />

      {/* Fecha de caducidad del documento */}
      <Text style={[st.label, { marginTop: 16 }]}>{t('kyDocExpiryDate')}</Text>
      <Text style={st.hint}>{t('kyDocExpiryHint')}</Text>
      <TextInput
        style={st.input}
        value={fin.docExpiryDate ?? ''}
        onChangeText={v => update({ docExpiryDate: v })}
        placeholder="2030-12-31"
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        maxLength={10}
        accessibilityLabel={t('kyDocExpiryDateA11y')}
      />

      {/* Ingreso mensual */}
      <Text style={st.label}>{t('kyEstimatedMonthlyIncome')} <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <TouchableOpacity
        style={[st.dropdown, !!errors.income && st.inputError]}
        onPress={() => setIncome(true)}
        accessibilityLabel={t('kySelectIncomeRange')}
      >
        <Text style={incomeLabel ? st.dropdownValue : st.dropdownPlaceholder}>
          {incomeLabel || t('kySelectRangePlaceholder')}
        </Text>
        <Text style={st.arrow}>▾</Text>
      </TouchableOpacity>
      {!!errors.income && <Text style={st.errorText}>{errors.income}</Text>}

      {/* Origen de fondos */}
      <Text style={st.label}>{t('kyFundSource')} <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <Text style={st.sublabel}>{t('kySelectMultiple')}</Text>
      {FUND_SOURCES.map(src => {
        const checked = fin.sourceOfFunds.includes(src.value);
        return (
          <TouchableOpacity
            key={src.value}
            style={st.checkRow}
            onPress={() => toggleSource(src.value)}
            accessibilityRole="checkbox"
            accessibilityLabel={t(src.labelKey)}
          >
            <View style={[st.checkbox, checked && st.checkboxActive]}>
              {checked && <Text style={st.checkmark}>✓</Text>}
            </View>
            <Text style={st.checkLabel}>{t(src.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
      {!!errors.sources && <Text style={st.errorText}>{errors.sources}</Text>}

      {!!errors.api && (
        <View style={st.apiError}>
          <Text style={st.apiErrorText}>{errors.api}</Text>
        </View>
      )}

      {/* Modal income */}
      <Modal visible={showIncome} transparent animationType="slide" onRequestClose={() => setIncome(false)}>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setIncome(false)}>
          <View style={st.sheet} accessibilityViewIsModal={true} accessibilityLabel={t('kySelectMonthlyIncome')}>
            <Text style={st.sheetTitle}>{t('kyEstimatedMonthlyIncome')}</Text>
            <FlatList
              data={INCOME_OPTIONS}
              keyExtractor={i => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[st.sheetItem, item.value === fin.monthlyIncomeRange && st.sheetItemActive]}
                  onPress={() => { update({ monthlyIncomeRange: item.value }); setIncome(false); }}
                >
                  <Text style={[st.sheetItemText, item.value === fin.monthlyIncomeRange && { color: '#00C8A0', fontWeight: '700' }]}>
                    {t(item.labelKey)}
                  </Text>
                  {item.value === fin.monthlyIncomeRange && <Text style={{ color: '#00C8A0' }}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KycStepLayout>
  );
}

const BRAND = '#00C8A0';
const st = StyleSheet.create({
  label:       { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 6 },
  optional:    { fontWeight: '400', color: '#9ca3af' },
  hint:        { fontSize: 11, color: '#9ca3af', marginBottom: 6, lineHeight: 15 },
  sublabel:    { fontSize: 12, color: '#9ca3af', marginTop: -4, marginBottom: 8 },
  input:       { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fafafa' },
  inputError:  { borderColor: '#ef4444' },
  dropdown:    { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  dropdownValue:   { fontSize: 15, color: '#111827' },
  dropdownPlaceholder: { fontSize: 15, color: '#9ca3af' },
  arrow:       { fontSize: 14, color: '#9ca3af' },
  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: BRAND, borderColor: BRAND },
  checkmark:   { color: '#fff', fontSize: 13, fontWeight: '900' },
  checkLabel:  { fontSize: 14, color: '#374151' },
  errorText:   { fontSize: 12, color: '#ef4444', marginTop: 4 },
  apiError:    { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  apiErrorText:{ color: '#ef4444', fontSize: 13 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: '60%' },
  sheetTitle:  { fontSize: 16, fontWeight: '800', color: '#111827', paddingHorizontal: 20, marginBottom: 10 },
  sheetItem:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetItemActive: { backgroundColor: '#f0fdf9' },
  sheetItemText:   { fontSize: 15, color: '#374151' },
});
