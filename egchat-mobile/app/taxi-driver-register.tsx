import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MIcon } from '../src/components/ui/MIcon';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { taxiAPI } from '../src/api';
import { toast } from '../src/components/Toast';

const ACCENT = '#6366F1';
const TEXT   = '#0F172A';
const SUB    = '#64748B';
const BORDER = '#EEF0F8';
const CARD   = '#FFFFFF';
const GREEN  = '#10B981';
const RED    = '#EF4444';

type Tab = 'info' | 'vehicle' | 'docs';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Moto', 'Pickup'];

const DOCS: { key: string; label: string; desc: string; req: boolean }[] = [
  { key: 'license',     label: 'Licencia de conducir',   desc: 'Foto frontal y trasera',         req: true  },
  { key: 'id',          label: 'Cedula / Pasaporte',     desc: 'Documento de identidad vigente', req: true  },
  { key: 'vehicle_doc', label: 'Tarjeta de circulacion', desc: 'Documento del vehiculo',         req: true  },
  { key: 'insurance',   label: 'Seguro del vehiculo',    desc: 'Poliza vigente',                 req: false },
  { key: 'photo',       label: 'Foto del vehiculo',      desc: 'Vista frontal del vehiculo',     req: false },
];

export default function TaxiDriverRegisterScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab]          = useState<Tab>('info');
  const [submitted, setSubmit] = useState(false);
  const [loading, setLoading]  = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', license: '',
    brand: '', model: '', year: '', color: '', plate: '', type: 'sedan',
  });
  const [docs, setDocs] = useState<Record<string, string>>({});

  const reqDone = DOCS.filter(d => d.req).every(d => !!docs[d.key]);

  const pickDoc = async (key: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galeria para subir documentos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const name = result.assets[0].uri.split('/').pop() || key;
      setDocs(prev => ({ ...prev, [key]: name }));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.plate || !reqDone) return;
    setLoading(true);
    try {
      await taxiAPI.registerDriver({
        name:    form.name,
        phone:   form.phone,
        license: form.license,
        vehicle: {
          brand: form.brand,
          model: form.model,
          year:  form.year,
          color: form.color,
          plate: form.plate,
          type:  form.type,
        },
      });
      setSubmit(true);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar la solicitud');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <MIcon name="check" size={40} color={GREEN} />
          </View>
          <Text style={s.successTitle}>Solicitud enviada</Text>
          <Text style={s.successSub}>
            Tu solicitud esta siendo revisada.{'\n'}Te contactaremos en 24-48 horas.
          </Text>
          <TouchableOpacity style={s.successBtn} onPress={() => router.back()}>
            <Text style={s.successBtnTxt}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={[s.header, { paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MIcon name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Soy conductor</Text>
          <Text style={s.headerSub}>Registrate en la flota MiTaxi</Text>
        </View>
        <View style={[s.stepBadge, { backgroundColor: ACCENT + '18' }]}>
          <Text style={[s.stepTxt, { color: ACCENT }]}>
            {tab === 'info' ? '1/3' : tab === 'vehicle' ? '2/3' : '3/3'}
          </Text>
        </View>
      </View>

      <View style={s.tabRow}>
        {(['info', 'vehicle', 'docs'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'info' ? 'Datos' : t === 'vehicle' ? 'Vehiculo' : 'Documentos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'info' && (
          <>
            {[
              { key: 'name',    label: 'NOMBRE COMPLETO',    placeholder: 'Carlos Nguema Obiang' },
              { key: 'phone',   label: 'TELEFONO',           placeholder: '+240 222 000 000'     },
              { key: 'license', label: 'NUMERO DE LICENCIA', placeholder: 'GE-2024-001234'       },
            ].map(f => (
              <View key={f.key} style={s.field}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  value={(form as any)[f.key]}
                  onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={SUB}
                  style={s.fieldInput}
                  keyboardType={f.key === 'phone' ? 'phone-pad' : 'default'}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[s.cta, (!form.name || !form.phone) && s.ctaDisabled]}
              disabled={!form.name || !form.phone}
              onPress={() => setTab('vehicle')}
            >
              <Text style={s.ctaTxt}>Continuar</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'vehicle' && (
          <>
            <View style={s.gridRow}>
              {[
                { key: 'brand', label: 'MARCA',  placeholder: 'Toyota'  },
                { key: 'model', label: 'MODELO', placeholder: 'Corolla' },
                { key: 'year',  label: 'ANO',    placeholder: '2020'    },
                { key: 'color', label: 'COLOR',  placeholder: 'Blanco'  },
              ].map(f => (
                <View key={f.key} style={[s.field, s.halfField]}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))}
                    placeholder={f.placeholder}
                    placeholderTextColor={SUB}
                    style={s.fieldInput}
                    keyboardType={f.key === 'year' ? 'number-pad' : 'default'}
                  />
                </View>
              ))}
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>MATRICULA</Text>
              <TextInput
                value={form.plate}
                onChangeText={v => setForm(x => ({ ...x, plate: v }))}
                placeholder="GE-1234"
                placeholderTextColor={SUB}
                style={s.fieldInput}
                autoCapitalize="characters"
              />
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>TIPO DE VEHICULO</Text>
              <View style={s.typeRow}>
                {VEHICLE_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.typeChip, form.type === t.toLowerCase() && s.typeChipActive]}
                    onPress={() => setForm(x => ({ ...x, type: t.toLowerCase() }))}
                  >
                    <Text style={[s.typeChipTxt, form.type === t.toLowerCase() && s.typeChipTxtActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[s.cta, !form.plate && s.ctaDisabled]}
              disabled={!form.plate}
              onPress={() => setTab('docs')}
            >
              <Text style={s.ctaTxt}>Continuar a Documentos</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'docs' && (
          <>
            <View style={s.docsNote}>
              <Text style={s.docsNoteTitle}>Documentos requeridos</Text>
              <Text style={s.docsNoteSub}>Los marcados con * son obligatorios.</Text>
            </View>
            {DOCS.map(doc => (
              <View key={doc.key} style={[s.docCard, !!docs[doc.key] && s.docCardDone]}>
                <View style={{ flex: 1 }}>
                  <View style={s.docLabelRow}>
                    <Text style={s.docLabel}>{doc.label}</Text>
                    {doc.req
                      ? <Text style={s.docReq}>*</Text>
                      : <View style={s.docOptBadge}><Text style={s.docOptTxt}>Opcional</Text></View>
                    }
                  </View>
                  <Text style={s.docDesc}>{doc.desc}</Text>
                  {!!docs[doc.key] && <Text style={s.docUploaded}>Subido: {docs[doc.key]}</Text>}
                </View>
                <TouchableOpacity
                  style={[s.uploadBtn, !!docs[doc.key] && s.uploadBtnDone]}
                  onPress={() => pickDoc(doc.key)}
                >
                  <Text style={[s.uploadBtnTxt, !!docs[doc.key] && s.uploadBtnTxtDone]}>
                    {docs[doc.key] ? 'Cambiar' : 'Subir'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[
                s.cta,
                (!(form.name && form.phone && form.plate && reqDone) || loading) && s.ctaDisabled,
              ]}
              disabled={!(form.name && form.phone && form.plate && reqDone) || loading}
              onPress={handleSubmit}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaTxt}>
                    {reqDone ? 'Enviar solicitud' : 'Sube los documentos obligatorios (*)'}
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#F8FAFF' },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { fontSize: 17, fontWeight: '700', color: TEXT },
  headerSub:         { fontSize: 12, color: SUB, marginTop: 1 },
  stepBadge:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  stepTxt:           { fontSize: 12, fontWeight: '700' },
  tabRow:            { flexDirection: 'row', backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, paddingHorizontal: 16, paddingVertical: 4, gap: 4 },
  tabBtn:            { flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center' },
  tabBtnActive:      { backgroundColor: ACCENT },
  tabTxt:            { fontSize: 13, fontWeight: '600', color: SUB },
  tabTxtActive:      { color: '#fff' },
  content:           { padding: 20, paddingBottom: 60, gap: 14 },
  field:             { backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  fieldLabel:        { fontSize: 11, fontWeight: '700', color: SUB, marginBottom: 6, letterSpacing: 0.6 },
  fieldInput:        { fontSize: 15, color: TEXT },
  gridRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  halfField:         { flex: 1, minWidth: '45%' as any },
  typeRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typeChip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD },
  typeChipActive:    { borderColor: ACCENT, backgroundColor: ACCENT + '18' },
  typeChipTxt:       { fontSize: 13, fontWeight: '600', color: SUB },
  typeChipTxtActive: { color: ACCENT },
  cta:               { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 6, shadowColor: ACCENT, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  ctaDisabled:       { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  ctaTxt:            { color: '#fff', fontSize: 16, fontWeight: '700' },
  docsNote:          { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: ACCENT + '40', backgroundColor: ACCENT + '12' },
  docsNoteTitle:     { fontSize: 13, fontWeight: '700', color: ACCENT },
  docsNoteSub:       { fontSize: 12, color: ACCENT, marginTop: 2, opacity: 0.7 },
  docCard:           { backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BORDER, flexDirection: 'row', alignItems: 'center', gap: 12 },
  docCardDone:       { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  docLabelRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  docLabel:          { fontSize: 14, fontWeight: '700', color: TEXT },
  docReq:            { fontSize: 12, color: RED, fontWeight: '700' },
  docOptBadge:       { backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  docOptTxt:         { fontSize: 10, color: SUB },
  docDesc:           { fontSize: 12, color: SUB },
  docUploaded:       { fontSize: 12, color: GREEN, marginTop: 4, fontWeight: '600' },
  uploadBtn:         { backgroundColor: ACCENT, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 9 },
  uploadBtnDone:     { backgroundColor: '#DCFCE7' },
  uploadBtnTxt:      { fontSize: 13, fontWeight: '700', color: '#fff' },
  uploadBtnTxtDone:  { color: GREEN },
  successWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 },
  successIcon:       { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  successTitle:      { fontSize: 22, fontWeight: '800', color: TEXT },
  successSub:        { fontSize: 15, color: SUB, textAlign: 'center', lineHeight: 24 },
  successBtn:        { backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14, marginTop: 8 },
  successBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
