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

// ── Datos GE ──────────────────────────────────────────────────────
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
const MARITAL_STATUS = ['Soltero/a','Casado/a','Divorciado/a','Viudo/a'];
const NATIONALITIES  = ['GQ - Guinea Ecuatorial','ES - España','CM - Camerún','GA - Gabón','NG - Nigeria','FR - Francia','Otro'];

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
  label, value, options, onSelect, required, accessibilityLabel,
}: {
  label: string; value: string; options: string[];
  onSelect: (v: string) => void; required?: boolean; accessibilityLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FieldLabel text={label} required={required} />
      <TouchableOpacity
        style={st.dropdown}
        onPress={() => setOpen(true)}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
      >
        <Text style={value ? st.dropdownValue : st.dropdownPlaceholder}>
          {value || `Seleccionar ${label.toLowerCase()}`}
        </Text>
        <Text style={st.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={st.sheet} accessibilityViewIsModal={true} accessibilityLabel={`Seleccionar ${label}`}>
            <Text style={st.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[st.sheetItem, item === value && st.sheetItemActive]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[st.sheetItemText, item === value && st.sheetItemTextActive]}>
                    {item}
                  </Text>
                  {item === value && <Text style={{ color: '#00C8A0' }}>✓</Text>}
                </TouchableOpacity>
              )}
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
    if (!d.fullName.trim())      e.fullName    = 'El nombre completo es obligatorio';
    if (!d.dateOfBirth)          e.dateOfBirth = 'La fecha de nacimiento es obligatoria';
    else {
      const [y, m, day] = d.dateOfBirth.split('-').map(Number);
      const date = new Date(y, m - 1, day);
      const now = new Date();
      if (isNaN(date.getTime()) || day < 1 || day > 31 || m < 1 || m > 12)
        e.dateOfBirth = 'Fecha no válida';
      else if (date > now)
        e.dateOfBirth = 'La fecha no puede ser futura';
      else if (y < 1920)
        e.dateOfBirth = 'Año demasiado antiguo';
    }
    if (!d.placeOfBirth.trim())  e.placeOfBirth = 'El lugar de nacimiento es obligatorio';
    if (!d.sex)                  e.sex         = 'El sexo es obligatorio';
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
                                 e.email       = 'El email no es válido';
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
      setErrors({ api: `Error al guardar: ${e?.message ?? 'desconocido'}` });
    } finally {
      setLoading(false);
    }
  };

  const dateValue = d.dateOfBirth ? new Date(d.dateOfBirth) : new Date(1990, 0, 1);

  return (
    <KycStepLayout
      step={1}
      completed={store.completedSteps}
      title="Datos Personales"
      onNext={handleNext}
      nextDisabled={loading}
      loading={loading}
      onExit={() => router.back()}
    >
      {/* Nombre */}
      <FieldLabel text="Nombre completo" required />
      <FieldInput
        value={d.fullName}
        onChangeText={v => update({ fullName: v })}
        placeholder="Juan Carlos Nguema Mbá"
        error={errors.fullName}
        accessibilityLabel="Nombre completo"
      />

      {/* Fecha de nacimiento */}
      <FieldLabel text="Fecha de nacimiento" required />
      <View style={st.dobRow}>
        <TextInput
          style={[st.dobInput, !!errors.dateOfBirth && st.inputError]}
          value={dobDay}
          onChangeText={v => handleDobChange(v, dobMonth, dobYear)}
          placeholder="DD"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel="Día de nacimiento"
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
          accessibilityLabel="Mes de nacimiento"
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
          accessibilityLabel="Año de nacimiento"
        />
      </View>
      {!!errors.dateOfBirth && <Text style={st.errorText}>{errors.dateOfBirth}</Text>}

      {/* Lugar de nacimiento */}
      <FieldLabel text="Lugar de nacimiento" required />
      <FieldInput
        value={d.placeOfBirth}
        onChangeText={v => update({ placeOfBirth: v })}
        placeholder="Malabo"
        error={errors.placeOfBirth}
        accessibilityLabel="Lugar de nacimiento"
      />

      {/* Nacionalidad */}
      <DropdownField
        label="Nacionalidad"
        value={d.nationality}
        options={NATIONALITIES}
        onSelect={v => update({ nationality: v.split(' - ')[0] })}
        accessibilityLabel="Seleccionar nacionalidad"
      />

      {/* Sexo */}
      <FieldLabel text="Sexo" required />
      <View style={st.radioRow}>
        {(['M','F'] as const).map(val => (
          <TouchableOpacity
            key={val}
            style={[st.radioBtn, d.sex === val && st.radioBtnActive]}
            onPress={() => update({ sex: val })}
            accessibilityLabel={val === 'M' ? 'Masculino' : 'Femenino'}
            accessibilityRole="radio"
          >
            <View style={[st.radioCircle, d.sex === val && st.radioCircleActive]} />
            <Text style={st.radioText}>{val === 'M' ? 'Masculino' : 'Femenino'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!errors.sex && <Text style={st.errorText}>{errors.sex}</Text>}

      {/* Estado civil */}
      <DropdownField
        label="Estado civil"
        value={d.maritalStatus}
        options={MARITAL_STATUS}
        onSelect={v => update({ maritalStatus: v })}
      />

      {/* Provincia */}
      <DropdownField
        label="Provincia"
        value={d.province}
        options={GE_PROVINCES}
        onSelect={v => update({ province: v, city: '' })}
      />

      {/* Ciudad */}
      <DropdownField
        label="Ciudad"
        value={d.city}
        options={d.province ? (GE_CITIES[d.province] ?? []) : []}
        onSelect={v => update({ city: v })}
      />

      {/* Dirección */}
      <FieldLabel text="Dirección" />
      <FieldInput
        value={d.address}
        onChangeText={v => update({ address: v })}
        placeholder="Calle, número, barrio..."
        accessibilityLabel="Dirección"
      />

      {/* Teléfono */}
      <FieldLabel text="Teléfono" />
      <FieldInput
        value={d.phone}
        onChangeText={v => update({ phone: v })}
        keyboardType="phone-pad"
        placeholder="+240 222 000 000"
        accessibilityLabel="Número de teléfono"
      />

      {/* Email */}
      <FieldLabel text="Email (opcional)" />
      <FieldInput
        value={d.email}
        onChangeText={v => update({ email: v })}
        keyboardType="email-address"
        placeholder="correo@ejemplo.com"
        error={errors.email}
        accessibilityLabel="Correo electrónico"
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
});
