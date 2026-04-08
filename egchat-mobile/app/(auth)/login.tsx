import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authAPI } from '../../src/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSubmit = async () => {
    if (!phone || !password) return Alert.alert('Error', 'Rellena todos los campos');
    setLoading(true);
    try {
      if (isRegister) {
        if (!fullName) return Alert.alert('Error', 'Introduce tu nombre completo');
        await authAPI.register({ full_name: fullName, phone, password });
      } else {
        await authAPI.login(phone, password);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>EG</Text>
          </View>
          <Text style={styles.appName}>EGCHAT</Text>
          <Text style={styles.appSub}>Guinea Ecuatorial</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</Text>

          {isRegister && (
            <TextInput style={styles.input} placeholder="Nombre completo" value={fullName}
              onChangeText={setFullName} autoCapitalize="words" placeholderTextColor="#9CA3AF" />
          )}

          <TextInput style={styles.input} placeholder="+240 XXX XXX XXX" value={phone}
            onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />

          <TextInput style={styles.input} placeholder="Contraseña" value={password}
            onChangeText={setPassword} secureTextEntry placeholderTextColor="#9CA3AF" />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isRegister ? 'Registrarse' : 'Entrar'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(p => !p)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00c8a0' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  btn: { backgroundColor: '#00c8a0', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#00c8a0', fontSize: 13, fontWeight: '600' },
});
