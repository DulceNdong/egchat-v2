// useSounds.ts — Sistema de sonidos EGCHAT con audio real (expo-av)
import { Audio, InterruptionModeIOS } from 'expo-av';
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

// ── Mapeo de IDs de tono → asset ──────────────────────────────────
// Cada tono tiene su propio archivo WAV en assets/
const MESSAGE_TONE_ASSETS: Record<string, any> = {
  egchat:  require('../../assets/egchat.wav'),
  notif:   require('../../assets/notif.wav'),
  ding:    require('../../assets/ding.wav'),
  chime:   require('../../assets/chime.wav'),
  pop:     require('../../assets/pop.wav'),
  bubble:  require('../../assets/bubble.wav'),
};

const RINGTONE_ASSETS: Record<string, any> = {
  classic:  require('../../assets/classic.wav'),
  modern:   require('../../assets/modern.wav'),
  digital:  require('../../assets/digital.wav'),
  marimba:  require('../../assets/marimba.wav'),
  // vibrate_only y none no tienen asset — se manejan con lógica especial
};

// Los tonos de notificación reutilizan el mismo conjunto que mensajes
const NOTIFICATION_TONE_ASSETS: Record<string, any> = {
  pop:    require('../../assets/pop.wav'),
  ding:   require('../../assets/ding.wav'),
  chime:  require('../../assets/chime.wav'),
  bubble: require('../../assets/bubble.wav'),
};

/** Fallback si el ID no está en el mapa */
const FALLBACK_ASSET = require('../../assets/notification.wav');

function getMessageAsset(toneId: string): any {
  return MESSAGE_TONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

function getRingtoneAsset(toneId: string): any {
  return RINGTONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

function getNotificationAsset(toneId: string): any {
  return NOTIFICATION_TONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

// ── Audio mode ────────────────────────────────────────────────────
const setupAudioMode = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,    // Sonar también con el modo silencio activado
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  } catch {}
};

// ── Cache de sonidos cargados ─────────────────────────────────────
const soundCache: Record<string, Audio.Sound> = {};
const activeSounds = new Set<Audio.Sound>();

function retainSound(key: string, sound: Audio.Sound) {
  activeSounds.add(sound);
  soundCache[key] = sound;
}

async function releaseSound(key: string) {
  const sound = soundCache[key];
  if (!sound) return;          // ya liberado — evitar double-free
  activeSounds.delete(sound);
  delete soundCache[key];
  try { await sound.unloadAsync(); } catch {}
}

// Tiempo máximo para liberar un sonido aunque didJustFinish nunca dispare
const SOUND_TIMEOUT_MS = 10_000;

async function playAsset(asset: any, volume = 0.7): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await setupAudioMode();
    const key = `snd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { sound } = await Audio.Sound.createAsync(asset, {
      shouldPlay: true,
      volume,
      isMuted: false,
    });
    retainSound(key, sound);

    // Liberar cuando el sonido termina naturalmente
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        releaseSound(key).catch(() => {});
      }
    });

    // Safety timeout: liberar si didJustFinish nunca dispara (ej. app en background)
    setTimeout(() => {
      releaseSound(key).catch(() => {});
    }, SOUND_TIMEOUT_MS);
  } catch (e) {
    if (__DEV__) console.warn('[useSounds] playAsset error:', e);
  }
}

// ── Sonido de mensaje recibido ────────────────────────────────────
export const playMessageReceived = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playAsset(getMessageAsset(s.messageTone), s.volume);
  } catch {}
};

export const previewMessageTone = async (toneId?: string) => {
  try {
    const s = await getSoundSettings();
    const id = toneId ?? s.messageTone;
    if (id === 'none') return;
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playAsset(getMessageAsset(id), s.volume);
  } catch {}
};

export const playMessageSent = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    // Mensaje enviado: mismo tono pero más suave
    await playAsset(getMessageAsset(s.messageTone), s.volume * 0.45);
  } catch {}
};

// ── Notificación general ──────────────────────────────────────────
export const playNotification = async () => {
  try {
    const s = await getSoundSettings();
    if (s.notificationTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playAsset(getNotificationAsset(s.notificationTone), s.volume);
  } catch {}
};

export const previewNotificationTone = async (toneId?: string) => {
  try {
    const s = await getSoundSettings();
    const id = toneId ?? s.notificationTone;
    if (id === 'none') return;
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playAsset(getNotificationAsset(id), s.volume);
  } catch {}
};

// ── Llamadas ──────────────────────────────────────────────────────
let ringtoneSound: Audio.Sound | null = null;
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;
// Guard para evitar solapamiento de createAsync en el intervalo
let ringtoneIsCreating = false;

export const startRingtone = async () => {
  await stopRingtone();
  if (Platform.OS === 'web') return;
  try {
    const s = await getSoundSettings();
    if (s.ringtone === 'none') return;

    // Solo vibración — sin audio
    if (s.ringtone === 'vibrate_only') {
      const vibLoop = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      };
      await vibLoop();
      ringtoneInterval = setInterval(vibLoop, 1500);
      return;
    }

    // Modo llamada — sonar aunque esté en silencio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const asset = getRingtoneAsset(s.ringtone);

    const play = async () => {
      // Evitar llamadas concurrentes a createAsync
      if (ringtoneIsCreating) return;
      ringtoneIsCreating = true;
      try {
        if (s.vibrationEnabled) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
        if (ringtoneSound) {
          await ringtoneSound.unloadAsync().catch(() => {});
          ringtoneSound = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          asset,
          { shouldPlay: true, volume: s.volume, isLooping: false }
        );
        ringtoneSound = sound;
      } catch (e) {
        if (__DEV__) console.warn('[useSounds] startRingtone play error:', e);
      } finally {
        ringtoneIsCreating = false;
      }
    };

    await play();
    ringtoneInterval = setInterval(play, 3000);
  } catch {}
};

export const previewRingtone = async (toneId?: string) => {
  try {
    const s = await getSoundSettings();
    const id = toneId ?? s.ringtone;

    if (id === 'none') return;

    if (id === 'vibrate_only') {
      if (s.vibrationEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const asset = getRingtoneAsset(id);
    const key = `preview-ringtone-${Date.now()}`;
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, volume: s.volume, isLooping: false }
    );
    retainSound(key, sound);

    // Liberar cuando termina naturalmente
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        releaseSound(key).catch(() => {});
      }
    });

    // Auto-stop después de 3 segundos (releaseSound es idempotente — no double-free)
    setTimeout(() => {
      sound.stopAsync().catch(() => {});
      releaseSound(key).catch(() => {});
    }, 3000);
  } catch {}
};

export const stopRingtone = async () => {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
  ringtoneIsCreating = false;
  try {
    if (ringtoneSound) {
      await ringtoneSound.stopAsync().catch(() => {});
      await ringtoneSound.unloadAsync().catch(() => {});
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
      light:  Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy:  Haptics.ImpactFeedbackStyle.Heavy,
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
