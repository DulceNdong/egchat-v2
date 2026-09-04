/**
 * Mi Djangue - Página Principal Única e Integrada
 * TODO el sistema en una sola pantalla con navegación por tabs
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Line, Circle, G } from 'react-native-svg';
import { apiFetch } from '../src/api';

const { width } = Dimensions.get('window');

// Logo giratorio de EGChat (usando el logo real PNG pero sin fondo blanco)
function RotatingLogo() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 120, height: 120 }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

interface DjangueItem {
  id: string;
  name: string;
  logo_url: string | null;
  my_role: 'owner' | 'secretary' | 'member';
  status: string;
  current_turn: number;
  total_turns: number;
  is_my_turn: boolean;
  paid_current_turn: boolean;
  member_count: number;
  quota_amount: number;
  currency: string;
  frequency: string;
}

const TABS = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'my-djangues', label: 'Mis Djangues', icon: 'wallet' },
  { id: 'admin', label: 'Administrar', icon: 'crown' },
  { id: 'create', label: 'Crear', icon: 'plus' },
];

// Iconos SVG profesionales sin fondos
function TabIcon({ name, color = '#fff', size = 20 }: { name: string; color?: string; size?: number }) {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M9 22V12h6v10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 12V7H5a2 2 0 0 1 0-4h14v4"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path
            d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function MiDjangueScreen() {
  const [activeTab, setActiveTab] = useState('home');
  const [myDjangues, setMyDjangues] = useState<DjangueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Logo rotation
  const logoRotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const logoRotate = logoRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await apiFetch('/api/djangue/my-list');
      setMyDjangues([...(response.admin || []), ...(response.member || [])]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (activeTab === 'my-djangues') load();
  }, [activeTab, load]));

  // RENDER: Pantalla de Inicio
  const renderHome = () => (
    <ScrollView
      style={s.tabContent}
      contentContainerStyle={s.homeScroll}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* Logo + nombre */}
      <View style={s.logoContainer}>
        <Animated.View style={{ transform: [{ rotate: logoRotate }] }}>
          <Image
            source={require('../assets/icon.png')}
            style={{ width: 70, height: 70 }}
            contentFit="contain"
          />
        </Animated.View>
        <Text style={s.brandName}>EGChat</Text>
        <View style={s.divider} />
        <Text style={s.productName}>Mi Djangue</Text>
      </View>

      {/* Ilustración compacta */}
      <View style={s.illustrationContainer}>
        <View style={s.illustration}>
          <Svg width={150} height={150} viewBox="0 0 200 200">
            <Circle cx={100} cy={100} r={35} fill="#fff" opacity={0.9} />
            <Path
              d="M100 85v30M110 95h-20M110 105h-20"
              stroke="#00C8A0"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 100 + 70 * Math.cos(rad);
              const y = 100 + 70 * Math.sin(rad);
              return (
                <G key={i}>
                  <Circle cx={x} cy={y} r={15} fill="#fff" opacity={0.85} />
                  <Circle cx={x} cy={y - 2} r={5} fill="#00C8A0" />
                  <Path
                    d={`M${x - 6} ${y + 8} Q${x} ${y + 5} ${x + 6} ${y + 8}`}
                    stroke="#00C8A0"
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                  />
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Texto */}
      <View style={s.textContainer}>
        <Text style={s.title}>Ahorra en Grupo</Text>
        <Text style={s.subtitle}>
          El sistema tradicional de ahorro rotativo,{'\n'}ahora en tu móvil
        </Text>
      </View>

      {/* Botones */}
      <View style={s.homeButtons}>
        <TouchableOpacity
          style={s.primaryButton}
          onPress={() => setActiveTab('my-djangues')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#fff', '#f5f5f5']} style={s.buttonGradient}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                stroke="#00C8A0"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={s.primaryButtonText}>Mis Djangues</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryButton}
          onPress={() => setActiveTab('create')}
          activeOpacity={0.85}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
            <Path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={s.secondaryButtonText}>Crear Nuevo Djangue</Text>
        </TouchableOpacity>
      </View>

      {/* Footer features */}
      <View style={s.features}>
        <View style={s.featureRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            <Path d="M22 4L12 14.01l-3-3" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
          </Svg>
          <Text style={s.featureText}>Seguro y Confiable</Text>
        </View>
        <View style={s.featureRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            <Circle cx={9} cy={7} r={4} stroke="#fff" strokeWidth={2} opacity={0.7} />
          </Svg>
          <Text style={s.featureText}>Fácil para Todos</Text>
        </View>
      </View>
    </ScrollView>
  );

  // RENDER: Mis Djangues
  const renderMyDjangues = () => {
    if (loading) {
      return (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#00C8A0" />
          <Text style={s.loadingTxt}>Cargando...</Text>
        </View>
      );
    }

    if (myDjangues.length === 0) {
      return (
        <View style={s.empty}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="rgba(0,200,160,0.3)" strokeWidth={2} />
            <Path d="M8 12h8M12 8v8" stroke="rgba(0,200,160,0.3)" strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={s.emptyTitle}>No tienes djangues</Text>
          <Text style={s.emptySub}>Crea uno nuevo o únete a uno existente</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setActiveTab('create')}>
            <Text style={s.createBtnTxt}>Crear Djangue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={s.tabContent}
        contentContainerStyle={s.djanguesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#00C8A0" />
        }
      >
        {myDjangues.map((djangue) => (
          <TouchableOpacity
            key={djangue.id}
            style={s.djangueCard}
            onPress={() => {
              const screen = djangue.my_role === 'member' ? '/djangue-member' : '/djangue-detail';
              router.push({ pathname: screen, params: { id: djangue.id } } as any);
            }}
          >
            <LinearGradient
              colors={djangue.my_role === 'member' ? ['#00C8A0', '#00B4E6'] : ['#6366f1', '#4f46e5']}
              style={s.djangueGradient}
            >
              <View style={s.djangueHeader}>
                {djangue.logo_url ? (
                  <Image source={{ uri: djangue.logo_url }} style={s.djangueLogo} contentFit="cover" />
                ) : (
                  <View style={s.logoPlaceholder}>
                    <Text style={s.logoEmoji}>💰</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.djangueName}>{djangue.name}</Text>
                  <Text style={s.djangueRole}>
                    {djangue.my_role === 'owner' ? '👑 Administrador' : djangue.my_role === 'secretary' ? '📋 Secretario' : '👤 Integrante'}
                  </Text>
                </View>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </View>

              <View style={s.djangueInfo}>
                <View style={s.djangueInfoBox}>
                  <Text style={s.djangueInfoLabel}>Turno</Text>
                  <Text style={s.djangueInfoValue}>{djangue.current_turn}/{djangue.total_turns}</Text>
                </View>
                <View style={s.djangueInfoBox}>
                  <Text style={s.djangueInfoLabel}>Miembros</Text>
                  <Text style={s.djangueInfoValue}>{djangue.member_count}</Text>
                </View>
                <View style={s.djangueInfoBox}>
                  <Text style={s.djangueInfoLabel}>Cuota</Text>
                  <Text style={s.djangueInfoValue}>
                    {djangue.quota_amount.toLocaleString()} {djangue.currency}
                  </Text>
                </View>
              </View>

              {djangue.is_my_turn && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>🎉 ¡Es tu turno!</Text>
                </View>
              )}
              {!djangue.is_my_turn && !djangue.paid_current_turn && (
                <View style={[s.badge, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                  <Text style={[s.badgeText, { color: '#ef4444' }]}>⚠️ Pendiente de pago</Text>
                </View>
              )}
              {!djangue.is_my_turn && djangue.paid_current_turn && (
                <View style={[s.badge, { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.4)' }]}>
                  <Text style={[s.badgeText, { color: '#10b981' }]}>✅ Al día</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // RENDER: Panel de Administración
  const renderAdmin = () => {
    const adminDjangues = myDjangues.filter(d => d.my_role === 'owner' || d.my_role === 'secretary');

    if (adminDjangues.length === 0) {
      return (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No administras ningún djangue</Text>
          <Text style={s.emptySub}>Crea tu primer djangue para comenzar</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => setActiveTab('create')}>
            <Text style={s.createBtnTxt}>Crear Djangue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={s.tabContent} contentContainerStyle={s.adminList}>
        {adminDjangues.map((djangue) => (
          <TouchableOpacity
            key={djangue.id}
            style={s.adminCard}
            onPress={() => router.push({ pathname: '/djangue-admin-stats', params: { id: djangue.id } } as any)}
          >
            <Text style={s.adminCardTitle}>{djangue.name}</Text>
            <Text style={s.adminCardSub}>Ver estadísticas y reportes</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // RENDER: Crear Djangue
  const renderCreate = () => (
    <View style={s.tabContent}>
      <View style={s.createContainer}>
        <Text style={s.createTitle}>Crear Nuevo Djangue</Text>
        <Text style={s.createSub}>Configura tu grupo de ahorro rotativo</Text>
        
        <TouchableOpacity
          style={s.createFullBtn}
          onPress={() => router.push('/djangue-admin-create')}
        >
          <Text style={s.createFullBtnText}>Ir al Formulario Completo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <LinearGradient colors={['#00C8A0', '#00B4E6', '#0099CC']} style={s.gradient}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Line x1="19" y1="12" x2="5" y2="12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              <Path d="M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mi Djangue</Text>
          <View style={{ width: 40 }}></View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[s.tab, activeTab === tab.id && s.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <TabIcon name={tab.icon} color={activeTab === tab.id ? '#00C8A0' : 'rgba(255,255,255,0.7)'} size={20} />
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {activeTab === 'home' && renderHome()}
        {activeTab === 'my-djangues' && renderMyDjangues()}
        {activeTab === 'admin' && renderAdmin()}
        {activeTab === 'create' && renderCreate()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00C8A0' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#fff', 
    letterSpacing: 0.5,
  },
  tabsScroll: { maxHeight: 70 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { 
    backgroundColor: '#fff',
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  tabTextActive: { color: '#00C8A0', fontWeight: '800' },
  tabContent: { flex: 1 },
  homeScroll: { flexGrow: 1, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { marginTop: 12, fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.3 },
  emptySub: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  createBtn: { 
    marginTop: 12, 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    backgroundColor: '#fff', 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createBtnTxt: { fontSize: 17, fontWeight: '900', color: '#00C8A0', letterSpacing: 0.3 },
  logoContainer: { alignItems: 'center', paddingTop: 30, paddingBottom: 15 },
  brandName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 1, marginTop: 16 },
  divider: { width: 50, height: 3, backgroundColor: '#fff', marginVertical: 12, borderRadius: 2 },
  productName: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  illustrationContainer: { alignItems: 'center', paddingVertical: 20 },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  homeButtons: { paddingHorizontal: 24, gap: 14, marginBottom: 24 },
  primaryButton: { 
    borderRadius: 18, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 12, 
    elevation: 8,
  },
  buttonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    gap: 12,
  },
  primaryButtonText: { fontSize: 18, fontWeight: '900', color: '#00C8A0', letterSpacing: 0.3 },
  secondaryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 17, 
    borderRadius: 18, 
    borderWidth: 2.5, 
    borderColor: '#fff', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    gap: 10,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  features: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  djanguesList: { padding: 16, gap: 14 },
  djangueCard: { 
    borderRadius: 24, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 16, 
    elevation: 8,
  },
  djangueGradient: { padding: 24, gap: 18 },
  djangueHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  djangueLogo: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  logoPlaceholder: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoEmoji: { fontSize: 32 },
  djangueName: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: 0.3 },
  djangueRole: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  djangueInfo: { flexDirection: 'row', gap: 12 },
  djangueInfoBox: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.18)', 
    borderRadius: 14, 
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  djangueInfoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  djangueInfoValue: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(245,158,11,0.25)', 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderWidth: 2, 
    borderColor: 'rgba(245,158,11,0.5)',
  },
  badgeText: { fontSize: 15, fontWeight: '900', color: '#f59e0b', letterSpacing: 0.3 },
  adminList: { padding: 16, gap: 14 },
  adminCard: { 
    backgroundColor: 'rgba(255,255,255,0.18)', 
    borderRadius: 18, 
    padding: 24, 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  adminCardTitle: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: 0.3 },
  adminCardSub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  createContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  createTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 },
  createSub: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 32 },
  createFullBtn: { 
    paddingHorizontal: 40, 
    paddingVertical: 18, 
    backgroundColor: '#fff', 
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  createFullBtnText: { fontSize: 17, fontWeight: '900', color: '#00C8A0', letterSpacing: 0.3 },
});
