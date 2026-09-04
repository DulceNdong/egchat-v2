// MIcon — wrapper centralizado para Google Material Icons
// Fuente: https://fonts.google.com/icons
// Usa MaterialIcons de @expo/vector-icons (ya incluido en Expo)
// Para cambiar variante (Outlined, Rounded, Sharp) solo cambiar esta línea.

import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface MIconProps {
  name: MaterialIconName;
  size?: number;
  color?: string;
  style?: any;
}

export function MIcon({ name, size = 24, color = '#374151', style }: MIconProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}

export default MIcon;
