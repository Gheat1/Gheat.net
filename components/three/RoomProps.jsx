'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A pile of atmospheric clutter that turns the bland room into g's actual
// workspace: a workbench with junk, filing cabinets, wire shelving stacked
// with boxes, ceiling conduit + a caged bulb, floor detritus, a dead plant,
// a wall vent, and drifting dust in the CRT light. All static/non-interactive
// — the interactive story props (camera, corkboard, clock) live elsewhere.

// small reusable box prop
function B({ pos, size, color = '#1a1c20', rough = 0.7, metal = 0.2, rot }) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

function Cyl({ pos, args, color = '#26292d', rot = [0, 0, 0], rough = 0.5, metal = 0.6 }) {
  return (
    <mesh position={pos} rotation={rot}>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

// ---- workbench with clutter (far right, angled toward the room) ----
function Workbench() {
  return (
    <group position={[3.15, 0, -0.6]} rotation={[0, -0.6, 0]}>
      {/* top */}
      <B pos={[0, 0.92, 0]} size={[1.9, 0.06, 0.8]} color="#2c2620" rough={0.85} metal={0.1} />
      {/* legs */}
      {[[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]].map(([x, z], i) => (
        <B key={i} pos={[x, 0.45, z]} size={[0.06, 0.9, 0.06]} color="#17181b" metal={0.5} />
      ))}
      {/* a boxy old monitor (off) */}
      <B pos={[-0.5, 1.14, -0.1]} size={[0.44, 0.36, 0.4]} color="#3a3632" rough={0.6} />
      <mesh position={[-0.5, 1.16, 0.11]}>
        <planeGeometry args={[0.32, 0.24]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* keyboard */}
      <B pos={[-0.5, 0.96, 0.28]} size={[0.4, 0.03, 0.16]} color="#20232a" rough={0.5} />
      {/* stacked papers + a folder */}
      <B pos={[0.35, 0.965, 0.1]} size={[0.28, 0.02, 0.36]} color="#8f8676" rough={0.9} />
      <B pos={[0.4, 0.98, 0.05]} size={[0.26, 0.015, 0.34]} color="#b0a894" rough={0.9} rot={[0, 0.2, 0]} />
      <B pos={[0.55, 0.99, -0.2]} size={[0.3, 0.02, 0.22]} color="#5a3f2a" rough={0.8} rot={[0, -0.3, 0]} />
      {/* coffee mug */}
      <Cyl pos={[0.7, 1.0, 0.28]} args={[0.05, 0.05, 0.11, 16]} color="#6a2b22" rough={0.4} metal={0.1} />
      {/* desk lamp — warm pool of light */}
      <group position={[0.8, 0.95, -0.28]}>
        <Cyl pos={[0, 0.02, 0]} args={[0.08, 0.1, 0.03, 16]} color="#20232a" />
        <Cyl pos={[0, 0.22, 0]} args={[0.012, 0.012, 0.4, 8]} color="#30343c" rot={[0, 0, 0.5]} />
        <mesh position={[0.18, 0.4, 0]} rotation={[0, 0, -0.7]}>
          <coneGeometry args={[0.09, 0.12, 16, 1, true]} />
          <meshStandardMaterial color="#2a2d33" side={THREE.DoubleSide} metal={0.4} />
        </mesh>
        <pointLight position={[0.2, 0.36, 0]} color="#ffcf8a" intensity={1.3} distance={3.2} decay={2} />
      </group>
      {/* soldering iron + odds */}
      <B pos={[0.1, 0.965, 0.3]} size={[0.24, 0.02, 0.04]} color="#40342a" rot={[0, 0.4, 0]} />
    </group>
  );
}

// ---- office chair near the bench ----
function Chair() {
  return (
    <group position={[2.2, 0, 0.5]} rotation={[0, 0.9, 0]}>
      <B pos={[0, 0.5, 0]} size={[0.46, 0.06, 0.44]} color="#1b1d20" rough={0.6} />
      <B pos={[0, 0.78, -0.2]} size={[0.44, 0.5, 0.06]} color="#1b1d20" rough={0.6} />
      <Cyl pos={[0, 0.28, 0]} args={[0.035, 0.045, 0.44, 12]} color="#111316" />
      {/* 5-star base */}
      {[0, 1, 2, 3, 4].map((n) => (
        <B
          key={n}
          pos={[Math.cos((n / 5) * Math.PI * 2) * 0.22, 0.05, Math.sin((n / 5) * Math.PI * 2) * 0.22]}
          size={[0.28, 0.04, 0.06]}
          color="#111316"
          rot={[0, (n / 5) * Math.PI * 2, 0]}
        />
      ))}
    </group>
  );
}

// ---- filing cabinets against the back wall ----
function FilingCabinet({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B pos={[0, 0.66, 0]} size={[0.5, 1.32, 0.6]} color="#20242a" rough={0.5} metal={0.4} />
      {[0.26, 0.66, 1.06].map((y, i) => (
        <group key={i}>
          <B pos={[0, y, 0.31]} size={[0.42, 0.32, 0.02]} color="#262b32" metal={0.5} />
          <B pos={[0, y, 0.325]} size={[0.12, 0.03, 0.02]} color="#585f68" metal={0.7} />
        </group>
      ))}
    </group>
  );
}

// ---- wire shelving stacked with boxes (back-left) ----
function Shelving({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* uprights */}
      {[[-0.7, -0.28], [0.7, -0.28], [-0.7, 0.28], [0.7, 0.28]].map(([x, z], i) => (
        <B key={i} pos={[x, 1.1, z]} size={[0.05, 2.2, 0.05]} color="#2a2d31" metal={0.6} />
      ))}
      {/* shelves */}
      {[0.4, 1.05, 1.7].map((y, i) => (
        <B key={i} pos={[0, y, 0]} size={[1.5, 0.04, 0.62]} color="#33373c" metal={0.5} />
      ))}
      {/* boxes on shelves */}
      <B pos={[-0.4, 0.58, 0]} size={[0.5, 0.34, 0.4]} color="#6b5533" rough={0.9} />
      <B pos={[0.3, 0.56, 0.05]} size={[0.44, 0.3, 0.42]} color="#5e4a2c" rough={0.9} rot={[0, 0.2, 0]} />
      <B pos={[0.1, 1.24, 0]} size={[0.7, 0.34, 0.44]} color="#655031" rough={0.9} />
      <B pos={[-0.5, 1.9, 0]} size={[0.4, 0.3, 0.4]} color="#5a4629" rough={0.9} />
      {/* a coil of cable + a monitor carcass */}
      <B pos={[0.45, 1.88, 0]} size={[0.4, 0.34, 0.4]} color="#22252b" metal={0.4} rot={[0, -0.3, 0]} />
    </group>
  );
}

// ---- crates / bins stacked in corners ----
function Crates({ position }) {
  return (
    <group position={position}>
      <B pos={[0, 0.25, 0]} size={[0.6, 0.5, 0.6]} color="#5e4a2c" rough={0.92} />
      <B pos={[0.15, 0.7, 0.05]} size={[0.5, 0.4, 0.5]} color="#6b5533" rough={0.92} rot={[0, 0.3, 0]} />
      <B pos={[-0.5, 0.2, 0.1]} size={[0.44, 0.4, 0.44]} color="#544326" rough={0.92} rot={[0, -0.2, 0]} />
      {/* a plastic tote */}
      <B pos={[0.05, 1.02, 0.05]} size={[0.46, 0.24, 0.42]} color="#20303a" rough={0.5} rot={[0, 0.3, 0]} />
    </group>
  );
}

// ---- ceiling conduit / pipes + cable tray ----
function CeilingRig() {
  return (
    <group>
      {/* long pipes running the room */}
      {[-1.2, -0.9].map((z, i) => (
        <Cyl key={i} pos={[0, 3.3, z]} args={[0.05, 0.05, 9, 10]} rot={[0, 0, Math.PI / 2]} color="#2b2e33" />
      ))}
      {/* a thicker duct */}
      <B pos={[2.5, 3.25, -2.5]} size={[3.5, 0.35, 0.35]} color="#33373c" metal={0.5} rot={[0, 0.2, 0]} />
      {/* cable tray with drooping cables */}
      <B pos={[-2, 3.32, 1]} size={[4, 0.04, 0.3]} color="#26292d" metal={0.6} />
      {/* hangers */}
      {[-3, -1, 1, 3].map((x, i) => (
        <B key={i} pos={[x, 3.4, -1.05]} size={[0.02, 0.2, 0.02]} color="#3a3d42" metal={0.6} />
      ))}
    </group>
  );
}

// ---- caged hanging bulb over the center, gently swaying ----
function HangingBulb() {
  const g = useRef();
  useFrame((s) => {
    if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.6) * 0.03;
  });
  return (
    <group ref={g} position={[0.4, 3.5, 1.4]}>
      <Cyl pos={[0, -0.25, 0]} args={[0.006, 0.006, 0.5, 6]} color="#111" />
      <mesh position={[0, -0.52, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#241f14" emissive="#ffb84d" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* wire cage */}
      {[0, 1, 2, 3].map((n) => (
        <mesh key={n} position={[0, -0.52, 0]} rotation={[0, (n / 4) * Math.PI, 0]}>
          <torusGeometry args={[0.075, 0.004, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* the bulb is a real warm key light for the whole central room */}
      <pointLight position={[0, -0.52, 0]} color="#ffb257" intensity={1.7} distance={8} decay={1.9} />
    </group>
  );
}

// ---- wall vent grille ----
function Vent({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B pos={[0, 0, 0]} size={[0.8, 0.5, 0.03]} color="#20232a" metal={0.5} />
      {[-0.16, -0.08, 0, 0.08, 0.16].map((y, i) => (
        <B key={i} pos={[0, y, 0.02]} size={[0.72, 0.03, 0.02]} color="#111316" />
      ))}
    </group>
  );
}

// ---- dead plant in a corner ----
function DeadPlant({ position }) {
  return (
    <group position={position}>
      <Cyl pos={[0, 0.15, 0]} args={[0.12, 0.16, 0.3, 12]} color="#3a2a1a" rough={0.9} />
      {[0, 1, 2, 3, 4].map((n) => (
        <Cyl
          key={n}
          pos={[Math.cos(n) * 0.03, 0.55, Math.sin(n) * 0.03]}
          args={[0.006, 0.01, 0.7, 5]}
          color="#4a3a1e"
          rot={[Math.sin(n) * 0.3, 0, Math.cos(n) * 0.3]}
          rough={0.9}
          metal={0}
        />
      ))}
    </group>
  );
}

// ---- drifting dust motes caught in the CRT glow ----
function Dust() {
  const ref = useRef();
  const geom = useMemo(() => {
    const N = 140;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.3) * 5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((s, dt) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position.array;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < p.length; i += 3) {
      p[i] += Math.sin(t * 0.3 + i) * 0.0006;
      p[i + 1] += 0.0009 + Math.sin(t * 0.2 + i) * 0.0004;
      if (p[i + 1] > 3.2) p[i + 1] = 0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.014} color="#9fb0d0" transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}

export default function RoomProps() {
  return (
    <group>
      <Workbench />
      <Chair />
      <FilingCabinet position={[-0.6, 0, -3.55]} rotation={[0, 0, 0]} />
      <FilingCabinet position={[0.0, 0, -3.55]} rotation={[0, 0, 0]} />
      <Shelving position={[-3.7, 0, -1.2]} rotation={[0, 0.5, 0]} />
      <Crates position={[4.1, 0, -3.0]} />
      <Crates position={[-4.2, 0, 1.4]} />
      <CeilingRig />
      <HangingBulb />
      <Vent position={[4.98, 2.2, -1.2]} rotation={[0, -Math.PI / 2, 0]} />
      <DeadPlant position={[-4.4, 0, -3.4]} />
      <Dust />

      {/* extra floor clutter: stray VHS tapes + a toolbox */}
      <B pos={[-1.3, 0.04, 1.6]} size={[0.19, 0.03, 0.11]} color="#141216" rot={[0, 0.5, 0]} />
      <B pos={[-1.15, 0.04, 1.75]} size={[0.19, 0.03, 0.11]} color="#1a1216" rot={[0, 0.2, 0]} />
      <B pos={[1.7, 0.09, 1.9]} size={[0.4, 0.18, 0.22]} color="#8a1f14" rough={0.5} metal={0.3} />
    </group>
  );
}
