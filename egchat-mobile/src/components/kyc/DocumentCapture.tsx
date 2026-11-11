// DocumentCapture — cámara en vivo + galería, con previsualización y validación básica
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { encryptImage } from '../../services/kycEncryption';
import { useTranslation } from '../../context/LanguageContext';
import { t as tr } from '../../translations';

interface Props {
  side: 'front' | 'back' | 'selfie';
  onCapture: (encryptedBase64: string, uri: string) => void;
  onError?: (msg: string) => void;
}

// Mensajes i18n por lado una vez capturada la foto.
const SIDE_CAPTURED_KEYS: Record<string, string> = {
  front: 'kyFrontCaptured',
  back:  'kyBackCaptured',
  selfie:'kySelfieCaptured',
};
// Acciones i18n de captura por lado.
const SIDE_CAPTURE_KEYS: Record<string, string> = {
  front: 'kyCaptureFront',
  back:  'kyCaptureBack',
  selfie:'kyCaptureSelfie',
};

export function DocumentCapture({ side, onCapture, onError }: Props) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [processing, setProcessing] = useState(false);
  const [qualityTip, setQualityTip] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const sideCaptured   = t(SIDE_CAPTURED_KEYS[side] ?? 'chtPhoto');
  const sideCaptureAct = t(SIDE_CAPTURE_KEYS[side] ?? 'chtPhoto');

  // ── Procesar URI (tanto cámara como galería) ──────────────────────────────
  const processUri = useCallback(async (uri: string) => {
    setProcessing(true);
    setQualityTip(null);
    try {
      const { encryptedBase64 } = await encryptImage(uri);
      // Mostrar preview ANTES de llamar al padre, para que el usuario vea la imagen
      setPreviewUri(uri);
      setQualityTip(null);
      onCapture(encryptedBase64, uri);
    } catch (e: any) {
      console.error('[DocumentCapture] processUri error:', e?.message ?? e);
      // Aun con error de cifrado mostramos el preview para que el usuario
      // sepa qué imagen eligió, y le ofrecemos reintentar desde la vista previa.
      // Pasamos la URI sin cifrar con prefijo "raw:" como señal al padre.
      setPreviewUri(uri);
      const msg = t('kyImageProcessError');
      setQualityTip(msg);
      onError?.(msg);
      // Llamar igualmente al padre con la imagen en crudo para que pueda
      // guardar el estado y mostrar el botón de confirmación manual.
      onCapture(`raw:${uri}`, uri);
    } finally {
      setProcessing(false);
    }
  }, [onCapture, onError, t]);

  // ── Capturar con cámara ───────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    setQualityTip(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (!photo?.uri) throw new Error(tr('xtNoSeRecibioURIDeLaFoto'));
      await processUri(photo.uri);
    } catch (e: any) {
      const msg = t('kyCaptureError');
      setQualityTip(msg);
      onError?.(msg);
      setProcessing(false);
    }
  }, [processing, processUri, onError, t]);

  // ── Elegir de galería ─────────────────────────────────────────────────────
  const handleGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('kyPermRequired'),
        t('kyGalleryAccessBody'),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      await processUri(result.assets[0].uri);
    }
  }, [processUri, t]);

  // ── Reintentar ────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setPreviewUri(null);
    setConfirmed(false);
    setQualityTip(null);
  };

  // ── Permiso de cámara no resuelto aún ────────────────────────────────────
  if (!permission) {
    return <ActivityIndicator color="#00C8A0" style={{ marginTop: 20 }} />;
  }

  // ── Sin permiso de cámara ─────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={st.permWrap}>
        <MaterialCommunityIcons name="camera-off" size={40} color="#9ca3af" />
        <Text style={st.permText}>{t('kyCameraAccessBody')}</Text>
        <TouchableOpacity style={st.permBtn} onPress={requestPermission}>
          <Text style={st.permBtnText}>{t('kyAllowCamera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.galleryFallbackBtn} onPress={handleGallery}>
          <Ionicons name="images-outline" size={17} color="#00C8A0" />
          <Text style={st.galleryFallbackText}>{t('kyChooseFromGallery')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Vista previa (foto ya capturada) ──────────────────────────────────────
  if (previewUri) {
    return (
      <View style={st.wrap}>
        <View style={st.previewContainer}>
          <Image source={{ uri: previewUri }} style={st.previewImage} resizeMode="cover" />
          <View style={[st.previewBadge, qualityTip ? st.previewBadgeError : undefined]}>
            <Ionicons
              name={qualityTip ? 'warning-outline' : 'checkmark-circle'}
              size={18}
              color={qualityTip ? '#f59e0b' : '#10b981'}
            />
            <Text style={[st.previewBadgeText, qualityTip ? st.previewBadgeTextError : undefined]}>
              {qualityTip ?? sideCaptured}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={st.retakeBtn} onPress={handleRetake}>
          <Ionicons name="refresh" size={16} color="#374151" />
          <Text style={st.retakeBtnText}>{t('kyRetake')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Cámara activa ─────────────────────────────────────────────────────────
  return (
    <View style={st.wrap}>
      <View style={st.cameraWrap}>
        <CameraView ref={cameraRef} style={st.camera} facing="back">
          {/* Marco guía */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 200">
            <Path d="M 40 20 L 20 20 L 20 40"   stroke="#00C8A0" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <Path d="M 260 20 L 280 20 L 280 40" stroke="#00C8A0" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <Path d="M 20 160 L 20 180 L 40 180" stroke="#00C8A0" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <Path d="M 280 160 L 280 180 L 260 180" stroke="#00C8A0" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </Svg>
        </CameraView>

        {qualityTip && (
          <View style={st.tipBanner}>
            <Ionicons name="warning-outline" size={14} color="#fbbf24" />
            <Text style={st.tipText}>{qualityTip}</Text>
          </View>
        )}

        {processing && (
          <View style={st.processingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={st.processingText}>{t('kyProcessingEllipsis')}</Text>
          </View>
        )}
      </View>

      <Text style={st.hint}>{t('kyPlaceDocumentInFrame')}</Text>

      {/* Botones de acción */}
      <View style={st.actions}>
        {/* Capturar con cámara */}
        <TouchableOpacity
          style={[st.captureBtn, processing && st.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={processing}
          accessibilityLabel={sideCaptureAct}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={st.captureBtnText}>
            {processing ? t('kyProcessingEllipsis') : sideCaptureAct}
          </Text>
        </TouchableOpacity>

        {/* Elegir desde galería */}
        <TouchableOpacity
          style={[st.galleryBtn, processing && st.captureBtnDisabled]}
          onPress={handleGallery}
          disabled={processing}
          accessibilityLabel={t('kyGalleryA11y')}
        >
          <Ionicons name="images-outline" size={18} color="#374151" />
          <Text style={st.galleryBtnText}>{t('kyChooseFromGallery')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:               { marginTop: 8, gap: 10 },

  // Cámara
  cameraWrap:         { borderRadius: 16, overflow: 'hidden', height: 220, backgroundColor: '#000' },
  camera:             { flex: 1 },
  tipBanner:          {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 10,
    padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tipText:            { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  processingOverlay:  {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  processingText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  hint:               { fontSize: 12, color: '#6b7280', textAlign: 'center' },

  // Botones
  actions:            { gap: 10 },
  captureBtn:         {
    backgroundColor: '#00C8A0', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    shadowColor: '#00C8A0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  captureBtnDisabled: { backgroundColor: '#d1d5db', shadowOpacity: 0 },
  captureBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },

  galleryBtn:         {
    paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#d1d5db',
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff',
  },
  galleryBtnText:     { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Vista previa
  previewContainer:   { borderRadius: 16, overflow: 'hidden', height: 220, backgroundColor: '#000' },
  previewImage:       { width: '100%', height: '100%' },
  previewBadge:       {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
  },
  previewBadgeError:  {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  previewBadgeText:      { color: '#065f46', fontSize: 13, fontWeight: '700', flex: 1 },
  previewBadgeTextError: { color: '#92400e' },
  retakeBtn:          {
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db',
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  retakeBtnText:      { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Permiso
  permWrap:           { padding: 24, alignItems: 'center', gap: 14 },
  permText:           { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 20 },
  permBtn:            {
    backgroundColor: '#00C8A0', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12,
  },
  permBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },
  galleryFallbackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#d1d5db',
  },
  galleryFallbackText:{ color: '#00C8A0', fontWeight: '600', fontSize: 14 },
});
