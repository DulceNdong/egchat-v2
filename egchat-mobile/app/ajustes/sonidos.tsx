import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
} from '../../src/components/settings/SettingsUI';
import {
  getSoundSettings, saveSoundSettings, SoundSettings,
  MESSAGE_TONES, RINGTONES, NOTIFICATION_TONES,
  previewMessageTone, previewNotificationTone, previewRingtone,
} from '../../src/hooks/useSounds';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

export default function SonidosScreen() {
  const [settings, setSettings] = useState<SoundSettings | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  useEffect(() => {
    getSoundSettings().then(setSettings);
  }, []);

  const update = useCallback(async (key: keyof SoundSettings, value: unknown) => {
    await saveSoundSettings({ [key]: value });
    setSettings(prev => prev ? { ...prev, [key]: value } as SoundSettings : prev);
  }, []);

  if (!settings) {
    return (
      <SettingsLayout title="Sonidos y notificaciones" scroll={false}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      </SettingsLayout>
    );
  }

  const toneSection = (
    title: string,
    list: typeof MESSAGE_TONES,
    key: 'messageTone' | 'ringtone' | 'notificationTone',
    color: string,
  ) => (
  <>
    <SettingsSection label={title} />
    <SettingsCard>
      {list.map((tone, i) => {
        const active = settings[key] === tone.id;
        return (
          <React.Fragment key={tone.id}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12,
                backgroundColor: active ? `${color}12` : 'transparent' }}
              onPress={async () => {
                await update(key, tone.id);
                if (tone.id === 'none') return;
                if (key === 'messageTone') await previewMessageTone();
                if (key === 'notificationTone') await previewNotificationTone();
                if (key === 'ringtone') await previewRingtone();
              }}
            >
              <Text style={{ flex: 1, fontWeight: active ? '700' : '500', color: active ? color : C.textPrimary }}>{tone.name}</Text>
              {active && <Text style={{ color }}>✓</Text>}
            </TouchableOpacity>
            {i < list.length - 1 && <SettingsDivider />}
          </React.Fragment>
        );
      })}
    </SettingsCard>
  </>
  );

  return (
    <SettingsLayout title="Sonidos y notificaciones">
      <SettingsSection label="Volumen general" />
      <View style={{ backgroundColor: isDark ? '#161b22' : '#fff', padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <TouchableOpacity
              key={v}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                borderColor: Math.abs(settings.volume - v) < 0.03 ? Colors.accent : '#e5e7eb',
                backgroundColor: Math.abs(settings.volume - v) < 0.03 ? 'rgba(7,193,96,0.1)' : '#f9fafb' }}
              onPress={() => update('volume', v)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600' }}>{Math.round(v * 100)}%</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, color: C.textPrimary }}>Vibración</Text>
          <Switch value={settings.vibrationEnabled} onValueChange={v => update('vibrationEnabled', v)} trackColor={{ false: '#d1d5db', true: Colors.accent }} thumbColor="#fff" />
        </View>
      </View>

      {toneSection('Tono de mensajes', MESSAGE_TONES, 'messageTone', '#22c55e')}
      {toneSection('Tono de llamada', RINGTONES, 'ringtone', '#3b82f6')}
      {toneSection('Tono de notificación', NOTIFICATION_TONES, 'notificationTone', '#a855f7')}
    </SettingsLayout>
  );
}
