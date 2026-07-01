// Panel de adjuntos del chat — paridad visual con App.tsx (web)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

export type AttachAction = 'photo' | 'video' | 'file' | 'contact' | 'location' | 'music' | 'money';

const ITEMS: {
  id: AttachAction;
  label: string;
  color: string;
  bg: string;
  Icon: React.FC;
}[] = [
  {
    id: 'photo',
    label: 'Foto',
    color: '#00b4e6',
    bg: '#E0F7FF',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#00b4e6" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="3" width="18" height="18" rx="3" />
        <Circle cx="8.5" cy="8.5" r="1.5" />
        <Polyline points="21 15 16 10 5 21" />
      </Svg>
    ),
  },
  {
    id: 'video',
    label: 'Video',
    color: '#f59e0b',
    bg: '#FEF3C7',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Polygon points="23 7 16 12 23 17 23 7" />
        <Rect x="1" y="5" width="15" height="14" rx="2" />
      </Svg>
    ),
  },
  {
    id: 'file',
    label: 'Archivo',
    color: '#06b6d4',
    bg: '#CFFAFE',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </Svg>
    ),
  },
  {
    id: 'contact',
    label: 'Contacto',
    color: '#ec4899',
    bg: '#FCE7F3',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <Circle cx="9" cy="7" r="4" />
        <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Svg>
    ),
  },
  {
    id: 'location',
    label: 'Ubicación',
    color: '#ef4444',
    bg: '#FEE2E2',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <Circle cx="12" cy="10" r="3" />
      </Svg>
    ),
  },
  {
    id: 'music',
    label: 'Música',
    color: '#8b5cf6',
    bg: '#EDE9FE',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18V5l12-2v13" />
        <Circle cx="6" cy="18" r="3" />
        <Circle cx="18" cy="16" r="3" />
      </Svg>
    ),
  },
  {
    id: 'money',
    label: 'Enviar dinero',
    color: '#00c8a0',
    bg: '#D1FAE5',
    Icon: () => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="5" width="20" height="14" rx="2" />
        <Line x1="2" y1="10" x2="22" y2="10" />
        <Circle cx="12" cy="15" r="2" />
      </Svg>
    ),
  },
];

interface Props {
  onAction: (action: AttachAction) => void;
}

export function ChatAttachPanel({ onAction }: Props) {
  return (
    <View style={s.panel}>
      <View style={s.grid}>
        {ITEMS.map(item => (
          <TouchableOpacity
            key={item.id}
            style={s.item}
            onPress={() => onAction(item.id)}
            activeOpacity={0.75}
          >
            <View style={[s.iconBox, { backgroundColor: item.bg }]}>
              <item.Icon />
            </View>
            <Text style={s.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  item: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 7,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
});
