// Header del chat — estilo glassmorphism translúcido (como referencia de diseño)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Rect, Circle } from 'react-native-svg';
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
  const insets = useSafeAreaInsets();
  const statusText = isTyping ? 'Escribiendo...' : subtitle;
  const statusColor = isTyping ? '#c76b8a' : isOnline ? '#7c9e8f' : '#a89bb0';
  const iconColor = '#5c3d5e';

  const content = (
    <View style={[s.inner, { paddingTop: insets.top + 6 }]}>
      {/* Botón volver */}
      <TouchableOpacity onPress={onBack} style={s.iconBtn} hitSlop={10} activeOpacity={0.7}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2.5} strokeLinecap="round">
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      </TouchableOpacity>

      {/* Avatar + nombre */}
      <TouchableOpacity style={s.info} activeOpacity={0.7} onPress={onProfilePress}>
        <View style={s.avatarWrap}>
          <EGAvatar src={chatAvatar} name={chatName} size={42} />
          {isOnline && !isTyping && <View style={s.onlineDot} />}
        </View>
        <View style={s.textCol}>
          <Text style={s.name} numberOfLines={1}>{chatName}</Text>
          <Text style={[s.status, { color: statusColor }]} numberOfLines={1}>{statusText}</Text>
        </View>
      </TouchableOpacity>

      {/* Acciones */}
      <View style={s.actions}>
        {isGroup ? (
          <TouchableOpacity style={s.iconBtn} onPress={onGroupCall ?? onAudioCall} activeOpacity={0.75}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.8} strokeLinecap="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <Circle cx="9" cy="7" r="4"/>
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.iconBtn} onPress={onAudioCall} activeOpacity={0.75}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.8} strokeLinecap="round">
              <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </Svg>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.iconBtn} onPress={onVideoCall} activeOpacity={0.75}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="2" y="7" width="13" height="11" rx="2.5"/>
            <Path d="M15 10.5l5.5-2.5v9L15 14.5"/>
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onMenuPress} activeOpacity={0.75}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2.2} strokeLinecap="round">
            <Circle cx="12" cy="5" r="1.2" fill={iconColor}/>
            <Circle cx="12" cy="12" r="1.2" fill={iconColor}/>
            <Circle cx="12" cy="19" r="1.2" fill={iconColor}/>
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );

  // LinearGradient sakura/jade en ambas plataformas
  // iOS: BlurView encima del gradiente para el efecto glass
  if (Platform.OS === 'ios') {
    return (
      <LinearGradient
        colors={['#f7e8f0', '#e8eef7', '#e8f5ef']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.wrap}
      >
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
        {content}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f7e8f0', '#ede8f5', '#e8f5ef']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={s.wrap}
    >
      {content}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: {
    zIndex: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  wrapAndroid: {
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 10,
    gap: 4,
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
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#00b894',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textCol: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 19 },
  status: { fontSize: 12, marginTop: 1, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
