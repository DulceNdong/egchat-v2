import React from 'react';
import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { registerForPushNotifications } from '../../src/notifications';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { useLanguage } from '../../src/context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

export default function OtrasFuncionesScreen() {
  const [autoTranslate, setAutoTranslate] = React.useState(false);
  const [readReceipts, setReadReceipts] = React.useState(true);
  const [onlineStatus, setOnlineStatus] = React.useState(true);

  // Idioma desde el contexto reactivo — ya persistido y sincronizado globalmente
  const { language: appLanguage, changeLanguage, translate: t } = useLanguage();

  React.useEffect(() => {
    getCfgBool(CFG.autoTranslate, false).then(setAutoTranslate);
    getCfgBool(CFG.readReceipts, true).then(setReadReceipts);
    getCfgBool(CFG.onlineStatus, true).then(setOnlineStatus);
  }, []);

  const activatePush = async () => {
    const { status } = await Notifications.getPermissionsAsync();

    // Permisos denegados explícitamente → llevar directo a Ajustes del sistema
    if (status === 'denied') {
      Alert.alert(
        t('setPushDisabledTitle'),
        t('setPushDisabledBody'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('setOpenSettings'), onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    // Permiso no solicitado aún o ya concedido → intentar registrar token
    const token = await registerForPushNotifications();
    if (token) {
      Alert.alert(`✅ ${t('setPushEnabledTitle')}`, t('setPushEnabledBody'));
    } else {
      // El usuario rechazó el diálogo del sistema en este intento
      Alert.alert(
        t('setPermissionDenied'),
        t('setPermissionDeniedBody'),
        [
          { text: t('setNotNow'), style: 'cancel' },
          { text: t('setOpenSettings'), onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const openLanguagePicker = () => {
    Alert.alert(
      t('appLanguage'),
      t('selectAppLanguage'),
      [
        ...LANGUAGE_OPTIONS.map(opt => ({
          text: opt.label,
          // Usar changeLanguage del contexto: actualiza estado global + AsyncStorage + translations.ts
          onPress: () => changeLanguage(opt.code),
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ],
    );
  };

  const languageLabel = LANGUAGE_OPTIONS.find(opt => opt.code === appLanguage)?.label || 'Español';

  return (
    <SettingsLayout title={t('otherFeatures')}>

      <SettingsSection label={t('setTools')} />
      <SettingsCard>
        <SettingsRow label={t('setQrScanner')} value={t('setScan')} onPress={() => router.push('/_qr-scanner' as any)} />
        <SettingsDivider />
        <SettingsRow label={t('setShareLocation')} value={t('map')} onPress={() => router.push('/map' as any)} />
        <SettingsDivider />
        <SettingsRow label={t('qrLoginFromPC')} value={t('setScan')} onPress={() => router.push('/_qr-scanner' as any)} />
        <SettingsDivider />
        <SettingsRow label={t('setActivatePush')} onPress={activatePush} />
        <SettingsDivider />
        <SettingsRow label={t('appLanguage')} value={languageLabel} onPress={openLanguagePicker} />
      </SettingsCard>

      <SettingsSection label={t('messages')} />
      <SettingsCard>
        <SettingsToggleRow
          label={t('readReceipts')}
          description={t('setReadReceiptsSub')}
          value={readReceipts}
          onValueChange={v => { setReadReceipts(v); setCfgBool(CFG.readReceipts, v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label={t('setOnlineStatus')}
          description={t('setOnlineStatusSub')}
          value={onlineStatus}
          onValueChange={v => { setOnlineStatus(v); setCfgBool(CFG.onlineStatus, v); }}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label={t('setAutoTranslate')}
          description={t('setAutoTranslateSub')}
          value={autoTranslate}
          onValueChange={v => { setAutoTranslate(v); setCfgBool(CFG.autoTranslate, v); }}
        />
      </SettingsCard>

      <SettingsSection label={t('setAiExperimental')} />
      <SettingsCard>
        <SettingsRow label={t('setLiaAssistant')} value={t('open')} onPress={() => router.push('/(tabs)/lia' as any)} />
        <SettingsDivider />
        <SettingsRow label={t('miniApps')} value={t('setViewStore')} onPress={() => router.push('/mini-apps' as any)} />
        <SettingsDivider />
        <SettingsRow
          label={t('setFaceFilters')}
          value={t('setInVideoCall')}
          onPress={() => router.push('/(tabs)/mensajeria' as any)}
        />
      </SettingsCard>

      <SettingsSection label={t('setAdvancedPrivacy')} />
      <SettingsCard>
        <SettingsRow label={t('incognitoMode')} value={t('setChats')} onPress={() => router.push('/ajustes/privacidad' as any)} />
        <SettingsDivider />
        <SettingsRow label={t('setEphemeralMessages')} onPress={() => Alert.alert(t('setEphemeralMessages'), t('setEphemeralMessagesBody'))} />
        <SettingsDivider />
        <SettingsRow label={t('e2eEncryption')} value={`${t('active')} ✓`} onPress={() => Alert.alert(t('e2eEncryption'), t('setE2eBody'))} />
      </SettingsCard>

    </SettingsLayout>
  );
}
