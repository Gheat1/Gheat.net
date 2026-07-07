'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { sfx } from '@/lib/sfx';
import { unlockEgg } from '@/lib/eggs';
import { panTo } from '@/lib/focus';

// The beefy custom tower next to the rack: tempered-glass side panel,
// three muted LED fans breathing slowly, PSU shroud, GPU slab.
//
// EASTER EGG #2: the power light. The maintenance log says the tower "hums
// a number" — clicking its power LED pans the camera over, revs the fans,
// and dumps rig_bios.txt (with the root password) onto the OS desktop.

function FanRing({ position, phase, revRef }) {
  const mat = useRef();
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime;
    // slow "breathing" LED — muted, not gamer-bright... unless revved
    const rev = revRef && t < revRef.current ? 1 : 0;
    const b = 0.5 + 0.5 * Math.sin(t * (0.9 + rev * 14) + phase);
    mat.current.emissiveIntensity = 0.35 + b * (0.55 + rev * 2.2);
  });
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.075, 0.008, 8, 32]} />
      <meshStandardMaterial
        ref={mat}
        color="#0a0a0a"
        emissive="#7a3bff"
        emissiveIntensity={0.4}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function PCRig({ position = [2.1, 0, -2.0], rotation = [0, -0.55, 0] }) {
  const revUntil = useRef(0);
  const { clock } = useThree();

  const onPowerClick = (e) => {
    e.stopPropagation();
    revUntil.current = clock.elapsedTime + 2.6;
    sfx.pan();
    // glide the camera over to the rig and rev the fans while it looks
    panTo({ pos: [0.7, 1.15, 0.4], look: [2.05, 0.65, -1.9], hold: 2.2 });
    if (unlockEgg('rig')) {
      // eslint-disable-next-line no-console
      console.log(
        '%cRIG//EEPROM: bios dumped to desktop. rig_bios.txt',
        'color:#b78bff;font-family:monospace'
      );
    }
  };

  return (
    <group position={position} rotation={rotation}>
      {/* case */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.9, 0.85]} />
        <meshStandardMaterial color="#141517" roughness={0.45} metalness={0.5} />
      </mesh>

      {/* tempered glass side panel */}
      <mesh position={[-0.215, 0.48, 0]}>
        <boxGeometry args={[0.01, 0.78, 0.75]} />
        <meshPhysicalMaterial
          color="#0c0f14"
          roughness={0.05}
          metalness={0}
          transmission={0.55}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* front intake fans behind mesh */}
      <FanRing position={[-0.21, 0.68, 0.28]} phase={0} revRef={revUntil} />
      <FanRing position={[-0.21, 0.48, 0.28]} phase={2.1} revRef={revUntil} />
      <FanRing position={[-0.21, 0.28, 0.28]} phase={4.2} revRef={revUntil} />

      {/* GPU slab glowing faintly inside */}
      <mesh position={[-0.12, 0.5, -0.05]}>
        <boxGeometry args={[0.12, 0.05, 0.45]} />
        <meshStandardMaterial
          color="#1a1c20"
          roughness={0.4}
          metalness={0.6}
          emissive="#7a3bff"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* PSU shroud */}
      <mesh position={[-0.1, 0.14, 0]}>
        <boxGeometry args={[0.2, 0.18, 0.8]} />
        <meshStandardMaterial color="#101113" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* power LED — EASTER EGG: click it */}
      <mesh position={[-0.05, 0.88, 0.428]}>
        <boxGeometry args={[0.014, 0.014, 0.01]} />
        <meshStandardMaterial
          color="#0a0a0a"
          emissive="#ffffff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      {/* padded hitbox so the tiny LED is actually clickable — transparent
          but still raycastable (visible={false} is skipped by events) */}
      <mesh
        position={[-0.05, 0.88, 0.43]}
        onClick={onPowerClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.07, 0.07, 0.03]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* the muted violet spill from inside the case */}
      <pointLight
        position={[-0.35, 0.5, 0.1]}
        color="#7a3bff"
        intensity={0.45}
        distance={1.8}
        decay={2}
      />
    </group>
  );
}
