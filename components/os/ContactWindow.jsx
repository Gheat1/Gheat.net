'use client';

import { useState } from 'react';
import { LINKS } from '@/lib/content';
import { useStoryPhase } from '@/lib/story';

// The "Share this site" row is the final twist: after the story scars over,
// hovering it flickers the status bar to reveal the site is now using YOU as
// bait for the next subject.
export default function ContactWindow() {
  const scarred = useStoryPhase() === 'scarred';
  const [status, setStatus] = useState('');

  const onShareEnter = () => {
    if (scarred) setStatus('[ SEND FORWARD // ACQUIRE SUBJECT 003 ]');
    else setStatus('mailto: share gheat.net');
  };
  const onShareLeave = () => setStatus('');

  return (
    <div className="flex h-full flex-col">
      <div className="bevel-field flex-1 p-4 select-text">
        <div className="mb-3 text-[13px] font-bold">Reach me</div>
        <div className="mb-4 text-[11px] leading-relaxed text-neutral-700">
          Fastest way is Discord. Everything I build ends up on GitHub sooner or
          later.
        </div>
        <div className="flex flex-col gap-2">
          <div className="tree-row">
            <span>💬</span>
            <a href={LINKS.discord} target="_blank" rel="noopener noreferrer" className="os-link">
              discord.gg/9TVm6ZFY
            </a>
          </div>
          <div className="tree-row">
            <span>🐙</span>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="os-link">
              github.com/Gheat1
            </a>
          </div>
          <div className="tree-row" onMouseOver={onShareEnter} onMouseOut={onShareLeave}>
            <span>✉️</span>
            <a
              href="mailto:?subject=you%20have%20to%20see%20this&body=gheat.net"
              className="os-link"
            >
              Share this site ↗
            </a>
          </div>
        </div>
      </div>

      {/* status bar — the lure surfaces here */}
      <div
        className={`bevel-groove px-2 py-[2px] text-[10px] ${
          scarred && status.includes('SUBJECT')
            ? 'font-term text-red-700'
            : 'text-neutral-600'
        }`}
      >
        {status || 'Ready'}
      </div>
    </div>
  );
}
