import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { getSoundSettings, saveSoundSettings, RINGTONES } from '../../src/hooks/useSounds';
import { Colors } from '../../src/theme';

export default function LlamadasScreen() {
  const [hdCall, setHdCall] = useState(true);
  const [saveData, setSaveData] = useState(false);
  const [muteUnknown, setMuteUnknown] = useState(false);
  const [ringtone, setRingtone] = useState('classic');

  useEffect(() => {
    getCfgBool(CFG.hdCall, true).then(setHdCall);
    getCfgBool(CFG.saveDataCall, false).then(setSaveData);
    getCfgBool(CFG.muteCallUnknown, false).then(setMuteUnknown);
    getSoundSettings().then(s => setRingtone(s.ringtone));
  }, []);

  return (
    <SettingsLayout title="Llamadas de voz y video">
      <SettingsSection label="Calidad" />
      <SettingsCard>
        <SettingsToggleRow label="Llamadas HD" value={hdCall} onValueChange={v => { setHdCall(v); setCfgBool(CFG.hdCall, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Reducir uso de datos" value={saveData} onValueChange={v => { setSaveData(v); setCfgBool(CFG.saveDataCall, v); }} />
      </SettingsCard>

      <SettingsSection label="Privacidad" />
      <SettingsCard>
        <SettingsToggleRow label="Silenciar llamadas de desconocidos" value={muteUnknown} onValueChange={v => { setMuteUnknown(v); setCfgBool(CFG.muteCallUnknown, v); }} />
      </SettingsCard>

      <SettingsSection label="Tono de llamada" />
      <SettingsCard>
        {RINGTONES.map((t, i) => (
          <React.Fragment key={t.id}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 }}
              onPress={() => { setRingtone(t.id); saveSoundSettings({ ringtone: t.id }); }}
            >
              <Text style={{ flex: 1, fontSize: 15 }}>{t.name}</Text>
              {ringtone === t.id && <Text style={{ color: Colors.accent }}>✓</Text>}
            </TouchableOpacity>
            {i < RINGTONES.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>
    </SettingsLayout>
  );
}
