import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { Colors } from '../../src/theme';
import { authAPI, getToken, getApiBase } from '../../src/api';
import { useLanguage } from '../../src/context/LanguageContext';
import { toast } from '../../src/components/Toast';
import {
  isBiometricAvailable, getBiometricType,
  isBiometricLoginEnabled, saveBiometricCredentials, disableBiometricLogin,
  authenticateWithBiometrics,
} from '../../src/biometrics';
import { SetupPINModal } from '../../src/components/wallet/SetupPINModal';
import { t as tr } from '../../src/translations';

export default function SeguridadCuentaScreen() {
  const { translate: t } = useLanguage();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);
  // Biometría
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(tr('setBiometrics'));
  // PIN
  const [showSetupPIN, setShowSetupPIN] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const base  = getApiBase();
        const res   = await fetch(`${base}/api/auth/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setActivity((await res.json()).slice(0, 3));
      } catch {}
      setLoading(false);
    };
    load();

    // Verificar disponibilidad y estado de biometría
    const loadBiometrics = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const [type, enabled] = await Promise.all([
          getBiometricType(),
          isBiometricLoginEnabled(),
        ]);
        setBiometricType(type);
        setBiometricEnabled(enabled);
      }
    };
    loadBiometrics();
  }, []);

  const changePassword = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) { Alert.alert(tr('error'), tr('setFillAllFields')); return; }
    if (newPwd !== confirmPwd) { Alert.alert(t('error'), t('setNewPasswordsNoMatch')); return; }
    if (newPwd.length < 6) { Alert.alert(tr('error'), 'La nueva contraseña debe tener al menos 6 caracteres'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const base  = getApiBase();
      const res   = await fetch(`${base}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(tr('xtContrasenaCambiada'));
        setShowChangePwd(false); setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        Alert.alert(tr('error'), data.message || 'No se pudo cambiar la contraseña');
      }
    } catch {
      Alert.alert(tr('error'), 'Sin conexión');
    }
    setSaving(false);
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      // Desactivar: pedir confirmación biométrica primero
      const ok = await authenticateWithBiometrics(tr('setConfirmDisableBiometrics'));
      if (!ok) { toast.error(tr('setAuthFailed')); return; }
      await disableBiometricLogin();
      setBiometricEnabled(false);
      toast.success(`✓ ${biometricType} desactivado`);
    } else {
      // Activar: necesitamos las credenciales para guardarlas
      Alert.alert(
        `Activar ${biometricType}`,
        `Para activar el inicio de sesión con ${biometricType}, ingresa tu contraseña actual para guardarla de forma segura en este dispositivo.`,
        [
          { text: tr('cancel'), style: 'cancel' },
          {
            text: 'Continuar',
            onPress: () => setShowChangePwd(true), // reusar el formulario para obtener contraseña
          },
        ],
      );
    }
  };

  const activateBiometricWithPassword = async (password: string) => {
    const ok = await authenticateWithBiometrics(`Activa ${biometricType} para EGCHAT`);
    if (!ok) { toast.error(tr('setBiometricAuthFailed')); return; }
    try {
      const me = await authAPI.me();
      if (me?.phone) {
        await saveBiometricCredentials(me.phone, password);
        setBiometricEnabled(true);
        toast.success(`✓ ${biometricType} activado`);
      }
    } catch { toast.error('No se pudo activar'); }
  };
  const TYPE_ICON: Record<string, string> = { login: '🔑', transaction: '💸', security: '🔒', profile: '👤', chat: '💬' };
  const TYPE_BG:   Record<string, string> = { login: '#d1fae5', transaction: '#dbeafe', security: '#fee2e2', profile: '#f3e8ff', chat: '#e0f2fe' };

  return (
    <>
    <SettingsLayout title={t('securityTitle')}>
      {/* Cambiar contraseña */}
      <SettingsSection label={t('passwordAccess')} />
      <SettingsCard>
        <SettingsRow
          label={t('changePassword')}
          onPress={() => setShowChangePwd(v => !v)}
        />
        {showChangePwd && (
          <View style={st.pwdForm}>
            <TextInput style={st.input} value={oldPwd} onChangeText={setOldPwd} placeholder={tr('xtContrasenaActual')} secureTextEntry placeholderTextColor="#94a3b8"/>
            <TextInput style={st.input} value={newPwd} onChangeText={setNewPwd} placeholder={tr('xtNuevaContrasena')} secureTextEntry placeholderTextColor="#94a3b8"/>
            <TextInput style={st.input} value={confirmPwd} onChangeText={setConfirmPwd} placeholder={tr('xtConfirmarNuevaContrasena')} secureTextEntry placeholderTextColor="#94a3b8"/>
            <TouchableOpacity style={st.saveBtn} onPress={changePassword} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff"/> : <Text style={st.saveTxt}>{tr('xtGuardarContrasena')}</Text>}
            </TouchableOpacity>
          </View>
        )}
        <SettingsDivider />
        <SettingsRow label={t('paymentPin')} onPress={() => setShowSetupPIN(true)} />
        <SettingsDivider />
        <SettingsRow label={t('transactionLimits')} onPress={() => router.push('/ajustes/security' as any)} />
        <SettingsDivider />
        {biometricAvailable ? (
          <SettingsToggleRow
            label={biometricType}
            description={biometricEnabled ? tr('setLoginEnabled') : tr('setTapToEnable')}
            value={biometricEnabled}
            onValueChange={toggleBiometric}
          />
        ) : (
          <SettingsRow label={tr('xtBiometria')} value="No disponible en este dispositivo" />
        )}
      </SettingsCard>

      {/* Sesiones */}
      <SettingsSection label={t('sessions')} />
      <SettingsCard>
        <SettingsRow label={t('activeSession')} value={t('thisDevice')} onPress={() => Alert.alert(t('sessions'), t('onlyOneSession'))} />
        <SettingsDivider />
        <SettingsRow label={t('qrLoginFromPC')} onPress={() => router.push('/_qr-scanner' as any)} />
      </SettingsCard>

      <SettingsSection label={t('recentActivity')} />
      <SettingsCard>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ padding: 20 }}/>
        ) : activity.length === 0 ? (
          <SettingsRow label={t('noActivityRegistered')}/>
        ) : (
          activity.map((log, i) => (
            <React.Fragment key={log.id}>
              <View style={st.actRow}>
                <View style={[st.actIcon, { backgroundColor: TYPE_BG[log.type] || '#f3f4f6' }]}>
                  <Text>{TYPE_ICON[log.type] || '•'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.actTitle}>{log.action}</Text>
                  <Text style={st.actDesc}>{log.description}</Text>
                  <Text style={st.actTime}>{new Date(log.timestamp).toLocaleString('es-ES')}</Text>
                </View>
              </View>
              {i < activity.length - 1 && <SettingsDivider/>}
            </React.Fragment>
          ))
        )}
        <SettingsDivider/>
        <SettingsRow label={t('viewFullHistory')} onPress={() => router.push('/ajustes/actividad' as any)}/>
      </SettingsCard>
    </SettingsLayout>
    <SetupPINModal
      visible={showSetupPIN}
      onDone={() => { setShowSetupPIN(false); toast.success(tr('xtPINDePagosConfigurado')); }}
      onCancel={() => setShowSetupPIN(false)}
    />
  </> );
}

const st = StyleSheet.create({
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  actIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 14, fontWeight: '500' },
  actDesc: { fontSize: 12, color: '#8e8e93', marginTop: 1 },
  actTime: { fontSize: 11, color: '#c7c7cc', marginTop: 2 },
  pwdForm: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
