'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// The warp jump: a tunnel of stars streaking past the camera along -z,
// mounted the moment the portfolio warp starts. Star speed ramps with GSAP;
// each star is a line segment whose length stretches with velocity, so at
// full speed the field smears into light-lines. All motion is delta-scaled.

const COUNT = 700;
const DEPTH = 55; // tunnel length behind the screen
const AXIS_Y = 1.04; // tunnel centered on the screen axis

export default function WarpTunnel() {
  const geomRef = useRef();
  const speed = useRef({ v: 2 });

  const stars = useMemo(() => {
    const arr = new Float32Array(COUNT * 3); // x, y, z per star
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.15 + Math.pow(Math.random(), 0.7) * 3.2;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = AXIS_Y + Math.sin(angle) * radius;
      arr[i * 3 + 2] = 1 - Math.random() * DEPTH;
    }
    return arr;
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 6), []);

  useEffect(() => {
    const tween = gsap.to(speed.current, {
      v: 85,
      duration: 2.3,
      ease: 'power2.in',
    });
    return () => tween.kill();
  }, []);

  useFrame((_, delta) => {
    const v = speed.current.v;
    const len = Math.min(v * 0.055, 7);
    for (let i = 0; i < COUNT; i++) {
      let z = stars[i * 3 + 2] + v * delta;
      if (z > 1.5) z -= DEPTH;
      stars[i * 3 + 2] = z;
      const x = stars[i * 3];
      const y = stars[i * 3 + 1];
      const o = i * 6;
      positions[o] = x;
      positions[o + 1] = y;
      positions[o + 2] = z;
      positions[o + 3] = x;
      positions[o + 4] = y;
      positions[o + 5] = z - len;
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#bfe0ff"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
