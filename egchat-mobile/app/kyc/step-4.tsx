// KYC — Paso 4: Información Financiera
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { saveFinancialData } from '../../src/services/kycService';

const INCOME_OPTIONS = [
  { label: 'Menos de 200.000 XAF',         value: 'UNDER_100K'   },
  { label: '200.000 – 500.000 XAF',         value: '100K_500K'   },
  { label: '500.000 – 1.000.000 XAF',       value: '500K_1M'     },
  { label: 'Más de 1.000.000 XAF',          value: '1M_5M'       },
];

const FUND_SOURCES = [
  { label: 'Salario',         value: 'SALARY'     },
  { label: 'Negocio propio',  value: 'BUSINESS'   },
  { label: 'Remesas',         value: 'REMITTANCE' },
  { label: 'Inversiones',     value: 'INVESTMENT' },
  { label: 'Pensión',         value: 'PENSION'    },
  { label: 'Ahorros',         value: 'SAVINGS'    },
  { label: 'Otro',            value: 'OTHER'      },
];

export default function Step4() {
  const store = useKycStore();
  const fin   = store.financialData;

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
    if (!fin.profession.trim())        e.profession    = 'La profesión es obligatoria';
    if (!fin.monthlyIncomeRange)       e.income        = 'Selecciona un rango de ingresos';
    if (!fin.sourceOfFunds.length)     e.sources       = 'Selecciona al menos un origen de fondos';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const appId = store.applicationId;
      if (appId) await saveFinancialData(appId, fin);
      store.markStepComplete(4);
      store.setCurrentStep(5);
      await saveKycDraft({ ...store, currentStep: 5 } as any);
      router.push('/kyc/step-5');
    } catch {
      setErrors({ api: 'Error al guardar. Verifica tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const incomeLabel = INCOME_OPTIONS.find(o => o.value === fin.monthlyIncomeRange)?.label ?? '';

  return (
    <KycStepLayout
      step={4} completed={store.completedSteps}
      title="Información Financiera"
      onBack={() => router.push('/kyc/step-3')}
      onNext={handleNext}
      nextDisabled={loading}
      loading={loading}
      onExit={() => router.back()}
    >
      {/* Profesión */}
      <Text style={st.label}>Profesión / Ocupación <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <TextInput
        style={[st.input, !!errors.profession && st.inputError]}
        value={fin.profession}
        onChangeText={v => update({ profession: v })}
        placeholder="Comerciante, empleado, estudiante..."
        placeholderTextColor="#9ca3af"
        accessibilityLabel="Profesión u ocupación"
      />
      {!!errors.profession && <Text style={st.errorText}>{errors.profession}</Text>}

      {/* Empleador */}
      <Text style={st.label}>Empleador <Text style={st.optional}>(opcional)</Text></Text>
      <TextInput
        style={st.input}
        value={fin.employer}
        onChangeText={v => update({ employer: v })}
        placeholder="Nombre de la empresa o institución"
        placeholderTextColor="#9ca3af"
        accessibilityLabel="Empleador"
      />

      {/* Ingreso mensual */}
      <Text style={st.label}>Ingreso mensual estimado <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <TouchableOpacity
        style={[st.dropdown, !!errors.income && st.inputError]}
        onPress={() => setIncome(true)}
        accessibilityLabel="Seleccionar rango de ingresos"
      >
        <Text style={incomeLabel ? st.dropdownValue : st.dropdownPlaceholder}>
          {incomeLabel || 'Seleccionar rango...'}
        </Text>
        <Text style={st.arrow}>▾</Text>
      </TouchableOpacity>
      {!!errors.income && <Text style={st.errorText}>{errors.income}</Text>}

      {/* Origen de fondos */}
      <Text style={st.label}>Origen de los fondos <Text style={{ color: '#ef4444' }}>*</Text></Text>
      <Text style={st.sublabel}>Puedes seleccionar varios</Text>
      {FUND_SOURCES.map(src => {
        const checked = fin.sourceOfFunds.includes(src.value);
        return (
          <TouchableOpacity
            key={src.value}
            style={st.checkRow}
            onPress={() => toggleSource(src.value)}
            accessibilityRole="checkbox"
            accessibilityLabel={src.label}
          >
            <View style={[st.checkbox, checked && st.checkboxActive]}>
              {checked && <Text style={st.checkmark}>✓</Text>}
            </View>
            <Text style={st.checkLabel}>{src.label}</Text>
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
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>Ingreso mensual estimado</Text>
            <FlatList
              data={INCOME_OPTIONS}
              keyExtractor={i => i.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[st.sheetItem, item.value === fin.monthlyIncomeRange && st.sheetItemActive]}
                  onPress={() => { update({ monthlyIncomeRange: item.value }); setIncome(false); }}
                >
                  <Text style={[st.sheetItemText, item.value === fin.monthlyIncomeRange && { color: '#00C8A0', fontWeight: '700' }]}>
                    {item.label}
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
