import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import { cemacAPI, walletAPI } from '../src/api';

const COUNTRIES = [
  { flag: '🇬🇶', name: 'Guinea Ecuatorial', capital: 'Malabo', currency: 'XAF', phone: '+240' },
  { flag: '🇨🇲', name: 'Camerún', capital: 'Yaundé', currency: 'XAF', phone: '+237' },
  { flag: '🇨🇬', name: 'Congo', capital: 'Brazzaville', currency: 'XAF', phone: '+242' },
  { flag: '🇬🇦', name: 'Gabón', capital: 'Libreville', currency: 'XAF', phone: '+241' },
  { flag: '🇨🇫', name: 'Rep. Centroafricana', capital: 'Bangui', currency: 'XAF', phone: '+236' },
  { flag: '🇹🇩', name: 'Chad', capital: 'N\'Djamena', currency: 'XAF', phone: '+235' },
];

const CODIGOS: Record<string, string> = {
  'Guinea Ecuatorial': 'GQ', 'Camerún': 'CM', 'Congo': 'CG', 'Gabón': 'GA',
  'Rep. Centroafricana': 'CF', 'Chad': 'TD',
};

// La cartera de la app solo abre en Guinea Ecuatorial, así que el origen fijo.
const ORIGEN = 'GQ';

const SERVICIOS = [
  { icon: '💸', title: 'Transferencias CEMAC', desc: 'Envía dinero al resto de países de la zona', disponible: true },
  { icon: '🏦', title: 'Banca regional', desc: 'Servicios bancarios en toda la zona CEMAC', disponible: false },
  { icon: '✈️', title: 'Vuelos regionales', desc: 'Reserva vuelos entre los países de la CEMAC', disponible: false },
  { icon: '📋', title: 'Trámites consulares', desc: 'Información sobre visados y trámites', disponible: false },
  { icon: '🌐', title: 'Roaming CEMAC', desc: 'Usa tu número en toda la zona', disponible: false },
];

const fmt = (n: number) => Math.round(n || 0).toLocaleString('es-ES');

// La referencia es la clave de idempotencia del asiento: cambiar un campo
// descarta la referencia anterior para que el nuevo intento sea otro envío.
const nuevaReferencia = () => `APP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`;

export default function CemacScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const [comision, setComision] = useState<number | null>(null);
  const [minimo, setMinimo] = useState(1000);
  const [maximo, setMaximo] = useState(1000000);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [destino, setDestino] = useState('CM');
  const [nombre, setNombre] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [importe, setImporte] = useState('');
  const [referencia, setReferencia] = useState(nuevaReferencia);
  const [enviando, setEnviando] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);

  const cargar = useCallback(async () => {
    try {
      const [r, b, h] = await Promise.all([cemacAPI.rates(), walletAPI.getBalance(), cemacAPI.list()]);
      setComision(typeof r?.transfer_fee_flat === 'number' ? r.transfer_fee_flat : null);
      if (typeof r?.min_amount === 'number') setMinimo(r.min_amount);
      if (typeof r?.max_amount === 'number') setMaximo(r.max_amount);
      setSaldo(Number(b?.balance ?? 0));
      setHistorial(Array.isArray(h) ? h : []);
    } catch {
      // Sin respuesta el formulario sigue usable; el envío avisará del error.
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const monto = useMemo(() => Number(importe) || 0, [importe]);
  const total = comision === null ? monto : monto + comision;

  const enviar = async () => {
    if (!nombre.trim() || !cuenta.trim()) {
      Alert.alert('Faltan datos', 'Escribe el nombre y la cuenta del beneficiario.');
      return;
    }
    if (monto < minimo || monto > maximo) {
      Alert.alert('Importe fuera de rango', `Debe estar entre ${fmt(minimo)} y ${fmt(maximo)} XAF.`);
      return;
    }
    if (saldo !== null && total > saldo) {
      Alert.alert('Saldo insuficiente', `Necesitas ${fmt(total)} XAF y tu saldo es ${fmt(saldo)} XAF.`);
      return;
    }
    setEnviando(true);
    try {
      const r = await cemacAPI.create({
        from_country: ORIGEN,
        to_country: destino,
        beneficiary_name: nombre.trim(),
        beneficiary_account: cuenta.trim(),
        amount: monto,
        external_id: referencia,
      });
      Alert.alert(
        'Transferencia enviada',
        `${fmt(monto)} XAF a ${nombre.trim()} (${destino})\nComisión ${fmt(comision ?? 0)} XAF · Saldo ${fmt(Number(r?.balance ?? 0))} XAF`,
      );
      setNombre(''); setCuenta(''); setImporte('');
      await cargar();
    } catch (e: any) {
      Alert.alert('No se pudo enviar', String(e?.message || 'Revisa el importe e inténtalo de nuevo.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>🌍 Zona CEMAC</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Comunidad Económica y Monetaria de África Central</Text>
          <Text style={styles.bannerSub}>6 países · 1 moneda (XAF) · 55 millones de habitantes</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>TRANSFERENCIA CEMAC</Text>
        <View style={[styles.formCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>DESDE</Text>
            <Text style={[styles.originPill, { color: C.textPrimary }]}>🇬🇶 Guinea Ecuatorial</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>PAÍS DESTINO</Text>
          <View style={styles.chips}>
            {COUNTRIES.filter(c => c.name !== 'Guinea Ecuatorial').map(c => {
              const code = CODIGOS[c.name];
              const activo = code === destino;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => { setDestino(code); setReferencia(nuevaReferencia()); }}
                  style={[styles.chip, {
                    backgroundColor: activo ? C.accent : C.bgTertiary,
                    borderColor: activo ? C.accent : C.borderLight,
                  }]}
                >
                  <Text style={[styles.chipText, { color: activo ? C.white : C.textPrimary }]}>{c.flag} {code}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={nombre}
            onChangeText={v => { setNombre(v); setReferencia(nuevaReferencia()); }}
            placeholder="Nombre del beneficiario"
            placeholderTextColor={C.textTertiary}
            style={[styles.input, { color: C.textPrimary, backgroundColor: C.bgTertiary, borderColor: C.borderLight }]}
          />
          <TextInput
            value={cuenta}
            onChangeText={v => { setCuenta(v); setReferencia(nuevaReferencia()); }}
            placeholder="Cuenta o teléfono de destino"
            placeholderTextColor={C.textTertiary}
            autoCapitalize="none"
            style={[styles.input, { color: C.textPrimary, backgroundColor: C.bgTertiary, borderColor: C.borderLight }]}
          />
          <TextInput
            value={importe}
            onChangeText={v => { setImporte(v.replace(/[^\d]/g, '')); setReferencia(nuevaReferencia()); }}
            placeholder={`Importe en XAF (mín. ${fmt(minimo)})`}
            placeholderTextColor={C.textTertiary}
            keyboardType="number-pad"
            style={[styles.input, { color: C.textPrimary, backgroundColor: C.bgTertiary, borderColor: C.borderLight }]}
          />

          <View style={styles.summary}>
            <View style={styles.rowBetween}>
              <Text style={[styles.summaryKey, { color: C.textSecondary }]}>Importe</Text>
              <Text style={[styles.summaryVal, { color: C.textPrimary }]}>{fmt(monto)} XAF</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={[styles.summaryKey, { color: C.textSecondary }]}>Comisión</Text>
              <Text style={[styles.summaryVal, { color: C.textPrimary }]}>
                {comision === null ? 'consultando…' : `${fmt(comision)} XAF`}
              </Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={[styles.summaryKey, { color: C.textSecondary }]}>Total a descontar</Text>
              <Text style={[styles.summaryVal, { color: C.accent }]}>{fmt(total)} XAF</Text>
            </View>
            {saldo !== null && (
              <View style={styles.rowBetween}>
                <Text style={[styles.summaryKey, { color: C.textSecondary }]}>Tu saldo</Text>
                <Text style={[styles.summaryVal, { color: total > saldo ? '#D9534F' : C.textPrimary }]}>{fmt(saldo)} XAF</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: C.accent, opacity: enviando ? 0.6 : 1 }]}
            onPress={enviar}
            disabled={enviando}
            activeOpacity={0.85}
          >
            {enviando
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.sendBtnText}>Enviar transferencia</Text>}
          </TouchableOpacity>
        </View>

        {historial.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>TUS TRANSFERENCIAS</Text>
            {historial.slice(0, 8).map(t => (
              <View key={String(t.id ?? t.transfer_ref)} style={[styles.serviceCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <Text style={styles.serviceIcon}>{t.status === 'failed' ? '⚠️' : '💸'}</Text>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceTitle, { color: C.textPrimary }]}>
                    {fmt(Number(t.amount))} XAF · {t.from_country} → {t.to_country}
                  </Text>
                  <Text style={[styles.serviceDesc, { color: C.textSecondary }]}>
                    {t.beneficiary_name} · {t.status} · comisión {fmt(Number(t.fee))} XAF
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>PAÍSES MIEMBROS</Text>
        <View style={styles.countriesGrid}>
          {COUNTRIES.map(c => (
            <View key={c.name} style={[styles.countryCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={styles.countryFlag}>{c.flag}</Text>
              <Text style={[styles.countryName, { color: C.textPrimary }]}>{c.name}</Text>
              <Text style={[styles.countrySub, { color: C.textTertiary }]}>{c.capital}</Text>
              <Text style={styles.countryPhone}>{c.phone}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>SERVICIOS DE LA ZONA</Text>
        {SERVICIOS.map(s => (
          <View key={s.title} style={[styles.serviceCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
            <Text style={styles.serviceIcon}>{s.icon}</Text>
            <View style={styles.serviceInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.serviceTitle, { color: C.textPrimary }]}>{s.title}</Text>
                <View style={[styles.statusChip, { backgroundColor: s.disponible ? C.accentLight : C.bgTertiary }]}>
                  <Text style={[styles.statusChipText, { color: s.disponible ? C.accent : C.textTertiary }]}>
                    {s.disponible ? 'Disponible' : 'Próximamente'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.serviceDesc, { color: C.textSecondary }]}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.webBtn} onPress={() => Linking.openURL('https://www.cemac.int')}>
          <Text style={styles.webBtnText}>🌐 Sitio oficial CEMAC</Text>
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md },
  banner: {
    backgroundColor: '#00b96b', borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center',
  },
  bannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white, textAlign: 'center' },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm, textAlign: 'center' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  formCard: {
    borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5, marginTop: Spacing.xs },
  originPill: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
  },
  summary: { gap: 4, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  summaryKey: { fontSize: FontSize.sm },
  summaryVal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  sendBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  sendBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  countriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  countryCard: {
    width: '30%', backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  countryFlag: { fontSize: 32, marginBottom: Spacing.xs },
  countryName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  countrySub: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' },
  countryPhone: { fontSize: FontSize.xs, color: Colors.accent, marginTop: 2 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  serviceIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  serviceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusChip: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  webBtn: {
    backgroundColor: Colors.accentLight, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  webBtnText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },
});
