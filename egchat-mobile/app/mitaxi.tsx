import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Modal, Pressable,
  Dimensions, FlatList, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { taxiAPI, walletAPI } from '../src/api';
import { subscribe, getState } from '../src/store/appStore';
import { toast } from '../src/components/Toast';
import { MiTaxiMap } from '../src/components/mitaxi/MiTaxiMap';
import {
  MALABO_CENTER, MITAXI_PLACE_NAMES, MapCoord,
  findPlaceCoords, isCurrentLocationLabel,
  calcDistanceKm, estimateFare,
} from '../src/data/mitaxiPlaces';

const { height: SH } = Dimensions.get('window');

const ACCENT = '#6366F1';
const TEXT   = '#0F172A';
const SUB    = '#64748B';
const BORDER = '#EEF0F8';
const CARD   = '#FFFFFF';
const GREEN  = '#10B981';
const RED    = '#EF4444';

const RIDES = [
  { id: 'moto',    name: 'Moto',    sub: '1 pasajero',  desc: 'Motocicleta rápida',       color: '#F97316', icon: '🏍️', eta: 2 },
  { id: 'taxi',    name: 'Taxi',    sub: '4 pasajeros', desc: 'Taxi sedán estándar',       color: '#EAB308', icon: '🚕', eta: 4 },
  { id: 'suv',     name: 'Confort', sub: 'SUV 4 plazas',desc: 'SUV cómodo y espacioso',   color: '#6366F1', icon: '🚙', eta: 5 },
  { id: 'vip',     name: 'VIP',     sub: 'Premium 4 plz',desc: 'Vehículo ejecutivo',      color: '#7C3AED', icon: '🚘', eta: 7 },
  { id: 'cargo',   name: 'Cargo',   sub: 'Pickup/Dina', desc: 'Pickup y camionetas',      color: '#0EA5E9', icon: '🛻', eta: 8 },
  { id: 'van',     name: 'Van',     sub: '8 pasajeros', desc: 'Van grande para grupos',   color: '#10B981', icon: '🚐', eta: 9 },
  { id: 'minivan', name: 'MiniVan', sub: '6 pasajeros', desc: 'Minivan familiar',         color: '#EC4899', icon: '🚐', eta: 6 },
];

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Monedero EGChat', icon: '💳' },
  { id: 'cash',   label: 'Efectivo',         icon: '💵' },
  { id: 'card',   label: 'Tarjeta',          icon: '🏦' },
];

type RideOption = typeof RIDES[number];
type Step = 'form' | 'searching' | 'matched' | 'riding' | 'rating' | 'history';
type FocusField = 'o' | 'd' | null;

interface DriverInfo {
  name: string; rating: number; plate: string;
  vehicle: string; initials: string; phone?: string;
}

export default function MiTaxiScreen() {
  const insets = useSafeAreaInsets();
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SH * 0.68)).current;

  const toggleSheet = useCallback(() => {
    const toValue = sheetCollapsed ? SH * 0.68 : 80;
    Animated.spring(sheetAnim, {
      toValue,
      useNativeDriver: false,
      tension: 65,
      friction: 12,
    }).start();
    setSheetCollapsed(prev => !prev);
  }, [sheetCollapsed, sheetAnim]);
  const [origin, setOrigin]           = useState('');
  const [dest, setDest]               = useState('');
  const [selected, setSelected]       = useState<RideOption>(RIDES[1]);
  const [step, setStep]               = useState<Step>('form');
  const [rideId, setRideId]           = useState('');
  const [driver, setDriver]           = useState<DriverInfo | null>(null);
  const [fare, setFare]               = useState(0);
  const [estimatedFare, setEstFare]   = useState(0);
  const [distanceKm, setDistKm]       = useState(0);
  const [rating, setRating]           = useState(0);
  const [ratingComment, setRatingCmt] = useState('');
  const [focus, setFocus]             = useState<FocusField>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [gpsOk, setGpsOk]             = useState(false);
  const [userLocation, setUserLoc]    = useState<MapCoord | null>(null);
  const [destLocation, setDestLoc]    = useState<MapCoord | null>(null);
  const [driverLocation, setDriverLoc]= useState<MapCoord | null>(null);
  const [balance, setBalance]         = useState(0);
  const [paymentMethod, setPayment]   = useState<'wallet'|'cash'|'card'>('wallet');
  const [showPayment, setShowPayment] = useState(false);
  const [showDriver, setShowDriver]   = useState(false);
  const [history, setHistory]         = useState<any[]>([]);
  const [loadingHistory, setLoadHist] = useState(false);

  // Ciudad real desde el appStore (mismo dato que usa el clima)
  const [cityName, setCityName] = useState<string>(() => {
    const w = getState().weather;
    return w?.city && w.city !== 'Detectando ubicación...' ? w.city : '';
  });

  useEffect(() => {
    const unsub = subscribe(() => {
      const w = getState().weather;
      if (w?.city && w.city !== 'Detectando ubicación...') {
        setCityName(w.city);
      }
    });
    return () => { unsub(); };
  }, []);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef  = useRef<Location.LocationSubscription | null>(null);
  const estTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canGo   = origin.trim().length > 0 && dest.trim().length > 0;
  const accent  = selected.color;
  const minFare = estimateFare(selected.id, Math.max(1, distanceKm));

  const loadBalance = useCallback(() => {
    walletAPI.getBalance().then(r => setBalance(r.balance || 0)).catch(() => {});
  }, []);

  const applyUserCoords = useCallback((coords: MapCoord) => {
    setUserLoc(coords);
    setGpsOk(true);
    setOrigin(prev => prev || 'Tu ubicación actual');
  }, []);

  const resolvePlace = useCallback(async (name: string, fallback?: MapCoord | null): Promise<MapCoord | null> => {
    if (!name.trim()) return null;
    if (isCurrentLocationLabel(name)) return fallback ?? userLocation ?? MALABO_CENTER;
    const local = findPlaceCoords(name);
    if (local) return local;
    try {
      const r = await Location.geocodeAsync(`${name}, Malabo, Guinea Ecuatorial`);
      if (r[0]) return { latitude: r[0].latitude, longitude: r[0].longitude };
    } catch {}
    return null;
  }, [userLocation]);

  const initGps = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { applyUserCoords(MALABO_CENTER); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos) applyUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      else applyUserCoords(MALABO_CENTER);
      gpsWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        u => applyUserCoords({ latitude: u.coords.latitude, longitude: u.coords.longitude }),
      );
    } catch { applyUserCoords(MALABO_CENTER); }
  }, [applyUserCoords]);

  useEffect(() => { loadBalance(); initGps(); return () => {
    if (pollRef.current) clearInterval(pollRef.current);
    gpsWatchRef.current?.remove();
  }; }, []);

  // Resolver destino y estimar tarifa cuando cambian campos
  useEffect(() => {
    if (!dest.trim()) { setDestLoc(null); setEstFare(0); setDistKm(0); return; }
    const timer = setTimeout(async () => {
      const coords = await resolvePlace(dest, userLocation);
      if (coords) {
        setDestLoc(coords);
        if (userLocation) {
          const km = calcDistanceKm(userLocation, coords);
          setDistKm(km);
          setEstFare(estimateFare(selected.id, km));
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [dest, userLocation, selected.id, resolvePlace]);

  // Re-estimar cuando cambia tipo de vehículo
  useEffect(() => {
    if (destLocation && userLocation) {
      const km = calcDistanceKm(userLocation, destLocation);
      setDistKm(km);
      setEstFare(estimateFare(selected.id, km));
    }
  }, [selected.id]);

  const onSuggest = (text: string, field: FocusField) => {
    if (field === 'o') setOrigin(text); else setDest(text);
    const q = text.trim().toLowerCase();
    setSuggestions(q ? MITAXI_PLACE_NAMES.filter(p => p.toLowerCase().includes(q)).slice(0, 6) : []);
  };

  const selectPlace = async (place: string) => {
    if (focus === 'o') { setOrigin(place); const c = await resolvePlace(place, userLocation); if (c) setUserLoc(c); }
    else if (focus === 'd') { setDest(place); const c = await resolvePlace(place, userLocation); if (c) setDestLoc(c); }
    setSuggestions([]); setFocus(null);
  };

  const animateDriverToUser = useCallback(() => {
    const end = userLocation ?? MALABO_CENTER;
    const start = { latitude: end.latitude + 0.005, longitude: end.longitude + 0.004 };
    let st = 0; const steps = 40;
    setDriverLoc(start);
    const id = setInterval(() => {
      st++;
      const t = st / steps;
      const e = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      setDriverLoc({ latitude: start.latitude+(end.latitude-start.latitude)*e, longitude: start.longitude+(end.longitude-start.longitude)*e });
      if (st >= steps) clearInterval(id);
    }, 200);
  }, [userLocation]);

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks++;
      try {
        const st = await taxiAPI.getRideStatus(id);
        if (st.driver) {
          const n = st.driver.name || 'Carlos Nguema';
          setDriver({ name: n, rating: st.driver.rating||4.9, plate: st.driver.plate||'GE-1234',
            vehicle: st.driver.vehicle||selected.name, initials: n.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase(),
            phone: st.driver.phone });
        }
        if (st.fare) setFare(st.fare);
        if (st.distanceKm) setDistKm(st.distanceKm);
        if (st.driver_location) setDriverLoc({ latitude: st.driver_location.lat, longitude: st.driver_location.lng });
        if (st.status === 'matched' || st.status === 'processing') { setStep('matched'); animateDriverToUser(); }
        else if (st.status === 'riding' || st.status === 'in_progress') setStep('riding');
        else if (st.status === 'completed') { setStep('rating'); if (pollRef.current) clearInterval(pollRef.current); }
      } catch {
        if (ticks >= 3) { setStep('matched'); animateDriverToUser(); }
      }
      if (ticks >= 20 && pollRef.current) clearInterval(pollRef.current);
    }, 2000);
  };

  const requestRide = async () => {
    if (!canGo) return;
    if (paymentMethod === 'wallet' && balance < (estimatedFare || minFare)) {
      Alert.alert('Saldo insuficiente', `Necesitas al menos ${(estimatedFare||minFare).toLocaleString()} XAF. Recarga tu monedero.`,
        [{ text: 'Recargar', onPress: () => router.push('/(tabs)/monedero' as any) }, { text: 'Cancelar', style: 'cancel' }]);
      return;
    }
    const destCoords  = await resolvePlace(dest, userLocation);
    const origCoords  = await resolvePlace(origin, userLocation);
    if (destCoords)  setDestLoc(destCoords);
    if (origCoords && isCurrentLocationLabel(origin)) setUserLoc(origCoords);
    setStep('searching');
    try {
      const res = await taxiAPI.requestRide(
        { address: origin, lat: origCoords?.latitude, lng: origCoords?.longitude },
        { address: dest,   lat: destCoords?.latitude,  lng: destCoords?.longitude  },
        selected.id, paymentMethod,
      );
      setRideId(res.rideId);
      setFare(res.tarifa || estimatedFare || minFare);
      if (res.distanceKm) setDistKm(res.distanceKm);
      const n = res.driver?.name || 'Carlos Nguema';
      setDriver({ name: n, rating: res.driver?.rating||4.9, plate: res.driver?.plate||'GE-1234',
        vehicle: res.driver?.vehicle||selected.name, phone: res.driver?.phone,
        initials: n.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase() });
      startPolling(res.rideId);
      setTimeout(() => setStep(s => s === 'searching' ? (animateDriverToUser(), 'matched') : s), 5000);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo solicitar el viaje');
      setStep('form');
    }
  };

  const cancelRide = async () => {
    if (rideId) { try { await taxiAPI.cancelRide(rideId); } catch {} }
    if (pollRef.current) clearInterval(pollRef.current);
    setStep('form'); setRideId(''); setDriver(null); setDriverLoc(null); setRating(0); setRatingCmt('');
    loadBalance();
  };

  const submitRating = async () => {
    if (rideId && rating > 0) {
      try { await taxiAPI.rateDriver(rideId, rating, ratingComment); toast.success('¡Gracias por tu valoración!'); } catch {}
    }
    cancelRide(); setDest('');
  };

  const loadHistory = async () => {
    setLoadHist(true);
    try { const rides = await taxiAPI.getRides(1, 20); setHistory(rides || []); } catch {}
    setLoadHist(false);
  };

  const openHistory = () => { setStep('history'); loadHistory(); };

  // ── RENDERS ────────────────────────────────────────────────────

  const renderFormSheet = () => (
    <>
      <View style={s.sheetHeaderRow}>
        <Text style={s.sheetTitle}>¿A dónde vas?</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/taxi-driver-register' as any)}
            style={[s.histBtn, { backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }]}
          >
            <Ionicons name="car-outline" size={16} color="#10B981" />
            <Text style={[s.histBtnTxt, { color: '#10B981' }]}>Soy conductor</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openHistory} style={s.histBtn}>
            <Ionicons name="time-outline" size={18} color={ACCENT} />
            <Text style={[s.histBtnTxt, { color: ACCENT }]}>Historial</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campos origen / destino */}
      <View style={s.routeRow}>
        <View style={s.routeDots}>
          <View style={[s.dotOrigin, { borderColor: accent }]} />
          <LinearGradient colors={[accent, TEXT]} style={s.routeLine} />
          <View style={s.dotDest} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[s.fieldBox, focus === 'o' && { borderColor: accent }]}>
            <Text style={[s.fieldLabel, { color: accent }]}>ORIGEN</Text>
            <TextInput value={origin} onChangeText={t => onSuggest(t, 'o')}
              onFocus={() => setFocus('o')} onBlur={() => setTimeout(() => setFocus(null), 200)}
              placeholder="Tu ubicación actual" placeholderTextColor={SUB} style={s.fieldInput} />
          </View>
          <View style={[s.fieldBox, focus === 'd' && { borderColor: accent }]}>
            <Text style={[s.fieldLabel, { color: TEXT }]}>DESTINO</Text>
            <TextInput value={dest} onChangeText={t => onSuggest(t, 'd')}
              onFocus={() => setFocus('d')} onBlur={() => setTimeout(() => setFocus(null), 200)}
              placeholder="¿A dónde vas?" placeholderTextColor={SUB} style={s.fieldInput} />
          </View>
        </View>
      </View>

      {/* Sugerencias */}
      {suggestions.length > 0 && focus && (
        <View style={s.suggBox}>
          {suggestions.map((place, i) => (
            <TouchableOpacity key={place} style={[s.suggItem, i < suggestions.length-1 && s.suggBorder]} onPress={() => selectPlace(place)}>
              <Ionicons name="location-outline" size={13} color={accent} style={{ marginRight: 8 }} />
              <Text style={s.suggText}>{place}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Estimación de distancia y precio */}
      {estimatedFare > 0 && distanceKm > 0 && (
        <View style={[s.estimateBar, { borderColor: accent + '40' }]}>
          <Text style={s.estimateTxt}>📍 {distanceKm.toFixed(1)} km</Text>
          <Text style={[s.estimateFare, { color: accent }]}>~{estimatedFare.toLocaleString()} XAF</Text>
          <Text style={s.estimateTxt}>🕐 {selected.eta} min</Text>
        </View>
      )}

      {/* Tipos de vehículo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rideScroll}>
        {RIDES.map(r => {
          const active = selected.id === r.id;
          return (
            <TouchableOpacity key={r.id}
              style={[s.rideChip, { borderColor: active ? r.color : BORDER, backgroundColor: active ? r.color+'12' : CARD }]}
              onPress={() => setSelected(r)} activeOpacity={0.85}>
              <Text style={{ fontSize: 26, opacity: active ? 1 : 0.55 }}>{r.icon}</Text>
              <Text style={[s.rideChipName, { color: active ? r.color : TEXT }]}>{r.name}</Text>
              <Text style={s.rideChipEta}>{r.eta} min</Text>
              <Text style={[s.rideChipPrice, { color: active ? r.color : TEXT }]}>
                {estimateFare(r.id, Math.max(1, distanceKm)).toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Método de pago */}
      <TouchableOpacity style={[s.payRow, { borderColor: BORDER }]} onPress={() => setShowPayment(true)}>
        <Text style={s.payIcon}>{PAYMENT_METHODS.find(p=>p.id===paymentMethod)?.icon}</Text>
        <Text style={s.payLabel}>{PAYMENT_METHODS.find(p=>p.id===paymentMethod)?.label}</Text>
        <Ionicons name="chevron-forward" size={16} color={SUB} />
      </TouchableOpacity>

      {/* Resumen + saldo */}
      <View style={s.summaryBar}>
        <View style={{ flex: 1 }}>
          <Text style={[s.summaryTitle, { color: selected.color }]}>{selected.name} · {selected.sub}</Text>
          <Text style={s.summaryDesc}>{selected.desc}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.summaryPrice, { color: selected.color }]}>
            {(estimatedFare || minFare).toLocaleString()} XAF
          </Text>
          {paymentMethod === 'wallet' && (
            <Text style={s.summaryBalance}>
              Saldo: <Text style={{ fontWeight: '700', color: balance >= (estimatedFare||minFare) ? GREEN : RED }}>
                {balance.toLocaleString()}
              </Text>
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[s.ctaBtn, canGo ? { backgroundColor: selected.color, shadowColor: selected.color } : s.ctaDisabled]}
        onPress={requestRide} disabled={!canGo} activeOpacity={0.9}>
        <Text style={[s.ctaText, !canGo && { color: '#94A3B8' }]}>
          {canGo ? `Pedir ${selected.name} · ${(estimatedFare||minFare).toLocaleString()} XAF` : 'Ingresa origen y destino'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderActiveSheet = () => {
    if (step === 'searching') return (
      <View style={s.activeSheet}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={s.activeTitle}>Buscando conductor...</Text>
        <Text style={s.activeSub}>{selected.icon} {selected.name} · {(fare||estimatedFare||minFare).toLocaleString()} XAF</Text>
        {distanceKm > 0 && <Text style={s.activeSub}>📍 {distanceKm.toFixed(1)} km estimados</Text>}
        <TouchableOpacity onPress={cancelRide} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancelar búsqueda</Text>
        </TouchableOpacity>
      </View>
    );

    if ((step === 'matched' || step === 'riding') && driver) return (
      <View style={s.activeSheet}>
        {/* Tarjeta conductor */}
        <TouchableOpacity style={s.driverCard} onPress={() => setShowDriver(true)} activeOpacity={0.85}>
          <LinearGradient colors={[accent+'22', accent+'08']} style={s.driverCardBg} />
          <View style={[s.driverAvatar, { backgroundColor: accent }]}>
            <Text style={s.driverIni}>{driver.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>{driver.name}</Text>
            <Text style={s.activeSub}>⭐ {driver.rating} · {driver.plate} · {driver.vehicle}</Text>
          </View>
          <View style={[s.etaBox, { backgroundColor: accent+'18' }]}>
            <Text style={[s.etaNum, { color: accent }]}>{selected.eta}</Text>
            <Text style={s.etaLbl}>min</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.tripLine}>📍 {origin}</Text>
        <Text style={s.tripLine}>🏁 {dest}</Text>
        {distanceKm > 0 && <Text style={s.tripLine}>📏 {distanceKm.toFixed(1)} km · {PAYMENT_METHODS.find(p=>p.id===paymentMethod)?.icon} {PAYMENT_METHODS.find(p=>p.id===paymentMethod)?.label}</Text>}

        <Text style={s.activeTitle}>{step==='riding' ? '🚗 En camino al destino' : '✅ Conductor asignado'}</Text>
        <Text style={[s.summaryPrice, { color: accent, textAlign: 'center' }]}>{(fare||estimatedFare||minFare).toLocaleString()} XAF</Text>

        {step === 'matched' && (
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: GREEN }]} onPress={() => setStep('riding')}>
            <Text style={s.ctaText}>✔ Iniciar viaje</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={cancelRide} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancelar viaje</Text>
        </TouchableOpacity>
      </View>
    );

    if (step === 'rating' && driver) return (
      <View style={s.activeSheet}>
        <Text style={{ fontSize: 52, textAlign: 'center' }}>🎉</Text>
        <Text style={s.activeTitle}>¡Viaje completado!</Text>
        <Text style={s.activeSub}>{distanceKm.toFixed(1)} km · {(fare||minFare).toLocaleString()} XAF</Text>
        <Text style={[s.activeSub, { marginTop: 4 }]}>Valora a {driver.name}</Text>
        <View style={s.starsRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Text style={{ fontSize: 36 }}>{n <= rating ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput value={ratingComment} onChangeText={setRatingCmt}
          placeholder="Comentario opcional..." placeholderTextColor={SUB}
          style={[s.fieldBox, { paddingVertical: 10, marginTop: 4 }]} multiline />
        <TouchableOpacity style={[s.ctaBtn, { backgroundColor: accent, opacity: rating ? 1 : 0.5 }]}
          onPress={submitRating} disabled={!rating}>
          <Text style={s.ctaText}>Enviar valoración</Text>
        </TouchableOpacity>
      </View>
    );

    if (step === 'history') return (
      <View style={s.activeSheet}>
        <View style={s.histHeaderRow}>
          <Text style={s.sheetTitle}>Mis viajes</Text>
          <TouchableOpacity onPress={() => setStep('form')}>
            <Ionicons name="close" size={22} color={TEXT} />
          </TouchableOpacity>
        </View>
        {loadingHistory ? <ActivityIndicator color={accent} style={{ marginVertical: 20 }} /> : (
          <FlatList
            data={history} keyExtractor={(_,i) => String(i)}
            style={{ maxHeight: SH * 0.35 }}
            ListEmptyComponent={<Text style={[s.activeSub, {textAlign:'center', marginTop: 16}]}>Sin viajes aún</Text>}
            renderItem={({ item }) => (
              <View style={s.histItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.histDest} numberOfLines={1}>{item.destination || item.dest}</Text>
                  <Text style={s.histMeta}>
                    {item.ride_type?.toUpperCase()} · {(item.fare||0).toLocaleString()} XAF
                    {item.distance_km ? ` · ${item.distance_km} km` : ''}
                  </Text>
                </View>
                <View style={[s.histStatus, {
                  backgroundColor: item.status === 'completed' ? GREEN+'22' : item.status === 'cancelled' ? RED+'22' : '#94A3B8'+'22'
                }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700',
                    color: item.status === 'completed' ? GREEN : item.status === 'cancelled' ? RED : SUB }}>
                    {item.status === 'completed' ? 'Completado' : item.status === 'cancelled' ? 'Cancelado' : item.status}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
        <TouchableOpacity style={[s.ctaBtn, { backgroundColor: accent, marginTop: 10 }]} onPress={() => setStep('form')}>
          <Text style={s.ctaText}>Nuevo viaje</Text>
        </TouchableOpacity>
      </View>
    );

    return null;
  };

  return (
    <View style={s.root}>
      <MiTaxiMap userLocation={userLocation} destLocation={destLocation}
        driverLocation={driverLocation} showNearby={step==='form'||step==='searching'} accentColor={accent} />

      <SafeAreaView style={[s.headerFloat, { paddingTop: insets.top }]} edges={[]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🚕 MiTaxi</Text>
          <View style={s.gpsRow}>
            <View style={[s.gpsDot, { backgroundColor: gpsOk ? GREEN : '#F59E0B' }]} />
            <Text style={s.gpsText}>{gpsOk ? `GPS activo · ${cityName || 'Obteniendo ciudad...'}` : 'Obteniendo ubicación...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.balancePill} onPress={() => router.push('/(tabs)/monedero' as any)}>
          <Text style={s.balanceTxt}>💳 {balance.toLocaleString()} XAF</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom sheet colapsable */}
      <Animated.View style={[s.sheet, { maxHeight: sheetAnim }]}>
        {/* Barrita toggle — toca para colapsar/expandir */}
        <TouchableOpacity
          onPress={toggleSheet}
          style={s.handleWrap}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
        >
          <View style={s.sheetHandle} />
          {sheetCollapsed && (
            <Text style={s.handleHint}>¿A dónde vas? · Toca para expandir</Text>
          )}
        </TouchableOpacity>

        {!sheetCollapsed && (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {step === 'form' || step === 'history' ? renderFormSheet() : null}
            {renderActiveSheet()}
          </ScrollView>
        )}
      </Animated.View>

      {/* Modal método de pago */}
      <Modal visible={showPayment} transparent animationType="slide" onRequestClose={() => setShowPayment(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowPayment(false)}>
          <View style={s.modalSheet}>
            <Text style={s.sheetTitle}>Método de pago</Text>
            {PAYMENT_METHODS.map(pm => (
              <TouchableOpacity key={pm.id} style={[s.payOption, paymentMethod === pm.id && { borderColor: ACCENT, backgroundColor: ACCENT+'10' }]}
                onPress={() => { setPayment(pm.id as any); setShowPayment(false); }}>
                <Text style={s.payOptionIcon}>{pm.icon}</Text>
                <Text style={[s.payOptionLabel, paymentMethod === pm.id && { color: ACCENT, fontWeight: '700' }]}>{pm.label}</Text>
                {paymentMethod === pm.id && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal info conductor */}
      <Modal visible={showDriver && !!driver} transparent animationType="slide" onRequestClose={() => setShowDriver(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowDriver(false)}>
          <View style={s.modalSheet}>
            {driver && <>
              <View style={[s.driverAvatarLg, { backgroundColor: accent }]}>
                <Text style={s.driverIniLg}>{driver.initials}</Text>
              </View>
              <Text style={[s.driverName, { textAlign: 'center', fontSize: 20 }]}>{driver.name}</Text>
              <Text style={[s.activeSub, { textAlign: 'center' }]}>⭐ {driver.rating}</Text>
              <View style={s.driverInfoGrid}>
                <View style={s.driverInfoCell}><Text style={s.driverInfoLabel}>Vehículo</Text><Text style={s.driverInfoVal}>{driver.vehicle}</Text></View>
                <View style={s.driverInfoCell}><Text style={s.driverInfoLabel}>Placa</Text><Text style={s.driverInfoVal}>{driver.plate}</Text></View>
                {driver.phone && <View style={s.driverInfoCell}><Text style={s.driverInfoLabel}>Teléfono</Text><Text style={s.driverInfoVal}>{driver.phone}</Text></View>}
                <View style={s.driverInfoCell}><Text style={s.driverInfoLabel}>ETA</Text><Text style={s.driverInfoVal}>{selected.eta} min</Text></View>
              </View>
            </>}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F8FAFF' },
  // Header
  headerFloat:   { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  headerBack:    { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  headerTitle:   { fontSize: 16, fontWeight: '800', color: TEXT },
  gpsRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  gpsDot:        { width: 7, height: 7, borderRadius: 4 },
  gpsText:       { fontSize: 11, color: SUB },
  balancePill:   { backgroundColor: CARD, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  balanceTxt:    { fontSize: 12, fontWeight: '700', color: TEXT },
  // Sheet
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 32, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: -3 }, elevation: 10, overflow: 'hidden' },
  handleWrap:    { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  sheetHandle:   { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2 },
  handleHint:    { fontSize: 12, color: SUB, marginTop: 6, fontWeight: '600' },
  sheetHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle:    { fontSize: 18, fontWeight: '800', color: TEXT },
  histBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histBtnTxt:    { fontSize: 13, fontWeight: '600' },
  // Route
  routeRow:      { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 10 },
  routeDots:     { width: 16, alignItems: 'center', paddingTop: 16, gap: 2 },
  dotOrigin:     { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, backgroundColor: CARD },
  routeLine:     { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },
  dotDest:       { width: 12, height: 12, borderRadius: 3, backgroundColor: TEXT },
  fieldBox:      { backgroundColor: '#F8FAFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 6 },
  fieldLabel:    { fontSize: 10, fontWeight: '700', marginBottom: 2, letterSpacing: 0.5 },
  fieldInput:    { fontSize: 14, color: TEXT, paddingVertical: 2 },
  // Suggestions
  suggBox:       { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 8, overflow: 'hidden' },
  suggItem:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  suggBorder:    { borderBottomWidth: 1, borderBottomColor: BORDER },
  suggText:      { fontSize: 13, color: TEXT, flex: 1 },
  // Estimate bar
  estimateBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 10 },
  estimateTxt:   { fontSize: 12, color: SUB, fontWeight: '600' },
  estimateFare:  { fontSize: 14, fontWeight: '800' },
  // Rides
  rideScroll:    { paddingVertical: 4, gap: 8 },
  rideChip:      { width: 84, borderRadius: 14, borderWidth: 2, padding: 8, alignItems: 'center', gap: 2 },
  rideChipName:  { fontSize: 12, fontWeight: '700' },
  rideChipEta:   { fontSize: 10, color: SUB },
  rideChipPrice: { fontSize: 11, fontWeight: '700' },
  // Payment
  payRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 8 },
  payIcon:       { fontSize: 18 },
  payLabel:      { flex: 1, fontSize: 13, fontWeight: '600', color: TEXT },
  // Summary
  summaryBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderRadius: 12, padding: 10, marginBottom: 10 },
  summaryTitle:  { fontSize: 13, fontWeight: '700' },
  summaryDesc:   { fontSize: 11, color: SUB, marginTop: 1 },
  summaryPrice:  { fontSize: 16, fontWeight: '800' },
  summaryBalance:{ fontSize: 11, color: SUB, marginTop: 2 },
  ctaBtn:        { borderRadius: 16, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  ctaDisabled:   { backgroundColor: '#EEF0F8' },
  ctaText:       { fontSize: 15, fontWeight: '800', color: '#fff' },
  // Active states
  activeSheet:   { paddingVertical: 16, gap: 10 },
  activeTitle:   { fontSize: 17, fontWeight: '800', color: TEXT, textAlign: 'center' },
  activeSub:     { fontSize: 13, color: SUB, textAlign: 'center' },
  cancelBtn:     { paddingVertical: 8, alignItems: 'center' },
  cancelText:    { fontSize: 14, color: RED, fontWeight: '600' },
  tripLine:      { fontSize: 13, color: TEXT, paddingVertical: 2 },
  // Driver card
  driverCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  driverCardBg:  { ...StyleSheet.absoluteFillObject },
  driverAvatar:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  driverAvatarLg:{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  driverIni:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  driverIniLg:   { fontSize: 28, fontWeight: '900', color: '#fff' },
  driverName:    { fontSize: 15, fontWeight: '700', color: TEXT },
  etaBox:        { alignItems: 'center', borderRadius: 10, padding: 8, minWidth: 44 },
  etaNum:        { fontSize: 18, fontWeight: '900' },
  etaLbl:        { fontSize: 10, color: SUB, fontWeight: '600' },
  // Stars
  starsRow:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 8 },
  // History
  histHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  histItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 10 },
  histDest:      { fontSize: 14, fontWeight: '600', color: TEXT },
  histMeta:      { fontSize: 11, color: SUB, marginTop: 2 },
  histStatus:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  // Modals
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 },
  payOption:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  payOptionIcon: { fontSize: 22 },
  payOptionLabel:{ flex: 1, fontSize: 14, color: TEXT, fontWeight: '600' },
  driverInfoGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  driverInfoCell:{ width: '47%', backgroundColor: '#F8FAFF', borderRadius: 10, padding: 10 },
  driverInfoLabel:{ fontSize: 11, color: SUB, fontWeight: '600' },
  driverInfoVal: { fontSize: 14, color: TEXT, fontWeight: '700', marginTop: 2 },
});
