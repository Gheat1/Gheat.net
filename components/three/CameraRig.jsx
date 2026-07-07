'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { SCREEN_CENTER } from './CRTMonitor';
import { takeFocus } from '@/lib/focus';

// Camera behavior for all phases:
//  - room:     mouse parallax around the resting shot.
//  - zooming:  GSAP drives a 0..1 progress value; each frame the pose is
//    computed from that progress, so motion is identical at 60Hz and 240Hz+.
//  - os:       holds close to the CRT with a small residual parallax.
//  - overview: (ESC / `look`) progress tweens back to 0 — the OS keeps
//    running on the distant screen while you explore the room for clues.
//  - warp:     punches THROUGH the glass, fov blows out, and the WarpTunnel
//    takes over until /portfolio loads.
//
// Clue pans: anything can call panTo() (lib/focus.js). When the camera is
// pulled back, the rig glides to the requested pose, holds, and returns.

const REST = new THREE.Vector3(0, 1.35, 5.0);
const REST_LOOK = new THREE.Vector3(0, 1.05, 0);
// End pose: the 4:3 glass fills most of the viewport, TV shell in frame.
const END = new THREE.Vector3(0, 1.04, 1.34);
const WARP_LOOK = new THREE.Vector3(0, 1.04, -30);

const PARALLAX_X = 0.6;
const PARALLAX_Y = 0.3;
const OS_PARALLAX = 0.07; // fraction of full parallax kept while in the OS
const DAMP_LAMBDA = 3.2; // exponential smoothing rate (per second)

const PAN_IN = 0.9; // seconds to glide toward a clue
const PAN_OUT = 0.9;

const smooth = (x) => x * x * (3 - 2 * x);

export default function CameraRig({ phase, glitch = 0, onZoomComplete }) {
  const { camera } = useThree();
  const zoom = useRef({ p: 0 });
  const warp = useRef({ w: 0, fov: 50 });
  const par = useRef({ x: 0, y: 0 });
  const pan = useRef(null); // { pos, look, hold, age }

  useEffect(() => {
    const z = zoom.current;
    if (phase === 'zooming') {
      const tween = gsap.to(z, {
        p: 1,
        duration: 3.4,
        ease: 'power3.inOut',
        onComplete: () => onZoomComplete?.(),
      });
      return () => tween.kill();
    }
    if (phase === 'os' && z.p < 1) {
      // returning from overview
      const tween = gsap.to(z, { p: 1, duration: 1.5, ease: 'power2.inOut' });
      return () => tween.kill();
    }
    if ((phase === 'room' || phase === 'overview') && z.p > 0) {
      const tween = gsap.to(z, { p: 0, duration: 1.6, ease: 'power2.inOut' });
      return () => tween.kill();
    }
    if (phase === 'warp') {
      const tl = gsap.timeline();
      tl.to(warp.current, { w: 1, duration: 0.9, ease: 'power2.in' }, 0);
      tl.to(warp.current, { fov: 92, duration: 2.2, ease: 'power2.in' }, 0);
      return () => tl.kill();
    }
  }, [phase, onZoomComplete]);

  useFrame((state, delta) => {
    const eased = zoom.current.p;
    const w = warp.current.w;

    // --- clue pan bookkeeping ---
    const req = takeFocus();
    if (req && eased < 0.2 && phase !== 'warp') {
      pan.current = { ...req, age: 0 };
    }
    let panBlend = 0;
    if (pan.current) {
      pan.current.age += delta;
      const { age, hold } = pan.current;
      if (age < PAN_IN) panBlend = smooth(age / PAN_IN);
      else if (age < PAN_IN + hold) panBlend = 1;
      else if (age < PAN_IN + hold + PAN_OUT)
        panBlend = smooth(1 - (age - PAN_IN - hold) / PAN_OUT);
      else pan.current = null;
      // zooming in cancels the pan
      if (eased > 0.3) {
        pan.current = null;
        panBlend = 0;
      }
    }

    // --- parallax (frame-rate independent damping) ---
    const pf = (1 - eased * (1 - OS_PARALLAX)) * (1 - panBlend);
    const targetX = state.pointer.x * PARALLAX_X * pf;
    const targetY = state.pointer.y * PARALLAX_Y * pf;
    par.current.x = THREE.MathUtils.damp(par.current.x, targetX, DAMP_LAMBDA, delta);
    par.current.y = THREE.MathUtils.damp(par.current.y, targetY, DAMP_LAMBDA, delta);

    // --- base pose: rest <-> screen close-up ---
    let px = THREE.MathUtils.lerp(REST.x, END.x, eased) + par.current.x;
    let py = THREE.MathUtils.lerp(REST.y, END.y, eased) + par.current.y * 0.8;
    let pz = THREE.MathUtils.lerp(REST.z, END.z, eased);

    let lx = THREE.MathUtils.lerp(REST_LOOK.x - par.current.x * 0.35, SCREEN_CENTER.x, eased);
    let ly = THREE.MathUtils.lerp(REST_LOOK.y - par.current.y * 0.2, SCREEN_CENTER.y, eased);
    let lz = THREE.MathUtils.lerp(REST_LOOK.z, SCREEN_CENTER.z, eased);

    // --- clue pan overrides ---
    if (panBlend > 0 && pan.current) {
      const [fx, fy, fz] = pan.current.pos;
      const [gx, gy, gz] = pan.current.look;
      px = THREE.MathUtils.lerp(px, fx, panBlend);
      py = THREE.MathUtils.lerp(py, fy, panBlend);
      pz = THREE.MathUtils.lerp(pz, fz, panBlend);
      lx = THREE.MathUtils.lerp(lx, gx, panBlend);
      ly = THREE.MathUtils.lerp(ly, gy, panBlend);
      lz = THREE.MathUtils.lerp(lz, gz, panBlend);
    }

    // --- warp: punch through the glass ---
    if (w > 0) {
      px = THREE.MathUtils.lerp(px, 0, w);
      py = THREE.MathUtils.lerp(py, 1.04, w);
      pz = THREE.MathUtils.lerp(pz, 0.25, w);
      lx = THREE.MathUtils.lerp(lx, WARP_LOOK.x, w);
      ly = THREE.MathUtils.lerp(ly, WARP_LOOK.y, w);
      lz = THREE.MathUtils.lerp(lz, WARP_LOOK.z, w);
      if (camera.fov !== warp.current.fov) {
        camera.fov = warp.current.fov;
        camera.updateProjectionMatrix();
      }
    }

    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);

    // --- story dread shake: high-frequency layered-sine jitter, scaled by
    // the glitch intensity the story sets during the awakening/climax ---
    if (glitch > 0.001) {
      const tt = state.clock.elapsedTime;
      const amp = glitch * 0.06;
      camera.position.x += (Math.sin(tt * 57) + Math.sin(tt * 91)) * 0.5 * amp;
      camera.position.y += (Math.sin(tt * 63) + Math.sin(tt * 111)) * 0.5 * amp;
      camera.rotateZ((Math.sin(tt * 47) + Math.sin(tt * 83)) * 0.5 * glitch * 0.02);
    }
  });

  return null;
}
