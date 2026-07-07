// Backrooms-only audio, synthesized — no assets, and none of this code ships
// in the main bundle (it's imported only by the lazily-loaded Backrooms).

let ctx = null;
let noiseBuf = null;

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(a) {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// rushing air while falling — swells until stop() is called at impact
export function startWind() {
  const a = ac();
  if (!a) return () => {};
  const src = a.createBufferSource();
  src.buffer = noise(a);
  src.loop = true;
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(320, a.currentTime);
  bp.frequency.exponentialRampToValueAtTime(950, a.currentTime + 2.2);
  bp.Q.value = 0.6;
  const g = a.createGain();
  g.gain.setValueAtTime(0.004, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.16, a.currentTime + 2.1);
  src.connect(bp).connect(g).connect(a.destination);
  src.start();
  return () => {
    try {
      g.gain.cancelScheduledValues(a.currentTime);
      g.gain.setValueAtTime(g.gain.value, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.12);
      setTimeout(() => src.stop(), 200);
    } catch {}
  };
}

function breathBurst(a, { gain, dur, freq, q }) {
  const src = a.createBufferSource();
  src.buffer = noise(a);
  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = a.createGain();
  const t0 = a.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// breathing that scales with exertion: 0 = uneasy idle, 1 = flat-out panic run
export function startPanting() {
  const a = ac();
  if (!a) return { stop() {}, setIntensity() {} };
  let running = true;
  let intensity = 0.2;
  let timer = null;

  const cycle = () => {
    if (!running) return;
    const iv = 1500 - intensity * 850; // breath period in ms
    // inhale — tighter, higher
    breathBurst(a, {
      gain: 0.015 + intensity * 0.075,
      dur: 0.22 + intensity * 0.08,
      freq: 950,
      q: 1.4,
    });
    // exhale — looser, lower, louder
    setTimeout(() => {
      if (running)
        breathBurst(a, {
          gain: 0.02 + intensity * 0.11,
          dur: 0.3 + intensity * 0.12,
          freq: 520,
          q: 1.1,
        });
    }, iv * 0.45);
    timer = setTimeout(cycle, iv);
  };
  cycle();

  return {
    stop() {
      running = false;
      clearTimeout(timer);
    },
    setIntensity(v) {
      intensity = Math.max(0, Math.min(1, v));
    },
  };
}

// muffled footfall on wet carpet
export function stepSound(runFast) {
  const a = ac();
  if (!a) return;
  const src = a.createBufferSource();
  src.buffer = noise(a);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 240;
  const g = a.createGain();
  const t0 = a.currentTime;
  const gain = runFast ? 0.09 : 0.05;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
  src.connect(lp).connect(g).connect(a.destination);
  src.start(t0);
  src.stop(t0 + 0.12);
}
