import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { Colors } from '../../src/theme';

type ChatFontSize = 'small' | 'medium' | 'large';

export default function ChatSettingsScreen() {
  const [enterSend, setEnterSend] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [savePhotos, setSavePhotos] = useState(false);
  const [fontSz, setFontSz] = useState<ChatFontSize>('medium');

  useEffect(() => {
    getCfgBool(CFG.enterSend, false).then(setEnterSend);
    getCfgBool(CFG.readReceipts, true).then(setReadReceipts);
    getCfgBool(CFG.savePhotos, false).then(setSavePhotos);
    getCfgString(CFG.fontSizeChat, 'medium').then(v => setFontSz((v as ChatFontSize) || 'medium'));
  }, []);

  const labels: Record<ChatFontSize, string> = { small: 'Pequeña', medium: 'Normal', large: 'Grande' };

  return (
    <SettingsLayout title="Chat">
      <SettingsSection label="Comportamiento" />
      <SettingsCard>
        <SettingsToggleRow label="Enter para enviar" value={enterSend} onValueChange={v => { setEnterSend(v); setCfgBool(CFG.enterSend, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Confirmaciones de lectura (●●●)" value={readReceipts} onValueChange={v => { setReadReceipts(v); setCfgBool(CFG.readReceipts, v); }} />
        <SettingsDivider />
        <SettingsToggleRow label="Guardar fotos automáticamente" value={savePhotos} onValueChange={v => { setSavePhotos(v); setCfgBool(CFG.savePhotos, v); }} />
      </SettingsCard>

      <SettingsSection label="Tamaño de fuente en chats" />
      <SettingsCard>
        {(['small', 'medium', 'large'] as const).map((sz, i, arr) => (
          <React.Fragment key={sz}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 }}
              onPress={() => { setFontSz(sz); setCfg(CFG.fontSizeChat, sz); }}
            >
              <Text style={{ flex: 1, fontSize: 16 }}>{labels[sz]}</Text>
              {fontSz === sz && <Text style={{ color: Colors.accent, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
            {i < arr.length - 1 && <SettingsDivider />}
          </React.Fragment>
        ))}
      </SettingsCard>
    </SettingsLayout>
  );
}
