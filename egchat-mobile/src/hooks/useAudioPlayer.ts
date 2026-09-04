/**
 * useAudioPlayer — Reproductor de audio global singleton
 *
 * Por qué singleton: expo-av descarga el sonido al desmontar el componente.
 * Con este manager el audio continúa reproduciéndose cuando el usuario
 * sale del chat, exactamente como WhatsApp.
 *
 * Uso:
 *   const player = useAudioPlayer();
 *   await player.play(uri);          // carga y reproduce
 *   await player.pause();
 *   await player.seek(0.5);          // 0-1, posición relativa
 *   await player.setSpeed(1.5);
 *   player.onProgress(cb);           // cb({ position, duration, progress })
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type AudioPlayerState = {
  uri: string;
  playing: boolean;
  position: number;   // segundos
  duration: number;   // segundos
  progress: number;   // 0–1
  speed: 1 | 1.5 | 2;
};

type ProgressCallback = (state: AudioPlayerState) => void;
type StatusCallback = (playing: boolean) => void;

// ── Singleton interno ─────────────────────────────────────────────
class GlobalAudioPlayer {
  private sound: Audio.Sound | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private state: AudioPlayerState = {
    uri: '', playing: false, position: 0, duration: 0, progress: 0, speed: 1,
  };
  private progressCbs = new Set<ProgressCallback>();
  private statusCbs = new Set<StatusCallback>();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private readonly isWeb = typeof document !== 'undefined';

  private emit() {
    const s = { ...this.state };
    this.progressCbs.forEach(cb => cb(s));
  }

  private emitStatus(playing: boolean) {
    this.statusCbs.forEach(cb => cb(playing));
  }

  // Suscribirse al progreso (posición, duración, progress)
  onProgress(cb: ProgressCallback): () => void {
    this.progressCbs.add(cb);
    cb({ ...this.state }); // emitir estado actual inmediatamente
    return () => this.progressCbs.delete(cb);
  }

  // Suscribirse a cambios de playing/paused
  onStatus(cb: StatusCallback): () => void {
    this.statusCbs.add(cb);
    return () => this.statusCbs.delete(cb);
  }

  get currentUri() { return this.state.uri; }
  get isPlaying()  { return this.state.playing; }
  get currentSpeed() { return this.state.speed; }

  async play(uri: string, speed: 1 | 1.5 | 2 = 1): Promise<void> {
    if (this.isWeb) {
      await this.playWeb(uri, speed);
    } else {
      await this.playNative(uri, speed);
    }
  }

  // ── Web ────────────────────────────────────────────────────────
  private async playWeb(uri: string, speed: 1 | 1.5 | 2): Promise<void> {
    // Si es el mismo URI, toggle pause/play
    if (this.audioEl && this.state.uri === uri) {
      if (this.state.playing) {
        this.audioEl.pause();
        this.state.playing = false;
        this.emitStatus(false);
        this.emit();
      } else {
        this.audioEl.playbackRate = speed;
        await this.audioEl.play().catch(() => {});
        this.state.playing = true;
        this.state.speed = speed;
        this.emitStatus(true);
        this.emit();
      }
      return;
    }

    // Nuevo URI: limpiar anterior
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    if (this.updateInterval) { clearInterval(this.updateInterval); this.updateInterval = null; }

    this.state = { uri, playing: false, position: 0, duration: 0, progress: 0, speed };

    const el = new (window as any).Audio(uri) as HTMLAudioElement;
    el.preload = 'metadata';
    el.playbackRate = speed;

    el.onloadedmetadata = () => {
      this.state.duration = el.duration;
      this.emit();
    };

    el.ontimeupdate = () => {
      this.state.position = el.currentTime;
      this.state.duration = el.duration || this.state.duration;
      this.state.progress = this.state.duration ? el.currentTime / this.state.duration : 0;
      this.emit();
    };

    el.onended = () => {
      this.state.playing = false;
      this.state.position = 0;
      this.state.progress = 0;
      el.currentTime = 0;
      this.emitStatus(false);
      this.emit();
    };

    this.audioEl = el;
    await el.play().catch(() => {});
    this.state.playing = true;
    this.emitStatus(true);
    this.emit();
  }

  // ── Nativo ─────────────────────────────────────────────────────
  private async playNative(uri: string, speed: 1 | 1.5 | 2): Promise<void> {
    // Toggle si mismo URI
    if (this.sound && this.state.uri === uri) {
      try {
        const st = await this.sound.getStatusAsync();
        if (st.isLoaded) {
          if (st.isPlaying) {
            await this.sound.pauseAsync();
            this.state.playing = false;
            this.emitStatus(false);
            this.emit();
          } else {
            await this.sound.setRateAsync(speed, true);
            await this.sound.playAsync();
            this.state.playing = true;
            this.state.speed = speed;
            this.emitStatus(true);
            this.emit();
          }
          return;
        }
      } catch {}
    }

    // Nuevo URI: limpiar anterior
    await this.stopNative();

    this.state = { uri, playing: false, position: 0, duration: 0, progress: 0, speed };

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: true, // ← continuar en background
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: speed, shouldCorrectPitch: true, volume: 1 },
        (status) => {
          if (!status.isLoaded) return;
          const dur = (status.durationMillis ?? 0) / 1000;
          const pos = (status.positionMillis ?? 0) / 1000;
          const prev = { ...this.state };

          this.state.duration = dur;
          this.state.position = pos;
          this.state.progress = dur > 0 ? pos / dur : 0;
          this.state.playing  = status.isPlaying;

          if (status.didJustFinish) {
            this.state.playing  = false;
            this.state.position = 0;
            this.state.progress = 0;
            sound.setPositionAsync(0).catch(() => {});
            this.emitStatus(false);
          } else if (prev.playing !== status.isPlaying) {
            this.emitStatus(status.isPlaying);
          }

          this.emit();
        },
      );

      this.sound = sound;
      this.state.playing = true;
      this.emitStatus(true);
      this.emit();
    } catch (e) {
      console.warn('[AudioPlayer] playNative error:', e);
    }
  }

  private async stopNative() {
    if (this.updateInterval) { clearInterval(this.updateInterval); this.updateInterval = null; }
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }
  }

  async pause(): Promise<void> {
    if (this.isWeb) {
      this.audioEl?.pause();
    } else if (this.sound) {
      try { await this.sound.pauseAsync(); } catch {}
    }
    this.state.playing = false;
    this.emitStatus(false);
    this.emit();
  }

  async stop(): Promise<void> {
    if (this.isWeb) {
      if (this.audioEl) { this.audioEl.pause(); this.audioEl.currentTime = 0; }
    } else {
      await this.stopNative();
    }
    this.state = { ...this.state, playing: false, position: 0, progress: 0 };
    this.emitStatus(false);
    this.emit();
  }

  /**
   * Seek a una posición relativa (0–1).
   * En nativo usa setPositionAsync; en web, currentTime.
   */
  async seek(ratio: number): Promise<void> {
    const r = Math.max(0, Math.min(1, ratio));
    if (this.isWeb && this.audioEl) {
      this.audioEl.currentTime = r * (this.audioEl.duration || 0);
    } else if (this.sound) {
      try {
        const st = await this.sound.getStatusAsync();
        if (st.isLoaded && st.durationMillis) {
          await this.sound.setPositionAsync(r * st.durationMillis);
        }
      } catch {}
    }
    this.state.progress = r;
    this.state.position = r * this.state.duration;
    this.emit();
  }

  async setSpeed(speed: 1 | 1.5 | 2): Promise<void> {
    this.state.speed = speed;
    if (this.isWeb && this.audioEl) {
      this.audioEl.playbackRate = speed;
    } else if (this.sound) {
      try { await this.sound.setRateAsync(speed, true); } catch {}
    }
  }
}

// Instancia global singleton
export const audioPlayer = new GlobalAudioPlayer();

// ── Hook React ────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

export function useAudioPlayer(uri: string) {
  const [state, setState] = useState<AudioPlayerState>({
    uri, playing: false, position: 0, duration: 0, progress: 0, speed: 1,
  });

  const isCurrentUri = uri === audioPlayer.currentUri;

  useEffect(() => {
    // Suscribir solo si este URI es el activo
    const unsub = audioPlayer.onProgress((s) => {
      if (s.uri === uri) setState(s);
      else if (s.uri !== uri && uri === audioPlayer.currentUri) {
        // El player cambió a otro URI — resetear este
        setState(prev => ({ ...prev, playing: false, position: 0, progress: 0 }));
      }
    });
    return unsub;
  }, [uri]);

  const togglePlay = useCallback(async () => {
    await audioPlayer.play(uri, state.speed);
  }, [uri, state.speed]);

  const cycleSpeed = useCallback(async () => {
    const steps: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const next = steps[(steps.indexOf(state.speed) + 1) % steps.length];
    setState(prev => ({ ...prev, speed: next }));
    await audioPlayer.setSpeed(next);
  }, [state.speed]);

  const seek = useCallback(async (ratio: number) => {
    if (audioPlayer.currentUri !== uri) return;
    await audioPlayer.seek(ratio);
  }, [uri]);

  return {
    playing: isCurrentUri && state.playing,
    position: isCurrentUri ? state.position : 0,
    duration: isCurrentUri ? state.duration : state.duration,
    progress: isCurrentUri ? state.progress : 0,
    speed: state.speed,
    togglePlay,
    cycleSpeed,
    seek,
  };
}
