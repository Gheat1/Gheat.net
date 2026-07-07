'use client';

import { useEffect, useState } from 'react';
import { applyConsent, hasConsented } from '@/lib/story';

// Shown once, before the experience. Offers the "enhanced" mode (deep device
// read) with an honest, expandable privacy statement. The click also serves as
// the user gesture that unlocks WebAudio. Choice is remembered until Restart.

export default function ConsentModal({ onDone }) {
  const [open, setOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [wantLocation, setWantLocation] = useState(true);

  useEffect(() => {
    // only prompt if a choice hasn't been made this "install"
    if (!hasConsented()) setOpen(true);
    else onDone?.();
  }, [onDone]);

  if (!open) return null;

  const choose = (granted) => {
    applyConsent(granted, granted && wantLocation);
    setOpen(false);
    onDone?.();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/92 p-4">
      <div className="w-full max-w-[440px] border border-[#2a6b3a] bg-[#050805] font-term text-[#8fffa8] shadow-[0_0_60px_rgba(0,255,80,0.12)]">
        <div className="flex items-center justify-between border-b border-[#164a25] px-3 py-2 text-[11px] tracking-[0.2em]">
          <span>GHEAT-OS // SYSTEM ACCESS</span>
          <span className="animate-pulse text-[#37ff5e]">● online</span>
        </div>

        <div className="px-4 py-4 text-[12px] leading-relaxed">
          <p className="mb-3 text-[#d8ffe4]">
            This is an interactive horror experience. It plays better if it can
            read your device — the &ldquo;surveillance&rdquo; is meant to feel real.
          </p>
          <p className="mb-3 text-[#5fbf77]">
            Enhanced mode reads: browser &amp; OS build, CPU architecture, RAM,
            battery, disk size, screen, GPU, network type, and attached
            cameras/mics — plus your public IP &amp; city (already used for the
            basic mode).
          </p>

          <label className="mb-3 flex items-center gap-2 text-[#8fffa8]">
            <input
              type="checkbox"
              checked={wantLocation}
              onChange={(e) => setWantLocation(e.target.checked)}
            />
            also allow <span className="text-[#ff6666]">precise location</span> (optional — your browser will ask)
          </label>

          <button
            className="mb-3 text-[11px] text-[#5fbf77] underline"
            onClick={() => setShowPrivacy((s) => !s)}
          >
            {showPrivacy ? '▾ hide' : '▸ read'} the privacy statement
          </button>

          {showPrivacy && (
            <div className="mb-3 max-h-[150px] overflow-auto border border-[#164a25] bg-black/60 p-3 text-[10.5px] leading-relaxed text-[#7fd894]">
              <p className="mb-2">
                <strong className="text-[#d8ffe4]">What&apos;s read:</strong> the
                device/browser signals listed above, via standard web APIs.
              </p>
              <p className="mb-2">
                <strong className="text-[#d8ffe4]">Where it goes:</strong>{' '}
                nowhere. Everything is processed <em>in your browser</em> to
                render the story on-screen. Nothing is sent to a gheat.net
                server — there isn&apos;t one collecting it.
              </p>
              <p className="mb-2">
                <strong className="text-[#d8ffe4]">One exception:</strong> to show
                your IP/city, your browser makes a request to a third-party
                geo-IP service (ipwho.is), which necessarily sees your IP — the
                same as visiting any website.
              </p>
              <p className="mb-2">
                <strong className="text-[#d8ffe4]">Storage:</strong> only your
                progress (easter eggs, story state, a random local id) is kept in
                this browser&apos;s localStorage. Clear it any time with{' '}
                <span className="text-[#8fffa8]">Start → Restart</span>.
              </p>
              <p>
                <strong className="text-[#d8ffe4]">Decline</strong> and everything
                still works — the surveillance beat just uses less about you.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className="flex-1 border border-[#37ff5e] bg-[#0c2a14] px-4 py-2 text-[12px] tracking-[0.15em] text-[#37ff5e] hover:bg-[#37ff5e] hover:text-black"
              onClick={() => choose(true)}
            >
              ENABLE ENHANCED
            </button>
            <button
              className="flex-1 border border-[#2a6b3a] px-4 py-2 text-[12px] tracking-[0.15em] text-[#5fbf77] hover:bg-[#0c2a14]"
              onClick={() => choose(false)}
            >
              CONTINUE BASIC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
