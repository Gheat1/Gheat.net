'use client';

// The dark room: concrete floor, grimy walls, one dim cold spot from the
// ceiling so silhouettes read. Everything is intentionally underexposed —
// the CRT and the rack LEDs do the storytelling.

export default function Room() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#141216" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 1.75, -4]}>
        <planeGeometry args={[14, 3.5]} />
        <meshStandardMaterial color="#17151a" roughness={1} />
      </mesh>

      {/* side walls */}
      <mesh position={[-5, 1.75, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.5]} />
        <meshStandardMaterial color="#151318" roughness={1} />
      </mesh>
      <mesh position={[5, 1.75, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.5]} />
        <meshStandardMaterial color="#151318" roughness={1} />
      </mesh>

      {/* ceiling */}
      <mesh position={[0, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#0e0d10" roughness={1} />
      </mesh>

      {/* dim cold utility light from above (no shadows — whole scene skips
          the shadow pass for performance) */}
      <spotLight
        position={[0.5, 3.4, 1.5]}
        angle={1.0}
        penumbra={0.9}
        intensity={3.0}
        color="#2a3040"
        distance={12}
        decay={2}
      />
      {/* dim warm bounce toward the back wall so the corkboard / clock /
          camera / cabinets are discoverable in the gloom */}
      <pointLight position={[0, 2.4, -2.6]} color="#4a3f2e" intensity={2.2} distance={9} decay={2} />
      <ambientLight intensity={0.14} color="#48506a" />
    </group>
  );
}
