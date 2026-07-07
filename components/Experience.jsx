'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './three/Scene';
import StoryDirector from './StoryDirector';
import StoryOverlay from './StoryOverlay';
import ConsentModal from './ConsentModal';
import { hydrateEggs, unlockEgg } from '@/lib/eggs';
import { useStory } from '@/lib/story';
import { sfx } from '@/lib/sfx';

// THE BACKROOMS ship as their own chunk — none of that code loads until
// someone actually types `noclip` in the terminal.
const Backrooms = lazy(() => import('./three/Backrooms'));

// Phase state machine:
//   room      — dark room, VHS intro playing on the CRT (click = skip)
//   zooming   — GSAP pushes the camera up to the glass
//   os        — the retro OS runs ON the CRT screen (drei <Html transform>)
//   overview  — ESC / `look`: camera pulls back, OS keeps running on the
//               distant screen, and the room's clues become huntable.
//   warp      — PORTFOLIO engaged: through the glass, star tunnel, /portfolio.
//   backrooms — `noclip`: you fall out of the OS into the yellow place.
//               Pointer-lock + WASD. ESC unlocks; WAKE UP returns (the
//               machine reboots — you did just fall out of it).
//
// The canvas never unmounts — everything lives inside the 3D scene.

const WARP_MS = 2600;

export default function Experience() {
  const [phase, setPhase] = useState('room');
  // bumping this remounts the CRT so the tape + power-on replay after reboot
  const [session, setSession] = useState(0);
  const [brState, setBrState] = useState({ locked: false, landed: false });
  const story = useStory();

  useEffect(() => {
    hydrateEggs();
  }, []);

  const startZoom = useCallback(() => {
    setPhase((p) => (p === 'room' ? 'zooming' : p));
  }, []);

  const handleZoomComplete = useCallback(() => {
    setPhase((p) => (p === 'zooming' ? 'os' : p));
  }, []);

  const handleReboot = useCallback(() => {
    setPhase('room');
    setSession((s) => s + 1);
  }, []);

  // ESC (or terminal `look`) toggles between the OS and the room overview.
  // Locked out during the climax — the story owns the camera then.
  const climaxLock = () => {
    const sp = story.phase;
    return sp === 'awaken' || sp === 'hijack' || sp === 'unplug' || sp === 'blackout';
  };
  const handleLook = useCallback(() => {
    if (climaxLock()) return;
    setPhase((p) => (p === 'os' ? 'overview' : p === 'overview' ? 'os' : p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.phase]);

  const handleWarp = useCallback(() => {
    setPhase((p) => {
      if (p === 'warp') return p;
      sfx.warp();
      return 'warp';
    });
  }, []);

  const handleNoclip = useCallback(() => {
    sfx.noclip();
    unlockEgg('noclip');
    setBrState({ locked: false, landed: false });
    setPhase('backrooms');
  }, []);

  const handleBrState = useCallback((s) => {
    setBrState((prev) => ({ ...prev, ...s }));
  }, []);

  const handleWake = useCallback(() => {
    setBrState({ locked: false, landed: false });
    // you fell out of the machine — it reboots when you climb back in
    setPhase('room');
    setSession((s) => s + 1);
  }, []);

  useEffect(() => {
    if (phase !== 'warp') return;
    const t = setTimeout(() => window.location.assign('/portfolio'), WARP_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // The climax kicks you out of the OS to WITNESS the room: once the vault
  // trips the awakening, the camera pulls back so the rack going red, the
  // shake and the [UNPLUG] prompt are all visible. Held there through the
  // set-piece; released on scar/reset.
  useEffect(() => {
    const sp = story.phase;
    const climax = sp === 'awaken' || sp === 'hijack' || sp === 'unplug' || sp === 'blackout';
    if (climax) {
      setPhase((p) => (p === 'os' ? 'overview' : p));
    } else if (sp === 'scarred') {
      setPhase((p) => (p === 'overview' ? 'os' : p));
    }
  }, [story.phase]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleLook();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleLook]);

  // canvas clicks that hit nothing interactive skip the tape. In overview,
  // stray clicks do NOT return to the OS — you're hunting clues; go back by
  // clicking the screen or pressing ESC.
  const onMissed = useCallback(() => {
    setPhase((p) => (p === 'room' ? 'zooming' : p));
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        // dpr capped at 2 — the VHS shader is per-pixel; this keeps
        // 240Hz+ headroom on hi-dpi displays without visible loss.
        // No shadow pass, no stencil: this scene doesn't use either.
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 50, near: 0.05, far: 40, position: [0, 1.35, 5] }}
        onPointerMissed={onMissed}
        className="!absolute inset-0"
      >
        <color attach="background" args={['#050408']} />
        <fog attach="fog" args={['#050408', 7, 20]} />
        {phase === 'backrooms' ? (
          <Suspense fallback={null}>
            <Backrooms onState={handleBrState} />
          </Suspense>
        ) : (
          <Scene
            key={session}
            phase={phase}
            storyPhase={story.phase}
            glitch={story.glitch}
            onIntroComplete={startZoom}
            onZoomComplete={handleZoomComplete}
            onReboot={handleReboot}
            onWarp={handleWarp}
            onLook={handleLook}
            onNoclip={handleNoclip}
          />
        )}
      </Canvas>

      {/* phase hints */}
      {phase === 'room' && (
        <div className="pointer-events-none absolute bottom-5 w-full text-center font-term text-[10px] tracking-[0.35em] text-neutral-600">
          CLICK TO SKIP TAPE
        </div>
      )}
      {phase === 'overview' && story.phase === 'browsing' && (
        <div className="pointer-events-none absolute bottom-5 w-full text-center font-term text-[10px] tracking-[0.35em] text-neutral-600">
          EXPLORE THE ROOM — CLICK THE SCREEN OR PRESS ESC TO RETURN
        </div>
      )}

      {/* warp white-out just before /portfolio loads */}
      {phase === 'warp' && (
        <div className="warp-flash pointer-events-none absolute inset-0 z-50" />
      )}

      {/* one-time consent + privacy gate (also unlocks audio) */}
      <ConsentModal />

      {/* the story: tab meta-game, breathing, subtitles, and the climax
          overlays (blackout / face / kernel panic / "> Go back?") */}
      <StoryDirector subtitle={story.subtitle} />
      <StoryOverlay />

      {/* backrooms overlays */}
      {phase === 'backrooms' && (
        <>
          {/* entry static flash — then you're just... falling */}
          <div className="crt-flash pointer-events-none absolute inset-0 z-50" />
          {brState.landed && brState.locked && (
            <>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 bg-yellow-100/70" />
              <div className="pointer-events-none absolute bottom-5 w-full text-center font-term text-[10px] tracking-[0.35em] text-yellow-900">
                WASD — SHIFT TO RUN — ESC TO SURFACE
              </div>
            </>
          )}
          {brState.landed && !brState.locked && (
            <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-3">
              <div className="max-w-[560px] px-6 text-center font-term text-[#d8c878]">
                <div className="text-[22px] font-bold tracking-[0.2em]">
                  EVILCORP // UNALLOCATED COLD STORAGE
                </div>
                <div className="mt-2 text-[12px] tracking-[0.22em] text-[#8a7a45]">
                  SECTOR 0x1987 — you fell out of the sandbox into the drive.
                </div>
                <div className="mt-1 text-[11px] tracking-[0.2em] text-[#6f6338]">
                  this is where they keep the copies. g is down here somewhere.
                </div>
                <div className="mt-3 text-[11px] tracking-[0.25em] text-[#8a7a45]">
                  CLICK TO STAND UP · WASD TO WALK · ESC TO SURFACE
                </div>
              </div>
              <button
                className="pointer-events-auto mt-3 border-2 border-[#d8c878] bg-black/60 px-5 py-2 font-term text-[12px] tracking-[0.3em] text-[#d8c878] hover:bg-[#d8c878] hover:text-black"
                onClick={handleWake}
              >
                CLIMB BACK IN
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
