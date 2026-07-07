'use client';

import { CHEATS_TEXT, SS_PAGE_URLS, SS_SCRIPTS, SS_TUTORIALS } from '@/lib/content';

// The three shredsauce pages (scripts / cheats / tutorials) from the old
// modal, re-laid-out as a Win95 document window.

function Scripts() {
  return (
    <div className="p-3">
      <div className="mb-1 text-[13px] font-bold">Scripts / Themes</div>
      <p className="mb-3 text-[11px] text-neutral-700">
        Install tutorials in tutorials tab, must have Ublock.
      </p>
      <div className="mb-1 border-b border-neutral-400 pb-[2px] text-[11px] font-bold">
        Scripts
      </div>
      <div className="mb-3 font-term text-[11px]">
        {SS_SCRIPTS.map((s) => (
          <div key={s.name} className="tree-row">
            <span>📄</span>
            <a href={s.href} target="_blank" rel="noopener" className="os-link">
              {s.name}
            </a>
          </div>
        ))}
      </div>
      <div className="mb-2 border-b border-neutral-400 pb-[2px] text-[11px] font-bold">
        Install
      </div>
      <div className="flex flex-wrap gap-2">
        {SS_SCRIPTS.map((s) => (
          <a key={s.href} href={s.href} className="w95-btn inline-block text-[10px]">
            <span>⭳ {s.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Cheats() {
  return (
    <div className="p-3">
      <div className="mb-2 text-[13px] font-bold">Cheats List</div>
      <pre className="whitespace-pre-wrap break-words font-term text-[11px] leading-relaxed">
        {CHEATS_TEXT}
      </pre>
    </div>
  );
}

function Tutorials() {
  return (
    <div className="p-3">
      <div className="mb-2 text-[13px] font-bold">Tutorials</div>
      {SS_TUTORIALS.map((t) => (
        <div key={t.id} className="bevel-groove mb-3 p-2">
          <div className="mb-1 text-[12px] font-bold">{t.title}</div>
          <p className="mb-2 text-[11px] text-neutral-700">{t.desc}</p>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${t.id}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={t.title}
            className="aspect-video w-full border border-neutral-500"
          />
        </div>
      ))}
    </div>
  );
}

export default function Shredsauce({ page }) {
  return (
    <div className="flex h-full flex-col">
      <div className="bevel-field os-scroll flex-1 overflow-auto select-text">
        {page === 'scripts' && <Scripts />}
        {page === 'cheats' && <Cheats />}
        {page === 'tutorials' && <Tutorials />}
      </div>
      <div className="bevel-groove mt-[2px] flex items-center justify-between px-2 py-[2px] text-[10px]">
        <span>{SS_PAGE_URLS[page]}</span>
        <a
          href={SS_PAGE_URLS[page]}
          target="_blank"
          rel="noopener noreferrer"
          className="os-link"
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}
