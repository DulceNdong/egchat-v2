// useSounds.ts — Sistema de sonidos EGCHAT con audio real (expo-av)
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SoundSettings {
  messageTone: string;
  ringtone: string;
  notificationTone: string;
  volume: number;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  messageTone: 'egchat',
  ringtone: 'classic',
  notificationTone: 'pop',
  volume: 0.7,
  vibrationEnabled: true,
};

const STORAGE_KEY = 'egchat_sound_settings';

export const getSoundSettings = async (): Promise<SoundSettings> => {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

export const saveSoundSettings = async (settings: Partial<SoundSettings>) => {
  try {
    const current = await getSoundSettings();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
};

// ── Audio mode ────────────────────────────────────────────────────
const setupAudioMode = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,   // No sonar en silencio para mensajes
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {}
};

// ── Cache de sonidos cargados ─────────────────────────────────────
const soundCache: Record<string, Audio.Sound> = {};

async function playAsset(asset: any, volume = 0.7): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await setupAudioMode();
    const { sound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: true,
      volume,
      isMuted: false,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {}
}

// ── Sonido de mensaje recibido ────────────────────────────────────
// Usa el archivo notification.wav incluido en los assets
export const playMessageReceived = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reproducir el tono de notificación del sistema assets/notification.wav
    await playAsset(require('../../assets/notification.wav'), s.volume);
  } catch {}
};

export const playMessageSent = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Sonido suave de "pop" para mensaje enviado
    await playAsset(require('../../assets/notification.wav'), s.volume * 0.4);
  } catch {}
};

// ── Notificación general ──────────────────────────────────────────
export const playNotification = async () => {
  try {
    const s = await getSoundSettings();
    if (s.notificationTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playAsset(require('../../assets/notification.wav'), s.volume);
  } catch {}
};

// ── Llamadas ──────────────────────────────────────────────────────
let ringtoneSound: Audio.Sound | null = null;
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

export const startRingtone = async () => {
  await stopRingtone();
  if (Platform.OS === 'web') return;
  try {
    const s = await getSoundSettings();
    if (s.ringtone === 'none') return;

    // Modo llamada — sonar aunque esté en silencio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,   // ← sonar en modo silencio durante llamadas
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const play = async () => {
      if (s.vibrationEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      try {
        if (ringtoneSound) { await ringtoneSound.unloadAsync(); ringtoneSound = null; }
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/notification.wav'),
          { shouldPlay: true, volume: s.volume, isLooping: false }
        );
        ringtoneSound = sound;
      } catch {}
    };

    await play();
    // Repetir cada 3 segundos
    ringtoneInterval = setInterval(play, 3000);
  } catch {}
};

export const stopRingtone = async () => {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
  try {
    if (ringtoneSound) {
      await ringtoneSound.stopAsync();
      await ringtoneSound.unloadAsync();
      ringtoneSound = null;
    }
    // Restaurar modo audio normal
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
      }).catch(() => {});
    }
  } catch {}
};

export const playCallConnected = async () => {
  try {
    await stopRingtone();
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

export const playCallEnded = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};

export const startDialingTone = async () => {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
};
export const stopDialingTone = () => {};

// ── Feedback de UI ────────────────────────────────────────────────
export const playError = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
};

export const playSuccess = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

export const vibrate = async (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const s = await getSoundSettings();
    if (!s.vibrationEnabled) return;
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(map[pattern]);
  } catch {}
};

// ── Catálogos ─────────────────────────────────────────────────────
export const MESSAGE_TONES = [
  { id: 'egchat',  name: 'EGCHAT' },
  { id: 'notif',   name: 'Notificación' },
  { id: 'ding',    name: 'Ding' },
  { id: 'chime',   name: 'Chime' },
  { id: 'pop',     name: 'Pop' },
  { id: 'bubble',  name: 'Burbuja' },
  { id: 'none',    name: 'Sin sonido' },
];

export const RINGTONES = [
  { id: 'classic',      name: 'Clásico' },
  { id: 'modern',       name: 'Moderno' },
  { id: 'digital',      name: 'Digital' },
  { id: 'marimba',      name: 'Marimba' },
  { id: 'vibrate_only', name: 'Solo vibración' },
  { id: 'none',         name: 'Sin tono' },
];

export const NOTIFICATION_TONES = [
  { id: 'pop',    name: 'Pop' },
  { id: 'ding',   name: 'Ding' },
  { id: 'chime',  name: 'Chime' },
  { id: 'bubble', name: 'Burbuja' },
  { id: 'none',   name: 'Sin sonido' },
];
