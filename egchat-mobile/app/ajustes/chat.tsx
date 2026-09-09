import React, { useEffect, useState, useCallback } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { getToken, getApiBase } from '../../src/api';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';

type ChatFontSize = 'small' | 'medium' | 'large';

// ── Sincroniza la preferencia de confirmaciones de lectura con el backend ─────
async function syncReadReceiptsToBackend(enabled: boolean): Promise<void> {
  try {
    const token = await getToken();
    const base = getApiBase();
    await fetch(`${base}/api/auth/read-receipts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ read_receipts_enabled: enabled }),
    });
  } catch {
    // silencioso — la preferencia local ya se guardó
  }
}

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
