import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { authAPI, setUnauthorizedHandler } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge } from '../src/notifications';
import { Colors, ThemeProvider, useThemeContext } from '../src/theme';
import { useWebRTC } from '../src/hooks/useWebRTC';
import { useChatStream } from '../src/hooks/useChatStream';
import { ToastContainer } from '../src/components/Toast';
import { FloatingHomeButton } from '../src/components/FloatingHomeButton';
import { trackUserPresence } from '../src/supabase';
import { NativeCallKit } from '../src/native/CallKit';
import { PushKit } from '../src/native/PushKit';
import {
  registerSession, heartbeatSession, handleSyncMessage, handleSessionRevoked,
} from '../src/services/deviceSessions';

// ── Deep link handler ─────────────────────────────────────────────
function handleDeepLink(url: string | null) {
  if (!url) return;
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || '';
    if (path.startsWith('qr-login/')) {
      const sessionId = path.replace('qr-login/', '');
      if (sessionId) setTimeout(() => router.push(`/_qr-login?sessionId=${sessionId}` as any), 300);
    } else if (path.startsWith('chat/')) {
      const chatId = path.replace('chat/', '');
      if (chatId) setTimeout(() => router.push(`/chat/${chatId}` as any), 300);
    } else if (path.startsWith('user/')) {
      const userId = path.replace('user/', '');
      if (userId) setTimeout(() => router.push(`/contacts?userId=${userId}` as any), 300);
    } else if (path.startsWith('call/open/')) {
      const callId = path.replace('call/open/', '');
      if (callId) setTimeout(() => router.push(`/call/${callId}` as any), 300);
    } else if (path.startsWith('call/end/')) {
      const callId = path.replace('call/end/', '');
      if (callId) { NativeCallKit.endCall(callId); setTimeout(() => router.back(), 200); }
    }
  } catch {}
}

function StatusBarController() {
  const { isDark } = useThemeContext();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#0d1117' : Colors.bgPrimary} />;
}

export default function RootLayout() {
  const [checking, setChecking]           = useState(true);
  const [globalUserId, setGlobalUserId]   = useState<string | undefined>(undefined);
  const notifCleanup    = useRef<(() => void) | null>(null);
  const incomingCleanup = useRef<(() => void) | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);
  const { pollIncoming } = useWebRTC();
  const navigationRef   = useNavigationContainerRef();

  setUnauthorizedHandler(() => router.replace('/(auth)/login'));

  // SSE global — solo conecta cuando hay userId (después del login)
  useChatStream(globalUserId, useCallback((event: any) => {
    if (event.type === 'sync_message' && event.chatId) {
      handleSyncMessage(event, { onNewMessage: () => {}, onChatUpdated: () => {} });
    }
    if (event.type === 'session_revoked') {
      handleSessionRevoked(event, () =>
        Alert.alert('Sesión cerrada', 'Tu sesión fue cerrada desde otro dispositivo.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]),
      );
    }
  }, []));

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Esperar NavigationContainer — máx 3s
      let attempts = 0;
      while (!navigationRef.isReady() && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      try {
        const isAuth = await authAPI.isAuthenticated();

        if (!isAuth) {
          if (mounted) { setChecking(false); router.replace('/(auth)/login'); }
          return;
        }

        // 2. Navegar inmediatamente — no esperar a authAPI.me()
        if (mounted) { setChecking(false); router.replace('/(tabs)'); }

        // 3. Cargar perfil y arrancar servicios en background (no bloquea UI)
        try {
          const me = await authAPI.me();
          if (!me?.id || !mounted) return;

          setGlobalUserId(String(me.id));

          // Presencia Supabase
          presenceCleanup.current?.();
          presenceCleanup.current = trackUserPresence(me.id);

          // API endpoints — completamente en background, fire-and-forget
          const { getToken, getApiBase } = await import('../src/api');
          const getB = () => getApiBase();
          const getT = () => getToken();

          // Storage init
          getT().then(t => fetch(`${getB()}/api/storage/init`, {
            method: 'POST', headers: { Authorization: `Bearer ${t}` }
          }).catch(() => {}));

          // Heartbeat cada 60s
          const hb = () => getT().then(t =>
            fetch(`${getB()}/api/auth/heartbeat`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } })
          ).catch(() => {});
          hb();
          const hbTimer = setInterval(hb, 60000);

          // Sesiones — diferido 8s para no competir con el arranque
          setTimeout(() => registerSession().catch(() => {}), 8000);
          const sessTimer = setInterval(() => heartbeatSession().catch(() => {}), 10 * 60 * 1000);

          presenceCleanup.current = () => {
            clearInterval(hbTimer);
            clearInterval(sessTimer);
            trackUserPresence(me.id); // ya se limpió arriba
          };

          // 4. Notificaciones y llamadas — solo nativo, diferidas 2s
          if (Platform.OS !== 'web') {
            setTimeout(async () => {
              if (!mounted) return;
              const pushToken = await registerForPushNotifications().catch(() => null);
              if (pushToken) console.log('✅ Push:', pushToken.substring(0, 20) + '...');

              PushKit.register();
              PushKit.onTokenUpdated(async (voipToken) => {
                const t = await getT();
                if (!t) return;
                fetch(`${getB()}/api/push/register-voip-token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                  body: JSON.stringify({ voipToken }),
                }).catch(() => {});
              });

              PushKit.onIncomingCall((callData) => {
                router.push({ pathname: '/call/[callId]', params: {
                  callId: callData.callId, targetName: callData.callerName,
                  callType: callData.callType || 'audio', role: 'callee',
                  offer: callData.offer ? JSON.stringify(callData.offer) : undefined,
                }} as any);
              });

              notifCleanup.current = setupNotificationListeners(
                (chatId) => router.push(`/chat/${chatId}` as any),
                (callData) => router.push({ pathname: '/call/[callId]', params: {
                  callId: callData.callId, targetName: callData.callerName,
                  callType: callData.callType || 'audio', role: 'callee',
                  offer: callData.offer ? JSON.stringify(callData.offer) : undefined,
                }} as any),
              );

              incomingCleanup.current = pollIncoming(me.id, (call) => {
                NativeCallKit.showIncomingCall(
                  call.callerName || 'Usuario', call.callerAvatar || '',
                  call.callId, call.type === 'video',
                );
                const unAnswer = NativeCallKit.onAnswer((cid) => {
                  if (cid !== call.callId) return;
                  unAnswer(); unReject();
                  router.push({ pathname: '/call/[callId]', params: {
                    callId: call.callId, targetName: call.callerName || 'Usuario',
                    targetAvatar: call.callerAvatar || '', callType: call.type || 'audio',
                    role: 'callee', offer: call.offer ? JSON.stringify(call.offer) : undefined,
                  }} as any);
                });
                const unReject = NativeCallKit.onReject((cid) => {
                  if (cid !== call.callId) return;
                  unAnswer(); unReject();
                });
              });

              clearBadge();
              const lastResp = await Notifications.getLastNotificationResponseAsync().catch(() => null);
              if (lastResp) {
                const data = lastResp.notification.request.content.data as any;
                if (data?.chatId) setTimeout(() => router.push(`/chat/${data.chatId}` as any), 500);
              }
            }, 2000); // diferir 2s para que la UI cargue primero
          }

        } catch (e) {
          console.warn('Background init error:', e);
        }

      } catch {
        if (mounted) { setChecking(false); router.replace('/(auth)/login'); }
      }
    };

    init();

    Linking.getInitialURL().then(handleDeepLink);
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      mounted = false;
      linkSub.remove();
      notifCleanup.current?.();
      incomingCleanup.current?.();
      presenceCleanup.current?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarController />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="contacts" options={{ presentation: 'modal' }} />
            <Stack.Screen name="stories" options={{ presentation: 'modal' }} />
            <Stack.Screen name="map" options={{ presentation: 'modal' }} />
            <Stack.Screen name="_qr-scanner" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="call/[callId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="bancos" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cemac" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ocio" options={{ presentation: 'modal' }} />
            <Stack.Screen name="supermercados" options={{ presentation: 'modal' }} />
            <Stack.Screen name="apuestas" options={{ presentation: 'modal' }} />
            <Stack.Screen name="servicios-diarios" options={{ presentation: 'modal' }} />
            <Stack.Screen name="seguros-salud" options={{ presentation: 'modal' }} />
            <Stack.Screen name="mitaxi" options={{ presentation: 'modal' }} />
            <Stack.Screen name="new-chat" options={{ presentation: 'modal' }} />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="ajustes" />
            <Stack.Screen name="historial-completo" options={{ presentation: 'modal' }} />
            <Stack.Screen name="moments" options={{ presentation: 'modal' }} />
            <Stack.Screen name="broadcast" options={{ presentation: 'modal' }} />
            <Stack.Screen name="channels" options={{ presentation: 'modal' }} />
            <Stack.Screen name="global-search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ajustes/cloud-backup" options={{ presentation: 'modal' }} />
            <Stack.Screen name="business-profile" options={{ presentation: 'modal' }} />
            <Stack.Screen name="call-history" options={{ presentation: 'modal' }} />
            <Stack.Screen name="group-call" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="mini-apps" options={{ presentation: 'modal' }} />
            <Stack.Screen name="mini-app-player" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="barcos" options={{ presentation: 'modal' }} />
            <Stack.Screen name="_qr-login" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
          <FloatingHomeButton />
          {checking && (
            <View style={st.overlay}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          )}
          <ToastContainer />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const st = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
