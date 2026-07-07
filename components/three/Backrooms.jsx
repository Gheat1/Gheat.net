'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { recordSurveillance } from '@/lib/story';
import { startWind, startPanting, stepSound } from './backroomsAudio';

// THE BACKROOMS — Level 0.
//
// Lazy-loaded: none of this (code, textures, audio) ships until `noclip`.
//
// The maze is infinite and deterministic: a hash decides which cell edges
// grow walls, so wandering keeps generating the same consistent labyrinth.
// Rendering is a sliding window of instanced meshes around the player,
// rebuilt only on cell crossings; the same pure wall function drives
// collision so physics and visuals can't disagree.
//
// The sequence: you fall from high above, looking down at the glowing light
// grid rising out of the dark (the ceiling is only visible from below, so
// you drop straight through it), wind screaming, slow tumble — THUD.
// Camera shake, knees buckle, and the panting starts. WASD to walk, shift
// to run (breathing keeps up), mouselook via a hand-rolled pointer lock.

const CELL = 4;
const WALL_H = 3.2;
const WALL_T = 0.32;
const RADIUS = 6; // cells rendered in each direction
const EYE = 1.62;
const SPAWN_Y = 46; // the fall
const PLAYER_R = 0.34;
const WALK = 3.0;
const RUN = 5.6;
const GRAVITY = 26;

const MAX_WALLS = 900;
const MAX_LIGHTS = 64;
const MAX_DECALS = 12; // g's scrawls + storage monitors placed around you
const EXT = (RADIUS + 1) * CELL * 2; // floor/ceiling apron size

// STORY TIE-IN: this is EVILCORP's unallocated cold storage — the raw drive
// where archived subjects live. g has been scrawling on the walls for 14,247
// nights; the storage monitors list subject IDs, including yours.
//   kind 'scrawl'  — g's charcoal handwriting on the wallpaper
//   kind 'monitor' — a flickering storage terminal on the wall
const DECAL_MESSAGES = [
  { text: 'g was here', kind: 'scrawl' },
  { text: 'the exit is a lie', kind: 'scrawl' },
  { text: 'count the doors', kind: 'scrawl' },
  { text: 'they keep us in the walls', kind: 'scrawl' },
  { text: 'i mapped it 1000 times', kind: 'scrawl' },
  { text: '03:33 again', kind: 'scrawl' },
  { text: 'you were copied at the door', kind: 'scrawl' },
  { text: "don't read the vault", kind: 'scrawl' },
  { text: 'SUBJECT 001 — RESTORING', kind: 'monitor' },
  { text: 'SUBJECT 002 — YOU', kind: 'monitor' },
  { text: 'gheat.desktop.bak', kind: 'monitor' },
  { text: 'SECTOR 0x1987 — NOT INDEXED', kind: 'monitor' },
];

// cells right around the spawn are forced to specific messages so the story
// beats are guaranteed near where you land (indices into DECAL_MESSAGES).
// duplicated across radius 1-2 so at least one lands on a real wall.
const FORCED_DECALS = {
  '1,0': 9, '2,0': 9, // SUBJECT 002 — YOU
  '0,1': 0, '0,2': 0, // g was here
  '-1,0': 8, '-2,0': 8, // SUBJECT 001 — RESTORING
  '0,-1': 1, '0,-2': 1, // the exit is a lie
};

// find a real wall bounding cell (i,j) to mount a decal flat against, facing
// into the cell's open space. Returns { px,pz,rotY } or null (open cell).
// (Same wall hashes as cellWalls, so decals never float in mid-air.)
function findWallMount(i, j, h) {
  const x = i * CELL;
  const z = j * CELL;
  const c = [];
  // east wall of (i,j) — face points -x into the cell
  if (cellHash(i, j, 1) < 0.4) c.push({ px: x + CELL / 2 - WALL_T / 2, pz: z, rotY: -Math.PI / 2 });
  // north wall of (i,j) — face points -z
  if (cellHash(i, j, 2) < 0.4) c.push({ px: x, pz: z + CELL / 2 - WALL_T / 2, rotY: Math.PI });
  // west wall (east wall of i-1) — face points +x
  if (cellHash(i - 1, j, 1) < 0.4) c.push({ px: x - CELL / 2 + WALL_T / 2, pz: z, rotY: Math.PI / 2 });
  // south wall (north wall of j-1) — face points +z
  if (cellHash(i, j - 1, 2) < 0.4) c.push({ px: x, pz: z - CELL / 2 + WALL_T / 2, rotY: 0 });
  if (!c.length) return null;
  return c[Math.floor(h * c.length) % c.length];
}

function makeDecalTexture({ text, kind }) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 256);
  if (kind === 'monitor') {
    g.fillStyle = '#02100a';
    g.fillRect(28, 54, 456, 148);
    g.strokeStyle = '#0d6b2a';
    g.lineWidth = 5;
    g.strokeRect(28, 54, 456, 148);
    // scanlines
    g.strokeStyle = 'rgba(55,255,94,0.08)';
    g.lineWidth = 1;
    for (let y = 58; y < 200; y += 4) {
      g.beginPath();
      g.moveTo(30, y);
      g.lineTo(482, y);
      g.stroke();
    }
    g.fillStyle = '#37ff5e';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 34px monospace';
    g.fillText(text, 256, 120);
    g.font = '15px monospace';
    g.fillStyle = '#1f8f45';
    g.fillText('EVILCORP // COLD STORAGE', 256, 168);
  } else {
    // SCRATCHED into the wall — not printed. Each letter is drawn with
    // position/rotation jitter as broken, dashed grooves: a dark shadow cut
    // plus a light catch-light lip (the bevel that reads as an incision),
    // over a scatter of scratch scuffs.
    // shrink the font for longer scrawls so nothing clips the 512px canvas
    let fontSize = 46;
    g.font = `bold italic ${fontSize}px Georgia, "Times New Roman", serif`;
    const measured = g.measureText(text).width;
    if (measured > 470) {
      fontSize = Math.max(26, Math.floor((fontSize * 470) / measured));
      g.font = `bold italic ${fontSize}px Georgia, "Times New Roman", serif`;
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineCap = 'round';

    // scuff scratches scattered around the writing
    g.strokeStyle = 'rgba(120,102,70,0.28)';
    for (let s = 0; s < 22; s++) {
      const x1 = 40 + ((s * 137) % 430);
      const y1 = 60 + ((s * 89) % 132);
      const len = 5 + ((s * 53) % 26);
      const ang = s * 0.9;
      g.lineWidth = 0.7 + (s % 2) * 0.5;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
      g.stroke();
    }

    // letter-by-letter so each is crooked, like it was gouged in by hand
    const chars = [...text];
    const widths = chars.map((c) => g.measureText(c).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    let cx = 256 - totalW / 2;

    const carveStroke = (c, dash, dashOff) => {
      g.setLineDash(dash);
      g.lineDashOffset = dashOff;
      // deep shadow groove (down-right)
      g.strokeStyle = 'rgba(14,7,3,0.85)';
      g.lineWidth = 3.4;
      g.strokeText(c, 1.6, 2.0);
      // the raw scraped channel
      g.strokeStyle = 'rgba(70,52,28,0.85)';
      g.lineWidth = 1.6;
      g.strokeText(c, 0, 0);
      // catch-light lip (up-left) — where the cut edge catches light
      g.strokeStyle = 'rgba(224,208,166,0.75)';
      g.lineWidth = 1.1;
      g.strokeText(c, -1.1, -1.3);
    };

    for (let n = 0; n < chars.length; n++) {
      const w = widths[n];
      g.save();
      g.translate(cx + w / 2, 128 + (Math.random() - 0.5) * 7);
      g.rotate((Math.random() - 0.5) * 0.16);
      carveStroke(chars[n], [7, 3], (n * 5) % 10);
      g.restore();
      cx += w;
    }
    g.setLineDash([]);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cellHash(i, j, salt) {
  let h = (i * 374761393 + j * 668265263 + salt * 2246822519) | 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// wall boxes for one cell — pure, used for BOTH rendering and collision.
function cellWalls(i, j) {
  const out = [];
  const x = i * CELL;
  const z = j * CELL;
  if (cellHash(i, j, 1) < 0.4) {
    out.push({ x: x + CELL / 2, z, w: WALL_T, d: CELL + WALL_T });
  }
  if (cellHash(i, j, 2) < 0.4) {
    out.push({ x, z: z + CELL / 2, w: CELL + WALL_T, d: WALL_T });
  }
  if (cellHash(i, j, 3) < 0.08 && !(i === 0 && j === 0)) {
    out.push({ x, z, w: 0.9, d: 0.9 }); // lone pillar (never in the spawn cell)
  }
  return out;
}

function collide(pz, nx, nz) {
  const ci = Math.round(nx / CELL);
  const cj = Math.round(nz / CELL);
  let outX = nx;
  let outZ = nz;
  for (let i = ci - 1; i <= ci + 1; i++) {
    for (let j = cj - 1; j <= cj + 1; j++) {
      for (const w of cellWalls(i, j)) {
        const hw = w.w / 2 + PLAYER_R;
        const hd = w.d / 2 + PLAYER_R;
        if (Math.abs(pz - w.z) < hd && Math.abs(outX - w.x) < hw) {
          outX = w.x + Math.sign(outX - w.x) * hw;
        }
        if (Math.abs(outX - w.x) < hw && Math.abs(outZ - w.z) < hd) {
          outZ = w.z + Math.sign(outZ - w.z) * hd;
        }
      }
    }
  }
  return [outX, outZ];
}

// --------------------------------------------------------- textures

// yellowed acoustic drop-ceiling: even square tiles, perforation speckle,
// thin dark grout grid. Light base colors — the old version multiplied dark
// shades against a dark tint and rendered essentially black.
function makeCeilingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const shades = ['#cfc49b', '#c8bd93', '#d2c7a0', '#c3b88e'];
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      g.fillStyle = shades[ty * 2 + tx];
      g.fillRect(tx * 128, ty * 128, 128, 128);
      // acoustic perforations
      for (let s = 0; s < 260; s++) {
        const v = Math.random();
        g.fillStyle = `rgba(90,80,50,${0.12 + v * 0.18})`;
        g.fillRect(tx * 128 + Math.random() * 124 + 2, ty * 128 + Math.random() * 124 + 2, 1.4, 1.4);
      }
      // faint water stain on some tiles
      if ((tx + ty) % 2 === 0) {
        g.fillStyle = 'rgba(140,115,60,0.13)';
        g.beginPath();
        g.arc(tx * 128 + 88, ty * 128 + 40, 30, 0, 7);
        g.fill();
      }
      // grout grid
      g.strokeStyle = '#5f5638';
      g.lineWidth = 3;
      g.strokeRect(tx * 128 + 1.5, ty * 128 + 1.5, 125, 125);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(EXT / 4, EXT / 4); // texture spans 4m (two 2m tiles)
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// damp speckled carpet
function makeCarpetTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#33290f';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const v = Math.random();
    g.fillStyle = v > 0.5 ? `rgba(74,62,28,${v * 0.35})` : `rgba(12,9,3,${(1 - v) * 0.4})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(EXT / 3, EXT / 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// fallback if backroomswallpaper.png ever goes missing
function makeFallbackWallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#b3a35c';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#a4954f';
  g.lineWidth = 3;
  for (let x = 0; x < 128; x += 16) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 128);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// --------------------------------------------------------- component

export default function Backrooms({ onState }) {
  const { camera, gl } = useThree();

  const wallsRef = useRef();
  const lightsRef = useRef();
  const wallMatRef = useRef();
  const floorMatRef = useRef();
  const floorRef = useRef();
  const ceilRef = useRef();
  const lampRef = useRef(); // the one real point light, parked at the nearest fixture

  const keys = useRef({});
  const vy = useRef(0);
  const landed = useRef(false);
  const lockedRef = useRef(false);
  const justLocked = useRef(false);
  const mouseDX = useRef(0);
  const mouseDY = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const bobPhase = useRef(0);
  const lastStep = useRef(0);
  const crouch = useRef(0); // knee-buckle on landing
  const shake = useRef(0); // impact shake amplitude
  const exert = useRef(0.2); // feeds the panting
  const lastCell = useRef([Infinity, Infinity]);
  const lightsData = useRef([]);
  const decalData = useRef([]); // [{ mount, texIndex, isMon }]
  const decalGroupRefs = useRef([]);
  const decalScreenRefs = useRef([]);
  const decalBezelRefs = useRef([]);
  const pant = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
  const colorTmp = useMemo(() => new THREE.Color(), []);

  const ceilTex = useMemo(() => makeCeilingTexture(), []);
  const decalTextures = useMemo(() => DECAL_MESSAGES.map(makeDecalTexture), []);

  // real textures (wallpaper + carpet) with procedural fallbacks
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    const setup = (t, repeatX, repeatY) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      return t;
    };
    const applyTo = (ref) => (t) => {
      if (!alive || !ref.current) return;
      ref.current.map = t;
      ref.current.needsUpdate = true;
    };
    loader.load(
      '/backroomswallpaper.png',
      (t) => applyTo(wallMatRef)(setup(t, 2, 1.5)), // ~2m pattern on a 4m face
      undefined,
      () => applyTo(wallMatRef)(setup(makeFallbackWallTexture(), 2, 1.5))
    );
    loader.load(
      '/backroomsfloor.png',
      (t) => applyTo(floorMatRef)(setup(t, EXT / 2, EXT / 2)), // 2m per repeat
      undefined,
      () => applyTo(floorMatRef)(setup(makeCarpetTexture(), EXT / 3, EXT / 3))
    );
    return () => {
      alive = false;
    };
  }, [gl]);

  // enter: drop in from way up; exit: give the lens back
  useEffect(() => {
    const prevFov = camera.fov;
    camera.position.set(0, SPAWN_Y, 0);
    vy.current = 0;
    camera.fov = 88;
    camera.updateProjectionMatrix();
    return () => {
      camera.fov = prevFov;
      camera.updateProjectionMatrix();
      document.body.style.cursor = 'auto';
    };
  }, [camera]);

  // ambience: fluorescent hum the whole time, wind while falling
  useEffect(() => sfx.startBuzz(), []);
  useEffect(() => {
    const stopWind = startWind();
    return () => {
      stopWind();
      pant.current?.stop();
    };
  }, []);

  // hand-rolled pointer lock + mouselook. Hardened:
  //  - unadjustedMovement (kills Chrome/Linux mouse-acceleration jumps)
  //  - deltas accumulate here and are consumed once per frame in useFrame,
  //    so event rate and frame rate can't fight
  //  - the first event after locking is dropped (Chrome can report a huge
  //    bogus jump there) and every delta is spike-clamped
  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => {
      if (document.pointerLockElement) return;
      try {
        const p = el.requestPointerLock({ unadjustedMovement: true });
        // some browsers reject the options object — retry plain
        if (p?.catch) p.catch(() => el.requestPointerLock());
      } catch {
        el.requestPointerLock();
      }
    };
    const onLockChange = () => {
      const locked = document.pointerLockElement === el;
      lockedRef.current = locked;
      justLocked.current = locked;
      onState?.({ locked });
    };
    const onLockError = () => {
      lockedRef.current = false;
      onState?.({ locked: false });
    };
    const onMove = (e) => {
      if (!lockedRef.current) return;
      if (justLocked.current) {
        justLocked.current = false;
        return;
      }
      mouseDX.current += THREE.MathUtils.clamp(e.movementX || 0, -150, 150);
      mouseDY.current += THREE.MathUtils.clamp(e.movementY || 0, -150, 150);
    };
    el.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    document.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      document.removeEventListener('mousemove', onMove);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl, onState]);

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true);
    const up = (e) => (keys.current[e.code] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // rebuild the instanced maze window around a cell
  const rebuildChunk = (ci, cj) => {
    const walls = wallsRef.current;
    const lights = lightsRef.current;
    if (!walls || !lights) return;
    let wCount = 0;
    const lData = [];
    for (let i = ci - RADIUS; i <= ci + RADIUS; i++) {
      for (let j = cj - RADIUS; j <= cj + RADIUS; j++) {
        for (const w of cellWalls(i, j)) {
          if (wCount >= MAX_WALLS) break;
          dummy.position.set(w.x, WALL_H / 2, w.z);
          dummy.scale.set(w.w, WALL_H, w.d);
          dummy.updateMatrix();
          walls.setMatrixAt(wCount++, dummy.matrix);
        }
        // square fixtures on a strict even grid, every other cell both ways
        if (((i % 2) + 2) % 2 === 0 && ((j % 2) + 2) % 2 === 0 && lData.length < MAX_LIGHTS) {
          const r = cellHash(i, j, 7);
          lData.push({
            x: i * CELL,
            z: j * CELL,
            seed: (i * 131 + j * 977) | 0,
            mode: r < 0.07 ? 'dead' : r < 0.24 ? 'faulty' : 'steady',
          });
          dummy.position.set(i * CELL, WALL_H - 0.03, j * CELL);
          dummy.scale.set(1.7, 0.07, 1.7);
          dummy.updateMatrix();
          lights.setMatrixAt(lData.length - 1, dummy.matrix);
          lights.setColorAt(lData.length - 1, colorTmp.setRGB(1, 1, 1));
        }
      }
    }
    walls.count = wCount;
    lights.count = lData.length;
    walls.instanceMatrix.needsUpdate = true;
    lights.instanceMatrix.needsUpdate = true;
    if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
    lightsData.current = lData;

    // ---- g's scrawls + storage monitors, mounted flat on real walls ----
    const markers = [];
    for (let i = ci - RADIUS; i <= ci + RADIUS; i++) {
      for (let j = cj - RADIUS; j <= cj + RADIUS; j++) {
        const key = `${i},${j}`;
        let texIndex = -1;
        if (FORCED_DECALS[key] !== undefined) {
          texIndex = FORCED_DECALS[key];
        } else if (cellHash(i, j, 20) < 0.1 && !(i === 0 && j === 0)) {
          texIndex = Math.floor(cellHash(i, j, 21) * DECAL_MESSAGES.length);
        }
        if (texIndex < 0) continue;
        const mount = findWallMount(i, j, cellHash(i, j, 22));
        if (!mount) continue; // no wall here — don't float it
        const d = (mount.px - ci * CELL) ** 2 + (mount.pz - cj * CELL) ** 2;
        markers.push({
          mount,
          texIndex,
          isMon: DECAL_MESSAGES[texIndex].kind === 'monitor',
          d,
        });
      }
    }
    markers.sort((a, b) => a.d - b.d);
    decalData.current = markers.slice(0, MAX_DECALS);

    // position the pooled units flush on their walls
    for (let i = 0; i < MAX_DECALS; i++) {
      const grp = decalGroupRefs.current[i];
      const screen = decalScreenRefs.current[i];
      const bezel = decalBezelRefs.current[i];
      const m = decalData.current[i];
      if (!grp) continue;
      if (!m) {
        grp.visible = false;
        continue;
      }
      grp.visible = true;
      grp.position.set(m.mount.px, m.isMon ? 1.72 : 1.5, m.mount.pz);
      grp.rotation.set(0, m.mount.rotY, 0);
      if (bezel) bezel.visible = m.isMon;
      if (screen) {
        screen.material.map = decalTextures[m.texIndex];
        screen.material.opacity = 1;
        screen.material.needsUpdate = true;
        // monitor screen sits on the front of the bezel; scrawl lies flush
        screen.position.z = m.isMon ? 0.122 : 0.02;
        if (m.isMon) screen.scale.set(1.55, 0.87, 1);
        else screen.scale.set(1.9, 0.95, 1);
      }
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const pos = camera.position;
    const k = keys.current;

    // consume accumulated mouse-look deltas exactly once per frame
    if (mouseDX.current || mouseDY.current) {
      yaw.current -= mouseDX.current * 0.0022;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - mouseDY.current * 0.0022,
        -1.45,
        1.45
      );
      mouseDX.current = 0;
      mouseDY.current = 0;
    }

    let baseYaw = yaw.current;
    let basePitch = pitch.current;
    let roll = 0;
    let camY = EYE;

    if (!landed.current) {
      // ---------- THE FALL ----------
      vy.current -= GRAVITY * dt;
      pos.y += vy.current * dt;

      // stare at the light grid rushing up, tumbling slowly, then pull up
      const above = THREE.MathUtils.clamp((pos.y - EYE) / (12 - EYE), 0, 1);
      yaw.current += 0.45 * dt;
      baseYaw = yaw.current;
      basePitch = THREE.MathUtils.lerp(-0.15, -1.35, above);
      roll = Math.sin(t * 1.1) * 0.22 * above;
      camera.fov = 75 + 14 * above;
      camera.updateProjectionMatrix();

      if (pos.y <= EYE) {
        // ---------- IMPACT ----------
        pos.y = EYE;
        landed.current = true;
        pitch.current = -0.12;
        shake.current = 1;
        crouch.current = 0.38;
        camera.fov = 75;
        camera.updateProjectionMatrix();
        sfx.thud();
        pant.current = startPanting();
        pant.current.setIntensity(0.9); // knocked the wind out
        exert.current = 0.9;
        // the surveillance notices you're down in the archive
        recordSurveillance('storage');
        onState?.({ landed: true });
      }
      euler.set(basePitch, baseYaw, roll);
      camera.quaternion.setFromEuler(euler);
      // keep the maze window alive under the fall
    } else {
      // ---------- ON FOOT ----------
      const mf = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      const ms = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      const moving = lockedRef.current && (mf || ms);
      const running = moving && (k.ShiftLeft || k.ShiftRight);

      if (moving) {
        const speed = running ? RUN : WALK;
        const sy = Math.sin(yaw.current);
        const cy = Math.cos(yaw.current);
        const nx = pos.x + (-sy * mf + cy * ms) * speed * dt;
        const nz = pos.z + (-cy * mf - sy * ms) * speed * dt;
        const [cx, cz] = collide(pos.z, nx, nz);
        pos.x = cx;
        pos.z = cz;

        // head bob + footsteps
        bobPhase.current += speed * dt * 1.85;
        const stepBeat = Math.floor(bobPhase.current / Math.PI);
        if (stepBeat !== lastStep.current) {
          lastStep.current = stepBeat;
          stepSound(running);
        }
      }

      // breathing keeps score
      const target = running ? 1 : moving ? 0.5 : 0.14;
      exert.current = THREE.MathUtils.damp(exert.current, target, running ? 1.2 : 0.35, dt);
      pant.current?.setIntensity(exert.current);

      // camera pose: mouse + bob + landing crouch + impact shake + unease
      crouch.current *= Math.exp(-3.2 * dt);
      shake.current *= Math.exp(-2.6 * dt);
      const bobAmp = moving ? (running ? 0.05 : 0.032) : 0;
      camY = EYE - crouch.current + Math.sin(bobPhase.current * 2) * bobAmp;
      roll =
        Math.sin(bobPhase.current) * (moving ? 0.014 : 0) +
        Math.sin(t * 0.9) * 0.004 + // never quite still
        shake.current * 0.05 * Math.sin(t * 61);
      basePitch =
        pitch.current +
        Math.sin(t * 1.3) * 0.005 * (1 + exert.current) +
        shake.current * 0.09 * Math.sin(t * 53);
      baseYaw =
        yaw.current +
        Math.sin(t * 0.7 + 2) * 0.004 +
        shake.current * 0.07 * Math.sin(t * 47);

      pos.y = camY;
      euler.set(basePitch, baseYaw, roll);
      camera.quaternion.setFromEuler(euler);
    }

    // ---------- sliding maze window ----------
    const ci = Math.round(pos.x / CELL);
    const cj = Math.round(pos.z / CELL);
    if (ci !== lastCell.current[0] || cj !== lastCell.current[1]) {
      lastCell.current = [ci, cj];
      rebuildChunk(ci, cj);
      if (floorRef.current) {
        floorRef.current.position.set(ci * CELL, 0, cj * CELL);
        floorRef.current.scale.set(EXT, EXT, 1);
      }
      if (ceilRef.current) {
        ceilRef.current.position.set(ci * CELL, WALL_H, cj * CELL);
        ceilRef.current.scale.set(EXT, EXT, 1);
      }
    }

    // ---------- fluorescent flicker ----------
    const lights = lightsRef.current;
    if (lights && lightsData.current.length) {
      let bestD = Infinity;
      let bestX = 0;
      let bestZ = 0;
      let bestB = 0;
      for (let idx = 0; idx < lightsData.current.length; idx++) {
        const L = lightsData.current[idx];
        let b;
        if (L.mode === 'dead') {
          b = 0.04;
        } else if (L.mode === 'faulty') {
          // erratic strobe with long brown-outs
          const fast = cellHash(L.seed, Math.floor(t * 13), 8) < 0.45 ? 0.05 : 1.15;
          const slow = cellHash(L.seed, Math.floor(t * 0.7), 9) < 0.3 ? 0.06 : 1;
          b = fast * slow;
        } else {
          b = 0.88 + 0.12 * Math.sin(t * 31 + L.seed) * Math.sin(t * 7.1 + L.seed * 0.7);
        }
        colorTmp.setRGB(b, b * 0.93, b * 0.7);
        lights.setColorAt(idx, colorTmp);
        if (L.mode !== 'dead') {
          const d = (L.x - pos.x) ** 2 + (L.z - pos.z) ** 2;
          if (d < bestD) {
            bestD = d;
            bestX = L.x;
            bestZ = L.z;
            bestB = b;
          }
        }
      }
      lights.instanceColor.needsUpdate = true;
      // the single real light lives under the nearest working fixture and
      // flickers with it — walls and floor pulse when it strobes
      if (lampRef.current) {
        lampRef.current.position.set(bestX, WALL_H - 0.5, bestZ);
        lampRef.current.intensity = 4.5 * bestB;
      }
    }

    // ---------- monitors flicker like live storage terminals ----------
    for (let i = 0; i < MAX_DECALS; i++) {
      const m = decalData.current[i];
      if (!m || !m.isMon) continue;
      const screen = decalScreenRefs.current[i];
      if (screen) {
        screen.material.opacity =
          0.8 + 0.2 * Math.sin(t * 26 + m.mount.px) * Math.sin(t * 5.3);
      }
    }
  });

  return (
    <>
      {/* dark, close air — the fog owns the distance. hemisphere groundColor
          keeps the ceiling readable (it faces down, so it samples "ground") */}
      <color attach="background" args={['#120f07']} />
      <fog attach="fog" args={['#120f07', 3.5, 24]} />
      <ambientLight intensity={0.55} color="#b3a069" />
      <hemisphereLight intensity={0.3} color="#c8b878" groundColor="#6b5f38" />
      <pointLight ref={lampRef} color="#ffdf9e" intensity={4} distance={14} decay={1.7} />

      {/* wallpapered walls */}
      <instancedMesh ref={wallsRef} args={[undefined, undefined, MAX_WALLS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={wallMatRef} color="#b8ad85" roughness={0.92} />
      </instancedMesh>

      {/* square light panels — glow is per-instance color, flickered above */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, MAX_LIGHTS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* g's scrawls + storage monitors — pooled units mounted flat on walls.
          each group is placed + oriented against a real wall on chunk rebuild;
          the bezel box shows only for monitors (a real screen jutting out). */}
      {Array.from({ length: MAX_DECALS }).map((_, i) => (
        <group key={i} ref={(el) => (decalGroupRefs.current[i] = el)} visible={false}>
          {/* monitor housing — dark plastic bezel protruding from the wall */}
          <mesh
            ref={(el) => (decalBezelRefs.current[i] = el)}
            position={[0, 0, 0.06]}
            visible={false}
          >
            <boxGeometry args={[1.74, 1.02, 0.12]} />
            <meshStandardMaterial color="#0b0b0e" roughness={0.55} metalness={0.35} />
          </mesh>
          {/* the writing / screen face */}
          <mesh ref={(el) => (decalScreenRefs.current[i] = el)} position={[0, 0, 0.02]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* damp carpet — backroomsfloor.png (procedural speckle fallback) */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial ref={floorMatRef} color="#b5aa80" roughness={1} />
      </mesh>

      {/* even ceiling tile grid — only visible from below, so the fall drops
          straight through it toward the glowing light grid */}
      <mesh ref={ceilRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={ceilTex} color="#f0e8c8" roughness={0.95} />
      </mesh>
    </>
  );
}
