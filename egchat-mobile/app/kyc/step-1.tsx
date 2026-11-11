// KYC — Paso 1: Datos Personales
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { KycStepLayout } from '../../src/components/kyc/KycStepLayout';
import { useKycStore } from '../../src/store/kycStore';
import { saveKycDraft } from '../../src/services/kycStorage';
import { savePersonalData, createKycApplication } from '../../src/services/kycService';
import { getNetworkStatus } from '../../src/store/offlineStore';
import { enqueueKycAction } from '../../src/hooks/useKycOfflineSync';
import { useTranslation } from '../../src/context/LanguageContext';

// ── Datos GE ──────────────────────────────────────────────────────
// Los nombres de provincia y ciudad son topónimos oficiales y a la vez
// claves de búsqueda / valores persistidos, por lo que se mantienen literalmente.
const GE_PROVINCES = [
  'Bioko Norte','Bioko Sur','Annobón','Centro Sur',
  'Djibloho','Kié-Ntem','Litoral','Wele-Nzas',
];
const GE_CITIES: Record<string, string[]> = {
  'Bioko Norte': ['Malabo','Baney','Rebola','Sampaca'],
  'Bioko Sur':   ['Luba','Moka','Riaba'],
  'Litoral':     ['Bata','Mbini','Cogo','Niefang'],
  'Centro Sur':  ['Evinayong','Akurenam'],
  'Kié-Ntem':    ['Ebebiyin','Mikomeseng'],
  'Wele-Nzas':   ['Mongomo','Añisok'],
  'Djibloho':    ['Oyala / Djibloho'],
  'Annobón':     ['San Antonio de Palé'],
};
// `value` es el código enviado al backend; `labelKey` es la texto visible.
const MARITAL_STATUS: { value: string; labelKey: string }[] = [
  { value: 'Soltero/a',     labelKey: 'kyMaritalSingle' },
  { value: 'Casado/a',      labelKey: 'kyMaritalMarried' },
  { value: 'Divorciado/a',  labelKey: 'kyMaritalDivorced' },
  { value: 'Viudo/a',       labelKey: 'kyMaritalWidowed' },
];
const NATIONALITIES: { value: string; labelKey: string }[] = [
  { value: 'GQ', labelKey: 'svcEquatorialGuinea' },
  { value: 'ES', labelKey: 'setCountrySpain' },
  { value: 'CM', labelKey: 'setCountryCameroon' },
  { value: 'GA', labelKey: 'setCountryGabon' },
  { value: 'NG', labelKey: 'setCountryNigeria' },
  { value: 'FR', labelKey: 'setCountryFrance' },
  { value: 'OT', labelKey: 'setOther' },
];

// ── Componentes UI menores ────────────────────────────────────────
function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={st.label}>
      {text}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
  );
}

function FieldInput({
  value, onChangeText, placeholder, keyboardType, error, accessibilityLabel,
}: {
  value: string; onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: any; error?: string; accessibilityLabel?: string;
}) {
  return (
    <>
      <TextInput
        style={[st.input, !!error && st.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={error}
      />
      {!!error && <Text style={st.errorText}>{error}</Text>}
    </>
  );
}

function DropdownField({
  label, value, options, onSelect, required, accessibilityLabel, placeholder,
}: {
  label: string; value: string; options: { value: string; labelKey?: string }[];
  onSelect: (v: string) => void; required?: boolean; accessibilityLabel?: string;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hint = placeholder ?? label;
  return (
    <>
      <FieldLabel text={label} required={required} />
      <TouchableOpacity
        style={st.dropdown}
        onPress={() => setOpen(true)}
        accessibilityLabel={accessibilityLabel ?? hint}
        accessibilityRole="button"
      >
        <Text style={value ? st.dropdownValue : st.dropdownPlaceholder}>
          {value || hint}
        </Text>
        <Text style={st.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={st.sheet} accessibilityViewIsModal={true} accessibilityLabel={hint}>
            <Text style={st.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i.value}
              renderItem={({ item }) => {
                const text = item.labelKey ? t(item.labelKey) : item.value;
                const selected = item.value === value || text === value;
                return (
                  <TouchableOpacity
                    style={[st.sheetItem, selected && st.sheetItemActive]}
                    onPress={() => { onSelect(item.value); setOpen(false); }}
                  >
                    <Text style={[st.sheetItemText, selected && st.sheetItemTextActive]}>
                      {text}
                    </Text>
                    {selected && <Text style={{ color: '#00C8A0' }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function Step1() {
  const store = useKycStore();
  const d     = store.personalData;
  const { t } = useTranslation();

  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  // Auto-save al cambiar cualquier campo
  const update = useCallback((patch: Partial<typeof d>) => {
    store.setPersonalData(patch);
    saveKycDraft({ ...store, personalData: { ...d, ...patch } } as any).catch(() => {});
  }, [store, d]);

  // Validación
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!d.fullName.trim())      e.fullName    = t('kyFullNameRequired');
    if (!d.dateOfBirth)          e.dateOfBirth = t('kyDobRequired');
    else {
      const [y, m, day] = d.dateOfBirth.split('-').map(Number);
      const date = new Date(y, m - 1, day);
      const now = new Date();
      if (isNaN(date.getTime()) || day < 1 || day > 31 || m < 1 || m > 12)
        e.dateOfBirth = t('kyDobInvalid');
      else if (date > now)
        e.dateOfBirth = t('kyDobFuture');
      else if (y < 1920)
        e.dateOfBirth = t('kyDobTooOld');
    }
    if (!d.placeOfBirth.trim())  e.placeOfBirth = t('kyPlaceOfBirthRequired');
    if (!d.sex)                  e.sex         = t('kySexRequired');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
                                 e.email       = t('kyEmailInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Parsear DD/MM/AAAA → YYYY-MM-DD
  const [dobDay, setDobDay]   = useState(() => d.dateOfBirth ? d.dateOfBirth.split('-')[2] : '');
  const [dobMonth, setDobMonth] = useState(() => d.dateOfBirth ? d.dateOfBirth.split('-')[1] : '');
  const [dobYear, setDobYear]   = useState(() => d.dateOfBirth ? d.dateOfBirth.split('-')[0] : '');

  const handleDobChange = (day: string, month: string, year: string) => {
    const d2 = day.replace(/\D/g, '').slice(0, 2);
    const m2 = month.replace(/\D/g, '').slice(0, 2);
    const y2 = year.replace(/\D/g, '').slice(0, 4);
    if (d2 !== undefined) setDobDay(d2);
    if (m2 !== undefined) setDobMonth(m2);
    if (y2 !== undefined) setDobYear(y2);
    if (d2.length === 2 && m2.length === 2 && y2.length === 4) {
      const iso = `${y2}-${m2.padStart(2,'0')}-${d2.padStart(2,'0')}`;
      update({ dateOfBirth: iso });
    } else {
      update({ dateOfBirth: '' });
    }
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Crear aplicación si no existe
      let appId = store.applicationId;
      if (!appId) {
        if (getNetworkStatus().isOnline) {
          const { applicationId, sessionId } = await createKycApplication();
          store.setApplicationId(applicationId);
          store.setSessionId(sessionId);
          appId = applicationId;
        } else {
          appId = `local_${Date.now()}`;
          store.setApplicationId(appId);
          store.setSessionId(`offline_${Date.now()}`);
        }
      }
      if (getNetworkStatus().isOnline) {
        await savePersonalData(appId, d);
      } else {
        await enqueueKycAction({ type: 'personal', applicationId: appId, data: d });
      }
      store.markStepComplete(1);
      store.setCurrentStep(2);
      await saveKycDraft({ ...store, currentStep: 2, completedSteps: [...store.completedSteps, 1] } as any);
      router.push('/kyc/step-2');
    } catch (e: any) {
      console.error('[KYC step-1]', e?.message, e);
      setErrors({ api: `${t('setSaveError')}: ${e?.message ?? t('kyUnknown')}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KycStepLayout
      step={1}
      completed={store.completedSteps}
      title={t('kyPersonalData')}
      onNext={handleNext}
      nextDisabled={loading}
      loading={loading}
      onExit={() => router.back()}
    >
      {/* Nombre */}
      <FieldLabel text={t('fullName')} required />
      <FieldInput
        value={d.fullName}
        onChangeText={v => update({ fullName: v })}
        placeholder={t('kyFullNameExample')}
        error={errors.fullName}
        accessibilityLabel={t('fullName')}
      />

      {/* Fecha de nacimiento */}
      <FieldLabel text={t('kyDateOfBirth')} required />
      <View style={st.dobRow}>
        <TextInput
          style={[st.dobInput, !!errors.dateOfBirth && st.inputError]}
          value={dobDay}
          onChangeText={v => handleDobChange(v, dobMonth, dobYear)}
          placeholder="DD"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('kyDayOfBirth')}
        />
        <Text style={st.dobSep}>/</Text>
        <TextInput
          style={[st.dobInput, !!errors.dateOfBirth && st.inputError]}
          value={dobMonth}
          onChangeText={v => handleDobChange(dobDay, v, dobYear)}
          placeholder="MM"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel={t('kyMonthOfBirth')}
        />
        <Text style={st.dobSep}>/</Text>
        <TextInput
          style={[st.dobInputYear, !!errors.dateOfBirth && st.inputError]}
          value={dobYear}
          onChangeText={v => handleDobChange(dobDay, dobMonth, v)}
          placeholder="AAAA"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t('kyYearOfBirth')}
        />
      </View>
      {!!errors.dateOfBirth && <Text style={st.errorText}>{errors.dateOfBirth}</Text>}

      {/* Lugar de nacimiento */}
      <FieldLabel text={t('kyPlaceOfBirth')} required />
      <FieldInput
        value={d.placeOfBirth}
        onChangeText={v => update({ placeOfBirth: v })}
        placeholder="Malabo"
        error={errors.placeOfBirth}
        accessibilityLabel={t('kyPlaceOfBirth')}
      />

      {/* Nacionalidad */}
      <DropdownField
        label={t('kyNationality')}
        value={d.nationality}
        options={NATIONALITIES}
        placeholder={t('kySelectNationality')}
        onSelect={v => update({ nationality: v })}
        accessibilityLabel={t('kySelectNationality')}
      />

      {/* Sexo */}
      <FieldLabel text={t('kySex')} required />
      <View style={st.radioRow}>
        {(['M','F'] as const).map(val => (
          <TouchableOpacity
            key={val}
            style={[st.radioBtn, d.sex === val && st.radioBtnActive]}
            onPress={() => update({ sex: val })}
            accessibilityLabel={val === 'M' ? t('kyMale') : t('kyFemale')}
            accessibilityRole="radio"
          >
            <View style={[st.radioCircle, d.sex === val && st.radioCircleActive]} />
            <Text style={st.radioText}>{val === 'M' ? t('kyMale') : t('kyFemale')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!errors.sex && <Text style={st.errorText}>{errors.sex}</Text>}

      {/* Estado civil */}
      <DropdownField
        label={t('kyMaritalStatus')}
        value={d.maritalStatus}
        options={MARITAL_STATUS}
        placeholder={t('kySelectMaritalStatus')}
        onSelect={v => update({ maritalStatus: v })}
      />

      {/* Provincia */}
      <DropdownField
        label={t('kyProvince')}
        value={d.province}
        options={GE_PROVINCES.map(p => ({ value: p }))}
        placeholder={t('kySelectProvince')}
        onSelect={v => update({ province: v, city: '' })}
      />

      {/* Ciudad */}
      <DropdownField
        label={t('kyCity')}
        value={d.city}
        options={(d.province ? (GE_CITIES[d.province] ?? []) : []).map(c => ({ value: c }))}
        placeholder={t('kySelectCity')}
        onSelect={v => update({ city: v })}
      />

      {/* Dirección */}
      <FieldLabel text={t('setAddress')} />
      <FieldInput
        value={d.address}
        onChangeText={v => update({ address: v })}
        placeholder={t('kyAddressPlaceholder')}
        accessibilityLabel={t('setAddress')}
      />

      {/* Teléfono */}
      <FieldLabel text={t('phone')} />
      <FieldInput
        value={d.phone}
        onChangeText={v => update({ phone: v })}
        keyboardType="phone-pad"
        placeholder="+240 222 000 000"
        accessibilityLabel={t('kyPhoneNumber')}
      />

      {/* Email */}
      <FieldLabel text={`${t('kyEmail')} (${t('optional')})`} />
      <FieldInput
        value={d.email}
        onChangeText={v => update({ email: v })}
        keyboardType="email-address"
        placeholder={t('kyEmailPlaceholder')}
        error={errors.email}
        accessibilityLabel={t('kyEmailFull')}
      />

      {!!errors.api && (
        <View style={st.apiError}>
          <Text style={st.apiErrorText}>{errors.api}</Text>
        </View>
      )}
    </KycStepLayout>
  );
}

const BRAND = '#00C8A0';
const st = StyleSheet.create({
  label:              { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 6 },
  input:              { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#fafafa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputError:         { borderColor: '#ef4444' },
  errorText:          { fontSize: 12, color: '#ef4444', marginTop: 4 },
  dropdown:           { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  dropdownValue:      { fontSize: 15, color: '#111827' },
  dropdownPlaceholder:{ fontSize: 15, color: '#9ca3af' },
  dropdownArrow:      { fontSize: 14, color: '#9ca3af' },
  radioRow:           { flexDirection: 'row', gap: 12 },
  radioBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, padding: 12 },
  radioBtnActive:     { borderColor: BRAND, backgroundColor: '#f0fdf9' },
  radioCircle:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db' },
  radioCircleActive:  { borderColor: BRAND, backgroundColor: BRAND },
  radioText:          { fontSize: 14, color: '#374151', fontWeight: '600' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: '70%' },
  sheetTitle:         { fontSize: 16, fontWeight: '800', color: '#111827', paddingHorizontal: 20, marginBottom: 10 },
  sheetItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetItemActive:    { backgroundColor: '#f0fdf9' },
  sheetItemText:      { fontSize: 15, color: '#374151' },
  sheetItemTextActive:{ color: BRAND, fontWeight: '700' },
  apiError:           { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 8 },
  apiErrorText:       { color: '#ef4444', fontSize: 13 },
  dobRow:             { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dobInput:           { flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, fontSize: 16, color: '#111827', backgroundColor: '#fafafa', textAlign: 'center' },
  dobInputYear:       { flex: 2, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12, fontSize: 16, color: '#111827', backgroundColor: '#fafafa', textAlign: 'center' },
  dobSep:             { fontSize: 20, color: '#9ca3af', fontWeight: '300' },
});
