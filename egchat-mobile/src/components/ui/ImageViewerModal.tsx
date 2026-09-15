// ImageViewerModal.tsx — Visor de imagen a pantalla completa
import React, { useRef } from 'react';
import {
  Modal, View, Image, TouchableOpacity, StyleSheet,
  Text, StatusBar, Platform, Animated, PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_DOWN_THRESHOLD = 100;

interface ImageViewerModalProps {
  visible: boolean;
  uri: string | null | undefined;
  /** Nombre que aparece como caption debajo de la foto */
  name?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  uri,
  name,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Swipe-down para cerrar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
          opacity.setValue(Math.max(0.4, 1 - gs.dy / 350));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SWIPE_DOWN_THRESHOLD) {
          // Animación de salida rápida
          Animated.parallel([
            Animated.timing(translateY, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            translateY.setValue(0);
            opacity.setValue(1);
            onClose();
          });
        } else {
          // Volver a posición original
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden={Platform.OS === 'ios'} backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

      <Animated.View style={[styles.overlay, { opacity }]}>
        {/* Botón cerrar */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={onClose}
          activeOpacity={0.75}
          hitSlop={12}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        {/* Imagen con swipe-down */}
        <Animated.View
          style={[styles.imageWrapper, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Caption con el nombre */}
        {name ? (
          <View style={[styles.caption, { bottom: insets.bottom + 20 }]}>
            <Text style={styles.captionText} numberOfLines={1}>{name}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 18,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  imageWrapper: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  captionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
