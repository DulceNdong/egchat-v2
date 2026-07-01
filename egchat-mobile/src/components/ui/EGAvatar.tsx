import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontWeight } from '../../theme';

// Paleta de colores para avatares por inicial (igual que la web)
const PALETTE = [
  '#00c8a0', '#00b4e6', '#6B5BD6', '#EC4899',
  '#F59E0B', '#EF4444', '#10B981', '#F97316',
  '#0EA5E9', '#84CC16', '#06B6D4', '#8B5CF6',
];

const nameToColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

interface EGAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
}

// URL válida: no vacía, no de servidor antiguo roto
const isValidAvatarUrl = (url?: string | null): url is string =>
  !!url &&
  url.trim().length > 0 &&
  (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) &&
  !url.includes('egchat-api.onrender.com/static/avatars/');

export const EGAvatar: React.FC<EGAvatarProps> = ({ src, name, size = 48 }) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

  const fontSize = size * 0.35;
  const bgColor = nameToColor(name || '?');

  // Mostrar imagen solo si la URL es válida y no tuvo error de carga
  if (isValidAvatarUrl(src) && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        onError={() => setImgError(true)}
        onLoad={() => {}} // forzar re-render si cambia la URL
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.bgTertiary,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
