import React from 'react';
import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { registerForPushNotifications } from '../../src/notifications';
import { CFG, getCfgBool, getCfgString, setCfg, setCfgBool } from '../../src/services/settingsPrefs';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

export default function OtrasFuncionesScreen() {
  const [autoTranslate, setAutoTranslate] = React.useState(false);
  const [readReceipts, setReadReceipts] = React.useState(true);
  const [onlineStatus, setOnlineStatus] = React.useState(true);
  const [appLanguage, setAppLanguage] = React.useState('es');

  React.useEffect(() => {
    getCfgBool(CFG.autoTranslate, false).then(setAutoTranslate);
    getCfgBool(CFG.readReceipts, true).then(setReadReceipts);
    getCfgBool(CFG.onlineStatus, true).then(setOnlineStatus);
    getCfgString(CFG.appLanguage, 'es').then(setAppLanguage);
  }, []);

  const activatePush = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'denied') {
      Linking.openSettings();
      return;
    }
    const token = await registerForPushNotifications();
    if (token) Alert.alert('✅', 'Notificaciones push activadas');
    else Alert.alert('Permiso denegado', 'Actívalas en ajustes del sistema.');
  };

  const openLanguagePicker = () => {
    Alert.alert(
      'Idioma de la app',
      'Selecciona el idioma de la interfaz.',
      [
        ...LANGUAGE_OPTIONS.map(opt => ({
          text: opt.label,
          onPress: () => {
            setAppLanguage(opt.code);
            setCfg(CFG.appLanguage, opt.code);
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  const languageLabel = LANGUAGE_OPTIONS.find(opt => opt.code === appLanguage)?.label || 'Español';

  return (
    <SettingsLayout title="Otras funciones">

      <SettingsSection label="Herramientas" />
      <SettingsCard>
        <SettingsRow label="Escáner QR" value="Escanear" onPress={() => router.push('/_qr-scanner' as any)} />
        <SettingsDivider />
        <SettingsRow label="Compartir ubicación" value="Mapa" onPress={() => router.push('/map' as any)} />
        <SettingsDivider />
        <SettingsRow label="Login QR desde PC" value="Escanear" onPress={() => router.push('/_qr-scanner' as any)} />
        <SettingsDivider />
        <SettingsRow label="Activar notificaciones push" onPress={activatePush} />
        <SettingsDivider />
        <SettingsRow label="Idioma de la app" value={languageLabel} onPress={openLanguagePicker} />
      </SettingsCard>

      <SettingsSection label="Mensajes" />
      <SettingsCard>
        <SettingsToggleRow
          label="Confirmaciones de lectura"
          description="Mostrar cuando lees un mensaje"
          value={readReceipts}
          onValueChange={v => { setReadReceipts(v); setCfgBool(CFG.readReceipts, v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Estado en línea"
          description="Mostrar cuando estás conectado"
          value={onlineStatus}
          onValueChange={v => { setOnlineStatus(v); setCfgBool(CFG.onlineStatus, v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Traducción automática"
          description="Traduce mensajes al español"
          value={autoTranslate}
          onValueChange={v => { setAutoTranslate(v); setCfgBool(CFG.autoTranslate, v); }}
        />
      </SettingsCard>

      <SettingsSection label="IA y experimental" />
      <SettingsCard>
        <SettingsRow label="LIA-25 — Asistente IA" value="Abrir" onPress={() => router.push('/(tabs)/lia' as any)} />
        <SettingsDivider />
        <SettingsRow label="Mini-Apps" value="Ver tienda" onPress={() => router.push('/mini-apps' as any)} />
        <SettingsDivider />
        <SettingsRow
          label="Face Filters AR"
          value="En videollamada"
          onPress={() => router.push('/(tabs)/mensajeria' as any)}
        />
      </SettingsCard>

      <SettingsSection label="Privacidad avanzada" />
      <SettingsCard>
        <SettingsRow label="Modo incógnito" value="Chats" onPress={() => router.push('/ajustes/privacidad' as any)} />
        <SettingsDivider />
        <SettingsRow label="Mensajes efímeros" onPress={() => Alert.alert('Mensajes efímeros', 'Configura el tiempo de borrado automático en cada chat.')} />
        <SettingsDivider />
        <SettingsRow label="Cifrado E2E" value="Activo ✓" onPress={() => Alert.alert('Cifrado E2E', 'Todos tus mensajes están protegidos con cifrado de extremo a extremo.')} />
      </SettingsCard>

    </SettingsLayout>
  );
}
