'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { vhsVertexShader, vhsFragmentShader } from './shaders/vhs';
import { useVCRTexture, INTRO_DURATION } from './useVCRTexture';
import { OS_W } from '@/lib/osScreen';
import { sfx } from '@/lib/sfx';
import { unlockEgg } from '@/lib/eggs';
import Desktop from '../os/Desktop';
import CRTGlass from '../os/CRTGlass';

// The bulky CRT sitting on a wooden crate at the center of the room.
// Screen center lives at roughly (0, 1.04, 0.47) in world space — the camera
// rig zooms toward that point.
//
// Display modes:
//   tape (room/zooming) — the VHS shader plane plays the intro
//   os   (os/overview)  — the retro OS is projected onto the glass via
//                         <Html transform>; in overview you see it from
//                         across the room, still running.
//   warp                — the OS ejects and the tape static returns for the
//                         split second before the camera punches through.
//
// EASTER EGG: clicking a knob (when not glued to the OS) flips to channel 3.

export const SCREEN_CENTER = new THREE.Vector3(0, 1.04, 0.47);

const SCREEN_W = 0.78; // world units, 4:3 like the DOM surface
const DRAW_INTERVAL = 1 / 30; // canvas->texture uploads capped at 30fps

export default function CRTMonitor({
  phase,
  storyPhase = 'browsing',
  onIntroComplete,
  onReboot,
  onWarp,
  onLook,
  onNoclip,
}) {
  const { texture, draw } = useVCRTexture();
  const matRef = useRef();
  const lightRef = useRef();
  const doneRef = useRef(false);
  const startRef = useRef(null);
  const lastDrawRef = useRef(-1);
  const channelUntilRef = useRef(0);
  const tRef = useRef(0);

  // during blackout the CRT rips the OS off the glass and shows the EVILCORP
  // logo on the raw tube; during 'face' it shows the eyes IN the screen.
  const logoMode = storyPhase === 'blackout';
  const faceMode = storyPhase === 'face';
  const osActive = (phase === 'os' || phase === 'overview') && !logoMode && !faceMode;
  const knobsHot = phase === 'room' || phase === 'overview';

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uPower: { value: 0 },
      uNoiseAmt: { value: 1 },
      uBulge: { value: 0.1 },
    }),
    [texture]
  );

  useFrame((state) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startRef.current;
    tRef.current = t;

    // The screen is the room's key light — flicker it like a real tube.
    if (lightRef.current) {
      const flicker =
        0.8 +
        0.25 * Math.sin(t * 19.0) * Math.sin(t * 7.3) +
        0.12 * Math.sin(t * 53.0);
      const power = osActive ? 1 : (matRef.current?.uniforms.uPower.value ?? 0);
      lightRef.current.intensity =
        power * flicker * (phase === 'zooming' ? 2.2 : 1.6);
      // the tube glow turns sickly red while the logo / eyes are on screen
      lightRef.current.color.setHex(logoMode || faceMode ? 0xff4634 : 0x9fb8ff);
    }

    if (osActive) return; // shader plane is hidden; the OS DOM owns the glass

    // R3F clones the `uniforms` prop when it builds the material, so per-
    // frame updates MUST go through the material's own uniforms object —
    // mutating the memo'd object above would silently do nothing.
    const u = matRef.current?.uniforms;
    if (!u) return;

    const channel3 = t < channelUntilRef.current;

    // CRT power-on: the picture expands from a line over the first 0.6s.
    // In logo/face mode the tube is fully lit.
    u.uPower.value = logoMode || faceMode ? 1 : THREE.MathUtils.clamp(t / 0.6, 0, 1);
    // pure snow before the tape engages; extra snow on channel 3 and during
    // the warp punch-through; a violent burst as the logo slams on; a light
    // grit under the face
    u.uNoiseAmt.value = logoMode
      ? 0.4 + 0.4 * Math.sin(t * 40)
      : faceMode
        ? 0.12
        : phase === 'warp'
          ? 0.85
          : Math.max(
              THREE.MathUtils.clamp(1 - t / 0.7, 0, 1) * 0.9,
              channel3 ? 0.3 : 0
            );
    u.uTime.value = t;

    // canvas redraw + GPU texture upload throttled — the shader animates the
    // static/scanlines at full refresh anyway.
    if (t - lastDrawRef.current >= DRAW_INTERVAL) {
      lastDrawRef.current = t;
      draw(t, doneRef.current, channel3, logoMode, faceMode);
    }

    if (!doneRef.current && t >= INTRO_DURATION && phase === 'room' && !channel3) {
      doneRef.current = true;
      onIntroComplete?.();
    }
  });

  const flipChannel = (e) => {
    e.stopPropagation();
    if (!knobsHot) return;
    channelUntilRef.current = tRef.current + 2.4;
    sfx.channel();
    if (unlockEgg('ch3')) {
      // eslint-disable-next-line no-console
      console.log(
        '%cCH3//BROADCAST: do not adjust your set. the tower hums a number.',
        'color:#c81616;font-family:monospace'
      );
    }
  };

  return (
    <group>
      {/* wooden crate stand */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.15, 0.52, 0.85]} />
        <meshStandardMaterial color="#2b2118" roughness={0.9} />
      </mesh>

      {/* TV shell */}
      <group position={[0, 1.0, 0]}>
        <RoundedBox args={[1.15, 0.92, 0.85]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#3a3632" roughness={0.6} metalness={0.05} />
        </RoundedBox>

        {/* recessed bezel around the glass */}
        <mesh position={[0, 0.04, 0.428]}>
          <boxGeometry args={[0.86, 0.66, 0.02]} />
          <meshStandardMaterial color="#171513" roughness={0.4} />
        </mesh>

        {/* THE SCREEN — plane bulged in the vertex shader, VHS in the fragment */}
        <mesh position={[0, 0.04, 0.44]} visible={!osActive}>
          <planeGeometry args={[SCREEN_W, 0.585, 48, 36]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={vhsVertexShader}
            fragmentShader={vhsFragmentShader}
            uniforms={uniforms}
            toneMapped={false}
          />
        </mesh>

        {/* PHASE 2 — the retro OS projected onto the glass. It tracks the
            camera every frame, so parallax and the overview pull-back keep
            working around it. */}
        {osActive && (
          <Html
            transform
            position={[0, 0.04, 0.452]}
            // drei scales transform-mode content by 400/distanceFactor;
            // pinning it to 400 makes `scale` map px -> world units 1:1,
            // so the 1024px surface spans exactly the glass width.
            distanceFactor={400}
            scale={SCREEN_W / OS_W}
            zIndexRange={[100, 0]}
          >
            <div
              // in overview, clicking the (tiny, distant) screen walks back up
              onClickCapture={
                phase === 'overview'
                  ? (e) => {
                      e.stopPropagation();
                      onLook?.();
                    }
                  : undefined
              }
            >
              <CRTGlass>
                <Desktop
                  onReboot={onReboot}
                  onWarp={onWarp}
                  onLook={onLook}
                  onNoclip={onNoclip}
                />
                {/* scanlines + vignette over the DOM, so it still reads as a tube */}
                <div className="crt-dom-overlay" />
              </CRTGlass>
            </div>
          </Html>
        )}

        {/* control panel: knobs (channel-3 easter egg) + speaker grille */}
        <group position={[0, -0.35, 0.43]}>
          {[-0.32, -0.2].map((x) => (
            <mesh
              key={x}
              position={[x, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              onClick={flipChannel}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (knobsHot) document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
              <meshStandardMaterial color="#8f877c" roughness={0.35} metalness={0.4} />
            </mesh>
          ))}
          {[0.08, 0.16, 0.24, 0.32].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.015, 0.09, 0.01]} />
              <meshStandardMaterial color="#141210" roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* the tube is the room's main light source */}
      <pointLight
        ref={lightRef}
        position={[0, 1.05, 1.3]}
        color="#9fb8ff"
        intensity={0}
        distance={7}
        decay={2}
      />
    </group>
  );
}
