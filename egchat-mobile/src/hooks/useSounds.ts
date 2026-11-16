// useSounds.ts — Sistema de sonidos EGCHAT con audio real (expo-av)
import { Audio, InterruptionModeIOS } from 'expo-av';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
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
    if (settings.messageTone !== undefined && settings.messageTone !== current.messageTone) {
      await installIosPushSound();
    }
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

// iOS no puede callar un push desde el payload, así que "sin sonido" se
// materializa como un WAV de silencio con el nombre que el push pide.
const SILENT_ASSET = require('../../assets/silence.wav');

function getMessageAsset(toneId: string): any {
  return MESSAGE_TONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

function getRingtoneAsset(toneId: string): any {
  return RINGTONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

function getNotificationAsset(toneId: string): any {
  return NOTIFICATION_TONE_ASSETS[toneId] ?? FALLBACK_ASSET;
}

// ── Sonido de las notificaciones push en iOS ──────────────────────
// iOS solo reproduce un sonido personalizado de un push remoto si el archivo
// está en el bundle de la app o en Library/Sounds del contenedor. Los assets
// de Metro no están en ninguna de las dos rutas, así que se copia el tono
// elegido al contenedor con un nombre fijo que el backend pide en `sound`.
export const IOS_PUSH_SOUND_FILE = 'egchat-message.wav';

export const installIosPushSound = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  try {
    const s = await getSoundSettings();
    const module = s.messageTone === 'none' ? SILENT_ASSET : getMessageAsset(s.messageTone);
    const [asset] = await Asset.loadAsync([module]);
    const sourceUri = asset.localUri ?? asset.uri;
    if (!sourceUri) return;

    // cacheDirectory = <container>/Library/Caches/
    // Su carpeta padre = <container>/Library/
    // Library/Sounds/ es el directorio que iOS usa para sonidos de push personalizados.
    const cacheDir = FileSystem.cacheDirectory ?? '';
    // Quitar el segmento "Caches/" final para llegar a Library/
    const libraryDir = cacheDir.endsWith('Caches/')
      ? cacheDir.slice(0, -'Caches/'.length)
      : cacheDir.replace(/[^/]+\/?$/, '');
    const soundsDir = `${libraryDir}Sounds/`;
    const targetUri = `${soundsDir}${IOS_PUSH_SOUND_FILE}`;

    const dirInfo = await FileSystem.getInfoAsync(soundsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
    }

    const targetInfo = await FileSystem.getInfoAsync(targetUri);
    if (targetInfo.exists) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  } catch (e) {
    console.warn('[installIosPushSound] error:', e);
  }
};

// ── Audio mode ────────────────────────────────────────────────────
let _audioModeReady = false;
const setupAudioMode = async () => {
  if (Platform.OS === 'web') return;
  // Después de un reinicio por OTA el bridge nativo puede no estar listo.
  // Esperar 500 ms antes del primer intento y reintentar una vez si falla.
  const trySetup = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  };
  if (_audioModeReady) return;
  try {
    await trySetup();
    _audioModeReady = true;
  } catch {
    // Reintento diferido: el bridge puede no estar listo tras un reinicio de OTA
    await new Promise(r => setTimeout(r, 800));
    try { await trySetup(); _audioModeReady = true; } catch {}
  }
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
// Token de sesión: si cambia durante la preparación o createAsync, se cancela el inicio
let ringtoneSessionToken = 0;

export const startRingtone = async () => {
  if (Platform.OS === 'web') return;
  const stopping = stopRingtone();
  const myToken = ringtoneSessionToken;
  await stopping;
  if (ringtoneSessionToken !== myToken) return;
  try {
    const s = await getSoundSettings();
    if (ringtoneSessionToken !== myToken || s.ringtone === 'none') return;

    // Solo vibración — sin audio
    if (s.ringtone === 'vibrate_only') {
      const vibLoop = async () => {
        if (ringtoneSessionToken !== myToken) return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      };
      await vibLoop();
      if (ringtoneSessionToken !== myToken) return;
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
    if (ringtoneSessionToken !== myToken) return;

    const asset = getRingtoneAsset(s.ringtone);
    // El guard pertenece a esta sesión; una creación vieja no puede liberar el de otra.
    let isCreating = false;

    const play = async () => {
      if (isCreating || ringtoneSessionToken !== myToken) return;
      isCreating = true;
      try {
        if (s.vibrationEnabled) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          if (ringtoneSessionToken !== myToken) return;
        }
        // Separar la referencia antes de esperar para no tocar otra sesión al terminar.
        const previousSound = ringtoneSound;
        ringtoneSound = null;
        if (previousSound) {
          await previousSound.unloadAsync().catch(() => {});
        }
        if (ringtoneSessionToken !== myToken) return;
        const { sound } = await Audio.Sound.createAsync(
          asset,
          { shouldPlay: true, volume: s.volume, isLooping: false }
        );
        // createAsync no es cancelable: liberar sólo su resultado si la sesión cambió.
        if (ringtoneSessionToken !== myToken) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        } else {
          ringtoneSound = sound;
        }
      } catch (e) {
        if (__DEV__) console.warn('[useSounds] startRingtone play error:', e);
      } finally {
        isCreating = false;
      }
    };

    await play();
    // Solo iniciar el interval si esta sesión sigue activa
    if (ringtoneSessionToken === myToken) {
      ringtoneInterval = setInterval(play, 3000);
    }
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
  // Invalidar también los inicios que aún esperan la limpieza de la sesión anterior.
  const myToken = ++ringtoneSessionToken;
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
  const sound = ringtoneSound;
  ringtoneSound = null;
  try {
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
    // No restaurar el modo de audio de una sesión más reciente.
    if (ringtoneSessionToken === myToken && Platform.OS !== 'web') {
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

// ── Tono de marcación (caller esperando respuesta) ────────────────
// Usa classic.wav en loop mientras el caller espera que contesten.
let dialingSound: Audio.Sound | null = null;
let dialingSessionToken = 0;

export const startDialingTone = async () => {
  const stopping = stopDialingTone();
  const myToken = dialingSessionToken;
  await stopping;
  if (dialingSessionToken !== myToken || Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    if (dialingSessionToken !== myToken) return;
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/classic.wav'),
      { shouldPlay: true, volume: 0.6, isLooping: true },
    );
    if (dialingSessionToken !== myToken) {
      // stopDialingTone fue llamado mientras createAsync estaba en vuelo
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
      return;
    }
    dialingSound = sound;
  } catch (e) {
    if (__DEV__) console.warn('[useSounds] startDialingTone error:', e);
  }
};

export const stopDialingTone = async () => {
  dialingSessionToken++;
  const sound = dialingSound;
  dialingSound = null;
  try {
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
  } catch {}
};

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
