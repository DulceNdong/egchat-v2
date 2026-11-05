// ══════════════════════════════════════════════════════════════════
// EGCHAT — KYC Paso 1: Datos Personales
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import {
  KycFormData, EMPTY_FORM, NATIONALITY_OPTIONS,
  loadKycDraftLocal, saveKycDraftLocal, validateStep1,
} from '../src/services/kyc';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../src/theme';
import { EGButton, EGErrorMessage } from '../src/components/ui';

// ── Componente barra de progreso KYC ─────────────────────────────
const KycProgressBar = ({ step, total = 3 }: { step: number; total?: number }) => (
  <View style={st.progressContainer}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[
          st.progressSegment,
          { backgroundColor: i < step ? '#00C8A0' : 'rgba(255,255,255,0.2)' },
        ]}
      />
    ))}
  </View>
);

// ── Campo de formulario reutilizable ─────────────────────────────
const Field = ({
  label, value, onChangeText, placeholder, keyboardType, required,
  hint, maxLength,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; required?: boolean;
  hint?: string; maxLength?: number;
}) => (
  <View style={st.fieldGroup}>
    <Text style={st.fieldLabel}>
      {label}{required && <Text style={st.required}> *</Text>}
    </Text>
    <TextInput
      style={st.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.3)"
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
      autoCapitalize="words"
    />
    {hint && <Text style={st.hint}>{hint}</Text>}
  </View>
);

// ── Selector de fecha simple (DD/MM/YYYY) ─────────────────────────
const DateField = ({ label, value, onChange, required }: {
  label: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) => {
  const [day, setDay]   = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]  = useState('');

  // Inicializar desde valor ISO 'YYYY-MM-DD'
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setDay(d || ''); setMonth(m || ''); setYear(y || '');
    }
  }, []);

  const emit = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    }
  };

  return (
    <View style={st.fieldGroup}>
      <Text style={st.fieldLabel}>
        {label}{required && <Text style={st.required}> *</Text>}
      </Text>
      <View style={st.dateRow}>
        <TextInput
          style={[st.input, st.dateInput]}
          value={day} placeholder="DD"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="number-pad" maxLength={2}
          onChangeText={v => { setDay(v); emit(v, month, year); }}
        />
        <Text style={st.dateSep}>/</Text>
        <TextInput
          style={[st.input, st.dateInput]}
          value={month} placeholder="MM"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="number-pad" maxLength={2}
          onChangeText={v => { setMonth(v); emit(day, v, year); }}
        />
        <Text style={st.dateSep}>/</Text>
        <TextInput
          style={[st.input, st.dateInputYear]}
          value={year} placeholder="AAAA"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="number-pad" maxLength={4}
          onChangeText={v => { setYear(v); emit(day, month, v); }}
        />
      </View>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════
export default function KycStep1() {
  const [form, setForm] = useState<KycFormData>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [showNationality, setShowNationality] = useState(false);
  const [showGender, setShowGender] = useState(false);

  const set = (key: keyof KycFormData) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  // Restaurar borrador guardado
  useEffect(() => {
    loadKycDraftLocal().then(draft => {
      if (Object.keys(draft).length > 0)
        setForm(f => ({ ...f, ...draft }));
    });
  }, []);

  const goNext = async () => {
    setError('');
    const err = validateStep1(form);
    if (err) { setError(err); return; }
    await saveKycDraftLocal(form);
    router.push('/kyc-step-2' as any);
  };

  const goBack = () => router.back();

  const selectedNationality = NATIONALITY_OPTIONS.find(n => n.code === form.nationality);
  const genderLabel = form.gender === 'M' ? '👨 Hombre'
    : form.gender === 'F' ? '👩 Mujer'
    : form.gender === 'O' ? '🧑 Prefiero no decirlo'
    : 'Seleccionar…';

  return (
    <LinearGradient colors={['#06283d', '#0a3d5e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* ── Header ── */}
          <View style={st.header}>
            <TouchableOpacity onPress={goBack} style={st.backBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 5l-7 7 7 7"/>
              </Svg>
            </TouchableOpacity>
            <View style={st.headerCenter}>
              <Text style={st.headerTitle}>Datos Personales</Text>
              <Text style={st.headerSub}>Paso 1 de 3</Text>
            </View>
            <View style={{ width: 36 }}/>
          </View>

          <KycProgressBar step={1}/>

          <ScrollView
            contentContainerStyle={st.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.sectionTitle}>Información básica</Text>
            <Text style={st.sectionSub}>
              Introduce tus datos tal como aparecen en tu documento de identidad oficial.
            </Text>

            <Field
              label="Nombre completo" required
              value={form.full_name} onChangeText={set('full_name')}
              placeholder="Ej. María López Nguema"
            />

            <DateField
              label="Fecha de nacimiento" required
              value={form.birth_date} onChange={set('birth_date')}
            />

            {/* Género */}
            <View style={st.fieldGroup}>
              <Text style={st.fieldLabel}>Género</Text>
              <TouchableOpacity
                style={st.selector}
                onPress={() => setShowGender(true)}
                activeOpacity={0.8}
              >
                <Text style={[st.selectorText, !form.gender && st.selectorPlaceholder]}>
                  {genderLabel}
                </Text>
                <Text style={st.selectorArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Nacionalidad */}
            <View style={st.fieldGroup}>
              <Text style={st.fieldLabel}>Nacionalidad <Text style={st.required}>*</Text></Text>
              <TouchableOpacity
                style={st.selector}
                onPress={() => setShowNationality(true)}
                activeOpacity={0.8}
              >
                <Text style={st.selectorText}>
                  {selectedNationality?.label || 'Seleccionar…'}
                </Text>
                <Text style={st.selectorArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <Text style={[st.sectionTitle, { marginTop: 8 }]}>Dirección (opcional)</Text>

            <Field
              label="Dirección"
              value={form.address} onChangeText={set('address')}
              placeholder="Calle, número, barrio…"
            />
            <Field
              label="Ciudad"
              value={form.city} onChangeText={set('city')}
              placeholder="Ej. Malabo, Bata…"
            />
            <Field
              label="Profesión / Ocupación"
              value={form.occupation} onChangeText={set('occupation')}
              placeholder="Ej. Comerciante, Funcionario…"
            />

            {error ? <EGErrorMessage text={error}/> : null}

            <EGButton
              title="Continuar — Paso 2 →"
              onPress={goNext}
              style={st.nextBtn}
            />

            <Text style={st.legalNote}>
              🔒 Datos cifrados y protegidos bajo normativa COBAC R-2023/01
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Modal: Nacionalidad ── */}
      <Modal visible={showNationality} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Selecciona tu nacionalidad</Text>
            <FlatList
              data={NATIONALITY_OPTIONS}
              keyExtractor={i => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[st.modalOption, form.nationality === item.code && st.modalOptionActive]}
                  onPress={() => { set('nationality')(item.code); setShowNationality(false); }}
                >
                  <Text style={st.modalOptionText}>{item.label}</Text>
                  {form.nationality === item.code && <Text style={st.modalCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={st.modalClose} onPress={() => setShowNationality(false)}>
              <Text style={st.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Género ── */}
      <Modal visible={showGender} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Género</Text>
            {[
              { code: 'M', label: '👨 Hombre' },
              { code: 'F', label: '👩 Mujer' },
              { code: 'O', label: '🧑 Prefiero no decirlo' },
            ].map(g => (
              <TouchableOpacity
                key={g.code}
                style={[st.modalOption, form.gender === g.code && st.modalOptionActive]}
                onPress={() => { set('gender')(g.code); setShowGender(false); }}
              >
                <Text style={st.modalOptionText}>{g.label}</Text>
                {form.gender === g.code && <Text style={st.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.modalClose} onPress={() => setShowGender(false)}>
              <Text style={st.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },

  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 4,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: { color: '#F87171' },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateInput: { flex: 1, textAlign: 'center' },
  dateInputYear: { flex: 1.6, textAlign: 'center' },
  dateSep: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '300' },

  selector: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  selectorPlaceholder: { color: 'rgba(255,255,255,0.3)' },
  selectorArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 20 },

  nextBtn: { marginTop: 20, marginBottom: 8 },
  legalNote: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0d2d4a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalOptionActive: { backgroundColor: 'rgba(0,200,160,0.1)', borderRadius: 8, paddingHorizontal: 8 },
  modalOptionText: { color: '#fff', fontSize: 15 },
  modalCheck: { color: '#00C8A0', fontSize: 16, fontWeight: '700' },
  modalClose: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
