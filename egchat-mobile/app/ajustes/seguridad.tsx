import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, SettingsToggleRow,
} from '../../src/components/settings/SettingsUI';
import { Colors } from '../../src/theme';
import { authAPI, getToken, getApiBase } from '../../src/api';
import { toast } from '../../src/components/Toast';
import {
  isBiometricAvailable, getBiometricType,
  isBiometricLoginEnabled, saveBiometricCredentials, disableBiometricLogin,
  authenticateWithBiometrics,
} from '../../src/biometrics';
import { SetupPINModal } from '../../src/components/wallet/SetupPINModal';

export default function SeguridadCuentaScreen() {
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
  const [biometricType, setBiometricType] = useState('Biometría');
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
    if (!oldPwd || !newPwd || !confirmPwd) { Alert.alert('Error', 'Rellena todos los campos'); return; }
    if (newPwd !== confirmPwd) { Alert.alert('Error', 'Las contraseñas nuevas no coinciden'); return; }
    if (newPwd.length < 6) { Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres'); return; }
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
        toast.success('✓ Contraseña cambiada');
        setShowChangePwd(false); setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        Alert.alert('Error', data.message || 'No se pudo cambiar la contraseña');
      }
    } catch {
      Alert.alert('Error', 'Sin conexión');
    }
    setSaving(false);
  };

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      // Desactivar: pedir confirmación biométrica primero
      const ok = await authenticateWithBiometrics('Confirma para desactivar biometría');
      if (!ok) { toast.error('Autenticación fallida'); return; }
      await disableBiometricLogin();
      setBiometricEnabled(false);
      toast.success(`✓ ${biometricType} desactivado`);
    } else {
      // Activar: necesitamos las credenciales para guardarlas
      Alert.alert(
        `Activar ${biometricType}`,
        `Para activar el inicio de sesión con ${biometricType}, ingresa tu contraseña actual para guardarla de forma segura en este dispositivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
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
    if (!ok) { toast.error('Autenticación biométrica fallida'); return; }
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
    <SettingsLayout title="Seguridad de la cuenta">
      {/* Cambiar contraseña */}
      <SettingsSection label="Contraseña y acceso" />
      <SettingsCard>
        <SettingsRow
          label="Cambiar contraseña"
          onPress={() => setShowChangePwd(v => !v)}
        />
        {showChangePwd && (
          <View style={st.pwdForm}>
            <TextInput style={st.input} value={oldPwd} onChangeText={setOldPwd} placeholder="Contraseña actual" secureTextEntry placeholderTextColor="#94a3b8"/>
            <TextInput style={st.input} value={newPwd} onChangeText={setNewPwd} placeholder="Nueva contraseña" secureTextEntry placeholderTextColor="#94a3b8"/>
            <TextInput style={st.input} value={confirmPwd} onChangeText={setConfirmPwd} placeholder="Confirmar nueva contraseña" secureTextEntry placeholderTextColor="#94a3b8"/>
            <TouchableOpacity style={st.saveBtn} onPress={changePassword} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff"/> : <Text style={st.saveTxt}>Guardar contraseña</Text>}
            </TouchableOpacity>
          </View>
        )}
        <SettingsDivider />
        <SettingsRow label="PIN de pagos" onPress={() => setShowSetupPIN(true)} />
        <SettingsDivider />
        <SettingsRow label="Límites de transacción" onPress={() => router.push('/ajustes/security' as any)} />
        <SettingsDivider />
        {biometricAvailable ? (
          <SettingsToggleRow
            label={biometricType}
            description={biometricEnabled ? 'Inicio de sesión activado' : 'Toca para activar'}
            value={biometricEnabled}
            onValueChange={toggleBiometric}
          />
        ) : (
          <SettingsRow label="Biometría" value="No disponible en este dispositivo" />
        )}
      </SettingsCard>

      {/* Sesiones */}
      <SettingsSection label="Sesiones" />
      <SettingsCard>
        <SettingsRow label="Sesión activa" value="Este dispositivo" onPress={() => Alert.alert('Sesiones', 'Solo hay 1 sesión activa.')} />
        <SettingsDivider />
        <SettingsRow label="Login QR desde PC" onPress={() => router.push('/_qr-scanner' as any)} />
      </SettingsCard>

      {/* Actividad reciente real */}
      <SettingsSection label="Actividad reciente" />
      <SettingsCard>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ padding: 20 }}/>
        ) : activity.length === 0 ? (
          <SettingsRow label="Sin actividad registrada"/>
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
        <SettingsRow label="Ver historial completo" onPress={() => router.push('/ajustes/actividad' as any)}/>
      </SettingsCard>
    </SettingsLayout>
    <SetupPINModal
      visible={showSetupPIN}
      onDone={() => { setShowSetupPIN(false); toast.success('✓ PIN de pagos configurado'); }}
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
