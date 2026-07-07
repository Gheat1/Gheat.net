'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { unlockEgg } from '@/lib/eggs';
import { panTo } from '@/lib/focus';

// A CCTV camera bolted into a ceiling corner. It slowly TRACKS the pointer —
// wherever you move the mouse, the lens follows, and its red REC LED blinks.
// Clicking it (you notice you're being watched) is an easter egg: it records
// a surveillance note and pans you up to meet its gaze.

// mounted high on the LEFT wall, angled down over the room — clearly in the
// overview frame, and its blinking red light lights up the corner so you spot it
const CAM_POS = new THREE.Vector3(-4.6, 2.75, -1.4);

export default function SurveillanceCamera({ active = true }) {
  const pivot = useRef();
  const led = useRef();
  const redLight = useRef();
  const clicked = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // aim at a point that follows the pointer — the "viewer" it's watching
    target.set(
      state.pointer.x * 3.4,
      1.1 + state.pointer.y * 1.0,
      2.6 + Math.sin(t * 0.3) * 0.2
    );
    if (pivot.current) {
      dummy.position.copy(CAM_POS);
      dummy.lookAt(target); // +z faces the target for a plain Object3D
      pivot.current.quaternion.slerp(dummy.quaternion, 0.06);
    }
    // blinking red REC light — the thing you notice in the dark
    const rate = clicked.current ? 9 : 2.2;
    const on = Math.sin(t * rate) > 0 ? 1 : 0.08;
    if (led.current) {
      led.current.material.emissiveIntensity = on * (clicked.current ? 6 : 3.6);
    }
    if (redLight.current) {
      redLight.current.intensity = on * (clicked.current ? 1.6 : 0.9);
    }
  });

  const notice = (e) => {
    e.stopPropagation();
    clicked.current = true;
    sfx.channel();
    panTo({ pos: [-2.4, 2.2, 0.4], look: [-4.25, 3.0, -3.15], hold: 2.0 });
    if (unlockEgg('camera')) {
      // eslint-disable-next-line no-console
      console.log(
        '%cSYS//CAM-01: subject made eye contact. recording flagged. smile.',
        'color:#ff3030;font-family:monospace'
      );
    }
  };

  return (
    <group position={CAM_POS.toArray()}>
      {/* ceiling mount bracket */}
      <mesh position={[0, 0.16, -0.05]}>
        <boxGeometry args={[0.05, 0.32, 0.05]} />
        <meshStandardMaterial color="#26292d" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, -0.05]}>
        <boxGeometry args={[0.18, 0.04, 0.18]} />
        <meshStandardMaterial color="#1c1e22" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* the swiveling head */}
      <group ref={pivot}>
        {/* housing */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.24, 0.2, 0.36]} />
          <meshStandardMaterial color="#2a2d31" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* lens barrel */}
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.16, 20]} />
          <meshStandardMaterial color="#101216" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* glass */}
        <mesh position={[0, 0, 0.385]}>
          <circleGeometry args={[0.055, 20]} />
          <meshStandardMaterial color="#05070a" metalness={0.9} roughness={0.1} emissive="#0a1420" emissiveIntensity={0.4} />
        </mesh>
        {/* red REC LED — bigger + a real red glow so it's spottable */}
        <mesh ref={led} position={[0.08, 0.075, 0.19]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#1a0000" emissive="#ff1818" emissiveIntensity={3.6} toneMapped={false} />
        </mesh>
        <pointLight ref={redLight} position={[0.08, 0.075, 0.24]} color="#ff2020" intensity={0.9} distance={2.4} decay={2} />

        {/* clickable hitbox */}
        {active && (
          <mesh
            position={[0, 0, 0.12]}
            onClick={notice}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <boxGeometry args={[0.44, 0.4, 0.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}
