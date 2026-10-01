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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { EGButton, EGInput, EGErrorMessage } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { authAPI } from '../../src/api';
import { SpinningLogo } from '../../src/components/SpinningLogo';
import { useTranslation } from '../../src/context/LanguageContext';

const { width, height } = Dimensions.get('window');

// ── Países CEMAC ────────────────────────────────────────────────────
// Solo GQ tiene acceso. Los demás muestran el modal "próximamente".
const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', phone: '+240', active: true  },
  { code: 'CM', name: 'Cameroun',          phone: '+237', active: false },
  { code: 'GA', name: 'Gabon',             phone: '+241', active: false },
  { code: 'CG', name: 'Congo',             phone: '+242', active: false },
  { code: 'CF', name: 'Rép. Centrafricaine',phone: '+236',active: false },
  { code: 'TD', name: 'Tchad',             phone: '+235', active: false },
];

// Mensaje "próximamente" en el idioma principal de cada país
const COMING_SOON: Record<string, {
  lang: string; title: string; body: string; cta: string;
}> = {
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
    cta: 'حسناً · D\'accord !',
  },
};

// Banderas CEMAC en orden
const CEMAC_FLAGS = ['GQ', 'CM', 'GA', 'CG', 'CF', 'TD'];

const getFlag = (code: string) =>
  String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
  );

const LOGIN_DRAFT_KEY = 'egchat_login_draft_v1';

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState('+240');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  // Modal "próximamente" para países sin acceso
  const [comingSoonCountry, setComingSoonCountry] = useState<typeof COUNTRIES[0] | null>(null);

  const { login, isLoading, error, clearError } = useAuth();
  const { isDark } = useThemeContext();
  const { t }      = useTranslation();
  const C          = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];
  const fullPhone       = countryCode + phone.replace(/\s/g, '');
  const doLogin         = () => login(fullPhone, password);

  // Persist draft
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

  // Manejar selección de país: si no está activo, mostrar modal próximamente
  const handleSelectCountry = (c: typeof COUNTRIES[0]) => {
    setShowCountryPicker(false);
    if (!c.active) {
      setComingSoonCountry(c);
    } else {
      setCountryCode(c.phone);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Fondo degradado ─────────────────────────────────── */}
      <LinearGradient
        colors={['#00c8a0', '#00a0c8', '#0070c8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Círculos decorativos de fondo */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Cabecera ─────────────────────────────────────── */}
            <View style={styles.header}>
              {/* Logo */}
              <View style={styles.logoWrapper}>
                <View style={styles.logoGlow} />
                <View style={styles.logoBox}>
                  <SpinningLogo size={64} glow={false} />
                </View>
              </View>

              {/* Nombre de la app */}
              <Text style={styles.appName}>EGChat</Text>
              <Text style={styles.appTagline}>África Central conectada</Text>

              {/* Banderas CEMAC con etiqueta */}
              <View style={styles.cemacRow}>
                <View style={styles.cemacBadge}>
                  <Text style={styles.cemacLabel}>CEMAC</Text>
                  <View style={styles.flagsRow}>
                    {CEMAC_FLAGS.map(code => (
                      <Text key={code} style={styles.flag}>{getFlag(code)}</Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* ── Tarjeta del formulario ───────────────────────── */}
            <View style={[styles.card, isDark && styles.cardDark]}>

              <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
                Iniciar sesión
              </Text>
              <Text style={[styles.cardSubtitle, { color: C.textSecondary }]}>
                Ingresa tu teléfono y contraseña
              </Text>

              {/* ── Selector de país ── */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>PAÍS</Text>
                <TouchableOpacity
                  style={[styles.countrySelector, { backgroundColor: isDark ? '#1e2d3a' : '#f5f8fa', borderColor: isDark ? '#2a3f50' : '#e2e8f0' }]}
                  onPress={() => setShowCountryPicker(p => !p)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.countryFlag}>{getFlag(selectedCountry.code)}</Text>
                  <Text style={[styles.countryName, { color: C.textPrimary }]}>{selectedCountry.name}</Text>
                  <Text style={[styles.phoneCodeBadge]}>{selectedCountry.phone}</Text>
                  <Text style={[styles.chevron, { color: C.textTertiary }]}>
                    {showCountryPicker ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showCountryPicker && (
                  <View style={[styles.dropdown, { backgroundColor: isDark ? '#1a2d3a' : '#fff', borderColor: isDark ? '#2a3f50' : '#e2e8f0' }]}>
                    {COUNTRIES.map(c => (
                      <TouchableOpacity
                        key={c.phone}
                        style={[
                          styles.dropdownItem,
                          c.phone === countryCode && styles.dropdownItemActive,
                          { borderBottomColor: isDark ? '#2a3f50' : '#f0f4f8' },
                        ]}
                        onPress={() => { setCountryCode(c.phone); setShowCountryPicker(false); }}
                      >
                        <Text style={styles.countryFlag}>{getFlag(c.code)}</Text>
                        <Text style={[styles.dropdownItemText, { color: C.textPrimary }]}>{c.name}</Text>
                        <Text style={styles.phoneCodeBadge}>{c.phone}</Text>
                        {c.phone === countryCode && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* ── Teléfono ── */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>TELÉFONO</Text>
                <View style={styles.phoneRow}>
                  <View style={[styles.prefix, { backgroundColor: isDark ? '#1e2d3a' : '#f5f8fa', borderColor: isDark ? '#2a3f50' : '#e2e8f0' }]}>
                    <Text style={styles.prefixFlag}>{getFlag(selectedCountry.code)}</Text>
                    <Text style={[styles.prefixCode, { color: C.textPrimary }]}>{countryCode}</Text>
                  </View>
                  <EGInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="222 XXX XXX"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="tel"
                    containerStyle={styles.phoneInput}
                  />
                </View>
              </View>

              {/* ── Contraseña ── */}
              <EGInput
                label="CONTRASEÑA"
                value={password}
                onChangeText={setPassword}
                showPasswordToggle
                onSubmitEditing={doLogin}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />

              {/* Error */}
              {error ? <EGErrorMessage text={error} /> : null}

              {/* ── Botón principal ── */}
              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                onPress={doLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#00c8a0', '#0099c8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtnGradient}
                >
                  <Text style={styles.loginBtnText}>
                    {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Olvidé contraseña */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password' as any)}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* Separador */}
              <View style={styles.separator}>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2a3f50' : '#e2e8f0' }]} />
                <Text style={[styles.separatorText, { color: C.textTertiary }]}>o</Text>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2a3f50' : '#e2e8f0' }]} />
              </View>

              {/* ── Crear cuenta ── */}
              <TouchableOpacity
                style={[styles.createBtn, { borderColor: isDark ? '#2a3f50' : '#d1d5db' }]}
                onPress={() => router.push('/(auth)/register' as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.createBtnText, { color: C.textPrimary }]}>Crear nueva cuenta</Text>
              </TouchableOpacity>

              {/* Volver */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={[styles.backText, { color: C.textTertiary }]}>← Volver al inicio</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00c8a0',
  },

  // ── Decoración de fondo ──────────────────────────────────────────
  circleTopRight: {
    position: 'absolute',
    top: -width * 0.3,
    right: -width * 0.25,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -width * 0.2,
    left: -width * 0.2,
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // ── Header ───────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: -4,
  },

  // Fila CEMAC
  cemacRow: {
    marginTop: 8,
  },
  cemacBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cemacLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  flag: {
    fontSize: 17,
    lineHeight: 20,
  },

  // ── Tarjeta ──────────────────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  cardDark: {
    backgroundColor: '#0f1f2b',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },

  // ── Campos ───────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 6,
  },

  // Country
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  phoneCodeBadge: {
    backgroundColor: '#00c8a015',
    color: '#00a88a',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chevron: {
    fontSize: 10,
    color: '#94a3b8',
  },

  // Dropdown
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#00c8a010',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  checkMark: {
    color: '#00c8a0',
    fontSize: 14,
    fontWeight: '700',
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  prefixFlag: {
    fontSize: 16,
  },
  prefixCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },

  // ── Botón principal ───────────────────────────────────────────────
  loginBtn: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00c8a0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Olvidé contraseña
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  forgotText: {
    color: '#00a88a',
    fontSize: 14,
    fontWeight: '600',
  },

  // Separador
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Crear cuenta
  createBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Volver
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
