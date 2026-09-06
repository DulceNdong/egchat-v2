import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, router, useNavigationContainerRef, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Alert, Platform, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { authAPI, clearToken, setUnauthorizedHandler, startKeepAlive, getToken } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge } from '../src/notifications';
import { Colors, ThemeProvider, useThemeContext } from '../src/theme';
import { useChatStream } from '../src/hooks/useChatStream';
import { ToastContainer } from '../src/components/Toast';
import { trackUserPresence } from '../src/supabase';
import SessionManager from '../src/sessionManager';
import { NativeCallKit } from '../src/native/CallKit';
import { PushKit } from '../src/native/PushKit';

import {
  registerSession, heartbeatSession, handleSyncMessage, handleSessionRevoked,
} from '../src/services/deviceSessions';

import { addNotification, fetchWeatherIfStale, initializeLocation } from '../src/store/appStore';
interface EBState { hasError: boolean; error?: string; }
class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  componentDidCatch(e: Error) { console.warn('[RootErrorBoundary]', e.message); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
            Algo salió mal
          </Text>
          <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 24 }}>
            {this.state.error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#00C8A0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

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
  return <StatusBar style="light" translucent backgroundColor="transparent" />;
}

const isAuthPath = (path: string) =>
  path.startsWith('/(auth)')
  || path === '/login'
  || path === '/register'
  || path === '/forgot-password';

const isRootPath = (path: string) => path === '/' || path === '/index';

export default function RootLayout() {
  const [checking, setChecking]         = useState(true);
  const [globalUserId, setGlobalUserId] = useState<string | undefined>(undefined);
  const notifCleanup    = useRef<(() => void) | null>(null);
  const pushTokenCleanup = useRef<(() => void) | null>(null);
  const pushCallCleanup  = useRef<(() => void) | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);
  const navigationRef   = useNavigationContainerRef();
  const pathname = usePathname();
  const sessionManager = SessionManager.getInstance();

  const unauthorizedCooldown = useRef(false);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      // Evitar múltiples disparos en cascada (por ejemplo, varias peticiones
      // fallando al mismo tiempo cuando el servidor Render se está despertando)
      if (unauthorizedCooldown.current) return;

      // Verificar que realmente no hay token válido antes de redirigir
      const token = await getToken().catch(() => null);
      if (!token) {
        // Sin token → sí hay que ir al login
        router.replace('/(auth)/login');
        return;
      }

      // Hay token → puede ser un 401 transitorio (Render cold start).
      // Esperar 4 segundos y verificar de nuevo antes de desconectar.
      unauthorizedCooldown.current = true;
      setTimeout(async () => {
        unauthorizedCooldown.current = false;
        try {
          const stillValid = await getToken().catch(() => null);
          if (!stillValid) {
            router.replace('/(auth)/login');
          }
          // Si el token sigue ahí, ignorar el 401 — fue transitorio
        } catch {
          // Error al verificar → no desconectar
        }
      }, 4000);
    });
  }, []);

  // SSE — solo conecta cuando hay userId
  useChatStream(globalUserId, useCallback((event: any) => {
    if (!globalUserId) return;

    // Nuevo mensaje → añadir notificación a la campanita
    if (event.type === 'new_message' && event.message && event.message.sender_id !== globalUserId) {
      const msg = event.message;
      addNotification({
        type: 'message',
        title: msg.sender?.full_name || msg.senderName || 'Nuevo mensaje',
        body: msg.type === 'image' ? '📷 Foto' :
              msg.type === 'audio' ? '🎤 Audio' :
              msg.type === 'video' ? '🎬 Video' :
              msg.text || 'Nuevo mensaje',
        chatId: event.chatId,
      });
    }

    // Transferencia recibida → notificación en campanita
    if (event.type === 'transfer_received') {
      const amount = event.amount ?? 0;
      const sender = event.senderName || 'Usuario';
      addNotification({
        type: 'message',
        title: '💸 Transferencia recibida',
        body: `${sender} te ha enviado ${amount.toLocaleString()} XAF`,
        chatId: undefined,
      });
    }

    if (event.type === 'sync_message' && event.chatId) {
      handleSyncMessage(event, { onNewMessage: () => {}, onChatUpdated: () => {} });
    }
    if (event.type === 'session_revoked') {
      handleSessionRevoked(event, () =>
        Alert.alert('Sesión cerrada', 'Tu sesión fue cerrada desde otro dispositivo.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]),
      );
    }
  }, [globalUserId]));

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad — máx 6s para quitar overlay
    const safetyTimer = setTimeout(() => {
      if (mounted) setChecking(false);
    }, 6000);

    const loadCachedSessionUser = async () => {
      try {
        return await sessionManager.getUser();
      } catch {
        return null;
      }
    };

    const init = async () => {
      let attempts = 0;
      while (!navigationRef.isReady() && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      try {
        if (Platform.OS === 'ios') {
          Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: true,
          }).catch(() => {});
        }

        const isAuth = await authAPI.isAuthenticated();
        const isAuthRoute = isAuthPath(pathname);
        if (!isAuth) {
          if (mounted) {
            setChecking(false);
            if (!isAuthRoute) router.replace('/(auth)/login');
          }
          return;
        }

        const authTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AUTH_STARTUP_TIMEOUT')), 5000);
        });

        let me: any = null;
        try {
          me = await Promise.race([authAPI.me(), authTimeout]);
        } catch (e) {
          const cachedUser = await loadCachedSessionUser();
          if (cachedUser?.id) {
            me = cachedUser;
            console.warn('[Startup auth fallback] using cached session user');
          } else {
            throw e;
          }
        }

        if (!me?.id) {
          await clearToken();
          if (mounted) {
            setChecking(false);
            if (!isAuthRoute) router.replace('/(auth)/login');
          }
          return;
        }

        if (mounted) {
          setChecking(false);
          if (isAuthRoute || isRootPath(pathname)) router.replace('/(tabs)');
        }

        // Servicios en background — no bloquean UI
        try {
          if (!me?.id || !mounted) return;

          setGlobalUserId(String(me.id));

          // Clima con geolocalización — inicializar ubicación automática al arrancar
          console.log('[APP] Iniciando detección de ubicación y clima...');
          initializeLocation().catch((error) => {
            console.error('[APP] Error inicializando ubicación:', error);
          });

          // Refrescar clima cada 10 minutos
          const weatherRefreshInterval = setInterval(() => {
            console.log('[APP] Refrescando clima...');
            fetchWeatherIfStale().catch(() => {});
          }, 10 * 60 * 1000); // 10 minutos

          // Iniciar keep-alive ahora que el usuario está autenticado
          startKeepAlive();

          presenceCleanup.current?.();
          presenceCleanup.current = trackUserPresence(me.id);

          const { getToken, getApiBase } = await import('../src/api');
          const getB = () => getApiBase();
          const getT = () => getToken();

          // Heartbeat
          const hb = () => getT().then(t =>
            fetch(`${getB()}/api/auth/heartbeat`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } })
          ).catch(() => {});
          hb();
          const hbTimer = setInterval(hb, 60000);

          // Sesiones — diferido 8s
          setTimeout(() => registerSession().catch(() => {}), 8000);
          const sessTimer = setInterval(() => heartbeatSession().catch(() => {}), 10 * 60 * 1000);

          // Notificaciones — diferidas para no competir con el arranque ni bloquear navegación.
          if (Platform.OS !== 'web') {
            setTimeout(async () => {
              if (!mounted) return;
              try {
                const enablePush = true; // push siempre activo en build nativo
                const enableVoip = process.env.EXPO_PUBLIC_ENABLE_VOIP !== '0';

                if (enablePush) {
                  const pushToken = await registerForPushNotifications().catch(() => null);
                  if (pushToken) {
                    // Push token registered successfully
                  }
                }

                // PushKit queda opt-in hasta confirmar entitlements/certificados VoIP en Xcode.
                // Evita crashes nativos tardíos que dejan la app en negro.
                if (enableVoip) {
                  try {
                    PushKit.register();
                    pushTokenCleanup.current = PushKit.onTokenUpdated(async (voipToken) => {
                      const t = await getT();
                      if (!t) return;
                      fetch(`${getB()}/api/push/register-voip-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                        body: JSON.stringify({ voipToken }),
                      }).catch(() => {});
                    });

                    pushCallCleanup.current = PushKit.onIncomingCall((callData) => {
                      router.push({ pathname: '/call/[callId]', params: {
                        callId: callData.callId, targetName: callData.callerName,
                        callType: callData.callType || 'audio', role: 'callee',
                        offer: callData.offer ? JSON.stringify(callData.offer) : undefined,
                      }} as any);
                    });
                  } catch (e) {
                    console.warn('[PushKit init skipped]', e);
                  }
                }

                notifCleanup.current = setupNotificationListeners(
                  (chatIdOrDeepLink) => {
                    if (chatIdOrDeepLink.startsWith('__djangue__')) {
                      const groupId = chatIdOrDeepLink.replace('__djangue__', '');
                      router.push({ pathname: '/djangue-detail', params: { id: groupId } } as any);
                    } else {
                      router.push(`/chat/${chatIdOrDeepLink}` as any);
                    }
                  },
                  (callData) => router.push({ pathname: '/call/[callId]', params: {
                    callId: callData.callId, targetName: callData.callerName,
                    callType: callData.callType || 'audio', role: 'callee',
                    offer: callData.offer ? JSON.stringify(callData.offer) : undefined,
                  }} as any),
                );

                clearBadge();
                const lastResp = await Notifications.getLastNotificationResponseAsync().catch(() => null);
                if (lastResp) {
                  const data = lastResp.notification.request.content.data as any;
                  // D4 — Deep link según tipo de notificación
                  setTimeout(() => {
                    if (data?.chatId) {
                      router.push(`/chat/${data.chatId}` as any);
                    } else if (data?.type === 'djangue_notification' && data?.groupId) {
                      router.push({ pathname: '/djangue-detail', params: { id: data.groupId } } as any);
                    } else if (data?.type === 'reaction' && data?.chatId) {
                      router.push(`/chat/${data.chatId}` as any);
                    }
                  }, 500);
                }
              } catch (e) {
                console.warn('[Notifications init error]', e);
              }
            }, 300);
          }

          presenceCleanup.current = () => {
            clearInterval(hbTimer);
            clearInterval(sessTimer);
            clearInterval(weatherRefreshInterval);
          };

        } catch (e) {
          // Error de red/servidor — no crashear, el usuario ya está en los tabs
          console.warn('[Background init error]', e);
          if (mounted) setChecking(false);
        }

      } catch {
        if (mounted) {
          await clearToken().catch(() => {});
          setChecking(false);
          if (!isAuthPath(pathname)) {
            router.replace('/(auth)/login');
          }
        }
      }
    };

    init();

    Linking.getInitialURL().then(handleDeepLink);
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      linkSub.remove();
      notifCleanup.current?.();
      pushTokenCleanup.current?.();
      pushCallCleanup.current?.();
      presenceCleanup.current?.();
    };
  }, []);

  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <StatusBarController />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="chat/[id]" />
              <Stack.Screen name="contacts" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="stories" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="map" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="_qr-scanner" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="call/[callId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="bancos" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="cemac" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="ocio" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="supermercados" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="apuestas" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="servicios-diarios" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="seguros-salud" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="mitaxi" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="new-chat" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="ajustes" />
              <Stack.Screen name="historial-completo" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="moments" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="broadcast" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="channels" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="global-search" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="business-profile" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="call-history" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="group-call" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="mini-apps" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="mini-app-player" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="barcos" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="djangue" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="djangue-detail" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="djangue-create" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="djangue-pay" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="djangue-add-member" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="_qr-login" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            {checking && (
              <View style={st.overlay}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            )}
            <ToastContainer />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
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
