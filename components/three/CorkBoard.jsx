'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { unlockEgg } from '@/lib/eggs';
import { panTo } from '@/lib/focus';

// g's investigation board, pinned to the back wall: handwritten notes and
// polaroids connected by red string. g worked most of it out before the end —
// GHEAT CORP = EVILCORP, the 3:33 loop, the duplicate desktop, the S-O-S.
// Reading it (clicking) foreshadows the whole vault reveal and logs a note.

const NOTES = [
  { x: -0.55, y: 0.28, rot: -0.05, text: 'GHEAT CORP\n= EVILCORP ??', tone: '#e7dfc4' },
  { x: 0.05, y: 0.33, rot: 0.06, text: 'the TAPE plays\nat 3:33 EVERY\nnight. WHY', tone: '#f0e8cf' },
  { x: 0.58, y: 0.24, rot: -0.03, text: 'TWO copies of\nmy desktop\non the drive', tone: '#e2dabf' },
  { x: -0.5, y: -0.32, rot: 0.04, text: 'rack LED blinks\nS . O . S', tone: '#eee6cd' },
  { x: 0.62, y: -0.3, rot: 0.07, text: 'the tower HUMS\na password', tone: '#e7dfc4' },
  { x: 0.02, y: -0.36, rot: -0.06, text: 'am I even the\noriginal ??\n        - g', tone: '#f2ead0' },
];

// two connected polaroids
const PHOTOS = [
  { x: -0.02, y: 0.02, rot: 0.03, cap: 'the tube', kind: 'crt' },
  { x: -0.62, y: -0.02, rot: -0.04, cap: 'REDACTED', kind: 'doc' },
];

function makeNoteTexture(text, tone) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = tone;
  g.fillRect(0, 0, 256, 256);
  // paper grain / corner shadow
  g.fillStyle = 'rgba(0,0,0,0.06)';
  g.fillRect(0, 220, 256, 36);
  // pin
  g.fillStyle = '#b0201a';
  g.beginPath();
  g.arc(128, 22, 12, 0, 7);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.beginPath();
  g.arc(124, 18, 4, 0, 7);
  g.fill();
  // handwriting
  g.fillStyle = '#20242c';
  g.font = 'bold 30px "Comic Sans MS", "Segoe Script", cursive';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    g.save();
    g.translate(128, 96 + i * 36);
    g.rotate((Math.random() - 0.5) * 0.05);
    g.fillText(ln, 0, 0);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makePhotoTexture({ cap, kind }) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e8e6e0';
  g.fillRect(0, 0, 256, 256); // polaroid border
  g.fillStyle = '#0a0c10';
  g.fillRect(18, 18, 220, 190); // photo area
  if (kind === 'crt') {
    g.fillStyle = '#141b16';
    g.fillRect(70, 70, 116, 86);
    g.fillStyle = '#2f6b3a';
    g.font = '16px monospace';
    g.textAlign = 'center';
    g.fillText('GHEAT.NET', 128, 116);
    g.strokeStyle = '#333';
    g.lineWidth = 6;
    g.strokeRect(58, 58, 140, 110);
  } else {
    g.fillStyle = '#1a1a1a';
    for (let y = 40; y < 190; y += 20) {
      g.fillRect(36, y, 180, 10);
    }
    g.fillStyle = '#7a1010';
    g.fillRect(36, 96, 180, 16); // redaction bar
  }
  g.fillStyle = '#20242c';
  g.font = '22px "Segoe Script", cursive';
  g.textAlign = 'center';
  g.fillText(cap, 128, 232);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// red string connecting two board-space points (thin rotated box)
function String2D({ a, b }) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.05]} rotation={[0, 0, ang]}>
      <boxGeometry args={[len, 0.006, 0.006]} />
      <meshStandardMaterial color="#9c1414" roughness={0.7} />
    </mesh>
  );
}

export default function CorkBoard({ position = [1.5, 1.75, -3.9], active = true }) {
  const noteTex = useMemo(() => NOTES.map((n) => makeNoteTexture(n.text, n.tone)), []);
  const photoTex = useMemo(() => PHOTOS.map(makePhotoTexture), []);

  const notice = (e) => {
    e.stopPropagation();
    sfx.click();
    panTo({ pos: [1.4, 1.9, -1.0], look: [1.5, 1.75, -3.9], hold: 2.4 });
    if (unlockEgg('board')) {
      // eslint-disable-next-line no-console
      console.log(
        "%cEVIDENCE//g: GHEAT CORP = EVILCORP · 3:33 loop · two desktops · S-O-S.\n" +
          'g worked it all out. it did not save g.',
        'color:#e3a84a;font-family:monospace'
      );
    }
  };

  return (
    <group position={position}>
      {/* frame + cork */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[1.7, 1.2, 0.06]} />
        <meshStandardMaterial color="#3a2c17" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[1.58, 1.08]} />
        <meshStandardMaterial color="#8a6b3f" roughness={0.95} />
      </mesh>

      {/* red string */}
      <String2D a={[-0.55, 0.28]} b={[0.05, 0.33]} />
      <String2D a={[0.05, 0.33]} b={[0.58, 0.24]} />
      <String2D a={[-0.55, 0.28]} b={[-0.5, -0.32]} />
      <String2D a={[0.58, 0.24]} b={[0.62, -0.3]} />
      <String2D a={[0.02, 0.02]} b={[0.02, -0.36]} />

      {/* photos */}
      {PHOTOS.map((p, i) => (
        <mesh key={`ph${i}`} position={[p.x, p.y, 0.03]} rotation={[0, 0, p.rot]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial map={photoTex[i]} roughness={0.8} />
        </mesh>
      ))}

      {/* notes */}
      {NOTES.map((n, i) => (
        <mesh key={`n${i}`} position={[n.x, n.y, 0.035]} rotation={[0, 0, n.rot]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial map={noteTex[i]} transparent roughness={0.9} />
        </mesh>
      ))}

      {/* click target */}
      {active && (
        <mesh
          position={[0, 0, 0.08]}
          onClick={notice}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[1.7, 1.2, 0.12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// -------------------------------------------------- the 3:33 wall clock

function makeClockTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e8e4d8';
  g.beginPath();
  g.arc(128, 128, 120, 0, 7);
  g.fill();
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 8;
  g.stroke();
  // ticks
  g.strokeStyle = '#222';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineWidth = i % 3 === 0 ? 6 : 3;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104);
    g.lineTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
    g.stroke();
  }
  // hands frozen at 3:33 (angles from 12 o'clock, minus 90° for canvas)
  const hand = (frac, len, w, col) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(128, 128);
    g.lineTo(128 + Math.cos(a) * len, 128 + Math.sin(a) * len);
    g.stroke();
  };
  hand((3 + 33 / 60) / 12, 58, 8, '#1a1a1a'); // hour
  hand(33 / 60, 88, 5, '#1a1a1a'); // minute
  hand(33 / 60, 92, 2, '#a01010'); // second (also near 33)
  g.fillStyle = '#a01010';
  g.beginPath();
  g.arc(128, 128, 6, 0, 7);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function WallClock({ position = [-3.4, 2.35, -3.92], active = true }) {
  const tex = useMemo(() => makeClockTexture(), []);
  const done = useRef(false);
  const notice = (e) => {
    e.stopPropagation();
    if (done.current) return;
    done.current = true;
    sfx.channel();
    panTo({ pos: [-2.2, 2.3, -1.2], look: [-3.4, 2.35, -3.92], hold: 1.8 });
    unlockEgg('clock');
    // eslint-disable-next-line no-console
    console.log('%cit stopped at 3:33. they all stop at 3:33.', 'color:#ff5e5e;font-family:monospace');
  };
  return (
    <group position={position}>
      {/* casing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 40]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      {/* face */}
      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[0.3, 48]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      {active && (
        <mesh
          position={[0, 0, 0.06]}
          onClick={notice}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[0.66, 0.66, 0.12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
