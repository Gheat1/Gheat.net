// Tiny WebAudio synth for UI blips — no audio assets needed.
let ctx = null;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq = 440, type = 'square', duration = 0.08, gain = 0.04, when = 0 }) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  click() {
    tone({ freq: 880, duration: 0.04, gain: 0.03 });
  },
  open() {
    tone({ freq: 523, duration: 0.07 });
    tone({ freq: 784, duration: 0.09, when: 0.06 });
  },
  close() {
    tone({ freq: 784, duration: 0.07 });
    tone({ freq: 392, duration: 0.1, when: 0.06 });
  },
  error() {
    tone({ freq: 110, type: 'sawtooth', duration: 0.25, gain: 0.05 });
  },
  // the hidden server-light chirp: 3 short, 3 long
  serverSecret() {
    for (let i = 0; i < 3; i++) tone({ freq: 1320, duration: 0.05, when: i * 0.12 });
    for (let i = 0; i < 3; i++) tone({ freq: 660, duration: 0.16, when: 0.5 + i * 0.24 });
  },
  boot() {
    tone({ freq: 262, duration: 0.12, gain: 0.05 });
    tone({ freq: 392, duration: 0.12, when: 0.1, gain: 0.05 });
    tone({ freq: 523, duration: 0.2, when: 0.2, gain: 0.05 });
  },
  // rising engine sweep for the warp jump
  warp() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t0);
    osc.frequency.exponentialRampToValueAtTime(1400, t0 + 2.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 2.7);
  },
  // soft descending whoosh when the camera pans to a clue
  pan() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t0);
    osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.8);
    g.gain.setValueAtTime(0.035, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 1);
  },
  // 8-bit power-up arpeggio for the konami code
  konami() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, duration: 0.09, when: i * 0.07, gain: 0.05 })
    );
  },
  // channel-flip clunk + static burst
  channel() {
    tone({ freq: 160, type: 'square', duration: 0.05, gain: 0.06 });
    tone({ freq: 90, type: 'sawtooth', duration: 0.18, when: 0.05, gain: 0.04 });
  },
  // access granted
  root() {
    tone({ freq: 440, duration: 0.08 });
    tone({ freq: 554, duration: 0.08, when: 0.09 });
    tone({ freq: 659, duration: 0.18, when: 0.18 });
  },
  // noclip: reality drops out from under you
  noclip() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(55, t0 + 1.1);
    g.gain.setValueAtTime(0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 1.3);
  },
  // hitting the backrooms carpet
  thud() {
    tone({ freq: 52, type: 'sine', duration: 0.28, gain: 0.1 });
    tone({ freq: 40, type: 'sine', duration: 0.35, when: 0.02, gain: 0.07 });
  },
  // ---- story set-piece sounds ----

  // the physical plug leaving the socket: a chunky click + electrical pop
  unplugPop() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    // low thunk (the plug body)
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.09);
    g.gain.setValueAtTime(0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 0.14);
    // sharp contact click on top
    const src = ac.createBufferSource();
    src.buffer = this._noise(ac, 0.05);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const cg = ac.createGain();
    cg.gain.setValueAtTime(0.2, t0);
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    src.connect(hp).connect(cg).connect(ac.destination);
    src.start(t0);
  },

  // a shower of sparks flying from the yanked plug — bright and crackling
  sparks() {
    const ac = audio();
    if (!ac) return;
    for (let i = 0; i < 26; i++) {
      const t0 = ac.currentTime + i * 0.018 + Math.random() * 0.02;
      const src = ac.createBufferSource();
      const buf = ac.createBuffer(1, ac.sampleRate * 0.07, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / d.length);
      src.buffer = buf;
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2200 + Math.random() * 2500;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.1 + Math.random() * 0.09, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      src.connect(hp).connect(g).connect(ac.destination);
      src.start(t0);
    }
    // electric zap under the crackle
    const z = ac.createOscillator();
    const zg = ac.createGain();
    z.type = 'sawtooth';
    z.frequency.setValueAtTime(1400, ac.currentTime);
    z.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.3);
    zg.gain.setValueAtTime(0.06, ac.currentTime);
    zg.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.35);
    z.connect(zg).connect(ac.destination);
    z.start();
    z.stop(ac.currentTime + 0.36);
  },

  // server fans aggressively spinning down to nothing
  spinDown() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(18, t0 + 2.4);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    g.gain.setValueAtTime(0.09, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    osc.connect(lp).connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 2.7);
  },

  // dial-up modem screech (bit-crushed, awful, correct)
  dialup() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    const seq = [980, 1650, 1180, 2100, 1400, 600, 2450, 1800];
    seq.forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = i % 2 ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(f, t0 + i * 0.22);
      const g0 = 0.05;
      g.gain.setValueAtTime(g0, t0 + i * 0.22);
      g.gain.setValueAtTime(g0, t0 + i * 0.22 + 0.19);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.22 + 0.21);
      osc.connect(g).connect(ac.destination);
      osc.start(t0 + i * 0.22);
      osc.stop(t0 + i * 0.22 + 0.22);
    });
    // underlying noise hiss
    const src = ac.createBufferSource();
    src.buffer = this._noise(ac, 1.9);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    const ng = ac.createGain();
    ng.gain.value = 0.03;
    src.connect(bp).connect(ng).connect(ac.destination);
    src.start(t0);
    src.stop(t0 + 1.9);
  },

  // panicked breathing loop for the awakening voiceover; returns stop()
  startBreathing() {
    const ac = audio();
    if (!ac) return () => {};
    let running = true;
    let timer = null;
    const breath = (inhale) => {
      const src = ac.createBufferSource();
      src.buffer = this._noise(ac, 0.5);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = inhale ? 900 : 480;
      bp.Q.value = 1.3;
      const g = ac.createGain();
      const t0 = ac.currentTime;
      const dur = inhale ? 0.32 : 0.42;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(inhale ? 0.05 : 0.07, t0 + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp).connect(g).connect(ac.destination);
      src.start(t0);
      src.stop(t0 + dur + 0.05);
    };
    const cycle = () => {
      if (!running) return;
      breath(true);
      setTimeout(() => running && breath(false), 360);
      timer = setTimeout(cycle, 900);
    };
    cycle();
    return () => {
      running = false;
      clearTimeout(timer);
    };
  },

  // the bit-crushed voice of the thing wearing g's face. Not words — a
  // menacing formant sweep under the subtitle. Returns nothing.
  crushedVoice() {
    const ac = audio();
    if (!ac) return;
    const t0 = ac.currentTime;
    [70, 105, 88, 140, 62].forEach((f, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const dist = ac.createWaveShaper();
      const curve = new Float32Array(256);
      for (let j = 0; j < 256; j++) {
        const x = (j / 128) - 1;
        curve[j] = Math.tanh(x * 5); // hard clip = bit-crush grit
      }
      dist.curve = curve;
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t0 + i * 0.3);
      osc.frequency.linearRampToValueAtTime(f * 1.4, t0 + i * 0.3 + 0.28);
      g.gain.setValueAtTime(0.06, t0 + i * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.3 + 0.3);
      osc.connect(dist).connect(g).connect(ac.destination);
      osc.start(t0 + i * 0.3);
      osc.stop(t0 + i * 0.3 + 0.32);
    });
  },

  _noise(ac, seconds) {
    const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  // the fluorescent hum — loops until the returned stop() is called
  startBuzz() {
    const ac = audio();
    if (!ac) return () => {};
    const osc = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const g = ac.createGain();
    const lfo = ac.createOscillator();
    const lfoG = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 118;
    osc2.type = 'sine';
    osc2.frequency.value = 59.7; // mains hum, slightly detuned = uneasy
    lp.type = 'lowpass';
    lp.frequency.value = 850;
    g.gain.value = 0.014;
    lfo.type = 'sine';
    lfo.frequency.value = 13;
    lfoG.gain.value = 0.005;
    lfo.connect(lfoG).connect(g.gain);
    osc.connect(lp);
    osc2.connect(lp);
    lp.connect(g).connect(ac.destination);
    osc.start();
    osc2.start();
    lfo.start();
    return () => {
      try {
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
        setTimeout(() => {
          osc.stop();
          osc2.stop();
          lfo.stop();
        }, 500);
      } catch {}
    };
  },
};
