// Toast.tsx — Pastilla nativa discreta (estilo WhatsApp / WeChat)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../hooks/useHaptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ── Singleton store ───────────────────────────────────────────────
let _showToast: ((item: Omit<ToastItem, 'id'>) => void) | null = null;

export const toast = {
  success: (title: string, message?: string) =>
    _showToast?.({ type: 'success', title, message, duration: 2200 }),
  error: (title: string, message?: string) =>
    _showToast?.({ type: 'error', title, message, duration: 3000 }),
  warning: (title: string, message?: string) =>
    _showToast?.({ type: 'warning', title, message, duration: 2500 }),
  info: (title: string, message?: string) =>
    _showToast?.({ type: 'info', title, message, duration: 2200 }),
};

// ── Componente individual ─────────────────────────────────────────
const ToastPill = ({
  item, onDismiss,
}: { item: ToastItem; onDismiss: (id: string) => void }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    // Entrada suave
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 9 }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), item.duration ?? 2200);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.88, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  };

  const label = item.message ? `${item.title} · ${item.message}` : item.title;

  return (
    <Animated.View style={[styles.pill, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </Animated.View>
  );
};

// ── Contenedor global ─────────────────────────────────────────────
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts(prev => {
      // Deduplicar: mismo título+tipo activo → ignorar
      const isDuplicate = prev.some(t => t.title === item.title && t.type === item.type);
      if (isDuplicate) return prev;
      const id = `toast-${Date.now()}-${Math.random()}`;
      // Máximo 1 visible a la vez (como WhatsApp)
      return [{ ...item, id }];
    });
    if (item.type === 'success') haptics.success();
    else if (item.type === 'error') haptics.error();
    else if (item.type === 'warning') haptics.warning();
    else haptics.light();
  }, []);

  useEffect(() => {
    _showToast = show;
    return () => { _showToast = null; };
  }, [show]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.container, { bottom: insets.bottom + 72 }]}
      pointerEvents="none"
    >
      {toasts.map(t => (
        <ToastPill key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    backgroundColor: 'rgba(30, 30, 30, 0.88)',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
    maxWidth: '80%',
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
