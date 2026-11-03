import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { serviciosAPI, taxiAPI } from '../src/api';
import { EGInput, EGButton } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

// La presentacion es local; el precio lo pone service_tariffs en el servidor.
const RIDE_PRESENTATION: Record<string, { label: string; sub: string; eta: string; color: string; icon: string }> = {
  moto:     { label: 'Moto',    sub: '1 pasajero',   eta: '2 min', color: '#F97316', icon: '🏍️' },
  basic:    { label: 'Taxi',    sub: '4 pasajeros',  eta: '4 min', color: '#EAB308', icon: '🚕' },
  premium:  { label: 'VIP',     sub: 'Premium',      eta: '7 min', color: '#7C3AED', icon: '🚘' },
};

type Ride = { id: string; label: string; sub: string; eta: string; color: string; icon: string; price: number | null };

export default function MiTaxiScreen() {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [rides, setRides] = useState<Ride[]>([]);
  const [selected, setSelected] = useState<Ride | null>(null);
  const [step, setStep] = useState<'form' | 'searching' | 'matched'>('form');
  const [loading, setLoading] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const [charged, setCharged] = useState<number | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await serviciosAPI.tarifas();
        if (!vivo) return;
        const lista: Ride[] = (res?.tarifas || [])
          .filter((t: any) => t.service === 'taxi')
          .map((t: any) => ({
            id: t.variant,
            price: Number(t.amount),
            ...(RIDE_PRESENTATION[t.variant] || { label: t.variant, sub: '', eta: '', color: Colors.accent, icon: '🚕' }),
          }));
        setRides(lista);
        setSelected(lista.find(r => r.id === 'basic') || lista[0] || null);
      } catch {
        Alert.alert('Sin conexión', 'No se pudieron cargar las tarifas del taxi.');
      }
    })();
    return () => { vivo = false; };
  }, []);

  const requestRide = async () => {
    if (!origin.trim() || !dest.trim()) { Alert.alert('Error', 'Introduce origen y destino'); return; }
    if (!selected) { Alert.alert('Tarifas no disponibles', 'Revisa tu conexión e inténtalo de nuevo.'); return; }
    setLoading(true);
    setStep('searching');
    try {
      const res = await taxiAPI.requestRide({ address: origin }, { address: dest }, selected.id);
      setRideId(res.rideId);
      setDriver(res.driver || null);
      setCharged(Number(res.tarifa));
      setEtaMin(Number(res.eta) || null);
      setStep('matched');
      Alert.alert('Viaje solicitado', `Te hemos cobrado ${Number(res.tarifa).toLocaleString()} XAF.\nSaldo: ${Number(res.balance).toLocaleString()} XAF`);
    } catch (e: any) {
      setStep('form');
      Alert.alert('No se pudo pedir el taxi', e?.message || 'Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!rideId) { cancelLocal(); return; }
    setLoading(true);
    try {
      const res = await taxiAPI.cancelRide(rideId);
      const devuelto = Number(res?.reembolsado || 0);
      cancelLocal();
      Alert.alert('Viaje cancelado', devuelto
        ? `Se han devuelto ${devuelto.toLocaleString()} XAF a tu monedero.\nSaldo: ${Number(res?.balance || 0).toLocaleString()} XAF`
        : 'No se ha devuelto dinero porque el viaje no estaba cobrado.');
    } catch (e: any) {
      Alert.alert('Error al cancelar', e?.message || 'Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cancelLocal = () => {
    setStep('form');
    setOrigin('');
    setDest('');
    setRideId(null);
    setCharged(null);
    setEtaMin(null);
    setDriver(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>🚕 MiTaxi</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {step === 'form' && (
          <>
            <EGInput label="Origen" value={origin} onChangeText={setOrigin} placeholder="¿Dónde estás?" />
            <EGInput label="Destino" value={dest} onChangeText={setDest} placeholder="¿A dónde vas?" />
            <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>TIPO DE VEHÍCULO</Text>
            {!rides.length && (
              <Text style={[styles.searchSub, { color: C.textSecondary }]}>Cargando tarifas…</Text>
            )}
            {rides.map(r => (
              <TouchableOpacity key={r.id} style={[styles.rideCard, { backgroundColor: C.bgSecondary, borderColor: selected?.id === r.id ? r.color : C.borderLight }, selected?.id === r.id && { borderWidth: 2 }]} onPress={() => setSelected(r)} activeOpacity={0.7}>
                <View style={[styles.rideIcon, { backgroundColor: r.color + '20' }]}><Text style={styles.rideEmoji}>{r.icon}</Text></View>
                <View style={styles.rideInfo}>
                  <Text style={[styles.rideName, { color: C.textPrimary }]}>{r.label}</Text>
                  <Text style={[styles.rideSub, { color: C.textTertiary }]}>{r.sub} · {r.eta}</Text>
                </View>
                <Text style={[styles.ridePrice, { color: r.color }]}>{r.price === null ? '—' : `${r.price.toLocaleString()} XAF`}</Text>
              </TouchableOpacity>
            ))}
            <EGButton title="Pedir taxi" onPress={requestRide} loading={loading} disabled={!selected} style={{ marginTop: Spacing.md }} />
            {selected && (
              <Text style={[styles.searchSub, { color: C.textTertiary, textAlign: 'center' }]}>
                El importe se cobra de tu monedero al solicitar el viaje
              </Text>
            )}
          </>
        )}
        {step === 'searching' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={[styles.searchTitle, { color: C.textPrimary }]}>Buscando conductor...</Text>
            <Text style={[styles.searchSub, { color: C.textSecondary }]}>Esto puede tardar unos segundos</Text>
          </View>
        )}
        {step === 'matched' && (
          <>
            <View style={[styles.driverCard, { backgroundColor: C.bgSecondary }]}>
              <View style={styles.driverAvatar}><Text style={styles.driverInitials}>CN</Text></View>
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName, { color: C.textPrimary }]}>{driver?.name || 'Conductor'}</Text>
                <Text style={[styles.driverSub, { color: C.textSecondary }]}>
                  {driver?.rating ? `⭐ ${driver.rating} · ` : ''}{driver?.vehicle || ''}{driver?.plate ? ` · ${driver.plate}` : ''}
                </Text>
              </View>
            </View>
            <View style={[styles.tripInfo, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={[styles.tripRow, { color: C.textPrimary }]}>📍 {origin}</Text>
              <Text style={[styles.tripArrow, { color: C.textTertiary }]}>↓</Text>
              <Text style={[styles.tripRow, { color: C.textPrimary }]}>🏁 {dest}</Text>
              <Text style={[styles.tripRow, { color: C.textTertiary }]}>Ref: {rideId}</Text>
            </View>
            <Text style={[styles.eta, { color: C.textPrimary }]}>🕐 {etaMin ? `Llegará en ${etaMin} min` : 'Llegará en unos minutos'}</Text>
            <Text style={styles.fare}>Cobrado: {(charged ?? 0).toLocaleString()} XAF</Text>
            <EGButton title="Cancelar viaje" onPress={cancel} variant="danger" loading={loading} style={{ marginTop: Spacing.md }} />
          </>
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
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginTop: Spacing.md },
  rideCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  rideIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  rideEmoji: { fontSize: 24 },
  rideInfo: { flex: 1 },
  rideName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rideSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  ridePrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  center: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  searchTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  searchSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, gap: Spacing.md, ...Shadow.lg,
  },
  driverAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  driverInitials: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  driverSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  tripInfo: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  tripRow: { fontSize: FontSize.base, color: Colors.textPrimary },
  tripArrow: { fontSize: 18, color: Colors.textTertiary, marginVertical: 4, marginLeft: 4 },
  eta: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  fare: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.accent, textAlign: 'center', marginTop: Spacing.sm },
});
