/**
 * push-config.ts
 * Configuración de notificaciones push nativas via @capacitor/push-notifications (FCM).
 * Se usa en la app Android/iOS compilada con Capacitor.
 * Para la versión web (PWA) el push ya está gestionado en main.tsx via Service Worker.
 *
 * Uso:
 *   import { initPushNotifications } from './push-config';
 *   // Llamar tras login del usuario, cuando ya hay token disponible.
 *   await initPushNotifications();
 */

import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// ── Constantes ────────────────────────────────────────────────────────────────

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com';

// Clave de localStorage donde se guarda el token FCM para reutilizarlo
const FCM_TOKEN_KEY = 'egchat_fcm_token';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Obtiene el token de autenticación del usuario desde localStorage.
 * Prueba las distintas claves que usa el proyecto.
 */
function getAuthToken(): string {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('egchat_token') ||
    localStorage.getItem('egchat_token_backup') ||
    ''
  );
}

/**
 * Envía el token FCM al backend para que el servidor pueda enviar
 * notificaciones a este dispositivo específico.
 */
async function registerFcmTokenOnServer(fcmToken: string): Promise<void> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('[Push] No hay token de usuario — no se registra FCM en el servidor.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/push/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcm_token: fcmToken, platform: Capacitor.getPlatform() }),
    });

    if (response.ok) {
      console.log('[Push] Token FCM registrado en el servidor correctamente.');
      localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      localStorage.setItem('egchat_fcm_registered_at', Date.now().toString());
    } else {
      console.warn('[Push] El servidor rechazó el token FCM:', await response.text());
    }
  } catch (error) {
    console.warn('[Push] Error al registrar token FCM en el servidor:', error);
  }
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * initPushNotifications()
 *
 * Inicializa las notificaciones push nativas de Capacitor (FCM).
 * Debe llamarse después de que el usuario haya iniciado sesión.
 *
 * Flujo:
 *  1. Verifica que estamos en una plataforma nativa (Android / iOS).
 *  2. Solicita permiso al usuario (obligatorio en Android 13+ / iOS).
 *  3. Registra el dispositivo con FCM para obtener el token.
 *  4. Configura los listeners para todos los eventos de notificación.
 *
 * @returns Promise<void>
 */
export async function initPushNotifications(): Promise<void> {
  // ── Paso 1: Verificar plataforma ──────────────────────────────────────────
  // PushNotifications solo funciona en Android e iOS nativos.
  // En web usamos el Service Worker de main.tsx.
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Plataforma web detectada — usando Service Worker en lugar de FCM nativo.');
    return;
  }

  console.log(`[Push] Inicializando en plataforma: ${Capacitor.getPlatform()}`);

  // ── Paso 2: Solicitar permisos ────────────────────────────────────────────
  // En Android 13+ (API 33) y en iOS es obligatorio pedir permiso explícito.
  // checkPermissions() devuelve el estado actual sin mostrar diálogo.
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    // El usuario aún no ha decidido — mostrar el diálogo del sistema
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    // El usuario denegó el permiso — no podemos continuar
    console.warn('[Push] Permiso de notificaciones denegado por el usuario.');
    return;
  }

  console.log('[Push] Permiso concedido.');

  // ── Paso 3: Registrar listeners ANTES de llamar register() ───────────────
  // Es importante añadir los listeners antes de register() para no perder
  // el evento 'registration' si FCM responde muy rápido.

  // Listener: registro exitoso — FCM devuelve el token del dispositivo
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('[Push] Token FCM obtenido:', token.value);
    // Enviar el token al backend para poder enviar notificaciones a este dispositivo
    await registerFcmTokenOnServer(token.value);
    // Exponer el token globalmente por si otros módulos lo necesitan
    (window as any).__egchat_fcm_token = token.value;
  });

  // Listener: error en el registro — FCM no pudo generar el token
  PushNotifications.addListener('registrationError', (error: { error: string }) => {
    console.error('[Push] Error al registrar con FCM:', error.error);
    // Posibles causas: google-services.json incorrecto, sin conexión,
    // Google Play Services no disponible en el dispositivo.
  });

  // Listener: notificación recibida con la app en primer plano (foreground)
  // En este estado Android NO muestra la notificación automáticamente —
  // debemos decidir qué hacer nosotros (mostrar un banner in-app, etc.)
  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log('[Push] Notificación recibida en foreground:', notification);

      // Disparar un evento global para que App.tsx o cualquier componente
      // pueda reaccionar (mostrar badge, banner, actualizar chat, etc.)
      window.dispatchEvent(
        new CustomEvent('egchat-push-received', {
          detail: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
          },
        })
      );
    }
  );

  // Listener: el usuario tocó una notificación (app en background o cerrada)
  // Este es el evento más importante para la navegación — redirigir al chat,
  // pantalla de llamada, etc. según notification.actionId y notification.notification.data
  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.log('[Push] Acción realizada sobre notificación:', action);

      const data = action.notification?.data ?? {};
      const actionId = action.actionId; // 'tap' cuando el usuario toca la notificación

      // Disparar evento global para que el router de la app navegue al destino correcto
      window.dispatchEvent(
        new CustomEvent('egchat-push-action', {
          detail: { actionId, data, notification: action.notification },
        })
      );

      // Ejemplo de navegación directa si el proyecto usa window.location:
      // if (data.type === 'chat' && data.chat_id) {
      //   window.location.hash = `#/chat/${data.chat_id}`;
      // }
    }
  );

  // Listener: notificación eliminada sin ser tocada (solo Android)
  // Útil para limpiar badges o contadores locales
  PushNotifications.addListener(
    'pushNotificationDeleted' as any,
    (notification: PushNotificationSchema) => {
      console.log('[Push] Notificación descartada sin acción:', notification);
      window.dispatchEvent(
        new CustomEvent('egchat-push-deleted', { detail: notification })
      );
    }
  );

  // ── Paso 4: Registrar el dispositivo con FCM ──────────────────────────────
  // Esto dispara el evento 'registration' con el token cuando tiene éxito,
  // o 'registrationError' si algo falla.
  try {
    await PushNotifications.register();
    console.log('[Push] Solicitud de registro enviada a FCM.');
  } catch (error) {
    console.error('[Push] Error al llamar a PushNotifications.register():', error);
  }
}

// ── Función auxiliar: limpiar listeners ──────────────────────────────────────

/**
 * removePushListeners()
 * Elimina todos los listeners de push notifications.
 * Llamar al hacer logout para evitar memory leaks.
 */
export async function removePushListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
  console.log('[Push] Listeners eliminados.');
}

// ── Función auxiliar: obtener token guardado ──────────────────────────────────

/**
 * getSavedFcmToken()
 * Devuelve el último token FCM guardado en localStorage, si existe.
 * Útil para enviarlo al backend tras un login sin necesitar re-registrar.
 */
export function getSavedFcmToken(): string | null {
  return localStorage.getItem(FCM_TOKEN_KEY);
}
