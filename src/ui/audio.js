// WebAudio synthesised SFX. No audio files.
const KEY = 'noodle-harbor-sound';
let ctx = null, master = null, noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === 'off'; } catch { /* ignore */ }

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ctx.destination);
  const len = ctx.sampleRate * 0.5;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Call from a user gesture. */
export function unlockAudio() {
  const c = ensure();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem(KEY, muted ? 'off' : 'on'); } catch { /* ignore */ }
}

// tone(freq, dur, {type, vol, to (end freq), at (delay s), a (attack s)})
function tone(freq, dur, o = {}) {
  const t0 = ctx.currentTime + (o.at || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  const v = o.vol ?? 0.3, a = o.a ?? 0.006;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}
function noise(dur, o = {}) {
  const t0 = ctx.currentTime + (o.at || 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = o.filter || 'bandpass';
  f.frequency.value = o.freq || 2000;
  f.Q.value = o.q || 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.15, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0, Math.random() * 0.3); src.stop(t0 + dur + 0.02);
}

const jit = (amt = 0.06) => 1 + (Math.random() * 2 - 1) * amt;

const SOUNDS = {
  pickup(p) { tone(480 * p, 0.09, { to: 760 * p, vol: 0.22, type: 'triangle' }); },
  drop(p) { tone(260 * p, 0.12, { to: 150 * p, vol: 0.3, type: 'triangle' }); noise(0.05, { freq: 700, vol: 0.08 }); },
  cash(p) {
    tone(988 * p, 0.12, { vol: 0.2, type: 'triangle' });
    tone(1319 * p, 0.28, { vol: 0.22, type: 'triangle', at: 0.07 });
    noise(0.05, { freq: 5000, q: 2, vol: 0.06 });
  },
  coin(p) { tone(1250 * p, 0.07, { vol: 0.16, type: 'square' }); tone(1850 * p, 0.14, { vol: 0.14, type: 'square', at: 0.05 }); },
  unlock(p) {
    [523, 659, 784, 1047].forEach((f, i) => tone(f * p, 0.22, { vol: 0.22, type: 'triangle', at: i * 0.085 }));
    tone(1568 * p, 0.45, { vol: 0.12, at: 0.34 });
  },
  pay(p) { tone(760 * p, 0.035, { vol: 0.14, type: 'triangle' }); noise(0.025, { freq: 3500, q: 3, vol: 0.05 }); },
  click(p) { tone(620 * p, 0.05, { to: 480 * p, vol: 0.18 }); },
  serve(p) { tone(660 * p, 0.1, { vol: 0.2, type: 'triangle' }); tone(880 * p, 0.16, { vol: 0.2, type: 'triangle', at: 0.08 }); },
  upgrade(p) {
    tone(400 * p, 0.3, { to: 900 * p, vol: 0.18, type: 'triangle' });
    tone(1200 * p, 0.3, { vol: 0.16, at: 0.18 });
    tone(1600 * p, 0.4, { vol: 0.12, at: 0.26 });
  },
  error(p) { tone(210 * p, 0.14, { to: 150 * p, vol: 0.2, type: 'square' }); tone(180 * p, 0.18, { to: 120 * p, vol: 0.18, type: 'square', at: 0.11 }); },
};
const MIN_GAP = { pickup: 60, pay: 60, coin: 45, drop: 50, cash: 80, click: 40 };
const last = {};

export function sfx(name) {
  if (muted) return;
  const fn = SOUNDS[name];
  if (!fn) return;
  const now = performance.now();
  if (now - (last[name] || 0) < (MIN_GAP[name] || 30)) return;
  last[name] = now;
  if (!ensure()) return;
  if (ctx.state !== 'running') { ctx.resume().catch(() => {}); if (ctx.state !== 'running') return; }
  try { fn(jit(name === 'pay' ? 0.1 : 0.05)); } catch { /* ignore */ }
}
