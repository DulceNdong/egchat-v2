import React, { useEffect, useState } from 'react';
import {
  Alert, ActivityIndicator, Platform, View, Text,
  TextInput, TouchableOpacity, StyleSheet, Modal, Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgBool, setCfgBool } from '../../src/services/settingsPrefs';
import { exportBackup } from '../../src/services/chatBackup';
import { authAPI } from '../../src/api';
import { toast } from '../../src/components/Toast';
import {
  backupE2EKey, restoreE2EKey,
  getLastE2EBackupDate, hasE2EBackupOnServer,
  loadOrGenerateKeyPair,
} from '../../src/services/e2e';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { useLanguage } from '../../src/context/LanguageContext';

// ── Modal genérico de contraseña ──────────────────────────────────
function PasswordModal({
  visible, title, description, buttonLabel, onConfirm, onClose, confirmField = false,
}: {
  visible: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  onConfirm: (pwd: string) => void;
  onClose: () => void;
  confirmField?: boolean;
}) {
  const { translate: t } = useLanguage();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const isBackup = confirmField;

  const handleConfirm = () => {
    if (!pwd || pwd.length < 6) {
      Alert.alert(t('error'), t('setPasswordMin6'));
      return;
    }
    if (isBackup && pwd !== confirm) {
      Alert.alert(t('error'), t('setPasswordsDontMatch'));
      return;
    }
    onConfirm(pwd);
    setPwd('');
    setConfirm('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={st.overlay} onPress={onClose}>
          <Pressable style={st.sheet} onPress={() => {}}>
            <Text style={st.modalTitle}>{title}</Text>
            <Text style={st.modalDesc}>{description}</Text>
            <TextInput
              style={st.input}
              value={pwd}
              onChangeText={setPwd}
              placeholder={t('setRecoveryPassword')}
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoFocus
            />
            {isBackup && (
              <TextInput
                style={st.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder={t('confirmPassword')}
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            )}
            <View style={st.modalBtns}>
              <TouchableOpacity style={[st.modalBtn, st.modalBtnCancel]} onPress={onClose}>
                <Text style={st.modalBtnCancelTxt}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.modalBtn, st.modalBtnConfirm]} onPress={handleConfirm}>
                <Text style={st.modalBtnConfirmTxt}>{buttonLabel}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────
export default function HistorialChatScreen() {
  const [backupWifi, setBackupWifi] = useState(true);
  const [exporting, setExporting]   = useState(false);

  // E2E key backup state
  const [lastE2EBackup, setLastE2EBackup]     = useState<Date | null>(null);
  const [hasServerBackup, setHasServerBackup] = useState(false);
  const [e2eLoading, setE2ELoading]           = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const { translate: t } = useLanguage();

  useEffect(() => {
    getCfgBool(CFG.backupWifi, true).then(setBackupWifi);
    loadE2EStatus();
  }, []);

  const loadE2EStatus = async () => {
    const [lastDate, serverHas] = await Promise.all([
      getLastE2EBackupDate(),
      hasE2EBackupOnServer(),
    ]);
    setLastE2EBackup(lastDate);
    setHasServerBackup(serverHas);
  };

  const handleExportChat = async () => {
    Alert.alert(
      t('setExportBackup'),
      t('setExportBackupBody'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('setExport'),
          onPress: async () => {
            setExporting(true);
            const me = await authAPI.me().catch(() => null);
            const ok = await exportBackup(me?.id || 'user', 'egchat123');
            setExporting(false);
            // Backup exportado silenciosamente si es exitoso
            if (!ok) toast.error(t('setExportFailed'));
          },
        },
      ],
    );
  };

  const handleBackupE2EKey = async (password: string) => {
    setShowBackupModal(false);
    setE2ELoading(true);
    // Asegurarse de que hay claves generadas
    await loadOrGenerateKeyPair();
    const result = await backupE2EKey(password);
    setE2ELoading(false);
    if (result.ok) {
      // Claves respaldadas silenciosamente
      await loadE2EStatus();
    } else {
      Alert.alert(t('error'), result.error || t('setBackupError'));
    }
  };

  const handleRestoreE2EKey = async (password: string) => {
    setShowRestoreModal(false);
    setE2ELoading(true);
    const result = await restoreE2EKey(password);
    setE2ELoading(false);
    if (result.ok) {
      // Claves restauradas silenciosamente
      await loadE2EStatus();
    } else {
      Alert.alert(t('error'), result.error || t('setRestoreFailed'));
    }
  };

  const clearLocalMessages = () => {
    Alert.alert(
      t('clearCache'),
      t('setClearLocalMessagesConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('setClean'), style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const chatKeys = keys.filter(k => k.startsWith('chat_messages_'));
            await AsyncStorage.multiRemove(chatKeys);
            // Chats limpiados silenciosamente
          },
        },
      ],
    );
  };

  const fmtDate = (d: Date | null) => {
    if (!d) return t('setNever');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <SettingsLayout title={t('setChatHistoryTitle')}>

        {/* ── Backup de chats ─────────────────────────────── */}
        <SettingsSection label={t('setMessagesBackup')} />
        <SettingsCard>
          <SettingsRow
            label={exporting ? t('setExporting') : t('setExportChats')}
            value=".egbackup"
            onPress={exporting ? undefined : handleExportChat}
          />
          <SettingsDivider />
          <SettingsToggleRow
            label={t('wifiOnly')}
            value={backupWifi}
            onValueChange={v => { setBackupWifi(v); setCfgBool(CFG.backupWifi, v); }}
          />
        </SettingsCard>

        {/* ── Backup de claves E2E (multi-dispositivo) ────── */}
        <SettingsSection label={t('setE2eKeys')} />
        <View style={[st.e2eCard, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
          {/* Info status */}
          <View style={st.e2eStatus}>
            <View style={[st.e2eStatusDot, {
              backgroundColor: hasServerBackup ? '#22c55e' : '#f59e0b',
            }]} />
            <View style={{ flex: 1 }}>
              <Text style={[st.e2eStatusTitle, { color: C.textPrimary }]}>
                {hasServerBackup ? t('setKeysBackedUp') : t('setNoCloudBackup')}
              </Text>
              <Text style={[st.e2eStatusSub, { color: C.textTertiary }]}>
                {hasServerBackup
                  ? `${t('setLastBackup')}: ${fmtDate(lastE2EBackup)}`
                  : t('setLostKeysWarning')}
              </Text>
            </View>
            {e2eLoading && <ActivityIndicator color={Colors.accent} size="small" />}
          </View>

          {/* Descripción */}
          <Text style={[st.e2eDesc, { color: C.textSecondary }]}>
            {t('setE2eDesc')}
          </Text>

          {/* Botones */}
          <View style={st.e2eBtns}>
            <TouchableOpacity
              style={[st.e2eBtn, { borderColor: Colors.accent }]}
              onPress={() => setShowBackupModal(true)}
              disabled={e2eLoading}
            >
              <Text style={[st.e2eBtnTxt, { color: Colors.accent }]}>
                {hasServerBackup ? `🔄 ${t('setUpdateBackup')}` : `☁️ ${t('setMakeBackup')}`}
              </Text>
            </TouchableOpacity>

            {hasServerBackup && (
              <TouchableOpacity
                style={[st.e2eBtn, { borderColor: '#6b7280' }]}
                onPress={() => setShowRestoreModal(true)}
                disabled={e2eLoading}
              >
                <Text style={[st.e2eBtnTxt, { color: '#6b7280' }]}>
                  📲 {t('setRestoreOnDevice')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Gestión local ──────────────────────────────── */}
        <SettingsSection label={t('management')} />
        <SettingsCard>
          <SettingsRow label={t('setClearMessagesCache')} onPress={clearLocalMessages} />
          <SettingsDivider />
          <SettingsRow
            label={t('setDeleteAllChats')}
            danger
            onPress={() =>
              Alert.alert(
                t('setDeleteChats'),
                t('setDeleteAllChatsConfirm'),
                [
                  { text: t('cancel'), style: 'cancel' },
                  {
                    text: t('delete'), style: 'destructive',
                    onPress: async () => {
                      const keys = await AsyncStorage.getAllKeys();
                      const toRemove = keys.filter(k =>
                        k.startsWith('chat_') ||
                        k.startsWith('egchat_starred') ||
                        k.startsWith('egchat_pinned'),
                      );
                      await AsyncStorage.multiRemove(toRemove);
                      // Chats locales eliminados silenciosamente
                    },
                  },
                ],
              )
            }
          />
        </SettingsCard>
      </SettingsLayout>

      {/* Modales de contraseña */}
      <PasswordModal
        visible={showBackupModal}
        title={t('setBackupKeysTitle')}
        description={t('setBackupKeysDesc')}
        buttonLabel={t('setSaveBackup')}
        confirmField
        onConfirm={handleBackupE2EKey}
        onClose={() => setShowBackupModal(false)}
      />
      <PasswordModal
        visible={showRestoreModal}
        title={t('setRestoreKeysTitle')}
        description={t('setRestoreKeysDesc')}
        buttonLabel={t('msgRestore')}
        onConfirm={handleRestoreE2EKey}
        onClose={() => setShowRestoreModal(false)}
      />
    </>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: '#6b7280', marginBottom: 14, textAlign: 'center', lineHeight: 18 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
    color: '#111827', marginBottom: 10,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f3f4f6' },
  modalBtnCancelTxt: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalBtnConfirm: { backgroundColor: Colors.accent },
  modalBtnConfirmTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // E2E card
  e2eCard: {
    marginHorizontal: 16, borderRadius: 12, padding: 14,
    marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  e2eStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  e2eStatusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  e2eStatusTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  e2eStatusSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  e2eDesc: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  e2eBtns: { gap: 8 },
  e2eBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  e2eBtnTxt: { fontSize: 14, fontWeight: '600' },
});
