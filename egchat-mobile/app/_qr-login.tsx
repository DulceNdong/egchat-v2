/**
 * EGChat — Pantalla de confirmación de login QR
 * Se activa cuando el usuario escanea egchat://qr-login/SESSION_ID
 * Muestra confirmación y llama al backend para autorizar la sesión del PC
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { qrSessionService } from '../src/services/qrSession';

export default function QRLoginScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [status, setStatus] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm');
  const [message, setMessage] = useState('');

  const confirm = async () => {
    if (!sessionId) { setStatus('error'); setMessage('QR inválido'); return; }
    setStatus('loading');
    const result = await qrSessionService.confirmQRLogin(sessionId);
    if (result.ok) {
      setStatus('success');
      setTimeout(() => router.back(), 2000);
    } else {
      setStatus('error');
      setMessage(result.message || 'No se pudo confirmar');
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>

        <View style={s.card}>
          {/* Icono */}
          <View style={s.iconWrap}>
            <Text style={s.icon}>
              {status === 'success' ? '✅' : status === 'error' ? '❌' : '💻'}
            </Text>
          </View>

          {/* Título */}
          <Text style={s.title}>
            {status === 'success' ? '¡Sesión confirmada!' :
             status === 'error'   ? 'Error' :
             status === 'loading' ? 'Confirmando...' :
             'Iniciar sesión en PC'}
          </Text>

          <Text style={s.sub}>
            {status === 'success' ? 'Ya puedes usar EGChat en tu ordenador' :
             status === 'error'   ? message :
             status === 'loading' ? 'Autorizando la sesión...' :
             '¿Quieres iniciar sesión en EGChat Web desde este dispositivo?'}
          </Text>

          {status === 'loading' ? (
            <ActivityIndicator color="#00c8a0" style={{ marginTop: 24 }} />
          ) : status === 'confirm' ? (
            <View style={s.actions}>
              <TouchableOpacity style={s.btnCancel} onPress={() => router.back()}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirm}>
                <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.btnConfirm}>
                  <Text style={s.btnConfirmText}>Confirmar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : status === 'error' ? (
            <TouchableOpacity style={s.btnCancel} onPress={() => router.back()}>
              <Text style={s.btnCancelText}>Volver</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Indicador de seguridad */}
        <Text style={s.security}>
          🔒 Solo confirma si TÚ estás intentando iniciar sesión en el PC
        </Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 340,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,200,160,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnCancel: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', marginTop: 24,
  },
  btnCancelText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 15 },
  btnConfirm: {
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 12,
  },
  btnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  security: {
    color: 'rgba(255,255,255,0.3)', fontSize: 12,
    textAlign: 'center', marginTop: 24, paddingHorizontal: 20,
  },
});
