import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, VisibilityRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';

const VIS_OPTS = [
  { id: 'todos', label: 'Todos' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'nadie', label: 'Nadie' },
];

export default function PrivacidadScreen() {
  const [lastSeen, setLastSeen] = useState('todos');
  const [photoVis, setPhotoVis] = useState('todos');
  const [statusVis, setStatusVis] = useState('todos');

  useEffect(() => {
    getCfgString(CFG.lastSeen, 'todos').then(setLastSeen);
    getCfgString(CFG.photoVis, 'todos').then(setPhotoVis);
    getCfgString(CFG.statusVis, 'todos').then(setStatusVis);
  }, []);

  return (
    <SettingsLayout title="Mi información">
      <SettingsSection label="Visibilidad" />
      <SettingsCard>
        <VisibilityRow label="Última vez" value={lastSeen} options={VIS_OPTS} onChange={v => { setLastSeen(v); setCfg(CFG.lastSeen, v); }} />
        <SettingsDivider />
        <VisibilityRow label="Foto de perfil" value={photoVis} options={VIS_OPTS} onChange={v => { setPhotoVis(v); setCfg(CFG.photoVis, v); }} />
        <SettingsDivider />
        <VisibilityRow label="Estado / Historia" value={statusVis} options={VIS_OPTS} onChange={v => { setStatusVis(v); setCfg(CFG.statusVis, v); }} />
      </SettingsCard>

      <SettingsSection label="Contactos bloqueados" />
      <SettingsCard>
        <SettingsRow label="Bloqueados" value="0 contactos" onPress={() => Alert.alert('Bloqueados', 'Sin contactos bloqueados.')} />
      </SettingsCard>

      <SettingsSection label="Datos personales" />
      <SettingsCard>
        <SettingsRow label="Descargar mis datos" onPress={() => Alert.alert('Próximamente')} />
        <SettingsDivider />
        <SettingsRow label="Eliminar mi cuenta" danger onPress={() => Alert.alert('Eliminar cuenta', 'Contacta soporte para eliminar tu cuenta.')} />
      </SettingsCard>
    </SettingsLayout>
  );
}
