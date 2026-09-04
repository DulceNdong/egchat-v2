// Toast.tsx — Notificaciones in-app tipo banner (igual que la web)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../hooks/useHaptics';

const { width: W } = Dimensions.get('window');

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
    _showToast?.({ type: 'success', title, message, duration: 3000 }),
  error: (title: string, message?: string) =>
    _showToast?.({ type: 'error', title, message, duration: 4000 }),
  warning: (title: string, message?: string) =>
    _showToast?.({ type: 'warning', title, message, duration: 3500 }),
  info: (title: string, message?: string) =>
    _showToast?.({ type: 'info', title, message, duration: 3000 }),
};

// ── Colores por tipo ──────────────────────────────────────────────
const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#F0FDF4', border: '#00c8a0', icon: '✅' },
  error:   { bg: '#FEF2F2', border: '#EF4444', icon: '❌' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', icon: '⚠️' },
  info:    { bg: '#EFF6FF', border: '#00B4E6', icon: 'ℹ️' },
};

// ── Componente individual ─────────────────────────────────────────
const ToastBanner = ({
  item, onDismiss,
}: { item: ToastItem; onDismiss: (id: string) => void }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const c = COLORS[item.type];

  useEffect(() => {
    // Entrada
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), item.duration || 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  };

  return (
    <Animated.View style={[
      styles.banner,
      { backgroundColor: c.bg, borderLeftColor: c.border, transform: [{ translateY }], opacity },
    ]}>
      <Text style={styles.icon}>{c.icon}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.message ? <Text style={styles.message} numberOfLines={2}>{item.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} activeOpacity={0.7}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Contenedor global ─────────────────────────────────────────────
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts(prev => {
      // Deduplicar: si ya hay un toast con el mismo título y tipo activo, ignorar
      const isDuplicate = prev.some(t => t.title === item.title && t.type === item.type);
      if (isDuplicate) return prev;
      const id = `toast-${Date.now()}-${Math.random()}`;
      return [...prev.slice(-1), { ...item, id }]; // max 2 visibles
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
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map(t => (
        <ToastBanner key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { fontSize: 18, flexShrink: 0 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  message: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  closeBtn: { padding: 4, flexShrink: 0 },
  closeText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
