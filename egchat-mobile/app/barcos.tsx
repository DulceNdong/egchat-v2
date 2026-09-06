/**
 * EGChat — Servicio de Barcos
 * Compra billetes de viaje marítimo en Guinea Ecuatorial
 * Rutas: Malabo → Bata, Malabo → Annobón, Malabo → Douala
 * Compañías: San Valentín, Doña Cándida (Viteoca)
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { walletAPI } from '../src/api';
import { toast } from '../src/components/Toast';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme';
import { DarkColors } from '../src/theme/darkMode';

const SHIPS = [
  {
    id: 'san_valentin',
    name: 'San Valentín',
    company: 'Compañía Nacional Marítima',
    capacity: 320,
    icon: '🚢',
    color: '#0EA5E9',
    amenities: ['Cafetería', 'Asientos reclinables', 'Wi-Fi', 'Climatización'],
  },
  {
    id: 'dona_candida',
    name: 'Doña Cándida',
    company: 'Viteoca',
    capacity: 280,
    icon: '⛴️',
    color: '#10B981',
    amenities: ['Restaurante', 'Cabinas privadas', 'Terraza', 'TV'],
  },
];

const ROUTES = [
  {
    id: 'malabo_bata',
    from: 'Malabo', to: 'Bata',
    duration: '8-10 horas',
    distance: '320 km',
    price: { economy: 25000, business: 45000 },
    departures: ['06:00', '18:00'],
    days: 'Lun, Mié, Vie, Dom',
  },
  {
    id: 'malabo_annobon',
    from: 'Malabo', to: 'Annobón',
    duration: '18-20 horas',
    distance: '700 km',
    price: { economy: 55000, business: 90000 },
    departures: ['08:00'],
    days: 'Sábado',
  },
  {
    id: 'malabo_douala',
    from: 'Malabo', to: 'Douala (Camerún)',
    duration: '12-14 horas',
    distance: '450 km',
    price: { economy: 35000, business: 60000 },
    departures: ['07:00', '19:00'],
    days: 'Mar, Jue, Sáb',
  },
];

type Step = 'route' | 'ship' | 'class' | 'passengers' | 'confirm' | 'success';

export default function BarcosScreen() {
  const [step, setStep] = useState<Step>('route');
  const [route, setRoute] = useState<typeof ROUTES[0] | null>(null);
  const [ship, setShip] = useState<typeof SHIPS[0] | null>(null);
  const [ticketClass, setTicketClass] = useState<'economy' | 'business'>('economy');
  const [passengers, setPassengers] = useState(1);
  const [departure, setDeparture] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerDNI, setPassengerDNI] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  const totalPrice = route ? route.price[ticketClass] * passengers : 0;

  const goBack = () => {
    const steps: Step[] = ['route','ship','class','passengers','confirm'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else router.back();
  };

  const confirmPurchase = async () => {
    if (!passengerName.trim() || !passengerDNI.trim()) {
      Alert.alert('Datos incompletos', 'Introduce el nombre y DNI del pasajero principal');
      return;
    }
    setLoading(true);
    try {
      const balance = await walletAPI.getBalance();
      if ((balance.balance || 0) < totalPrice) {
        Alert.alert('Saldo insuficiente', `Necesitas ${totalPrice.toLocaleString()} XAF. Tu saldo: ${(balance.balance||0).toLocaleString()} XAF`);
        setLoading(false);
        return;
      }
      await walletAPI.transfer('barcos', totalPrice, `Billete barco ${route?.from} → ${route?.to} · ${ship?.name}`);
      const ref = `BRC-${Date.now().toString(36).toUpperCase()}`;
      setBookingRef(ref);
      setStep('success');
      toast.success('¡Billete confirmado!');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo procesar el pago');
    }
    setLoading(false);
  };

  // ── ÉXITO ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <LinearGradient colors={['#0ea5e9', '#10b981']} style={{ flex: 1 }}>
        <SafeAreaView style={st.successContainer}>
          <Text style={st.successIcon}>🎉</Text>
          <Text style={st.successTitle}>¡Billete confirmado!</Text>
          <Text style={st.successRef}>Ref: {bookingRef}</Text>
          <View style={st.successCard}>
            <Text style={st.successLine}>🚢 {ship?.name}</Text>
            <Text style={st.successLine}>📍 {route?.from} → {route?.to}</Text>
            <Text style={st.successLine}>⏰ Salida: {departure}</Text>
            <Text style={st.successLine}>👥 {passengers} pasajero{passengers > 1 ? 's' : ''} · {ticketClass === 'economy' ? 'Económica' : 'Business'}</Text>
            <Text style={st.successLine}>👤 {passengerName}</Text>
            <Text style={[st.successLine, { fontWeight: '800', color: '#10b981', fontSize: 16, marginTop: 8 }]}>
              Total: {totalPrice.toLocaleString()} XAF
            </Text>
          </View>
          <Text style={st.successHint}>Presenta este código en el puerto. Llega 1 hora antes de la salida.</Text>
          <TouchableOpacity style={st.successBtn} onPress={() => router.back()}>
            <Text style={st.successBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={goBack} style={st.backBtn}>
          <Text style={[st.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={[st.headerTitle, { color: C.textPrimary }]}>⛴️ Billetes de Barco</Text>
          <Text style={[st.headerSub, { color: C.textTertiary }]}>
            {step === 'route' ? 'Elige tu destino' : step === 'ship' ? 'Elige el barco' : step === 'class' ? 'Clase y salida' : step === 'passengers' ? 'Pasajeros' : 'Confirmar reserva'}
          </Text>
        </View>
      </View>

      {/* Indicador de pasos */}
      <View style={st.steps}>
        {['route','ship','class','passengers','confirm'].map((s, i) => (
          <View key={s} style={[st.stepDot, step === s && st.stepDotActive,
            ['route','ship','class','passengers','confirm'].indexOf(step) > i && st.stepDotDone]} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* PASO 1 — Elegir ruta */}
        {step === 'route' && ROUTES.map(r => (
          <TouchableOpacity key={r.id} style={[st.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
            onPress={() => { setRoute(r); setDeparture(r.departures[0]); setStep('ship'); }} activeOpacity={0.8}>
            <View style={st.routeRow}>
              <View style={st.routeCity}><Text style={[st.cityName, { color: C.textPrimary }]}>{r.from}</Text></View>
              <View style={st.routeArrow}>
                <Svg width={40} height={16} viewBox="0 0 40 16" fill="none">
                  <Line x1="0" y1="8" x2="34" y2="8" stroke="#00b4e6" strokeWidth={2}/>
                  <Path d="M30 4 L38 8 L30 12" fill="none" stroke="#00b4e6" strokeWidth={2} strokeLinecap="round"/>
                </Svg>
                <Text style={st.routeDuration}>{r.duration}</Text>
              </View>
              <View style={st.routeCity}><Text style={[st.cityName, { color: C.textPrimary }]}>{r.to}</Text></View>
            </View>
            <View style={st.routeMeta}>
              <Text style={st.routeMetaText}>🗓️ {r.days}</Text>
              <Text style={st.routeMetaText}>📏 {r.distance}</Text>
              <Text style={[st.routePrice, { color: '#00b4e6' }]}>Desde {r.price.economy.toLocaleString()} XAF</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* PASO 2 — Elegir barco */}
        {step === 'ship' && SHIPS.map(sh => (
          <TouchableOpacity key={sh.id} style={[st.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
            onPress={() => { setShip(sh); setStep('class'); }} activeOpacity={0.8}>
            <View style={st.shipRow}>
              <View style={[st.shipIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={{ fontSize: 32 }}>{sh.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.shipName, { color: C.textPrimary }]}>{sh.name}</Text>
                <Text style={[st.shipCompany, { color: C.textSecondary }]}>{sh.company}</Text>
                <Text style={[st.shipCapacity, { color: C.textTertiary }]}>Capacidad: {sh.capacity} pasajeros</Text>
              </View>
            </View>
            <View style={st.amenitiesRow}>
              {sh.amenities.map(a => <View key={a} style={st.amenityChip}><Text style={st.amenityText}>{a}</Text></View>)}
            </View>
          </TouchableOpacity>
        ))}

        {/* PASO 3 — Clase y salida */}
        {step === 'class' && route && (
          <>
            <Text style={[st.sectionLabel, { color: C.textSecondary }]}>CLASE</Text>
            {(['economy','business'] as const).map(cl => (
              <TouchableOpacity key={cl} style={[st.card, { backgroundColor: C.bgSecondary, borderColor: ticketClass === cl ? '#00b4e6' : C.borderLight, borderWidth: ticketClass === cl ? 2 : 1 }]}
                onPress={() => setTicketClass(cl)} activeOpacity={0.8}>
                <View style={st.classRow}>
                  <View>
                    <Text style={[st.className, { color: C.textPrimary }]}>{cl === 'economy' ? '💺 Económica' : '✨ Business'}</Text>
                    <Text style={[st.classDesc, { color: C.textSecondary }]}>{cl === 'economy' ? 'Asiento estándar, servicio básico' : 'Cabina privada, restaurante incluido'}</Text>
                  </View>
                  <Text style={st.classPrice}>{route.price[cl].toLocaleString()} XAF</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text style={[st.sectionLabel, { color: C.textSecondary, marginTop: 16 }]}>HORA DE SALIDA</Text>
            <View style={st.departures}>
              {route.departures.map(d => (
                <TouchableOpacity key={d} style={[st.departureChip, departure === d && st.departureChipActive]}
                  onPress={() => setDeparture(d)}>
                  <Text style={[st.departureText, departure === d && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('passengers')}>
              <LinearGradient colors={['#00C8A0','#00B4E6']} style={st.nextBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={st.nextBtnText}>Continuar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* PASO 4 — Pasajeros */}
        {step === 'passengers' && (
          <>
            <Text style={[st.sectionLabel, { color: C.textSecondary }]}>NÚMERO DE PASAJEROS</Text>
            <View style={[st.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <View style={st.counterRow}>
                <TouchableOpacity style={st.counterBtn} onPress={() => setPassengers(p => Math.max(1, p - 1))}>
                  <Text style={st.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={[st.counterValue, { color: C.textPrimary }]}>{passengers}</Text>
                <TouchableOpacity style={st.counterBtn} onPress={() => setPassengers(p => Math.min(9, p + 1))}>
                  <Text style={st.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[st.counterNote, { color: C.textTertiary }]}>Máximo 9 pasajeros por reserva</Text>
            </View>

            <Text style={[st.sectionLabel, { color: C.textSecondary, marginTop: 16 }]}>DATOS DEL PASAJERO PRINCIPAL</Text>
            <View style={[st.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <TextInput style={[st.input, { color: C.textPrimary, borderColor: C.borderLight }]}
                value={passengerName} onChangeText={setPassengerName}
                placeholder="Nombre completo" placeholderTextColor={C.textTertiary} />
              <TextInput style={[st.input, { color: C.textPrimary, borderColor: C.borderLight, marginTop: 8 }]}
                value={passengerDNI} onChangeText={setPassengerDNI}
                placeholder="DNI / Pasaporte" placeholderTextColor={C.textTertiary} />
            </View>

            <View style={[st.totalBox, { backgroundColor: '#e0f2fe' }]}>
              <Text style={st.totalLabel}>Total a pagar</Text>
              <Text style={st.totalAmount}>{totalPrice.toLocaleString()} XAF</Text>
              <Text style={st.totalDetail}>{passengers} billete{passengers > 1 ? 's' : ''} × {route?.price[ticketClass].toLocaleString()} XAF</Text>
            </View>

            <TouchableOpacity style={st.nextBtn} onPress={() => setStep('confirm')}>
              <LinearGradient colors={['#00C8A0','#00B4E6']} style={st.nextBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={st.nextBtnText}>Revisar reserva</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* PASO 5 — Confirmar */}
        {step === 'confirm' && route && ship && (
          <>
            <View style={[st.summaryCard, { backgroundColor: C.bgSecondary }]}>
              <Text style={[st.summaryTitle, { color: C.textPrimary }]}>Resumen de la reserva</Text>
              {[
                ['🚢 Barco', ship.name],
                ['🏢 Compañía', ship.company],
                ['📍 Ruta', `${route.from} → ${route.to}`],
                ['⏰ Salida', departure],
                ['🗓️ Días', route.days],
                ['💺 Clase', ticketClass === 'economy' ? 'Económica' : 'Business'],
                ['👥 Pasajeros', String(passengers)],
                ['👤 Pasajero', passengerName],
                ['🪪 DNI', passengerDNI],
              ].map(([k, v]) => (
                <View key={k} style={st.summaryRow}>
                  <Text style={[st.summaryKey, { color: C.textSecondary }]}>{k}</Text>
                  <Text style={[st.summaryVal, { color: C.textPrimary }]}>{v}</Text>
                </View>
              ))}
              <View style={[st.summaryRow, { borderTopWidth: 1, borderTopColor: C.borderLight, marginTop: 8, paddingTop: 8 }]}>
                <Text style={[st.summaryKey, { color: C.textSecondary, fontWeight: '700' }]}>💰 Total</Text>
                <Text style={[st.summaryVal, { color: '#00b4e6', fontWeight: '800', fontSize: 18 }]}>{totalPrice.toLocaleString()} XAF</Text>
              </View>
            </View>

            <TouchableOpacity onPress={confirmPurchase} disabled={loading}>
              <LinearGradient colors={['#00C8A0','#00B4E6']} style={[st.nextBtnGrad, { marginTop: 16 }]} start={{x:0,y:0}} end={{x:1,y:0}}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.nextBtnText}>Confirmar y pagar {totalPrice.toLocaleString()} XAF</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, lineHeight: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  steps: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  stepDotActive: { backgroundColor: '#00b4e6', width: 24 },
  stepDotDone: { backgroundColor: '#00c8a0' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  // Ruta
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  routeCity: { alignItems: 'center', flex: 1 },
  cityName: { fontSize: 16, fontWeight: '700' },
  routeArrow: { alignItems: 'center', gap: 4 },
  routeDuration: { fontSize: 11, color: '#00b4e6', fontWeight: '600' },
  routeMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  routeMetaText: { fontSize: 12, color: '#6b7280' },
  routePrice: { fontSize: 13, fontWeight: '700' },
  // Barco
  shipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  shipIcon: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shipName: { fontSize: 16, fontWeight: '700' },
  shipCompany: { fontSize: 13, marginTop: 2 },
  shipCapacity: { fontSize: 12, marginTop: 2 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityChip: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,180,230,0.1)', borderRadius: 8 },
  amenityText: { fontSize: 11, color: '#00b4e6', fontWeight: '600' },
  // Clase
  classRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { fontSize: 15, fontWeight: '700' },
  classDesc: { fontSize: 12, marginTop: 3 },
  classPrice: { fontSize: 16, fontWeight: '800', color: '#00b4e6' },
  departures: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  departureChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  departureChipActive: { backgroundColor: '#00b4e6', borderColor: '#00b4e6' },
  departureText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  // Pasajeros
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 8 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontSize: 22, color: '#374151', fontWeight: '300' },
  counterValue: { fontSize: 32, fontWeight: '800', minWidth: 48, textAlign: 'center' },
  counterNote: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  totalBox: { borderRadius: 14, padding: 16, alignItems: 'center', marginVertical: 12 },
  totalLabel: { fontSize: 12, color: '#0369a1', fontWeight: '600' },
  totalAmount: { fontSize: 28, fontWeight: '900', color: '#0ea5e9', marginTop: 4 },
  totalDetail: { fontSize: 12, color: '#0369a1', marginTop: 2 },
  // Confirmar
  summaryCard: { borderRadius: 16, padding: 16, marginBottom: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryKey: { fontSize: 13 },
  summaryVal: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  // Botón siguiente
  nextBtn: { marginTop: 8 },
  nextBtnGrad: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Éxito
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  successRef: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontFamily: 'monospace' },
  successCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 20, width: '100%', marginBottom: 20, gap: 8 },
  successLine: { fontSize: 14, color: '#fff', fontWeight: '600' },
  successHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24 },
  successBtn: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14 },
  successBtnText: { color: '#0ea5e9', fontWeight: '800', fontSize: 15 },
});
