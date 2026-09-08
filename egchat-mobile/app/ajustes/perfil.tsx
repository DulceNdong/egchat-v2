import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Modal, Pressable, Platform, ScrollView, TextInput,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect, Line, Circle, Polyline } from 'react-native-svg';
import { authAPI, userAPI } from '../../src/api';
import { uploadAvatarToSupabase } from '../../src/utils/avatarStorage';
import { cacheBustAvatarUrl, emitProfileUpdated, mergePersistentAvatar, saveLocalAvatar } from '../../src/utils/profileEvents';
import { AvatarCropModal } from '../../src/components/AvatarCropModal';
import ImageViewer from '../../src/components/ImageViewer';
import { ProfileQRSheet } from '../../src/components/profile/ProfileQRSheet';
import { SetupPINModal } from '../../src/components/wallet/SetupPINModal';
import {
  SettingsLayout, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import { CFG, getCfgString, setCfg } from '../../src/services/settingsPrefs';
import { walletPIN } from '../../src/services/walletPin';
import { getSoundSettings, RINGTONES } from '../../src/hooks/useSounds';
import { toast } from '../../src/components/Toast';
import { Colors, Spacing } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

const GENDERS = ['Hombre', 'Mujer', 'No especificado'] as const;
const REGIONS = [
  'Guinea Ecuatorial', 'Camerún', 'Gabón', 'Nigeria',
  'España', 'Francia', 'Estados Unidos', 'China', 'Otro',
] as const;

type EditField = 'name' | 'bio' | 'gender' | 'region' | 'address';

interface UserProfile {
  id: string;
  phone?: string;
  full_name?: string;
  country?: string;
  address?: string;
  avatar_url?: string;
  banner_url?: string;
}

const QrIcon = ({ color = '#8e8e93' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Rect x="3" y="3" width="7" height="7" /><Rect x="14" y="3" width="7" height="7" /><Rect x="3" y="14" width="7" height="7" />
    <Rect x="14" y="14" width="3" height="3" /><Rect x="18" y="18" width="3" height="3" />
  </Svg>
);

const CoinIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" /><Line x1="12" y1="8" x2="12" y2="16" /><Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);


// ══════════════════════════════════════════════════════════════════
// BANNER HEADER — portada + avatar superpuesto (estilo EGChat)
// ══════════════════════════════════════════════════════════════════
const BANNER_H = 160;
const AVATAR_SZ = 84;

function BannerHeader({
  bannerUrl, avatarUrl, initials, fullName, bio,
  uploadingAvatar, uploadingBanner,
  onPickAvatar, onPickBanner, onViewAvatar,
  C,
}: {
  bannerUrl?: string;
  avatarUrl?: string;
  initials: string;
  fullName?: string;
  bio?: string;
  uploadingAvatar: boolean;
  uploadingBanner: boolean;
  onPickAvatar: () => void;
  onPickBanner: () => void;
  onViewAvatar: () => void;
  C: typeof Colors;
}) {
  const [bannerErr, setBannerErr] = React.useState(false);
  const [avatarErr, setAvatarErr] = React.useState(false);
  React.useEffect(() => { setBannerErr(false); }, [bannerUrl]);
  React.useEffect(() => { setAvatarErr(false); }, [avatarUrl]);

  return (
    <View style={bh.root}>
      {/* PORTADA */}
      <TouchableOpacity activeOpacity={0.88} onPress={onPickBanner} style={bh.bannerTouch} accessibilityLabel="Cambiar portada">
        {bannerUrl && !bannerErr ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" onError={() => setBannerErr(true)} />
        ) : (
          <LinearGradient colors={['#00C8A0', '#00B4E6', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject as any} />
        )}
        <View style={bh.bannerOverlay} />
        <View style={bh.bannerCamBtn}>
          {uploadingBanner
            ? <ActivityIndicator size="small" color="#fff" />
            : <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="1" y="5" width="22" height="15" rx="2" />
                <Circle cx="12" cy="13" r="4" />
              </Svg>
          }
          <Text style={bh.bannerCamText}>Portada</Text>
        </View>
      </TouchableOpacity>

      {/* AVATAR superpuesto */}
      <View style={bh.avatarRow}>
        <View style={[bh.avatarWrap, { borderColor: C.bgPrimary, backgroundColor: C.bgSecondary }]}>
          <TouchableOpacity
            onPress={avatarUrl && !avatarUrl.startsWith('file://') ? onViewAvatar : onPickAvatar}
            activeOpacity={0.85}
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel="Ver o cambiar foto de perfil"
          >
            {avatarUrl && !avatarErr ? (
              <Image key={avatarUrl} source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setAvatarErr(true)} />
            ) : (
              <LinearGradient colors={['#00C8A0', '#00B4E6']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={bh.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            {uploadingAvatar && (
              <View style={bh.avatarUploading}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          {/* Badge cámara */}
          <TouchableOpacity style={bh.avatarCamBadge} onPress={onPickAvatar} activeOpacity={0.8} accessibilityLabel="Cambiar foto">
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="1" y="5" width="22" height="15" rx="2" />
              <Circle cx="12" cy="13" r="4" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Nombre y bio */}
        <View style={bh.nameBlock}>
          <Text style={[bh.name, { color: C.textPrimary }]} numberOfLines={1}>{fullName || 'Tu nombre'}</Text>
          {!!bio && <Text style={[bh.bioLine, { color: C.textTertiary }]} numberOfLines={2}>{bio}</Text>}
        </View>
      </View>
    </View>
  );
}

const bh = StyleSheet.create({
  root:           { backgroundColor: 'transparent', marginBottom: 16 },
  bannerTouch:    { height: BANNER_H, position: 'relative', overflow: 'hidden' },
  bannerOverlay:  { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,0.10)' },
  bannerCamBtn:   { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  bannerCamText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  avatarRow:      { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -(AVATAR_SZ / 2 + 4), gap: 12 },
  avatarWrap:     { width: AVATAR_SZ + 6, height: AVATAR_SZ + 6, borderRadius: (AVATAR_SZ + 6) / 2, borderWidth: 3, overflow: 'hidden', position: 'relative' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff' },
  avatarUploading:{ ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  avatarCamBadge: { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  nameBlock:      { flex: 1, paddingBottom: 6, paddingTop: AVATAR_SZ / 2 + 8 },
  name:           { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  bioLine:        { fontSize: 12, marginTop: 2, lineHeight: 16 },
});

function PhotoRow({
  label, avatarUrl, initials, onPress, onPressAvatar, uploading,
}: {
  label: string;
  avatarUrl?: string;
  initials: string;
  onPress: () => void;
  onPressAvatar?: () => void;
  uploading: boolean;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const [imgError, setImgError] = React.useState(false);

  // Reset error state cuando cambia la URL
  React.useEffect(() => { 
    setImgError(false); 
    if (avatarUrl) {
      console.log('[PhotoRow] Nueva URL de avatar:', avatarUrl.slice(0, 100));
    }
  }, [avatarUrl]);

  const handleImageError = (error: any) => {
    console.error('[PhotoRow] Error cargando imagen:', {
      url: avatarUrl?.slice(0, 100),
      error: error?.nativeEvent
    });
    setImgError(true);
  };

  return (
    <View style={styles.photoRow}>
      <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
      <View style={styles.photoRight}>
        {/* Toque en la foto → ver en tamaño real */}
        <TouchableOpacity onPress={onPressAvatar || onPress} activeOpacity={0.8}>
          <LinearGradient colors={['#07c160', '#00b4e6']} style={styles.thumb}>
            {avatarUrl && !imgError ? (
              <Image
                key={avatarUrl}
                source={{ uri: avatarUrl }}
                style={styles.thumbImg}
                onError={handleImageError}
                onLoad={() => console.log('[PhotoRow] Imagen cargada exitosamente')}
              />
            ) : (
              <Text style={styles.thumbInitials}>{initials}</Text>
            )}
            {uploading && <ActivityIndicator style={StyleSheet.absoluteFillObject} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
        {/* Toque en la flecha › → cambiar foto */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={12} style={{ padding: 4 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isDark ? '#484f58' : '#c7c7cc'} strokeWidth={2.5} strokeLinecap="round">
            <Polyline points="9 18 15 12 9 6" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FieldEditModal({
  field, value, onChange, onSave, onClose,
}: {
  field: EditField;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const titles: Record<EditField, string> = {
    name: 'Nombre', bio: 'Novedades', gender: 'Género', region: 'Región', address: 'Dirección',
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>{titles[field]}</Text>
            {field === 'gender' ? (
              <View style={styles.optionList}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.optionBtn, value === g && styles.optionBtnActive]}
                    onPress={() => onChange(g)}
                  >
                    <Text style={styles.optionText}>{g}{value === g ? ' ✓' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : field === 'region' ? (
              <ScrollView style={styles.regionScroll} showsVerticalScrollIndicator={false}>
                {REGIONS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionBtn, value === r && styles.optionBtnActive]}
                    onPress={() => onChange(r)}
                  >
                    <Text style={styles.optionText}>{r}{value === r ? ' ✓' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                autoFocus
                value={value}
                onChangeText={onChange}
                placeholder={field === 'bio' ? 'Escribe tu estado...' : 'Escribe aquí...'}
                placeholderTextColor="#9ca3af"
                style={styles.fieldInput}
                multiline={field === 'bio'}
                blurOnSubmit={field !== 'bio'}
                returnKeyType={field === 'bio' ? 'default' : 'done'}
                onSubmitEditing={field !== 'bio' ? onSave : undefined}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onClose}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={onSave}>
                <Text style={styles.modalBtnSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PerfilScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [showProfileQR, setShowProfileQR] = useState(false);
  const [showSetupPIN, setShowSetupPIN] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [ringtoneName, setRingtoneName] = useState('Clásico');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('No especificado');
  const [region, setRegion] = useState('Guinea Ecuatorial');
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [fieldVal, setFieldVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await authAPI.me();
      const profile = await mergePersistentAvatar(data);
      setUser(profile);
      setRegion(profile?.country || 'Guinea Ecuatorial');
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  const loadExtras = useCallback(async () => {
    const [bioVal, genderVal, sounds, pinSet] = await Promise.all([
      getCfgString(CFG.bio, ''),
      getCfgString(CFG.gender, 'No especificado'),
      getSoundSettings(),
      walletPIN.isSet(),
    ]);
    setBio(bioVal);
    setGender(genderVal);
    setPinConfigured(pinSet);
    const rt = RINGTONES.find(r => r.id === sounds.ringtone);
    setRingtoneName(rt?.name || 'Clásico');
  }, []);

  useEffect(() => {
    loadProfile();
    loadExtras();
  }, [loadProfile, loadExtras]);

  useFocusEffect(useCallback(() => { loadExtras(); }, [loadExtras]));

  const maskPhone = (ph?: string) => {
    if (!ph || ph.length < 6) return ph || '—';
    return ph.slice(0, 3) + '****' + ph.slice(-2);
  };

  const openEdit = (field: EditField, val: string) => {
    setEditingField(field);
    setFieldVal(val);
  };

  const saveField = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      if (editingField === 'name') {
        // Guardar localmente primero (funciona aunque Supabase esté sin cuota)
        setUser(prev => prev ? { ...prev, full_name: fieldVal } : prev);
        emitProfileUpdated({ full_name: fieldVal });
        // Nombre actualizado silenciosamente
      } else if (editingField === 'bio') {
        setBio(fieldVal);
        await setCfg(CFG.bio, fieldVal);
        // Bio actualizada silenciosamente
      } else if (editingField === 'gender') {
        setGender(fieldVal);
        await setCfg(CFG.gender, fieldVal);
        // Género guardado silenciosamente
      } else if (editingField === 'region') {
        setRegion(fieldVal);
        try { await userAPI.updateProfile({ country: fieldVal }); } catch {}
        setUser(prev => prev ? { ...prev, country: fieldVal } : prev);
        emitProfileUpdated({ country: fieldVal });
        // Región actualizada silenciosamente
      } else if (editingField === 'address') {
        try { await userAPI.updateProfile({ address: fieldVal }); } catch {}
        setUser(prev => prev ? { ...prev, address: fieldVal } : prev);
        emitProfileUpdated({ address: fieldVal });
        // Dirección guardada silenciosamente
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };


  const pickBanner = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la portada.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      await uploadBanner(result.assets[0].uri);
    }
  };

  const uploadBanner = async (uri: string) => {
    setUploadingBanner(true);
    try {
      const currentUserId = user?.id;
      if (!currentUserId) return;
      // Optimistic UI
      setUser(prev => prev ? { ...prev, banner_url: uri } : prev);
      // Subir a Supabase Storage (mismo bucket que avatares)
      const supabaseUrl = await uploadAvatarToSupabase(currentUserId + '_banner', uri);
      if (supabaseUrl) {
        await authAPI.updateProfile({ banner_url: supabaseUrl });
        setUser(prev => prev ? { ...prev, banner_url: supabaseUrl } : prev);
        emitProfileUpdated({ banner_url: supabaseUrl });
        toast.success('Portada actualizada');
      }
    } catch {
      toast.error('Error al actualizar la portada');
    } finally {
      setUploadingBanner(false);
    }
  };

  const pickPhoto = async () => {
    // Pedir permisos de galería en iOS
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos acceso a tu galería para cambiar la foto de perfil. Actívalo en Ajustes > EGCHAT > Fotos.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    }).then(result => {
      if (!result.canceled && result.assets[0]) setCropUri(result.assets[0].uri);
    });
  };

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const currentUserId = user?.id;
      if (!currentUserId) throw new Error('No hay usuario');

      // 1. Mostrar imagen local inmediatamente (optimistic UI)
      const localUri = uri.startsWith('file:') ? uri : `file://${uri}`;
      setUser(prev => prev ? { ...prev, avatar_url: localUri } : prev);
      emitProfileUpdated({ id: currentUserId, avatar_url: localUri });

      // 2. Subir a Supabase Storage
      const supabaseUrl = await uploadAvatarToSupabase(currentUserId, uri);

      if (supabaseUrl) {
        // 3. Sincronizar con Render
        try {
          await authAPI.updateProfile({ avatar_url: supabaseUrl });
        } catch (syncError) {
          console.warn('[uploadPhoto] Sync con Render falló (no crítico):', syncError);
        }
        // 4. Actualizar estado con URL permanente
        const finalUrl = cacheBustAvatarUrl(supabaseUrl) || supabaseUrl;
        setUser(prev => prev ? { ...prev, avatar_url: finalUrl } : prev);
        emitProfileUpdated({ id: currentUserId, avatar_url: finalUrl });
        await saveLocalAvatar(currentUserId, finalUrl);
        toast.success('Foto actualizada');
      } else {
        // Supabase no devolvió URL — guardar localmente
        await saveLocalAvatar(currentUserId, uri);
        setUser(prev => prev ? { ...prev, avatar_url: localUri } : prev);
        emitProfileUpdated({ id: currentUserId, avatar_url: localUri });
        toast.success('Foto guardada localmente');
      }
    } catch (error) {
      console.error('[uploadPhoto] Error:', error);
      toast.error('Error al actualizar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <SettingsLayout title="Perfil" scroll={false}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      </SettingsLayout>
    );
  }

  const initials = user?.full_name?.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'U';
  const userIdShort = user?.id ? user.id.slice(0, 8).toUpperCase() : '—';

  return (
    <>
      <SettingsLayout title="Perfil">
        {/* Banner + avatar superpuesto */}
        <BannerHeader
          bannerUrl={user?.banner_url}
          avatarUrl={user?.avatar_url}
          initials={initials}
          fullName={user?.full_name}
          bio={bio}
          uploadingAvatar={uploadingPhoto}
          uploadingBanner={uploadingBanner}
          onPickAvatar={pickPhoto}
          onPickBanner={pickBanner}
          onViewAvatar={() => setShowAvatarViewer(true)}
          C={C}
        />
        {/* Card 1 — Identidad */}
        <SettingsCard>
          <SettingsRow
            label="Nombre"
            value={user?.full_name || '—'}
            onPress={() => openEdit('name', user?.full_name || '')}
          />
          <SettingsDivider />
          <SettingsRow
            label="Novedades"
            value={bio || 'Añadir estado'}
            onPress={() => openEdit('bio', bio)}
          />
          <SettingsDivider />
          <SettingsRow label="Género" value={gender} onPress={() => openEdit('gender', gender)} />
          <SettingsDivider />
          <SettingsRow label="Región" value={region} onPress={() => openEdit('region', region)} />
          <SettingsDivider />
          <SettingsRow
            label="Teléfono"
            value={maskPhone(user?.phone)}
            onPress={() => toast.info('Contacta soporte para cambiar el teléfono')}
          />
          <SettingsDivider />
          <SettingsRow
            label="ID"
            value={userIdShort}
            onPress={async () => {
              if (user?.id) {
                await Clipboard.setStringAsync(user.id);
                // ID copiado silenciosamente
              }
            }}
          />
          <SettingsDivider />
          <SettingsRow
            label="Mi código QR"
            onPress={() => setShowProfileQR(true)}
            right={
              <View style={styles.rowRight}>
                <QrIcon />
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth={2.5} strokeLinecap="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </View>
            }
          />
        </SettingsCard>

        {/* Card 2 — Servicios */}
        <View style={{ height: 8 }} />
        <SettingsCard>
          <SettingsRow
            label="Tono de timbre para llamadas entrantes"
            value={ringtoneName}
            onPress={() => router.push('/ajustes/llamadas')}
          />
          <SettingsDivider />
          <SettingsRow
            label="Mi dirección"
            value={user?.address || '—'}
            onPress={() => openEdit('address', user?.address || '')}
          />
          <SettingsDivider />
          <SettingsRow
            label="Mi título de beneficiario de ingreso"
            value={user?.full_name || '—'}
            onPress={() => toast.info('Configura tu nombre en cobros')}
          />
          <SettingsDivider />
          <SettingsRow
            label="EGCoins"
            onPress={() => router.push('/(tabs)/monedero')}
            right={
              <View style={styles.rowRight}>
                <CoinIcon />
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth={2.5} strokeLinecap="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </View>
            }
          />
        </SettingsCard>

        {/* Card 3 — Seguridad */}
        <View style={{ height: 8 }} />
        <SettingsCard>
          <SettingsRow
            label="PIN de pagos"
            value={pinConfigured ? '✅ Configurado' : '⚠️ Sin PIN'}
            onPress={() => setShowSetupPIN(true)}
          />
        </SettingsCard>
      </SettingsLayout>

      {editingField && (
        <FieldEditModal
          field={editingField}
          value={fieldVal}
          onChange={setFieldVal}
          onSave={saveField}
          onClose={() => !saving && setEditingField(null)}
        />
      )}

      <AvatarCropModal
        visible={!!cropUri}
        imageUri={cropUri || ''}
        onClose={() => setCropUri(null)}
        onSave={uri => { setCropUri(null); uploadPhoto(uri); }}
      />
      <ProfileQRSheet
        visible={showProfileQR}
        onClose={() => setShowProfileQR(false)}
        userId={user?.id || ''}
        name={user?.full_name || 'Usuario'}
        phone={user?.phone}
        avatar={user?.avatar_url}
      />
      <SetupPINModal
        visible={showSetupPIN}
        onDone={() => { setShowSetupPIN(false); setPinConfigured(true); /* PIN configurado silenciosamente */ }}
        onCancel={() => setShowSetupPIN(false)}
      />
      <ImageViewer
        visible={showAvatarViewer && !!user?.avatar_url && !user.avatar_url.startsWith('file://')}
        images={user?.avatar_url && !user.avatar_url.startsWith('file://') ? [user.avatar_url] : []}
        initialIndex={0}
        onClose={() => setShowAvatarViewer(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
  },
  rowLabel: { flex: 1, fontSize: 16 },
  photoRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: {
    width: 52, height: 52, borderRadius: 6, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbInitials: { fontSize: 20, fontWeight: '700', color: '#fff' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 16, textAlign: 'center' },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#07c160', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16, color: '#111827',
  },
  optionList: { gap: 8, marginBottom: 16 },
  regionScroll: { maxHeight: 240, marginBottom: 16 },
  optionBtn: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  optionBtnActive: { borderColor: '#07c160', borderWidth: 2, backgroundColor: '#d1fae5' },
  optionText: { fontSize: 15, color: '#111827' },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f3f4f6' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalBtnSave: { backgroundColor: '#07c160' },
  modalBtnSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
