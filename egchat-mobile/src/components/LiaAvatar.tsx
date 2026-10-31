import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LIA_AVATAR_URI } from './liaAvatarData';

/** LIA es una niña: su foto va dentro del anillo degradado de la marca. */
export const LiaAvatar = ({ size = 36, speaking = false }: { size?: number; speaking?: boolean }) => {
  const ring = Math.max(2, Math.round(size * 0.06));
  const inner = size - ring * 2;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        speaking && {
          shadowColor: '#00C8A0',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
          elevation: 10,
        },
      ]}
    >
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: size / 2, padding: ring }}
      >
        <Image
          source={{ uri: LIA_AVATAR_URI }}
          style={{ width: inner, height: inner, borderRadius: inner / 2 }}
          resizeMode="cover"
        />
      </LinearGradient>
    </View>
  );
};

export default LiaAvatar;
