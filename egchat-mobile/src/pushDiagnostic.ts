/**
 * pushDiagnostic.ts — Diagnóstico de notificaciones push
 * Llama a runPushDiagnostic() desde ajustes para ver qué falla
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase, getToken } from './api';
import { t as tr } from './translations';

export async function runPushDiagnostic(): Promise<string> {
  const lines: string[] = [];

  lines.push(`📱 Plataforma: ${Platform.OS} ${Platform.Version}`);
  lines.push(`📦 App: ${Constants.expoConfig?.name} v${Constants.expoConfig?.version}`);

  // 1. Verificar permisos
  const { status } = await Notifications.getPermissionsAsync();
  lines.push(`🔔 Permisos: ${status}`);

  if (status !== 'granted') {
    lines.push(tr('xtPROBLEMAPermisosDenegadosVeAAjustesAppsEGCHATNotif'));
    const result = lines.join('\n');
    Alert.alert(tr('xtDiagnosticoPush2'), result);
    return result;
  }

  // 2. Verificar projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  lines.push(`🆔 EAS Project ID: ${projectId ?? '❌ NO CONFIGURADO'}`);

  // 3. Intentar obtener token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    const token = tokenData.data;
    lines.push(`✅ Expo Push Token: ${token.substring(0, 35)}...`);
    await AsyncStorage.setItem('expoPushToken', token);

    // 4. Verificar si está registrado en el servidor
    const authToken = await getToken();
    if (!authToken) {
      lines.push(tr('xtNoHaySesionActivaTokenNoEnviadoAlServidor'));
    } else {
      try {
        const res = await fetch(`${getApiBase()}/api/push/register-expo-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ expoPushToken: token, platform: Platform.OS }),
        });
        const data = await res.json();
        lines.push(`🌐 Servidor: ${res.ok ? '✅ Token registrado' : '❌ ' + data.message}`);
      } catch (e: any) {
        lines.push(`🌐 Servidor: ❌ Error de red — ${e.message}`);
      }
    }
  } catch (e: any) {
    lines.push(`❌ Error obteniendo token: ${e.message}`);
    if (e.message?.includes('projectId')) {
      lines.push(tr('xtSolucionCorreNpxEasInitEnEgchatMobileYActualizaApp'));
    }
    if (e.message?.includes('google-services')) {
      lines.push(tr('xtSolucionDescargaGoogleServicesJsonDeFirebaseConsol'));
    }
  }

  // 5. Verificar canales Android
  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    const channelNames = channels.map(c => c.id).join(', ');
    lines.push(`📢 Canales Android: ${channelNames || 'ninguno'}`);
    const hasCallChannel = channels.some(c => c.id === 'egchat-calls-v2');
    lines.push(`📞 Canal llamadas: ${hasCallChannel ? '✅' : '❌ falta egchat-calls-v2'}`);
  }

  // 6. Verificar el token VoIP (PushKit) — sin él, iOS solo muestra un banner
  //    y la ventana de llamada entrante no aparece con el teléfono bloqueado.
  if (Platform.OS === 'ios') {
    try {
      const { PushKit } = await import('./native/PushKit');
      const voipToken = await PushKit.getCurrentVoIPToken();
      if (!voipToken) {
        lines.push(tr('xtTokenVoIPNoGeneradoPushKitNoRegistraEnEsteIPhone'));
      } else {
        lines.push(`📞 Token VoIP: ✅ …${voipToken.slice(-8)}`);
        const authToken = await getToken();
        if (authToken) {
          try {
            const res = await fetch(`${getApiBase()}/api/push/register-voip-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
              body: JSON.stringify({ voipToken }),
            });
            lines.push(`🌐 Servidor (VoIP): ${res.ok ? '✅ registrado' : `❌ ${res.status}`}`);
          } catch (e: any) {
            lines.push(`🌐 Servidor (VoIP): ❌ ${e.message}`);
          }
        }
      }
    } catch (e: any) {
      lines.push(`📞 Token VoIP: ❌ ${e?.message || tr('xtModuloNoDisponible')}`);
    }
  }


  const result = lines.join('\n');
  Alert.alert(tr('xtDiagnosticoPush2'), result, [{ text: 'OK' }]);
  console.log('=== PUSH DIAGNOSTIC ===\n' + result);
  return result;
}
