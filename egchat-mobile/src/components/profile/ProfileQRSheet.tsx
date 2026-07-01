import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TouchableOpacity, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { buildContactQrPayload, buildContactQrUrl } from '../../utils/contactQr';
import { Spacing, BorderRadius, FontSize } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  name: string;
  phone?: string;
}

export function ProfileQRSheet({ visible, onClose, userId, name, phone }: Props) {
  const payload = userId ? buildContactQrPayload({ id: userId, name, phone }) : '';
  const shareUrl = userId ? buildContactQrUrl({ id: userId, name, phone }) : '';

  const copyLink = async () => {
    await Clipboard.setStringAsync(shareUrl || payload);
    Alert.alert('Copiado', 'Enlace copiado al portapapeles');
  };

  const shareProfile = async () => {
    try {
      await Share.share({
        message: `Añádeme en EGCHAT: ${name}\n${shareUrl}`,
        title: 'Mi perfil EGCHAT',
      });
    } catch { /* cancel */ }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <Text style={s.title}>Escanea para añadirme</Text>
          <Text style={s.sub}>{name}{phone ? ` · ${phone}` : ''}</Text>

          <View style={s.qrWrap}>
            {userId ? (
              <QRCode value={payload} size={200} backgroundColor="#fff" color="#0d0d0d" />
            ) : (
              <Text style={s.sub}>Inicia sesión para generar tu QR</Text>
            )}
          </View>

          <Text style={s.hint}>Otros usuarios EGCHAT pueden escanear este código desde Contactos o el escáner de la app.</Text>

          <TouchableOpacity onPress={copyLink} style={s.secondaryBtn} activeOpacity={0.85}>
            <Text style={s.secondaryBtnText}>Copiar enlace</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={shareProfile} activeOpacity={0.85}>
            <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Compartir perfil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    marginTop: 10, marginBottom: 12,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: '#111827' },
  sub: { fontSize: FontSize.sm, color: '#6b7280', marginTop: 4, marginBottom: Spacing.md },
  qrWrap: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(0,180,230,0.25)',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,180,230,0.35)',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  secondaryBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#00b4e6' },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
