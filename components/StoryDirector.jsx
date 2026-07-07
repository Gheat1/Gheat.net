'use client';

import { useEffect, useRef } from 'react';
import { onUnlock } from '@/lib/eggs';
import {
  initStory,
  ensureScarChrome,
  flickerTitle,
  recordSurveillance,
  useStory as useStoryFull,
  useStoryPhase,
} from '@/lib/story';
import { sfx } from '@/lib/sfx';

// Headless controller: boots the story, runs the browser-tab meta-game on
// each anomaly, records surveillance notes, and manages the awakening
// voiceover (panicked breathing) tied to phase. Renders the live subtitle.

const FLICKERS = {
  server: 'logging_session...',
  rig: '[reading BIOS]',
  clock: '[03:33]',
  ch3: '[Signal Locked]',
  konami: 'legacy_input_ok',
  root: 'ACCESS ELEVATED',
  noclip: 'SECTOR NOT INDEXED',
  camera: '[ REC ● ]',
  board: '[evidence logged]',
  vault: 'OPENING FEED...',
};

export default function StoryDirector({ subtitle }) {
  const phase = useStoryPhase();
  const breathRef = useRef(null);

  useEffect(() => {
    initStory();
    // re-assert scar chrome shortly after mount, in case Next's <head>
    // metadata sets the title after initStory ran
    const id = setTimeout(() => ensureScarChrome(), 400);
    return () => clearTimeout(id);
  }, []);

  // keep the contaminated title/favicon pinned once scarred
  useEffect(() => {
    if (phase === 'scarred') ensureScarChrome();
  }, [phase]);

  // every fresh anomaly: flicker the tab + record it to the feed
  useEffect(() => {
    return onUnlock((key) => {
      if (FLICKERS[key]) flickerTitle(FLICKERS[key], 950);
      recordSurveillance(key);
    });
  }, []);

  // panicked breathing under the awakening/hijack/unplug phases
  useEffect(() => {
    const wantBreath = phase === 'awaken' || phase === 'hijack' || phase === 'unplug';
    if (wantBreath && !breathRef.current) {
      breathRef.current = sfx.startBreathing();
    } else if (!wantBreath && breathRef.current) {
      breathRef.current();
      breathRef.current = null;
    }
    return () => {
      if (phase === 'scarred' || phase === 'browsing') {
        breathRef.current?.();
        breathRef.current = null;
      }
    };
  }, [phase]);

  return (
    <>
      {/* awaken/hijack subtitle (face-phase subtitle lives in StoryOverlay) */}
      {subtitle && (phase === 'awaken' || phase === 'hijack') && (
        <div className="pointer-events-none fixed bottom-14 left-0 z-[70] w-full px-6 text-center">
          <span className="bg-black/70 px-3 py-1 font-term text-[14px] tracking-wide text-[#d8d8d8]">
            {subtitle}
          </span>
        </div>
      )}

      {/* Phase 4: the terminal is hijacked and a message is typed remotely.
          Shown as a full-screen intrusion so it lands even if the OS terminal
          window happens to be closed. */}
      {phase === 'hijack' && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-[75] flex justify-center px-6">
          <div className="max-w-[80%] border-l-4 border-[#ff3030] bg-black/85 px-5 py-3 font-term text-[15px] text-[#ff5050] shadow-[0_0_40px_rgba(255,0,0,0.3)]">
            <RemoteLine />
          </div>
        </div>
      )}

      {/* Phase 5 pre-beat: the NUT/UPS power-failure broadcast — g fighting for
          the power, EVILCORP overriding. */}
      {phase === 'unplug' && <NutBroadcast />}
    </>
  );
}

// NUT daemon broadcast: g tries to kill power to save you, EVILCORP overrides.
function NutBroadcast() {
  const { nutLines } = useStoryFull();
  if (!nutLines?.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[22%] z-[75] flex justify-center px-6">
      <div className="max-w-[92%] bg-black/85 px-5 py-3 font-term text-[12px] leading-relaxed shadow-[0_0_40px_rgba(255,0,0,0.25)]">
        {nutLines.map((l, i) => (
          <div
            key={i}
            className={
              l.t === 'root'
                ? 'text-[#ff4040]'
                : l.t === 'g@sandbox'
                  ? 'text-[#37ff5e]'
                  : 'text-[#c9c9c9]'
            }
          >
            {l.text}
          </div>
        ))}
        <span className="boot-cursor text-[#ff4040]">█</span>
      </div>
    </div>
  );
}

// the remote message, subscribed live from the story store
function RemoteLine() {
  // pull the freshest remoteLine straight from the store snapshot
  const { remoteLine } = useStoryFull();
  return (
    <span>
      {remoteLine}
      <span className="boot-cursor">█</span>
    </span>
  );
}
