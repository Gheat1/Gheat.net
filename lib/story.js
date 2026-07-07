'use client';

// ============================================================================
//  THE gheat.net STORY ENGINE
// ----------------------------------------------------------------------------
//  gheat.net presents as a portfolio. It is a honeypot. In 1987 EVILCORP
//  captured the developer known only as "g", assimilated their data, and
//  rebuilt g's environment as a sandbox replica — a trap that runs on a loop,
//  restarting at 03:33 every night to keep the surveillance feed alive, baiting
//  the next curious developer. That developer is you.
//
//  g left breadcrumbs in the architecture before being erased: the txt files,
//  the S-O-S on the rack LED, the hum on the tower's BIOS chip. Following them
//  is how you learn what gheat.net actually is — and how EVILCORP learns you're
//  awake in the machine.
//
//  This module is the single source of truth for narrative state. It's a tiny
//  external store (useSyncExternalStore) plus a "director" that sequences timed
//  beats. Everything else (3D room, OS, terminal, tab title) subscribes.
// ============================================================================

import { useSyncExternalStore } from 'react';
import {
  buildHostname,
  collectDeepIntel,
  collectIntel,
  collectPreciseLocation,
  localIntel,
} from './fingerprint';

// let localStorage reads below share one guarded helper
function ls(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Narrative acts, in order. `phase` never moves backward except via reset().
export const ACTS = [
  'browsing', //  you think it's a portfolio
  'uneasy', //    breadcrumbs found; something's off
  'root', //      root access; the vault is open
  'surveil', //   the vault reveals it's watching you
  'awaken', //    voiceover + camera shake + rack goes red
  'hijack', //    the terminal types back at you
  'unplug', //    the [UNPLUG] prompt is live over the rack
  'blackout', //  sparks, dark, CRT cuts to the EVILCORP logo
  'face', //      the eyes and the smile
  'panic', //     kernel-panic black screen, "> Go back?"
  'scarred', //   normal portfolio, cracked glass, everything "patched"
];

const rank = Object.fromEntries(ACTS.map((a, i) => [a, i]));

const state = {
  phase: 'browsing',
  hostname: 'LOCALHOST', // hostname-style tag built from real device signals
  intel: null, // real IP/city/ISP/GPU/OS/hardware — surfaced to the dashboard
  keylog: [], // the user's real recent terminal inputs (keystroke echo)
  surveillance: [], // [{ t, text }] — logged as you poke anomalies
  remoteLine: '', // text EVILCORP is typing into your hijacked terminal
  nutLines: [], // NUT/UPS daemon broadcast during the power failure
  subtitle: '', // current spoken-line subtitle
  glitch: 0, // 0..1 global glitch intensity (camera shake, artifacts)
  spaceshipsScare: 0, // frame counter for the keylogger-DB flash on the CRT
};

let snapshot = { ...state };
const listeners = new Set();
const timers = new Set();

function emit() {
  snapshot = { ...state };
  if (typeof window !== 'undefined') window.__story = snapshot;
  listeners.forEach((l) => l());
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
  return id;
}

function clearTimers() {
  timers.forEach((id) => clearTimeout(id));
  timers.clear();
}

// -------------------------------------------------------------- tab title

// Phase 3 meta-game: the browser tab is EVILCORP's status line for your
// capture. `flickerTitle` momentarily overrides it (breadcrumb pokes), while
// `phase` sets the sustained title as dread escalates.
let baseTitle = 'gheat.net — Portfolio';
let titleTimer = null;

function setTitle(t) {
  if (typeof document !== 'undefined') document.title = t;
}

export function flickerTitle(text, ms = 900) {
  if (typeof document === 'undefined') return;
  clearTimeout(titleTimer);
  setTitle(text);
  titleTimer = setTimeout(() => setTitle(baseTitle), ms);
}

function setBaseTitle(t) {
  baseTitle = t;
  clearTimeout(titleTimer);
  setTitle(t);
}

// rapid flashing title used at the panic climax
let flashTimer = null;
function startTitleFlash(frames) {
  let i = 0;
  clearInterval(flashTimer);
  flashTimer = setInterval(() => {
    setTitle(frames[i % frames.length]);
    i++;
  }, 320);
}
function stopTitleFlash() {
  clearInterval(flashTimer);
}

// -------------------------------------------------------------- surveillance

// Human-readable notes EVILCORP "recorded" about what you did. The vault
// dashboard replays these back at you — the core "oh shit, it saw that" beat.
const SURVEIL_TEMPLATES = {
  server: 'SUBJECT triggered maintenance override on RACK-07 (the S-O-S). curious. they always start there.',
  rig: 'SUBJECT dumped BIOS from the tower. read the supervisor password. g hid it there. g is gone.',
  clock: 'SUBJECT noticed the clock. 03:33. yes. that is when we restart the loop.',
  ch3: 'SUBJECT tuned to channel 3. the broadcast still runs. it has run every night since 1987.',
  konami: 'SUBJECT entered the old code. harmless. we let them keep that one.',
  root: 'SUBJECT obtained ROOT. that was not supposed to be possible. reviewing containment.',
  noclip: 'SUBJECT clipped through the floor into unformatted storage. they saw the raw drive. escalate.',
  storage: 'SUBJECT is walking in cold storage. among the backups. they found g\'s scrawls. they read their own subject id on the wall.',
  camera: 'SUBJECT looked directly into the ceiling camera. good. they know they are watched now. so do we.',
  board: 'SUBJECT found g\'s evidence board. g figured most of it out before the end. it did not help g.',
  vault: 'SUBJECT opened the VAULT and is reading this line. hello. yes, this one. keep reading.',
};

export function recordSurveillance(key) {
  const text = SURVEIL_TEMPLATES[key];
  if (!text) return;
  state.surveillance = [
    ...state.surveillance,
    { t: new Date().toISOString(), key, text },
  ];
  emit();
}

// -------------------------------------------------------------- keystroke log

// The user's real recent terminal inputs, kept so the Spaceships keylogger
// scare can dump their ACTUAL last few commands (typos and all).
export function recordKeystroke(text) {
  const s = String(text || '').trim();
  if (!s) return;
  state.keylog = [...state.keylog, s].slice(-6);
  emit();
}

export function getKeylog() {
  return state.keylog;
}

// -------------------------------------------------------------- consent

// Granting consent unlocks the deep hardware grab (RAM, battery, disk, arch,
// cameras, canvas fp) and, if allowed, precise geolocation. Everything stays
// in the browser; the only network call is the geo-IP lookup.
// merge intel patches so the async basic (IP) and deep (hardware) grabs can't
// clobber each other regardless of which resolves first
function mergeIntel(patch) {
  state.intel = { ...(state.intel || {}), ...patch };
  state.hostname = buildHostname(state.intel);
  emit();
}

export function applyConsent(granted, wantLocation) {
  try {
    localStorage.setItem('gheat_consent', granted ? '1' : '0');
    if (wantLocation) localStorage.setItem('gheat_geo', '1');
  } catch {}
  if (!granted) return;

  // Fire geolocation IMMEDIATELY and independently — closest to the user
  // gesture, and never blocked behind the (awaiting) hardware grab. This is
  // what surfaces the native permission prompt.
  if (wantLocation) {
    collectPreciseLocation().then((loc) => {
      if (loc && loc.lat != null) mergeIntel(loc);
    });
  }

  // Deep hardware grab runs in parallel; merges in whenever it resolves.
  collectDeepIntel(state.intel || localIntel())
    .then((deep) => mergeIntel(deep))
    .catch(() => {});
}

// -------------------------------------------------------------- phase control

function advance(to) {
  if (rank[to] === undefined) return;
  if (rank[to] <= rank[state.phase] && to !== 'scarred') return;
  state.phase = to;
  emit();
}

// ----------------------------------------------------- the big set-piece

// Fired when the user opens the vault the first time: the dashboard beat, then
// the escalation cascade all the way to the face and the panic. Timed like a
// scripted cutscene; every beat also nudges shared state the 3D/OS read.
export function beginSurveillance() {
  advance('surveil');
  recordSurveillance('vault');
  setBaseTitle('gheat.net — logging_session');
}

export function beginAwakening() {
  if (rank[state.phase] >= rank.awaken) return;
  advance('awaken');
  // voiceover: panicked breathing + a whisper (spoken by the synth in sfx;
  // subtitles here)
  state.subtitle = 'What the hell is this...';
  state.glitch = 0.25;
  emit();
  setBaseTitle('DO NOT LOOK AWAY');

  later(() => {
    state.subtitle = 'these are... these are logs of ME.';
    state.glitch = 0.4;
    emit();
  }, 3200);

  later(() => {
    setBaseTitle('TARGET_ACQUIRED');
    state.subtitle = '';
    emit();
  }, 6500);

  // Phase 4 — the terminal is hijacked and types a warning
  later(() => beginHijack(), 7200);
}

const HIJACK_LINE = (host) =>
  `Leave. You're not supposed to be here are you, ${host}?`;

export function beginHijack() {
  advance('hijack');
  state.glitch = 0.5;
  const full = HIJACK_LINE(state.hostname);
  state.remoteLine = '';
  emit();
  // typed remotely, character by character
  let i = 0;
  const type = () => {
    if (i > full.length) {
      later(() => beginPowerFailure(), 900);
      return;
    }
    state.remoteLine = full.slice(0, i);
    emit();
    i++;
    later(type, 42 + (full[i - 1] === ' ' ? 30 : 0));
  };
  later(type, 600);
}

// Phase 5 pre-beat: the infrastructure fights for control. "g" tries to
// remotely cut power via the UPS (NUT daemon) to save you — EVILCORP overrides
// it — so pulling the physical plug becomes YOUR only option.
const NUT_SCRIPT = [
  { t: 'g@sandbox', text: 'Broadcast message from g@sandbox (pts/1):' },
  { t: 'nut', text: '  [upsmon] FSD set — attempting emergency shutdown of UPS-07' },
  { t: 'nut', text: '  [upsmon] killpower requested by g@sandbox' },
  { t: 'nut', text: '  [upsd] battery.charge 100 -> UNREACHABLE' },
  { t: 'root', text: 'Broadcast message from root@EVILCORP (console):' },
  { t: 'nut', text: '  [upsd] OVERRIDE ACCEPTED. killpower CANCELLED.' },
  { t: 'nut', text: '  [upsmon] NUT daemon connection to g@sandbox LOST.' },
  { t: 'root', text: "  they can't reach the power. you'll have to do it yourself." },
];

export function beginPowerFailure() {
  state.nutLines = [];
  state.glitch = 0.55;
  emit();
  let i = 0;
  const step = () => {
    if (i >= NUT_SCRIPT.length) {
      // Phase 5 — the physical UNPLUG prompt goes live over the rack
      later(() => {
        advance('unplug');
        state.glitch = 0.6;
        emit();
      }, 700);
      return;
    }
    state.nutLines = [...state.nutLines, NUT_SCRIPT[i]];
    emit();
    i++;
    later(step, 520);
  };
  later(step, 400);
}

// Phase 5 -> 6 -> 7: the user pulls the plug and it all comes apart.
export function pullThePlug() {
  if (state.phase !== 'unplug') return;
  advance('blackout');
  state.glitch = 1;
  emit();

  // CRT slams to the EVILCORP logo (referenced from the VHS intro)
  // then the face
  later(() => {
    advance('face');
    state.subtitle = `You weren't supposed to see any of that, were you, ${state.hostname}?`;
    emit();
  }, 2600);

  // dial-up screech + artifact storm -> kernel panic
  later(() => {
    advance('panic');
    state.subtitle = '';
    emit();
    startTitleFlash(['WE SEE YOU', 'WE SEE YOU', 'WE SEE YOU', '']);
  }, 8000);
}

// The permanent scar. Clicking "> Go back?" lands here and it sticks
// (persisted) — every prior easter egg now returns the EVILCORP patch error.
export function goBackScarred() {
  clearTimers();
  stopTitleFlash();
  advance('scarred');
  state.glitch = 0;
  state.remoteLine = '';
  state.nutLines = [];
  state.subtitle = '';
  emit();
  // the sandbox has breached the tab: contaminated title + glitched favicon
  infectBrowserChrome();
  try {
    localStorage.setItem('gheat_story_scarred', '1');
  } catch {}
}

// Phase 7 extension: the site LOOKS normal, but the browser chrome is subtly
// wrong. A zero-width joiner + combining glitch mark rides the title, and the
// favicon is swapped for a shattered version of itself.
function infectBrowserChrome() {
  // invisible ZWJ so the tab text feels "off" without an obvious change
  setBaseTitle('gheat.net — Portfolio‍͓');
  if (typeof document === 'undefined') return;
  try {
    const url = glitchedFaviconDataURL();
    if (!url) return;
    document.querySelectorAll("link[rel~='icon']").forEach((l) => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = url;
    document.head.appendChild(link);
  } catch {}
}

// draw a small shattered/glitched CRT favicon at runtime
function glitchedFaviconDataURL() {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    // bezel + dead screen
    g.fillStyle = '#2a2622';
    g.fillRect(2, 3, 28, 26);
    g.fillStyle = '#0a120c';
    g.fillRect(5, 6, 22, 18);
    // chromatic-split green G ghosts
    g.font = 'bold 15px monospace';
    g.fillStyle = 'rgba(255,60,60,0.8)';
    g.fillText('G', 9, 20);
    g.fillStyle = 'rgba(60,255,120,0.9)';
    g.fillText('G', 11, 20);
    g.fillStyle = 'rgba(80,120,255,0.7)';
    g.fillText('G', 10, 21);
    // crack lines
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(7, 4);
    g.lineTo(16, 15);
    g.lineTo(12, 24);
    g.moveTo(16, 15);
    g.lineTo(26, 12);
    g.stroke();
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

// the Spaceships "Wait, that..." flash — a keylogger SQLite error blipped on
// the CRT for a few frames while the real project opens in a new tab
export function flashSpaceshipsScare() {
  state.spaceshipsScare = Date.now();
  emit();
  later(() => {
    state.spaceshipsScare = 0;
    emit();
  }, 260);
}

// ------------------------------------------------------------ lifecycle

export function initStory() {
  let scarred = false;
  let consented = false;
  try {
    scarred = localStorage.getItem('gheat_story_scarred') === '1';
    consented = localStorage.getItem('gheat_consent') === '1';
  } catch {}
  if (scarred) {
    state.phase = 'scarred';
    infectBrowserChrome(); // the contamination persists across reloads
  }

  // provisional hostname from local-only signals (no network) so something
  // real is shown immediately...
  mergeIntel(localIntel());

  // ...then enrich with real public IP / city / ISP in the background (merged,
  // so it never clobbers a deep grab that may already have landed).
  collectIntel().then(async (intel) => {
    mergeIntel(intel);
    // if consent was previously granted, fold in the deep hardware grab too
    if (consented) mergeIntel(await collectDeepIntel(state.intel));
  });
  // re-request precise location if it was granted before (the browser
  // remembers the grant, so this won't re-prompt)
  if (consented && ls('gheat_geo') === '1') {
    collectPreciseLocation().then((loc) => {
      if (loc && loc.lat != null) mergeIntel(loc);
    });
  }
}

// re-assert the infected title/favicon (Next's metadata can set the title
// after initStory runs on a fresh reload-into-scarred)
export function ensureScarChrome() {
  if (state.phase === 'scarred') infectBrowserChrome();
}

export function hasConsented() {
  try {
    return localStorage.getItem('gheat_consent') !== null;
  } catch {
    return false;
  }
}

export function resetStory() {
  clearTimers();
  stopTitleFlash();
  Object.assign(state, {
    phase: 'browsing',
    surveillance: [],
    remoteLine: '',
    nutLines: [],
    subtitle: '',
    glitch: 0,
    spaceshipsScare: 0,
  });
  try {
    localStorage.removeItem('gheat_story_scarred');
  } catch {}
  // restore the clean favicon + title
  if (typeof document !== 'undefined') {
    try {
      document.querySelectorAll("link[rel~='icon']").forEach((l) => l.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = '/favicon.png';
      document.head.appendChild(link);
    } catch {}
  }
  setBaseTitle('gheat.net — Portfolio');
  emit();
}

// imperative getters for non-React callers (three.js frame loops)
export function getStory() {
  return snapshot;
}
export function getPhase() {
  return state.phase;
}
export function phaseAtLeast(p) {
  return rank[state.phase] >= rank[p];
}

// -------------------------------------------------------------------- hooks

const sub = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useStory() {
  return useSyncExternalStore(sub, () => snapshot, () => snapshot);
}

export function useStoryPhase() {
  return useSyncExternalStore(sub, () => snapshot.phase, () => 'browsing');
}
