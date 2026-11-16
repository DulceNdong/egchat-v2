// Aviso de aceptación: aparece al arrancar si la versión vigente de un documento
// no consta como aceptada en este dispositivo. La copia local es la fuente
// inmediata; el servidor sincroniza entre dispositivos cuando hay conexión.
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getToken } from '../../api';
import { useTranslation } from '../../context/LanguageContext';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';
import { LEGAL_DOCS, deviceLocale, resolveLegalLang } from '../../legal/registry';
import { LEGAL_UI } from '../../legal/strings';
import { pendingDocuments, recordAcceptances, synchronizeAcceptances } from '../../legal/acceptance';
import { toast } from '../Toast';
import type { LegalDocId } from '../../legal/types';

export function LegalConsentGate({ enabled }: { enabled: boolean }) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const { language: appLanguage } = useTranslation();

  const [pending, setPending] = useState<LegalDocId[]>([]);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const lang = resolveLegalLang(appLanguage, deviceLocale());
  const ui = LEGAL_UI[lang];

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await synchronizeAcceptances();
        const missing = await pendingDocuments();
        if (cancelled || missing.length === 0) return;
        setPending(missing);
        setVisible(true);
      } catch {
        // Sin red o sin almacenamiento: no se interrumpe el uso de la app.
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const read = useCallback((docId: LegalDocId) => {
    setVisible(false);
    router.push({ pathname: '/ajustes/legal', params: { doc: docId } } as any);
  }, []);

  const accept = useCallback(async () => {
    setSaving(true);
    try {
      const { synced } = await recordAcceptances(
        pending.map((documentId) => ({ documentId, language: lang })),
      );
      setVisible(false);
      if (synced) toast.success(ui.accepted);
      else toast.warning(ui.accepted, ui.gateSavedLocally);
    } catch {
      toast.error(ui.acceptError);
    }
    setSaving(false);
  }, [pending, lang, ui.accepted, ui.acceptError, ui.gateSavedLocally]);

  if (pending.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
          <Text style={[s.title, { color: C.textPrimary }]}>{ui.gateTitle}</Text>
          <Text style={[s.body, { color: C.textSecondary }]}>{ui.gateBody}</Text>

          {pending.map((docId) => (
            <View key={docId} style={[s.docRow, { borderColor: C.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.docTitle, { color: C.textPrimary }]}>
                  {LEGAL_DOCS[docId].content[lang].title}
                </Text>
                <Text style={[s.docMeta, { color: C.textSecondary }]}>
                  {ui.version} {LEGAL_DOCS[docId].meta.version}
                </Text>
              </View>
              <TouchableOpacity onPress={() => read(docId)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[s.read, { color: C.accent }]}>{ui.gateRead}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[s.primary, { backgroundColor: C.accent, opacity: saving ? 0.7 : 1 }]}
            onPress={accept}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={s.primaryText}>{saving ? ui.accepting : ui.gateAccept}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.later} onPress={() => setVisible(false)}>
            <Text style={[s.laterText, { color: C.textSecondary }]}>{ui.gateLater}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 34 },
  title: { fontSize: 19, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  docRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  docTitle: { fontSize: 15, fontWeight: '600' },
  docMeta: { fontSize: 12, marginTop: 2 },
  read: { fontSize: 14, fontWeight: '700' },
  primary: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  later: { alignItems: 'center', paddingVertical: 12 },
  laterText: { fontSize: 14, fontWeight: '600' },
});
