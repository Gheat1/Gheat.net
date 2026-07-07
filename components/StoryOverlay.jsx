'use client';

import { useEffect, useRef } from 'react';
import { useStory, pullThePlug, goBackScarred } from '@/lib/story';
import { sfx } from '@/lib/sfx';

// Full-viewport DOM for the climax phases (blackout -> face -> panic ->
// "> Go back?"). Sits above the canvas. Earlier phases (subtitles, the tab
// meta-game) are handled elsewhere; this is the part that takes the whole
// screen away from you.

export default function StoryOverlay() {
  const { phase, subtitle, hostname } = useStory();

  // trigger the one-shot audio cues as phases arrive
  const spoke = useRef('');
  useEffect(() => {
    if (phase === 'blackout' && spoke.current !== 'blackout') {
      spoke.current = 'blackout';
      sfx.sparks();
      sfx.spinDown();
    }
    if (phase === 'face' && spoke.current !== 'face') {
      spoke.current = 'face';
      sfx.crushedVoice();
    }
    if (phase === 'panic' && spoke.current !== 'panic') {
      spoke.current = 'panic';
      sfx.dialup();
    }
  }, [phase]);

  if (phase === 'blackout') {
    // sparks fly (3D), THEN the room goes pitch black — the overlay fades in
    // over ~1.4s so the spark shower is visible first.
    return <div className="blackout-fade pointer-events-none fixed inset-0 z-[600]" />;
  }

  if (phase === 'face') {
    // the eyes are rendered IN the CRT (see CRTMonitor faceMode). Here we just
    // dim the room so the glowing tube is the focal point, and caption it.
    return (
      <div className="pointer-events-none fixed inset-0 z-[600]">
        <div className="absolute inset-0 bg-black/45" />
        {subtitle && (
          <div className="absolute bottom-14 w-full px-6 text-center">
            <span className="bg-black/70 px-3 py-1 font-term text-[15px] text-[#e8e8e8]">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'panic') {
    return <KernelPanic hostname={hostname} />;
  }

  return null;
}

// Simulated kernel panic: total black with a blinking prompt. Clicking
// "> Go back?" seals the scarred ending.
function KernelPanic({ hostname }) {
  return (
    <div className="fixed inset-0 z-[600] flex flex-col items-center justify-center bg-black font-term text-[#c0c0c0]">
      <div className="absolute left-4 top-4 max-w-[80ch] text-left text-[11px] leading-relaxed text-[#555]">
        <div>*** STOP: 0x00001987 (0xEVILCORP,0x{hostname},0x00000000)</div>
        <div>A fatal exception has occurred at REALITY:\\{hostname}.</div>
        <div>The current session has been terminated to protect the asset.</div>
        <div className="mt-2">the asset is you.</div>
      </div>
      <button
        className="pointer-events-auto font-term text-[18px] tracking-[0.2em] text-[#c0c0c0] hover:text-white"
        onClick={() => goBackScarred()}
      >
        &gt; Go back?<span className="boot-cursor">_</span>
      </button>
    </div>
  );
}

// exported so the 3D UNPLUG prompt can call it
export { pullThePlug };
