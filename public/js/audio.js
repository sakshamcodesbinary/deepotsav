/*
 * All cracker sounds are synthesised with Web Audio, so the only audio file is the Jethelal tune.
 * Volume / mute live here and are persisted.
 */
const S = { muted: false, volume: 0.8 };
try { Object.assign(S, JSON.parse(localStorage.getItem('dk_sound') || '{}')); } catch (_) { /* ignore */ }
S.volume = Math.min(1, Math.max(0, Number(S.volume) || 0));
S.muted = !!S.muted;

let ctx = null, master = null, noiseBuf = null, special = null, music = null, musicWanted = false;
const subs = new Set();

export const getState = () => ({ muted: S.muted, volume: S.volume });
export const onChange = (fn) => { subs.add(fn); return () => subs.delete(fn); };

function commit() {
  try { localStorage.setItem('dk_sound', JSON.stringify(S)); } catch (_) { /* ignore */ }
  if (master) master.gain.value = S.muted ? 0 : S.volume;
  if (special) { special.volume = S.volume; special.muted = S.muted; }
  if (music) { music.volume = S.volume * 0.7; music.muted = S.muted; }
  subs.forEach((fn) => fn(getState()));
}
export function setVolume(v) { S.volume = Math.min(1, Math.max(0, v)); if (S.volume > 0) S.muted = false; commit(); }
export function setMuted(m) { S.muted = !!m; commit(); }
export const toggleMuted = () => setMuted(!S.muted);

/** Must be called from a user gesture before anything can be heard. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = S.muted ? 0 : S.volume;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}
const live = () => ctx && !S.muted && S.volume > 0;

function noise(dur, o = {}) {
  if (!live()) return;
  const { type = 'lowpass', f0 = 1200, f1 = null, q = 1, gain = 0.5, attack = 0.003, sustain = false, delay = 0 } = o;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const flt = ctx.createBiquadFilter(); flt.type = type; flt.Q.value = q;
  flt.frequency.setValueAtTime(f0, t0);
  if (f1) flt.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  if (sustain) { g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - 0.35)); }
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur + 0.05);
}
function tone(f0, f1, dur, o = {}) {
  if (!live()) return;
  const { type = 'sine', gain = 0.3, delay = 0 } = o;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator(); osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  fuse(dur = 0.9) { noise(dur, { type: 'bandpass', f0: 3800, q: 2.5, gain: 0.1, sustain: true }); },
  whistle(dur = 1.1) { tone(520, 2100, dur, { gain: 0.05, type: 'triangle' }); noise(dur, { type: 'bandpass', f0: 1400, f1: 3200, q: 3, gain: 0.05 }); },
  bang(big = false) {
    noise(big ? 1.1 : 0.7, { type: 'lowpass', f0: 2400, f1: 90, gain: big ? 1 : 0.7 });
    tone(big ? 120 : 140, 32, big ? 0.7 : 0.45, { gain: big ? 0.9 : 0.6 });
  },
  burst() { noise(0.55, { type: 'lowpass', f0: 3200, f1: 260, gain: 0.5 }); this.crackle(9); },
  crackle(n = 8) {
    for (let i = 0; i < n; i++) noise(0.04, { type: 'highpass', f0: 2500 + Math.random() * 3000, gain: 0.35, delay: 0.08 + Math.random() * 0.7 });
  },
  hiss(dur = 7, bright = false) { noise(dur, { type: bright ? 'highpass' : 'lowpass', f0: bright ? 3200 : 4200, f1: bright ? null : 1800, gain: bright ? 0.08 : 0.11, sustain: true }); },
  whirr(dur = 6) { tone(110, 330, dur * 0.5, { type: 'sawtooth', gain: 0.035 }); noise(dur, { type: 'bandpass', f0: 1800, q: 1.5, gain: 0.07, sustain: true }); },
  pop() { noise(0.14, { type: 'bandpass', f0: 1800, q: 2, gain: 0.35 }); tone(420, 120, 0.12, { gain: 0.25 }); },
  bell() { tone(784, 780, 1.6, { gain: 0.14 }); tone(1568, 1560, 1.1, { gain: 0.06 }); tone(2352, 2350, 0.7, { gain: 0.03 }); },
  chime() { tone(988, 985, 0.7, { gain: 0.1 }); tone(1480, 1476, 0.55, { gain: 0.06, delay: 0.09 }); }
};

/** Jethelal Special tune. Returns its duration in seconds (falls back to 10.8). */
export function playSpecial() {
  if (!special) { special = new Audio('/assets/jethelal-special.mp3'); special.preload = 'auto'; }
  special.volume = S.volume; special.muted = S.muted;
  try { special.currentTime = 0; } catch (_) { /* not ready yet */ }
  const p = special.play(); if (p && p.catch) p.catch(() => {});
  return special.duration && isFinite(special.duration) ? special.duration : 10.8;
}
export function preloadSpecial() { if (!special) { special = new Audio('/assets/jethelal-special.mp3'); special.preload = 'auto'; } }

/** Landing-page music. Browsers block sound until the visitor interacts, so if autoplay is refused we start on the first tap/key. */
export function startMusic() {
  musicWanted = true;
  if (!music) { music = new Audio('/assets/landing-music.mp3'); music.loop = true; music.preload = 'auto'; }
  music.volume = S.volume * 0.7; music.muted = S.muted;
  const tryPlay = () => music.play();
  const p = tryPlay();
  if (p && p.catch) p.catch(() => {
    const kick = () => {
      ['click', 'touchend', 'keydown'].forEach((e) => window.removeEventListener(e, kick, true));
      if (musicWanted) tryPlay().catch(() => {});
    };
    ['click', 'touchend', 'keydown'].forEach((e) => window.addEventListener(e, kick, true));
  });
}
/** Fades the music out and pauses it (used when entering the game). */
export function stopMusic() {
  musicWanted = false;
  if (!music) return;
  const m = music, v0 = m.volume;
  let i = 0;
  const id = setInterval(() => {
    i++; m.volume = Math.max(0, v0 * (1 - i / 8));
    if (i >= 8) { clearInterval(id); m.pause(); m.volume = v0; }
  }, 45);
}

/** Unlocks the music element inside the visitor's tap, so it can be started a moment later (e.g. after the diya lights). */
export function primeMusic() {
  if (!music) { music = new Audio('/assets/landing-music.mp3'); music.loop = true; music.preload = 'auto'; }
  music.muted = true;
  const p = music.play();
  if (p && p.then) p.then(() => { if (!musicWanted) { music.pause(); music.currentTime = 0; } music.muted = S.muted; }).catch(() => { music.muted = S.muted; });
}

/*
 * Phones only treat click / touchend / keydown as a real "user gesture" (pointerdown does not count),
 * so the audio engine is unlocked from those. The Jethelal tune element is also "played" once, muted,
 * inside that gesture, which lets it be started later by the game when a cracker goes off.
 */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'];
function onGesture() {
  unlock();
  if (special && !special.__primed) {
    special.__primed = true; special.muted = true;
    const p = special.play();
    if (p && p.then) p.then(() => { special.pause(); special.currentTime = 0; special.muted = S.muted; }).catch(() => { special.muted = S.muted; });
  }
  if (ctx && ctx.state === 'running') GESTURES.forEach((e) => window.removeEventListener(e, onGesture, true));
}
GESTURES.forEach((e) => window.addEventListener(e, onGesture, true));
