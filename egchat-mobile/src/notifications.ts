/**
 * notifications.ts — Notificaciones nativas con expo-notifications
 * Funciona con el teléfono hibernado gracias a FCM (Firebase Cloud Messaging)
 * NOTA: Push desactivado temporalmente (sin Apple Developer Program)
 */
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './api';
import { RichNotifications } from './native/RichNotifications';
import { playNotification, startRingtone } from './hooks/useSounds';

const API_BASE = (
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_API_URL
    : (process.env.EXPO_PUBLIC_API_URL_MOBILE || process.env.EXPO_PUBLIC_API_URL)
) || 'https://egchat-api.onrender.com';

const PUSH_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PUSH === '1';
const BACKGROUND_TASK = 'EGCHAT_BACKGROUND_NOTIFICATION';

// ── Configurar cómo se muestran las notificaciones en primer plano ──────────
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as any;
    return {
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Llamadas: prioridad máxima y no se auto-descartan
      priority: data?.notificationType === 'incoming_call'
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// ── Tarea en segundo plano para notificaciones recibidas con app cerrada ────
TaskManager.defineTask(BACKGROUND_TASK, async ({ data, error }) => {
  if (error) return; // Background notification error
  // Notification received in background
});

// ── Crear canales Android ───────────────────────────────────────────────────
async function createChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('egchat-messages', {
    name: 'Mensajes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00c8a0',
    sound: 'notification.wav',
    enableVibrate: true,
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('egchat-calls', {
    name: 'Llamadas',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: '#facc15',
    sound: 'notification.wav',
    enableVibrate: true,
    showBadge: false,
    // Permite mostrar sobre otras apps (pantalla bloqueada)
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// ── Solicitar permisos y registrar token FCM ────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // push no disponible en web
  if (!PUSH_ENABLED) return null;         // push desactivado por configuración

  await createChannels();

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
    // Could not get Expo Push Token
    // Try FCM native token (Android only)
    if (Platform.OS === 'android') {
      try {
        const nativeToken = await Notifications.getDevicePushTokenAsync();
        expoPushToken = nativeToken.data as string;
      } catch (e2) {
        // Could not get FCM native token
      }
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

  try {
    const res = await fetch(`${API_BASE}/api/push/register-expo-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
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
  onCall: (callData: { callId: string; callerName: string; callType: string; offer?: object }) => void
) {
  // Notificación recibida con app abierta
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as any;
    if (data?.notificationType === 'incoming_call') {
      if (Platform.OS === 'ios') {
        startRingtone().catch(() => {});
      }
      onCall({
        callId: data.callId,
        callerName: data.callerName,
        callType: data.callType || 'audio',
        offer: data.offer,
      });
    } else if (data?.chatId) {
      if (Platform.OS === 'ios') {
        playNotification().catch(() => {});
      }
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
        callType: data.callType || 'audio',
        offer: data.offer,
      });
    } else if (data?.chatId) {
      onMessage(data.chatId);
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
