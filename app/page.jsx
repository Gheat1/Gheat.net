'use client';

import dynamic from 'next/dynamic';

// The whole experience is client-only: WebGL, pointer parallax, canvas
// textures and window management all need the browser.
const Experience = dynamic(() => import('@/components/Experience'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <span className="font-term text-xs tracking-[0.3em] text-neutral-500">
        TUNING SIGNAL...
      </span>
    </div>
  ),
});

export default function Page() {
  return <Experience />;
}
