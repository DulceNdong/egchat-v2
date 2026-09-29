import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { EGButton, EGInput, EGErrorMessage } from '../../src/components/ui';
import { useTranslation } from '../../src/context/LanguageContext';

const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', phone: '+240' },
  { code: 'CM', name: 'Camerún', phone: '+237' },
  { code: 'GA', name: 'Gabón', phone: '+241' },
  { code: 'ES', name: 'España', phone: '+34' },
  { code: 'FR', name: 'Francia', phone: '+33' },
];
const getFlag = (code: string) =>
  String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));

type RecoverStep = 1 | 2 | 3;

export default function ForgotPasswordScreen() {
  const [recoverStep, setRecoverStep] = useState<RecoverStep>(1);
  const [countryCode] = useState('+240');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { isDark } = useThemeContext();
  const { t } = useTranslation();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const fullPhone = countryCode + phone.replace(/\s/g, '');
  const selectedCountry = COUNTRIES.find(c => c.phone === countryCode) || COUNTRIES[0];

  const sendCode = async () => {
    if (!phone.trim()) { setError('Introduce tu número de teléfono'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.sendVerification(fullPhone);
      setRecoverStep(2);
    } catch (e: any) {
      setError(e.message || 'Error al enviar el código');
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    if (code.length < 4) { setError('Introduce el código completo'); return; }
    setLoading(true); setError('');
    try {
      const { verified } = await authAPI.verifyCode(fullPhone, code);
      if (verified) setRecoverStep(3);
      else setError('Código incorrecto. Inténtalo de nuevo.');
    } catch (e: any) {
      setError(e.message || 'Código inválido');
    } finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPass !== newPass2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword(fullPhone, code, newPass);
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Error al cambiar la contraseña');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bgPrimary }]} edges={['top']}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={[styles.doneTitle, { color: C.textPrimary }]}>{t('passwordChanged')}</Text>
          <Text style={[styles.doneSub, { color: C.textSecondary }]}>{t('passwordChangedHint')}</Text>
          <EGButton title={t('goToLogin')} onPress={() => router.replace('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.formArea}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: C.textTertiary }]}>← {t('backLogin')}</Text>
            </TouchableOpacity>

            {recoverStep === 1 && (
              <>
                <Text style={[styles.title, { color: C.textPrimary }]}>{t('recoverAccount')}</Text>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('createStrongPassword')}</Text>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>{t('country')}</Text>
                  <View style={[styles.countrySelector, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
                    <Text style={styles.countryFlag}>{getFlag(selectedCountry.code)}</Text>
                    <Text style={[styles.countryName, { color: C.textPrimary }]}>{selectedCountry.name}:</Text>
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: C.textTertiary }]}>{t('phone')}</Text>
                  <View style={styles.phoneRow}>
                    <View style={[styles.phonePrefix, { backgroundColor: C.bgTertiary, borderColor: C.border }]}>
                      <Text style={[styles.phonePrefixText, { color: C.textPrimary }]}>{countryCode}</Text>
                    </View>
                    <EGInput value={phone} onChangeText={setPhone} placeholder="222 XXX XXX" keyboardType="phone-pad" containerStyle={styles.phoneInputContainer} />
                  </View>
                </View>
                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton title={loading ? t('sending') : t('sendCode')} onPress={sendCode} loading={loading} disabled={!phone.trim()} />
              </>
            )}

            {recoverStep === 2 && (
              <>
                <Text style={[styles.title, { color: C.textPrimary }]}>{t('enterCode')}</Text>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>
                  Enviamos un código a <Text style={[styles.phoneHighlight, { color: C.textPrimary }]}>{fullPhone}</Text>
                </Text>
                <EGInput label={t('verificationCode')} value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" keyboardType="number-pad" maxLength={6} />
                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton title={loading ? t('verifying') : t('verifyCode')} onPress={verifyCode} loading={loading} disabled={code.length < 4} style={styles.btnMargin} />
                <TouchableOpacity onPress={sendCode} style={styles.resendBtn}>
                  <Text style={styles.resendText}>{loading ? t('sending') : t('resendCode')}</Text>
                </TouchableOpacity>
              </>
            )}

            {recoverStep === 3 && (
              <>
                <Text style={[styles.title, { color: C.textPrimary }]}>{t('newPassword')}</Text>
                <Text style={[styles.subtitle, { color: C.textSecondary }]}>{t('enterPhone')}</Text>
                <EGInput label={t('newPassword')} value={newPass} onChangeText={setNewPass} showPasswordToggle placeholder={t('minCharacters')} />
                <EGInput label={t('confirmPassword')} value={newPass2} onChangeText={setNewPass2} secureTextEntry placeholder={t('repeatPassword')} error={newPass2 && newPass !== newPass2 ? 'Las contraseñas no coinciden' : undefined} />
                {error ? <EGErrorMessage text={error} /> : null}
                <EGButton title={loading ? t('saving') : t('saveNewPassword')} onPress={savePassword} loading={loading} disabled={newPass.length < 6 || newPass !== newPass2} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },
  formArea: { flex: 1, padding: Spacing.screenPadding },
  backBtn: { alignSelf: 'flex-start', padding: Spacing.sm, marginBottom: Spacing.md },
  backText: { fontSize: FontSize.base },
  title: { ...Typography.headerTitle, textAlign: 'center', marginBottom: 6 },
  subtitle: { ...Typography.subtitle, textAlign: 'center', marginBottom: Spacing.xl },
  phoneHighlight: { fontWeight: FontWeight.bold },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.fieldLabel, marginBottom: 5 },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: BorderRadius.md,
    padding: Spacing.inputPaddingH, minHeight: 46, gap: Spacing.sm,
  },
  countryFlag: { fontSize: 18 },
  countryName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  phonePrefix: {
    borderWidth: 1.5, borderRightWidth: 0,
    borderTopLeftRadius: BorderRadius.md, borderBottomLeftRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  phonePrefixText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  phoneInputContainer: { flex: 1, marginBottom: 0 },
  btnMargin: { marginBottom: Spacing.md },
  resendBtn: { alignItems: 'center', padding: Spacing.sm },
  resendText: { color: Colors.brand, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
  doneIcon: { fontSize: 56, marginBottom: Spacing.lg },
  doneTitle: { ...Typography.headerTitle, marginBottom: Spacing.sm, textAlign: 'center' },
  doneSub: { ...Typography.subtitle, textAlign: 'center', marginBottom: Spacing.xl },
});
