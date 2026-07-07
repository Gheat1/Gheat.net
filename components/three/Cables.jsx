'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Thick rubber cables strewn across the floor, snaking between the rack,
// the PC rig and the CRT. Deterministic (seeded) so the mess is art-directed.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// each cable: rough start/end anchors, sagging & wandering across the floor
const RUNS = [
  { from: [-2.4, 0.4, -2.0], to: [0.3, 0.5, 0.1], color: '#101014' },
  { from: [-2.6, 0.9, -2.1], to: [-0.3, 0.45, 0.2], color: '#0c0c10' },
  { from: [2.1, 0.3, -1.9], to: [0.4, 0.5, 0.15], color: '#14100c' },
  { from: [-2.2, 0.2, -2.3], to: [2.0, 0.2, -1.8], color: '#101014' },
  { from: [-3.5, 0.02, 1.5], to: [-2.3, 0.3, -1.9], color: '#0e0e12' },
  { from: [3.2, 0.02, 1.2], to: [1.9, 0.25, -1.7], color: '#101014' },
  { from: [-1.5, 0.02, 2.2], to: [1.4, 0.02, 1.8], color: '#0c0c10' },
];

export default function Cables() {
  const cables = useMemo(() => {
    const rand = mulberry32(1987);
    return RUNS.map((run, i) => {
      const from = new THREE.Vector3(...run.from);
      const to = new THREE.Vector3(...run.to);
      const points = [from];
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const p = from.clone().lerp(to, s / steps);
        p.x += (rand() - 0.5) * 0.9;
        p.z += (rand() - 0.5) * 0.9;
        // cables lie on the floor between their anchors
        p.y = 0.02 + rand() * 0.03;
        points.push(p);
      }
      points.push(to);
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(
        curve,
        48,
        0.018 + rand() * 0.012,
        6,
        false
      );
      return { geometry, color: run.color, key: i };
    });
  }, []);

  return (
    <group>
      {cables.map(({ geometry, color, key }) => (
        <mesh key={key} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
