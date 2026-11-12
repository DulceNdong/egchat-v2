// Centro Legal — lector de Términos y Política de privacidad.
// El documento se genera como HTML autocontenido y se muestra en el WebView:
// índice con anclas, apartados numerados y cambio de idioma sin recargar la app.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from '../../src/miniapps/WebViewCompat';
import { Colors } from '../../src/theme/colors';
import { DarkColors } from '../../src/theme/darkMode';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { useTranslation } from '../../src/context/LanguageContext';
import { buildLegalHtml } from '../../src/legal/html';
import {
  LEGAL_DOCS, LEGAL_DOC_ORDER, LEGAL_EXTERNAL_BASE, LEGAL_LANGS, LEGAL_LANG_LABEL,
  deviceLocale, formatLegalDate, isLegalDocId, resolveLegalLang,
} from '../../src/legal/registry';
import { LEGAL_UI } from '../../src/legal/strings';
import {
  getAcceptance, isCurrentVersion, recordAcceptances, synchronizeAcceptances,
  type AcceptanceRecord,
} from '../../src/legal/acceptance';
import { toast } from '../../src/components/Toast';
import type { LegalDocId, LegalLang } from '../../src/legal/types';

const LANG_KEY = 'cfg_legal_lang';

export default function LegalCenterScreen() {
  const params = useLocalSearchParams<{ doc?: string }>();
  const docId: LegalDocId = isLegalDocId(params.doc) ? params.doc : 'terms';
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const { language: appLanguage } = useTranslation();

  const [lang, setLang] = useState<LegalLang>(() => resolveLegalLang(appLanguage, deviceLocale()));
  const [acceptance, setAcceptance] = useState<AcceptanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((stored) => { if (stored) setLang(resolveLegalLang(stored, deviceLocale())); })
      .catch(() => {});
    synchronizeAcceptances().catch(() => {});
  }, []);

  useEffect(() => {
    getAcceptance(docId).then(setAcceptance).catch(() => setAcceptance(null));
  }, [docId]);

  const chooseLang = useCallback((next: LegalLang) => {
    setLang(next);
    AsyncStorage.setItem(LANG_KEY, next).catch(() => {});
  }, []);

  const ui = LEGAL_UI[lang];
  const doc = LEGAL_DOCS[docId];

  const html = useMemo(
    () => buildLegalHtml(doc.content[lang], doc.meta, lang, {
      background: C.bgPrimary,
      surface: C.bgSecondary,
      text: C.textPrimary,
      muted: C.textSecondary,
      border: C.border,
      accent: C.accent,
    }, isDark),
    [doc, lang, C, isDark],
  );

  const accept = useCallback(async () => {
    setSaving(true);
    try {
      const { synced } = await recordAcceptances([{ documentId: docId, language: lang }]);
      setAcceptance(await getAcceptance(docId));
      if (synced) toast.success(ui.accepted);
      else toast.warning(ui.accepted, ui.gateSavedLocally);
    } catch {
      toast.error(ui.acceptError);
    }
    setSaving(false);
  }, [docId, lang, ui.accepted, ui.acceptError, ui.gateSavedLocally]);

  const openExternal = useCallback(() => {
    if (!LEGAL_EXTERNAL_BASE) return;
    Linking.openURL(`${LEGAL_EXTERNAL_BASE}${doc.meta.externalPath}?lang=${lang}`).catch(() => {});
  }, [doc.meta.externalPath, lang]);

  const onNavigation = useCallback((request: { url: string }) => {
    const { url } = request;
    if (url.startsWith('about:blank') || url.startsWith('data:') || url.includes('#')) return true;
    if (/^(https?:|mailto:)/i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return false;
  }, []);

  const current = isCurrentVersion(acceptance ?? undefined, docId);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={s.back}>
          <Text style={[s.backIcon, { color: C.accent }]}>‹</Text>
          <Text style={[s.backText, { color: C.accent }]}>{ui.close}</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: C.textPrimary }]} numberOfLines={1}>{ui.centerTitle}</Text>
        {LEGAL_EXTERNAL_BASE ? (
          <TouchableOpacity onPress={openExternal} hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }} style={s.right}>
            <Text style={[s.rightText, { color: C.accent }]}>{ui.openWeb}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.right} />
        )}
      </View>

      <View style={s.toolbar}>
        <View style={[s.segment, { backgroundColor: C.bgTertiary }]}>
          {LEGAL_DOC_ORDER.map((id) => {
            const active = id === docId;
            return (
              <TouchableOpacity
                key={id}
                style={[s.segmentItem, active && { backgroundColor: C.bgSecondary }]}
                onPress={() => { if (!active) router.setParams({ doc: id }); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[s.segmentText, { color: active ? C.textPrimary : C.textSecondary }]}
                  numberOfLines={1}
                >
                  {id === 'terms' ? LEGAL_UI[lang].termsTab : LEGAL_UI[lang].privacyTab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.langs}>
          {LEGAL_LANGS.map((code) => {
            const active = code === lang;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => chooseLang(code)}
                style={[
                  s.langChip,
                  { borderColor: active ? C.accent : C.border, backgroundColor: active ? C.accentLight : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.langText, { color: active ? C.accentDark : C.textSecondary }]}>
                  {LEGAL_LANG_LABEL[code]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <WebView
        key={`${docId}-${lang}-${isDark ? 'd' : 'l'}`}
        source={{ html }}
        originWhitelist={['about:blank', 'data:*']}
        onShouldStartLoadWithRequest={onNavigation}
        setSupportMultipleWindows={false}
        style={[s.web, { backgroundColor: C.bgPrimary }]}
        containerStyle={{ backgroundColor: C.bgPrimary }}
        startInLoadingState
        renderLoading={() => (
          <View style={[s.loading, { backgroundColor: C.bgPrimary }]}>
            <ActivityIndicator color={C.accent} />
          </View>
        )}
      />

      <View style={[s.footer, { backgroundColor: C.bgSecondary, borderTopColor: C.border }]}>
        {current ? (
          <View style={s.acceptedRow}>
            <Text style={[s.check, { color: C.accent }]}>✓</Text>
            <Text style={[s.acceptedText, { color: C.textSecondary }]} numberOfLines={2}>
              {ui.acceptedOn.replace('{date}', formatLegalDate(acceptance!.acceptedAt.slice(0, 10), lang))}
            </Text>
          </View>
        ) : (
          <View style={s.acceptRow}>
            <Text style={[s.pendingText, { color: C.textSecondary }]} numberOfLines={1}>{ui.notAccepted}</Text>
            <TouchableOpacity
              style={[s.acceptBtn, { backgroundColor: C.accent, opacity: saving ? 0.7 : 1 }]}
              onPress={accept}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={s.acceptBtnText}>{saving ? ui.accepting : ui.accept}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { flexDirection: 'row', alignItems: 'center', minWidth: 80 },
  backIcon: { fontSize: 26, lineHeight: 28, marginRight: 2 },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  right: { minWidth: 80, alignItems: 'flex-end' },
  rightText: { fontSize: 13, fontWeight: '600' },
  toolbar: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 8 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  langs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  langText: { fontSize: 12, fontWeight: '600' },
  web: { flex: 1, marginTop: 4 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 },
  acceptedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  check: { fontSize: 16, fontWeight: '800' },
  acceptedText: { fontSize: 12, flex: 1 },
  acceptRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingText: { fontSize: 12, flex: 1 },
  acceptBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
