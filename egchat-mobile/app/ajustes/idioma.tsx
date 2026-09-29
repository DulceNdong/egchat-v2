import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider,
} from '../../src/components/settings/SettingsUI';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors } from '../../src/theme';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸', native: 'Spanish' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', native: 'French' },
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'pt', label: 'Português', flag: '🇵🇹', native: 'Portuguese' },
];

export default function IdiomaScreen() {
  const { language, changeLanguage, translate: t } = useLanguage();

  const handleSelect = (code: string) => {
    changeLanguage(code);
    router.back();
  };

  return (
    <SettingsLayout title={t('language')}>
      <SettingsSection label={t('selectAppLanguage')} />
      <SettingsCard>
        {LANGUAGES.map((item, index) => {
          const isSelected = language === item.code;
          return (
            <React.Fragment key={item.code}>
              {index > 0 && <SettingsDivider />}
              <TouchableOpacity
                style={s.row}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.7}
              >
                <View style={s.left}>
                  <Text style={s.flag}>{item.flag}</Text>
                  <View>
                    <Text style={s.label}>{item.label}</Text>
                    <Text style={s.native}>{item.native}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={s.checkmark}>
                    <Text style={s.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </SettingsCard>
    </SettingsLayout>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  native: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
