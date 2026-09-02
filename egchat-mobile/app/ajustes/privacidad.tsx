import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, VisibilityRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { getToken, getApiBase } from '../../src/api';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';

const VIS_OPTS = [
  { id: 'todos', label: 'Todos' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'nadie', label: 'Nadie' },
];

interface BlockedContact {
  id: string;
  contact_user_id: string;
  full_name?: string;
  phone?: string;
}

export default function PrivacidadScreen() {
  const [lastSeen, setLastSeen] = useState('todos');
  const [photoVis, setPhotoVis] = useState('todos');
  const [statusVis, setStatusVis] = useState('todos');
  const [blocked, setBlocked] = useState<BlockedContact[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);

  useEffect(() => {
    getCfgString(CFG.lastSeen, 'todos').then(setLastSeen);
    getCfgString(CFG.photoVis, 'todos').then(setPhotoVis);
    getCfgString(CFG.statusVis, 'todos').then(setStatusVis);
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const token = await getToken();
      const base = getApiBase();
      const res = await fetch(`${base}/api/contacts/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlocked(Array.isArray(data) ? data : []);
      }
    } catch { /* silencioso */ }
    setLoadingBlocked(false);
  };

  const unblockContact = (contact: BlockedContact) => {
    const name = contact.full_name || contact.phone || 'este contacto';
    Alert.alert(
      'Desbloquear',
      `¿Desbloquear a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              const token = await getToken();
              const base = getApiBase();
              await fetch(`${base}/api/contacts/${contact.id}/unblock`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              setBlocked(prev => prev.filter(c => c.id !== contact.id));
              toast.success(`✓ ${name} desbloqueado`);
            } catch {
              toast.error('No se pudo desbloquear. Verifica tu conexión.');
            }
          },
        },
      ],
    );
  };

  const requestDataDownload = async () => {
    try {
      const token = await getToken();
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/request-data-export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert('Solicitud enviada', 'Recibirás un email con tus datos en las próximas 24 horas.');
      } else {
        await createLocalDataExport();
      }
    } catch {
      await createLocalDataExport();
    }
  };

  const createLocalDataExport = async () => {
    try {
      const fileName = `egchat-datos-${new Date().toISOString().slice(0, 10)}.json`;
      const path = `${FileSystem.cacheDirectory}${fileName}`;
      const payload = {
        app: 'EGCHAT',
        exportedAt: new Date().toISOString(),
        privacy: {
          lastSeen,
          photoVisibility: photoVis,
          statusVisibility: statusVis,
        },
        blockedContacts: blocked.map(contact => ({
          id: contact.id,
          contactUserId: contact.contact_user_id,
          fullName: contact.full_name,
          phone: contact.phone,
        })),
      };
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar datos de EGCHAT',
        });
        return;
      }
      Alert.alert('Exportación creada', `Archivo guardado: ${fileName}`);
    } catch {
      Alert.alert('Error', 'No se pudo crear la exportación de datos.');
    }
  };

  return (
    <SettingsLayout title="Mi información">
      <SettingsSection label="Visibilidad" />
      <SettingsCard>
        <VisibilityRow
          label="Última vez"
          value={lastSeen}
          options={VIS_OPTS}
          onChange={v => { setLastSeen(v); setCfg(CFG.lastSeen, v); }}
        />
        <SettingsDivider />
        <VisibilityRow
          label="Foto de perfil"
          value={photoVis}
          options={VIS_OPTS}
          onChange={v => { setPhotoVis(v); setCfg(CFG.photoVis, v); }}
        />
        <SettingsDivider />
        <VisibilityRow
          label="Estado / Historia"
          value={statusVis}
          options={VIS_OPTS}
          onChange={v => { setStatusVis(v); setCfg(CFG.statusVis, v); }}
        />
      </SettingsCard>

      <SettingsSection label={`Contactos bloqueados${blocked.length > 0 ? ` (${blocked.length})` : ''}`} />
      <SettingsCard>
        {loadingBlocked ? (
          <ActivityIndicator color={Colors.accent} style={{ padding: 16 }} />
        ) : blocked.length === 0 ? (
          <SettingsRow label="Sin contactos bloqueados" />
        ) : (
          blocked.map((contact, i) => (
            <React.Fragment key={contact.id}>
              <View style={st.blockedRow}>
                <View style={st.blockedAvatar}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    {(contact.full_name || contact.phone || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.blockedName}>{contact.full_name || 'Usuario'}</Text>
                  {contact.phone && <Text style={st.blockedPhone}>{contact.phone}</Text>}
                </View>
                <Text
                  style={st.unblockBtn}
                  onPress={() => unblockContact(contact)}
                >
                  Desbloquear
                </Text>
              </View>
              {i < blocked.length - 1 && <SettingsDivider />}
            </React.Fragment>
          ))
        )}
      </SettingsCard>

      <SettingsSection label="Datos personales" />
      <SettingsCard>
        <SettingsRow label="Descargar mis datos" onPress={requestDataDownload} />
        <SettingsDivider />
        <SettingsRow
          label="Eliminar mi cuenta"
          danger
          onPress={() =>
            Alert.alert(
              'Eliminar cuenta',
              'Esta acción eliminará permanentemente tu cuenta, mensajes y datos. Para proceder, contacta al soporte en support@egchat.gq',
              [{ text: 'Entendido', style: 'cancel' }],
            )
          }
        />
      </SettingsCard>
    </SettingsLayout>
  );
}

const st = StyleSheet.create({
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  blockedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  blockedPhone: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  unblockBtn: { fontSize: 13, fontWeight: '600', color: Colors.accent },
});
