/**
 * generate_sounds.js
 * Genera archivos WAV sintéticos para cada tono de EGChat.
 * No requiere dependencias externas — usa solo Node.js Buffer.
 *
 * Uso: node scripts/generate_sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '../assets');

// ── Utilidades WAV ────────────────────────────────────────────────

/** Escribe un archivo WAV PCM-16 mono. samples = Float32Array en [-1, 1] */
function writeWav(filename, samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2;          // 16-bit mono
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  // fmt chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);          // chunk size
  buf.writeUInt16LE(1, 20);           // PCM
  buf.writeUInt16LE(1, 22);           // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(2, 32);           // block align
  buf.writeUInt16LE(16, 34);          // bits per sample
  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, buf);
  console.log(`✅  ${filename}`);
}

/** Envolvente ADSR simple */
function adsr(t, dur, attack, decay, sustain, release) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < dur - release) return sustain;
  return sustain * (1 - (t - (dur - release)) / release);
}

/** Genera array de muestras Float32 */
function generate(durationSec, fn) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    buf[i] = fn(i / SAMPLE_RATE, durationSec);
  }
  return buf;
}

// ── Tono sinusoidal básico con ADSR ──────────────────────────────
function sineADSR(freq, dur, attack, decay, sustain, release, amp = 0.7) {
  return generate(dur, (t) => {
    const env = adsr(t, dur, attack, decay, sustain, release);
    return Math.sin(2 * Math.PI * freq * t) * env * amp;
  });
}

// ── Suma de sinusoides (acorde) ───────────────────────────────────
function chord(freqs, dur, attack, decay, sustain, release, amp = 0.55) {
  return generate(dur, (t) => {
    const env = adsr(t, dur, attack, decay, sustain, release);
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t);
    return (s / freqs.length) * env * amp;
  });
}

// ── Chirp (frecuencia que sube/baja) ─────────────────────────────
function chirp(f0, f1, dur, attack, decay, sustain, release, amp = 0.65) {
  return generate(dur, (t) => {
    const env = adsr(t, dur, attack, decay, sustain, release);
    const freq = f0 + (f1 - f0) * (t / dur);
    return Math.sin(2 * Math.PI * freq * t) * env * amp;
  });
}

// ── Ruido blanco con envolvente (burst) ──────────────────────────
function noiseBurst(dur, attack, decay, amp = 0.3) {
  return generate(dur, (t) => {
    const env = adsr(t, dur, attack, decay, 0, decay, amp);
    return (Math.random() * 2 - 1) * env;
  });
}

// ── Concatenar buffers ────────────────────────────────────────────
function concat(...bufs) {
  const total = bufs.reduce((a, b) => a + b.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const b of bufs) { out.set(b, off); off += b.length; }
  return out;
}

/** Silencio de N ms */
function silence(ms) {
  return new Float32Array(Math.floor(SAMPLE_RATE * ms / 1000));
}

/** Mezcla dos buffers (mismo tamaño) */
function mix(a, b, gainA = 0.5, gainB = 0.5) {
  const out = new Float32Array(Math.max(a.length, b.length));
  for (let i = 0; i < out.length; i++) {
    const sa = i < a.length ? a[i] * gainA : 0;
    const sb = i < b.length ? b[i] * gainB : 0;
    out[i] = Math.max(-1, Math.min(1, sa + sb));
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
//  TONOS DE MENSAJES
// ════════════════════════════════════════════════════════════════

// 1. EGCHAT — dos notas ascendentes tipo WhatsApp (do-mi)
function makeEgchat() {
  const n1 = sineADSR(523.25, 0.18, 0.005, 0.07, 0.4, 0.10);  // C5
  const n2 = sineADSR(659.25, 0.22, 0.005, 0.08, 0.3, 0.12);  // E5
  return concat(n1, silence(30), n2);
}

// 2. Notificación — tres pulsos cortos (tipo sistema)
function makeNotif() {
  const p = sineADSR(880, 0.10, 0.003, 0.05, 0.2, 0.05);
  return concat(p, silence(60), p, silence(60), p);
}

// 3. Ding — campana metálica única con overtones
function makeDing() {
  return generate(0.9, (t) => {
    const env = Math.exp(-5 * t);
    return (
      Math.sin(2 * Math.PI * 1047 * t) * 0.5 +
      Math.sin(2 * Math.PI * 2093 * t) * 0.2 +
      Math.sin(2 * Math.PI * 3140 * t) * 0.1
    ) * env * 0.7;
  });
}

// 4. Chime — acorde de campanas (do-mi-sol)
function makeChime() {
  return generate(1.2, (t) => {
    const env = Math.exp(-3 * t);
    return (
      Math.sin(2 * Math.PI * 523.25 * t) * 0.4 +
      Math.sin(2 * Math.PI * 659.25 * t) * 0.35 +
      Math.sin(2 * Math.PI * 783.99 * t) * 0.3 +
      Math.sin(2 * Math.PI * 1046.5 * t) * 0.15
    ) * env * 0.6;
  });
}

// 5. Pop — golpe corto tipo burbuja reventando
function makePop() {
  return generate(0.12, (t) => {
    const env = Math.exp(-40 * t);
    const freq = 300 + 600 * Math.exp(-80 * t);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.9;
  });
}

// 6. Burbuja — chirp descendente suave
function makeBubble() {
  return generate(0.35, (t) => {
    const env = Math.exp(-6 * t) * (1 - Math.exp(-80 * t));
    const freq = 700 * Math.exp(-4 * t) + 200;
    return Math.sin(2 * Math.PI * freq * t) * env * 0.75;
  });
}

// ════════════════════════════════════════════════════════════════
//  TONOS DE LLAMADA
// ════════════════════════════════════════════════════════════════

// 7. Clásico — do-re-mi con rebote, tipo teléfono antiguo con timbre
function makeClassic() {
  // Patrón telefónico: tono doble rápido
  const hi = sineADSR(480, 0.40, 0.01, 0.01, 0.85, 0.05, 0.6);
  const lo = sineADSR(440, 0.40, 0.01, 0.01, 0.85, 0.05, 0.6);
  const ring = mix(hi, lo);
  return concat(ring, silence(200), ring, silence(400));
}

// 8. Moderno — chirp suave ascendente en dos notas
function makeModern() {
  const a = chirp(440, 880, 0.25, 0.01, 0.10, 0.6, 0.08);
  const b = chirp(550, 1100, 0.25, 0.01, 0.10, 0.6, 0.08);
  return concat(a, silence(80), b, silence(300), a, silence(80), b);
}

// 9. Digital — pulso cuadrado sintético (aproximado con serie de Fourier)
function makeDigital() {
  const pulse = generate(0.20, (t) => {
    const env = adsr(t, 0.20, 0.005, 0.02, 0.8, 0.03);
    // Onda cuadrada aproximada (5 armónicos)
    let s = 0;
    for (let k = 0; k < 5; k++) {
      const n = 2 * k + 1;
      s += Math.sin(2 * Math.PI * 880 * n * t) / n;
    }
    return (s * 4 / Math.PI) * env * 0.35;
  });
  return concat(pulse, silence(120), pulse, silence(120), pulse, silence(350), pulse, silence(120), pulse);
}

// 10. Marimba — nota de marimba (tono fundamental + 4ta + octava, decaimiento rápido)
function makeMarimba() {
  const note = (freq) => generate(0.45, (t) => {
    const env = Math.exp(-8 * t) * (1 - Math.exp(-120 * t));
    return (
      Math.sin(2 * Math.PI * freq * t) * 0.55 +
      Math.sin(2 * Math.PI * freq * 4 * t) * 0.15 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.20
    ) * env * 0.7;
  });
  // Escala pentatónica: C4-E4-G4-C5
  return concat(
    note(261.63), silence(20),
    note(329.63), silence(20),
    note(392.00), silence(20),
    note(523.25)
  );
}

// ════════════════════════════════════════════════════════════════
//  GENERAR TODOS
// ════════════════════════════════════════════════════════════════

const tones = [
  ['egchat.wav',    makeEgchat()],
  ['notif.wav',     makeNotif()],
  ['ding.wav',      makeDing()],
  ['chime.wav',     makeChime()],
  ['pop.wav',       makePop()],
  ['bubble.wav',    makeBubble()],
  ['classic.wav',   makeClassic()],
  ['modern.wav',    makeModern()],
  ['digital.wav',   makeDigital()],
  ['marimba.wav',   makeMarimba()],
];

console.log(`\n🎵  Generando ${tones.length} tonos en ${OUT_DIR}\n`);
for (const [name, samples] of tones) {
  writeWav(name, samples);
}
console.log('\n✨  ¡Listo!\n');
