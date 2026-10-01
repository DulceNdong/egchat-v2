import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { EGErrorMessage } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useTranslation } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');

// ── Países CEMAC — solo GQ activo ───────────────────────────────────
const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', phone: '+240', active: true  },
  { code: 'CM', name: 'Cameroun',           phone: '+237', active: false },
  { code: 'GA', name: 'Gabon',              phone: '+241', active: false },
  { code: 'CG', name: 'Congo',              phone: '+242', active: false },
  { code: 'CF', name: 'Rép. Centrafricaine',phone: '+236', active: false },
  { code: 'TD', name: 'Tchad',              phone: '+235', active: false },
];

const COMING_SOON: Record<string, { lang: string; title: string; body: string; cta: string }> = {
  CM: {
    lang: 'Français',
    title: '🚀 Bientôt disponible au Cameroun',
    body: 'EGChat arrive bientôt dans votre pays ! Nous travaillons dur pour vous offrir la meilleure expérience de messagerie et de services financiers en Afrique Centrale. Restez connectés — votre tour arrive très bientôt.',
    cta: 'Compris !',
  },
  GA: {
    lang: 'Français',
    title: '🚀 Bientôt disponible au Gabon',
    body: 'EGChat arrive bientôt dans votre pays ! Nous travaillons dur pour vous offrir la meilleure expérience de messagerie et de services financiers en Afrique Centrale. Restez connectés — votre tour arrive très bientôt.',
    cta: 'Compris !',
  },
  CG: {
    lang: 'Français',
    title: '🚀 Bientôt disponible au Congo',
    body: 'EGChat arrive bientôt dans votre pays ! Nous travaillons dur pour vous offrir la meilleure expérience de messagerie et de services financiers en Afrique Centrale. Restez connectés — votre tour arrive très bientôt.',
    cta: 'Compris !',
  },
  CF: {
    lang: 'Français',
    title: '🚀 Bientôt disponible en R.C.A.',
    body: 'EGChat arrive bientôt dans votre pays ! Nous travaillons dur pour vous offrir la meilleure expérience de messagerie et de services financiers en Afrique Centrale. Restez connectés — votre tour arrive très bientôt.',
    cta: 'Compris !',
  },
  TD: {
    lang: 'Français / عربية',
    title: '🚀 قريباً في تشاد · Bientôt au Tchad',
    body: 'EGChat قادم قريباً إلى بلدك! نحن نعمل بجد لنقدم لك أفضل تجربة مراسلة وخدمات مالية في وسط أفريقيا.\n\nEGChat arrive bientôt au Tchad ! Nous travaillons dur pour vous offrir la meilleure expérience.',
    cta: "حسناً · D'accord !",
  },
};

const CEMAC_FLAGS = ['GQ', 'CM', 'GA', 'CG', 'CF', 'TD'];

const getFlag = (code: string) =>
  String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));

const LOGIN_DRAFT_KEY = 'egchat_login_draft_v1';

// ── Icono ojo SVG profesional ────────────────────────────────────────
const EyeIcon = ({ visible, color = '#94a3b8' }: { visible: boolean; color?: string }) =>
  visible ? (
    // Ojo abierto — feather "eye"
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ) : (
    // Ojo tachado — feather "eye-off"
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  );

// ── Input propio compacto ────────────────────────────────────────────
const Field = ({
  label, value, onChangeText, placeholder, keyboardType, secure,
  autoCapitalize, autoCorrect, autoComplete, onSubmit, isDark,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: any; secure?: boolean;
  autoCapitalize?: any; autoCorrect?: boolean; autoComplete?: any;
  onSubmit?: () => void; isDark: boolean;
}) => {
  const [hidden, setHidden] = useState(true);
  const bg     = isDark ? '#1e2d3a' : '#f8fafc';
  const border = isDark ? '#2a3f50' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#0f172a';
  const ph     = isDark ? '#4a6070' : '#b0bcc8';

  return (
    <View style={f.wrap}>
      <Text style={[f.label, { color: isDark ? '#4a6a80' : '#94a3b8' }]}>{label}</Text>
      <View style={[f.box, { backgroundColor: bg, borderColor: border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ph}
          keyboardType={keyboardType}
          secureTextEntry={secure && hidden}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={autoCorrect ?? false}
          autoComplete={autoComplete}
          onSubmitEditing={onSubmit}
          returnKeyType={onSubmit ? 'done' : 'next'}
          style={[f.input, { color: text }]}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setHidden(h => !h)}
            style={f.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <EyeIcon visible={!hidden} color={isDark ? '#4a6a80' : '#94a3b8'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const f = StyleSheet.create({
  wrap:   { marginBottom: 10 },
  label:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginBottom: 5 },
  box:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, height: 44, paddingHorizontal: 12 },
  input:  { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  eyeBtn: { paddingLeft: 8 },
});

// ════════════════════════════════════════════════════════════════════
export default function LoginScreen() {
  const [countryCode, setCountryCode]             = useState('+240');
  const [phone, setPhone]                         = useState('');
  const [password, setPassword]                   = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [comingSoonCountry, setComingSoonCountry] = useState<typeof COUNTRIES[0] | null>(null);

  const { login, isLoading, error } = useAuth();
  const { isDark }                  = useThemeContext();
  const { t }                       = useTranslation();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];
  const fullPhone       = countryCode + phone.replace(/\s/g, '');
  const doLogin         = () => login(fullPhone, password);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOGIN_DRAFT_KEY);
        if (!raw) return;
        const d = JSON.parse(raw) as { countryCode?: string; phone?: string; password?: string };
        if (d.countryCode) setCountryCode(d.countryCode);
        if (d.phone)       setPhone(d.phone);
        if (d.password)    setPassword(d.password);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LOGIN_DRAFT_KEY, JSON.stringify({ countryCode, phone, password })).catch(() => {});
  }, [countryCode, phone, password]);

  const handleSelectCountry = (c: typeof COUNTRIES[0]) => {
    setShowCountryPicker(false);
    if (!c.active) { setComingSoonCountry(c); } else { setCountryCode(c.phone); }
  };

  const cardBg     = isDark ? '#0d1b26' : '#ffffff';
  const fieldBg    = isDark ? '#1e2d3a' : '#f8fafc';
  const fieldBdr   = isDark ? '#2a3f50' : '#e2e8f0';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fondo gradiente */}
      <LinearGradient
        colors={['#00c8a0', '#0099c8', '#0060b8']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.circleA} />
      <View style={s.circleB} />

      {/* ── MODAL PRÓXIMAMENTE ─────────────────────────────── */}
      <Modal visible={!!comingSoonCountry} transparent animationType="fade"
        onRequestClose={() => setComingSoonCountry(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setComingSoonCountry(null)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <LinearGradient colors={['#00c8a0', '#0099c8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.modalTop}>
              <View style={s.mOrbit1} /><View style={s.mOrbit2} />
              <View style={s.mFlagWrap}>
                <Text style={s.mFlag}>{comingSoonCountry ? getFlag(comingSoonCountry.code) : ''}</Text>
                <View style={s.mClockBadge}><Text style={{ fontSize: 14 }}>⏳</Text></View>
              </View>
            </LinearGradient>
            <View style={s.modalBody}>
              {comingSoonCountry && COMING_SOON[comingSoonCountry.code] && (() => {
                const cs = COMING_SOON[comingSoonCountry.code];
                return (
                  <>
                    <Text style={s.mLangBadge}>{cs.lang}</Text>
                    <Text style={s.mTitle}>{cs.title}</Text>
                    <Text style={s.mText}>{cs.body}</Text>
                    <View style={s.mProgressTrack}>
                      <LinearGradient colors={['#00c8a0','#0099c8']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.mProgressFill} />
                    </View>
                    <Text style={s.mProgressLabel}>En desarrollo · En cours de développement</Text>
                    <TouchableOpacity style={s.mBtn} onPress={() => setComingSoonCountry(null)} activeOpacity={0.85}>
                      <LinearGradient colors={['#00c8a0','#0099c8']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.mBtnGrad}>
                        <Text style={s.mBtnText}>{cs.cta}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── ZONA ESTÁTICA: logo + nombre + banderas ─────────── */}
      <SafeAreaView style={s.staticZone} pointerEvents="box-none">
        {/* Logo: círculo verde con logo llenando todo */}
        <View style={s.logoRing}>
          <SpinningLogo size={78} glow={false} />
        </View>

        <Text style={s.appName}>EGChat</Text>
        <Text style={s.appTagline}>África Central conectada</Text>

        {/* Banderas CEMAC — más grandes */}
        <View style={s.cemacBadge}>
          <Text style={s.cemacLabel}>CEMAC</Text>
          <View style={s.flagsRow}>
            {CEMAC_FLAGS.map(code => (
              <Text key={code} style={s.flag}>{getFlag(code)}</Text>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* ── ZONA SCROLL: formulario ─────────────────────────── */}
      <KeyboardAvoidingView
        style={s.kvFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Espaciador para empujar la tarjeta hacia abajo */}
          <View style={s.spacer} />

          {/* ── Tarjeta ────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: cardBg }]}>

            <Text style={[s.cardTitle, { color: C.textPrimary }]}>Iniciar sesión</Text>
            <Text style={[s.cardSub, { color: C.textSecondary }]}>Ingresa tu teléfono y contraseña</Text>

            {/* País */}
            <View style={f.wrap}>
              <Text style={[f.label, { color: isDark ? '#4a6a80' : '#94a3b8' }]}>PAÍS</Text>
              <TouchableOpacity
                style={[s.countryBox, { backgroundColor: fieldBg, borderColor: fieldBdr }]}
                onPress={() => setShowCountryPicker(p => !p)}
                activeOpacity={0.8}
              >
                <Text style={s.cFlag}>{getFlag(selectedCountry.code)}</Text>
                <Text style={[s.cName, { color: C.textPrimary }]}>{selectedCountry.name}</Text>
                <Text style={s.cBadge}>{selectedCountry.phone}</Text>
                <Text style={[s.cChevron, { color: isDark ? '#4a6a80' : '#b0bcc8' }]}>
                  {showCountryPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showCountryPicker && (
                <View style={[s.dropdown, { backgroundColor: isDark ? '#0d1b26' : '#fff', borderColor: fieldBdr }]}>
                  {COUNTRIES.map(c => (
                    <TouchableOpacity
                      key={c.phone}
                      style={[s.ddItem, c.phone === countryCode && s.ddItemActive,
                        { borderBottomColor: isDark ? '#1e2d3a' : '#f0f4f8' }]}
                      onPress={() => handleSelectCountry(c)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.cFlag}>{getFlag(c.code)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.ddItemText, { color: C.textPrimary }]}>{c.name}</Text>
                        {!c.active && <Text style={s.ddSoonText}>Próximamente · Bientôt</Text>}
                      </View>
                      {c.active
                        ? <Text style={s.cBadge}>{c.phone}</Text>
                        : <Text style={{ fontSize: 14 }}>⏳</Text>}
                      {c.phone === countryCode && <Text style={s.ddCheck}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Teléfono */}
            <View style={[f.wrap, { marginBottom: 10 }]}>
              <Text style={[f.label, { color: isDark ? '#4a6a80' : '#94a3b8' }]}>TELÉFONO</Text>
              <View style={[f.box, { backgroundColor: fieldBg, borderColor: fieldBdr, paddingHorizontal: 0 }]}>
                {/* Prefijo */}
                <View style={[s.prefixBox, { backgroundColor: isDark ? '#162330' : '#eef2f7', borderColor: fieldBdr }]}>
                  <Text style={{ fontSize: 14 }}>{getFlag(selectedCountry.code)}</Text>
                  <Text style={[s.prefixText, { color: C.textPrimary }]}>{countryCode}</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="222 XXX XXX"
                  placeholderTextColor={isDark ? '#4a6070' : '#b0bcc8'}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="tel"
                  style={[f.input, { color: isDark ? '#e2e8f0' : '#0f172a', paddingHorizontal: 12 }]}
                />
              </View>
            </View>

            {/* Contraseña — input propio con ojo SVG */}
            <Field
              label="CONTRASEÑA"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secure
              onSubmit={doLogin}
              isDark={isDark}
            />

            {error ? (
              <View style={s.errBox}>
                <Text style={s.errText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón iniciar sesión */}
            <TouchableOpacity
              style={[s.loginBtn, isLoading && { opacity: 0.7 }]}
              onPress={doLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#00c8a0', '#0099c8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.loginGrad}
              >
                <Text style={s.loginText}>{isLoading ? 'Iniciando...' : 'Iniciar sesión'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Olvidé contraseña */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as any)}
              style={s.forgotBtn}
            >
              <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Separador */}
            <View style={s.sep}>
              <View style={[s.sepLine, { backgroundColor: isDark ? '#1e2d3a' : '#e2e8f0' }]} />
              <Text style={[s.sepText, { color: isDark ? '#3a5060' : '#cbd5e1' }]}>o</Text>
              <View style={[s.sepLine, { backgroundColor: isDark ? '#1e2d3a' : '#e2e8f0' }]} />
            </View>

            {/* Crear cuenta */}
            <TouchableOpacity
              style={[s.createBtn, { borderColor: isDark ? '#2a3f50' : '#e2e8f0' }]}
              onPress={() => router.push('/(auth)/register' as any)}
              activeOpacity={0.8}
            >
              <Text style={[s.createText, { color: C.textPrimary }]}>Crear nueva cuenta</Text>
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={[s.backText, { color: isDark ? '#3a5060' : '#94a3b8' }]}>← Volver al inicio</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── StyleSheet principal ─────────────────────────────────────────────
const HEADER_H = 185; // altura reducida — menos verde visible

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00c8a0' },

  // Decoración
  circleA: {
    position: 'absolute', top: -width * 0.25, right: -width * 0.2,
    width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleB: {
    position: 'absolute', bottom: height * 0.38, left: -width * 0.2,
    width: width * 0.55, height: width * 0.55, borderRadius: width * 0.275,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // ── Zona estática (header) ───────────────────────────────────────
  staticZone: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEADER_H,
    alignItems: 'center',
    justifyContent: 'center',   // centrado vertical en lugar de flex-end
    paddingTop: 44,              // respeta el notch/safe area
    paddingBottom: 0,
    gap: 5,
    zIndex: 1,
  },

  // Logo: círculo más ajustado al logo, menos verde visible
  logoRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#00d4a8',   // un tono más oscuro para menos dominancia
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 0,
  },

  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: -2,
  },

  // Badge CEMAC con banderas grandes
  cemacBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginTop: 4,
  },
  cemacLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  flagsRow: { flexDirection: 'row', gap: 4 },
  flag:     { fontSize: 22, lineHeight: 26 },   // ← más grandes

  // ── Scroll ───────────────────────────────────────────────────────
  kvFlex:  { flex: 1 },
  scroll:  { flexGrow: 1, paddingBottom: 32 },
  spacer:  { height: HEADER_H },  // empuja la tarjeta debajo del header estático

  // ── Tarjeta formulario ───────────────────────────────────────────
  card: {
    marginHorizontal: 14,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },

  // País selector
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
  },
  cFlag:    { fontSize: 18 },
  cName:    { flex: 1, fontSize: 14, fontWeight: '600' },
  cBadge:   { fontSize: 11, fontWeight: '700', color: '#00a88a', backgroundColor: 'rgba(0,200,160,0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, overflow: 'hidden' },
  cChevron: { fontSize: 9 },

  // Dropdown país
  dropdown: {
    marginTop: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  ddItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, gap: 8 },
  ddItemActive:{ backgroundColor: 'rgba(0,200,160,0.06)' },
  ddItemText:  { fontSize: 14, fontWeight: '500' },
  ddSoonText:  { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginTop: 1 },
  ddCheck:     { color: '#00c8a0', fontSize: 13, fontWeight: '700' },

  // Prefijo teléfono
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 44,
    borderRightWidth: 1.5,
  },
  prefixText: { fontSize: 13, fontWeight: '700' },

  // Error
  errBox: { backgroundColor: '#fff1f2', borderRadius: 10, padding: 10, marginBottom: 10 },
  errText: { color: '#e11d48', fontSize: 13, fontWeight: '500' },

  // Botón login
  loginBtn: {
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#00c8a0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 7,
  },
  loginGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },

  // Olvidé contraseña
  forgotBtn:  { alignItems: 'center', paddingVertical: 8 },
  forgotText: { color: '#00a88a', fontSize: 13, fontWeight: '600' },

  // Separador
  sep:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  sepLine: { flex: 1, height: 1 },
  sepText: { fontSize: 12, fontWeight: '500' },

  // Crear cuenta
  createBtn:  { borderWidth: 1.5, borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginBottom: 12 },
  createText: { fontSize: 14, fontWeight: '600' },

  // Volver
  backBtn:  { alignItems: 'center', paddingVertical: 6 },
  backText: { fontSize: 13 },

  // ── Modal próximamente ───────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  modalCard:    { width: '100%', borderRadius: 26, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.28, shadowRadius: 28, elevation: 20 },
  modalTop:     { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  mOrbit1:      { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', top: -70, right: -50 },
  mOrbit2:      { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', bottom: -45, left: -30 },
  mFlagWrap:    { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  mFlag:        { fontSize: 68, lineHeight: 80 },
  mClockBadge:  { position: 'absolute', bottom: -4, right: -10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' },
  modalBody:    { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, backgroundColor: '#fff' },
  mLangBadge:   { alignSelf: 'flex-start', backgroundColor: '#f0fdf9', color: '#00a88a', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, overflow: 'hidden', marginBottom: 10 },
  mTitle:       { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 24, marginBottom: 10 },
  mText:        { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 18 },
  mProgressTrack: { height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  mProgressFill:  { width: '65%', height: '100%', borderRadius: 3 },
  mProgressLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginBottom: 18 },
  mBtn:         { borderRadius: 13, overflow: 'hidden', shadowColor: '#00c8a0', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 5 },
  mBtnGrad:     { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  mBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
});

const { height } = Dimensions.get('window');
