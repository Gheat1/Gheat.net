'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sfx } from '@/lib/sfx';
import { unlockEgg } from '@/lib/eggs';
import { panTo } from '@/lib/focus';
import { pullThePlug } from '@/lib/story';

// A 42U-ish rack in the shadows: a network switch with a strip of blinking
// LEDs, a few rackmounted units, patch panel, and one suspicious red LED.
// Clicking the red LED is easter egg #1 — it chirps 3-short-3-long and
// unlocks server_logs.txt on the OS desktop.

const RACK_W = 0.7;
const RACK_H = 2.1;
const RACK_D = 0.8;

function makeLeds(count, rand) {
  return Array.from({ length: count }, (_, i) => ({
    x: -0.24 + (i % 12) * 0.042,
    row: Math.floor(i / 12),
    color: rand() > 0.35 ? '#37ff5e' : '#ffb02e',
    period: 0.35 + rand() * 1.6,
    offset: rand() * 10,
    solid: rand() > 0.8,
  }));
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Led({ x, y, z, color, period, offset, solid }) {
  const mat = useRef();
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime + offset;
    // square-wave blink; solid LEDs just glow
    const on = solid ? 1 : Math.sin((t / period) * Math.PI * 2) > 0 ? 1 : 0.05;
    mat.current.emissiveIntensity = on * 2.4;
  });
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[0.016, 0.016, 0.01]} />
      <meshStandardMaterial
        ref={mat}
        color="#0a0a0a"
        emissive={color}
        emissiveIntensity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

function SecretLed({ position }) {
  const mat = useRef();
  const clicked = useRef(false);
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime;
    // SOS-ish: 3 short, 3 long, pause — the pattern from the maintenance log
    const cycle = t % 4;
    let on = 0.05;
    if (cycle < 1.2) on = Math.floor(cycle / 0.2) % 2 === 0 ? 1 : 0.05;
    else if (cycle < 3.0) on = Math.floor((cycle - 1.2) / 0.3) % 2 === 0 ? 1 : 0.05;
    mat.current.emissiveIntensity = on * (clicked.current ? 4.5 : 3.0);
  });
  const trigger = (e) => {
    e.stopPropagation();
    clicked.current = true;
    sfx.serverSecret();
    // glide over to the rack so you can watch it blink back at you
    panTo({ pos: [-0.9, 1.6, -0.2], look: [-2.2, 1.7, -2.1], hold: 2.0 });
    if (unlockEgg('server')) {
      // eslint-disable-next-line no-console
      console.log(
        '%cSYS//RACK-07: maintenance override accepted.\n' +
          'a file was written to the desktop. check server_logs.txt.',
        'color:#37ff5e;font-family:monospace'
      );
    }
  };

  return (
    <group position={position}>
      {/* slightly bigger than its neighbors — findable if you look */}
      <mesh>
        <boxGeometry args={[0.024, 0.024, 0.012]} />
        <meshStandardMaterial
          ref={mat}
          color="#0a0a0a"
          emissive="#ff2222"
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>
      {/* padded hitbox: fully transparent but still raycastable
          (visible={false} meshes are skipped by the event raycaster) */}
      <mesh
        onClick={trigger}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// A bright burst of sparks shot from the plug the instant it's yanked. Points
// with per-particle velocity + gravity, additive-blended so they glow. Mounts
// only during the blackout phase; runs its ~1s life once.
function SparkBurst({ origin }) {
  const COUNT = 90;
  const pointsRef = useRef();
  const life = useRef(0);
  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = origin[0];
      pos[i * 3 + 1] = origin[1];
      pos[i * 3 + 2] = origin[2];
      // spray upward and outward from the socket
      const ang = Math.random() * Math.PI * 2;
      const up = 0.6 + Math.random() * 2.4;
      const out = 0.8 + Math.random() * 2.2;
      vel[i * 3] = Math.cos(ang) * out;
      vel[i * 3 + 1] = up;
      vel[i * 3 + 2] = Math.sin(ang) * out;
    }
    return { pos, vel };
  }, [origin]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    life.current += dt;
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const arr = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      data.vel[i * 3 + 1] -= 9 * dt; // gravity
      arr[i * 3] += data.vel[i * 3] * dt;
      arr[i * 3 + 1] += data.vel[i * 3 + 1] * dt;
      arr[i * 3 + 2] += data.vel[i * 3 + 2] * dt;
    }
    geo.attributes.position.needsUpdate = true;
    if (pointsRef.current) {
      pointsRef.current.material.opacity = Math.max(0, 1 - life.current / 1.0);
      pointsRef.current.material.size = 0.05 * Math.max(0.2, 1 - life.current / 1.2);
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffd27a"
        size={0.05}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// A hot white-blue flash that flickers hard then dies, lighting the room for
// the arc. Sells the sparks as an actual electrical short.
function SparkFlash({ origin }) {
  const ref = useRef();
  const life = useRef(0);
  useFrame((_, delta) => {
    life.current += Math.min(delta, 0.05);
    if (!ref.current) return;
    const l = life.current;
    // erratic strobe for ~0.6s, then gone
    const flick = Math.random() > 0.4 ? 1 : 0.2;
    ref.current.intensity = Math.max(0, (1 - l / 0.65)) * 22 * flick;
  });
  return (
    <pointLight
      ref={ref}
      position={origin}
      color="#cfe4ff"
      intensity={22}
      distance={7}
      decay={1.5}
    />
  );
}

// Panel that floods red and pulses once the story awakens — the "server
// patch panel starts flashing red, casting harsh light across the room".
function AlarmLight({ active }) {
  const light = useRef();
  const panel = useRef();
  useFrame((state) => {
    const on = active ? 1 : 0;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 9); // urgent strobe
    if (light.current) {
      light.current.intensity = on * (2 + pulse * 6);
    }
    if (panel.current) {
      panel.current.material.emissiveIntensity = on * (0.5 + pulse * 3.5);
    }
  });
  return (
    <group>
      {/* the patch panel glows */}
      <mesh ref={panel} position={[0, 1.78, RACK_D / 2 + 0.026]}>
        <boxGeometry args={[RACK_W - 0.08, 0.09, 0.01]} />
        <meshStandardMaterial
          color="#1a0505"
          emissive="#ff1010"
          emissiveIntensity={0}
          toneMapped={false}
        />
      </mesh>
      {/* harsh red spill into the room */}
      <pointLight
        ref={light}
        position={[0, 1.7, RACK_D / 2 + 0.5]}
        color="#ff1414"
        intensity={0}
        distance={9}
        decay={1.6}
      />
    </group>
  );
}

export default function ServerRack({
  position = [-2.4, 0, -2.2],
  rotation = [0, 0.5, 0],
  storyPhase = 'browsing',
}) {
  const leds = useMemo(() => makeLeds(24, mulberry32(42)), []);
  const alarm =
    storyPhase === 'awaken' ||
    storyPhase === 'hijack' ||
    storyPhase === 'unplug' ||
    storyPhase === 'blackout';
  const showUnplug = storyPhase === 'unplug';
  const sparking = storyPhase === 'blackout'; // sparks fly at the moment of unplug

  return (
    <group position={position} rotation={rotation}>
      {/* rack frame */}
      <mesh position={[0, RACK_H / 2, 0]} castShadow>
        <boxGeometry args={[RACK_W, RACK_H, RACK_D]} />
        <meshStandardMaterial color="#181a1d" roughness={0.55} metalness={0.35} />
      </mesh>

      <AlarmLight active={alarm} />

      {/* the power plug + [ UNPLUG ] prompt, live only in the unplug phase */}
      <mesh position={[0.28, 0.06, RACK_D / 2 + 0.02]}>
        <boxGeometry args={[0.09, 0.05, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.7} />
      </mesh>

      {/* the spark shower + hot flash the moment the plug is yanked */}
      {sparking && (
        <>
          <SparkBurst origin={[0.28, 0.09, RACK_D / 2 + 0.06]} />
          <SparkFlash origin={[0.28, 0.12, RACK_D / 2 + 0.2]} />
        </>
      )}

      {showUnplug && (
        <Html position={[0.28, 0.32, RACK_D / 2 + 0.1]} center distanceFactor={4} zIndexRange={[200, 0]}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              sfx.unplugPop();
              pullThePlug();
            }}
            style={{
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: 3,
              fontWeight: 'bold',
              color: '#ff3030',
              background: 'rgba(0,0,0,0.8)',
              border: '2px solid #ff3030',
              padding: '6px 14px',
              cursor: 'pointer',
              animation: 'boot-blink 1s steps(1) infinite',
            }}
          >
            [ UNPLUG ]
          </button>
        </Html>
      )}

      {/* rails */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (RACK_W / 2 - 0.02), RACK_H / 2, RACK_D / 2 - 0.01]}>
          <boxGeometry args={[0.03, RACK_H - 0.06, 0.02]} />
          <meshStandardMaterial color="#26292d" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* rackmounted units */}
      {[
        { y: 1.78, h: 0.09, color: '#202329' }, // patch panel
        { y: 1.62, h: 0.09, color: '#1b1e22' }, // the network switch (LED strip below)
        { y: 1.38, h: 0.17, color: '#22252a' }, // 2U server
        { y: 1.14, h: 0.17, color: '#1e2126' }, // 2U server
        { y: 0.82, h: 0.35, color: '#191c20' }, // 4U storage
        { y: 0.38, h: 0.44, color: '#15171a' }, // UPS
      ].map((u, i) => (
        <mesh key={i} position={[0, u.y, RACK_D / 2 + 0.012]}>
          <boxGeometry args={[RACK_W - 0.08, u.h, 0.025]} />
          <meshStandardMaterial color={u.color} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}

      {/* switch LED strip */}
      {leds.map((l, i) => (
        <Led
          key={i}
          x={l.x}
          y={1.635 - l.row * 0.028}
          z={RACK_D / 2 + 0.028}
          color={l.color}
          period={l.period}
          offset={l.offset}
          solid={l.solid}
        />
      ))}

      {/* EASTER EGG: the red LED on the patch panel */}
      <SecretLed position={[0.22, 1.78, RACK_D / 2 + 0.028]} />

      {/* servers' idle power LEDs */}
      {[1.38, 1.14, 0.82].map((y, i) => (
        <Led
          key={`pwr-${i}`}
          x={-0.26}
          y={y}
          z={RACK_D / 2 + 0.028}
          color="#2e6bff"
          period={2}
          offset={i * 3}
          solid
        />
      ))}

      {/* faint green wash so the rack silhouette reads in the dark */}
      <pointLight
        position={[0, 1.6, RACK_D / 2 + 0.35]}
        color="#2aff62"
        intensity={0.5}
        distance={2.2}
        decay={2}
      />
    </group>
  );
}
