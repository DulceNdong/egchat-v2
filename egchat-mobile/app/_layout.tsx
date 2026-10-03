import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Alert, Platform, Text, TouchableOpacity, AppState, Modal, Animated } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { authAPI, clearToken, setUnauthorizedHandler, startKeepAlive, getToken, walletAPI } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge, consumePendingCall } from '../src/notifications';
import { Colors, ThemeProvider, useThemeContext } from '../src/theme';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import { FontProvider } from '../src/context/FontContext';
import { ActiveCallProvider } from '../src/context/ActiveCallContext';
import { FloatingCallBar } from '../src/components/call/FloatingCallBar';
import { useChatStream } from '../src/hooks/useChatStream';
import { ToastContainer } from '../src/components/Toast';
import { OfflineBanner } from '../src/components/ui';
import { trackUserPresence } from '../src/supabase';
import SessionManager from '../src/sessionManager';
import { NativeCallKit } from '../src/native/CallKit';
import { PushKit } from '../src/native/PushKit';
import { EGAvatar } from '../src/components/ui/EGAvatar';
// ── CallManager global — se inicializa aquí una sola vez ──────────
import { callManager } from '../src/call/CallManager';
import type { IncomingCallPayload } from '../src/call/types';

import {
  registerSession, heartbeatSession, handleSyncMessage, handleSessionRevoked,
} from '../src/services/deviceSessions';

import { addNotification, markNotificationRead, fetchWeatherIfStale, initializeLocation } from '../src/store/appStore';
import { IncomingTransferModal, type IncomingTransfer } from '../src/components/wallet/IncomingTransferModal';
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

function LocalizedAppContent({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  return <React.Fragment key={language}>{children}</React.Fragment>;
}

// Welcome es ruta especial — nunca se interrumpe con redirects
const isWelcomePath = (path: string) => path === '/welcome';
// Llamadas — el spinner de auth no debe tapar la pantalla de llamada entrante
const isCallPath = (path: string) => path.startsWith('/call/');

const isAuthPath = (path: string) =>
  path.startsWith('/(auth)')
  || path === '/login'
  || path === '/register'
  || path === '/forgot-password';

const isRootPath = (path: string) =>
  path === '/' || path === '/index' || path === '/welcome';

// ── Overlay de llamada entrante ───────────────────────────────────────────
// Se muestra encima de cualquier pantalla cuando llega una llamada con la app abierta.
function IncomingCallOverlay({
  callData, onAccept, onReject,
}: {
  callData: { callId: string; callerName: string; callerAvatar?: string; callType: string };
  onAccept: () => void;
  onReject: () => void;
}) {
  const isVideo = callData.callType === 'video';
  return (
    <Modal
      transparent
      animationType="slide"
      visible
      statusBarTranslucent
      onRequestClose={onReject}
    >
      <View style={ic.backdrop}>
        <View style={ic.card}>
          {/* Tipo de llamada */}
          <Text style={ic.callType}>{isVideo ? 'Videollamada entrante' : 'Llamada de voz'}</Text>

          {/* Avatar + nombre */}
          <EGAvatar src={callData.callerAvatar} name={callData.callerName} size={72} />
          <Text style={ic.name}>{callData.callerName}</Text>

          {/* Acciones */}
          <View style={ic.actions}>
            {/* Rechazar */}
            <View style={ic.actionCol}>
              <TouchableOpacity style={ic.rejectBtn} onPress={onReject} activeOpacity={0.8}>
                <Text style={ic.rejectIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={ic.actionLabel}>Rechazar</Text>
            </View>
            {/* Aceptar */}
            <View style={ic.actionCol}>
              <TouchableOpacity style={ic.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
                <Text style={ic.acceptIcon}>{isVideo ? '▶' : '✆'}</Text>
              </TouchableOpacity>
              <Text style={ic.actionLabel}>Aceptar</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ic = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 32, paddingVertical: 32, paddingBottom: 44,
    alignItems: 'center', gap: 12,
  },
  callType: { fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.4, marginBottom: 4 },
  name:     { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 4 },
  actions:  { flexDirection: 'row', gap: 52, marginTop: 20 },
  actionCol:{ alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  rejectBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  rejectIcon: { fontSize: 22, color: '#fff' },
  acceptBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },
  acceptIcon: { fontSize: 22, color: '#fff' },
});

export default function RootLayout() {
  const [checking, setChecking]                             = useState(true);
  const [globalUserId, setGlobalUserId]                     = useState<string | undefined>(undefined);
  const [incomingTransfer, setIncomingTransfer]             = useState<IncomingTransfer | null>(null);
  const [globalWalletBalance, setGlobalWalletBalance]       = useState<number | null>(null);
  // ── Llamada entrante con app abierta ─────────────────────────────
  // El CallManager es la única fuente de verdad.
  // Aquí solo guardamos el payload para mostrar el overlay.
  // NO hacemos router.push simultáneo — el overlay se encarga de navegar.
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);

  // Guard anti-duplicado: evita procesar el mismo callId dos veces
  // (receivedSub + responseSub + PushKit pueden dispararse juntos)
  const lastHandledCallId = useRef<string | null>(null);
  const lastHandledCallTs = useRef<number>(0);
  const CALL_DEDUP_MS = 8000;

  /** Punto de entrada único para cualquier llamada entrante */
  const handleIncomingCall = useCallback((payload: IncomingCallPayload) => {
    const { callId } = payload;
    if (!callId) return;
    const now = Date.now();
    if (callId === lastHandledCallId.current && now - lastHandledCallTs.current < CALL_DEDUP_MS) return;
    lastHandledCallId.current = callId;
    lastHandledCallTs.current = now;

    // Registrar en el CallManager (fuente de verdad)
    callManager.registerIncoming(payload);

    // Añadir al historial de campanita
    addNotification({
      type: 'call',
      title: `📞 Llamada de ${payload.callerName}`,
      body: payload.callType === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante',
      chatId: undefined,
    });

    // Mostrar overlay (el overlay navega cuando el usuario acepta)
    setIncomingCall(payload);
  }, []);
  const notifCleanup    = useRef<(() => void) | null>(null);
  const pushTokenCleanup = useRef<(() => void) | null>(null);
  const pushCallCleanup  = useRef<(() => void) | null>(null);
  const presenceCleanup = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const sessionManager = SessionManager.getInstance();

  const unauthorizedCooldown = useRef(false);

  // ── Modo inmersivo Android — oculta barra de navegación ──────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const setImmersive = () => {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    };
    setImmersive();
    // Reactivar cuando la app vuelve al primer plano
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setImmersive();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      // Evitar múltiples disparos en cascada (por ejemplo, varias peticiones
      // fallando al mismo tiempo cuando el servidor Render se está despertando)
      if (unauthorizedCooldown.current) return;

      // Verificar que realmente no hay token válido antes de redirigir
      const token = await getToken().catch(() => null);
      if (!token) {
        // Sin token → ir a welcome screen
        router.replace('/welcome');
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
            router.replace('/welcome');
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

    // Transferencia recibida (legacy) → notificación en campanita
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

    // Transferencia pendiente → mostrar modal Recibir/Cancelar
    if (event.type === 'transfer_pending') {
      setIncomingTransfer({
        transferId: event.transferId!,
        amount:     event.amount ?? 0,
        senderName: event.senderName || 'Usuario',
        concept:    event.concept ?? null,
        expiresAt:  event.expiresAt,
      });
    }

    // SSE reconectado → recuperar si hay transferencias pendientes sin atender
    // (el usuario estaba offline cuando llegó el evento transfer_pending)
    if (event.type === 'connected') {
      walletAPI.getPendingTransfers().then(res => {
        const incoming = (res.transfers || []).find(
          t => t.direction === 'incoming' && !t.isExpired,
        );
        if (incoming) {
          setIncomingTransfer({
            transferId: incoming.id,
            amount:     incoming.amount,
            senderName: incoming.senderName,
            concept:    incoming.concept ?? null,
            expiresAt:  incoming.expiresAt,
          });
        }
      }).catch(() => {});
    }

    // Saldo actualizado (remitente o receptor tras aceptar) → actualizar balance global
    if (event.type === 'wallet_updated' && event.balance != null) {
      setGlobalWalletBalance(event.balance);
    }

    // Transferencia aceptada → notificación al remitente
    if (event.type === 'transfer_accepted') {
      const amount = event.amount ?? 0;
      const who = event.recipientName ? `${event.recipientName} aceptó` : 'Aceptaron';
      addNotification({
        type: 'message',
        title: '✅ Transferencia aceptada',
        body: `${who} tu transferencia de ${amount.toLocaleString()} XAF`,
        chatId: undefined,
      });
    }

    // Transferencia cancelada → notificación al remitente + devolver saldo
    if (event.type === 'transfer_cancelled') {
      const amount = event.amount ?? 0;
      if (event.balance != null) setGlobalWalletBalance(event.balance);
      const who = event.cancellerName ? `${event.cancellerName} rechazó` : 'Rechazaron';
      addNotification({
        type: 'message',
        title: '❌ Transferencia rechazada',
        body: `${who} tu transferencia de ${amount.toLocaleString()} XAF. El dinero fue devuelto.`,
        chatId: undefined,
      });
    }

    if (event.type === 'sync_message' && event.chatId) {
      handleSyncMessage(event, { onNewMessage: () => {}, onChatUpdated: () => {} });
    }
    if (event.type === 'session_revoked') {
      handleSessionRevoked(event, () =>
        Alert.alert('Sesión cerrada', 'Tu sesión fue cerrada desde otro dispositivo.',
          [{ text: 'OK', onPress: () => router.replace('/welcome') }]),
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

    // ── Capturar lastNotificationResponse ANTES de cualquier delay ──────
    // Si el usuario tapó una notificación que lanzó la app desde cero,
    // la respuesta solo está disponible durante unos ms tras el mount.
    // Capturarla aquí y procesarla una vez el router esté listo.
    let pendingLastResp: Awaited<ReturnType<typeof Notifications.getLastNotificationResponseAsync>> | null = null;
    Notifications.getLastNotificationResponseAsync().then(r => {
      pendingLastResp = r ?? null;
    }).catch(() => {});

    const init = async () => {
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

        // Si estamos en welcome O en el index (que redirige a welcome),
        // NO hacer nada — esperar a que welcome navegue sola al login
        if (isWelcomePath(pathname) || pathname === '/' || pathname === '/index') {
          setChecking(false);
          return;
        }

        if (!isAuth) {
          if (mounted) {
            setChecking(false);
            if (!isAuthRoute) router.replace('/welcome');
          }
          return;
        }

        const cachedUser = await loadCachedSessionUser();
        if (cachedUser?.id && mounted) {
          setChecking(false);
          if (isAuthRoute) {
            router.replace('/(tabs)');
          }
        }

        const authTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AUTH_STARTUP_TIMEOUT')), 5000);
        });

        let me: any = null;
        try {
          me = await Promise.race([authAPI.me(), authTimeout]);
        } catch (e) {
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
            if (!isAuthRoute) router.replace('/welcome');
          }
          return;
        }

        if (mounted) {
          setChecking(false);
          if (isAuthRoute || (isRootPath(pathname) && !isWelcomePath(pathname))) {
            router.replace('/(tabs)');
          }
        }

        // Servicios en background — no bloquean UI
        try {
          if (!me?.id || !mounted) return;

          // ── iOS VoIP PushKit — registrar listener INMEDIATAMENTE ──────────
          // PushKit despierta la app en background antes de que el JS esté listo.
          // El módulo nativo encola el evento y lo entrega en cuanto hay un listener.
          // DEBE registrarse aquí, sin ningún delay, para no perder llamadas con
          // la app cerrada/suspendida.
          if (Platform.OS === 'ios') {
            try {
              const enableVoip = process.env.EXPO_PUBLIC_ENABLE_VOIP !== '0';
              if (enableVoip) {
                PushKit.register();
                pushCallCleanup.current = PushKit.onIncomingCall((callData) => {
                  // Punto de entrada único — no duplicar con router.push aquí
                  handleIncomingCall({
                    callId:       callData.callId,
                    callerName:   callData.callerName,
                    callerAvatar: (callData as any).callerAvatar || '',
                    callType:     callData.callType || 'audio',
                    offer:        callData.offer,
                  });
                });
              }
            } catch (e) {
              console.warn('[PushKit early init skipped]', e);
            }
          }

          // ── Llamada pendiente (app estaba cerrada cuando llegó la llamada) ──
          // Se comprueba con pequeño retry para asegurar que el router ya está montado.
          if (Platform.OS === 'android') {
            const navigatePendingCall = async (retries = 5) => {
              for (let i = 0; i < retries; i++) {
                try {
                  const pending = await consumePendingCall();
                  if (!pending || !mounted) return;
                  // Registrar en CallManager y navegar directamente
                  // (no hay overlay posible — la app acaba de abrirse desde cero)
                  callManager.registerIncoming({
                    callId:       pending.callId,
                    callerName:   pending.callerName,
                    callerAvatar: pending.callerAvatar || '',
                    callType:     pending.callType || 'audio',
                    offer:        pending.offer ?? undefined,
                  });
                  addNotification({
                    type: 'call',
                    title: `📞 Llamada entrante de ${pending.callerName}`,
                    body: pending.callType === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante',
                    chatId: undefined,
                  });
                  router.push({ pathname: '/call/[callId]', params: {
                    callId:      pending.callId,
                    targetName:  pending.callerName,
                    targetAvatar: pending.callerAvatar || '',
                    callType:    pending.callType || 'audio',
                    role:        'callee',
                    offer:       pending.offer ? JSON.stringify(pending.offer) : undefined,
                  }} as any);
                  return;
                } catch {
                  // router no listo aún — esperar 400ms y reintentar
                  await new Promise(r => setTimeout(r, 400));
                }
              }
            };
            navigatePendingCall().catch(() => {});
          }

          // En equipos Android de gama media/baja, iniciar SSE, presencia y
          // notificaciones durante los primeros segundos satura el hilo JS y
          // hace que las transiciones parezcan bloqueadas. La interfaz ya está
          // lista con la sesión/cache local, así que estos servicios se inician
          // después de que el usuario pueda navegar con fluidez.
          const androidBackgroundDelay = Platform.OS === 'android' ? 15000 : 0;
          const realtimeStartTimer = setTimeout(() => {
            if (mounted) setGlobalUserId(String(me.id));
          }, androidBackgroundDelay);

          // La geolocalización puede ser costosa en Android: se difiere para
          // que la primera pantalla sea interactiva antes de solicitarla.
          const locationTimer = setTimeout(() => {
            initializeLocation().catch((error) => {
              console.error('[APP] Error inicializando ubicación:', error);
            });
          }, Platform.OS === 'android' ? 20000 : 2500);

          // Refrescar clima cada 10 minutos
          const weatherRefreshInterval = setInterval(() => {
            console.log('[APP] Refrescando clima...');
            fetchWeatherIfStale().catch(() => {});
          }, 10 * 60 * 1000); // 10 minutos

          // Iniciar keep-alive ahora que el usuario está autenticado
          startKeepAlive();

          const presenceStartTimer = setTimeout(() => {
            presenceCleanup.current?.();
            presenceCleanup.current = trackUserPresence(me.id);
          }, androidBackgroundDelay);

          const { getToken, getApiBase } = await import('../src/api');
          const getB = () => getApiBase();
          const getT = () => getToken();

          // Heartbeat
          const hb = () => getT().then(t =>
            fetch(`${getB()}/api/auth/heartbeat`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } })
          ).catch(() => {});
          setTimeout(hb, androidBackgroundDelay);
          const hbTimer = setInterval(hb, 60000);

          // Sesiones — no competir con la primera navegación en Android.
          const registerSessionTimer = setTimeout(
            () => registerSession().catch(() => {}),
            Platform.OS === 'android' ? 22000 : 8000,
          );
          const sessTimer = setInterval(() => heartbeatSession().catch(() => {}), 10 * 60 * 1000);

          // Notificaciones — el registro de llamadas es INMEDIATO para no perder
          // llamadas entrantes. El resto de servicios se difieren para no bloquear la UI.
          if (Platform.OS !== 'web') {
            // Las llamadas entrantes necesitan que los listeners estén listos en < 2s.
            // Separamos el init de push/llamadas (crítico, 2s) del resto (no crítico, 25s).
            const callListenerTimer = setTimeout(async () => {
              if (!mounted) return;
              try {
                const enablePush = true;
                const enableVoip = process.env.EXPO_PUBLIC_ENABLE_VOIP !== '0';

                if (enablePush) {
                  await registerForPushNotifications().catch(() => null);
                }

                if (enableVoip) {
                  try {
                    // iOS: PushKit ya fue registrado inmediatamente al autenticarse
                    // (ver bloque "iOS VoIP PushKit — registrar listener INMEDIATAMENTE" arriba).
                    // Aquí solo registramos el token updater, que no es crítico para recibir llamadas.
                    if (Platform.OS === 'ios') {
                      pushTokenCleanup.current = PushKit.onTokenUpdated(async (voipToken) => {
                        const t = await getT();
                        if (!t) return;
                        fetch(`${getB()}/api/push/register-voip-token`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                          body: JSON.stringify({ voipToken }),
                        }).catch(() => {});
                      });
                    } else {
                      // Android / otras plataformas: registrar todo aquí
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
                        // Punto de entrada único — sin router.push
                        handleIncomingCall({
                          callId:       callData.callId,
                          callerName:   callData.callerName,
                          callerAvatar: (callData as any).callerAvatar || '',
                          callType:     callData.callType || 'audio',
                          offer:        callData.offer,
                        });
                      });
                    }
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
                  (callData) => {
                    // Punto de entrada único: CallManager + overlay
                    // NO hacer router.push aquí — el overlay navega cuando el usuario acepta
                    handleIncomingCall({
                      callId:       callData.callId,
                      callerName:   callData.callerName,
                      callerAvatar: callData.callerAvatar || '',
                      callType:     callData.callType || 'audio',
                      offer:        callData.offer,
                    });
                  },
                );

                clearBadge();

                // Usar la respuesta capturada al inicio de init() — si el usuario
                // tapó una notificación que lanzó la app, esta ya tiene los datos.
                const lastResp = pendingLastResp
                  ?? await Notifications.getLastNotificationResponseAsync().catch(() => null);
                if (lastResp) {
                  const data = lastResp.notification.request.content.data as any;
                  setTimeout(() => {
                    if (data?.notificationType === 'incoming_call' && data?.callId) {
                      // Tap en notificación de llamada → usar punto de entrada único
                      handleIncomingCall({
                        callId:       data.callId,
                        callerName:   data.callerName || 'Usuario',
                        callerAvatar: data.callerAvatar || '',
                        callType:     data.callType || 'audio',
                        offer:        data.offer,
                      });
                    } else if (data?.chatId) {
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
            // CRÍTICO: 2s en Android (antes 25s) — sin esto las llamadas entrantes
            // en los primeros 25s de la app se pierden silenciosamente.
            }, Platform.OS === 'android' ? 2000 : 300);

            const stopPresenceTracking = presenceCleanup.current;
            presenceCleanup.current = () => {
              stopPresenceTracking?.();
              clearInterval(hbTimer);
              clearInterval(sessTimer);
              clearInterval(weatherRefreshInterval);
              clearTimeout(locationTimer);
              clearTimeout(realtimeStartTimer);
              clearTimeout(presenceStartTimer);
              clearTimeout(registerSessionTimer);
              clearTimeout(callListenerTimer);
            };
            return;
          }

          const stopPresenceTracking = presenceCleanup.current;
          presenceCleanup.current = () => {
            stopPresenceTracking?.();
            clearInterval(hbTimer);
            clearInterval(sessTimer);
            clearInterval(weatherRefreshInterval);
            clearTimeout(locationTimer);
            clearTimeout(realtimeStartTimer);
            clearTimeout(presenceStartTimer);
            clearTimeout(registerSessionTimer);
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
            router.replace('/welcome');
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

  // ── Cuando welcome termina y navega al login, verificar auth ────
  // El init() ya terminó con return en pathname='/', este efecto
  // se dispara cuando el pathname cambia a una ruta de auth.
  useEffect(() => {
    if (!isAuthPath(pathname)) return;
    // Si el usuario ya tiene sesión válida, mandarlo a tabs
    (async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          const me = await authAPI.me().catch(() => null);
          if (me?.id) router.replace('/(tabs)');
        }
      } catch {}
    })();
  }, [pathname]);

  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
          <FontProvider>
          <ActiveCallProvider>
          <ThemeProvider>
            <LocalizedAppContent>
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
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
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
            {checking && !isWelcomePath(pathname) && !isCallPath(pathname) && (
              <View style={st.overlay}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            )}
            <ToastContainer />
            <OfflineBanner />
            <FloatingCallBar />
            {/* ── Overlay llamada entrante (app abierta) ── */}
            {incomingCall && (
              <IncomingCallOverlay
                callData={incomingCall}
                onAccept={() => {
                  const c = incomingCall;
                  setIncomingCall(null);
                  // El CallManager ya tiene la sesión registrada via handleIncomingCall().
                  // Solo navegamos — [callId].tsx llama a callManager.acceptCall() al montar.
                  router.push({ pathname: '/call/[callId]', params: {
                    callId:      c.callId,
                    targetName:  c.callerName,
                    targetAvatar: c.callerAvatar || '',
                    callType:    c.callType || 'audio',
                    role:        'callee',
                    offer:       c.offer ? JSON.stringify(c.offer) : undefined,
                  }} as any);
                }}
                onReject={() => {
                  setIncomingCall(null);
                  // Rechazar en el manager para que limpie estado y envíe end al servidor
                  callManager.rejectCall().catch(() => {});
                }}
              />
            )}
            <IncomingTransferModal
              transfer={incomingTransfer}
              onAccepted={(newBalance) => {
                setGlobalWalletBalance(newBalance);
                setIncomingTransfer(null);
                addNotification({
                  type: 'message',
                  title: '💸 Dinero recibido',
                  body: `${(incomingTransfer?.amount ?? 0).toLocaleString()} XAF añadidos a tu monedero`,
                  chatId: undefined,
                });
              }}
              onCancelled={() => setIncomingTransfer(null)}
              onDismiss={() => setIncomingTransfer(null)}
            />
            </LocalizedAppContent>
          </ThemeProvider>
          </ActiveCallProvider>
          </FontProvider>
          </LanguageProvider>
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
