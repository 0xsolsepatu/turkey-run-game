// Synthesised sound for Tilly's Great Escape. Every effect is built from
// WebAudio oscillators and noise, so the game ships no audio files and makes
// no network request. Silent until the first user gesture creates the context.
let ctx = null;
let muted = false;
let noiseBuffer = null;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Call from a real user gesture (key/click) so the browser allows sound. */
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol, lowFreq) {
  if (muted) return;
  const c = ensureContext();
  if (!c || !noiseBuffer) return;
  const t0 = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** Two-note gobble when Tilly jumps. */
export function playJump() {
  tone(620, 0.09, 'square', 0.08, 880);
  setTimeout(() => tone(880, 0.08, 'square', 0.06, 660), 70);
}

/** Bright chirp for corn and feathers. */
export function playPickup() {
  tone(1040, 0.08, 'sine', 0.1, 1560);
}

/** Warm chime for a pie slice (extra life). */
export function playPie() {
  tone(523, 0.12, 'triangle', 0.12);
  setTimeout(() => tone(659, 0.12, 'triangle', 0.12), 90);
  setTimeout(() => tone(784, 0.2, 'triangle', 0.12), 180);
}

/** Dull thud when Tilly stumbles or hits the oven. */
export function playStumble() {
  noise(0.18, 0.22, 320);
  tone(140, 0.16, 'sawtooth', 0.12, 70);
}

/** The farmer's shout when he surges or catches Tilly. */
export function playShout() {
  tone(220, 0.22, 'sawtooth', 0.14, 110);
  setTimeout(() => tone(180, 0.18, 'sawtooth', 0.1, 90), 120);
}

/** Sad descending slide when the farmer catches Tilly. */
export function playCaughtSound() {
  tone(392, 0.25, 'sawtooth', 0.12, 196);
  setTimeout(() => tone(311, 0.3, 'sawtooth', 0.1, 155), 200);
}

/** Little victory jingle when Tilly escapes. */export function playEscape() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110));
}

/** Soft click for menu buttons. */
export function playClick() {
  tone(700, 0.05, 'sine', 0.08);
}
