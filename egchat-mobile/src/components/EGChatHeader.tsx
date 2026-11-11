// EGCHAT — Header principal — responsive para cualquier dispositivo
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Spacing } from '../theme';
import { SpinningLogo } from './SpinningLogo';
import { NeonBrandText } from './NeonBrandText';
import { useAppStore } from '../store/useAppStore';
import { unreadCount as storeUnreadCount } from '../store/appStore';
import type { WeatherCondition } from '../store/appStore';

export type { WeatherCondition };

const BTN_BG     = 'rgba(8,18,36,0.88)';
const BTN_BORDER = 'rgba(255,255,255,0.13)';

// ─── escala proporcional al ancho de pantalla ─────────────────────
// Base de diseño: 390px (iPhone 14 Pro).
// En un iPhone 16 Plus (430px) o cualquier Android grande todo crece.
const BASE_W  = 390;
const { width: SCREEN_W } = Dimensions.get('window');
const scale   = (px: number) => Math.round(px * (SCREEN_W / BASE_W));

// ─── Iconos SVG ───────────────────────────────────────────────────
const WeatherIcon = ({ condition, size = 12 }: { condition: WeatherCondition; size?: number }) => {
  const color = condition === 'sunny' ? '#fbbf24' : '#ffffff';
  if (condition === 'sunny') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <Circle cx="12" cy="12" r="5" />
        <Line x1="12" y1="1"  x2="12" y2="3"  />
        <Line x1="12" y1="21" x2="12" y2="23" />
        <Line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"  />
        <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <Line x1="1"  y1="12" x2="3"  y2="12" />
        <Line x1="21" y1="12" x2="23" y2="12" />
        <Line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
        <Line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
      </Svg>
    );
  }
  if (condition === 'rain') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <Path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <Line x1="8"  y1="19" x2="8"  y2="21" />
        <Line x1="16" y1="19" x2="16" y2="21" />
        <Line x1="12" y1="21" x2="12" y2="23" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Svg>
  );
};

const IconBell = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const IconMenu = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="3"  y1="6"  x2="21" y2="6"  />
    <Line x1="3"  y1="12" x2="21" y2="12" />
    <Line x1="3"  y1="18" x2="21" y2="18" />
  </Svg>
);

// ─── Props ────────────────────────────────────────────────────────
export interface EGChatHeaderProps {
  onWeatherPress: () => void;
  onNotificationsPress: () => void;
  onMenuPress: () => void;
  unreadCount?: number;
  notificationsOpen?: boolean;
  menuOpen?: boolean;
  temp?: number | string;
  city?: string;
  weatherCondition?: WeatherCondition;
}

// ─── Componente ───────────────────────────────────────────────────
export function EGChatHeader({
  onWeatherPress,
  onNotificationsPress,
  onMenuPress,
  unreadCount: unreadProp,
  notificationsOpen = false,
  menuOpen = false,
  temp: tempProp,
  city: cityProp,
  weatherCondition: condProp,
}: EGChatHeaderProps) {
  const insets = useSafeAreaInsets();
  const { weather } = useAppStore();

  const temp             = tempProp ?? weather.temp;
  const city             = cityProp ?? weather.city;
  const weatherCondition = condProp ?? weather.condition;
  const unreadCount      = unreadProp ?? storeUnreadCount();

  const notifBg     = notificationsOpen ? 'rgba(0,200,160,0.30)' : BTN_BG;
  const notifBorder = notificationsOpen ? 'rgba(0,200,160,0.45)' : BTN_BORDER;
  const menuBg      = menuOpen ? 'rgba(0,180,230,0.30)' : BTN_BG;
  const menuBorder  = menuOpen ? 'rgba(0,180,230,0.45)' : BTN_BORDER;

  const tempStr   = typeof temp === 'number' ? String(temp) : temp.replace(/°/g, '');

  // Tamaños escalados al dispositivo actual
  const iconSz    = scale(14);
  const rowH      = scale(44);
  const pillPY    = scale(5);
  const pillPX    = scale(10);
  const fontSize  = scale(11);
  const fontSizeT = scale(12);
  const badgeSz   = scale(15);
  const badgeFnt  = scale(8);

  return (
    <LinearGradient
      colors={['#00C8A0', '#00B4E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        s.wrap,
        { paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : Spacing.sm) },
      ]}
    >
      <View style={[s.row, { height: rowH }]}>

        {/* ── Logo + nombre ─────────────────────────────── */}
        <View style={s.brand}>
          <SpinningLogo size={rowH} />
          <NeonBrandText />
        </View>

        {/* ── Clima + botones ───────────────────────────── */}
        <View style={s.actions}>

          {/* Pill clima */}
          <TouchableOpacity
            style={[s.weatherPill, { paddingVertical: pillPY, paddingHorizontal: pillPX }]}
            onPress={onWeatherPress}
            activeOpacity={0.85}
          >
            <WeatherIcon condition={weatherCondition} size={iconSz} />
            <Text style={[s.tempText, { fontSize: fontSizeT }]} numberOfLines={1}>
              {tempStr}°
            </Text>
            {/* Ciudad: sin maxWidth fijo; se corta con ellipsis si no cabe */}
            <Text
              style={[s.cityText, { fontSize }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {city}
            </Text>
          </TouchableOpacity>

          {/* Botón notificaciones */}
          <TouchableOpacity
            style={[s.iconPill, {
              backgroundColor: notifBg,
              borderColor: notifBorder,
              paddingVertical: pillPY,
              paddingHorizontal: pillPX,
            }]}
            onPress={onNotificationsPress}
            activeOpacity={0.85}
          >
            <IconBell size={iconSz} />
            {unreadCount > 0 && (
              <View style={[s.badge, { minWidth: badgeSz, height: badgeSz, borderRadius: badgeSz / 2 }]}>
                <Text style={[s.badgeText, { fontSize: badgeFnt }]}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Botón menú */}
          <TouchableOpacity
            style={[s.iconPill, {
              backgroundColor: menuBg,
              borderColor: menuBorder,
              paddingVertical: pillPY,
              paddingHorizontal: pillPX,
            }]}
            onPress={onMenuPress}
            activeOpacity={0.85}
          >
            <IconMenu size={iconSz} />
          </TouchableOpacity>
        </View>

      </View>
    </LinearGradient>
  );
}

// ─── Estilos base (no contienen ningún tamaño fijo en px) ─────────
const s = StyleSheet.create({
  wrap: {
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,200,160,0.3)' } as any,
      default: {
        shadowColor: '#00c8a0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Espacio entre brand y actions usando justify-content
    justifyContent: 'space-between',
    paddingHorizontal: '2.5%',
  },

  // Logo + texto: ocupa el espacio sobrante pero cede al pill de clima
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },

  // Contenedor de todos los controles del lado derecho
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    // Máximo 62% del ancho de pantalla para que el logo siempre sea visible
    maxWidth: '62%',
  },

  // Pill del clima: se expande hasta llenar su espacio disponible
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BTN_BG,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: BTN_BORDER,
    // Crece y encoge según el espacio disponible
    flexShrink: 1,
    flexGrow: 0,
    // Sin maxWidth fijo: se adapta sola
    minWidth: 0,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.35)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },

  tempText: {
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 0,       // temperatura nunca se corta
  },

  cityText: {
    color: 'rgba(255,255,255,0.85)',
    flexShrink: 1,       // ciudad se comprime si no hay espacio
    minWidth: 0,
  },

  iconPill: {
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,       // los botones nunca se comprimen
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.35)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },

  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: 'rgba(10,20,40,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  badgeText: {
    fontWeight: '800',
    color: '#fff',
  },
});

export default EGChatHeader;
