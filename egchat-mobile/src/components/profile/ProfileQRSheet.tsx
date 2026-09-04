import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet, TouchableOpacity, Share, Alert,
  Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { buildContactQrPayload, buildContactQrUrl } from '../../utils/contactQr';
import { EGAvatar } from '../ui';

// QR nativo (react-native-qrcode-svg) solo en nativo
let QRCode: any = null;
try {
  if (Platform.OS !== 'web') QRCode = require('react-native-qrcode-svg').default;
} catch {}

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export function ProfileQRSheet({ visible, onClose, userId, name, phone, avatar }: Props) {
  const payload  = userId ? buildContactQrPayload({ id: userId, name, phone }) : '';
  const shareUrl = userId ? buildContactQrUrl({ id: userId, name, phone }) : '';

  // En web generamos el QR con la API de QR Server (pública, sin key)
  const webQrUrl = payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}&color=0d0d0d&bgcolor=ffffff&margin=10&format=png`
    : '';

  const copyLink = async () => {
    await Clipboard.setStringAsync(shareUrl || payload);
    Alert.alert('✓ Copiado', 'Enlace copiado al portapapeles');
  };

  const shareProfile = async () => {
    try {
      await Share.share({ message: `Añádeme en EGCHAT: ${name}\n${shareUrl}`, title: 'Mi perfil EGCHAT' });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Avatar + nombre */}
          <View style={s.userRow}>
            <EGAvatar src={avatar} name={name} size={52} />
            <View style={s.userInfo}>
              <Text style={s.name}>{name}</Text>
              {phone && <Text style={s.phone}>{phone}</Text>}
            </View>
          </View>

          <Text style={s.scanLabel}>Escanea para añadirme a EGChat</Text>

          {/* QR Card con diseño premium */}
          <View style={s.qrCard}>
            {/* Esquinas decorativas */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />

            <View style={s.qrInner}>
              {!userId ? (
                <Text style={s.noQr}>Inicia sesión para ver tu QR</Text>
              ) : Platform.OS === 'web' ? (
                // Web: imagen del QR generada por API externa
                <Image
                  source={{ uri: webQrUrl }}
                  style={s.qrImage}
                  resizeMode="contain"
                />
              ) : QRCode ? (
                // Nativo: QR + avatar/iniciales superpuestos en el centro
                <View>
                  <QRCode
                    value={payload}
                    size={200}
                    backgroundColor="#ffffff"
                    color="#0d0d0d"
                  />
                  {/* Logo centrado: foto de perfil o iniciales */}
                  <View style={s.qrLogoWrap}>
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        style={s.qrLogoImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={s.qrLogoInitials}>
                        <Text style={s.qrLogoInitialsText}>
                          {name ? name.trim().charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <Image source={{ uri: webQrUrl }} style={s.qrImage} resizeMode="contain" />
              )}
            </View>

            {/* Logo centrado en el QR (web) */}
          </View>

          <Text style={s.hint}>
            Cualquier usuario de EGCHAT puede escanearlo desde{'\n'}Contactos o el escáner de la app.
          </Text>

          {/* Botones */}
          <View style={s.actions}>
            <TouchableOpacity onPress={copyLink} style={s.btnSecondary} activeOpacity={0.85}>
              <Text style={s.btnSecondaryText}>Copiar enlace</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareProfile} activeOpacity={0.85} style={{ flex: 1 }}>
              <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnPrimary}>
                <Text style={s.btnPrimaryText}>Compartir perfil</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ACCENT = '#00b4e6';
const CORNER = 22;

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', marginTop: 12, marginBottom: 20 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'flex-start', marginBottom: 20, width: '100%' },
  userInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  phone: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  scanLabel: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 16 },

  qrCard: {
    width: 260, height: 260,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  qrInner: { alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 220, height: 220 },
  noQr: { fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 20 },

  // Esquinas decorativas de color
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: ACCENT, borderWidth: 3 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },

  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18, marginBottom: 20 },

  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(0,180,230,0.4)',
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: ACCENT },
  btnPrimary: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
