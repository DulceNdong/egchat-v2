// Header del chat — gradiente azul EGCHAT (App.tsx chat-header-fixed)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Polygon, Rect, Circle, G } from 'react-native-svg';
import { EGAvatar } from '../ui';

export interface ChatHeaderProps {
  chatName: string;
  chatAvatar?: string;
  subtitle: string;
  isTyping?: boolean;
  isOnline?: boolean;
  isGroup?: boolean;
  onBack: () => void;
  onProfilePress: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
  onGroupCall?: () => void;
  onMenuPress: () => void;
}

export function ChatHeader({
  chatName,
  chatAvatar,
  subtitle,
  isTyping,
  isOnline,
  isGroup,
  onBack,
  onProfilePress,
  onAudioCall,
  onVideoCall,
  onGroupCall,
  onMenuPress,
}: ChatHeaderProps) {
  const statusColor = isTyping ? '#a8ffdd' : isOnline ? '#a8ffdd' : 'rgba(255,255,255,0.6)';
  const statusText = isTyping ? 'Escribiendo...' : subtitle;

  return (
    <LinearGradient
      colors={['#00b4e6', '#0088cc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[s.wrap, { paddingTop: Platform.OS === 'ios' ? 4 : 6 }]}
    >
      <TouchableOpacity onPress={onBack} style={s.iconBtn} hitSlop={10} activeOpacity={0.75}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      </TouchableOpacity>

      <TouchableOpacity style={s.info} activeOpacity={0.7} onPress={onProfilePress}>
        <EGAvatar src={chatAvatar} name={chatName} size={50} />
        <View style={s.textCol}>
          <Text style={s.name} numberOfLines={1}>{chatName}</Text>
          <Text style={[s.status, { color: statusColor }]} numberOfLines={1}>{statusText}</Text>
        </View>
      </TouchableOpacity>

      <View style={s.actions}>
        {/* En grupos: botón llamada grupal; en privados: llamada audio */}
        {isGroup ? (
          <TouchableOpacity style={s.iconBtn} onPress={onGroupCall ?? onAudioCall} activeOpacity={0.75}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <Circle cx="9" cy="7" r="4"/>
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.iconBtn} onPress={onAudioCall} activeOpacity={0.75}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </Svg>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.iconBtn} onPress={onVideoCall} activeOpacity={0.75}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {/* Cuerpo de la cámara */}
            <Rect x="2" y="7" width="13" height="11" rx="2.5"/>
            {/* Lente */}
            <Circle cx="8.5" cy="12.5" r="2.5"/>
            {/* Flap de video lateral */}
            <Path d="M15 10.5l5.5-2.5v9L15 14.5"/>
            {/* Punto de grabación */}
            <Circle cx="8.5" cy="12.5" r="1" fill="#fff" stroke="none"/>
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onMenuPress} activeOpacity={0.75}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
            <Circle cx="12" cy="5" r="1" fill="#fff"/>
            <Circle cx="12" cy="12" r="1" fill="#fff"/>
            <Circle cx="12" cy="19" r="1" fill="#fff"/>
          </Svg>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 10,
    gap: 4,
    shadowColor: '#0088cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textCol: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 18 },
  status: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
