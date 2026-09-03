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

// ── Modal genérico de contraseña ──────────────────────────────────
function PasswordModal({
  visible, title, description, buttonLabel, onConfirm, onClose,
}: {
  visible: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  onConfirm: (pwd: string) => void;
  onClose: () => void;
}) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const isBackup = buttonLabel.toLowerCase().includes('backup') || buttonLabel.toLowerCase().includes('guardar');

  const handleConfirm = () => {
    if (!pwd || pwd.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (isBackup && pwd !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
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
              placeholder="Contraseña de recuperación"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoFocus
            />
            {isBackup && (
              <TextInput
                style={st.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
            )}
            <View style={st.modalBtns}>
              <TouchableOpacity style={[st.modalBtn, st.modalBtnCancel]} onPress={onClose}>
                <Text style={st.modalBtnCancelTxt}>Cancelar</Text>
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
      'Exportar backup',
      'El backup se cifrará con la contraseña "egchat123". Puedes importarlo en otro dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: async () => {
            setExporting(true);
            const me = await authAPI.me().catch(() => null);
            const ok = await exportBackup(me?.id || 'user', 'egchat123');
            setExporting(false);
            // Backup exportado silenciosamente si es exitoso
            if (!ok) toast.error('No se pudo exportar el backup');
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
      Alert.alert('Error', result.error || 'No se pudo hacer el backup');
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
      Alert.alert('Error', result.error || 'No se pudo restaurar');
    }
  };

  const clearLocalMessages = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Borrar todos los mensajes almacenados localmente? Los mensajes del servidor se descargarán al abrir cada chat.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar', style: 'destructive',
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
    if (!d) return 'Nunca';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <SettingsLayout title="Historial de chat">

        {/* ── Backup de chats ─────────────────────────────── */}
        <SettingsSection label="Copia de seguridad de mensajes" />
        <SettingsCard>
          <SettingsRow
            label={exporting ? 'Exportando...' : 'Exportar backup de chats'}
            value=".egbackup"
            onPress={exporting ? undefined : handleExportChat}
          />
          <SettingsDivider />
          <SettingsToggleRow
            label="Solo con Wi-Fi"
            value={backupWifi}
            onValueChange={v => { setBackupWifi(v); setCfgBool(CFG.backupWifi, v); }}
          />
        </SettingsCard>

        {/* ── Backup de claves E2E (multi-dispositivo) ────── */}
        <SettingsSection label="Claves de cifrado E2E" />
        <View style={[st.e2eCard, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
          {/* Info status */}
          <View style={st.e2eStatus}>
            <View style={[st.e2eStatusDot, {
              backgroundColor: hasServerBackup ? '#22c55e' : '#f59e0b',
            }]} />
            <View style={{ flex: 1 }}>
              <Text style={[st.e2eStatusTitle, { color: C.textPrimary }]}>
                {hasServerBackup ? 'Claves respaldadas' : 'Sin backup en la nube'}
              </Text>
              <Text style={[st.e2eStatusSub, { color: C.textTertiary }]}>
                {hasServerBackup
                  ? `Último backup: ${fmtDate(lastE2EBackup)}`
                  : 'Si cambias de dispositivo perderás acceso a mensajes cifrados'}
              </Text>
            </View>
            {e2eLoading && <ActivityIndicator color={Colors.accent} size="small" />}
          </View>

          {/* Descripción */}
          <Text style={[st.e2eDesc, { color: C.textSecondary }]}>
            Tus claves se cifran con tu contraseña antes de subirse al servidor.
            EGChat nunca ve tu clave privada.
          </Text>

          {/* Botones */}
          <View style={st.e2eBtns}>
            <TouchableOpacity
              style={[st.e2eBtn, { borderColor: Colors.accent }]}
              onPress={() => setShowBackupModal(true)}
              disabled={e2eLoading}
            >
              <Text style={[st.e2eBtnTxt, { color: Colors.accent }]}>
                {hasServerBackup ? '🔄 Actualizar backup' : '☁️ Hacer backup'}
              </Text>
            </TouchableOpacity>

            {hasServerBackup && (
              <TouchableOpacity
                style={[st.e2eBtn, { borderColor: '#6b7280' }]}
                onPress={() => setShowRestoreModal(true)}
                disabled={e2eLoading}
              >
                <Text style={[st.e2eBtnTxt, { color: '#6b7280' }]}>
                  📲 Restaurar en este dispositivo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Gestión local ──────────────────────────────── */}
        <SettingsSection label="Gestión local" />
        <SettingsCard>
          <SettingsRow label="Limpiar caché de mensajes" onPress={clearLocalMessages} />
          <SettingsDivider />
          <SettingsRow
            label="Eliminar todos los chats"
            danger
            onPress={() =>
              Alert.alert(
                'Eliminar chats',
                '¿Eliminar todos los chats locales? Esta acción no se puede deshacer.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar', style: 'destructive',
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
        title="Hacer backup de claves E2E"
        description="Elige una contraseña de recuperación. La necesitarás si cambias de dispositivo. EGChat no la guarda."
        buttonLabel="Guardar backup"
        onConfirm={handleBackupE2EKey}
        onClose={() => setShowBackupModal(false)}
      />
      <PasswordModal
        visible={showRestoreModal}
        title="Restaurar claves E2E"
        description="Ingresa la contraseña que usaste al hacer el backup en tu dispositivo anterior."
        buttonLabel="Restaurar"
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
