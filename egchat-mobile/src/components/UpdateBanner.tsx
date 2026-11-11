// UpdateBanner.tsx — Aviso automático de actualización OTA
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { t as tr } from '../translations';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready';

export const UpdateBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<UpdateState>('idle');
  const stateRef = useRef<UpdateState>('idle');
  const checkingRef = useRef(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;

  const setPhase = useCallback((next: UpdateState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (checkingRef.current || stateRef.current !== 'idle') return;
    checkingRef.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      setPhase('available');
      setPhase('downloading');
      await Updates.fetchUpdateAsync();
      setPhase('ready');
    } catch {
      setPhase(stateRef.current === 'idle' ? 'idle' : 'available');
    } finally {
      checkingRef.current = false;
    }
  }, [setPhase]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      if (status === 'active') checkForUpdates();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [checkForUpdates]);

  useEffect(() => {
    if (state === 'idle') return;
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
    }).start();
  }, [state, slideAnim]);

  const handlePress = async () => {
    if (stateRef.current === 'downloading') return;
    try {
      if (stateRef.current === 'available') {
        setPhase('downloading');
        await Updates.fetchUpdateAsync();
        setPhase('ready');
        return;
      }
      await Updates.reloadAsync();
    } catch {
      setPhase(stateRef.current === 'ready' ? 'ready' : 'available');
    }
  };

  if (state === 'idle') return null;

  const busy = state === 'downloading';
  const label = busy
    ? tr('setUpdating')
    : state === 'ready'
      ? tr('setRestart')
      : tr('setUpdate');

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: insets.top + 6, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>⤓</Text>
        <Text style={styles.text} numberOfLines={2}>
          {state === 'ready' ? tr('setUpdateDownloaded') : tr('sysNewVersion')}
        </Text>
        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={handlePress}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>{label}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00c8a0',
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 12,
  },
  icon: { fontSize: 16, color: '#fff' },
  text: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

export default UpdateBanner;
