// ══════════════════════════════════════════════════════════════════
// app/index.tsx — Entry point raíz
// Redirige inmediatamente a la splash screen (welcome).
// ══════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function IndexScreen() {
  useEffect(() => {
    // Redirigir a welcome en el primer tick
    const t = setTimeout(() => {
      router.replace('/welcome' as any);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Mismo fondo que welcome para evitar flash blanco
  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#00c8a0', '#0099c8', '#0060b8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00c8a0' },
});
