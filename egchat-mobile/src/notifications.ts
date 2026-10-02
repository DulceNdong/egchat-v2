/**
 * notifications.ts — Notificaciones nativas con expo-notifications
 * Funciona con el teléfono hibernado gracias a FCM (Android) y APNs (iOS)
 * Push y VoIP activos — Apple Developer Program configurado
 */
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './api';
import { RichNotifications } from './native/RichNotifications';
import { playNotification } from './hooks/useSounds';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com';
const BACKGROUND_TASK = 'EGCHAT_BACKGROUND_NOTIFICATION';
const PUSH_ENABLED = true; // activar push nativo

// ── Configurar cómo se muestran las notificaciones en primer plano ──────────
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as any;
    const isCall = data?.notificationType === 'incoming_call';
    return {
      shouldShowAlert: true,
      shouldShowBanner: !isCall, // llamadas: CallKit/pantalla nativa lo maneja
      shouldShowList: true,
      // Para mensajes en primer plano: NO reproducir sonido del sistema
      // porque RichNotifications.show() ya da el feedback visual/auditivo
      // Para llamadas: tampoco — el ringtone lo maneja startRingtone()
      shouldPlaySound: false,
      shouldSetBadge: !isCall,
      priority: isCall
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// ── Tarea en segundo plano para notificaciones recibidas con app cerrada ────
// Android: FCM despierta la app con alta prioridad, esta tarea procesa la
// notificación de llamada entrante y guarda los datos en AsyncStorage para
// que _layout.tsx los recoja cuando la app se abra.
TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }: any) => {
  if (error) {
    console.warn('[BGTask] Error:', error);
    return;
  }
  try {
    const notification = data?.notification;
    const payload = notification?.request?.content?.data as any;
    if (!payload) return;

    if (payload?.notificationType === 'incoming_call') {
      // Guardar en AsyncStorage para que _layout.tsx lo consuma al montar
      await AsyncStorage.setItem('egchat_pending_call', JSON.stringify({
        callId: payload.callId,
        callerName: payload.callerName,
        callerAvatar: payload.callerAvatar || '',
        callType: payload.callType || 'audio',
        offer: payload.offer || null,
        timestamp: Date.now(),
      }));
    }
  } catch (e) {
    console.warn('[BGTask] Error procesando notificación:', e);
  }
});

// ── Crear canales Android ───────────────────────────────────────────────────
// Se llama al inicio de la app para asegurar que los canales existen.
// No borra ni recrea — eso lo hace refreshAndroidChannels cuando el usuario
// cambia el tono desde ajustes.
async function createChannels() {
  if (Platform.OS !== 'android') return;

  const { getSoundSettings } = await import('./hooks/useSounds');
  const soundSettings = await getSoundSettings();

  // Tono de mensajes: usa messageTone del usuario (fallback: egchat.wav)
  const messageSoundFile =
    soundSettings.messageTone === 'none'
      ? undefined
      : `${soundSettings.messageTone}.wav`;

  // Tono de llamadas: usa ringtone del usuario (fallback: classic.wav)
  const callSoundFile =
    soundSettings.ringtone === 'none' || soundSettings.ringtone === 'vibrate_only'
      ? undefined
      : `${soundSettings.ringtone}.wav`;

  // Solo crear si no existen (no borramos para evitar gap de notificaciones al inicio)
  const existing = await Notifications.getNotificationChannelsAsync().catch(() => []);
  const existingIds = new Set(existing.map((c) => c.id));

  if (!existingIds.has('egchat-messages')) {
    await Notifications.setNotificationChannelAsync('egchat-messages', {
      name: 'Mensajes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: soundSettings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      lightColor: '#00c8a0',
      sound: messageSoundFile,
      enableVibrate: soundSettings.vibrationEnabled,
      showBadge: true,
    });
  }

  if (!existingIds.has('egchat-calls')) {
    await Notifications.setNotificationChannelAsync('egchat-calls', {
      name: 'Llamadas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: soundSettings.vibrationEnabled ? [0, 500, 200, 500, 200, 500] : undefined,
      lightColor: '#facc15',
      sound: callSoundFile,
      enableVibrate: soundSettings.vibrationEnabled,
      showBadge: false,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

// ── Recrear canales Android cuando el usuario cambia el tono ──────────────
// Llamar desde sonidos.tsx después de guardar un nuevo tono.
export async function refreshAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const { getSoundSettings } = await import('./hooks/useSounds');
  const soundSettings = await getSoundSettings();

  const messageSoundFile =
    soundSettings.messageTone === 'none'
      ? undefined
      : `${soundSettings.messageTone}.wav`;

  const callSoundFile =
    soundSettings.ringtone === 'none' || soundSettings.ringtone === 'vibrate_only'
      ? undefined
      : `${soundSettings.ringtone}.wav`;

  // Borrar y recrear para que el nuevo sonido aplique
  await Notifications.deleteNotificationChannelAsync('egchat-messages').catch(() => {});
  await Notifications.deleteNotificationChannelAsync('egchat-calls').catch(() => {});

  await Notifications.setNotificationChannelAsync('egchat-messages', {
    name: 'Mensajes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: soundSettings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
    lightColor: '#00c8a0',
    sound: messageSoundFile,
    enableVibrate: soundSettings.vibrationEnabled,
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('egchat-calls', {
    name: 'Llamadas',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: soundSettings.vibrationEnabled ? [0, 500, 200, 500, 200, 500] : undefined,
    lightColor: '#facc15',
    sound: callSoundFile,
    enableVibrate: soundSettings.vibrationEnabled,
    showBadge: false,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// ── Solicitar permisos y registrar token FCM ────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!PUSH_ENABLED) return null;

  await createChannels();

  // Registrar background task para recibir llamadas con app suspendida (Android)
  if (Platform.OS === 'android') {
    try {
      const isRegistered = await TaskManager.getRegisteredTasksAsync()
        .then((tasks: TaskManager.RegisteredTask[]) => tasks.some((t: TaskManager.RegisteredTask) => t.taskName === BACKGROUND_TASK))
        .catch(() => false);
      if (!isRegistered) {
        await Notifications.registerTaskAsync(BACKGROUND_TASK).catch(() => {});
      }
    } catch { /* silencioso */ }
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // Notification permissions denied
    return null;
  }

  // Obtener token Expo Push (que internamente usa FCM en Android)
  // projectId debe ser el EAS Project ID (UUID de expo.dev/accounts/<user>/projects/<slug>)
  // Si no tienes EAS configurado, corre: npx eas init
  let expoPushToken: string | null = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.easConfig?.projectId
        ?? undefined,
    });
    expoPushToken = tokenData.data;
  } catch (e) {
    // Expo push token requires EAS registration. Falls back to native device token.
    // This covers Xcode direct builds (iOS) and non-EAS Android builds.
    try {
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      expoPushToken = nativeToken.data as string;
      console.log(`[Push] Usando token nativo (${Platform.OS}):`, String(expoPushToken).slice(-12));
    } catch (e2) {
      console.warn('[Push] No se pudo obtener token nativo:', e2);
    }
  }

  if (!expoPushToken) {
    console.warn('Sin token push — las notificaciones no funcionarán en background');
    return null;
  }

  await AsyncStorage.setItem('expoPushToken', expoPushToken);

  // Registrar en el servidor
  await syncTokenWithServer(expoPushToken);

  return expoPushToken;
}

// ── Enviar token al servidor ────────────────────────────────────────────────
export async function syncTokenWithServer(expoPushToken: string) {
  const authToken = await getToken();
  if (!authToken) return;

  // Detectar si es un token Expo (ExponentPushToken[...]) o un token nativo APNs/FCM
  const isExpoToken = expoPushToken.startsWith('ExponentPushToken');
  const tokenType = isExpoToken ? 'expo' : (Platform.OS === 'ios' ? 'apns' : 'fcm');

  try {
    const res = await fetch(`${API_BASE}/api/push/register-expo-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS, tokenType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    console.log('✅ Expo push token registrado en servidor', {
      platform: Platform.OS,
      tokenSuffix: expoPushToken.slice(-12),
    });
  } catch (e) {
    console.warn('No se pudo registrar token push:', e);
  }
}

// ── Escuchar notificaciones recibidas (app en primer plano) ─────────────────
export function setupNotificationListeners(
  onMessage: (chatId: string) => void,
  onCall: (callData: { callId: string; callerName: string; callerAvatar?: string; callType: string; offer?: object }) => void
) {
  // Notificación recibida con app abierta
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as any;
    if (data?.notificationType === 'incoming_call') {
      // NO llamar startRingtone() aquí en iOS — es redundante con el useEffect
      // de [callId].tsx (isIncoming) y crea el gap donde el sonido queda activo
      // si la pantalla no monta (llamada cancelada antes de navegar).
      onCall({
        callId: data.callId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar || '',
        callType: data.callType || 'audio',
        offer: data.offer,
      });
    } else if (data?.chatId) {
      // NO llamar playNotification() aquí — el canal de notificaciones
      // (egchat-messages en Android, APNs en iOS) ya reproduce el tono.
      // Llamarlo manualmente causaría doble sonido.
      if (Platform.OS === 'android') {
        // Mostrar notificación rica nativa cuando la app está en primer plano
        RichNotifications.show({
          chatId: data.chatId,
          senderName: data.senderName || notification.request.content.title || 'EGChat',
          senderAvatar: data.senderAvatar || '',
          messageText: notification.request.content.body || '',
          messageType: data.messageType || 'text',
          imageUrl: data.imageUrl || '',
        });
      }
      // iOS en primer plano: el handler ya tiene shouldPlaySound:true,
      // no necesitamos nada adicional aquí.
    }
  });

  // Usuario tocó la notificación
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    const action = response.actionIdentifier;

    if (data?.notificationType === 'incoming_call') {
      if (action === 'REJECT') return; // ignorar
      onCall({
        callId: data.callId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar || '',
        callType: data.callType || 'audio',
        offer: data.offer,
      });
    } else if (data?.chatId) {
      onMessage(data.chatId);
    } else if (data?.type === 'djangue_notification' && data?.groupId) {
      // D4 — Deep link a djangue desde notificación push
      onMessage(`__djangue__${data.groupId}`);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

// ── Limpiar badge ───────────────────────────────────────────────────────────
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// ── 4a Notificación local de reacción ──────────────────────────────────────
/**
 * Dispara una notificación local cuando alguien reacciona a un mensaje propio.
 * Se llama desde el evento SSE/Supabase de reacciones.
 */
export async function notifyReaction(params: {
  senderName: string;
  emoji: string;
  messagePreview?: string;
  chatId: string;
  chatName: string;
}) {
  try {
    const { senderName, emoji, messagePreview, chatId, chatName } = params;
    const body = messagePreview
      ? `"${messagePreview.slice(0, 40)}${messagePreview.length > 40 ? '…' : ''}"`
      : 'tu mensaje';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${senderName} reaccionó ${emoji}`,
        body: `En ${chatName}: ${body}`,
        data: { type: 'reaction', chatId },
        sound: 'notification.wav',
        badge: 1,
      },
      trigger: null, // inmediata
    });
  } catch { /* silencioso */ }
}

// ── Notificación de Moment nuevo ──────────────────────────────────────────
/**
 * Llama al servidor para que envíe push a todos los contactos del usuario
 * cuando publica un Moment nuevo.
 */
export async function notifyNewMoment(params: {
  momentId: string;
  authorName: string;
  preview?: string;   // texto del moment o descripción
}) {
  try {
    const authToken = await getToken();
    if (!authToken) return;
    await fetch(`${API_BASE}/api/moments/${params.momentId}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        authorName: params.authorName,
        preview: params.preview || 'Ha publicado un nuevo Moment',
      }),
    });
  } catch { /* silencioso */ }
}

// ── Notificación de Story/Estado nuevo ──────────────────────────────────────
/**
 * Llama al servidor para que envíe push a todos los contactos cuando se
 * publica un estado nuevo.
 */
export async function notifyNewStory(params: {
  storyId: string;
  authorName: string;
}) {
  try {
    const authToken = await getToken();
    if (!authToken) return;
    await fetch(`${API_BASE}/api/stories/${params.storyId}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ authorName: params.authorName }),
    });
  } catch { /* silencioso */ }
}

// ── Notificación de Live iniciado ────────────────────────────────────────────
/**
 * Llama al servidor para que envíe push urgente a todos los contactos cuando
 * el usuario inicia una transmisión en vivo.
 */
export async function notifyLiveStarted(params: {
  liveId: string;
  hostName: string;
}) {
  try {
    const authToken = await getToken();
    if (!authToken) return;
    await fetch(`${API_BASE}/api/live/${params.liveId}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ hostName: params.hostName }),
    });
  } catch { /* silencioso */ }
}

// ── Llamada pendiente guardada por el background task ───────────────────────
// Cuando la app estaba cerrada/suspendida en Android y llegó una llamada,
// el BGTask guarda los datos en AsyncStorage. Al abrir la app, _layout.tsx
// llama a consumePendingCall() para recuperar y navegar a la pantalla de llamada.
export interface PendingCall {
  callId: string;
  callerName: string;
  callerAvatar: string;
  callType: 'audio' | 'video';
  offer: object | null;
  timestamp: number;
}

const PENDING_CALL_KEY = 'egchat_pending_call';
const PENDING_CALL_TTL = 60 * 1000; // 60s — si es más antigua se ignora

export async function consumePendingCall(): Promise<PendingCall | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CALL_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(PENDING_CALL_KEY); // consumir una sola vez
    const data: PendingCall = JSON.parse(raw);
    // Ignorar si la llamada tiene más de 60s (el caller ya colgó)
    if (Date.now() - data.timestamp > PENDING_CALL_TTL) return null;
    return data;
  } catch {
    return null;
  }
}
