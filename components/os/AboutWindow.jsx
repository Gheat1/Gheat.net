'use client';

import { BIO, LINKS, TAGS } from '@/lib/content';

// The bio card from the old landing box, as a system properties dialog.
export default function AboutWindow() {
  return (
    <div className="bevel-field os-scroll h-full overflow-auto p-4 select-text">
      <div className="mb-3 flex items-center gap-3">
        <div className="bevel-up flex h-12 w-12 items-center justify-center text-[26px]">
          👾
        </div>
        <div>
          <div className="text-[16px] font-bold">gheat.net</div>
          <div className="font-term text-[10px] text-neutral-600">
            SYSTEM PROPERTIES — USER: JAEDEN
          </div>
        </div>
      </div>

      <div className="bevel-groove mb-3 p-2 text-[11.5px] leading-relaxed">{BIO}</div>

      <div className="mb-1 text-[11px] font-bold">Installed languages:</div>
      <div className="mb-3 flex flex-wrap gap-1">
        {TAGS.map((t) => (
          <span key={t} className="bevel-groove px-2 py-[1px] font-term text-[10px]">
            {t}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="w95-btn inline-block"
        >
          <span>GitHub</span>
        </a>
        <a
          href={LINKS.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="w95-btn inline-block"
        >
          <span>Discord</span>
        </a>
      </div>
    </div>
  );
}
