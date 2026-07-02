// ══════════════════════════════════════════════════════════════════
// ImageViewer — Visor de imágenes a pantalla completa
// - Pinch-to-zoom (escala 1–4×)
// - Swipe vertical > 80px → cierra con fade
// - FlatList horizontal para múltiples imágenes
// - Botón cerrar esquina superior derecha
// - Error de carga + botón Reintentar
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Image, TouchableOpacity, Text, Modal, StyleSheet,
  Dimensions, FlatList, PanResponder, Animated, ActivityIndicator,
  StatusBar, Platform,
} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import type { PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: W, height: H } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  images: string[];       // URIs de las imágenes
  initialIndex?: number;
  onClose: () => void;
}

// ── Una imagen con pinch-zoom ─────────────────────────────────────
const ZoomableImage = ({
  uri, onSwipeDown,
}: { uri: string; onSwipeDown: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const onPinchEvent = useCallback((event: PinchGestureHandlerGestureEvent) => {
    const newScale = Math.max(1, Math.min(4, lastScale.current * event.nativeEvent.scale));
    scale.setValue(newScale);
  }, [scale]);

  const onPinchStateChange = useCallback((event: PinchGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      lastScale.current = Math.max(1, Math.min(4, lastScale.current * event.nativeEvent.scale));
      // Snap de vuelta a 1 si es menor
      if (lastScale.current <= 1.05) {
        lastScale.current = 1;
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }
    }
  }, [scale]);

  // Pan responder para detectar swipe vertical
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        lastScale.current <= 1.05 && Math.abs(gs.dy) > Math.abs(gs.dx) && Math.abs(gs.dy) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80) onSwipeDown();
      },
    })
  ).current;

  if (hasError) {
    return (
      <View style={[iz.frame, iz.errorFrame]}>
        <Text style={iz.errorIcon}>⚠️</Text>
        <Text style={iz.errorText}>No se pudo cargar la imagen</Text>
        <TouchableOpacity
          style={iz.retryBtn}
          onPress={() => { setHasError(false); setRetryKey(k => k + 1); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={iz.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={iz.frame} {...panResponder.panHandlers}>
      <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {loading && (
            <View style={[iz.frame, iz.loadingFrame]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          <Image
            key={retryKey}
            source={{ uri }}
            style={iz.image}
            resizeMode="contain"
            onLoad={() => setLoading(false)}
            onError={() => { setHasError(true); setLoading(false); }}
          />
        </Animated.View>
      </PinchGestureHandler>
    </View>
  );
};

const iz = StyleSheet.create({
  frame: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  image: { width: W, height: H },
  loadingFrame: { position: 'absolute', zIndex: 2 },
  errorFrame: { gap: 12 },
  errorIcon: { fontSize: 40 },
  errorText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ══════════════════════════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════════════════════════
export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible, images, initialIndex = 0, onClose,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const closeWithFade = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      opacity.setValue(1);
      onClose();
    });
  }, [opacity, onClose]);

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeWithFade}
      statusBarTranslucent
    >
      <StatusBar hidden={Platform.OS !== 'web'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[s.overlay, { opacity }]}>

          {/* Botón cerrar — esquina superior derecha */}
          <TouchableOpacity style={s.closeBtn} onPress={closeWithFade} activeOpacity={0.8}>
            <Text style={s.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Contador de imágenes */}
          {images.length > 1 && (
            <View style={s.counter}>
              <Text style={s.counterText}>{currentIndex + 1} / {images.length}</Text>
            </View>
          )}

          {/* Lista horizontal de imágenes */}
          <FlatList
            data={images}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / W);
              setCurrentIndex(idx);
            }}
            renderItem={({ item }) => (
              <ZoomableImage uri={item} onSwipeDown={closeWithFade} />
            )}
          />
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    right: 16,
    zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  closeIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default ImageViewer;
