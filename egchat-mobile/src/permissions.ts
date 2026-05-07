/**
 * permissions.ts — Solicitar y verificar todos los permisos de la app
 */
import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

export interface AppPermissions {
  notifications: PermissionStatus;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
}

/** Obtener el estado actual de todos los permisos sin solicitarlos */
export async function checkAllPermissions(): Promise<AppPermissions> {
  const [notif, cam, mic, loc] = await Promise.all([
    Notifications.getPermissionsAsync().then(r => r.status as PermissionStatus),
    Camera.getCameraPermissionsAsync().then(r => r.status as PermissionStatus),
    Audio.getPermissionsAsync().then(r => r.status as PermissionStatus),
    Location.getForegroundPermissionsAsync().then(r => r.status as PermissionStatus),
  ]);

  return {
    notifications: notif,
    camera: cam,
    microphone: mic,
    location: loc,
  };
}

/** Solicitar todos los permisos necesarios */
export async function requestAllPermissions(): Promise<AppPermissions> {
  // Notificaciones
  const { status: notifStatus } = await (async () => {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return existing;
    return Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
  })();

  // Cámara
  const { status: camStatus } = await (async () => {
    const existing = await Camera.getCameraPermissionsAsync();
    if (existing.status === 'granted') return existing;
    return Camera.requestCameraPermissionsAsync();
  })();

  // Micrófono
  const { status: micStatus } = await (async () => {
    const existing = await Audio.getPermissionsAsync();
    if (existing.status === 'granted') return existing;
    return Audio.requestPermissionsAsync();
  })();

  // Ubicación
  const { status: locStatus } = await (async () => {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status === 'granted') return existing;
    return Location.requestForegroundPermissionsAsync();
  })();

  const result: AppPermissions = {
    notifications: notifStatus as PermissionStatus,
    camera: camStatus as PermissionStatus,
    microphone: micStatus as PermissionStatus,
    location: locStatus as PermissionStatus,
  };

  // Si alguno fue denegado permanentemente, ofrecer ir a ajustes del sistema
  const denied = Object.entries(result).filter(([, v]) => v === 'denied');
  if (denied.length > 0) {
    const names = denied.map(([k]) => ({
      notifications: 'Notificaciones',
      camera: 'Cámara',
      microphone: 'Micrófono',
      location: 'Ubicación',
    }[k] || k)).join(', ');

    Alert.alert(
      'Permisos denegados',
      `Los siguientes permisos fueron denegados: ${names}.\n\nPuedes activarlos manualmente en Ajustes del sistema.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
      ]
    );
  }

  return result;
}

/** Emoji de estado para mostrar en UI */
export function permissionEmoji(status: PermissionStatus): string {
  switch (status) {
    case 'granted':      return '✅';
    case 'denied':       return '❌';
    case 'undetermined': return '⏳';
    case 'checking':     return '🔄';
    default:             return '❓';
  }
}

/** Texto legible del estado */
export function permissionLabel(status: PermissionStatus): string {
  switch (status) {
    case 'granted':      return 'Activado';
    case 'denied':       return 'Denegado';
    case 'undetermined': return 'Sin configurar';
    case 'checking':     return 'Verificando...';
    default:             return 'Desconocido';
  }
}
