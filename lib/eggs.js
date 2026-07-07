'use client';

// Cross-tree store for the easter-egg hunt + story surveillance, shared
// between the 3D room and the OS without prop drilling. useSyncExternalStore
// keeps it dependency-free.
//
// The chain (each is also a "breadcrumb g left before EVILCORP erased them"):
//   server — click the red LED on the rack        -> server_logs.txt
//   rig    — click the PC rig's power light        -> rig_bios.txt (password)
//   root   — `login evilcorp87` in TERMINAL.EXE    -> root shell
//   vault  — `vault` as root                       -> surveillance dashboard
//   konami — ↑↑↓↓←→←→BA anywhere in the OS
//   ch3    — click a TV knob while in the room
//   clock  — click the taskbar clock (3:33)
//   noclip — fall out of reality into unformatted EVILCORP storage
import { useSyncExternalStore } from 'react';

export const EGG_KEYS = [
  'server',
  'rig',
  'root',
  'vault',
  'konami',
  'ch3',
  'clock',
  'noclip',
  'camera', // stared into the CCTV camera watching the room
  'board', // read g's investigation corkboard
];

const state = Object.fromEntries(EGG_KEYS.map((k) => [k, false]));
const unlockedAt = {}; // key -> ISO string, feeds the surveillance dashboard
let snapshot = { ...state };
const EMPTY = Object.freeze({ ...state });

const listeners = new Set();
const unlockListeners = new Set(); // fired once per fresh unlock (tab flicker, logging)
let blocked = false; // set by the story once EVILCORP "patches" everything

function emit() {
  snapshot = { ...state };
  listeners.forEach((l) => l());
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// subscribe to fresh unlocks — used for the browser-tab flicker meta-game and
// the surveillance feed. cb receives the egg key.
export function onUnlock(cb) {
  unlockListeners.add(cb);
  return () => unlockListeners.delete(cb);
}

// returns true only the FIRST time an egg unlocks. Blocked once EVILCORP has
// "patched the vulnerability" (post-climax scarred state).
export function unlockEgg(name) {
  if (blocked || state[name]) return false;
  state[name] = true;
  unlockedAt[name] = new Date().toISOString();
  try {
    localStorage.setItem('gheat_egg_' + name, '1');
    localStorage.setItem('gheat_at_' + name, unlockedAt[name]);
  } catch {}
  emit();
  unlockListeners.forEach((l) => l(name));
  return true;
}

export function getUnlockedAt(name) {
  return unlockedAt[name] || null;
}

export function setBlocked(v) {
  blocked = v;
}

export function isBlocked() {
  return blocked;
}

// factory reset — wipes the hunt AND the story so you can hand off a fresh run
export function resetEggs() {
  for (const k of EGG_KEYS) {
    state[k] = false;
    delete unlockedAt[k];
    try {
      localStorage.removeItem('gheat_egg_' + k);
      localStorage.removeItem('gheat_at_' + k);
    } catch {}
  }
  blocked = false;
  emit();
}

export function hydrateEggs() {
  let dirty = false;
  for (const k of EGG_KEYS) {
    try {
      if (localStorage.getItem('gheat_egg_' + k) === '1' && !state[k]) {
        state[k] = true;
        unlockedAt[k] = localStorage.getItem('gheat_at_' + k) || new Date().toISOString();
        dirty = true;
      }
    } catch {}
  }
  if (dirty) emit();
}

export function getEggs() {
  return { ...state };
}

export function useEgg(name) {
  return useSyncExternalStore(subscribe, () => snapshot[name], () => false);
}

export function useEggs() {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
