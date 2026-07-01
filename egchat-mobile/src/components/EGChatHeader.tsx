// EGCHAT — Header principal (paridad con App.tsx renderHeader web)
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { Spacing } from '../theme';
import { SpinningLogo } from './SpinningLogo';
import { NeonBrandText } from './NeonBrandText';

const BTN_BG = 'rgba(8,18,36,0.88)';
const BTN_BORDER = 'rgba(255,255,255,0.13)';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain';

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

const WeatherIcon = ({ condition, size = 12 }: { condition: WeatherCondition; size?: number }) => {
  const color = condition === 'sunny' ? '#fbbf24' : '#ffffff';
  if (condition === 'sunny') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <Circle cx="12" cy="12" r="5" />
        <Line x1="12" y1="1" x2="12" y2="3" /><Line x1="12" y1="21" x2="12" y2="23" />
        <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <Line x1="1" y1="12" x2="3" y2="12" /><Line x1="21" y1="12" x2="23" y2="12" />
        <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </Svg>
    );
  }
  if (condition === 'rain') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
        <Path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <Line x1="8" y1="19" x2="8" y2="21" /><Line x1="16" y1="19" x2="16" y2="21" /><Line x1="12" y1="21" x2="12" y2="23" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Svg>
  );
};

const IconBell = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const IconMenu = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Line x1="3" y1="12" x2="21" y2="12" />
    <Line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);

export function EGChatHeader({
  onWeatherPress,
  onNotificationsPress,
  onMenuPress,
  unreadCount = 0,
  notificationsOpen = false,
  menuOpen = false,
  temp = 24,
  city = 'Malabo',
  weatherCondition = 'cloudy',
}: EGChatHeaderProps) {
  const insets = useSafeAreaInsets();

  const notifBg = notificationsOpen ? 'rgba(0,200,160,0.30)' : BTN_BG;
  const notifBorder = notificationsOpen ? 'rgba(0,200,160,0.45)' : BTN_BORDER;
  const menuBg = menuOpen ? 'rgba(0,180,230,0.30)' : BTN_BG;
  const menuBorder = menuOpen ? 'rgba(0,180,230,0.45)' : BTN_BORDER;

  const tempStr = typeof temp === 'number' ? String(temp) : temp.replace(/°/g, '');

  return (
    <LinearGradient
      colors={['#00C8A0', '#00B4E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[s.wrap, { paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : Spacing.sm) }]}
    >
      <View style={s.row}>
        {/* Logo + EGCHAT */}
        <View style={s.brand}>
          <SpinningLogo size={44} />
          <NeonBrandText />
        </View>

        {/* Clima + notificaciones + menú */}
        <View style={s.actions}>
          <TouchableOpacity style={s.weatherPill} onPress={onWeatherPress} activeOpacity={0.85}>
            <WeatherIcon condition={weatherCondition} size={12} />
            <Text style={s.tempText}>{tempStr}°</Text>
            <Text style={s.cityText}>{city}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.iconPill, { backgroundColor: notifBg, borderColor: notifBorder }]}
            onPress={onNotificationsPress}
            activeOpacity={0.85}
          >
            <IconBell />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.iconPill, { backgroundColor: menuBg, borderColor: menuBorder }]}
            onPress={onMenuPress}
            activeOpacity={0.85}
          >
            <IconMenu />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: {
    shadowColor: '#00c8a0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BTN_BG,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: BTN_BORDER,
    ...Platform.select({
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
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cityText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 72,
  },
  iconPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
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
    minWidth: 15,
    height: 15,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(10,20,40,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
});

export default EGChatHeader;
