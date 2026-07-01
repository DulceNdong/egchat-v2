import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Modal, Pressable, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { taxiAPI, walletAPI } from '../src/api';
import { toast } from '../src/components/Toast';
import { MiTaxiMap } from '../src/components/mitaxi/MiTaxiMap';
import {
  MALABO_CENTER, MITAXI_PLACE_NAMES, MapCoord,
  findPlaceCoords, isCurrentLocationLabel,
} from '../src/data/mitaxiPlaces';

const { height: SH } = Dimensions.get('window');

const ACCENT = '#6366F1';
const TEXT = '#0F172A';
const SUB = '#64748B';
const BORDER = '#EEF0F8';
const CARD = '#FFFFFF';
const GREEN = '#10B981';

const APP_THEMES = [
  { id: 'default', name: 'Predeterminado', bg: '#F8FAFF', accent: '#6366F1' },
  { id: 'sunset', name: 'Atardecer', bg: '#FFF7ED', accent: '#F97316' },
  { id: 'ocean', name: 'Océano', bg: '#F0F9FF', accent: '#0EA5E9' },
  { id: 'forest', name: 'Bosque', bg: '#F0FDF4', accent: '#10B981' },
  { id: 'lavender', name: 'Lavanda', bg: '#F5F3FF', accent: '#7C3AED' },
];

const RIDES = [
  { id: 'moto', name: 'Moto', sub: '1 pasajero', desc: 'Motocicleta rápida', price: 500, eta: '2 min', color: '#F97316', icon: '🏍️' },
  { id: 'taxi', name: 'Taxi', sub: '4 pasajeros', desc: 'Taxi sedán estándar', price: 1000, eta: '4 min', color: '#EAB308', icon: '🚕' },
  { id: 'suv', name: 'Confort', sub: 'SUV 4 plazas', desc: 'SUV cómodo y espacioso', price: 2000, eta: '5 min', color: '#6366F1', icon: '🚙' },
  { id: 'vip', name: 'VIP', sub: 'Premium 4 plz', desc: 'Vehículo ejecutivo', price: 3500, eta: '7 min', color: '#7C3AED', icon: '🚘' },
  { id: 'cargo', name: 'Cargo', sub: 'Pickup/Dina', desc: 'Pickup y camionetas', price: 2500, eta: '8 min', color: '#0EA5E9', icon: '🛻' },
  { id: 'van', name: 'Van', sub: '8 pasajeros', desc: 'Van grande para grupos', price: 3000, eta: '9 min', color: '#10B981', icon: '🚐' },
  { id: 'minivan', name: 'MiniVan', sub: '6 pasajeros', desc: 'Minivan familiar', price: 2200, eta: '6 min', color: '#EC4899', icon: '🚐' },
];

type Step = 'form' | 'searching' | 'matched' | 'riding' | 'rating';
type FocusField = 'o' | 'd' | null;

interface DriverInfo {
  name: string;
  rating: number;
  plate: string;
  vehicle: string;
  initials: string;
}

export default function MiTaxiScreen() {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [selected, setSelected] = useState(RIDES[1]);
  const [step, setStep] = useState<Step>('form');
  const [rideId, setRideId] = useState('');
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [fare, setFare] = useState(0);
  const [rating, setRating] = useState(0);
  const [focus, setFocus] = useState<FocusField>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [gpsOk, setGpsOk] = useState(false);
  const [userLocation, setUserLocation] = useState<MapCoord | null>(null);
  const [destLocation, setDestLocation] = useState<MapCoord | null>(null);
  const [driverLocation, setDriverLocation] = useState<MapCoord | null>(null);
  const [balance, setBalance] = useState(0);
  const [theme, setTheme] = useState(APP_THEMES[0]);
  const [showThemes, setShowThemes] = useState(false);
  const [showDriver, setShowDriver] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);

  const canGo = origin.trim().length > 0 && dest.trim().length > 0;
  const accent = theme.accent;

  const loadBalance = useCallback(() => {
    walletAPI.getBalance().then(r => setBalance(r.balance || 0)).catch(() => {});
  }, []);

  const applyUserCoords = useCallback((coords: MapCoord) => {
    setUserLocation(coords);
    setGpsOk(true);
    setOrigin(prev => prev || 'Tu ubicación actual');
  }, []);

  const resolvePlace = useCallback(async (name: string, userFallback?: MapCoord | null): Promise<MapCoord | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (isCurrentLocationLabel(trimmed)) return userFallback ?? userLocation ?? MALABO_CENTER;
    const local = findPlaceCoords(trimmed);
    if (local) return local;
    try {
      const results = await Location.geocodeAsync(`${trimmed}, Malabo, Guinea Ecuatorial`);
      if (results[0]) {
        return { latitude: results[0].latitude, longitude: results[0].longitude };
      }
    } catch {}
    return null;
  }, [userLocation]);

  const initGps = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        applyUserCoords(MALABO_CENTER);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos) {
        applyUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } else {
        applyUserCoords(MALABO_CENTER);
      }
      gpsWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        update => {
          applyUserCoords({
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
          });
        },
      );
    } catch {
      applyUserCoords(MALABO_CENTER);
    }
  }, [applyUserCoords]);

  useEffect(() => {
    loadBalance();
    initGps();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      gpsWatchRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!dest.trim()) {
      setDestLocation(null);
      return;
    }
    const timer = setTimeout(async () => {
      const coords = await resolvePlace(dest, userLocation);
      if (coords) setDestLocation(coords);
    }, 350);
    return () => clearTimeout(timer);
  }, [dest, userLocation, resolvePlace]);

  const onSuggest = (text: string, field: FocusField) => {
    if (field === 'o') setOrigin(text);
    else setDest(text);
    const q = text.trim().toLowerCase();
    setSuggestions(q ? MITAXI_PLACE_NAMES.filter(p => p.toLowerCase().includes(q)).slice(0, 6) : []);
  };

  const selectPlace = async (place: string) => {
    if (focus === 'o') {
      setOrigin(place);
      const coords = await resolvePlace(place, userLocation);
      if (coords) setUserLocation(coords);
    } else if (focus === 'd') {
      setDest(place);
      const coords = await resolvePlace(place, userLocation);
      if (coords) setDestLocation(coords);
    }
    setSuggestions([]);
    setFocus(null);
  };

  const animateDriverToUser = useCallback(() => {
    const end = userLocation ?? MALABO_CENTER;
    const start = { latitude: end.latitude + 0.005, longitude: end.longitude + 0.004 };
    let step = 0;
    const steps = 40;
    setDriverLocation(start);
    const id = setInterval(() => {
      step++;
      const t = step / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDriverLocation({
        latitude: start.latitude + (end.latitude - start.latitude) * ease,
        longitude: start.longitude + (end.longitude - start.longitude) * ease,
      });
      if (step >= steps) clearInterval(id);
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
          setDriver({
            name: n,
            rating: st.driver.rating || 4.9,
            plate: st.driver.plate || 'GE-1234',
            vehicle: st.driver.vehicle || selected.name,
            initials: n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          });
        }
        if (st.fare) setFare(st.fare);
        if (st.status === 'matched' || st.status === 'processing') {
          setStep('matched');
          animateDriverToUser();
        } else if (st.status === 'riding' || st.status === 'in_progress') setStep('riding');
        else if (st.status === 'completed') {
          setStep('rating');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        if (ticks >= 3) {
          setStep('matched');
          setDriver({ name: 'Carlos Nguema', rating: 4.9, plate: 'GE-1234', vehicle: selected.name, initials: 'CN' });
          animateDriverToUser();
        }
      }
      if (ticks >= 15 && pollRef.current) clearInterval(pollRef.current);
    }, 2000);
  };

  const requestRide = async () => {
    if (!canGo) return;
    if (balance < selected.price) {
      Alert.alert('Saldo insuficiente', 'Recarga tu monedero para pedir el viaje.');
      return;
    }
    const destCoords = await resolvePlace(dest, userLocation);
    if (destCoords) setDestLocation(destCoords);
    const originCoords = await resolvePlace(origin, userLocation);
    if (originCoords && isCurrentLocationLabel(origin)) setUserLocation(originCoords);
    setStep('searching');
    try {
      const res = await taxiAPI.requestRide({ address: origin }, { address: dest }, selected.id);
      setRideId(res.rideId);
      setFare(res.tarifa || selected.price);
      const n = res.driver?.name || 'Carlos Nguema';
      setDriver({
        name: n,
        rating: res.driver?.rating || 4.9,
        plate: res.driver?.plate || 'GE-1234',
        vehicle: res.driver?.vehicle || selected.name,
        initials: n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
      });
      startPolling(res.rideId);
      setTimeout(() => {
        setStep(s => {
          if (s === 'searching') {
            animateDriverToUser();
            return 'matched';
          }
          return s;
        });
      }, 4000);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo solicitar el viaje');
      setStep('form');
    }
  };

  const cancelRide = async () => {
    if (rideId) { try { await taxiAPI.cancelRide(rideId); } catch {} }
    if (pollRef.current) clearInterval(pollRef.current);
    setStep('form');
    setRideId('');
    setDriver(null);
    setDriverLocation(null);
    setRating(0);
    loadBalance();
  };

  const submitRating = async () => {
    if (rideId && rating > 0) {
      try { await taxiAPI.rateDriver(rideId, rating); toast.success('¡Gracias por tu valoración!'); } catch {}
    }
    cancelRide();
    setDest('');
  };

  const refreshScreen = () => {
    initGps();
    loadBalance();
    toast.info('Actualizado');
  };

  const renderFormSheet = () => (
    <>
      <View style={s.sheetHandle} />
      <Text style={s.sheetTitle}>¿A dónde vas?</Text>

      <View style={s.routeRow}>
        <View style={s.routeDots}>
          <View style={[s.dotOrigin, { borderColor: accent }]} />
          <LinearGradient colors={[accent, '#0F172A']} style={s.routeLine} />
          <View style={s.dotDest} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[s.fieldBox, focus === 'o' && { borderColor: accent, backgroundColor: CARD }]}>
            <Text style={[s.fieldLabel, { color: accent }]}>ORIGEN</Text>
            <TextInput
              value={origin}
              onChangeText={t => onSuggest(t, 'o')}
              onFocus={() => setFocus('o')}
              onBlur={() => setTimeout(() => setFocus(null), 200)}
              placeholder={gpsOk ? 'Tu ubicación actual' : 'Tu ubicación actual'}
              placeholderTextColor={SUB}
              style={s.fieldInput}
            />
          </View>
          <View style={[s.fieldBox, focus === 'd' && { borderColor: accent, backgroundColor: CARD }]}>
            <Text style={[s.fieldLabel, { color: TEXT }]}>DESTINO</Text>
            <TextInput
              value={dest}
              onChangeText={t => onSuggest(t, 'd')}
              onFocus={() => setFocus('d')}
              onBlur={() => setTimeout(() => setFocus(null), 200)}
              placeholder="¿A dónde vas?"
              placeholderTextColor={SUB}
              style={s.fieldInput}
            />
          </View>
        </View>
      </View>

      {suggestions.length > 0 && focus && (
        <View style={s.suggBox}>
          {suggestions.map((place, i) => (
            <TouchableOpacity key={place} style={[s.suggItem, i < suggestions.length - 1 && s.suggBorder]} onPress={() => selectPlace(place)}>
              <View style={[s.suggIcon, { backgroundColor: accent + '18' }]}>
                <Ionicons name="location" size={12} color={accent} />
              </View>
              <Text style={s.suggText}>{place}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rideScroll}>
        {RIDES.map(r => {
          const active = selected.id === r.id;
  return (
            <TouchableOpacity
              key={r.id}
              style={[s.rideChip, { borderColor: active ? r.color : BORDER, backgroundColor: active ? r.color + '15' : CARD }]}
              onPress={() => setSelected(r)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 26, opacity: active ? 1 : 0.55 }}>{r.icon}</Text>
              <Text style={[s.rideChipName, { color: active ? r.color : TEXT }]}>{r.name}</Text>
              <Text style={s.rideChipEta}>{r.eta}</Text>
              <Text style={[s.rideChipPrice, { color: active ? r.color : TEXT }]}>{r.price.toLocaleString()}</Text>
        </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[s.summaryBar, { backgroundColor: selected.color + '12', borderColor: selected.color + '30' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.summaryTitle, { color: selected.color }]}>{selected.name} · {selected.sub}</Text>
          <Text style={s.summaryDesc}>{selected.desc}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.summaryPrice, { color: selected.color }]}>{selected.price.toLocaleString()} XAF</Text>
          <Text style={s.summaryBalance}>
            Saldo: <Text style={{ fontWeight: '700', color: balance >= selected.price ? GREEN : '#EF4444' }}>{balance.toLocaleString()}</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[s.ctaBtn, canGo ? { backgroundColor: selected.color, shadowColor: selected.color } : s.ctaDisabled]}
        onPress={requestRide}
        disabled={!canGo}
        activeOpacity={0.9}
      >
        <Text style={[s.ctaText, !canGo && { color: '#94A3B8' }]}>
          {canGo ? `Pedir ${selected.name} · ${selected.price.toLocaleString()} XAF` : 'Ingresa origen y destino'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderActiveSheet = () => {
    if (step === 'searching') {
      return (
        <View style={s.activeSheet}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={s.activeTitle}>Buscando conductor...</Text>
          <Text style={s.activeSub}>{selected.name} · {selected.price.toLocaleString()} XAF</Text>
          <TouchableOpacity onPress={cancelRide}><Text style={s.cancelText}>Cancelar</Text></TouchableOpacity>
        </View>
      );
    }
    if ((step === 'matched' || step === 'riding') && driver) {
      return (
        <View style={s.activeSheet}>
          <View style={s.driverRow}>
            <View style={[s.driverAvatar, { backgroundColor: '#1e293b' }]}>
              <Text style={s.driverIni}>{driver.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{driver.name}</Text>
              <Text style={s.activeSub}>⭐ {driver.rating} · {driver.plate}</Text>
            </View>
            <View style={[s.etaBox, { backgroundColor: accent + '18' }]}>
              <Text style={[s.etaNum, { color: accent }]}>{selected.eta.replace(' min', '')}</Text>
              <Text style={s.etaLbl}>min</Text>
            </View>
          </View>
          <Text style={s.tripLine}>📍 {origin}</Text>
          <Text style={s.tripLine}>🏁 {dest}</Text>
          <Text style={s.activeTitle}>{step === 'riding' ? 'En camino al destino' : 'Conductor asignado'}</Text>
          <Text style={[s.summaryPrice, { color: selected.color, textAlign: 'center' }]}>
            {(fare || selected.price).toLocaleString()} XAF
          </Text>
          {step === 'matched' && (
            <TouchableOpacity style={[s.ctaBtn, { backgroundColor: GREEN }]} onPress={() => setStep('riding')}>
              <Text style={s.ctaText}>Iniciar viaje</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={cancelRide}><Text style={s.cancelText}>Cancelar viaje</Text></TouchableOpacity>
                </View>
      );
    }
    if (step === 'rating' && driver) {
      return (
        <View style={s.activeSheet}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>🎉</Text>
          <Text style={s.activeTitle}>¡Viaje completado!</Text>
          <Text style={s.activeSub}>Valora a {driver.name}</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={{ fontSize: 36 }}>{n <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: accent, opacity: rating ? 1 : 0.5 }]} onPress={submitRating} disabled={!rating}>
            <Text style={s.ctaText}>Enviar valoración</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={s.root}>
      <MiTaxiMap
        userLocation={userLocation}
        destLocation={destLocation}
        driverLocation={driverLocation}
        showNearby={step === 'form' || step === 'searching'}
        accentColor={accent}
      />

      <LinearGradient colors={['#e0e7ff', '#f0fdf4']} style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} pointerEvents="none" />

      <SafeAreaView style={s.headerFloat} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
          <Ionicons name="arrow-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>MiTaxi</Text>
          <View style={s.gpsRow}>
            <View style={[s.gpsDot, { backgroundColor: gpsOk ? GREEN : '#F59E0B' }]} />
            <Text style={s.gpsText}>{gpsOk ? 'GPS activo · Malabo' : 'Obteniendo ubicación...'}</Text>
              </View>
            </View>
        <TouchableOpacity style={[s.pillBtn, { backgroundColor: accent + '18' }]} onPress={() => setShowThemes(true)}>
          <Ionicons name="sunny-outline" size={14} color={accent} />
          <Text style={[s.pillText, { color: accent }]}>Fondo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.pillBtn, { backgroundColor: accent + '18' }]} onPress={() => setShowDriver(true)}>
          <Ionicons name="person-outline" size={14} color={accent} />
          <Text style={[s.pillText, { color: accent }]}>Conductor</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={s.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
          {step === 'form' ? renderFormSheet() : renderActiveSheet()}
        </ScrollView>
      </View>

      <TouchableOpacity style={s.refreshFab} onPress={refreshScreen} activeOpacity={0.9}>
        <Ionicons name="refresh" size={22} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showThemes} transparent animationType="slide" onRequestClose={() => setShowThemes(false)}>
        <Pressable style={s.modalBg} onPress={() => setShowThemes(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Tema de fondo</Text>
            {APP_THEMES.map(t => (
              <TouchableOpacity key={t.id} style={[s.themeRow, theme.id === t.id && { borderColor: t.accent }]} onPress={() => { setTheme(t); setShowThemes(false); }}>
                <View style={[s.themeSwatch, { backgroundColor: t.bg }]} />
                <Text style={s.themeName}>{t.name}</Text>
                {theme.id === t.id && <Ionicons name="checkmark-circle" size={20} color={t.accent} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDriver} transparent animationType="slide" onRequestClose={() => setShowDriver(false)}>
        <Pressable style={s.modalBg} onPress={() => setShowDriver(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Registro de conductor</Text>
            <Text style={s.modalBody}>Sube tu documentación (DNI, licencia, ITV) para operar como conductor en MiTaxi.</Text>
            <TouchableOpacity style={[s.ctaBtn, { backgroundColor: accent }]} onPress={() => { setShowDriver(false); toast.info('Próximamente'); }}>
              <Text style={s.ctaText}>Empezar registro</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
            </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e0e7ff' },
  headerFloat: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerBack: { padding: 6, borderRadius: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TEXT },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  gpsDot: { width: 6, height: 6, borderRadius: 3 },
  gpsText: { fontSize: 11, color: SUB },
  pillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 50,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
    backgroundColor: CARD,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SH * 0.72,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 16,
  },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 12 },
  routeRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  routeDots: { alignItems: 'center', paddingVertical: 14 },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, backgroundColor: CARD },
  routeLine: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1, minHeight: 28 },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0F172A' },
  fieldBox: {
    backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 3 },
  fieldInput: { fontSize: 14, fontWeight: '500', color: TEXT, padding: 0 },
  suggBox: { borderRadius: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 12, overflow: 'hidden', backgroundColor: CARD },
  suggItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  suggBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  suggIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  suggText: { fontSize: 13, color: TEXT, fontWeight: '500', flex: 1 },
  rideScroll: { gap: 8, paddingBottom: 6, marginBottom: 12 },
  rideChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 2, minWidth: 78,
  },
  rideChipName: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  rideChipEta: { fontSize: 10, color: SUB },
  rideChipPrice: { fontSize: 11, fontWeight: '700' },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summaryDesc: { fontSize: 11, color: SUB, marginTop: 2 },
  summaryPrice: { fontSize: 17, fontWeight: '900' },
  summaryBalance: { fontSize: 11, color: SUB, marginTop: 2 },
  ctaBtn: {
    borderRadius: 16, paddingVertical: 17, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 4,
  },
  ctaDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  refreshFab: {
    position: 'absolute', right: 16, bottom: SH * 0.38, zIndex: 25,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  activeSheet: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  activeTitle: { fontSize: 17, fontWeight: '800', color: TEXT },
  activeSub: { fontSize: 13, color: SUB },
  cancelText: { color: '#EF4444', fontWeight: '700', marginTop: 8, padding: 8 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: 8 },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  driverIni: { color: '#fff', fontSize: 18, fontWeight: '800' },
  driverName: { fontSize: 16, fontWeight: '800', color: TEXT },
  etaBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  etaNum: { fontSize: 22, fontWeight: '900' },
  etaLbl: { fontSize: 11, color: SUB },
  tripLine: { fontSize: 14, color: TEXT, alignSelf: 'flex-start', width: '100%' },
  starsRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 12 },
  modalBody: { fontSize: 14, color: SUB, lineHeight: 20, marginBottom: 16 },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 2, borderColor: BORDER, marginBottom: 8,
  },
  themeSwatch: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  themeName: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT },
});
