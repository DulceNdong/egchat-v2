import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';

export default function HistorialChatScreen() {
  const [backupWifi, setBackupWifi] = useState(true);

  useEffect(() => {
    getCfgBool(CFG.backupWifi, true).then(setBackupWifi);
  }, []);

  return (
    <SettingsLayout title="Historial de chat">
      <SettingsSection label="Copia de seguridad" />
      <SettingsCard>
        <SettingsRow label="Copia en la nube" value="Automática" onPress={() => Alert.alert('Próximamente', 'La copia en la nube estará disponible pronto.')} />
        <SettingsDivider />
        <SettingsRow label="Frecuencia" value="Diaria" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsToggleRow label="Solo con Wi-Fi" value={backupWifi} onValueChange={v => { setBackupWifi(v); setCfgBool(CFG.backupWifi, v); }} />
      </SettingsCard>

      <SettingsSection label="Acciones" />
      <SettingsCard>
        <SettingsRow label="Exportar chat" onPress={() => Alert.alert('Exportar', 'Selecciona un chat para exportarlo.')} />
        <SettingsDivider />
        <SettingsRow label="Borrar mensajes eliminados" onPress={() => Alert.alert('✓', 'Mensajes eliminados limpiados.')} />
        <SettingsDivider />
        <SettingsRow
          label="Eliminar todos los chats"
          danger
          onPress={() => Alert.alert('Eliminar chats', '¿Eliminar todos los chats locales?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => Alert.alert('✓', 'Chats locales eliminados') },
          ])}
        />
      </SettingsCard>
    </SettingsLayout>
  );
}
