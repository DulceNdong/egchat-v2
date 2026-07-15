import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { exportBackup, importBackup } from '../../src/services/chatBackup';
import { authAPI } from '../../src/api';
import { toast } from '../../src/components/Toast';
import { router } from 'expo-router';

export default function HistorialChatScreen() {
  const [backupWifi, setBackupWifi] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getCfgBool(CFG.backupWifi, true).then(setBackupWifi);
  }, []);

  const handleExport = async () => {
    Alert.prompt
      ? Alert.prompt('Exportar backup', 'Crea una contraseña para proteger el backup:', async (pwd) => {
          if (!pwd) return;
          setExporting(true);
          const me = await authAPI.me().catch(() => null);
          const ok = await exportBackup(me?.id || 'user', pwd);
          setExporting(false);
          if (!ok) toast.error('Error', 'No se pudo exportar el backup');
        })
      : Alert.alert('Exportar backup', 'El backup se guardará con contraseña "egchat123" por defecto en este dispositivo.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Exportar', onPress: async () => {
            setExporting(true);
            const me = await authAPI.me().catch(() => null);
            const ok = await exportBackup(me?.id || 'user', 'egchat123');
            setExporting(false);
            if (ok) toast.success('✓ Backup exportado');
            else toast.error('Error', 'No se pudo exportar');
          }},
        ]);
  };

  const handleImport = async () => {
    Alert.alert('Importar backup', 'La importación de backup está disponible solo en la app nativa (Android/iOS). Instala la app desde la tienda para usar esta función.');
  };

  const clearLocalMessages = () => {
    Alert.alert('Limpiar caché', '¿Borrar todos los mensajes almacenados localmente? Los mensajes del servidor se descargarán al abrir cada chat.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: async () => {
        const keys = await AsyncStorage.getAllKeys();
        const chatKeys = keys.filter(k => k.startsWith('chat_messages_'));
        await AsyncStorage.multiRemove(chatKeys);
        toast.success(`✓ ${chatKeys.length} chats limpiados`);
      }},
    ]);
  };

  return (
    <SettingsLayout title="Historial de chat">
      <SettingsSection label="Copia de seguridad cifrada" />
      <SettingsCard>
        <SettingsRow
          label={exporting ? 'Exportando...' : 'Exportar backup (.egbackup)'}
          onPress={exporting ? undefined : handleExport}
        />
        <SettingsDivider />
        <SettingsRow
          label={importing ? 'Importando...' : 'Importar backup'}
          onPress={importing ? undefined : handleImport}
        />
        <SettingsDivider />
        <SettingsToggleRow
          label="Solo con Wi-Fi"
          value={backupWifi}
          onValueChange={v => { setBackupWifi(v); setCfgBool(CFG.backupWifi, v); }}
        />
      </SettingsCard>

      <SettingsSection label="Gestión local" />
      <SettingsCard>
        <SettingsRow
          label="Limpiar caché de mensajes"
          onPress={clearLocalMessages}
        />
        <SettingsDivider />
        <SettingsRow
          label="Eliminar todos los chats"
          danger
          onPress={() => Alert.alert('Eliminar chats', '¿Eliminar todos los chats locales? Esta acción no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: async () => {
              const keys = await AsyncStorage.getAllKeys();
              const toRemove = keys.filter(k => k.startsWith('chat_') || k.startsWith('egchat_starred') || k.startsWith('egchat_pinned'));
              await AsyncStorage.multiRemove(toRemove);
              toast.success('✓ Chats locales eliminados');
            }},
          ])}
        />
      </SettingsCard>
    </SettingsLayout>
  );
}
