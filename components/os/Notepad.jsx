'use client';

// Read-only Notepad clone — used for secret .txt easter-egg files.
export default function Notepad({ text }) {
  return (
    <div className="bevel-field os-scroll h-full overflow-auto bg-white p-2 select-text">
      <pre className="whitespace-pre-wrap break-words font-term text-[12px] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
