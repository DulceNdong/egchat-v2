// useSounds.ts — Sistema de sonidos para EGCHAT usando Web Audio API
// Sin archivos externos — genera todos los tonos programáticamente

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// ── Sonido de mensaje recibido (tipo WhatsApp) ────────────────────────────────
export const playMessageReceived = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Dos notas cortas ascendentes
    [{ freq: 880, start: 0, dur: 0.08 }, { freq: 1100, start: 0.1, dur: 0.1 }].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(0.3, t + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.start(t + start); osc.stop(t + start + dur + 0.05);
    });
  } catch {}
};

// ── Sonido de mensaje enviado (click suave) ───────────────────────────────────
export const playMessageSent = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.1);
  } catch {}
};

// ── Tono de llamada entrante (ring ring) ──────────────────────────────────────
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

export const startRingtone = () => {
  stopRingtone();
  const playRing = () => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      // Patrón: dos pulsos cortos
      [0, 0.35].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, t + offset);
        osc.frequency.setValueAtTime(440, t + offset + 0.15);
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(0.5, t + offset + 0.02);
        gain.gain.setValueAtTime(0.5, t + offset + 0.13);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.28);
        osc.start(t + offset); osc.stop(t + offset + 0.3);
      });
    } catch {}
  };
  playRing();
  ringtoneInterval = setInterval(playRing, 2000);
};

export const stopRingtone = () => {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
};

// ── Tono de llamada saliente (beep beep) ──────────────────────────────────────
let dialingInterval: ReturnType<typeof setInterval> | null = null;

export const startDialingTone = () => {
  stopDialingTone();
  const playDial = () => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0.2, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.5);
    } catch {}
  };
  playDial();
  dialingInterval = setInterval(playDial, 1500);
};

export const stopDialingTone = () => {
  if (dialingInterval) { clearInterval(dialingInterval); dialingInterval = null; }
};

// ── Llamada conectada (bip corto) ─────────────────────────────────────────────
export const playCallConnected = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    [600, 800, 1000].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.07);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.1);
    });
  } catch {}
};

// ── Llamada terminada (tono descendente) ──────────────────────────────────────
export const playCallEnded = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t); osc.stop(t + 0.5);
  } catch {}
};

// ── Notificación general (pop suave) ─────────────────────────────────────────
export const playNotification = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.12);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.2);
  } catch {}
};

// ── Error / rechazo ───────────────────────────────────────────────────────────
export const playError = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    [0, 0.15].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t + offset);
      gain.gain.setValueAtTime(0.15, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      osc.start(t + offset); osc.stop(t + offset + 0.15);
    });
  } catch {}
};

// ── Éxito / confirmación ──────────────────────────────────────────────────────
export const playSuccess = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.2, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.15);
    });
  } catch {}
};

// ── Vibración (si el dispositivo lo soporta) ─────────────────────────────────
export const vibrate = (pattern: number | number[] = 100) => {
  try { navigator.vibrate?.(pattern); } catch {}
};

// ── Activar contexto de audio (necesario en móvil tras gesto del usuario) ────
export const unlockAudio = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
};
