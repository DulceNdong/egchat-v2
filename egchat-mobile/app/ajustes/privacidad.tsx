import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow, VisibilityRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { getToken, getApiBase, authAPI } from '../../src/api';
import { router } from 'expo-router';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';
import { useLanguage } from '../../src/context/LanguageContext';
import { t as tr } from '../../src/translations';

// ── Sincroniza configuración de privacidad con el backend ─────────
async function syncPrivacyToBackend(settings: {
  lastSeen?: string;
  photoVis?: string;
  statusVis?: string;
}): Promise<void> {
  try {
    const token = await getToken();
    const base = getApiBase();
    await fetch(`${base}/api/auth/privacy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        last_seen_visibility: settings.lastSeen,
        photo_visibility: settings.photoVis,
        status_visibility: settings.statusVis,
      }),
    });
  } catch {
    // Silencioso — la preferencia local ya se guardó
  }
}

// `id` es el valor persistido/enviado al backend; `labelKey` es la etiqueta visible.
const VIS_OPTS = [
  { id: 'todos', labelKey: 'everyone' },
  { id: 'contactos', labelKey: 'contacts' },
  { id: 'nadie', labelKey: 'nobody' },
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
  const [syncing, setSyncing] = useState(false);
  const { translate: t } = useLanguage();
  const visOptions = VIS_OPTS.map(o => ({ id: o.id, label: t(o.labelKey) }));

  useEffect(() => {
    getCfgString(CFG.lastSeen, 'todos').then(setLastSeen);
    getCfgString(CFG.photoVis, 'todos').then(setPhotoVis);
    getCfgString(CFG.statusVis, 'todos').then(setStatusVis);
    loadBlocked();
  }, []);

  // Actualiza una opción localmente Y sincroniza con backend
  const updatePrivacy = useCallback(async (
    field: 'lastSeen' | 'photoVis' | 'statusVis',
    value: string,
    cfgKey: string,
    setter: (v: string) => void,
  ) => {
    setter(value);
    setCfg(cfgKey, value);
    setSyncing(true);
    const payload: Record<string, string> = {};
    if (field === 'lastSeen') payload.lastSeen = value;
    if (field === 'photoVis') payload.photoVis = value;
    if (field === 'statusVis') payload.statusVis = value;
    await syncPrivacyToBackend(payload);
    setSyncing(false);
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
    const name = contact.full_name || contact.phone || tr('setThisContact');
    Alert.alert(
      'Desbloquear',
      `¿Desbloquear a ${name}?`,
      [
        { text: tr('cancel'), style: 'cancel' },
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
              // Usuario desbloqueado silenciosamente
            } catch {
              toast.error(tr('setUnblockFailed'));
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
        Alert.alert(t('setRequestSent'), t('setRequestSentBody'));
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
          dialogTitle: tr('setExportDataTitle'),
        });
        return;
      }
      Alert.alert(tr('setExportCreated'), `Archivo guardado: ${fileName}`);
    } catch {
      Alert.alert(t('error'), t('setExportDataFailed'));
    }
  };

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      tr('xtEliminarCuenta'),
      tr('xtEstaAccionEsIrreversibleSeEliminaranPermanentement'),
      [
        { text: tr('cancel'), style: 'cancel' },
        {
          text: tr('xtConfirmarEliminacion'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              tr('setFinalConfirmation'),
              tr('setDeleteAccountFinal'),
              [
                { text: tr('cancel'), style: 'cancel' },
                {
                  text: tr('xtSiEliminar'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const token = await getToken();
                      const base = getApiBase();
                      await fetch(`${base}/api/auth/delete-account`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                    } catch {
                      // Silencioso — si el servidor falla, igual cerramos sesión
                    }
                    await authAPI.logout();
                    router.replace('/(auth)/login' as any);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  return (
    <SettingsLayout title={t('myInfo')}>
      <SettingsSection label={t('visibility')} />
      <SettingsCard>
        <VisibilityRow
          label={t('lastSeen')}
          value={lastSeen}
          options={visOptions}
          onChange={v => updatePrivacy('lastSeen', v, CFG.lastSeen, setLastSeen)}
        />
        <SettingsDivider />
        <VisibilityRow
          label={t('profilePhoto')}
          value={photoVis}
          options={visOptions}
          onChange={v => updatePrivacy('photoVis', v, CFG.photoVis, setPhotoVis)}
        />
        <SettingsDivider />
        <VisibilityRow
          label={t('statusHistory')}
          value={statusVis}
          options={visOptions}
          onChange={v => updatePrivacy('statusVis', v, CFG.statusVis, setStatusVis)}
        />
        {syncing && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={{ fontSize: 12, color: Colors.accent }}>Guardando…</Text>
          </View>
        )}
      </SettingsCard>

      <SettingsSection label={`${t('blockedContacts')}${blocked.length > 0 ? ` (${blocked.length})` : ''}`} />
      <SettingsCard>
        {loadingBlocked ? (
          <ActivityIndicator color={Colors.accent} style={{ padding: 16 }} />
        ) : blocked.length === 0 ? (
          <SettingsRow label={t('noBlockedContacts')} />
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
                  <Text style={st.blockedName}>{contact.full_name || tr('setUser')}</Text>
                  {contact.phone && <Text style={st.blockedPhone}>{contact.phone}</Text>}
                </View>
                <Text
                  style={st.unblockBtn}
                  onPress={() => unblockContact(contact)}
                >
                  {t('unblock')}
                </Text>
              </View>
              {i < blocked.length - 1 && <SettingsDivider />}
            </React.Fragment>
          ))
        )}
      </SettingsCard>

      <SettingsSection label={t('personalData')} />
      <SettingsCard>
        <SettingsRow label={t('downloadMyData')} onPress={requestDataDownload} />
        <SettingsDivider />
        <SettingsRow
          label={t('deleteAccount')}
          danger
          onPress={handleDeleteAccount}
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
