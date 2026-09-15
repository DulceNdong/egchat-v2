// EGAvatar.tsx — Avatar con soporte de anillo de estado (stories)
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontWeight } from '../../theme';

interface EGAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  /** El contacto tiene un estado activo (no expirado) */
  hasStory?: boolean;
  /** El estado ya fue visto por el usuario actual */
  storySeen?: boolean;
}

// Colores del anillo no visto (brand EGCHAT)
const RING_UNSEEN: [string, string, string] = ['#00c8a0', '#00b4e6', '#0070cc'];
// Colores del anillo ya visto
const RING_SEEN: [string, string] = ['#9CA3AF', '#D1D5DB'];

export const EGAvatar: React.FC<EGAvatarProps> = ({
  src,
  name,
  size = 48,
  hasStory = false,
  storySeen = false,
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  // Resetear el error si cambia la fuente de imagen
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  // Pulso continuo solo cuando hay estado no visto
  useEffect(() => {
    if (!hasStory || storySeen) {
      glowAnim.setValue(0.6);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [hasStory, storySeen, glowAnim]);

  const safeName =
    name && name.trim() && name.trim() !== '?' ? name.trim() : 'EG';
  const initials =
    safeName
      .split(' ')
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'EG';

  const fontSize = size * 0.35;

  // Tamaños del anillo: 3px de borde + 2px de gap entre anillo e imagen
  const RING_WIDTH = 2.5;
  const GAP = 2;
  const outerSize = size + (RING_WIDTH + GAP) * 2;
  const innerSize = size;

  const photoOrInitials = (
    <View
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
        overflow: 'hidden',
        backgroundColor: Colors.bgTertiary,
      }}
    >
      {src && !imageFailed ? (
        <Image
          source={{ uri: src }}
          onError={() => setImageFailed(true)}
          style={{ width: innerSize, height: innerSize }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: innerSize, height: innerSize }]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
    </View>
  );

  if (!hasStory) {
    // Sin anillo — solo la foto/iniciales
    return photoOrInitials;
  }

  if (storySeen) {
    // Anillo gris (ya visto)
    return (
      <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient
          colors={RING_SEEN}
          style={{
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Gap blanco entre anillo y foto */}
          <View
            style={{
              width: innerSize + GAP * 2,
              height: innerSize + GAP * 2,
              borderRadius: (innerSize + GAP * 2) / 2,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photoOrInitials}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Anillo de gradiente animado (estado no visto)
  return (
    <Animated.View
      style={{
        width: outerSize,
        height: outerSize,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: glowAnim,
      }}
    >
      <LinearGradient
        colors={RING_UNSEEN}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Gap blanco entre anillo y foto */}
        <View
          style={{
            width: innerSize + GAP * 2,
            height: innerSize + GAP * 2,
            borderRadius: (innerSize + GAP * 2) / 2,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {photoOrInitials}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
