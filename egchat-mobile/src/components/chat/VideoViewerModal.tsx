/**
 * VideoViewerModal — Visor de video a pantalla completa desde el chat.
 * - Controles: play/pause, seek bar, mute, descargar, compartir, cerrar
 * - Descarga con expo-file-system + share sheet con expo-sharing
 * - Fondo negro inmersivo
 * - Compatible iOS + Android + Web (fallback con <video>)
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path, Polyline, Rect, Circle } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ── Iconos SVG inline ────────────────────────────────────────────

const IcoClose = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const IcoPlay = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="#fff">
    <Path d="M5 3l14 9-14 9V3z" />
  </Svg>
);

const IcoPause = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="#fff">
    <Rect x="6" y="4" width="4" height="16" rx="1" />
    <Rect x="14" y="4" width="4" height="16" rx="1" />
  </Svg>
);

const IcoReplay = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="1 4 1 10 7 10" />
    <Path d="M3.51 15a9 9 0 1 0 .49-4.5" />
  </Svg>
);

const IcoMute = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <Line x1="23" y1="9" x2="17" y2="15" />
    <Line x1="17" y1="9" x2="23" y2="15" />
  </Svg>
);

const IcoVolume = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Svg>
);

const IcoDownload = ({ downloading }: { downloading?: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={downloading ? '#00c8a0' : '#fff'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

const IcoShare = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);

// ── Helpers ──────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── Seek bar ─────────────────────────────────────────────────────

interface SeekBarProps {
  position: number; // ms
  duration: number; // ms
  onSeek: (ms: number) => void;
}

function SeekBar({ position, duration, onSeek }: SeekBarProps) {
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const barWidth = W - 32;

  return (
    <TouchableWithoutFeedback
      onPress={(e) => {
        const x = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(x / barWidth, 1));
        onSeek(ratio * duration);
      }}
    >
      <View style={sb.track}>
        <View style={[sb.fill, { width: `${progress * 100}%` }]} />
        <View style={[sb.thumb, { left: `${progress * 100}%` as any }]} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const sb = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginHorizontal: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    height: 4,
    backgroundColor: '#00c8a0',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    position: 'absolute',
    marginLeft: -7,
    top: -5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
});

// ── Props ────────────────────────────────────────────────────────

export interface VideoViewerModalProps {
  visible: boolean;
  uri: string;
  title?: string;
  onClose: () => void;
}

// ── Componente principal ─────────────────────────────────────────

export function VideoViewerModal({ visible, uri, title, onClose }: VideoViewerModalProps) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<any>(null);

  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  // Fade de controles
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsTemporarily = useCallback(() => {
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) {
        Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowControls(false));
      }
    }, 3000);
  }, [playing, controlsOpacity]);

  useEffect(() => {
    if (playing) showControlsTemporarily();
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setShowControls(true);
    }
  }, [playing]);

  // Resetear estado al abrir/cerrar
  useEffect(() => {
    if (!visible) {
      setPlaying(false);
      setFinished(false);
      setPosition(0);
      setDuration(0);
      setLoading(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [visible]);

  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (finished) {
        await videoRef.current.replayAsync();
        setFinished(false);
        setPlaying(true);
      } else if (playing) {
        await videoRef.current.pauseAsync();
        setPlaying(false);
      } else {
        const { Audio } = require('expo-av');
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });
        await videoRef.current.playAsync();
        setPlaying(true);
      }
    } catch {}
  }, [playing, finished]);

  const handleSeek = useCallback(async (ms: number) => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setPositionAsync(ms);
      setPosition(ms);
    } catch {}
  }, []);

  const handleStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;
    setLoading(false);
    setPlaying(status.isPlaying);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    if (status.didJustFinish) {
      setPlaying(false);
      setFinished(true);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setIsMutedAsync(!muted);
      setMuted(m => !m);
    } catch {}
  }, [muted]);

  // Descarga el video al almacenamiento local y ofrece guardarlo
  const handleDownload = useCallback(async () => {
    if (downloading || !uri) return;
    setDownloading(true);
    try {
      const FileSystem = require('expo-file-system');
      const ext = uri.split('?')[0].split('.').pop() || 'mp4';
      const fileName = `egchat_video_${Date.now()}.${ext}`;
      const localUri = FileSystem.documentDirectory + fileName;

      const result = await FileSystem.downloadAsync(uri, localUri);

      if (result.status === 200) {
        setDownloadDone(true);
        // Intentar guardar en galería si expo-media-library está disponible
        try {
          const MediaLibrary = require('expo-media-library');
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(result.uri);
            Alert.alert('✅ Guardado', 'El video se guardó en tu galería de fotos.');
            return;
          }
        } catch {}
        // Sin media-library: abrir share sheet para que el usuario lo guarde
        const Sharing = require('expo-sharing');
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: 'video/mp4',
            dialogTitle: 'Guardar video',
            UTI: 'com.apple.quicktime-movie',
          });
        } else {
          Alert.alert('Video descargado', `Guardado en: ${fileName}`);
        }
      } else {
        Alert.alert('Error', 'No se pudo descargar el video.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el video.');
    } finally {
      setDownloading(false);
    }
  }, [uri, downloading]);

  // Compartir video directamente con el share sheet del sistema
  const handleShare = useCallback(async () => {
    if (!uri) return;
    try {
      const Sharing = require('expo-sharing');
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Compartir no disponible', 'Esta función no está disponible en este dispositivo.');
        return;
      }
      // Descargar primero a archivo local para poder compartir
      const FileSystem = require('expo-file-system');
      const ext = uri.split('?')[0].split('.').pop() || 'mp4';
      const localUri = FileSystem.cacheDirectory + `share_video_${Date.now()}.${ext}`;
      const result = await FileSystem.downloadAsync(uri, localUri);
      if (result.status === 200) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'video/mp4',
          dialogTitle: 'Compartir video',
          UTI: 'com.apple.quicktime-movie',
        });
      }
    } catch {
      Alert.alert('Error', 'No se pudo compartir el video.');
    }
  }, [uri]);

  // ── Web fallback ─────────────────────────────────────────────

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={[s.root, { paddingTop: insets.top }]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <IcoClose />
          </TouchableOpacity>
          {title ? <Text style={[s.title, { top: insets.top + 8 }]}>{title}</Text> : null}
          <View style={s.videoArea}>
            {/* @ts-ignore */}
            <video
              src={uri}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: H * 0.85, backgroundColor: '#000', borderRadius: 0 }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // ── Nativo ───────────────────────────────────────────────────

  const { Video } = require('expo-av');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={showControlsTemporarily}>
        <View style={s.root}>
          {/* Video */}
          <Video
            ref={videoRef}
            source={{ uri }}
            style={s.video}
            resizeMode="contain"
            shouldPlay={false}
            isMuted={muted}
            onPlaybackStatusUpdate={handleStatusUpdate}
            onReadyForDisplay={() => setLoading(false)}
          />

          {/* Spinner de carga */}
          {loading && (
            <View style={s.loadingOverlay}>
              <ActivityIndicator size="large" color="#00c8a0" />
            </View>
          )}

          {/* Controles superpuestos */}
          <Animated.View style={[s.controls, { opacity: controlsOpacity }]} pointerEvents={showControls ? 'box-none' : 'none'}>

            {/* Barra superior: cerrar + título */}
            <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={s.iconBtn} onPress={onClose} activeOpacity={0.7}>
                <IcoClose />
              </TouchableOpacity>
              {title ? (
                <Text style={s.title} numberOfLines={1}>{title}</Text>
              ) : null}
              <TouchableOpacity style={s.iconBtn} onPress={toggleMute} activeOpacity={0.7}>
                {muted ? <IcoMute /> : <IcoVolume />}
              </TouchableOpacity>
            </View>

            {/* Botón play central */}
            <TouchableOpacity style={s.playCenter} onPress={handlePlayPause} activeOpacity={0.8}>
              <View style={s.playBtnCircle}>
                {finished ? <IcoReplay /> : playing ? <IcoPause /> : <IcoPlay />}
              </View>
            </TouchableOpacity>

            {/* Barra inferior: tiempo + seek */}
            <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
              <SeekBar position={position} duration={duration} onSeek={handleSeek} />
              <View style={s.timeRow}>
                <Text style={s.timeText}>{formatDuration(position)}</Text>
                <Text style={s.timeText}>{formatDuration(duration)}</Text>
              </View>
            </View>

          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: W,
    height: H,
    position: 'absolute',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  playCenter: {
    alignSelf: 'center',
  },
  playBtnCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 0,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  videoArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});
