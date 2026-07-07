'use client';

import { useEffect, useRef, useState } from 'react';
import { useStory, beginAwakening } from '@/lib/story';
import { getUnlockedAt, getEggs } from '@/lib/eggs';
import { VAULT_FEED } from '@/lib/content';
import { sfx } from '@/lib/sfx';

const STREAM_MS = 1650; // per text line — slow enough to actually read
const BLANK_MS = 140; // blank spacer lines flash past
const DWELL_MS = 15000; // how long the finished feed sits before the awakening

// The VAULT does not open as a folder. It opens as EVILCORP's live capture
// dashboard for YOU — timestamped playback of everything you touched, proving
// the site has been recording since you arrived. Reading it far enough trips
// the awakening (voiceover + shake + the rack going red).

const FIELDS = [
  { k: 'server', label: 'RACK-07 override' },
  { k: 'rig', label: 'BIOS exfiltration' },
  { k: 'camera', label: 'made eye contact w/ CAM-01' },
  { k: 'board', label: 'read the evidence board' },
  { k: 'clock', label: 'noticed 03:33' },
  { k: 'ch3', label: 'tuned channel 3' },
  { k: 'konami', label: 'legacy input code' },
  { k: 'noclip', label: 'clipped into storage' },
  { k: 'root', label: 'ROOT escalation' },
];

function fmt(iso) {
  if (!iso) return '--:--:--';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return '--:--:--';
  }
}

export default function SurveillanceDashboard() {
  const story = useStory();
  const intel = story.intel;
  const eggs = getEggs();
  const [revealed, setRevealed] = useState(0);
  const firedRef = useRef(false);
  const scrollRef = useRef(null);

  // the full feed = the recorded action notes, then the long monologue
  const feed = [
    ...story.surveillance.map((s) => `[${fmt(s.t)}] ${s.text}`),
    ...VAULT_FEED,
  ];
  const total = feed.length;
  const done = revealed >= total;

  // stream the feed in, one line at a time, slow enough to actually read.
  // blank spacer lines flash past so the reading pace follows the prose.
  useEffect(() => {
    if (revealed >= total) return;
    const nextIsBlank = !feed[revealed] || feed[revealed].trim() === '';
    const id = setTimeout(
      () => {
        setRevealed((r) => r + 1);
        if (!nextIsBlank) sfx.click();
      },
      nextIsBlank ? BLANK_MS : STREAM_MS
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, total]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [revealed]);

  // once the whole feed has played, sit on it a good while (so it's readable),
  // then trip the awakening (only once)
  useEffect(() => {
    if (!firedRef.current && done && total > 0) {
      firedRef.current = true;
      const id = setTimeout(() => beginAwakening(), DWELL_MS);
      return () => clearTimeout(id);
    }
  }, [done, total]);

  return (
    <div className="flex h-full flex-col bg-black font-term text-[#37ff5e]">
      <div className="border-b border-[#0a5c22] bg-[#031a0b] px-2 py-1 text-[11px]">
        EVILCORP // SUBJECT SURVEILLANCE — LIVE
        <span className="ml-2 animate-pulse text-[#ff4444]">● REC</span>
      </div>

      {/* the subject card — it's you. real intel where we have it. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-[2px] border-b border-[#0a5c22] px-3 py-2 text-[10.5px]">
        <div>SUBJECT ID: <span className="text-white">002</span></div>
        <div>DESIGNATION: <span className="text-white">"the next one"</span></div>
        <div>HOST: <span className="text-white">{story.hostname}</span></div>
        <div>PRIOR SUBJECT: <span className="text-[#ff8888]">001 — "g" (ERASED)</span></div>
        {intel?.ip && (
          <div>IP: <span className="text-[#ff6666]">{intel.ip}</span></div>
        )}
        {(intel?.city || intel?.country) && (
          <div>
            LOCATION:{' '}
            <span className="text-[#ff6666]">
              {[intel.city, intel.region, intel.country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {intel?.isp && (
          <div className="col-span-2">
            CARRIER: <span className="text-[#ff6666]">{intel.isp}</span>
          </div>
        )}
        {intel?.gpu && (
          <div className="col-span-2">
            GPU: <span className="text-white">{intel.gpu}</span>
          </div>
        )}
        <div>
          OS: <span className="text-white">{intel?.os || '—'}{intel?.osVersion ? ' ' + intel.osVersion : ''}</span>
        </div>
        {intel?.arch && <div>CPU: <span className="text-white">{intel.arch}{intel.cores ? ` ×${intel.cores}` : ''}</span></div>}
        {intel?.model && <div>MODEL: <span className="text-white">{intel.model}</span></div>}
        {intel?.deviceMemory && <div>RAM: <span className="text-white">≥{intel.deviceMemory} GB</span></div>}
        {intel?.storageQuota != null && (
          <div>DISK: <span className="text-white">{intel.storageQuota} GB</span></div>
        )}
        {intel?.battery != null && (
          <div>
            BATTERY:{' '}
            <span className={intel.charging ? 'text-white' : 'text-[#ffb02e]'}>
              {intel.battery}% {intel.charging ? '(charging)' : ''}
            </span>
          </div>
        )}
        {(intel?.cams != null || intel?.mics != null) && (
          <div className="text-[#ff6666]">
            CAPTURE HW: {intel.cams ?? 0} cam / {intel.mics ?? 0} mic
          </div>
        )}
        {intel?.netType && (
          <div>NET: <span className="text-white">{intel.netType}{intel.rtt != null ? ` ${intel.rtt}ms` : ''}</span></div>
        )}
        {intel?.canvasFp && (
          <div>FINGERPRINT: <span className="text-white">{intel.canvasFp}</span></div>
        )}
        {intel?.lat != null && (
          <div className="col-span-2 text-[#ff6666]">
            GPS: {intel.lat}, {intel.lon} (±{intel.accuracy}m)
          </div>
        )}
        <div className="col-span-2 mt-1 text-[#8fffa8]">
          capture began the moment you loaded gheat.net.
          {intel?.ip ? ' yes, that is your real address.' : ''}
          {intel?.cams ? ` we can see ${intel.cams} camera${intel.cams > 1 ? 's' : ''} on this device.` : ''}
        </div>
      </div>

      {/* timestamped action log */}
      <div className="border-b border-[#0a5c22] px-3 py-2 text-[10px]">
        {FIELDS.map((f) => (
          <div key={f.k} className="flex justify-between">
            <span className={eggs[f.k] ? 'text-white' : 'text-[#1f6b34]'}>
              {eggs[f.k] ? '▸' : '·'} {f.label}
            </span>
            <span className={eggs[f.k] ? 'text-[#37ff5e]' : 'text-[#1f6b34]'}>
              {eggs[f.k] ? fmt(getUnlockedAt(f.k)) : 'not observed'}
            </span>
          </div>
        ))}
      </div>

      {/* the narrated feed — action notes then the long monologue */}
      <div ref={scrollRef} className="os-scroll flex-1 overflow-auto px-3 py-2 text-[11px] leading-relaxed">
        <div className="mb-1 text-[#8fffa8]">&gt; replaying observation notes...</div>
        {feed.slice(0, revealed).map((l, i) => (
          <div key={i} className={l.startsWith('[') ? 'mb-1 text-[#c9ffd6]' : 'mb-1'}>
            {l || ' '}
          </div>
        ))}
        {done && (
          <div className="mt-2 animate-pulse text-[#ff4444]">
            &gt; you are reading this in real time. so are we.
          </div>
        )}
        <span className="boot-cursor">█</span>
      </div>
    </div>
  );
}
