// ══════════════════════════════════════════════════════════════════
// androidStyles — Helpers para consistencia cross-device Android
// Android no soporta shadow* de iOS, usa elevation.
// Diferentes versiones de Android (API 21-34) tienen distintos
// comportamientos con fuentes y bordes — normalizamos aquí.
// ══════════════════════════════════════════════════════════════════
import { Platform, StyleSheet } from 'react-native';

/**
 * Sombra cross-platform.
 * En iOS usa shadow*, en Android usa elevation + backgroundColor obligatorio.
 */
export function shadow(
  elevation: number,
  color = '#000',
  opacity = 0.12,
  radius = 4,
) {
  if (Platform.OS === 'android') {
    return {
      elevation,
      // backgroundColor es OBLIGATORIO para que la sombra se vea en Android
      // (no se aplica aquí porque depende del componente, pero se documenta)
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation, // también para Android como fallback
  };
}

/**
 * Estilo de borde redondeado consistente.
 * Android API < 28 puede tener issues con borderRadius en algunos componentes.
 */
export function rounded(radius: number) {
  return {
    borderRadius: radius,
    // En Android, overflow hidden es necesario para que borderRadius
    // funcione correctamente con imágenes y gradientes
    overflow: Platform.OS === 'android' ? 'hidden' as const : undefined,
  };
}

/**
 * Font weight consistente.
 * Android soporta menos variantes de fontWeight que iOS.
 * Mapeamos a las que funcionan en todos los dispositivos Android.
 */
export function androidSafeFontWeight(weight: string): object {
  if (Platform.OS !== 'android') return { fontWeight: weight };
  // Android con fuentes del sistema: solo '400', '700' son garantizadas
  const map: Record<string, string> = {
    '100': '400', '200': '400', '300': '400',
    '400': '400', '500': '400', '600': '700',
    '700': '700', '800': '700', '900': '700',
    'normal': '400', 'bold': '700',
  };
  return { fontWeight: map[weight] || '400' };
}

/**
 * Padding bottom seguro para Android.
 * En Android con gesture navigation el inset bottom puede ser 0 o variable.
 * Garantiza un mínimo de padding para que los elementos no queden pegados al borde.
 */
export const ANDROID_MIN_BOTTOM_PADDING = Platform.OS === 'android' ? 4 : 0;

/**
 * Estilos base para StatusBar en Android.
 * translucent=true + backgroundColor transparente da el mejor resultado.
 */
export const ANDROID_STATUS_BAR = {
  translucent: true,
  backgroundColor: 'transparent',
} as const;
